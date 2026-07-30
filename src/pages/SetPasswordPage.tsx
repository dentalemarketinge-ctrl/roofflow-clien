import { FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { CheckCircle, KeyRound } from 'lucide-react';
import { api } from '../services/api';
import { clearAuthRedirect } from '../services/session';
import { useAuth } from '../contexts/AuthContext';

export default function SetPasswordPage() {
  const { profile, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!loading && !profile) return <Navigate to="/login" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (password !== confirmation) {
      setError('Passwords do not match');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.updatePassword(password);
      clearAuthRedirect();
      await refreshProfile();
      navigate(profile?.organization ? '/dashboard' : '/onboarding', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="onboarding-shell">
      <form className="auth-card password-card" onSubmit={submit}>
        <span className="onboarding-icon"><KeyRound size={23} /></span>
        <p className="auth-eyebrow">Secure your account</p>
        <h2>Choose your password</h2>
        <p className="onboarding-intro">Finish accepting your invitation, then enter your company workspace.</p>
        <label className="auth-field">New password
          <input type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required />
        </label>
        <label className="auth-field">Confirm password
          <input type="password" minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" required />
        </label>
        {error && <p className="auth-message error">{error}</p>}
        <button className="auth-submit" disabled={submitting}>
          <CheckCircle size={17} /> {submitting ? 'Saving...' : 'Save password'}
        </button>
      </form>
    </main>
  );
}
