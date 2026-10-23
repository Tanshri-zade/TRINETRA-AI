import React, {
  useEffect,
  useState
} from "react";

import { useApp } from "../context/AppContext";
import { API } from "../services/api";

import {
  User,
  Heart,
  Save,
  Moon,
  Sun,
  Baby,
  UserCheck,
  UserPlus,
  LogOut,
  ShieldCheck,
  Phone,
  Bell,
  MapPin,
  Mic,
  Battery,
  History,
  Globe,
  CheckCircle,
  AlertTriangle,
  Loader2
} from "lucide-react";


export const Settings = () => {

  const {
    guardianName,
    guardianId,

    wearers,
    selectedWearer,
    switchWearer,

    theme,
    toggleTheme,

    setIsAddWearerOpen,
    logout
  } = useApp();


  /* =========================================================
     ORIGINAL SAFETY PREFERENCES
  ========================================================= */

  const [minBpm, setMinBpm] =
    useState(50);

  const [maxBpm, setMaxBpm] =
    useState(120);

  const [emergencySms, setEmergencySms] =
    useState("");


  /* =========================================================
     SETTINGS
  ========================================================= */

  const [language, setLanguage] =
    useState("en");


  const [
    notifications,
    setNotifications
  ] = useState({

    emergencyAlerts: true,

    geofenceAlerts: true,

    voiceAlerts: true,

    lowBatteryAlerts: true

  });


  const [safety, setSafety] =
    useState({

      defaultSafeZoneRadius: 100,

      policeConfirmation: true,

      locationSharing: true

    });


  const [privacy, setPrivacy] =
    useState({

      locationHistory: true,

      alertHistory: true

    });


  /* =========================================================
     UI STATES
  ========================================================= */

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [savedMsg, setSavedMsg] =
    useState("");

  const [errorMsg, setErrorMsg] =
    useState("");


  const isChild =
    selectedWearer?.type === "child";


  /* =========================================================
     LOAD SETTINGS
  ========================================================= */

  useEffect(() => {

    if (!guardianId) {

      setLoading(false);

      return;

    }


    const loadSettings =
      async () => {

        try {

          setLoading(true);

          setErrorMsg("");


          const response =
            await API.getSettings(
              guardianId
            );


          const settings =
            response?.settings || {};


          /* LANGUAGE */

          setLanguage(
            settings.language ||
            "en"
          );


          /* EMERGENCY CONTACT */

          setEmergencySms(
            settings
              ?.emergencyContact
              ?.number || ""
          );


          /* BPM
             These will load from DB
             after minBpm/maxBpm are added
             to settings model.
          */

          if (
            settings?.safety?.minBpm !==
            undefined
          ) {

            setMinBpm(
              settings.safety.minBpm
            );

          }


          if (
            settings?.safety?.maxBpm !==
            undefined
          ) {

            setMaxBpm(
              settings.safety.maxBpm
            );

          }


          /* NOTIFICATIONS */

          setNotifications({

            emergencyAlerts:
              settings
                ?.notifications
                ?.emergencyAlerts
              ?? true,

            geofenceAlerts:
              settings
                ?.notifications
                ?.geofenceAlerts
              ?? true,

            voiceAlerts:
              settings
                ?.notifications
                ?.voiceAlerts
              ?? true,

            lowBatteryAlerts:
              settings
                ?.notifications
                ?.lowBatteryAlerts
              ?? true

          });


          /* SAFETY */

          setSafety({

            defaultSafeZoneRadius:
              settings
                ?.safety
                ?.defaultSafeZoneRadius
              ?? 100,

            policeConfirmation:
              settings
                ?.safety
                ?.policeConfirmation
              ?? true,

            locationSharing:
              settings
                ?.safety
                ?.locationSharing
              ?? true

          });


          /* PRIVACY */

          setPrivacy({

            locationHistory:
              settings
                ?.privacy
                ?.locationHistory
              ?? true,

            alertHistory:
              settings
                ?.privacy
                ?.alertHistory
              ?? true

          });

        }

        catch (error) {

          console.error(
            "SETTINGS LOAD ERROR:",
            error
          );


          setErrorMsg(
            error?.message ||
            "Unable to load settings."
          );

        }

        finally {

          setLoading(false);

        }

      };


    loadSettings();

  }, [guardianId]);


  /* =========================================================
     SAVE SETTINGS
  ========================================================= */

  const handleSave =
    async (e) => {

      if (e) {
        e.preventDefault();
      }


      if (!guardianId) {

        setErrorMsg(
          "Guardian account not found."
        );

        return;

      }


      if (
        Number(minBpm) >=
        Number(maxBpm)
      ) {

        setErrorMsg(
          "Minimum BPM must be lower than Maximum BPM."
        );

        return;

      }


      try {

        setSaving(true);

        setSavedMsg("");

        setErrorMsg("");


        const payload = {

          language,

          emergencyContact: {

            number:
              emergencySms.trim()

          },

          notifications: {

            emergencyAlerts:
              notifications
                .emergencyAlerts,

            geofenceAlerts:
              notifications
                .geofenceAlerts,

            voiceAlerts:
              notifications
                .voiceAlerts,

            lowBatteryAlerts:
              notifications
                .lowBatteryAlerts

          },

          safety: {

            minBpm:
              Number(minBpm),

            maxBpm:
              Number(maxBpm),

            defaultSafeZoneRadius:
              Number(
                safety
                  .defaultSafeZoneRadius
              ),

            policeConfirmation:
              safety
                .policeConfirmation,

            locationSharing:
              safety
                .locationSharing

          },

          privacy: {

            locationHistory:
              privacy
                .locationHistory,

            alertHistory:
              privacy
                .alertHistory

          }

        };


        const response =
          await API.updateSettings(
            guardianId,
            payload
          );


        setSavedMsg(
          response?.message ||
          "Settings saved successfully!"
        );


        setTimeout(() => {

          setSavedMsg("");

        }, 3000);

      }

      catch (error) {

        console.error(
          "SETTINGS SAVE ERROR:",
          error
        );


        setErrorMsg(
          error?.message ||
          "Unable to save settings."
        );

      }

      finally {

        setSaving(false);

      }

    };


  /* =========================================================
     TOGGLE HELPERS
  ========================================================= */

  const toggleNotification =
    (key) => {

      setNotifications(
        (previous) => ({

          ...previous,

          [key]:
            !previous[key]

        })
      );

    };


  const toggleSafety =
    (key) => {

      setSafety(
        (previous) => ({

          ...previous,

          [key]:
            !previous[key]

        })
      );

    };


  const togglePrivacy =
    (key) => {

      setPrivacy(
        (previous) => ({

          ...previous,

          [key]:
            !previous[key]

        })
      );

    };


  /* =========================================================
     STYLES
  ========================================================= */

  const sectionTitle = {

    fontSize: "1.05rem",

    fontWeight: 700,

    color:
      "var(--text-primary)"

  };


  const sectionText = {

    fontSize: ".78rem",

    color:
      "var(--text-muted)",

    marginTop: ".15rem"

  };


  const labelStyle = {

    display: "block",

    fontSize: ".8rem",

    fontWeight: 600,

    color:
      "var(--text-secondary)",

    marginBottom: ".35rem"

  };


  const inputStyle = {

    width: "100%",

    padding:
      ".5rem .75rem",

    borderRadius:
      "var(--radius-sm)",

    border:
      "1px solid var(--border-color)",

    background:
      "var(--bg-secondary)",

    color:
      "var(--text-primary)",

    fontSize: ".85rem",

    outline: "none"

  };


  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {

    return (

      <div
        className="glass-panel"
        style={{
          padding: "3rem",
          textAlign: "center"
        }}
      >

        <Loader2 size={26} />

        <p
          style={{
            marginTop: ".6rem",
            color:
              "var(--text-muted)"
          }}
        >
          Loading settings...
        </p>

      </div>

    );

  }


  return (

    <div
      style={{

        display: "flex",

        flexDirection: "column",

        gap: "1.4rem",

        maxWidth: "1000px"

      }}
    >


      {/* =====================================================
          TITLE
      ===================================================== */}

      <div
        className="glass-panel"
        style={{

          padding: "1.5rem 2rem",

          borderRadius:
            "var(--radius-lg)"

        }}
      >

        <h2
          style={{

            fontSize: "1.35rem",

            fontWeight: 700

          }}
        >
          Settings
        </h2>


        <p
          style={{

            fontSize: ".85rem",

            color:
              "var(--text-secondary)",

            marginTop: ".2rem"

          }}
        >
          Manage wearer profiles,
          safety preferences,
          notifications and account settings
        </p>

      </div>


      {/* =====================================================
          SUCCESS / ERROR
      ===================================================== */}

      {savedMsg && (

        <div
          style={{

            padding:
              ".8rem 1rem",

            borderRadius:
              "var(--radius-sm)",

            background:
              "rgba(16,185,129,.08)",

            border:
              "1px solid rgba(16,185,129,.25)",

            color:
              "var(--accent-emerald)",

            display: "flex",

            alignItems: "center",

            gap: ".5rem",

            fontSize: ".82rem",

            fontWeight: 600

          }}
        >

          <CheckCircle size={16} />

          {savedMsg}

        </div>

      )}


      {errorMsg && (

        <div
          style={{

            padding:
              ".8rem 1rem",

            borderRadius:
              "var(--radius-sm)",

            background:
              "rgba(244,63,94,.07)",

            border:
              "1px solid rgba(244,63,94,.22)",

            color:
              "var(--accent-rose)",

            display: "flex",

            alignItems: "center",

            gap: ".5rem",

            fontSize: ".82rem",

            fontWeight: 600

          }}
        >

          <AlertTriangle size={16} />

          {errorMsg}

        </div>

      )}


      {/* =====================================================
          WEARER MANAGEMENT
      ===================================================== */}

      <section
        className="glass-panel"
        style={{
          padding: "1.5rem"
        }}
      >

        <div
          style={{

            display: "flex",

            alignItems: "center",

            justifyContent:
              "space-between",

            gap: "1rem",

            flexWrap: "wrap",

            marginBottom: "1rem"

          }}
        >

          <div
            style={{

              display: "flex",

              alignItems: "center",

              gap: ".55rem"

            }}
          >

            <UserCheck
              size={20}
              color="var(--accent-blue)"
            />


            <div>

              <h3 style={sectionTitle}>
                Wearer Management
              </h3>


              <p style={sectionText}>
                Select or register a
                protected wearer
              </p>

            </div>

          </div>


          <button
            className="btn btn-primary"
            onClick={() =>
              setIsAddWearerOpen(true)
            }
            style={{
              fontSize: ".76rem"
            }}
          >

            <UserPlus size={15} />

            Register New Wearer

          </button>

        </div>


        {wearers.length === 0 ? (

          <div
            style={{

              padding: "1rem",

              borderRadius:
                "var(--radius-sm)",

              border:
                "1px dashed var(--border-color)",

              color:
                "var(--text-muted)",

              fontSize: ".8rem"

            }}
          >
            No registered wearers found.
          </div>

        ) : (

          <div>

            <label style={labelStyle}>
              Current Wearer
            </label>


            <div
              style={{

                display: "flex",

                alignItems: "center",

                gap: ".5rem",

                padding:
                  ".55rem .75rem",

                borderRadius:
                  "var(--radius-sm)",

                border:
                  "1px solid var(--border-color)",

                background:
                  "var(--bg-secondary)"

              }}
            >

              {isChild ? (

                <Baby
                  size={17}
                  color="var(--accent-cyan)"
                />

              ) : (

                <UserCheck
                  size={17}
                  color="var(--accent-rose)"
                />

              )}


              <select
                value={
                  selectedWearer?._id ||
                  ""
                }
                onChange={(e) =>
                  switchWearer(
                    e.target.value
                  )
                }
                style={{

                  width: "100%",

                  border: "none",

                  outline: "none",

                  background:
                    "transparent",

                  color:
                    "var(--text-primary)",

                  fontFamily:
                    "var(--font-main)",

                  fontSize: ".84rem",

                  fontWeight: 600,

                  cursor: "pointer"

                }}
              >

                {wearers.map(
                  (wearer) => (

                    <option
                      key={wearer._id}
                      value={wearer._id}
                    >

                      {wearer.name} (

                      {wearer.type ===
                      "child"
                        ? "Child"
                        : "Woman"}

                      )

                    </option>

                  )
                )}

              </select>

            </div>

          </div>

        )}

      </section>


      {/* =====================================================
          SAFETY PREFERENCES
          ORIGINAL BPM SECTION KEPT
      ===================================================== */}

      <section
        className="glass-panel"
        style={{
          padding: "1.5rem"
        }}
      >

        <div
          style={{

            display: "flex",

            alignItems: "center",

            gap: ".5rem",

            marginBottom: "1.25rem"

          }}
        >

          <Heart
            size={20}
            color="var(--accent-rose)"
          />


          <div>

            <h3 style={sectionTitle}>
              Safety Preferences
            </h3>


            <p style={sectionText}>
              Configure heart rate and
              emergency contact settings
            </p>

          </div>

        </div>


        <div
          style={{

            display: "grid",

            gridTemplateColumns:
              "repeat(auto-fit,minmax(220px,1fr))",

            gap: "1rem"

          }}
        >

          {/* MIN BPM */}

          <div>

            <label style={labelStyle}>
              Minimum Normal BPM
            </label>


            <input
              type="number"

              value={minBpm}

              min="1"

              onChange={(e) =>
                setMinBpm(
                  Number(
                    e.target.value
                  )
                )
              }

              style={inputStyle}
            />

          </div>


          {/* MAX BPM */}

          <div>

            <label style={labelStyle}>
              Maximum Normal BPM
            </label>


            <input
              type="number"

              value={maxBpm}

              min="1"

              onChange={(e) =>
                setMaxBpm(
                  Number(
                    e.target.value
                  )
                )
              }

              style={inputStyle}
            />

          </div>

        </div>


        {/* EMERGENCY CONTACT NUMBER */}

        <div
          style={{
            marginTop: "1.25rem"
          }}
        >

          <label style={labelStyle}>
            Emergency Contact Number
          </label>


          <div
            style={{
              position: "relative"
            }}
          >

            <Phone
              size={15}

              style={{

                position: "absolute",

                left: ".75rem",

                top: "50%",

                transform:
                  "translateY(-50%)",

                color:
                  "var(--text-muted)"

              }}
            />


            <input
              type="text"

              value={emergencySms}

              onChange={(e) =>
                setEmergencySms(
                  e.target.value
                )
              }

              placeholder="Enter emergency contact number"

              style={{

                ...inputStyle,

                paddingLeft: "2.2rem"

              }}
            />

          </div>

        </div>

      </section>


      {/* =====================================================
          ALERT NOTIFICATIONS
      ===================================================== */}

      <section
        className="glass-panel"
        style={{
          padding: "1.5rem"
        }}
      >

        <div
          style={{

            display: "flex",

            alignItems: "center",

            gap: ".55rem",

            marginBottom: ".7rem"

          }}
        >

          <Bell
            size={20}
            color="var(--accent-amber)"
          />


          <div>

            <h3 style={sectionTitle}>
              Alert Notifications
            </h3>


            <p style={sectionText}>
              Choose which safety alerts
              you want to receive
            </p>

          </div>

        </div>


        <ToggleRow
          icon={
            <AlertTriangle size={17} />
          }

          title="Emergency Alerts"

          description="Receive SOS and emergency alerts"

          checked={
            notifications
              .emergencyAlerts
          }

          onChange={() =>
            toggleNotification(
              "emergencyAlerts"
            )
          }
        />


        <ToggleRow
          icon={
            <MapPin size={17} />
          }

          title="Safe Zone Alerts"

          description="Receive alerts when the wearer moves outside the safe zone"

          checked={
            notifications
              .geofenceAlerts
          }

          onChange={() =>
            toggleNotification(
              "geofenceAlerts"
            )
          }
        />


        <ToggleRow
          icon={<Mic size={17} />}

          title="Voice Distress Alerts"

          description="Receive alerts when distress voice or crying is detected"

          checked={
            notifications
              .voiceAlerts
          }

          onChange={() =>
            toggleNotification(
              "voiceAlerts"
            )
          }
        />


        <ToggleRow
          icon={
            <Battery size={17} />
          }

          title="Low Battery Alerts"

          description="Receive alerts when wristband battery becomes low"

          checked={
            notifications
              .lowBatteryAlerts
          }

          onChange={() =>
            toggleNotification(
              "lowBatteryAlerts"
            )
          }

          last
        />

      </section>


      {/* =====================================================
          SAFETY & LOCATION SETTINGS
      ===================================================== */}

      <section
        className="glass-panel"
        style={{
          padding: "1.5rem"
        }}
      >

        <div
          style={{

            display: "flex",

            alignItems: "center",

            gap: ".55rem",

            marginBottom: "1rem"

          }}
        >

          <ShieldCheck
            size={20}
            color="var(--accent-emerald)"
          />


          <div>

            <h3 style={sectionTitle}>
              Safety & Location
            </h3>


            <p style={sectionText}>
              Configure safe zone,
              location and police assistance
            </p>

          </div>

        </div>


        <div
          style={{
            paddingBottom: ".8rem"
          }}
        >

          <label style={labelStyle}>
            Default Safe Zone Radius
          </label>


          <select
            value={
              safety
                .defaultSafeZoneRadius
            }

            onChange={(e) =>
              setSafety(
                (previous) => ({

                  ...previous,

                  defaultSafeZoneRadius:
                    Number(
                      e.target.value
                    )

                })
              )
            }

            style={{
              ...inputStyle,
              maxWidth: "300px"
            }}
          >

            <option value={100}>
              100 meters
            </option>

            <option value={250}>
              250 meters
            </option>

            <option value={500}>
              500 meters
            </option>

            <option value={1000}>
              1 kilometer
            </option>

          </select>

        </div>


        <ToggleRow
          icon={
            <ShieldCheck size={17} />
          }

          title="Police Confirmation"

          description="Ask for guardian confirmation before sending an emergency alert to police"

          checked={
            safety
              .policeConfirmation
          }

          onChange={() =>
            toggleSafety(
              "policeConfirmation"
            )
          }
        />


        <ToggleRow
          icon={
            <MapPin size={17} />
          }

          title="Location Sharing"

          description="Allow wristband location to be used for safety and emergency assistance"

          checked={
            safety
              .locationSharing
          }

          onChange={() =>
            toggleSafety(
              "locationSharing"
            )
          }

          last
        />

      </section>


      {/* =====================================================
          PRIVACY & HISTORY
      ===================================================== */}

      <section
        className="glass-panel"
        style={{
          padding: "1.5rem"
        }}
      >

        <div
          style={{

            display: "flex",

            alignItems: "center",

            gap: ".55rem",

            marginBottom: ".7rem"

          }}
        >

          <History
            size={20}
            color="var(--accent-blue)"
          />


          <div>

            <h3 style={sectionTitle}>
              Privacy & History
            </h3>


            <p style={sectionText}>
              Manage location and
              alert history preferences
            </p>

          </div>

        </div>


        <ToggleRow
          icon={
            <MapPin size={17} />
          }

          title="Location History"

          description="Keep previous wristband location records"

          checked={
            privacy
              .locationHistory
          }

          onChange={() =>
            togglePrivacy(
              "locationHistory"
            )
          }
        />


        <ToggleRow
          icon={
            <History size={17} />
          }

          title="Alert History"

          description="Keep previous safety and emergency alert records"

          checked={
            privacy
              .alertHistory
          }

          onChange={() =>
            togglePrivacy(
              "alertHistory"
            )
          }

          last
        />

      </section>


      {/* =====================================================
          LANGUAGE
      ===================================================== */}

      <section
        className="glass-panel"
        style={{
          padding: "1.5rem"
        }}
      >

        <div
          style={{

            display: "flex",

            alignItems: "center",

            justifyContent:
              "space-between",

            gap: "1rem",

            flexWrap: "wrap"

          }}
        >

          <div
            style={{

              display: "flex",

              alignItems: "center",

              gap: ".65rem"

            }}
          >

            <Globe
              size={20}
              color="var(--accent-cyan)"
            />


            <div>

              <h3 style={sectionTitle}>
                Language
              </h3>


              <p style={sectionText}>
                Select preferred interface
                language
              </p>

            </div>

          </div>


          <select
            value={language}

            onChange={(e) =>
              setLanguage(
                e.target.value
              )
            }

            style={{

              ...inputStyle,

              width: "180px"

            }}
          >

            <option value="en">
              English
            </option>

            <option value="hi">
              Hindi
            </option>

            <option value="mr">
              Marathi
            </option>

          </select>

        </div>

      </section>


      {/* =====================================================
          APPEARANCE
      ===================================================== */}

      <section
        className="glass-panel"
        style={{
          padding: "1.5rem"
        }}
      >

        <div
          style={{

            display: "flex",

            alignItems: "center",

            justifyContent:
              "space-between",

            gap: "1rem",

            flexWrap: "wrap"

          }}
        >

          <div
            style={{

              display: "flex",

              alignItems: "center",

              gap: ".65rem"

            }}
          >

            {theme === "dark" ? (

              <Moon
                size={20}
                color="var(--accent-blue)"
              />

            ) : (

              <Sun
                size={20}
                color="var(--accent-amber)"
              />

            )}


            <div>

              <h3 style={sectionTitle}>
                Appearance
              </h3>


              <p style={sectionText}>
                Switch between light and
                dark interface
              </p>

            </div>

          </div>


          <button
            className="btn btn-secondary"

            onClick={toggleTheme}
          >

            {theme === "dark" ? (

              <>
                <Sun size={15} />
                Light Mode
              </>

            ) : (

              <>
                <Moon size={15} />
                Dark Mode
              </>

            )}

          </button>

        </div>

      </section>


      {/* =====================================================
          SAVE
      ===================================================== */}

      <div
        style={{

          display: "flex",

          justifyContent:
            "flex-end"

        }}
      >

        <button
          className="btn btn-primary"

          onClick={handleSave}

          disabled={saving}
        >

          {saving ? (

            <>
              <Loader2 size={16} />
              Saving...
            </>

          ) : (

            <>
              <Save size={16} />
              Save Preferences
            </>

          )}

        </button>

      </div>


      {/* =====================================================
          ACCOUNT
      ===================================================== */}

      <section
        className="glass-panel"
        style={{
          padding: "1.5rem"
        }}
      >

        <div
          style={{

            display: "flex",

            alignItems: "center",

            justifyContent:
              "space-between",

            gap: "1rem",

            flexWrap: "wrap"

          }}
        >

          <div
            style={{

              display: "flex",

              alignItems: "center",

              gap: ".7rem"

            }}
          >

            <div
              style={{

                width: "40px",

                height: "40px",

                borderRadius: "50%",

                display: "flex",

                alignItems: "center",

                justifyContent:
                  "center",

                background:
                  "var(--bg-secondary)",

                border:
                  "1px solid var(--border-color)"

              }}
            >

              <User size={18} />

            </div>


            <div>

              <h3 style={sectionTitle}>

                {guardianName ||
                  "Guardian Account"}

              </h3>


              <p style={sectionText}>
                Guardian account and
                session controls
              </p>

            </div>

          </div>


          <button
            className="btn btn-secondary"

            onClick={logout}

            style={{
              color:
                "var(--accent-rose)"
            }}
          >

            <LogOut size={15} />

            Log Out

          </button>

        </div>

      </section>

    </div>

  );

};


