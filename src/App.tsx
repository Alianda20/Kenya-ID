
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminLanding from "./pages/AdminLanding";
import OfficerLanding from "./pages/OfficerLanding";
import PublicLanding from "./pages/PublicLanding";
import OfficerAuth from "./pages/OfficerAuth";
import AdminAuth from "./pages/AdminAuth";
import AdminDashboard from "./pages/AdminDashboard";
import OfficerDashboard from "./pages/OfficerDashboard";
import TrackApplication from "./pages/TrackApplication";
import NewApplication from "./pages/NewApplication";
import LostIdReplacement from "./pages/LostIdReplacement";
import LostIdPayment from "./pages/LostIdPayment";
import LostIdConfirmation from "./pages/LostIdConfirmation";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicLanding />} />
          <Route path="/portals" element={<Index />} />
          <Route path="/admin-portal" element={<AdminLanding />} />
          <Route path="/officer-portal" element={<OfficerLanding />} />
          <Route path="/officer" element={<OfficerAuth />} />
          <Route path="/admin" element={<AdminAuth />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/officer/dashboard" element={<OfficerDashboard />} />
          <Route path="/officer/new-application" element={<NewApplication />} />
          <Route path="/officer/lost-id" element={<LostIdReplacement />} />
          <Route path="/officer/lost-id/payment" element={<LostIdPayment />} />
          <Route path="/officer/lost-id/confirmation" element={<LostIdConfirmation />} />
          <Route path="/track" element={<TrackApplication />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
