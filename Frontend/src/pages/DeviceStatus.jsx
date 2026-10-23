import React, { useState } from "react";

import { useApp } from "../context/AppContext";

import {
  Cpu,
  Battery,
  Heart,
  MapPin,
  Radio,
  Mic,
  AlertCircle,
  RefreshCw,
  Signal,
  Clock,
  MessageSquare
} from "lucide-react";


export const DeviceStatus = () => {

  const {
    selectedWearer,
    deviceStatus,
    monitoring,
    location,
    isHardwareOnline,
    refreshTelemetry
  } = useApp();


  const [refreshing, setRefreshing] = useState(false);


  /* =========================================================
     HEART RATE
  ========================================================= */

  const hr =
    monitoring?.heartRate ??
    deviceStatus?.heartRate ??
    null;


  const isAbnormalHr =
    hr !== null &&
    (
      Number(hr) < 50 ||
      Number(hr) > 120
    );


  /* =========================================================
     BATTERY
  ========================================================= */

  const battery =
    monitoring?.battery ??
    deviceStatus?.battery ??
    null;


  /* =========================================================
     GPS / LOCATION
  ========================================================= */

  const latitude =
    location?.latitude ??
    monitoring?.latitude ??
    null;


  const longitude =
    location?.longitude ??
    monitoring?.longitude ??
    null;


  const hasCoordinates =
    latitude !== null &&
    latitude !== undefined &&
    longitude !== null &&
    longitude !== undefined &&
    Number.isFinite(Number(latitude)) &&
    Number.isFinite(Number(longitude));


  const rawGpsStatus =
    String(deviceStatus?.gpsStatus || "")
      .trim()
      .toLowerCase();


  const gpsConnected =
    hasCoordinates ||
    rawGpsStatus === "connected" ||
    rawGpsStatus === "active" ||
    rawGpsStatus === "available" ||
    rawGpsStatus === "gps active";


  /* =========================================================
     GSM
  ========================================================= */

  const gsmStatus =
    monitoring?.gsmStatus ||
    deviceStatus?.gsmStatus ||
    "Not Available";


  const gsmConnected =
    String(gsmStatus)
      .trim()
      .toLowerCase() === "connected";


  /* =========================================================
     MICROPHONE / VOICE
  ========================================================= */

  const microphoneStatus =
    monitoring?.microphoneStatus ||
    deviceStatus?.microphoneStatus ||
    "Not Available";


  const voiceStatus =
    monitoring?.voiceStatus ||
    "Not Available";


  const detectedSpeech =
    monitoring?.detectedSpeech ||
    "";


  const distressDetected =
    String(voiceStatus)
      .trim()
      .toLowerCase()
      .includes("distress");


  const microphoneActive =
    distressDetected ||
    ["active", "connected", "working"]
      .includes(
        String(microphoneStatus)
          .trim()
          .toLowerCase()
      );


  /* =========================================================
     SOS
  ========================================================= */

  const rawSosStatus =
    String(deviceStatus?.sosButtonStatus || "")
      .trim()
      .toLowerCase();


  const sosPressed =
    monitoring?.sos === true ||
    rawSosStatus === "pressed" ||
    rawSosStatus === "activated";


  /* =========================================================
     LAST UPDATED
  ========================================================= */

  const lastUpdated =
    deviceStatus?.lastSeen ||
    monitoring?.updatedAt ||
    location?.updatedAt ||
    deviceStatus?.updatedAt ||
    monitoring?.createdAt ||
    location?.createdAt ||
    null;


  /* =========================================================
     DEVICE CONNECTION
  ========================================================= */

  const hasLiveTelemetry =
    hr !== null ||
    battery !== null ||
    gpsConnected ||
    gsmConnected ||
    microphoneActive ||
    sosPressed;


  const deviceConnected =
    isHardwareOnline ||
    hasLiveTelemetry;


  /* =========================================================
     REFRESH
  ========================================================= */

  const handleRefresh = async () => {

    if (!refreshTelemetry) {
      return;
    }

    try {

      setRefreshing(true);

      await refreshTelemetry();

    } catch (error) {

      console.error(
        "Device refresh failed:",
        error
      );

    } finally {

      setRefreshing(false);

    }

  };


  /* =========================================================
     TIME
  ========================================================= */

  const formatLastUpdated = (dateValue) => {

    if (!dateValue) {
      return "Not Available";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Not Available";
    }

    return date.toLocaleString();

  };


  /* =========================================================
     THEME
  ========================================================= */

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

    /*
      IMPORTANT:
      All explanation / secondary sentences use this
      single neutral readable colour.
    */
    secondary: "#5F5367",
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
    blueBg: "#EAF3FB",
    blueBorder: "#C8DCEE"

  };


  const pageStyle = {

    display: "flex",
    flexDirection: "column",
    gap: "1.15rem",

    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',

    color: C.text

  };


  const cardStyle = {

    padding: "1.15rem",

    display: "flex",
    flexDirection: "column",

    minHeight: "205px",

    borderRadius: "13px",

    background: C.card,

    border: `1px solid ${C.border}`,

    boxShadow:
      "0 3px 10px rgba(48,32,63,0.06)"

  };


  const iconBox = (
    background = C.purpleLight,
    color = C.purple
  ) => ({

    width: "40px",
    height: "40px",

    borderRadius: "10px",

    background,
    color,

    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    flexShrink: 0

  });


  /*
    SAME STYLE FOR ALL SENTENCES BELOW VALUES
  */
  const descriptionStyle = {

    fontSize: "0.68rem",

    color: C.secondary,

    lineHeight: 1.5,

    marginTop: "0.55rem",
    marginBottom: 0,

    fontWeight: 500

  };


  const buttonStyle = {

    border:
      `1px solid ${C.borderStrong}`,

    background: C.inner,

    color: C.purpleDark,

    padding: "0.48rem 0.72rem",

    borderRadius: "8px",

    display: "inline-flex",

    alignItems: "center",

    justifyContent: "center",

    gap: "0.38rem",

    cursor: "pointer",

    fontSize: "0.66rem",

    fontWeight: 700,

    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',

    boxShadow:
      "0 1px 3px rgba(48,32,63,0.04)"

  };


  /* =========================================================
     MAIN UI
  ========================================================= */

  return (

    <div style={pageStyle}>


      {/* =====================================================
          WRISTBAND CONNECTION
      ===================================================== */}

      <section
        style={{

          padding: "1.15rem 1.3rem",

          borderRadius: "14px",

          background:
            `linear-gradient(
              135deg,
              ${C.hero} 0%,
              ${C.heroDeep} 100%
            )`,

          color: "#FFFFFF",

          boxShadow:
            "0 6px 18px rgba(40,20,60,0.15)",

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

            right: "-55px",

            top: "-95px",

            pointerEvents: "none"

          }}
        />


        <div
          style={{

            display: "flex",

            alignItems: "center",

            gap: "0.85rem",

            position: "relative"

          }}
        >

          <div
            style={{

              width: "48px",

              height: "48px",

              borderRadius: "12px",

              background:
                "rgba(255,255,255,0.12)",

              border:
                "1px solid rgba(255,255,255,0.15)",

              color: "#FFFFFF",

              display: "flex",

              alignItems: "center",

              justifyContent: "center"

            }}
          >

            <Cpu size={24} />

          </div>


          <div>

            <div
              style={{

                display: "flex",

                alignItems: "center",

                gap: "0.5rem",

                flexWrap: "wrap"

              }}
            >

              <h2
                style={{

                  margin: 0,

                  fontSize: "1rem",

                  fontWeight: 700,

                  color: "#FFFFFF"

                }}
              >

                Wristband Connection

              </h2>


              <StatusBadge
                text={
                  deviceConnected
                    ? "CONNECTED"
                    : "NOT CONNECTED"
                }
                type={
                  deviceConnected
                    ? "green"
                    : "amber"
                }
                colors={C}
                dark
              />

            </div>


            <p
              style={{

                margin: "0.25rem 0 0",

                fontSize: "0.68rem",

                fontWeight: 500,

                color:
                  "rgba(255,255,255,0.82)",

                lineHeight: 1.45

              }}
            >

              Wearer:{" "}

              <strong
                style={{
                  color: "#FFFFFF",
                  fontWeight: 700
                }}
              >

                {selectedWearer?.name ||
                  "No Wearer Selected"}

              </strong>

            </p>


            <p
              style={{

                margin: "0.15rem 0 0",

                fontSize: "0.63rem",

                fontWeight: 500,

                color:
                  "rgba(255,255,255,0.78)",

                lineHeight: 1.4

              }}
            >

              {deviceConnected
                ? "Live data is being received from the wristband"
                : "Waiting for live data from the wristband"}

            </p>

          </div>

        </div>


        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{

            ...buttonStyle,

            background:
              "rgba(255,255,255,0.13)",

            color: "#FFFFFF",

            border:
              "1px solid rgba(255,255,255,0.20)"

          }}
        >

          <RefreshCw
            size={14}
            style={{

              transform:
                refreshing
                  ? "rotate(180deg)"
                  : "none",

              transition:
                "transform .3s ease"

            }}
          />

          {refreshing
            ? "Refreshing..."
            : "Refresh"}

        </button>

      </section>


      {/* =====================================================
          STATUS CARDS
      ===================================================== */}

      <div
        style={{

          display: "grid",

          gridTemplateColumns:
            "repeat(auto-fit, minmax(280px, 1fr))",

          gap: "0.9rem"

        }}
      >


        {/* ===================================================
            HEART RATE
        =================================================== */}

        <section style={cardStyle}>

          <CardHeader
            icon={
              <Heart
                size={19}
                className={
                  hr !== null
                    ? "animate-heart"
                    : ""
                }
              />
            }
            iconStyle={
              iconBox(
                isAbnormalHr
                  ? C.redBg
                  : C.purpleLight,

                isAbnormalHr
                  ? C.redDark
                  : C.purple
              )
            }
            title="Heart Rate"
            subtitle="Pulse Rate Monitoring"
            badge={
              hr === null
                ? "NOT AVAILABLE"
                : isAbnormalHr
                  ? "ABNORMAL"
                  : "NORMAL"
            }
            badgeType={
              hr === null
                ? "amber"
                : isAbnormalHr
                  ? "red"
                  : "green"
            }
            colors={C}
          />


          <div
            style={{

              display: "flex",

              alignItems: "baseline",

              gap: "0.35rem",

              marginTop: "1.1rem"

            }}
          >

            <strong
              style={{

                fontSize: "1.65rem",

                fontWeight: 700,

                color:
                  hr === null
                    ? C.secondary
                    : isAbnormalHr
                      ? C.redDark
                      : C.purpleDark,

                lineHeight: 1.2

              }}
            >

              {hr ?? "--"}

            </strong>


            {hr !== null && (

              <span
                style={{

                  fontSize: "0.72rem",

                  fontWeight: 600,

                  color: C.secondary

                }}
              >

                BPM

              </span>

            )}

          </div>


          <p style={descriptionStyle}>

            {hr === null
              ? "Heart rate reading is not available."
              : isAbnormalHr
                ? "Heart rate is outside the normal range."
                : "Heart rate is within the normal range."}

          </p>

        </section>


        {/* ===================================================
            BATTERY
        =================================================== */}

        <section style={cardStyle}>

          <CardHeader
            icon={
              <Battery size={19} />
            }
            iconStyle={
              iconBox(
                battery === null
                  ? C.purpleLight
                  : Number(battery) <= 20
                    ? C.redBg
                    : Number(battery) <= 50
                      ? C.amberBg
                      : C.greenBg,

                battery === null
                  ? C.purple
                  : Number(battery) <= 20
                    ? C.redDark
                    : Number(battery) <= 50
                      ? C.amberDark
                      : C.greenDark
              )
            }
            title="Battery"
            subtitle="Wristband Battery Status"
            badge={
              battery === null
                ? "NOT AVAILABLE"
                : Number(battery) <= 20
                  ? "LOW"
                  : Number(battery) <= 50
                    ? "MODERATE"
                    : "GOOD"
            }
            badgeType={
              battery === null
                ? "amber"
                : Number(battery) <= 20
                  ? "red"
                  : Number(battery) <= 50
                    ? "amber"
                    : "green"
            }
            colors={C}
          />


          <strong
            style={{

              display: "block",

              fontSize: "1.65rem",

              marginTop: "1.1rem",

              color:
                battery === null
                  ? C.secondary
                  : Number(battery) <= 20
                    ? C.redDark
                    : Number(battery) <= 50
                      ? C.amberDark
                      : C.greenDark,

              fontWeight: 700

            }}
          >

            {battery !== null
              ? `${battery}%`
              : "--"}

          </strong>


          {battery !== null && (

            <div
              style={{

                width: "100%",

                height: "6px",

                background:
                  "rgba(255,255,255,0.72)",

                borderRadius: "20px",

                overflow: "hidden",

                marginTop: "0.65rem",

                border:
                  `1px solid ${C.border}`

              }}
            >

              <div
                style={{

                  width:
                    `${Math.min(
                      Math.max(
                        Number(battery),
                        0
                      ),
                      100
                    )}%`,

                  height: "100%",

                  background:
                    Number(battery) <= 20
                      ? C.red
                      : Number(battery) <= 50
                        ? C.amber
                        : C.green,

                  borderRadius: "20px"

                }}
              />

            </div>

          )}


          <p style={descriptionStyle}>

            {battery === null
              ? "Battery information is not available."
              : Number(battery) <= 20
                ? "Battery is low. Please charge the wristband."
                : Number(battery) <= 50
                  ? "Battery level is moderate."
                  : "Wristband battery level is good."}

          </p>

        </section>


        {/* ===================================================
            GPS
        =================================================== */}

        <section style={cardStyle}>

          <CardHeader
            icon={
              <MapPin size={19} />
            }
            iconStyle={
              iconBox(
                gpsConnected
                  ? C.blueBg
                  : C.amberBg,

                gpsConnected
                  ? C.blueDark
                  : C.amberDark
              )
            }
            title="GPS"
            subtitle="Live Location Tracking"
            badge={
              gpsConnected
                ? "CONNECTED"
                : "NOT AVAILABLE"
            }
            badgeType={
              gpsConnected
                ? "green"
                : "amber"
            }
            colors={C}
          />


          <strong
            style={{

              display: "block",

              fontSize: "0.95rem",

              marginTop: "1.1rem",

              color:
                gpsConnected
                  ? C.blueDark
                  : C.amberDark,

              fontWeight: 700

            }}
          >

            {gpsConnected
              ? "GPS Connected"
              : "Location Not Available"}

          </strong>


          {hasCoordinates && (

            <div
              style={{

                marginTop: "0.65rem",

                padding: "0.7rem",

                borderRadius: "8px",

                background: C.inner,

                border:
                  `1px solid ${C.blueBorder}`

              }}
            >

              <p
                style={{

                  fontSize: "0.6rem",

                  color: C.blueDark,

                  margin:
                    "0 0 0.2rem",

                  textTransform:
                    "uppercase",

                  letterSpacing:
                    "0.025em",

                  fontWeight: 700

                }}
              >

                Current Position

              </p>


              <strong
                style={{

                  fontSize: "0.72rem",

                  fontWeight: 600,

                  color: C.text,

                  wordBreak: "break-word"

                }}
              >

                {Number(
                  latitude
                ).toFixed(6)}
                ,{" "}
                {Number(
                  longitude
                ).toFixed(6)}

              </strong>

            </div>

          )}


          <p style={descriptionStyle}>

            {hasCoordinates
              ? "GPS is connected and the wristband location is available."
              : gpsConnected
                ? "GPS is connected. Waiting for a new location fix."
                : "Waiting for GPS data from the wristband."}

          </p>

        </section>


        {/* ===================================================
            GSM
        =================================================== */}

        <section style={cardStyle}>

          <CardHeader
            icon={
              <Radio size={19} />
            }
            iconStyle={
              iconBox(
                gsmConnected
                  ? C.greenBg
                  : C.amberBg,

                gsmConnected
                  ? C.greenDark
                  : C.amberDark
              )
            }
            title="GSM Network"
            subtitle="Emergency Communication"
            badge={
              gsmConnected
                ? "CONNECTED"
                : "NOT AVAILABLE"
            }
            badgeType={
              gsmConnected
                ? "green"
                : "amber"
            }
            colors={C}
          />


          <div
            style={{

              display: "flex",

              alignItems: "center",

              gap: "0.45rem",

              marginTop: "1.1rem"

            }}
          >

            <Signal
              size={18}
              color={
                gsmConnected
                  ? C.greenDark
                  : C.amberDark
              }
            />


            <strong
              style={{

                fontSize: "0.95rem",

                color:
                  gsmConnected
                    ? C.greenDark
                    : C.amberDark,

                fontWeight: 700

              }}
            >

              {gsmConnected
                ? "Network Available"
                : "Network Not Available"}

            </strong>

          </div>


          <p style={descriptionStyle}>

            {gsmConnected
              ? "GSM network is connected and available for emergency communication."
              : "GSM network connection is not available."}

          </p>

        </section>


        {/* ===================================================
            MICROPHONE
        =================================================== */}

        <section style={cardStyle}>

          <CardHeader
            icon={
              <Mic size={19} />
            }
            iconStyle={
              iconBox(
                distressDetected
                  ? C.redBg
                  : microphoneActive
                    ? C.greenBg
                    : C.amberBg,

                distressDetected
                  ? C.redDark
                  : microphoneActive
                    ? C.greenDark
                    : C.amberDark
              )
            }
            title="Microphone"
            subtitle="Voice Distress Detection"
            badge={
              distressDetected
                ? "DISTRESS"
                : microphoneActive
                  ? "ACTIVE"
                  : "NOT AVAILABLE"
            }
            badgeType={
              distressDetected
                ? "red"
                : microphoneActive
                  ? "green"
                  : "amber"
            }
            colors={C}
          />


          <strong
            style={{

              display: "block",

              fontSize: "0.95rem",

              marginTop: "1.1rem",

              color:
                distressDetected
                  ? C.redDark
                  : microphoneActive
                    ? C.greenDark
                    : C.amberDark,

              fontWeight: 700

            }}
          >

            {distressDetected
              ? "Distress Detected"
              : microphoneActive
                ? "Microphone Active"
                : "Microphone Not Available"}

          </strong>


          {detectedSpeech && (

            <div
              style={{

                marginTop: "0.7rem",

                padding: "0.7rem",

                borderRadius: "8px",

                background:
                  distressDetected
                    ? C.redBg
                    : C.inner,

                border:
                  distressDetected
                    ? `1px solid ${C.redBorder}`
                    : `1px solid ${C.border}`

              }}
            >

              <div
                style={{

                  display: "flex",

                  alignItems: "center",

                  gap: "0.35rem",

                  marginBottom: "0.25rem"

                }}
              >

                <MessageSquare
                  size={13}
                  color={
                    distressDetected
                      ? C.redDark
                      : C.purple
                  }
                />

                <span
                  style={{

                    fontSize: "0.6rem",

                    color: C.secondary,

                    fontWeight: 700

                  }}
                >

                  DETECTED SPEECH

                </span>

              </div>


              <strong
                style={{

                  fontSize: "0.72rem",

                  color: C.text,

                  fontWeight: 600,

                  wordBreak: "break-word"

                }}
              >

                {detectedSpeech}

              </strong>

            </div>

          )}


          <p style={descriptionStyle}>

            {distressDetected
              ? "The wristband detected a possible distress voice."
              : microphoneActive
                ? "Microphone is actively monitoring for distress sounds and voice."
                : "Microphone data is not available."}

          </p>

        </section>


        {/* ===================================================
            SOS
        =================================================== */}

        <section
          style={{
            ...cardStyle,

            border:
              sosPressed
                ? `1px solid ${C.redBorder}`
                : `1px solid ${C.border}`
          }}
        >

          <CardHeader
            icon={
              <AlertCircle size={19} />
            }
            iconStyle={
              iconBox(
                sosPressed
                  ? C.redBg
                  : C.greenBg,

                sosPressed
                  ? C.redDark
                  : C.greenDark
              )
            }
            title="SOS Button"
            subtitle="Emergency SOS"
            badge={
              sosPressed
                ? "ACTIVATED"
                : "READY"
            }
            badgeType={
              sosPressed
                ? "red"
                : "green"
            }
            colors={C}
          />


          <strong
            style={{

              display: "block",

              fontSize: "0.95rem",

              marginTop: "1.1rem",

              color:
                sosPressed
                  ? C.redDark
                  : C.greenDark,

              fontWeight: 700

            }}
          >

            {sosPressed
              ? "SOS Activated"
              : "Ready for Emergency"}

          </strong>


          <p style={descriptionStyle}>

            {sosPressed
              ? "Emergency SOS has been activated from the wristband."
              : "The SOS button is ready to send an emergency alert when pressed."}

          </p>

        </section>

      </div>


      {/* =====================================================
          LAST SYNC
      ===================================================== */}

      <section
        style={{

          padding: "0.9rem 1.1rem",

          borderRadius: "12px",

          background: C.cardLight,

          border:
            `1px solid ${C.border}`,

          display: "flex",

          justifyContent: "space-between",

          alignItems: "center",

          gap: "1rem",

          flexWrap: "wrap",

          boxShadow:
            "0 2px 6px rgba(48,32,63,0.04)"

        }}
      >

        <div
          style={{

            display: "flex",

            alignItems: "center",

            gap: "0.5rem",

            flexWrap: "wrap"

          }}
        >

          <Clock
            size={15}
            color={C.purple}
          />


          <span
            style={{

              fontSize: "0.67rem",

              color: C.secondary,

              fontWeight: 600

            }}
          >

            Last synchronized:

          </span>


          <strong
            style={{

              fontSize: "0.68rem",

              color: C.text,

              fontWeight: 700

            }}
          >

            {formatLastUpdated(
              lastUpdated
            )}

          </strong>

        </div>


        <StatusBadge
          text={
            deviceConnected
              ? "DEVICE CONNECTED"
              : "DEVICE NOT CONNECTED"
          }
          type={
            deviceConnected
              ? "green"
              : "amber"
          }
          colors={C}
        />

      </section>

    </div>

  );

};


