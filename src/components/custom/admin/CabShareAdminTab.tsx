"use client";

import React, { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { SectionHeader, GlassCard, LoadingSpinner, GlassButton } from "./AdminUI";
import { Trash2, Plus, MapPin, Car, Eye, X, Phone, Calendar, Clock, User, Check, XCircle, Clock3, MapPin as MapPinIcon, Megaphone } from "lucide-react";

export default function CabShareAdminTab() {
  const [trips, setTrips] = useState<any[]>([]);
  const [hubs, setHubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newHubName, setNewHubName] = useState("");
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [promoteEnabled, setPromoteEnabled] = useState(false);
  const [promoteToggling, setPromoteToggling] = useState(false);

  useEffect(() => {
    fetchData();
    fetchPromoteState();
  }, []);

  const fetchPromoteState = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.amazecc.vit.ac.in'}/api/settings/global`);
      const data = await res.json();
      if (data?.success && data.config?.promoteCabShare?.enabled === true) {
        setPromoteEnabled(true);
      }
    } catch {}
  };

  const togglePromote = async () => {
    setPromoteToggling(true);
    try {
      const res = await apiFetch("/api/admin/settings/global", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "promoteCabShare", value: { enabled: !promoteEnabled } })
      });
      const data = await res.json();
      if (data.success) setPromoteEnabled(!promoteEnabled);
    } catch (e) {}
    setPromoteToggling(false);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tripsRes, hubsRes] = await Promise.all([
        apiFetch("/api/admin/cabshare/trips"),
        fetch("https://api.amazecc.vit.ac.in/api/cabshare/hubs").catch(()=>({ json: ()=>({success:false}) })) as any
      ]);
      const tripsData = await tripsRes.json();
      const hubsData = await hubsRes.json();
      if (tripsData.success) setTrips(tripsData.trips);
      if (hubsData.success) setHubs(hubsData.hubs);
    } catch (e) {}
    setLoading(false);
  };

  const handleDeleteTrip = async (tripId: number) => {
    if (!confirm("Delete this trip?")) return;
    try {
      const res = await apiFetch(`/api/admin/cabshare/trips?trip_id=${tripId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) fetchData();
      else alert(data.error);
    } catch (e) {}
  };

  const handleAddHub = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch("/api/admin/cabshare/hubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hub_name: newHubName })
      });
      const data = await res.json();
      if (data.success) {
        setNewHubName("");
        fetchData();
      } else alert(data.error);
    } catch (e) {}
  };

  const handleDeleteHub = async (hubId: number) => {
    if (!confirm("Delete this hub?")) return;
    try {
      const res = await apiFetch(`/api/admin/cabshare/hubs?hub_id=${hubId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) fetchData();
      else alert(data.error);
    } catch (e) {}
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8">
      <SectionHeader title="Cab Share Management" description="Manage active trips, hubs, and moderate the platform." />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hubs Management */}
        <GlassCard className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-500" /> Transport Hubs
          </h3>
          <form onSubmit={handleAddHub} className="flex gap-2">
            <input 
              type="text" 
              value={newHubName}
              onChange={(e) => setNewHubName(e.target.value)}
              placeholder="New Hub Name"
              className="flex-1 px-4 py-2 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 outline-none text-gray-900 dark:text-white"
            />
            <GlassButton type="submit" variant="primary"><Plus className="w-4 h-4" /> Add</GlassButton>
          </form>
          <div className="space-y-2 mt-4 max-h-60 overflow-y-auto">
            {hubs.map(h => (
              <div key={h.hub_id} className="flex justify-between items-center p-3 bg-white/40 dark:bg-slate-800/40 rounded-xl">
                <span className="font-medium text-gray-800 dark:text-gray-200">{h.hub_name}</span>
                <button onClick={() => handleDeleteHub(h.hub_id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Car className="w-5 h-5 text-emerald-500" /> Platform Stats
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white/40 dark:bg-slate-800/40 rounded-xl text-center">
              <p className="text-3xl font-bold text-emerald-500">{trips.length}</p>
              <p className="text-sm text-gray-500">Active Trips</p>
            </div>
            <div className="p-4 bg-white/40 dark:bg-slate-800/40 rounded-xl text-center">
              <p className="text-3xl font-bold text-blue-500">{hubs.length}</p>
              <p className="text-sm text-gray-500">Active Hubs</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between p-4 bg-amber-50/50 dark:bg-amber-950/10 rounded-xl border border-amber-200/50 dark:border-amber-900/30">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Promote Cab Share</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Show "Use CAB !!" banner on all users' mobile home</p>
              </div>
            </div>
            <button
              onClick={togglePromote}
              disabled={promoteToggling}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                promoteEnabled ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                promoteEnabled ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </GlassCard>
      </div>

      {/* Trips Table */}
      <GlassCard className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">All Active Trips</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 rounded-tl-xl">Host</th>
                <th className="px-4 py-3">Reg No</th>
                <th className="px-4 py-3">Hub</th>
                <th className="px-4 py-3">Date & Time</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 rounded-tr-xl text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {trips.map(t => (
                <tr key={t.trip_id} className="border-b border-gray-100 dark:border-slate-800/50 hover:bg-gray-50/30 dark:hover:bg-slate-800/30 cursor-pointer" onClick={() => setSelectedTrip(t)}>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{t.name}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{t.reg_number}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{t.hub_name}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{new Date(t.travel_date).toLocaleDateString()} @ {t.preferred_time}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      t.status === 'active' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={(e) => { e.stopPropagation(); setSelectedTrip(t); }} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg" title="View Details">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteTrip(t.trip_id); }} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {trips.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No active trips found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
      {/* Trip Detail Modal */}
      {selectedTrip && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedTrip(null)}>
          <div className="w-full max-w-2xl rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-gray-900 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Trip Details</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">ID: #{selectedTrip.trip_id}</p>
              </div>
              <button onClick={() => setSelectedTrip(null)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Trip Info */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="col-span-2 flex items-center gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
                <MapPinIcon className="w-5 h-5 text-blue-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedTrip.hub_name}</p>
                  <p className="text-xs text-gray-500">{selectedTrip.from_hub_name ? `${selectedTrip.from_hub_name} → ` : ''}{selectedTrip.hub_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
                <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{new Date(selectedTrip.travel_date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
                <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Time</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedTrip.preferred_time} ±{selectedTrip.tolerance_hours}h</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
                <User className="w-4 h-4 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Host</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedTrip.name}</p>
                  <p className="text-xs text-gray-500">{selectedTrip.reg_number}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
                <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Host Phone</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedTrip.phone_number || '—'}</p>
                </div>
              </div>
            </div>

            {selectedTrip.notes && (
              <div className="mb-6 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
                <p className="text-xs text-gray-500 mb-1">Notes</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedTrip.notes}</p>
              </div>
            )}

            {/* Match Requests */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
                Join Requests
                {selectedTrip.requests && (
                  <span className="ml-2 text-xs font-normal text-gray-500">
                    ({selectedTrip.requests.length} total)
                  </span>
                )}
              </h4>
              {selectedTrip.requests && selectedTrip.requests.length > 0 ? (
                <div className="space-y-3">
                  {selectedTrip.requests.map((req: any) => (
                    <div key={req.match_id} className="rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{req.name}</p>
                          <p className="text-xs text-gray-500">{req.reg_number}</p>
                        </div>
                        <span className={`shrink-0 px-2.5 py-1 text-[10px] font-black uppercase rounded-xl ${
                          req.status === 'accepted' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          req.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}>
                          {req.status === 'pending' ? (
                            <span className="flex items-center gap-1"><Clock3 className="w-3 h-3" /> Pending</span>
                          ) : req.status === 'accepted' ? (
                            <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Accepted</span>
                          ) : (
                            <span className="flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejected</span>
                          )}
                        </span>
                      </div>
                      {req.status === 'accepted' && (
                        <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20">
                          <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                              {req.name} · {req.phone_number}
                            </p>
                            <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                              Host: {selectedTrip.name} · {selectedTrip.phone_number}
                            </p>
                          </div>
                        </div>
                      )}
                      {req.status === 'pending' && (
                        <div className="mt-3 text-xs text-amber-600 dark:text-amber-400 font-semibold">
                          Awaiting host approval
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="p-4 text-sm text-gray-500 text-center rounded-2xl bg-gray-50 dark:bg-gray-800/50">No join requests yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
