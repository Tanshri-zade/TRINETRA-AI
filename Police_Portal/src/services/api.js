export const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api/v1";
export const stationApi = `${API_BASE}/police-stations`;
export const alertApi = `${API_BASE}/police-alert`;
export async function request(url, options = {}) { const r = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } }); const data = await r.json().catch(() => ({})); if (!r.ok || data.success === false) throw new Error(data.message || `Request failed (${r.status})`); return data; }