/* =========================================================
   CARD HEADER
========================================================= */

const CardHeader = ({
  icon,
  iconStyle,
  title,
  subtitle,
  badge,
  badgeType,
  colors
}) => {

  return (

    <div
      style={{

        display: "flex",

        justifyContent:
          "space-between",

        alignItems:
          "flex-start",

        gap: "0.6rem"

      }}
    >

      <div
        style={{

          display: "flex",

          alignItems: "center",

          gap: "0.65rem",

          minWidth: 0

        }}
      >

        <div style={iconStyle}>
          {icon}
        </div>


        <div
          style={{
            minWidth: 0
          }}
        >

          <h3
            style={{

              margin: 0,

              fontSize: "0.82rem",

              fontWeight: 700,

              color: colors.text,

              lineHeight: 1.3

            }}
          >

            {title}

          </h3>


          <span
            style={{

              display: "block",

              marginTop: "0.13rem",

              fontSize: "0.62rem",

              fontWeight: 500,

              color: colors.secondary,

              lineHeight: 1.35

            }}
          >

            {subtitle}

          </span>

        </div>

      </div>


      <StatusBadge
        text={badge}
        type={badgeType}
        colors={colors}
      />

    </div>

  );

};


/* =========================================================
   STATUS BADGE
========================================================= */

