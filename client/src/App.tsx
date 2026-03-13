import React, { useEffect } from "react";
import { Switch, Route, useLocation, Link as WouterLink, Redirect } from "wouter";
import { queryClient, apiRequest } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import NotFound from "@/pages/not-found";
import { PawPrint, Settings, LogOut, User, ShieldCheck, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { ThemeProvider } from "@/components/theme-provider";

// Components
import { AppSidebar } from "@/components/app-sidebar";

// Pages
import Dashboard from "@/pages/dashboard";
import Animals from "@/pages/animals";
import AnimalDetails from "@/pages/animal-details";
import Finances from "@/pages/finances";
import StockManagement from "@/pages/stock-management";
import Profile from "@/pages/profile";
import Users from "@/pages/users";
import SettingsPage from "@/pages/settings";
import AuthPage from "@/pages/auth-page";

function Router() {
  const [location] = useLocation();

  // Refresh data whenever the location (page) changes
  useEffect(() => {
    queryClient.invalidateQueries();
  }, [location]);

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/animals" component={Animals} />
      <Route path="/animals/:id" component={AnimalDetails} />
      <Route path="/finances" component={Finances} />
      <Route path="/stock-management" component={StockManagement} />
      <Route path="/users" component={Users} />
      <Route path="/profile" component={Profile} />
      <Route path="/settings" component={SettingsPage} />
      {/* Redirect /auth to root if already logged in */}
      <Route path="/auth">
        <Redirect to="/" />
      </Route>
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppHeader() {
  const { data: user } = useUser();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const initials = user?.fullName
    ? user.fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2)
    : "RD";

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/logout");
      // Clear the user from cache
      queryClient.setQueryData(["/api/users/current"], null);
      // Invalidate to force a fresh check
      queryClient.invalidateQueries({ queryKey: ["/api/users/current"] });

      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      setLocation("/auth");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="h-16 md:h-24 flex items-center px-4 md:px-8 border-b border-border/50 shrink-0 bg-background/95 backdrop-blur-sm z-50 sticky top-0">
      <div className="flex items-center gap-4">
        {/* Sidebar Trigger Button - Visible ONLY on mobile */}
        <SidebarTrigger className="md:hidden h-10 w-10 [&_svg]:size-6 text-primary hover:bg-primary/10 hover:text-primary transition-all rounded-xl border border-primary/10 shadow-sm shrink-0" />

        {/* Branding Section - Responsive border and padding */}
        <div className="flex items-center gap-3 md:gap-6 border-l md:border-l-0 border-border/50 pl-4 md:pl-0">
          <div className="h-10 w-10 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg md:shadow-xl shadow-primary/30 ring-1 md:ring-2 ring-primary/20 shrink-0 transition-transform hover:scale-105">
            <PawPrint className="h-6 w-6 md:h-8 md:w-8" />
          </div>
          <div className="flex flex-col justify-center">
            <span className="font-display font-black text-xl md:text-3xl leading-none text-foreground tracking-tighter flex items-center gap-1 md:gap-1.5">
              <span className="text-primary">AR</span>
              <span>FARM</span>
            </span>
            <span className="text-[8px] md:text-[11px] font-bold uppercase tracking-[0.3em] md:tracking-[0.5em] text-muted-foreground leading-none mt-1 md:mt-2">
              Monitoring
            </span>
          </div>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-3 md:gap-5">
        <div className="hidden sm:flex flex-col items-end mr-1">
          <span className="text-[10px] md:text-xs font-bold text-foreground line-clamp-1">{user?.fullName || "Admin User"}</span>
          <span className="text-[8px] md:text-[9px] uppercase tracking-widest text-primary font-black">Online</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="outline-none focus-visible:ring-2 ring-primary rounded-xl transition-transform active:scale-95">
              <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl nature-gradient flex items-center justify-center text-primary-foreground text-sm md:text-base font-black shadow-lg ring-1 md:ring-2 ring-background cursor-pointer uppercase overflow-hidden">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-2 rounded-xl shadow-2xl border-border/50 bg-background/95 backdrop-blur-md">
            <DropdownMenuLabel className="flex flex-col py-3">
              <span className="text-sm font-black text-foreground">{user?.fullName || "Admin User"}</span>
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{user?.role || "Farm Administrator"}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="py-3 cursor-pointer focus:bg-primary/5 rounded-lg mx-1" asChild>
              <WouterLink href="/profile">
                <div className="flex items-center w-full">
                  <User className="mr-3 h-4 w-4 text-primary" />
                  <span className="font-bold text-sm">Profile</span>
                </div>
              </WouterLink>
            </DropdownMenuItem>
            <DropdownMenuItem className="py-3 cursor-pointer focus:bg-primary/5 rounded-lg mx-1" asChild>
              <WouterLink href="/settings?tab=security">
                <div className="flex items-center w-full">
                  <ShieldCheck className="mr-3 h-4 w-4 text-primary" />
                  <span className="font-bold text-sm">Account Security</span>
                </div>
              </WouterLink>
            </DropdownMenuItem>
            <DropdownMenuItem className="py-3 cursor-pointer focus:bg-primary/5 rounded-lg mx-1" asChild>
              <WouterLink href="/settings">
                <div className="flex items-center w-full">
                  <Settings className="mr-3 h-4 w-4 text-primary" />
                  <span className="font-bold text-sm">Farm Settings</span>
                </div>
              </WouterLink>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="py-3 cursor-pointer text-destructive focus:bg-destructive/5 focus:text-destructive rounded-lg mx-1"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-4 w-4" />
              <span className="font-bold text-sm">Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function AppContent() {
  const { data: user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not logged in, always show the AuthPage
  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden relative">
        <AppSidebar />
        <main className="flex-1 overflow-auto scrollbar-hide bg-background/50 transition-all duration-500">
          <Router />
        </main>
      </div>
    </div>
  );
}

function App() {
  const sidebarStyle = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "4rem",
  } as React.CSSProperties;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <TooltipProvider>
          <SidebarProvider style={sidebarStyle}>
            <AppContent />
          </SidebarProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
