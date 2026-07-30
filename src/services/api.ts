/**
 * RoofFlow AI — API Service Layer
 * Communicates with the Express backend
 */
import { getValidAccessToken } from './session';

const API_BASE = '/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const accessToken = await getValidAccessToken();
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'API request failed');
  }

  return res.json();
}

// ---- Leads ----

export interface Lead {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  zip_code: string | null;
  address: string | null;
  issue_type: string;
  roof_age: string | null;
  has_insurance_claim: boolean;
  status: string;
  source: string;
  ai_auto_respond: boolean;
  inspection_date: string | null;
  inspection_notes: string | null;
  quote_amount: number | null;
  job_value: number | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  lead_id: string;
  role: 'user' | 'assistant' | 'contractor' | 'system';
  content: string;
  channel: string;
  twilio_sid: string | null;
  created_at: string;
}

export interface Stats {
  totalLeads: number;
  todayLeads: number;
  weekLeads: number;
  pipeline: Record<string, number>;
  sources: Record<string, number>;
  revenue: {
    totalQuoted: number;
    totalWon: number;
    conversionRate: number;
  };
  missedCalls: number;
  totalMessages: number;
}

export interface ContractorSettings {
  id: string;
  company_name: string;
  company_phone: string;
  service_area: string;
  google_review_link: string | null;
  ai_greeting_template: string;
  missed_call_template: string;
  telnyx_phone_number: string | null;
  telnyx_messaging_profile_id: string | null;
  telnyx_texml_app_id: string | null;
  telnyx_ai_assistant_id: string | null;
  telnyx_public_key: string | null;
  roofer_phone_number: string | null;
  business_days: number[];
  business_start: string;
  business_end: string;
  business_timezone: string;
  ring_timeout_seconds: number;
}

export interface WorkspaceProfile {
  user: { id: string; email: string; full_name: string | null };
  organization: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    subscription_status: string;
    trial_ends_at: string | null;
  } | null;
  role: 'owner' | 'admin' | 'member' | null;
  onboarding_required: boolean;
  is_platform_admin: boolean;
}

export interface PublicWorkspace {
  slug: string;
  company_name: string;
  company_phone: string;
  service_area: string;
}

export interface AdminWorkspace {
  id: string;
  name: string;
  slug: string;
  plan: string;
  subscription_status: 'trialing' | 'active' | 'paused' | 'cancelled';
  trial_ends_at: string | null;
  created_at: string;
  owner_email: string | null;
  owner_name: string | null;
  member_count: number;
  company_phone: string | null;
  telnyx_phone_number: string | null;
}

