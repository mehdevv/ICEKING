import { useRef } from "react";
import { useRoute, Link } from "wouter";
import { useGetClientCard } from "@/api";
import { Button } from "@/components/ui/button";
import { Download, Share2, CheckCircle2, Gift } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";
import { fadeUp, scaleIn } from "@/lib/motion";

export default function CardView() {
  const [, params] = useRoute("/card/:token");
  const token = params?.token;
  const cardRef = useRef<HTMLDivElement>(null);

  const { data: card, isLoading, error } = useGetClientCard(token || "", {
    query: { enabled: !!token },
  });

  if (!token) return <div className="p-4 text-center">Invalid link</div>;

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-muted p-4 flex flex-col items-center py-12 max-w-md mx-auto">
        <Skeleton className="h-12 w-48 mb-8 rounded-lg" />
        <Skeleton className="w-full aspect-[4/5] rounded-3xl" />
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="min-h-[100dvh] bg-muted p-4 flex flex-col items-center justify-center max-w-md mx-auto">
        <div className="text-center p-8 bg-card rounded-2xl shadow-sm">
          <h2 className="text-xl font-bold mb-2">Card Not Found</h2>
          <p className="text-muted-foreground">This loyalty card doesn&apos;t exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const handleDownload = async () => {
    if (!cardRef.current) return;
    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(cardRef.current, { scale: 2, useCORS: true });
    const link = document.createElement("a");
    link.download = `${card.clientName.replace(/\s+/g, "-")}-loyalty-card.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const stamps = Array.from({ length: card.stampThreshold });
  const bgImage = card.cardTemplateUrl || "/card-bg.png";

  return (
    <motion.div
      className="min-h-[100dvh] flex flex-col items-center py-8 px-4 max-w-md mx-auto"
      style={{ backgroundColor: `${card.primaryColor}15` }}
      variants={fadeUp}
      initial="initial"
      animate="animate"
    >
      <h1 className="text-2xl font-bold text-center mb-6" style={{ color: card.primaryColor }}>
        {card.businessName}
      </h1>

      {card.pendingRewardId && (
        <motion.div variants={scaleIn} className="w-full mb-6">
          <Link
            href={`/rewards/${token}`}
            className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 shadow-sm"
          >
            <div className="h-12 w-12 rounded-full bg-amber-400 flex items-center justify-center shrink-0">
              <Gift className="h-6 w-6 text-white" />
            </div>
            <div className="text-left">
              <p className="font-bold text-amber-800">Reward Ready!</p>
              <p className="text-sm text-amber-700">{card.pendingRewardDescription}</p>
            </div>
          </Link>
        </motion.div>
      )}

      <div className="w-full">
        <div
          ref={cardRef}
          className="relative w-full rounded-3xl shadow-2xl overflow-hidden bg-white"
          style={{ borderTop: `8px solid ${card.primaryColor}` }}
        >
          <div
            className="absolute inset-0 opacity-20 bg-cover bg-center pointer-events-none"
            style={{ backgroundImage: `url(${bgImage})` }}
          />

          <div className="relative p-6 text-center border-b border-gray-100/80 bg-white/90">
            <h2 className="text-xl font-semibold text-gray-800">{card.clientName}</h2>
            <p className="text-sm text-gray-500 mt-1">Member Card</p>
          </div>

          <div className="relative p-8 flex justify-center bg-white/80">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <QRCodeSVG value={token} size={200} level="H" fgColor="#000" />
            </div>
          </div>

          <div className="relative p-6 bg-white/95">
            <div className="flex justify-between items-center mb-4">
              <span className="font-medium text-gray-700">Your Progress</span>
              <span className="text-sm font-bold" style={{ color: card.primaryColor }}>
                {card.currentCycleStamps} / {card.stampThreshold}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-3">
              {stamps.map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-full flex items-center justify-center border-2 transition-all"
                  style={{
                    borderColor: i < card.currentCycleStamps ? card.primaryColor : "#E5E7EB",
                    backgroundColor: i < card.currentCycleStamps ? `${card.primaryColor}20` : "transparent",
                  }}
                >
                  {i < card.currentCycleStamps && (
                    <CheckCircle2 className="w-6 h-6" style={{ color: card.primaryColor }} />
                  )}
                </div>
              ))}
            </div>

            <p className="text-center text-sm text-gray-500 mt-6">
              Show this QR code to the cashier to earn stamps!
            </p>
          </div>
        </div>
      </div>

      {card.recentScans && card.recentScans.length > 0 && (
        <div className="w-full mt-8">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Recent Activity</h3>
          <div className="space-y-2">
            {card.recentScans.map((scan, i) => (
              <div key={i} className="flex justify-between text-sm bg-card rounded-lg px-4 py-2 shadow-sm">
                <span>{new Date(scan.scannedAt).toLocaleDateString()}</span>
                <span className={scan.status === "approved" ? "text-secondary" : "text-destructive"}>
                  {scan.status === "approved" ? `+${scan.stampsAdded} stamp` : "Blocked"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="w-full mt-8 flex gap-4">
        <Button
          className="flex-1 h-14 rounded-xl shadow-sm min-h-12"
          variant="outline"
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: `${card.businessName} Loyalty Card`,
                url: window.location.href,
              });
            }
          }}
        >
          <Share2 className="mr-2 h-5 w-5" />
          Share
        </Button>
        <Button
          className="flex-1 h-14 rounded-xl shadow-md min-h-12"
          onClick={handleDownload}
          style={{ backgroundColor: card.primaryColor }}
        >
          <Download className="mr-2 h-5 w-5" />
          Save
        </Button>
      </div>
    </motion.div>
  );
}
