import { useEffect, useState, type ReactNode } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  CloudLightning,
  Headphones,
  House,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  Siren,
  Sparkles,
  Star,
  TimerReset,
  type LucideIcon,
} from 'lucide-react';
import { api, type PublicWorkspace } from '../services/api';

type Option = {
  value: string;
  label: string;
  detail: string;
  icon: LucideIcon;
};

const ISSUE_OPTIONS: Option[] = [
  {
    value: 'ACTIVE_LEAK',
    label: 'Active leak or emergency',
    detail: 'Priority tarping and water mitigation',
    icon: Siren,
  },
  {
    value: 'STORM_HAIL_DAMAGE',
    label: 'Storm or hail damage',
    detail: 'Documented inspection for your claim',
    icon: CloudLightning,
  },
  {
    value: 'AGING_ROOF_REPLACEMENT',
    label: 'Roof replacement',
    detail: 'A clear scope, material options, and estimate',
    icon: House,
  },
  {
    value: 'GENERAL_INSPECTION',
    label: 'Roof health inspection',
    detail: 'A professional assessment and next-step plan',
    icon: Search,
  },
];

const ROOF_AGE_OPTIONS: Option[] = [
  {
    value: 'Under 10 years',
    label: 'Under 10 years',
    detail: 'Newer roof with a localized concern',
    icon: ShieldCheck,
  },
  {
    value: '10-20 years',
    label: '10–20 years',
    detail: 'Approaching the typical replacement window',
    icon: CalendarClock,
  },
  {
    value: '20+ years',
    label: 'More than 20 years',
    detail: 'Aging system that needs a full assessment',
    icon: TimerReset,
  },
  {
    value: 'Not sure',
    label: 'I’m not sure',
    detail: 'We’ll help identify the roof age on-site',
    icon: ClipboardCheck,
  },
];

function RoofMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`roof-mark ${compact ? 'roof-mark-compact' : ''}`} aria-hidden="true">
      <House size={compact ? 18 : 22} strokeWidth={2.25} />
    </div>
  );
}

