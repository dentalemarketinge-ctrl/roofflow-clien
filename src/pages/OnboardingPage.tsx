import { FormEvent, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, Building2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function OnboardingPage() {
  const { profile, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState('');
  const [slug, setSlug] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [serviceArea, setServiceArea] = useState('');
  const [timezone, setTimezone] = useState('America/Chicago');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const suggestedSlug = useMemo(
    () => companyName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    [companyName],
  );

  if (!loading && !profile) return <Navigate to="/login" replace />;
  if (profile?.organization) return <Navigate to="/dashboard" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.createWorkspace({
        company_name: companyName,
        slug: slug || suggestedSlug,
        company_phone: companyPhone,
        service_area: serviceArea,
        business_timezone: timezone,
      });
      await refreshProfile();
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create workspace');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="onboarding-shell">
      <form className="onboarding-card" onSubmit={submit}>
        <span className="onboarding-icon"><Building2 size={24} /></span>
        <p className="auth-eyebrow">Workspace setup</p>
        <h1>Tell us about your roofing company.</h1>
        <p className="onboarding-intro">These details create your private CRM workspace. Telnyx routing comes next.</p>
        <div className="onboarding-grid">
          <label className="auth-field">Company name
            <input value={companyName} onChange={(event) => setCompanyName(event.target.value)} required />
          </label>
          <label className="auth-field">Workspace URL
            <div className="slug-field"><span>app/</span><input value={slug} onChange={(event) => setSlug(event.target.value)} placeholder={suggestedSlug || 'your-company'} /></div>
          </label>
          <label className="auth-field">Business phone
            <input value={companyPhone} onChange={(event) => setCompanyPhone(event.target.value)} placeholder="+1..." />
          </label>
          <label className="auth-field">Service area
            <input value={serviceArea} onChange={(event) => setServiceArea(event.target.value)} placeholder="Dallas–Fort Worth, TX" />
          </label>
          <label className="auth-field">Business timezone
            <select value={timezone} onChange={(event) => setTimezone(event.target.value)}>
              <option value="America/Chicago">America/Chicago</option>
              <option value="America/New_York">America/New_York</option>
              <option value="America/Denver">America/Denver</option>
              <option value="America/Los_Angeles">America/Los_Angeles</option>
              <option value="Africa/Algiers">Africa/Algiers</option>
            </select>
          </label>
        </div>
        {error && <p className="auth-message error">{error}</p>}
        <button className="auth-submit" disabled={submitting}>
          {submitting ? 'Creating workspace…' : 'Create command center'} <ArrowRight size={17} />
        </button>
      </form>
    </main>
  );
}
