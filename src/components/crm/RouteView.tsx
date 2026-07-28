import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock3,
  Fuel,
  GripVertical,
  Map as MapIcon,
  MapPin,
  MessageSquareText,
  Navigation,
  Phone,
  Plus,
  Route,
  Send,
  Sparkles,
  Timer,
  Trash2,
  Truck,
  Users,
  X,
} from 'lucide-react';
import { Lead, api } from '../../services/api';

interface RouteViewProps {
  leads: Lead[];
  showToast: (msg: string, type?: string) => void;
}

type StopStatus = 'planned' | 'en-route' | 'arrived' | 'completed';
type StopPriority = 'standard' | 'priority' | 'emergency';

interface RouteStop {
  id: string;
  lead_id?: string | null;
  stop_order: number;
  scheduled_date: string;
  time_slot: string;
  duration_minutes: number;
  stop_type: string;
  title: string;
  address: string;
  client_name: string;
  phone: string;
  distance_miles: number;
  drive_minutes: number;
  notes: string;
  crew: string;
  status: StopStatus;
  priority: StopPriority;
  eta_sent?: boolean;
  is_demo?: boolean;
}

const STORAGE_KEY = 'apex.route-planner.v2';
const CREWS = ['Mounir · Estimator', 'Crew Alpha', 'Crew Bravo'];
const STOP_TYPES = [
  'Storm inspection',
  'Roof inspection',
  'Emergency tarp',
  'Adjuster meeting',
  'Material drop',
  'Final walk-through',
];

const todayISO = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
};

const timeToMinutes = (value: string) => {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return 9 * 60;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3]?.toUpperCase();
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

const formatMinutes = (minutes: number) => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
};

