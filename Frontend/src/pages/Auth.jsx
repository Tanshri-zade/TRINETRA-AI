import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Shield, 
  Lock, 
  Mail, 
  Phone, 
  User, 
  Baby, 
  UserCheck, 
  Radio, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle,
  Sparkles,
  KeyRound,
  ShieldCheck
} from 'lucide-react';
import { API } from '../services/api';

export const Auth = () => {
  const { login, signup, demoLogin } = useApp();
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'signup' | 'reset'

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [guardianName, setGuardianName] = useState('');
  const [wearerName, setWearerName] = useState('');
  const [wearerType, setWearerType] = useState('child'); // 'child' | 'woman'
  const [signupEmail, setSignupEmail] = useState('');
  const [signupMobile, setSignupMobile] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  // Reset password state
  const [resetEmail, setResetEmail] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetStep, setResetStep] = useState(1); // 1: verify, 2: set new password

  // Common UI state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      const res = await login(loginEmail.trim().toLowerCase(), loginPassword);
      if (!res.success) {
        setError(res.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('Server connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!guardianName || !wearerName || !signupEmail || !signupMobile || !signupPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: guardianName.trim(),
        wearerName: wearerName.trim(),
        wearerType: wearerType,
        email: signupEmail.trim().toLowerCase(),
        mobile: signupMobile.trim(),
        password: signupPassword
      };

      const res = await signup(payload);
      if (!res.success) {
        setError(res.message || 'Registration failed. Please check your details.');
      }
    } catch (err) {
      setError('Server connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      const res = await API.verifyEmail(resetEmail.trim().toLowerCase());
      if (res.success) {
        setSuccess('Email verified! Please enter your new password.');
        setResetStep(2);
      } else {
        setError(res.message || 'Email not registered.');
      }
    } catch (err) {
      setError('Unable to verify email.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      const res = await API.resetPassword(resetEmail.trim().toLowerCase(), resetNewPassword);
      if (res.success) {
        setSuccess('Password updated successfully! You can now log in.');
        setTimeout(() => {
          setActiveTab('login');
          setLoginEmail(resetEmail);
          setResetStep(1);
          setResetNewPassword('');
        }, 1500);
      } else {
        setError(res.message || 'Failed to update password.');
      }
    } catch (err) {
      setError('Unable to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem',
      background: 'radial-gradient(ellipse at top, #1e293b 0%, #0a0f1d 70%)',
      fontFamily: 'var(--font-main)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '540px',
        background: 'rgba(17, 24, 39, 0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        padding: '2.5rem',
        overflow: 'hidden'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #06b6d4, #2563eb)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: 'var(--shadow-glow-cyan)',
            marginBottom: '1rem'
          }}>
            <Radio size={28} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
            TRINETRA<span style={{ color: 'var(--accent-cyan)' }}>AI</span>
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Next-Gen Personal Safety & IoT Wearable Guardian System
          </p>
        </div>

        {/* Tab Selector */}
        <div style={{
          display: 'flex',
          background: 'rgba(15, 23, 42, 0.6)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.35rem',
          marginBottom: '1.75rem',
          border: '1px solid var(--border-color)'
        }}>
          <button
            type="button"
            onClick={() => { setActiveTab('login'); clearMessages(); }}
            style={{
              flex: 1,
              padding: '0.625rem',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: activeTab === 'login' ? 'linear-gradient(135deg, #0284c7, #2563eb)' : 'transparent',
              color: activeTab === 'login' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Guardian Login
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('signup'); clearMessages(); }}
            style={{
              flex: 1,
              padding: '0.625rem',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: activeTab === 'signup' ? 'linear-gradient(135deg, #0284c7, #2563eb)' : 'transparent',
              color: activeTab === 'signup' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: 'var(--accent-rose)',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: 'var(--accent-emerald)',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <CheckCircle size={16} />
            <span>{success}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                Guardian Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.6rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => { setActiveTab('reset'); clearMessages(); }}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  Forgot Password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.6rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.8rem', fontSize: '0.95rem', marginTop: '0.5rem' }}
            >
              {loading ? 'Authenticating...' : 'Sign In as Guardian'}
              <ArrowRight size={17} />
            </button>
          </form>
        )}

        {/* SIGN UP FORM */}
        {activeTab === 'signup' && (
          <form onSubmit={handleSignupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {/* Guardian Full Name */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                Guardian Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <User size={17} color="var(--text-muted)" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Sharma"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Wearer Information Header */}
            <div style={{
              background: 'rgba(6, 182, 212, 0.08)',
              border: '1px solid rgba(6, 182, 212, 0.25)',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} color="var(--accent-cyan)" />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                  PRIMARY WEARER PROFILE & STATUS
                </span>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                  Wearer / Ward Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aanya (Child) or Sneha (Woman)"
                  value={wearerName}
                  onChange={(e) => setWearerName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                  Select Wearer Type (Safety Mode)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {/* Child Selection */}
                  <div
                    onClick={() => setWearerType('child')}
                    style={{
                      cursor: 'pointer',
                      padding: '0.65rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: `2px solid ${wearerType === 'child' ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
                      background: wearerType === 'child' ? 'rgba(6, 182, 212, 0.15)' : 'var(--bg-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Baby size={18} color={wearerType === 'child' ? 'var(--accent-cyan)' : 'var(--text-muted)'} />
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: wearerType === 'child' ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>
                        Child
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>School Safe Zone</div>
                    </div>
                  </div>

                  {/* Woman Selection */}
                  <div
                    onClick={() => setWearerType('woman')}
                    style={{
                      cursor: 'pointer',
                      padding: '0.65rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: `2px solid ${wearerType === 'woman' ? 'var(--accent-rose)' : 'var(--border-color)'}`,
                      background: wearerType === 'woman' ? 'rgba(244, 63, 94, 0.15)' : 'var(--bg-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <UserCheck size={18} color={wearerType === 'woman' ? 'var(--accent-rose)' : 'var(--text-muted)'} />
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: wearerType === 'woman' ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
                        Woman
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>SOS & Police Assist</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Email & Mobile */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="email"
                    required
                    placeholder="email@domain.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.75rem 0.65rem 2.2rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.825rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                  Mobile (+91)
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="tel"
                    required
                    placeholder="9876543210"
                    value={signupMobile}
                    onChange={(e) => setSignupMobile(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.75rem 0.65rem 2.2rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.825rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                Create Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem 0.65rem 2.2rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.825rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.8rem', fontSize: '0.95rem', marginTop: '0.35rem' }}
            >
              {loading ? 'Creating Account...' : 'Complete Registration'}
              <ArrowRight size={17} />
            </button>
          </form>
        )}

        {/* FORGOT / RESET PASSWORD TAB */}
        {activeTab === 'reset' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <KeyRound size={20} color="var(--accent-cyan)" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Reset Guardian Password</h3>
            </div>

            {resetStep === 1 ? (
              <form onSubmit={handleVerifyEmail} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                    Enter Registered Guardian Email
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem 0.75rem 2.6rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                  >
                    Back to Login
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                    style={{ flex: 1.5 }}
                  >
                    {loading ? 'Verifying...' : 'Verify Email'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                    New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="password"
                      required
                      placeholder="Enter your new password"
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem 0.75rem 2.6rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.8rem' }}
                >
                  {loading ? 'Updating Password...' : 'Save New Password'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* FAST 1-CLICK DEMO ACCESS BAR */}
        <div style={{
          marginTop: '1.75rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Want to test without registering?
          </span>
          <button
            type="button"
            onClick={demoLogin}
            className="btn btn-secondary"
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(37, 99, 235, 0.12))',
              border: '1px solid rgba(6, 182, 212, 0.35)',
              color: 'var(--accent-cyan)',
              fontSize: '0.85rem'
            }}
          >
            <Sparkles size={16} />
            Quick Demo Login (Child & Woman Profile)
          </button>
        </div>
      </div>
    </div>
  );
};
