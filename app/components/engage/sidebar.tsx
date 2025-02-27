// app/components/engage/sidebar.tsx
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "@remix-run/react";
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
  LogOut,
  Gauge
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { getClientSupabase } from "~/services/supabase";
import { toast } from "sonner";

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
  const navigate = useNavigate();
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
    
    // Refresh current page to update data based on new workspace
    if (location.pathname.includes('engage')) {
      // Add url parameter for the new workspace
      const url = new URL(window.location.href);
      url.searchParams.set('workspace', value);
      window.location.href = url.toString();
    }
  };
  
  const handleSignOut = async () => {
    try {
      const supabase = getClientSupabase();
      if (supabase) {
        await supabase.auth.signOut();
        navigate('/login');
      }
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  const mainMenuItems = [
    { href: "/engage", label: "Dashboard", icon: Gauge },
    { href: "/engage/contacts", label: "Contacts", icon: Contact2 },
    { href: "/engage/businesses", label: "Businesses", icon: Building2 },
    { href: "/engage/donations", label: "Donations", icon: HeartHandshake },
  ];

  const footerMenuItems = [
    { href: "/engage/account", label: "My Account", icon: User },
    { href: "/engage/settings", label: "Settings", icon: Settings },
    { href: "/engage/support", label: "Help & Support", icon: HelpCircle },
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
                  const isActive = location.pathname === item.href || 
                                  (item.href !== "/engage" && location.pathname.startsWith(item.href));
                  const href = item.href + (selectedWorkspace ? `?workspace=${selectedWorkspace}` : '');
                  
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link to={href}>
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
              const href = item.href + (selectedWorkspace ? `?workspace=${selectedWorkspace}` : '');
              
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive}>
                    <Link to={href}>
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
            
            {/* Sign out button */}
            <SidebarMenuItem>
              <SidebarMenuButton asChild onClick={handleSignOut}>
                <Button variant="ghost" className="w-full justify-start">
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </Button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
}