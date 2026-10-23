import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, UserPlus, Shield, Baby, UserCheck, AlertCircle, CheckCircle } from 'lucide-react';

export const AddWearerModal = () => {
  const { isAddWearerOpen, setIsAddWearerOpen, addWearer } = useApp();
  const [name, setName] = useState('');
  const [type, setType] = useState('child'); // 'child' | 'woman'
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAddWearerOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Please enter the wearer name');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await addWearer(name, type);
      if (res.success) {
        setSuccess(`Wearer "${name}" (${type === 'child' ? 'Child' : 'Woman'}) added successfully!`);
        setName('');
        setTimeout(() => {
          setIsAddWearerOpen(false);
          setSuccess('');
        }, 1200);
      } else {
        setError(res.message || 'Failed to add wearer');
      }
    } catch (err) {
      setError('An error occurred while adding wearer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setIsAddWearerOpen(false)}>
      <div 
        className="glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: '2rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          position: 'relative'
        }}
      >
        {/* Close Button */}
        <button
          onClick={() => setIsAddWearerOpen(false)}
          className="btn btn-secondary"
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            padding: '0.4rem',
            borderRadius: 'var(--radius-full)'
          }}
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff'
          }}>
            <UserPlus size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Register New Wearer</h2>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              Add a child or woman profile to link with the Trinetra-AI IoT wearable
            </p>
          </div>
        </div>

        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
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
            {error}
          </div>
        )}

        {success && (
          <div style={{
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
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
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Wearer Name */}
          <div>
            <label style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
              Wearer Full Name / Nickname
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Aanya, Sneha, Aarav"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Wearer Type Selection Cards */}
          <div>
            <label style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.6rem' }}>
              Select Wearer Protection Mode
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
              {/* Child Option */}
              <div
                onClick={() => setType('child')}
                style={{
                  cursor: 'pointer',
                  padding: '1.1rem',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${type === 'child' ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
                  background: type === 'child' ? 'rgba(6, 182, 212, 0.12)' : 'var(--bg-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: type === 'child' ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.06)',
                    color: type === 'child' ? '#0f172a' : 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Baby size={20} />
                  </div>
                  <span className={`badge ${type === 'child' ? 'badge-cyan' : ''}`} style={{ fontSize: '0.7rem' }}>
                    CHILD
                  </span>
                </div>
                <strong style={{ fontSize: '0.95rem', color: type === 'child' ? 'var(--accent-cyan)' : 'var(--text-primary)', marginTop: '0.25rem' }}>
                  Child Mode
                </strong>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  School safe geofences, pediatric vitals tracking & transit alerts
                </p>
              </div>

              {/* Woman Option */}
              <div
                onClick={() => setType('woman')}
                style={{
                  cursor: 'pointer',
                  padding: '1.1rem',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${type === 'woman' ? 'var(--accent-rose)' : 'var(--border-color)'}`,
                  background: type === 'woman' ? 'rgba(244, 63, 94, 0.12)' : 'var(--bg-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: type === 'woman' ? 'var(--accent-rose)' : 'rgba(255,255,255,0.06)',
                    color: type === 'woman' ? '#ffffff' : 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <UserCheck size={20} />
                  </div>
                  <span className={`badge ${type === 'woman' ? 'badge-rose' : ''}`} style={{ fontSize: '0.7rem' }}>
                    WOMAN
                  </span>
                </div>
                <strong style={{ fontSize: '0.95rem', color: type === 'woman' ? 'var(--accent-rose)' : 'var(--text-primary)', marginTop: '0.25rem' }}>
                  Women Safety Mode
                </strong>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  Instant SOS button, audio distress recognition & police dispatch
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setIsAddWearerOpen(false)}
              className="btn btn-secondary"
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ flex: 2 }}
            >
              {isSubmitting ? 'Registering...' : 'Register Wearer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
