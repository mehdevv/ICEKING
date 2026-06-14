import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
import { Users, LayoutDashboard, Settings, Gift, QrCode, LogOut, Package, BarChart3, Mail } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useLogout } from "@workspace/api-client-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { logout, user } = useAuth();
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } finally {
      logout();
    }
  };

  const navItems = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { label: "Clients", href: "/dashboard/clients", icon: Users },
    { label: "Scans", href: "/dashboard/scans", icon: QrCode },
    { label: "Rewards", href: "/dashboard/rewards", icon: Gift },
    { label: "Products", href: "/dashboard/products", icon: Package },
    { label: "Campaigns", href: "/dashboard/campaigns", icon: Mail },
    { label: "Workers", href: "/dashboard/workers", icon: Users },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/20">
        <Sidebar className="border-r border-border bg-card">
          <SidebarHeader className="p-4 border-b border-border">
            <h2 className="text-lg font-bold text-primary tracking-tight">Ice King</h2>
            <p className="text-xs text-muted-foreground">Dashboard</p>
          </SidebarHeader>
          <SidebarContent className="p-2">
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location === item.href}
                    tooltip={item.label}
                  >
                    <Link href={item.href} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
            <div className="mt-auto pt-4 border-t border-border/50">
               <SidebarMenu>
                 <SidebarMenuItem>
                   <SidebarMenuButton onClick={handleLogout} className="text-destructive hover:bg-destructive/10">
                     <LogOut className="h-4 w-4" />
                     <span>Logout</span>
                   </SidebarMenuButton>
                 </SidebarMenuItem>
               </SidebarMenu>
            </div>
          </SidebarContent>
        </Sidebar>
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-14 border-b border-border bg-card flex items-center px-4 md:px-6 sticky top-0 z-10 shrink-0">
            <SidebarTrigger className="-ml-2 mr-2" />
            <div className="ml-auto flex items-center gap-4">
              <span className="text-sm font-medium text-foreground">{user?.fullName}</span>
            </div>
          </header>
          <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
            <div className="mx-auto max-w-6xl w-full">
              {children}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
