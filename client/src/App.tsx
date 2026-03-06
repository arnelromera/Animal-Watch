import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import NotFound from "@/pages/not-found";
import { PawPrint } from "lucide-react";

// Components
import { AppSidebar } from "@/components/app-sidebar";

// Pages
import Dashboard from "@/pages/dashboard";
import Animals from "@/pages/animals";
import AnimalDetails from "@/pages/animal-details";
import Finances from "@/pages/finances";
import Feeds from "@/pages/feeds";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/animals" component={Animals} />
      <Route path="/animals/:id" component={AnimalDetails} />
      <Route path="/finances" component={Finances} />
      <Route path="/feeds" component={Feeds} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const sidebarStyle = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "4rem",
  } as React.CSSProperties;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={sidebarStyle}>
          <div className="flex h-screen w-full bg-background overflow-hidden">
            <AppSidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <header className="h-16 flex items-center px-4 border-b border-border/50 shrink-0 bg-background/95 backdrop-blur-sm z-10 sticky top-0">
                <SidebarTrigger className="hover-elevate hover:text-primary transition-colors" />
                <div className="ml-4 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg nature-gradient flex items-center justify-center shadow-md rotate-3">
                    <PawPrint className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <h1 className="text-xl font-display font-black tracking-tighter text-foreground">
                    AR <span className="text-primary">FARM</span> MONITORING
                  </h1>
                </div>
                <div className="ml-auto flex items-center">
                  <div className="h-8 w-8 rounded-full nature-gradient flex items-center justify-center text-primary-foreground text-xs font-bold shadow-sm">
                    RD
                  </div>
                </div>
              </header>
              <main className="flex-1 overflow-auto bg-background/50">
                <Router />
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
