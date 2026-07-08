"use client";
import { useState, useEffect } from "react";
import { apiFetch, fetcher } from "@/lib/api";
import useSWR from 'swr';
import { Pencil, Trash2, Search, Plus, X, Save, Users, ShieldAlert, Globe, User } from "lucide-react";
import { GlassCard, GlassButton, GlassInput, GlassTextarea, GlassSelect, SectionHeader, EmptyState, LoadingSpinner } from "./AdminUI";
import { Badge } from "@amazecontinuityprojects/amazeui";

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
      <SectionHeader 
        title="Clubs & Chapters" 
        description="Manage club profiles and recruitment links"
        action={
          <GlassButton
            onClick={() => setEditingClub({ club_id: '', club_name: '', mission: '', description: '', hiring_process: '', website: '', recruitment_link: '', instagram: '', whatsapp: '', poc: '', logo_url: '' })}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Club
          </GlassButton>
        }
      />

      <GlassCard className="overflow-hidden p-0" padding="">
        <div className="p-4 border-b border-border/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
            <GlassInput
              type="text"
              placeholder="Search clubs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 flex justify-center"><LoadingSpinner /></div>
        ) : error ? (
          <EmptyState icon={<ShieldAlert />} title="Error" description={error} />
        ) : filteredClubs.length === 0 ? (
          <EmptyState icon={<Search />} title="No clubs found" description="No clubs match your search criteria." />
        ) : (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredClubs.map(club => (
              <GlassCard 
                key={club.club_id} 
                hover
                className="group relative overflow-hidden flex flex-col"
              >
                <div className="absolute top-0 right-0 p-32 bg-accent/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all duration-300 group-hover:bg-accent/10" />
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="mb-4">
                    <Badge variant="info" className="mb-3">{club.club_id}</Badge>
                    <h3 className="text-lg font-bold text-foreground leading-tight">
                      {club.club_name}
                    </h3>
                  </div>

                  <div className="flex-1 space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Globe className="w-4 h-4 flex-shrink-0" />
                      {club.website ? (
                        <a href={club.website} target="_blank" rel="noreferrer" className="text-accent hover:underline truncate">
                          {club.website.replace(/^https?:\/\//, '')}
                        </a>
                      ) : (
                        <span className="opacity-50 italic">No website</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <User className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{club.poc || <span className="opacity-50 italic">No POC</span>}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border/50 mt-auto">
                    <GlassButton
                      variant="ghost"
                      onClick={() => setEditingClub(club)}
                      className="flex-1 flex items-center justify-center gap-2"
                    >
                      <Pencil className="w-4 h-4" />
                      Edit Details
                    </GlassButton>
                    <div className="w-px h-6 bg-border mx-2" />
                    <GlassButton
                      variant="ghost"
                      onClick={() => {
                        setManagingRepsFor(club);
                        fetchReps(club.club_id);
                      }}
                      className="flex-1 flex items-center justify-center gap-2"
                    >
                      <Users className="w-4 h-4" />
                      Representatives
                    </GlassButton>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </GlassCard>

      {editingClub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <GlassCard padding="p-0" className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/50">
              <h3 className="font-bold text-lg text-foreground">
                {editingClub.club_id ? 'Edit Club' : 'New Club'}
              </h3>
              <GlassButton variant="ghost" size="sm" onClick={() => setEditingClub(null)} className="p-1.5 rounded-full">
                <X className="w-4 h-4" />
              </GlassButton>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <form id="club-form" onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <GlassInput 
                    label="Club ID"
                    required type="text" 
                    value={editingClub.club_id} 
                    onChange={e => setEditingClub({...editingClub, club_id: e.target.value})} 
                    placeholder="e.g. ACM" 
                    disabled={!!clubs.find(c => c.club_id === editingClub.club_id)} 
                  />
                  <GlassInput 
                    label="Club Name"
                    required type="text" 
                    value={editingClub.club_name} 
                    onChange={e => setEditingClub({...editingClub, club_name: e.target.value})} 
                    placeholder="e.g. ACM STUDENT CHAPTER" 
                  />
                </div>

                <GlassTextarea 
                  label="Mission"
                  value={editingClub.mission || ''} 
                  onChange={e => setEditingClub({...editingClub, mission: e.target.value})} 
                  placeholder="Club mission statement..." 
                  className="h-20"
                />
                
                <GlassTextarea 
                  label="Description"
                  value={editingClub.description || ''} 
                  onChange={e => setEditingClub({...editingClub, description: e.target.value})} 
                  placeholder="Detailed description..." 
                  className="h-28"
                />

                <GlassTextarea 
                  label="Hiring Process"
                  value={editingClub.hiring_process || ''} 
                  onChange={e => setEditingClub({...editingClub, hiring_process: e.target.value})} 
                  placeholder="Explain the recruitment process..." 
                  className="h-20"
                />

                <div className="grid grid-cols-2 gap-4">
                  <GlassInput 
                    label="Website URL"
                    type="url" 
                    value={editingClub.website || ''} 
                    onChange={e => setEditingClub({...editingClub, website: e.target.value})} 
                    placeholder="https://" 
                  />
                  <GlassInput 
                    label="Recruitment Link"
                    type="url" 
                    value={editingClub.recruitment_link || ''} 
                    onChange={e => setEditingClub({...editingClub, recruitment_link: e.target.value})} 
                    placeholder="https://forms..." 
                  />
                  <GlassInput 
                    label="Instagram Handle/URL"
                    type="text" 
                    value={editingClub.instagram || ''} 
                    onChange={e => setEditingClub({...editingClub, instagram: e.target.value})} 
                    placeholder="@acmvitc" 
                  />
                  <GlassInput 
                    label="WhatsApp Group URL"
                    type="url" 
                    value={editingClub.whatsapp || ''} 
                    onChange={e => setEditingClub({...editingClub, whatsapp: e.target.value})} 
                    placeholder="https://chat.whatsapp.com/..." 
                  />
                  <div className="col-span-2">
                    <GlassInput 
                      label="Point of Contact (POC)"
                      type="text" 
                      value={editingClub.poc || ''} 
                      onChange={e => setEditingClub({...editingClub, poc: e.target.value})} 
                      placeholder="Name - Phone/Email" 
                    />
                  </div>
                  <div className="col-span-2">
                    <GlassInput 
                      label="Logo URL (Optional)"
                      type="url" 
                      value={editingClub.logo_url || ''} 
                      onChange={e => setEditingClub({...editingClub, logo_url: e.target.value})} 
                      placeholder="https://example.com/logo.png" 
                    />
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-4 border-t border-border/50 bg-muted/50 flex justify-end gap-3">
              <GlassButton variant="secondary" type="button" onClick={() => setEditingClub(null)}>
                Cancel
              </GlassButton>
              <GlassButton variant="primary" form="club-form" type="submit" disabled={isSaving} className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </GlassButton>
            </div>
          </GlassCard>
        </div>
      )}

      {managingRepsFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <GlassCard padding="p-0" className="w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/50">
              <div>
                <h3 className="font-bold text-lg text-foreground">
                  Representatives
                </h3>
                <p className="text-xs text-muted-foreground">For {managingRepsFor.club_name}</p>
              </div>
              <GlassButton variant="ghost" size="sm" onClick={() => setManagingRepsFor(null)} className="p-1.5 rounded-full">
                <X className="w-4 h-4" />
              </GlassButton>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              <form onSubmit={handleAddRep} className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <GlassInput 
                      required type="text" 
                      value={newRepVtopId} 
                      onChange={e => setNewRepVtopId(e.target.value)} 
                      className="uppercase" 
                      placeholder="VTOP Reg No. (e.g. 21BCE0000)" 
                    />
                  </div>
                  <div>
                    <GlassSelect 
                      value={newRepRole} 
                      onChange={e => setNewRepRole(e.target.value)} 
                      options={[
                        { value: 'representative', label: 'Representative' },
                        { value: 'super-club-rep', label: 'Super Rep' }
                      ]}
                    />
                  </div>
                  <GlassButton type="submit" disabled={isSaving} className="flex items-center gap-2 mt-[2px] h-[42px]">
                    <Plus className="w-4 h-4" /> Add
                  </GlassButton>
                </div>
              </form>

              {reps.length > 0 ? (
                <div className="space-y-2">
                  {reps.map(rep => (
                    <div key={rep.vtop_id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border/50">
                      <div>
                        <p className="font-medium text-foreground">{rep.vtop_id}</p>
                        <p className="text-xs text-muted-foreground">Role: <span className="capitalize">{rep.role}</span> &bull; Assigned by {rep.assigned_by}</p>
                      </div>
                      <GlassButton variant="ghost" size="sm" onClick={() => handleRemoveRep(rep.vtop_id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4" />
                      </GlassButton>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={<ShieldAlert />} title="No representatives" description="No representatives assigned yet." />
              )}
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
