import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import DirectorCorner from "./pages/DirectorCorner";
import Subscribe from "./pages/Subscribe";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import CreditsSuccess from "./pages/CreditsSuccess";
import Credits from "./pages/Credits";
import DirectorsGuide from "./pages/DirectorsGuide";
import AdminDashboard from "./pages/AdminDashboard";
import Settings from "./pages/Settings";
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
          <Route path="/settings" element={<Settings />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
