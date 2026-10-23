// ======================================================
// NEARBY POLICE STATIONS CONTROLLER
// TRINETRAAI
//
// FINAL STABLE VERSION
//
// MAIN RULE:
// 1. MongoDB saved nearby stations FIRST
// 2. Overpass is only used to populate/refresh database
// 3. Overpass failure NEVER removes saved stations
// 4. Registered + unregistered stations both returned
// 5. Registered TRINETRAAI details merged automatically
// ======================================================


import {
    PoliceStation
}
from "../models/policeStationModel.js";


import {
    NearbyPoliceStation
}
from "../models/nearbyPoliceStationModel.js";


// ======================================================
// SETTINGS
// ======================================================

const SEARCH_RADIUS_METERS =
    15000;

const SEARCH_RADIUS_KM =
    SEARCH_RADIUS_METERS / 1000;


// Give Overpass enough time only when database is empty.
const OVERPASS_TIMEOUT_MS =
    10000;


// Database data can be refreshed after 24 hours.
// IMPORTANT:
// Old database data is STILL USED if refresh fails.
const DATABASE_REFRESH_MS =
    24 * 60 * 60 * 1000;


// Prevent duplicate Overpass requests.
const activeSearches =
    new Map();


// ======================================================
// CALCULATE DISTANCE
// HAVERSINE FORMULA
// ======================================================

function calculateDistance(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const radius =
        6371;

    const dLat =
        (
            lat2 -
            lat1
        ) *
        Math.PI /
        180;

    const dLon =
        (
            lon2 -
            lon1
        ) *
        Math.PI /
        180;

    const value =

        Math.sin(
            dLat / 2
        ) ** 2

        +

        Math.cos(
            lat1 *
            Math.PI /
            180
        )

        *

        Math.cos(
            lat2 *
            Math.PI /
            180
        )

        *

        Math.sin(
            dLon / 2
        ) ** 2;


    const angle =

        2 *

        Math.atan2(

            Math.sqrt(
                value
            ),

            Math.sqrt(
                1 - value
            )
        );


    return (
        radius *
        angle
    );
}


// ======================================================
// NORMALIZE STATION NAME
// ======================================================

function normalizeStationName(
    name = ""
) {

    return String(
        name
    )
        .toLowerCase()

        .replace(
            /police station/g,
            ""
        )

        .replace(
            /police chowki/g,
            ""
        )

        .replace(
            /police chowky/g,
            ""
        )

        .replace(
            /[^a-z0-9]/g,
            ""
        )

        .trim();
}


// ======================================================
// GET REGISTERED TRINETRAAI STATIONS
// ======================================================

async function getRegisteredStations() {

    try {

        const stations =
            await PoliceStation
                .find({
                    active: true
                })
                .select(
                    "-password"
                )
                .lean();


        return stations || [];
    }

    catch (error) {

        console.log(
            "Registered police station fetch error:",
            error.message
        );

        return [];
    }
}


// ======================================================
// FIND MATCHING REGISTERED STATION
// ======================================================

function findRegisteredStation(
    station,
    registeredStations
) {

    const stationName =
        normalizeStationName(
            station.name
        );


    return registeredStations.find(

        function (
            registered
        ) {

            // ------------------------------------------
            // MATCH EXTERNAL / OSM ID
            // ------------------------------------------

            if (
                registered.externalPlaceId &&
                station.osmId &&
                String(
                    registered.externalPlaceId
                ) ===
                String(
                    station.osmId
                )
            ) {

                return true;
            }


            // ------------------------------------------
            // MATCH NAME
            // ------------------------------------------

            const registeredName =
                normalizeStationName(
                    registered.name
                );


            if (
                stationName &&
                registeredName &&
                (
                    stationName ===
                    registeredName ||

                    stationName.includes(
                        registeredName
                    ) ||

                    registeredName.includes(
                        stationName
                    )
                )
            ) {

                return true;
            }


            // ------------------------------------------
            // MATCH LOCATION WITHIN 300 METERS
            // ------------------------------------------

            const registeredLatitude =
                Number(
                    registered.latitude
                );

            const registeredLongitude =
                Number(
                    registered.longitude
                );


            const stationLatitude =
                Number(
                    station.latitude
                );

            const stationLongitude =
                Number(
                    station.longitude
                );


            if (
                Number.isFinite(
                    registeredLatitude
                ) &&
                Number.isFinite(
                    registeredLongitude
                ) &&
                Number.isFinite(
                    stationLatitude
                ) &&
                Number.isFinite(
                    stationLongitude
                )
            ) {

                const distance =
                    calculateDistance(

                        stationLatitude,

                        stationLongitude,

                        registeredLatitude,

                        registeredLongitude
                    );


                if (
                    distance <=
                    0.30
                ) {

                    return true;
                }
            }


            return false;
        }
    );
}


