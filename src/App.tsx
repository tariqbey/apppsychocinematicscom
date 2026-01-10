import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLoader } from "@/components/ui/AppLoader";
import { RequireAdmin } from "./components/auth/RequireAdmin";

// Lazy load pages for better initial load performance
const Index = lazy(() => import("./pages/Index"));
const DirectorCorner = lazy(() => import("./pages/DirectorCorner"));
const Subscribe = lazy(() => import("./pages/Subscribe"));
const SubscriptionSuccess = lazy(() => import("./pages/SubscriptionSuccess"));
const CreditsSuccess = lazy(() => import("./pages/CreditsSuccess"));
const Credits = lazy(() => import("./pages/Credits"));
const DirectorsGuide = lazy(() => import("./pages/DirectorsGuide"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<AppLoader />}>
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
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
