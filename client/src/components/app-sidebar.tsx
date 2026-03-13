import { Link, useLocation } from "wouter";
import { LayoutDashboard, PawPrint, Users, CreditCard, Utensils } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Livestock Roster", url: "/animals", icon: PawPrint },
  { title: "Stock Management", url: "/stock-management", icon: Utensils },
  { title: "Finances", url: "/finances", icon: CreditCard },
  { title: "System Users", url: "/users", icon: Users },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { isMobile, setOpenMobile } = useSidebar();

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar
      collapsible="offcanvas"
      className="border-r border-border bg-sidebar"
    >
      <SidebarHeader className="h-16 md:h-24 flex items-center px-6 border-b border-sidebar-border bg-sidebar/50">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
            <PawPrint className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-black text-sm leading-none tracking-tighter">
              <span className="text-primary">AR</span> FARM
            </span>
            <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-muted-foreground mt-1">
              Monitoring
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-sidebar">
        <SidebarGroup className="pt-4">
          <SidebarGroupContent>
            <SidebarMenu className="px-2 gap-1">
              {navItems.map((item) => {
                const isActive = location === item.url || (item.url !== "/" && location.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className="transition-all rounded-lg py-6 px-4 hover:bg-primary/5 data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
                    >
                      <Link href={item.url} className="flex items-center" onClick={handleLinkClick}>
                        <item.icon className={isActive ? "mr-3 h-5 w-5 text-primary" : "mr-3 h-5 w-5"} />
                        <span className="font-bold text-sm uppercase tracking-wide">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