// ======================================================
// PREPARE STATIONS FOR FRONTEND
// ======================================================

function prepareStationsForFrontend(
    stations,
    registeredStations,
    wearerLatitude,
    wearerLongitude
) {

    let preparedStations =
        stations

            .map(
                function (
                    station
                ) {

                    const stationLatitude =
                        Number(
                            station.latitude
                        );

                    const stationLongitude =
                        Number(
                            station.longitude
                        );


                    if (
                        !Number.isFinite(
                            stationLatitude
                        ) ||
                        !Number.isFinite(
                            stationLongitude
                        )
                    ) {

                        return null;
                    }


                    const distanceKm =
                        calculateDistance(

                            wearerLatitude,

                            wearerLongitude,

                            stationLatitude,

                            stationLongitude
                        );


                    if (
                        distanceKm >
                        SEARCH_RADIUS_KM
                    ) {

                        return null;
                    }


                    const registeredStation =
                        findRegisteredStation(

                            station,

                            registeredStations
                        );


                    return {

                        osmId:
                            station.osmId
                                ? String(
                                    station.osmId
                                )
                                : null,

                        externalPlaceId:
                            station.osmId
                                ? String(
                                    station.osmId
                                )
                                : null,

                        name:

                            registeredStation
                                ?.name ||

                            station.name ||

                            "Police Station",

                        address:

                            registeredStation
                                ?.address ||

                            station.address ||

                            "Address not available",

                        phone:

                            registeredStation
                                ?.phone ||

                            station.phone ||

                            "",

                        latitude:
                            stationLatitude,

                        longitude:
                            stationLongitude,

                        distanceKm,

                        registered:
                            Boolean(
                                registeredStation
                            ),

                        stationId:

                            registeredStation
                                ?.stationId ||

                            null,

                        registeredStationId:

                            registeredStation
                                ?._id ||

                            null,

                        source:

                            station.source ||
                            "OpenStreetMap"
                    };
                }
            )

            .filter(
                Boolean
            );


    // ==================================================
    // ADD REGISTERED STATIONS NOT FOUND IN OSM DATA
    // ==================================================

    registeredStations.forEach(

        function (
            registered
        ) {

            const latitude =
                Number(
                    registered.latitude
                );

            const longitude =
                Number(
                    registered.longitude
                );


            if (
                !Number.isFinite(
                    latitude
                ) ||
                !Number.isFinite(
                    longitude
                )
            ) {

                return;
            }


            const distanceKm =
                calculateDistance(

                    wearerLatitude,

                    wearerLongitude,

                    latitude,

                    longitude
                );


            if (
                distanceKm >
                SEARCH_RADIUS_KM
            ) {

                return;
            }


            const alreadyExists =
                preparedStations.some(

                    function (
                        station
                    ) {

                        if (
                            station.stationId &&
                            station.stationId ===
                            registered.stationId
                        ) {

                            return true;
                        }


                        const distance =
                            calculateDistance(

                                station.latitude,

                                station.longitude,

                                latitude,

                                longitude
                            );


                        return (
                            distance <=
                            0.30
                        );
                    }
                );


            if (
                alreadyExists
            ) {

                return;
            }


            preparedStations.push({

                osmId:

                    registered.externalPlaceId ||
                    null,

                externalPlaceId:

                    registered.externalPlaceId ||
                    null,

                name:

                    registered.name ||
                    "Police Station",

                address:

                    registered.address ||
                    "Address not available",

                phone:

                    registered.phone ||
                    "",

                latitude,

                longitude,

                distanceKm,

                registered:
                    true,

                stationId:

                    registered.stationId ||
                    null,

                registeredStationId:

                    registered._id ||
                    null,

                source:
                    "TRINETRAAI"
            });
        }
    );


    // ==================================================
    // REMOVE DUPLICATES
    // ==================================================

    const uniqueStations =
        new Map();


    preparedStations.forEach(

        function (
            station
        ) {

            const key =

                normalizeStationName(
                    station.name
                )

                +

                "_"

                +

                Number(
                    station.latitude
                ).toFixed(4)

                +

                "_"

                +

                Number(
                    station.longitude
                ).toFixed(4);


            if (
                !uniqueStations.has(
                    key
                )
            ) {

                uniqueStations.set(
                    key,
                    station
                );
            }
        }
    );


    preparedStations =
        Array.from(
            uniqueStations.values()
        );


    // ==================================================
    // NEAREST FIRST
    // ==================================================

    preparedStations.sort(

        function (
            a,
            b
        ) {

            return (
                a.distanceKm -
                b.distanceKm
            );
        }
    );


    // ==================================================
    // RECOMMENDED = NEAREST
    // ==================================================

    preparedStations =
        preparedStations.map(

            function (
                station,
                index
            ) {

                return {

                    ...station,

                    recommended:
                        index === 0
                };
            }
        );


    return preparedStations;
}


