import { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLoader } from "@/components/ui/AppLoader";
import Index from "./pages/Index";
import Signup from "./pages/Signup";
import DirectorCorner from "./pages/DirectorCorner";
import Subscribe from "./pages/Subscribe";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import CreditsSuccess from "./pages/CreditsSuccess";
import Credits from "./pages/Credits";
import DirectorsGuide from "./pages/DirectorsGuide";
import AdminDashboard from "./pages/AdminDashboard";
import AwardsCeremony from "./pages/AwardsCeremony";
import Settings from "./pages/Settings";
import Actions from "./pages/Actions";
import Character from "./pages/Character";
import Episodes from "./pages/Episodes";
import Soundtrack from "./pages/Soundtrack";
import Music from "./pages/Music";
import DoneForYou from "./pages/DoneForYou";
import DFYSuccess from "./pages/DFYSuccess";
import Challenges from "./pages/Challenges";
import NotFound from "./pages/NotFound";
import { RequireAdmin } from "./components/auth/RequireAdmin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/community" element={<DirectorCorner />} />
          <Route path="/subscribe" element={<Subscribe />} />
          <Route path="/subscription-success" element={<SubscriptionSuccess />} />
          <Route path="/credits-success" element={<CreditsSuccess />} />
          <Route path="/credits" element={<Credits />} />
          <Route path="/guide" element={<DirectorsGuide />} />
          <Route path="/user-manual" element={<DirectorsGuide />} />
          <Route path="/manual" element={<DirectorsGuide />} />
          <Route path="/tutorial" element={<DirectorsGuide />} />
          <Route path="/tutorials" element={<DirectorsGuide />} />
          <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
          <Route path="/awards" element={<AwardsCeremony />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/actions" element={<Actions />} />
          <Route path="/character" element={<Character />} />
          <Route path="/episodes" element={<Episodes />} />
          <Route path="/soundtrack" element={<Soundtrack />} />
          <Route path="/music" element={<Music />} />
          <Route path="/radio" element={<Music />} />
          <Route path="/done-for-you" element={<DoneForYou />} />
          <Route path="/dfy-success" element={<DFYSuccess />} />
          <Route path="/challenges" element={<Challenges />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
