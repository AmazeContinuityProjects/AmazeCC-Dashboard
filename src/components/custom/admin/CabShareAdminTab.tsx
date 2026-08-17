'use client';
import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { 
  SectionHeader, 
  Card, 
  LoadingSpinner, 
  Button, 
  Input, 
  Badge, 
  Modal, 
  Switch, 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell,
  EmptyState 
} from '@/components/custom/admin/AdminUI';
import { 
  Trash2, Plus, MapPin, Car, Eye, Phone, Calendar, Clock, User, 
  Check, XCircle, Clock3, Megaphone 
} from 'lucide-react';

export default function CabShareAdminTab() {
  const [trips, setTrips] = useState<any[]>([]);
  const [hubs, setHubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newHubName, setNewHubName] = useState('');
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [promoteEnabled, setPromoteEnabled] = useState(false);
  const [promoteToggling, setPromoteToggling] = useState(false);

  const fetchPromoteState = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.amazecc.vit.ac.in'}/api/settings/global`);
      const data = await res.json();
      if (data?.success && data.config?.promoteCabShare?.enabled === true) {
        setPromoteEnabled(true);
      }
    } catch {}
  };

  const togglePromote = async (newVal: boolean) => {
    setPromoteToggling(true);
    try {
      const res = await apiFetch('/api/admin/settings/global', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'promoteCabShare', value: { enabled: newVal } })
      });
      const data = await res.json();
      if (data.success) setPromoteEnabled(newVal);
    } catch (e) {}
    setPromoteToggling(false);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tripsRes, hubsRes] = await Promise.all([
        apiFetch('/api/admin/cabshare/trips'),
        fetch('https://api.amazecc.vit.ac.in/api/cabshare/hubs').catch(() => ({ json: () => ({ success: false }) })) as any
      ]);
      const tripsData = await tripsRes.json();
      const hubsData = await hubsRes.json();
      if (tripsData.success) setTrips(tripsData.trips);
      if (hubsData.success) setHubs(hubsData.hubs);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    fetchPromoteState();
  }, []);

  const handleDeleteTrip = async (tripId: number) => {
    if (!confirm('Delete this trip?')) return;
    try {
      const res = await apiFetch(`/api/admin/cabshare/trips?trip_id=${tripId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) fetchData();
      else alert(data.error);
    } catch (e) {}
  };

  const handleAddHub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHubName.trim()) return;
    try {
      const res = await apiFetch('/api/admin/cabshare/hubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hub_name: newHubName.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setNewHubName('');
        fetchData();
      } else alert(data.error);
    } catch (e) {}
  };

  const handleDeleteHub = async (hubId: number) => {
    if (!confirm('Delete this transport hub?')) return;
    try {
      const res = await apiFetch(`/api/admin/cabshare/hubs?hub_id=${hubId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) fetchData();
      else alert(data.error);
    } catch (e) {}
  };

  if (loading) return <div className="py-20 flex justify-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6 animate-fadeIn">
      <SectionHeader 
        title="Cab Share Management" 
        description="Moderate passenger trips, transport pickup hubs, join requests, and promotional homepage banners." 
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hubs Management */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold text-foreground">Transport Hubs ({hubs.length})</h3>
          </div>
          <form onSubmit={handleAddHub} className="flex gap-2">
            <Input 
              type="text" 
              value={newHubName}
              onChange={(e: any) => setNewHubName(e.target.value)}
              placeholder="e.g. Chennai Central, Airport"
              className="flex-1"
            />
            <Button type="submit" variant="primary" className="flex items-center gap-1.5 shrink-0">
              <Plus className="w-4 h-4" /> Add
            </Button>
          </form>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {hubs.map(h => (
              <div key={h.hub_id} className="flex justify-between items-center p-3 bg-muted/40 rounded-xl border border-border/40">
                <span className="font-semibold text-foreground text-sm">{h.hub_name}</span>
                <Button size="icon-sm" variant="ghost" onClick={() => handleDeleteHub(h.hub_id)} className="text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Platform Stats & Promotion */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-base font-bold text-foreground">Platform Activity</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted/40 rounded-2xl text-center border border-border/40">
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{trips.length}</p>
              <p className="text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wider">Active Trips</p>
            </div>
            <div className="p-4 bg-muted/40 rounded-2xl text-center border border-border/40">
              <p className="text-3xl font-black text-primary font-mono">{hubs.length}</p>
              <p className="text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wider">Active Hubs</p>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Promote Cab Share</p>
                <p className="text-xs text-muted-foreground">Show promotional banner on all student mobile app home screens</p>
              </div>
            </div>
            <Switch
              checked={promoteEnabled}
              onCheckedChange={togglePromote}
              disabled={promoteToggling}
            />
          </div>
        </Card>
      </div>

      {/* Trips Table */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-border/50 bg-muted/20">
          <h3 className="text-base font-bold text-foreground">Active Carpool & Cab Trips ({trips.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="border-b border-border/50 bg-muted/30">
                <TableHead className="py-3 px-4 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Host</TableHead>
                <TableHead className="py-3 px-4 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Reg No</TableHead>
                <TableHead className="py-3 px-4 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Destination Hub</TableHead>
                <TableHead className="py-3 px-4 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Date & Time</TableHead>
                <TableHead className="py-3 px-4 text-center font-semibold text-xs uppercase tracking-wider text-muted-foreground">Status</TableHead>
                <TableHead className="py-3 px-4 text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trips.map(t => (
                <TableRow key={t.trip_id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                  <TableCell className="py-3 px-4 font-bold text-foreground text-sm">{t.name}</TableCell>
                  <TableCell className="py-3 px-4 font-mono text-xs text-muted-foreground">{t.reg_number}</TableCell>
                  <TableCell className="py-3 px-4 text-sm">{t.hub_name}</TableCell>
                  <TableCell className="py-3 px-4 text-xs text-muted-foreground">{new Date(t.travel_date).toLocaleDateString('en-IN')} @ {t.preferred_time}</TableCell>
                  <TableCell className="py-3 px-4 text-center">
                    <Badge variant={t.status === 'active' ? 'success' : 'default'} size="sm">
                      {t.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button size="icon-sm" variant="ghost" onClick={() => setSelectedTrip(t)} title="View Details">
                        <Eye className="w-4 h-4 text-primary" />
                      </Button>
                      <Button size="icon-sm" variant="ghost" onClick={() => handleDeleteTrip(t.trip_id)} title="Delete Trip" className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {trips.length === 0 && (
                <TableRow>
                  <TableCell className="py-12 text-center text-muted-foreground">
                    No active cab share trips currently scheduled.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Trip Detail Modal */}
      <Modal
        isOpen={selectedTrip !== null}
        onClose={() => setSelectedTrip(null)}
        title="Cab Share Trip Dossier"
        maxWidth="max-w-2xl"
      >
        {selectedTrip && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 flex items-center gap-3 p-3.5 rounded-2xl bg-muted/40 border border-border/50">
                <MapPin className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-bold text-foreground">{selectedTrip.hub_name}</p>
                  <p className="text-xs text-muted-foreground">{selectedTrip.from_hub_name ? `${selectedTrip.from_hub_name} → ` : ''}{selectedTrip.hub_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40 border border-border/50">
                <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase">Date</p>
                  <p className="text-sm font-bold text-foreground">{new Date(selectedTrip.travel_date).toLocaleDateString('en-IN')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40 border border-border/50">
                <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase">Time</p>
                  <p className="text-sm font-bold text-foreground">{selectedTrip.preferred_time} ±{selectedTrip.tolerance_hours}h</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40 border border-border/50">
                <User className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase">Host</p>
                  <p className="text-sm font-bold text-foreground">{selectedTrip.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{selectedTrip.reg_number}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40 border border-border/50">
                <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase">Host Phone</p>
                  <p className="text-sm font-bold text-foreground font-mono">{selectedTrip.phone_number || '—'}</p>
                </div>
              </div>
            </div>

            {selectedTrip.notes && (
              <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/40 space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Host Remarks</p>
                <p className="text-sm font-medium text-foreground">{selectedTrip.notes}</p>
              </div>
            )}

            {/* Match Requests */}
            <div className="space-y-3 pt-2">
              <h4 className="text-sm font-bold text-foreground">
                Join Requests ({selectedTrip.requests?.length || 0})
              </h4>
              {selectedTrip.requests && selectedTrip.requests.length > 0 ? (
                <div className="space-y-2">
                  {selectedTrip.requests.map((req: any) => (
                    <div key={req.match_id} className="rounded-2xl border border-border/50 p-3.5 space-y-2 bg-card">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-bold text-foreground">{req.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{req.reg_number}</p>
                        </div>
                        <Badge variant={req.status === 'accepted' ? 'success' : req.status === 'rejected' ? 'danger' : 'warning'} size="sm">
                          {req.status}
                        </Badge>
                      </div>
                      {req.status === 'accepted' && (
                        <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                          <Phone className="w-3.5 h-3.5 shrink-0" />
                          <span>{req.name}: {req.phone_number}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="p-4 text-xs text-muted-foreground text-center rounded-2xl bg-muted/20 border border-dashed border-border/50">
                  No join requests received yet.
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