// ======================================================
// GET SAVED NEARBY STATIONS FROM MONGODB
// ======================================================

async function getSavedNearbyStations(
    wearerLatitude,
    wearerLongitude
) {

    try {

        const savedStations =
            await NearbyPoliceStation
                .find({})
                .lean();


        if (
            !Array.isArray(
                savedStations
            )
        ) {

            return [];
        }


        const nearbyStations =
            savedStations.filter(

                function (
                    station
                ) {

                    const latitude =
                        Number(
                            station.latitude
                        );

                    const longitude =
                        Number(
                            station.longitude
                        );


                    if (
                        !Number.isFinite(
                            latitude
                        ) ||
                        !Number.isFinite(
                            longitude
                        )
                    ) {

                        return false;
                    }


                    const distanceKm =
                        calculateDistance(

                            wearerLatitude,

                            wearerLongitude,

                            latitude,

                            longitude
                        );


                    return (
                        distanceKm <=
                        SEARCH_RADIUS_KM
                    );
                }
            );


        return nearbyStations;
    }

    catch (error) {

        console.log(
            "Saved nearby police station fetch error:",
            error.message
        );

        return [];
    }
}


// ======================================================
// CHECK DATABASE AGE
// ======================================================

function isDatabaseCacheFresh(
    stations
) {

    if (
        !Array.isArray(
            stations
        ) ||
        stations.length === 0
    ) {

        return false;
    }


    let newestTime =
        0;


    stations.forEach(

        function (
            station
        ) {

            const dateValue =

                station.lastUpdated ||

                station.updatedAt ||

                station.createdAt;


            if (
                !dateValue
            ) {

                return;
            }


            const time =
                new Date(
                    dateValue
                ).getTime();


            if (
                Number.isFinite(
                    time
                ) &&
                time >
                newestTime
            ) {

                newestTime =
                    time;
            }
        }
    );


    if (
        newestTime === 0
    ) {

        return false;
    }


    return (
        Date.now() -
        newestTime <
        DATABASE_REFRESH_MS
    );
}


// ======================================================
// SAVE OSM STATIONS PERMANENTLY TO MONGODB
// ======================================================

