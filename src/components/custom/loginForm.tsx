'use client';

import { useState } from "react";
import { Eye, EyeOff, User, Lock, AlertCircle, Sparkles, ShieldCheck } from "lucide-react";
import { Button, Input, Badge } from "@amazecontinuityprojects/amazeui";
import { IconToggle } from "./toggle";

interface LoginFormProps {
  username: string;
  setUsername: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  isLoading?: boolean;
  error?: string;
  message?: string;
  progressBar?: number;
  handleFormSubmit: (e: React.FormEvent) => void;
  handleDemoClick?: () => void;
  residentialStatus?: 'hosteller' | 'dayscholar';
  setResidentialStatus?: (status: 'hosteller' | 'dayscholar') => void;
  isDayscholarWithBus?: boolean;
  setIsDayscholarWithBus?: (withBus: boolean) => void;
}

export default function LoginForm({
  username,
  setUsername,
  password,
  setPassword,
  isLoading = false,
  error = '',
  message = '',
  progressBar = 0,
  handleFormSubmit,
  handleDemoClick,
  residentialStatus = 'hosteller',
  setResidentialStatus,
  isDayscholarWithBus = false,
  setIsDayscholarWithBus,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  const getActiveTab = () => {
    if (residentialStatus === 'dayscholar' && isDayscholarWithBus) return 'bus';
    if (residentialStatus === 'dayscholar') return 'dayscholar';
    return 'hosteller';
  };

  const handleTabChange = (tab: 'hosteller' | 'dayscholar' | 'bus') => {
    if (tab === 'hosteller') {
      setResidentialStatus?.('hosteller');
      setIsDayscholarWithBus?.(false);
    } else if (tab === 'dayscholar') {
      setResidentialStatus?.('dayscholar');
      setIsDayscholarWithBus?.(false);
    } else if (tab === 'bus') {
      setResidentialStatus?.('dayscholar');
      setIsDayscholarWithBus?.(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden transition-colors duration-300">
      {/* Background Subtle Ambient Glows */}
      <div className="absolute -top-48 -left-48 w-96 h-96 bg-accent/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-48 -right-48 w-96 h-96 bg-info/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Right Theme Switcher */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <IconToggle />
      </div>

      <div className="w-full max-w-md z-10 space-y-6 animate-fadeIn">
        {/* App Header & Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-card border border-border/60 shadow-lg p-2.5 hover:scale-105 transition-transform duration-300">
            <img
              src="/logo.png"
              alt="AmazeCC Logo"
              className="w-full h-full object-contain drop-shadow-md"
            />
          </div>
          <div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <h1 className="text-3xl font-black tracking-tight text-foreground font-display">
                Amaze<span className="text-accent">CC</span>
              </h1>
              <Badge variant="info" size="sm">Admin</Badge>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Showing data from VTOP in a clean and simple way.
            </p>
          </div>
        </div>

        {/* Main Card Container */}
        <div className="bg-card/70 backdrop-blur-2xl border border-border/50 shadow-[0_12px_40px_rgba(0,0,0,0.12)] rounded-3xl p-8 space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold text-foreground tracking-tight">Sign In</h2>
            <p className="text-xs text-muted-foreground">Enter your credentials or try Demo Mode</p>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* VTOP Username */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                VTOP Username
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <User className="w-4 h-4" />
                </div>
                <Input
                  type="text"
                  value={username}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                  className="w-full pl-10 bg-background/80 backdrop-blur-xl border-border/60 focus:border-accent focus:ring-1 focus:ring-accent transition-all rounded-xl text-sm"
                  placeholder="Enter VTOP Username or Admin ID"
                  required
                />
              </div>
            </div>

            {/* VTOP Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                VTOP Password
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Lock className="w-4 h-4" />
                </div>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 bg-background/80 backdrop-blur-xl border-border/60 focus:border-accent focus:ring-1 focus:ring-accent transition-all rounded-xl text-sm"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Segmented Status Selector */}
            {setResidentialStatus && (
              <div className="flex bg-muted/60 p-1 rounded-xl border border-border/40 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => handleTabChange('hosteller')}
                  className={`flex-1 py-2 rounded-lg transition-all ${
                    getActiveTab() === 'hosteller'
                      ? 'bg-card text-foreground font-semibold shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Hosteller
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('dayscholar')}
                  className={`flex-1 py-2 rounded-lg transition-all ${
                    getActiveTab() === 'dayscholar'
                      ? 'bg-card text-foreground font-semibold shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Dayscholar
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('bus')}
                  className={`flex-1 py-2 rounded-lg transition-all ${
                    getActiveTab() === 'bus'
                      ? 'bg-card text-foreground font-semibold shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  DS (Bus)
                </button>
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl text-xs font-medium backdrop-blur-xl animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Progress Bar / Message */}
            {isLoading && (
              <div className="space-y-2 py-1">
                <div className="w-full bg-muted/60 rounded-full h-2 overflow-hidden border border-border/40">
                  <div
                    className="h-full bg-accent transition-all duration-300 ease-out"
                    style={{ width: `${progressBar > 0 ? progressBar : 65}%` }}
                  />
                </div>
                {message && (
                  <p className="text-xs text-center text-muted-foreground font-medium animate-pulse">
                    {message}
                  </p>
                )}
              </div>
            )}

            {/* Login Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-xl transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 text-sm"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Login</span>
              )}
            </Button>
          </form>

          {/* Try Demo Mode Section */}
          {handleDemoClick && (
            <div className="pt-3 border-t border-border/40 text-center space-y-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleDemoClick}
                className="w-full py-2.5 bg-accent/10 hover:bg-accent/20 border-accent/30 text-accent font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-xs"
              >
                <Sparkles className="w-4 h-4" />
                <span>Explore Full Demo Mode</span>
              </Button>
              <p className="text-[11px] text-muted-foreground">
                Preview all portal features without authenticating with VTOP
              </p>
            </div>
          )}
        </div>

        {/* Footer Notice */}
        <div className="text-center space-y-1">
          <p className="text-[11px] text-muted-foreground max-w-xs mx-auto leading-relaxed">
            Not affiliated with VIT or VTOP. For educational use only.
            <br />
            Please read the Privacy Policy & Terms of Service before using the app.
          </p>
        </div>
      </div>
    </div>
  );
}
