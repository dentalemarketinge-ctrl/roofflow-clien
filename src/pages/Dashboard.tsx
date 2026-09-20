import { useState, useEffect, useRef, useCallback } from 'react';
import {
  LayoutDashboard, MessageSquare, PhoneMissed, Star,
  Settings, Zap, Send, Bot, User, Phone, MapPin,
  Clock, TrendingUp, Users, PhoneIncoming, AlertTriangle,
  CheckCircle, ChevronRight, Plus, RefreshCw,
  Calendar, Navigation, DollarSign, FileText, CreditCard, Camera, HardHat, BarChart3, Megaphone,
  House, ArrowUpRight, ExternalLink, LogOut, UserPlus, Crown,
  Play, Pause, Volume2, Headphones, Radio, Sparkles
} from 'lucide-react';
import { api, Lead, Message, Stats } from '../services/api';
import { useLiveEvents } from '../hooks/useLiveEvents';
import { useAuth } from '../contexts/AuthContext';
import { CalendarView } from '../components/crm/CalendarView';
import { QuotesView } from '../components/crm/QuotesView';
import { ContractsView } from '../components/crm/ContractsView';
import { InvoicesPaymentsView } from '../components/crm/InvoicesPaymentsView';
import { PhotosView } from '../components/crm/PhotosView';
import { TeamView } from '../components/crm/TeamView';
import { RouteView } from '../components/crm/RouteView';
import { RoiView } from '../components/crm/RoiView';
import { ReviewsView } from '../components/crm/ReviewsView';
import { MarketingView } from '../components/crm/MarketingView';

const STATUS_CONFIG: Record<string, { label: string; badgeClass: string; color: string }> = {
  NEW: { label: 'New Leads', badgeClass: 'badge-new', color: 'var(--text-primary)' },
  AI_QUALIFYING: { label: 'AI Qualifying', badgeClass: 'badge-qualifying', color: 'var(--text-primary)' },
  INSPECTION_SCHEDULED: { label: 'Inspection Booked', badgeClass: 'badge-scheduled', color: 'var(--text-primary)' },
  QUOTE_SENT: { label: 'Quote Sent', badgeClass: 'badge-quoted', color: 'var(--text-primary)' },
  JOB_WON: { label: 'Job Won', badgeClass: 'badge-won', color: 'var(--text-primary)' },
};

const PIPELINE_ORDER = ['NEW', 'AI_QUALIFYING', 'INSPECTION_SCHEDULED', 'QUOTE_SENT', 'JOB_WON'];

import { PREVIEW_LEADS, PREVIEW_STATS, PREVIEW_SETTINGS } from '../services/mockData';

