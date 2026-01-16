import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Settings, User, LogOut, Trophy, Users, MessageSquare, Shield, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { useGamification } from "@/hooks/useGamification";
import { useToast } from "@/hooks/use-toast";
import { AuthModal } from "@/components/auth/AuthModal";
import { CreditsDisplay } from "@/components/gamification/CreditsDisplay";
import { GamificationPanel } from "@/components/gamification/GamificationPanel";
import { Leaderboard } from "@/components/leaderboard/Leaderboard";
import { ProductionCreditsDisplay } from "@/components/studio/ProductionCreditsDisplay";
import psychoCinematicsLogo from "@/assets/psycho-cinematics-logo.png";
import { MobileNavSheet } from "./MobileNavSheet";

export const Header = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showGamification, setShowGamification] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminStatus();
  const { credits } = useGamification();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const isActivePath = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You've left the studio. See you next time, Director!",
      });
      navigate("/");
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: "Please try again.",
      });
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <MobileNavSheet isAuthenticated={!!user} isAdmin={isAdmin} />
            {/* Logo - smaller on mobile to prevent overlap with back button */}
            <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity shrink-0">
              <img 
                src={psychoCinematicsLogo} 
                alt="Psycho-Cinematics" 
                className="h-12 w-12 sm:h-16 sm:w-16 md:h-[96px] md:w-[96px] object-contain"
              />
            </Link>
          </div>

          {/* Help Navigation - Always Visible */}
          <nav className="hidden md:flex items-center gap-1 mr-4">
            <Link to="/guide">
              <Button 
                variant={isActivePath('/guide') || isActivePath('/tutorial') || isActivePath('/user-manual') ? 'secondary' : 'ghost'} 
                size="sm" 
                className={`gap-2 ${isActivePath('/guide') || isActivePath('/tutorial') || isActivePath('/user-manual') ? 'bg-gold/10 text-gold' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <GraduationCap className="w-4 h-4" />
                Director's Guide
              </Button>
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <TooltipProvider delayDuration={300}>
              {user ? (
                <>
                  {/* Production Credits Display */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <ProductionCreditsDisplay compact />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Production Credits</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  {/* Gamification Credits Display */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setShowGamification(true)}
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                      >
                        <CreditsDisplay credits={credits?.credits || 0} compact />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Engagement Credits</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link to="/community">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gold hover:text-gold/80"
                        >
                          <MessageSquare className="w-5 h-5" />
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Director's Corner</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowLeaderboard(true)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Users className="w-5 h-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Leaderboard</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowGamification(true)}
                        className="text-gold hover:text-gold/80"
                      >
                        <Trophy className="w-5 h-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Awards & Progress</p>
                    </TooltipContent>
                  </Tooltip>

                  {isAdmin && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link to="/admin">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-400 hover:text-red-300"
                          >
                            <Shield className="w-5 h-5" />
                          </Button>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>Admin Dashboard</p>
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {/* User Avatar Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="w-10 h-10 rounded-full bg-gradient-to-br from-gold/20 to-amber-soft/20 border border-gold/30 flex items-center justify-center hover:border-gold/60 transition-colors cursor-pointer">
                        <User className="w-5 h-5 text-gold" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => navigate("/guide")}>
                        <GraduationCap className="w-4 h-4 mr-2" />
                        Director's Guide
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/settings")}>
                        <Settings className="w-4 h-4 mr-2" />
                        Account Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                        <LogOut className="w-4 h-4 mr-2" />
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  {/* Mobile Guide Link for logged out users */}
                  <Link to="/guide" className="md:hidden">
                    <Button variant="ghost" size="icon" className="text-muted-foreground">
                      <GraduationCap className="w-5 h-5" />
                    </Button>
                  </Link>
                  <Button variant="gold" onClick={() => setShowAuthModal(true)}>
                    Enter Studio
                  </Button>
                </div>
              )}
            </TooltipProvider>
          </div>
        </div>
      </header>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      
      {showGamification && (
        <GamificationPanel onClose={() => setShowGamification(false)} />
      )}

      {showLeaderboard && (
        <Leaderboard onClose={() => setShowLeaderboard(false)} />
      )}
    </>
  );
};
