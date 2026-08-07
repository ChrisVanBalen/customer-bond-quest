import { LayoutDashboard, Users, Package, TicketCheck, FileSignature, Wrench, FolderKanban, ChevronRight, LayoutTemplate, CalendarClock, Settings, Map as MapIcon } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Customers", url: "/customers", icon: Users },
  { title: "Assets", url: "/assets", icon: Package },
];

const ticketSubItems = [
  { title: "Ticket Map", url: "/tickets/map", icon: Map },
  { title: "Templates", url: "/tickets/templates", icon: LayoutTemplate },
  { title: "Scheduled Tickets", url: "/tickets/scheduled", icon: CalendarClock },
];

const bottomNavItems = [
  { title: "Projects", url: "/projects", icon: FolderKanban },
  { title: "Technicians", url: "/technicians", icon: Wrench },
  { title: "Agreements", url: "/agreements", icon: FileSignature },
  { title: "App Settings", url: "/settings", icon: Settings },
];

const linkClass = "flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors";
const activeClass = "bg-sidebar-accent text-sidebar-primary font-medium";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const ticketsSectionActive = location.pathname.startsWith("/tickets");
  const [ticketsOpen, setTicketsOpen] = useState(ticketsSectionActive);

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="pt-4">
        <div className="px-4 pb-6 flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
            <span className="text-sidebar-primary-foreground font-bold text-sm">CM</span>
          </div>
          {!collapsed && <span className="font-semibold text-sidebar-accent-foreground text-base">CommandHub</span>}
        </div>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={item.url === "/"} className={linkClass} activeClassName={activeClass}>
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              <Collapsible open={collapsed ? false : ticketsOpen} onOpenChange={setTicketsOpen}>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/tickets" end className={linkClass} activeClassName={activeClass}>
                      <TicketCheck className="h-5 w-5 shrink-0" />
                      {!collapsed && <span>Tickets</span>}
                    </NavLink>
                  </SidebarMenuButton>
                  {!collapsed && (
                    <CollapsibleTrigger asChild>
                      <button
                        aria-label="Toggle ticket submenu"
                        className="absolute right-1 top-1.5 p-1 rounded-md text-sidebar-foreground hover:bg-sidebar-accent"
                      >
                        <ChevronRight className={`h-4 w-4 transition-transform ${ticketsOpen ? "rotate-90" : ""}`} />
                      </button>
                    </CollapsibleTrigger>
                  )}
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {ticketSubItems.map((sub) => (
                        <SidebarMenuSubItem key={sub.title}>
                          <SidebarMenuSubButton asChild>
                            <NavLink
                              to={sub.url}
                              className="flex items-center gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                              activeClassName={activeClass}
                            >
                              <sub.icon className="h-4 w-4 shrink-0" />
                              <span>{sub.title}</span>
                            </NavLink>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {bottomNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={linkClass} activeClassName={activeClass}>
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
