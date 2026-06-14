import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider, useAuth } from "@/lib/auth";

// Public Pages
import Setup from "@/pages/public/setup";
import Login from "@/pages/public/login";
import Enrol from "@/pages/public/enrol";
import CardView from "@/pages/public/card";

// Layouts
import DashboardLayout from "@/components/layout/dashboard-layout";
import WorkerLayout from "@/components/layout/worker-layout";

// Dashboard Pages
import DashboardOverview from "@/pages/dashboard/index";
import Workers from "@/pages/dashboard/workers";
import Clients from "@/pages/dashboard/clients";
import ClientProfile from "@/pages/dashboard/client-profile";
import Products from "@/pages/dashboard/products";
import Scans from "@/pages/dashboard/scans";
import Rewards from "@/pages/dashboard/rewards";
import Analytics from "@/pages/dashboard/analytics";
import Campaigns from "@/pages/dashboard/campaigns";
import CampaignsNew from "@/pages/dashboard/campaigns-new";
import CampaignDetail from "@/pages/dashboard/campaign-detail";
import Contacts from "@/pages/dashboard/contacts";
import Settings from "@/pages/dashboard/settings";

// Worker Pages
import WorkerHome from "@/pages/worker/index";
import WorkerScan from "@/pages/worker/scan";
import WorkerMyQr from "@/pages/worker/my-qr";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({
  component: Component,
  role,
}: {
  component: React.ComponentType<any>;
  role: "owner" | "worker";
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (user.role !== role) {
    return <Redirect to={user.role === "owner" ? "/dashboard" : "/worker"} />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/setup" component={Setup} />
      <Route path="/login" component={Login} />
      <Route path="/enrol" component={Enrol} />
      <Route path="/card/:token" component={CardView} />

      <Route path="/dashboard*">
        <DashboardLayout>
          <Switch>
            <Route path="/dashboard">
              <ProtectedRoute component={DashboardOverview} role="owner" />
            </Route>
            <Route path="/dashboard/clients">
              <ProtectedRoute component={Clients} role="owner" />
            </Route>
            <Route path="/dashboard/clients/:id">
              <ProtectedRoute component={ClientProfile} role="owner" />
            </Route>
            <Route path="/dashboard/products">
              <ProtectedRoute component={Products} role="owner" />
            </Route>
            <Route path="/dashboard/scans">
              <ProtectedRoute component={Scans} role="owner" />
            </Route>
            <Route path="/dashboard/rewards">
              <ProtectedRoute component={Rewards} role="owner" />
            </Route>
            <Route path="/dashboard/analytics">
              <ProtectedRoute component={Analytics} role="owner" />
            </Route>
            <Route path="/dashboard/campaigns/new">
              <ProtectedRoute component={CampaignsNew} role="owner" />
            </Route>
            <Route path="/dashboard/campaigns/:id">
              <ProtectedRoute component={CampaignDetail} role="owner" />
            </Route>
            <Route path="/dashboard/campaigns">
              <ProtectedRoute component={Campaigns} role="owner" />
            </Route>
            <Route path="/dashboard/contacts">
              <ProtectedRoute component={Contacts} role="owner" />
            </Route>
            <Route path="/dashboard/settings">
              <ProtectedRoute component={Settings} role="owner" />
            </Route>
            <Route path="/dashboard/workers">
              <ProtectedRoute component={Workers} role="owner" />
            </Route>
          </Switch>
        </DashboardLayout>
      </Route>

      <Route path="/worker*">
        <WorkerLayout>
          <Switch>
            <Route path="/worker">
              <ProtectedRoute component={WorkerHome} role="worker" />
            </Route>
            <Route path="/worker/scan">
              <ProtectedRoute component={WorkerScan} role="worker" />
            </Route>
            <Route path="/worker/my-qr">
              <ProtectedRoute component={WorkerMyQr} role="worker" />
            </Route>
          </Switch>
        </WorkerLayout>
      </Route>

      <Route path="/">
        <Redirect to="/login" />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