async function saveStationsToDatabase(
    stations
) {

    if (
        !Array.isArray(
            stations
        ) ||
        stations.length === 0
    ) {

        return;
    }


    try {

        const operations =
            stations

                .filter(
                    function (
                        station
                    ) {

                        return (
                            station.osmId &&
                            Number.isFinite(
                                Number(
                                    station.latitude
                                )
                            ) &&
                            Number.isFinite(
                                Number(
                                    station.longitude
                                )
                            )
                        );
                    }
                )

                .map(
                    function (
                        station
                    ) {

                        return {

                            updateOne: {

                                filter: {

                                    osmId:
                                        String(
                                            station.osmId
                                        )
                                },

                                update: {

                                    $set: {

                                        osmId:
                                            String(
                                                station.osmId
                                            ),

                                        name:

                                            station.name ||
                                            "Police Station",

                                        address:

                                            station.address ||
                                            "",

                                        phone:

                                            station.phone ||
                                            "",

                                        latitude:

                                            Number(
                                                station.latitude
                                            ),

                                        longitude:

                                            Number(
                                                station.longitude
                                            ),

                                        source:

                                            "OpenStreetMap",

                                        lastUpdated:

                                            new Date()
                                    }
                                },

                                upsert:
                                    true
                            }
                        };
                    }
                );


        if (
            operations.length === 0
        ) {

            return;
        }


        const result =
            await NearbyPoliceStation
                .bulkWrite(

                    operations,

                    {
                        ordered:
                            false
                    }
                );


        console.log(
            "Nearby police stations saved to MongoDB:",
            operations.length
        );


        return result;
    }

    catch (error) {

        console.log(
            "Nearby police MongoDB save error:",
            error.message
        );
    }
}


// ======================================================
// BUILD OVERPASS QUERY
// ======================================================

function buildOverpassQuery(
    latitude,
    longitude
) {

    return `

        [out:json][timeout:20];

        (

            node
                ["amenity"="police"]
                (around:${SEARCH_RADIUS_METERS},${latitude},${longitude});

            way
                ["amenity"="police"]
                (around:${SEARCH_RADIUS_METERS},${latitude},${longitude});

            relation
                ["amenity"="police"]
                (around:${SEARCH_RADIUS_METERS},${latitude},${longitude});

        );

        out center tags;

    `;
}


// ======================================================
// FETCH ONE OVERPASS SERVER
// ======================================================

async function fetchOverpassServer(
    server,
    query
) {

    const controller =
        new AbortController();


    const timeout =
        setTimeout(

            function () {

                controller.abort();
            },

            OVERPASS_TIMEOUT_MS
        );


    try {

        console.log(
            "Trying Overpass:",
            server
        );


        const requestUrl =

            server +

            "?data=" +

            encodeURIComponent(
                query
            );


        const response =
            await fetch(

                requestUrl,

                {
                    method:
                        "GET",

                    headers: {

                        "Accept":
                            "application/json",

                        "User-Agent":
                            "TRINETRAAI-Student-Project/1.0"
                    },

                    signal:
                        controller.signal
                }
            );


        if (
            !response.ok
        ) {

            throw new Error(
                `HTTP ${response.status}`
            );
        }


        const data =
            await response.json();


        if (
            !data ||
            !Array.isArray(
                data.elements
            )
        ) {

            throw new Error(
                "Invalid Overpass response"
            );
        }


        console.log(
            "Overpass success:",
            server,
            "Stations found:",
            data.elements.length
        );


        return data;
    }

    finally {

        clearTimeout(
            timeout
        );
    }
}


// ======================================================
// SEARCH OVERPASS SERVERS
// ======================================================

async function searchOverpass(
    latitude,
    longitude
) {

    const query =
        buildOverpassQuery(
            latitude,
            longitude
        );


    const overpassServers = [

        "https://overpass-api.de/api/interpreter",

        "https://overpass.kumi.systems/api/interpreter",

        "https://overpass.private.coffee/api/interpreter"
    ];


    const requests =
        overpassServers.map(

            function (
                server
            ) {

                return fetchOverpassServer(
                    server,
                    query
                )

                    .catch(

                        function (
                            error
                        ) {

                            console.log(
                                "Overpass error:",
                                server,
                                error.message
                            );


                            throw error;
                        }
                    );
            }
        );


    try {

        return await Promise.any(
            requests
        );
    }

    catch (error) {

        console.log(
            "All Overpass servers unavailable."
        );

        return null;
    }
}


