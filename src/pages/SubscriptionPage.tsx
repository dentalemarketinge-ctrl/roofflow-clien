import { CalendarClock, LogOut, ShieldCheck } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function SubscriptionPage() {
  const { profile, loading, logout } = useAuth();
  if (!loading && !profile) return <Navigate to="/login" replace />;
  if (!profile?.organization) return null;

  const trialEnd = profile.organization.trial_ends_at
    ? new Date(profile.organization.trial_ends_at).toLocaleDateString()
    : 'not available';

  return (
    <main className="onboarding-shell">
      <section className="auth-card subscription-card">
        <span className="onboarding-icon"><ShieldCheck size={24} /></span>
        <p className="auth-eyebrow">Workspace subscription</p>
        <h2>{profile.organization.name}</h2>
        <p className="onboarding-intro">This workspace is paused until its subscription is activated.</p>
        <div className="subscription-detail">
          <CalendarClock size={18} />
          <span><small>Trial ended</small><strong>{trialEnd}</strong></span>
        </div>
        <p className="subscription-note">Billing activation is controlled by the RoofFlow platform owner while payment checkout is connected.</p>
        <button className="auth-switch subscription-signout" type="button" onClick={logout}>
          <LogOut size={15} /> Sign out
        </button>
      </section>
    </main>
  );
}
