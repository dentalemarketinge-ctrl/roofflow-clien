import { FormEvent, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

export default function AuthPage() {
  const { profile, login, signup } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const initialMode = new URLSearchParams(location.search).get('mode') === 'signup' ? 'signup' : 'login';
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  if (profile?.is_platform_admin && !profile.organization) return <Navigate to="/admin" replace />;
  if (profile?.organization) return <Navigate to="/dashboard" replace />;
  if (profile?.onboarding_required) return <Navigate to="/onboarding" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setSubmitting(true);
    try {
      if (mode === 'login') {
        const nextProfile = await login(email, password);
        navigate(nextProfile?.is_platform_admin && !nextProfile.organization ? '/admin' : '/dashboard');
      } else if (mode === 'signup') {
        const result = await signup(email, password, fullName);
        if (result.needsConfirmation) {
          setNotice('Check your email to confirm your account, then return here to sign in.');
        } else {
          navigate('/onboarding');
        }
      } else {
        await api.requestPasswordReset(email);
        setNotice('If that account exists, a secure password link is on its way.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-brand-panel">
        <Link to="/" className="auth-logo"><span>RF</span> RoofFlow</Link>
        <div>
          <p className="auth-eyebrow">Built for roofing operators</p>
          <h1>Every lead, call, job, and dollar—inside one command center.</h1>
          <p>Turn missed calls into booked inspections while your crews stay focused on the roof.</p>
        </div>
        <div className="auth-proof">
          <span><CheckCircle size={18} /> 14-day workspace trial</span>
          <span><ShieldCheck size={18} /> Isolated company data</span>
        </div>
      </section>

      <section className="auth-form-panel">
        <form className="auth-card" onSubmit={submit}>
          <div className="auth-card-heading">
            <LockKeyhole size={22} />
            <div>
              <h2>{mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Create your roofing workspace' : 'Reset your password'}</h2>
              <p>
                {mode === 'login'
                  ? 'Sign in to your command center.'
                  : mode === 'signup'
                    ? 'Start with one company. Invite your team later.'
                    : 'We will email you a secure recovery link.'}
              </p>
            </div>
          </div>

          {mode === 'signup' && (
            <label className="auth-field">Your name
              <input value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" required />
            </label>
          )}
          <label className="auth-field">Work email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
          </label>
          {mode !== 'forgot' && (
            <label className="auth-field">Password
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={8} required />
            </label>
          )}

          {error && <p className="auth-message error">{error}</p>}
          {notice && <p className="auth-message success">{notice}</p>}
          <button className="auth-submit" type="submit" disabled={submitting}>
            {submitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Email recovery link'} <ArrowRight size={17} />
          </button>
          {mode === 'login' && (
            <button className="auth-switch auth-forgot" type="button" onClick={() => { setMode('forgot'); setError(''); setNotice(''); }}>
              Forgot your password?
            </button>
          )}
          <button className="auth-switch" type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setNotice(''); }}>
            {mode === 'login' ? 'New to RoofFlow? Create an account' : 'Back to sign in'}
          </button>
        </form>
      </section>
    </main>
  );
}
