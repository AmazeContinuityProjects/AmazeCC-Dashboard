"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/components/custom/admin/AdminUI";

interface ThemeSwitcherProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function ThemeSwitcher({ className, size = "sm", showLabel = false }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleThemeChange = (newTheme: string) => {
    if (typeof document !== "undefined" && "startViewTransition" in document) {
      (document as any).startViewTransition(() => {
        setTheme(newTheme);
      });
    } else {
      setTheme(newTheme);
    }
  };

  if (!mounted) {
    return (
      <div className={cn("inline-flex items-center gap-1 p-0.5 rounded-xl bg-muted/40 border border-border/40 h-8 w-24 opacity-60", className)}>
        <div className="w-6 h-6 rounded-lg bg-transparent" />
      </div>
    );
  }

  const modes = [
    { id: "light", label: "Light", icon: Sun },
    { id: "system", label: "System", icon: Monitor },
    { id: "dark", label: "Dark", icon: Moon },
  ];

  return (
    <div
      className={cn(
        "inline-flex items-center p-0.5 rounded-xl bg-muted/50 border border-border/60 backdrop-blur-md shadow-xs transition-colors",
        className
      )}
      role="group"
      aria-label="Theme selector"
    >
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = theme === mode.id;
        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => handleThemeChange(mode.id)}
            className={cn(
              "flex items-center justify-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer",
              isActive
                ? "bg-card text-foreground shadow-xs scale-100 border border-border/40 font-bold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
            )}
            title={`${mode.label} Mode`}
          >
            <Icon className={cn("w-3.5 h-3.5 shrink-0 transition-transform duration-200", isActive && "text-primary")} />
            {showLabel && <span>{mode.label}</span>}
          </button>
        );
      })}
    </div>
  );
}

export default ThemeSwitcher;
