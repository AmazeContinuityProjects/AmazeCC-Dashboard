'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Wallet as WalletIcon, AlertCircle, CheckCircle, FileDown, TrendingUp, Percent, Truck, UserCheck, Loader2
} from 'lucide-react';
import {
  GlassCard, GlassButton, SectionHeader, LoadingSpinner, EmptyState
} from '@/components/custom/admin/AdminUI';
import {
  goroboApi, formatINR, type WalletSummary, type WalletTransaction
} from './gorobo-api';
import { downloadWalletPdf } from './gorobo-pdf';

const emptySummary: WalletSummary = {
  profitTotal: 0, profitSettled: 0,
  gstTotal: 0, gstSettled: 0,
  vendorPayable: 0, vendorPaid: 0,
  customerReceivable: 0, customerReceived: 0,
};

export default function AmazeWallet() {
  const [summary, setSummary] = useState<WalletSummary>(emptySummary);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [settling, setSettling] = useState<string | null>(null);

  const fetchWallet = useCallback(async () => {
    setLoading(true);
    try {
      const data = await goroboApi.fetchWallet();
      setSummary(data.summary);
      setTransactions(data.transactions);
    } catch (err: any) {
      setMsg('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWallet(); }, [fetchWallet]);

  const settle = async (orderId: string, party: 'customer' | 'vendor') => {
    setSettling(`${orderId}:${party}`);
    setMsg('');
    try {
      const data = await goroboApi.settleWallet(orderId, party);
      setMsg(data.settled > 0
        ? `${party === 'customer' ? 'Customer payment' : 'Vendor payment'} marked settled`
        : 'Already settled');
      fetchWallet();
      setTimeout(() => setMsg(''), 2000);
    } catch (err: any) {
      setMsg('Error: ' + err.message);
    } finally {
      setSettling(null);
    }
  };

  const cards = [
    {
      label: 'Profit collected',
      settled: summary.profitSettled,
      total: summary.profitTotal,
      icon: TrendingUp,
      color: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
    },
    {
      label: 'GST collected',
      settled: summary.gstSettled,
      total: summary.gstTotal,
      icon: Percent,
      color: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30',
    },
    {
      label: 'Customer receipts',
      settled: summary.customerReceived,
      total: summary.customerReceivable,
      icon: UserCheck,
      color: 'text-accent bg-accent/10',
    },
    {
      label: 'Vendor cost paid',
      settled: summary.vendorPaid,
      total: summary.vendorPayable,
      icon: Truck,
      color: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30',
    },
  ];

  return (
    <div>
      <SectionHeader
        title="Amaze Wallet"
        description="Margin collected becomes profit, GST is tracked separately, and raw item cost is paid to the vendor when an order completes."
        action={
          <GlassButton variant="secondary" onClick={() => downloadWalletPdf(summary, transactions)} disabled={transactions.length === 0}>
            <FileDown className="w-4 h-4 mr-1" style={{ verticalAlign: 'middle' }} />Export PDF
          </GlassButton>
        }
      />

      {msg && (
        <div className={`mb-4 p-3 rounded-xl text-sm backdrop-blur-xl flex items-center gap-2 ${
          msg.startsWith('Error')
            ? 'bg-red-50 dark:bg-red-900/20 border border-red-200/50 text-red-700 dark:text-red-400'
            : 'bg-green-50 dark:bg-green-900/20 border border-green-200/50 text-green-700 dark:text-green-400'
        }`}>
          {msg.startsWith('Error') ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {cards.map(card => {
          const Icon = card.icon;
          const pct = card.total > 0 ? Math.round((card.settled / card.total) * 100) : 0;
          return (
            <GlassCard key={card.label} padding="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.color}`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <p className="text-sm font-semibold text-muted-foreground">{card.label}</p>
              </div>
              <p className="text-2xl font-black text-foreground font-mono">{formatINR(card.settled)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                of {formatINR(card.total)} total · {pct}% settled
              </p>
              <div className="mt-3 h-1.5 rounded-full bg-muted/60 overflow-hidden">
                <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
              </div>
            </GlassCard>
          );
        })}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : transactions.length === 0 ? (
        <GlassCard>
<EmptyState
              icon={<WalletIcon className="w-10 h-10 text-muted-foreground/50 mb-2" />}
            title="No wallet entries yet"
            description="Wallet entries are created automatically when a confirmed order is completed in the bill processor."
          />
        </GlassCard>
      ) : (
        <GlassCard padding="p-0" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-left text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="px-3 py-2 font-semibold">Date</th>
                  <th className="px-3 py-2 font-semibold">Customer</th>
                  <th className="px-3 py-2 font-semibold text-right">Profit</th>
                  <th className="px-3 py-2 font-semibold text-right">GST</th>
                  <th className="px-3 py-2 font-semibold text-right">Vendor cost</th>
                  <th className="px-3 py-2 font-semibold text-center">Customer paid</th>
                  <th className="px-3 py-2 font-semibold text-center">Vendor paid</th>
                  <th className="px-3 py-2 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => {
                  const customerSettled = t.customer.profit?.status === 'settled' && t.customer.gst?.status === 'settled';
                  const vendorSettled = t.vendor.cost?.status === 'settled';
                  return (
                    <tr key={t.orderId} className="border-b border-border/30 hover:bg-accent/5 transition-colors">
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">
                        {new Date(t.createdAt).toLocaleString("en-IN", { day: '2-digit', month: 'short', year: '2-digit' })}
                        <span className="block text-[10px]">{t.orderId.slice(0, 8)}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="font-semibold text-foreground">{t.userName}</p>
                        <p className="text-xs text-muted-foreground font-mono">{t.phoneNumber}</p>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono">{t.customer.profit ? formatINR(t.customer.profit.amount) : '—'}</td>
                      <td className="px-3 py-2.5 text-right font-mono">{t.customer.gst ? formatINR(t.customer.gst.amount) : '—'}</td>
                      <td className="px-3 py-2.5 text-right font-mono">{t.vendor.cost ? formatINR(t.vendor.cost.amount) : '—'}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          customerSettled
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}>
                          {customerSettled ? 'Received' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          vendorSettled
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}>
                          {vendorSettled ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1.5 justify-end">
                          <GlassButton
                            size="sm"
                            variant={customerSettled ? 'secondary' : 'primary'}
                            disabled={customerSettled || settling === `${t.orderId}:customer`}
                            onClick={() => settle(t.orderId, 'customer')}
                          >
                            {settling === `${t.orderId}:customer` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5 mr-1" />}
                            {!settling && (customerSettled ? 'Done' : 'Customer paid')}
                          </GlassButton>
                          <GlassButton
                            size="sm"
                            variant={vendorSettled ? 'secondary' : 'primary'}
                            disabled={vendorSettled || settling === `${t.orderId}:vendor`}
                            onClick={() => settle(t.orderId, 'vendor')}
                          >
                            {settling === `${t.orderId}:vendor` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Truck className="w-3.5 h-3.5 mr-1" />}
                            {!settling && (vendorSettled ? 'Done' : 'Vendor paid')}
                          </GlassButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
