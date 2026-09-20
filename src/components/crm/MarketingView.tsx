import React, { useMemo, useState } from 'react';
import {
  BarChart3, CalendarDays, CheckCircle2, ChevronRight, CircleAlert, Clock3,
  Facebook, Globe2, Image, Instagram, Link2, MapPin, MessageSquareText,
  Plus, Search, Send, Settings2, Sparkles, Star, Store, Trash2, X, Youtube
} from 'lucide-react';
import { Lead } from '../../services/api';

interface MarketingViewProps {
  leads: Lead[];
  showToast: (msg: string, type?: string) => void;
}

type Channel = {
  name: string;
  handle: string;
  color: string;
  icon: React.ReactNode;
  connected: boolean;
  added: boolean;
  profileUrl?: string;
  detail: string;
};

const initialChannels: Channel[] = [
  { name: 'Google Business Profile', handle: 'No profile connected', color: '#4285f4', icon: <Store size={21} />, connected: false, added: false, detail: 'Connect your official profile to manage reviews and local search.' },
  { name: 'Facebook', handle: 'No page connected', color: '#1877f2', icon: <Facebook size={21} />, connected: false, added: false, detail: 'Add your business page before publishing updates.' },
  { name: 'Instagram', handle: 'No account connected', color: '#e1306c', icon: <Instagram size={21} />, connected: false, added: false, detail: 'Add your business account to plan and publish content.' },
  { name: 'YouTube', handle: 'No channel connected', color: '#ff0033', icon: <Youtube size={22} />, connected: false, added: false, detail: 'Add your channel when you are ready to publish video.' },
];

