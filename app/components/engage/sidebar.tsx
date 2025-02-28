// app/components/engage/sidebar.tsx
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
import { signOut } from "~/services/auth.client";
import { toast } from "sonner";

interface Workspace {
  id: string;
  name: string;
}

interface SidebarProps {
  user: any;
  workspaces: Workspace[];
  selectedWorkspace: string | null;
  onWorkspaceChange: (workspaceId: string) => void;
}

export function EngageSidebar({ 
  user, 
  workspaces, 
  selectedWorkspace, 
  onWorkspaceChange 
}: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  
  const handleWorkspaceChange = (value: string) => {
    onWorkspaceChange(value);
    
    // If we're already in engage, refresh the current page
    // This forces child routes to re-render with the new workspace context
    if (location.pathname.includes('engage')) {
      // Use the current pathname without adding any query parameters
      window.location.href = location.pathname;
    }
  };
  
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
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
              <Select 
                value={selectedWorkspace || undefined} 
                onValueChange={handleWorkspaceChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select workspace">
                    {workspaces.find(w => w.id === selectedWorkspace)?.name || "Select workspace"}
                  </SelectValue>
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
                  
                  // Use links without query parameters
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
            
            {/* User info and sign out button */}
            <SidebarMenuItem>
              <div className="px-3 py-2 mt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center">
                    {user?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium truncate">{user?.email}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Sign Out</span>
                </Button>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
}