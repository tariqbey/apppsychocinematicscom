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

type MobileNavLink = {
  to: string;
  label: string;
  icon: ReactNode;
  authOnly?: boolean;
  adminOnly?: boolean;
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
    { to: "/", label: "Home", icon: <Home className="h-4 w-4" /> },
    {
      to: "/actions",
      label: "Actions",
      icon: <Clapperboard className="h-4 w-4" />,
      authOnly: true,
    },
    {
      to: "/character",
      label: "Character",
      icon: <UserRound className="h-4 w-4" />,
      authOnly: true,
    },
    {
      to: "/community",
      label: "Community",
      icon: <Users className="h-4 w-4" />,
      authOnly: true,
    },
    { to: "/guide", label: "Guide", icon: <GraduationCap className="h-4 w-4" /> },
    {
      to: "/settings",
      label: "Settings",
      icon: <Settings className="h-4 w-4" />,
      authOnly: true,
    },
    {
      to: "/admin",
      label: "Admin",
      icon: <Shield className="h-4 w-4" />,
      authOnly: true,
      adminOnly: true,
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
          className="md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-[85vw] max-w-sm p-0">
        <SheetHeader className="border-b border-border/50 p-5">
          <SheetTitle className="font-display tracking-wide">Menu</SheetTitle>
        </SheetHeader>

        <nav className="p-3">
          <ul className="space-y-1">
            {visibleLinks.map((l) => {
              const active = location.pathname === l.to;
              return (
                <li key={l.to}>
                  <SheetClose asChild>
                    <Link
                      to={l.to}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-secondary text-foreground"
                          : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground",
                      )}
                    >
                      <span className="text-muted-foreground">{l.icon}</span>
                      <span className="font-medium">{l.label}</span>
                    </Link>
                  </SheetClose>
                </li>
              );
            })}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