export const api = {
  getPublicWorkspace: (slug: string) =>
    request<{ workspace: PublicWorkspace }>(`/public/workspaces/${encodeURIComponent(slug)}`),

  // Authentication & workspace
  signUp: (data: { email: string; password: string; full_name: string }) =>
    request<any>('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    request<any>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  requestPasswordReset: (email: string) =>
    request<{ success: boolean }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  updatePassword: (password: string) =>
    request<{ success: boolean }>('/auth/password', { method: 'POST', body: JSON.stringify({ password }) }),
  getProfile: () => request<WorkspaceProfile>('/auth/me'),
  createWorkspace: (data: { company_name: string; slug: string; company_phone: string; service_area: string; business_timezone: string }) =>
    request<any>('/auth/onboarding', { method: 'POST', body: JSON.stringify(data) }),
  getWorkspaceMembers: () => request<{ members: any[] }>('/auth/members'),
  inviteWorkspaceMember: (email: string, role: 'admin' | 'member') =>
    request<any>('/auth/invitations', { method: 'POST', body: JSON.stringify({ email, role }) }),
  getAdminWorkspaces: () =>
    request<{ workspaces: AdminWorkspace[] }>('/auth/admin/workspaces'),
  updateWorkspaceSubscription: (
    id: string,
    subscription_status: AdminWorkspace['subscription_status'],
    trial_days?: number,
  ) => request<{ workspace: AdminWorkspace }>(`/auth/admin/workspaces/${id}/subscription`, {
    method: 'PATCH',
    body: JSON.stringify({ subscription_status, trial_days }),
  }),

  // Leads
  getLeads: () => request<{ leads: Lead[] }>('/leads'),
  getLead: (id: string) => request<{ lead: Lead }>(`/leads/${id}`),
  createLead: (data: Partial<Lead> & { organization_slug?: string }) =>
    request<{ lead: Lead }>('/leads', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateLeadStatus: (id: string, status: string) =>
    request<{ lead: Lead }>(`/leads/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  updateLead: (id: string, data: Partial<Lead>) =>
    request<{ lead: Lead }>(`/leads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteLead: (id: string) =>
    request<{ success: boolean }>(`/leads/${id}`, { method: 'DELETE' }),

  // Chat
  getMessages: (leadId: string) =>
    request<{ messages: Message[] }>(`/chat/${leadId}/messages`),
  sendMessage: (lead_id: string, content: string, role: string = 'user') =>
    request<{ message?: Message; userMessage?: Message; aiMessage?: Message }>('/chat/send', {
      method: 'POST',
      body: JSON.stringify({ lead_id, content, role }),
    }),
  toggleAI: (leadId: string, ai_auto_respond: boolean) =>
    request<{ lead: Lead }>(`/chat/${leadId}/toggle-ai`, {
      method: 'PATCH',
      body: JSON.stringify({ ai_auto_respond }),
    }),

  // Stats
  getStats: () => request<{ stats: Stats }>('/stats'),
  getMissedCalls: () => request<{ missed_calls: any[] }>('/stats/missed-calls'),

  // Settings
  getSettings: () => request<{ settings: ContractorSettings }>('/settings'),
  updateSettings: (data: Partial<ContractorSettings>) =>
    request<{ settings: ContractorSettings }>('/settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Webhooks / Simulation
  simulateMissedCall: (caller_phone?: string, caller_name?: string) =>
    request<any>('/leads/simulate-missed-call', {
      method: 'POST',
      body: JSON.stringify({ caller_phone, caller_name }),
    }),

  // CRM Modules
  getCRMData: () => request<any>('/crm/all'),
  createQuote: (data: any) => request<any>('/crm/quotes', { method: 'POST', body: JSON.stringify(data) }),
  bookCalendarEvent: (data: any) => request<any>('/crm/calendar', { method: 'POST', body: JSON.stringify(data) }),
  createContract: (data: any) => request<any>('/crm/contracts', { method: 'POST', body: JSON.stringify(data) }),
  signContract: (id: string) => request<any>(`/crm/contracts/${id}/sign`, { method: 'POST' }),
  createInvoice: (data: any) => request<any>('/crm/invoices', { method: 'POST', body: JSON.stringify(data) }),
  createPayment: (data: any) => request<any>('/crm/payments', { method: 'POST', body: JSON.stringify(data) }),
  uploadPhoto: (data: any) => request<any>('/crm/photos', { method: 'POST', body: JSON.stringify(data) }),
  addTeamMember: (data: any) => request<any>('/crm/team', { method: 'POST', body: JSON.stringify(data) }),
  addRouteStop: (data: any) => request<any>('/crm/routes', { method: 'POST', body: JSON.stringify(data) }),
  sendRouteETAs: () => request<any>('/crm/routes/sms-eta', { method: 'POST' }),
  launchMarketingCampaign: (data: any) => request<any>('/crm/marketing/launch', { method: 'POST', body: JSON.stringify(data) }),
  addReview: (data: any) => request<any>('/crm/reviews', { method: 'POST', body: JSON.stringify(data) }),
  requestReviews: (data?: any) => request<any>('/crm/reviews/request', { method: 'POST', body: data ? JSON.stringify(data) : undefined }),

  // Health
  health: () => request<any>('/health'),
};
