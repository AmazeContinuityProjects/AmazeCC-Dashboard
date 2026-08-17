'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Wallet as WalletIcon, AlertCircle, CheckCircle, FileDown, TrendingUp, Percent, Truck, UserCheck, Loader2
} from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  Alert,
  SectionHeader,
  LoadingSpinner,
  EmptyState,
  ProgressBar
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
  const [msg, setMsg] = useState<{ text: string; variant: 'success' | 'error' } | null>(null);
  const [settling, setSettling] = useState<string | null>(null);

  const fetchWallet = useCallback(async () => {
    setLoading(true);
    try {
      const data = await goroboApi.fetchWallet();
      setSummary(data.summary);
      setTransactions(data.transactions);
    } catch (err: any) {
      setMsg({ text: 'Error: ' + err.message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWallet(); }, [fetchWallet]);

  const settle = async (orderId: string, party: 'customer' | 'vendor') => {
    setSettling(`${orderId}:${party}`);
    setMsg(null);
    try {
      const data = await goroboApi.settleWallet(orderId, party);
      setMsg({
        text: data.settled > 0
          ? `${party === 'customer' ? 'Customer payment' : 'Vendor payment'} marked settled successfully!`
          : 'Already settled.',
        variant: 'success'
      });
      fetchWallet();
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setMsg({ text: 'Error settling transaction: ' + err.message, variant: 'error' });
    } finally {
      setSettling(null);
    }
  };

  const cards = [
    {
      label: 'Profit Collected',
      settled: summary.profitSettled,
      total: summary.profitTotal,
      icon: TrendingUp,
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
      barColor: 'emerald' as const
    },
    {
      label: 'GST Collected',
      settled: summary.gstSettled,
      total: summary.gstTotal,
      icon: Percent,
      color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10',
      barColor: 'blue' as const
    },
    {
      label: 'Customer Receipts',
      settled: summary.customerReceived,
      total: summary.customerReceivable,
      icon: UserCheck,
      color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10',
      barColor: 'blue' as const
    },
    {
      label: 'Vendor Cost Paid',
      settled: summary.vendorPaid,
      total: summary.vendorPayable,
      icon: Truck,
      color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
      barColor: 'amber' as const
    },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Amaze Wallet & Settlement Ledger"
        description="Margin collected becomes profit, GST is tracked for tax filings, and raw component cost is paid out to vendors."
        action={
          <Button 
            variant="outline" 
            onClick={() => downloadWalletPdf(summary, transactions)} 
            disabled={transactions.length === 0}
            className="flex items-center gap-2"
          >
            <FileDown className="w-4 h-4" />
            Export Ledger PDF
          </Button>
        }
      />

      {msg && (
        <Alert variant={msg.variant === 'error' ? 'error' : 'success'}>
          <div className="flex items-center gap-2">
            {msg.variant === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            <span>{msg.text}</span>
          </div>
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(card => {
          const Icon = card.icon;
          const pct = card.total > 0 ? Math.round((card.settled / card.total) * 100) : 0;
          return (
            <Card key={card.label} className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{card.label}</p>
                </div>
              </div>

              <div>
                <p className="text-2xl font-black text-foreground font-mono">{formatINR(card.settled)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  of {formatINR(card.total)} total &bull; {pct}% settled
                </p>
              </div>

              <ProgressBar value={pct} color={card.barColor} size="sm" />
            </Card>
          );
        })}
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : transactions.length === 0 ? (
        <Card className="p-12 text-center">
          <EmptyState
            icon={<WalletIcon className="w-12 h-12 text-muted-foreground/50 mb-3" />}
            title="No wallet transactions yet"
            description="Wallet transactions are automatically generated when confirmed GoRoBo bills are finalized."
          />
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="border-b border-border/50 bg-muted/40">
                  <TableHead className="py-3 px-4 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Order Date & ID</TableHead>
                  <TableHead className="py-3 px-4 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Customer</TableHead>
                  <TableHead className="py-3 px-4 text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Profit</TableHead>
                  <TableHead className="py-3 px-4 text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">GST</TableHead>
                  <TableHead className="py-3 px-4 text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Vendor Cost</TableHead>
                  <TableHead className="py-3 px-4 text-center font-semibold text-xs uppercase tracking-wider text-muted-foreground">Customer Status</TableHead>
                  <TableHead className="py-3 px-4 text-center font-semibold text-xs uppercase tracking-wider text-muted-foreground">Vendor Status</TableHead>
                  <TableHead className="py-3 px-4 text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Settlement Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map(t => {
                  const customerSettled = t.customer.profit?.status === 'settled' && t.customer.gst?.status === 'settled';
                  const vendorSettled = t.vendor.cost?.status === 'settled';
                  return (
                    <TableRow key={t.orderId} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                      <TableCell className="py-3 px-4 text-xs text-muted-foreground">
                        <div>{new Date(t.createdAt).toLocaleString("en-IN", { day: '2-digit', month: 'short', year: '2-digit' })}</div>
                        <span className="font-mono text-[10px] text-muted-foreground/80">#{t.orderId.slice(0, 8)}</span>
                      </TableCell>

                      <TableCell className="py-3 px-4">
                        <p className="font-semibold text-foreground text-sm">{t.userName}</p>
                        <p className="text-xs text-muted-foreground font-mono">{t.phoneNumber || '—'}</p>
                      </TableCell>

                      <TableCell className="py-3 px-4 text-right font-mono text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        {t.customer.profit ? formatINR(t.customer.profit.amount) : '—'}
                      </TableCell>

                      <TableCell className="py-3 px-4 text-right font-mono text-sm text-blue-600 dark:text-blue-400">
                        {t.customer.gst ? formatINR(t.customer.gst.amount) : '—'}
                      </TableCell>

                      <TableCell className="py-3 px-4 text-right font-mono text-sm text-amber-600 dark:text-amber-400">
                        {t.vendor.cost ? formatINR(t.vendor.cost.amount) : '—'}
                      </TableCell>

                      <TableCell className="py-3 px-4 text-center">
                        <Badge variant={customerSettled ? 'success' : 'warning'} size="sm">
                          {customerSettled ? 'Received' : 'Pending'}
                        </Badge>
                      </TableCell>

                      <TableCell className="py-3 px-4 text-center">
                        <Badge variant={vendorSettled ? 'success' : 'warning'} size="sm">
                          {vendorSettled ? 'Paid' : 'Pending'}
                        </Badge>
                      </TableCell>

                      <TableCell className="py-3 px-4 text-right">
                        <div className="flex gap-1.5 justify-end">
                          <Button
                            size="sm"
                            variant={customerSettled ? 'ghost' : 'outline'}
                            disabled={customerSettled || settling === `${t.orderId}:customer`}
                            onClick={() => settle(t.orderId, 'customer')}
                            className="h-8 text-xs"
                          >
                            {settling === `${t.orderId}:customer` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5 mr-1" />}
                            {customerSettled ? 'Customer Paid' : 'Receive'}
                          </Button>
                          <Button
                            size="sm"
                            variant={vendorSettled ? 'ghost' : 'outline'}
                            disabled={vendorSettled || settling === `${t.orderId}:vendor`}
                            onClick={() => settle(t.orderId, 'vendor')}
                            className="h-8 text-xs"
                          >
                            {settling === `${t.orderId}:vendor` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Truck className="w-3.5 h-3.5 mr-1" />}
                            {vendorSettled ? 'Vendor Paid' : 'Pay Vendor'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
