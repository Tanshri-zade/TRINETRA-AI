import React, { useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import { API } from "../services/api";
import L from "leaflet";

import {
  ShieldCheck,
  MapPin,
  Save,
  Search,
  AlertTriangle,
  CheckCircle2,
  Navigation,
  RefreshCw
} from "lucide-react";

export const SafeZone = () => {
  const {
    guardianId,
    selectedWearer,
    monitoring,
    location,
    activeAlerts,
    currentWearerAlert,
    refreshTelemetry
  } = useApp();

  /* =========================================================
     THEME
  ========================================================= */

  const C = {
    purple: "#71558F",
    purpleDark: "#513A68",
    purpleSoft: "#E9DFF0",
    purpleLight: "#F3EDF7",

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

    red: "#F05C78",
    redDark: "#D94764",
    redBg: "#FFE8ED",
    redBorder: "#FFC9D4",

    amber: "#E4A13A",
    amberDark: "#B97818",
    amberBg: "#FFF2DA",
    amberBorder: "#F1D39A",

    blue: "#5D8FC4",
    blueDark: "#4474A8",
    blueBg: "#EAF3FB"
  };

  const fontFamily =
    'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

  /* =========================================================
     FORM STATE
  ========================================================= */

  const [zoneName, setZoneName] = useState("Home");
  const [latitude, setLatitude] = useState(21.1188);
  const [longitude, setLongitude] = useState(79.0195);
  const [radius, setRadius] = useState(500);
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [searchText, setSearchText] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [hasSavedZone, setHasSavedZone] = useState(false);

  /* =========================================================
     MAP REFERENCES
  ========================================================= */

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerInstance = useRef(null);
  const circleInstance = useRef(null);
  const wearerMarkerInstance = useRef(null);

  /* =========================================================
     CURRENT WRISTBAND LOCATION
  ========================================================= */

  const wristbandLat =
    location?.latitude ??
    monitoring?.latitude ??
    currentWearerAlert?.latitude ??
    null;

  const wristbandLng =
    location?.longitude ??
    monitoring?.longitude ??
    currentWearerAlert?.longitude ??
    null;

  const hasWristbandLocation =
    wristbandLat !== null &&
    wristbandLat !== undefined &&
    wristbandLng !== null &&
    wristbandLng !== undefined &&
    Number.isFinite(Number(wristbandLat)) &&
    Number.isFinite(Number(wristbandLng));

  /* =========================================================
     FIND CURRENT WEARER ALERT
  ========================================================= */

  const wearerAlert =
    currentWearerAlert ||
    activeAlerts?.find(
      (alert) =>
        String(alert?.wearerId) ===
        String(selectedWearer?._id)
    ) ||
    null;

  /* =========================================================
     GEOFENCE STATUS
  ========================================================= */

  let geofenceStatus =
    monitoring?.geofenceStatus ||
    wearerAlert?.geofenceStatus ||
    null;

  if (
    !geofenceStatus ||
    geofenceStatus === "Not Available"
  ) {
    if (location?.insideSafeZone === true) {
      geofenceStatus = "Inside";
    } else if (location?.insideSafeZone === false) {
      geofenceStatus = "Outside";
    }
  }

  if (!geofenceStatus) {
    geofenceStatus = hasSavedZone
      ? "Waiting for Location"
      : "Not Configured";
  }

  const normalizedStatus = String(geofenceStatus)
    .trim()
    .toLowerCase();

  const isInside =
    normalizedStatus === "inside" ||
    normalizedStatus.includes("inside safe");

  const isOutside =
    normalizedStatus === "outside" ||
    normalizedStatus.includes("outside safe");

  const statusColor = isInside
    ? C.greenDark
    : isOutside
      ? C.redDark
      : C.amberDark;

  const statusBg = isInside
    ? C.greenBg
    : isOutside
      ? C.redBg
      : C.amberBg;

  const statusBorder = isInside
    ? C.greenBorder
    : isOutside
      ? C.redBorder
      : C.amberBorder;

  const displayStatus = isInside
    ? "Inside Safe Zone"
    : isOutside
      ? "Outside Safe Zone"
      : hasSavedZone
        ? "Waiting for Live Location"
        : "Not Configured";

  /* =========================================================
     LOAD EXISTING SAFE ZONE
  ========================================================= */

  useEffect(() => {
    if (!selectedWearer?._id) {
      return;
    }

    const fetchZone = async () => {
      try {
        const response = await API.getSafeZone(
          selectedWearer._id
        );

        if (response?.success && response?.safeZone) {
          const zone = response.safeZone;

          setHasSavedZone(true);
          setZoneName(zone.name || "Home");

          const savedLat = Number(zone.latitude);
          const savedLng = Number(zone.longitude);
          const savedRadius = Number(zone.radius);

          if (Number.isFinite(savedLat)) {
            setLatitude(savedLat);
          }

          if (Number.isFinite(savedLng)) {
            setLongitude(savedLng);
          }

          if (Number.isFinite(savedLat) && Number.isFinite(savedLng)) {
            moveMap(savedLat, savedLng);
          }

          if (Number.isFinite(savedRadius)) {
            setRadius(savedRadius);
          }

          setIsActive(zone.active ?? true);
        } else {
          setHasSavedZone(false);
        }
      } catch (error) {
        console.error(
          "Failed to load safe zone:",
          error
        );
      }
    };

    fetchZone();
  }, [selectedWearer?._id]);

  /* =========================================================
     MAP INITIALIZATION
  ========================================================= */

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    if (!mapInstance.current) {
      const map = L.map(mapRef.current, {
        center: [latitude, longitude],
        zoom: 15
      });

      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution: "&copy; OpenStreetMap contributors",
          maxZoom: 19
        }
      ).addTo(map);

      const marker = L.marker(
        [latitude, longitude],
        {
          draggable: true
        }
      )
        .addTo(map)
        .bindPopup("Safe Zone Center");

      const circle = L.circle(
        [latitude, longitude],
        {
          color: "#2FAF8A",
          fillColor: "#2FAF8A",
          fillOpacity: 0.13,
          radius: radius,
          weight: 2
        }
      ).addTo(map);

      marker.on("dragend", (event) => {
        const position = event.target.getLatLng();

        const newLat = parseFloat(
          position.lat.toFixed(6)
        );

        const newLng = parseFloat(
          position.lng.toFixed(6)
        );

        setLatitude(newLat);
        setLongitude(newLng);

        circle.setLatLng([
          newLat,
          newLng
        ]);
      });

      map.on("click", (event) => {
        const newLat = parseFloat(
          event.latlng.lat.toFixed(6)
        );

        const newLng = parseFloat(
          event.latlng.lng.toFixed(6)
        );

        marker.setLatLng([
          newLat,
          newLng
        ]);

        circle.setLatLng([
          newLat,
          newLng
        ]);

        setLatitude(newLat);
        setLongitude(newLng);
      });

      markerInstance.current = marker;
      circleInstance.current = circle;
      mapInstance.current = map;

      setTimeout(() => {
        if (mapInstance.current) {
          mapInstance.current.invalidateSize();
        }
      }, 250);
    }

    return () => {};
  }, []);

  /* =========================================================
     UPDATE SAFE ZONE MAP
  ========================================================= */

  useEffect(() => {
    if (markerInstance.current) {
      markerInstance.current.setLatLng([
        latitude,
        longitude
      ]);
    }

    if (circleInstance.current) {
      circleInstance.current.setLatLng([
        latitude,
        longitude
      ]);

      circleInstance.current.setRadius(
        radius
      );
    }
  }, [
    latitude,
    longitude,
    radius
  ]);

  /* =========================================================
     CURRENT WRISTBAND MARKER
  ========================================================= */

  useEffect(() => {
    if (
      !mapInstance.current ||
      !hasWristbandLocation
    ) {
      return;
    }

    const lat = Number(wristbandLat);
    const lng = Number(wristbandLng);

    if (wearerMarkerInstance.current) {
      wearerMarkerInstance.current.setLatLng([
        lat,
        lng
      ]);
    } else {
      wearerMarkerInstance.current = L.marker([
        lat,
        lng
      ])
        .addTo(mapInstance.current)
        .bindPopup(
          `${selectedWearer?.name || "Wearer"} - Current Location`
        );
    }
  }, [
    wristbandLat,
    wristbandLng,
    hasWristbandLocation,
    selectedWearer?.name
  ]);

  /* =========================================================
     MOVE MAP
  ========================================================= */

  const moveMap = (
    lat,
    lng,
    zoom = 16
  ) => {
    if (!mapInstance.current) {
      return;
    }

    mapInstance.current.setView(
      [lat, lng],
      zoom,
      {
        animate: true
      }
    );
  };

  /* =========================================================
     USE WRISTBAND LOCATION
  ========================================================= */

  const useWristbandLocation = () => {
    if (!hasWristbandLocation) {
      setStatusMsg(
        "Wristband location is not available."
      );

      return;
    }

    const lat = Number(wristbandLat);
    const lng = Number(wristbandLng);

    setLatitude(lat);
    setLongitude(lng);

    moveMap(lat, lng);

    setStatusMsg(
      "Safe zone center set to the current wristband location."
    );
  };

  /* =========================================================
     SEARCH LOCATION
  ========================================================= */

  const searchLocation = async () => {
    if (!searchText.trim()) {
      setStatusMsg(
        "Enter a location to search."
      );

      return;
    }

    try {
      setIsSearching(true);
      setStatusMsg(
        "Searching location..."
      );

      const url =
        "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" +
        encodeURIComponent(
          searchText.trim()
        );

      const response = await fetch(url);
      const data = await response.json();

      if (
        !Array.isArray(data) ||
        data.length === 0
      ) {
        setStatusMsg(
          "Location not found. Try another search."
        );

        return;
      }

      const lat = parseFloat(
        data[0].lat
      );

      const lng = parseFloat(
        data[0].lon
      );

      setLatitude(lat);
      setLongitude(lng);

      moveMap(lat, lng);

      setStatusMsg(
        `Location found: ${data[0].display_name}`
      );
    } catch (error) {
      console.error(
        "Location search failed:",
        error
      );

      setStatusMsg(
        "Unable to search location."
      );
    } finally {
      setIsSearching(false);
    }
  };

  /* =========================================================
     SAVE SAFE ZONE
  ========================================================= */

  const saveZone = async (event) => {
    event.preventDefault();

    if (!selectedWearer?._id) {
      setStatusMsg(
        "Please select a wearer first."
      );

      return;
    }

    if (!guardianId) {
      setStatusMsg(
        "Guardian information is not available."
      );

      return;
    }

    setIsSaving(true);
    setStatusMsg("");

    try {
      const response =
        await API.saveSafeZone({
          guardianId: guardianId,
          wearerId: selectedWearer._id,
          name:
            zoneName ||
            "Safe Zone",
          latitude:
            Number(latitude),
          longitude:
            Number(longitude),
          radius:
            Number(radius),
          active:
            isActive
        });

      if (response?.success) {
        setHasSavedZone(true);

        setStatusMsg(
          "Safe zone saved successfully. Checking current wristband status..."
        );

        await refreshTelemetry();

        setTimeout(() => {
          refreshTelemetry();
        }, 1000);
      } else {
        setStatusMsg(
          response?.message ||
          "Unable to save safe zone."
        );
      }
    } catch (error) {
      console.error(
        "Safe zone save error:",
        error
      );

      setStatusMsg(
        "Unable to save safe zone."
      );
    } finally {
      setIsSaving(false);
    }
  };

  /* =========================================================
     MANUAL STATUS REFRESH
  ========================================================= */

  const refreshStatus = async () => {
    setStatusMsg(
      "Checking latest wristband location..."
    );

    try {
      await refreshTelemetry();

      setStatusMsg(
        "Latest safety status updated."
      );
    } catch {
      setStatusMsg(
        "Unable to refresh safety status."
      );
    }
  };

  /* =========================================================
     COMMON STYLES
  ========================================================= */

  const panelStyle = {
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: "14px",
    boxShadow:
      "0 4px 14px rgba(48,32,63,0.07)"
  };

  const labelStyle = {
    display: "block",
    fontSize: "0.8rem",
    fontWeight: 700,
    color: C.text,
    marginBottom: "0.4rem"
  };

  const inputStyle = {
    width: "100%",
    padding: "0.72rem 0.8rem",
    borderRadius: "8px",
    border: `1px solid ${C.border}`,
    background: C.inner,
    color: C.text,
    fontFamily,
    fontSize: "0.82rem",
    outline: "none"
  };