// ======================================================
// CONVERT RAW OSM RESPONSE
// ======================================================

function convertOsmData(
    osmData
) {

    const elements =
        osmData?.elements ||
        [];


    const stations =
        elements

            .map(

                function (
                    item
                ) {

                    const latitude =
                        Number(

                            item.lat ??

                            item.center?.lat
                        );


                    const longitude =
                        Number(

                            item.lon ??

                            item.center?.lon
                        );


                    if (
                        !Number.isFinite(
                            latitude
                        ) ||
                        !Number.isFinite(
                            longitude
                        )
                    ) {

                        return null;
                    }


                    const tags =
                        item.tags ||
                        {};


                    const name =

                        tags.name ||

                        tags["name:en"] ||

                        "Police Station";


                    const addressParts = [

                        tags[
                            "addr:housenumber"
                        ],

                        tags[
                            "addr:street"
                        ],

                        tags[
                            "addr:suburb"
                        ],

                        tags[
                            "addr:city"
                        ]

                    ].filter(
                        Boolean
                    );


                    const address =

                        addressParts.length >
                        0

                            ? addressParts.join(
                                ", "
                            )

                            : tags[
                                "addr:full"
                            ] ||

                            "Address not available";


                    const phone =

                        tags.phone ||

                        tags[
                            "contact:phone"
                        ] ||

                        "";


                    // Include element type so node/way/relation
                    // IDs can never collide in MongoDB.
                    const osmId =

                        String(
                            item.type ||
                            "osm"
                        )

                        +

                        "_"

                        +

                        String(
                            item.id
                        );


                    return {

                        osmId,

                        name,

                        address,

                        phone,

                        latitude,

                        longitude,

                        source:
                            "OpenStreetMap"
                    };
                }
            )

            .filter(
                Boolean
            );


    // ==================================================
    // REMOVE DUPLICATES
    // ==================================================

    const uniqueStations =
        new Map();


    stations.forEach(

        function (
            station
        ) {

            const key =

                normalizeStationName(
                    station.name
                )

                +

                "_"

                +

                station.latitude
                    .toFixed(4)

                +

                "_"

                +

                station.longitude
                    .toFixed(4);


            if (
                !uniqueStations.has(
                    key
                )
            ) {

                uniqueStations.set(
                    key,
                    station
                );
            }
        }
    );


    return Array.from(
        uniqueStations.values()
    );
}


// ======================================================
// CREATE REGISTERED FALLBACK
// ======================================================

function createRegisteredFallback(
    registeredStations,
    wearerLatitude,
    wearerLongitude
) {

    const stations =
        registeredStations

            .map(

                function (
                    station
                ) {

                    const latitude =
                        Number(
                            station.latitude
                        );

                    const longitude =
                        Number(
                            station.longitude
                        );


                    if (
                        !Number.isFinite(
                            latitude
                        ) ||
                        !Number.isFinite(
                            longitude
                        )
                    ) {

                        return null;
                    }


                    const distanceKm =
                        calculateDistance(

                            wearerLatitude,

                            wearerLongitude,

                            latitude,

                            longitude
                        );


                    if (
                        distanceKm >
                        SEARCH_RADIUS_KM
                    ) {

                        return null;
                    }


                    return {

                        osmId:

                            station.externalPlaceId ||
                            null,

                        externalPlaceId:

                            station.externalPlaceId ||
                            null,

                        name:

                            station.name ||
                            "Police Station",

                        address:

                            station.address ||
                            "Address not available",

                        phone:

                            station.phone ||
                            "",

                        latitude,

                        longitude,

                        distanceKm,

                        registered:
                            true,

                        stationId:

                            station.stationId ||
                            null,

                        registeredStationId:

                            station._id ||
                            null,

                        source:
                            "TRINETRAAI"
                    };
                }
            )

            .filter(
                Boolean
            );


    stations.sort(

        function (
            a,
            b
        ) {

            return (
                a.distanceKm -
                b.distanceKm
            );
        }
    );


    return stations.map(

        function (
            station,
            index
        ) {

            return {

                ...station,

                recommended:
                    index === 0
            };
        }
    );
}


