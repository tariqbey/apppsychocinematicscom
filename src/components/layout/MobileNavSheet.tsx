import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menu,
  Home,
  Clapperboard,
  UserRound,
  Users,
  GraduationCap,
  Settings,
  Shield,
  Zap,
  Film,
  Trophy,
  MessageSquare,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import psychoCinematicsLogo from "@/assets/psycho-cinematics-logo.png";

type MobileNavLink = {
  to: string;
  label: string;
  icon: ReactNode;
  authOnly?: boolean;
  adminOnly?: boolean;
  description?: string;
};

export function MobileNavSheet({
  isAuthenticated,
  isAdmin,
}: {
  isAuthenticated: boolean;
  isAdmin: boolean;
}) {
  const location = useLocation();

  const links: MobileNavLink[] = [
    { 
      to: "/", 
      label: "Dashboard", 
      icon: <Home className="h-5 w-5" />,
      authOnly: true,
      description: "Your daily hub"
    },
    {
      to: "/episodes",
      label: "Episodes",
      icon: <Zap className="h-5 w-5" />,
      authOnly: true,
      description: "Short-term sprints"
    },
    {
      to: "/actions",
      label: "Actions",
      icon: <Clapperboard className="h-5 w-5" />,
      authOnly: true,
      description: "Daily 3 things"
    },
    {
      to: "/character",
      label: "Character",
      icon: <UserRound className="h-5 w-5" />,
      authOnly: true,
      description: "Build your identity"
    },
    {
      to: "/community",
      label: "Director's Corner",
      icon: <MessageSquare className="h-5 w-5" />,
      authOnly: true,
      description: "Community & voting"
    },
    {
      to: "/awards",
      label: "Awards",
      icon: <Trophy className="h-5 w-5" />,
      authOnly: true,
      description: "Annual ceremony"
    },
    { 
      to: "/guide", 
      label: "Director's Guide", 
      icon: <GraduationCap className="h-5 w-5" />,
      description: "Learn the system"
    },
    {
      to: "/settings",
      label: "Settings",
      icon: <Settings className="h-5 w-5" />,
      authOnly: true,
      description: "Account & preferences"
    },
    {
      to: "/admin",
      label: "Admin Dashboard",
      icon: <Shield className="h-5 w-5" />,
      authOnly: true,
      adminOnly: true,
      description: "Manage the platform"
    },
  ];

  const visibleLinks = links.filter((l) => {
    if (l.adminOnly && !isAdmin) return false;
    if (l.authOnly && !isAuthenticated) return false;
    return true;
  });

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-[85vw] max-w-xs p-0 flex flex-col">
        <SheetHeader className="border-b border-border/50 p-4">
          <div className="flex items-center gap-3">
            <img 
              src={psychoCinematicsLogo} 
              alt="Psycho-Cinematics" 
              className="h-10 w-10 object-contain"
            />
            <SheetTitle className="font-display tracking-wide text-gold">Menu</SheetTitle>
          </div>
        </SheetHeader>

        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {visibleLinks.map((l) => {
              const active = location.pathname === l.to;
              return (
                <li key={l.to}>
                  <SheetClose asChild>
                    <Link
                      to={l.to}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-3 transition-colors",
                        active
                          ? "bg-gold/10 text-gold border border-gold/30"
                          : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground",
                      )}
                    >
                      <span className={cn(
                        active ? "text-gold" : "text-muted-foreground"
                      )}>{l.icon}</span>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium block">{l.label}</span>
                        {l.description && (
                          <span className="text-xs text-muted-foreground/70 block truncate">{l.description}</span>
                        )}
                      </div>
                    </Link>
                  </SheetClose>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-border/50 p-4">
          <p className="text-xs text-muted-foreground text-center">
            Psycho-Cinematics™ Director's OS
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
