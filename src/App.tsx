import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SplashScreenWrapper } from "@/components/pwa/SplashScreenWrapper";
import { PWAInstallPrompt } from "@/components/pwa/PWAInstallPrompt";
import { PWAUpdatePrompt } from "@/components/pwa/PWAUpdatePrompt";
import { PointsProvider } from "@/contexts/PointsContext";
import { AudioProvider } from "@/contexts/AudioContext";
import { AppLoader } from "@/components/ui/AppLoader";
import Index from "./pages/Index";
import { RequireAdmin } from "./components/auth/RequireAdmin";

// Lazy-loaded pages
const Signup = lazy(() => import("./pages/Signup"));
const DirectorCorner = lazy(() => import("./pages/DirectorCorner"));
const Subscribe = lazy(() => import("./pages/Subscribe"));
const SubscriptionSuccess = lazy(() => import("./pages/SubscriptionSuccess"));
const CreditsSuccess = lazy(() => import("./pages/CreditsSuccess"));
const Credits = lazy(() => import("./pages/Credits"));
const DirectorsGuide = lazy(() => import("./pages/DirectorsGuide"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AwardsCeremony = lazy(() => import("./pages/AwardsCeremony"));
const Settings = lazy(() => import("./pages/Settings"));
const Actions = lazy(() => import("./pages/Actions"));
const Character = lazy(() => import("./pages/Character"));
const Episodes = lazy(() => import("./pages/Episodes"));
const Soundtrack = lazy(() => import("./pages/Soundtrack"));
const Music = lazy(() => import("./pages/Music"));
const Radio = lazy(() => import("./pages/Radio"));
const Score = lazy(() => import("./pages/Score"));
const DoneForYou = lazy(() => import("./pages/DoneForYou"));
const DFYSuccess = lazy(() => import("./pages/DFYSuccess"));
const Challenges = lazy(() => import("./pages/Challenges"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const DirectorProfile = lazy(() => import("./pages/DirectorProfile"));
const DirectorAI = lazy(() => import("./pages/DirectorAI"));
const Blueprint = lazy(() => import("./pages/Blueprint"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AudioProvider>
        <PointsProvider>
          <Toaster />
          <Sonner />
        <SplashScreenWrapper>
          <BrowserRouter>
            <Suspense fallback={<AppLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/community" element={<DirectorCorner />} />
                <Route path="/subscribe" element={<Subscribe />} />
                <Route path="/subscription-success" element={<SubscriptionSuccess />} />
                <Route path="/credits-success" element={<CreditsSuccess />} />
                <Route path="/credits" element={<Credits />} />
                <Route path="/guide" element={<DirectorsGuide />} />
                <Route path="/user-manual" element={<Navigate to="/guide" replace />} />
                <Route path="/manual" element={<Navigate to="/guide" replace />} />
                <Route path="/tutorial" element={<Navigate to="/guide" replace />} />
                <Route path="/tutorials" element={<Navigate to="/guide" replace />} />
                <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
                <Route path="/awards" element={<AwardsCeremony />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/actions" element={<Actions />} />
                <Route path="/character" element={<Character />} />
                <Route path="/episodes" element={<Episodes />} />
                <Route path="/soundtrack" element={<Soundtrack />} />
                <Route path="/music" element={<Music />} />
                <Route path="/radio" element={<Radio />} />
                <Route path="/score" element={<Score />} />
                <Route path="/done-for-you" element={<DoneForYou />} />
                <Route path="/dfy-success" element={<DFYSuccess />} />
                <Route path="/challenges" element={<Challenges />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/director/:userId" element={<DirectorProfile />} />
                <Route path="/director-ai" element={<DirectorAI />} />
                <Route path="/blueprint" element={<Blueprint />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <PWAInstallPrompt />
            <PWAUpdatePrompt />
          </BrowserRouter>
          </SplashScreenWrapper>
        </PointsProvider>
      </AudioProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
