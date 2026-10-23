import React, {
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { alertApi, request } from "../services/api";

export default function Dashboard() {
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [profileFilter, setProfileFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("Newest");

  const [lastSync, setLastSync] = useState(null);

  /* =========================================================
     NEW ALERT POPUP
  ========================================================= */

  const [popupAlert, setPopupAlert] = useState(null);

  const knownAlertIds = useRef(new Set());
  const firstAlertLoad = useRef(true);

  const stationId =
    localStorage.getItem("policeStationId");

  /* =========================================================
     NORMALIZE STATUS
  ========================================================= */

  function getStatus(alert) {
    const status = String(
      alert?.status || "Pending"
    ).trim();

    if (
      status.toLowerCase() === "accepted"
    ) {
      return "Accepted";
    }

    if (
      status.toLowerCase() === "resolved"
    ) {
      return "Resolved";
    }

    return "Pending";
  }

  /* =========================================================
     LOAD POLICE ALERTS
  ========================================================= */

  async function loadAlerts() {
    if (!stationId) {
      setError(
        "Police Station ID not found. Please login again."
      );

      setLoading(false);
      return;
    }

    try {
      const data = await request(
        `${alertApi}/station/${encodeURIComponent(
          stationId
        )}`
      );

      const receivedAlerts =
        Array.isArray(data?.alerts)
          ? data.alerts
          : [];

      /* =====================================================
         NEW ALERT DETECTION

         First load:
         Existing alerts are remembered but popup is NOT shown.

         Next polling calls:
         Only a newly received active alert shows popup.
      ===================================================== */

      if (firstAlertLoad.current) {
        receivedAlerts.forEach((alert) => {
          if (alert?._id) {
            knownAlertIds.current.add(
              String(alert._id)
            );
          }
        });

        firstAlertLoad.current = false;
      } else {
        const newAlerts =
          receivedAlerts.filter(
            (alert) =>
              alert?._id &&
              !knownAlertIds.current.has(
                String(alert._id)
              ) &&
              getStatus(alert) !== "Resolved"
          );

        /* Remember every received alert */

        receivedAlerts.forEach((alert) => {
          if (alert?._id) {
            knownAlertIds.current.add(
              String(alert._id)
            );
          }
        });

        /* Show newest newly received alert */

        if (newAlerts.length > 0) {
          const newestNewAlert =
            [...newAlerts].sort(
              (a, b) =>
                new Date(
                  b.createdAt || 0
                ).getTime() -
                new Date(
                  a.createdAt || 0
                ).getTime()
            )[0];

          setPopupAlert(
            newestNewAlert
          );
        }
      }

      setAlerts(receivedAlerts);

      setLastSync(new Date());

      setError("");
    } catch (err) {
      console.error(
        "Dashboard alert load error:",
        err
      );

      setError(
        err.message ||
          "Unable to load emergency alerts."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     AUTO REFRESH
  ========================================================= */

  useEffect(() => {
    loadAlerts();

    const timer = setInterval(
      loadAlerts,
      5000
    );

    return () =>
      clearInterval(timer);

    // stationId comes from login/localStorage
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =========================================================
     STATISTICS
  ========================================================= */

  const counts = useMemo(() => {
    return {
      pending: alerts.filter(
        (alert) =>
          getStatus(alert) === "Pending"
      ).length,

      accepted: alerts.filter(
        (alert) =>
          getStatus(alert) === "Accepted"
      ).length,

      resolved: alerts.filter(
        (alert) =>
          getStatus(alert) === "Resolved"
      ).length,

      total: alerts.length
    };
  }, [alerts]);

  /* =========================================================
     ACTIVE ALERTS
  ========================================================= */

  const activeAlerts = useMemo(() => {
    return alerts.filter(
      (alert) =>
        getStatus(alert) !== "Resolved"
    );
  }, [alerts]);

  /* =========================================================
     LATEST ACTIVE ALERT
  ========================================================= */

  const latestActiveAlert =
    useMemo(() => {
      if (
        activeAlerts.length === 0
      ) {
        return null;
      }

      return [...activeAlerts].sort(
        (a, b) =>
          new Date(
            b.createdAt || 0
          ).getTime() -
          new Date(
            a.createdAt || 0
          ).getTime()
      )[0];
    }, [activeAlerts]);

  /* =========================================================
     FILTERED ALERTS
  ========================================================= */

  const filteredAlerts =
    useMemo(() => {
      let result = [...alerts];

      /* SEARCH */

      if (search.trim()) {
        const query =
          search
            .trim()
            .toLowerCase();

        result = result.filter(
          (alert) => {
            const wearerName =
              String(
                alert.wearerName || ""
              ).toLowerCase();

            const guardianName =
              String(
                alert.guardianName || ""
              ).toLowerCase();

            const alertType =
              String(
                alert.alertType ||
                  alert.type ||
                  ""
              ).toLowerCase();

            return (
              wearerName.includes(query) ||
              guardianName.includes(query) ||
              alertType.includes(query)
            );
          }
        );
      }

      /* STATUS */

      if (
        statusFilter !== "All"
      ) {
        result = result.filter(
          (alert) =>
            getStatus(alert) ===
            statusFilter
        );
      }

      /* PROFILE */

      if (
        profileFilter !== "All"
      ) {
        result = result.filter(
          (alert) => {
            const type =
              String(
                alert.wearerType || ""
              ).toLowerCase();

            if (
              profileFilter ===
              "Child"
            ) {
              return type === "child";
            }

            if (
              profileFilter ===
              "Women"
            ) {
              return (
                type === "woman" ||
                type === "women"
              );
            }

            return true;
          }
        );
      }

      /* SORT */

      result.sort((a, b) => {
        const aTime =
          new Date(
            a.createdAt || 0
          ).getTime();

        const bTime =
          new Date(
            b.createdAt || 0
          ).getTime();

        return sortOrder ===
          "Newest"
          ? bTime - aTime
          : aTime - bTime;
      });

      return result;
    }, [
      alerts,
      search,
      statusFilter,
      profileFilter,
      sortOrder
    ]);

  /* =========================================================
     RECENT RESPONSE ACTIVITY
  ========================================================= */

  const recentResponses =
    useMemo(() => {
      return [...alerts]
        .filter(
          (alert) =>
            getStatus(alert) ===
              "Accepted" ||
            getStatus(alert) ===
              "Resolved"
        )
        .sort(
          (a, b) =>
            new Date(
              b.updatedAt ||
                b.createdAt ||
                0
            ).getTime() -
            new Date(
              a.updatedAt ||
                a.createdAt ||
                0
            ).getTime()
        )
        .slice(0, 4);
    }, [alerts]);

  /* =========================================================
     VIEW DETAILS
  ========================================================= */

  function openAlertDetails(alert) {
    if (!alert?._id) {
      return;
    }

    localStorage.setItem(
      "selectedPoliceAlert",
      JSON.stringify(alert)
    );

    navigate(
      `/alerts/${alert._id}`
    );
  }

  /* =========================================================
     UPDATE ALERT
  ========================================================= */

  async function updateAlert(
    alertId,
    action
  ) {
    try {
      setError("");

      await request(
        `${alertApi}/${action}/${alertId}`,
        {
          method: "PUT"
        }
      );

      await loadAlerts();
    } catch (err) {
      console.error(
        "Alert update error:",
        err
      );

      setError(
        err.message ||
          "Unable to update alert."
      );

      throw err;
    }
  }

  /* =========================================================
     ACCEPT FROM POPUP
  ========================================================= */

  async function acceptPopupAlert() {
    if (!popupAlert?._id) {
      return;
    }

    const alertId =
      popupAlert._id;

    try {
      await updateAlert(
        alertId,
        "accept"
      );

      setPopupAlert(null);
    } catch (err) {
      // Error already displayed by updateAlert
    }
  }

  /* =========================================================
     FORMAT DATE
  ========================================================= */

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
      "en-IN",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }
    );
  }

  /* =========================================================
     POPUP HELPERS
  ========================================================= */

  function getProfileLabel(alert) {
    const type =
      String(
        alert?.wearerType || ""
      ).toLowerCase();

    return type === "child"
      ? "Child Safety Profile"
      : "Women Safety Profile";
  }

  function getAlertType(alert) {
    return (
      alert?.alertType ||
      alert?.type ||
      "Emergency Alert"
    );
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <>
      {/* =====================================================
          NEW POLICE EMERGENCY POPUP
      ===================================================== */}

      {popupAlert && (
        <div
          style={{
            position: "fixed",
            inset: 0,

            zIndex: 999999,

            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            padding: "1rem",

            background:
              "rgba(20, 11, 29, 0.72)",

            backdropFilter:
              "blur(7px)",

            WebkitBackdropFilter:
              "blur(7px)"
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "540px",

              maxHeight: "92vh",
              overflowY: "auto",

              background:
                "#FFFFFF",

              borderRadius: "18px",

              boxShadow:
                "0 28px 80px rgba(20, 8, 30, 0.38)",

              border:
                "1px solid rgba(98, 64, 120, 0.18)",

              overflowX: "hidden"
            }}
          >
            {/* POPUP HEADER */}

            <div
              style={{
                position: "relative",

                padding:
                  "1.35rem 1.4rem",

                paddingRight:
                  "3.8rem",

                background:
                  "linear-gradient(135deg, #B74659 0%, #8A2F42 100%)",

                color: "#FFFFFF"
              }}
            >
              <button
                type="button"
                onClick={() =>
                  setPopupAlert(null)
                }
                aria-label="Close emergency alert"
                style={{
                  position:
                    "absolute",

                  top: "1rem",
                  right: "1rem",

                  width: "34px",
                  height: "34px",

                  borderRadius:
                    "9px",

                  border:
                    "1px solid rgba(255,255,255,0.25)",

                  background:
                    "rgba(255,255,255,0.12)",

                  color: "#FFFFFF",

                  display:
                    "flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "center",

                  cursor:
                    "pointer",

                  fontSize:
                    "1.15rem",

                  fontWeight:
                    700
                }}
              >
                ×
              </button>

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
                      "45px",

                    height:
                      "45px",

                    borderRadius:
                      "12px",

                    display:
                      "flex",

                    alignItems:
                      "center",

                    justifyContent:
                      "center",

                    flexShrink:
                      0,

                    background:
                      "rgba(255,255,255,0.15)",

                    border:
                      "1px solid rgba(255,255,255,0.18)",

                    fontSize:
                      "1.25rem"
                  }}
                >
                  !
                </div>

                <div>
                  <div
                    style={{
                      fontSize:
                        "0.68rem",

                      fontWeight:
                        800,

                      letterSpacing:
                        "0.1em",

                      opacity:
                        0.9,

                      marginBottom:
                        "0.25rem"
                    }}
                  >
                    NEW EMERGENCY ALERT
                  </div>

                  <div
                    style={{
                      fontSize:
                        "1.25rem",

                      lineHeight:
                        1.25,

                      fontWeight:
                        800
                    }}
                  >
                    Immediate Police Attention Required
                  </div>
                </div>
              </div>
            </div>

            {/* POPUP BODY */}

            <div
              style={{
                padding:
                  "1.3rem"
              }}
            >
              {/* WEARER */}

              <div
                style={{
                  padding:
                    "1rem",

                  borderRadius:
                    "12px",

                  background:
                    "#F4EEF7",

                  border:
                    "1px solid #DED1E5"
                }}
              >
                <div
                  style={{
                    fontSize:
                      "0.66rem",

                    fontWeight:
                      700,

                    color:
                      "#806E89",

                    letterSpacing:
                      "0.06em",

                    marginBottom:
                      "0.25rem"
                  }}
                >
                  WEARER
                </div>

                <div
                  style={{
                    color:
                      "#33233D",

                    fontSize:
                      "1.15rem",

                    fontWeight:
                      800,

                    lineHeight:
                      1.3
                  }}
                >
                  {popupAlert.wearerName ||
                    "Wearer"}
                </div>

                <div
                  style={{
                    marginTop:
                      "0.25rem",

                    color:
                      "#685873",

                    fontSize:
                      "0.8rem",

                    fontWeight:
                      500
                  }}
                >
                  {getProfileLabel(
                    popupAlert
                  )}
                </div>
              </div>

              {/* DETAILS */}

              <div
                style={{
                  display:
                    "grid",

                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(180px, 1fr))",

                  gap:
                    "0.75rem",

                  marginTop:
                    "0.85rem"
                }}
              >
                <PopupDetail
                  label="ALERT TYPE"
                  value={getAlertType(
                    popupAlert
                  )}
                />

                <PopupDetail
                  label="STATUS"
                  value={getStatus(
                    popupAlert
                  )}
                  valueColor="#B63F52"
                />

                <PopupDetail
                  label="GUARDIAN"
                  value={
                    popupAlert.guardianName ||
                    "Not Available"
                  }
                />

                <PopupDetail
                  label="TIME"
                  value={formatDate(
                    popupAlert.createdAt
                  )}
                />

                {popupAlert.guardianPhone && (
                  <PopupDetail
                    label="GUARDIAN PHONE"
                    value={
                      popupAlert.guardianPhone
                    }
                  />
                )}

                {popupAlert.distanceKm !=
                  null && (
                  <PopupDetail
                    label="DISTANCE"
                    value={`${popupAlert.distanceKm} km`}
                  />
                )}
              </div>

              {/* MESSAGE */}

              <div
                style={{
                  marginTop:
                    "0.85rem",

                  padding:
                    "0.85rem 0.95rem",

                  borderRadius:
                    "10px",

                  background:
                    "#FFF0F2",

                  border:
                    "1px solid #F1CDD3",

                  color:
                    "#6D3540",

                  fontSize:
                    "0.8rem",

                  lineHeight:
                    1.5,

                  fontWeight:
                    600
                }}
              >
                A new emergency alert has been assigned to this police station.
                Review the alert details and respond immediately.
              </div>

              {/* ACTIONS */}

              <div
                style={{
                  display:
                    "flex",

                  flexWrap:
                    "wrap",

                  gap:
                    "0.65rem",

                  marginTop:
                    "1.2rem"
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    const alert =
                      popupAlert;

                    setPopupAlert(
                      null
                    );

                    openAlertDetails(
                      alert
                    );
                  }}
                  style={{
                    flex:
                      "1 1 170px",

                    minHeight:
                      "43px",

                    padding:
                      "0.72rem 1rem",

                    border:
                      "1px solid #51376A",

                    borderRadius:
                      "9px",

                    background:
                      "linear-gradient(135deg, #684983 0%, #4E3466 100%)",

                    color:
                      "#FFFFFF",

                    fontSize:
                      "0.78rem",

                    fontWeight:
                      700,

                    cursor:
                      "pointer",

                    boxShadow:
                      "0 5px 14px rgba(78,52,102,0.20)"
                  }}
                >
                  View Alert Details
                </button>

                {getStatus(
                  popupAlert
                ) ===
                  "Pending" && (
                  <button
                    type="button"
                    onClick={
                      acceptPopupAlert
                    }
                    style={{
                      flex:
                        "1 1 150px",

                      minHeight:
                        "43px",

                      padding:
                        "0.72rem 1rem",

                      border:
                        "1px solid #23775F",

                      borderRadius:
                        "9px",

                      background:
                        "linear-gradient(135deg, #35A982 0%, #26795F 100%)",

                      color:
                        "#FFFFFF",

                      fontSize:
                        "0.78rem",

                      fontWeight:
                        700,

                      cursor:
                        "pointer",

                      boxShadow:
                        "0 5px 14px rgba(38,121,95,0.18)"
                    }}
                  >
                    Accept Alert
                  </button>
                )}

                <button
                  type="button"
                  onClick={() =>
                    setPopupAlert(
                      null
                    )
                  }
                  style={{
                    minHeight:
                      "43px",

                    padding:
                      "0.72rem 1rem",

                    border:
                      "1px solid #D6CBDC",

                    borderRadius:
                      "9px",

                    background:
                      "#FFFFFF",

                    color:
                      "#4B3A55",

                    fontSize:
                      "0.78rem",

                    fontWeight:
                      700,

                    cursor:
                      "pointer"
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          EXISTING DASHBOARD
      ===================================================== */}

      <Layout
        title="Emergency Dashboard"
        subtitle="Real-time women and child safety alerts"
      >
        {/* ==========================================
            STATISTICS
        ========================================== */}

        <div className="dashboard-stats">
          <div className="dashboard-stat pending-stat">
            <span>
              Pending Alerts
            </span>

            <strong>
              {counts.pending}
            </strong>

            <small>
              Awaiting police response
            </small>
          </div>

          <div className="dashboard-stat accepted-stat">
            <span>
              Accepted Alerts
            </span>

            <strong>
              {counts.accepted}
            </strong>

            <small>
              Response in progress
            </small>
          </div>

          <div className="dashboard-stat resolved-stat">
            <span>
              Resolved Alerts
            </span>

            <strong>
              {counts.resolved}
            </strong>

            <small>
              Completed incidents
            </small>
          </div>

          <div className="dashboard-stat total-stat">
            <span>
              Total Alerts
            </span>

            <strong>
              {counts.total}
            </strong>

            <small>
              Alerts assigned to station
            </small>
          </div>
        </div>

        {/* ==========================================
            ERROR
        ========================================== */}

        {error && (
          <div className="error banner">
            {error}
          </div>
        )}

        {/* ==========================================
            LATEST ACTIVE EMERGENCY
        ========================================== */}

        <section className="dashboard-section">
          <div className="dashboard-section-header">
            <div>
              <div className="dashboard-label">
                IMMEDIATE RESPONSE
              </div>

              <h2>
                Latest Active Emergency
              </h2>

              <p>
                Most recent emergency currently requiring attention.
              </p>
            </div>

            <div className="live-monitoring">
              <span></span>
              Live Monitoring
            </div>
          </div>

          {loading ? (
            <div className="dashboard-empty">
              Loading latest emergency...
            </div>
          ) : !latestActiveAlert ? (
            <div className="dashboard-empty latest-empty">
              <strong>
                No Active Emergency
              </strong>

              <span>
                There are currently no pending or accepted alerts.
              </span>
            </div>
          ) : (
            <div className="latest-alert">
              <div className="latest-alert-main">
                <div>
                  <span className="mini-label">
                    WEARER
                  </span>

                  <h3>
                    {latestActiveAlert.wearerName ||
                      "Wearer"}
                  </h3>

                  <p>
                    {String(
                      latestActiveAlert.wearerType ||
                        ""
                    ).toLowerCase() ===
                    "child"
                      ? "Child Safety Profile"
                      : "Women Safety Profile"}
                  </p>
                </div>

                <div>
                  <span className="mini-label">
                    ALERT TYPE
                  </span>

                  <h3>
                    {latestActiveAlert.alertType ||
                      latestActiveAlert.type ||
                      "Emergency Alert"}
                  </h3>

                  <p>
                    {formatDate(
                      latestActiveAlert.createdAt
                    )}
                  </p>
                </div>

                <div>
                  <span className="mini-label">
                    STATUS
                  </span>

                  <span
                    className={`badge ${getStatus(
                      latestActiveAlert
                    ).toLowerCase()}`}
                  >
                    {getStatus(
                      latestActiveAlert
                    )}
                  </span>
                </div>
              </div>

              <div className="latest-alert-actions">
                <button
                  type="button"
                  onClick={() =>
                    openAlertDetails(
                      latestActiveAlert
                    )
                  }
                >
                  View Alert Details
                </button>

                {getStatus(
                  latestActiveAlert
                ) === "Pending" && (
                  <button
                    type="button"
                    className="accept"
                    onClick={() =>
                      updateAlert(
                        latestActiveAlert._id,
                        "accept"
                      )
                    }
                  >
                    Accept Alert
                  </button>
                )}
              </div>
            </div>
          )}
        </section>

        {/* ==========================================
            EMERGENCY ALERT FEED
        ========================================== */}

        <section className="dashboard-section">
          <div className="dashboard-section-header">
            <div>
              <div className="dashboard-label">
                LIVE ALERT FEED
              </div>

              <h2>
                Emergency Alerts
              </h2>

              <p>
                Search and manage alerts assigned to this police station.
              </p>
            </div>
          </div>

          {/* FILTERS */}

          <div className="alert-filters">
            <input
              type="text"
              placeholder="Search wearer..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
            />

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value
                )
              }
            >
              <option value="All">
                All Status
              </option>

              <option value="Pending">
                Pending
              </option>

              <option value="Accepted">
                Accepted
              </option>

              <option value="Resolved">
                Resolved
              </option>
            </select>

            <select
              value={profileFilter}
              onChange={(e) =>
                setProfileFilter(
                  e.target.value
                )
              }
            >
              <option value="All">
                All Profiles
              </option>

              <option value="Women">
                Women
              </option>

              <option value="Child">
                Child
              </option>
            </select>

            <select
              value={sortOrder}
              onChange={(e) =>
                setSortOrder(
                  e.target.value
                )
              }
            >
              <option value="Newest">
                Newest First
              </option>

              <option value="Oldest">
                Oldest First
              </option>
            </select>

            <button
              type="button"
              onClick={loadAlerts}
            >
              Refresh
            </button>
          </div>

          {/* ALERTS */}

          {loading ? (
            <div className="dashboard-empty">
              Loading alerts...
            </div>
          ) : filteredAlerts.length ===
            0 ? (
            <div className="dashboard-empty">
              <strong>
                No Alerts
              </strong>

              <span>
                No alerts available for the selected filters.
              </span>
            </div>
          ) : (
            <div className="dashboard-alert-list">
              {filteredAlerts.map(
                (alert) => (
                  <div
                    className="dashboard-alert-row"
                    key={alert._id}
                  >
                    <div className="alert-person">
                      <strong>
                        {alert.wearerName ||
                          "Wearer"}
                      </strong>

                      <span>
                        {String(
                          alert.wearerType ||
                            ""
                        ).toLowerCase() ===
                        "child"
                          ? "Child Safety Profile"
                          : "Women Safety Profile"}
                      </span>
                    </div>

                    <div>
                      <span className="mini-label">
                        ALERT
                      </span>

                      <strong>
                        {alert.alertType ||
                          alert.type ||
                          "Emergency Alert"}
                      </strong>
                    </div>

                    <div>
                      <span className="mini-label">
                        TIME
                      </span>

                      <strong>
                        {formatDate(
                          alert.createdAt
                        )}
                      </strong>
                    </div>

                    <div>
                      <span
                        className={`badge ${getStatus(
                          alert
                        ).toLowerCase()}`}
                      >
                        {getStatus(
                          alert
                        )}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="view-alert-btn"
                      onClick={() =>
                        openAlertDetails(
                          alert
                        )
                      }
                    >
                      View
                    </button>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        {/* ==========================================
            RECENT RESPONSE ACTIVITY
        ========================================== */}

        <section className="dashboard-section response-section">
          <div className="dashboard-section-header">
            <div>
              <div className="dashboard-label">
                RESPONSE LOG
              </div>

              <h2>
                Recent Response Activity
              </h2>

              <p>
                Latest emergency activity recorded by the system.
              </p>
            </div>
          </div>

          {recentResponses.length ===
          0 ? (
            <div className="response-empty">
              No response activity available.
            </div>
          ) : (
            <div className="response-list">
              {recentResponses.map(
                (alert) => (
                  <div
                    className="response-row"
                    key={alert._id}
                  >
                    <div>
                      <strong>
                        {alert.wearerName ||
                          "Wearer"}
                      </strong>

                      <span>
                        {alert.alertType ||
                          alert.type ||
                          "Emergency Alert"}
                      </span>
                    </div>

                    <span
                      className={`badge ${getStatus(
                        alert
                      ).toLowerCase()}`}
                    >
                      {getStatus(
                        alert
                      )}
                    </span>

                    <small>
                      {formatDate(
                        alert.updatedAt ||
                          alert.createdAt
                      )}
                    </small>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        {/* ==========================================
            FOOTER
        ========================================== */}

        <div className="dashboard-footer">
          <span>
            TRINETRAAI Police Response Portal
          </span>

          <span>
            Last sync:{" "}
            {lastSync
              ? lastSync.toLocaleTimeString(
                  "en-IN",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                  }
                )
              : "--"}
          </span>
        </div>
      </Layout>
    </>
  );
}

/* =========================================================
   POPUP DETAIL
========================================================= */

function PopupDetail({
  label,
  value,
  valueColor = "#3B2B44"
}) {
  return (
    <div
      style={{
        padding:
          "0.78rem 0.85rem",

        borderRadius:
          "10px",

        background:
          "#FAF8FB",

        border:
          "1px solid #E2D9E7",

        minWidth: 0
      }}
    >
      <div
        style={{
          fontSize:
            "0.64rem",

          fontWeight:
            700,

          color:
            "#85758D",

          letterSpacing:
            "0.05em",

          marginBottom:
            "0.3rem"
        }}
      >
        {label}
      </div>

      <div
        style={{
          color:
            valueColor,

          fontSize:
            "0.8rem",

          fontWeight:
            700,

          lineHeight:
            1.4,

          wordBreak:
            "break-word"
        }}
      >
        {value ||
          "Not Available"}
      </div>
    </div>
  );
}