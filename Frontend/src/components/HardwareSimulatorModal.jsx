import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { API } from '../services/api';
import { 
  X, 
  Play, 
  Square, 
  Send, 
  Cpu, 
  Heart, 
  AlertTriangle, 
  MapPin, 
  Mic, 
  Battery, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export const HardwareSimulatorModal = () => {
  const { 
    isSimulatorOpen, 
    setIsSimulatorOpen, 
    selectedWearer, 
    refreshTelemetry 
  } = useApp();

  const [wearerId, setWearerId] = useState('');
  const [heartRate, setHeartRate] = useState(76);
  const [battery, setBattery] = useState(94);
  const [latitude, setLatitude] = useState(21.1188);
  const [longitude, setLongitude] = useState(79.0195);
  const [gpsStatus, setGpsStatus] = useState('Connected');
  const [gsmStatus, setGsmStatus] = useState('Connected');
  const [micStatus, setMicStatus] = useState('Connected');
  const [voiceStatus, setVoiceStatus] = useState('Normal');
  const [detectedSpeech, setDetectedSpeech] = useState('');
  const [isSos, setIsSos] = useState(false);

  const [isStreaming, setIsStreaming] = useState(false);
  const [logOutput, setLogOutput] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const streamTimerRef = useRef(null);

  useEffect(() => {
    if (selectedWearer) {
      setWearerId(selectedWearer._id);
    }
  }, [selectedWearer]);

  // Clean up streaming on unmount
  useEffect(() => {
    return () => {
      if (streamTimerRef.current) clearInterval(streamTimerRef.current);
    };
  }, []);

  if (!isSimulatorOpen) return null;

  const addLog = (msg, type = 'info') => {
    const time = new Date().toLocaleTimeString();
    setLogOutput(prev => [{ time, msg, type }, ...prev.slice(0, 49)]);
  };

  const dispatchTelemetry = async (overrideData = {}) => {
    if (!wearerId) {
      addLog('Error: Wearer ID is missing. Add or select a wearer first.', 'error');
      return;
    }

    setIsSending(true);
    const payload = {
      wearerId,
      deviceId: 'ESP32_SIMULATOR',
      heartRate: overrideData.heartRate ?? heartRate,
      battery: overrideData.battery ?? battery,
      latitude: overrideData.latitude ?? latitude,
      longitude: overrideData.longitude ?? longitude,
      gpsStatus: overrideData.gpsStatus ?? gpsStatus,
      gsmStatus: overrideData.gsmStatus ?? gsmStatus,
      microphoneStatus: overrideData.micStatus ?? micStatus,
      voiceStatus: overrideData.voiceStatus ?? voiceStatus,
      detectedSpeech: overrideData.detectedSpeech ?? detectedSpeech,
      sos: overrideData.sos ?? isSos,
      speed: 1.5
    };

    try {
      const res = await API.postHardwareTelemetry(payload);
      if (res.success) {
        addLog(`✅ Telemetry Dispatched: HR=${payload.heartRate} BPM, SOS=${payload.sos ? 'YES' : 'NO'}, Geo=${res.geofenceStatus}`, 'success');
        if (res.alertCreated) {
          addLog(`🚨 Alert Created: ${res.alert?.triggeredBy || 'Alert'} - "${res.alert?.message}"`, 'alert');
        }
        refreshTelemetry();
      } else {
        addLog(`❌ Backend Error: ${res.message || 'Unknown error'}`, 'error');
      }
    } catch (err) {
      addLog(`❌ Connection Error: ${err.message}`, 'error');
    } finally {
      setIsSending(false);
    }
  };

  // Scenario Presets
  const applyPreset = (preset) => {
    switch (preset) {
      case 'normal':
        setHeartRate(74);
        setIsSos(false);
        setVoiceStatus('Normal');
        setDetectedSpeech('');
        setLatitude(21.1188);
        setLongitude(79.0195);
        dispatchTelemetry({
          heartRate: 74,
          sos: false,
          voiceStatus: 'Normal',
          detectedSpeech: '',
          latitude: 21.1188,
          longitude: 79.0195
        });
        break;

      case 'sos':
        setIsSos(true);
        setHeartRate(118);
        dispatchTelemetry({
          sos: true,
          heartRate: 118
        });
        break;

      case 'high-hr':
        setHeartRate(142);
        setIsSos(false);
        dispatchTelemetry({
          heartRate: 142,
          sos: false
        });
        break;

      case 'voice-distress':
        setVoiceStatus('Distress');
        setDetectedSpeech('Help me! Someone is following me!');
        dispatchTelemetry({
          voiceStatus: 'Distress',
          detectedSpeech: 'Help me! Someone is following me!',
          heartRate: 122
        });
        break;

      case 'outside-zone':
        const outLat = 19.1450;
        const outLng = 72.9300;
        setLatitude(outLat);
        setLongitude(outLng);
        dispatchTelemetry({
          latitude: outLat,
          longitude: outLng
        });
        break;

      default:
        break;
    }
  };

  const toggleStreaming = () => {
    if (isStreaming) {
      clearInterval(streamTimerRef.current);
      setIsStreaming(false);
      addLog('Continuous hardware stream stopped.', 'info');
    } else {
      setIsStreaming(true);
      addLog('Continuous hardware stream active (every 3 seconds)...', 'info');
      dispatchTelemetry();
      streamTimerRef.current = setInterval(() => {
        // slight jitter around Vasudev Nagar, Kalyan Nagar
        const jitterLat = 21.1188 + (Math.random() - 0.5) * 0.0004;
        const jitterLng = 79.0195 + (Math.random() - 0.5) * 0.0004;
        const jitterHr = 72 + Math.floor(Math.random() * 8) - 4;
        setLatitude(parseFloat(jitterLat.toFixed(6)));
        setLongitude(parseFloat(jitterLng.toFixed(6)));
        setHeartRate(jitterHr);
        dispatchTelemetry({
          latitude: parseFloat(jitterLat.toFixed(6)),
          longitude: parseFloat(jitterLng.toFixed(6)),
          heartRate: jitterHr
        });
      }, 3000);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel" style={{
        maxWidth: '850px',
        width: '100%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255,255,255,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(6, 182, 212, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-cyan)'
            }}>
              <Cpu size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>ESP32 Hardware Telemetry Simulator</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Test end-to-end hardware sensor ingestion directly in the browser
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsSimulatorOpen(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Quick Scenario Buttons */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
              1-Click Hardware Test Scenarios
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.625rem', marginTop: '0.5rem' }}>
              <button
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.5rem', justifyContent: 'flex-start' }}
                onClick={() => applyPreset('normal')}
              >
                <CheckCircle2 size={16} color="var(--accent-emerald)" />
                Normal Telemetry
              </button>

              <button
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.5rem', justifyContent: 'flex-start' }}
                onClick={() => applyPreset('sos')}
              >
                <AlertTriangle size={16} color="var(--accent-rose)" />
                SOS Button Press
              </button>

              <button
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.5rem', justifyContent: 'flex-start' }}
                onClick={() => applyPreset('high-hr')}
              >
                <Heart size={16} color="var(--accent-amber)" />
                High Heart Rate
              </button>

              <button
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.5rem', justifyContent: 'flex-start' }}
                onClick={() => applyPreset('voice-distress')}
              >
                <Mic size={16} color="var(--accent-rose)" />
                Voice "Help Me!"
              </button>

              <button
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.5rem', justifyContent: 'flex-start' }}
                onClick={() => applyPreset('outside-zone')}
              >
                <MapPin size={16} color="var(--accent-cyan)" />
                Breach Safe Zone
              </button>
            </div>
          </div>

          {/* Telemetry Input Parameters Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            background: 'rgba(0,0,0,0.2)',
            padding: '1.25rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)'
          }}>
            {/* Wearer ID */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Target Wearer MongoDB ID</label>
              <input
                type="text"
                value={wearerId}
                onChange={e => setWearerId(e.target.value)}
                placeholder="Paste wearer ObjectId"
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  marginTop: '0.25rem'
                }}
              />
            </div>

            {/* Heart Rate Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600 }}>
                <span>MAX30102 Heart Rate</span>
                <span style={{ color: heartRate < 50 || heartRate > 120 ? 'var(--accent-rose)' : 'var(--accent-cyan)' }}>
                  {heartRate} BPM
                </span>
              </div>
              <input
                type="range"
                min="40"
                max="180"
                value={heartRate}
                onChange={e => setHeartRate(Number(e.target.value))}
                style={{ width: '100%', marginTop: '0.5rem', cursor: 'pointer' }}
              />
            </div>

            {/* Battery Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600 }}>
                <span>Battery Level</span>
                <span style={{ color: battery < 20 ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                  {battery}%
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                value={battery}
                onChange={e => setBattery(Number(e.target.value))}
                style={{ width: '100%', marginTop: '0.5rem', cursor: 'pointer' }}
              />
            </div>

            {/* GPS Latitude */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>GPS Latitude</label>
              <input
                type="number"
                step="0.0001"
                value={latitude}
                onChange={e => setLatitude(parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  padding: '0.45rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  marginTop: '0.25rem'
                }}
              />
            </div>

            {/* GPS Longitude */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>GPS Longitude</label>
              <input
                type="number"
                step="0.0001"
                value={longitude}
                onChange={e => setLongitude(parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  padding: '0.45rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  marginTop: '0.25rem'
                }}
              />
            </div>
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                className="btn btn-primary"
                onClick={() => dispatchTelemetry()}
                disabled={isSending}
                style={{ fontSize: '0.85rem' }}
              >
                <Send size={16} />
                Send Telemetry Packet
              </button>

              <button
                className={`btn ${isStreaming ? 'btn-danger' : 'btn-secondary'}`}
                onClick={toggleStreaming}
                style={{ fontSize: '0.85rem' }}
              >
                {isStreaming ? <Square size={16} /> : <Play size={16} />}
                {isStreaming ? 'Stop Telemetry Stream' : 'Start 3s Stream Loop'}
              </button>
            </div>

            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Target: POST /api/v1/hardware/telemetry
            </span>
          </div>

          {/* Simulator Console Log Output */}
          <div style={{
            background: '#090d16',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            padding: '0.875rem',
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            minHeight: '120px',
            maxHeight: '160px',
            overflowY: 'auto'
          }}>
            <div style={{ color: 'var(--text-muted)', marginBottom: '0.375rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.25rem' }}>
              Hardware Telemetry Console Log:
            </div>
            {logOutput.length === 0 ? (
              <span style={{ color: 'var(--text-muted)' }}>Ready. Click any test scenario or "Send Telemetry Packet" above.</span>
            ) : (
              logOutput.map((l, i) => (
                <div key={i} style={{ 
                  color: l.type === 'error' ? 'var(--accent-rose)' : l.type === 'alert' ? 'var(--accent-amber)' : l.type === 'success' ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                  marginBottom: '2px'
                }}>
                  [{l.time}] {l.msg}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
