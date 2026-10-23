import React, { useEffect, useRef, useState } from "react";

import { useApp } from "./context/AppContext";

import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { HardwareSimulatorModal } from "./components/HardwareSimulatorModal";
import { AddWearerModal } from "./components/AddWearerModal";

import { Auth } from "./pages/Auth";
import { Dashboard } from "./pages/Dashboard";
import { DeviceStatus } from "./pages/DeviceStatus";
import { LiveLocation } from "./pages/LiveLocation";
import { SafeZone } from "./pages/SafeZone";
import { EmergencyAlerts } from "./pages/EmergencyAlerts";
import { PoliceAssistance } from "./pages/PoliceAssistance";
import { AlertHistory } from "./pages/AlertHistory";
import { Settings } from "./pages/Settings";

import {
  AlertTriangle,
  Heart,
  Mic,
  MessageSquare,
  ShieldCheck,
  Battery,
  Radio,
  MapPin,
  ShieldAlert,
  X,
  Clock
} from "lucide-react";

export const App = () => {
  const {
    currentPage,
    isLoggedIn,
    activeAlerts,
    setCurrentPage
  } = useApp();

  const [popupAlert, setPopupAlert] = useState(null);
  const dismissedAlertIds = useRef(new Set());

  /* =========================================================
     GLOBAL EMERGENCY POPUP
  ========================================================= */

  useEffect(() => {
    if (!activeAlerts || activeAlerts.length === 0) {
      setPopupAlert(null);
      return;
    }

    const latestActive = activeAlerts[0];
    if (!latestActive?._id) return;

    // Do not show popup if already on the emergency alerts page
    if (currentPage === "emergency_alerts") {
      setPopupAlert(null);
      return;
    }

    // Only pop up if this alert hasn't already been dismissed/viewed by the user
    if (!dismissedAlertIds.current.has(latestActive._id)) {
      setPopupAlert(latestActive);
    }
  }, [activeAlerts, currentPage]);

  const handleDismissPopup = () => {
    if (popupAlert?._id) {
      dismissedAlertIds.current.add(popupAlert._id);
    }
    setPopupAlert(null);
  };

  const handleViewEmergency = () => {
    if (popupAlert?._id) {
      dismissedAlertIds.current.add(popupAlert._id);
    }
    setPopupAlert(null);
    setCurrentPage("emergency_alerts");
  };

  /* =========================================================
     GPS FORMAT
  ========================================================= */

  const getGpsText = (alert) => {
    const latitude = Number(alert?.latitude);
    const longitude = Number(alert?.longitude);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return "Not Available";
    }

    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  };

  /* =========================================================
     LOGIN
  ========================================================= */

  if (!isLoggedIn) {
    return <Auth />;
  }

  /* =========================================================
     PAGE ROUTING
  ========================================================= */

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;

      case "device_status":
        return <DeviceStatus />;

      case "live_location":
        return <LiveLocation />;

      case "safe_zone":
        return <SafeZone />;

      case "emergency_alerts":
        return <EmergencyAlerts />;

      case "police_assistance":
        return <PoliceAssistance />;

      case "alert_history":
        return <AlertHistory />;

      case "settings":
        return <Settings />;

      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      {/* =====================================================
          RESPONSIVE FOUNDATION
      ===================================================== */}

      <style>{`
        * {
          box-sizing: border-box;
        }

        html,
        body,
        #root {
          width: 100%;
          min-height: 100%;
          margin: 0;
        }

        body {
          overflow-x: hidden;
        }

        .app-container {
          width: 100%;
          min-height: 100vh;
          display: flex;
          align-items: stretch;
          background: var(--bg-primary);
          overflow-x: hidden;
        }

        .main-viewport {
          flex: 1;
          min-width: 0;
          width: calc(100% - 238px);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--bg-primary);
          overflow-x: hidden;
        }

        .content-area {
          width: 100%;
          max-width: 100%;
          flex: 1;
          min-width: 0;
          padding: 1.35rem;
          overflow-x: hidden;
        }

        .content-area > * {
          max-width: 100%;
        }

        /* Make media responsive */
        .content-area img,
        .content-area svg,
        .content-area canvas {
          max-width: 100%;
        }

        /* Leaflet maps must stay inside mobile viewport */
        .leaflet-container {
          max-width: 100%;
        }

        /* Prevent long text / IDs / coordinates from breaking layout */
        .content-area p,
        .content-area span,
        .content-area strong,
        .content-area h1,
        .content-area h2,
        .content-area h3,
        .content-area h4 {
          overflow-wrap: break-word;
        }

        /* =====================================================
           TABLET
        ===================================================== */

        @media (max-width: 1024px) {
          .content-area {
            padding: 1.1rem;
          }
        }

        /* =====================================================
           MOBILE
        ===================================================== */

        @media (max-width: 768px) {
          .app-container {
            display: block;
            width: 100%;
            min-height: 100vh;
          }

          .main-viewport {
            width: 100%;
            max-width: 100%;
            min-height: 100vh;
            margin: 0;
          }

          .content-area {
            width: 100%;
            max-width: 100%;
            padding: 0.85rem;
            padding-top: 0.9rem;
            overflow-x: hidden;
          }

          /*
            Main responsive rule:
            desktop multi-column grids become one column on phone.
          */
          .content-area [style*="grid-template-columns"],
          .content-area [style*="gridTemplateColumns"] {
            grid-template-columns: minmax(0, 1fr) !important;
          }

          /*
            Prevent desktop-width elements from forcing
            horizontal scrolling.
          */
          .content-area [style*="min-width"],
          .content-area [style*="minWidth"] {
            min-width: 0 !important;
          }

          /*
            Flexible action areas can wrap properly.
          */
          .content-area [style*="display: flex"],
          .content-area [style*="display:flex"] {
            max-width: 100%;
          }

          .content-area button {
            max-width: 100%;
          }

          /*
            Tables can scroll independently instead of
            making the complete page wider.
          */
          .content-area table {
            width: 100%;
          }

          .content-area .table-container,
          .content-area [class*="table"] {
            max-width: 100%;
            overflow-x: auto;
          }

          /*
            Map remains usable on mobile.
          */
          .leaflet-container {
            width: 100% !important;
            max-width: 100% !important;
          }
        }

        /* =====================================================
           SMALL PHONES
        ===================================================== */

        @media (max-width: 480px) {
          .content-area {
            padding: 0.7rem;
          }

          /*
            Don't make normal text tiny.
            Keep readability on 360px phones.
          */
          .content-area h1 {
            line-height: 1.18;
          }

          .content-area h2,
          .content-area h3 {
            line-height: 1.25;
          }
        }

        /* =====================================================
           VERY SMALL PHONES
        ===================================================== */

        @media (max-width: 360px) {
          .content-area {
            padding: 0.6rem;
          }
        }
      `}</style>

      <div className="app-container">
        <Sidebar />

        <div className="main-viewport">
          <Header />

          <main className="content-area">
            {renderCurrentPage()}
          </main>
        </div>

        <HardwareSimulatorModal />
        <AddWearerModal />

        {/* =================================================
            GLOBAL EMERGENCY POPUP
        ================================================= */}

        {popupAlert && currentPage !== "emergency_alerts" && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 999999,

              background: "rgba(0, 0, 0, 0.76)",

              backdropFilter: "blur(7px)",
              WebkitBackdropFilter: "blur(7px)",

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              padding: "clamp(0.65rem, 3vw, 1rem)"
            }}
          >
            <div
              className="glass-panel"
              style={{
                width: "100%",
                maxWidth: "570px",
                maxHeight: "90dvh",

                overflowY: "auto",
                overflowX: "hidden",

                padding:
                  "clamp(1rem, 4vw, 1.6rem)",

                position: "relative",

                border:
                  "2px solid var(--accent-rose)",

                boxShadow:
                  "0 25px 80px rgba(0,0,0,0.6)"
              }}
            >
              {/* CLOSE */}

              <button
                type="button"
                onClick={handleDismissPopup}
                aria-label="Close emergency alert"
                style={{
                  position: "absolute",

                  right: "0.8rem",
                  top: "0.8rem",

                  width: "36px",
                  height: "36px",

                  borderRadius: "50%",

                  border:
                    "1px solid var(--border-color)",

                  background:
                    "rgba(255,255,255,0.07)",

                  color:
                    "var(--text-primary)",

                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",

                  cursor: "pointer",

                  zIndex: 2
                }}
              >
                <X size={18} />
              </button>

              {/* =================================================
                  POPUP HEADER
              ================================================= */}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",

                  gap: "0.8rem",

                  paddingRight: "2.5rem",

                  marginBottom: "1.2rem",

                  minWidth: 0
                }}
              >
                <div
                  className="animate-sos"
                  style={{
                    width: "52px",
                    height: "52px",

                    borderRadius: "14px",

                    background:
                      "var(--accent-rose)",

                    color: "#ffffff",

                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",

                    flexShrink: 0
                  }}
                >
                  <AlertTriangle size={27} />
                </div>

                <div
                  style={{
                    minWidth: 0
                  }}
                >
                  <p
                    style={{
                      margin: 0,

                      color:
                        "var(--accent-rose)",

                      fontSize: "0.7rem",

                      fontWeight: 800,

                      letterSpacing:
                        "0.08em",

                      textTransform:
                        "uppercase"
                    }}
                  >
                    Emergency Alert
                  </p>

                  <h2
                    style={{
                      fontSize:
                        "clamp(1.05rem, 4.5vw, 1.35rem)",

                      fontWeight: 800,

                      lineHeight: 1.2,

                      margin:
                        "0.15rem 0 0",

                      color:
                        "var(--text-primary)"
                    }}
                  >
                    Immediate Attention Required
                  </h2>
                </div>
              </div>

              {/* =================================================
                  ALERT MESSAGE
              ================================================= */}

              <div
                style={{
                  padding: "0.9rem 1rem",

                  background:
                    "rgba(244,63,94,0.10)",

                  border:
                    "1px solid rgba(244,63,94,0.25)",

                  borderRadius: "10px",

                  marginBottom: "1rem",

                  color:
                    "var(--text-primary)",

                  lineHeight: 1.5
                }}
              >
                <strong>
                  {popupAlert.message ||
                    "Emergency detected from the connected wristband."}
                </strong>
              </div>

              {/* =================================================
                  ALERT VALUES
              ================================================= */}

              <div className="emergency-popup-grid">
                <PopupItem
                  icon={
                    <Heart
                      size={17}
                      color="var(--accent-rose)"
                    />
                  }
                  label="Heart Rate"
                  value={
                    popupAlert.heartRate !=
                    null
                      ? `${popupAlert.heartRate} BPM`
                      : "Not Available"
                  }
                />

                <PopupItem
                  icon={
                    <Mic
                      size={17}
                      color="var(--accent-amber)"
                    />
                  }
                  label="Voice Status"
                  value={
                    popupAlert.voiceStatus ||
                    "Not Available"
                  }
                />

                <PopupItem
                  icon={
                    <MessageSquare
                      size={17}
                      color="var(--accent-cyan)"
                    />
                  }
                  label="Detected Speech"
                  value={
                    popupAlert.detectedSpeech ||
                    "Not Detected"
                  }
                />

                <PopupItem
                  icon={
                    <ShieldCheck
                      size={17}
                      color="var(--accent-indigo)"
                    />
                  }
                  label="Safe Zone"
                  value={
                    popupAlert.geofenceStatus ||
                    "Not Configured"
                  }
                />

                <PopupItem
                  icon={
                    <Battery
                      size={17}
                      color="var(--accent-emerald)"
                    />
                  }
                  label="Battery"
                  value={
                    popupAlert.battery != null
                      ? `${popupAlert.battery}%`
                      : "Not Available"
                  }
                />

                <PopupItem
                  icon={
                    <Radio
                      size={17}
                      color="var(--accent-cyan)"
                    />
                  }
                  label="GSM Network"
                  value={
                    popupAlert.gsmStatus ||
                    "Not Available"
                  }
                />

                <PopupItem
                  icon={
                    <MapPin
                      size={17}
                      color="var(--accent-cyan)"
                    />
                  }
                  label="GPS Location"
                  value={getGpsText(
                    popupAlert
                  )}
                />

                <PopupItem
                  icon={
                    <AlertTriangle
                      size={17}
                      color="var(--accent-rose)"
                    />
                  }
                  label="SOS Button"
                  value={
                    popupAlert.sos
                      ? "Pressed"
                      : "Not Pressed"
                  }
                />
              </div>

              <style>{`
                .emergency-popup-grid {
                  display: grid;
                  grid-template-columns:
                    repeat(2, minmax(0, 1fr));
                  gap: 0.7rem;
                }

                @media (max-width: 520px) {
                  .emergency-popup-grid {
                    grid-template-columns:
                      minmax(0, 1fr);
                  }
                }
              `}</style>

              {/* =================================================
                  ALERT TIME
              ================================================= */}

              <div
                style={{
                  marginTop: "1rem",

                  display: "flex",
                  alignItems: "center",

                  gap: "0.4rem",

                  color:
                    "var(--text-muted)",

                  fontSize: "0.76rem",

                  flexWrap: "wrap"
                }}
              >
                <Clock size={14} />

                {new Date(
                  popupAlert.createdAt ||
                    Date.now()
                ).toLocaleString()}
              </div>

              {/* =================================================
                  ACTION BUTTONS
              ================================================= */}

              <div className="emergency-popup-actions">
                <button
                  className="btn btn-primary"
                  onClick={handleViewEmergency}
                >
                  <AlertTriangle size={16} />

                  View Emergency
                </button>

                <button
                  className="btn btn-primary"
                  onClick={() => {
                    handleDismissPopup();
                    setCurrentPage("police_assistance");
                  }}
                >
                  <ShieldAlert size={16} />

                  Police Assistance
                </button>

                <button
                  className="btn btn-secondary"
                  onClick={handleDismissPopup}
                >
                  Close
                </button>
              </div>

              <style>{`
                .emergency-popup-actions {
                  display: flex;
                  gap: 0.75rem;
                  flex-wrap: wrap;
                  margin-top: 1.4rem;
                }

                @media (max-width: 520px) {
                  .emergency-popup-actions {
                    display: grid;
                    grid-template-columns:
                      minmax(0, 1fr);
                    gap: 0.6rem;
                  }

                  .emergency-popup-actions button {
                    width: 100%;
                    justify-content: center;
                  }
                }
              `}</style>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

/* =========================================================
   POPUP ITEM
========================================================= */

const PopupItem = ({
  icon,
  label,
  value
}) => {
  return (
    <div
      style={{
        padding: "0.75rem",

        borderRadius: "10px",

        background:
          "rgba(255,255,255,0.04)",

        border:
          "1px solid var(--border-color)",

        minWidth: 0
      }}
    >
      <div
        style={{
          display: "flex",

          alignItems: "center",

          gap: "0.4rem",

          fontSize: "0.68rem",

          color:
            "var(--text-muted)",

          marginBottom: "0.25rem"
        }}
      >
        {icon}

        {label}
      </div>

      <strong
        style={{
          display: "block",

          fontSize: "0.82rem",

          color:
            "var(--text-primary)",

          wordBreak: "break-word",

          lineHeight: 1.4
        }}
      >
        {value}
      </strong>
    </div>
  );
};