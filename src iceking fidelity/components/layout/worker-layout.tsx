import { Link, useLocation } from "wouter";
import { LogOut, Home, QrCode } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useLogout } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
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

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      <header className="h-14 border-b border-border bg-card flex items-center px-4 sticky top-0 z-10 shrink-0 shadow-sm">
        <h1 className="text-lg font-bold text-primary tracking-tight">Ice King Worker</h1>
        <div className="ml-auto">
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Logout</span>
          </Button>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col w-full max-w-md mx-auto relative overflow-hidden pb-16">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around px-4 pb-safe z-50">
        <Link 
          href="/worker" 
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${location === "/worker" ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
        >
          <Home className="h-5 w-5" />
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        <Link 
          href="/worker/scan" 
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${location === "/worker/scan" ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
        >
          <div className="h-10 w-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-md -mt-4 ring-4 ring-background">
            <QrCode className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-medium">Scan</span>
        </Link>
        <Link 
          href="/worker/my-qr" 
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${location === "/worker/my-qr" ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
        >
          <QrCode className="h-5 w-5" />
          <span className="text-[10px] font-medium">My QR</span>
        </Link>
      </nav>
    </div>
  );
}
