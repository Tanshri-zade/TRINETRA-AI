import React, { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";

import {
  LayoutDashboard,
  Cpu,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Clock,
  Settings,
  Radio,
  LogOut,
  User,
  Baby,
  UserCheck,
  UserPlus,
  Menu,
  X
} from "lucide-react";

export const Sidebar = () => {
  const {
    currentPage,
    setCurrentPage,
    activeAlerts,
    isHardwareOnline,
    setIsAddWearerOpen,
    guardianName,
    guardianEmail,
    selectedWearer,
    logout
  } = useApp();

  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined"
      ? window.innerWidth <= 768
      : false
  );

  const [mobileOpen, setMobileOpen] = useState(false);

  const isChild = selectedWearer?.type === "child";

  /* =========================================================
     MOBILE DETECTION
  ========================================================= */

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;

      setIsMobile(mobile);

      if (!mobile) {
        setMobileOpen(false);
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  /* =========================================================
     PREVENT PAGE SCROLL WHEN MOBILE MENU IS OPEN
  ========================================================= */

  useEffect(() => {
    if (!isMobile) return;

    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen, isMobile]);

  /* =========================================================
     CLOSE SIDEBAR AFTER NAVIGATION ON PHONE
  ========================================================= */

  const handleNavigation = (pageId) => {
    setCurrentPage(pageId);

    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleAddWearer = () => {
    setIsAddWearerOpen(true);

    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleLogout = () => {
    if (isMobile) {
      setMobileOpen(false);
    }

    logout();
  };

  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard
    },
    {
      id: "device_status",
      label: "Device Status",
      icon: Cpu,
      badge: isHardwareOnline ? "LIVE" : null
    },
    {
      id: "live_location",
      label: "Live Location",
      icon: MapPin
    },
    {
      id: "safe_zone",
      label: "Safe Zone",
      icon: ShieldCheck
    },
    {
      id: "emergency_alerts",
      label: "Emergency Alerts",
      icon: AlertTriangle,
      badge:
        activeAlerts.length > 0
          ? `${activeAlerts.length}`
          : null
    },
    {
      id: "police_assistance",
      label: "Police Assistance",
      icon: ShieldAlert
    },
    {
      id: "alert_history",
      label: "Alert History",
      icon: Clock
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings
    }
  ];

  const sidebarStyle = {
    width: "238px",
    height: "100vh",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",

    background:
      "linear-gradient(180deg, #1C0B35 0%, #24103F 48%, #190A30 100%)",

    color: "#FFFFFF",
    userSelect: "none",

    boxShadow: isMobile
      ? "10px 0 35px rgba(10, 4, 20, 0.32)"
      : "5px 0 20px rgba(29, 11, 53, 0.12)",

    position: isMobile ? "fixed" : "relative",

    top: 0,
    left: 0,

    zIndex: isMobile ? 1002 : 20,

    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',

    transform:
      isMobile && !mobileOpen
        ? "translateX(-105%)"
        : "translateX(0)",

    transition:
      "transform 0.28s ease, box-shadow 0.28s ease"
  };

  return (
    <>
      {/* =====================================================
          MOBILE MENU BUTTON
      ===================================================== */}

      {isMobile && !mobileOpen && (
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
          title="Open Menu"
          style={{
            position: "fixed",
            top: "14px",
            left: "14px",
            width: "42px",
            height: "42px",
            borderRadius: "11px",

            border:
              "1px solid rgba(255,255,255,0.14)",

            background:
              "linear-gradient(135deg, #32184F 0%, #1D0A36 100%)",

            color: "#FFFFFF",

            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            cursor: "pointer",

            zIndex: 1000,

            boxShadow:
              "0 6px 18px rgba(29,10,54,0.25)",

            fontFamily:
              'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
          }}
        >
          <Menu
            size={21}
            strokeWidth={2}
          />
        </button>
      )}

      {/* =====================================================
          MOBILE DARK OVERLAY
      ===================================================== */}

      {isMobile && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed",
            inset: 0,

            background:
              "rgba(18, 10, 26, 0.52)",

            backdropFilter: "blur(2px)",
            WebkitBackdropFilter: "blur(2px)",

            zIndex: 1001
          }}
        />
      )}

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside style={sidebarStyle}>
        {/* =====================================================
            BRAND
        ===================================================== */}

        <div
          style={{
            padding:
              "1.4rem 1.15rem 1.2rem",

            borderBottom:
              "1px solid rgba(255,255,255,0.10)",

            position: "relative"
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.7rem",
              paddingRight: isMobile
                ? "35px"
                : "0"
            }}
          >
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",

                display: "flex",
                alignItems: "center",
                justifyContent: "center",

                background:
                  "rgba(255,255,255,0.10)",

                border:
                  "1px solid rgba(255,255,255,0.16)",

                color: "#FFFFFF",

                flexShrink: 0
              }}
            >
              <Radio
                size={19}
                strokeWidth={2}
              />
            </div>

            <div
              style={{
                minWidth: 0
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",

                  fontSize: "0.98rem",
                  fontWeight: 700,

                  letterSpacing: "0.025em",
                  lineHeight: 1.1,

                  color: "#FFFFFF"
                }}
              >
                TRINETRA

                <span
                  style={{
                    color: "#D9C5EA",
                    marginLeft: "2px"
                  }}
                >
                  AI
                </span>
              </div>

              <div
                style={{
                  marginTop: "0.28rem",

                  fontSize: "0.59rem",

                  color:
                    "rgba(255,255,255,0.70)",

                  fontWeight: 400,

                  whiteSpace: "nowrap"
                }}
              >
                Intelligent Safety System
              </div>
            </div>
          </div>

          {/* MOBILE CLOSE BUTTON */}

          {isMobile && (
            <button
              type="button"
              onClick={() =>
                setMobileOpen(false)
              }
              aria-label="Close navigation menu"
              title="Close Menu"
              style={{
                position: "absolute",

                top: "19px",
                right: "12px",

                width: "31px",
                height: "31px",

                borderRadius: "8px",

                border:
                  "1px solid rgba(255,255,255,0.14)",

                background:
                  "rgba(255,255,255,0.08)",

                color: "#FFFFFF",

                display: "flex",
                alignItems: "center",
                justifyContent: "center",

                cursor: "pointer"
              }}
            >
              <X
                size={17}
                strokeWidth={2}
              />
            </button>
          )}
        </div>

        {/* =====================================================
            CURRENT WEARER
        ===================================================== */}

        {selectedWearer && (
          <div
            style={{
              margin:
                "0.85rem 0.75rem 0.3rem",

              padding:
                "0.72rem 0.72rem",

              borderRadius: "9px",

              background:
                "rgba(255,255,255,0.075)",

              border:
                "1px solid rgba(255,255,255,0.11)",

              display: "flex",
              alignItems: "center",

              justifyContent:
                "space-between",

              gap: "0.5rem"
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",

                gap: "0.55rem",

                minWidth: 0
              }}
            >
              <div
                style={{
                  width: "31px",
                  height: "31px",

                  borderRadius: "8px",

                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",

                  background:
                    "rgba(218,197,234,0.14)",

                  color: "#FFFFFF",

                  border:
                    "1px solid rgba(255,255,255,0.08)",

                  flexShrink: 0
                }}
              >
                {isChild ? (
                  <Baby
                    size={16}
                    strokeWidth={1.9}
                  />
                ) : (
                  <UserCheck
                    size={16}
                    strokeWidth={1.9}
                  />
                )}
              </div>

              <div
                style={{
                  minWidth: 0
                }}
              >
                <div
                  style={{
                    fontSize: "0.74rem",

                    fontWeight: 600,

                    color: "#FFFFFF",

                    whiteSpace: "nowrap",

                    overflow: "hidden",

                    textOverflow:
                      "ellipsis"
                  }}
                >
                  {selectedWearer.name}
                </div>

                <div
                  style={{
                    fontSize: "0.57rem",

                    color:
                      "rgba(255,255,255,0.66)",

                    fontWeight: 400,

                    marginTop: "2px"
                  }}
                >
                  {isChild
                    ? "Child Safety Profile"
                    : "Women Safety Profile"}
                </div>
              </div>
            </div>

            <button
              onClick={handleAddWearer}
              title="Add Wearer"
              style={{
                width: "28px",
                height: "28px",

                borderRadius: "7px",

                display: "flex",
                alignItems: "center",
                justifyContent: "center",

                background:
                  "rgba(255,255,255,0.08)",

                border:
                  "1px solid rgba(255,255,255,0.12)",

                color: "#FFFFFF",

                cursor: "pointer",

                flexShrink: 0
              }}
            >
              <UserPlus
                size={14}
                strokeWidth={1.9}
              />
            </button>
          </div>
        )}

        {/* =====================================================
            NAVIGATION
        ===================================================== */}

        <nav
          style={{
            padding:
              "0.7rem 0.7rem",

            flex: 1,

            display: "flex",
            flexDirection: "column",

            gap: "0.25rem",

            overflowY: "auto"
          }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;

            const isActive =
              currentPage === item.id;

            const isEmergency =
              item.id ===
                "emergency_alerts" &&
              activeAlerts.length > 0;

            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}

                onClick={() =>
                  handleNavigation(
                    item.id
                  )
                }

                style={{
                  width: "100%",

                  minHeight: "39px",

                  padding:
                    "0.58rem 0.68rem",

                  borderRadius: "7px",

                  border: isActive
                    ? "1px solid rgba(255,255,255,0.10)"
                    : "1px solid transparent",

                  display: "flex",

                  alignItems: "center",

                  justifyContent:
                    "space-between",

                  gap: "0.5rem",

                  background: isActive
                    ? "rgba(255,255,255,0.12)"
                    : "transparent",

                  color: "#FFFFFF",

                  fontSize: "0.73rem",

                  fontWeight:
                    isActive
                      ? 600
                      : 400,

                  cursor: "pointer",

                  textAlign: "left",

                  transition:
                    "background 0.18s ease, border-color 0.18s ease",

                  fontFamily:
                    'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                }}
              >
                <div
                  style={{
                    display: "flex",

                    alignItems:
                      "center",

                    gap: "0.65rem",

                    minWidth: 0
                  }}
                >
                  <Icon
                    size={15}

                    strokeWidth={
                      isActive
                        ? 2
                        : 1.7
                    }

                    style={{
                      flexShrink: 0,

                      color:
                        isEmergency
                          ? "#F29A9E"
                          : "#FFFFFF"
                    }}
                  />

                  <span
                    style={{
                      whiteSpace:
                        "nowrap",

                      color:
                        "#FFFFFF"
                    }}
                  >
                    {item.label}
                  </span>
                </div>

                {item.badge && (
                  <span
                    style={{
                      minWidth: "23px",

                      height: "18px",

                      padding:
                        "0 0.38rem",

                      borderRadius:
                        "999px",

                      display:
                        "inline-flex",

                      alignItems:
                        "center",

                      justifyContent:
                        "center",

                      fontSize:
                        "0.54rem",

                      fontWeight: 700,

                      background:
                        isEmergency
                          ? "#C94F55"
                          : "rgba(255,255,255,0.13)",

                      color: "#FFFFFF",

                      border:
                        isEmergency
                          ? "1px solid #D86A70"
                          : "1px solid rgba(255,255,255,0.12)"
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* =====================================================
            GUARDIAN FOOTER
        ===================================================== */}

        <div
          style={{
            padding:
              "0.9rem 0.8rem",

            borderTop:
              "1px solid rgba(255,255,255,0.10)",

            background:
              "rgba(0,0,0,0.10)"
          }}
        >
          <div
            style={{
              display: "flex",

              alignItems: "center",

              gap: "0.55rem"
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",

                borderRadius: "8px",

                background:
                  "rgba(255,255,255,0.09)",

                border:
                  "1px solid rgba(255,255,255,0.12)",

                display: "flex",

                alignItems: "center",

                justifyContent:
                  "center",

                color: "#FFFFFF",

                flexShrink: 0
              }}
            >
              <User
                size={15}
                strokeWidth={1.8}
              />
            </div>

            <div
              style={{
                minWidth: 0,
                flex: 1
              }}
            >
              <div
                style={{
                  fontSize:
                    "0.68rem",

                  fontWeight: 600,

                  color: "#FFFFFF",

                  whiteSpace:
                    "nowrap",

                  overflow: "hidden",

                  textOverflow:
                    "ellipsis"
                }}
              >
                {guardianName ||
                  "Guardian"}
              </div>

              <div
                style={{
                  fontSize:
                    "0.55rem",

                  color:
                    "rgba(255,255,255,0.64)",

                  marginTop: "2px",

                  whiteSpace:
                    "nowrap",

                  overflow: "hidden",

                  textOverflow:
                    "ellipsis"
                }}
              >
                {guardianEmail ||
                  "Guardian Account"}
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              style={{
                width: "29px",
                height: "29px",

                borderRadius: "7px",

                display: "flex",
                alignItems: "center",
                justifyContent:
                  "center",

                border:
                  "1px solid rgba(255,255,255,0.12)",

                background:
                  "rgba(255,255,255,0.07)",

                color: "#FFFFFF",

                cursor: "pointer",

                flexShrink: 0
              }}
            >
              <LogOut
                size={14}
                strokeWidth={1.8}
              />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};