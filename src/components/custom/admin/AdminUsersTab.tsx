'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { GlassCard, GlassButton, GlassInput, SectionHeader, StatusBadge, EmptyState, LoadingSpinner } from '@/components/custom/admin/AdminUI';
import { UserPlus, Trash2, Shield, ShieldCheck, UserX, RefreshCcw, Download } from 'lucide-react';
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <SectionHeader title="User Management" description="Add, remove, and manage admin users" />
        <div className="flex flex-wrap gap-2">
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
      </div>

      {error && (
        <div className="p-3 bg-red-50/80 dark:bg-red-900/20 midnight:bg-red-900/20 text-red-600 dark:text-red-400 midnight:text-red-400 border border-red-200/50 dark:border-red-800/50 midnight:border-red-800/50 rounded-xl text-sm">
          {error}
        </div>
      )}

      {showAddForm && (
        <GlassCard>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white midnight:text-white">Add New User</h3>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="hidden md:block text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 midnight:text-gray-400 midnight:hover:text-gray-200"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 midnight:text-gray-300 mb-2">
                  VTOP Username
                </label>
                <GlassInput
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Enter VTOP ID (e.g., 21BCE1234)"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 midnight:text-gray-300 mb-2">
                  Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'admin' | 'superadmin')}
                  className="w-full px-4 py-3 rounded-xl border bg-white/80 dark:bg-slate-800/80 midnight:bg-white/[0.06] backdrop-blur-xl text-gray-900 dark:text-gray-100 midnight:text-white border-gray-200/50 dark:border-gray-700/50 midnight:border-white/10 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                >
                  <option value="admin">Admin</option>
                  <option value="superadmin">Superadmin</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 midnight:text-gray-300 mb-2">
                Permissions
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_PERMISSIONS.map((perm) => (
                  <button
                    key={perm.id}
                    type="button"
                    onClick={() => handleTogglePermission(perm.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      newPermissions.includes(perm.id)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 midnight:bg-gray-800 text-gray-700 dark:text-gray-300 midnight:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 midnight:hover:bg-gray-700'
                    }`}
                  >
                    {perm.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
              <GlassButton type="button" onClick={() => setShowAddForm(false)} variant="secondary" className="w-full sm:w-auto">
                Cancel
              </GlassButton>
              <GlassButton type="submit" variant="primary" disabled={addingUser || !newUsername.trim()} className="w-full sm:w-auto">
                {addingUser ? 'Adding...' : 'Add User'}
              </GlassButton>
            </div>
          </form>
        </GlassCard>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : users.length === 0 ? (
        <EmptyState
          icon={<UserPlus className="w-12 h-12" />}
          title="No Users Yet"
          description="Add your first admin user to get started."
        />
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <GlassCard key={user.username}>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    user.role === 'superadmin'
                      ? 'bg-purple-50 dark:bg-purple-900/30 midnight:bg-purple-900/30'
                      : 'bg-blue-50 dark:bg-blue-900/30 midnight:bg-blue-900/30'
                  }`}>
                    {user.role === 'superadmin' ? (
                      <ShieldCheck className="w-6 h-6 text-purple-600 dark:text-purple-400 midnight:text-purple-400" />
                    ) : (
                      <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400 midnight:text-blue-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white midnight:text-white">{user.username}</h3>
                      <StatusBadge status={user.role === 'superadmin' ? 'success' : 'info'} />
                      {!user.is_active && <StatusBadge status="error" />}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 midnight:text-gray-400">
                      Added by {user.added_by} • {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                  {editingUser === user.username ? (
                    <>
                      <div className="flex flex-wrap gap-1">
                        {AVAILABLE_PERMISSIONS.map((perm) => (
                          <button
                            key={perm.id}
                            type="button"
                            onClick={() => handleEditTogglePermission(perm.id)}
                            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                              editPermissions.includes(perm.id)
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 midnight:bg-gray-800 text-gray-600 dark:text-gray-400 midnight:text-gray-400'
                            }`}
                          >
                            {perm.label}
                          </button>
                        ))}
                      </div>
                      <GlassButton
                        onClick={() => handleUpdatePermissions(user.username)}
                        variant="primary"
                        className="text-xs flex-1 sm:flex-none"
                      >
                        Save
                      </GlassButton>
                      <GlassButton
                        onClick={() => setEditingUser(null)}
                        variant="secondary"
                        className="text-xs flex-1 sm:flex-none"
                      >
                        Cancel
                      </GlassButton>
                    </>
                  ) : (
                    <div className="flex gap-2 w-full sm:w-auto mt-2 lg:mt-0">
                      <GlassButton
                        onClick={() => {
                          setEditingUser(user.username);
                          setEditPermissions(user.permissions);
                        }}
                        variant="secondary"
                        className="text-xs flex-1 sm:flex-none"
                      >
                        Edit Perms
                      </GlassButton>
                      <GlassButton
                        onClick={() => handleToggleActive(user.username, user.is_active)}
                        variant={user.is_active ? 'secondary' : 'primary'}
                        className="text-xs flex-1 sm:flex-none"
                      >
                        {user.is_active ? <UserX className="w-4 h-4 mx-auto" /> : 'Activate'}
                      </GlassButton>
                      <GlassButton
                        onClick={() => handleDeleteUser(user.username)}
                        variant="danger"
                        className="text-xs flex-1 sm:flex-none"
                      >
                        <Trash2 className="w-4 h-4 mx-auto" />
                      </GlassButton>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                {user.permissions.map((perm) => (
                  <span
                    key={perm}
                    className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 midnight:bg-gray-800 text-gray-600 dark:text-gray-400 midnight:text-gray-400"
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
