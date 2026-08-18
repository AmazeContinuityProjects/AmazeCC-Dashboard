'use client';
import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { Pencil, Trash2, Search, Plus, X, Save, Users, ShieldAlert, Globe, User } from 'lucide-react';
import { 
  Card, 
  Button, 
  Input, 
  Textarea, 
  Select, 
  SectionHeader, 
  EmptyState, 
  LoadingSpinner, 
  Badge, 
  Modal 
} from '@/components/custom/admin/AdminUI';

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
        body: JSON.stringify({ club_id: managingRepsFor.club_id, vtop_id: newRepVtopId.trim().toUpperCase(), role: newRepRole })
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
    <div className="space-y-6 animate-fadeIn">
      <SectionHeader 
        title="Clubs & Student Chapters" 
        description="Manage university student organizations, executive representatives, and public recruitment registration links."
        action={
          <Button
            variant="primary"
            onClick={() => setEditingClub({ club_id: '', club_name: '', mission: '', description: '', hiring_process: '', website: '', recruitment_link: '', instagram: '', whatsapp: '', poc: '', logo_url: '' })}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Club
          </Button>
        }
      />

      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
          <Input
            type="text"
            placeholder="Search clubs by name or ID..."
            value={searchQuery}
            onChange={(e: any) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </Card>

      {loading ? (
        <div className="py-20 flex justify-center"><LoadingSpinner size="lg" /></div>
      ) : error ? (
        <Card className="p-12 text-center">
          <EmptyState icon={<ShieldAlert className="w-12 h-12 text-destructive" />} title="Error Loading Clubs" description={error} />
        </Card>
      ) : filteredClubs.length === 0 ? (
        <Card className="p-12 text-center">
          <EmptyState icon={<Search className="w-12 h-12 text-muted-foreground/50" />} title="No clubs found" description="No student organizations matched your search query." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredClubs.map(club => (
            <Card 
              key={club.club_id} 
              hover
              className="p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="info" size="sm">{club.club_id}</Badge>
                </div>
                <h3 className="text-base font-bold text-foreground leading-snug">
                  {club.club_name}
                </h3>

                <div className="space-y-2 mt-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2.5">
                    <Globe className="w-4 h-4 shrink-0 text-primary" />
                    {club.website ? (
                      <a href={club.website} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate">
                        {club.website.replace(/^https?:\/\//, '')}
                      </a>
                    ) : (
                      <span className="italic">No website registered</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2.5">
                    <User className="w-4 h-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{club.poc || <span className="italic">No POC specified</span>}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-border/50 mt-5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingClub(club)}
                  className="flex-1 flex items-center justify-center gap-1.5"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setManagingRepsFor(club);
                    fetchReps(club.club_id);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  Reps
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit / Add Club Modal */}
      <Modal
        isOpen={editingClub !== null}
        onClose={() => setEditingClub(null)}
        title={editingClub?.club_id && clubs.find(c => c.club_id === editingClub.club_id) ? 'Edit Club Profile' : 'Add New Club'}
        maxWidth="max-w-2xl"
      >
        {editingClub && (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input 
                label="Club ID *"
                required 
                type="text" 
                value={editingClub.club_id} 
                onChange={(e: any) => setEditingClub({ ...editingClub, club_id: e.target.value.toUpperCase() })} 
                placeholder="e.g. ACM" 
                disabled={!!clubs.find(c => c.club_id === editingClub.club_id)} 
              />
              <Input 
                label="Club Name *"
                required 
                type="text" 
                value={editingClub.club_name} 
                onChange={(e: any) => setEditingClub({ ...editingClub, club_name: e.target.value })} 
                placeholder="e.g. ACM Student Chapter" 
              />
            </div>

            <Textarea 
              label="Mission Statement"
              value={editingClub.mission || ''} 
              onChange={(e: any) => setEditingClub({ ...editingClub, mission: e.target.value })} 
              placeholder="Brief description of the club's primary mission..." 
              rows={2}
            />
            
            <Textarea 
              label="Description & Overview"
              value={editingClub.description || ''} 
              onChange={(e: any) => setEditingClub({ ...editingClub, description: e.target.value })} 
              placeholder="Detailed description of domains, events, and initiatives..." 
              rows={3}
            />

            <Textarea 
              label="Hiring & Recruitment Process"
              value={editingClub.hiring_process || ''} 
              onChange={(e: any) => setEditingClub({ ...editingClub, hiring_process: e.target.value })} 
              placeholder="Explain how students can apply, rounds, and interview details..." 
              rows={2}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input 
                label="Official Website URL"
                type="url" 
                value={editingClub.website || ''} 
                onChange={(e: any) => setEditingClub({ ...editingClub, website: e.target.value })} 
                placeholder="https://..." 
              />
              <Input 
                label="Recruitment Link / Google Form"
                type="url" 
                value={editingClub.recruitment_link || ''} 
                onChange={(e: any) => setEditingClub({ ...editingClub, recruitment_link: e.target.value })} 
                placeholder="https://forms.gle/..." 
              />
              <Input 
                label="Instagram Handle or Link"
                type="text" 
                value={editingClub.instagram || ''} 
                onChange={(e: any) => setEditingClub({ ...editingClub, instagram: e.target.value })} 
                placeholder="@club_handle" 
              />
              <Input 
                label="WhatsApp Community Link"
                type="url" 
                value={editingClub.whatsapp || ''} 
                onChange={(e: any) => setEditingClub({ ...editingClub, whatsapp: e.target.value })} 
                placeholder="https://chat.whatsapp.com/..." 
              />
              <div className="sm:col-span-2">
                <Input 
                  label="Point of Contact (POC Name & Contact)"
                  type="text" 
                  value={editingClub.poc || ''} 
                  onChange={(e: any) => setEditingClub({ ...editingClub, poc: e.target.value })} 
                  placeholder="President / General Secretary — Phone/Email" 
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-3 border-t border-border/50">
              <Button variant="ghost" type="button" onClick={() => setEditingClub(null)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={isSaving} className="flex items-center gap-1.5">
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Club'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Managing Representatives Modal */}
      <Modal
        isOpen={managingRepsFor !== null}
        onClose={() => setManagingRepsFor(null)}
        title={managingRepsFor ? `Club Representatives: ${managingRepsFor.club_name}` : 'Representatives'}
        maxWidth="max-w-lg"
      >
        {managingRepsFor && (
          <div className="space-y-4">
            <form onSubmit={handleAddRep} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input 
                  required 
                  type="text" 
                  value={newRepVtopId} 
                  onChange={(e: any) => setNewRepVtopId(e.target.value)} 
                  className="uppercase" 
                  placeholder="VTOP Reg No (e.g. 21BCE0000)" 
                />
                <Select 
                  value={newRepRole} 
                  onChange={(e: any) => setNewRepRole(e.target.value)} 
                  options={[
                    { value: 'representative', label: 'Standard Rep' },
                    { value: 'super-club-rep', label: 'Super Rep' }
                  ]}
                />
              </div>
              <Button type="submit" variant="primary" size="sm" disabled={isSaving} className="w-full flex items-center justify-center gap-1.5">
                <Plus className="w-4 h-4" /> Add Representative
              </Button>
            </form>

            <div className="pt-2 border-t border-border/50 space-y-2 max-h-60 overflow-y-auto">
              {reps.length > 0 ? (
                reps.map(rep => (
                  <div key={rep.vtop_id} className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border/40">
                    <div>
                      <p className="font-bold text-foreground text-sm font-mono">{rep.vtop_id}</p>
                      <p className="text-xs text-muted-foreground">Role: <span className="capitalize font-semibold">{rep.role}</span> &bull; By {rep.assigned_by}</p>
                    </div>
                    <Button size="icon-sm" variant="ghost" onClick={() => handleRemoveRep(rep.vtop_id)} className="text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-center py-6 text-xs text-muted-foreground">
                  No representatives assigned to this club yet.
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