// ======================================================
// LOAD FRESH OSM STATIONS AND SAVE TO DATABASE
// ======================================================

async function loadFreshStations(
    latitude,
    longitude
) {

    const searchKey =

        Number(
            latitude
        ).toFixed(3)

        +

        "_"

        +

        Number(
            longitude
        ).toFixed(3);


    // ==================================================
    // PREVENT DUPLICATE SEARCH
    // ==================================================

    if (
        activeSearches.has(
            searchKey
        )
    ) {

        console.log(
            "Reusing active nearby police search."
        );


        return activeSearches.get(
            searchKey
        );
    }


    const searchPromise =
        (
            async function () {

                try {

                    const osmData =
                        await searchOverpass(
                            latitude,
                            longitude
                        );


                    if (
                        !osmData
                    ) {

                        return [];
                    }


                    const stations =
                        convertOsmData(
                            osmData
                        );


                    if (
                        stations.length >
                        0
                    ) {

                        await saveStationsToDatabase(
                            stations
                        );
                    }


                    return stations;
                }

                finally {

                    activeSearches.delete(
                        searchKey
                    );
                }
            }
        )();


    activeSearches.set(
        searchKey,
        searchPromise
    );


    return searchPromise;
}


// ======================================================
// BACKGROUND REFRESH
// ======================================================

function refreshStationsInBackground(
    latitude,
    longitude
) {

    loadFreshStations(
        latitude,
        longitude
    )

        .then(

            function (
                stations
            ) {

                if (
                    stations.length >
                    0
                ) {

                    console.log(
                        "Background nearby police refresh completed:",
                        stations.length
                    );
                }
            }
        )

        .catch(

            function (
                error
            ) {

                console.log(
                    "Background nearby police refresh error:",
                    error.message
                );
            }
        );
}


// ======================================================
// GET NEARBY POLICE STATIONS
// ======================================================

