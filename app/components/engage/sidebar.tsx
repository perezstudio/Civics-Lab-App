// app/components/engage/sidebar.tsx
import { useState, useEffect } from "react";
import { Link, useLocation } from "@remix-run/react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
} from "~/components/ui/sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Building2,
  Contact2,
  HeartHandshake,
  HelpCircle,
  Settings,
  User,
  ChevronDown,
  Gauge
} from "lucide-react";

interface Workspace {
  id: string;
  name: string;
}

interface SidebarProps {
  user: any;
  workspaces: Workspace[];
}

export function EngageSidebar({ user, workspaces }: SidebarProps) {
  const location = useLocation();
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>("");

  // Set initial workspace
  useEffect(() => {
    const stored = localStorage.getItem("selectedWorkspace");
    if (stored && workspaces.find(w => w.id === stored)) {
      setSelectedWorkspace(stored);
    } else if (workspaces.length > 0) {
      setSelectedWorkspace(workspaces[0].id);
      localStorage.setItem("selectedWorkspace", workspaces[0].id);
    }
  }, [workspaces]);

  const handleWorkspaceChange = (value: string) => {
    setSelectedWorkspace(value);
    localStorage.setItem("selectedWorkspace", value);
  };

  const mainMenuItems = [
    { href: "/engage", label: "Dashboard", icon: Gauge },
    { href: "contacts", label: "Contacts", icon: Contact2 },
    { href: "businesses", label: "Businesses", icon: Building2 },
    { href: "donations", label: "Donations", icon: HeartHandshake },
  ];

  const footerMenuItems = [
    { href: "account", label: "My Account", icon: User },
    { href: "settings", label: "Settings", icon: Settings },
    { href: "support", label: "Help & Support", icon: HelpCircle },
  ];

  return (
    <SidebarProvider defaultOpen={true}>
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <Select value={selectedWorkspace} onValueChange={handleWorkspaceChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select workspace" />
              </SelectTrigger>
              <SelectContent>
                {workspaces.map((workspace) => (
                  <SelectItem key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.includes(item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link to={item.href}>
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {footerMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.includes(item.href);
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={isActive}>
                  <Link to={item.href}>
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
    </SidebarProvider>
  );
}