"use client";

import { useEffect, useRef, useState } from "react";
import { handleCallback, signInInteractive } from "@/lib/oauth2";

/**
 * OIDC redirect target (registered as the client's redirect_uri).
 * Completes the PKCE exchange, then hands control back to the SPA.
 * ?error=login_required (silent prompt=none miss) lands here too - the page
 * then just shows the regular sign-in button.
 */
export default function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    handleCallback().then((result) => {
      if (result.ok) {
        window.location.replace("/");
        return;
      }
      const params = new URLSearchParams(window.location.search);
      const isSilentMiss = params.get("error") === "login_required";
      setError(isSilentMiss ? null : (result.error ?? "Sign-in failed."));
      if (isSilentMiss) {
        // Silent SSO missed - fall back to the regular (explicit) sign-in page.
        // Do not auto-redirect again; the home page renders the button.
        window.location.replace("/");
      }
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card border border-border/50 rounded-3xl p-8 space-y-5 text-center">
        <img src="/logo.png" alt="AmazeCC Logo" className="w-16 h-16 mx-auto object-contain drop-shadow-md" />
        {error ? (
          <>
            <h1 className="text-xl font-bold text-foreground">Sign-in didn&apos;t finish</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
            <button
              type="button"
              onClick={() => signInInteractive()}
              className="w-full h-11 rounded-xl font-semibold text-sm bg-amber-400 hover:bg-amber-300 text-amber-950 transition-colors"
            >
              Try again with Amaze ID
            </button>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-t-transparent border-amber-500 mx-auto" />
            <p className="text-sm text-muted-foreground">Finishing sign-in with Amaze ID…</p>
          </>
        )}
      </div>
    </div>
  );
}
