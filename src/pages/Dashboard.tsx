import { useState, useEffect, useRef, useCallback } from 'react';
import {
  LayoutDashboard, MessageSquare, PhoneMissed, Star,
  Settings, Zap, Send, Bot, User, Phone, MapPin,
  Clock, TrendingUp, Users, PhoneIncoming, AlertTriangle,
  CheckCircle, ChevronRight, Plus, RefreshCw,
  Calendar, Navigation, DollarSign, FileText, CreditCard, Camera, HardHat, BarChart3, Megaphone,
  House, ArrowUpRight, ExternalLink
} from 'lucide-react';
import { api, Lead, Message, Stats } from '../services/api';
import { useLiveEvents } from '../hooks/useLiveEvents';
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

export default function Dashboard() {
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
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: string }[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { connected, on } = useLiveEvents();
  let toastCounter = useRef(0);

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
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

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
    setSendingMessage(true);
    try {
      await api.sendMessage(selectedLead.id, chatInput.trim(), role);
      setChatInput('');
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
            <strong>APEX</strong>
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
            <PhoneMissed size={18} />
            <span>Missed Calls</span>
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
          <div className="sidebar-avatar">AR</div>
          <div className="sidebar-profile">
            <strong>Alex Rivera</strong>
            <span>
              <i className={connected ? 'is-online' : ''} />
              {connected ? 'Systems live' : 'Reconnecting…'}
            </span>
          </div>
        </div>
      </div>

      {/* ---- Main Content ---- */}
      <div className="main-content">
        <div className="dashboard-topbar">
          <div>
            <span className="dashboard-topbar-kicker">Apex Roofing & Restoration</span>
            <strong>Operations command center</strong>
          </div>
          <div className="dashboard-topbar-actions">
            <span className={`live-status ${connected ? 'is-online' : ''}`}>
              <i /> {connected ? 'Live sync' : 'Reconnecting'}
            </span>
            <a href="/" className="website-link">
              View website <ExternalLink size={14} />
            </a>
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
                          {msg.role === 'assistant' ? 'Sarah · AI assistant' : msg.role === 'contractor' ? 'Apex team' : 'Homeowner'}
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

        {/* ---- Missed Calls View ---- */}
        {activeView === 'missed-calls' && (
          <>
            <div className="page-header">
              <div>
                <h1>Missed Call Recovery</h1>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.88rem', marginTop: 4 }}>
                  Every missed call intercepted and recovered with instant text-backs
                </p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={handleSimulateMissedCall}>
                <PhoneIncoming size={14} /> Simulate Missed Call
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {missedCalls.length === 0 ? (
                <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
                  <div style={{ marginBottom: 16 }}><PhoneMissed size={48} color="var(--text-secondary)" /></div>
                  <h3 style={{ marginBottom: 8 }}>No Missed Calls Yet</h3>
                  <p style={{ color: 'var(--text-tertiary)', marginBottom: 20 }}>
                    When calls are missed, they'll appear here with automatic text-back status.
                  </p>
                  <button className="btn btn-primary" onClick={handleSimulateMissedCall}>
                    <PhoneIncoming size={16} /> Simulate a Missed Call
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
                            {mc.count} missed calls
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
                      {mc.textback_sent ? 'Text-back sent' : 'Pending'}
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
const DEFAULT_ROUTING_SETTINGS = {
  company_name: 'Apex Roofing & Restoration',
  company_phone: '+17575403912',
  service_area: 'Dallas-Fort Worth, TX',
  google_review_link: '',
  ai_greeting_template: 'Hi! This is Sarah with {{company}}. How can we help with your roof today?',
  missed_call_template: 'Sorry we missed your call. Reply here and tell us how we can help, or reply CALL for a callback.',
  telnyx_phone_number: '+17575403912',
  telnyx_messaging_profile_id: '40019fab-57c4-4618-9759-c04049bfb5f0',
  telnyx_texml_app_id: '3014974925187319165',
  telnyx_ai_assistant_id: 'assistant-f3a58277-5cc7-4e4b-be9e-a8e2003b43b9',
  telnyx_public_key: '',
  roofer_phone_number: '+213555544133',
  business_days: [0, 1, 2, 3, 4, 5, 6],
  business_start: '08:00',
  business_end: '18:00',
  business_timezone: 'Africa/Algiers',
  ring_timeout_seconds: 18,
};

function SettingsView({ showToast }: { showToast: (msg: string, type: string) => void }) {
  const [settings, setSettings] = useState<any>(DEFAULT_ROUTING_SETTINGS);
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getSettings()
      .then((res) => {
        setSettings({ ...DEFAULT_ROUTING_SETTINGS, ...res.settings });
        setPreviewMode(false);
      })
      .catch(() => setPreviewMode(true));
  }, []);

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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 640 }}>
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
