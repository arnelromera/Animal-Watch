import { Link, useLocation } from "wouter";
import { LayoutDashboard, PawPrint, Settings, Map, BookOpen, CreditCard, Utensils } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Wildlife Roster", url: "/animals", icon: PawPrint },
  { title: "Feed Log", url: "/feeds", icon: Utensils },
  { title: "Finances", url: "/finances", icon: CreditCard },
  { title: "Habitats", url: "/habitats", icon: Map, disabled: true },
  { title: "Field Guide", url: "/guide", icon: BookOpen, disabled: true },
  { title: "Settings", url: "/settings", icon: Settings, disabled: true },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar className="border-r border-border/50">
      <SidebarHeader className="h-16 flex items-center px-4 border-b border-sidebar-border/50">
        <div className="flex items-center gap-3 w-full">
          <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-inner">
            <PawPrint className="h-5 w-5" />
          </div>
          <span className="font-display font-bold text-lg text-sidebar-foreground tracking-tight">
            TerraScope
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60 uppercase tracking-wider text-xs font-semibold mb-2 mt-4">
            Operations
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location === item.url || (item.url !== "/" && location.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive} 
                      disabled={item.disabled}
                      className="transition-colors rounded-lg py-5 my-0.5"
                    >
                      {item.disabled ? (
                        <div className="flex items-center opacity-50 cursor-not-allowed">
                          <item.icon className="mr-3 h-5 w-5" />
                          <span className="font-medium">{item.title}</span>
                        </div>
                      ) : (
                        <Link href={item.url} className="flex items-center">
                          <item.icon className="mr-3 h-5 w-5" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      )}
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
