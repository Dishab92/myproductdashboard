import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { DataProvider } from "@/context/DataContext";
import { AuthProvider } from "@/context/AuthContext";
import { EffectsProvider } from "@/context/EffectsContext";
import { SnapshotProvider } from "@/context/SnapshotContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Index from "./pages/Index";
import CustomerSnapshot from "./pages/CustomerSnapshot";
import CustomerDrilldown from "./pages/CustomerDrilldown";
import ReportsHub from "./pages/ReportsHub";
import AgentAdoption from "./pages/AgentAdoption";
import AdoptionHealth from "./pages/AdoptionHealth";
import FeatureInsights from "./pages/FeatureInsights";
import AgentInsights from "./pages/AgentInsights";
import CaseTimeInsights from "./pages/CaseTimeInsights";
import DataManagement from "./pages/DataManagement";
import Login from "./pages/Login";
import PendingApproval from "./pages/PendingApproval";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" storageKey="pm-theme">
      <TooltipProvider>
        <EffectsProvider>
          <SnapshotProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AuthProvider>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/pending" element={<PendingApproval />} />
                  <Route
                    path="/*"
                    element={
                      <ProtectedRoute>
                        <DataProvider>
                          <DashboardLayout>
                            <Routes>
                              <Route path="/" element={<Index />} />
                              <Route path="/customer" element={<CustomerSnapshot />} />
                              <Route path="/drilldown" element={<CustomerDrilldown />} />
                              <Route path="/agent-adoption" element={<AgentAdoption />} />
                              <Route path="/adoption-health" element={<AdoptionHealth />} />
                              <Route path="/insights/features" element={<FeatureInsights />} />
                              <Route path="/insights/agents" element={<AgentInsights />} />
                              <Route path="/insights/cases" element={<CaseTimeInsights />} />
                              <Route path="/reports" element={<ReportsHub />} />
                              <Route path="/data" element={<DataManagement />} />
                              <Route path="*" element={<NotFound />} />
                            </Routes>
                          </DashboardLayout>
                        </DataProvider>
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </AuthProvider>
            </BrowserRouter>
          </SnapshotProvider>
        </EffectsProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
