import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { request, stationApi } from '../services/api';

export default function Register() {

  const nav = useNavigate();

  const [f, setF] = useState({
    stationId: '',
    name: '',
    address: '',
    phone: '',
    password: '',
    latitude: '',
    longitude: '',
    registrationKey: ''
  });

  const [msg, setMsg] = useState('');

  const ch = (e) =>
    setF({
      ...f,
      [e.target.name]: e.target.value
    });

  async function submit(e) {
    e.preventDefault();

    try {

      await request(`${stationApi}/register`, {
        method: 'POST',
        body: JSON.stringify({
          ...f,
          latitude: f.latitude
            ? Number(f.latitude)
            : undefined,
          longitude: f.longitude
            ? Number(f.longitude)
            : undefined
        })
      });

      nav('/login');

    } catch (e) {
      setMsg(e.message);
    }
  }

  return (
    <div className="auth">

      <form
        className="authcard wide"
        onSubmit={submit}
      >

        <div className="brand big">
          TRINETRA<span>AI</span>
          <small>Police Station Registration</small>
        </div>

        <h2>Register Police Station</h2>

        <div className="formgrid">

          {[
            ['stationId', 'Station ID'],
            ['name', 'Station Name'],
            ['address', 'Address'],
            ['phone', 'Phone'],
            ['latitude', 'Latitude'],
            ['longitude', 'Longitude']
          ].map(([n, l]) => (

            <div key={n}>
              <label>{l}</label>

              <input
                name={n}
                value={f[n]}
                onChange={ch}
                required={[
                  'stationId',
                  'name',
                  'address',
                  'phone'
                ].includes(n)}
              />
            </div>

          ))}

          <div className="full">
            <label>Password</label>

            <input
              name="password"
              type="password"
              value={f.password}
              onChange={ch}
              required
            />
          </div>

          <div className="full">
            <label>Authorization Code</label>

            <input
              name="registrationKey"
              type="password"
              value={f.registrationKey}
              onChange={ch}
              placeholder="Enter police registration authorization code"
              required
            />
          </div>

        </div>

        <button type="submit">
          Register Station
        </button>

        {msg && (
          <div className="error">
            {msg}
          </div>
        )}

        <div className="switch">
          Already registered?{' '}
          <Link to="/login">
            Login
          </Link>
        </div>

      </form>

    </div>
  );
}