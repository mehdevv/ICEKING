import { useRef } from "react";
import { useRoute, Link } from "wouter";
import { useGetClientCard } from "@/api";
import { Button } from "@/components/ui/button";
import { Download, Share2, Gift, ChevronRight } from "lucide-react";
import { parseStampMilestones } from "@/lib/stamp-milestones";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";
import { fadeUp, scaleIn, tapScale, vibrate } from "@/lib/motion";
import ClientShell, { ClientLoading } from "@/components/client/client-shell";
import ClientStampGrid, { nextMilestoneHint } from "@/components/client/stamp-grid";
import { useEffect } from "react";

export default function CardView() {
  const [, params] = useRoute("/card/:token");
  const token = params?.token;
  const cardRef = useRef<HTMLDivElement>(null);

  const { data: card, isLoading, error } = useGetClientCard(token || "", {
    query: { enabled: !!token },
  });

  useEffect(() => {
    if (card?.pendingRewardId) vibrate([30, 50, 30]);
  }, [card?.pendingRewardId]);

  if (!token) {
    return (
      <ClientShell>
        <div className="flex min-h-[100dvh] items-center justify-center p-4 text-center text-muted-foreground">
          Invalid card link
        </div>
      </ClientShell>
    );
  }

  if (isLoading) return <ClientLoading />;

  if (error || !card) {
    return (
      <ClientShell>
        <motion.div
          className="flex min-h-[100dvh] items-center justify-center p-4"
          variants={fadeUp}
          initial="initial"
          animate="animate"
        >
          <div className="text-center p-8 bg-white/90 backdrop-blur rounded-3xl shadow-lg max-w-sm w-full">
            <h2 className="text-xl font-bold mb-2">Card not found</h2>
            <p className="text-muted-foreground text-sm">
              This loyalty card doesn&apos;t exist or was removed.
            </p>
            <Button className="mt-6 w-full rounded-xl" variant="outline" asChild>
              <Link href="/client">Get a new card</Link>
            </Button>
          </div>
        </motion.div>
      </ClientShell>
    );
  }

  const milestones = parseStampMilestones(card.stampMilestones);
  const bgImage = card.cardTemplateUrl || "/card-bg.png";
  const progress = Math.min(100, (card.currentCycleStamps / card.stampThreshold) * 100);
  const hint = nextMilestoneHint(card.currentCycleStamps, card.stampThreshold, milestones);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(cardRef.current, { scale: 2, useCORS: true });
    const link = document.createElement("a");
    link.download = `${card.clientName.replace(/\s+/g, "-")}-loyalty-card.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    vibrate(40);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `${card.businessName} Loyalty Card`,
        url: window.location.href,
      });
    }
  };

  return (
    <ClientShell primaryColor={card.primaryColor} secondaryColor="#0E9F6E">
      <motion.div
        className="flex flex-col min-h-[100dvh] max-w-md mx-auto pb-28"
        variants={fadeUp}
        initial="initial"
        animate="animate"
      >
        <header className="px-4 pt-6 pb-2 text-center">
          <motion.p
            className="text-xs font-semibold uppercase tracking-widest opacity-70"
            style={{ color: card.primaryColor }}
          >
            {card.businessName}
          </motion.p>
          <h1 className="text-2xl font-bold mt-1">{card.clientName}</h1>
        </header>

        {card.pendingRewardId && (
          <motion.div variants={scaleIn} className="px-4 mb-4">
            <Link
              href={`/rewards/${token}`}
              className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 shadow-sm active:scale-[0.98] transition-transform"
            >
              <div className="h-12 w-12 rounded-full bg-amber-400 flex items-center justify-center shrink-0 shadow-md">
                <Gift className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="font-bold text-amber-900">Reward ready!</p>
                <p className="text-sm text-amber-800 truncate">{card.pendingRewardDescription}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-amber-600 shrink-0" />
            </Link>
          </motion.div>
        )}

        <div className="px-4 flex-1">
          <div
            ref={cardRef}
            className="relative w-full rounded-3xl shadow-2xl overflow-hidden bg-white"
            style={{ borderTop: `6px solid ${card.primaryColor}` }}
          >
            <div
              className="absolute inset-0 opacity-15 bg-cover bg-center pointer-events-none"
              style={{ backgroundImage: `url(${bgImage})` }}
            />

            <div className="relative p-5 flex justify-center bg-white/85">
              <motion.div
                className="bg-white p-3 rounded-2xl shadow-md border border-gray-100"
                animate={{ boxShadow: [`0 4px 20px ${card.primaryColor}15`, `0 4px 28px ${card.primaryColor}35`, `0 4px 20px ${card.primaryColor}15`] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <QRCodeSVG value={token} size={188} level="H" fgColor="#111" />
              </motion.div>
            </div>

            <div className="relative px-5 pb-6 pt-2 bg-white/95">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-medium text-gray-600">Progress</span>
                <span className="text-lg font-bold tabular-nums" style={{ color: card.primaryColor }}>
                  {card.currentCycleStamps}/{card.stampThreshold}
                </span>
              </div>

              <div className="h-2 rounded-full bg-gray-100 overflow-hidden mb-4">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: card.primaryColor }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>

              {hint && (
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-center font-medium mb-3 px-2 py-2 rounded-lg bg-amber-50 text-amber-900 border border-amber-100"
                >
                  {hint}
                </motion.p>
              )}

              <ClientStampGrid
                stampThreshold={card.stampThreshold}
                currentStamps={card.currentCycleStamps}
                milestones={milestones}
                primaryColor={card.primaryColor}
              />

              <p className="text-center text-xs text-gray-500 mt-5">
                Show this QR at the counter to collect stamps
              </p>
            </div>
          </div>

          {card.recentScans && card.recentScans.length > 0 && (
            <motion.div className="mt-6" variants={fadeUp}>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 px-1">
                Recent visits
              </h3>
              <div className="space-y-2">
                {card.recentScans.map((scan, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex justify-between text-sm bg-white/80 backdrop-blur rounded-xl px-4 py-3 shadow-sm border border-white/60"
                  >
                    <span className="text-muted-foreground">
                      {new Date(scan.scannedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span
                      className={
                        scan.status === "approved" ? "font-semibold text-emerald-600" : "text-destructive"
                      }
                    >
                      {scan.status === "approved" ? `+${scan.stampsAdded}` : "Blocked"}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white/95 to-transparent pt-8">
          <div className="max-w-md mx-auto flex gap-3">
            <motion.div className="flex-1" {...tapScale()}>
              <Button
                className="w-full h-14 rounded-2xl text-base"
                variant="outline"
                onClick={handleShare}
              >
                <Share2 className="mr-2 h-5 w-5" />
                Share
              </Button>
            </motion.div>
            <motion.div className="flex-1" {...tapScale()}>
              <Button
                className="w-full h-14 rounded-2xl text-base shadow-lg"
                onClick={handleDownload}
                style={{ backgroundColor: card.primaryColor }}
              >
                <Download className="mr-2 h-5 w-5" />
                Save
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </ClientShell>
  );
}