function ChoiceButton({
  option,
  selected,
  onSelect,
}: {
  option: Option;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = option.icon;
  return (
    <button
      type="button"
      className={`intake-choice ${selected ? 'is-selected' : ''}`}
      onClick={onSelect}
    >
      <span className="intake-choice-icon"><Icon size={19} /></span>
      <span className="intake-choice-copy">
        <strong>{option.label}</strong>
        <small>{option.detail}</small>
      </span>
      <ChevronRight size={18} />
    </button>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="intake-back" onClick={onClick}>
      <ChevronLeft size={16} /> Back
    </button>
  );
}

function TrustItem({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="hero-trust-item">
      <span>{icon}</span>
      <div>
        <strong>{title}</strong>
        <small>{text}</small>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const pageQuery = new URLSearchParams(window.location.search);
  const hashQuery = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const organizationSlug = hashQuery.get('org') || pageQuery.get('org') || 'apex-roofing';
  const [workspace, setWorkspace] = useState<PublicWorkspace | null>(null);
  const [workspaceError, setWorkspaceError] = useState('');
  const [formStep, setFormStep] = useState(1);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    zip_code: '',
    issue_type: '',
    roof_age: '',
    has_insurance_claim: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let current = true;
    setWorkspace(null);
    setWorkspaceError('');
    api.getPublicWorkspace(organizationSlug)
      .then(({ workspace: publicWorkspace }) => {
        if (current) setWorkspace(publicWorkspace);
      })
      .catch(() => {
        if (current) setWorkspaceError('This roofing website is unavailable. Please check the workspace link.');
      });
    return () => { current = false; };
  }, [organizationSlug]);

  useEffect(() => {
    if (!workspace) return;
    document.title = `${workspace.company_name} | Roofing & Restoration`;
  }, [workspace]);

  if (!workspace) {
    return (
      <main className="public-workspace-state">
        {workspaceError ? <><ShieldCheck size={30} /><h1>Website unavailable</h1><p>{workspaceError}</p></> : <><span className="spinner" /><p>Loading roofing company…</p></>}
      </main>
    );
  }

  const companyWords = workspace.company_name.trim().split(/\s+/);
  const brandName = (companyWords.shift() || 'RoofFlow').toUpperCase();
  const brandDescriptor = companyWords.join(' ') || 'Roofing & Restoration';
  const phoneHref = workspace.company_phone.replace(/[^\d+]/g, '');

  const selectOption = (field: 'issue_type' | 'roof_age', value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
    window.setTimeout(() => setFormStep((step) => step + 1), 180);
  };

  const handleSubmit = async () => {
    if (!formData.full_name.trim() || !formData.phone.trim()) {
      setError('Please add your name and phone number so our team can reach you.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await api.createLead({ ...formData, organization_slug: organizationSlug });
      setFormStep(6);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'We could not send your request. Please call our team directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="roof-site">
      <div className="service-ribbon">
        <span><span className="service-pulse" /> Emergency crews are on call 24/7</span>
        <a href={`tel:${phoneHref}`}><Phone size={14} /> {workspace.company_phone}</a>
      </div>

      <header className="premium-nav">
        <a className="premium-brand" href="#top" aria-label={`${workspace.company_name} home`}>
          <RoofMark />
          <span>
            <strong>{brandName}</strong>
            <small>{brandDescriptor}</small>
          </span>
        </a>

        <nav className="premium-nav-links" aria-label="Main navigation">
          <a href="#services">Services</a>
          <a href="#process">Our process</a>
          <a href="#insurance">Insurance help</a>
          <a href="#reviews">Reviews</a>
        </nav>

        <div className="premium-nav-actions">
          <a className="portal-link" href="#/dashboard">Contractor portal</a>
          <a className="nav-call" href={`tel:${phoneHref}`}><Phone size={16} /> Call now</a>
        </div>
      </header>

      <main>
        <section className="premium-hero" id="top">
          <div className="premium-hero-shade" />
          <div className="site-shell premium-hero-grid">
            <div className="premium-hero-copy">
              <div className="hero-eyebrow"><Sparkles size={15} /> Roof care, elevated</div>
              <h1>Your roof protects everything. <em>We protect it.</em></h1>
              <p>
                Expert storm restoration and roofing, delivered with honest guidance,
                meticulous workmanship, and a team that stays accountable from inspection to final clean-up.
              </p>

              <div className="hero-actions">
                <a className="premium-button premium-button-gold" href="#dispatch">
                  Schedule a priority inspection <ArrowRight size={18} />
                </a>
                <a className="premium-button premium-button-glass" href={`tel:${phoneHref}`}>
                  <Phone size={18} /> Speak with our team
                </a>
              </div>

              <div className="hero-rating">
                <span className="hero-stars" aria-label="4.9 out of 5 stars">
                  {[1, 2, 3, 4, 5].map((star) => <Star key={star} size={15} fill="currentColor" />)}
                </span>
                <strong>4.9</strong>
                <span>from 420+ local homeowners</span>
              </div>

              <div className="hero-trust-grid">
                <TrustItem icon={<ShieldCheck size={20} />} title="Licensed & insured" text="$2M liability coverage" />
                <TrustItem icon={<TimerReset size={20} />} title="Rapid response" text="24–48 hour arrival" />
                <TrustItem icon={<BadgeCheck size={20} />} title="Workmanship backed" text="Clear written warranty" />
              </div>
            </div>

            <aside className="premium-intake" id="dispatch">
              <div className="intake-topline">
                <span>Priority service request</span>
                {formStep < 6 && <strong>Step {formStep} of 5</strong>}
              </div>
              <h2>{formStep === 6 ? 'Your request is in.' : 'Tell us what’s happening.'}</h2>
              <p className="intake-intro">
                {formStep === 6
                  ? 'A restoration specialist will call shortly to confirm the details.'
                  : 'It takes about 60 seconds. No obligation, no pressure.'}
              </p>

              {formStep < 6 && (
                <div className="intake-progress" aria-label={`Step ${formStep} of 5`}>
                  <span style={{ width: `${formStep * 20}%` }} />
                </div>
              )}

              {formStep === 1 && (
                <div className="intake-step">
                  <h3>What can we help with?</h3>
                  <div className="intake-options">
                    {ISSUE_OPTIONS.map((option) => (
                      <ChoiceButton
                        key={option.value}
                        option={option}
                        selected={formData.issue_type === option.value}
                        onSelect={() => selectOption('issue_type', option.value)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {formStep === 2 && (
                <div className="intake-step">
                  <h3>How old is the roof?</h3>
                  <div className="intake-options">
                    {ROOF_AGE_OPTIONS.map((option) => (
                      <ChoiceButton
                        key={option.value}
                        option={option}
                        selected={formData.roof_age === option.value}
                        onSelect={() => selectOption('roof_age', option.value)}
                      />
                    ))}
                  </div>
                  <BackButton onClick={() => setFormStep(1)} />
                </div>
              )}

              {formStep === 3 && (
                <div className="intake-step">
                  <h3>Is insurance involved?</h3>
                  <div className="intake-options">
                    <button
                      type="button"
                      className="intake-choice"
                      onClick={() => {
                        setFormData((current) => ({ ...current, has_insurance_claim: true }));
                        window.setTimeout(() => setFormStep(4), 180);
                      }}
                    >
                      <span className="intake-choice-icon"><ShieldCheck size={19} /></span>
                      <span className="intake-choice-copy">
                        <strong>Yes, or I plan to file</strong>
                        <small>We’ll document the damage and support your claim</small>
                      </span>
                      <ChevronRight size={18} />
                    </button>
                    <button
                      type="button"
                      className="intake-choice"
                      onClick={() => {
                        setFormData((current) => ({ ...current, has_insurance_claim: false }));
                        window.setTimeout(() => setFormStep(4), 180);
                      }}
                    >
                      <span className="intake-choice-icon"><CircleDollarSign size={19} /></span>
                      <span className="intake-choice-copy">
                        <strong>No, not sure, or self-pay</strong>
                        <small>We’ll explain your options without pressure</small>
                      </span>
                      <ChevronRight size={18} />
                    </button>
                  </div>
                  <BackButton onClick={() => setFormStep(2)} />
                </div>
              )}

              {formStep === 4 && (
                <div className="intake-step">
                  <h3>Where is the property?</h3>
                  <label className="premium-field-label" htmlFor="zip-code">Property ZIP code</label>
                  <div className="premium-field-with-icon">
                    <MapPin size={18} />
                    <input
                      id="zip-code"
                      className="premium-field"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      placeholder="e.g. 75201"
                      value={formData.zip_code}
                      onChange={(event) => setFormData((current) => ({ ...current, zip_code: event.target.value }))}
                      autoFocus
                    />
                  </div>
                  <button
                    type="button"
                    className="premium-button premium-button-dark intake-next"
                    disabled={formData.zip_code.trim().length < 5}
                    onClick={() => setFormStep(5)}
                  >
                    Continue <ArrowRight size={17} />
                  </button>
                  <BackButton onClick={() => setFormStep(3)} />
                </div>
              )}

              {formStep === 5 && (
                <div className="intake-step">
                  <h3>How should we reach you?</h3>
                  <div className="premium-fields">
                    <label>
                      <span className="premium-field-label">Full name</span>
                      <input
                        className="premium-field"
                        autoComplete="name"
                        placeholder="Your name"
                        value={formData.full_name}
                        onChange={(event) => setFormData((current) => ({ ...current, full_name: event.target.value }))}
                      />
                    </label>
                    <label>
                      <span className="premium-field-label">Phone number</span>
                      <input
                        className="premium-field"
                        type="tel"
                        autoComplete="tel"
                        placeholder="(555) 555-0123"
                        value={formData.phone}
                        onChange={(event) => setFormData((current) => ({ ...current, phone: event.target.value }))}
                      />
                    </label>
                    <label>
                      <span className="premium-field-label">Email <small>Optional</small></span>
                      <input
                        className="premium-field"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
                      />
                    </label>
                  </div>
                  {error && <p className="intake-error">{error}</p>}
                  <button
                    type="button"
                    className="premium-button premium-button-gold intake-next"
                    disabled={isSubmitting}
                    onClick={handleSubmit}
                  >
                    {isSubmitting ? 'Sending request…' : 'Request my inspection'}
                    {!isSubmitting && <ArrowRight size={17} />}
                  </button>
                  <BackButton onClick={() => setFormStep(4)} />
                </div>
              )}

              {formStep === 6 && (
                <div className="intake-success">
                  <span><CheckCircle2 size={34} /></span>
                  <h3>We’ll be in touch shortly.</h3>
                  <p>
                    If water is actively entering your home, call our emergency line now for immediate guidance.
                  </p>
                  <a className="premium-button premium-button-dark" href={`tel:${phoneHref}`}>
                    <Phone size={17} /> Call emergency dispatch
                  </a>
                </div>
              )}

              <div className="intake-footnote">
                <ShieldCheck size={15} /> Your information stays private and secure.
              </div>
            </aside>
          </div>
        </section>

        <section className="proof-bar" aria-label="Company credentials">
          <div className="site-shell proof-bar-inner">
            <span>Licensed & insured</span>
            <span>Manufacturer-certified crews</span>
            <span>Insurance claim support</span>
            <span>Workmanship warranty</span>
          </div>
        </section>

        <section className="premium-section" id="services">
          <div className="site-shell">
            <div className="section-heading">
              <div>
                <span className="section-kicker">Roofing done right</span>
                <h2>Protection for today.<br />Confidence for years.</h2>
              </div>
              <p>
                From urgent storm response to a complete roof transformation,
                every project gets senior oversight, clean communication, and craftsmanship that holds up.
              </p>
            </div>

            <div className="service-editorial-grid">
              <article className="editorial-card editorial-card-large">
                <img src="/images/storm.png" alt="Storm-damaged roof being assessed" />
                <div className="editorial-card-shade" />
                <div className="editorial-card-copy">
                  <span>01</span>
                  <h3>Emergency storm response</h3>
                  <p>Rapid tarping, leak containment, and a documented damage assessment.</p>
                  <a href="#dispatch">Get priority help <ArrowRight size={16} /></a>
                </div>
              </article>
              <article className="editorial-card">
                <img src="/images/inspection.png" alt="Professional roof inspection" />
                <div className="editorial-card-shade" />
                <div className="editorial-card-copy">
                  <span>02</span>
                  <h3>Roof inspections</h3>
                  <p>Clear findings, photo documentation, and honest recommendations.</p>
                  <a href="#dispatch">Book an inspection <ArrowRight size={16} /></a>
                </div>
              </article>
              <article className="editorial-card">
                <img src="/images/finished.png" alt="Newly completed premium roof" />
                <div className="editorial-card-shade" />
                <div className="editorial-card-copy">
                  <span>03</span>
                  <h3>Premium replacement</h3>
                  <p>High-performance materials installed by certified crews.</p>
                  <a href="#dispatch">Explore your options <ArrowRight size={16} /></a>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="process-section" id="process">
          <div className="site-shell process-grid">
            <div className="process-intro">
              <span className="section-kicker section-kicker-light">A calmer way to restore your roof</span>
              <h2>One accountable team.<br />Every step handled.</h2>
              <p>
                You’ll always know what’s happening, what comes next, and who to call.
                Our process is built to remove uncertainty—not add to it.
              </p>
              <a className="premium-button premium-button-gold" href="#dispatch">
                Start with an inspection <ArrowRight size={18} />
              </a>
            </div>
            <ol className="process-list">
              <li>
                <span>01</span>
                <div><strong>Inspect & document</strong><p>We assess the full roofing system and capture the evidence you need.</p></div>
              </li>
              <li>
                <span>02</span>
                <div><strong>Plan with clarity</strong><p>You receive a straightforward scope, material guidance, and timeline.</p></div>
              </li>
              <li>
                <span>03</span>
                <div><strong>Build with precision</strong><p>Certified crews protect your property and execute every detail.</p></div>
              </li>
              <li>
                <span>04</span>
                <div><strong>Close with confidence</strong><p>A final quality check, spotless clean-up, and documented warranty.</p></div>
              </li>
            </ol>
          </div>
        </section>

        <section className="premium-section insurance-section" id="insurance">
          <div className="site-shell insurance-grid">
            <div className="insurance-panel">
              <span className="insurance-icon"><ShieldCheck size={30} /></span>
              <span className="section-kicker">Insurance claim support</span>
              <h2>A strong claim starts with strong documentation.</h2>
              <p>
                We photograph damage, prepare a detailed scope, and communicate clearly with your adjuster.
                You stay in control while we help keep the process moving.
              </p>
              <ul>
                <li><Check size={16} /> Photo and damage documentation</li>
                <li><Check size={16} /> Adjuster appointment support</li>
                <li><Check size={16} /> Clear supplement documentation</li>
              </ul>
            </div>
            <div className="insurance-stat-card">
              <span>Homeowner-first guidance</span>
              <strong>No pressure.<br />No confusing fine print.</strong>
              <p>Just experienced support and transparent answers at every decision.</p>
              <a href="#dispatch">Talk with a restoration specialist <ArrowRight size={17} /></a>
            </div>
          </div>
        </section>

        <section className="reviews-section" id="reviews">
          <div className="site-shell">
            <div className="reviews-heading">
              <div>
                <span className="section-kicker section-kicker-light">Trusted on the homes that matter most</span>
                <h2>Craftsmanship people remember.</h2>
              </div>
              <div className="reviews-score">
                <strong>4.9</strong>
                <span>
                  <span className="hero-stars">
                    {[1, 2, 3, 4, 5].map((star) => <Star key={star} size={15} fill="currentColor" />)}
                  </span>
                  420+ verified reviews
                </span>
              </div>
            </div>
            <div className="reviews-grid">
              {[
                ['“The communication was exceptional. We knew exactly what to expect, and the crew left our property spotless.”', 'Marissa T.', 'Storm restoration'],
                ['“They found the leak, documented everything for insurance, and had us protected before the next storm arrived.”', 'Daniel R.', 'Emergency tarping'],
                ['“Professional from the first inspection to the final walk-through. The new roof completely elevated our home.”', 'Lauren K.', 'Roof replacement'],
              ].map(([quote, name, project]) => (
                <article className="review-card" key={name}>
                  <div className="hero-stars">
                    {[1, 2, 3, 4, 5].map((star) => <Star key={star} size={14} fill="currentColor" />)}
                  </div>
                  <blockquote>{quote}</blockquote>
                  <footer><strong>{name}</strong><span>{project}</span></footer>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="closing-cta">
          <div className="site-shell closing-cta-inner">
            <div>
              <span className="section-kicker">Your home deserves certainty</span>
              <h2>Let’s make the roof the easy part.</h2>
              <p>Schedule a professional inspection and get a clear plan for what comes next.</p>
            </div>
            <div className="closing-cta-actions">
              <a className="premium-button premium-button-gold" href="#dispatch">
                Request an inspection <ArrowRight size={18} />
              </a>
              <a href={`tel:${phoneHref}`}><Headphones size={18} /> {workspace.company_phone}</a>
            </div>
          </div>
        </section>
      </main>

      <footer className="premium-footer">
        <div className="site-shell premium-footer-main">
          <div>
            <a className="premium-brand premium-brand-footer" href="#top">
              <RoofMark compact />
              <span><strong>{brandName}</strong><small>{brandDescriptor}</small></span>
            </a>
            <p>Premium roofing and storm restoration built around clarity, care, and lasting protection.</p>
          </div>
          <div>
            <strong>Services</strong>
            <a href="#services">Emergency tarping</a>
            <a href="#services">Storm restoration</a>
            <a href="#services">Roof replacement</a>
          </div>
          <div>
            <strong>Company</strong>
            <a href="#process">Our process</a>
            <a href="#reviews">Reviews</a>
            <a href="#/dashboard">Contractor portal</a>
          </div>
          <div>
            <strong>Available 24/7</strong>
            <a href={`tel:${phoneHref}`}>{workspace.company_phone}</a>
            <span>Serving {workspace.service_area}</span>
          </div>
        </div>
        <div className="site-shell premium-footer-bottom">
          <span>© 2026 {workspace.company_name}</span>
          <span>Licensed · Bonded · Insured</span>
        </div>
      </footer>
    </div>
  );
}
