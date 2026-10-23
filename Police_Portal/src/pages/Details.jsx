import React, {
  useEffect,
  useRef,
  useState
} from "react";

import {
  useNavigate,
  useParams
} from "react-router-dom";

import L from "leaflet";

import Layout from "../components/Layout";

import {
  alertApi,
  request
} from "../services/api";


/* =========================================================
   API CONFIGURATION
========================================================= */

const API_HOST = window.location.hostname;

const MAJOR_PROJECT_API =
  `http://${API_HOST}:4000/api/v1`;

const MONITORING_API =
  `${MAJOR_PROJECT_API}/monitoring`;

const LOCATION_API =
  `${MAJOR_PROJECT_API}/location/latest`;

const LOCATION_STALE_AFTER_MS = 15000;


/* =========================================================
   LEAFLET MARKER
========================================================= */

const wearerIcon = L.icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});


/* =========================================================
   HELPERS
========================================================= */

function normalizeStatus(status) {

  const value =
    String(status || "")
      .trim()
      .toLowerCase();

  if (
    value === "accepted" ||
    value === "accept"
  ) {
    return "Accepted";
  }

  if (
    value === "resolved" ||
    value === "resolve"
  ) {
    return "Resolved";
  }

  return "Pending";
}


function hasValue(value) {

  return (
    value !== undefined &&
    value !== null &&
    value !== ""
  );
}


function validCoordinates(
  latitude,
  longitude
) {

  const lat =
    Number(latitude);

  const lng =
    Number(longitude);

  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}


function formatDate(value) {

  if (!value) {
    return "Not Available";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Not Available";
  }

  return date.toLocaleString(
    "en-IN"
  );
}


function calculateDistanceMeters(
  lat1,
  lon1,
  lat2,
  lon2
) {

  if (
    !validCoordinates(lat1, lon1) ||
    !validCoordinates(lat2, lon2)
  ) {
    return 0;
  }

  const R = 6371000;

  const toRad =
    (value) =>
      value * Math.PI / 180;

  const dLat =
    toRad(lat2 - lat1);

  const dLon =
    toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) *
    Math.sin(dLat / 2) +

    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *

    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return R * c;
}


function formatDuration(ms) {

  if (
    !Number.isFinite(ms) ||
    ms < 0
  ) {
    return "--";
  }

  const seconds =
    Math.floor(ms / 1000);

  if (seconds < 60) {
    return `${seconds} sec`;
  }

  const minutes =
    Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours =
    Math.floor(minutes / 60);

  return `${hours} hr ${minutes % 60} min`;
}


/* =========================================================
   COMPONENT
========================================================= */

