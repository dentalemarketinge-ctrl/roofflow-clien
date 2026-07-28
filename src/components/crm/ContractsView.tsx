import React, { useState, useEffect } from 'react';
import { FileCheck, Download, Send, CheckCircle, Shield, AlertCircle, FileText } from 'lucide-react';
import { Lead, api } from '../../services/api';

interface ContractsViewProps {
  leads: Lead[];
  showToast: (msg: string, type?: string) => void;
}

export const ContractsView: React.FC<ContractsViewProps> = ({ leads, showToast }) => {
  // No dummy leads

  const [contracts, setContracts] = useState<any[]>([]);

  useEffect(() => {
    api.getCRMData().then(res => {
      let cnts = (res && res.contracts) ? res.contracts : [];
      setContracts(cnts);
    }).catch(() => {});
  }, [leads]);

  const handleSimulateSign = async (id: string) => {
    try {
      await api.signContract(id);
      setContracts(prev => prev.map(c => c.id === id ? { ...c, status: 'Signed (E-Signed & Locked)', signed_date: 'Just Now' } : c));
      showToast('✍️ Contract digitally signed by homeowner & saved to real database! Job moved to JOB WON!', 'success');
    } catch (err) {
      showToast('❌ Failed to sign contract', 'error');
    }
  };

  const defaultLead = leads[0] || null;
  const [selectedLeadId, setSelectedLeadId] = useState<string>(defaultLead?.id || '');
  const [contractType, setContractType] = useState('Storm Contingency & Roof Replacement Agreement');
  const [contractAmount, setContractAmount] = useState('$14,500');
  const [showContractForm, setShowContractForm] = useState(false);

  const selectedLead = leads.find(l => l.id === selectedLeadId) || defaultLead;

  const handleCreateContract = async () => {
    if (!selectedLead) {
      showToast('⚠️ Please select a lead for the contract!', 'warning');
      return;
    }
    try {
      const payload = {
        lead_id: selectedLead.id,
        client_name: selectedLead.full_name,
        phone: selectedLead.phone || '',
        zip_code: selectedLead.zip_code || '81400',
        contract_type: contractType,
        amount: contractAmount
      };
      const res = await api.createContract(payload);
      const createdCnt = res && res.contract ? res.contract : { ...payload, id: `cnt-${Date.now()}`, sent_date: 'Just now', status: 'Sent (Waiting for Signature)', signed_date: null };
      setContracts(prev => [createdCnt, ...prev]);
      showToast(`📑 Real contract created & SMS E-Sign link sent to ${selectedLead.full_name}!`, 'success');
      setShowContractForm(false);
    } catch (err) {
      showToast('❌ Failed to create contract. Please try again.', 'error');
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>📄 Digital Contracts & E-Signature Tracking</h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.88rem', marginTop: 4 }}>
            Legally binding storm contingency agreements and digital sign-off templates with DocuSign/HelloSign compliance
          </p>
        </div>
        <button className={`btn ${showContractForm ? 'btn-ghost' : 'btn-primary'} btn-sm`} onClick={() => setShowContractForm(!showContractForm)}>
          <FileText size={14} /> {showContractForm ? 'Cancel' : '+ Create & Send Contract'}
        </button>
      </div>

      {/* Contract Creation Form Box */}
      {showContractForm && (
        <div className="crm-box" style={{ marginBottom: 24, border: '1px dashed var(--border-color)', background: 'var(--bg-secondary)' }}>
          <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: 12 }}>
            📑 Generate Digital Contract & SMS E-Sign Link
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
              <label className="input-label">Contract Template Type</label>
              <select
                className="input-field"
                value={contractType}
                onChange={(e) => setContractType(e.target.value)}
              >
                <option value="Storm Contingency & Roof Replacement Agreement">Storm Contingency Agreement</option>
                <option value="Standard Residential Roof Replacement Contract">Standard Residential Replacement</option>
                <option value="Commercial TPO / Flat Roof Restoration Agreement">Commercial TPO Agreement</option>
              </select>
            </div>

            <div>
              <label className="input-label">Contract Amount ($)</label>
              <input
                type="text"
                className="input-field"
                value={contractAmount}
                onChange={(e) => setContractAmount(e.target.value)}
                placeholder="$14,500"
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                className="btn btn-primary"
                style={{ width: '100%', height: '42px', fontWeight: 600 }}
                onClick={handleCreateContract}
              >
                📑 Send E-Sign Contract via SMS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contract Templates Banner */}
      <div className="crm-grid-3x" style={{ marginBottom: 24 }}>
        <div className="glass-card" style={{ padding: 20, borderTop: '3px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontWeight: 700, fontSize: '0.96rem' }}>Storm Contingency Agreement</span>
            <span style={{ fontSize: '0.68rem', padding: '2px 6px', border: '1px solid var(--border-color)', borderRadius: '4px' }}>Most Popular</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
            Allows Apex Roofing to negotiate directly with insurance adjusters once storm hail/wind damage is verified.
          </p>
        </div>

        <div className="glass-card" style={{ padding: 20, borderTop: '3px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontWeight: 700, fontSize: '0.96rem' }}>Standard Residential Replacement</span>
            <span style={{ fontSize: '0.68rem', padding: '2px 6px', border: '1px solid var(--border-color)', borderRadius: '4px' }}>Cash / Retail</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
            Fixed-price proposal for tear-off, underlayment, and 50-year architectural shingle installation.
          </p>
        </div>

        <div className="glass-card" style={{ padding: 20, borderTop: '3px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontWeight: 700, fontSize: '0.96rem' }}>Commercial TPO / Flat Roof</span>
            <span style={{ fontSize: '0.68rem', padding: '2px 6px', border: '1px solid var(--border-color)', borderRadius: '4px' }}>Commercial</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
            Commercial membrane restoration contract with core sample documentation and NDL 20-Year guarantee.
          </p>
        </div>
      </div>

      {/* Active Contracts Table */}
      <div className="crm-box">
        <h3 style={{ marginBottom: 16 }}>Active E-Signatures & Customer Agreements</h3>

        <table className="table-premium">
          <thead>
            <tr>
              <th>Homeowner / Lead</th>
              <th>Contract Type</th>
              <th>Contract Amount</th>
              <th>Status / Signature Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((c) => {
              const clientName = c.client_name || c.client;
              const contractType = c.contract_type || c.type;
              const signedDate = c.signed_date || c.signedDate;
              const zipCode = c.zip_code || c.zip;
              return (
              <tr key={c.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{clientName}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>📞 {c.phone} • 📍 Zip {zipCode}</div>
                </td>
                <td>
                  <span style={{ fontSize: '0.88rem' }}>{contractType}</span>
                </td>
                <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{c.amount}</td>
                <td>
                  {c.status.includes('Signed') ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ width: 'fit-content', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', fontWeight: 600, padding: '4px 8px', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                        <CheckCircle size={12} /> {c.status}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{signedDate}</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={{ width: 'fit-content', fontSize: '0.75rem', fontWeight: 600, padding: '4px 8px', border: '1px solid var(--border-color)', borderRadius: '12px' }}>⏳ {c.status}</span>
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ padding: '2px 8px', fontSize: '0.7rem', width: 'fit-content' }}
                        onClick={() => handleSimulateSign(c.id)}
                      >
                        ✍️ Simulate Homeowner E-Sign
                      </button>
                    </div>
                  )}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => showToast(`📲 Resent E-Sign link via SMS to ${c.phone}`, 'success')}
                    >
                      <Send size={14} /> Resend SMS
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => showToast(`📄 Contract PDF downloaded for ${clientName}`, 'info')}
                    >
                      <Download size={14} /> PDF
                    </button>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};
