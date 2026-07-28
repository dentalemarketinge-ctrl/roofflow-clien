import React, { useState, useEffect } from 'react';
import { HardHat, Users, CheckCircle, Clock, MapPin, Award, Plus, Shield } from 'lucide-react';
import { api } from '../../services/api';

interface TeamViewProps {
  showToast: (msg: string, type?: string) => void;
}

export const TeamView: React.FC<TeamViewProps> = ({ showToast }) => {
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  useEffect(() => {
    api.getCRMData().then(res => {
      if (res && res.teamMembers && res.teamMembers.length > 0) {
        setTeamMembers(res.teamMembers);
      }
    }).catch(() => {});
  }, []);

  const [showAddForm, setShowAddForm] = useState(false);
  const [teamName, setTeamName] = useState('Alex Hernandez');
  const [teamRole, setTeamRole] = useState('Field Hail Inspector & Estimator');
  const [teamPhone, setTeamPhone] = useState('469-555-0144');
  const [teamEmail, setTeamEmail] = useState('alex@apexroofing.com');
  const [teamStatus, setTeamStatus] = useState('🟢 Active in Field');
  const [teamCerts, setTeamCerts] = useState('HAAG Certified Hail Inspector, OSHA 30 Safety');

  const handleAddTeamMember = async () => {
    if (!teamName.trim()) {
      showToast('⚠️ Please enter a name for the team member!', 'warning');
      return;
    }
    try {
      const certList = teamCerts.split(',').map(c => c.trim()).filter(Boolean);
      const payload = {
        name: teamName,
        role: teamRole,
        phone: teamPhone,
        email: teamEmail,
        status: teamStatus,
        active_jobs: 1,
        quoted_volume: '$12,500',
        conversion_rate: '60%',
        certifications: certList.length > 0 ? certList : ['HAAG Certified Inspector']
      };
      const res = await api.addTeamMember(payload);
      if (res && res.teamMember) {
        setTeamMembers(prev => [res.teamMember, ...prev]);
      } else {
        const resAll = await api.getCRMData();
        if (resAll && resAll.teamMembers) setTeamMembers(resAll.teamMembers);
      }
      showToast(`👷 Real estimator ${teamName} added to database & invited via SMS!`, 'success');
      setShowAddForm(false);
    } catch (err) {
      showToast('❌ Failed to add team member to database', 'error');
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>👷 Field Team & Estimator Management</h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.88rem', marginTop: 4 }}>
            Monitor active field estimators, production crew assignments, certifications, and live GPS jobsite status
          </p>
        </div>
        <button className={`btn ${showAddForm ? 'btn-ghost' : 'btn-primary'} btn-sm`} onClick={() => setShowAddForm(!showAddForm)}>
          <Plus size={14} /> {showAddForm ? 'Cancel' : 'Add Estimator / Crew'}
        </button>
      </div>

      {/* Add Team Member Form Box */}
      {showAddForm && (
        <div className="crm-box" style={{ marginBottom: 24, border: '1px dashed var(--primary-500)', background: 'rgba(59, 130, 246, 0.04)' }}>
          <h3 style={{ fontSize: '1.05rem', color: 'var(--primary-400)', marginBottom: 12 }}>
            👷 Onboard New Field Estimator or Crew Supervisor
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
            <div>
              <label className="input-label">Full Name</label>
              <input
                type="text"
                className="input-field"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Alex Hernandez"
              />
            </div>

            <div>
              <label className="input-label">Role & Title</label>
              <select
                className="input-field"
                value={teamRole}
                onChange={(e) => setTeamRole(e.target.value)}
              >
                <option value="Field Hail Inspector & Estimator">Field Hail Inspector & Estimator</option>
                <option value="Production Crew Supervisor (Team Alpha)">Production Crew Supervisor</option>
                <option value="Senior Commercial Roof Auditor">Senior Commercial Roof Auditor</option>
                <option value="Insurance Claim Walkthrough Specialist">Insurance Claim Specialist</option>
              </select>
            </div>

            <div>
              <label className="input-label">Phone Number</label>
              <input
                type="text"
                className="input-field"
                value={teamPhone}
                onChange={(e) => setTeamPhone(e.target.value)}
                placeholder="469-555-0144"
              />
            </div>

            <div>
              <label className="input-label">Email Address</label>
              <input
                type="text"
                className="input-field"
                value={teamEmail}
                onChange={(e) => setTeamEmail(e.target.value)}
                placeholder="alex@apexroofing.com"
              />
            </div>

            <div>
              <label className="input-label">Status & Availability</label>
              <select
                className="input-field"
                value={teamStatus}
                onChange={(e) => setTeamStatus(e.target.value)}
              >
                <option value="🟢 Active in Field (On-Duty)">🟢 Active in Field (On-Duty)</option>
                <option value="🟢 On Jobsite (Active Crew)">🟢 On Jobsite (Active Crew)</option>
                <option value="🟡 On Break / Transit">🟡 On Break / Transit</option>
              </select>
            </div>

            <div>
              <label className="input-label">Certifications (comma separated)</label>
              <input
                type="text"
                className="input-field"
                value={teamCerts}
                onChange={(e) => setTeamCerts(e.target.value)}
                placeholder="HAAG Certified, OSHA 30"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
            <button
              className="btn btn-primary"
              style={{ fontWeight: 600 }}
              onClick={handleAddTeamMember}
            >
              👷 Confirm & Invite Team Member via SMS
            </button>
          </div>
        </div>
      )}

      <div className="crm-grid-2x">
        {teamMembers.map((member) => {
          const memName = member.name || 'Estimator';
          const memRole = member.role || 'Roofing Estimator';
          const memStatus = member.status || '🟢 Active';
          const activeJobs = member.active_jobs || member.activeJobs || 0;
          const quotedVol = member.quoted_volume || member.quotedVolume || '$0';
          const convRate = member.conversion_rate || member.conversionRate || '50%';
          const certs = Array.isArray(member.certifications) ? member.certifications : ['HAAG Certified Inspector', 'Owens Corning Platinum'];
          return (
          <div key={member.id} className="crm-box" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: memName.includes('AI') ? 'linear-gradient(135deg, #f59e0b, #ea580c)' : 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.4rem', fontWeight: 800, color: 'white'
                  }}>
                    {memName.includes('AI') ? '🤖' : memName.split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.15rem' }}>{memName}</h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: 2 }}>{memRole}</div>
                  </div>
                </div>
                <span className="badge" style={{ background: memStatus.includes('🟢') || memStatus.includes('⚡') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: memStatus.includes('🟢') || memStatus.includes('⚡') ? 'var(--accent-400)' : 'var(--warning-400)', fontSize: '0.75rem' }}>
                  {memStatus}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, background: 'var(--bg-tertiary)', padding: 12, borderRadius: 'var(--radius-md)', margin: '14px 0' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>ACTIVE JOBS</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-400)' }}>{activeJobs}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>QUOTED / VOL</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{quotedVol}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>CONVERSION</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-400)' }}>{convRate}</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)' }}>CERTIFICATIONS & SPECIALTIES:</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {certs.map((cert: string) => (
                    <span key={cert} className="badge badge-quoted" style={{ fontSize: '0.7rem' }}>
                      <Shield size={10} style={{ marginRight: 4 }} /> {cert}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 14, marginTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>📞 {member.phone}</span>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => showToast(`GPS tracking & job dispatch opened for ${memName}`, 'info')}
              >
                Dispatch Jobs →
              </button>
            </div>
          </div>
          );
        })}
      </div>
    </>
  );
};
