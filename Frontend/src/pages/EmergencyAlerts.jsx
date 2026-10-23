import React, { useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import { API } from "../services/api";

import {
  AlertTriangle,
  ShieldCheck,
  CheckCircle,
  MapPin,
  Heart,
  Mic,
  Clock,
  ShieldAlert,
  ArrowRight,
  Battery,
  Radio,
  MessageSquare,
  X,
  Siren
} from "lucide-react";

export const EmergencyAlerts = () => {
  const {
    activeAlerts,
    setActiveAlerts,
    switchWearer,
    setCurrentPage,
    refreshTelemetry
  } = useApp();

  /* =========================================================
     THEME
  ========================================================= */

  const C = {
    hero: "#35204F",
    heroDeep: "#29163D",

    purple: "#765493",
    purpleDark: "#54376E",
    purpleLight: "#E8DDEF",

    card: "var(--bg-card)",
    cardLight: "var(--bg-secondary)",
    inner: "var(--inner-card)",

    text: "var(--text-primary)",
    value: "var(--text-primary)",
    secondary: "var(--text-secondary)",

    border: "var(--border-color)",
    borderStrong: "var(--border-color)",

    red: "#F05C78",
    redDark: "#D94764",
    redBg: "rgba(240, 92, 120, 0.12)",
    redBorder: "rgba(240, 92, 120, 0.28)",

    green: "#2FAF8A",
    greenDark: "#23866A",
    greenBg: "rgba(47, 175, 138, 0.12)",
    greenBorder: "rgba(47, 175, 138, 0.28)",

    amber: "#E4A13A",
    amberDark: "#B97818",

    blue: "#5D8FC4",
    blueDark: "#4474A8"
  };

  const fontFamily =
    'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

  /* =========================================================
     STATE
  ========================================================= */

  const [resolvingAlertId, setResolvingAlertId] = useState(null);
  const [resolveError, setResolveError] = useState("");
  const [resolveSuccess, setResolveSuccess] = useState("");

  /* =========================================================
     RESOLVE ALERT
  ========================================================= */

  const resolveAlert = async (alertId) => {
    if (!alertId) {
      console.error("Resolve failed: Alert ID missing");
      setResolveError("Alert ID is missing.");
      return;
    }

    if (resolvingAlertId) {
      return;
    }

    try {
      setResolveError("");
      setResolvingAlertId(alertId);

      console.log("Resolving alert:", alertId);

      const response = await API.resolveAlert(alertId);

      console.log("Resolve API response:", response);

      const result = response?.data || response;

      if (result?.success === false) {
        throw new Error(
          result?.message || "Unable to resolve alert."
        );
      }

      /*
        Optimistically remove from local list so UI instantly updates.
      */
      if (typeof setActiveAlerts === "function") {
        setActiveAlerts((prev) =>
          Array.isArray(prev) ? prev.filter((a) => a._id !== alertId) : []
        );
      }

      setResolveSuccess("Alert marked as resolved & wearer confirmed safe.");
      setTimeout(() => setResolveSuccess(""), 4500);

      /*
        Refresh global data so resolved alert is synced across dashboard and history.
      */
      if (typeof refreshTelemetry === "function") {
        await refreshTelemetry();
      }

      console.log("Alert resolved successfully:", alertId);
    } catch (error) {
      console.error("Failed to resolve alert:", error);

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to resolve alert. Please try again.";

      setResolveError(message);
    } finally {
      setResolvingAlertId(null);
    }
  };

  /* =========================================================
     GPS
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
     BUTTON STYLES
  ========================================================= */

  const policeButton = {
    border: "none",
    outline: "none",

    background:
      `linear-gradient(135deg, ${C.purple}, ${C.purpleDark})`,

    color: "#FFFFFF",

    padding: "0.68rem 1rem",
    borderRadius: "8px",

    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",

    gap: "0.42rem",

    fontSize: "0.78rem",
    fontWeight: 700,
    fontFamily,

    cursor: "pointer",

    boxShadow:
      "0 3px 9px rgba(84,55,110,0.20)"
  };

  const resolveButton = {
    border: `1px solid ${C.greenDark}`,
    outline: "none",

    background:
      `linear-gradient(135deg, ${C.green}, ${C.greenDark})`,

    color: "#FFFFFF",

    padding: "0.68rem 1rem",
    borderRadius: "8px",

    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",

    gap: "0.42rem",

    fontSize: "0.78rem",
    fontWeight: 700,
    fontFamily,

    cursor: "pointer",

    boxShadow:
      "0 3px 9px rgba(47,175,138,0.18)"
  };

  const secondaryButton = {
    border: `1px solid ${C.borderStrong}`,
    outline: "none",

    background: "var(--inner-card)",
    color: "var(--text-primary)",

    padding: "0.65rem 0.95rem",
    borderRadius: "8px",

    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",

    gap: "0.42rem",

    fontSize: "0.77rem",
    fontWeight: 700,
    fontFamily,

    cursor: "pointer"
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.2rem",
        fontFamily,
        color: C.text
      }}
    >
      {/* =====================================================
          TOP STATUS BANNER
      ===================================================== */}

      <section
        style={{
          padding: "1.3rem 1.4rem",

          borderRadius: "14px",

          background:
            activeAlerts.length > 0
              ? `linear-gradient(
                  135deg,
                  ${C.hero} 0%,
                  ${C.heroDeep} 100%
                )`
              : `linear-gradient(
                  135deg,
                  #355F50 0%,
                  #25473C 100%
                )`,

          border:
            "1px solid rgba(255,255,255,0.08)",

          boxShadow:
            "0 6px 18px rgba(40,20,60,0.14)",

          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",

          flexWrap: "wrap",
          gap: "1rem",

          position: "relative",
          overflow: "hidden"
        }}
      >
        <div
          style={{
            position: "absolute",

            width: "190px",
            height: "190px",

            borderRadius: "50%",

            background:
              "rgba(255,255,255,0.025)",

            right: "-50px",
            top: "-95px",

            pointerEvents: "none"
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",

            gap: "1rem",

            position: "relative"
          }}
        >
          <div
            className={
              activeAlerts.length > 0
                ? "animate-sos"
                : ""
            }
            style={{
              width: "52px",
              height: "52px",

              borderRadius: "13px",

              background:
                activeAlerts.length > 0
                  ? C.red
                  : C.green,

              color: "#FFFFFF",

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              boxShadow:
                activeAlerts.length > 0
                  ? "0 4px 12px rgba(240,92,120,0.25)"
                  : "0 4px 12px rgba(47,175,138,0.22)"
            }}
          >
            {activeAlerts.length > 0 ? (
              <AlertTriangle size={26} />
            ) : (
              <ShieldCheck size={26} />
            )}
          </div>

          <div>
            <h2
              style={{
                margin: 0,

                fontSize: "1.12rem",
                fontWeight: 800,

                color: "#FFFFFF",

                letterSpacing: "-0.015em"
              }}
            >
              {activeAlerts.length > 0
                ? `${activeAlerts.length} Active Emergency Alert${
                    activeAlerts.length === 1
                      ? ""
                      : "s"
                  }`
                : "No Active Emergency Alerts"}
            </h2>

            <p
              style={{
                margin: "0.3rem 0 0",

                fontSize: "0.78rem",
                fontWeight: 500,

                color:
                  "rgba(255,255,255,0.82)",

                lineHeight: 1.45
              }}
            >
              {activeAlerts.length > 0
                ? "Immediate attention required. Check the wearer and respond to the emergency."
                : "No emergency is currently active."}
            </p>
          </div>
        </div>

        {activeAlerts.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (activeAlerts[0]?.wearerId && typeof switchWearer === "function") {
                switchWearer(activeAlerts[0].wearerId);
              }
              setCurrentPage("police_assistance");
            }}
            style={{
              ...policeButton,

              position: "relative",

              background:
                "rgba(255,255,255,0.14)",

              border:
                "1px solid rgba(255,255,255,0.20)",

              boxShadow: "none"
            }}
          >
            <ShieldAlert size={16} />
            Police Assistance
          </button>
        )}
      </section>

      {/* =====================================================
          RESOLVE SUCCESS / ERROR
      ===================================================== */}

      {resolveSuccess && (
        <div
          style={{
            padding: "0.85rem 1.1rem",
            background: C.greenBg,
            border: `1px solid ${C.greenBorder}`,
            borderRadius: "10px",
            color: C.greenDark,
            fontSize: "0.88rem",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "0.6rem"
          }}
        >
          <CheckCircle size={18} />
          {resolveSuccess}
        </div>
      )}

      {resolveError && (
        <div
          style={{
            padding: "0.8rem 1rem",

            background: C.redBg,
            border: `1px solid ${C.redBorder}`,

            borderRadius: "9px",

            color: C.redDark,

            fontSize: "0.8rem",
            fontWeight: 600
          }}
        >
          {resolveError}
        </div>
      )}

      {/* =====================================================
          NO ACTIVE ALERTS
      ===================================================== */}

      {activeAlerts.length === 0 ? (
        <section
          style={{
            padding: "3.5rem 2rem",

            background: C.card,

            border: `1px solid ${C.border}`,
            borderRadius: "14px",

            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",

            textAlign: "center",

            boxShadow:
              "0 4px 12px rgba(48,32,63,0.06)"
          }}
        >
          <div
            style={{
              width: "66px",
              height: "66px",

              borderRadius: "16px",

              background: C.greenBg,
              color: C.greenDark,

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              marginBottom: "1rem"
            }}
          >
            <ShieldCheck size={34} />
          </div>

          <h3
            style={{
              margin: 0,

              fontSize: "1.08rem",
              fontWeight: 800,

              color: C.text
            }}
          >
            No Pending Emergencies
          </h3>

          <p
            style={{
              fontSize: "0.8rem",
              fontWeight: 500,

              color: C.secondary,

              maxWidth: "440px",

              margin: "0.45rem 0 0",

              lineHeight: 1.5
            }}
          >
            Emergency alerts from the connected wristband
            will appear here.
          </p>

          <button
            type="button"
            onClick={() =>
              setCurrentPage(
                "alert_history"
              )
            }
            style={{
              ...secondaryButton,
              marginTop: "1.25rem"
            }}
          >
            Browse Alert History
            <ArrowRight size={15} />
          </button>
        </section>
      ) : (
        /* =====================================================
           ACTIVE ALERT CARDS
        ===================================================== */

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem"
          }}
        >
          {activeAlerts.map((alert) => {
            const isResolving =
              resolvingAlertId === alert._id;

            return (
              <section
                key={alert._id}
                style={{
                  padding: "1.25rem",

                  background: C.card,

                  border:
                    `1px solid ${C.border}`,

                  borderLeft:
                    `3px solid ${C.red}`,

                  borderRadius: "13px",

                  display: "flex",
                  flexDirection: "column",

                  gap: "1rem",

                  boxShadow:
                    "0 4px 12px rgba(48,32,63,0.07)"
                }}
              >
                {/* ALERT TOP */}

                <div
                  style={{
                    display: "flex",

                    justifyContent:
                      "space-between",

                    alignItems:
                      "flex-start",

                    flexWrap: "wrap",

                    gap: "0.9rem"
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",

                        gap: "0.55rem",

                        flexWrap: "wrap"
                      }}
                    >
                      <span
                        className="animate-sos"
                        style={{
                          display:
                            "inline-flex",

                          alignItems:
                            "center",

                          justifyContent:
                            "center",

                          padding:
                            "0.24rem 0.52rem",

                          borderRadius:
                            "999px",

                          background:
                            C.redBg,

                          border:
                            `1px solid ${C.redBorder}`,

                          color:
                            C.redDark,

                          fontSize:
                            "0.63rem",

                          fontWeight: 800,

                          textTransform:
                            "uppercase"
                        }}
                      >
                        {alert.type ||
                          alert.triggeredBy ||
                          "Emergency"}
                      </span>

                      <span
                        style={{
                          fontSize:
                            "0.75rem",

                          fontWeight: 500,

                          color:
                            C.secondary,

                          display: "flex",

                          alignItems:
                            "center",

                          gap: "0.32rem"
                        }}
                      >
                        <Clock size={14} />

                        {new Date(
                          alert.createdAt ||
                            Date.now()
                        ).toLocaleString()}
                      </span>
                    </div>

                    <h3
                      style={{
                        fontSize: "1rem",
                        fontWeight: 800,

                        color: C.text,

                        margin:
                          "0.5rem 0 0",

                        lineHeight: 1.4
                      }}
                    >
                      {alert.message ||
                        "Emergency detected from wristband"}
                    </h3>
                  </div>

                  {/* WORKING RESOLVE BUTTON */}

                  <button
                    type="button"
                    onClick={() =>
                      resolveAlert(alert._id)
                    }
                    disabled={isResolving}
                    style={{
                      ...resolveButton,

                      opacity:
                        isResolving
                          ? 0.65
                          : 1,

                      cursor:
                        isResolving
                          ? "not-allowed"
                          : "pointer"
                    }}
                  >
                    <CheckCircle size={16} />

                    {isResolving
                      ? "Resolving..."
                      : "Mark as Resolved & Safe"}
                  </button>
                </div>

                {/* SENSOR DATA */}

                <div
                  style={{
                    display: "grid",

                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(185px, 1fr))",

                    gap: "0.7rem",

                    padding: "0.95rem",

                    background:
                      "var(--inner-card)",

                    borderRadius: "10px",

                    border:
                      `1px solid ${C.border}`
                  }}
                >
                  <AlertValue
                    icon={
                      <Heart
                        size={17}
                        color={C.redDark}
                      />
                    }
                    label="Heart Rate"
                    value={
                      alert.heartRate != null
                        ? `${alert.heartRate} BPM`
                        : "Not Available"
                    }
                    colors={C}
                  />

                  <AlertValue
                    icon={
                      <MapPin
                        size={17}
                        color={C.blueDark}
                      />
                    }
                    label="GPS"
                    value={getGpsText(alert)}
                    colors={C}
                  />

                  <AlertValue
                    icon={
                      <Mic
                        size={17}
                        color={C.amberDark}
                      />
                    }
                    label="Voice"
                    value={
                      alert.voiceStatus ||
                      "Not Available"
                    }
                    colors={C}
                  />

                  <AlertValue
                    icon={
                      <MessageSquare
                        size={17}
                        color={C.purple}
                      />
                    }
                    label="Detected Speech"
                    value={
                      alert.detectedSpeech ||
                      "Not Detected"
                    }
                    colors={C}
                  />

                  <AlertValue
                    icon={
                      <ShieldCheck
                        size={17}
                        color={C.purple}
                      />
                    }
                    label="Safe Zone"
                    value={
                      alert.geofenceStatus ||
                      "Not Configured"
                    }
                    colors={C}
                  />

                  <AlertValue
                    icon={
                      <Battery
                        size={17}
                        color={C.greenDark}
                      />
                    }
                    label="Battery"
                    value={
                      alert.battery != null
                        ? `${alert.battery}%`
                        : "Not Available"
                    }
                    colors={C}
                  />

                  <AlertValue
                    icon={
                      <Radio
                        size={17}
                        color={C.greenDark}
                      />
                    }
                    label="GSM"
                    value={
                      alert.gsmStatus ||
                      "Not Available"
                    }
                    colors={C}
                  />

                  <AlertValue
                    icon={
                      <AlertTriangle
                        size={17}
                        color={C.redDark}
                      />
                    }
                    label="SOS"
                    value={
                      alert.sos
                        ? "Pressed"
                        : "Not Pressed"
                    }
                    colors={C}
                  />
                </div>

                {/* BOTTOM ACTION */}

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "flex-end"
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (alert.wearerId && typeof switchWearer === "function") {
                        switchWearer(alert.wearerId);
                      }
                      setCurrentPage("police_assistance");
                    }}
                    style={{
                      ...policeButton
                    }}
                  >
                    <ShieldAlert size={16} />
                    Police Assistance
                  </button>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* =========================================================
   POPUP VALUE
========================================================= */

const PopupValue = ({
  icon,
  label,
  value,
  colors
}) => (
  <div
    style={{
      padding: "0.8rem",

      background:
        "var(--bg-secondary)",

      border:
        `1px solid ${colors.border}`,

      borderRadius: "8px"
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",

        gap: "0.38rem",

        fontSize: "0.72rem",
        fontWeight: 600,

        color:
          colors.secondary,

        marginBottom: "0.28rem"
      }}
    >
      {icon}
      {label}
    </div>

    <strong
      style={{
        display: "block",

        fontSize: "0.82rem",
        fontWeight: 700,

        color: colors.text,

        wordBreak: "break-word",
        lineHeight: 1.4
      }}
    >
      {value}
    </strong>
  </div>
);

/* =========================================================
   ALERT VALUE
========================================================= */

const AlertValue = ({
  icon,
  label,
  value,
  colors
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",

      gap: "0.5rem",

      minHeight: "32px"
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        flexShrink: 0
      }}
    >
      {icon}
    </div>

    <span
      style={{
        fontSize: "0.78rem",

        color:
          colors.secondary,

        fontWeight: 500,
        lineHeight: 1.4
      }}
    >
      {label}:{" "}

      <strong
        style={{
          color:
            colors.text,

          fontWeight: 700
        }}
      >
        {value}
      </strong>
    </span>
  </div>
);