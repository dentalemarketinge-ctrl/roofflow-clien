import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, BadgeDollarSign, Banknote, CheckCircle2, CircleDollarSign,
  FileCheck2, FileText, RefreshCw, TrendingUp, WalletCards
} from 'lucide-react';
import { Stats, api } from '../../services/api';

interface RoiViewProps {
  stats: Stats | null;
}

type FinancialData = {
  contracts: any[];
  invoices: any[];
  payments: any[];
};

const parseMoney = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const parsed = Number(String(value ?? '').replace(/[^0-9.-]+/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

const money = (value: number) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
}).format(value);

export const RoiView: React.FC<RoiViewProps> = () => {
  const [data, setData] = useState<FinancialData>({ contracts: [], invoices: [], payments: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadFinancials = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.getCRMData();
      setData({
        contracts: Array.isArray(response?.contracts) ? response.contracts : [],
        invoices: Array.isArray(response?.invoices) ? response.invoices : [],
        payments: Array.isArray(response?.payments) ? response.payments : [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Financial records could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadFinancials(); }, []);

  const metrics = useMemo(() => {
    const signedContracts = data.contracts.filter(contract => String(contract.status || '').toLowerCase().includes('signed'));
    const contractedRevenue = signedContracts.reduce((sum, contract) => sum + parseMoney(contract.amount), 0);
    const invoicedRevenue = data.invoices.reduce((sum, invoice) => sum + parseMoney(invoice.amount), 0);
    const collectedRevenue = data.payments
      .filter(payment => !['failed', 'void', 'refunded'].includes(String(payment.status || '').toLowerCase()))
      .reduce((sum, payment) => sum + parseMoney(payment.amount), 0);
    const outstandingInvoices = Math.max(invoicedRevenue - collectedRevenue, 0);
    const uninvoicedContracts = Math.max(contractedRevenue - invoicedRevenue, 0);
    const collectionRate = invoicedRevenue > 0 ? (collectedRevenue / invoicedRevenue) * 100 : 0;
    const cashRealization = contractedRevenue > 0 ? (collectedRevenue / contractedRevenue) * 100 : 0;
    const averageContract = signedContracts.length > 0 ? contractedRevenue / signedContracts.length : 0;

    return {
      signedContracts,
      contractedRevenue,
      invoicedRevenue,
      collectedRevenue,
      outstandingInvoices,
      uninvoicedContracts,
      collectionRate,
      cashRealization,
      averageContract,
    };
  }, [data]);

  const ledger = useMemo(() => [
    ...data.contracts.map(item => ({
      id: item.id,
      type: 'Contract',
      client: item.client_name || 'Customer',
      amount: parseMoney(item.amount),
      status: item.status || 'Unknown',
      date: item.signed_date || item.sent_date || item.created_at,
    })),
    ...data.invoices.map(item => ({
      id: item.id,
      type: 'Invoice',
      client: item.client_name || 'Customer',
      amount: parseMoney(item.amount),
      status: item.status || 'Unknown',
      date: item.date_issued || item.created_at,
    })),
    ...data.payments.map(item => ({
      id: item.id,
      type: 'Payment',
      client: item.client_name || 'Customer',
      amount: parseMoney(item.amount),
      status: item.status || 'Recorded',
      date: item.date_received || item.created_at,
    })),
  ].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()).slice(0, 12), [data]);

  return (
    <>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary-400)', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '.11em', textTransform: 'uppercase', marginBottom: 7 }}>
            <BadgeDollarSign size={15} /> Verified financial records
          </div>
          <h1>Revenue & Cash Performance</h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.88rem', marginTop: 4 }}>
            Calculated directly from signed contracts, issued invoices and recorded offline payments.
          </p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => void loadFinancials()} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> {loading ? 'Refreshing…' : 'Refresh data'}
        </button>
      </div>

      {error && (
        <div className="crm-box" style={{ display: 'flex', alignItems: 'center', gap: 11, borderColor: 'rgba(239,68,68,.35)', color: '#fca5a5', marginBottom: 20 }}>
          <AlertCircle size={18} /> <span style={{ flex: 1 }}>{error}</span>
          <button className="btn btn-outline btn-sm" onClick={() => void loadFinancials()}>Try again</button>
        </div>
      )}

      <div className="crm-grid-3x" style={{ marginBottom: 20 }}>
        {[
          { label: 'Signed contract value', value: metrics.contractedRevenue, detail: `${metrics.signedContracts.length} signed contracts`, Icon: FileCheck2, color: '#60a5fa' },
          { label: 'Total invoiced', value: metrics.invoicedRevenue, detail: `${data.invoices.length} invoices issued`, Icon: FileText, color: '#a78bfa' },
          { label: 'Payments collected', value: metrics.collectedRevenue, detail: `${data.payments.length} offline payments recorded`, Icon: Banknote, color: '#34d399' },
        ].map(({ label, value, detail, Icon, color }) => (
          <div className="crm-box" key={label} style={{ padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</div>
                <div style={{ fontSize: '2rem', fontWeight: 900, marginTop: 7 }}>{loading ? '—' : money(value)}</div>
                <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', marginTop: 6 }}>{detail}</div>
              </div>
              <div style={{ width: 46, height: 46, borderRadius: 13, display: 'grid', placeItems: 'center', color, background: `${color}18` }}><Icon size={22} /></div>
            </div>
          </div>
        ))}
      </div>

      <div className="crm-grid-2x" style={{ marginBottom: 20 }}>
        <div className="crm-box">
          <h3 style={{ fontSize: '1rem', marginBottom: 17 }}>Revenue conversion</h3>
          {[
            { label: 'Contracted → invoiced', amount: metrics.invoicedRevenue, total: metrics.contractedRevenue, remainder: metrics.uninvoicedContracts, remainderLabel: 'Not yet invoiced' },
            { label: 'Invoiced → collected', amount: metrics.collectedRevenue, total: metrics.invoicedRevenue, remainder: metrics.outstandingInvoices, remainderLabel: 'Outstanding' },
          ].map(row => {
            const percent = row.total > 0 ? Math.min((row.amount / row.total) * 100, 100) : 0;
            return (
              <div key={row.label} style={{ marginBottom: 19 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 8 }}>
                  <span style={{ fontWeight: 750 }}>{row.label}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{percent.toFixed(1)}%</span>
                </div>
                <div style={{ height: 9, borderRadius: 20, background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${percent}%`, borderRadius: 20, background: 'linear-gradient(90deg, #3b82f6, #22c55e)' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-tertiary)', fontSize: '0.71rem', marginTop: 7 }}>
                  <span>{money(row.amount)} processed</span><span>{money(row.remainder)} {row.remainderLabel.toLowerCase()}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="crm-box">
          <h3 style={{ fontSize: '1rem', marginBottom: 15 }}>Real performance indicators</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Invoice collection rate', value: `${metrics.collectionRate.toFixed(1)}%`, Icon: WalletCards },
              { label: 'Contract cash realization', value: `${metrics.cashRealization.toFixed(1)}%`, Icon: TrendingUp },
              { label: 'Average signed contract', value: money(metrics.averageContract), Icon: CircleDollarSign },
              { label: 'Outstanding invoices', value: money(metrics.outstandingInvoices), Icon: AlertCircle },
            ].map(({ label, value, Icon }) => (
              <div key={label} style={{ padding: 14, borderRadius: 12, background: 'var(--bg-tertiary)' }}>
                <Icon size={17} color="var(--primary-400)" />
                <div style={{ fontSize: '1.12rem', fontWeight: 850, marginTop: 9 }}>{loading ? '—' : value}</div>
                <div style={{ color: 'var(--text-tertiary)', fontSize: '0.69rem', marginTop: 3 }}>{label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 9, marginTop: 13, padding: 11, borderRadius: 10, background: 'rgba(245,158,11,.07)', border: '1px solid rgba(245,158,11,.2)', fontSize: '0.71rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            <AlertCircle size={15} color="#f59e0b" style={{ flex: '0 0 auto' }} />
            True ROI requires recorded job costs and marketing spend. Until those exist, this page reports verified revenue and cash conversion only.
          </div>
        </div>
      </div>

      <div className="crm-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
          <div><h3 style={{ fontSize: '1rem' }}>Financial activity</h3><div style={{ color: 'var(--text-tertiary)', fontSize: '0.72rem', marginTop: 3 }}>Latest contract, invoice and payment records</div></div>
          <span className="badge badge-scheduled"><CheckCircle2 size={12} /> CRM source</span>
        </div>
        {ledger.length === 0 && !loading ? (
          <div style={{ padding: '38px 20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>No financial records yet. Signed contracts, invoices and payments will appear here.</div>
        ) : (
          <table className="table-premium">
            <thead><tr><th>Record</th><th>Customer</th><th>Status</th><th>Date</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
            <tbody>
              {ledger.map((entry, index) => (
                <tr key={`${entry.type}-${entry.id}-${index}`}>
                  <td><span style={{ fontWeight: 750 }}>{entry.type}</span><div style={{ color: 'var(--text-tertiary)', fontSize: '0.68rem', marginTop: 2 }}>{entry.id}</div></td>
                  <td>{entry.client}</td>
                  <td><span className={String(entry.status).toLowerCase().includes('signed') || entry.type === 'Payment' ? 'badge badge-scheduled' : 'badge badge-missed-call'}>{entry.status}</span></td>
                  <td>{entry.date ? String(entry.date) : '—'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 850 }}>{money(entry.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};
