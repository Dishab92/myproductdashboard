import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DataProvider } from "@/context/DataContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Index from "./pages/Index";
import CustomerSnapshot from "./pages/CustomerSnapshot";
import CustomerDrilldown from "./pages/CustomerDrilldown";
import ReportsHub from "./pages/ReportsHub";
import DataManagement from "./pages/DataManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <DataProvider>
        <BrowserRouter>
          <DashboardLayout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/customer" element={<CustomerSnapshot />} />
              <Route path="/drilldown" element={<CustomerDrilldown />} />
              <Route path="/reports" element={<ReportsHub />} />
              <Route path="/data" element={<DataManagement />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </DashboardLayout>
        </BrowserRouter>
      </DataProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
