const API_BASE = "http://localhost:4000/api/v1";

export const API = {

  // =========================================================
  // Authentication & Guardian Management
  // =========================================================

  signup: async (userData) => {

    const res = await fetch(
      `${API_BASE}/guardian/signup`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(userData)
      }
    );

    return res.json();
  },


  login: async (credentials) => {

    const res = await fetch(
      `${API_BASE}/guardian/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(credentials)
      }
    );

    return res.json();
  },


  verifyEmail: async (email) => {

    const res = await fetch(
      `${API_BASE}/guardian/verify-email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email
        })
      }
    );

    return res.json();
  },


  resetPassword: async (
    email,
    newPassword
  ) => {

    const res = await fetch(
      `${API_BASE}/guardian/reset-password`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          newPassword
        })
      }
    );

    return res.json();
  },


  addWearer: async (wearerData) => {

    const res = await fetch(
      `${API_BASE}/guardian/add-wearer`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(
          wearerData
        )
      }
    );

    return res.json();
  },


  // =========================================================
  // Guardian & Wearers
  // =========================================================

  getGuardianInfo: async (
    guardianId
  ) => {

    const res = await fetch(
      `${API_BASE}/guardian/${guardianId}`
    );

    return res.json();
  },


  // =========================================================
  // Device Status
  // =========================================================

  getDeviceStatus: async (
    wearerId
  ) => {

    const res = await fetch(
      `${API_BASE}/device-status/${wearerId}?t=${Date.now()}`
    );

    return res.json();
  },


  // =========================================================
  // Monitoring
  // =========================================================

 getMonitoring: async (wearerId) => {

  const res = await fetch(
    `${API_BASE}/monitoring/latest/${wearerId}?t=${Date.now()}`
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      data?.message ||
      "Unable to fetch monitoring data."
    );
  }

  return data;
},


  // =========================================================
  // Location
  // =========================================================

  getLocation: async (
    wearerId
  ) => {

    const res = await fetch(
      `${API_BASE}/location/latest/${wearerId}?t=${Date.now()}`
    );

    return res.json();
  },


  // =========================================================
  // Alerts
  // =========================================================

  getActiveAlerts: async (
    guardianId
  ) => {

    const res = await fetch(
      `${API_BASE}/alerts/active/${guardianId}?t=${Date.now()}`
    );

    return res.json();
  },


  getAlertHistory: async (
    guardianId
  ) => {

    const res = await fetch(
      `${API_BASE}/alerts/history/${guardianId}?t=${Date.now()}`
    );

    return res.json();
  },

resolveAlert: async (alertId) => {
  const res = await fetch(
    `${API_BASE}/alerts/acknowledge/${alertId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      }
    }
  );

  const contentType = res.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    const text = await res.text();

    console.error(
      "Resolve alert returned non-JSON response:",
      text
    );

    throw new Error(
      `Unable to resolve alert. Server returned ${res.status}.`
    );
  }

  const data = await res.json();

  if (!res.ok || data?.success === false) {
    throw new Error(
      data?.message ||
      "Unable to resolve alert."
    );
  }

  return data;
},


  // =========================================================
  // DELETE INDIVIDUAL ALERT
  // =========================================================

  deleteAlert: async (
    alertId
  ) => {

    const res = await fetch(
      `${API_BASE}/alerts/${alertId}`,
      {
        method: "DELETE"
      }
    );


    const data =
      await res.json();


    if (!res.ok) {

      throw new Error(
        data?.message ||
        "Unable to delete alert."
      );

    }


    return data;
  },


  // =========================================================
  // DELETE ALL HISTORY FOR ONE WEARER
  // =========================================================

  deleteWearerAlertHistory:
    async (wearerId) => {

      const res = await fetch(
        `${API_BASE}/alerts/history/wearer/${wearerId}`,
        {
          method: "DELETE"
        }
      );


      const data =
        await res.json();


      if (!res.ok) {

        throw new Error(
          data?.message ||
          "Unable to delete alert history."
        );

      }


      return data;
    },


  // =========================================================
  // Safe Zone
  // =========================================================

  getSafeZone: async (
    wearerId
  ) => {

    const res = await fetch(
      `${API_BASE}/safe-zone/${wearerId}?t=${Date.now()}`
    );

    return res.json();
  },


  saveSafeZone: async (
    payload
  ) => {

    const res = await fetch(
      `${API_BASE}/safe-zone/save`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify(payload)
      }
    );

    return res.json();
  },


  // =========================================================
  // Police Assistance
  // =========================================================

  getNearbyPoliceStations:
    async (lat, lng) => {

      const res = await fetch(
        `${API_BASE}/police-stations/nearby?lat=${lat}&lng=${lng}`
      );

      return res.json();
    },


  // =========================================================
  // Hardware Telemetry & Health
  // =========================================================

  checkHardwareHealth:
    async () => {

      const res = await fetch(
        `${API_BASE}/hardware/health`
      );

      return res.json();
    },


  // Hardware telemetry submission.
  // Actual hardware functionality remains unchanged.

  postHardwareTelemetry:
    async (payload) => {

      const res = await fetch(
        `${API_BASE}/hardware/telemetry`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify(payload)
        }
      );

      return res.json();
    },


  // =========================================================
  // Settings
  // =========================================================

  getSettings: async (
    guardianId
  ) => {

    const res = await fetch(
      `${API_BASE}/settings/${guardianId}`
    );

    return res.json();
  },


  updateSettings: async (
    guardianId,
    settings
  ) => {

    const res = await fetch(
      `${API_BASE}/settings/${guardianId}`,
      {
        method: "PUT",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify(settings)
      }
    );

    return res.json();
  }

};