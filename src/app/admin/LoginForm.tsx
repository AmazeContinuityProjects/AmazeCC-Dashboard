'use client';
import { useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function LoginForm({ onAuthenticated }: { onAuthenticated?: () => void }) {
 const [username, setUsername] = useState('');
 const [password, setPassword] = useState('');
 const [error, setError] = useState('');
 const [isLoading, setIsLoading] = useState(false);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setIsLoading(true);
 setError('');

 try {
 const res = await apiFetch('/api/admin/auth', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ username, password }),
 });

 const data = await res.json();
 if (data.success && data.token) {
 localStorage.setItem('admin_token', data.token);
 onAuthenticated?.();
 } else {
 setError(data.error || data.message || 'Authentication failed');
 }
 } catch (err) {
 setError('An error occurred. Please try again.');
 } finally {
 setIsLoading(false);
 }
 };

  return (
  <div className="w-full max-w-sm bg-card border border-border/50 rounded-md shadow-medium p-6">
  <div className="text-center mb-6">
  <h2 className="text-xl font-bold text-foreground">
  Admin Authentication
  </h2>
  <p className="text-sm text-muted-foreground mt-1">
  Enter the master password to access the admin portal.
  </p>
  </div>

  <form onSubmit={handleSubmit} className="space-y-4">
  <div>
  <label className="block text-sm font-medium text-foreground mb-1.5">
  VTOP ID
  </label>
  <input
  type="text"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
  className="w-full px-3.5 py-2.5 rounded-sm border border-input bg-background text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all outline-none text-sm"
  placeholder="Enter admin VTOP ID"
  required
  />
  </div>

  <div>
  <label className="block text-sm font-medium text-foreground mb-1.5">
  Password
  </label>
  <input
  type="password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  className="w-full px-3.5 py-2.5 rounded-sm border border-input bg-background text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all outline-none text-sm"
  placeholder="••••••••"
  required
  />
  </div>

  {error && (
  <div className="p-2.5 bg-destructive/10 text-destructive border border-destructive/20 rounded-sm text-sm text-center font-medium">
  {error}
  </div>
  )}

  <button
  type="submit"
  disabled={isLoading}
  className="w-full bg-accent text-accent-foreground font-medium py-2.5 rounded-sm transition-all shadow-small hover:brightness-110 disabled:opacity-50 text-sm"
  >
  {isLoading ? 'Authenticating...' : 'Login'}
  </button>
  </form>
  </div>
  );
}
