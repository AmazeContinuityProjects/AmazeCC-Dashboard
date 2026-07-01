'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { GlassCard, GlassButton, GlassInput, SectionHeader, StatusBadge, EmptyState, LoadingSpinner } from '@/components/custom/admin/AdminUI';
import { UserPlus, Trash2, Shield, ShieldCheck, UserX, RefreshCcw, AlertCircle, Download } from 'lucide-react';
import { exportToExcel } from '@/lib/export';

interface AdminUser {
 username: string;
 role: 'superadmin' | 'admin';
 permissions: string[];
 added_by: string;
 is_active: boolean;
 created_at: string;
}

interface AdminUsersTabProps {
 currentUserRole: 'superadmin' | 'admin';
}

const AVAILABLE_PERMISSIONS = [
 { id: 'dashboard', label: 'Dashboard', description: 'View dashboard overview' },
 { id: 'qbank', label: 'Q-Bank', description: 'Manage question bank' },
 { id: 'buses', label: 'Bus Database', description: 'Manage bus routes' },
 { id: 'push', label: 'Push Broadcast', description: 'Send push notifications' },
 { id: 'fresher-resources', label: 'Fresher Resources', description: 'Manage fresher resources' },
 { id: 'faculty-directories', label: 'Faculty Directories', description: 'Manage faculty directories' },
 { id: 'users', label: 'User Management', description: 'Manage admin users' },
];

