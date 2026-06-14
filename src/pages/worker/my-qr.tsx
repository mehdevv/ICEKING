import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Download } from "lucide-react";
import { useLocation } from "wouter";
import { QRCodeSVG } from "qrcode.react";
import { useRef } from "react";

export default function WorkerMyQr() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const qrRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!qrRef.current || !user?.workerQrToken) return;
    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const link = document.createElement("a");
      link.download = `qr-${user.fullName?.replace(/\s+/g, "-").toLowerCase()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  if (!user?.workerQrToken) return null;

  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")} aria-label="Back to worker home">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-bold">My QR Code</h2>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <div>
          <p className="text-center text-muted-foreground text-sm mb-2">Your worker identity card</p>
          <p className="text-center text-xl font-bold">{user.fullName}</p>
        </div>

        <Card className="shadow-lg border-2 border-primary/20">
          <CardContent className="p-6">
            <div ref={qrRef} className="bg-white rounded-xl p-2">
              <QRCodeSVG value={user.workerQrToken} size={256} level="H" />
            </div>
          </CardContent>
        </Card>

        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Show this QR code to the manager or print it for identification
        </p>

        <Button variant="outline" onClick={handleDownload} className="w-full max-w-xs">
          <Download className="h-4 w-4 mr-2" /> Download QR Code
        </Button>
      </div>
    </div>
  );
}
