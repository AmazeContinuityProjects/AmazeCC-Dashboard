"use client";
import { useState, useEffect } from "react";
import { apiFetch, fetcher } from "@/lib/api";
import useSWR from 'swr';
import { Pencil, Trash2, Search, Plus, X, Save, Users, ShieldAlert, Globe, User } from "lucide-react";

export default function ClubsManagementTab() {
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [editingClub, setEditingClub] = useState<any | null>(null);
  const [managingRepsFor, setManagingRepsFor] = useState<any | null>(null);
  const [reps, setReps] = useState<any[]>([]);
  const [newRepVtopId, setNewRepVtopId] = useState('');
  const [newRepRole, setNewRepRole] = useState('representative');
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchClubs = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/clubs');
      const data = await res.json();
      if (data.success) {
        setClubs(data.clubs || []);
      } else {
        setError(data.error || 'Failed to fetch clubs');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching clubs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClub?.club_id || !editingClub?.club_name) return;
    
    setIsSaving(true);
    try {
      const res = await apiFetch('/api/admin/clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingClub)
      });
      const data = await res.json();
      if (data.success) {
        setEditingClub(null);
        fetchClubs();
      } else {
        alert(data.error || 'Failed to save club details');
      }
    } catch (err: any) {
      alert(err.message || 'Error saving club details');
    } finally {
      setIsSaving(false);
    }
  };

  const fetchReps = async (club_id: string) => {
    try {
      const res = await apiFetch(`/api/admin/clubs/representatives?club_id=${encodeURIComponent(club_id)}`);
      const data = await res.json();
      if (data.success) {
        setReps(data.representatives || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddRep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRepVtopId || !managingRepsFor) return;
    
    setIsSaving(true);
    try {
      const res = await apiFetch('/api/admin/clubs/representatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ club_id: managingRepsFor.club_id, vtop_id: newRepVtopId, role: newRepRole })
      });
      const data = await res.json();
      if (data.success) {
        setNewRepVtopId('');
        setNewRepRole('representative');
        fetchReps(managingRepsFor.club_id);
      } else {
        alert(data.error || 'Failed to add representative');
      }
    } catch (err: any) {
      alert(err.message || 'Error adding representative');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveRep = async (vtop_id: string) => {
    if (!confirm('Are you sure you want to remove this representative?')) return;
    try {
      const res = await apiFetch('/api/admin/clubs/representatives', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ club_id: managingRepsFor.club_id, vtop_id })
      });
      const data = await res.json();
      if (data.success) {
        fetchReps(managingRepsFor.club_id);
      } else {
        alert(data.error || 'Failed to remove representative');
      }
    } catch (err: any) {
      alert(err.message || 'Error removing representative');
    }
  };

  const filteredClubs = clubs.filter(c => c.club_name.toLowerCase().includes(searchQuery.toLowerCase()) || c.club_id.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 midnight:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 midnight:border-white/10">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white midnight:text-white">Clubs & Chapters</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 midnight:text-gray-400 mt-1">Manage club profiles and recruitment links</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setEditingClub({ club_id: '', club_name: '', mission: '', description: '', hiring_process: '', website: '', recruitment_link: '', instagram: '', whatsapp: '', poc: '', logo_url: '' })}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Club
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 midnight:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 midnight:border-white/10 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 midnight:border-white/10">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search clubs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900 midnight:bg-black border border-gray-200 dark:border-gray-700 midnight:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow text-gray-900 dark:text-gray-100 midnight:text-gray-100"
            />
          </div>
        </div>



        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading clubs...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : filteredClubs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No clubs found.</div>
        ) : (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredClubs.map(club => (
              <div 
                key={club.club_id} 
                className="group relative bg-white dark:bg-gray-800/80 midnight:bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-gray-100 dark:border-gray-700 midnight:border-white/10 p-5 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              >
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 p-32 bg-blue-500/5 dark:bg-blue-500/10 midnight:bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all duration-300 group-hover:bg-blue-500/10 dark:group-hover:bg-blue-500/20" />
                
                <div className="relative z-10 flex flex-col h-full">
                  {/* Header */}
                  <div className="mb-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-900/30 midnight:bg-blue-900/20 text-blue-600 dark:text-blue-400 midnight:text-blue-300 text-xs font-semibold mb-3 tracking-wide">
                      {club.club_id}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white midnight:text-white leading-tight">
                      {club.club_name}
                    </h3>
                  </div>

                  {/* Body Details */}
                  <div className="flex-1 space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 midnight:text-gray-300">
                      <Globe className="w-4 h-4 text-gray-400 midnight:text-gray-500 flex-shrink-0" />
                      {club.website ? (
                        <a href={club.website} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 midnight:text-blue-400 hover:underline truncate">
                          {club.website.replace(/^https?:\/\//, '')}
                        </a>
                      ) : (
                        <span className="opacity-50 italic">No website</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 midnight:text-gray-300">
                      <User className="w-4 h-4 text-gray-400 midnight:text-gray-500 flex-shrink-0" />
                      <span className="truncate">{club.poc || <span className="opacity-50 italic">No POC</span>}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700/50 midnight:border-white/10 mt-auto">
                    <button
                      onClick={() => setEditingClub(club)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 midnight:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 midnight:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 midnight:hover:bg-blue-900/20 rounded-xl transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                      Edit Details
                    </button>
                    <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 midnight:bg-white/10 mx-2" />
                    <button
                      onClick={() => {
                        setManagingRepsFor(club);
                        fetchReps(club.club_id);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 midnight:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 midnight:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 midnight:hover:bg-purple-900/20 rounded-xl transition-colors"
                    >
                      <Users className="w-4 h-4" />
                      Representatives
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingClub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 midnight:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 midnight:border-white/10 bg-gray-50 dark:bg-gray-900/50 midnight:bg-black/50">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white midnight:text-white">
                {editingClub.club_id ? 'Edit Club' : 'New Club'}
              </h3>
              <button onClick={() => setEditingClub(null)} className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 bg-gray-200 dark:bg-gray-700 midnight:bg-white/10 midnight:hover:bg-white/20 rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <form id="club-form" onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 midnight:text-gray-300 mb-1">Club ID</label>
                    <input required type="text" value={editingClub.club_id} onChange={e => setEditingClub({...editingClub, club_id: e.target.value})} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 midnight:bg-black border border-gray-200 dark:border-gray-700 midnight:border-white/10 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors text-gray-900 dark:text-white midnight:text-white" placeholder="e.g. ACM" disabled={!!clubs.find(c => c.club_id === editingClub.club_id)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 midnight:text-gray-300 mb-1">Club Name</label>
                    <input required type="text" value={editingClub.club_name} onChange={e => setEditingClub({...editingClub, club_name: e.target.value})} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 midnight:bg-black border border-gray-200 dark:border-gray-700 midnight:border-white/10 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors text-gray-900 dark:text-white midnight:text-white" placeholder="e.g. ACM STUDENT CHAPTER" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 midnight:text-gray-300 mb-1">Mission</label>
                  <textarea value={editingClub.mission || ''} onChange={e => setEditingClub({...editingClub, mission: e.target.value})} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 midnight:bg-black border border-gray-200 dark:border-gray-700 midnight:border-white/10 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors h-20 resize-none text-gray-900 dark:text-white midnight:text-white" placeholder="Club mission statement..." />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 midnight:text-gray-300 mb-1">Description</label>
                  <textarea value={editingClub.description || ''} onChange={e => setEditingClub({...editingClub, description: e.target.value})} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 midnight:bg-black border border-gray-200 dark:border-gray-700 midnight:border-white/10 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors h-28 resize-none text-gray-900 dark:text-white midnight:text-white" placeholder="Detailed description..." />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 midnight:text-gray-300 mb-1">Hiring Process</label>
                  <textarea value={editingClub.hiring_process || ''} onChange={e => setEditingClub({...editingClub, hiring_process: e.target.value})} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 midnight:bg-black border border-gray-200 dark:border-gray-700 midnight:border-white/10 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors h-20 resize-none text-gray-900 dark:text-white midnight:text-white" placeholder="Explain the recruitment process..." />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 midnight:text-gray-300 mb-1">Website URL</label>
                    <input type="url" value={editingClub.website || ''} onChange={e => setEditingClub({...editingClub, website: e.target.value})} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 midnight:bg-black border border-gray-200 dark:border-gray-700 midnight:border-white/10 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors text-gray-900 dark:text-white midnight:text-white" placeholder="https://" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 midnight:text-gray-300 mb-1">Recruitment Link</label>
                    <input type="url" value={editingClub.recruitment_link || ''} onChange={e => setEditingClub({...editingClub, recruitment_link: e.target.value})} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 midnight:bg-black border border-gray-200 dark:border-gray-700 midnight:border-white/10 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors text-gray-900 dark:text-white midnight:text-white" placeholder="https://forms..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 midnight:text-gray-300 mb-1">Instagram Handle/URL</label>
                    <input type="text" value={editingClub.instagram || ''} onChange={e => setEditingClub({...editingClub, instagram: e.target.value})} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 midnight:bg-black border border-gray-200 dark:border-gray-700 midnight:border-white/10 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors text-gray-900 dark:text-white midnight:text-white" placeholder="@acmvitc" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 midnight:text-gray-300 mb-1">WhatsApp Group URL</label>
                    <input type="url" value={editingClub.whatsapp || ''} onChange={e => setEditingClub({...editingClub, whatsapp: e.target.value})} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 midnight:bg-black border border-gray-200 dark:border-gray-700 midnight:border-white/10 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors text-gray-900 dark:text-white midnight:text-white" placeholder="https://chat.whatsapp.com/..." />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 midnight:text-gray-300 mb-1">Point of Contact (POC)</label>
                    <input type="text" value={editingClub.poc || ''} onChange={e => setEditingClub({...editingClub, poc: e.target.value})} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 midnight:bg-black border border-gray-200 dark:border-gray-700 midnight:border-white/10 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors text-gray-900 dark:text-white midnight:text-white" placeholder="Name - Phone/Email" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 midnight:text-gray-300 mb-1">Logo URL (Optional)</label>
                    <input type="url" value={editingClub.logo_url || ''} onChange={e => setEditingClub({...editingClub, logo_url: e.target.value})} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 midnight:bg-black border border-gray-200 dark:border-gray-700 midnight:border-white/10 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors text-gray-900 dark:text-white midnight:text-white" placeholder="https://example.com/logo.png" />
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 midnight:border-white/10 bg-gray-50 dark:bg-gray-900/50 midnight:bg-black/50 flex justify-end gap-3">
              <button type="button" onClick={() => setEditingClub(null)} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 midnight:text-gray-300 bg-white dark:bg-gray-800 midnight:bg-slate-800 border border-gray-200 dark:border-gray-700 midnight:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 midnight:hover:bg-slate-700 transition-colors">
                Cancel
              </button>
              <button form="club-form" type="submit" disabled={isSaving} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50">
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {managingRepsFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 midnight:bg-slate-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 midnight:border-white/10 bg-gray-50 dark:bg-gray-900/50 midnight:bg-black/50">
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white midnight:text-white">
                  Representatives
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">For {managingRepsFor.club_name}</p>
              </div>
              <button onClick={() => setManagingRepsFor(null)} className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 bg-gray-200 dark:bg-gray-700 midnight:bg-white/10 midnight:hover:bg-white/20 rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              <form onSubmit={handleAddRep} className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input required type="text" value={newRepVtopId} onChange={e => setNewRepVtopId(e.target.value)} className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 midnight:bg-black border border-gray-200 dark:border-gray-700 midnight:border-white/10 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors text-gray-900 dark:text-white midnight:text-white uppercase" placeholder="VTOP Reg No. (e.g. 21BCE0000)" />
                  <select value={newRepRole} onChange={e => setNewRepRole(e.target.value)} className="px-3 py-2 bg-gray-50 dark:bg-gray-900 midnight:bg-black border border-gray-200 dark:border-gray-700 midnight:border-white/10 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors text-gray-900 dark:text-white midnight:text-white">
                    <option value="representative">Representative</option>
                    <option value="super-club-rep">Super Rep</option>
                  </select>
                  <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>
              </form>

              {reps.length > 0 ? (
                <div className="space-y-2">
                  {reps.map(rep => (
                    <div key={rep.vtop_id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 midnight:bg-black/50 rounded-lg border border-gray-100 dark:border-gray-800 midnight:border-white/10">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white midnight:text-white">{rep.vtop_id}</p>
                        <p className="text-xs text-gray-500">Role: <span className="capitalize">{rep.role}</span> &bull; Assigned by {rep.assigned_by}</p>
                      </div>
                      <button onClick={() => handleRemoveRep(rep.vtop_id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-6 text-gray-500 text-sm">
                  <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No representatives assigned yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
