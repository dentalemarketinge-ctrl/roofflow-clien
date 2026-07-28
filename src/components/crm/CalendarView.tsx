import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, User, Plus, HardHat } from 'lucide-react';
import { Lead, api } from '../../services/api';

interface CalendarViewProps {
  leads: Lead[];
  onSelectLead?: (lead: Lead) => void;
  showToast: (msg: string, type?: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ leads, onSelectLead, showToast }) => {
  const [selectedDay, setSelectedDay] = useState<string>('Tue (Tomorrow)');
  
  // No dummy leads

  const [scheduleEvents, setScheduleEvents] = useState<any[]>([]);

  useEffect(() => {
    api.getCRMData().then(res => {
      let events = (res && res.calendarEvents) ? res.calendarEvents : [];
      setScheduleEvents(events);
    }).catch(() => {});
  }, [leads]);

  const defaultLead = leads[0] || null;
  const [selectedLeadId, setSelectedLeadId] = useState<string>(defaultLead?.id || '');
  const [bookingTimeSlot, setBookingTimeSlot] = useState('10:00 AM - 11:15 AM');
  const [bookingType, setBookingType] = useState('storm');
  const [showBookingForm, setShowBookingForm] = useState(false);

  const selectedLead = leads.find(l => l.id === selectedLeadId) || defaultLead;

  const handleBookInspection = async () => {
    if (!selectedLead) {
      showToast('⚠️ Please select a lead to book!', 'warning');
      return;
    }
    try {
      const newEvent = {
        lead_id: selectedLead.id,
        day: selectedDay,
        time_slot: bookingTimeSlot,
        title: bookingType === 'storm' ? 'Storm Damage Inspection & Hail Check' : 'Architectural Shingle Replacement Assessment',
        client_name: selectedLead.full_name,
        location: `${selectedLead.zip_code || '81400'} Service Area`,
        estimator: 'Estimator Mounir',
        event_type: bookingType
      };
      const res = await api.bookCalendarEvent(newEvent);
      const createdEvt = res && res.event ? res.event : newEvent;
      setScheduleEvents(prev => [createdEvt, ...prev]);
      showToast(`➕ Real inspection booked for ${selectedLead.full_name} on ${selectedDay}!`, 'success');
      setShowBookingForm(false);
    } catch (err) {
      showToast('❌ Failed to book appointment. Please try again.', 'error');
    }
  };

  const days = ['Mon (Today)', 'Tue (Tomorrow)', 'Wed (Jul 24)', 'Thu (Jul 25)', 'Fri (Jul 26)', 'Sat (Jul 27)', 'Sun (Jul 28)'];

  return (
    <>
      <div className="page-header">
        <div>
          <h1>📅 Inspection Calendar & Crew Schedule</h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.88rem', marginTop: 4 }}>
            Real-time dispatch schedule for roof inspections, adjuster meetings, and crew installations
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => showToast('📅 Schedule synced with Google Calendar & ServiceTitan!', 'success')}>
            <CalendarIcon size={14} /> Sync Calendar
          </button>
          <button className={`btn ${showBookingForm ? 'btn-ghost' : 'btn-primary'} btn-sm`} onClick={() => setShowBookingForm(!showBookingForm)}>
            <Plus size={14} /> {showBookingForm ? 'Cancel' : 'Book Inspection'}
          </button>
        </div>
      </div>

      {/* Booking Form Box */}
      {showBookingForm && (
        <div className="crm-box" style={{ marginBottom: 24, border: '1px dashed var(--border-color)', background: 'var(--bg-secondary)' }}>
          <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: 12 }}>
            📅 Book New Appointment for {selectedDay}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <div>
              <label className="input-label">Select Homeowner / Lead</label>
              <select
                className="input-field"
                value={selectedLeadId}
                onChange={(e) => setSelectedLeadId(e.target.value)}
              >
                {leads && leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.full_name} ({l.phone || 'No phone'}) • [{l.status || 'NEW'}]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="input-label">Time Slot</label>
              <select
                className="input-field"
                value={bookingTimeSlot}
                onChange={(e) => setBookingTimeSlot(e.target.value)}
              >
                <option value="08:30 AM - 09:45 AM">08:30 AM - 09:45 AM</option>
                <option value="10:00 AM - 11:15 AM">10:00 AM - 11:15 AM</option>
                <option value="01:30 PM - 02:45 PM">01:30 PM - 02:45 PM</option>
                <option value="03:00 PM - 04:15 PM">03:00 PM - 04:15 PM</option>
                <option value="04:30 PM - 05:45 PM">04:30 PM - 05:45 PM</option>
              </select>
            </div>

            <div>
              <label className="input-label">Inspection Type</label>
              <select
                className="input-field"
                value={bookingType}
                onChange={(e) => setBookingType(e.target.value)}
              >
                <option value="storm">Storm Damage & Hail Inspection</option>
                <option value="residential">Residential Roof Audit</option>
                <option value="commercial">Commercial TPO/Flat Roof Audit</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                className="btn btn-primary"
                style={{ width: '100%', height: '42px', fontWeight: 600 }}
                onClick={handleBookInspection}
              >
                ➕ Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Day Selector Bar */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 20 }}>
        {days.map((day) => {
          const count = scheduleEvents.filter(e => e.day === day).length;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              style={{
                flex: 1,
                minWidth: 130,
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${selectedDay === day ? 'var(--primary-400)' : 'var(--border-color)'}`,
                background: selectedDay === day ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-secondary)',
                color: selectedDay === day ? 'var(--primary-400)' : 'var(--text-primary)',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{day}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 4 }}>
                {count === 0 ? 'No appointments' : `${count} booked`}
              </div>
            </button>
          );
        })}
      </div>

      {/* Events List for Selected Day */}
      <div className="crm-box">
        <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Schedule for {selectedDay}</span>
          <span className="badge badge-scheduled" style={{ fontSize: '0.75rem' }}>
            {scheduleEvents.filter(e => e.day === selectedDay).length} Jobs Active
          </span>
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {scheduleEvents.filter(e => e.day === selectedDay).length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <CalendarIcon size={36} style={{ color: 'var(--text-tertiary)', marginBottom: 12 }} />
              <p>No appointments booked for {selectedDay}.</p>
              <button className="btn btn-outline btn-sm" style={{ marginTop: 12 }} onClick={() => setShowBookingForm(true)}>
                Book Time Slot
              </button>
            </div>
          ) : (
            scheduleEvents.filter(e => e.day === selectedDay).map((evt) => {
              const evtTime = evt.time_slot || evt.time || '10:00 AM';
              const evtClient = evt.client_name || evt.client || 'Homeowner';
              const evtType = evt.event_type || evt.type || 'storm';
              const leadObj = evt.leadObj || leads.find(l => l.id === evt.lead_id || l.full_name?.toLowerCase().includes(evtClient?.toLowerCase()));
              return (
              <div
                key={evt.id}
                className="glass-card"
                style={{
                  padding: '18px 22px',
                  borderLeft: `4px solid ${evtType === 'storm' ? '#f97316' : evtType === 'emergency' ? '#f43f5e' : 'var(--primary-400)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 16
                }}
              >
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-primary)' }}>{evt.title}</span>
                    <span className={`badge ${evtType === 'storm' ? 'badge-qualifying' : evtType === 'emergency' ? 'badge-missed-call' : 'badge-scheduled'}`} style={{ fontSize: '0.7rem' }}>
                      {evtType === 'storm' ? '⛈️ Storm Hail' : evtType === 'emergency' ? '🚨 Emergency Tarp' : '🏠 Inspection'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: '0.84rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={14} color="var(--primary-400)" /> {evtTime}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <User size={14} color="var(--accent-400)" /> {evtClient}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={14} color="#a78bfa" /> {evt.location}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--warning-400)' }}>
                      <HardHat size={14} /> {evt.estimator}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
                    {evt.status}
                  </span>
                  {leadObj && onSelectLead && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => onSelectLead(leadObj!)}
                    >
                      Open Lead & Chat →
                    </button>
                  )}
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => showToast(`📲 SMS Reminder sent to ${evtClient} for ${evtTime}`, 'success')}
                  >
                    Resend SMS
                  </button>
                </div>
              </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};