export default function AdminUsersTab({ currentUserRole }: AdminUsersTabProps) {
 const [users, setUsers] = useState<AdminUser[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState('');
 const [showAddForm, setShowAddForm] = useState(false);
 const [newUsername, setNewUsername] = useState('');
 const [newRole, setNewRole] = useState<'admin' | 'superadmin'>('admin');
 const [newPermissions, setNewPermissions] = useState<string[]>(['dashboard', 'qbank', 'buses', 'push', 'fresher-resources', 'faculty-directories']);
 const [addingUser, setAddingUser] = useState(false);
 const [editingUser, setEditingUser] = useState<string | null>(null);
 const [editPermissions, setEditPermissions] = useState<string[]>([]);

 const isSuperadmin = currentUserRole === 'superadmin';

 const fetchUsers = async () => {
 try {
 setLoading(true);
 setError('');
 const res = await apiFetch('/api/admin/users');
 const data = await res.json();
 if (data.success) {
 setUsers(data.users);
 } else {
 setError(data.error || 'Failed to fetch users');
 }
 } catch (err) {
 setError('Failed to fetch users');
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 if (isSuperadmin) {
 fetchUsers();
 }
 }, [isSuperadmin]);

 const handleAddUser = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!newUsername.trim()) return;

 setAddingUser(true);
 setError('');

 try {
 const res = await apiFetch('/api/admin/users', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 username: newUsername.trim(),
 role: newRole,
 permissions: newPermissions,
 }),
 });
 const data = await res.json();

 if (data.success) {
 setUsers(prev => [data.user, ...prev]);
 setNewUsername('');
 setNewRole('admin');
 setNewPermissions(['dashboard', 'qbank', 'buses', 'push', 'fresher-resources', 'faculty-directories']);
 setShowAddForm(false);
 } else {
 setError(data.error || 'Failed to add user');
 }
 } catch (err) {
 setError('Failed to add user');
 } finally {
 setAddingUser(false);
 }
 };

 const handleDeleteUser = async (username: string) => {
 if (!confirm(`Are you sure you want to remove ${username}?`)) return;

 try {
 const res = await apiFetch(`/api/admin/users/${username}`, {
 method: 'DELETE',
 });
 const data = await res.json();

 if (data.success) {
 setUsers(prev => prev.filter(u => u.username !== username));
 } else {
 setError(data.error || 'Failed to delete user');
 }
 } catch (err) {
 setError('Failed to delete user');
 }
 };

 const handleUpdatePermissions = async (username: string) => {
 try {
 const res = await apiFetch(`/api/admin/users/${username}`, {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ permissions: editPermissions }),
 });
 const data = await res.json();

 if (data.success) {
 setUsers(prev => prev.map(u => u.username === username ? { ...u, permissions: editPermissions } : u));
 setEditingUser(null);
 } else {
 setError(data.error || 'Failed to update permissions');
 }
 } catch (err) {
 setError('Failed to update permissions');
 }
 };

 const handleToggleActive = async (username: string, isActive: boolean) => {
 try {
 const res = await apiFetch(`/api/admin/users/${username}`, {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ is_active: !isActive }),
 });
 const data = await res.json();

 if (data.success) {
 setUsers(prev => prev.map(u => u.username === username ? { ...u, is_active: !isActive } : u));
 } else {
 setError(data.error || 'Failed to update user');
 }
 } catch (err) {
 setError('Failed to update user');
 }
 };

 const handleTogglePermission = (perm: string) => {
 setNewPermissions(prev =>
 prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
 );
 };

 const handleEditTogglePermission = (perm: string) => {
 setEditPermissions(prev =>
 prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
 );
 };

 const handleExport = () => {
 const exportData = users.map(u => ({
 Username: u.username,
 Role: u.role,
 Permissions: u.permissions.join(', '),
 'Added By': u.added_by,
 Status: u.is_active ? 'Active' : 'Inactive',
 'Created At': new Date(u.created_at).toLocaleString()
 }));
 exportToExcel(exportData, 'admin_users');
 };

 if (!isSuperadmin) {
 return (
 <EmptyState
 icon={<Shield className="w-12 h-12" />}
 title="Access Restricted"
 description="Only superadmins can manage users. You have admin access but cannot view or modify user permissions."
 />
 );
 }

 return (
 <div className="space-y-8">
 <SectionHeader 
 title="Admin Management" 
 description="Add, remove, and manage administrative users and their access levels." 
 breadcrumbs={[{ label: 'Admin', href: '#' }, { label: 'System', href: '#' }, { label: 'Users', active: true }]}
 action={
 <div className="flex gap-2">
 <GlassButton onClick={handleExport} variant="secondary" className="flex items-center gap-2">
 <Download className="w-4 h-4" />
 Export
 </GlassButton>
 <GlassButton onClick={fetchUsers} variant="secondary" className="flex items-center gap-2">
 <RefreshCcw className="w-4 h-4" />
 Refresh
 </GlassButton>
 <GlassButton onClick={() => setShowAddForm(!showAddForm)} variant="primary" className="flex items-center gap-2">
 <UserPlus className="w-4 h-4" />
 Add User
 </GlassButton>
 </div>
 }
 />

 {error && (
 <div className="p-4 bg-red-50/80 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-800/50 rounded-2xl text-sm font-bold uppercase tracking-widest flex items-center gap-3">
 <AlertCircle className="w-5 h-5" />
 {error}
 </div>
 )}

 {showAddForm && (
 <GlassCard innerGlow className="border-blue-500/10">
 <form onSubmit={handleAddUser} className="space-y-6">
 <div className="flex items-center justify-between">
 <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Provision New Admin</h3>
 <button
 type="button"
 onClick={() => setShowAddForm(false)}
 className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
 >
 Cancel
 </button>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <GlassInput
 label="VTOP Username"
 type="text"
 value={newUsername}
 onChange={(e) => setNewUsername(e.target.value)}
 placeholder="e.g., 21BCE1234"
 required
 />

 <div className="space-y-1.5">
 <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 tracking-tight">Access Role</label>
 <select
 value={newRole}
 onChange={(e) => setNewRole(e.target.value as 'admin' | 'superadmin')}
 className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-950 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-bold text-xs uppercase tracking-widest"
 >
 <option value="admin">Standard Admin</option>
 <option value="superadmin">Super Administrator</option>
 </select>
 </div>
 </div>

 <div className="space-y-3">
 <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 tracking-tight">Scope Permissions</label>
 <div className="flex flex-wrap gap-2">
 {AVAILABLE_PERMISSIONS.map((perm) => (
 <button
 key={perm.id}
 type="button"
 onClick={() => handleTogglePermission(perm.id)}
 className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
 newPermissions.includes(perm.id)
 ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
 : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
 }`}
 >
 {perm.label}
 </button>
 ))}
 </div>
 </div>

 <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
 <GlassButton type="button" onClick={() => setShowAddForm(false)} variant="secondary">
 Cancel
 </GlassButton>
 <GlassButton type="submit" variant="primary" disabled={addingUser || !newUsername.trim()}>
 {addingUser ? 'Provisioning...' : 'Confirm Provisioning'}
 </GlassButton>
 </div>
 </form>
 </GlassCard>
 )}

 {loading ? (
 <div className="py-20 flex justify-center"><LoadingSpinner size="lg" /></div>
 ) : users.length === 0 ? (
 <EmptyState
 icon={<UserPlus className="w-12 h-12" />}
 title="No Users Yet"
 description="Add your first admin user to get started."
 />
 ) : (
 <div className="grid grid-cols-1 gap-4">
 {users.map((user) => (
 <GlassCard key={user.username} innerGlow className="border-gray-100 dark:border-gray-800 hover:scale-[1.01] transition-transform">
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
 <div className="flex items-center gap-5">
 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform ${
 user.role === 'superadmin'
 ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
 : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
 }`}>
 {user.role === 'superadmin' ? (
 <ShieldCheck className="w-7 h-7" />
 ) : (
 <Shield className="w-7 h-7" />
 )}
 </div>
 <div>
 <div className="flex items-center gap-3">
 <h3 className="text-xl font-black text-gray-900 dark:text-white leading-none tracking-tight">{user.username}</h3>
 <StatusBadge status={user.role === 'superadmin' ? 'success' : 'info'} />
 {!user.is_active && <StatusBadge status="error" />}
 </div>
 <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">
 Authorized by {user.added_by} &bull; {new Date(user.created_at).toLocaleDateString()}
 </p>
 </div>
 </div>

 <div className="flex items-center gap-3 ml-auto md:ml-0">
 {editingUser === user.username ? (
 <>
 <div className="flex flex-wrap gap-1 mr-4">
 {AVAILABLE_PERMISSIONS.map((perm) => (
 <button
 key={perm.id}
 type="button"
 onClick={() => handleEditTogglePermission(perm.id)}
 className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
 editPermissions.includes(perm.id)
 ? 'bg-blue-600 text-white'
 : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400'
 }`}
 >
 {perm.label}
 </button>
 ))}
 </div>
 <GlassButton onClick={() => handleUpdatePermissions(user.username)} variant="primary" size="sm">Save</GlassButton>
 <GlassButton onClick={() => setEditingUser(null)} variant="secondary" size="sm">Cancel</GlassButton>
 </>
 ) : (
 <div className="flex gap-2 w-full sm:w-auto mt-2 lg:mt-0">
 <GlassButton
 onClick={() => {
 setEditingUser(user.username);
 setEditPermissions(user.permissions);
 }}
 variant="secondary"
 size="sm"
 className="text-[10px] font-black uppercase tracking-widest"
 >
 Edit Policy
 </GlassButton>
 <button
 onClick={() => handleToggleActive(user.username, user.is_active)}
 className={`p-2.5 rounded-xl transition-all ${
 user.is_active 
 ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100' 
 : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100'
 }`}
 title={user.is_active ? "Suspend User" : "Activate User"}
 >
 {user.is_active ? <UserX className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
 </button>
 <button
 onClick={() => handleDeleteUser(user.username)}
 className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 transition-all"
 title="Revoke Access"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 )}
 </div>
 </div>

 <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-2">
 <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest self-center mr-2">Scope:</span>
 {user.permissions.map((perm) => (
 <span
 key={perm}
 className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] bg-gray-50 dark:bg-slate-900 text-gray-500 border border-gray-100 dark:border-gray-800"
 >
 {perm}
 </span>
 ))}
 </div>
 </GlassCard>
 ))}
 </div>
 )}
 </div>
 );
}
