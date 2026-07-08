'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Bus, MapPin, Phone, ClipboardList, Search, Plus, Trash2, Save,
  X, ChevronDown, ChevronRight, AlertCircle, CheckCircle, Upload, Download, Database
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import {
  GlassCard, GlassButton, GlassInput, GlassTextarea, GlassSelect,
  SectionHeader, LoadingSpinner, EmptyState
} from './AdminUI';

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
    <div>
      <SectionHeader
        title="Transport Manager"
        description="Manage bus routes, stops, placements, contacts, and rules."
        action={
          <div className="flex items-center gap-3">
            {seedMsg && (
              <span className={`text-xs font-medium ${seedMsg.startsWith('Error') ? 'text-red-500' : 'text-green-500'}`}>
                {seedMsg}
              </span>
            )}
            <button
              onClick={runSeed}
              disabled={seeding}
              className="relative flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-accent-foreground text-sm font-semibold disabled:opacity-50 transition-all hover:brightness-110 overflow-hidden"
            >
              {seeding && (
                <div className="absolute inset-0 bg-accent-foreground/10 transition-all" style={{ width: `${seedProgress}%` }} />
              )}
              <Database className="w-4 h-4 relative z-10" />
              <span className="relative z-10">{seeding ? `Seeding ${seedProgress}%` : 'Load Seed Data'}</span>
            </button>
          </div>
        }
      />
      <div className="flex gap-1.5 p-1 bg-muted/50 rounded-xl border border-border/50 mb-6 overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg whitespace-nowrap transition-all flex-1 ${
                activeSection === tab.id
                  ? 'bg-card shadow-sm text-accent'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>
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

  if (loading) return <LoadingSpinner />;

  return (
    <div>
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
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-background text-foreground placeholder-muted-foreground border-border/50 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-sm"
          placeholder="Search routes by name or number..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        {filtered.map(route => (
          <GlassCard key={route.id} padding="p-0">
            <button
              onClick={() => editId === route.id ? cancelEdit() : startEdit(route)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-accent/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-accent min-w-[3ch]">#{route.route_number}</span>
                <div>
                  <p className="font-semibold text-foreground">{route.route_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {route.type} &middot; {route.stop_count || 0} stops
                  </p>
                </div>
              </div>
              {editId === route.id ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            </button>
            {editId === route.id && (
              <div className="border-t border-border/50 p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <GlassInput label="Route Name" value={editData.route_name || ''} onChange={e => setEditData(p => ({ ...p, route_name: e.target.value }))} />
                  <GlassSelect
                    label="Type"
                    options={[{ value: 'AC', label: 'AC' }, { value: 'Non-AC', label: 'Non-AC' }]}
                    value={editData.type || 'AC'}
                    onChange={e => setEditData(p => ({ ...p, type: e.target.value }))}
                  />
                  <GlassInput label="Driver Name" value={editData.driver_name || ''} onChange={e => setEditData(p => ({ ...p, driver_name: e.target.value }))} />
                  <GlassInput label="Driver Phone" value={editData.driver_phone || ''} onChange={e => setEditData(p => ({ ...p, driver_phone: e.target.value }))} />
                  <GlassInput label="WhatsApp Group" value={editData.whatsapp_group || ''} onChange={e => setEditData(p => ({ ...p, whatsapp_group: e.target.value }))} />
                  <GlassInput label="Bus Location" value={editData.bus_location || ''} onChange={e => setEditData(p => ({ ...p, bus_location: e.target.value }))} />
                  <GlassInput label="Supervisor Name" value={editData.supervisor_name || ''} onChange={e => setEditData(p => ({ ...p, supervisor_name: e.target.value }))} />
                  <GlassInput label="Supervisor Phone" value={editData.supervisor_phone || ''} onChange={e => setEditData(p => ({ ...p, supervisor_phone: e.target.value }))} />
                  <GlassInput label="Driver Incharge Name" value={editData.driver_incharge_name || ''} onChange={e => setEditData(p => ({ ...p, driver_incharge_name: e.target.value }))} />
                  <GlassInput label="Driver Incharge Phone" value={editData.driver_incharge_phone || ''} onChange={e => setEditData(p => ({ ...p, driver_incharge_phone: e.target.value }))} />
                </div>
                <div className="flex gap-2 justify-end">
                  <GlassButton variant="ghost" onClick={cancelEdit}><X className="w-4 h-4 mr-1" />Cancel</GlassButton>
                  <GlassButton onClick={saveRoute} disabled={saving}>
                    <Save className="w-4 h-4 mr-1" />{saving ? 'Saving...' : 'Save'}
                  </GlassButton>
                </div>
              </div>
            )}
          </GlassCard>
        ))}
        {filtered.length === 0 && (
          <EmptyState icon={<Search className="w-10 h-10 text-muted-foreground/50 mb-2" />} title="No routes found" description={search ? 'Try a different search term.' : 'No routes loaded. Run seed first.'} />
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

  if (loading) return <LoadingSpinner />;

  return (
    <div>
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
      <p className="text-sm text-muted-foreground mb-4">Click a route to edit its boarding points and pickup times.</p>
      <div className="space-y-2">
        {routes.map(route => (
          <GlassCard key={route.id} padding="p-0">
            <button
              onClick={() => expandRoute(route.id)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-accent/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-accent min-w-[3ch]">#{route.route_number}</span>
                <div>
                  <p className="font-semibold text-foreground">{route.route_name}</p>
                  <p className="text-xs text-muted-foreground">{route.stop_count || 0} stops</p>
                </div>
              </div>
              {expandedRoute === route.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {expandedRoute === route.id && (
              <div className="border-t border-border/50 p-4 space-y-3">
                {stops.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No stops defined. Click "Add Stop" to begin.</p>
                )}
                {stops.map((stop, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground min-w-[2ch]">#{stop.stop_order}</span>
                    <input
                      className="flex-1 px-3 py-2 rounded-lg border bg-background text-foreground text-sm border-border/50 outline-none focus:ring-2 focus:ring-accent/20"
                      placeholder="Stop name"
                      value={stop.stop_name}
                      onChange={e => updateStop(idx, 'stop_name', e.target.value)}
                    />
                    <input
                      className="w-28 px-3 py-2 rounded-lg border bg-background text-foreground text-sm border-border/50 outline-none focus:ring-2 focus:ring-accent/20"
                      placeholder="6.30 AM"
                      value={stop.pickup_time}
                      onChange={e => updateStop(idx, 'pickup_time', e.target.value)}
                    />
                    <button onClick={() => removeStop(idx)} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2 pt-2">
                  <GlassButton variant="secondary" size="sm" onClick={addStop}>
                    <Plus className="w-4 h-4 mr-1" />Add Stop
                  </GlassButton>
                  <GlassButton size="sm" onClick={() => saveStops(route.id)} disabled={saving === route.id}>
                    <Save className="w-4 h-4 mr-1" />{saving === route.id ? 'Saving...' : 'Save Stops'}
                  </GlassButton>
                </div>
              </div>
            )}
          </GlassCard>
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

  if (loading) return <LoadingSpinner />;

  const grouped: Record<string, Record<string, Placement[]>> = {};
  const current = editing ? editData : placements;
  current.forEach(p => {
    if (!grouped[p.dispersal_time]) grouped[p.dispersal_time] = {};
    if (!grouped[p.dispersal_time][p.zone]) grouped[p.dispersal_time][p.zone] = [];
    grouped[p.dispersal_time][p.zone].push(p);
  });

  return (
    <div>
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
      <div className="flex gap-2 mb-4">
        {editing ? (
          <>
            <GlassButton onClick={savePlacements} disabled={saving}>
              <Save className="w-4 h-4 mr-1" />{saving ? 'Saving...' : 'Save All'}
            </GlassButton>
            <GlassButton variant="ghost" onClick={() => setEditing(false)}>Cancel</GlassButton>
            <GlassButton variant="secondary" size="sm" onClick={addPlacement}>
              <Plus className="w-4 h-4 mr-1" />Add Entry
            </GlassButton>
          </>
        ) : (
          <GlassButton onClick={startEdit}><Upload className="w-4 h-4 mr-1" />Edit</GlassButton>
        )}
      </div>
      {Object.entries(grouped).map(([time, zones]) => (
        <div key={time} className="mb-6">
          <h3 className="text-sm font-bold text-foreground mb-3">{time} Dispersal</h3>
          <div className="space-y-3">
            {Object.entries(zones).map(([zone, items]) => (
              <GlassCard key={zone}>
                <p className="text-sm font-semibold text-accent mb-2">{zone}</p>
                <p className="text-xs text-muted-foreground">
                  Routes: {items.map((p, pIdx) => editing ? (
                    <span key={`${p.route_number}-${pIdx}`} className="inline-flex items-center gap-1 mr-2">
                      <input
                        className="w-16 px-2 py-1 rounded border bg-background text-xs border-border/50"
                        value={p.route_number}
                        onChange={e => updatePlacement(current.indexOf(p), 'route_number', e.target.value)}
                      />
                      {p.route_name && <span className="text-muted-foreground">({p.route_name})</span>}
                      <button onClick={() => removePlacement(current.indexOf(p))} className="text-destructive hover:bg-destructive/10 rounded p-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ) : (
                    <span key={`r${p.route_number}-${pIdx}`} className="inline-block bg-accent/10 text-accent px-2 py-0.5 rounded text-xs mr-1 mb-1">
                      #{p.route_number} {p.route_name ? `- ${p.route_name}` : ''}
                    </span>
                  ))}
                </p>
              </GlassCard>
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

  if (loading) return <LoadingSpinner />;

  return (
    <div>
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
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-background text-foreground placeholder-muted-foreground border-border/50 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-sm"
          placeholder="Search by route, name, or phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 text-left text-muted-foreground text-xs uppercase tracking-wider">
              <th className="px-3 py-2 font-semibold">Route</th>
              <th className="px-3 py-2 font-semibold">Name</th>
              <th className="px-3 py-2 font-semibold">Driver Name</th>
              <th className="px-3 py-2 font-semibold">Phone</th>
              <th className="px-3 py-2 font-semibold">Driver Incharge</th>
              <th className="px-3 py-2 font-semibold">Supervisor</th>
              <th className="px-3 py-2 font-semibold">WhatsApp Group</th>
              <th className="px-3 py-2 font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(route => {
              const editing = editData[route.id];
              return (
                <tr key={route.id} className="border-b border-border/30 hover:bg-accent/5 transition-colors">
                  <td className="px-3 py-2.5">
                    <span className="font-bold text-accent">#{route.route_number}</span>
                    <span className="text-muted-foreground ml-2">{route.route_name}</span>
                  </td>
                  <td className="px-3 py-2.5 text-xs"><span className={`px-2 py-0.5 rounded-full font-semibold ${route.type === 'AC' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'}`}>{route.type}</span></td>
                  <td className="px-3 py-2.5">
                    {editing ? (
                      <input className="w-full px-2 py-1 rounded border bg-background text-sm border-border/50" value={editing.driver_name} onChange={e => setEditData(prev => ({ ...prev, [route.id]: { ...prev[route.id], driver_name: e.target.value } }))} />
                    ) : (
                      <span className={route.driver_name ? '' : 'text-muted-foreground/50 italic'}>{route.driver_name || '—'}</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    {editing ? (
                      <input className="w-full px-2 py-1 rounded border bg-background text-sm border-border/50" value={editing.driver_phone} onChange={e => setEditData(prev => ({ ...prev, [route.id]: { ...prev[route.id], driver_phone: e.target.value } }))} />
                    ) : (
                      <span className={route.driver_phone ? '' : 'text-muted-foreground/50 italic'}>{route.driver_phone || '—'}</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={route.driver_incharge_name || route.driver_incharge_phone ? '' : 'text-muted-foreground/50 italic'}>
                      {route.driver_incharge_name ? <>{route.driver_incharge_name}<br /><span className="text-xs text-muted-foreground">{route.driver_incharge_phone}</span></> : '—'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={route.supervisor_name || route.supervisor_phone ? '' : 'text-muted-foreground/50 italic'}>
                      {route.supervisor_name ? <>{route.supervisor_name}<br /><span className="text-xs text-muted-foreground">{route.supervisor_phone}</span></> : '—'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    {editing ? (
                      <input className="w-full px-2 py-1 rounded border bg-background text-sm border-border/50" value={editing.whatsapp_group} onChange={e => setEditData(prev => ({ ...prev, [route.id]: { ...prev[route.id], whatsapp_group: e.target.value } }))} />
                    ) : (
                      <span className={route.whatsapp_group ? 'text-xs truncate max-w-[150px] inline-block' : 'text-muted-foreground/50 italic'}>{route.whatsapp_group || '—'}</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    {editing ? (
                      <div className="flex gap-1">
                        <GlassButton size="sm" onClick={() => saveContact(route.id)} disabled={saving === route.id}>
                          {saving === route.id ? '...' : <Save className="w-3 h-3" />}
                        </GlassButton>
                        <GlassButton size="sm" variant="ghost" onClick={() => setEditData(prev => { const n = { ...prev }; delete n[route.id]; return n; })}>
                          <X className="w-3 h-3" />
                        </GlassButton>
                      </div>
                    ) : (
                      <GlassButton size="sm" variant="ghost" onClick={() => startEdit(route)}>
                        <Upload className="w-3 h-3" />
                      </GlassButton>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
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

  if (loading) return <LoadingSpinner />;

  const current = editing ? editData : rules;

  return (
    <div>
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
      <div className="flex gap-2 mb-4">
        {editing ? (
          <>
            <GlassButton onClick={saveRules} disabled={saving}>
              <Save className="w-4 h-4 mr-1" />{saving ? 'Saving...' : 'Save All'}
            </GlassButton>
            <GlassButton variant="ghost" onClick={() => setEditing(false)}>Cancel</GlassButton>
            <GlassButton variant="secondary" size="sm" onClick={addRule}>
              <Plus className="w-4 h-4 mr-1" />Add Rule
            </GlassButton>
          </>
        ) : (
          <GlassButton onClick={startEdit}><Upload className="w-4 h-4 mr-1" />Edit Rules</GlassButton>
        )}
      </div>
      <div className="space-y-3">
        {current.map((rule, idx) => (
          <GlassCard key={rule.id || idx}>
            <div className="flex gap-3">
              <span className="text-lg font-bold text-accent shrink-0">{rule.rule_number}.</span>
              {editing ? (
                <div className="flex-1 space-y-2">
                  <GlassTextarea
                    value={rule.content}
                    onChange={e => updateRule(idx, 'content', e.target.value)}
                    rows={2}
                  />
                  <GlassButton variant="ghost" size="sm" onClick={() => removeRule(idx)}>
                    <Trash2 className="w-4 h-4 mr-1" />Remove
                  </GlassButton>
                </div>
              ) : (
                <p className="text-sm text-foreground whitespace-pre-line">{rule.content}</p>
              )}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
