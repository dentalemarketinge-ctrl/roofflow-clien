/**
 * RoofFlow AI — API Service Layer
 * Communicates with the Express backend
 */
import { getValidAccessToken } from './session';
import {
  PREVIEW_CRM_DATA,
  PREVIEW_MISSED_CALLS,
  PREVIEW_MESSAGES,
  PREVIEW_SETTINGS,
  PREVIEW_LEADS,
  PREVIEW_STATS,
} from './mockData';

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
  service_area?: string | null;
  service_zip_codes?: string[];
  roofer_phone_number?: string | null;
  telnyx_phone_number: string | null;
  onboarding_data?: Record<string, string | string[]>;
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
  createWorkspace: (data: {
    company_name: string;
    slug: string;
    company_phone: string;
    service_area: string;
    service_zip_codes: string[];
    roofer_phone_number: string;
    business_days: number[];
    business_start: string;
    business_end: string;
    business_timezone: string;
    onboarding_data: Record<string, string | string[]>;
  }) =>
    request<any>('/auth/onboarding', { method: 'POST', body: JSON.stringify(data) }),
  getWorkspaceMembers: () => request<{ members: any[] }>('/auth/members'),
  inviteWorkspaceMember: (email: string, role: 'admin' | 'member') =>
    request<any>('/auth/invitations', { method: 'POST', body: JSON.stringify({ email, role }) }),
  getAdminWorkspaces: () =>
    request<{ workspaces: AdminWorkspace[] }>('/auth/admin/workspaces'),
  createAdminWorkspace: (data: {
    owner_email: string;
    owner_name: string;
    company_name: string;
    slug: string;
    company_phone: string;
    service_area: string;
    service_zip_codes: string[];
    roofer_phone_number: string;
    onboarding_data: Record<string, string | string[]>;
  }) => request<any>('/auth/admin/workspaces', { method: 'POST', body: JSON.stringify(data) }),
  updateWorkspaceSubscription: (
    id: string,
    subscription_status: AdminWorkspace['subscription_status'],
    trial_days?: number,
  ) => request<{ workspace: AdminWorkspace }>(`/auth/admin/workspaces/${id}/subscription`, {
    method: 'PATCH',
    body: JSON.stringify({ subscription_status, trial_days }),
  }),

  // Leads
  getLeads: async () => {
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#/preview')) {
      return { leads: PREVIEW_LEADS };
    }
    return request<{ leads: Lead[] }>('/leads');
  },
  getLead: (id: string) => {
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#/preview')) {
      const lead = PREVIEW_LEADS.find((l) => l.id === id) || PREVIEW_LEADS[0];
      return Promise.resolve({ lead });
    }
    return request<{ lead: Lead }>(`/leads/${id}`);
  },
  createLead: (data: Partial<Lead> & { organization_slug?: string }) =>
    request<{ lead: Lead }>('/leads', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateLeadStatus: (id: string, status: string) => {
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#/preview')) {
      return Promise.resolve({ lead: { ...PREVIEW_LEADS[0], id, status } });
    }
    return request<{ lead: Lead }>(`/leads/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
  updateLead: (id: string, data: Partial<Lead>) =>
    request<{ lead: Lead }>(`/leads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteLead: (id: string) =>
    request<{ success: boolean }>(`/leads/${id}`, { method: 'DELETE' }),

  // Chat
  getMessages: async (leadId: string) => {
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#/preview')) {
      const messages = PREVIEW_MESSAGES[leadId] || PREVIEW_MESSAGES['preview-1'] || [];
      return { messages };
    }
    return request<{ messages: Message[] }>(`/chat/${leadId}/messages`);
  },
  sendMessage: async (lead_id: string, content: string, role: string = 'user') => {
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#/preview')) {
      const newMsg: Message = {
        id: 'msg-' + Date.now(),
        lead_id,
        role: role as any,
        content,
        channel: 'sms',
        twilio_sid: null,
        created_at: new Date().toISOString(),
      };
      return { message: newMsg, userMessage: newMsg };
    }
    return request<{ message?: Message; userMessage?: Message; aiMessage?: Message }>('/chat/send', {
      method: 'POST',
      body: JSON.stringify({ lead_id, content, role }),
    });
  },
  toggleAI: (leadId: string, ai_auto_respond: boolean) => {
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#/preview')) {
      const lead = PREVIEW_LEADS.find((l) => l.id === leadId) || PREVIEW_LEADS[0];
      return Promise.resolve({ lead: { ...lead, ai_auto_respond } });
    }
    return request<{ lead: Lead }>(`/chat/${leadId}/toggle-ai`, {
      method: 'PATCH',
      body: JSON.stringify({ ai_auto_respond }),
    });
  },

  // Stats
  getStats: async () => {
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#/preview')) {
      return { stats: PREVIEW_STATS };
    }
    return request<{ stats: Stats }>('/stats');
  },
  getMissedCalls: async () => {
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#/preview')) {
      return { missed_calls: PREVIEW_MISSED_CALLS };
    }
    return request<{ missed_calls: any[] }>('/stats/missed-calls');
  },

  // Settings
  getSettings: async () => {
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#/preview')) {
      return { settings: PREVIEW_SETTINGS };
    }
    return request<{ settings: ContractorSettings }>('/settings');
  },
  updateSettings: (data: Partial<ContractorSettings>) => {
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#/preview')) {
      return Promise.resolve({ settings: { ...PREVIEW_SETTINGS, ...data } });
    }
    return request<{ settings: ContractorSettings }>('/settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Webhooks / Simulation
  simulateMissedCall: (caller_phone?: string, caller_name?: string) =>
    request<any>('/leads/simulate-missed-call', {
      method: 'POST',
      body: JSON.stringify({ caller_phone, caller_name }),
    }),

  // CRM Modules
  getCRMData: async () => {
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#/preview')) {
      return PREVIEW_CRM_DATA;
    }
    return request<any>('/crm/all');
  },
  createQuote: async (data: any) => {
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#/preview')) {
      return { quote: { id: 'quote-' + Date.now(), ...data, created_at: 'Just now' } };
    }
    return request<any>('/crm/quotes', { method: 'POST', body: JSON.stringify(data) });
  },
  bookCalendarEvent: async (data: any) => {
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#/preview')) {
      return { event: { id: 'cal-' + Date.now(), ...data } };
    }
    return request<any>('/crm/calendar', { method: 'POST', body: JSON.stringify(data) });
  },
  createContract: async (data: any) => {
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#/preview')) {
      return { contract: { id: 'cnt-' + Date.now(), ...data, status: 'Pending Homeowner Signature' } };
    }
    return request<any>('/crm/contracts', { method: 'POST', body: JSON.stringify(data) });
  },
  signContract: async (id: string) => {
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#/preview')) {
      return { success: true };
    }
    return request<any>(`/crm/contracts/${id}/sign`, { method: 'POST' });
  },
  createInvoice: async (data: any) => {
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#/preview')) {
      return { invoice: { id: 'INV-' + Date.now(), ...data, status: 'Sent to Homeowner' } };
    }
    return request<any>('/crm/invoices', { method: 'POST', body: JSON.stringify(data) });
  },
  createPayment: async (data: any) => {
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#/preview')) {
      return { payment: { id: 'PAY-' + Date.now(), ...data, status: 'Settled & Transferred' } };
    }
    return request<any>('/crm/payments', { method: 'POST', body: JSON.stringify(data) });
  },
  uploadPhoto: async (data: any) => {
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#/preview')) {
      return { photo: { id: 'p-' + Date.now(), ...data } };
    }
    return request<any>('/crm/photos', { method: 'POST', body: JSON.stringify(data) });
  },
  addTeamMember: async (data: any) => {
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#/preview')) {
      return { teamMember: { id: 'team-' + Date.now(), ...data } };
    }
    return request<any>('/crm/team', { method: 'POST', body: JSON.stringify(data) });
  },
  addRouteStop: (data: any) => request<any>('/crm/routes', { method: 'POST', body: JSON.stringify(data) }),
  sendRouteETAs: () => request<any>('/crm/routes/sms-eta', { method: 'POST' }),
  launchMarketingCampaign: (data: any) => request<any>('/crm/marketing/launch', { method: 'POST', body: JSON.stringify(data) }),
  addReview: async (data: any) => {
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#/preview')) {
      return { review: { id: 'rev-' + Date.now(), ...data } };
    }
    return request<any>('/crm/reviews', { method: 'POST', body: JSON.stringify(data) });
  },
  requestReviews: (data?: any) => request<any>('/crm/reviews/request', { method: 'POST', body: data ? JSON.stringify(data) : undefined }),

  // Health
  health: () => request<any>('/health'),
};
