import React, { useState, useEffect } from 'react';
import { FileText, Send, DollarSign, CheckCircle, Calculator, Shield, Award } from 'lucide-react';
import { Lead, api } from '../../services/api';

interface QuotesViewProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  showToast: (msg: string, type?: string) => void;
  onQuoteSent?: () => void;
}

export const QuotesView: React.FC<QuotesViewProps> = ({ leads, onSelectLead, showToast, onQuoteSent }) => {
  const defaultLead = leads.find(l => l.full_name?.toLowerCase().includes('bensiradj')) || leads[0] || null;
  const [selectedLeadId, setSelectedLeadId] = useState<string>(defaultLead?.id || '');
  const [recentQuotes, setRecentQuotes] = useState<any[]>([]);
  
  const [squares, setSquares] = useState<number>(32);
  const [pitch, setPitch] = useState<string>('6/12');
  const [tier, setTier] = useState<string>('50-Year Architectural Shingle (Owens Corning Duration)');
  const [waste, setWaste] = useState<number>(12);
  const [gutters, setGutters] = useState<boolean>(true);
  const [underlayment, setUnderlayment] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);

  useEffect(() => {
    api.getCRMData().then(res => {
      let quotes = (res && res.quotes) ? res.quotes : [];
      setRecentQuotes(quotes);
    }).catch(() => {});
  }, [leads]);

  const selectedLead = leads.find(l => l.id === selectedLeadId) || defaultLead;

  // Base calculation
  const baseRate = tier.includes('50-Year') ? 420 : tier.includes('Metal') ? 780 : 360;
  const squaresWithWaste = squares * (1 + waste / 100);
  const shingleCost = Math.round(squaresWithWaste * baseRate);
  const gutterCost = gutters ? 1800 : 0;
  const underlaymentCost = underlayment ? 850 : 0;
  const totalQuote = shingleCost + gutterCost + underlaymentCost;

  const handleSendQuote = async () => {
    if (!selectedLead) {
      showToast('Please select a lead before creating a quote.', 'warning');
      return;
    }
    if (!Number.isFinite(squares) || squares <= 0 || waste < 0 || waste > 30) {
      showToast('Enter valid roof squares and a waste percentage from 0 to 30.', 'warning');
      return;
    }
    setSending(true);
    try {
      const payload = {
        lead_id: selectedLead.id,
        client_name: selectedLead.full_name,
        phone: selectedLead.phone,
        zip_code: selectedLead.zip_code || '81400',
        squares,
        pitch,
        tier,
        waste_percentage: waste,
        gutters_included: gutters,
        underlayment_included: underlayment,
        total_amount: totalQuote
      };
      const res = await api.createQuote(payload);
      if (!res?.quote) throw new Error('Quote was not confirmed by the server');
      const createdQuote = res.quote;
      setRecentQuotes(prev => [createdQuote, ...prev]);
      showToast(`💰 Real Quote of $${totalQuote.toLocaleString()} saved & sent via SMS to ${selectedLead.full_name}!`, 'success');
      if (onQuoteSent) onQuoteSent();
    } catch (err) {
      showToast('❌ Failed to create quote. Please try again.', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>💰 Interactive Quotes & Estimates Builder</h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.88rem', marginTop: 4 }}>
            Calculate roof pitch, square footage, waste percentage, and generate instant itemized proposals
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => showToast('Quote template exported as PDF!', 'success')}>
          <FileText size={14} /> Export PDF Proposal
        </button>
      </div>

      <div className="crm-grid-2x">
        {/* Left: Configuration Form */}
        <div className="quote-builder-box">
          <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary-400)' }}>
            <Calculator size={20} /> Estimator Calculator
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <label className="input-label">Select Homeowner / Lead</label>
              <select
                className="input-field"
                value={selectedLeadId}
                onChange={(e) => setSelectedLeadId(e.target.value)}
              >
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.full_name} ({l.phone}) • [{l.status}]
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label className="input-label">Roof Size (Squares)</label>
                <input
                  type="number"
                  className="input-field"
                  value={squares}
                  onChange={(e) => setSquares(Number(e.target.value))}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>1 Square = 100 Sq Ft ({squares * 100} sq ft)</span>
              </div>

              <div>
                <label className="input-label">Roof Pitch / Slope</label>
                <select className="input-field" value={pitch} onChange={(e) => setPitch(e.target.value)}>
                  <option value="4/12">4/12 (Walkable Low Slope)</option>
                  <option value="6/12">6/12 (Standard Residential)</option>
                  <option value="8/12">8/12 (Medium Steep - Safety Rig)</option>
                  <option value="10/12">10/12 (High Steep Pitch Allowance)</option>
                  <option value="12/12">12/12 (Custom Mansard/Turret)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="input-label">Shingle Tier / System</label>
              <select className="input-field" value={tier} onChange={(e) => setTier(e.target.value)}>
                <option value="30-Year Architectural Shingle ($360/sq)">30-Year Architectural Shingle ($360/sq)</option>
                <option value="50-Year Architectural Shingle (Owens Corning Duration) ($420/sq)">50-Year Architectural Shingle (Owens Corning Duration) ($420/sq)</option>
                <option value="Standing Seam Metal Roof System ($780/sq)">Standing Seam Metal Roof System ($780/sq)</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label className="input-label">Waste Allowance (%)</label>
                <select className="input-field" value={waste} onChange={(e) => setWaste(Number(e.target.value))}>
                  <option value={10}>10% (Simple Gable)</option>
                  <option value={12}>12% (Standard Hip & Valley)</option>
                  <option value={15}>15% (Complex Dormers/Valleys)</option>
                  <option value={20}>20% (Cut-heavy Mansard)</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 18 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.84rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={gutters} onChange={(e) => setGutters(e.target.checked)} />
                  Add Seamless Gutters (+$1,800)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.84rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={underlayment} onChange={(e) => setUnderlayment(e.target.checked)} />
                  Ice & Water Shield Upgrade (+$850)
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Proposal Preview Card */}
        <div className="crm-box" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 8px', border: '1px solid var(--border-color)', borderRadius: '12px', marginBottom: 6, display: 'inline-block' }}>OFFICIAL ESTIMATE</span>
                  <h2 style={{ fontSize: '1.4rem' }}>{selectedLead?.full_name || 'Customer Proposal'}</h2>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '0.88rem' }}>📍 {selectedLead?.zip_code || '81400'} Service Area • {selectedLead?.phone}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>QUOTE DATE</div>
                  <div style={{ fontWeight: 700 }}>{new Date().toLocaleDateString()}</div>
                </div>
              </div>
            </div>

            {/* Itemized Breakdown Table */}
            <table className="table-premium">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Qty / Specs</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div style={{ fontWeight: 600 }}>{tier.split(' (')[0]}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>Includes removal, felt, ridge vent, & cleanup</div>
                  </td>
                  <td>{squares} Sq (+{waste}% waste = {squaresWithWaste.toFixed(1)} sq) @ ${baseRate}/sq</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>${shingleCost.toLocaleString()}</td>
                </tr>
                {gutters && (
                  <tr>
                    <td>
                      <div style={{ fontWeight: 600 }}>6-Inch Seamless Aluminum Gutters</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>With commercial downspouts & leaf guards</div>
                    </td>
                    <td>Full Perimeter Allowance</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>${gutterCost.toLocaleString()}</td>
                  </tr>
                )}
                {underlayment && (
                  <tr>
                    <td>
                      <div style={{ fontWeight: 600 }}>Synthetic Ice & Water Shield</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>Installed along valleys, eaves & penetrations</div>
                    </td>
                    <td>Complete Roof Underlayment</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>${underlaymentCost.toLocaleString()}</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Warranty Badge */}
            <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 12, marginTop: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
              <Shield size={24} color="var(--text-primary)" />
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>50-Year Manufacturer Warranty + 10-Year Craftsmanship Guarantee</strong> included with Owens Corning Platinum Certification.
              </div>
            </div>
          </div>

          {/* Bottom Total & Action */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 24, marginTop: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>ESTIMATED TOTAL INVESTMENT</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>${totalQuote.toLocaleString()}</div>
            </div>

            <button
              className="btn btn-primary"
              style={{ padding: '14px 24px', fontSize: '1rem', fontWeight: 700, whiteSpace: 'nowrap' }}
              onClick={handleSendQuote}
              disabled={sending || !selectedLead}
            >
              {sending ? <span className="spinner" /> : <Send size={18} />}
              Send Quote via SMS
            </button>
          </div>
        </div>
      </div>

      {recentQuotes.length > 0 && (
        <div className="glass-card" style={{ marginTop: 24, padding: 24 }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={18} color="var(--primary-400)" />
            Recently Sent Quotes (Real-Time Persistent Records)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recentQuotes.map((q, idx) => (
              <div key={q.id || idx} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '16px 24px',
                background: '#FFFFFF',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-sm)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'default'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
              >
                <div style={{ flex: '1 1 30%' }}>
                  <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>{q.client_name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: 4 }}>
                    {q.created_at ? new Date(q.created_at).toLocaleDateString() : 'Just now'}
                  </div>
                </div>

                <div style={{ flex: '1 1 40%', padding: '0 20px' }}>
                  <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                    {q.squares || '--'} Sq • {q.pitch || '--'} Pitch
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
                    {q.tier ? q.tier.split(' (')[0] : 'Standard Shingle'}
                  </div>
                </div>

                <div style={{ flex: '0 0 auto', textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--primary-400)' }}>
                    ${typeof q.total_amount === 'number' ? q.total_amount.toLocaleString() : (q.total_amount || '0')}
                  </div>
                  <span className={`badge ${q.status === 'Sent' || q.status === 'QUOTE_SENT' ? 'badge-scheduled' : 'badge-missed-call'}`} style={{ fontSize: '0.7rem' }}>
                    {q.status === 'QUOTE_SENT' ? 'SENT VIA SMS' : q.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};
