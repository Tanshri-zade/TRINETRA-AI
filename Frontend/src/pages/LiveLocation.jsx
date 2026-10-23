import React, {
  useEffect,
  useRef,
  useState
} from "react";

import { useApp } from "../context/AppContext";
import { API } from "../services/api";
import L from "leaflet";

import {
  Navigation,
  AlertTriangle,
  Crosshair,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  MapPin,
  Clock
} from "lucide-react";


export const LiveLocation = () => {

  const {
    selectedWearer,
    location,
    monitoring,
    refreshTelemetry,
    setCurrentPage
  } = useApp();


  /* =========================================================
     THEME
  ========================================================= */

  const C = {
    hero: "#35204F",
    heroDeep: "#29163D",

    purple: "#71558F",
    purpleDark: "#513A68",
    purpleSoft: "#E8DDF0",

    card: "#E9DFF0",
    cardLight: "#F4EFF7",
    inner: "#FFFFFF",

    text: "#30223D",
    value: "#40304E",
    secondary: "#62546F",
    muted: "#80728E",

    border: "#D2C4DC",
    borderStrong: "#BFAECC",

    green: "#2FAF8A",
    greenDark: "#23866A",
    greenBg: "#E2F7F0",
    greenBorder: "#B9EAD9",

    amber: "#E4A13A",
    amberDark: "#B97818",
    amberBg: "#FFF2DA",
    amberBorder: "#F1D39A",

    red: "#F05C78",
    redDark: "#D94764",
    redBg: "#FFE8ED",
    redBorder: "#FFC9D4",

    blue: "#5D8FC4",
    blueDark: "#4474A8",
    blueBg: "#EAF3FB",
    blueBorder: "#C8DCEE"
  };


  const fontFamily =
    'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';


  /* =========================================================
     MAP REFERENCES
  ========================================================= */

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const safeZoneCircleRef = useRef(null);

  const previousLocationRef = useRef(null);

  const [
    previousLocation,
    setPreviousLocation
  ] = useState(null);

  const [
    safeZone,
    setSafeZone
  ] = useState(null);

  const [
    syncingLocation,
    setSyncingLocation
  ] = useState(false);

  /* Load safe zone for selected wearer */
  useEffect(() => {
    if (!selectedWearer?._id) return;
    let isMounted = true;
    const fetchZone = async () => {
      try {
        const response = await API.getSafeZone(selectedWearer._id);
        if (isMounted && response?.success && response?.safeZone) {
          setSafeZone(response.safeZone);
        } else if (isMounted) {
          setSafeZone(null);
        }
      } catch (_) {
        if (isMounted) setSafeZone(null);
      }
    };
    fetchZone();
    return () => { isMounted = false; };
  }, [selectedWearer?._id]);


  /* =========================================================
     LOCATION VALUES
  ========================================================= */

  const defaultLat = 21.1188;
  const defaultLng = 79.0195;


  const liveLatitude =
    location?.latitude ??
    monitoring?.latitude ??
    null;


  const liveLongitude =
    location?.longitude ??
    monitoring?.longitude ??
    null;


  const hasGpsFix =
    liveLatitude !== null &&
    liveLatitude !== undefined &&
    liveLongitude !== null &&
    liveLongitude !== undefined &&
    Number.isFinite(Number(liveLatitude)) &&
    Number.isFinite(Number(liveLongitude));


  const currentLat =
    hasGpsFix
      ? Number(liveLatitude)
      : defaultLat;


  const currentLng =
    hasGpsFix
      ? Number(liveLongitude)
      : defaultLng;


  const geofenceStatus =
    monitoring?.geofenceStatus ||
    "Not Configured";


  const locationTime =
    location?.updatedAt ||
    location?.createdAt ||
    monitoring?.updatedAt ||
    monitoring?.createdAt ||
    null;


  /* =========================================================
     PREVIOUS LOCATION
  ========================================================= */

  useEffect(() => {

    if (!hasGpsFix) {
      return;
    }

    const newPosition = {

      latitude:
        Number(liveLatitude),

      longitude:
        Number(liveLongitude),

      time:
        location?.updatedAt ||
        location?.createdAt ||
        monitoring?.updatedAt ||
        monitoring?.createdAt ||
        new Date().toISOString()

    };


    const old =
      previousLocationRef.current;


    if (
      old &&
      (
        old.latitude !==
          newPosition.latitude ||
        old.longitude !==
          newPosition.longitude
      )
    ) {

      setPreviousLocation(old);

    }


    previousLocationRef.current =
      newPosition;

  }, [
    liveLatitude,
    liveLongitude,
    location?.updatedAt,
    location?.createdAt,
    monitoring?.updatedAt,
    monitoring?.createdAt,
    hasGpsFix
  ]);

  // Synchronize previous location from database location history
  useEffect(() => {
    if (location?.recentLocation) {
      const prevLat = Number(location.recentLocation.latitude);
      const prevLng = Number(location.recentLocation.longitude);
      if (Number.isFinite(prevLat) && Number.isFinite(prevLng)) {
        setPreviousLocation({
          latitude: prevLat,
          longitude: prevLng,
          time:
            location.recentLocation.leftAt ||
            location.recentLocation.updatedAt ||
            location.recentLocation.arrivedAt ||
            location.recentLocation.createdAt
        });
      }
    }
  }, [location?.recentLocation]);


  /* =========================================================
     TIME HELPER
  ========================================================= */

  const getTimeAgo = (
    dateValue
  ) => {

    if (!dateValue) {
      return "Not Available";
    }


    const date =
      new Date(dateValue);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "Not Available";
    }


    const diff =
      Date.now() -
      date.getTime();


    if (diff < 0) {
      return "Just now";
    }


    const seconds =
      Math.floor(
        diff / 1000
      );


    if (seconds < 60) {
      return "Just now";
    }


    const minutes =
      Math.floor(
        seconds / 60
      );


    if (minutes < 60) {
      return `${minutes} min ago`;
    }


    const hours =
      Math.floor(
        minutes / 60
      );


    const remainingMinutes =
      minutes % 60;


    if (hours < 24) {

      return remainingMinutes
        ? `${hours} hr ${remainingMinutes} min ago`
        : `${hours} hr ago`;

    }


    const days =
      Math.floor(
        hours / 24
      );


    return `${days} day${
      days > 1 ? "s" : ""
    } ago`;

  };


  /* =========================================================
     MAP
  ========================================================= */

  useEffect(() => {

    if (
      !mapContainerRef.current
    ) {
      return;
    }


    if (
      !mapInstanceRef.current
    ) {

      const map = L.map(
        mapContainerRef.current,
        {
          center: [
            currentLat,
            currentLng
          ],

          zoom: 15,

          zoomControl: true
        }
      );


      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            "&copy; OpenStreetMap contributors",

          maxZoom: 19
        }
      ).addTo(map);


      const customIcon =
        L.divIcon({

          className:
            "custom-pulse-marker",

          html: `
            <div style="
              position:relative;
              width:24px;
              height:24px;
            ">

              <div style="
                position:absolute;
                inset:0;
                background:#71558F;
                border-radius:50%;
                border:3px solid #ffffff;
                box-shadow:0 0 14px rgba(113,85,143,0.65);
                z-index:2;
              "></div>

              <div style="
                position:absolute;
                inset:-8px;
                background:rgba(113,85,143,0.22);
                border-radius:50%;
                animation:radarWave 1.8s infinite ease-out;
                z-index:1;
              "></div>

            </div>
          `,

          iconSize: [
            24,
            24
          ],

          iconAnchor: [
            12,
            12
          ]
        });


      const marker =
        L.marker(
          [
            currentLat,
            currentLng
          ],
          {
            icon: customIcon
          }
        ).addTo(map);


      markerRef.current =
        marker;


      const circleCenterLat = safeZone ? Number(safeZone.latitude) : defaultLat;
      const circleCenterLng = safeZone ? Number(safeZone.longitude) : defaultLng;
      const circleRadius = safeZone ? Number(safeZone.radius) : 500;

      const circle =
        L.circle(
          [
            circleCenterLat,
            circleCenterLng
          ],
          {
            color: "#2FAF8A",

            fillColor:
              "#2FAF8A",

            fillOpacity:
              0.08,

            radius: circleRadius,

            weight: 2,

            dashArray:
              "6, 6"
          }
        ).addTo(map);

      if (safeZone?.name) {
        circle.bindPopup(`Safe Zone: ${safeZone.name} (${circleRadius}m)`);
      }

      safeZoneCircleRef.current =
        circle;


      mapInstanceRef.current =
        map;

      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 250);

    } else {

      if (
        markerRef.current &&
        hasGpsFix
      ) {

        markerRef.current.setLatLng(
          [
            currentLat,
            currentLng
          ]
        );

      }

    }

  }, [
    currentLat,
    currentLng,
    hasGpsFix
  ]);


  /* Update safe zone circle when safeZone changes */
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (safeZone && safeZone.active !== false) {
      const zLat = Number(safeZone.latitude);
      const zLng = Number(safeZone.longitude);
      const zRadius = Number(safeZone.radius) || 500;

      if (Number.isFinite(zLat) && Number.isFinite(zLng)) {
        if (safeZoneCircleRef.current) {
          safeZoneCircleRef.current.setLatLng([zLat, zLng]);
          safeZoneCircleRef.current.setRadius(zRadius);
          safeZoneCircleRef.current.setStyle({ opacity: 1, fillOpacity: 0.08 });
          safeZoneCircleRef.current.bindPopup(`Safe Zone: ${safeZone.name || "Home"} (${zRadius}m)`);
        } else {
          safeZoneCircleRef.current = L.circle([zLat, zLng], {
            color: "#2FAF8A",
            fillColor: "#2FAF8A",
            fillOpacity: 0.08,
            radius: zRadius,
            weight: 2,
            dashArray: "6, 6"
          }).addTo(mapInstanceRef.current).bindPopup(`Safe Zone: ${safeZone.name || "Home"} (${zRadius}m)`);
        }
        return;
      }
    }

    if (safeZoneCircleRef.current) {
      safeZoneCircleRef.current.setStyle({ opacity: 0, fillOpacity: 0 });
    }
  }, [safeZone]);


  /* =========================================================
     ACTIONS
  ========================================================= */

  const syncBrowserLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setSyncingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          await API.postHardwareTelemetry({
            wearerId: selectedWearer?._id || "6ac48a19beed5a7402908fa1",
            deviceId: selectedWearer?.deviceId || "ESP32_TRINETRA_01",
            latitude,
            longitude,
            gpsStatus: "Connected",
            sos: false
          });
          if (refreshTelemetry) await refreshTelemetry();
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([latitude, longitude], 16, { animate: true });
          }
        } catch (err) {
          console.error("Failed to sync location:", err);
        } finally {
          setSyncingLocation(false);
        }
      },
      (error) => {
        setSyncingLocation(false);
        alert(`Location permission denied or unavailable: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const recenter = () => {

    if (
      !mapInstanceRef.current
    ) {
      return;
    }


    mapInstanceRef.current.setView(
      [
        currentLat,
        currentLng
      ],
      16,
      {
        animate: true
      }
    );

  };


  const refreshLocation =
    async () => {

      if (refreshTelemetry) {
        await refreshTelemetry();
      }


      setTimeout(() => {

        if (
          mapInstanceRef.current &&
          markerRef.current
        ) {

          const markerLocation =
            markerRef.current
              .getLatLng();


          mapInstanceRef.current
            .setView(
              [
                markerLocation.lat,
                markerLocation.lng
              ],
              16,
              {
                animate: true
              }
            );

        }

      }, 250);

    };


  const openSafeZone = () => {

    if (setCurrentPage) {

      setCurrentPage(
        "safe_zone"
      );

    }

  };


  const openEmergency = () => {

    if (setCurrentPage) {

      setCurrentPage(
        "emergency_alerts"
      );

    }

  };


  /* =========================================================
     COMMON STYLES
  ========================================================= */

  const panelStyle = {

    background: C.card,

    border:
      `1px solid ${C.border}`,

    borderRadius: "14px",

    boxShadow:
      "0 4px 14px rgba(48,32,63,0.07)"

  };


  const labelStyle = {

    fontSize: "0.76rem",

    color: C.secondary,

    fontWeight: 600,

    margin: 0,

    marginBottom: "0.35rem"

  };


  const valueStyle = {

    fontSize: "0.92rem",

    fontWeight: 700,

    color: C.text,

    margin: 0,

    lineHeight: 1.4

  };


  const secondaryButton = {

    border:
      `1px solid ${C.borderStrong}`,

    background: "#FFFFFF",

    color: C.purpleDark,

    padding:
      "0.65rem 0.9rem",

    borderRadius: "8px",

    display: "inline-flex",

    alignItems: "center",

    justifyContent: "center",

    gap: "0.4rem",

    fontFamily,

    fontSize: "0.78rem",

    fontWeight: 700,

    cursor: "pointer"

  };


  const primaryButton = {

    border: "none",

    background:
      `linear-gradient(
        135deg,
        ${C.purple},
        ${C.purpleDark}
      )`,

    color: "#FFFFFF",

    padding:
      "0.68rem 0.95rem",

    borderRadius: "8px",

    display: "inline-flex",

    alignItems: "center",

    justifyContent: "center",

    gap: "0.4rem",

    fontFamily,

    fontSize: "0.78rem",

    fontWeight: 700,

    cursor: "pointer",

    boxShadow:
      "0 3px 9px rgba(84,55,110,0.18)"

  };


  /* =========================================================
     SAFE ZONE COLORS
  ========================================================= */

  const safeZoneColor =

    geofenceStatus === "Inside"
      ? C.greenDark

      : geofenceStatus === "Outside"
        ? C.redDark

        : C.amberDark;


  const safeZoneBackground =

    geofenceStatus === "Inside"
      ? C.greenBg

      : geofenceStatus === "Outside"
        ? C.redBg

        : C.amberBg;


  const safeZoneBorder =

    geofenceStatus === "Inside"
      ? C.greenBorder

      : geofenceStatus === "Outside"
        ? C.redBorder

        : C.amberBorder;


  const safeZoneText =

    geofenceStatus === "Inside"
      ? "Inside Safe Zone"

      : geofenceStatus === "Outside"
        ? "Outside Safe Zone"

        : "Not Configured";


  /* =========================================================
     PAGE
  ========================================================= */

  return (

    <div
      style={{
        display: "flex",

        flexDirection:
          "column",

        gap: "1.15rem",

        paddingBottom:
          "1.5rem",

        fontFamily,

        color: C.text
      }}
    >


      {/* =====================================================
          WEARER LOCATION CARD
      ===================================================== */}

      <section
        style={{
          ...panelStyle,

          padding:
            "1.15rem 1.4rem",

          display: "flex",

          alignItems:
            "center",

          justifyContent:
            "space-between",

          flexWrap: "wrap",

          gap: "1rem"
        }}
      >


        <div
          style={{
            display: "flex",

            alignItems:
              "center",

            gap: "0.9rem"
          }}
        >

          <div
            style={{
              width: "46px",

              height: "46px",

              borderRadius:
                "11px",

              background:
                C.blueBg,

              border:
                `1px solid ${C.blueBorder}`,

              display: "flex",

              alignItems:
                "center",

              justifyContent:
                "center",

              color:
                C.blueDark,

              flexShrink: 0
            }}
          >

            <Navigation
              size={23}
            />

          </div>


          <div>

            <div
              style={{
                display:
                  "flex",

                alignItems:
                  "center",

                gap: "0.55rem",

                flexWrap:
                  "wrap"
              }}
            >

              <h2
                style={{
                  fontSize:
                    "1.08rem",

                  fontWeight:
                    800,

                  color:
                    C.text,

                  margin: 0,

                  letterSpacing:
                    "-0.015em"
                }}
              >

                {selectedWearer?.name ||
                  "Wearer"}{" "}
                Live Location

              </h2>


              <span
                style={{
                  display:
                    "inline-flex",

                  alignItems:
                    "center",

                  padding:
                    "0.22rem 0.5rem",

                  borderRadius:
                    "999px",

                  fontSize:
                    "0.62rem",

                  fontWeight:
                    800,

                  background:
                    hasGpsFix
                      ? C.greenBg
                      : C.amberBg,

                  border:
                    hasGpsFix
                      ? `1px solid ${C.greenBorder}`
                      : `1px solid ${C.amberBorder}`,

                  color:
                    hasGpsFix
                      ? C.greenDark
                      : C.amberDark
                }}
              >

                {hasGpsFix
                  ? "LOCATION AVAILABLE"
                  : "LAST KNOWN LOCATION"}

              </span>

            </div>


            <p
              style={{
                fontSize:
                  "0.8rem",

                color:
                  C.secondary,

                fontWeight: 500,

                margin:
                  "0.28rem 0 0",

                lineHeight: 1.4
              }}
            >

              {hasGpsFix
                ? "Current wristband location is available"
                : "Waiting for a new GPS location from the wristband"}

            </p>

          </div>

        </div>


        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            onClick={syncBrowserLocation}
            disabled={syncingLocation}
            style={{
              ...secondaryButton,
              background: C.greenBg,
              color: C.greenDark,
              border: `1px solid ${C.greenBorder}`,
              cursor: syncingLocation ? "wait" : "pointer"
            }}
          >
            <MapPin size={16} />
            {syncingLocation ? "Detecting GPS..." : "Sync My Real Location"}
          </button>

          <button
            type="button"
            onClick={recenter}
            style={secondaryButton}
          >
            <Crosshair
              size={16}
            />
            Center on Wearer
          </button>
        </div>

      </section>


      {/* =====================================================
          MAP
      ===================================================== */}

      <div
        ref={mapContainerRef}

        style={{
          width: "100%",

          height: "420px",

          borderRadius:
            "14px",

          border:
            `1px solid ${C.border}`,

          overflow:
            "hidden",

          boxShadow:
            "0 5px 16px rgba(48,32,63,0.10)"
        }}
      />


      {/* =====================================================
          CURRENT LOCATION
      ===================================================== */}

      <section
        style={{
          ...panelStyle,

          padding:
            "1.35rem"
        }}
      >


        {/* SECTION HEADER */}

        <div
          style={{
            display: "flex",

            justifyContent:
              "space-between",

            alignItems:
              "center",

            gap: "1rem",

            flexWrap:
              "wrap",

            marginBottom:
              "1rem"
          }}
        >

          <div>

            <p
              style={{
                margin: 0,

                fontSize:
                  "0.72rem",

                color:
                  C.purple,

                fontWeight:
                  800,

                textTransform:
                  "uppercase",

                letterSpacing:
                  "0.04em"
              }}
            >
              Current Location
            </p>


            <h3
              style={{
                fontSize:
                  "1.08rem",

                fontWeight:
                  800,

                color:
                  C.text,

                margin:
                  "0.18rem 0 0"
              }}
            >
              Current Position
            </h3>

          </div>


          <span
            style={{
              display:
                "inline-flex",

              alignItems:
                "center",

              gap: "0.3rem",

              padding:
                "0.28rem 0.58rem",

              borderRadius:
                "999px",

              fontSize:
                "0.64rem",

              fontWeight:
                800,

              background:
                hasGpsFix
                  ? C.greenBg
                  : C.amberBg,

              border:
                hasGpsFix
                  ? `1px solid ${C.greenBorder}`
                  : `1px solid ${C.amberBorder}`,

              color:
                hasGpsFix
                  ? C.greenDark
                  : C.amberDark
            }}
          >

            <MapPin
              size={12}
            />

            {hasGpsFix
              ? "CURRENT"
              : "LAST KNOWN"}

          </span>

        </div>


        {/* LOCATION INFORMATION */}

        <div
          style={{
            display: "grid",

            gridTemplateColumns:
              "repeat(auto-fit, minmax(210px, 1fr))",

            gap: "0.75rem"
          }}
        >


          {/* POSITION */}

          <div
            style={{
              padding:
                "1rem",

              border:
                `1px solid ${C.border}`,

              borderRadius:
                "10px",

              background:
                C.inner
            }}
          >

            <div
              style={{
                width: "34px",

                height: "34px",

                borderRadius:
                  "8px",

                background:
                  C.blueBg,

                color:
                  C.blueDark,

                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                marginBottom:
                  "0.7rem"
              }}
            >

              <MapPin
                size={18}
              />

            </div>


            <p
              style={labelStyle}
            >
              Position
            </p>


            <strong
              style={{
                ...valueStyle,

                color:
                  hasGpsFix
                    ? C.blueDark
                    : C.secondary
              }}
            >

              {hasGpsFix
                ? `${currentLat.toFixed(
                    6
                  )}, ${currentLng.toFixed(
                    6
                  )}`
                : "Not Available"}

            </strong>

          </div>


          {/* TIME */}

          <div
            style={{
              padding:
                "1rem",

              border:
                `1px solid ${C.border}`,

              borderRadius:
                "10px",

              background:
                C.inner
            }}
          >

            <div
              style={{
                width: "34px",

                height: "34px",

                borderRadius:
                  "8px",

                background:
                  C.purpleSoft,

                color:
                  C.purple,

                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                marginBottom:
                  "0.7rem"
              }}
            >

              <Clock
                size={18}
              />

            </div>


            <p
              style={labelStyle}
            >
              Last Location Update
            </p>


            <strong
              style={valueStyle}
            >

              {getTimeAgo(
                locationTime
              )}

            </strong>

          </div>


          {/* SAFE ZONE */}

          <div
            style={{
              padding:
                "1rem",

              border:
                `1px solid ${safeZoneBorder}`,

              borderRadius:
                "10px",

              background:
                C.inner
            }}
          >

            <div
              style={{
                width: "34px",

                height: "34px",

                borderRadius:
                  "8px",

                background:
                  safeZoneBackground,

                color:
                  safeZoneColor,

                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                marginBottom:
                  "0.7rem"
              }}
            >

              <ShieldCheck
                size={18}
              />

            </div>


            <p
              style={labelStyle}
            >
              Safe Zone
            </p>


            <strong
              style={{
                ...valueStyle,

                color:
                  safeZoneColor
              }}
            >

              {safeZoneText}

            </strong>

          </div>

        </div>

      </section>


      {/* =====================================================
          PREVIOUS POSITION
      ===================================================== */}

      <section
        style={{
          ...panelStyle,

          padding:
            "1.35rem"
        }}
      >

        <div
          style={{
            display: "flex",

            justifyContent:
              "space-between",

            alignItems:
              "center",

            gap: "1rem",

            flexWrap:
              "wrap"
          }}
        >

          <div>

            <p
              style={{
                margin: 0,

                fontSize:
                  "0.72rem",

                color:
                  C.secondary,

                fontWeight:
                  700,

                textTransform:
                  "uppercase",

                letterSpacing:
                  "0.04em"
              }}
            >
              Recent Location
            </p>


            <h3
              style={{
                fontSize:
                  "1.08rem",

                fontWeight:
                  800,

                color:
                  C.text,

                margin:
                  "0.18rem 0 0"
              }}
            >
              Previous Position
            </h3>

          </div>


          <span
            style={{
              display:
                "inline-flex",

              alignItems:
                "center",

              padding:
                "0.28rem 0.58rem",

              borderRadius:
                "999px",

              background:
                C.purpleSoft,

              border:
                `1px solid ${C.border}`,

              color:
                C.purpleDark,

              fontSize:
                "0.64rem",

              fontWeight:
                800
            }}
          >
            RECENT
          </span>

        </div>


        <div
          style={{
            display: "grid",

            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",

            gap: "0.75rem",

            marginTop:
              "1rem"
          }}
        >


          <div
            style={{
              padding:
                "1rem",

              background:
                C.inner,

              border:
                `1px solid ${C.border}`,

              borderRadius:
                "10px"
            }}
          >

            <p
              style={labelStyle}
            >
              Previous Position
            </p>


            <strong
              style={valueStyle}
            >

              {previousLocation
                ? `${previousLocation.latitude.toFixed(
                    6
                  )}, ${previousLocation.longitude.toFixed(
                    6
                  )}`
                : "Not Available"}

            </strong>

          </div>


          <div
            style={{
              padding:
                "1rem",

              background:
                C.inner,

              border:
                `1px solid ${C.border}`,

              borderRadius:
                "10px"
            }}
          >

            <p
              style={labelStyle}
            >
              Last Updated
            </p>


            <strong
              style={valueStyle}
            >

              {previousLocation
                ? getTimeAgo(
                    previousLocation.time
                  )
                : "Not Available"}

            </strong>

          </div>

        </div>

      </section>


      {/* =====================================================
          LAST KNOWN LOCATION WARNING
      ===================================================== */}

      {!hasGpsFix && (

        <div
          style={{
            padding:
              "1rem 1.2rem",

            borderRadius:
              "10px",

            background:
              C.amberBg,

            border:
              `1px solid ${C.amberBorder}`,

            display:
              "flex",

            justifyContent:
              "space-between",

            alignItems:
              "center",

            gap: "1rem",

            flexWrap:
              "wrap"
          }}
        >

          <div
            style={{
              display: "flex",

              gap: "0.8rem",

              alignItems:
                "center"
            }}
          >

            <div
              style={{
                width: "40px",

                height: "40px",

                borderRadius:
                  "9px",

                background:
                  "#FFFFFF",

                color:
                  C.amberDark,

                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                flexShrink: 0
              }}
            >

              <AlertTriangle
                size={21}
              />

            </div>


            <div>

              <strong
                style={{
                  display:
                    "block",

                  fontSize:
                    "0.92rem",

                  fontWeight:
                    800,

                  color:
                    C.text
                }}
              >
                Last Known Location
              </strong>


              <p
                style={{
                  fontSize:
                    "0.78rem",

                  color:
                    C.secondary,

                  fontWeight:
                    500,

                  margin:
                    "0.18rem 0 0"
                }}
              >
                Showing the last location received from the wristband.
              </p>

            </div>

          </div>


          <div
            style={{
              textAlign:
                "right"
            }}
          >

            <p
              style={{
                ...labelStyle,
                marginBottom:
                  "0.2rem"
              }}
            >
              Last Update
            </p>


            <strong
              style={{
                fontSize:
                  "0.82rem",

                color:
                  C.amberDark,

                fontWeight:
                  700
              }}
            >

              {getTimeAgo(
                locationTime
              )}

            </strong>

          </div>

        </div>

      )}


      {/* =====================================================
          ACTIONS
      ===================================================== */}

      <div
        style={{
          display: "flex",

          alignItems:
            "center",

          gap: "0.7rem",

          flexWrap:
            "wrap"
        }}
      >

        <button
          onClick={
            refreshLocation
          }
          style={
            primaryButton
          }
        >

          <RefreshCw
            size={16}
          />

          Refresh Location

        </button>


        <button
          onClick={
            recenter
          }
          style={
            secondaryButton
          }
        >

          <Crosshair
            size={16}
          />

          Center on Wearer

        </button>


        <button
          onClick={
            openSafeZone
          }
          style={
            secondaryButton
          }
        >

          <ShieldCheck
            size={16}
          />

          Manage Safe Zone

        </button>


        <button
          onClick={
            openEmergency
          }
          style={{
            ...secondaryButton,

            color:
              C.redDark,

            border:
              `1px solid ${C.redBorder}`,

            background:
              C.redBg
          }}
        >

          <AlertCircle
            size={16}
          />

          Emergency Details

        </button>

      </div>

    </div>

  );

};