import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo
} from 'react';

import { API } from '../services/api';


const AppContext = createContext(null);


export const AppProvider = ({ children }) => {

  // =========================================================
  // UI STATE
  // =========================================================

  const [theme, setTheme] = useState(
    () =>
      localStorage.getItem('trinetraTheme') ||
      'dark'
  );

  const [currentPage, setCurrentPage] =
    useState('dashboard');

  const [
    isSimulatorOpen,
    setIsSimulatorOpen
  ] = useState(false);

  const [
    isAddWearerOpen,
    setIsAddWearerOpen
  ] = useState(false);


  // =========================================================
  // AUTHENTICATION
  // =========================================================

  const [isLoggedIn, setIsLoggedIn] =
    useState(() => {

      return (
        localStorage.getItem(
          'guardianLoggedIn'
        ) === 'true' &&
        Boolean(
          localStorage.getItem(
            'guardianId'
          )
        )
      );

    });


  const [guardianId, setGuardianId] =
    useState(
      () =>
        localStorage.getItem(
          'guardianId'
        ) || ''
    );


  const [
    guardianName,
    setGuardianName
  ] = useState(
    () =>
      localStorage.getItem(
        'guardianName'
      ) || ''
  );


  const [
    guardianEmail,
    setGuardianEmail
  ] = useState(
    () =>
      localStorage.getItem(
        'guardianEmail'
      ) || ''
  );


  const [
    guardianMobile,
    setGuardianMobile
  ] = useState(
    () =>
      localStorage.getItem(
        'guardianMobile'
      ) || ''
  );


  // =========================================================
  // WEARERS
  // =========================================================

  const [wearers, setWearers] =
    useState(() => {

      try {

        return (
          JSON.parse(
            localStorage.getItem(
              'guardianWearers'
            )
          ) || []
        );

      } catch {

        return [];

      }

    });


  const [
    selectedWearerId,
    setSelectedWearerId
  ] = useState(
    () =>
      localStorage.getItem(
        'selectedWearerId'
      ) || ''
  );


  // =========================================================
  // LIVE DATA
  // =========================================================

  const [
    deviceStatus,
    setDeviceStatus
  ] = useState(null);

  const [
    monitoring,
    setMonitoring
  ] = useState(null);

  const [
    location,
    setLocation
  ] = useState(null);

  const [
    activeAlerts,
    setActiveAlerts
  ] = useState([]);

  const [
    isLoading,
    setIsLoading
  ] = useState(false);

  const [
    lastTelemetryTimestamp,
    setLastTelemetryTimestamp
  ] = useState(null);


  // =========================================================
  // THEME
  // =========================================================

  useEffect(() => {

    document.documentElement.setAttribute(
      'data-theme',
      theme
    );

    localStorage.setItem(
      'trinetraTheme',
      theme
    );

  }, [theme]);


  // =========================================================
  // CURRENT WEARER
  // =========================================================

  const selectedWearer =
    wearers.find(
      (wearer) =>
        String(wearer?._id) ===
        String(selectedWearerId)
    ) ||
    wearers[0] ||
    null;


  useEffect(() => {

    if (
      wearers.length > 0 &&
      (
        !selectedWearerId ||
        !wearers.some(
          (wearer) =>
            String(wearer?._id) ===
            String(selectedWearerId)
        )
      )
    ) {

      const firstId =
        wearers[0]?._id ||
        wearers[0]?.id;

      if (firstId) {

        setSelectedWearerId(
          firstId
        );

      }

    }

  }, [
    wearers,
    selectedWearerId
  ]);


  useEffect(() => {

    if (!selectedWearer) {
      return;
    }

    localStorage.setItem(
      'selectedWearerId',
      selectedWearer._id
    );

    localStorage.setItem(
      'selectedWearerName',
      selectedWearer.name || ''
    );

    localStorage.setItem(
      'selectedWearerType',
      selectedWearer.type || ''
    );

  }, [selectedWearer]);


  // =========================================================
  // CURRENT WEARER ACTIVE ALERT
  // =========================================================

  const currentWearerAlert =
    useMemo(() => {

      if (
        !selectedWearerId ||
        !Array.isArray(activeAlerts)
      ) {
        return null;
      }

      return (
        activeAlerts.find(
          (alert) =>
            String(alert?.wearerId) ===
            String(selectedWearerId)
        ) || null
      );

    }, [
      activeAlerts,
      selectedWearerId
    ]);


  // =========================================================
  // HARDWARE ONLINE
  // =========================================================

  const isHardwareOnline =
    useMemo(() => {

      if (
        !deviceStatus ||
        !deviceStatus.lastSeen
      ) {
        return false;
      }

      const lastSeen =
        new Date(
          deviceStatus.lastSeen
        ).getTime();

      if (
        !Number.isFinite(lastSeen)
      ) {
        return false;
      }

      return (
        Date.now() - lastSeen <
        30000
      );

    }, [deviceStatus]);


  // =========================================================
  // FETCH REAL-TIME DATA
  // =========================================================

  const fetchRealtimeData =
    useCallback(async () => {

      const targetWearerId =
        selectedWearerId ||
        wearers[0]?._id ||
        '6ac48a19beed5a7402908fa1';

      try {

        const [
          devRes,
          monRes,
          locRes
        ] =
          await Promise.allSettled([

            API.getDeviceStatus(
              targetWearerId
            ),

            API.getMonitoring(
              targetWearerId
            ),

            API.getLocation(
              targetWearerId
            )

          ]);


        // ---------------------------------------------
        // DEVICE STATUS
        // ---------------------------------------------

        if (
          devRes.status ===
            'fulfilled' &&
          devRes.value?.success
        ) {

          const latestDevice =
            devRes.value
              .deviceStatus ||
            devRes.value.data ||
            null;

          if (latestDevice) {
            setDeviceStatus(
              latestDevice
            );

            if (latestDevice.wearerId && !selectedWearerId) {
              setSelectedWearerId(String(latestDevice.wearerId));
            }
          }

        }


        // ---------------------------------------------
        // MONITORING
        // ---------------------------------------------

        if (
          monRes.status ===
            'fulfilled' &&
          monRes.value?.success
        ) {

          const latestMonitoring =
            monRes.value.monitoring ||
            monRes.value.data ||
            null;

          if (latestMonitoring) {

            setMonitoring(
              latestMonitoring
            );

          }

        }


        // ---------------------------------------------
        // LOCATION
        // ---------------------------------------------

        if (
          locRes.status ===
            'fulfilled' &&
          locRes.value?.success
        ) {

          const latestLocation =
            locRes.value.location ||
            locRes.value.data ||
            null;

          if (latestLocation) {

            setLocation({
              ...latestLocation,
              recentLocation:
                locRes.value.recentLocation || null,
              currentLocation:
                locRes.value.currentLocation || null
            });

          }

        }


        setLastTelemetryTimestamp(
          Date.now()
        );

      } catch (error) {

        console.error(
          'Error fetching hardware telemetry:',
          error
        );

      }

    }, [
      selectedWearerId,
      wearers
    ]);


  // =========================================================
  // FETCH ACTIVE ALERTS
  // =========================================================

  const fetchAlerts =
    useCallback(async () => {

      const targetGuardianId =
        guardianId ||
        '6ac48a19beed5a7402908fa0';

      try {

        const response =
          await API.getActiveAlerts(
            targetGuardianId
          );


        if (
          response &&
          response.success
        ) {

          setActiveAlerts(
            Array.isArray(
              response.alerts
            )
              ? response.alerts
              : []
          );

        }

      } catch (error) {

        console.error(
          'Error fetching active alerts:',
          error
        );

      }

    }, [
      guardianId
    ]);


  // =========================================================
  // POLLING (Ultra-Responsive Real-Time Hardware Sync)
  // =========================================================

  useEffect(() => {

    fetchRealtimeData();

    fetchAlerts();


    const interval =
      setInterval(() => {

        fetchRealtimeData();

        fetchAlerts();

      }, 1200);


    return () => {

      clearInterval(interval);

    };

  }, [
    fetchRealtimeData,
    fetchAlerts
  ]);


  // =========================================================
  // MERGE ALERT VALUES INTO MONITORING WHEN REQUIRED
  // =========================================================
  //
  // Monitoring remains the main source.
  // Alert is only fallback for missing live fields.
  //
  // This fixes Dashboard voice / detected speech / geofence
  // when the alert has the newest emergency values.
  // =========================================================

  const liveMonitoring =
    useMemo(() => {

      if (
        !monitoring &&
        !currentWearerAlert
      ) {
        return null;
      }


      return {

        ...(currentWearerAlert || {}),

        ...(monitoring || {}),


        voiceStatus:
          monitoring?.voiceStatus ||
          currentWearerAlert
            ?.voiceStatus ||
          'Not Available',


        detectedSpeech:
          monitoring
            ?.detectedSpeech ||
          currentWearerAlert
            ?.detectedSpeech ||
          '',


        microphoneStatus:
          monitoring
            ?.microphoneStatus ||
          currentWearerAlert
            ?.microphoneStatus ||
          deviceStatus
            ?.microphoneStatus ||
          'Not Available',


        geofenceStatus:
          monitoring
            ?.geofenceStatus ||
          currentWearerAlert
            ?.geofenceStatus ||
          (
            location
              ?.insideSafeZone ===
            true
              ? 'Inside'
              : location
                  ?.insideSafeZone ===
                false
                ? 'Outside'
                : 'Not Configured'
          ),


        heartRate:
          monitoring?.heartRate ??
          currentWearerAlert
            ?.heartRate ??
          deviceStatus
            ?.heartRate ??
          null,


        battery:
          monitoring?.battery ??
          deviceStatus?.battery ??
          currentWearerAlert
            ?.battery ??
          null,


        gsmStatus:
          monitoring?.gsmStatus ||
          deviceStatus?.gsmStatus ||
          currentWearerAlert
            ?.gsmStatus ||
          'Not Available'

      };

    }, [
      monitoring,
      currentWearerAlert,
      deviceStatus,
      location
    ]);


  // =========================================================
  // AUTH SUCCESS
  // =========================================================

  const handleAuthSuccess =
    (guardianData) => {

      const gId =
        guardianData.id ||
        guardianData._id;

      const gName =
        guardianData.name ||
        'Guardian';

      const gEmail =
        guardianData.email ||
        '';

      const gMobile =
        guardianData.mobile ||
        '';

      const gWearers =
        guardianData.wearers ||
        [];


      setGuardianId(gId);

      setGuardianName(gName);

      setGuardianEmail(gEmail);

      setGuardianMobile(gMobile);

      setWearers(gWearers);

      setIsLoggedIn(true);


      localStorage.setItem(
        'guardianLoggedIn',
        'true'
      );

      localStorage.setItem(
        'guardianId',
        gId
      );

      localStorage.setItem(
        'guardianName',
        gName
      );

      localStorage.setItem(
        'guardianEmail',
        gEmail
      );

      localStorage.setItem(
        'guardianMobile',
        gMobile
      );

      localStorage.setItem(
        'guardianWearers',
        JSON.stringify(gWearers)
      );


      if (
        gWearers.length > 0
      ) {

        const firstId =
          gWearers[0]._id ||
          gWearers[0].id;

        setSelectedWearerId(
          firstId
        );

        localStorage.setItem(
          'selectedWearerId',
          firstId
        );

      }


      setCurrentPage(
        'dashboard'
      );

    };


  // =========================================================
  // LOGIN
  // =========================================================

  const login =
    async (
      email,
      password
    ) => {

      setIsLoading(true);

      try {

        const data =
          await API.login({
            email,
            password
          });


        if (
          data.success &&
          data.guardian
        ) {

          handleAuthSuccess(
            data.guardian
          );

          return {
            success: true,
            message: data.message
          };

        }


        return {
          success: false,
          message:
            data.message ||
            'Invalid credentials'
        };

      } catch (error) {

        return {
          success: false,
          message:
            error.message ||
            'Unable to connect to server'
        };

      } finally {

        setIsLoading(false);

      }

    };


  // =========================================================
  // SIGNUP
  // =========================================================

  const signup =
    async (userData) => {

      setIsLoading(true);

      try {

        const data =
          await API.signup(
            userData
          );


        if (
          data.success &&
          data.guardian
        ) {

          handleAuthSuccess(
            data.guardian
          );

          return {
            success: true,
            message: data.message
          };

        }


        return {
          success: false,
          message:
            data.message ||
            'Could not register'
        };

      } catch (error) {

        return {
          success: false,
          message:
            error.message ||
            'Network error during registration'
        };

      } finally {

        setIsLoading(false);

      }

    };


  // =========================================================
  // LOGOUT
  // =========================================================

  const logout = () => {

    setIsLoggedIn(false);

    setGuardianId('');

    setGuardianName('');

    setGuardianEmail('');

    setGuardianMobile('');

    setWearers([]);

    setSelectedWearerId('');

    setDeviceStatus(null);

    setMonitoring(null);

    setLocation(null);

    setActiveAlerts([]);


    localStorage.removeItem(
      'guardianLoggedIn'
    );

    localStorage.removeItem(
      'guardianId'
    );

    localStorage.removeItem(
      'guardianName'
    );

    localStorage.removeItem(
      'guardianEmail'
    );

    localStorage.removeItem(
      'guardianMobile'
    );

    localStorage.removeItem(
      'guardianWearers'
    );

    localStorage.removeItem(
      'selectedWearerId'
    );

    localStorage.removeItem(
      'selectedWearerName'
    );

    localStorage.removeItem(
      'selectedWearerType'
    );

  };


  // =========================================================
  // DEMO LOGIN
  // =========================================================

  const demoLogin = () => {

    const demoGuardian = {

      id:
        '65f2a1b9c3d4e5f678901201',

      name:
        'Priya Sharma (Guardian)',

      email:
        'priya.guardian@trinetra.ai',

      mobile:
        '+91 98201 23456',

      wearers: [

        {
          _id:
            '65f2a1b9c3d4e5f678901234',

          name:
            'Aanya (Child)',

          type:
            'child',

          deviceId:
            'ESP32_CHILD_01'
        },

        {
          _id:
            '65f2a1b9c3d4e5f678905678',

          name:
            'Sneha (Woman)',

          type:
            'woman',

          deviceId:
            'ESP32_WOMAN_02'
        }

      ]

    };


    handleAuthSuccess(
      demoGuardian
    );

  };


  // =========================================================
  // ADD WEARER
  // =========================================================

  const addWearer =
    async (
      wearerName,
      wearerType
    ) => {

      if (
        !guardianEmail &&
        !guardianId
      ) {

        const newWearer = {

          _id:
            'w_' +
            Date.now(),

          name:
            wearerName.trim(),

          type:
            wearerType,

          deviceId:
            `ESP32_${wearerType.toUpperCase()}_${Math.floor(
              100 +
              Math.random() *
              900
            )}`

        };


        const updated = [
          ...wearers,
          newWearer
        ];


        setWearers(updated);

        localStorage.setItem(
          'guardianWearers',
          JSON.stringify(updated)
        );

        setSelectedWearerId(
          newWearer._id
        );


        return {
          success: true
        };

      }


      try {

        const response =
          await API.addWearer({

            email:
              guardianEmail,

            wearerName,

            wearerType

          });


        if (
          response.success &&
          response.wearers
        ) {

          setWearers(
            response.wearers
          );

          localStorage.setItem(
            'guardianWearers',
            JSON.stringify(
              response.wearers
            )
          );


          const last =
            response.wearers[
              response.wearers
                .length - 1
            ];


          if (last) {

            setSelectedWearerId(
              last._id
            );

          }


          return {
            success: true,
            message:
              response.message
          };

        }


        return {
          success: false,
          message:
            response.message ||
            'Failed to add wearer'
        };

      } catch (error) {

        const fallbackWearer = {

          _id:
            'w_' +
            Date.now(),

          name:
            wearerName.trim(),

          type:
            wearerType

        };


        const updated = [
          ...wearers,
          fallbackWearer
        ];


        setWearers(updated);

        localStorage.setItem(
          'guardianWearers',
          JSON.stringify(updated)
        );

        setSelectedWearerId(
          fallbackWearer._id
        );


        return {
          success: true
        };

      }

    };


  // =========================================================
  // SWITCH WEARER
  // =========================================================

  const switchWearer =
    (wearerId) => {

      setSelectedWearerId(
        wearerId
      );

      localStorage.setItem(
        'selectedWearerId',
        wearerId
      );


      // Clear previous wearer's live values immediately
      setDeviceStatus(null);

      setMonitoring(null);

      setLocation(null);

    };


  // =========================================================
  // THEME
  // =========================================================

  const toggleTheme = () => {

    setTheme(
      (previous) =>
        previous === 'dark'
          ? 'light'
          : 'dark'
    );

  };


  // =========================================================
  // MANUAL REFRESH
  // =========================================================

  const refreshTelemetry =
    useCallback(async () => {

      await Promise.all([
        fetchRealtimeData(),
        fetchAlerts()
      ]);

    }, [
      fetchRealtimeData,
      fetchAlerts
    ]);


  // =========================================================
  // PROVIDER
  // =========================================================

  return (

    <AppContext.Provider
      value={{

        theme,
        toggleTheme,

        currentPage,
        setCurrentPage,

        isLoggedIn,
        login,
        signup,
        logout,
        demoLogin,

        guardianId,
        setGuardianId,

        guardianName,
        guardianEmail,
        guardianMobile,

        wearers,
        setWearers,

        selectedWearerId,
        selectedWearer,

        switchWearer,
        addWearer,

        deviceStatus,

        // IMPORTANT:
        // All pages using "monitoring" now receive
        // merged latest monitoring + alert fallback.
        monitoring:
          liveMonitoring,

        rawMonitoring:
          monitoring,

        location,

        activeAlerts,
        setActiveAlerts,

        currentWearerAlert,

        isHardwareOnline,

        lastTelemetryTimestamp,

        refreshTelemetry,

        isSimulatorOpen,
        setIsSimulatorOpen,

        isAddWearerOpen,
        setIsAddWearerOpen,

        isLoading

      }}
    >

      {children}

    </AppContext.Provider>

  );

};


export const useApp = () => {

  const context =
    useContext(AppContext);


  if (!context) {

    throw new Error(
      'useApp must be used within an AppProvider'
    );

  }


  return context;

};