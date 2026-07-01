"use client";
import { Eye } from "lucide-react";
import { useState } from "react";

interface LoginFormProps {
 username: any;
 setUsername: any;
 password: any;
 setPassword: any;
 message: any;
 handleFormSubmit: any;
 progressBar: any;
 handleDemoClick: any;
 residentialStatus: any;
 setResidentialStatus: any;
 isDayscholarWithBus: any;
 setIsDayscholarWithBus: any;
}

export default function LoginForm({
 username,
 setUsername,
 password,
 setPassword,
 message,
 handleFormSubmit,
 progressBar,
 handleDemoClick,
 residentialStatus,
 setResidentialStatus,
 isDayscholarWithBus,
 setIsDayscholarWithBus
}: LoginFormProps) {
 const isLoading = message.startsWith("Logging");
 const [showPassword, setShowPassword] = useState(false);

 return (
  <div className="flex flex-col items-center justify-center min-h-screen w-full px-4 bg-background transition-colors duration-300">
  {/* App name */}
  <div className="text-center mb-8 space-y-2">
  <h1 className="text-3xl font-bold text-foreground">
  Amaze&nbsp;CC
  </h1>
  <p className="text-muted-foreground max-w-md mx-auto">
  Showing data from VTOP in a clean and simple way.
  </p>
  </div>

  <form
  onSubmit={handleFormSubmit}
  className="bg-card border border-border rounded-md p-8 w-full max-w-md space-y-5 shadow-medium"
  >
  <h2 className="text-2xl font-bold text-center text-foreground">
  Login
  </h2>

  <input
  className="w-full border border-input bg-background p-3 rounded-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
  placeholder="VTOP Username"
  />
  <div className="relative">
  <input
  className="w-full border border-input bg-background p-3 rounded-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
  type={showPassword ? "text" : "password"}
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  placeholder="VTOP Password"
  />
  <button
  type="button"
  className="absolute right-2 rounded-sm p-3 top-1/2 transform -translate-y-1/2"
  onClick={() => setShowPassword(!showPassword)}
  >
  <Eye className="w-4 h-4 text-muted-foreground" />
  </button>
  </div>

  <div className="flex bg-muted rounded-sm p-1 text-xs sm:text-sm">
  <button
  type="button"
  onClick={() => { setResidentialStatus("hosteller"); setIsDayscholarWithBus(false); }}
  className={`flex-1 py-2 font-medium rounded-sm transition-colors ${residentialStatus === "hosteller" ? "bg-card text-foreground shadow-small" : "text-muted-foreground hover:text-foreground"}`}
  >
  Hosteller
  </button>
  <button
  type="button"
  onClick={() => { setResidentialStatus("dayscholar"); setIsDayscholarWithBus(false); }}
  className={`flex-1 py-2 font-medium rounded-sm transition-colors ${residentialStatus === "dayscholar" && !isDayscholarWithBus ? "bg-card text-foreground shadow-small" : "text-muted-foreground hover:text-foreground"}`}
  >
  Dayscholar
  </button>
  <button
  type="button"
  onClick={() => { setResidentialStatus("dayscholar"); setIsDayscholarWithBus(true); }}
  className={`flex-1 py-2 font-medium rounded-sm transition-colors ${residentialStatus === "dayscholar" && isDayscholarWithBus ? "bg-card text-foreground shadow-small" : "text-muted-foreground hover:text-foreground"}`}
  >
  DS (Bus)
  </button>
  </div>


  {!isLoading && (
  <button
  type="submit"
  disabled={isLoading}
  className="w-full bg-accent text-accent-foreground py-3 rounded-sm font-semibold hover:brightness-110 transition focus:ring-2 focus:ring-accent"
  >
  Login
  </button>
  )}

  {message && (
  <div className="flex flex-col items-center justify-center gap-3 text-sm">
  <div className="w-52 md:w-96 bg-muted rounded-full h-2 overflow-hidden">
  <div
  className="h-2 bg-accent transition-all duration-500 ease-in-out"
  style={{ width: `${progressBar}%` }}
  ></div>
  </div>
  <span className="whitespace-pre-wrap">{message}</span>
  </div>
  )}
  </form>
  <div className="text-center mt-6">
  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
  Not affiliated with VIT or VTOP. For educational use only.<br />
  Please read the Privacy Policy & Terms of Service before using the app.
  </p>
  </div>
  <div className="text-center mt-4">
  <button
  onClick={handleDemoClick}
  className="text-sm text-accent hover:underline"
  >
  Try Demo Mode
  </button>
  </div>
  </div>
 );
}
