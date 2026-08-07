import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Assets from "./pages/Assets";
import Tickets from "./pages/Tickets";
import TicketTemplates from "./pages/TicketTemplates";
import ScheduledTickets from "./pages/ScheduledTickets";
import TicketMap from "./pages/TicketMap";

import AssetDetail from "./pages/AssetDetail";
import CustomerDetail from "./pages/CustomerDetail";
import TicketDetail from "./pages/TicketDetail";
import Agreements from "./pages/Agreements";
import AgreementDetail from "./pages/AgreementDetail";
import Technicians from "./pages/Technicians";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import AppSettings from "./pages/AppSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider>
          <div className="min-h-screen flex w-full">
            <AppSidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <header className="h-14 flex items-center border-b bg-card px-4 shrink-0">
                <SidebarTrigger />
              </header>
              <main className="flex-1 p-6 lg:p-8 overflow-auto">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/customers/:id" element={<CustomerDetail />} />
                  <Route path="/customers" element={<Customers />} />
                  <Route path="/assets" element={<Assets />} />
                  <Route path="/assets/:id" element={<AssetDetail />} />
                  <Route path="/tickets/templates" element={<TicketTemplates />} />
                  <Route path="/tickets/scheduled" element={<ScheduledTickets />} />
                  <Route path="/tickets/map" element={<TicketMap />} />
                  <Route path="/tickets/:id" element={<TicketDetail />} />
                  <Route path="/tickets" element={<Tickets />} />

                  <Route path="/agreements/:id" element={<AgreementDetail />} />
                  <Route path="/agreements" element={<Agreements />} />
                  <Route path="/technicians" element={<Technicians />} />
                  <Route path="/projects/:id" element={<ProjectDetail />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/settings" element={<AppSettings />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