export default function Details() {

  const navigate =
    useNavigate();

  const { id } =
    useParams();


  /* =======================================================
     STATE
  ======================================================= */

  const [alertData, setAlertData] =
    useState(null);

  const [monitoring, setMonitoring] =
    useState(null);

  const [locationData, setLocationData] =
    useState(null);

  const [currentLocation, setCurrentLocation] =
    useState(null);

  const [recentLocation, setRecentLocation] =
    useState(null);

  const [error, setError] =
    useState("");

  const [responseMessage, setResponseMessage] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [trackingMode, setTrackingMode] =
    useState(
      localStorage.getItem(
        "policeTrackingMode"
      ) || "person"
    );

  const [locationState, setLocationState] =
    useState("waiting");

  const [lastLocationTime, setLastLocationTime] =
    useState(null);

  const [clock, setClock] =
    useState(Date.now());


  /* =======================================================
     REFS
  ======================================================= */

  const mapElementRef =
    useRef(null);

  const mapRef =
    useRef(null);

  const markerRef =
    useRef(null);

  const previousCoordinateRef =
    useRef(null);


  /* =======================================================
     GET SAVED ALERT
  ======================================================= */

  function getSavedAlert() {

    try {

      const saved =
        localStorage.getItem(
          "selectedPoliceAlert"
        );

      if (!saved) {
        return null;
      }

      return JSON.parse(saved);

    } catch (err) {

      console.error(
        "Selected alert read error:",
        err
      );

      return null;
    }
  }


  /* =======================================================
     LOAD POLICE ALERT
  ======================================================= */

  async function loadAlert() {

    const stationId =
      localStorage.getItem(
        "policeStationId"
      );

    const saved =
      getSavedAlert();


    if (!stationId) {

      setError(
        "Police Station ID not found."
      );

      setLoading(false);

      return null;
    }


    try {

      const result =
        await request(
          `${alertApi}/station/${encodeURIComponent(
            stationId
          )}`
        );


      const alerts =
        Array.isArray(result?.alerts)
          ? result.alerts
          : [];


      let selected = null;


      /* Route se specific alert */

      if (id) {

        selected =
          alerts.find(
            (item) =>
              String(item._id) ===
              String(id)
          );
      }


      /* localStorage selected alert */

      if (
        !selected &&
        saved?._id
      ) {

        selected =
          alerts.find(
            (item) =>
              String(item._id) ===
              String(saved._id)
          );
      }


      /* Sidebar se direct Alert Details */

      if (
        !selected &&
        alerts.length > 0
      ) {

        selected =
          [...alerts].sort(
            (a, b) =>
              new Date(
                b.createdAt || 0
              ) -
              new Date(
                a.createdAt || 0
              )
          )[0];
      }


      /* Backend list me na mile but saved alert ho */

      if (
        !selected &&
        saved
      ) {

        selected =
          saved;
      }


      if (!selected) {

        setAlertData(null);

        setLoading(false);

        return null;
      }


      const finalAlert = {
        ...selected,

        status:
          normalizeStatus(
            selected.status
          )
      };


      setAlertData(
        finalAlert
      );


      localStorage.setItem(
        "selectedPoliceAlert",
        JSON.stringify(
          finalAlert
        )
      );


      setError("");

      setLoading(false);

      return finalAlert;

    } catch (err) {

      console.error(
        "Police alert load error:",
        err
      );


      if (saved) {

        const fallback = {
          ...saved,

          status:
            normalizeStatus(
              saved.status
            )
        };


        setAlertData(
          fallback
        );

        setLoading(false);

        return fallback;
      }


      setError(
        err.message ||
        "Unable to load alert information."
      );

      setLoading(false);

      return null;
    }
  }


  /* =======================================================
     LOAD MONITORING
  ======================================================= */

  async function loadMonitoring(
    wearerId
  ) {

    if (!wearerId) {
      return;
    }


    try {

      const response =
        await fetch(
          `${MONITORING_API}/latest/${encodeURIComponent(
            wearerId
          )}?t=${Date.now()}`,
          {
            method: "GET",
            cache: "no-store"
          }
        );


      if (!response.ok) {

        console.log(
          "Monitoring status:",
          response.status
        );

        return;
      }


      const result =
        await response.json();


      if (
        result?.success &&
        result?.monitoring
      ) {

        setMonitoring(
          result.monitoring
        );
      }

    } catch (err) {

      console.log(
        "Monitoring error:",
        err
      );
    }
  }


  /* =======================================================
     LOAD LIVE LOCATION
  ======================================================= */

  async function loadLocation(
    wearerId
  ) {

    if (!wearerId) {
      return;
    }


    try {

      const response =
        await fetch(
          `${LOCATION_API}/${encodeURIComponent(
            wearerId
          )}?t=${Date.now()}`,
          {
            method: "GET",
            cache: "no-store"
          }
        );


      if (!response.ok) {

        console.log(
          "Location status:",
          response.status
        );

        setLocationState(
          "waiting"
        );

        return;
      }


      const result =
        await response.json();


      if (
        !result?.success ||
        !result?.location
      ) {

        setLocationState(
          "waiting"
        );

        return;
      }


      const location =
        result.location;


      const latitude =
        Number(
          location.latitude
        );

      const longitude =
        Number(
          location.longitude
        );


      if (
        !validCoordinates(
          latitude,
          longitude
        )
      ) {

        setLocationState(
          "waiting"
        );

        return;
      }


      const updateTime =
        new Date(
          location.updatedAt ||
          location.createdAt ||
          Date.now()
        ).getTime();


      setLocationData({
        ...location,
        latitude,
        longitude
      });


      setCurrentLocation(
        result.currentLocation ||
        null
      );


      setRecentLocation(
        result.recentLocation ||
        null
      );


      setLastLocationTime(
        updateTime
      );


      const previous =
        previousCoordinateRef.current;


      if (
        Date.now() -
        updateTime >
        LOCATION_STALE_AFTER_MS
      ) {

        setLocationState(
          "stale"
        );

      } else if (previous) {

        const movement =
          calculateDistanceMeters(
            previous.latitude,
            previous.longitude,
            latitude,
            longitude
          );


        if (movement >= 5) {

          setLocationState(
            "live"
          );

        } else {

          setLocationState(
            "stationary"
          );
        }

      } else {

        setLocationState(
          "live"
        );
      }


      previousCoordinateRef.current = {
        latitude,
        longitude
      };

    } catch (err) {

      console.log(
        "Live location error:",
        err
      );

      setLocationState(
        "waiting"
      );
    }
  }


  /* =======================================================
     REFRESH ALL DATA
  ======================================================= */

  async function refreshAll() {

    const currentAlert =
      await loadAlert();


    if (
      currentAlert?.wearerId
    ) {

      await Promise.allSettled([
        loadMonitoring(
          currentAlert.wearerId
        ),

        loadLocation(
          currentAlert.wearerId
        )
      ]);
    }
  }


  /* =======================================================
     INITIAL LOAD + AUTO REFRESH
  ======================================================= */

  useEffect(() => {

    refreshAll();


    const timer =
      setInterval(
        refreshAll,
        5000
      );


    return () => {

      clearInterval(
        timer
      );

    };

  }, [id]);


  /* =======================================================
     LOCATION CLOCK
  ======================================================= */

  useEffect(() => {

    const timer =
      setInterval(
        () => {

          setClock(
            Date.now()
          );

        },
        1000
      );


    return () => {

      clearInterval(
        timer
      );

    };

  }, []);


  /* =======================================================
     CHECK STALE LOCATION
  ======================================================= */

  useEffect(() => {

    if (!lastLocationTime) {
      return;
    }


    if (
      clock -
      lastLocationTime >
      LOCATION_STALE_AFTER_MS
    ) {

      setLocationState(
        "stale"
      );
    }

  }, [
    clock,
    lastLocationTime
  ]);


  /* =======================================================
     COORDINATES
  ======================================================= */

  const latitude =
    locationData?.latitude ??
    alertData?.latitude ??
    null;


  const longitude =
    locationData?.longitude ??
    alertData?.longitude ??
    null;


  /* =======================================================
     MAP
     IMPORTANT:
     Uses React ref instead of L.map("liveLocationMap").
     This prevents "Map container not found".
  ======================================================= */

  useEffect(() => {

    if (!alertData) {
      return;
    }


    if (
      !validCoordinates(
        latitude,
        longitude
      )
    ) {
      return;
    }


    const mapContainer =
      mapElementRef.current;


    if (!mapContainer) {
      return;
    }


    const lat =
      Number(latitude);

    const lng =
      Number(longitude);


    try {

      /* CREATE MAP */

      if (!mapRef.current) {

        mapRef.current =
          L.map(
            mapContainer
          ).setView(
            [lat, lng],
            15
          );


        L.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            attribution:
              "&copy; OpenStreetMap contributors",

            maxZoom: 19
          }
        ).addTo(
          mapRef.current
        );


        markerRef.current =
          L.marker(
            [lat, lng],
            {
              icon:
                wearerIcon
            }
          )
            .addTo(
              mapRef.current
            )
            .bindPopup(
              alertData?.wearerName ||
              "Wearer"
            );

      }

      /* UPDATE EXISTING MAP */

      else {

        if (
          markerRef.current
        ) {

          markerRef.current.setLatLng(
            [lat, lng]
          );

        } else {

          markerRef.current =
            L.marker(
              [lat, lng],
              {
                icon:
                  wearerIcon
              }
            )
              .addTo(
                mapRef.current
              )
              .bindPopup(
                alertData?.wearerName ||
                "Wearer"
              );
        }
      }


      const timer =
        setTimeout(
          () => {

            if (
              mapRef.current
            ) {

              mapRef.current
                .invalidateSize();
            }

          },
          250
        );


      return () => {

        clearTimeout(
          timer
        );

      };

    } catch (err) {

      console.error(
        "Leaflet map error:",
        err
      );
    }

  }, [
    alertData,
    latitude,
    longitude
  ]);


  /* =======================================================
     MAP CLEANUP
  ======================================================= */

  useEffect(() => {

    return () => {

      if (
        mapRef.current
      ) {

        mapRef.current.remove();

        mapRef.current =
          null;

        markerRef.current =
          null;
      }
    };

  }, []);


  /* =======================================================
     TRACKING MODE
  ======================================================= */

  function changeTrackingMode(
    event
  ) {

    const value =
      event.target.value;


    setTrackingMode(
      value
    );


    localStorage.setItem(
      "policeTrackingMode",
      value
    );
  }


  /* =======================================================
     CENTER WEARER
  ======================================================= */

  function centerWearer() {

    if (
      !mapRef.current ||
      !validCoordinates(
        latitude,
        longitude
      )
    ) {

      window.alert(
        "Live location is not available."
      );

      return;
    }


    mapRef.current.setView(
      [
        Number(latitude),
        Number(longitude)
      ],
      16
    );


    markerRef.current
      ?.openPopup();
  }


  /* =======================================================
     OPEN DIRECTIONS
  ======================================================= */

  function openDirections() {

    if (
      !validCoordinates(
        latitude,
        longitude
      )
    ) {

      window.alert(
        "Live location is not available."
      );

      return;
    }


    const destination =
      `${latitude},${longitude}`;


    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        destination
      )}`,
      "_blank",
      "noopener,noreferrer"
    );
  }


  /* =======================================================
     ACCEPT / RESOLVE ALERT
  ======================================================= */

  async function updateAlert(
    action
  ) {

    if (!alertData?._id) {
      return;
    }


    try {

      setResponseMessage(
        action === "accept"
          ? "Accepting alert..."
          : "Resolving alert..."
      );


      const result =
        await request(
          `${alertApi}/${action}/${alertData._id}`,
          {
            method: "PUT"
          }
        );


      const updated =
        result?.policeAlert ||
        result?.alert ||
        alertData;


      const newStatus =
        action === "accept"
          ? "Accepted"
          : "Resolved";


      const finalAlert = {
        ...updated,
        status:
          newStatus
      };


      setAlertData(
        finalAlert
      );


      localStorage.setItem(
        "selectedPoliceAlert",
        JSON.stringify(
          finalAlert
        )
      );


      setResponseMessage(
        action === "accept"
          ? "Alert accepted successfully."
          : "Alert marked as resolved."
      );

    } catch (err) {

      console.error(
        "Alert response error:",
        err
      );


      setResponseMessage(
        err.message ||
        "Unable to update alert."
      );
    }
  }


  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {

    return (

      <Layout
        title="Alert Details"
        subtitle="Emergency response information"
      >

        <div className="details-no-alert">

          <strong>
            Loading Alert Details...
          </strong>

          <p>
            Fetching emergency information.
          </p>

        </div>

      </Layout>
    );
  }


  /* =======================================================
     NO ALERT
  ======================================================= */

  if (!alertData) {

    return (

      <Layout
        title="Alert Details"
        subtitle="Emergency response information"
      >

        <button
          type="button"
          className="details-back-button"
          onClick={() =>
            navigate(
              "/dashboard"
            )
          }
        >
          ← Back
        </button>


        {error && (

          <div className="error banner">
            {error}
          </div>

        )}


        <div className="details-no-alert">

          <strong>
            No Alert Selected
          </strong>

          <p>
            No emergency alert is currently available for this police station.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/dashboard"
              )
            }
          >
            Go to Emergency Alerts
          </button>

        </div>

      </Layout>
    );
  }


  /* =======================================================
     DISPLAY VALUES
  ======================================================= */

  const status =
    normalizeStatus(
      alertData.status
    );


  const wearerType =
    String(
      alertData.wearerType ||
      ""
    )
      .trim()
      .toLowerCase();


  const guardianPhone =
    alertData.guardianPhone ||
    alertData.guardianMobile ||
    alertData.mobileNumber ||
    "";


  const guardianEmail =
    alertData.guardianEmail ||
    "";


  const heartRate =
    monitoring?.heartRate ??
    monitoring?.heart_rate;


  const battery =
    monitoring?.battery;


  const gsmStatus =
    monitoring?.gsmStatus ??
    monitoring?.gsm_status;


  const voiceStatus =
    monitoring?.voiceStatus ??
    monitoring?.voice_status;


  const microphoneStatus =
    monitoring?.microphoneStatus ??
    monitoring?.microphone_status;


  const detectedSpeech =
    monitoring?.detectedSpeech ??
    monitoring?.detected_speech;


  const geofenceStatus =
    monitoring?.geofenceStatus ??
    monitoring?.geofence_status;


  const sos =
    monitoring?.sos;


  const safetyStatus =
    monitoring?.safetyStatus ??
    monitoring?.safety_status ??
    "Monitoring";


  const deviceId =
    monitoring?.deviceId ??
    monitoring?.device_id ??
    alertData.deviceId;


  const deviceUpdated =
    monitoring?.updatedAt ||
    monitoring?.createdAt;


  const noUpdateDuration =
    lastLocationTime
      ? formatDuration(
          clock -
          lastLocationTime
        )
      : "--";


  /* =======================================================
     UI
  ======================================================= */

  return (

    <Layout
      title="Alert Details"
      subtitle=""
    >

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="details-page-heading">

        <div>

          <div className="dashboard-label">
            EMERGENCY RESPONSE
          </div>


          <div className="details-title-row">

            <button
              type="button"
              className="details-arrow"
              onClick={() =>
                navigate(
                  "/dashboard"
                )
              }
            >
              ←
            </button>


            <h1>
              Alert Details
            </h1>

          </div>

        </div>


        <span
          className={
            `details-status ${status.toLowerCase()}`
          }
        >
          {status}
        </span>

      </div>


      {error && (

        <div className="error banner">
          {error}
        </div>

      )}


      {/* =================================================
          ALERT OVERVIEW
      ================================================= */}

      <section className="alert-overview-card">

        <div>

          <span className="details-small-heading">
            WEARER
          </span>

          <h2>
            {alertData.wearerName ||
              "Wearer"}
          </h2>

          <p>

            {wearerType === "child"
              ? "Child Safety Profile"
              : wearerType === "woman" ||
                wearerType === "women"
              ? "Women Safety Profile"
              : "Safety Profile"}

          </p>

        </div>


        <div>

          <span className="details-small-heading">
            ALERT TYPE
          </span>

          <h2>
            {alertData.alertType ||
              alertData.type ||
              "Emergency Alert"}
          </h2>

          <p>
            {formatDate(
              alertData.createdAt
            )}
          </p>

        </div>

      </section>


      {/* =================================================
          LIVE LOCATION
      ================================================= */}

      <section className="details-card live-tracking-card">

        <div className="tracking-title-row">

          <div>

            <span className="details-small-heading">
              LIVE LOCATION
            </span>

            <h2>
              Wearer Tracking
            </h2>

          </div>


          <span
            className={
              `tracking-badge ${locationState}`
            }
          >

            {locationState === "live"
              ? "LIVE GPS"
              : locationState === "stationary"
              ? "STATIONARY"
              : locationState === "stale"
              ? "LAST KNOWN"
              : "WAITING FOR GPS"}

          </span>

        </div>


        {/* TRACKING CONTROLS */}

        <div className="tracking-controls">

          <div>

            <label>
              Tracking Mode
            </label>

            <select
              value={
                trackingMode
              }
              onChange={
                changeTrackingMode
              }
            >

              <option value="person">
                Person
              </option>

              <option value="vehicle">
                Vehicle
              </option>

            </select>

          </div>


          <div className="gps-status-box">

            <span>
              GPS Status
            </span>

            <strong>

              {locationState === "live"
                ? "Live GPS Connected"
                : locationState === "stationary"
                ? "GPS Connected - Stationary"
                : locationState === "stale"
                ? "Last Known Location"
                : "Waiting for GPS"}

            </strong>

          </div>

        </div>


        {/* =================================================
            MAP
        ================================================= */}

        <div className="details-map-wrap">

          <div
            ref={
              mapElementRef
            }
            id="liveLocationMap"
          ></div>


          {!validCoordinates(
            latitude,
            longitude
          ) && (

            <div className="map-waiting-message">
              Waiting for wristband GPS...
            </div>

          )}

        </div>


        {/* =================================================
            GPS SUMMARY
        ================================================= */}

        <div className="gps-summary">

          <div>

            <span>
              Latitude
            </span>

            <strong>

              {validCoordinates(
                latitude,
                longitude
              )
                ? Number(
                    latitude
                  ).toFixed(6)
                : "Not Available"}

            </strong>

          </div>


          <div>

            <span>
              Longitude
            </span>

            <strong>

              {validCoordinates(
                latitude,
                longitude
              )
                ? Number(
                    longitude
                  ).toFixed(6)
                : "Not Available"}

            </strong>

          </div>


          <div>

            <span>
              Last GPS Update
            </span>

            <strong>

              {lastLocationTime
                ? formatDate(
                    lastLocationTime
                  )
                : "Not Available"}

            </strong>

          </div>

        </div>


        {/* =================================================
            CURRENT LOCATION
        ================================================= */}

        <div className="location-history-box current">

          <span className="details-small-heading">
            CURRENT LOCATION
          </span>

          <h3>
            Current Position
          </h3>


          <div className="location-history-grid">

            <div>

              <span>
                Position
              </span>

              <strong>

                {currentLocation &&
                validCoordinates(
                  currentLocation.latitude,
                  currentLocation.longitude
                )
                  ? `${Number(
                      currentLocation.latitude
                    ).toFixed(6)}, ${Number(
                      currentLocation.longitude
                    ).toFixed(6)}`
                  : validCoordinates(
                      latitude,
                      longitude
                    )
                  ? `${Number(
                      latitude
                    ).toFixed(6)}, ${Number(
                      longitude
                    ).toFixed(6)}`
                  : "Not Available"}

              </strong>

            </div>


            <div>

              <span>
                Time at Location
              </span>

              <strong>

                {currentLocation?.duration ||
                  currentLocation?.timeAtLocation ||
                  "Not Available"}

              </strong>

            </div>

          </div>

        </div>


        {/* =================================================
            RECENT LOCATION
        ================================================= */}

        <div className="location-history-box recent">

          <div className="recent-title">

            <div>

              <span className="details-small-heading">
                RECENT LOCATION
              </span>

              <h3>
                Previous Position
              </h3>

            </div>


            {!recentLocation && (

              <span className="no-history">
                NO HISTORY
              </span>

            )}

          </div>


          <div className="location-history-grid">

            <div>

              <span>
                Previous Position
              </span>

              <strong>

                {recentLocation &&
                validCoordinates(
                  recentLocation.latitude,
                  recentLocation.longitude
                )
                  ? `${Number(
                      recentLocation.latitude
                    ).toFixed(6)}, ${Number(
                      recentLocation.longitude
                    ).toFixed(6)}`
                  : "Not Available"}

              </strong>

            </div>


            <div>

              <span>
                Stayed Here
              </span>

              <strong>

                {recentLocation?.duration ||
                  recentLocation?.stayedHere ||
                  "Not Available"}

              </strong>

            </div>

          </div>

        </div>


        {/* =================================================
            LAST KNOWN LOCATION
        ================================================= */}

        {locationState === "stale" && (

          <div className="last-known-box">

            <div>

              <span className="details-small-heading">
                LAST KNOWN LOCATION
              </span>

              <strong>
                Last Known Location
              </strong>

              <p>
                Live GPS updates have stopped. Showing the last location received from the wristband.
              </p>

            </div>


            <div>

              <span>
                No Update For
              </span>

              <strong>
                {noUpdateDuration}
              </strong>

            </div>

          </div>

        )}


        {/* =================================================
            LOCATION BUTTONS
        ================================================= */}

        <div className="location-actions">

          <button
            type="button"
            onClick={() => {

              if (
                alertData?.wearerId
              ) {

                loadLocation(
                  alertData.wearerId
                );
              }

            }}
          >
            Refresh Live Location
          </button>


          <button
            type="button"
            className="details-outline-button"
            onClick={
              centerWearer
            }
          >
            Center Wearer
          </button>


          <button
            type="button"
            className="details-outline-button"
            onClick={
              openDirections
            }
          >
            Open Directions
          </button>

        </div>

      </section>


      {/* =================================================
          LOWER GRID
      ================================================= */}

      <div className="details-bottom-grid">


        {/* =================================================
            LEFT COLUMN
        ================================================= */}

        <div>


          {/* ===============================================
              GUARDIAN
          =============================================== */}

          <section className="details-card">

            <span className="details-small-heading">
              GUARDIAN DETAILS
            </span>

            <h2>
              Emergency Contact
            </h2>


            <div className="details-info-row">

              <span>
                Guardian Name
              </span>

              <strong>
                {alertData.guardianName ||
                  "Not Available"}
              </strong>

            </div>


            <div className="details-info-row">

              <span>
                Mobile Number
              </span>

              <strong>
                {guardianPhone ||
                  "Not Available"}
              </strong>

            </div>


            {guardianEmail && (

              <div className="details-info-row">

                <span>
                  Email
                </span>

                <strong>
                  {guardianEmail}
                </strong>

              </div>

            )}


            {guardianPhone ? (

              <a
                className="call-guardian-button"
                href={`tel:${guardianPhone}`}
              >
                Call Guardian
              </a>

            ) : (

              <button
                type="button"
                className="call-guardian-button disabled-button"
                disabled
              >
                Call Guardian
              </button>

            )}

          </section>


          {/* ===============================================
              RESPONSE CONTROL
          =============================================== */}

          <section className="details-card response-control">

            <span className="details-small-heading">
              RESPONSE CONTROL
            </span>

            <h2>
              Alert Response
            </h2>

            <p>
              Update the alert status after reviewing the emergency information.
            </p>


            <button
              type="button"
              className={
                status === "Pending"
                  ? "accept-alert-button"
                  : "closed-alert-button"
              }
              disabled={
                status !== "Pending"
              }
              onClick={() =>
                updateAlert(
                  "accept"
                )
              }
            >

              {status === "Pending"
                ? "Accept Alert"
                : status === "Accepted"
                ? "Alert Accepted"
                : "Alert Closed"}

            </button>


            <button
              type="button"
              className={
                status === "Resolved"
                  ? "resolved-alert-button"
                  : "resolve-alert-button"
              }
              disabled={
                status !== "Accepted"
              }
              onClick={() =>
                updateAlert(
                  "resolve"
                )
              }
            >

              {status === "Resolved"
                ? "Resolved"
                : "Mark as Resolved"}

            </button>


            {responseMessage && (

              <div className="response-message">
                {responseMessage}
              </div>

            )}

          </section>

        </div>


        {/* =================================================
            DEVICE INFORMATION
        ================================================= */}

        <section className="details-card device-card">

          <span className="details-small-heading">
            DEVICE INFORMATION
          </span>

          <h2>
            Wristband Status
          </h2>


          <div className="details-info-row">

            <span>
              Device ID
            </span>

            <strong>
              {deviceId ||
                "Not Available"}
            </strong>

          </div>


          <div className="details-info-row">

            <span>
              GPS
            </span>

            <strong>

              {locationState === "live" ||
              locationState === "stationary"
                ? "Connected"
                : locationState === "stale"
                ? "Last Alert Location"
                : "Not Available"}

            </strong>

          </div>


          <div className="details-info-row">

            <span>
              GSM
            </span>

            <strong>
              {gsmStatus ||
                "Not Available"}
            </strong>

          </div>


          <div className="details-info-row">

            <span>
              Battery
            </span>

            <strong>

              {hasValue(
                battery
              )
                ? `${battery}%`
                : "Not Available"}

            </strong>

          </div>


          <div className="details-info-row">

            <span>
              Heart Rate
            </span>

            <strong>

              {hasValue(
                heartRate
              )
                ? `${heartRate} BPM`
                : "Not Available"}

            </strong>

          </div>


          <div className="details-info-row">

            <span>
              Voice Status
            </span>

            <strong>
              {voiceStatus ||
                "Not Available"}
            </strong>

          </div>


          <div className="details-info-row">

            <span>
              Microphone
            </span>

            <strong>
              {microphoneStatus ||
                "Not Available"}
            </strong>

          </div>


          <div className="details-info-row">

            <span>
              Detected Speech
            </span>

            <strong>
              {detectedSpeech ||
                "Not Available"}
            </strong>

          </div>


          <div className="details-info-row">

            <span>
              Geofence
            </span>

            <strong>
              {geofenceStatus ||
                "Not Available"}
            </strong>

          </div>


          <div className="details-info-row">

            <span>
              SOS
            </span>

            <strong>

              {sos === true
                ? "SOS Active"
                : sos === false
                ? "Normal"
                : "Not Available"}

            </strong>

          </div>


          <div className="details-info-row">

            <span>
              Safety Status
            </span>

            <strong>
              {safetyStatus}
            </strong>

          </div>


          <div className="details-info-row">

            <span>
              Last Updated
            </span>

            <strong>

              {deviceUpdated
                ? formatDate(
                    deviceUpdated
                  )
                : "--"}

            </strong>

          </div>

        </section>

      </div>

    </Layout>
  );
}