export const MarketingView: React.FC<MarketingViewProps> = ({ showToast }) => {
  const [postText, setPostText] = useState('');
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState<'overview' | 'planner' | 'reviews'>('overview');
  const [channels, setChannels] = useState<Channel[]>(initialChannels);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [accountProvider, setAccountProvider] = useState(initialChannels[0].name);
  const [accountName, setAccountName] = useState('');
  const [accountUrl, setAccountUrl] = useState('');

  const connectedCount = useMemo(() => channels.filter(channel => channel.connected).length, [channels]);
  const toggleChannel = (name: string) => {
    setSelectedChannels(current => current.includes(name) ? current.filter(item => item !== name) : [...current, name]);
  };

  const requestConnection = (name: string) => {
    const provider = channels.find(channel => channel.name === name) || channels[0];
    setAccountProvider(provider.name);
    setAccountName(provider.added ? provider.handle : '');
    setAccountUrl(provider.profileUrl || '');
    setAccountModalOpen(true);
  };

  const saveAccount = () => {
    if (!accountName.trim()) {
      showToast('Enter the business page or account name.', 'warning');
      return;
    }
    setChannels(current => current.map(channel => channel.name === accountProvider ? {
      ...channel,
      handle: accountName.trim(),
      profileUrl: accountUrl.trim(),
      added: true,
      connected: false,
    } : channel));
    setAccountModalOpen(false);
    showToast(`${accountProvider} account added. Authorize it to enable publishing and live insights.`, 'success');
  };

  const removeAccount = () => {
    const original = initialChannels.find(channel => channel.name === accountProvider);
    if (original) setChannels(current => current.map(channel => channel.name === accountProvider ? original : channel));
    setSelectedChannels(current => current.filter(name => name !== accountProvider));
    setAccountModalOpen(false);
    showToast(`${accountProvider} was removed from this dashboard.`, 'info');
  };

  const authorizeAccount = () => {
    showToast(`${accountProvider} OAuth credentials must be configured before authorization can open.`, 'warning');
  };

  const handlePublish = () => {
    if (!postText.trim()) {
      showToast('Write the update you want to publish first.', 'warning');
      return;
    }
    if (selectedChannels.length === 0) {
      showToast('Select at least one social channel.', 'warning');
      return;
    }
    showToast('Connect the selected business accounts before publishing.', 'warning');
  };

  return (
    <div style={{ maxWidth: 1500, margin: '0 auto' }}>
      <div className="page-header" style={{ alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, color: 'var(--primary-400)', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
            <Sparkles size={14} /> Reputation & social command center
          </div>
          <h1 style={{ letterSpacing: '-0.035em' }}>Marketing & Business Profiles</h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', marginTop: 6 }}>
            Manage your roofing company’s social pages, Google presence, reviews and publishing calendar.
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => requestConnection(channels[0].name)}>
          <Plus size={15} /> Add an account
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 22, borderBottom: '1px solid var(--border-color)' }}>
        {([
          ['overview', 'Overview'],
          ['planner', 'Content planner'],
          ['reviews', 'Reviews & reputation'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveSection(key)}
            style={{
              border: 0, background: 'transparent', color: activeSection === key ? 'var(--text-primary)' : 'var(--text-tertiary)',
              padding: '11px 14px', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem',
              borderBottom: activeSection === key ? '2px solid var(--primary-400)' : '2px solid transparent'
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.55fr) minmax(300px, 0.85fr)', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {activeSection === 'overview' && (
            <>
              <div className="crm-box" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '19px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem' }}>Business channels</h3>
                    <div style={{ color: 'var(--text-tertiary)', fontSize: '0.77rem', marginTop: 3 }}>{connectedCount} of {channels.length} accounts connected</div>
                  </div>
                  <span className="badge badge-missed-call"><CircleAlert size={12} /> Setup required</span>
                </div>
                <div>
                  {channels.map((channel, index) => (
                    <div key={channel.name} style={{ display: 'grid', gridTemplateColumns: '44px minmax(0, 1fr) auto', gap: 13, alignItems: 'center', padding: '16px 20px', borderBottom: index === channels.length - 1 ? 0 : '1px solid var(--border-color)' }}>
                      <div style={{ width: 42, height: 42, borderRadius: 12, display: 'grid', placeItems: 'center', color: channel.color, background: `${channel.color}16`, border: `1px solid ${channel.color}2c` }}>
                        {channel.icon}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: '0.88rem' }}>
                          {channel.name}
                          <span style={{ fontSize: '0.65rem', color: channel.connected ? '#22c55e' : '#f59e0b', background: channel.connected ? 'rgba(34,197,94,.1)' : 'rgba(245,158,11,.1)', padding: '3px 7px', borderRadius: 20 }}>
                            {channel.connected ? 'CONNECTED' : channel.added ? 'ADDED · AUTHORIZE' : 'NOT ADDED'}
                          </span>
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: 3 }}>{channel.handle}</div>
                        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.71rem', marginTop: 3 }}>{channel.detail}</div>
                      </div>
                      <button className="btn btn-outline btn-sm" onClick={() => requestConnection(channel.name)}>
                        {channel.added ? 'Manage' : 'Add account'} <ChevronRight size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="crm-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: '1rem' }}>Create an update</h3>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.76rem', marginTop: 4 }}>Write once and publish across your connected business profiles.</p>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => setPostText('Recent storms can cause hidden roof damage. Book a complimentary inspection with our certified roofing team today.')}>
                    <Sparkles size={14} /> Draft with AI
                  </button>
                </div>
                <textarea
                  className="input-field"
                  rows={5}
                  value={postText}
                  onChange={event => setPostText(event.target.value)}
                  placeholder="Share a completed roof, storm alert, seasonal maintenance tip or company update..."
                  style={{ resize: 'vertical', lineHeight: 1.55 }}
                />
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '13px 0' }}>
                  {channels.slice(0, 3).map(channel => (
                    <button
                      key={channel.name}
                      className={`btn ${selectedChannels.includes(channel.name) ? 'btn-primary' : 'btn-outline'} btn-sm`}
                      onClick={() => toggleChannel(channel.name)}
                    >
                      {channel.icon} {channel.name === 'Google Business Profile' ? 'Google' : channel.name}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingTop: 12, borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', gap: 7 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => showToast('Connect an account before adding media.', 'info')}><Image size={15} /> Add project photos</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setActiveSection('planner')}><CalendarDays size={15} /> Schedule</button>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={handlePublish}><Send size={15} /> Publish update</button>
                </div>
              </div>
            </>
          )}

          {activeSection === 'planner' && (
            <div className="crm-box">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                <div><h3>Content planner</h3><p style={{ color: 'var(--text-tertiary)', fontSize: '0.78rem', marginTop: 4 }}>Plan local roofing content throughout the week.</p></div>
                <button className="btn btn-primary btn-sm" onClick={() => setActiveSection('overview')}><Plus size={14} /> New post</button>
              </div>
              {['Monday · Project spotlight', 'Wednesday · Roofing maintenance tip', 'Friday · Customer review', 'Storm event · Local safety update'].map((item, index) => (
                <div key={item} style={{ display: 'flex', gap: 13, alignItems: 'center', padding: '14px 0', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, display: 'grid', placeItems: 'center', background: 'var(--bg-tertiary)', color: 'var(--primary-400)' }}><Clock3 size={17} /></div>
                  <div style={{ flex: 1 }}><div style={{ fontWeight: 750, fontSize: '0.84rem' }}>{item}</div><div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: 2 }}>{index === 3 ? 'Publish only when a verified local weather event occurs' : 'Draft template · Not scheduled'}</div></div>
                  <span className="badge badge-missed-call">Needs connection</span>
                </div>
              ))}
            </div>
          )}

          {activeSection === 'reviews' && (
            <div className="crm-box">
              <div style={{ textAlign: 'center', padding: '34px 20px' }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, display: 'grid', placeItems: 'center', margin: '0 auto 14px', background: 'rgba(66,133,244,.12)', color: '#4285f4' }}><Star size={26} /></div>
                <h3>Connect Google Business Profile</h3>
                <p style={{ maxWidth: 480, margin: '8px auto 18px', color: 'var(--text-tertiary)', fontSize: '0.82rem', lineHeight: 1.55 }}>
                  Once connected, the roofer can read and respond to Google reviews, monitor ratings and request reviews from completed customers.
                </p>
                <button className="btn btn-primary" onClick={() => requestConnection('Google Business Profile')}><Link2 size={15} /> Connect Google Business Profile</button>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="crm-box" style={{ background: 'linear-gradient(145deg, rgba(59,130,246,.12), rgba(16,185,129,.04))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ width: 44, height: 44, borderRadius: 13, display: 'grid', placeItems: 'center', background: 'rgba(66,133,244,.15)', color: '#4285f4' }}><Store size={21} /></div>
              <span className="badge badge-missed-call">Not connected</span>
            </div>
            <h3 style={{ marginTop: 16 }}>Google Business Profile</h3>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.77rem', lineHeight: 1.5, marginTop: 5 }}>Your most important local search profile for homeowners looking for a roofer nearby.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginTop: 17 }}>
              <div style={{ padding: 11, borderRadius: 10, background: 'var(--bg-tertiary)' }}><div style={{ fontSize: '0.66rem', color: 'var(--text-tertiary)' }}>RATING</div><div style={{ fontSize: '1rem', fontWeight: 800, marginTop: 3 }}>—</div></div>
              <div style={{ padding: 11, borderRadius: 10, background: 'var(--bg-tertiary)' }}><div style={{ fontSize: '0.66rem', color: 'var(--text-tertiary)' }}>REVIEWS</div><div style={{ fontSize: '1rem', fontWeight: 800, marginTop: 3 }}>—</div></div>
              <div style={{ padding: 11, borderRadius: 10, background: 'var(--bg-tertiary)' }}><div style={{ fontSize: '0.66rem', color: 'var(--text-tertiary)' }}>SEARCH VIEWS</div><div style={{ fontSize: '1rem', fontWeight: 800, marginTop: 3 }}>—</div></div>
              <div style={{ padding: 11, borderRadius: 10, background: 'var(--bg-tertiary)' }}><div style={{ fontSize: '0.66rem', color: 'var(--text-tertiary)' }}>CALLS</div><div style={{ fontSize: '1rem', fontWeight: 800, marginTop: 3 }}>—</div></div>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 15 }} onClick={() => requestConnection('Google Business Profile')}><Globe2 size={15} /> Connect Google profile</button>
          </div>

          <div className="crm-box">
            <h3 style={{ fontSize: '0.95rem', marginBottom: 14 }}>Profile readiness</h3>
            {[
              ['Business information', false],
              ['Service areas', false],
              ['Roofing services', false],
              ['Project photo library', false],
              ['Review notifications', false],
            ].map(([label, ready]) => (
              <div key={String(label)} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 0', borderTop: '1px solid var(--border-color)', fontSize: '0.78rem' }}>
                {ready ? <CheckCircle2 size={15} color="#22c55e" /> : <CircleAlert size={15} color="#f59e0b" />}
                <span style={{ flex: 1, color: 'var(--text-secondary)' }}>{label}</span>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.68rem' }}>After connection</span>
              </div>
            ))}
          </div>

          <div className="crm-box">
            <h3 style={{ fontSize: '0.95rem', marginBottom: 13 }}>Available after connection</h3>
            {[
              { Icon: Search, label: 'Local search insights' },
              { Icon: MessageSquareText, label: 'Review replies' },
              { Icon: BarChart3, label: 'Channel performance' },
              { Icon: MapPin, label: 'Business location & service areas' },
              { Icon: Settings2, label: 'Profile settings' },
            ].map(({ Icon, label }) => {
              return <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', color: 'var(--text-tertiary)', fontSize: '0.77rem' }}><Icon size={15} /> {label}</div>;
            })}
          </div>
        </div>
      </div>

      {accountModalOpen && (
        <div
          role="presentation"
          onMouseDown={event => { if (event.currentTarget === event.target) setAccountModalOpen(false); }}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(3,8,18,.72)', backdropFilter: 'blur(8px)', display: 'grid', placeItems: 'center', padding: 20 }}
        >
          <div className="crm-box" role="dialog" aria-modal="true" aria-label="Add social account" style={{ width: 'min(540px, 100%)', padding: 0, overflow: 'hidden', boxShadow: '0 26px 80px rgba(0,0,0,.42)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <h3 style={{ fontSize: '1rem' }}>{channels.find(channel => channel.name === accountProvider)?.added ? 'Manage account' : 'Add business account'}</h3>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.72rem', marginTop: 3 }}>Add the roofer’s official business profile, then authorize access.</p>
              </div>
              <button className="btn btn-ghost btn-sm" aria-label="Close" onClick={() => setAccountModalOpen(false)}><X size={17} /></button>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 15 }}>
              <div>
                <label className="input-label">Platform</label>
                <select
                  className="input-field"
                  value={accountProvider}
                  onChange={event => {
                    const provider = channels.find(channel => channel.name === event.target.value)!;
                    setAccountProvider(provider.name);
                    setAccountName(provider.added ? provider.handle : '');
                    setAccountUrl(provider.profileUrl || '');
                  }}
                >
                  {channels.map(channel => <option key={channel.name} value={channel.name}>{channel.name}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Business page / account name</label>
                <input className="input-field" value={accountName} onChange={event => setAccountName(event.target.value)} placeholder="Example: Apex Roofing & Restoration" />
              </div>
              <div>
                <label className="input-label">Public profile URL <span style={{ color: 'var(--text-tertiary)', fontWeight: 500 }}>(optional)</span></label>
                <input className="input-field" type="url" value={accountUrl} onChange={event => setAccountUrl(event.target.value)} placeholder="https://..." />
              </div>
              <div style={{ display: 'flex', gap: 10, padding: 12, borderRadius: 11, background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.22)', color: 'var(--text-secondary)', fontSize: '0.75rem', lineHeight: 1.5 }}>
                <CircleAlert size={17} color="#f59e0b" style={{ flex: '0 0 auto', marginTop: 1 }} />
                Adding a page stores its profile details. Secure authorization is a separate step and requires the platform’s business login and OAuth credentials.
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '15px 20px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>
              <div>
                {channels.find(channel => channel.name === accountProvider)?.added && (
                  <button className="btn btn-ghost btn-sm" style={{ color: '#ef4444' }} onClick={removeAccount}><Trash2 size={14} /> Remove</button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 9 }}>
                <button className="btn btn-outline btn-sm" onClick={saveAccount}>{channels.find(channel => channel.name === accountProvider)?.added ? 'Save changes' : 'Add account'}</button>
                {channels.find(channel => channel.name === accountProvider)?.added && (
                  <button className="btn btn-primary btn-sm" onClick={authorizeAccount}><Link2 size={14} /> Authorize</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