const StatusBadge = ({
  text,
  type,
  colors,
  dark = false
}) => {

  let background;
  let color;
  let border;


  if (dark) {

    if (type === "green") {

      background =
        "rgba(255,255,255,0.14)";

      color = "#FFFFFF";

      border =
        "1px solid rgba(255,255,255,0.20)";

    } else {

      background =
        "rgba(255,255,255,0.10)";

      color = "#FFFFFF";

      border =
        "1px solid rgba(255,255,255,0.16)";

    }

  } else if (type === "red") {

    background =
      colors.redBg;

    color =
      colors.redDark;

    border =
      `1px solid ${colors.redBorder}`;

  } else if (type === "green") {

    background =
      colors.greenBg;

    color =
      colors.greenDark;

    border =
      `1px solid ${colors.greenBorder}`;

  } else {

    background =
      colors.amberBg;

    color =
      colors.amberDark;

    border =
      `1px solid ${colors.amberBorder}`;

  }


  return (

    <span
      style={{

        display: "inline-flex",

        alignItems: "center",

        justifyContent: "center",

        padding:
          "0.2rem 0.45rem",

        borderRadius: "999px",

        background,

        color,

        border,

        fontSize: "0.54rem",

        fontWeight: 700,

        lineHeight: 1.2,

        whiteSpace: "nowrap",

        letterSpacing: "0.015em"

      }}
    >

      {text}

    </span>

  );

};