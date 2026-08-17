'use client';
import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { 
  Card, 
  Button, 
  Input, 
  Select, 
  SectionHeader, 
  StatusBadge, 
  Badge, 
  EmptyState, 
  LoadingSpinner, 
  Alert 
} from '@/components/custom/admin/AdminUI';
import { UserPlus, Trash2, Shield, ShieldCheck, UserX, RefreshCcw, AlertCircle, Download, Check, X } from 'lucide-react';
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
  { id: 'gorobo', label: 'GoRoBo', description: 'GoRoBo inventory, billing & wallet' },
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
      <Card className="p-12 text-center">
        <EmptyState
          icon={<Shield className="w-12 h-12 text-muted-foreground/50 mb-3" />}
          title="Access Restricted"
          description="Only superadmins can manage users. You have standard admin access but cannot modify user authorization policies."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <SectionHeader 
        title="Admin Management" 
        description="Add, remove, and manage administrative users and their access levels." 
        breadcrumbs={[{ label: 'Admin', href: '#' }, { label: 'System', href: '#' }, { label: 'Users', active: true }]}
        action={
          <div className="flex gap-2">
            <Button onClick={handleExport} variant="outline" size="sm" className="flex items-center gap-1.5">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button onClick={fetchUsers} variant="outline" size="sm" className="flex items-center gap-1.5">
              <RefreshCcw className="w-4 h-4" />
              Refresh
            </Button>
            <Button onClick={() => setShowAddForm(!showAddForm)} variant="primary" size="sm" className="flex items-center gap-1.5">
              <UserPlus className="w-4 h-4" />
              Add User
            </Button>
          </div>
        }
      />

      {error && (
        <Alert variant="error">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        </Alert>
      )}

      {showAddForm && (
        <Card className="p-6 border-primary/20 bg-muted/10">
          <form onSubmit={handleAddUser} className="space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <h3 className="text-base font-bold text-foreground">Provision New Admin</h3>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="VTOP Username *"
                type="text"
                value={newUsername}
                onChange={(e: any) => setNewUsername(e.target.value)}
                placeholder="e.g. 21BCE1234"
                required
              />

              <Select
                label="Access Role"
                value={newRole}
                onChange={(e: any) => setNewRole(e.target.value as 'admin' | 'superadmin')}
                options={[
                  { value: 'admin', label: 'Standard Admin' },
                  { value: 'superadmin', label: 'Super Administrator' }
                ]}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Scope Permissions</label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_PERMISSIONS.map((perm) => (
                  <Button
                    key={perm.id}
                    type="button"
                    variant={newPermissions.includes(perm.id) ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => handleTogglePermission(perm.id)}
                    className="text-xs font-semibold"
                  >
                    {perm.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/50">
              <Button type="button" onClick={() => setShowAddForm(false)} variant="ghost" size="sm">
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={addingUser || !newUsername.trim()}>
                {addingUser ? 'Provisioning...' : 'Confirm Provisioning'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="py-20 flex justify-center"><LoadingSpinner size="lg" /></div>
      ) : users.length === 0 ? (
        <Card className="p-12 text-center">
          <EmptyState
            icon={<UserPlus className="w-12 h-12 text-muted-foreground/50 mb-3" />}
            title="No Users Found"
            description="Add your first administrator to grant access to the dashboard."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {users.map((user) => (
            <Card key={user.username} hover className="p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    user.role === 'superadmin'
                      ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                      : 'bg-primary/10 text-primary'
                  }`}>
                    {user.role === 'superadmin' ? (
                      <ShieldCheck className="w-6 h-6" />
                    ) : (
                      <Shield className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-foreground">{user.username}</h3>
                      <Badge variant={user.role === 'superadmin' ? 'info' : 'default'} size="sm">
                        {user.role}
                      </Badge>
                      <Badge variant={user.is_active ? 'success' : 'danger'} size="sm">
                        {user.is_active ? 'Active' : 'Suspended'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Authorized by {user.added_by} &bull; {new Date(user.created_at).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-auto md:ml-0">
                  {editingUser === user.username ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex flex-wrap gap-1">
                        {AVAILABLE_PERMISSIONS.map((perm) => (
                          <Button
                            key={perm.id}
                            type="button"
                            size="sm"
                            variant={editPermissions.includes(perm.id) ? 'primary' : 'ghost'}
                            onClick={() => handleEditTogglePermission(perm.id)}
                            className="text-[11px] h-7 px-2"
                          >
                            {perm.label}
                          </Button>
                        ))}
                      </div>
                      <Button onClick={() => handleUpdatePermissions(user.username)} variant="primary" size="sm" className="h-7 px-2.5">
                        <Check className="w-3.5 h-3.5 mr-1" /> Save
                      </Button>
                      <Button onClick={() => setEditingUser(null)} variant="ghost" size="sm" className="h-7 px-2">
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => {
                          setEditingUser(user.username);
                          setEditPermissions(user.permissions);
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Edit Policy
                      </Button>
                      <Button
                        size="icon-sm"
                        variant={user.is_active ? 'ghost' : 'outline'}
                        onClick={() => handleToggleActive(user.username, user.is_active)}
                        title={user.is_active ? "Suspend User" : "Activate User"}
                      >
                        {user.is_active ? <UserX className="w-4 h-4 text-amber-600 dark:text-amber-400" /> : <ShieldCheck className="w-4 h-4 text-emerald-600" />}
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => handleDeleteUser(user.username)}
                        title="Revoke Access"
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border/50 flex flex-wrap gap-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider self-center mr-1">Scope:</span>
                {user.permissions.map((perm) => (
                  <Badge key={perm} variant="default" size="sm" className="text-[10px] font-mono">
                    {perm}
                  </Badge>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