const secondaryButton = {
  border: "1px solid #5D4378",

  background:
    "linear-gradient(135deg, #765493 0%, #5B3F75 100%)",

  color: "#FFFFFF",

  padding: "0.72rem 1rem",

  borderRadius: "8px",

  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",

  gap: "0.45rem",

  fontFamily,

  fontSize: "0.8rem",
  fontWeight: 700,

  cursor: "pointer",

  boxShadow:
    "0 4px 10px rgba(81,58,104,0.20)",

  transition:
    "all 0.2s ease"
};


const primaryButton = {
  border: "1px solid #23866A",

  background:
    "linear-gradient(135deg, #35B58F 0%, #23866A 100%)",

  color: "#FFFFFF",

  padding: "0.72rem 1rem",

  borderRadius: "8px",

  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",

  gap: "0.45rem",

  fontFamily,

  fontSize: "0.8rem",
  fontWeight: 700,

  cursor: "pointer",

  boxShadow:
    "0 4px 10px rgba(35,134,106,0.20)",

  transition:
    "all 0.2s ease"
};

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.15rem",
        paddingBottom: "1.5rem",
        fontFamily,
        color: C.text
      }}
    >

      {/* =====================================================
          SAFE ZONE SETTINGS
      ===================================================== */}

      <section
        style={{
          ...panelStyle,
          padding: "1.4rem"
        }}
      >

        {/* MAIN HEADING */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.8rem",
            marginBottom: "1.35rem"
          }}
        >

          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              background: C.greenBg,
              border: `1px solid ${C.greenBorder}`,
              color: C.greenDark,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}
          >
            <ShieldCheck size={22} />
          </div>

          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "1.15rem",
                fontWeight: 800,
                color: C.text,
                letterSpacing: "-0.015em"
              }}
            >
              Select Safe Zone Center
            </h2>

            <p
              style={{
                margin: "0.25rem 0 0",
                fontSize: "0.8rem",
                fontWeight: 500,
                color: C.secondary,
                lineHeight: 1.45
              }}
            >
              Search a place, select it on the map, or use the wristband location.
            </p>
          </div>

        </div>

        <form onSubmit={saveZone}>

          {/* SEARCH LOCATION */}

          <div
            style={{
              marginBottom: "1.15rem"
            }}
          >
            <label style={labelStyle}>
              Search Location
            </label>

            <div
              style={{
                display: "flex",
                gap: "0.6rem",
                flexWrap: "wrap"
              }}
            >
              <input
                type="text"
                value={searchText}
                onChange={(event) =>
                  setSearchText(
                    event.target.value
                  )
                }
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter"
                  ) {
                    event.preventDefault();
                    searchLocation();
                  }
                }}
                placeholder="Search a place"
                style={{
                  ...inputStyle,
                  flex: 1,
                  minWidth: "220px"
                }}
              />

              <button
                type="button"
                onClick={searchLocation}
                disabled={isSearching}
                style={{
                  ...secondaryButton,
                  opacity:
                    isSearching
                      ? 0.65
                      : 1
                }}
              >
                <Search size={15} />

                {isSearching
                  ? "Searching..."
                  : "Search Location"}
              </button>
            </div>
          </div>

          {/* SAFE ZONE NAME */}

          <div
            style={{
              marginBottom: "1.15rem"
            }}
          >
            <label style={labelStyle}>
              Safe Zone Name
            </label>

            <input
              type="text"
              value={zoneName}
              onChange={(event) =>
                setZoneName(
                  event.target.value
                )
              }
              placeholder="e.g. Home, School, Daycare"
              style={inputStyle}
            />
          </div>

          {/* RADIUS */}

          <div
            style={{
              marginBottom: "1.15rem"
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: "1rem",
                fontWeight: 800,
                color: C.text
              }}
            >
              Set Safety Radius
            </h3>

            <p
              style={{
                margin: "0.25rem 0 0",
                fontSize: "0.78rem",
                fontWeight: 500,
                color: C.secondary
              }}
            >
              Select the allowed distance around the selected location.
            </p>

            <input
              type="range"
              min="100"
              max="3000"
              step="50"
              value={radius}
              onChange={(event) =>
                setRadius(
                  Number(
                    event.target.value
                  )
                )
              }
              style={{
                width: "100%",
                cursor: "pointer",
                marginTop: "1rem",
                accentColor: C.purple
              }}
            />

            <div
              style={{
                padding: "0.75rem",
                marginTop: "0.55rem",
                borderRadius: "8px",
                background:
                  "rgba(255,255,255,0.58)",
                border:
                  `1px solid ${C.border}`,
                textAlign: "center"
              }}
            >
              <strong
                style={{
                  fontSize: "1.15rem",
                  fontWeight: 800,
                  color: C.purpleDark
                }}
              >
                {radius}
              </strong>

              <span
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 500,
                  color: C.secondary,
                  marginLeft: "0.35rem"
                }}
              >
                meters
              </span>
            </div>
          </div>

          {/* BUTTONS */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "0.65rem"
            }}
          >
            <button
              type="button"
              onClick={useWristbandLocation}
              style={secondaryButton}
            >
              <Navigation size={16} />
              Use Wristband Location as Center
            </button>

            <button
              type="submit"
              disabled={isSaving}
              style={{
                ...primaryButton,
                opacity:
                  isSaving
                    ? 0.65
                    : 1
              }}
            >
              <Save size={16} />

              {isSaving
                ? "Saving..."
                : "Save Safe Zone"}
            </button>
          </div>

          {/* ACTIVE */}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              marginTop: "1rem"
            }}
          >
            <input
              type="checkbox"
              id="activeZoneCheck"
              checked={isActive}
              onChange={(event) =>
                setIsActive(
                  event.target.checked
                )
              }
              style={{
                width: "17px",
                height: "17px",
                cursor: "pointer",
                accentColor: C.purple
              }}
            />

            <label
              htmlFor="activeZoneCheck"
              style={{
                fontSize: "0.8rem",
                fontWeight: 600,
                color: C.text,
                cursor: "pointer"
              }}
            >
              Safe Zone Monitoring Active
            </label>
          </div>

          {/* MESSAGE */}

          {statusMsg && (
            <div
              style={{
                padding: "0.75rem 0.9rem",
                marginTop: "1rem",
                borderRadius: "8px",
                background: C.purpleLight,
                border: `1px solid ${C.border}`,
                fontSize: "0.78rem",
                fontWeight: 500,
                color: C.secondary,
                lineHeight: 1.45
              }}
            >
              {statusMsg}
            </div>
          )}

        </form>
      </section>

      {/* =====================================================
          CURRENT STATUS
      ===================================================== */}

      <section
        style={{
          ...panelStyle,
          padding: "1.2rem 1.3rem",
          borderLeft:
            `4px solid ${statusColor}`
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: "1rem",
            flexWrap: "wrap"
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.8rem"
            }}
          >

            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                background: statusBg,
                border:
                  `1px solid ${statusBorder}`,
                color: statusColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}
            >
              {isInside ? (
                <CheckCircle2
                  size={23}
                />
              ) : (
                <AlertTriangle
                  size={23}
                />
              )}
            </div>

            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: "1.08rem",
                  color: statusColor,
                  fontWeight: 800
                }}
              >
                {displayStatus}
              </h3>

              <p
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 500,
                  color: C.secondary,
                  margin: "0.25rem 0 0",
                  lineHeight: 1.45
                }}
              >
                {isInside
                  ? `${selectedWearer?.name || "Selected wearer"} is currently inside the configured safe zone.`
                  : isOutside
                    ? `${selectedWearer?.name || "Selected wearer"} is currently outside the configured safe zone.`
                    : hasSavedZone
                      ? "Safe zone is configured. Waiting for the latest wristband location."
                      : "Configure and save a safe zone first."}
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={refreshStatus}
            style={secondaryButton}
          >
            <RefreshCw size={15} />
            Refresh Status
          </button>
        </div>
      </section>

      {/* =====================================================
          MAP
      ===================================================== */}

      <section
        style={{
          background: C.inner,
          border:
            `1px solid ${C.border}`,
          borderRadius: "14px",
          padding: "0.55rem",
          boxShadow:
            "0 4px 14px rgba(48,32,63,0.08)"
        }}
      >
        <div
          ref={mapRef}
          style={{
            width: "100%",
            height: "430px",
            borderRadius: "10px",
            overflow: "hidden"
          }}
        />
      </section>

      {/* =====================================================
          USEFUL LOCATION DETAILS
          Duplicate Safe Zone Status removed
      ===================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(190px, 1fr))",
          gap: "0.75rem"
        }}
      >

        <InfoCard
          label="Safety Radius"
          value={`${radius} meters`}
          icon={
            <ShieldCheck size={18} />
          }
          iconColor={C.purple}
          iconBg={C.purpleLight}
          colors={C}
        />

        <InfoCard
          label="Zone Center"
          value={`${Number(latitude).toFixed(6)}, ${Number(longitude).toFixed(6)}`}
          icon={
            <MapPin size={18} />
          }
          iconColor={C.blueDark}
          iconBg={C.blueBg}
          colors={C}
        />

        <InfoCard
          label="Wristband Location"
          value={
            hasWristbandLocation
              ? `${Number(wristbandLat).toFixed(6)}, ${Number(wristbandLng).toFixed(6)}`
              : "Not Available"
          }
          icon={
            <Navigation size={18} />
          }
          iconColor={
            hasWristbandLocation
              ? C.greenDark
              : C.amberDark
          }
          iconBg={
            hasWristbandLocation
              ? C.greenBg
              : C.amberBg
          }
          valueColor={
            hasWristbandLocation
              ? C.greenDark
              : C.amberDark
          }
          colors={C}
        />

      </div>

    </div>
  );
};


/* =========================================================
   INFO CARD
========================================================= */

const InfoCard = ({
  label,
  value,
  valueColor,
  icon,
  iconColor,
  iconBg,
  colors
}) => {
  return (
    <div
      style={{
        padding: "1rem",
        background: colors.card,
        border:
          `1px solid ${colors.border}`,
        borderRadius: "12px",
        boxShadow:
          "0 3px 10px rgba(48,32,63,0.05)",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem"
      }}
    >
      {icon && (
        <div
          style={{
            width: "38px",
            height: "38px",
            borderRadius: "9px",
            background:
              iconBg ||
              colors.purpleLight,
            color:
              iconColor ||
              colors.purple,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}
        >
          {icon}
        </div>
      )}

      <div
        style={{
          minWidth: 0
        }}
      >
        <p
          style={{
            fontSize: "0.76rem",
            fontWeight: 600,
            color: colors.secondary,
            margin: "0 0 0.28rem"
          }}
        >
          {label}
        </p>

        <strong
          style={{
            display: "block",
            fontSize: "0.88rem",
            fontWeight: 700,
            color:
              valueColor ||
              colors.text,
            wordBreak: "break-word",
            lineHeight: 1.4
          }}
        >
          {value}
        </strong>
      </div>
    </div>
  );
};