import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, FileText, Send, CheckCircle, Download, Plus, AlertCircle } from 'lucide-react';
import { Lead, api } from '../../services/api';

interface InvoicesPaymentsViewProps {
  leads: Lead[];
  mode: 'invoices' | 'payments';
  showToast: (msg: string, type?: string) => void;
}

export const InvoicesPaymentsView: React.FC<InvoicesPaymentsViewProps> = ({ leads, mode, showToast }) => {
  const [tab, setTab] = useState<'invoices' | 'payments'>(mode);
  
  // No dummy leads

  const [invoices, setInvoices] = useState<any[]>([]);

  const [pdfInvoice, setPdfInvoice] = useState<any | null>(null);

  const getInvoiceHTML = (inv: any) => {
    const clientName = inv.client_name || inv.client || 'Homeowner';
    const totalScope = inv.total_scope || inv.totalScope || '$14,500.00';
    const dueDate = inv.due_date || inv.dueDate || 'Jul 24, 2026';
    const invDate = inv.invoice_date || inv.invoiceDate || 'Jul 21, 2026';
    const phone = inv.phone || '0555444133';
    
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${inv.id} - Apex Roofing & Restoration</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    body { font-family: 'Inter', sans-serif; margin: 0; padding: 40px; color: #1e293b; background: #ffffff; }
    .invoice-box { max-width: 800px; margin: auto; border: 1px solid #e2e8f0; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0284c7; padding-bottom: 24px; margin-bottom: 32px; }
    .company-title { font-size: 26px; font-weight: 900; color: #0284c7; letter-spacing: -0.5px; margin: 0; }
    .company-sub { font-size: 13px; font-weight: 600; color: #64748b; margin-top: 4px; }
    .invoice-badge { background: #0284c7; color: white; padding: 6px 14px; border-radius: 4px; font-weight: 800; font-size: 18px; text-transform: uppercase; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 36px; }
    .meta-box h4 { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin: 0 0 8px 0; letter-spacing: 0.5px; }
    .meta-box p { font-size: 15px; margin: 4px 0; font-weight: 500; }
    .meta-box .name { font-size: 18px; font-weight: 800; color: #0f172a; }
    .table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
    .table th { background: #f8fafc; text-align: left; padding: 14px 16px; font-size: 13px; font-weight: 700; color: #475569; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; }
    .table td { padding: 16px; border-bottom: 1px solid #e2e8f0; font-size: 15px; }
    .table .total-row td { font-weight: 800; font-size: 18px; color: #0f172a; background: #f8fafc; border-top: 2px solid #cbd5e1; border-bottom: none; }
    .remittance { background: #f1f5f9; border-left: 4px solid #0284c7; padding: 20px; border-radius: 4px; margin-bottom: 36px; }
    .remittance h4 { margin: 0 0 10px 0; font-size: 14px; font-weight: 800; color: #0f172a; }
    .remittance p { margin: 6px 0; font-size: 13px; color: #334155; line-height: 1.5; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 48px; border-top: 1px solid #e2e8f0; padding-top: 24px; }
    .sig-line { border-bottom: 1px solid #94a3b8; height: 40px; margin-bottom: 8px; }
    .sig-label { font-size: 12px; font-weight: 600; color: #64748b; }
    @media print {
      body { padding: 0; }
      .invoice-box { border: none; box-shadow: none; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="invoice-box">
    <div class="header">
      <div>
        <h1 class="company-title">APEX ROOFING & RESTORATION</h1>
        <div class="company-sub">Platinum Pro Certified Contractor • Lic #TX-88219</div>
        <div class="company-sub">1420 N Central Expy, Suite 200, Plano, TX 75074 • Ph: (214) 555-0188</div>
      </div>
      <div style="text-align: right;">
        <div class="invoice-badge">INVOICE</div>
        <div style="font-size: 16px; font-weight: 800; color: #0f172a; margin-top: 8px;"># ${inv.id}</div>
        <div style="font-size: 13px; color: #64748b; font-weight: 600; margin-top: 4px;">Status: ${inv.status}</div>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-box">
        <h4>Billed To (Homeowner)</h4>
        <p class="name">${clientName}</p>
        <p>Phone: ${phone}</p>
        <p>Property Address: ${inv.zip_code || '81400'} Service Area</p>
      </div>
      <div class="meta-box" style="text-align: right;">
        <h4>Invoice Details</h4>
        <p><strong>Issue Date:</strong> ${invDate}</p>
        <p><strong>Payment Due Date:</strong> ${dueDate}</p>
        <p><strong>Job Scope Value:</strong> ${totalScope}</p>
        <p><strong>Estimator in Charge:</strong> Apex Roofing Team</p>
      </div>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th style="width: 50%;">Description & Scope of Work</th>
          <th>Job Scope Total</th>
          <th style="text-align: right;">Draw Amount Due</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <div style="font-weight: 700; color: #0f172a;">${inv.description || 'Progress Draw Invoice'}</div>
            <div style="font-size: 13px; color: #64748b; margin-top: 4px;">Insurance draw milestone aligned with approved scope of work.</div>
          </td>
          <td>${totalScope}</td>
          <td style="text-align: right; font-weight: 700; color: #0284c7;">${inv.amount}</td>
        </tr>
        <tr>
          <td>
            <div style="font-weight: 600; color: #334155;">Insurance RCV Depreciation / Material Delivery Allocation</div>
            <div style="font-size: 13px; color: #64748b;">Included in total scope estimate allowance.</div>
          </td>
          <td>Included</td>
          <td style="text-align: right;">—</td>
        </tr>
        <tr>
          <td>
            <div style="font-weight: 600; color: #334155;">Owens Corning 50-Year Platinum Workmanship Warranty</div>
            <div style="font-size: 13px; color: #64748b;">Full coverage transferable labor & material guarantee.</div>
          </td>
          <td>Complimentary</td>
          <td style="text-align: right;">$0.00</td>
        </tr>
        <tr class="total-row">
          <td colspan="2">TOTAL AMOUNT DUE ON THIS DRAW:</td>
          <td style="text-align: right; color: #0284c7;">${inv.amount}</td>
        </tr>
      </tbody>
    </table>

    <div class="remittance">
      <h4>Remittance & Payment Instructions</h4>
      <p>• <strong>Insurance Endorsed Check:</strong> Please endorse back of insurance check over to <em>Apex Roofing & Restoration</em> and hand to your Estimator (${phone}).</p>
      <p>• <strong>Instant Credit Card / ACH (Stripe):</strong> Pay securely online at <code>https://pay.apexroofing.com/inv/${inv.id.toLowerCase()}</code> or click pay link sent via SMS.</p>
      <p>• <strong>Bank Wire Transfer:</strong> Routing # <code>111000025</code> • Account # <code>884029104</code> (Chase Business Banking).</p>
    </div>

    <div class="signatures">
      <div>
        <div class="sig-line" style="display: flex; align-items: flex-end; font-family: cursive; font-size: 18px; color: #0284c7; padding-bottom: 4px;">Apex Roofing</div>
        <div class="sig-label">Authorized Contractor Signature (Apex Roofing)</div>
      </div>
      <div>
        <div class="sig-line"></div>
        <div class="sig-label">Homeowner Approval & Acceptance Signature</div>
      </div>
    </div>

    <div style="text-align: center; font-size: 12px; color: #94a3b8; margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
      Thank you for your business! Apex Roofing & Restoration • (214) 555-0188 • Plano, TX • All rights reserved.
    </div>
  </div>
</body>
</html>`;
  };

  const handleOpenPDF = (inv: any) => {
    const html = getInvoiceHTML(inv);
    showToast(`🧾 Generating PDF invoice for ${inv.id}...`, 'info');
    setPdfInvoice(inv);
    
    try {
      const printWin = window.open('', '_blank', 'width=900,height=1100');
      if (printWin) {
        printWin.document.open();
        printWin.document.write(html);
        printWin.document.close();
        printWin.focus();
        setTimeout(() => {
          printWin.print();
        }, 400);
      }
    } catch (e) {
      // If popup blocked, in-app preview modal handles it gracefully
    }
  };

  const handleDownloadHTMLFile = (inv: any) => {
    const html = getInvoiceHTML(inv);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${inv.id}-invoice.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`⬇️ Downloaded ${inv.id}-invoice.html successfully!`, 'success');
  };

  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    api.getCRMData().then(res => {
      let invs = (res && res.invoices) ? res.invoices : [];
      let pays = (res && res.payments) ? res.payments : [];
      setInvoices(invs);
      setPayments(pays);
    }).catch(() => {});
  }, [leads]);

  const defaultLead = leads[0] || null;
  const [selectedLeadId, setSelectedLeadId] = useState<string>(defaultLead?.id || '');
  const [invoiceDesc, setInvoiceDesc] = useState('Draw #1: Insurance ACV Check Deposit (40% of Scope)');
  const [invoiceAmount, setInvoiceAmount] = useState('$5,800.00');
  const [totalScope, setTotalScope] = useState('$14,500.00');
  const [paymentMethod, setPaymentMethod] = useState('💳 Credit Card (Stripe Instant Payout)');
  const [paymentReference, setPaymentReference] = useState('');
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const selectedLead = leads.find(l => l.id === selectedLeadId) || defaultLead;

  const handleCreateInvoice = async () => {
    if (!selectedLead) {
      showToast('⚠️ Please select a lead to invoice!', 'warning');
      return;
    }
    const amount = Number(invoiceAmount.replace(/[$,\s]/g, ''));
    const scope = Number(totalScope.replace(/[$,\s]/g, ''));
    if (!invoiceDesc.trim() || !Number.isFinite(amount) || amount <= 0 || !Number.isFinite(scope) || scope <= 0 || amount > scope) {
      showToast('Enter a description and valid amounts; the invoice cannot exceed the total scope.', 'warning');
      return;
    }
    try {
      const payload = {
        lead_id: selectedLead.id,
        client_name: selectedLead.full_name,
        phone: selectedLead.phone || '',
        description: invoiceDesc,
        amount: invoiceAmount,
        total_scope: totalScope,
        invoice_date: new Date().toLocaleDateString(),
        due_date: new Date(Date.now() + 3 * 86400000).toLocaleDateString()
      };
      const res = await api.createInvoice(payload);
      if (!res?.invoice) throw new Error('Invoice was not confirmed by the server');
      const createdInv = res.invoice;
      setInvoices(prev => [createdInv, ...prev]);
      showToast(`➕ Real invoice generated & sent to ${selectedLead.full_name}!`, 'success');
      setShowInvoiceForm(false);
    } catch (err) {
      showToast('❌ Failed to create invoice. Please try again.', 'error');
    }
  };

  const handleCreatePayment = async () => {
    if (!selectedLead) {
      showToast('⚠️ Please select a lead to record payment for!', 'warning');
      return;
    }
    const amount = Number(invoiceAmount.replace(/[$,\s]/g, ''));
    if (!Number.isFinite(amount) || amount <= 0 || !paymentReference.trim()) {
      showToast('Enter a valid payment amount and a check or transaction reference.', 'warning');
      return;
    }
    try {
      const payload = {
        lead_id: selectedLead.id,
        client_name: selectedLead.full_name,
        payment_date: new Date().toLocaleDateString(),
        method: paymentMethod,
        amount: invoiceAmount,
        reference: paymentReference.trim()
      };
      const res = await api.createPayment(payload);
      if (!res?.payment) throw new Error('Payment was not confirmed by the server');
      const createdPay = res.payment;
      setPayments(prev => [createdPay, ...prev]);
      showToast(`💳 Real payment of ${invoiceAmount} recorded for ${selectedLead.full_name}!`, 'success');
      setShowPaymentForm(false);
    } catch (err) {
      showToast('❌ Failed to record payment. Please try again.', 'error');
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{tab === 'invoices' ? '🧾 Itemized Invoices & Progress Billing' : '💳 Payments & Revenue Ledger'}</h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.88rem', marginTop: 4 }}>
            Manage 3-part insurance draws (`ACV Check` / `Material Delivery` / `RCV Depreciation`) and instant Stripe payouts
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className={`btn ${tab === 'invoices' ? 'btn-primary' : 'btn-outline'} btn-sm`}
            onClick={() => setTab('invoices')}
          >
            🧾 Invoices ({invoices.length})
          </button>
          <button
            className={`btn ${tab === 'payments' ? 'btn-primary' : 'btn-outline'} btn-sm`}
            onClick={() => setTab('payments')}
          >
            💳 Payments ({payments.length})
          </button>
          <button className={`btn ${showInvoiceForm ? 'btn-ghost' : 'btn-primary'} btn-sm`} onClick={() => { setShowInvoiceForm(!showInvoiceForm); setShowPaymentForm(false); }}>
            <Plus size={14} /> {showInvoiceForm ? 'Cancel' : 'Create Invoice'}
          </button>
          {tab === 'payments' && (
            <button className={`btn ${showPaymentForm ? 'btn-ghost' : 'btn-primary'} btn-sm`} onClick={() => { setShowPaymentForm(!showPaymentForm); setShowInvoiceForm(false); }}>
              <Plus size={14} /> {showPaymentForm ? 'Cancel' : 'Record Payment'}
            </button>
          )}
        </div>
      </div>

      {/* Invoice Creation Form */}
      {showInvoiceForm && (
        <div className="crm-box" style={{ marginBottom: 24, border: '1px dashed var(--primary-500)', background: 'rgba(59, 130, 246, 0.04)' }}>
          <h3 style={{ fontSize: '1.05rem', color: 'var(--primary-400)', marginBottom: 12 }}>
            🧾 Generate Progress Draw Invoice
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
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
              <label className="input-label">Draw Description</label>
              <select
                className="input-field"
                value={invoiceDesc}
                onChange={(e) => setInvoiceDesc(e.target.value)}
              >
                <option value="Draw #1: Insurance ACV Check Deposit (40% of Scope)">Draw #1: ACV Deposit (40%)</option>
                <option value="Draw #2: Material Delivery & Deductible Payment (30%)">Draw #2: Material Delivery (30%)</option>
                <option value="Draw #3: Final Completion & Depreciation Release (30%)">Draw #3: Final Completion (30%)</option>
              </select>
            </div>

            <div>
              <label className="input-label">Invoice Amount</label>
              <input
                type="text"
                className="input-field"
                value={invoiceAmount}
                onChange={(e) => setInvoiceAmount(e.target.value)}
                placeholder="$5,800.00"
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                className="btn btn-primary"
                style={{ width: '100%', height: '42px', fontWeight: 600 }}
                onClick={handleCreateInvoice}
              >
                ➕ Generate & Send Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Recording Form */}
      {showPaymentForm && tab === 'payments' && (
        <div className="crm-box" style={{ marginBottom: 24, border: '1px dashed var(--primary-500)', background: 'rgba(59, 130, 246, 0.04)' }}>
          <h3 style={{ fontSize: '1.05rem', color: 'var(--primary-400)', marginBottom: 12 }}>
            💳 Record Received Customer Payment
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
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
              <label className="input-label">Payment Method</label>
              <select
                className="input-field"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="💳 Credit Card (Stripe Instant Payout)">💳 Credit Card (Stripe)</option>
                <option value="🏦 Insurance Endorsed Check">🏦 Insurance Check</option>
                <option value="💵 ACH / Direct Bank Transfer">💵 ACH Bank Transfer</option>
              </select>
            </div>

            <div>
              <label className="input-label">Payment Amount</label>
              <input
                type="text"
                className="input-field"
                value={invoiceAmount}
                onChange={(e) => setInvoiceAmount(e.target.value)}
                placeholder="$5,800.00"
              />
            </div>

            <div>
              <label className="input-label">Check / Transaction Reference</label>
              <input
                type="text"
                className="input-field"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="Check #1042 or provider transaction ID"
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                className="btn btn-primary"
                style={{ width: '100%', height: '42px', fontWeight: 600 }}
                onClick={handleCreatePayment}
              >
                💳 Confirm & Record Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'invoices' ? (
        <div className="crm-box">
          <h3 style={{ marginBottom: 16 }}>Progress Draw Invoices</h3>

          <table className="table-premium">
            <thead>
              <tr>
                <th>Invoice # / Customer</th>
                <th>Draw Description & Scope</th>
                <th>Draw Amount</th>
                <th>Status / Due Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const clientName = inv.client_name || inv.client;
                const totalScope = inv.total_scope || inv.totalScope;
                const dueDate = inv.due_date || inv.dueDate;
                return (
                <tr key={inv.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--primary-400)' }}>{inv.id}</div>
                    <div style={{ fontWeight: 600, marginTop: 2 }}>{clientName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Total Job Scope: {totalScope}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.88rem', fontWeight: 500 }}>{inv.description}</div>
                  </td>
                  <td style={{ fontWeight: 800, fontSize: '1.05rem' }}>{inv.amount}</td>
                  <td>
                    {inv.status.includes('Paid') ? (
                      <span className="badge badge-scheduled" style={{ display: 'flex', alignItems: 'center', gap: 4, width: 'fit-content' }}>
                        <CheckCircle size={12} /> {inv.status}
                      </span>
                    ) : (
                      <span className="badge badge-qualifying" style={{ width: 'fit-content' }}>
                        ⏳ {inv.status} • Due {dueDate}
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => showToast(`📲 Payment link sent via SMS to ${inv.phone || clientName}`, 'success')}
                      >
                        <Send size={14} /> Send SMS Link
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleOpenPDF(inv)}
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
      ) : (
        <div className="crm-box">
          <h3 style={{ marginBottom: 16 }}>Received Payments Ledger</h3>

          <table className="table-premium">
            <thead>
              <tr>
                <th>Receipt # / Date</th>
                <th>Homeowner</th>
                <th>Payment Method & Details</th>
                <th>Amount Received</th>
                <th style={{ textAlign: 'right' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => {
                const clientName = p.client_name || p.client;
                const paymentDate = p.payment_date || p.date;
                return (
                <tr key={p.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--accent-400)' }}>{p.id}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 2 }}>{paymentDate}</div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{clientName}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.method}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>{p.reference}</div>
                  </td>
                  <td style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary-400)' }}>{p.amount}</td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="badge badge-scheduled" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle size={12} /> {p.status}
                    </span>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {pdfInvoice && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div className="glass-card" style={{
            width: '100%', maxWidth: 860, maxHeight: '92vh', display: 'flex', flexDirection: 'column',
            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileText size={20} color="var(--primary-400)" />
                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Printable Invoice Document — #{pdfInvoice.id}</span>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleOpenPDF(pdfInvoice)}
                >
                  🖨️ Print / Save as PDF
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => handleDownloadHTMLFile(pdfInvoice)}
                >
                  <Download size={14} /> Download File
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setPdfInvoice(null)}
                >
                  ✕ Close
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 24, background: '#cbd5e1' }}>
              <iframe
                srcDoc={getInvoiceHTML(pdfInvoice)}
                style={{ width: '100%', height: '780px', border: 'none', background: 'white', borderRadius: 6, boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
                title="Invoice PDF Preview"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
