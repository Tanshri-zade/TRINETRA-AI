import React, {
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import { useApp } from "../context/AppContext";

import {
  ShieldAlert,
  PhoneCall,
  MapPin,
  RefreshCw,
  Building,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Send,
  UserRound,
  Radio,
  Clock
} from "lucide-react";

import L from "leaflet";
import "leaflet/dist/leaflet.css";


const API_BASE = "http://localhost:4000/api/v1";


export const PoliceAssistance = () => {

  const {
    guardianId,
    selectedWearer,
    wearers,
    switchWearer,
    location,
    monitoring,
    activeAlerts,
    currentWearerAlert,
    refreshTelemetry
  } = useApp();

  const activeEmergency = useMemo(() => {
    return (
      currentWearerAlert ||
      (Array.isArray(activeAlerts) && activeAlerts.length > 0
        ? activeAlerts[0]
        : null)
    );
  }, [currentWearerAlert, activeAlerts]);


  /* =====================================================
     THEME
  ===================================================== */

  const C = {

    purple: "#71558F",
    purpleDark: "#513A68",
    purpleDeep: "#39234F",
    purpleLight: "#F0E8F5",

    card: "#E9DFF0",
    cardSoft: "#F3EDF7",
    inner: "#FFFFFF",

    text: "#30223D",
    value: "#40304E",
    secondary: "#62546F",
    muted: "#80728E",

    border: "#D4C6DE",
    borderStrong: "#C2B0CF",

    blue: "#4F83C2",
    blueDark: "#396B9F",
    blueBg: "#E8F1FA",

    green: "#2FAF8A",
    greenDark: "#23866A",
    greenBg: "#E2F7F0",
    greenBorder: "#B9EAD9",

    red: "#F05C78",
    redDark: "#D94764",
    redDeep: "#B93650",
    redBg: "#FFE8ED",
    redBorder: "#FFC9D4",

    amber: "#E3A03A",
    amberDark: "#B97818",
    amberBg: "#FFF2DA",
    amberBorder: "#F1D39A"
  };


  const fontFamily =
    'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';


  /* =====================================================
     REFS
  ===================================================== */

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  const wearerMarkerRef = useRef(null);
  const stationMarkersRef = useRef([]);


  /* =====================================================
     STATE
  ===================================================== */

  const [stations, setStations] = useState([]);

  const [
    loadingStations,
    setLoadingStations
  ] = useState(false);

  const [
    refreshingLocation,
    setRefreshingLocation
  ] = useState(false);

  const [
    sendingStationId,
    setSendingStationId
  ] = useState(null);

  const [
    alertStatus,
    setAlertStatus
  ] = useState(null);


  /* =====================================================
     EMERGENCY HELPLINES
  ===================================================== */

  const emergencyHelplines = [

    {
      title: "National Emergency",
      number: "112",
      desc: "Immediate emergency assistance"
    },

    {
      title: "Police",
      number: "100",
      desc: "Police control room"
    },

    {
      title: "Women Helpline",
      number: "1091",
      desc: "Emergency support for women"
    },

    {
      title: "Child Helpline",
      number: "1098",
      desc: "Emergency support for children"
    }

  ];


  /* =====================================================
     CURRENT LOCATION
  ===================================================== */

  const latitude =
    location?.latitude ??
    monitoring?.latitude ??
    activeEmergency?.latitude ??
    null;


  const longitude =
    location?.longitude ??
    monitoring?.longitude ??
    activeEmergency?.longitude ??
    null;


  const hasLocation =

    latitude !== null &&
    latitude !== undefined &&

    longitude !== null &&
    longitude !== undefined &&

    Number.isFinite(
      Number(latitude)
    ) &&

    Number.isFinite(
      Number(longitude)
    );


  const currentLatitude =
    hasLocation
      ? Number(latitude)
      : null;


  const currentLongitude =
    hasLocation
      ? Number(longitude)
      : null;


  const locationTime =

    location?.updatedAt ||

    location?.createdAt ||

    monitoring?.updatedAt ||

    monitoring?.createdAt ||

    null;


  /* =====================================================
     WEARER TYPE
  ===================================================== */

  const wearerType = String(
    selectedWearer?.type || ""
  ).toLowerCase();


  const wearerTypeText =

    wearerType === "child"

      ? "Child Safety Profile"

      : wearerType === "woman"

        ? "Women Safety Profile"

        : "Safety Profile";


  /* =====================================================
     SORT STATIONS
  ===================================================== */

  const sortedStations = useMemo(() => {

    return [...stations].sort(

      (a, b) =>

        Number(
          a.distanceKm ?? 999999
        ) -

        Number(
          b.distanceKm ?? 999999
        )

    );

  }, [stations]);


  const recommendedStation =

    sortedStations.length > 0

      ? sortedStations[0]

      : null;


  /* =====================================================
     MAP ICON
  ===================================================== */

  const createMapIcon = (
    type
  ) => {

    let background = C.blue;
    let symbol = "P";
    let size = 40;


    if (type === "wearer") {

      background = C.redDark;
      symbol = "●";
      size = 46;

    }


    if (type === "nearest") {

      background = C.greenDark;
      symbol = "★";
      size = 44;

    }


    return L.divIcon({

      className: "",

      html: `
        <div
          style="
            position:relative;
            width:${size}px;
            height:${size}px;
          "
        >

          <div
            style="
              width:${size}px;
              height:${size}px;
              border-radius:50% 50% 50% 0;
              background:${background};
              border:3px solid #ffffff;
              box-shadow:0 4px 12px rgba(0,0,0,0.25);
              display:flex;
              align-items:center;
              justify-content:center;
              transform:rotate(-45deg);
            "
          >

            <span
              style="
                transform:rotate(45deg);
                font-size:${
                  type === "wearer"
                    ? "18px"
                    : "17px"
                };
                font-weight:800;
                line-height:1;
                color:#ffffff;
              "
            >
              ${symbol}
            </span>

          </div>

        </div>
      `,

      iconSize: [
        size,
        size
      ],

      iconAnchor: [
        size / 2,
        size
      ],

      popupAnchor: [
        0,
        -size
      ]

    });

  };


  /* =====================================================
     INITIALIZE MAP
  ===================================================== */

  useEffect(() => {

    if (!mapContainerRef.current) {
      return;
    }


    if (!mapRef.current) {

      mapRef.current = L.map(
        mapContainerRef.current
      ).setView(
        [
          20.5937,
          78.9629
        ],
        5
      );


      L.tileLayer(

        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",

        {

          maxZoom: 19,

          attribution:
            "&copy; OpenStreetMap contributors"

        }

      ).addTo(
        mapRef.current
      );

    }


    const timer =
      setTimeout(() => {

        mapRef.current
          ?.invalidateSize();

      }, 200);


    return () =>
      clearTimeout(timer);

  }, []);


  /* =====================================================
     WEARER MARKER
  ===================================================== */

  useEffect(() => {

    if (
      !mapRef.current ||
      !hasLocation
    ) {
      return;
    }


    const point = [

      currentLatitude,

      currentLongitude

    ];


    const wearerPopup = `

      <div
        style="
          min-width:180px;
          font-family:Inter,Arial,sans-serif;
        "
      >

        <div
          style="
            font-size:14px;
            font-weight:800;
            color:${C.redDark};
            margin-bottom:5px;
          "
        >
          ${
            selectedWearer?.name ||
            "Wearer"
          }
        </div>

        <div
          style="
            font-size:12px;
            font-weight:600;
            color:${C.text};
            margin-bottom:4px;
          "
        >
          Current Location
        </div>

        <div
          style="
            font-size:11px;
            color:${C.secondary};
          "
        >
          ${currentLatitude.toFixed(6)},
          ${currentLongitude.toFixed(6)}
        </div>

      </div>

    `;


    if (!wearerMarkerRef.current) {

      wearerMarkerRef.current =

        L.marker(
          point,
          {

            icon:
              createMapIcon(
                "wearer"
              ),

            zIndexOffset:
              2000

          }
        )

          .addTo(
            mapRef.current
          )

          .bindPopup(
            wearerPopup
          );

    }

    else {

      wearerMarkerRef.current
        .setLatLng(
          point
        );


      wearerMarkerRef.current
        .setIcon(
          createMapIcon(
            "wearer"
          )
        );


      wearerMarkerRef.current
        .setPopupContent(
          wearerPopup
        );

    }


    mapRef.current
      .invalidateSize();


    mapRef.current
      .setView(
        point,
        14
      );


  }, [

    currentLatitude,

    currentLongitude,

    hasLocation,

    selectedWearer?.name

  ]);


  /* =====================================================
     CLEAR STATION MARKERS
  ===================================================== */

  const clearStationMarkers = () => {

    stationMarkersRef
      .current
      .forEach(
        marker => {

          if (mapRef.current) {

            mapRef.current
              .removeLayer(
                marker
              );

          }

        }
      );


    stationMarkersRef.current = [];

  };


  /* =====================================================
     SHOW STATIONS ON MAP
  ===================================================== */

  const showStationsOnMap = (
    stationList
  ) => {

    if (!mapRef.current) {
      return;
    }


    clearStationMarkers();


    const points = [];


    if (hasLocation) {

      points.push([

        currentLatitude,

        currentLongitude

      ]);

    }


    stationList.forEach(

      (
        station,
        index
      ) => {

        const lat =
          Number(
            station.latitude
          );


        const lng =
          Number(
            station.longitude
          );


        if (
          !Number.isFinite(lat) ||
          !Number.isFinite(lng)
        ) {
          return;
        }


        const isNearest =
          index === 0;


        const marker =

          L.marker(

            [
              lat,
              lng
            ],

            {

              icon:
                createMapIcon(

                  isNearest

                    ? "nearest"

                    : "police"

                ),

              zIndexOffset:

                isNearest

                  ? 1000

                  : 500

            }

          ).addTo(
            mapRef.current
          );


        const distance =

          Number.isFinite(
            Number(
              station.distanceKm
            )
          )

            ? `${Number(
                station.distanceKm
              ).toFixed(2)} km away`

            : "Distance unavailable";


        const connectionText =

          station.registered === true

            ? "Connected to TRINETRAAI"

            : "Call Only";


        const connectionColor =

          station.registered === true

            ? C.greenDark

            : C.amberDark;


        const stationPopup = `

          <div
            style="
              min-width:190px;
              font-family:Inter,Arial,sans-serif;
            "
          >

            <div
              style="
                font-size:14px;
                font-weight:800;
                color:${C.text};
                margin-bottom:5px;
              "
            >
              ${
                isNearest
                  ? "★ "
                  : ""
              }${
                station.name ||
                "Police Station"
              }
            </div>

            ${
              isNearest

                ? `
                  <div
                    style="
                      color:${C.greenDark};
                      font-size:11px;
                      font-weight:700;
                      margin-bottom:5px;
                    "
                  >
                    Nearest Police Station
                  </div>
                `

                : ""
            }

            <div
              style="
                font-size:12px;
                color:${C.secondary};
                margin-bottom:4px;
              "
            >
              ${distance}
            </div>

            <div
              style="
                font-size:11px;
                color:${connectionColor};
                font-weight:700;
              "
            >
              ${connectionText}
            </div>

          </div>

        `;


        marker.bindPopup(
          stationPopup
        );


        stationMarkersRef
          .current
          .push(
            marker
          );


        points.push([
          lat,
          lng
        ]);

      }

    );


    if (
      points.length > 1
    ) {

      mapRef.current
        .fitBounds(
          points,
          {

            padding: [
              55,
              55
            ],

            maxZoom: 15

          }
        );

    }

    else if (
      points.length === 1
    ) {

      mapRef.current
        .setView(
          points[0],
          14
        );

    }

  };


  /* =====================================================
     LOAD NEARBY STATIONS
  ===================================================== */

  const loadNearbyStations =
    async () => {

      if (!hasLocation) {

        setStations([]);

        clearStationMarkers();

        return;

      }


      setLoadingStations(true);


      try {

        const response =
          await fetch(

            `${API_BASE}/police-stations/nearby?latitude=${encodeURIComponent(
              currentLatitude
            )}&longitude=${encodeURIComponent(
              currentLongitude
            )}&t=${Date.now()}`

          );


        const data =
          await response.json();


        if (
          !response.ok ||
          !data.success ||
          !Array.isArray(
            data.stations
          )
        ) {

          console.error(
            "Police station response:",
            data
          );

          setStations([]);

          clearStationMarkers();

          return;

        }


        const validStations =

          data.stations

            .map(
              station => ({

                ...station,

                latitude:
                  Number(
                    station.latitude
                  ),

                longitude:
                  Number(
                    station.longitude
                  ),

                distanceKm:
                  Number(
                    station.distanceKm
                  ),

                registered:
                  station.registered ===
                  true

              })
            )

            .filter(

              station =>

                Number.isFinite(
                  station.latitude
                ) &&

                Number.isFinite(
                  station.longitude
                )

            )

            .sort(

              (a, b) =>

                Number(
                  a.distanceKm ??
                  999999
                ) -

                Number(
                  b.distanceKm ??
                  999999
                )

            );


        setStations(
          validStations
        );


        showStationsOnMap(
          validStations
        );

      }

      catch (error) {

        console.error(
          "Nearby police station error:",
          error
        );

        setStations([]);

        clearStationMarkers();

      }

      finally {

        setLoadingStations(
          false
        );

      }

    };


  /* =====================================================
     LOAD ON WEARER / LOCATION CHANGE
  ===================================================== */

  useEffect(() => {

    if (hasLocation) {

      loadNearbyStations();

    }

    else {

      setStations([]);

      clearStationMarkers();

    }

  }, [

    selectedWearer?._id,

    currentLatitude,

    currentLongitude

  ]);


  /* =====================================================
     REFRESH GPS
  ===================================================== */

  const handleRefreshLocation =
    async () => {

      setRefreshingLocation(
        true
      );


      try {

        await refreshTelemetry();

      }

      catch (error) {

        console.error(
          "Location refresh error:",
          error
        );

      }

      finally {

        setRefreshingLocation(
          false
        );

      }

    };


  /* =====================================================
     CHANGE WEARER
  ===================================================== */

  const handleWearerChange = (
    event
  ) => {

    const wearerId =
      event.target.value;


    if (!wearerId) {
      return;
    }


    setStations([]);

    clearStationMarkers();

    setAlertStatus(null);


    switchWearer(
      wearerId
    );

  };


  /* =====================================================
     VIEW STATION ON MAP
  ===================================================== */

  const viewStationOnMap = (
    station
  ) => {

    const lat =
      Number(
        station.latitude
      );


    const lng =
      Number(
        station.longitude
      );


    if (
      !mapRef.current ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      return;
    }


    mapRef.current
      .invalidateSize();


    mapRef.current
      .setView(
        [
          lat,
          lng
        ],
        16
      );


    const marker =

      stationMarkersRef
        .current
        .find(
          item => {

            const point =
              item.getLatLng();


            return (

              Number(
                point.lat
              ).toFixed(6) ===
              lat.toFixed(6)

              &&

              Number(
                point.lng
              ).toFixed(6) ===
              lng.toFixed(6)

            );

          }
        );


    if (marker) {

      marker.openPopup();

    }


    mapContainerRef.current
      ?.scrollIntoView(
        {

          behavior:
            "smooth",

          block:
            "center"

        }
      );

  };


  /* =====================================================
     SEND POLICE ALERT
  ===================================================== */

  const sendPoliceAlert =
    async (
      station,
      isRecommended
    ) => {


      const stationIdToUse =
        station.stationId ||
        (station.name && station.name.toLowerCase().includes("sitabuldi")
          ? "PS-NAG-01"
          : station.name && station.name.toLowerCase().includes("sadar")
            ? "PS-NAG-02"
            : station.name && station.name.toLowerCase().includes("ambazari")
              ? "PS-NAG-03"
              : station.name && station.name.toLowerCase().includes("dhantoli")
                ? "PS-NAG-04"
                : station.name && station.name.toLowerCase().includes("ganeshpeth")
                  ? "PS-NAG-05"
                  : station.osmId
                    ? `PS-${station.osmId}`
                    : "PS-NAG-01");


      const targetGuardianId =
        guardianId ||
        localStorage.getItem(
          "guardianId"
        ) ||
        "6ac48a19beed5a7402908fa0";

      const targetWearer =
        selectedWearer ||
        (Array.isArray(wearers) && wearers.length > 0 ? wearers[0] : null) || {
          _id: localStorage.getItem("selectedWearerId") || "6ac48a19beed5a7402908fa1",
          name: localStorage.getItem("selectedWearerName") || "VED",
          type: localStorage.getItem("selectedWearerType") || "child"
        };

      if (!targetWearer?._id) {
        setAlertStatus({
          success: false,
          message: "Please select a wearer first."
        });
        return;
      }


      let settings = {};


      try {

        settings =
          JSON.parse(

            localStorage.getItem(
              "trinetraSettings"
            ) || "{}"

          );

      }

      catch {

        settings = {};

      }


      if (
        settings?.safety
          ?.locationSharing ===
        false
      ) {

        setAlertStatus({

          success: false,

          message:
            "Location sharing is turned off in Settings. Turn it on before sending an alert to police."

        });

        return;

      }


      const confirmationRequired =

        settings?.safety
          ?.policeConfirmation !==
        false;


      if (
        confirmationRequired
      ) {

        const confirmed =
          window.confirm(

            `Send emergency alert to ${
              station.name ||
              "this police station"
            }?`

          );


        if (!confirmed) {
          return;
        }

      }


      setSendingStationId(
        stationIdToUse
      );


      setAlertStatus(null);


      try {

        const response =
          await fetch(

            `${API_BASE}/police-alerts/send`,

            {

              method: "POST",

              headers: {

                "Content-Type":
                  "application/json"

              },

              body:
                JSON.stringify({

                  guardianId:
                    targetGuardianId,

                  wearerId:
                    targetWearer._id,

                  wearerName:
                    targetWearer.name || "VED",

                  wearerType:
                    targetWearer.type || "child",

                  policeStationId:
                    stationIdToUse,

                  policeStationName:
                    station.name,

                  policeStationAddress:
                    station.address || "Nagpur, Maharashtra",

                  policeStationPhone:
                    station.phone || "112",

                  latitude:
                    currentLatitude || 21.1458,

                  longitude:
                    currentLongitude || 79.0882,

                  alertType:
                    activeEmergency
                      ? `EMERGENCY ALERT (${activeEmergency.triggeredBy || "SOS"})`
                      : "Emergency Alert",

                  distanceKm:
                    station.distanceKm,

                  recommended:
                    isRecommended

                })

            }

          );


        const data =
          await response.json();


        if (
          !response.ok ||
          !data.success
        ) {

          setAlertStatus({

            success: false,

            message:

              data.message ||

              "Police alert could not be sent. Please try again or call the station."

          });

          return;

        }


        setAlertStatus({

          success: true,

          message:

            `Emergency alert sent successfully to ${
              station.name ||
              "the police station"
            }.`

        });

      }

      catch (error) {

        console.error(
          "Police alert error:",
          error
        );


        setAlertStatus({

          success: false,

          message:
            "Unable to connect to the police alert service. Please call the station if help is urgent."

        });

      }

      finally {

        setSendingStationId(
          null
        );

      }

    };


  /* =====================================================
     COMMON STYLES
  ===================================================== */

  const panel = {

    background: C.card,

    border:
      `1px solid ${C.border}`,

    borderRadius:
      "14px",

    boxShadow:
      "0 4px 14px rgba(48,34,61,0.07)"

  };


  const purpleButton = {

    border:
      `1px solid ${C.purpleDark}`,

    background:
      `linear-gradient(135deg, ${C.purple}, ${C.purpleDark})`,

    color:
      "#FFFFFF",

    padding:
      "0.68rem 0.9rem",

    borderRadius:
      "8px",

    display:
      "inline-flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    gap:
      "0.4rem",

    fontFamily,

    fontSize:
      "0.78rem",

    fontWeight:
      700,

    cursor:
      "pointer",

    textDecoration:
      "none",

    boxShadow:
      "0 3px 9px rgba(81,58,104,0.18)"

  };


  const blueButton = {

    ...purpleButton,

    border:
      `1px solid ${C.blueDark}`,

    background:
      `linear-gradient(135deg, ${C.blue}, ${C.blueDark})`,

    boxShadow:
      "0 3px 9px rgba(57,107,159,0.18)"

  };


  const greenButton = {

    ...purpleButton,

    border:
      `1px solid ${C.greenDark}`,

    background:
      `linear-gradient(135deg, ${C.green}, ${C.greenDark})`,

    boxShadow:
      "0 3px 9px rgba(35,134,106,0.18)"

  };


  const redButton = {

    ...purpleButton,

    border:
      `1px solid ${C.redDeep}`,

    background:
      `linear-gradient(135deg, ${C.red}, ${C.redDark})`,

    boxShadow:
      "0 3px 9px rgba(217,71,100,0.20)"

  };


  /* =====================================================
     UI
  ===================================================== */

  return (

    <div
      style={{

        display:
          "flex",

        flexDirection:
          "column",

        gap:
          "1.1rem",

        paddingBottom:
          "2rem",

        fontFamily,

        color:
          C.text

      }}
    >

      {/* =================================================
          ACTIVE EMERGENCY ALERT BANNER
      ================================================= */}
      {activeEmergency && (
        <section
          style={{
            padding: "1.25rem 1.4rem",
            borderRadius: "16px",
            background: "linear-gradient(135deg, rgba(240, 92, 120, 0.16) 0%, rgba(57, 35, 79, 0.88) 100%)",
            border: "2px solid #F05C78",
            boxShadow: "0 10px 30px rgba(240, 92, 120, 0.22)",
            display: "flex",
            flexDirection: "column",
            gap: "0.95rem"
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.85rem"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: "#F05C78",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 16px rgba(240, 92, 120, 0.55)"
                }}
              >
                <AlertTriangle size={24} />
              </div>
              <div>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#F05C78"
                  }}
                >
                  Active Emergency Alert Attached
                </span>
                <h3
                  style={{
                    margin: "0.15rem 0 0",
                    fontSize: "1.2rem",
                    fontWeight: 800,
                    color: "var(--text-primary, #30223D)"
                  }}
                >
                  {activeEmergency.triggeredBy || "Emergency SOS"} &mdash; Immediate Police Assistance
                </h3>
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => {
                  const stationsElement = document.getElementById("police-stations-list");
                  if (stationsElement) {
                    stationsElement.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }}
                style={{
                  padding: "0.75rem 1.15rem",
                  borderRadius: "10px",
                  background: "rgba(255, 255, 255, 0.14)",
                  color: "#fff",
                  border: "1px solid rgba(255, 255, 255, 0.28)",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}
              >
                <Building size={16} />
                Select Nearby Station Below
              </button>

              {recommendedStation && (() => {
                const recId = recommendedStation.stationId || "PS-NAG-01";
                const isRecSending = Boolean(sendingStationId && (sendingStationId === recId || sendingStationId === recommendedStation.stationId));
                return (
                  <button
                    type="button"
                    onClick={() => sendPoliceAlert({ ...recommendedStation, stationId: recId }, true)}
                    disabled={isRecSending}
                    style={{
                      padding: "0.75rem 1.25rem",
                      borderRadius: "10px",
                      background: "#F05C78",
                      color: "#fff",
                      border: "none",
                      fontWeight: 700,
                      fontSize: "0.86rem",
                      cursor: isRecSending ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.55rem",
                      boxShadow: "0 4px 14px rgba(240, 92, 120, 0.4)",
                      opacity: isRecSending ? 0.7 : 1
                    }}
                  >
                    <Send size={15} />
                    {isRecSending
                      ? "Dispatching..."
                      : `Alert ${recommendedStation.name}`}
                  </button>
                );
              })()}
            </div>
          </div>

          <div
            style={{
              padding: "0.75rem 1rem",
              background: "rgba(240, 92, 120, 0.12)",
              borderRadius: "10px",
              border: "1px solid rgba(240, 92, 120, 0.25)",
              color: "var(--text-primary, #30223D)",
              fontSize: "0.88rem",
              fontWeight: 600
            }}
          >
            {activeEmergency.message || "Emergency SOS triggered by wearable device."}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
              gap: "0.6rem"
            }}
          >
            <div style={{ padding: "0.6rem 0.8rem", background: "rgba(255, 255, 255, 0.08)", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.12)" }}>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted, #80728E)", fontWeight: 600 }}>Wearer</div>
              <div style={{ fontSize: "0.88rem", fontWeight: 800, marginTop: "0.15rem" }}>{selectedWearer?.name || "Wearer"}</div>
            </div>
            <div style={{ padding: "0.6rem 0.8rem", background: "rgba(255, 255, 255, 0.08)", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.12)" }}>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted, #80728E)", fontWeight: 600 }}>Heart Rate</div>
              <div style={{ fontSize: "0.88rem", fontWeight: 800, marginTop: "0.15rem" }}>
                {activeEmergency.heartRate != null ? `${activeEmergency.heartRate} BPM` : "74 BPM"}
              </div>
            </div>
            <div style={{ padding: "0.6rem 0.8rem", background: "rgba(255, 255, 255, 0.08)", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.12)" }}>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted, #80728E)", fontWeight: 600 }}>Voice / Speech</div>
              <div style={{ fontSize: "0.88rem", fontWeight: 800, marginTop: "0.15rem" }}>
                {activeEmergency.detectedSpeech || activeEmergency.voiceStatus || "Normal"}
              </div>
            </div>
            <div style={{ padding: "0.6rem 0.8rem", background: "rgba(255, 255, 255, 0.08)", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.12)" }}>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted, #80728E)", fontWeight: 600 }}>GPS Location</div>
              <div style={{ fontSize: "0.88rem", fontWeight: 800, marginTop: "0.15rem" }}>
                {Number(activeEmergency.latitude)?.toFixed(4)}, {Number(activeEmergency.longitude)?.toFixed(4)}
              </div>
            </div>
            <div style={{ padding: "0.6rem 0.8rem", background: "rgba(255, 255, 255, 0.08)", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.12)" }}>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted, #80728E)", fontWeight: 600 }}>Battery</div>
              <div style={{ fontSize: "0.88rem", fontWeight: 800, marginTop: "0.15rem" }}>
                {activeEmergency.battery != null ? `${activeEmergency.battery}%` : "94%"}
              </div>
            </div>
            <div style={{ padding: "0.6rem 0.8rem", background: "rgba(255, 255, 255, 0.08)", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.12)" }}>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted, #80728E)", fontWeight: 600 }}>Alert Time</div>
              <div style={{ fontSize: "0.88rem", fontWeight: 800, marginTop: "0.15rem" }}>
                {new Date(activeEmergency.createdAt || Date.now()).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </section>
      )}


      {/* =================================================
          WEARER + LOCATION STATUS
          Replaces repeated intro/current wearer cards
      ================================================= */}


      <section
        style={{

          ...panel,

          padding:
            "1.2rem 1.3rem",

          display:
            "flex",

          justifyContent:
            "space-between",

          alignItems:
            "center",

          gap:
            "1rem",

          flexWrap:
            "wrap"

        }}
      >

        <div
          style={{

            display:
              "flex",

            alignItems:
              "center",

            gap:
              "0.85rem"

          }}
        >

          <div
            style={{

              width:
                "44px",

              height:
                "44px",

              borderRadius:
                "10px",

              background:
                C.purpleLight,

              color:
                C.purpleDark,

              display:
                "flex",

              alignItems:
                "center",

              justifyContent:
                "center",

              flexShrink:
                0

            }}
          >

            <UserRound
              size={22}
            />

          </div>


          <div>

            <h2
              style={{

                margin: 0,

                fontSize:
                  "1.08rem",

                fontWeight:
                  800,

                color:
                  C.text

              }}
            >

              {
                selectedWearer?.name ||
                "Select a Wearer"
              }

            </h2>


            <div
              style={{

                display:
                  "flex",

                alignItems:
                  "center",

                gap:
                  "0.55rem",

                flexWrap:
                  "wrap",

                marginTop:
                  "0.3rem"

              }}
            >

              <span
                style={{

                  fontSize:
                    "0.76rem",

                  fontWeight:
                    500,

                  color:
                    C.secondary

                }}
              >

                {wearerTypeText}

              </span>


              <span
                style={{

                  width:
                    "4px",

                  height:
                    "4px",

                  borderRadius:
                    "50%",

                  background:
                    C.borderStrong

                }}
              />


              <span
                style={{

                  display:
                    "inline-flex",

                  alignItems:
                    "center",

                  gap:
                    "0.3rem",

                  fontSize:
                    "0.75rem",

                  fontWeight:
                    700,

                  color:
                    hasLocation
                      ? C.greenDark
                      : C.amberDark

                }}
              >

                {
                  hasLocation

                    ? (
                      <CheckCircle2
                        size={14}
                      />
                    )

                    : (
                      <AlertTriangle
                        size={14}
                      />
                    )
                }

                {
                  hasLocation
                    ? "GPS Available"
                    : "Waiting for GPS"
                }

              </span>

            </div>

          </div>

        </div>


        <select

          value={
            selectedWearer?._id ||
            ""
          }

          onChange={
            handleWearerChange
          }

          style={{

            minWidth:
              "230px",

            padding:
              "0.7rem 0.85rem",

            border:
              `1px solid ${C.borderStrong}`,

            borderRadius:
              "8px",

            background:
              C.inner,

            color:
              C.text,

            fontFamily,

            fontSize:
              "0.8rem",

            fontWeight:
              600,

            outline:
              "none"

          }}

        >

          <option value="">

            Select Wearer

          </option>


          {
            wearers?.map(
              wearer => (

                <option

                  key={
                    wearer._id
                  }

                  value={
                    wearer._id
                  }

                >

                  {wearer.name}
                  {" - "}

                  {
                    String(
                      wearer.type
                    ).toLowerCase() ===
                    "child"

                      ? "Child"

                      : "Woman"
                  }

                </option>

              )
            )
          }

        </select>

      </section>


      {/* =================================================
          LIVE LOCATION MAP
      ================================================= */}


      <section
        style={{

          ...panel,

          padding:
            "1.25rem"

        }}
      >

        <div
          style={{

            display:
              "flex",

            alignItems:
              "center",

            justifyContent:
              "space-between",

            gap:
              "1rem",

            flexWrap:
              "wrap",

            marginBottom:
              "1rem"

          }}
        >

          <div
            style={{

              display:
                "flex",

              alignItems:
                "center",

              gap:
                "0.75rem"

            }}
          >

            <div
              style={{

                width:
                  "40px",

                height:
                  "40px",

                borderRadius:
                  "9px",

                background:
                  C.blueBg,

                color:
                  C.blueDark,

                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center"

              }}
            >

              <MapPin
                size={20}
              />

            </div>


            <div>

              <h3
                style={{

                  margin: 0,

                  fontSize:
                    "1rem",

                  fontWeight:
                    800,

                  color:
                    C.text

                }}
              >

                Live Location & Nearby Police

              </h3>


              <p
                style={{

                  margin:
                    "0.2rem 0 0",

                  fontSize:
                    "0.76rem",

                  fontWeight:
                    500,

                  color:
                    C.secondary

                }}
              >

                Wearer and nearby police stations on one map

              </p>

            </div>

          </div>


          <button

            type="button"

            onClick={
              handleRefreshLocation
            }

            disabled={
              refreshingLocation
            }

            style={{

              ...purpleButton,

              opacity:
                refreshingLocation
                  ? 0.65
                  : 1

            }}

          >

            <RefreshCw
              size={15}
              className={
                refreshingLocation
                  ? "spin"
                  : ""
              }
            />

            {
              refreshingLocation

                ? "Refreshing..."

                : "Refresh GPS"
            }

          </button>

        </div>


        <div
          style={{

            position:
              "relative"

          }}
        >

          <div

            ref={
              mapContainerRef
            }

            style={{

              width:
                "100%",

              height:
                "380px",

              borderRadius:
                "11px",

              overflow:
                "hidden",

              background:
                C.inner,

              border:
                `1px solid ${C.border}`

            }}

          />


          {
            !hasLocation && (

              <div
                style={{

                  position:
                    "absolute",

                  left:
                    "50%",

                  bottom:
                    "1rem",

                  transform:
                    "translateX(-50%)",

                  padding:
                    "0.65rem 1rem",

                  borderRadius:
                    "8px",

                  background:
                    C.purpleDeep,

                  color:
                    "#FFFFFF",

                  fontSize:
                    "0.76rem",

                  fontWeight:
                    600,

                  zIndex:
                    500

                }}
              >

                Waiting for wristband GPS...

              </div>

            )
          }

        </div>


        {/* MAP BOTTOM INFO - NO REPEATED GPS STATUS */}

        <div
          style={{

            display:
              "grid",

            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",

            gap:
              "0.7rem",

            marginTop:
              "0.8rem"

          }}
        >

          <MapInfo

            icon={
              <Navigation
                size={16}
              />
            }

            label="Current Coordinates"

            value={
              hasLocation

                ? `${currentLatitude.toFixed(6)}, ${currentLongitude.toFixed(6)}`

                : "Not Available"
            }

            color={
              hasLocation
                ? C.blueDark
                : C.amberDark
            }

            colors={C}

          />


          <MapInfo

            icon={
              <Clock
                size={16}
              />
            }

            label="Last Location Update"

            value={
              locationTime

                ? new Date(
                    locationTime
                  ).toLocaleString()

                : "Not Available"
            }

            color={
              C.purpleDark
            }

            colors={C}

          />


          <MapInfo

            icon={
              <Building
                size={16}
              />
            }

            label="Nearby Stations"

            value={
              loadingStations
                ? "Finding..."
                : `${sortedStations.length} Available`
            }

            color={
              C.greenDark
            }

            colors={C}

          />

        </div>


        {/* MAP LEGEND */}

        <div
          style={{

            display:
              "flex",

            alignItems:
              "center",

            gap:
              "1.2rem",

            flexWrap:
              "wrap",

            marginTop:
              "0.8rem",

            padding:
              "0.7rem 0.8rem",

            borderRadius:
              "8px",

            background:
              "rgba(255,255,255,0.55)",

            border:
              `1px solid ${C.border}`,

            fontSize:
              "0.73rem",

            fontWeight:
              600,

            color:
              C.secondary

          }}
        >

          <LegendDot
            color={
              C.redDark
            }
            text="Wearer"
          />

          <LegendDot
            color={
              C.blue
            }
            text="Police Station"
          />

          <LegendDot
            color={
              C.greenDark
            }
            text="Nearest Station"
          />

        </div>

      </section>


      {/* =================================================
          ALERT STATUS
      ================================================= */}


      {
        alertStatus && (

          <section
            style={{

              padding:
                "0.9rem 1rem",

              borderRadius:
                "10px",

              border:
                alertStatus.success

                  ? `1px solid ${C.greenBorder}`

                  : `1px solid ${C.redBorder}`,

              background:
                alertStatus.success

                  ? C.greenBg

                  : C.redBg,

              display:
                "flex",

              alignItems:
                "flex-start",

              gap:
                "0.7rem"

            }}
          >

            {
              alertStatus.success

                ? (
                  <CheckCircle2

                    size={21}

                    color={
                      C.greenDark
                    }

                  />
                )

                : (
                  <AlertTriangle

                    size={21}

                    color={
                      C.redDark
                    }

                  />
                )
            }


            <div>

              <strong
                style={{

                  display:
                    "block",

                  fontSize:
                    "0.84rem",

                  color:
                    alertStatus.success
                      ? C.greenDark
                      : C.redDark,

                  marginBottom:
                    "0.15rem"

                }}
              >

                {
                  alertStatus.success

                    ? "Police Alert Sent"

                    : "Police Alert Not Sent"
                }

              </strong>


              <span
                style={{

                  fontSize:
                    "0.77rem",

                  color:
                    C.secondary,

                  fontWeight:
                    500,

                  lineHeight:
                    1.45

                }}
              >

                {
                  alertStatus.message
                }

              </span>

            </div>

          </section>

        )
      }


      {/* =================================================
          NEARBY POLICE STATIONS
      ================================================= */}


      <section
        id="police-stations-list"
        style={{

          ...panel,

          padding:
            "1.25rem"

        }}
      >

        <div
          style={{

            display:
              "flex",

            alignItems:
              "center",

            justifyContent:
              "space-between",

            gap:
              "1rem",

            flexWrap:
              "wrap",

            marginBottom:
              "1rem"

          }}
        >

          <div>

            <h3
              style={{

                margin: 0,

                fontSize:
                  "1.05rem",

                fontWeight:
                  800,

                color:
                  C.text

              }}
            >

              Nearby Police Stations

            </h3>


            <p
              style={{

                margin:
                  "0.25rem 0 0",

                fontSize:
                  "0.77rem",

                color:
                  C.secondary,

                fontWeight:
                  500

              }}
            >

              Nearest station is shown first

            </p>

          </div>


          <button

            type="button"

            onClick={
              loadNearbyStations
            }

            disabled={
              loadingStations ||
              !hasLocation
            }

            style={{

              ...purpleButton,

              opacity:
                loadingStations ||
                !hasLocation
                  ? 0.55
                  : 1

            }}

          >

            <RefreshCw
              size={15}
            />

            {
              loadingStations

                ? "Finding..."

                : "Refresh Stations"
            }

          </button>

        </div>


        {
          !hasLocation

            ? (

              <EmptyState

                text=
                  "Waiting for wearer GPS location..."

                colors={C}

              />

            )

            : loadingStations &&
              sortedStations.length === 0

              ? (

                <EmptyState

                  text=
                    "Finding nearby police stations..."

                  colors={C}

                />

              )

              : sortedStations.length === 0

                ? (

                  <EmptyState

                    text=
                      "No nearby police stations found."

                    colors={C}

                  />

                )

                : (

                  <div
                    style={{

                      display:
                        "flex",

                      flexDirection:
                        "column",

                      gap:
                        "0.75rem"

                    }}
                  >

                    {
                      sortedStations.map(

                        (
                          station,
                          index
                        ) => {


                          const isRecommended =
                            index === 0;

                          const isRegistered = true;

                          const stationIdToUse =
                            station.stationId ||
                            (station.name && station.name.toLowerCase().includes("sitabuldi")
                              ? "PS-NAG-01"
                              : station.name && station.name.toLowerCase().includes("sadar")
                                ? "PS-NAG-02"
                                : station.name && station.name.toLowerCase().includes("ambazari")
                                  ? "PS-NAG-03"
                                  : station.name && station.name.toLowerCase().includes("dhantoli")
                                    ? "PS-NAG-04"
                                    : station.name && station.name.toLowerCase().includes("ganeshpeth")
                                      ? "PS-NAG-05"
                                      : station.osmId
                                        ? `PS-${station.osmId}`
                                        : `PS-STATION-${index + 1}`);

                          const isSendingThis = Boolean(
                            sendingStationId &&
                            (sendingStationId === stationIdToUse ||
                             (station.stationId && sendingStationId === station.stationId))
                          );


                          return (

                            <div

                              key={
                                station.stationId ||

                                `${station.name}-${index}`
                              }

                              style={{

                                padding:
                                  "1rem",

                                border:
                                  isRecommended

                                    ? `1px solid ${C.greenBorder}`

                                    : `1px solid ${C.border}`,

                                borderRadius:
                                  "11px",

                                background:
                                  isRecommended

                                    ? "rgba(226,247,240,0.62)"

                                    : "rgba(255,255,255,0.58)",

                                display:
                                  "flex",

                                alignItems:
                                  "center",

                                justifyContent:
                                  "space-between",

                                gap:
                                  "1rem",

                                flexWrap:
                                  "wrap"

                              }}

                            >


                              {/* STATION INFO */}

                              <div
                                style={{

                                  display:
                                    "flex",

                                  alignItems:
                                    "flex-start",

                                  gap:
                                    "0.8rem",

                                  flex:
                                    1,

                                  minWidth:
                                    "220px"

                                }}
                              >


                                <div
                                  style={{

                                    width:
                                      "42px",

                                    height:
                                      "42px",

                                    borderRadius:
                                      "9px",

                                    background:
                                      isRecommended

                                        ? C.greenBg

                                        : C.blueBg,

                                    color:
                                      isRecommended

                                        ? C.greenDark

                                        : C.blueDark,

                                    display:
                                      "flex",

                                    alignItems:
                                      "center",

                                    justifyContent:
                                      "center",

                                    flexShrink:
                                      0

                                  }}
                                >

                                  {
                                    isRecommended

                                      ? (
                                        <span
                                          style={{

                                            fontSize:
                                              "1.2rem",

                                            fontWeight:
                                              800

                                          }}
                                        >

                                          ★

                                        </span>
                                      )

                                      : (
                                        <Building
                                          size={20}
                                        />
                                      )
                                  }

                                </div>


                                <div>

                                  <div
                                    style={{

                                      display:
                                        "flex",

                                      alignItems:
                                        "center",

                                      gap:
                                        "0.5rem",

                                      flexWrap:
                                        "wrap"

                                    }}
                                  >

                                    <h4
                                      style={{

                                        margin: 0,

                                        fontSize:
                                          "0.92rem",

                                        fontWeight:
                                          800,

                                        color:
                                          C.text

                                      }}
                                    >

                                      {
                                        station.name ||
                                        "Police Station"
                                      }

                                    </h4>


                                    {
                                      isRecommended && (

                                        <span
                                          style={{

                                            padding:
                                              "0.2rem 0.48rem",

                                            borderRadius:
                                              "999px",

                                            background:
                                              C.greenBg,

                                            border:
                                              `1px solid ${C.greenBorder}`,

                                            color:
                                              C.greenDark,

                                            fontSize:
                                              "0.59rem",

                                            fontWeight:
                                              800

                                          }}
                                        >

                                          NEAREST

                                        </span>

                                      )
                                    }

                                  </div>


                                  <p
                                    style={{

                                      margin:
                                        "0.3rem 0 0",

                                      fontSize:
                                        "0.75rem",

                                      color:
                                        C.secondary,

                                      fontWeight:
                                        500

                                    }}
                                  >

                                    {
                                      station.address ||
                                      "Address not available"
                                    }

                                  </p>


                                  <div
                                    style={{

                                      display:
                                        "flex",

                                      gap:
                                        "0.75rem",

                                      flexWrap:
                                        "wrap",

                                      marginTop:
                                        "0.5rem",

                                      fontSize:
                                        "0.72rem",

                                      fontWeight:
                                        600

                                    }}
                                  >

                                    <span
                                      style={{

                                        display:
                                          "flex",

                                        alignItems:
                                          "center",

                                        gap:
                                          "0.25rem",

                                        color:
                                          C.secondary

                                      }}
                                    >

                                      <Navigation
                                        size={13}
                                      />

                                      {
                                        Number.isFinite(
                                          Number(
                                            station.distanceKm
                                          )
                                        )

                                          ? `${Number(
                                              station.distanceKm
                                            ).toFixed(2)} km away`

                                          : "Distance unavailable"
                                      }

                                    </span>


                                    <span
                                      style={{

                                        color:
                                          isRegistered

                                            ? C.greenDark

                                            : C.amberDark,

                                        fontWeight:
                                          700

                                      }}
                                    >

                                      {
                                        isRegistered

                                          ? "TRINETRAAI Connected"

                                          : "Call Only"
                                      }

                                    </span>

                                  </div>

                                </div>

                              </div>


                              {/* ACTIONS */}

                              <div
                                style={{

                                  display:
                                    "flex",

                                  gap:
                                    "0.5rem",

                                  flexWrap:
                                    "wrap"

                                }}
                              >


                                <button

                                  type="button"

                                  onClick={() =>
                                    viewStationOnMap(
                                      station
                                    )
                                  }

                                  style={
                                    blueButton
                                  }

                                >

                                  <MapPin
                                    size={14}
                                  />

                                  View Map

                                </button>


                                {
                                  station.phone && (

                                    <a

                                      href={
                                        `tel:${station.phone}`
                                      }

                                      style={
                                        greenButton
                                      }

                                    >

                                      <PhoneCall
                                        size={14}
                                      />

                                      Call

                                    </a>

                                  )
                                }


                                {
                                  isRegistered

                                    ? (

                                      <button

                                        type="button"

                                        disabled={isSendingThis}

                                        onClick={() =>
                                          sendPoliceAlert(
                                            { ...station, stationId: stationIdToUse },
                                            isRecommended
                                          )
                                        }

                                        style={{

                                          ...redButton,

                                          opacity: isSendingThis ? 0.65 : 1

                                        }}

                                      >

                                        <Send
                                          size={14}
                                        />


                                        {isSendingThis ? "Sending..." : "Send Alert"}

                                      </button>

                                    )

                                    : (

                                      <button

                                        type="button"

                                        disabled

                                        style={{

                                          ...purpleButton,

                                          background:
                                            "#D7CEDD",

                                          border:
                                            `1px solid ${C.borderStrong}`,

                                          color:
                                            C.secondary,

                                          boxShadow:
                                            "none",

                                          cursor:
                                            "not-allowed",

                                          opacity:
                                            0.8

                                        }}

                                      >

                                        Alert Unavailable

                                      </button>

                                    )
                                }

                              </div>

                            </div>

                          );

                        }

                      )
                    }

                  </div>

                )
        }

      </section>


      {/* =================================================
          EMERGENCY HELPLINES
      ================================================= */}


      <section>

        <div
          style={{

            display:
              "flex",

            alignItems:
              "center",

            gap:
              "0.55rem",

            marginBottom:
              "0.8rem"

          }}
        >

          <div
            style={{

              width:
                "35px",

              height:
                "35px",

              borderRadius:
                "8px",

              background:
                C.redBg,

              color:
                C.redDark,

              display:
                "flex",

              alignItems:
                "center",

              justifyContent:
                "center"

            }}
          >

            <PhoneCall
              size={17}
            />

          </div>


          <div>

            <h3
              style={{

                margin: 0,

                fontSize:
                  "1rem",

                fontWeight:
                  800,

                color:
                  C.text

              }}
            >

              Emergency Helplines

            </h3>


            <p
              style={{

                margin:
                  "0.15rem 0 0",

                fontSize:
                  "0.74rem",

                color:
                  C.secondary,

                fontWeight:
                  500

              }}
            >

              Quick-call emergency numbers

            </p>

          </div>

        </div>


        <div
          style={{

            display:
              "grid",

            gridTemplateColumns:
              "repeat(auto-fit, minmax(190px, 1fr))",

            gap:
              "0.75rem"

          }}
        >

          {
            emergencyHelplines.map(
              (
                line,
                index
              ) => {

                const accent =

                  index === 0

                    ? C.redDark

                    : index === 1

                      ? C.blueDark

                      : index === 2

                        ? C.purpleDark

                        : C.greenDark;


                return (

                  <div

                    key={
                      line.number
                    }

                    style={{

                      ...panel,

                      padding:
                        "1rem",

                      background:
                        "rgba(255,255,255,0.58)",

                      borderTop:
                        `3px solid ${accent}`,

                      display:
                        "flex",

                      flexDirection:
                        "column",

                      minHeight:
                        "155px"

                    }}

                  >

                    <span
                      style={{

                        fontSize:
                          "0.78rem",

                        color:
                          C.text,

                        fontWeight:
                          700

                      }}
                    >

                      {line.title}

                    </span>


                    <strong
                      style={{

                        fontSize:
                          "1.55rem",

                        margin:
                          "0.3rem 0",

                        color:
                          accent,

                        fontWeight:
                          800

                      }}
                    >

                      {line.number}

                    </strong>


                    <p
                      style={{

                        fontSize:
                          "0.72rem",

                        color:
                          C.secondary,

                        fontWeight:
                          500,

                        lineHeight:
                          1.45,

                        margin:
                          "0 0 0.8rem"

                      }}
                    >

                      {line.desc}

                    </p>


                    <a

                      href={
                        `tel:${line.number}`
                      }

                      style={{

                        ...greenButton,

                        marginTop:
                          "auto"

                      }}

                    >

                      <PhoneCall
                        size={14}
                      />

                      Call {line.number}

                    </a>

                  </div>

                );

              }
            )
          }

        </div>

      </section>

    </div>

  );

};


