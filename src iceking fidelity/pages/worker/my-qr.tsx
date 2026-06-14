import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Download } from "lucide-react";
import { Link } from "wouter";

export default function WorkerMyQr() {
  const { user } = useAuth();

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = `/api/workers/${user?.id}/qr`;
    link.download = `qr-${user?.fullName?.replace(/\s+/g, "-").toLowerCase()}.png`;
    link.click();
  };

  if (!user) return null;

  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" asChild><Link href="/worker"><ArrowLeft className="h-5 w-5" /></Link></Button>
        <h2 className="text-xl font-bold">My QR Code</h2>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <div>
          <p className="text-center text-muted-foreground text-sm mb-2">Your worker identity card</p>
          <p className="text-center text-xl font-bold">{user.fullName}</p>
        </div>

        <Card className="shadow-lg border-2 border-primary/20">
          <CardContent className="p-6">
            <div className="bg-white rounded-xl p-2">
              <img
                src={`/api/workers/${user.id}/qr`}
                alt="My Worker QR Code"
                className="w-64 h-64 object-contain"
              />
            </div>
          </CardContent>
        </Card>

        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">Show this QR code to the manager or print it for identification</p>
        </div>

        <Button variant="outline" onClick={handleDownload} className="w-full max-w-xs">
          <Download className="h-4 w-4 mr-2" /> Download QR Code
        </Button>
      </div>
    </div>
  );
}
