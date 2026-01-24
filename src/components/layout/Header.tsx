import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Settings, User, LogOut, Trophy, Users, MessageSquare, Shield, GraduationCap, Zap } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();

  const isActivePath = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    try {
      await signOut();
      queryClient.clear(); // Clear all cached queries for clean account switching
      toast({
        title: "Signed out",
        description: "You've left the studio. See you next time, Director!",
      });
      sessionStorage.setItem('showLoginModal', 'true'); // Signal landing page to show login modal
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

          {/* Navigation - Always Visible */}
          <nav className="hidden md:flex items-center gap-1 mr-4">
            {user && (
              <Link to="/episodes">
                <Button 
                  variant={isActivePath('/episodes') ? 'secondary' : 'ghost'} 
                  size="sm" 
                  className={`gap-2 ${isActivePath('/episodes') ? 'bg-amber-500/10 text-amber-500' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Zap className="w-4 h-4" />
                  Episodes
                </Button>
              </Link>
            )}
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
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-3">
            <TooltipProvider delayDuration={300}>
              {user ? (
                <>
                  {/* Production Credits Display - Always visible */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-gold/20 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <ProductionCreditsDisplay compact />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-background/95 border-gold/30">
                      <p className="font-medium">Production Credits</p>
                      <p className="text-xs text-muted-foreground">For AI generations</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  {/* Gamification Credits Display - Hidden on mobile */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setShowGamification(true)}
                        className="hidden sm:flex items-center gap-2 hover:scale-105 transition-all duration-200 group relative"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <CreditsDisplay credits={credits?.credits || 0} compact />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-background/95 border-primary/30">
                      <p className="font-medium">Engagement Credits</p>
                      <p className="text-xs text-muted-foreground">Earn by completing rituals</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* Community - Graphical Icon Button with Label */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link to="/community" className="hidden sm:block">
                        <div className="group relative flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg hover:bg-gold/10 transition-all duration-200">
                          <div className="relative">
                            <div className="absolute inset-0 bg-gold/30 rounded-full blur-md opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity duration-300" />
                            <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-gold/20 to-amber-500/30 border border-gold/40 flex items-center justify-center group-hover:border-gold/80 group-hover:scale-110 transition-all duration-200">
                              <MessageSquare className="w-4 h-4 text-gold group-hover:text-gold/90" />
                            </div>
                          </div>
                          <span className="text-[10px] font-medium text-gold/80 group-hover:text-gold transition-colors">Community</span>
                        </div>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-background/95 border-gold/30">
                      <p className="font-medium">Director's Corner</p>
                      <p className="text-xs text-muted-foreground">Share & connect with others</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* Leaderboard - Graphical Icon Button with Label */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setShowLeaderboard(true)}
                        className="hidden sm:flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg hover:bg-blue-500/10 transition-all duration-200 group"
                      >
                        <div className="relative">
                          <div className="absolute inset-0 bg-blue-400/30 rounded-full blur-md opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity duration-300" />
                          <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/30 border border-blue-400/40 flex items-center justify-center group-hover:border-blue-400/80 group-hover:scale-110 transition-all duration-200">
                            <Users className="w-4 h-4 text-blue-400 group-hover:text-blue-300" />
                          </div>
                        </div>
                        <span className="text-[10px] font-medium text-blue-400/80 group-hover:text-blue-300 transition-colors">Ranks</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-background/95 border-blue-400/30">
                      <p className="font-medium">Leaderboard</p>
                      <p className="text-xs text-muted-foreground">See top directors</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* Awards - Graphical Icon Button with Label */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setShowGamification(true)}
                        className="hidden sm:flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg hover:bg-amber-500/10 transition-all duration-200 group"
                      >
                        <div className="relative">
                          <div className="absolute inset-0 bg-amber-400/30 rounded-full blur-md opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity duration-300" />
                          <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-amber-400/20 to-yellow-500/30 border border-amber-400/40 flex items-center justify-center group-hover:border-amber-400/80 group-hover:scale-110 transition-all duration-200">
                            <Trophy className="w-4 h-4 text-amber-400 group-hover:text-amber-300" />
                          </div>
                        </div>
                        <span className="text-[10px] font-medium text-amber-400/80 group-hover:text-amber-300 transition-colors">Awards</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-background/95 border-amber-400/30">
                      <p className="font-medium">Awards & Progress</p>
                      <p className="text-xs text-muted-foreground">Your achievements</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* Admin - Graphical Icon Button with Label */}
                  {isAdmin && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link to="/admin" className="hidden sm:block">
                          <div className="group relative flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-all duration-200">
                            <div className="relative">
                              <div className="absolute inset-0 bg-red-400/30 rounded-full blur-md opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity duration-300" />
                              <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-red-500/20 to-rose-500/30 border border-red-400/40 flex items-center justify-center group-hover:border-red-400/80 group-hover:scale-110 transition-all duration-200">
                                <Shield className="w-4 h-4 text-red-400 group-hover:text-red-300" />
                              </div>
                            </div>
                            <span className="text-[10px] font-medium text-red-400/80 group-hover:text-red-300 transition-colors">Admin</span>
                          </div>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="bg-background/95 border-red-400/30">
                        <p className="font-medium">Admin Dashboard</p>
                        <p className="text-xs text-muted-foreground">Manage the platform</p>
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {/* User Avatar Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="group relative flex flex-col items-center gap-0.5 px-1 py-1 rounded-lg hover:bg-gold/10 transition-all duration-200">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gold/30 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-gold/20 to-amber-500/30 border-2 border-gold/40 flex items-center justify-center group-hover:border-gold/80 group-hover:scale-105 transition-all duration-200 cursor-pointer">
                            <User className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
                          </div>
                        </div>
                        <span className="hidden sm:block text-[10px] font-medium text-gold/80 group-hover:text-gold transition-colors">Profile</span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-background/95 backdrop-blur-xl border-border/50">
                      <DropdownMenuItem onClick={() => navigate("/guide")} className="gap-2 cursor-pointer">
                        <GraduationCap className="w-4 h-4 text-gold" />
                        Director's Guide
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/settings")} className="gap-2 cursor-pointer">
                        <Settings className="w-4 h-4 text-muted-foreground" />
                        Account Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive gap-2 cursor-pointer">
                        <LogOut className="w-4 h-4" />
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  {/* Mobile Guide Link for logged out users */}
                  <Link to="/guide" className="md:hidden">
                    <div className="group flex flex-col items-center gap-0.5 p-1">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold/10 to-amber-500/20 border border-gold/30 flex items-center justify-center group-hover:border-gold/60 group-hover:scale-110 transition-all duration-200">
                        <GraduationCap className="w-4 h-4 text-gold/80 group-hover:text-gold" />
                      </div>
                    </div>
                  </Link>
                  <Button variant="gold" size="sm" className="sm:size-default font-semibold shadow-lg shadow-gold/20 hover:shadow-gold/40 hover:scale-105 transition-all duration-200" onClick={() => setShowAuthModal(true)}>
                    <span className="hidden sm:inline">Enter Studio</span>
                    <span className="sm:hidden">Login</span>
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