/* =========================================================
   TOGGLE COMPONENT
========================================================= */

const ToggleRow = ({

  icon,

  title,

  description,

  checked,

  onChange,

  last = false

}) => {

  return (

    <div
      style={{

        display: "flex",

        justifyContent:
          "space-between",

        alignItems: "center",

        gap: "1rem",

        padding: ".9rem 0",

        borderBottom: last
          ? "none"
          : "1px solid var(--border-color)"

      }}
    >

      <div
        style={{

          display: "flex",

          alignItems: "center",

          gap: ".7rem"

        }}
      >

        <div
          style={{
            color:
              "var(--text-secondary)"
          }}
        >
          {icon}
        </div>


        <div>

          <div
            style={{

              fontSize: ".8rem",

              fontWeight: 600,

              color:
                "var(--text-primary)"

            }}
          >
            {title}
          </div>


          <div
            style={{

              fontSize: ".7rem",

              color:
                "var(--text-muted)",

              marginTop: ".12rem",

              lineHeight: 1.4

            }}
          >
            {description}
          </div>

        </div>

      </div>


      <button
        type="button"

        onClick={onChange}

        aria-pressed={checked}

        style={{

          width: "44px",

          height: "24px",

          border: "none",

          borderRadius: "999px",

          padding: "2px",

          background: checked
            ? "var(--accent-emerald)"
            : "var(--border-color)",

          cursor: "pointer",

          transition:
            "all .2s ease",

          flexShrink: 0

        }}
      >

        <span
          style={{

            display: "block",

            width: "20px",

            height: "20px",

            borderRadius: "50%",

            background: "#fff",

            transform: checked
              ? "translateX(20px)"
              : "translateX(0)",

            transition:
              "transform .2s ease",

            boxShadow:
              "0 1px 4px rgba(0,0,0,.2)"

          }}
        />

      </button>

    </div>

  );

};