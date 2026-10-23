import React, {
  useEffect,
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";

import Layout from "../components/Layout";

import {
  alertApi,
  request
} from "../services/api";


export default function History() {

  const nav = useNavigate();


  /* =========================================================
     STATES
  ========================================================= */

  const [alerts, setAlerts] =
    useState([]);

  const [filter, setFilter] =
    useState("All");

  const [err, setErr] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [deletingId, setDeletingId] =
    useState(null);

  const [deletingAll, setDeletingAll] =
    useState(false);


  const stationId =
    localStorage.getItem(
      "policeStationId"
    );


  /* =========================================================
     NORMALIZE STATUS
  ========================================================= */

  function getStatus(alert) {

    const status =
      String(
        alert?.status ||
        "Pending"
      )
        .trim()
        .toLowerCase();


    if (
      status ===
      "accepted"
    ) {

      return "Accepted";

    }


    if (
      status ===
      "resolved"
    ) {

      return "Resolved";

    }


    return "Pending";

  }


  /* =========================================================
     LOAD ALERT HISTORY
  ========================================================= */

  async function loadAlerts() {

    if (!stationId) {

      setErr(
        "Police Station ID not found. Please login again."
      );

      setLoading(false);

      return;

    }


    try {

      setErr("");


      const data =
        await request(

          `${alertApi}/station/${encodeURIComponent(
            stationId
          )}`

        );


      setAlerts(

        Array.isArray(
          data?.alerts
        )
          ? data.alerts
          : []

      );


    } catch (error) {

      console.error(
        "History load error:",
        error
      );


      setErr(

        error.message ||

        "Unable to load alert history."

      );


    } finally {

      setLoading(false);

    }

  }


  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {

    loadAlerts();

    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, []);


  /* =========================================================
     INDIVIDUAL DELETE
     ONLY RESOLVED ALERT
  ========================================================= */

  async function deleteAlert(alert) {

    if (!alert?._id) {

      return;

    }


    /* FRONTEND SAFETY */

    if (
      getStatus(alert) !==
      "Resolved"
    ) {

      setErr(
        "Only resolved alerts can be deleted."
      );

      return;

    }


    const confirmed =
      window.confirm(

        `Delete this resolved alert${
          alert.wearerName
            ? ` for ${alert.wearerName}`
            : ""
        }?\n\nThis action cannot be undone.`

      );


    if (!confirmed) {

      return;

    }


    try {

      setErr("");

      setDeletingId(
        alert._id
      );


      /* =============================================
         CORRECT BACKEND ROUTE

         DELETE /delete/:alertId
      ============================================= */

      await request(

        `${alertApi}/delete/${alert._id}`,

        {
          method: "DELETE"
        }

      );


      /* REMOVE FROM UI */

      setAlerts(

        (current) =>
          current.filter(

            (item) =>

              String(
                item._id
              ) !==

              String(
                alert._id
              )

          )

      );


    } catch (error) {

      console.error(
        "Delete alert error:",
        error
      );


      setErr(

        error.message ||

        "Unable to delete this alert."

      );


    } finally {

      setDeletingId(null);

    }

  }


  /* =========================================================
     DELETE ALL RESOLVED
  ========================================================= */

  async function deleteAllResolvedAlerts() {

    if (!stationId) {

      setErr(
        "Police Station ID not found."
      );

      return;

    }


    const resolvedAlerts =
      alerts.filter(

        (alert) =>
          getStatus(alert) ===
          "Resolved"

      );


    if (
      resolvedAlerts.length === 0
    ) {

      setErr(
        "There are no resolved alerts available to delete."
      );

      return;

    }


    const confirmed =
      window.confirm(

        `Delete all ${resolvedAlerts.length} resolved alert${
          resolvedAlerts.length === 1
            ? ""
            : "s"
        }?\n\nPending and accepted alerts will NOT be deleted.\n\nThis action cannot be undone.`

      );


    if (!confirmed) {

      return;

    }


    try {

      setErr("");

      setDeletingAll(true);


      /* =============================================
         CORRECT BACKEND ROUTE

         DELETE
         /delete-resolved/:policeStationId
      ============================================= */

      const data =
        await request(

          `${alertApi}/delete-resolved/${encodeURIComponent(
            stationId
          )}`,

          {
            method: "DELETE"
          }

        );


      console.log(
        "Delete resolved response:",
        data
      );


      /* RELOAD FROM DATABASE */

      await loadAlerts();


    } catch (error) {

      console.error(
        "Delete all resolved alerts error:",
        error
      );


      setErr(

        error.message ||

        "Unable to delete resolved alert history."

      );


    } finally {

      setDeletingAll(false);

    }

  }


  /* =========================================================
     FILTER
  ========================================================= */

  const rows =

    filter === "All"

      ? alerts

      : alerts.filter(

          (alert) =>
            getStatus(alert) ===
            filter

        );


  /* =========================================================
     RESOLVED COUNT
  ========================================================= */

  const resolvedCount =

    alerts.filter(

      (alert) =>
        getStatus(alert) ===
        "Resolved"

    ).length;


  /* =========================================================
     FORMAT DATE
  ========================================================= */

  function formatDate(value) {

    if (!value) {

      return "—";

    }


    const date =
      new Date(value);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return "—";

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
     VIEW ALERT
  ========================================================= */

  function viewAlert(alert) {

    if (!alert?._id) {

      return;

    }


    localStorage.setItem(

      "selectedPoliceAlert",

      JSON.stringify(
        alert
      )

    );


    nav(
      `/alerts/${alert._id}`
    );

  }


  /* =========================================================
     UI
  ========================================================= */

  return (

    <Layout

      title="Alert History"

      subtitle="Review all emergencies assigned to your station"

    >


      {/* =====================================================
          TOOLBAR
      ===================================================== */}

      <div

        className="toolbar"

        style={{

          display: "flex",

          alignItems:
            "center",

          justifyContent:
            "space-between",

          gap:
            "0.8rem",

          flexWrap:
            "wrap"

        }}

      >


        {/* LEFT SIDE */}

        <div

          style={{

            display:
              "flex",

            alignItems:
              "center",

            gap:
              "0.6rem",

            flexWrap:
              "wrap"

          }}

        >


          {/* FILTER */}

          <select

            value={filter}

            onChange={(e) => {

              setFilter(
                e.target.value
              );

              setErr("");

            }}

          >

            <option value="All">

              All

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


          {/* ALERT COUNT */}

          <span

            style={{

              fontSize:
                "0.72rem",

              color:
                "#75687C",

              fontWeight:
                600

            }}

          >

            {rows.length}

            {" "}

            alert

            {rows.length !== 1
              ? "s"
              : ""}

          </span>

        </div>


        {/* =================================================
            DELETE ALL RESOLVED
        ================================================= */}

        <button

          type="button"

          onClick={
            deleteAllResolvedAlerts
          }

          disabled={
            deletingAll ||
            resolvedCount === 0
          }

          title={

            resolvedCount === 0

              ? "No resolved alerts available to delete"

              : "Delete all resolved alerts"

          }

          style={{

            border:
              "1px solid #C9505D",

            background:

              deletingAll ||
              resolvedCount === 0

                ? "#E9E5EA"

                : "#B94452",

            color:

              deletingAll ||
              resolvedCount === 0

                ? "#8C848F"

                : "#FFFFFF",

            borderRadius:
              "8px",

            padding:
              "0.65rem 1rem",

            fontSize:
              "0.76rem",

            fontWeight:
              700,

            cursor:

              deletingAll ||
              resolvedCount === 0

                ? "not-allowed"

                : "pointer",

            transition:
              "0.2s ease"

          }}

        >

          {

            deletingAll

              ? "Deleting..."

              : resolvedCount > 0

              ? `Delete All Resolved (${resolvedCount})`

              : "Delete All Resolved"

          }

        </button>

      </div>


      {/* =====================================================
          ERROR
      ===================================================== */}

      {err && (

        <div

          className="error banner"

          style={{
            marginTop:
              "0.8rem"
          }}

        >

          {err}

        </div>

      )}


      {/* =====================================================
          TABLE
      ===================================================== */}

      <section className="panel">

        <div className="tablewrap">


          <table>


            {/* =========================
                TABLE HEADER
            ========================= */}

            <thead>

              <tr>

                <th>
                  Time
                </th>

                <th>
                  Wearer
                </th>

                <th>
                  Alert
                </th>

                <th>
                  Status
                </th>

                <th>
                  Actions
                </th>

              </tr>

            </thead>


            {/* =========================
                TABLE BODY
            ========================= */}

            <tbody>


              {rows.map(

                (alert) => {


                  const status =
                    getStatus(
                      alert
                    );


                  const canDelete =

                    status ===
                    "Resolved";


                  const isDeleting =

                    deletingId ===
                    alert._id;


                  return (

                    <tr
                      key={
                        alert._id
                      }
                    >


                      {/* TIME */}

                      <td>

                        {formatDate(
                          alert.createdAt
                        )}

                      </td>


                      {/* WEARER */}

                      <td>

                        {alert.wearerName ||
                          "—"}

                      </td>


                      {/* ALERT */}

                      <td>

                        {alert.alertType ||

                          alert.type ||

                          "Emergency"}

                      </td>


                      {/* STATUS */}

                      <td>

                        <span

                          className={`badge ${status.toLowerCase()}`}

                        >

                          {status}

                        </span>

                      </td>


                      {/* ACTIONS */}

                      <td>


                        <div

                          style={{

                            display:
                              "flex",

                            alignItems:
                              "center",

                            gap:
                              "0.45rem",

                            flexWrap:
                              "wrap"

                          }}

                        >


                          {/* =========================
                              VIEW
                          ========================= */}

                          <button

                            type="button"

                            className="secondary"

                            onClick={() =>
                              viewAlert(
                                alert
                              )
                            }

                          >

                            View

                          </button>


                          {/* =========================
                              DELETE

                              ONLY RESOLVED ALERT
                          ========================= */}

                          {canDelete ? (

                            <button

                              type="button"

                              onClick={() =>
                                deleteAlert(
                                  alert
                                )
                              }

                              disabled={
                                isDeleting ||
                                deletingAll
                              }

                              style={{

                                border:
                                  "1px solid #D6A0A6",

                                background:

                                  isDeleting ||
                                  deletingAll

                                    ? "#ECE8ED"

                                    : "#FFF4F5",

                                color:

                                  isDeleting ||
                                  deletingAll

                                    ? "#8C848F"

                                    : "#B6404D",

                                borderRadius:
                                  "7px",

                                padding:
                                  "0.48rem 0.72rem",

                                fontSize:
                                  "0.72rem",

                                fontWeight:
                                  700,

                                cursor:

                                  isDeleting ||
                                  deletingAll

                                    ? "not-allowed"

                                    : "pointer",

                                transition:
                                  "0.2s ease"

                              }}

                            >

                              {

                                isDeleting

                                  ? "Deleting..."

                                  : "Delete"

                              }

                            </button>

                          ) : (

                            /* =========================
                               NOT RESOLVED

                               NO DELETE BUTTON
                            ========================= */

                            <span

                              title="Resolve this alert before deleting it"

                              style={{

                                padding:
                                  "0.45rem 0.6rem",

                                borderRadius:
                                  "6px",

                                background:
                                  "#F3EFF4",

                                color:
                                  "#85798A",

                                fontSize:
                                  "0.66rem",

                                fontWeight:
                                  600,

                                whiteSpace:
                                  "nowrap"

                              }}

                            >

                              Resolve to delete

                            </span>

                          )}

                        </div>

                      </td>

                    </tr>

                  );

                }

              )}


            </tbody>

          </table>


          {/* =================================================
              LOADING
          ================================================= */}

          {loading && (

            <div className="empty">

              Loading alert history...

            </div>

          )}


          {/* =================================================
              EMPTY
          ================================================= */}

          {!loading &&
            rows.length === 0 && (

              <div className="empty">

                {

                  filter ===
                  "All"

                    ? "No alerts found."

                    : `No ${filter.toLowerCase()} alerts found.`

                }

              </div>

            )}

        </div>

      </section>

    </Layout>

  );

}