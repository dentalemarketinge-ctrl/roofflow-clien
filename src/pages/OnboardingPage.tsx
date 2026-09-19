import { FormEvent, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Building2, Check } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const DAYS = [{ value: 1, label: 'Mon' }, { value: 2, label: 'Tue' }, { value: 3, label: 'Wed' }, { value: 4, label: 'Thu' }, { value: 5, label: 'Fri' }, { value: 6, label: 'Sat' }, { value: 0, label: 'Sun' }];
const SERVICES = ['Roof replacement', 'Roof repair', 'Storm restoration', 'Emergency tarping', 'Gutters', 'Commercial roofing', 'Roof inspections'];
const TOTAL_STEPS = 14;
type Details = Record<string, string | string[]>;

export default function OnboardingPage() {
  const { profile, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState('');
  const [slug, setSlug] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [serviceArea, setServiceArea] = useState('');
  const [serviceZipCodes, setServiceZipCodes] = useState('');
  const [rooferPhoneNumber, setRooferPhoneNumber] = useState('');
  const [businessDays, setBusinessDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [businessStart, setBusinessStart] = useState('08:00');
  const [businessEnd, setBusinessEnd] = useState('18:00');
  const [timezone, setTimezone] = useState('America/Chicago');
  const [details, setDetails] = useState<Details>({ core_services: [] });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const suggestedSlug = useMemo(() => companyName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), [companyName]);
  const percentage = Math.round((step / TOTAL_STEPS) * 100);
  const services = (details.core_services || []) as string[];
  if (!loading && !profile) return <Navigate to="/login" replace />;
  if (profile?.organization) return <Navigate to="/dashboard" replace />;
  const setDetail = (key: string, value: string) => setDetails((current) => ({ ...current, [key]: value }));
  const toggleService = (service: string) => setDetails((current) => { const selected = (current.core_services || []) as string[]; return { ...current, core_services: selected.includes(service) ? selected.filter((item) => item !== service) : [...selected, service] }; });
  const validStep = () => {
    if (step === 1) return companyName.trim().length >= 2;
    if (step === 2) return Boolean(String(details.owner_name || '').trim() && String(details.public_email || '').includes('@'));
    if (step === 3) return companyPhone.trim().length >= 7;
    if (step === 4) return serviceArea.trim().length >= 2;
    if (step === 6) return services.length > 0;
    if (step === 9) return businessDays.length > 0 && businessStart < businessEnd;
    return true;
  };
  const next = () => { if (!validStep()) { setError('Please complete this question before continuing.'); return; } setError(''); setStep((current) => Math.min(current + 1, TOTAL_STEPS)); };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (step < TOTAL_STEPS) { next(); return; }
    if (!validStep()) { setError('Please complete this question before continuing.'); return; }
    setSubmitting(true); setError('');
    try {
      await api.createWorkspace({ company_name: companyName, slug: slug || suggestedSlug, company_phone: companyPhone, service_area: serviceArea, service_zip_codes: serviceZipCodes.split(',').map((code) => code.trim()).filter(Boolean), roofer_phone_number: rooferPhoneNumber, business_days: businessDays, business_start: businessStart, business_end: businessEnd, business_timezone: timezone, onboarding_data: details });
      await refreshProfile(); navigate('/dashboard');
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not create workspace'); } finally { setSubmitting(false); }
  };
  const field = (label: string, key: string, placeholder: string, type = 'text', optional = true) => <label className="auth-field">{label} {optional && <span>Optional</span>}<input autoFocus value={String(details[key] || '')} onChange={(e) => setDetail(key, e.target.value)} placeholder={placeholder} type={type} /></label>;
  const question = () => {
    switch (step) {
      case 1: return <><h1>What’s your company called?</h1><p>We’ll use this across your workspace, website, and customer messages.</p><label className="auth-field">Company name<input autoFocus value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Apex Roofing & Restoration" /></label><label className="auth-field">Workspace URL <span>Optional</span><div className="slug-field"><span>app/</span><input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder={suggestedSlug || 'your-company'} /></div></label></>;
      case 2: return <><h1>Who is the public face of the business?</h1><p>This gives your website and follow-ups a real person to refer to.</p>{field('Owner or primary contact', 'owner_name', 'Jordan Smith', 'text', false)}{field('Public business email', 'public_email', 'hello@yourcompany.com', 'email', false)}</>;
      case 3: return <><h1>What number should homeowners call?</h1><p>This appears on your website and is used as the customer-facing business number.</p><label className="auth-field">Business phone<input autoFocus type="tel" value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} placeholder="+1 (214) 555-0199" /></label></>;
      case 4: return <><h1>Where do you work?</h1><p>We’ll use this to personalize local website content and qualify incoming leads.</p><label className="auth-field">Primary service area<input autoFocus value={serviceArea} onChange={(e) => setServiceArea(e.target.value)} placeholder="Dallas–Fort Worth, TX" /></label><label className="auth-field">Service ZIP / postal codes <span>Optional</span><input value={serviceZipCodes} onChange={(e) => setServiceZipCodes(e.target.value)} placeholder="75201, 75202, 75203" /><small>Separate each code with a comma.</small></label></>;
      case 5: return <><h1>What’s your business address?</h1><p>Optional, but it helps establish trust and improves local search visibility.</p>{field('Street address', 'business_address', '123 Main Street')}{field('City, state / region, postal code', 'business_location', 'Dallas, TX 75201')}</>;
      case 6: return <><h1>Which services do you want to promote?</h1><p>Select every service you’d like your website, social content, and ads to bring in.</p><div className="onboarding-options">{SERVICES.map((service) => <button type="button" key={service} className={services.includes(service) ? 'selected' : ''} onClick={() => toggleService(service)}>{services.includes(service) && <Check size={15} />}{service}</button>)}</div></>;
      case 7: return <><h1>Who are your ideal customers?</h1><p>This guides your website wording and advertising audience.</p><label className="auth-field">Customer focus<select autoFocus value={String(details.customer_focus || '')} onChange={(e) => setDetail('customer_focus', e.target.value)}><option value="">Choose an option</option><option>Residential homeowners</option><option>Commercial property owners</option><option>Both residential and commercial</option><option>Insurance restoration customers</option></select></label>{field('Typical project or job value', 'typical_job_value', 'For example: $8,000–$15,000')}</>;
      case 8: return <><h1>Why do customers choose you?</h1><p>Give us the proof points that should stand out on your website and content.</p><label className="auth-field">What makes you different? <span>Optional</span><textarea autoFocus value={String(details.differentiators || '')} onChange={(e) => setDetail('differentiators', e.target.value)} placeholder="For example: family owned, same-day inspections, certified installers…" /></label>{field('Licenses, certifications, or warranties', 'credentials', 'GAF Master Elite, licensed and insured')}</>;
      case 9: return <><h1>When is your team available?</h1><p>RoofFlow will use these hours to decide when calls should reach your team.</p><div className="onboarding-hours"><label className="auth-field">From<input type="time" value={businessStart} onChange={(e) => setBusinessStart(e.target.value)} /></label><label className="auth-field">Until<input type="time" value={businessEnd} onChange={(e) => setBusinessEnd(e.target.value)} /></label></div><div className="onboarding-days" role="group" aria-label="Business days">{DAYS.map((day) => <label key={day.value} className={businessDays.includes(day.value) ? 'selected' : ''}><input type="checkbox" checked={businessDays.includes(day.value)} onChange={() => setBusinessDays((days) => days.includes(day.value) ? days.filter((value) => value !== day.value) : [...days, day.value].sort())} />{day.label}</label>)}</div><label className="auth-field">Business timezone<select value={timezone} onChange={(e) => setTimezone(e.target.value)}><option value="America/New_York">Eastern time</option><option value="America/Chicago">Central time</option><option value="America/Denver">Mountain time</option><option value="America/Los_Angeles">Pacific time</option><option value="Europe/Paris">Central European time</option></select></label></>;
      case 10: return <><h1>Where should live calls go?</h1><p>Use a number answered by the owner, office, or dispatcher during business hours.</p><label className="auth-field">Call-forwarding number <span>Optional</span><input autoFocus type="tel" value={rooferPhoneNumber} onChange={(e) => setRooferPhoneNumber(e.target.value)} placeholder="Owner or dispatcher mobile" /></label></>;
      case 11: return <><h1>What should your website accomplish?</h1><p>We’ll use this to shape the homepage structure and calls to action.</p>{field('Do you already have a website?', 'existing_website', 'https://yourcompany.com', 'url')}<label className="auth-field">Primary website goal<select value={String(details.website_goal || '')} onChange={(e) => setDetail('website_goal', e.target.value)}><option value="">Choose an option</option><option>Book more roof inspections</option><option>Generate estimate requests</option><option>Win storm-restoration work</option><option>Build trust and local visibility</option></select></label></>;
      case 12: return <><h1>How should your brand feel?</h1><p>These preferences give the website and social content a consistent visual direction.</p><label className="auth-field">Brand style<select autoFocus value={String(details.brand_style || '')} onChange={(e) => setDetail('brand_style', e.target.value)}><option value="">Choose an option</option><option>Premium and polished</option><option>Strong and dependable</option><option>Friendly and neighborly</option><option>Modern and bold</option></select></label>{field('Brand colors or notes', 'brand_notes', 'Navy, gold, and white; use our existing logo')}</>;
      case 13: return <><h1>What’s your social-media starting point?</h1><p>We can build content around channels you already own, or prepare a launch plan.</p><label className="auth-field">Social profiles <span>Optional</span><textarea autoFocus value={String(details.social_profiles || '')} onChange={(e) => setDetail('social_profiles', e.target.value)} placeholder={'Instagram: @yourcompany\nFacebook: facebook.com/yourcompany'} /></label><label className="auth-field">Social-media goal<select value={String(details.social_goal || '')} onChange={(e) => setDetail('social_goal', e.target.value)}><option value="">Choose an option</option><option>Get more local visibility</option><option>Show completed work and reviews</option><option>Generate inspection leads</option><option>Recruit crew members</option></select></label></>;
      default: return <><h1>Are you planning to run ads?</h1><p>Optional—but this gives us the context to prepare the right offer, audience, and landing page.</p><label className="auth-field">Advertising plan<select autoFocus value={String(details.ad_plan || '')} onChange={(e) => setDetail('ad_plan', e.target.value)}><option value="">Not sure yet</option><option>Yes, ready to start</option><option>Maybe in the next 3 months</option><option>No, organic marketing only</option></select></label>{field('Monthly ad budget', 'ad_budget', 'For example: $1,500 per month')}{field('Best offer to promote', 'ad_offer', 'Free roof inspection or storm-damage assessment')}</>;
    }
  };
  return <main className="onboarding-shell"><form className="onboarding-card onboarding-wizard" onSubmit={submit}><div className="onboarding-progress-head"><span className="onboarding-icon"><Building2 size={22} /></span><div><p className="auth-eyebrow">Guided workspace setup</p><div className="onboarding-progress-copy"><span>Question {step} of {TOTAL_STEPS}</span><strong>{percentage}% complete</strong></div></div></div><div className="onboarding-progress"><span style={{ width: `${percentage}%` }} /></div><section className="onboarding-question">{question()}</section>{error && <p className="auth-message error">{error}</p>}<div className="onboarding-actions">{step > 1 ? <button type="button" className="onboarding-back" onClick={() => { setError(''); setStep((current) => current - 1); }}><ArrowLeft size={16} /> Back</button> : <span />}{step < TOTAL_STEPS ? <button type="button" className="auth-submit" onClick={next}>Continue <ArrowRight size={17} /></button> : <button className="auth-submit" disabled={submitting}>{submitting ? 'Creating workspace…' : 'Create command center'} <ArrowRight size={17} /></button>}</div></form></main>;
}
