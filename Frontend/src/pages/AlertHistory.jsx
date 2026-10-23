import React, {
  useState,
  useEffect
} from "react";

import { useApp } from "../context/AppContext";
import { API } from "../services/api";

import {
  Clock,
  Search,
  Download,
  Trash2,
  AlertTriangle,
  Loader2
} from "lucide-react";


export const AlertHistory = () => {

  const {
    selectedWearerId
  } = useApp();


  const [history, setHistory] =
    useState([]);

  const [filterType, setFilterType] =
    useState("ALL");

  const [searchTerm, setSearchTerm] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [deletingId, setDeletingId] =
    useState(null);

  const [
    isDeletingAll,
    setIsDeletingAll
  ] = useState(false);


  /* =========================================================
     LOAD ALERT HISTORY
  ========================================================= */

  const fetchHistory = async () => {

    if (!selectedWearerId) {
      setHistory([]);
      return;
    }

    try {

      setIsLoading(true);
      setError("");

      console.log(
        "[AlertHistory] Loading alerts for wearer:",
        selectedWearerId
      );

      const res =
        await API.getAlertHistory(
          selectedWearerId
        );

      console.log(
        "[AlertHistory] API response:",
        res
      );

      if (
        res?.success &&
        Array.isArray(res.alerts)
      ) {
        setHistory(res.alerts);
      } else {
        setHistory([]);
      }

    } catch (e) {

      console.error(
        "[AlertHistory] Failed to load alert history:",
        e
      );

      setError(
        "Unable to load alert history."
      );

      setHistory([]);

    } finally {

      setIsLoading(false);

    }

  };


  useEffect(() => {
    fetchHistory();
  }, [selectedWearerId]);


  /* =========================================================
     FILTER ALERTS
  ========================================================= */

  const filteredAlerts =
    history.filter((alert) => {

      const trigger =
        String(
          alert.triggeredBy || ""
        ).toUpperCase();

      const matchesFilter =
        filterType === "ALL" ||
        trigger.includes(filterType);

      const search =
        searchTerm
          .trim()
          .toLowerCase();

      const matchesSearch =
        search === "" ||

        String(
          alert.message || ""
        )
          .toLowerCase()
          .includes(search) ||

        String(
          alert.triggeredBy || ""
        )
          .toLowerCase()
          .includes(search);

      return (
        matchesFilter &&
        matchesSearch
      );

    });


  /* =========================================================
     DELETE ONE ALERT
  ========================================================= */

  const deleteAlert =
    async (alertId) => {

      if (!alertId) {
        return;
      }

      const confirmed =
        window.confirm(
          "Delete this alert from history?"
        );

      if (!confirmed) {
        return;
      }

      try {

        setDeletingId(alertId);
        setError("");

        const response =
          await API.deleteAlert(
            alertId
          );

        if (
          response?.success === false
        ) {

          throw new Error(
            response?.message ||
            "Unable to delete alert."
          );

        }

        setHistory(
          (previous) =>
            previous.filter(
              (alert) =>
                alert._id !== alertId
            )
        );

      } catch (e) {

        console.error(
          "[AlertHistory] Delete alert error:",
          e
        );

        setError(
          e?.message ||
          "Unable to delete alert."
        );

      } finally {

        setDeletingId(null);

      }

    };


  /* =========================================================
     DELETE ALL ALERTS
  ========================================================= */

  const deleteAllAlerts =
    async () => {

      if (!selectedWearerId) {
        return;
      }

      if (history.length === 0) {
        return;
      }

      const confirmed =
        window.confirm(
          "Delete all alert history for this wearer? This action cannot be undone."
        );

      if (!confirmed) {
        return;
      }

      try {

        setIsDeletingAll(true);
        setError("");

        const response =
          await API.deleteWearerAlertHistory(
            selectedWearerId
          );

        if (
          response?.success === false
        ) {

          throw new Error(
            response?.message ||
            "Unable to delete alert history."
          );

        }

        setHistory([]);

      } catch (e) {

        console.error(
          "[AlertHistory] Delete all error:",
          e
        );

        setError(
          e?.message ||
          "Unable to delete alert history."
        );

      } finally {

        setIsDeletingAll(false);

      }

    };


  /* =========================================================
     EXPORT CSV
  ========================================================= */

  const exportCSV = () => {

    if (history.length === 0) {
      return;
    }

    const headers = [
      "Timestamp",
      "Triggered By",
      "Status",
      "Heart Rate",
      "Latitude",
      "Longitude",
      "Message"
    ];

    const rows =
      history.map((a) => [

        `"${a.createdAt
          ? new Date(
              a.createdAt
            ).toLocaleString()
          : ""
        }"`,

        `"${a.triggeredBy || "SOS"}"`,

        `"${a.status || "Resolved"}"`,

        a.heartRate ?? "",

        a.latitude ?? "",

        a.longitude ?? "",

        `"${String(
          a.message || ""
        ).replace(/"/g, '""')}"`

      ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        headers.join(","),
        ...rows.map(
          (r) => r.join(",")
        )
      ].join("\n");

    const encodedUri =
      encodeURI(csvContent);

    const link =
      document.createElement("a");

    link.setAttribute(
      "href",
      encodedUri
    );

    link.setAttribute(
      "download",
      `trinetra_alert_history_${Date.now()}.csv`
    );

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

  };


  /* =========================================================
     FORMAT GPS
  ========================================================= */

  const formatGPS = (
    latitude,
    longitude
  ) => {

    if (
      latitude === undefined ||
      latitude === null ||
      longitude === undefined ||
      longitude === null
    ) {
      return null;
    }

    const lat =
      Number(latitude);

    const lng =
      Number(longitude);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      return null;
    }

    return (
      `GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`
    );

  };


  /* =========================================================
     FINAL PURPLE THEME
  ========================================================= */

  const C = {

    page: "#F8F6FA",

    control: "#E8DCF2",

    controlDark: "#DDD0E9",

    white: "#FFFFFF",

    row: "#F7F2FA",

    rowAlt: "#FFFFFF",

    header: "#EEE6F4",

    inner: "#FCFAFD",

    purple: "#654A83",

    purpleDark: "#3E295B",

    purpleDeep: "#28143F",

    purpleSoft: "#E5D8EF",

    text: "#29252D",

    secondary: "#625B68",

    muted: "#847B8A",

    border: "#DDD2E7",

    borderStrong: "#D1C2DD",

    red: "#C6535C",

    redDark: "#AC414A",

    redBg: "#F9E8EA",

    redBorder: "#EDC8CC",

    green: "#438864",

    greenBg: "#E7F3EC",

    greenBorder: "#C8E2D3",

    amber: "#A9792E",

    amberBg: "#FAF1DD",

    amberBorder: "#EADAB8"

  };


  return (

    <div
      style={{
        display: "flex",

        flexDirection: "column",

        gap: "1rem",

        fontFamily:
          '"Segoe UI", Arial, sans-serif',

        color: C.text
      }}
    >


      {/* =====================================================
          CONTROL PANEL
      ===================================================== */}

      <div
        style={{

          background:
            `linear-gradient(
              135deg,
              ${C.control} 0%,
              #EDE4F4 100%
            )`,

          border:
            `1px solid ${C.borderStrong}`,

          borderRadius: "14px",

          padding:
            "1rem 1.15rem",

          boxShadow:
            "0 5px 16px rgba(57,36,78,0.07)",

          display: "flex",

          alignItems: "center",

          justifyContent:
            "space-between",

          flexWrap: "wrap",

          gap: "0.85rem"
        }}
      >


        {/* SEARCH */}

        <div
          style={{

            display: "flex",

            alignItems: "center",

            gap: "0.55rem",

            background: C.white,

            border:
              `1px solid ${C.borderStrong}`,

            borderRadius: "9px",

            padding:
              "0.52rem 0.7rem",

            minWidth: "245px",

            flex: "1 1 245px",

            maxWidth: "330px",

            boxShadow:
              "0 2px 6px rgba(57,36,78,0.04)"
          }}
        >

          <Search
            size={15}
            color={C.purple}
          />


          <input
            type="text"

            placeholder="Search incident logs..."

            value={searchTerm}

            onChange={(e) =>
              setSearchTerm(
                e.target.value
              )
            }

            style={{

              width: "100%",

              border: "none",

              outline: "none",

              background:
                "transparent",

              color: C.text,

              fontSize:
                "0.78rem",

              fontFamily:
                '"Segoe UI", Arial, sans-serif'

            }}
          />

        </div>


        {/* FILTER BUTTONS */}

        <div
          style={{

            display: "flex",

            alignItems: "center",

            gap: "0.4rem",

            flexWrap: "wrap"

          }}
        >

          {[
            "ALL",
            "SOS",
            "HEART",
            "VOICE",
            "GEOFENCE"
          ].map((type) => {

            const active =
              filterType === type;

            return (

              <button
                key={type}

                onClick={() =>
                  setFilterType(type)
                }

                style={{

                  minHeight: "33px",

                  borderRadius:
                    "7px",

                  padding:
                    "0.4rem 0.68rem",

                  border:
                    active
                      ? `1px solid ${C.purple}`
                      : `1px solid ${C.borderStrong}`,

                  background:
                    active
                      ? C.purple
                      : C.white,

                  color:
                    active
                      ? "#FFFFFF"
                      : C.secondary,

                  fontSize:
                    "0.68rem",

                  fontWeight: 600,

                  cursor:
                    "pointer",

                  fontFamily:
                    '"Segoe UI", Arial, sans-serif',

                  boxShadow:
                    active
                      ? "0 2px 6px rgba(65,43,90,0.15)"
                      : "none"

                }}
              >

                {type}

              </button>

            );

          })}

        </div>


        {/* ACTION BUTTONS */}

        <div
          style={{

            display: "flex",

            alignItems: "center",

            gap: "0.5rem",

            flexWrap: "wrap"

          }}
        >

          {/* EXPORT */}

          <button
            onClick={exportCSV}

            disabled={
              history.length === 0
            }

            style={{

              minHeight: "34px",

              display:
                "inline-flex",

              alignItems:
                "center",

              justifyContent:
                "center",

              gap: "0.4rem",

              padding:
                "0.45rem 0.75rem",

              borderRadius:
                "7px",

              background:
                C.purple,

              color: "#FFFFFF",

              border:
                `1px solid ${C.purple}`,

              fontSize:
                "0.7rem",

              fontWeight: 600,

              cursor:
                history.length === 0
                  ? "not-allowed"
                  : "pointer",

              opacity:
                history.length === 0
                  ? 0.5
                  : 1,

              boxShadow:
                "0 2px 6px rgba(65,43,90,0.14)"

            }}
          >

            <Download
              size={14}
            />

            Export CSV

          </button>


          {/* DELETE ALL */}

          <button
            onClick={
              deleteAllAlerts
            }

            disabled={
              history.length === 0 ||
              isDeletingAll
            }

            style={{

              minHeight: "34px",

              display:
                "inline-flex",

              alignItems:
                "center",

              justifyContent:
                "center",

              gap: "0.4rem",

              padding:
                "0.45rem 0.75rem",

              borderRadius:
                "7px",

              background:
                C.red,

              color:
                "#FFFFFF",

              border:
                `1px solid ${C.red}`,

              fontSize:
                "0.7rem",

              fontWeight: 600,

              cursor:
                history.length === 0 ||
                isDeletingAll
                  ? "not-allowed"
                  : "pointer",

              opacity:
                history.length === 0
                  ? 0.5
                  : 1,

              boxShadow:
                "0 2px 6px rgba(198,83,92,0.15)"

            }}
          >

            {isDeletingAll ? (

              <>
                <Loader2
                  size={14}
                />

                Deleting...
              </>

            ) : (

              <>
                <Trash2
                  size={14}
                />

                Delete All
              </>

            )}

          </button>

        </div>

      </div>


      {/* =====================================================
          LOADING
      ===================================================== */}

      {isLoading && (

        <div
          style={{

            background:
              C.white,

            border:
              `1px solid ${C.border}`,

            borderRadius:
              "14px",

            padding:
              "3rem",

            textAlign:
              "center",

            color:
              C.secondary,

            boxShadow:
              "0 5px 16px rgba(57,36,78,0.06)"

          }}
        >

          <Loader2
            size={21}

            color={
              C.purple
            }

            style={{
              marginBottom:
                "0.6rem"
            }}
          />


          <div
            style={{
              fontSize:
                "0.8rem"
            }}
          >

            Loading incident history...

          </div>

        </div>

      )}


      {/* =====================================================
          ERROR
      ===================================================== */}

      {!isLoading &&
        error && (

        <div
          style={{

            padding:
              "0.9rem 1rem",

            display: "flex",

            alignItems:
              "center",

            gap:
              "0.55rem",

            background:
              C.redBg,

            color:
              C.redDark,

            border:
              `1px solid ${C.redBorder}`,

            borderRadius:
              "10px",

            fontSize:
              "0.76rem",

            fontWeight: 600

          }}
        >

          <AlertTriangle
            size={16}
          />

          {error}

        </div>

      )}


      {/* =====================================================
          HISTORY WHITE CARD
      ===================================================== */}

      {!isLoading && (

        <div
          style={{

            background:
              C.white,

            border:
              `1px solid ${C.border}`,

            borderRadius:
              "14px",

            padding:
              "1rem",

            boxShadow:
              "0 5px 18px rgba(57,36,78,0.07)",

            overflowX:
              "auto"

          }}
        >

          {filteredAlerts.length ===
          0 ? (

            /* =================================================
               EMPTY
            ================================================= */

            <div
              style={{

                minHeight:
                  "260px",

                padding:
                  "3rem 1rem",

                display:
                  "flex",

                flexDirection:
                  "column",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                textAlign:
                  "center",

                color:
                  C.secondary

              }}
            >

              <div
                style={{

                  width:
                    "52px",

                  height:
                    "52px",

                  borderRadius:
                    "13px",

                  display:
                    "flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "center",

                  background:
                    C.purpleSoft,

                  color:
                    C.purple,

                  marginBottom:
                    "0.8rem"

                }}
              >

                <Clock
                  size={25}
                  strokeWidth={1.7}
                />

              </div>


              <div
                style={{

                  color:
                    C.text,

                  fontWeight:
                    650,

                  fontSize:
                    "0.86rem"

                }}
              >

                No historical incidents found

              </div>


              <div
                style={{

                  marginTop:
                    "0.3rem",

                  color:
                    C.muted,

                  fontSize:
                    "0.72rem"

                }}
              >

                Alerts from the selected wearer will appear here.

              </div>

            </div>

          ) : (

            /* =================================================
               TABLE
            ================================================= */

            <table
              style={{

                width: "100%",

                minWidth:
                  "930px",

                borderCollapse:
                  "separate",

                borderSpacing:
                  "0 8px",

                fontSize:
                  "0.75rem",

                textAlign:
                  "left",

                color:
                  C.text

              }}
            >

              {/* TABLE HEADER */}

              <thead>

                <tr>

                  <th
                    style={{
                      ...headerCell,
                      borderTopLeftRadius:
                        "9px",
                      borderBottomLeftRadius:
                        "9px"
                    }}
                  >
                    Timestamp
                  </th>


                  <th
                    style={
                      headerCell
                    }
                  >
                    Trigger Source
                  </th>


                  <th
                    style={
                      headerCell
                    }
                  >
                    Incident Message
                  </th>


                  <th
                    style={
                      headerCell
                    }
                  >
                    Vitals & GPS
                  </th>


                  <th
                    style={
                      headerCell
                    }
                  >
                    Status
                  </th>


                  <th
                    style={{
                      ...headerCell,

                      textAlign:
                        "center",

                      borderTopRightRadius:
                        "9px",

                      borderBottomRightRadius:
                        "9px"
                    }}
                  >
                    Action
                  </th>

                </tr>

              </thead>


              <tbody>

                {filteredAlerts.map(
                  (
                    alert,
                    index
                  ) => {

                    const gps =
                      formatGPS(
                        alert.latitude,
                        alert.longitude
                      );


                    const trigger =
                      String(
                        alert.triggeredBy ||
                        "SOS"
                      ).toUpperCase();


                    const isSOS =
                      trigger.includes(
                        "SOS"
                      );


                    const isActive =
                      String(
                        alert.status ||
                        ""
                      ).toLowerCase() ===
                      "active";


                    const deleting =
                      deletingId ===
                      alert._id;


                    const rowBackground =
                      index % 2 === 0
                        ? C.row
                        : C.rowAlt;


                    return (

                      <tr
                        key={
                          alert._id ||
                          `${alert.createdAt}-${trigger}`
                        }

                        style={{

                          background:
                            rowBackground,

                          boxShadow:
                            "0 2px 7px rgba(57,36,78,0.045)"

                        }}
                      >


                        {/* TIMESTAMP */}

                        <td
                          style={{

                            ...bodyCell,

                            borderLeft:
                              `1px solid ${C.border}`,

                            borderTopLeftRadius:
                              "9px",

                            borderBottomLeftRadius:
                              "9px",

                            color:
                              C.secondary,

                            whiteSpace:
                              "nowrap"

                          }}
                        >

                          {alert.createdAt

                            ? new Date(
                                alert.createdAt
                              ).toLocaleString()

                            : "—"
                          }

                        </td>


                        {/* TRIGGER */}

                        <td
                          style={
                            bodyCell
                          }
                        >

                          <span
                            style={{

                              display:
                                "inline-flex",

                              alignItems:
                                "center",

                              justifyContent:
                                "center",

                              padding:
                                "0.25rem 0.55rem",

                              borderRadius:
                                "999px",

                              background:
                                isSOS
                                  ? C.redBg
                                  : C.amberBg,

                              color:
                                isSOS
                                  ? C.redDark
                                  : C.amber,

                              border:
                                isSOS
                                  ? `1px solid ${C.redBorder}`
                                  : `1px solid ${C.amberBorder}`,

                              fontSize:
                                "0.63rem",

                              fontWeight:
                                650,

                              whiteSpace:
                                "nowrap"

                            }}
                          >

                            {alert.triggeredBy ||
                              "SOS"}

                          </span>

                        </td>


                        {/* MESSAGE */}

                        <td
                          style={{

                            ...bodyCell,

                            color:
                              C.text,

                            fontWeight:
                              550,

                            maxWidth:
                              "260px"

                          }}
                        >

                          {alert.message ||
                            "Emergency trigger"}

                        </td>


                        {/* VITALS */}

                        <td
                          style={{

                            ...bodyCell,

                            color:
                              C.secondary,

                            lineHeight:
                              1.55

                          }}
                        >

                          {alert.heartRate !==
                            undefined &&

                            alert.heartRate !==
                            null && (

                            <div>

                              <span
                                style={{

                                  color:
                                    C.text,

                                  fontWeight:
                                    600

                                }}
                              >

                                HR:

                              </span>{" "}

                              {
                                alert.heartRate
                              } BPM

                            </div>

                          )}


                          {gps && (

                            <div>
                              {gps}
                            </div>

                          )}


                          {alert.heartRate ==
                            null &&
                            !gps &&
                            "—"}

                        </td>


                        {/* STATUS */}

                        <td
                          style={
                            bodyCell
                          }
                        >

                          <span
                            style={{

                              display:
                                "inline-flex",

                              alignItems:
                                "center",

                              justifyContent:
                                "center",

                              padding:
                                "0.25rem 0.58rem",

                              borderRadius:
                                "999px",

                              fontSize:
                                "0.63rem",

                              fontWeight:
                                650,

                              background:
                                isActive
                                  ? C.redBg
                                  : C.greenBg,

                              color:
                                isActive
                                  ? C.redDark
                                  : C.green,

                              border:
                                isActive
                                  ? `1px solid ${C.redBorder}`
                                  : `1px solid ${C.greenBorder}`

                            }}
                          >

                            {alert.status ||
                              "Resolved"}

                          </span>

                        </td>


                        {/* ACTION */}

                        <td
                          style={{

                            ...bodyCell,

                            borderRight:
                              `1px solid ${C.border}`,

                            borderTopRightRadius:
                              "9px",

                            borderBottomRightRadius:
                              "9px",

                            textAlign:
                              "center"

                          }}
                        >

                          <button
                            onClick={() =>
                              deleteAlert(
                                alert._id
                              )
                            }

                            disabled={
                              deleting
                            }

                            title="Delete alert"

                            style={{

                              display:
                                "inline-flex",

                              alignItems:
                                "center",

                              justifyContent:
                                "center",

                              gap:
                                "0.3rem",

                              minHeight:
                                "31px",

                              padding:
                                "0.35rem 0.6rem",

                              borderRadius:
                                "7px",

                              border:
                                `1px solid ${C.red}`,

                              background:
                                C.red,

                              color:
                                "#FFFFFF",

                              fontSize:
                                "0.67rem",

                              fontWeight:
                                600,

                              cursor:
                                deleting
                                  ? "not-allowed"
                                  : "pointer",

                              opacity:
                                deleting
                                  ? 0.6
                                  : 1,

                              boxShadow:
                                "0 2px 5px rgba(198,83,92,0.13)"

                            }}
                          >

                            {deleting ? (

                              <Loader2
                                size={13}
                              />

                            ) : (

                              <Trash2
                                size={13}
                              />

                            )}


                            {deleting
                              ? "Deleting"
                              : "Delete"
                            }

                          </button>

                        </td>

                      </tr>

                    );

                  }
                )}

              </tbody>

            </table>

          )}

        </div>

      )}

    </div>

  );

};


/* =========================================================
   TABLE STYLE HELPERS
========================================================= */

const headerCell = {

  padding:
    "0.65rem 0.85rem",

  background:
    "#EEE6F4",

  color:
    "#4F4555",

  borderTop:
    "1px solid #DDD2E7",

  borderBottom:
    "1px solid #DDD2E7",

  fontWeight:
    650,

  fontSize:
    "0.67rem",

  whiteSpace:
    "nowrap"

};


const bodyCell = {

  padding:
    "0.75rem 0.85rem",

  borderTop:
    "1px solid #E6DDEA",

  borderBottom:
    "1px solid #E6DDEA",

  verticalAlign:
    "middle"

};