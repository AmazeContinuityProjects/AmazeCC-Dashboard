"use client";

import React, { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { SectionHeader, GlassCard, LoadingSpinner, GlassButton } from "./AdminUI";
import { Trash2, Plus, MapPin, Car } from "lucide-react";

export default function CabShareAdminTab() {
  const [trips, setTrips] = useState<any[]>([]);
  const [hubs, setHubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newHubName, setNewHubName] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

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
                <tr key={t.trip_id} className="border-b border-gray-100 dark:border-slate-800/50 hover:bg-gray-50/30 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{t.name}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{t.reg_number}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{t.hub_name}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{new Date(t.travel_date).toLocaleDateString()} @ {t.preferred_time}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDeleteTrip(t.trip_id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
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
    </div>
  );
}