export const getNearbyPoliceStations =
    async (
        req,
        res
    ) => {

        try {

            // ==================================================
            // CURRENT WEARER LOCATION
            // ==================================================

            const latitude =
                Number(
                    req.query.latitude
                );


            const longitude =
                Number(
                    req.query.longitude
                );


            // ==================================================
            // VALIDATE
            // ==================================================

            if (
                !Number.isFinite(
                    latitude
                ) ||
                !Number.isFinite(
                    longitude
                )
            ) {

                return res
                    .status(400)
                    .json({

                        success:
                            false,

                        message:
                            "Valid latitude and longitude are required."
                    });
            }


            if (
                latitude < -90 ||
                latitude > 90 ||
                longitude < -180 ||
                longitude > 180
            ) {

                return res
                    .status(400)
                    .json({

                        success:
                            false,

                        message:
                            "Latitude or longitude is outside the valid range."
                    });
            }


            console.log(
                "Nearby police search location:",
                latitude,
                longitude
            );


            // ==================================================
            // REGISTERED STATIONS
            // ==================================================

            const registered =
                await getRegisteredStations();


            console.log(
                "Registered TRINETRAAI police stations:",
                registered.length
            );


            // ==================================================
            // STEP 1:
            // ALWAYS CHECK MONGODB FIRST
            // ==================================================

            let savedStations =
                await getSavedNearbyStations(
                    latitude,
                    longitude
                );


            console.log(
                "Saved nearby police stations:",
                savedStations.length
            );


            // ==================================================
            // DATABASE HAS STATIONS
            //
            // RETURN THEM IMMEDIATELY.
            // FRONTEND NEVER WAITS FOR OVERPASS.
            // ==================================================

            if (
                savedStations.length >
                0
            ) {

                const stations =
                    prepareStationsForFrontend(

                        savedStations,

                        registered,

                        latitude,

                        longitude
                    );


                // Only refresh in background if old.
                // Even if this refresh fails, current DB data
                // remains untouched and frontend stays stable.
                if (
                    !isDatabaseCacheFresh(
                        savedStations
                    )
                ) {

                    console.log(
                        "Saved police data is old. Refreshing in background."
                    );


                    refreshStationsInBackground(
                        latitude,
                        longitude
                    );
                }


                return res
                    .status(200)
                    .json({

                        success:
                            true,

                        source:
                            "mongodb",

                        overpassAvailable:
                            true,

                        cached:
                            true,

                        wearerLocation: {

                            latitude,

                            longitude
                        },

                        count:
                            stations.length,

                        stations
                    });
            }


            // ==================================================
            // STEP 2:
            // DATABASE EMPTY
            //
            // ONLY NOW USE OVERPASS.
            // ==================================================

            console.log(
                "No saved nearby police stations. Searching OpenStreetMap..."
            );


            const freshStations =
                await loadFreshStations(
                    latitude,
                    longitude
                );


            // ==================================================
            // OVERPASS SUCCESS
            // ==================================================

            if (
                Array.isArray(
                    freshStations
                ) &&
                freshStations.length >
                0
            ) {

                const stations =
                    prepareStationsForFrontend(

                        freshStations,

                        registered,

                        latitude,

                        longitude
                    );


                return res
                    .status(200)
                    .json({

                        success:
                            true,

                        source:
                            "openstreetmap",

                        overpassAvailable:
                            true,

                        cached:
                            false,

                        wearerLocation: {

                            latitude,

                            longitude
                        },

                        count:
                            stations.length,

                        stations
                    });
            }


            // ==================================================
            // STEP 3:
            // OVERPASS FAILED
            //
            // CHECK DATABASE AGAIN.
            //
            // Another parallel request may have saved stations
            // while this request was waiting.
            // ==================================================

            savedStations =
                await getSavedNearbyStations(
                    latitude,
                    longitude
                );


            if (
                savedStations.length >
                0
            ) {

                console.log(
                    "Using MongoDB stations after Overpass failure:",
                    savedStations.length
                );


                const stations =
                    prepareStationsForFrontend(

                        savedStations,

                        registered,

                        latitude,

                        longitude
                    );


                return res
                    .status(200)
                    .json({

                        success:
                            true,

                        source:
                            "mongodb-fallback",

                        overpassAvailable:
                            false,

                        cached:
                            true,

                        wearerLocation: {

                            latitude,

                            longitude
                        },

                        count:
                            stations.length,

                        stations
                    });
            }


            // ==================================================
            // STEP 4:
            // ABSOLUTE LAST FALLBACK
            //
            // Only happens when:
            // - MongoDB has no nearby OSM data
            // - ALL Overpass servers failed
            //
            // We still return registered stations.
            // ==================================================

            console.log(
                "No MongoDB nearby stations and Overpass unavailable."
            );


            console.log(
                "Using registered police station fallback."
            );


            const fallbackStations =
                createRegisteredFallback(

                    registered,

                    latitude,

                    longitude
                );


            return res
                .status(200)
                .json({

                    success:
                        true,

                    source:
                        "registered-fallback",

                    overpassAvailable:
                        false,

                    cached:
                        false,

                    wearerLocation: {

                        latitude,

                        longitude
                    },

                    count:
                        fallbackStations.length,

                    stations:
                        fallbackStations,

                    message:

                        fallbackStations.length >
                        0

                            ? "Saved nearby stations are not available yet. Registered police stations loaded."

                            : "Nearby police station data is not available yet."
                });
        }


        // ======================================================
        // FINAL ERROR HANDLER
        // ======================================================

        catch (error) {

            console.log(
                "NEARBY POLICE STATION ERROR:",
                error
            );


            return res
                .status(500)
                .json({

                    success:
                        false,

                    message:
                        "Unable to load nearby police stations.",

                    error:
                        error.message
                });
        }
    };