export default function Dashboard() {
  const { profile, logout } = useAuth();
  const isPreview = window.location.hash.startsWith('#/preview');
  const [activeView, setActiveView] = useState<
    'pipeline' | 'chat' | 'missed-calls' | 'calendar' | 'route' |
    'quotes' | 'contracts' | 'invoices' | 'payments' | 'photos' | 'team' |
    'roi' | 'reviews' | 'marketing' | 'settings'
  >('pipeline');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [missedCalls, setMissedCalls] = useState<any[]>([]);
  const [isPlayingCallAudio, setIsPlayingCallAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(38);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: string }[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let interval: any;
    if (isPlayingCallAudio) {
      interval = setInterval(() => {
        setAudioProgress((prev) => {
          if (prev >= 94) {
            setIsPlayingCallAudio(false);
            return 94;
          }
          return prev + 1;
        });
      }, 300);
    }
    return () => clearInterval(interval);
  }, [isPlayingCallAudio]);
  const { connected, on } = useLiveEvents(!isPreview);
  let toastCounter = useRef(0);
  const companyName = isPreview ? 'Apex Roofing & Restoration' : profile?.organization?.name || 'RoofFlow';
  const websiteUrl = isPreview
    ? '/'
    : `/?org=${encodeURIComponent(profile?.organization?.slug || '')}`;
  const accountName = isPreview ? 'Alex Rivera' : profile?.user.full_name || profile?.user.email.split('@')[0] || 'Account';
  const accountInitials = accountName
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const showToast = useCallback((message: string, type: string = 'info') => {
    const id = ++toastCounter.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      try {
        const [leadsRes, statsRes] = await Promise.all([
          api.getLeads(),
          api.getStats(),
        ]);
        setLeads(leadsRes.leads);
        setStats(statsRes.stats);
      } catch (err) {
        console.error('Failed to load data:', err);
        if (isPreview) {
          setLeads(PREVIEW_LEADS);
          setStats(PREVIEW_STATS);
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [isPreview]);

  // SSE Event Handlers
  useEffect(() => {
    const unsub1 = on('lead_created', (data: any) => {
      setLeads((prev) => [data.lead, ...prev]);
      setStats((prev) => prev ? { ...prev, totalLeads: prev.totalLeads + 1, todayLeads: prev.todayLeads + 1 } : prev);
      const source = data.source === 'MISSED_CALL' ? 'Missed call' : 'Website';
      showToast(`New lead: ${data.lead.full_name} (${source})`, 'success');
    });

    const unsub2 = on('lead_updated', (data: any) => {
      setLeads((prev) => prev.map((l) => l.id === data.lead_id ? { ...l, ...data.lead, status: data.status || data.lead?.status || l.status } : l));
      if (selectedLead?.id === data.lead_id && data.lead) {
        setSelectedLead((prev) => prev ? { ...prev, ...data.lead } : prev);
      }
    });

    const unsub3 = on('new_message', (data: any) => {
      if (selectedLead?.id === data.lead_id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      }
    });

    const unsub4 = on('missed_call', (data: any) => {
      showToast(`Missed call from ${data.caller_phone} — text-back sent.`, 'info');
    });

    const unsub5 = on('lead_deleted', (data: any) => {
      setLeads((prev) => prev.filter((l) => l.id !== data.lead_id));
      if (selectedLead?.id === data.lead_id) setSelectedLead(null);
    });

    return () => { unsub1(); unsub2(); unsub3(); unsub4(); unsub5(); };
  }, [on, selectedLead, showToast]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-select first lead when opening chat tab if none selected
  useEffect(() => {
    if (activeView === 'chat' && !selectedLead && leads.length > 0) {
      selectLead(leads[0]);
    }
  }, [activeView, leads, selectedLead]);

  // Load messages when a lead is selected
  const selectLead = async (lead: Lead) => {
    setSelectedLead(lead);
    setActiveView('chat');
    try {
      const res = await api.getMessages(lead.id);
      setMessages(res.messages);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  // Send message
  const handleSendMessage = async (role: 'user' | 'contractor' = 'user') => {
    if (!chatInput.trim() || !selectedLead) return;
    const textToSend = chatInput.trim();
    setSendingMessage(true);
    try {
      const res = await api.sendMessage(selectedLead.id, textToSend, role);
      if (res.message) {
        setMessages((prev) => [...prev, res.message!]);
      }
      setChatInput('');

      // In preview mode: If homeowner sent a message and AI is active, simulate AI response
      if (isPreview && selectedLead.ai_auto_respond && role === 'user') {
        setTimeout(() => {
          const aiResponse: Message = {
            id: 'ai-reply-' + Date.now(),
            lead_id: selectedLead.id,
            role: 'assistant',
            content: "Got it! We've updated your project file. Estimator Marcus has this synced on his field iPad and will review it during your inspection.",
            channel: 'sms',
            twilio_sid: null,
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, aiResponse]);
        }, 1200);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      showToast('Failed to send message', 'error');
    } finally {
      setSendingMessage(false);
    }
  };

  // Toggle AI
  const handleToggleAI = async () => {
    if (!selectedLead) return;
    try {
      const res = await api.toggleAI(selectedLead.id, !selectedLead.ai_auto_respond);
      setSelectedLead(res.lead);
      setLeads((prev) => prev.map((l) => l.id === res.lead.id ? res.lead : l));
      showToast(res.lead.ai_auto_respond ? 'AI auto-response is on' : 'Manual mode — AI paused', 'info');
    } catch (err) {
      console.error('Failed to toggle AI:', err);
    }
  };

  // Move lead status
  const handleMoveStatus = async (lead: Lead, newStatus: string) => {
    try {
      await api.updateLeadStatus(lead.id, newStatus);
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Simulate missed call
  const handleSimulateMissedCall = async () => {
    if (isPreview) {
      const mockPhone = '+1 (214) 555-09' + Math.floor(10 + Math.random() * 89);
      const newMissed = {
        id: 'sim-mc-' + Date.now(),
        caller_phone: mockPhone,
        call_status: 'Live Call Diverted to AI',
        count: 1,
        textback_sent: true,
        textback_message: 'Hey! This is Sarah with Apex Roofing. Sorry we missed your call, our estimators are up on a roof. Do you have an active leak or need an inspection?',
        created_at: new Date().toISOString(),
      };
      setMissedCalls((prev) => [newMissed, ...prev]);
      showToast(`📞 Missed call from ${mockPhone} — AI text-back sent in 1.8s!`, 'success');
      return;
    }
    try {
      await api.simulateMissedCall();
      showToast('Simulated missed call created.', 'success');
    } catch (err) {
      showToast('Failed to simulate missed call', 'error');
    }
  };

  // Load missed calls
  useEffect(() => {
    if (activeView === 'missed-calls') {
      api.getMissedCalls().then((res) => setMissedCalls(res.missed_calls)).catch(console.error);
    }
  }, [activeView]);

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString();
  };

  const getLeadsByStatus = (status: string) => leads.filter((l) => l.status === status);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: 40, height: 40, margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-tertiary)' }}>Loading RoofFlow AI...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-theme" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* ---- Sidebar ---- */}
      <div className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon"><House size={18} /></div>
          <span className="brand-name">
            <strong>{companyName}</strong>
            <small>Command center</small>
          </span>
        </div>
        <nav className="sidebar-nav" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 140px)', paddingRight: 4 }}>
          <div className="sidebar-group-title">
            Operations & Lead Flow
          </div>
          <button className={`sidebar-link ${activeView === 'pipeline' ? 'active' : ''}`} onClick={() => setActiveView('pipeline')}>
            <LayoutDashboard size={18} />
            <span>Pipeline</span>
            {stats && stats.todayLeads > 0 && <span className="link-badge">{stats.todayLeads}</span>}
          </button>
          <button className={`sidebar-link ${activeView === 'chat' ? 'active' : ''}`} onClick={() => setActiveView('chat')}>
            <MessageSquare size={18} />
            <span>AI Assistant</span>
          </button>
          <button className={`sidebar-link ${activeView === 'missed-calls' ? 'active' : ''}`} onClick={() => setActiveView('missed-calls')}>
            <Headphones size={18} />
            <span>AI Voice Receptionist</span>
          </button>
          <button className={`sidebar-link ${activeView === 'calendar' ? 'active' : ''}`} onClick={() => setActiveView('calendar')}>
            <Calendar size={18} />
            <span>Job Scheduling</span>
          </button>
          <button className={`sidebar-link ${activeView === 'route' ? 'active' : ''}`} onClick={() => setActiveView('route')}>
            <Navigation size={18} />
            <span>Route Planning</span>
          </button>

          <div className="sidebar-group-title">
            Jobs, Financials & Crew
          </div>
          <button className={`sidebar-link ${activeView === 'quotes' ? 'active' : ''}`} onClick={() => setActiveView('quotes')}>
            <DollarSign size={18} />
            <span>Quotes</span>
          </button>
          <button className={`sidebar-link ${activeView === 'contracts' ? 'active' : ''}`} onClick={() => setActiveView('contracts')}>
            <FileText size={18} />
            <span>Contracts</span>
          </button>
          <button className={`sidebar-link ${activeView === 'invoices' ? 'active' : ''}`} onClick={() => setActiveView('invoices')}>
            <FileText size={18} />
            <span>Invoices</span>
          </button>
          <button className={`sidebar-link ${activeView === 'payments' ? 'active' : ''}`} onClick={() => setActiveView('payments')}>
            <CreditCard size={18} />
            <span>Payments</span>
          </button>
          <button className={`sidebar-link ${activeView === 'photos' ? 'active' : ''}`} onClick={() => setActiveView('photos')}>
            <Camera size={18} />
            <span>Before/After Photos</span>
          </button>
          <button className={`sidebar-link ${activeView === 'team' ? 'active' : ''}`} onClick={() => setActiveView('team')}>
            <HardHat size={18} />
            <span>Team Management</span>
          </button>

          <div className="sidebar-group-title">
            Growth, Reputation & ROI
          </div>
          <button className={`sidebar-link ${activeView === 'roi' ? 'active' : ''}`} onClick={() => setActiveView('roi')}>
            <BarChart3 size={18} />
            <span>ROI Dashboard</span>
          </button>
          <button className={`sidebar-link ${activeView === 'reviews' ? 'active' : ''}`} onClick={() => setActiveView('reviews')}>
            <Star size={18} />
            <span>Reviews</span>
          </button>
          <button className={`sidebar-link ${activeView === 'marketing' ? 'active' : ''}`} onClick={() => setActiveView('marketing')}>
            <Megaphone size={18} />
            <span>Marketing Campaigns</span>
          </button>
          <button className={`sidebar-link ${activeView === 'settings' ? 'active' : ''}`} onClick={() => setActiveView('settings')}>
            <Settings size={18} />
            <span>Settings</span>
          </button>
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-avatar">{accountInitials}</div>
          <div className="sidebar-profile">
            <strong>{accountName}</strong>
            <span>
              <i className={connected || isPreview ? 'is-online' : ''} />
              {isPreview ? 'Preview workspace' : `${profile?.role || 'member'} · ${connected ? 'Systems live' : 'Reconnecting…'}`}
            </span>
          </div>
          {!isPreview && (
            <button className="sidebar-signout" type="button" onClick={logout} title="Sign out">
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ---- Main Content ---- */}
      <div className="main-content">
        <div className="dashboard-topbar">
          <div>
            <span className="dashboard-topbar-kicker">{companyName}</span>
            <strong>Operations command center</strong>
          </div>
          <div className="dashboard-topbar-actions">
            {isPreview && <span className="preview-dashboard-badge">Read-only preview</span>}
            {profile?.is_platform_admin && (
              <a href="#/admin" className="website-link admin-console-link">
                Platform admin
              </a>
            )}
            <span className="workspace-plan">
              {profile?.organization?.plan || 'trial'}
            </span>
            <span className={`live-status ${connected || isPreview ? 'is-online' : ''}`}>
              <i /> {isPreview ? 'Sample data' : connected ? 'Live sync' : 'Reconnecting'}
            </span>
            <a href={websiteUrl} className="website-link" target="_blank" rel="noreferrer">
              View website <ExternalLink size={14} />
            </a>
            {!isPreview && (
              <button className="website-link dashboard-signout" type="button" onClick={logout}>
                Sign out <LogOut size={14} />
              </button>
            )}
          </div>
        </div>

        {/* ---- Toasts ---- */}
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            {toast.type === 'success' && <CheckCircle size={18} color="var(--accent-400)" />}
            {toast.type === 'error' && <AlertTriangle size={18} color="var(--danger-400)" />}
            {toast.type === 'info' && <Zap size={18} color="var(--primary-400)" />}
            <span style={{ fontSize: '0.88rem' }}>{toast.message}</span>
          </div>
        ))}

        {/* ---- Pipeline View ---- */}
        {activeView === 'pipeline' && (
          <>
            <div className="page-header">
              <div>
                <span className="page-eyebrow">Lead intelligence</span>
                <h1>Lead Pipeline</h1>
                <p>
                  A live view of demand, conversations, and revenue opportunities.
                </p>
              </div>
              <div className="page-actions">
                <button className="btn btn-ghost btn-sm" onClick={handleSimulateMissedCall}>
                  <PhoneIncoming size={14} /> Simulate Missed Call
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => {
                  api.getLeads().then((res) => setLeads(res.leads));
                  api.getStats().then((res) => setStats(res.stats));
                }}>
                  <RefreshCw size={14} /> Refresh
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-card-top">
                  <span className="stat-icon"><Users size={18} /></span>
                  <span className="trend-pill"><ArrowUpRight size={13} /> Live</span>
                </div>
                <div className="stat-value">{stats?.totalLeads || 0}</div>
                <div className="stat-label">Total Leads</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-top">
                  <span className="stat-icon stat-icon-gold"><TrendingUp size={18} /></span>
                  <span className="trend-pill"><ArrowUpRight size={13} /> Today</span>
                </div>
                <div className="stat-value">{stats?.todayLeads || 0}</div>
                <div className="stat-label">Today's Leads</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-top">
                  <span className="stat-icon stat-icon-coral"><PhoneIncoming size={18} /></span>
                  <span className="trend-pill">Recovered</span>
                </div>
                <div className="stat-value">{stats?.missedCalls || 0}</div>
                <div className="stat-label">Missed Calls Recovered</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-top">
                  <span className="stat-icon stat-icon-green"><Star size={18} /></span>
                  <span className="trend-pill">Performance</span>
                </div>
                <div className="stat-value">{stats?.revenue?.conversionRate || 0}%</div>
                <div className="stat-label">Conversion Rate</div>
              </div>
            </div>

            {/* Kanban Board */}
            <div className="kanban-board">
              {PIPELINE_ORDER.map((status) => {
                const config = STATUS_CONFIG[status];
                const statusLeads = getLeadsByStatus(status);
                return (
                  <div key={status} className={`kanban-column status-${status.toLowerCase()}`}>
                    <div className="kanban-column-header">
                      <h4 style={{ color: config.color }}>{config.label}</h4>
                      <span className="kanban-column-count">{statusLeads.length}</span>
                    </div>
                    <div className="kanban-column-body">
                      {statusLeads.length === 0 ? (
                        <div className="empty-state" style={{ padding: '24px 12px' }}>
                          <p style={{ fontSize: '0.8rem' }}>No leads yet</p>
                        </div>
                      ) : (
                        statusLeads.map((lead) => (
                          <div key={lead.id} className="lead-card" onClick={() => selectLead(lead)}>
                            <div className="lead-name">{lead.full_name}</div>
                            <div className="lead-meta">
                              <Phone size={12} /> {lead.phone}
                            </div>
                            {lead.zip_code && (
                              <div className="lead-meta" style={{ marginTop: 2 }}>
                                <MapPin size={12} /> {lead.zip_code}
                              </div>
                            )}
                            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                              <span className={`badge ${lead.source === 'MISSED_CALL' ? 'badge-missed-call' : 'badge-sms'}`}>
                                {lead.source === 'MISSED_CALL' ? 'Missed call' : lead.source === 'INCOMING_SMS' ? 'SMS' : 'Website'}
                              </span>
                              {lead.ai_auto_respond && <span className="badge badge-qualifying">AI assisted</span>}
                            </div>
                            <div className="lead-time">
                              <Clock size={10} /> {formatTime(lead.created_at)}
                            </div>
                            {/* Quick status move buttons */}
                            <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                              {(() => {
                                const currentIdx = PIPELINE_ORDER.indexOf(status);
                                const buttons = [];
                                if (currentIdx > 0) {
                                  const prevStatus = PIPELINE_ORDER[currentIdx - 1];
                                  buttons.push(
                                    <button
                                      key={prevStatus}
                                      className="btn btn-ghost btn-sm"
                                      style={{ padding: '4px 8px', fontSize: '0.7rem', color: 'var(--text-tertiary)' }}
                                      onClick={(e) => { e.stopPropagation(); handleMoveStatus(lead, prevStatus); }}
                                    >
                                      ← {STATUS_CONFIG[prevStatus]?.label}
                                    </button>
                                  );
                                }
                                if (currentIdx < PIPELINE_ORDER.length - 1) {
                                  const nextStatus = PIPELINE_ORDER[currentIdx + 1];
                                  buttons.push(
                                    <button
                                      key={nextStatus}
                                      className="btn btn-ghost btn-sm"
                                      style={{ padding: '4px 8px', fontSize: '0.7rem', borderColor: STATUS_CONFIG[nextStatus]?.color, color: STATUS_CONFIG[nextStatus]?.color, fontWeight: 700 }}
                                      onClick={(e) => { e.stopPropagation(); handleMoveStatus(lead, nextStatus); }}
                                    >
                                      → {STATUS_CONFIG[nextStatus]?.label}
                                    </button>
                                  );
                                }
                                if (currentIdx + 2 < PIPELINE_ORDER.length) {
                                  const nextNextStatus = PIPELINE_ORDER[currentIdx + 2];
                                  buttons.push(
                                    <button
                                      key={nextNextStatus}
                                      className="btn btn-ghost btn-sm"
                                      style={{ padding: '4px 8px', fontSize: '0.7rem', opacity: 0.85 }}
                                      onClick={(e) => { e.stopPropagation(); handleMoveStatus(lead, nextNextStatus); }}
                                    >
                                      → {STATUS_CONFIG[nextNextStatus]?.label}
                                    </button>
                                  );
                                }
                                return buttons;
                              })()}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ---- Chat View ---- */}
        {activeView === 'chat' && (
          <div style={{ display: 'flex', gap: 20, height: 'calc(100vh - 48px)' }}>
            {/* Leads List */}
            <div style={{
              width: 300, flexShrink: 0, background: '#FFFFFF',
              border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              <div style={{
                padding: '16px 20px', borderBottom: '1px solid var(--border-color)',
                fontWeight: 600, fontSize: '0.95rem',
              }}>
                Conversations
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {leads.filter((l) => l.status !== 'LOST').map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => selectLead(lead)}
                    style={{
                      padding: '14px 20px', cursor: 'pointer',
                      borderBottom: '1px solid var(--border-color)',
                      background: selectedLead?.id === lead.id ? 'var(--primary-50)' : 'transparent',
                      borderLeft: selectedLead?.id === lead.id ? '3px solid var(--primary-500)' : '3px solid transparent',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 2 }}>{lead.full_name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className={`badge ${STATUS_CONFIG[lead.status]?.badgeClass || 'badge-new'}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                        {STATUS_CONFIG[lead.status]?.label || lead.status}
                      </span>
                      <span>{formatTime(lead.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Area */}
            {selectedLead ? (
              <div className="chat-container" style={{ flex: 1 }}>
                <div className="chat-header">
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '1rem' }}>{selectedLead.full_name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Phone size={12} /> {selectedLead.phone}
                      {selectedLead.zip_code && <><MapPin size={12} /> {selectedLead.zip_code}</>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                      {selectedLead.ai_auto_respond ? 'AI active' : 'Manual mode'}
                    </span>
                    <div
                      className={`toggle-switch ${selectedLead.ai_auto_respond ? 'active' : ''}`}
                      onClick={handleToggleAI}
                      title={selectedLead.ai_auto_respond ? 'Click to take over manually' : 'Click to re-enable AI'}
                    />
                  </div>
                </div>

                <div className="chat-messages">
                  {messages.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon"><MessageSquare size={32} /></div>
                      <p>No messages yet. The AI will respond when the lead sends a message.</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className={`chat-bubble ${msg.role}`}>
                        <div className="chat-role">
                          {msg.role === 'assistant' ? 'Sarah · AI assistant' : msg.role === 'contractor' ? `${companyName} team` : 'Homeowner'}
                        </div>
                        {msg.content}
                        <div className="chat-time">{formatTime(msg.created_at)}</div>
                      </div>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="chat-input-area">
                  <input
                    className="input-field"
                    placeholder={selectedLead.ai_auto_respond ? "Type as homeowner (AI will respond)..." : "Type as contractor (manual mode)..."}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(selectedLead.ai_auto_respond ? 'user' : 'contractor');
                      }
                    }}
                    disabled={sendingMessage}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={() => handleSendMessage(selectedLead.ai_auto_respond ? 'user' : 'contractor')}
                    disabled={sendingMessage || !chatInput.trim()}
                  >
                    {sendingMessage ? <span className="spinner" /> : <Send size={16} />}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="empty-state">
                  <div className="empty-icon"><MessageSquare size={48} color="var(--text-secondary)" /></div>
                  <p>Select a conversation to start chatting</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---- Telnyx AI Voice Receptionist View ---- */}
        {activeView === 'missed-calls' && (
          <>
            <div className="page-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span className="badge badge-scheduled" style={{ fontSize: '0.72rem', padding: '2px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Radio size={12} className="is-online" /> Telnyx TeXML Live Engine
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>Sub-500ms Conversational Latency</span>
                </div>
                <h1>🎙️ Telnyx 24/7 AI Voice Receptionist</h1>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.88rem', marginTop: 4 }}>
                  Autonomous telephonic voice assistant that answers inbound homeowner calls, qualifies roofing damage, and schedules inspections over the phone.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-primary btn-sm" onClick={handleSimulateMissedCall} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <PhoneIncoming size={14} /> Simulate Inbound Voice Call
                </button>
              </div>
            </div>

            {/* Live Telephony Engine Status Grid */}
            <div className="crm-grid-3x" style={{ marginBottom: 20 }}>
              <div className="glass-card" style={{ padding: 18, borderLeft: '4px solid var(--accent-400)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                  TELEPHONY LINE (TELNYX)
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: 4, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Phone size={18} color="var(--accent-400)" />
                  +1 (214) 555-0199
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  Dallas Metro Inbound DID • Ring timeout: 18s
                </div>
              </div>

              <div className="glass-card" style={{ padding: 18, borderLeft: '4px solid var(--primary-500)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                  VOICE MODEL & PERSONA
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: 4, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={18} color="var(--primary-400)" />
                  Sarah · Conversational Neural AI
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  Trained on Roofing Codes, Hail & Damage Scopes
                </div>
              </div>

              <div className="glass-card" style={{ padding: 18, borderLeft: '4px solid #f59e0b' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                  DISPATCH ACTION
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: 4, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Calendar size={18} color="#f59e0b" />
                  Auto-Book On Calendar
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  Direct speech-to-booking into CRM calendar
                </div>
              </div>
            </div>

            {/* Featured Hero: Live Phone Call Player & Spoken Voice Transcript */}
            <div className="crm-box" style={{ marginBottom: 24, border: '1px solid var(--primary-500)', background: 'linear-gradient(180deg, rgba(59, 130, 246, 0.04) 0%, rgba(15, 23, 42, 0.02) 100%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, paddingBottom: 16, borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="badge badge-scheduled" style={{ fontSize: '0.75rem', padding: '3px 8px' }}>
                      🟢 INBOUND CALL RECORDING · ANSWERED BY AI
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Call ID: telnyx-call-98421</span>
                  </div>
                  <h3 style={{ fontSize: '1.15rem', marginTop: 6 }}>
                    Homeowner: Marcus Johnson (+1 469 555-0172) · Plano, TX
                  </h3>
                </div>

                {/* Audio Waveform Player */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--bg-secondary)', padding: '10px 18px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                  <button
                    onClick={() => setIsPlayingCallAudio(!isPlayingCallAudio)}
                    style={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: 'var(--primary-500)', border: 'none', color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)',
                      transition: 'all 0.2s ease',
                    }}
                    title={isPlayingCallAudio ? 'Pause call recording' : 'Play call recording'}
                  >
                    {isPlayingCallAudio ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: 2 }} />}
                  </button>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {isPlayingCallAudio ? 'Playing Inbound Audio…' : 'Recorded Phone Call'}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                        0:{audioProgress < 10 ? '0' + audioProgress : audioProgress} / 1:34
                      </span>
                    </div>

                    {/* Animated Equalizer Waveform */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 22, width: 180 }}>
                      {[40, 75, 55, 90, 30, 85, 60, 100, 45, 70, 80, 50, 65, 95, 40, 85, 30, 70, 90, 45].map((h, i) => (
                        <div
                          key={i}
                          style={{
                            flex: 1,
                            borderRadius: 2,
                            background: (i / 20) * 100 <= audioProgress ? 'var(--primary-400)' : 'var(--border-color)',
                            height: isPlayingCallAudio ? `${Math.max(15, (h * Math.sin((Date.now() / 200) + i)) % 100)}%` : `${h * 0.6}%`,
                            transition: isPlayingCallAudio ? 'height 0.15s ease' : 'none',
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <Volume2 size={16} color="var(--text-tertiary)" />
                </div>
              </div>

              {/* Turn-by-Turn Spoken Audio Transcript */}
              <div style={{ marginTop: 18 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Headphones size={14} /> Full Spoken Telephonic Transcript (TeXML Neural Speech)
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--bg-secondary)', padding: 16, borderRadius: 'var(--radius-md)', maxHeight: 320, overflowY: 'auto' }}>
                  <div style={{ padding: '8px 12px', background: 'rgba(59, 130, 246, 0.08)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--primary-500)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-400)', marginBottom: 2 }}>
                      🤖 Sarah (Telnyx AI Voice Receptionist) • [0:03]
                    </div>
                    <div style={{ fontSize: '0.86rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                      "Thank you for calling Apex Roofing & Restoration! My name is Sarah, your AI voice assistant. Are you calling about emergency storm damage or need a free roof inspection?"
                    </div>
                  </div>

                  <div style={{ padding: '8px 12px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--text-tertiary)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 2 }}>
                      👤 Marcus Johnson (Homeowner / Caller) • [0:11]
                    </div>
                    <div style={{ fontSize: '0.86rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                      "Hi Sarah! We just had that severe hailstorm in Plano yesterday, and I noticed several shingles blown off on our front lawn. Can someone come out and look at the damage?"
                    </div>
                  </div>

                  <div style={{ padding: '8px 12px', background: 'rgba(59, 130, 246, 0.08)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--primary-500)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-400)', marginBottom: 2 }}>
                      🤖 Sarah (Telnyx AI Voice Receptionist) • [0:23]
                    </div>
                    <div style={{ fontSize: '0.86rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                      "I'm sorry to hear that! Hail strikes and missing shingles can cause hidden leaks into the attic decking. What is your home address in Plano so I can check our inspector schedule?"
                    </div>
                  </div>

                  <div style={{ padding: '8px 12px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--text-tertiary)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 2 }}>
                      👤 Marcus Johnson (Homeowner / Caller) • [0:35]
                    </div>
                    <div style={{ fontSize: '0.86rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                      "It's 5401 Legacy Drive, Plano 75024."
                    </div>
                  </div>

                  <div style={{ padding: '8px 12px', background: 'rgba(59, 130, 246, 0.08)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--primary-500)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-400)', marginBottom: 2 }}>
                      🤖 Sarah (Telnyx AI Voice Receptionist) • [0:42]
                    </div>
                    <div style={{ fontSize: '0.86rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                      "Got it, 5401 Legacy Drive. Have you already filed an insurance claim with your insurance company for this storm?"
                    </div>
                  </div>

                  <div style={{ padding: '8px 12px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--text-tertiary)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 2 }}>
                      👤 Marcus Johnson (Homeowner / Caller) • [0:52]
                    </div>
                    <div style={{ fontSize: '0.86rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                      "Yes, with State Farm. The adjuster is actually coming out next Thursday morning."
                    </div>
                  </div>

                  <div style={{ padding: '8px 12px', background: 'rgba(59, 130, 246, 0.08)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--primary-500)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-400)', marginBottom: 2 }}>
                      🤖 Sarah (Telnyx AI Voice Receptionist) • [1:02]
                    </div>
                    <div style={{ fontSize: '0.86rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                      "Perfect. Our senior estimator Marcus Vance can meet with you and walk the roof with your adjuster to make sure no damage is overlooked. Can he stop by tomorrow at 10:00 AM for the initial drone scan?"
                    </div>
                  </div>

                  <div style={{ padding: '8px 12px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--text-tertiary)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 2 }}>
                      👤 Marcus Johnson (Homeowner / Caller) • [1:18]
                    </div>
                    <div style={{ fontSize: '0.86rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                      "Tomorrow at 10:00 AM works great. Thank you so much, Sarah!"
                    </div>
                  </div>

                  <div style={{ padding: '8px 12px', background: 'rgba(59, 130, 246, 0.08)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--primary-500)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-400)', marginBottom: 2 }}>
                      🤖 Sarah (Telnyx AI Voice Receptionist) • [1:24]
                    </div>
                    <div style={{ fontSize: '0.86rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                      "You're all set, Marcus! An inspection is booked on our calendar for tomorrow at 10:00 AM. I just sent a confirmation text to this number. Have a wonderful day!"
                    </div>
                  </div>
                </div>
              </div>

              {/* Real-Time Telephony Extraction Panel */}
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>QUALIFIED ROOF DAMAGE</div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', marginTop: 2 }}>Hail Strikes & Missing Shingles</div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>PROPERTY ADDRESS</div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', marginTop: 2 }}>5401 Legacy Dr, Plano, TX</div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>INSURANCE SCOPE</div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', marginTop: 2 }}>State Farm (Adjuster Thursday)</div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>SCHEDULED DISPATCH</div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--accent-400)', marginTop: 2 }}>Tomorrow @ 10:00 AM (Marcus)</div>
                </div>
              </div>
            </div>

            {/* Inbound Call History & Recovery Logs */}
            <h3 style={{ fontSize: '1.05rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <PhoneIncoming size={18} color="var(--primary-400)" />
              Recent Inbound Calls & Automatic Voice Recovery Logs
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {missedCalls.length === 0 ? (
                <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
                  <div style={{ marginBottom: 16 }}><PhoneMissed size={48} color="var(--text-secondary)" /></div>
                  <h3 style={{ marginBottom: 8 }}>No Inbound Calls Logged Yet</h3>
                  <p style={{ color: 'var(--text-tertiary)', marginBottom: 20 }}>
                    When phone calls arrive, Telnyx AI voice recordings and transcripts will appear here.
                  </p>
                  <button className="btn btn-primary" onClick={handleSimulateMissedCall}>
                    <PhoneIncoming size={16} /> Simulate Inbound Call
                  </button>
                </div>
              ) : (
                Object.values(missedCalls.reduce((acc, mc) => {
                  if (!acc[mc.caller_phone]) {
                    acc[mc.caller_phone] = { ...mc, count: 1 };
                  } else {
                    acc[mc.caller_phone].count += 1;
                  }
                  return acc;
                }, {} as Record<string, any>)).map((mc: any) => (
                  <div key={mc.id} className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 'var(--radius-md)',
                      background: mc.textback_sent ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {mc.textback_sent ? <CheckCircle size={20} color="var(--accent-400)" /> : <AlertTriangle size={20} color="var(--danger-400)" />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                        {mc.caller_phone}
                        {mc.count > 1 && (
                          <span style={{ fontSize: '0.7rem', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 12, color: 'var(--text-secondary)' }}>
                            {mc.count} inbound calls
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
                        {mc.call_status} • Last call: {formatTime(mc.created_at)}
                      </div>
                      {mc.textback_message && (
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 6, fontStyle: 'italic' }}>
                          "{mc.textback_message.substring(0, 120)}..."
                        </div>
                      )}
                    </div>
                    <span className={`badge ${mc.textback_sent ? 'badge-scheduled' : 'badge-missed-call'}`}>
                      {mc.textback_sent ? 'AI Voice Handled' : 'Pending'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* ---- Calendar View ---- */}
        {activeView === 'calendar' && (
          <CalendarView
            leads={leads}
            onSelectLead={(lead) => { setSelectedLead(lead); setActiveView('chat'); }}
            showToast={showToast}
          />
        )}

        {/* ---- Route Planning View ---- */}
        {activeView === 'route' && <RouteView leads={leads} showToast={showToast} />}

        {/* ---- Quotes View ---- */}
        {activeView === 'quotes' && (
          <QuotesView
            leads={leads}
            onSelectLead={(lead) => setSelectedLead(lead)}
            showToast={showToast}
            onQuoteSent={() => api.getLeads().then((res) => setLeads(res.leads))}
          />
        )}

        {/* ---- Contracts View ---- */}
        {activeView === 'contracts' && <ContractsView leads={leads} showToast={showToast} />}

        {/* ---- Invoices & Payments View ---- */}
        {activeView === 'invoices' && <InvoicesPaymentsView leads={leads} mode="invoices" showToast={showToast} />}
        {activeView === 'payments' && <InvoicesPaymentsView leads={leads} mode="payments" showToast={showToast} />}

        {/* ---- Photos View ---- */}
        {activeView === 'photos' && <PhotosView leads={leads} showToast={showToast} />}

        {/* ---- Team View ---- */}
        {activeView === 'team' && <TeamView showToast={showToast} />}

        {/* ---- ROI View ---- */}
        {activeView === 'roi' && <RoiView stats={stats} />}

        {/* ---- Reviews View ---- */}
        {activeView === 'reviews' && <ReviewsView leads={leads} showToast={showToast} />}

        {/* ---- Marketing View ---- */}
        {activeView === 'marketing' && <MarketingView leads={leads} showToast={showToast} />}

        {/* ---- Settings View ---- */}
        {activeView === 'settings' && <SettingsView showToast={showToast} />}
      </div>
    </div>
  );
}

/* ---- Settings Component ---- */
const PREVIEW_MEMBERS = [
  { id: 'm-1', display_name: 'Alex Rivera (Owner)', email: 'alex@apexroofing.com', role: 'owner' },
  { id: 'm-2', display_name: 'Marcus Vance (Lead Estimator)', email: 'marcus@apexroofing.com', role: 'admin' },
  { id: 'm-3', display_name: 'Jessica Gomez (Office Dispatch)', email: 'jessica@apexroofing.com', role: 'member' },
];

function SettingsView({ showToast }: { showToast: (msg: string, type: string) => void }) {
  const { profile } = useAuth();
  const [settings, setSettings] = useState<any>(PREVIEW_SETTINGS);
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState<any[]>(PREVIEW_MEMBERS);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [inviting, setInviting] = useState(false);
  const canManageWorkspace = profile?.role === 'owner' || profile?.role === 'admin' || !profile;

  useEffect(() => {
    api.getSettings()
      .then((res) => {
        setSettings({ ...PREVIEW_SETTINGS, ...res.settings });
        setPreviewMode(false);
      })
      .catch(() => setPreviewMode(true));
    api.getWorkspaceMembers()
      .then((res) => {
        if (res.members && res.members.length > 0) setMembers(res.members);
      })
      .catch(() => setMembers(PREVIEW_MEMBERS));
  }, []);

  const handleInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await api.inviteWorkspaceMember(inviteEmail.trim(), inviteRole);
      showToast(`Invitation sent to ${inviteEmail.trim()}`, 'success');
      setInviteEmail('');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not send invitation', 'error');
    } finally {
      setInviting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateSettings(settings);
      showToast('Settings saved!', 'success');
    } catch (err) {
      showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h1>Settings</h1>
        <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving || previewMode} title={previewMode ? 'Available after backend deployment' : undefined}>
          {saving ? <span className="spinner" /> : <CheckCircle size={14} />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 760 }}>
        {previewMode && (
          <div className="glass-card" style={{ padding: 16, borderColor: 'var(--gold)' }}>
            <strong>Preview configuration</strong>
            <p style={{ marginTop: 5, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              The form is ready to review. Saving and live status activate when the private backend is deployed.
            </p>
          </div>
        )}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 16, fontSize: '1.1rem' }}>Company details</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="input-label">Company Name</label>
              <input className="input-field" value={settings.company_name || ''} onChange={(e) => setSettings({ ...settings, company_name: e.target.value })} />
            </div>
            <div>
              <label className="input-label">Phone Number</label>
              <input className="input-field" value={settings.company_phone || ''} onChange={(e) => setSettings({ ...settings, company_phone: e.target.value })} />
            </div>
            <div>
              <label className="input-label">Service Area</label>
              <input className="input-field" value={settings.service_area || ''} onChange={(e) => setSettings({ ...settings, service_area: e.target.value })} />
            </div>
            <div>
              <label className="input-label">Google Review Link</label>
              <input className="input-field" placeholder="https://g.page/r/..." value={settings.google_review_link || ''} onChange={(e) => setSettings({ ...settings, google_review_link: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="glass-card workspace-access-card">
          <div className="workspace-access-heading">
            <div>
              <h3>Workspace access</h3>
              <p>Invite office staff or managers without sharing your password.</p>
            </div>
            <span className="role-chip"><Crown size={13} /> {profile?.role || 'member'}</span>
          </div>
          <div className="workspace-member-list">
            {members.map((member) => (
              <div className="workspace-member" key={member.id}>
                <span className="workspace-member-avatar">
                  {(member.display_name || member.email || 'U').slice(0, 2).toUpperCase()}
                </span>
                <span>
                  <strong>{member.display_name || member.email || 'Workspace user'}</strong>
                  {member.display_name && member.email && <small>{member.email}</small>}
                </span>
                <em>{member.role}</em>
              </div>
            ))}
            {!members.length && <p className="workspace-empty">Your membership appears here after the SaaS database migration is applied.</p>}
          </div>
          {canManageWorkspace && (
            <form className="workspace-invite-form" onSubmit={handleInvite}>
              <label>
                Invite by email
                <input type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="office@company.com" required />
              </label>
              <label>
                Role
                <select value={inviteRole} onChange={(event) => setInviteRole(event.target.value as 'admin' | 'member')}>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <button className="btn btn-primary btn-sm" type="submit" disabled={inviting || previewMode}>
                <UserPlus size={14} /> {inviting ? 'Sending...' : 'Send invite'}
              </button>
            </form>
          )}
        </div>

        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 16, fontSize: '1.1rem' }}>AI templates</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="input-label">AI Greeting Template</label>
              <textarea
                className="input-field"
                rows={3}
                value={settings.ai_greeting_template || ''}
                onChange={(e) => setSettings({ ...settings, ai_greeting_template: e.target.value })}
                style={{ resize: 'vertical' }}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Use {'{{name}}'} for lead name, {'{{company}}'} for company name
              </p>
            </div>
            <div>
              <label className="input-label">Missed Call Text-Back Template</label>
              <textarea
                className="input-field"
                rows={3}
                value={settings.missed_call_template || ''}
                onChange={(e) => setSettings({ ...settings, missed_call_template: e.target.value })}
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 6, fontSize: '1.1rem' }}>Telnyx call routing</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: 16 }}>
            Customer-specific values used for human-first calling, AI fallback, and SMS.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="input-label">Telnyx Business Number</label>
              <input className="input-field" placeholder="+17575403912" value={settings.telnyx_phone_number || ''} onChange={(e) => setSettings({ ...settings, telnyx_phone_number: e.target.value })} />
            </div>
            <div>
              <label className="input-label">Roofer Forwarding Number</label>
              <input className="input-field" placeholder="+213555544133" value={settings.roofer_phone_number || ''} onChange={(e) => setSettings({ ...settings, roofer_phone_number: e.target.value })} />
            </div>
            <div>
              <label className="input-label">AI Assistant ID</label>
              <input className="input-field" placeholder="assistant-..." value={settings.telnyx_ai_assistant_id || ''} onChange={(e) => setSettings({ ...settings, telnyx_ai_assistant_id: e.target.value })} />
            </div>
            <div>
              <label className="input-label">TeXML Application ID</label>
              <input className="input-field" placeholder="3014974925187319165" value={settings.telnyx_texml_app_id || ''} onChange={(e) => setSettings({ ...settings, telnyx_texml_app_id: e.target.value })} />
            </div>
            <div>
              <label className="input-label">Messaging Profile ID</label>
              <input className="input-field" placeholder="40019fab-..." value={settings.telnyx_messaging_profile_id || ''} onChange={(e) => setSettings({ ...settings, telnyx_messaging_profile_id: e.target.value })} />
            </div>
            <div>
              <label className="input-label">Webhook Public Key</label>
              <input className="input-field" type="password" autoComplete="off" value={settings.telnyx_public_key || ''} onChange={(e) => setSettings({ ...settings, telnyx_public_key: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 16, fontSize: '1.1rem' }}>Human-first schedule</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="input-label">Days the roofer rings first</label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                  <label key={day} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.85rem' }}>
                    <input
                      type="checkbox"
                      checked={(settings.business_days || []).includes(index)}
                      onChange={(e) => {
                        const days = new Set<number>(settings.business_days || []);
                        e.target.checked ? days.add(index) : days.delete(index);
                        setSettings({ ...settings, business_days: Array.from(days).sort() });
                      }}
                    />
                    {day}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
              <div>
                <label className="input-label">Start Time</label>
                <input className="input-field" type="time" value={settings.business_start || '08:00'} onChange={(e) => setSettings({ ...settings, business_start: e.target.value })} />
              </div>
              <div>
                <label className="input-label">End Time</label>
                <input className="input-field" type="time" value={settings.business_end || '18:00'} onChange={(e) => setSettings({ ...settings, business_end: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="input-label">Timezone</label>
              <input className="input-field" placeholder="Africa/Algiers" value={settings.business_timezone || ''} onChange={(e) => setSettings({ ...settings, business_timezone: e.target.value })} />
            </div>
            <div>
              <label className="input-label">Ring Before AI Answers (seconds)</label>
              <input className="input-field" type="number" min={5} max={120} value={settings.ring_timeout_seconds || 18} onChange={(e) => setSettings({ ...settings, ring_timeout_seconds: Number(e.target.value) })} />
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              The private Telnyx API key remains in protected deployment settings and is never sent to this dashboard.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
