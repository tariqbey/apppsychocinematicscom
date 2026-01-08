import { useState } from "react";
import { Link } from "react-router-dom";
import { Clapperboard, Settings, User, LogOut, Trophy, Users, MessageSquare, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { useGamification } from "@/hooks/useGamification";
import { AuthModal } from "@/components/auth/AuthModal";
import { CreditsDisplay } from "@/components/gamification/CreditsDisplay";
import { GamificationPanel } from "@/components/gamification/GamificationPanel";
import { Leaderboard } from "@/components/leaderboard/Leaderboard";

export const Header = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showGamification, setShowGamification] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminStatus();
  const { credits } = useGamification();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold to-amber-soft flex items-center justify-center">
              <Clapperboard className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-xl tracking-wide text-gold-gradient">
                PSYCHO-CINEMATICS™
              </h1>
              <p className="text-xs text-muted-foreground -mt-1">The Director's OS</p>
            </div>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* Credits Display */}
                <button
                  onClick={() => setShowGamification(true)}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <CreditsDisplay credits={credits?.credits || 0} compact />
                </button>

                <Link to="/community">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gold hover:text-gold/80"
                    title="Director's Corner"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </Button>
                </Link>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowLeaderboard(true)}
                  className="text-muted-foreground hover:text-foreground"
                  title="Leaderboard"
                >
                  <Users className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowGamification(true)}
                  className="text-gold hover:text-gold/80"
                  title="Awards & Progress"
                >
                  <Trophy className="w-5 h-5" />
                </Button>
                {isAdmin && (
                  <Link to="/admin">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-400 hover:text-red-300"
                      title="Admin Dashboard"
                    >
                      <Shield className="w-5 h-5" />
                    </Button>
                  </Link>
                )}
                <Link to="/settings">
                  <Button variant="ghost" size="icon" title="Settings">
                    <Settings className="w-5 h-5" />
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" onClick={handleSignOut}>
                  <LogOut className="w-5 h-5" />
                </Button>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold/20 to-amber-soft/20 border border-gold/30 flex items-center justify-center">
                  <User className="w-5 h-5 text-gold" />
                </div>
              </>
            ) : (
              <Button variant="gold" onClick={() => setShowAuthModal(true)}>
                Enter Studio
              </Button>
            )}
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
