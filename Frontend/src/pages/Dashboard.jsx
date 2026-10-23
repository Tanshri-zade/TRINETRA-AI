import React from "react";
import { useApp } from "../context/AppContext";
import {
  ShieldCheck,
  AlertTriangle,
  Heart,
  Battery,
  MapPin,
  Mic,
  Cpu,
  ArrowUpRight,
  PhoneCall,
  Baby,
  UserCheck,
  UserPlus,
  Shield,
  Navigation,
  Radio,
  Wifi,
  Volume2
} from "lucide-react";
import { API } from "../services/api";

export const Dashboard = () => {
  const {
    selectedWearer,
    wearers,
    switchWearer,
    deviceStatus,
    monitoring,
    location,
    activeAlerts,
    isHardwareOnline,
    setCurrentPage,
    setIsAddWearerOpen,
    refreshTelemetry
  } = useApp();

  /* ================= LIVE VALUES ================= */

  const isAlertActive = activeAlerts.length > 0;

  const hr =
    monitoring?.heartRate ||
    deviceStatus?.heartRate ||
    null;

  const battery =
    deviceStatus?.battery ?? "--";

  const geofenceStatus =
    monitoring?.geofenceStatus ||
    "Not Available";

  const voiceStatus =
    monitoring?.voiceStatus ||
    "Normal";

  const micStatus =
    deviceStatus?.microphoneStatus ||
    "Connected";

  const gpsFix =
    deviceStatus?.gpsStatus ||
    (location?.latitude
      ? "Connected"
      : "Searching");

  const gsmStatus =
    deviceStatus?.gsmStatus ||
    monitoring?.gsmStatus ||
    "Not Available";

  const wearerType =
    selectedWearer?.type || "child";

  const isChild =
    wearerType === "child";

  const detectedSpeech =
    monitoring?.detectedSpeech ||
    "No distress speech detected";

  /* ================= ALERT ================= */

  const resolveAlert = async (alertId) => {
    try {
      await API.resolveAlert(alertId);
      refreshTelemetry();
    } catch (error) {
      console.error(
        "Failed to resolve alert:",
        error
      );
    }
  };

  /* ================= THEME ================= */

  const C = {
    hero: "#35204F",
    heroDeep: "#29163D",

    purple: "#765493",
    purpleDark: "#54376E",
    purpleDeep: "#392447",
    purpleLight: "#E8DDEF",

    card: "#E9DFF0",
    cardLight: "#F3EDF6",
    inner: "#FFFFFF",

    text: "#30223D",
    value: "#40304E",
    secondary: "#655270",
    muted: "#796982",
    faint: "#94879B",

    border: "#D2C4DC",
    borderStrong: "#BFAECC",

    red: "#F05C78",
    redDark: "#D94764",
    redBg: "#FFE8ED",
    redBorder: "#FFC9D4",

    green: "#2FAF8A",
    greenDark: "#23866A",
    greenBg: "#E2F7F0",
    greenBorder: "#B9EAD9",

    amber: "#E4A13A",
    amberDark: "#B97818",
    amberBg: "#FFF2DA",
    amberBorder: "#F1D39A",

    blue: "#5D8FC4",
    blueDark: "#4474A8",
    blueBg: "#EAF3FB"
  };

  const dashboardFont =
    'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

  /* ================= TYPOGRAPHY ================= */

  const sectionHeading = {
    margin: 0,
    fontSize: "1rem",
    fontWeight: 700,
    color: C.text,
    lineHeight: 1.3
  };

  const sectionDescription = {
    margin: "0.15rem 0 0",
    fontSize: "0.65rem",
    fontWeight: 500,
    color: C.secondary,
    lineHeight: 1.4
  };

  const labelStyle = {
    fontSize: "0.58rem",
    fontWeight: 600,
    color: C.secondary,
    letterSpacing: "0.03em",
    textTransform: "uppercase"
  };

  const cardHeading = {
    margin: "0.16rem 0 0",
    fontSize: "0.82rem",
    fontWeight: 700,
    color: C.text,
    lineHeight: 1.3
  };

  const mainValue = {
    display: "block",
    marginTop: "0.72rem",
    fontSize: "1.35rem",
    lineHeight: 1.15,
    fontWeight: 700,
    color: C.value
  };

  const extraText = {
    margin: "0.4rem 0 0",
    fontSize: "0.63rem",
    fontWeight: 500,
    lineHeight: 1.4,
    color: C.secondary
  };

  const cardStyle = {
    padding: "1.05rem",
    borderRadius: "13px",
    background: C.card,
    border: `1px solid ${C.border}`,
    boxShadow:
      "0 3px 10px rgba(48,32,63,0.06)"
  };

  const iconBox = (background = C.purpleLight) => ({
    width: "38px",
    height: "38px",
    borderRadius: "10px",
    background,
    color: C.purple,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  });

  const secondaryButton = {
    padding: "0.45rem 0.68rem",
    borderRadius: "8px",
    border: `1px solid ${C.borderStrong}`,
    background: C.inner,
    color: C.purpleDark,
    fontSize: "0.65rem",
    fontWeight: 700,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.3rem",
    fontFamily: dashboardFont
  };

  const statusColor = (value) => {
    const text =
      String(value || "").toLowerCase();

    if (
      text.includes("distress") ||
      text.includes("outside") ||
      text.includes("emergency") ||
      text.includes("danger") ||
      text.includes("abnormal")
    ) {
      return C.redDark;
    }

    if (
      text.includes("search") ||
      text.includes("waiting") ||
      text.includes("not available") ||
      text.includes("unavailable") ||
      text.includes("standby") ||
      text.includes("disconnected")
    ) {
      return C.amberDark;
    }

    if (
      text.includes("connected") ||
      text.includes("inside") ||
      text.includes("normal") ||
      text.includes("safe") ||
      text.includes("active")
    ) {
      return C.greenDark;
    }

    return C.value;
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.2rem",
        fontFamily: dashboardFont,
        color: C.text
      }}
    >

      {/* ================= PROFILE ================= */}

      <section
        style={{
          padding: "1.05rem 1.2rem",
          borderRadius: "14px",
          background: `linear-gradient(
            135deg,
            ${C.hero} 0%,
            ${C.heroDeep} 100%
          )`,
          border:
            "1px solid rgba(255,255,255,0.10)",
          boxShadow:
            "0 6px 18px rgba(40,20,60,0.15)",
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
            right: "-60px",
            top: "-95px"
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            flexWrap: "wrap",
            position: "relative"
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem"
            }}
          >
            <div
              style={{
                width: "45px",
                height: "45px",
                borderRadius: "11px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                background:
                  "rgba(255,255,255,0.12)",
                border:
                  "1px solid rgba(255,255,255,0.16)"
              }}
            >
              {isAlertActive ? (
                <AlertTriangle size={21} />
              ) : isChild ? (
                <Baby size={22} />
              ) : (
                <UserCheck size={22} />
              )}
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  flexWrap: "wrap"
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: "1.04rem",
                    fontWeight: 700,
                    color: "#FFFFFF"
                  }}
                >
                  {selectedWearer?.name ||
                    "Wearer Profile"}
                </h2>

                <span
                  style={{
                    padding: "0.18rem 0.46rem",
                    borderRadius: "999px",
                    fontSize: "0.57rem",
                    fontWeight: 700,
                    color: "#FFFFFF",
                    background:
                      "rgba(255,255,255,0.11)",
                    border:
                      "1px solid rgba(255,255,255,0.17)"
                  }}
                >
                  {isChild ? "CHILD" : "WOMAN"}
                </span>

                <span
                  style={{
                    padding: "0.18rem 0.46rem",
                    borderRadius: "999px",
                    fontSize: "0.57rem",
                    fontWeight: 700,
                    color: "#FFFFFF",
                    background: isAlertActive
                      ? C.red
                      : "rgba(255,255,255,0.11)",
                    border: isAlertActive
                      ? `1px solid ${C.red}`
                      : "1px solid rgba(255,255,255,0.17)"
                  }}
                >
                  {isAlertActive
                    ? "EMERGENCY ACTIVE"
                    : "SYSTEM SECURE"}
                </span>
              </div>

              <p
                style={{
                  margin: "0.24rem 0 0",
                  fontSize: "0.67rem",
                  fontWeight: 500,
                  color:
                    "rgba(255,255,255,0.82)"
                }}
              >
                {isChild
                  ? "Child Safety Profile • Live monitoring active"
                  : "Women Safety Profile • Live monitoring active"}
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              setCurrentPage("live_location")
            }
            style={{
              ...secondaryButton,
              border:
                "1px solid rgba(255,255,255,0.20)",
              background:
                "rgba(255,255,255,0.13)",
              color: "#FFFFFF"
            }}
          >
            <MapPin size={13} />
            Live Location
          </button>
        </div>

        {/* QUICK SWITCH */}

        <div
          style={{
            marginTop: "0.8rem",
            paddingTop: "0.7rem",
            borderTop:
              "1px solid rgba(255,255,255,0.13)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.7rem",
            flexWrap: "wrap",
            position: "relative"
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              flexWrap: "wrap"
            }}
          >
            <span
              style={{
                fontSize: "0.58rem",
                fontWeight: 600,
                color:
                  "rgba(255,255,255,0.78)",
                letterSpacing: "0.04em"
              }}
            >
              QUICK SWITCH
            </span>

            {wearers.map((wearer) => {
              const selected =
                selectedWearer?._id ===
                wearer._id;

              return (
                <button
                  key={wearer._id}
                  onClick={() =>
                    switchWearer(wearer._id)
                  }
                  style={{
                    padding: "0.3rem 0.56rem",
                    borderRadius: "999px",
                    border: selected
                      ? "1px solid rgba(255,255,255,0.38)"
                      : "1px solid rgba(255,255,255,0.16)",
                    background: selected
                      ? "rgba(255,255,255,0.17)"
                      : "rgba(255,255,255,0.07)",
                    color: "#FFFFFF",
                    cursor: "pointer",
                    fontSize: "0.64rem",
                    fontWeight: selected
                      ? 700
                      : 500,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.28rem",
                    fontFamily: dashboardFont
                  }}
                >
                  {wearer.type === "child" ? (
                    <Baby size={10} />
                  ) : (
                    <UserCheck size={10} />
                  )}

                  {wearer.name}
                </button>
              );
            })}
          </div>

          <button
            onClick={() =>
              setIsAddWearerOpen(true)
            }
            style={{
              padding: "0.37rem 0.66rem",
              borderRadius: "999px",
              border:
                "1px solid rgba(255,255,255,0.20)",
              background:
                "rgba(255,255,255,0.11)",
              color: "#FFFFFF",
              fontSize: "0.64rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
              fontFamily: dashboardFont
            }}
          >
            <UserPlus size={12} />
            Register New Wearer
          </button>
        </div>
      </section>

      {/* ================= REAL TIME ================= */}

      <section>
        <div style={{ marginBottom: "0.72rem" }}>
          <h2 style={sectionHeading}>
            Real-Time Monitoring
          </h2>

          <p style={sectionDescription}>
            Live safety status from the selected wristband
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(210px,1fr))",
            gap: "0.85rem"
          }}
        >

          {/* HEART RATE */}

          <div style={cardStyle}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between"
              }}
            >
              <div>
                <span style={labelStyle}>
                  HEART RATE
                </span>

                <h3 style={cardHeading}>
                  Pulse Rate
                </h3>
              </div>

              <div style={iconBox("#E3D4EC")}>
                <Heart
                  size={18}
                  className={
                    hr ? "animate-heart" : ""
                  }
                />
              </div>
            </div>

            <div
              style={{
                marginTop: "0.75rem",
                display: "flex",
                alignItems: "baseline"
              }}
            >
              <strong
                style={{
                  fontSize: "1.55rem",
                  lineHeight: 1,
                  fontWeight: 700,
                  color:
                    hr && (hr > 120 || hr < 50)
                      ? C.redDark
                      : C.purpleDark
                }}
              >
                {hr || "--"}
              </strong>

              <span
                style={{
                  fontSize: "0.66rem",
                  fontWeight: 500,
                  color: C.secondary,
                  marginLeft: "0.25rem"
                }}
              >
                BPM
              </span>
            </div>

            <p
              style={{
                ...extraText,
                color: !hr
                  ? C.secondary
                  : hr > 120 || hr < 50
                    ? C.redDark
                    : C.greenDark
              }}
            >
              {!hr
                ? "Waiting for sensor data"
                : hr > 120
                  ? "High pulse detected"
                  : hr < 50
                    ? "Low pulse detected"
                    : "Heart rate normal"}
            </p>
          </div>

          {/* GPS */}

          <div style={cardStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start"
              }}
            >
              <div>
                <span style={labelStyle}>
                  LIVE LOCATION
                </span>

                <h3 style={cardHeading}>
                  GPS Tracking
                </h3>
              </div>

              <div style={iconBox("#DDE5F1")}>
                <Navigation size={18} />
              </div>
            </div>

            <strong
              style={{
                ...mainValue,
                color: statusColor(gpsFix)
              }}
            >
              {gpsFix}
            </strong>

            <div
              style={{
                marginTop: "0.45rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "0.5rem"
              }}
            >
              <span
                style={{
                  fontSize: "0.66rem",
                  fontWeight: 500,
                  color: C.secondary,
                  overflowWrap: "anywhere"
                }}
              >
                {location?.latitude
                  ? `${Number(
                      location.latitude
                    ).toFixed(4)}, ${Number(
                      location.longitude
                    ).toFixed(4)}`
                  : "Location unavailable"}
              </span>

              <button
                onClick={() =>
                  setCurrentPage(
                    "live_location"
                  )
                }
                style={{
                  border: "none",
                  background: "transparent",
                  color: C.blueDark,
                  cursor: "pointer",
                  fontSize: "0.66rem",
                  fontWeight: 700,
                  fontFamily: dashboardFont
                }}
              >
                View
              </button>
            </div>
          </div>

          {/* GSM */}

          <div style={cardStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start"
              }}
            >
              <div>
                <span style={labelStyle}>
                  CONNECTION
                </span>

                <h3 style={cardHeading}>
                  GSM Network
                </h3>
              </div>

              <div style={iconBox("#DFD7EA")}>
                <Wifi size={18} />
              </div>
            </div>

            <strong
              style={{
                ...mainValue,
                color: statusColor(gsmStatus)
              }}
            >
              {gsmStatus}
            </strong>

            <p
              style={{
                ...extraText,
                color: isHardwareOnline
                  ? C.greenDark
                  : C.amberDark
              }}
            >
              {isHardwareOnline
                ? "Wristband connected"
                : "Waiting for device"}
            </p>
          </div>

          {/* BATTERY */}

          <div style={cardStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start"
              }}
            >
              <div>
                <span style={labelStyle}>
                  WRISTBAND
                </span>

                <h3 style={cardHeading}>
                  Battery Status
                </h3>
              </div>

              <div style={iconBox("#E5D9ED")}>
                <Battery size={18} />
              </div>
            </div>

            <div
              style={{
                marginTop: "0.75rem",
                display: "flex",
                alignItems: "center",
                gap: "0.45rem"
              }}
            >
              <strong
                style={{
                  fontSize: "1.55rem",
                  lineHeight: 1,
                  fontWeight: 700,
                  color:
                    battery === "--"
                      ? C.secondary
                      : Number(battery) <= 20
                        ? C.redDark
                        : Number(battery) <= 50
                          ? C.amberDark
                          : C.greenDark
                }}
              >
                {battery}
                {battery !== "--" ? "%" : ""}
              </strong>

              <span
                style={{
                  padding: "0.18rem 0.45rem",
                  borderRadius: "999px",
                  fontSize: "0.55rem",
                  fontWeight: 700,
                  background: isHardwareOnline
                    ? C.greenBg
                    : C.amberBg,
                  color: isHardwareOnline
                    ? C.greenDark
                    : C.amberDark,
                  border: isHardwareOnline
                    ? `1px solid ${C.greenBorder}`
                    : `1px solid ${C.amberBorder}`
                }}
              >
                {isHardwareOnline
                  ? "ONLINE"
                  : "STANDBY"}
              </span>
            </div>

            <p
              style={{
                ...extraText,
                color: C.secondary
              }}
            >
              {deviceStatus?.deviceId
                ? `Device: ${deviceStatus.deviceId}`
                : "Device information unavailable"}
            </p>
          </div>
        </div>
      </section>

      {/* ================= SAFETY + GUARDIAN ================= */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(320px,1fr))",
          gap: "1rem"
        }}
      >

        {/* SAFETY */}

        <section
          style={{
            ...cardStyle,
            padding: "1.15rem"
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.55rem",
              marginBottom: "0.9rem"
            }}
          >
            <Shield
              size={18}
              color={C.purpleDark}
            />

            <div>
              <h3 style={sectionHeading}>
                Safety Monitoring
              </h3>

              <p style={sectionDescription}>
                {isChild
                  ? "Child safety features"
                  : "Women safety features"}
              </p>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.55rem"
            }}
          >
            <StatusRow
              title="GPS Tracking"
              value={gpsFix}
              colors={C}
            />

            {isChild && (
              <StatusRow
                title="Safe Zone"
                value={geofenceStatus}
                colors={C}
              />
            )}

            <StatusRow
              title={
                isChild
                  ? "Crying / Distress Detection"
                  : "Voice Distress Detection"
              }
              value={voiceStatus}
              colors={C}
            />

            <StatusRow
              title="Microphone"
              value={micStatus}
              colors={C}
            />
          </div>

          <button
            onClick={() =>
              setCurrentPage(
                isChild
                  ? "safe_zone"
                  : "live_location"
              )
            }
            style={{
              ...secondaryButton,
              width: "100%",
              marginTop: "0.8rem"
            }}
          >
            <Navigation size={13} />

            {isChild
              ? "Open Safe Zone"
              : "Open Live Location"}
          </button>
        </section>

        {/* GUARDIAN */}

        <section
          style={{
            ...cardStyle,
            padding: "1.15rem"
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.55rem",
              marginBottom: "0.9rem"
            }}
          >
            <ShieldCheck
              size={18}
              color={C.purpleDark}
            />

            <div>
              <h3 style={sectionHeading}>
                Guardian Control
              </h3>

              <p style={sectionDescription}>
                Emergency response and quick actions
              </p>
            </div>
          </div>

          <div
            style={{
              padding: "0.7rem 0.75rem",
              borderRadius: "8px",
              background: C.inner,
              border: `1px solid ${C.border}`,
              marginBottom: "0.7rem"
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "0.5rem"
              }}
            >
              <span
                style={{
                  fontSize: "0.69rem",
                  fontWeight: 600,
                  color: C.text
                }}
              >
                Alert Status
              </span>

              <span
                style={{
                  padding: "0.2rem 0.5rem",
                  borderRadius: "999px",
                  fontSize: "0.58rem",
                  fontWeight: 700,
                  background: isAlertActive
                    ? C.redBg
                    : C.greenBg,
                  color: isAlertActive
                    ? C.redDark
                    : C.greenDark,
                  border: isAlertActive
                    ? `1px solid ${C.redBorder}`
                    : `1px solid ${C.greenBorder}`
                }}
              >
                {isAlertActive
                  ? `${activeAlerts.length} Active`
                  : "Normal"}
              </span>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2,1fr)",
              gap: "0.55rem"
            }}
          >
            <ActionButton
              icon={
                <AlertTriangle size={16} />
              }
              title="Emergency Alerts"
              text="View alerts"
              onClick={() =>
                setCurrentPage(
                  "emergency_alerts"
                )
              }
              colors={C}
              accent="danger"
            />

            <ActionButton
              icon={<PhoneCall size={16} />}
              title="Police Assistance"
              text="Send assistance"
              onClick={() =>
                setCurrentPage(
                  "police_assistance"
                )
              }
              colors={C}
              accent="purple"
            />

            <ActionButton
              icon={<MapPin size={16} />}
              title="Live Location"
              text="Track wearer"
              onClick={() =>
                setCurrentPage(
                  "live_location"
                )
              }
              colors={C}
              accent="blue"
            />

            <ActionButton
              icon={<Cpu size={16} />}
              title="Device Status"
              text="Check wristband"
              onClick={() =>
                setCurrentPage(
                  "device_status"
                )
              }
              colors={C}
              accent="purple"
            />
          </div>
        </section>
      </div>

      {/* ================= VOICE ================= */}

      <section
        style={{
          ...cardStyle,
          padding: "1.15rem"
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
            flexWrap: "wrap"
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem"
            }}
          >
            <div style={iconBox("#E2D7EA")}>
              <Mic size={18} />
            </div>

            <div>
              <h3 style={sectionHeading}>
                Real-Time Voice Safety Monitoring
              </h3>

              <p style={sectionDescription}>
                Microphone and distress detection status
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              setCurrentPage(
                "voice_monitoring"
              )
            }
            style={secondaryButton}
          >
            Open Voice Monitoring
            <ArrowUpRight size={12} />
          </button>
        </div>

        <div
          style={{
            marginTop: "0.9rem",
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(170px,1fr))",
            gap: "0.6rem"
          }}
        >
          <InfoBox
            icon={<Volume2 size={15} />}
            label="Voice Status"
            value={voiceStatus}
            colors={C}
          />

          <InfoBox
            icon={<Mic size={15} />}
            label="Microphone"
            value={micStatus}
            colors={C}
          />

          <InfoBox
            icon={<Radio size={15} />}
            label="Detected Speech"
            value={detectedSpeech}
            colors={C}
          />

          <InfoBox
            icon={<ShieldCheck size={15} />}
            label="Detection Result"
            value={
              String(voiceStatus)
                .toLowerCase()
                .includes("distress")
                ? "Attention Required"
                : "No Distress Detected"
            }
            colors={C}
          />
        </div>
      </section>

      {/* ================= ACTIVE ALERTS ================= */}

      <section
        style={{
          ...cardStyle,
          padding: "1.15rem"
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
            marginBottom: "0.8rem",
            flexWrap: "wrap"
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.55rem"
            }}
          >
            <AlertTriangle
              size={18}
              color={
                isAlertActive
                  ? C.redDark
                  : C.purpleDark
              }
            />

            <div>
              <h3 style={sectionHeading}>
                Active Emergency Alerts
              </h3>

              <p style={sectionDescription}>
                Current emergency events for the selected wearer
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              setCurrentPage(
                "emergency_alerts"
              )
            }
            style={secondaryButton}
          >
            View All
            <ArrowUpRight size={12} />
          </button>
        </div>

        {activeAlerts.length === 0 ? (
          <div
            style={{
              padding: "1.4rem 1rem",
              textAlign: "center",
              borderRadius: "9px",
              border:
                `1px solid ${C.greenBorder}`,
              background: C.inner
            }}
          >
            <ShieldCheck
              size={30}
              color={C.greenDark}
            />

            <h4
              style={{
                margin: "0.4rem 0 0",
                fontSize: "0.83rem",
                fontWeight: 700,
                color: C.text
              }}
            >
              No Active Emergency
            </h4>

            <p
              style={{
                fontSize: "0.66rem",
                fontWeight: 500,
                color: C.greenDark,
                margin: "0.18rem 0 0"
              }}
            >
              The selected wearer is currently safe.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.55rem"
            }}
          >
            {activeAlerts.map((alert) => (
              <div
                key={alert._id}
                style={{
                  padding: "0.75rem",
                  borderRadius: "9px",
                  background: C.inner,
                  border:
                    `1px solid ${C.redBorder}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "space-between",
                  gap: "0.8rem",
                  flexWrap: "wrap"
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      flexWrap: "wrap"
                    }}
                  >
                    <span
                      style={{
                        padding:
                          "0.18rem 0.45rem",
                        borderRadius: "999px",
                        background: C.redBg,
                        color: C.redDark,
                        border:
                          `1px solid ${C.redBorder}`,
                        fontSize: "0.58rem",
                        fontWeight: 700
                      }}
                    >
                      {alert.triggeredBy ||
                        alert.type ||
                        "Emergency"}
                    </span>

                    <span
                      style={{
                        fontSize: "0.63rem",
                        fontWeight: 500,
                        color: C.secondary
                      }}
                    >
                      {new Date(
                        alert.createdAt ||
                          Date.now()
                      ).toLocaleTimeString()}
                    </span>
                  </div>

                  <p
                    style={{
                      margin: "0.3rem 0 0",
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      color: C.text
                    }}
                  >
                    {alert.message ||
                      "Emergency alert received from wristband"}
                  </p>
                </div>

                <button
                  onClick={() =>
                    resolveAlert(alert._id)
                  }
                  style={{
                    padding: "0.35rem 0.6rem",
                    borderRadius: "7px",
                    border:
                      `1px solid ${C.greenDark}`,
                    background: C.greenDark,
                    color: "#FFFFFF",
                    fontSize: "0.64rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: dashboardFont
                  }}
                >
                  Resolve
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ================= CONNECTION ================= */}

      <section
        style={{
          ...cardStyle,
          padding: "0.9rem 1.1rem"
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            flexWrap: "wrap"
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.55rem"
            }}
          >
            <Radio
              size={17}
              color={
                isHardwareOnline
                  ? C.greenDark
                  : C.amberDark
              }
            />

            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: C.text
                }}
              >
                Wristband Connection
              </h3>

              <p
                style={{
                  fontSize: "0.66rem",
                  fontWeight: 500,
                  color: isHardwareOnline
                    ? C.greenDark
                    : C.amberDark,
                  margin: "0.12rem 0 0"
                }}
              >
                {isHardwareOnline
                  ? "ESP32 wristband connected and sending live data"
                  : "Waiting for live wristband connection"}
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              setCurrentPage(
                "device_status"
              )
            }
            style={secondaryButton}
          >
            <Cpu size={12} />
            Device Status
          </button>
        </div>
      </section>
    </div>
  );
};

/* =========================================================
   STATUS ROW
========================================================= */

const StatusRow = ({
  title,
  value,
  colors
}) => {
  const text =
    String(value || "").toLowerCase();

  const danger =
    text.includes("distress") ||
    text.includes("outside") ||
    text.includes("emergency") ||
    text.includes("danger") ||
    text.includes("abnormal");

  const warning =
    text.includes("search") ||
    text.includes("waiting") ||
    text.includes("not available") ||
    text.includes("unavailable") ||
    text.includes("standby") ||
    text.includes("disconnected");

  const safe =
    !danger &&
    !warning &&
    (
      text.includes("connected") ||
      text.includes("inside") ||
      text.includes("normal") ||
      text.includes("safe") ||
      text.includes("active")
    );

  const color = danger
    ? colors.redDark
    : warning
      ? colors.amberDark
      : safe
        ? colors.greenDark
        : colors.purpleDark;

  const background = danger
    ? colors.redBg
    : warning
      ? colors.amberBg
      : safe
        ? colors.greenBg
        : colors.purpleLight;

  const border = danger
    ? colors.redBorder
    : warning
      ? colors.amberBorder
      : safe
        ? colors.greenBorder
        : colors.borderStrong;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.7rem",
        padding: "0.62rem 0.72rem",
        borderRadius: "8px",
        border:
          `1px solid ${colors.border}`,
        background: colors.inner
      }}
    >
      <span
        style={{
          fontSize: "0.68rem",
          fontWeight: 600,
          color: colors.text
        }}
      >
        {title}
      </span>

      <span
        style={{
          padding: "0.18rem 0.46rem",
          borderRadius: "999px",
          fontSize: "0.57rem",
          fontWeight: 700,
          color,
          background,
          border: `1px solid ${border}`,
          textAlign: "right"
        }}
      >
        {value || "Not Available"}
      </span>
    </div>
  );
};

/* =========================================================
   ACTION BUTTON
========================================================= */

const ActionButton = ({
  icon,
  title,
  text,
  onClick,
  colors,
  accent = "purple"
}) => {
  const accentColor =
    accent === "danger"
      ? colors.redDark
      : accent === "blue"
        ? colors.blueDark
        : colors.purpleDark;

  const accentBg =
    accent === "danger"
      ? colors.redBg
      : accent === "blue"
        ? colors.blueBg
        : colors.purpleLight;

  return (
    <button
      onClick={onClick}
      style={{
        padding: "0.7rem",
        minHeight: "72px",
        borderRadius: "9px",
        border:
          `1px solid ${colors.border}`,
        background: colors.inner,
        color: colors.text,
        cursor: "pointer",
        textAlign: "left",
        display: "flex",
        alignItems: "center",
        gap: "0.55rem",
        fontFamily:
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      }}
    >
      <div
        style={{
          width: "31px",
          height: "31px",
          borderRadius: "8px",
          background: accentBg,
          color: accentColor,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        {icon}
      </div>

      <div>
        <div
          style={{
            fontSize: "0.69rem",
            fontWeight: 700,
            color: colors.text
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: "0.61rem",
            fontWeight: 500,
            color: colors.secondary,
            marginTop: "0.08rem"
          }}
        >
          {text}
        </div>
      </div>
    </button>
  );
};

/* =========================================================
   INFO BOX
========================================================= */

const InfoBox = ({
  icon,
  label,
  value,
  colors
}) => {
  const text =
    String(value || "").toLowerCase();

  const danger =
    text.includes("distress") ||
    text.includes("attention") ||
    text.includes("emergency") ||
    text.includes("danger");

  const warning =
    text.includes("waiting") ||
    text.includes("unavailable") ||
    text.includes("not available") ||
    text.includes("disconnected");

  const safe =
    !danger &&
    !warning &&
    (
      text.includes("normal") ||
      text.includes("connected") ||
      text.includes("active") ||
      text.includes("no distress")
    );

  const valueColor = danger
    ? colors.redDark
    : warning
      ? colors.amberDark
      : safe
        ? colors.greenDark
        : colors.value;

  return (
    <div
      style={{
        padding: "0.72rem",
        borderRadius: "9px",
        border:
          `1px solid ${colors.border}`,
        background: colors.inner
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.35rem",
          marginBottom: "0.32rem",
          color: colors.purpleDark
        }}
      >
        {icon}

        <span
          style={{
            fontSize: "0.6rem",
            fontWeight: 600,
            textTransform: "uppercase",
            color: colors.secondary
          }}
        >
          {label}
        </span>
      </div>

      <div
        style={{
          fontSize: "0.71rem",
          fontWeight: 700,
          color: valueColor,
          lineHeight: 1.4,
          overflowWrap: "anywhere"
        }}
      >
        {value || "Not Available"}
      </div>
    </div>
  );
};