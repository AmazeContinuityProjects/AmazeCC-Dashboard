'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Bus, MapPin, Phone, ClipboardList, Search, Plus, Trash2, Save,
  X, ChevronDown, ChevronRight, AlertCircle, CheckCircle, Upload, Download, Database
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import {
  Card,
  Button,
  Input,
  Textarea,
  Select,
  SectionHeader,
  LoadingSpinner,
  EmptyState,
  Badge,
  Alert,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/custom/admin/AdminUI';

type BusRoute = {
  id: number; route_number: string; route_name: string;
  type: string; driver_name: string; driver_phone: string;
  whatsapp_group: string; bus_location: string;
  supervisor_name: string; supervisor_phone: string;
  driver_incharge_name: string; driver_incharge_phone: string;
  stop_count?: number; stops?: BusStop[]; placements?: any[];
};

type BusStop = {
  id?: number; route_id?: number;
  stop_order: number; stop_name: string; pickup_time: string;
};

type Placement = {
  id?: number; route_id: number;
  route_number: string; route_name: string;
  dispersal_time: string; zone: string;
};

type TransportRule = {
  id?: number; rule_number: number; content: string;
};

const TABS = [
  { id: 'routes', label: 'Routes', icon: Bus },
  { id: 'stops', label: 'Stops & Times', icon: MapPin },
  { id: 'placements', label: 'Placements', icon: MapPin },
  { id: 'contacts', label: 'Contacts', icon: Phone },
  { id: 'rules', label: 'Rules', icon: ClipboardList },
];

export default function TransportManager() {
  const [activeSection, setActiveSection] = useState('routes');
  const [seeding, setSeeding] = useState(false);
  const [seedProgress, setSeedProgress] = useState(0);
  const [seedMsg, setSeedMsg] = useState('');

  const runSeed = async () => {
    setSeeding(true);
    setSeedProgress(0);
    setSeedMsg('');
    const interval = setInterval(() => {
      setSeedProgress(p => Math.min(p + 5, 85));
    }, 500);
    try {
      setSeedMsg('Loading routes...');
      const res = await apiFetch('/api/admin/transport/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      clearInterval(interval);
      if (data.success) {
        setSeedProgress(100);
        setSeedMsg(`Seeded ${data.stats.routes} routes, ${data.stats.placements} placements, ${data.stats.rules} rules`);
      } else {
        setSeedMsg('Error: ' + (data.error || 'Seed failed'));
      }
    } catch (err: any) {
      clearInterval(interval);
      setSeedMsg('Error: ' + err.message);
    } finally {
      setTimeout(() => { setSeeding(false); setSeedProgress(0); }, 2000);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <SectionHeader
        title="Transport Manager"
        description="Manage bus routes, stops, pickup timings, dispersal placements, contact directories, and guidelines."
        action={
          <div className="flex items-center gap-3">
            {seedMsg && (
              <span className={`text-xs font-semibold ${seedMsg.startsWith('Error') ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {seedMsg}
              </span>
            )}
            <Button
              onClick={runSeed}
              disabled={seeding}
              variant="primary"
              className="flex items-center gap-2"
            >
              <Database className="w-4 h-4" />
              <span>{seeding ? `Seeding ${seedProgress}%` : 'Load Seed Data'}</span>
            </Button>
          </div>
        }
      />

      <Card className="p-1.5">
        <div className="flex gap-1.5 overflow-x-auto">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeSection === tab.id ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setActiveSection(tab.id)}
                className="flex items-center gap-2 text-xs font-semibold"
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </Button>
            );
          })}
        </div>
      </Card>

      {activeSection === 'routes' && <RoutesSection />}
      {activeSection === 'stops' && <StopsSection />}
      {activeSection === 'placements' && <PlacementsSection />}
      {activeSection === 'contacts' && <ContactsSection />}
      {activeSection === 'rules' && <RulesSection />}
    </div>
  );
}

function RoutesSection() {
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<BusRoute>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchRoutes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/transport/routes');
      const data = await res.json();
      if (data.success) setRoutes(data.routes);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRoutes(); }, [fetchRoutes]);

  const filtered = routes.filter(r =>
    r.route_name.toLowerCase().includes(search.toLowerCase()) ||
    r.route_number.toLowerCase().includes(search.toLowerCase())
  );

  const startEdit = (route: BusRoute) => {
    setEditId(route.id);
    setEditData({ ...route });
    setMsg('');
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditData({});
  };

  const saveRoute = async () => {
    if (!editId) return;
    setSaving(true);
    setMsg('');
    try {
      const res = await apiFetch(`/api/admin/transport/routes/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routeNumber: editData.route_number,
          routeName: editData.route_name,
          type: editData.type,
          driverName: editData.driver_name,
          driverPhone: editData.driver_phone,
          whatsappGroup: editData.whatsapp_group,
          busLocation: editData.bus_location,
          supervisorName: editData.supervisor_name,
          supervisorPhone: editData.supervisor_phone,
          driverInchargeName: editData.driver_incharge_name,
          driverInchargePhone: editData.driver_incharge_phone,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRoutes(prev => prev.map(r => r.id === editId ? { ...r, ...editData as BusRoute } : r));
        setMsg('Route updated successfully');
        setTimeout(() => { cancelEdit(); setMsg(''); }, 1500);
      } else throw new Error(data.error);
    } catch (err: any) {
      setMsg('Error: ' + err.message);
    } finally { setSaving(false); }
  };

  if (loading) return <div className="py-20 flex justify-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-4">
      {msg && (
        <Alert variant={msg.startsWith('Error') ? 'error' : 'success'}>
          <span>{msg}</span>
        </Alert>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9 w-full"
          placeholder="Search routes by name or route number..."
          value={search}
          onChange={(e: any) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {filtered.map(route => (
          <Card key={route.id} className="p-0 overflow-hidden">
            <div
              onClick={() => editId === route.id ? cancelEdit() : startEdit(route)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Badge variant="default" size="md" className="font-bold">
                  #{route.route_number}
                </Badge>
                <div>
                  <p className="font-bold text-foreground text-sm">{route.route_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {route.type} &middot; {route.stop_count || 0} stops
                  </p>
                </div>
              </div>
              {editId === route.id ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            </div>

            {editId === route.id && (
              <div className="border-t border-border/50 p-5 space-y-4 bg-muted/10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input label="Route Name" value={editData.route_name || ''} onChange={(e: any) => setEditData(p => ({ ...p, route_name: e.target.value }))} />
                  <Select
                    label="Type"
                    options={[{ value: 'AC', label: 'AC' }, { value: 'Non-AC', label: 'Non-AC' }]}
                    value={editData.type || 'AC'}
                    onChange={(e: any) => setEditData(p => ({ ...p, type: e.target.value }))}
                  />
                  <Input label="Driver Name" value={editData.driver_name || ''} onChange={(e: any) => setEditData(p => ({ ...p, driver_name: e.target.value }))} />
                  <Input label="Driver Phone" value={editData.driver_phone || ''} onChange={(e: any) => setEditData(p => ({ ...p, driver_phone: e.target.value }))} />
                  <Input label="WhatsApp Group" value={editData.whatsapp_group || ''} onChange={(e: any) => setEditData(p => ({ ...p, whatsapp_group: e.target.value }))} />
                  <Input label="Bus Location" value={editData.bus_location || ''} onChange={(e: any) => setEditData(p => ({ ...p, bus_location: e.target.value }))} />
                  <Input label="Supervisor Name" value={editData.supervisor_name || ''} onChange={(e: any) => setEditData(p => ({ ...p, supervisor_name: e.target.value }))} />
                  <Input label="Supervisor Phone" value={editData.supervisor_phone || ''} onChange={(e: any) => setEditData(p => ({ ...p, supervisor_phone: e.target.value }))} />
                  <Input label="Driver Incharge Name" value={editData.driver_incharge_name || ''} onChange={(e: any) => setEditData(p => ({ ...p, driver_incharge_name: e.target.value }))} />
                  <Input label="Driver Incharge Phone" value={editData.driver_incharge_phone || ''} onChange={(e: any) => setEditData(p => ({ ...p, driver_incharge_phone: e.target.value }))} />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <Button variant="ghost" size="sm" onClick={cancelEdit}>
                    <X className="w-4 h-4 mr-1" /> Cancel
                  </Button>
                  <Button variant="primary" size="sm" onClick={saveRoute} disabled={saving} className="flex items-center gap-1.5">
                    <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Route'}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}

        {filtered.length === 0 && (
          <Card className="p-12 text-center">
            <EmptyState 
              icon={<Search className="w-10 h-10 text-muted-foreground/50 mb-2" />} 
              title="No routes found" 
              description={search ? 'Try a different search query.' : 'No routes found. Click "Load Seed Data" to populate routes.'} 
            />
          </Card>
        )}
      </div>
    </div>
  );
}

function StopsSection() {
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [expandedRoute, setExpandedRoute] = useState<number | null>(null);
  const [stops, setStops] = useState<BusStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [msg, setMsg] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/transport/routes');
      const data = await res.json();
      if (data.success) setRoutes(data.routes);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const expandRoute = async (routeId: number) => {
    if (expandedRoute === routeId) {
      setExpandedRoute(null);
      return;
    }
    setExpandedRoute(routeId);
    setMsg('');
    try {
      const res = await apiFetch(`/api/admin/transport/routes/${routeId}`);
      const data = await res.json();
      if (data.success) {
        setStops(data.route.stops || []);
      }
    } catch { }
  };

  const addStop = () => {
    const maxOrder = stops.reduce((max, s) => Math.max(max, s.stop_order), 0);
    setStops(prev => [...prev, { stop_order: maxOrder + 1, stop_name: '', pickup_time: '' }]);
  };

  const updateStop = (index: number, field: keyof BusStop, value: any) => {
    setStops(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const removeStop = (index: number) => {
    setStops(prev => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, stop_order: i + 1 })));
  };

  const saveStops = async (routeId: number) => {
    setSaving(routeId);
    setMsg('');
    try {
      const res = await apiFetch(`/api/admin/transport/routes/${routeId}/stops`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stops.map(s => ({
          stopOrder: s.stop_order,
          stopName: s.stop_name,
          pickupTime: s.pickup_time,
        }))),
      });
      const data = await res.json();
      if (data.success) {
        setMsg('Stops saved successfully');
        setTimeout(() => setMsg(''), 2000);
      } else throw new Error(data.error);
    } catch (err: any) {
      setMsg('Error: ' + err.message);
    } finally { setSaving(null); }
  };

  if (loading) return <div className="py-20 flex justify-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-4">
      {msg && (
        <Alert variant={msg.startsWith('Error') ? 'error' : 'success'}>
          <span>{msg}</span>
        </Alert>
      )}

      <p className="text-sm text-muted-foreground">Click a route to view and modify its boarding points and pickup timings.</p>

      <div className="space-y-3">
        {routes.map(route => (
          <Card key={route.id} className="p-0 overflow-hidden">
            <div
              onClick={() => expandRoute(route.id)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Badge variant="default" size="md" className="font-bold">
                  #{route.route_number}
                </Badge>
                <div>
                  <p className="font-bold text-foreground text-sm">{route.route_name}</p>
                  <p className="text-xs text-muted-foreground">{route.stop_count || 0} stops recorded</p>
                </div>
              </div>
              {expandedRoute === route.id ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            </div>

            {expandedRoute === route.id && (
              <div className="border-t border-border/50 p-5 space-y-4 bg-muted/10">
                {stops.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No stops defined. Click "Add Stop" to begin.</p>
                )}
                <div className="space-y-2">
                  {stops.map((stop, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground min-w-[2.5ch]">#{stop.stop_order}</span>
                      <Input
                        className="flex-1"
                        placeholder="Stop name"
                        value={stop.stop_name}
                        onChange={(e: any) => updateStop(idx, 'stop_name', e.target.value)}
                      />
                      <Input
                        className="w-32"
                        placeholder="e.g. 6:30 AM"
                        value={stop.pickup_time}
                        onChange={(e: any) => updateStop(idx, 'pickup_time', e.target.value)}
                      />
                      <Button size="icon-sm" variant="ghost" onClick={() => removeStop(idx)} className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="secondary" size="sm" onClick={addStop} className="flex items-center gap-1.5">
                    <Plus className="w-4 h-4" /> Add Stop
                  </Button>
                  <Button size="sm" variant="primary" onClick={() => saveStops(route.id)} disabled={saving === route.id} className="flex items-center gap-1.5">
                    <Save className="w-4 h-4" /> {saving === route.id ? 'Saving...' : 'Save Stops'}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function PlacementsSection() {
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Placement[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchPlacements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/transport/placements');
      const data = await res.json();
      if (data.success) setPlacements(data.placements);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPlacements(); }, [fetchPlacements]);

  const startEdit = () => {
    setEditData(placements.map(p => ({ ...p })));
    setEditing(true);
    setMsg('');
  };

  const addPlacement = () => {
    const routeNumbers = placements.map(p => p.route_number);
    const nextNum = routeNumbers.length > 0 ? String(Math.max(...routeNumbers.map(Number)) + 1) : '1';
    setEditData(prev => [...prev, { route_id: 0, route_number: nextNum, route_name: '', dispersal_time: '5PM', zone: '' }]);
  };

  const updatePlacement = (index: number, field: keyof Placement, value: any) => {
    setEditData(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const removePlacement = (index: number) => {
    setEditData(prev => prev.filter((_, i) => i !== index));
  };

  const savePlacements = async () => {
    setSaving(true);
    setMsg('');
    try {
      const res = await apiFetch('/api/admin/transport/placements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData.map(p => ({
          routeNumber: p.route_number,
          dispersalTime: p.dispersal_time,
          zone: p.zone,
        }))),
      });
      const data = await res.json();
      if (data.success) {
        setPlacements(editData);
        setEditing(false);
        setMsg('Placements saved successfully');
        setTimeout(() => setMsg(''), 2000);
      } else throw new Error(data.error);
    } catch (err: any) {
      setMsg('Error: ' + err.message);
    } finally { setSaving(false); }
  };

  if (loading) return <div className="py-20 flex justify-center"><LoadingSpinner size="lg" /></div>;

  const grouped: Record<string, Record<string, Placement[]>> = {};
  const current = editing ? editData : placements;
  current.forEach(p => {
    if (!grouped[p.dispersal_time]) grouped[p.dispersal_time] = {};
    if (!grouped[p.dispersal_time][p.zone]) grouped[p.dispersal_time][p.zone] = [];
    grouped[p.dispersal_time][p.zone].push(p);
  });

  return (
    <div className="space-y-4">
      {msg && (
        <Alert variant={msg.startsWith('Error') ? 'error' : 'success'}>
          <span>{msg}</span>
        </Alert>
      )}

      <div className="flex gap-2">
        {editing ? (
          <>
            <Button variant="primary" onClick={savePlacements} disabled={saving} className="flex items-center gap-1.5">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save All'}
            </Button>
            <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            <Button variant="secondary" size="sm" onClick={addPlacement} className="flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Add Entry
            </Button>
          </>
        ) : (
          <Button variant="outline" onClick={startEdit} className="flex items-center gap-1.5">
            <Upload className="w-4 h-4" /> Edit Placements
          </Button>
        )}
      </div>

      {Object.entries(grouped).map(([time, zones]) => (
        <div key={time} className="space-y-3 pt-2">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">{time} Dispersal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(zones).map(([zone, items]) => (
              <Card key={zone} className="p-4">
                <p className="text-sm font-bold text-primary mb-2">{zone}</p>
                <div className="text-xs text-muted-foreground">
                  <div className="flex flex-wrap gap-1.5">
                    {items.map((p, pIdx) => editing ? (
                      <span key={`${p.route_number}-${pIdx}`} className="inline-flex items-center gap-1 bg-muted/60 px-2 py-1 rounded-lg border border-border/50">
                        <input
                          className="w-16 px-1.5 py-0.5 rounded border bg-background text-xs border-border/50 outline-none"
                          value={p.route_number}
                          onChange={e => updatePlacement(current.indexOf(p), 'route_number', e.target.value)}
                        />
                        {p.route_name && <span className="text-muted-foreground">({p.route_name})</span>}
                        <Button size="icon-sm" variant="ghost" onClick={() => removePlacement(current.indexOf(p))} className="text-destructive hover:bg-destructive/10 h-5 w-5 p-0">
                          <X className="w-3 h-3" />
                        </Button>
                      </span>
                    ) : (
                      <Badge key={`r${p.route_number}-${pIdx}`} variant="default" size="sm" className="font-semibold">
                        #{p.route_number} {p.route_name ? `- ${p.route_name}` : ''}
                      </Badge>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ContactsSection() {
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [editData, setEditData] = useState<Record<number, { driver_name: string; driver_phone: string; whatsapp_group: string }>>({});
  const [saving, setSaving] = useState<number | null>(null);
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');

  const fetchRoutes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/transport/routes');
      const data = await res.json();
      if (data.success) { setRoutes(data.routes); }
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRoutes(); }, [fetchRoutes]);

  const startEdit = (route: BusRoute) => {
    setEditData(prev => ({
      ...prev,
      [route.id]: { driver_name: route.driver_name || '', driver_phone: route.driver_phone || '', whatsapp_group: route.whatsapp_group || '' }
    }));
  };

  const saveContact = async (routeId: number) => {
    const data = editData[routeId];
    if (!data) return;
    setSaving(routeId);
    setMsg('');
    try {
      const res = await apiFetch(`/api/admin/transport/routes/${routeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverName: data.driver_name,
          driverPhone: data.driver_phone,
          whatsappGroup: data.whatsapp_group,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setRoutes(prev => prev.map(r => r.id === routeId ? { ...r, ...data } : r));
        setEditData(prev => { const n = { ...prev }; delete n[routeId]; return n; });
        setMsg('Contact updated');
        setTimeout(() => setMsg(''), 2000);
      } else throw new Error(json.error);
    } catch (err: any) {
      setMsg('Error: ' + err.message);
    } finally { setSaving(null); }
  };

  const filtered = routes.filter(r => {
    const q = search.toLowerCase();
    return r.route_name.toLowerCase().includes(q) || r.route_number.includes(q) ||
      (r.driver_name || '').toLowerCase().includes(q) || (r.driver_phone || '').includes(q) ||
      (r.driver_incharge_name || '').toLowerCase().includes(q);
  });

  if (loading) return <div className="py-20 flex justify-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-4">
      {msg && (
        <Alert variant={msg.startsWith('Error') ? 'error' : 'success'}>
          <span>{msg}</span>
        </Alert>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9 w-full"
          placeholder="Search by route, driver name, or phone..."
          value={search}
          onChange={(e: any) => setSearch(e.target.value)}
        />
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="border-b border-border/50 bg-muted/40">
                <TableHead className="py-3 px-4 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Route</TableHead>
                <TableHead className="py-3 px-4 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Type</TableHead>
                <TableHead className="py-3 px-4 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Driver Name</TableHead>
                <TableHead className="py-3 px-4 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Phone</TableHead>
                <TableHead className="py-3 px-4 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Driver Incharge</TableHead>
                <TableHead className="py-3 px-4 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Supervisor</TableHead>
                <TableHead className="py-3 px-4 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">WhatsApp Group</TableHead>
                <TableHead className="py-3 px-4 text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(route => {
                const editing = editData[route.id];
                return (
                  <TableRow key={route.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                    <TableCell className="py-3 px-4">
                      <span className="font-bold text-primary">#{route.route_number}</span>
                      <span className="text-muted-foreground ml-2 text-xs">{route.route_name}</span>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <Badge variant={route.type === 'AC' ? 'info' : 'default'} size="sm">
                        {route.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      {editing ? (
                        <Input className="h-8 text-xs" value={editing.driver_name} onChange={(e: any) => setEditData(prev => ({ ...prev, [route.id]: { ...prev[route.id], driver_name: e.target.value } }))} />
                      ) : (
                        <span className={route.driver_name ? 'text-sm' : 'text-muted-foreground/50 italic text-xs'}>{route.driver_name || '—'}</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3 px-4 font-mono text-xs">
                      {editing ? (
                        <Input className="h-8 text-xs" value={editing.driver_phone} onChange={(e: any) => setEditData(prev => ({ ...prev, [route.id]: { ...prev[route.id], driver_phone: e.target.value } }))} />
                      ) : (
                        <span className={route.driver_phone ? '' : 'text-muted-foreground/50 italic'}>{route.driver_phone || '—'}</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-xs">
                      {route.driver_incharge_name ? (
                        <div>
                          <p className="font-medium text-foreground">{route.driver_incharge_name}</p>
                          <p className="text-muted-foreground font-mono">{route.driver_incharge_phone}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/50 italic">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-xs">
                      {route.supervisor_name ? (
                        <div>
                          <p className="font-medium text-foreground">{route.supervisor_name}</p>
                          <p className="text-muted-foreground font-mono">{route.supervisor_phone}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/50 italic">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-xs">
                      {editing ? (
                        <Input className="h-8 text-xs" value={editing.whatsapp_group} onChange={(e: any) => setEditData(prev => ({ ...prev, [route.id]: { ...prev[route.id], whatsapp_group: e.target.value } }))} />
                      ) : (
                        <span className={route.whatsapp_group ? 'truncate max-w-[140px] inline-block font-mono' : 'text-muted-foreground/50 italic'}>{route.whatsapp_group || '—'}</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right">
                      {editing ? (
                        <div className="flex gap-1 justify-end">
                          <Button size="icon-sm" variant="primary" onClick={() => saveContact(route.id)} disabled={saving === route.id} className="h-7 w-7">
                            <Save className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="icon-sm" variant="ghost" onClick={() => setEditData(prev => { const n = { ...prev }; delete n[route.id]; return n; })} className="h-7 w-7">
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="icon-sm" variant="ghost" onClick={() => startEdit(route)} className="h-7 w-7">
                          <Upload className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

function RulesSection() {
  const [rules, setRules] = useState<TransportRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<TransportRule[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/transport/rules');
      const data = await res.json();
      if (data.success) setRules(data.rules);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  const startEdit = () => {
    setEditData(rules.map(r => ({ ...r })));
    setEditing(true);
    setMsg('');
  };

  const addRule = () => {
    const maxNum = editData.reduce((max, r) => Math.max(max, r.rule_number), 0);
    setEditData(prev => [...prev, { rule_number: maxNum + 1, content: '' }]);
  };

  const updateRule = (index: number, field: keyof TransportRule, value: any) => {
    setEditData(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  };

  const removeRule = (index: number) => {
    setEditData(prev => prev.filter((_, i) => i !== index).map((r, i) => ({ ...r, rule_number: i + 1 })));
  };

  const saveRules = async () => {
    setSaving(true);
    setMsg('');
    try {
      const res = await apiFetch('/api/admin/transport/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData.map(r => ({ ruleNumber: r.rule_number, content: r.content }))),
      });
      const data = await res.json();
      if (data.success) {
        setRules(editData);
        setEditing(false);
        setMsg('Rules saved successfully');
        setTimeout(() => setMsg(''), 2000);
      } else throw new Error(data.error);
    } catch (err: any) {
      setMsg('Error: ' + err.message);
    } finally { setSaving(false); }
  };

  if (loading) return <div className="py-20 flex justify-center"><LoadingSpinner size="lg" /></div>;

  const current = editing ? editData : rules;

  return (
    <div className="space-y-4">
      {msg && (
        <Alert variant={msg.startsWith('Error') ? 'error' : 'success'}>
          <span>{msg}</span>
        </Alert>
      )}

      <div className="flex gap-2">
        {editing ? (
          <>
            <Button variant="primary" onClick={saveRules} disabled={saving} className="flex items-center gap-1.5">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save All Rules'}
            </Button>
            <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            <Button variant="secondary" size="sm" onClick={addRule} className="flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Add Rule
            </Button>
          </>
        ) : (
          <Button variant="outline" onClick={startEdit} className="flex items-center gap-1.5">
            <Upload className="w-4 h-4" /> Edit Rules
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {current.map((rule, idx) => (
          <Card key={rule.id || idx} className="p-4">
            <div className="flex gap-3">
              <span className="text-base font-bold text-primary shrink-0">{rule.rule_number}.</span>
              {editing ? (
                <div className="flex-1 space-y-2">
                  <Textarea
                    value={rule.content}
                    onChange={(e: any) => updateRule(idx, 'content', e.target.value)}
                    rows={2}
                  />
                  <Button variant="ghost" size="sm" onClick={() => removeRule(idx)} className="text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-4 h-4 mr-1" /> Remove
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{rule.content}</p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
