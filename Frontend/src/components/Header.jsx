import React from "react";
import { useApp } from "../context/AppContext";

export const Header = () => {
  const { currentPage } = useApp();

  const pageTitles = {
    dashboard: {
      title: "Safety Dashboard",
      sub: "Real-time overview of wearer vitals, location & protection status"
    },

    device_status: {
      title: "Device Status",
      sub: "Monitor device health, battery levels & connectivity"
    },

    live_location: {
      title: "Live GPS Tracking",
      sub: "Real-time location and safe zone monitoring"
    },

    safe_zone: {
      title: "Safe Zone Geofencing",
      sub: "Configure safety perimeters with automated departure alerts"
    },

    emergency_alerts: {
      title: "Emergency Alerts Hub",
      sub: "Monitor and respond to active safety alerts"
    },

    police_assistance: {
      title: "Emergency Police Assistance",
      sub: "Find nearby police stations and send emergency assistance alerts"
    },

    alert_history: {
      title: "Alert History",
      sub: "Review previous safety alerts and incidents"
    },

    settings: {
      title: "System Settings",
      sub: "Manage safety preferences, account settings and appearance"
    }
  };

  const current =
    pageTitles[currentPage] || {
      title: "Trinetra-AI",
      sub: "Intelligent Safety System"
    };

  return (
    <header
      style={{
        padding: "1.2rem 2.25rem",

        /* automatically changes in light/dark mode */
        background: "var(--bg-glass)",

        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",

        borderBottom: "1px solid var(--border-color)",

        position: "sticky",
        top: 0,
        zIndex: 100,

        fontFamily:
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',

        transition:
          "background-color 0.25s ease, border-color 0.25s ease, color 0.25s ease"
      }}
    >
      <h1
        style={{
          margin: 0,

          fontSize: "1.55rem",
          fontWeight: 800,

          letterSpacing: "-0.025em",
          lineHeight: 1.2,

          /* FIXED: no hardcoded dark purple */
          color: "var(--text-primary)",

          transition: "color 0.25s ease"
        }}
      >
        {current.title}
      </h1>

      {current.sub && (
        <p
          style={{
            margin: "0.35rem 0 0",

            fontSize: "0.78rem",
            fontWeight: 500,
            lineHeight: 1.45,

            /* FIXED: automatically readable in dark mode */
            color: "var(--text-secondary)",

            transition: "color 0.25s ease"
          }}
        >
          {current.sub}
        </p>
      )}
    </header>
  );
};