const formatTimeFromMinutes = (minutes: number) => {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(mins).padStart(2, '0')} ${period}`;
};

const parseDistance = (value: unknown, fallback = 8.4) => {
  const parsed = Number.parseFloat(String(value ?? ''));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseDriveMinutes = (value: unknown, fallback = 14) => {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getZip = (address: string) => address.match(/\b\d{5}\b/)?.[0] ?? '99999';

const normalizeStop = (raw: any, index: number, selectedDate: string): RouteStop => ({
  id: String(raw.id ?? `local-${Date.now()}-${index}`),
  lead_id: raw.lead_id ?? null,
  stop_order: Number(raw.stop_order ?? index + 1),
  scheduled_date: raw.scheduled_date ?? selectedDate,
  time_slot: raw.time_slot ?? raw.time_window ?? raw.time ?? '9:00 AM',
  duration_minutes: Number(raw.duration_minutes ?? 60),
  stop_type: raw.stop_type ?? raw.type ?? 'Roof inspection',
  title: raw.title ?? raw.client_name ?? raw.client ?? 'Roof inspection',
  address: raw.address ?? 'Address required',
  client_name: raw.client_name ?? raw.client ?? 'Homeowner',
  phone: raw.phone ?? '',
  distance_miles: parseDistance(raw.distance_miles ?? raw.distance),
  drive_minutes: parseDriveMinutes(raw.drive_minutes ?? raw.drive_time),
  notes: raw.notes ?? '',
  crew: raw.crew ?? CREWS[0],
  status: raw.status ?? 'planned',
  priority: raw.priority ?? (String(raw.stop_type).toLowerCase().includes('emergency') ? 'emergency' : 'standard'),
  eta_sent: Boolean(raw.eta_sent),
  is_demo: Boolean(raw.is_demo),
});

const demoStops = (date: string): RouteStop[] => [
  {
    id: 'demo-stop-1',
    stop_order: 1,
    scheduled_date: date,
    time_slot: '8:30 AM',
    duration_minutes: 60,
    stop_type: 'Storm inspection',
    title: 'Hail damage inspection',
    address: '1420 Oak Ridge Drive, Dallas, TX 75218',
    client_name: 'Demo · Sarah Mitchell',
    phone: '(214) 555-0142',
    distance_miles: 6.8,
    drive_minutes: 16,
    notes: 'Inspect north slope and document hail strikes for the adjuster.',
    crew: CREWS[0],
    status: 'planned',
    priority: 'priority',
    is_demo: true,
  },
  {
    id: 'demo-stop-2',
    stop_order: 2,
    scheduled_date: date,
    time_slot: '10:15 AM',
    duration_minutes: 45,
    stop_type: 'Adjuster meeting',
    title: 'Insurance adjuster walk',
    address: '8904 Glenwood Lane, Dallas, TX 75228',
    client_name: 'Demo · James Carter',
    phone: '(214) 555-0189',
    distance_miles: 4.2,
    drive_minutes: 12,
    notes: 'Meet Statewide adjuster. Bring photo report and EagleView measurements.',
    crew: CREWS[0],
    status: 'planned',
    priority: 'standard',
    is_demo: true,
  },
  {
    id: 'demo-stop-3',
    stop_order: 3,
    scheduled_date: date,
    time_slot: '1:00 PM',
    duration_minutes: 90,
    stop_type: 'Emergency tarp',
    title: 'Emergency leak containment',
    address: '2641 Forest Bend Road, Garland, TX 75044',
    client_name: 'Demo · Maria Lopez',
    phone: '(972) 555-0161',
    distance_miles: 11.6,
    drive_minutes: 24,
    notes: 'Active leak above rear bedroom. Bring 20×30 tarp and moisture meter.',
    crew: 'Crew Alpha',
    status: 'planned',
    priority: 'emergency',
    is_demo: true,
  },
];

const nextStatus: Record<StopStatus, StopStatus> = {
  planned: 'en-route',
  'en-route': 'arrived',
  arrived: 'completed',
  completed: 'planned',
};

const statusLabel: Record<StopStatus, string> = {
  planned: 'Start drive',
  'en-route': 'Mark arrived',
  arrived: 'Complete stop',
  completed: 'Reopen',
};

export const RouteView: React.FC<RouteViewProps> = ({ leads, showToast }) => {
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [routeStops, setRouteStops] = useState<RouteStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingStop, setAddingStop] = useState(false);
  const [crewFilter, setCrewFilter] = useState('All crews');
  const [startLocation, setStartLocation] = useState('Apex Roofing HQ, Dallas, TX');
  const [draft, setDraft] = useState({
    lead_id: '',
    client_name: '',
    phone: '',
    address: '',
    time_slot: '9:00 AM',
    duration_minutes: 60,
    stop_type: STOP_TYPES[0],
    crew: CREWS[0],
    priority: 'standard' as StopPriority,
    notes: '',
  });

  useEffect(() => {
    let active = true;

    const loadPlan = async () => {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const saved = JSON.parse(stored) as { stops?: RouteStop[]; startLocation?: string };
          if (active && Array.isArray(saved.stops) && saved.stops.length) {
            setRouteStops(saved.stops.map((stop, index) => normalizeStop(stop, index, selectedDate)));
            if (saved.startLocation) setStartLocation(saved.startLocation);
          }
        } catch {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }

      try {
        const response = await api.getCRMData();
        const remoteStops = Array.isArray(response?.routes) ? response.routes : [];
        if (active && remoteStops.length) {
          setRouteStops(remoteStops.map((stop: any, index: number) => normalizeStop(stop, index, selectedDate)));
          return;
        }
      } catch {
        // The device plan below remains available when the CRM API is offline.
      } finally {
        if (active) setLoading(false);
      }

      if (!stored && active) {
        const scheduledLeads = leads.filter((lead) =>
          lead.status === 'INSPECTION_SCHEDULED' || Boolean(lead.inspection_date),
        );

        if (scheduledLeads.length) {
          setRouteStops(scheduledLeads.map((lead, index) => normalizeStop({
            id: `lead-${lead.id}`,
            lead_id: lead.id,
            stop_order: index + 1,
            scheduled_date: lead.inspection_date?.slice(0, 10) || selectedDate,
            time_slot: `${9 + index}:00 AM`,
            stop_type: 'Roof inspection',
            title: `${lead.full_name} inspection`,
            address: lead.address || `${lead.zip_code || ''} service area`.trim(),
            client_name: lead.full_name,
            phone: lead.phone,
            notes: lead.inspection_notes || 'Inspection scheduled from the lead pipeline.',
          }, index, selectedDate)));
        } else if (import.meta.env.DEV) {
          setRouteStops(demoStops(selectedDate));
        }
      }
    };

    void loadPlan();
    return () => {
      active = false;
    };
  }, [leads]);

  useEffect(() => {
    if (loading) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ stops: routeStops, startLocation }));
  }, [routeStops, startLocation, loading]);

  const dayStops = useMemo(() => {
    return routeStops
      .filter((stop) => stop.scheduled_date === selectedDate)
      .filter((stop) => crewFilter === 'All crews' || stop.crew === crewFilter)
      .sort((a, b) => a.stop_order - b.stop_order);
  }, [routeStops, selectedDate, crewFilter]);

  const totals = useMemo(() => {
    const miles = dayStops.reduce((sum, stop) => sum + stop.distance_miles, 0);
    const drive = dayStops.reduce((sum, stop) => sum + stop.drive_minutes, 0);
    const field = dayStops.reduce((sum, stop) => sum + stop.duration_minutes, 0);
    const completed = dayStops.filter((stop) => stop.status === 'completed').length;
    const firstStart = dayStops.length ? timeToMinutes(dayStops[0].time_slot) : 8 * 60;
    return {
      miles,
      drive,
      field,
      completed,
      finish: formatTimeFromMinutes(firstStart + drive + field),
      progress: dayStops.length ? Math.round((completed / dayStops.length) * 100) : 0,
    };
  }, [dayStops]);

  const setStop = (id: string, patch: Partial<RouteStop>) => {
    setRouteStops((current) => current.map((stop) => stop.id === id ? { ...stop, ...patch } : stop));
  };

  const reorderStops = (orderedStops: RouteStop[]) => {
    const orderMap = new Map(orderedStops.map((stop, index) => [stop.id, index + 1]));
    setRouteStops((current) => current.map((stop) =>
      orderMap.has(stop.id) ? { ...stop, stop_order: orderMap.get(stop.id)! } : stop,
    ));
  };

  const moveStop = (id: string, direction: -1 | 1) => {
    const index = dayStops.findIndex((stop) => stop.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= dayStops.length) return;
    const next = [...dayStops];
    [next[index], next[target]] = [next[target], next[index]];
    reorderStops(next);
  };

  const optimizeRoute = () => {
    if (dayStops.length < 2) {
      showToast('Add at least two stops before optimizing the route.', 'info');
      return;
    }

    const optimized = [...dayStops].sort((a, b) => {
      const emergencyDelta = Number(b.priority === 'emergency') - Number(a.priority === 'emergency');
      if (emergencyDelta) return emergencyDelta;
      const timeDelta = timeToMinutes(a.time_slot) - timeToMinutes(b.time_slot);
      if (Math.abs(timeDelta) >= 90) return timeDelta;
      return getZip(a.address).localeCompare(getZip(b.address));
    });

    reorderStops(optimized);
    showToast('Route grouped by service area while protecting appointment windows.', 'success');
  };

  const handleLeadSelection = (leadId: string) => {
    const lead = leads.find((item) => item.id === leadId);
    setDraft((current) => ({
      ...current,
      lead_id: leadId,
      client_name: lead?.full_name ?? '',
      phone: lead?.phone ?? '',
      address: lead?.address || lead?.zip_code || '',
      notes: lead?.inspection_notes ?? '',
    }));
  };

  const addStop = async () => {
    const address = draft.address.trim();
    const looksLikeCompleteAddress = address.length >= 8 && /[A-Za-z]/.test(address) && /\d/.test(address);
    if (!draft.client_name.trim() || !looksLikeCompleteAddress) {
      showToast('Add a homeowner name and a complete service address.', 'error');
      return;
    }

    const payload = {
      lead_id: draft.lead_id || null,
      client_name: draft.client_name.trim(),
      phone: draft.phone.trim(),
      address,
      time_slot: draft.time_slot,
      stop_type: draft.stop_type,
      title: `${draft.client_name.trim()} · ${draft.stop_type}`,
      notes: draft.notes.trim(),
    };

    let createdId = `local-${Date.now()}`;
    try {
      const response = await api.addRouteStop(payload);
      if (response?.routeStop?.id) createdId = response.routeStop.id;
      showToast('Stop added to the CRM route and saved on this device.', 'success');
    } catch {
      showToast('CRM is offline. The stop is saved on this device.', 'info');
    }

    const newStop: RouteStop = {
      id: createdId,
      lead_id: draft.lead_id || null,
      stop_order: dayStops.length + 1,
      scheduled_date: selectedDate,
      time_slot: draft.time_slot,
      duration_minutes: draft.duration_minutes,
      stop_type: draft.stop_type,
      title: `${draft.client_name.trim()} · ${draft.stop_type}`,
      address,
      client_name: draft.client_name.trim(),
      phone: draft.phone.trim(),
      distance_miles: 0,
      drive_minutes: 0,
      notes: draft.notes.trim(),
      crew: draft.crew,
      status: 'planned',
      priority: draft.priority,
    };

    setRouteStops((current) => [...current, newStop]);
    setAddingStop(false);
    setDraft({
      lead_id: '',
      client_name: '',
      phone: '',
      address: '',
      time_slot: '9:00 AM',
      duration_minutes: 60,
      stop_type: STOP_TYPES[0],
      crew: CREWS[0],
      priority: 'standard',
      notes: '',
    });
  };

  const removeStop = (id: string) => {
    const remaining = dayStops.filter((stop) => stop.id !== id);
    setRouteStops((current) => current.filter((stop) => stop.id !== id));
    reorderStops(remaining);
    showToast('Stop removed from this device plan.', 'info');
  };

  const openRouteInMaps = () => {
    const mappableStops = dayStops.filter((stop) => stop.address && stop.address !== 'Address required');
    if (!mappableStops.length) {
      showToast('Add a complete address before opening navigation.', 'error');
      return;
    }

    const capped = mappableStops.slice(0, 9);
    const destination = capped[capped.length - 1].address;
    const waypoints = capped.slice(0, -1).map((stop) => stop.address).join('|');
    const query = new URLSearchParams({
      api: '1',
      origin: startLocation,
      destination,
      travelmode: 'driving',
    });
    if (waypoints) query.set('waypoints', waypoints);

    window.open(`https://www.google.com/maps/dir/?${query.toString()}`, '_blank', 'noopener,noreferrer');
    if (mappableStops.length > 9) {
      showToast('Google Maps opened the first 9 stops. Split larger routes by crew.', 'info');
    }
  };

  const openSingleStop = (stop: RouteStop) => {
    const query = new URLSearchParams({ api: '1', destination: stop.address, travelmode: 'driving' });
    window.open(`https://www.google.com/maps/dir/?${query.toString()}`, '_blank', 'noopener,noreferrer');
  };

  const composeOnMyWay = (stop: RouteStop) => {
    if (!stop.phone) {
      showToast('Add a phone number before sending an ETA.', 'error');
      return;
    }
    const body = encodeURIComponent(
      `Hi ${stop.client_name.split(' ')[0]}, this is Apex Roofing. We are on the way to ${stop.address}. Estimated arrival: ${stop.time_slot}.`,
    );
    window.location.href = `sms:${stop.phone}?body=${body}`;
  };

  const sendRouteETAs = async () => {
    const recipients = dayStops.filter((stop) => stop.phone && stop.status !== 'completed');
    if (!recipients.length) {
      showToast('There are no active stops with phone numbers.', 'error');
      return;
    }

    try {
      await api.sendRouteETAs();
      setRouteStops((current) => current.map((stop) =>
        recipients.some((recipient) => recipient.id === stop.id) ? { ...stop, eta_sent: true } : stop,
      ));
      showToast(`ETA notifications sent to ${recipients.length} homeowner${recipients.length === 1 ? '' : 's'}.`, 'success');
    } catch {
      showToast('ETA service is offline. Use “Text ETA” on each stop instead.', 'error');
    }
  };

  const activeStop = dayStops.find((stop) => stop.status === 'en-route' || stop.status === 'arrived');
  const isDemoPlan = dayStops.some((stop) => stop.is_demo);

  return (
    <div className="route-planner">
      <div className="page-header route-page-header">
        <div>
          <span className="page-eyebrow">Field operations</span>
          <h1>Daily Route Planner</h1>
          <p>Build a practical field schedule, guide each crew, and keep homeowners informed.</p>
        </div>
        <div className="page-actions route-header-actions">
          <button className="btn btn-ghost btn-sm" onClick={sendRouteETAs}>
            <Send size={14} /> Send route ETAs
          </button>
          <button className="btn btn-primary btn-sm" onClick={openRouteInMaps}>
            <Navigation size={14} /> Open full route
          </button>
        </div>
      </div>

      <div className="route-toolbar">
        <label className="route-control">
          <span><CalendarDays size={14} /> Route date</span>
          <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
        </label>
        <label className="route-control">
          <span><Users size={14} /> Crew view</span>
          <select value={crewFilter} onChange={(event) => setCrewFilter(event.target.value)}>
            <option>All crews</option>
            {CREWS.map((crew) => <option key={crew}>{crew}</option>)}
          </select>
        </label>
        <label className="route-control route-control-grow">
          <span><Truck size={14} /> Start location</span>
          <input value={startLocation} onChange={(event) => setStartLocation(event.target.value)} />
        </label>
        <button className="route-optimize-button" onClick={optimizeRoute}>
          <Sparkles size={15} /> Optimize order
        </button>
      </div>

      {isDemoPlan && (
        <div className="route-demo-banner">
          <Circle size={8} fill="currentColor" />
          You are viewing a demo day plan. Add a real lead or custom stop to start using it.
        </div>
      )}

      <div className="route-kpi-grid">
        <article className="route-kpi">
          <span><Route size={17} /></span>
          <div><strong>{dayStops.length}</strong><small>Stops scheduled</small></div>
        </article>
        <article className="route-kpi">
          <span><Navigation size={17} /></span>
          <div><strong>{totals.miles.toFixed(1)} mi</strong><small>Planned distance</small></div>
        </article>
        <article className="route-kpi">
          <span><Timer size={17} /></span>
          <div><strong>{formatMinutes(totals.drive)}</strong><small>Drive time</small></div>
        </article>
        <article className="route-kpi">
          <span><Clock3 size={17} /></span>
          <div><strong>{totals.finish}</strong><small>Estimated finish</small></div>
        </article>
      </div>

      {addingStop && (
        <section className="route-add-panel" aria-label="Add a route stop">
          <div className="route-add-panel-heading">
            <div>
              <span className="page-eyebrow">New appointment</span>
              <h2>Add a stop to this route</h2>
            </div>
            <button className="route-icon-button" onClick={() => setAddingStop(false)} aria-label="Close add stop panel">
              <X size={18} />
            </button>
          </div>

          <div className="route-form-grid">
            <label>
              <span>Lead from pipeline <small>Optional</small></span>
              <select value={draft.lead_id} onChange={(event) => handleLeadSelection(event.target.value)}>
                <option value="">Custom stop</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>{lead.full_name} · {lead.status}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Homeowner or job name</span>
              <input
                value={draft.client_name}
                onChange={(event) => setDraft((current) => ({ ...current, client_name: event.target.value }))}
                placeholder="e.g. Sarah Mitchell"
              />
            </label>
            <label className="route-form-wide">
              <span>Complete service address</span>
              <input
                value={draft.address}
                onChange={(event) => setDraft((current) => ({ ...current, address: event.target.value }))}
                placeholder="Street, city, state, ZIP"
              />
            </label>
            <label>
              <span>Phone</span>
              <input
                type="tel"
                value={draft.phone}
                onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))}
                placeholder="(214) 555-0123"
              />
            </label>
            <label>
              <span>Appointment time</span>
              <input
                type="time"
                value={draft.time_slot.match(/^\d{2}:\d{2}$/) ? draft.time_slot : '09:00'}
                onChange={(event) => setDraft((current) => ({ ...current, time_slot: event.target.value }))}
              />
            </label>
            <label>
              <span>Expected duration</span>
              <select
                value={draft.duration_minutes}
                onChange={(event) => setDraft((current) => ({ ...current, duration_minutes: Number(event.target.value) }))}
              >
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
              </select>
            </label>
            <label>
              <span>Stop type</span>
              <select value={draft.stop_type} onChange={(event) => setDraft((current) => ({ ...current, stop_type: event.target.value }))}>
                {STOP_TYPES.map((type) => <option key={type}>{type}</option>)}
              </select>
            </label>
            <label>
              <span>Assigned crew</span>
              <select value={draft.crew} onChange={(event) => setDraft((current) => ({ ...current, crew: event.target.value }))}>
                {CREWS.map((crew) => <option key={crew}>{crew}</option>)}
              </select>
            </label>
            <label>
              <span>Priority</span>
              <select
                value={draft.priority}
                onChange={(event) => setDraft((current) => ({ ...current, priority: event.target.value as StopPriority }))}
              >
                <option value="standard">Standard</option>
                <option value="priority">Priority</option>
                <option value="emergency">Emergency</option>
              </select>
            </label>
            <label className="route-form-wide">
              <span>Crew notes</span>
              <textarea
                rows={3}
                value={draft.notes}
                onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Gate code, roof access, materials, adjuster details…"
              />
            </label>
          </div>
          <div className="route-add-actions">
            <span>Changes are saved on this device. CRM stops also sync when the server is available.</span>
            <button className="btn btn-primary" onClick={addStop}><Plus size={15} /> Add to route</button>
          </div>
        </section>
      )}

      <div className="route-workspace">
        <section className="route-stops-panel">
          <div className="route-panel-heading">
            <div>
              <h2>{new Date(`${selectedDate}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
              <p>{crewFilter === 'All crews' ? 'All field crews' : crewFilter} · {dayStops.length} stops</p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setAddingStop(true)}>
              <Plus size={14} /> Add stop
            </button>
          </div>

          {loading ? (
            <div className="route-loading"><span className="spinner" /> Loading day plan…</div>
          ) : dayStops.length === 0 ? (
            <div className="route-empty">
              <span><MapPin size={26} /></span>
              <h3>No stops scheduled</h3>
              <p>Add a pipeline lead or a custom service stop to build this route.</p>
              <button className="btn btn-primary" onClick={() => setAddingStop(true)}><Plus size={15} /> Add first stop</button>
            </div>
          ) : (
            <div className="route-stop-list">
              {dayStops.map((stop, index) => (
                <article key={stop.id} className={`route-stop-card is-${stop.status} priority-${stop.priority}`}>
                  <div className="route-order-controls">
                    <GripVertical size={15} />
                    <strong>{index + 1}</strong>
                    <button onClick={() => moveStop(stop.id, -1)} disabled={index === 0} aria-label={`Move ${stop.client_name} earlier`}>
                      <ArrowUp size={13} />
                    </button>
                    <button onClick={() => moveStop(stop.id, 1)} disabled={index === dayStops.length - 1} aria-label={`Move ${stop.client_name} later`}>
                      <ArrowDown size={13} />
                    </button>
                  </div>

                  <div className="route-stop-time">
                    <strong>{stop.time_slot}</strong>
                    <span>{stop.duration_minutes} min</span>
                    {stop.status === 'completed' && <i><Check size={12} /> Done</i>}
                  </div>

                  <div className="route-stop-main">
                    <div className="route-stop-title-row">
                      <div>
                        <span className={`route-priority-dot ${stop.priority}`} />
                        <h3>{stop.title}</h3>
                      </div>
                      <span className="route-type-badge">{stop.stop_type}</span>
                    </div>
                    <p className="route-client">{stop.client_name} · {stop.crew}</p>
                    <button className="route-address" onClick={() => openSingleStop(stop)}>
                      <MapPin size={14} /> {stop.address} <ChevronRight size={13} />
                    </button>
                    <div className="route-meta-row">
                      <span><Navigation size={13} /> {stop.distance_miles.toFixed(1)} mi</span>
                      <span><Clock3 size={13} /> {stop.drive_minutes} min drive</span>
                      {stop.phone && <a href={`tel:${stop.phone}`}><Phone size={13} /> {stop.phone}</a>}
                      {stop.eta_sent && <span className="route-eta-sent"><CheckCircle2 size={13} /> ETA sent</span>}
                    </div>
                    {stop.notes && <p className="route-notes">{stop.notes}</p>}
                  </div>

                  <div className="route-stop-actions">
                    <button className="route-secondary-action" onClick={() => composeOnMyWay(stop)}>
                      <MessageSquareText size={14} /> Text ETA
                    </button>
                    <button className="route-secondary-action" onClick={() => openSingleStop(stop)}>
                      <Navigation size={14} /> Navigate
                    </button>
                    <button
                      className={`route-status-action is-${stop.status}`}
                      onClick={() => setStop(stop.id, { status: nextStatus[stop.status] })}
                    >
                      {stop.status === 'completed' ? <Circle size={13} /> : <CheckCircle2 size={13} />}
                      {statusLabel[stop.status]}
                    </button>
                    <button className="route-delete-action" onClick={() => removeStop(stop.id)} aria-label={`Remove ${stop.client_name} from route`}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="route-day-panel">
          <div className="route-day-panel-top">
            <span className="page-eyebrow">Day overview</span>
            <h2>{totals.progress}% complete</h2>
            <div className="route-progress"><span style={{ width: `${totals.progress}%` }} /></div>
            <p>{totals.completed} of {dayStops.length} stops finished</p>
          </div>

          {activeStop ? (
            <div className="route-active-stop">
              <span>{activeStop.status === 'en-route' ? 'Currently driving' : 'Crew on site'}</span>
              <strong>{activeStop.client_name}</strong>
              <p>{activeStop.address}</p>
              <button onClick={() => openSingleStop(activeStop)}><Navigation size={14} /> Open navigation</button>
            </div>
          ) : (
            <div className="route-active-stop is-idle">
              <span>Next action</span>
              <strong>{dayStops.find((stop) => stop.status === 'planned')?.client_name || 'Route complete'}</strong>
              <p>{dayStops.find((stop) => stop.status === 'planned')?.time_slot || 'All scheduled work is finished.'}</p>
            </div>
          )}

          <dl className="route-day-summary">
            <div><dt><Timer size={14} /> Field work</dt><dd>{formatMinutes(totals.field)}</dd></div>
            <div><dt><Navigation size={14} /> Driving</dt><dd>{formatMinutes(totals.drive)}</dd></div>
            <div><dt><Fuel size={14} /> Route miles</dt><dd>{totals.miles.toFixed(1)} mi</dd></div>
            <div><dt><Clock3 size={14} /> Finish by</dt><dd>{totals.finish}</dd></div>
          </dl>

          <div className="route-day-tip">
            <MapIcon size={17} />
            <div>
              <strong>Before the crew leaves</strong>
              <p>Confirm addresses, appointment windows, roof access, and required materials.</p>
            </div>
          </div>

          <button className="route-map-button" onClick={openRouteInMaps}>
            <Navigation size={16} /> Launch route in Google Maps
          </button>
        </aside>
      </div>
    </div>
  );
};
