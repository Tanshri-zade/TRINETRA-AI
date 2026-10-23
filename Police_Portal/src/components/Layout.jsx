
import React from "react";
import {
  NavLink,
  useNavigate
} from "react-router-dom";

export default function Layout({
  children,
  title,
  subtitle
}) {
  const navigate = useNavigate();

  // ==========================================
  // ALERT DETAILS
  // ==========================================

  function openAlertDetails() {
    try {
      const savedAlert =
        localStorage.getItem(
          "selectedPoliceAlert"
        );

      if (savedAlert) {
        const alert =
          JSON.parse(savedAlert);

        if (alert?._id) {
          navigate(
            `/alerts/${alert._id}`
          );

          return;
        }
      }

      // No alert selected yet
      navigate("/alert-details");

    } catch (error) {
      console.log(
        "Selected alert read error:",
        error
      );

      navigate("/alert-details");
    }
  }


  // ==========================================
  // LOGOUT
  // ==========================================

  function logout() {
    [
      "policeLoggedIn",
      "policeStationId",
      "policeStationMongoId",
      "policeStationName",
      "policeStationLatitude",
      "policeStationLongitude",
      "selectedPoliceAlert"
    ].forEach((key) =>
      localStorage.removeItem(key)
    );

    navigate("/login");
  }


  return (
    <div className="shell">

      {/* ================= SIDEBAR ================= */}

      <aside>

        <div className="brand">
          TRINETRA<span>AI</span>

          <small>
            Police Response Portal
          </small>
        </div>


        <nav>

          <NavLink
            to="/dashboard"
          >
            Emergency Alerts
          </NavLink>


          {/* ALERT DETAILS */}

          <NavLink
            to="/alert-details"
            onClick={(event) => {
              event.preventDefault();
              openAlertDetails();
            }}
            className={({ isActive }) =>
              isActive
                ? "active"
                : ""
            }
          >
            Alert Details
          </NavLink>


          <NavLink
            to="/history"
          >
            Alert History
          </NavLink>

        </nav>


        <button
          type="button"
          className="logout"
          onClick={logout}
        >
          Logout
        </button>

      </aside>


      {/* ================= MAIN ================= */}

      <main>

        <header>

          <div>

            <div className="eyebrow">
              POLICE RESPONSE SYSTEM
            </div>

            <h1>
              {title}
            </h1>

            <p>
              {subtitle}
            </p>

          </div>


          <div className="station">

            <div>

              <b>
                {localStorage.getItem(
                  "policeStationName"
                ) || "Police Station"}
              </b>

              <small>
                {localStorage.getItem(
                  "policeStationId"
                ) || ""}
              </small>

            </div>


            <div className="avatar">

              {(
                localStorage.getItem(
                  "policeStationName"
                ) || "P"
              )[0]}

            </div>

          </div>

        </header>


        {children}

      </main>

    </div>
  );
}