import { useAuth } from "@/lib/auth";
import { useGetMe } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, UserCircle, Star } from "lucide-react";
import { Link } from "wouter";

export default function WorkerHome() {
  const { user } = useAuth();
  const { data: me } = useGetMe();

  return (
    <div className="flex-1 flex flex-col p-4 bg-muted/30">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Hello, {user?.fullName?.split(" ")[0]}
        </h2>
        <p className="text-muted-foreground">Ready for a great shift?</p>
      </div>

      <Card className="mb-8 border-none shadow-md bg-gradient-to-br from-primary/10 to-primary/5">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Your Scans Today</p>
            <p className="text-4xl font-bold text-primary">
              {/* Note: In a real app we'd fetch worker specific stats today, using full scan count for mockup */}
              {me && 'scanCount' in me ? (me as any).scanCount : "0"}
            </p>
          </div>
          <div className="h-16 w-16 bg-primary/20 rounded-full flex items-center justify-center">
            <Star className="h-8 w-8 text-primary" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 mt-auto mb-8">
        <Link href="/worker/scan" className="block">
          <Button size="lg" className="w-full h-24 text-xl shadow-lg rounded-2xl flex flex-col gap-2 bg-primary hover:bg-primary/90">
            <QrCode className="h-8 w-8" />
            Scan Customer Card
          </Button>
        </Link>
        
        <Link href="/worker/my-qr" className="block">
          <Button size="lg" variant="outline" className="w-full h-16 text-lg border-2 rounded-2xl">
            <UserCircle className="h-5 w-5 mr-2 text-muted-foreground" />
            Show My QR Code
          </Button>
        </Link>
      </div>
    </div>
  );
}