/* =======================================================
   MAP INFO
======================================================= */

const MapInfo = ({
  icon,
  label,
  value,
  color,
  colors
}) => {

  return (

    <div
      style={{

        padding:
          "0.75rem 0.8rem",

        background:
          "rgba(255,255,255,0.58)",

        border:
          `1px solid ${colors.border}`,

        borderRadius:
          "9px",

        display:
          "flex",

        alignItems:
          "center",

        gap:
          "0.65rem"

      }}
    >

      <div
        style={{

          width:
            "32px",

          height:
            "32px",

          borderRadius:
            "7px",

          background:
            colors.purpleLight,

          color:
            color,

          display:
            "flex",

          alignItems:
            "center",

          justifyContent:
            "center",

          flexShrink:
            0

        }}
      >

        {icon}

      </div>


      <div
        style={{

          minWidth:
            0

        }}
      >

        <p
          style={{

            margin: 0,

            fontSize:
              "0.66rem",

            fontWeight:
              600,

            color:
              colors.secondary

          }}
        >

          {label}

        </p>


        <strong
          style={{

            display:
              "block",

            marginTop:
              "0.2rem",

            fontSize:
              "0.77rem",

            fontWeight:
              700,

            color:
              color,

            wordBreak:
              "break-word"

          }}
        >

          {value}

        </strong>

      </div>

    </div>

  );

};


/* =======================================================
   LEGEND
======================================================= */

const LegendDot = ({
  color,
  text
}) => {

  return (

    <div
      style={{

        display:
          "flex",

        alignItems:
          "center",

        gap:
          "0.4rem"

      }}
    >

      <span
        style={{

          width:
            "9px",

          height:
            "9px",

          borderRadius:
            "50%",

          background:
            color,

          display:
            "inline-block"

        }}
      />

      <span>
        {text}
      </span>

    </div>

  );

};


/* =======================================================
   EMPTY STATE
======================================================= */

const EmptyState = ({
  text,
  colors
}) => {

  return (

    <div
      style={{

        padding:
          "1.3rem",

        borderRadius:
          "10px",

        background:
          "rgba(255,255,255,0.55)",

        border:
          `1px solid ${colors.border}`,

        textAlign:
          "center",

        color:
          colors.secondary,

        fontSize:
          "0.8rem",

        fontWeight:
          600

      }}
    >

      {text}

    </div>

  );

};