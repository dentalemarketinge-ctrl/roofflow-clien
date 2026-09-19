import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  Clock3,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Plus,
  PauseCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { AdminWorkspace, api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

type WorkspaceStatus = AdminWorkspace['subscription_status'];

const PREVIEW_WORKSPACES: AdminWorkspace[] = [
  {
    id: 'preview-apex',
    name: 'Apex Roofing & Restoration',
    slug: 'apex-roofing',
    plan: 'manual',
    subscription_status: 'active',
    trial_ends_at: null,
    created_at: '2026-07-18T10:00:00.000Z',
    owner_email: 'alex@apexroofing.com',
    owner_name: 'Alex Rivera',
    member_count: 6,
    company_phone: '+1 (214) 555-0199',
    telnyx_phone_number: '+1 (757) 540-3912',
  },
  {
    id: 'preview-summit',
    name: 'Summit Exteriors',
    slug: 'summit-exteriors',
    plan: 'trial',
    subscription_status: 'trialing',
    trial_ends_at: new Date(Date.now() + 8 * 86400000).toISOString(),
    created_at: '2026-07-25T14:30:00.000Z',
    owner_email: 'jordan@summitexteriors.com',
    owner_name: 'Jordan Blake',
    member_count: 3,
    company_phone: '+1 (469) 555-0124',
    telnyx_phone_number: '+1 (469) 555-0178',
  },
  {
    id: 'preview-lone-star',
    name: 'Lone Star Roof Pros',
    slug: 'lone-star-roof-pros',
    plan: 'manual',
    subscription_status: 'paused',
    trial_ends_at: null,
    created_at: '2026-07-11T09:15:00.000Z',
    owner_email: 'maria@lonestarroofpros.com',
    owner_name: 'Maria Santos',
    member_count: 4,
    company_phone: '+1 (972) 555-0186',
    telnyx_phone_number: '+1 (972) 555-0141',
  },
  {
    id: 'preview-peak',
    name: 'Peak Shield Roofing',
    slug: 'peak-shield',
    plan: 'trial',
    subscription_status: 'trialing',
    trial_ends_at: new Date(Date.now() + 2 * 86400000).toISOString(),
    created_at: '2026-07-29T16:45:00.000Z',
    owner_email: 'sam@peakshield.com',
    owner_name: 'Sam Carter',
    member_count: 1,
    company_phone: '+1 (817) 555-0157',
    telnyx_phone_number: null,
  },
];

export default function AdminPage() {
  const { profile, logout } = useAuth();
  const isPreview = window.location.hash.startsWith('#/admin-preview');
  const [workspaces, setWorkspaces] = useState<AdminWorkspace[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newClient, setNewClient] = useState({ owner_email: '', owner_name: '', company_name: '', slug: '', company_phone: '', service_area: '', service_zip_codes: '', roofer_phone_number: '', website_goal: '', ad_plan: '' });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    if (isPreview) {
      setWorkspaces(PREVIEW_WORKSPACES);
      setLoading(false);
      return;
    }
    try {
      const result = await api.getAdminWorkspaces();
      setWorkspaces(result.workspaces);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load workspaces');
    } finally {
      setLoading(false);
    }
  }, [isPreview]);

  useEffect(() => { void load(); }, [load]);

  const visibleWorkspaces = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return workspaces;
    return workspaces.filter(workspace =>
      [workspace.name, workspace.slug, workspace.owner_email, workspace.company_phone]
        .some(value => String(value || '').toLowerCase().includes(query)),
    );
  }, [search, workspaces]);

  const counts = useMemo(() => ({
    all: workspaces.length,
    active: workspaces.filter(workspace => workspace.subscription_status === 'active').length,
    trialing: workspaces.filter(workspace => workspace.subscription_status === 'trialing').length,
    paused: workspaces.filter(workspace => ['paused', 'cancelled'].includes(workspace.subscription_status)).length,
  }), [workspaces]);

  const updateStatus = async (workspace: AdminWorkspace, status: WorkspaceStatus, trialDays?: number) => {
    setUpdatingId(workspace.id);
    setError('');
    if (isPreview) {
      const trialEnd = status === 'trialing'
        ? new Date(Date.now() + (trialDays || 14) * 86400000).toISOString()
        : workspace.trial_ends_at;
      setWorkspaces(current => current.map(item =>
        item.id === workspace.id
          ? { ...item, subscription_status: status, plan: status === 'trialing' ? 'trial' : 'manual', trial_ends_at: trialEnd }
          : item,
      ));
      setUpdatingId('');
      return;
    }
    try {
      const result = await api.updateWorkspaceSubscription(workspace.id, status, trialDays);
      setWorkspaces(current => current.map(item =>
        item.id === workspace.id ? { ...item, ...result.workspace } : item,
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update workspace');
    } finally {
      setUpdatingId('');
    }
  };

  const createClient = async (event: FormEvent) => {
    event.preventDefault();
    setCreating(true); setError('');
    try {
      await api.createAdminWorkspace({
        ...newClient,
        slug: newClient.slug || newClient.company_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        service_zip_codes: newClient.service_zip_codes.split(',').map((item) => item.trim()).filter(Boolean),
        onboarding_data: { owner_name: newClient.owner_name, public_email: newClient.owner_email, website_goal: newClient.website_goal, ad_plan: newClient.ad_plan, core_services: ['Roof inspections'] },
      });
      setShowCreate(false); setNewClient({ owner_email: '', owner_name: '', company_name: '', slug: '', company_phone: '', service_area: '', service_zip_codes: '', roofer_phone_number: '', website_goal: '', ad_plan: '' });
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not create client workspace'); }
    finally { setCreating(false); }
  };

  return (
    <main className="platform-admin">
      <header className="platform-admin-header">
        <a className="platform-admin-brand" href="#/admin">
          <span><ShieldCheck size={20} /></span>
          <strong>RoofFlow</strong>
          <small>Platform admin</small>
        </a>
        <div>
          <span>{isPreview ? 'owner@roofflow.app' : profile?.user.email}</span>
          {!isPreview && (
            <a className="platform-preview-exit" href="#/dashboard">
              <LayoutDashboard size={16} /> Back to dashboard
            </a>
          )}
          {isPreview
            ? <a className="platform-preview-exit" href="#/preview"><LogOut size={16} /> Roofer dashboard</a>
            : <button type="button" onClick={logout}><LogOut size={16} /> Sign out</button>}
        </div>
      </header>

      <section className="platform-admin-content">
        <div className="platform-admin-title">
          <div>
            <p>Manual account control</p>
            <h1>Roofer workspaces</h1>
            <span>Activate customers after receiving payment, or pause access when needed.</span>
            {isPreview && <em className="platform-preview-label">Interactive preview · no real accounts are changed</em>}
          </div>
          <div className="platform-admin-title-actions"><button type="button" className="platform-create-button" onClick={() => setShowCreate(true)}><Plus size={16} /> Add client manually</button><button type="button" onClick={() => void load()} disabled={loading}><RefreshCw size={16} className={loading ? 'spin-icon' : ''} /> Refresh</button></div>
        </div>

        {showCreate && <form className="platform-create-panel" onSubmit={createClient}>
          <div className="platform-create-heading"><div><p>Manual client setup</p><h2>Provision a workspace and send the owner an invite</h2></div><button type="button" onClick={() => setShowCreate(false)}>Close</button></div>
          <div className="platform-create-grid">
            <label>Owner name<input required value={newClient.owner_name} onChange={(e) => setNewClient({ ...newClient, owner_name: e.target.value })} placeholder="Jordan Blake" /></label>
            <label>Owner email<input required type="email" value={newClient.owner_email} onChange={(e) => setNewClient({ ...newClient, owner_email: e.target.value })} placeholder="owner@company.com" /></label>
            <label>Company name<input required value={newClient.company_name} onChange={(e) => setNewClient({ ...newClient, company_name: e.target.value })} placeholder="Summit Exteriors" /></label>
            <label>Workspace URL<input value={newClient.slug} onChange={(e) => setNewClient({ ...newClient, slug: e.target.value })} placeholder="summit-exteriors" /></label>
            <label>Business phone<input required value={newClient.company_phone} onChange={(e) => setNewClient({ ...newClient, company_phone: e.target.value })} placeholder="+1..." /></label>
            <label>Service area<input required value={newClient.service_area} onChange={(e) => setNewClient({ ...newClient, service_area: e.target.value })} placeholder="Dallas–Fort Worth, TX" /></label>
            <label>ZIP / postal codes<input value={newClient.service_zip_codes} onChange={(e) => setNewClient({ ...newClient, service_zip_codes: e.target.value })} placeholder="75201, 75202" /></label>
            <label>Call-forwarding number<input value={newClient.roofer_phone_number} onChange={(e) => setNewClient({ ...newClient, roofer_phone_number: e.target.value })} placeholder="Optional" /></label>
            <label>Website goal<select value={newClient.website_goal} onChange={(e) => setNewClient({ ...newClient, website_goal: e.target.value })}><option value="">Choose later</option><option>Book more roof inspections</option><option>Generate estimate requests</option><option>Win storm-restoration work</option></select></label>
            <label>Ad plan<select value={newClient.ad_plan} onChange={(e) => setNewClient({ ...newClient, ad_plan: e.target.value })}><option value="">Not sure yet</option><option>Yes, ready to start</option><option>Maybe in the next 3 months</option><option>No, organic marketing only</option></select></label>
          </div>
          <div className="platform-create-footer"><span>Creates an isolated workspace, stores the starter profile, and emails the owner an invitation.</span><button type="submit" className="activate" disabled={creating}>{creating ? 'Creating…' : 'Create and invite client'}</button></div>
        </form>}

        <div className="platform-admin-stats">
          <article><Building2 size={19} /><span><strong>{counts.all}</strong><small>All roofers</small></span></article>
          <article><CheckCircle2 size={19} /><span><strong>{counts.active}</strong><small>Active</small></span></article>
          <article><Clock3 size={19} /><span><strong>{counts.trialing}</strong><small>On trial</small></span></article>
          <article><PauseCircle size={19} /><span><strong>{counts.paused}</strong><small>Paused</small></span></article>
        </div>

        <section className="platform-workspace-panel">
          <div className="platform-workspace-toolbar">
            <div><Search size={16} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search company, owner, phone..." /></div>
            <span>{visibleWorkspaces.length} workspaces</span>
          </div>
          {error && <p className="platform-admin-error">{error}</p>}
          <div className="platform-workspace-list">
            {visibleWorkspaces.map(workspace => {
              const busy = updatingId === workspace.id;
              return (
                <article className="platform-workspace-row" key={workspace.id}>
                  <div className="platform-company">
                    <span>{workspace.name.slice(0, 2).toUpperCase()}</span>
                    <div><strong>{workspace.name}</strong><small>/{workspace.slug}</small></div>
                  </div>
                  <div className="platform-owner">
                    <small>Owner</small>
                    <strong>{workspace.owner_name || workspace.owner_email || 'Not assigned'}</strong>
                    {workspace.owner_name && <span>{workspace.owner_email}</span>}
                  </div>
                  <div className="platform-client-insights"><small>Profile</small><span>{workspace.service_area || 'Area not entered'}</span><span>{String(workspace.onboarding_data?.website_goal || 'Website goal not set')}</span><span>{String(workspace.onboarding_data?.ad_plan || 'Ads plan not set')}</span></div>
                  <div className="platform-members">
                    <Users size={15} />
                    <span>{workspace.member_count} user{workspace.member_count === 1 ? '' : 's'}</span>
                  </div>
                  <div>
                    <span className={`platform-status status-${workspace.subscription_status}`}>
                      {workspace.subscription_status}
                    </span>
                    {workspace.subscription_status === 'trialing' && workspace.trial_ends_at && (
                      <small className="platform-trial-date">Until {new Date(workspace.trial_ends_at).toLocaleDateString()}</small>
                    )}
                  </div>
                  <div className="platform-actions">
                    <a href={`/?org=${encodeURIComponent(workspace.slug)}`} target="_blank" rel="noreferrer">
                      Website <ExternalLink size={13} />
                    </a>
                    {workspace.subscription_status !== 'active' && (
                      <button className="activate" disabled={busy} onClick={() => void updateStatus(workspace, 'active')}>
                        Activate
                      </button>
                    )}
                    {workspace.subscription_status === 'active' && (
                      <button disabled={busy} onClick={() => void updateStatus(workspace, 'paused')}>
                        Pause
                      </button>
                    )}
                    <button disabled={busy} onClick={() => void updateStatus(workspace, 'trialing', 14)}>
                      +14-day trial
                    </button>
                  </div>
                </article>
              );
            })}
            {!loading && !visibleWorkspaces.length && (
              <div className="platform-empty"><Building2 size={25} /><p>No roofer workspaces match this search.</p></div>
            )}
            {loading && <div className="platform-empty"><span className="spinner" /><p>Loading roofer accounts...</p></div>}
          </div>
        </section>
      </section>
    </main>
  );
}
