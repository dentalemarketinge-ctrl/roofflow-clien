import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  Clock3,
  LogOut,
  PauseCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { AdminWorkspace, api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

type WorkspaceStatus = AdminWorkspace['subscription_status'];

export default function AdminPage() {
  const { profile, logout } = useAuth();
  const [workspaces, setWorkspaces] = useState<AdminWorkspace[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api.getAdminWorkspaces();
      setWorkspaces(result.workspaces);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load workspaces');
    } finally {
      setLoading(false);
    }
  }, []);

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

  return (
    <main className="platform-admin">
      <header className="platform-admin-header">
        <a className="platform-admin-brand" href="#/admin">
          <span><ShieldCheck size={20} /></span>
          <strong>RoofFlow</strong>
          <small>Platform admin</small>
        </a>
        <div>
          <span>{profile?.user.email}</span>
          <button type="button" onClick={logout}><LogOut size={16} /> Sign out</button>
        </div>
      </header>

      <section className="platform-admin-content">
        <div className="platform-admin-title">
          <div>
            <p>Manual account control</p>
            <h1>Roofer workspaces</h1>
            <span>Activate customers after receiving payment, or pause access when needed.</span>
          </div>
          <button type="button" onClick={() => void load()} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin-icon' : ''} /> Refresh
          </button>
        </div>

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
