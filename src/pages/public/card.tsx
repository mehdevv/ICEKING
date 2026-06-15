import { useRef } from "react";
import { useRoute, Link } from "wouter";
import { useGetClientCard } from "@/api";
import { Button } from "@/components/ui/button";
import { CheckCircle, Gift, ChevronRight, Clock } from "lucide-react";
import { parseStampMilestones } from "@/lib/stamp-milestones";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";
import { fadeUp, scaleIn, vibrate, cardReveal, headerStagger, headerItem } from "@/lib/motion";
import ClientShell, { ClientLoading } from "@/components/client/client-shell";
import Mascot from "@/components/brand/mascot";
import ClientStampGrid from "@/components/client/stamp-grid";
import CardLinkBar from "@/components/client/card-link-bar";
import { cardPageUrl, normalizeCardCode } from "@/lib/card-code";
import { nextMilestoneHintText } from "@/lib/client-i18n";
import { useClientI18n } from "@/hooks/use-client-i18n";
import { useEffect } from "react";

const FIDELITY_CARD_BG = "/fidelity-card-bg.png";

export default function CardView() {
  const [, params] = useRoute("/card/:code");
  const code = params?.code ? normalizeCardCode(params.code) : "";
  const cardRef = useRef<HTMLDivElement>(null);

  const { t, lang } = useClientI18n();

  const { data: card, isLoading, error } = useGetClientCard(code, {
    query: { enabled: !!code },
  });

  useEffect(() => {
    if (card?.pendingRewardId) vibrate([30, 50, 30]);
  }, [card?.pendingRewardId]);

  if (!code) {
    return (
      <ClientShell>
        <div className="flex min-h-[100dvh] items-center justify-center p-4 text-center text-muted-foreground">
          {t("invalidCardLink")}
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
            <h2 className="text-xl font-bold mb-2">{t("cardNotFound")}</h2>
            <p className="text-muted-foreground text-sm">{t("cardNotFoundDesc")}</p>
            <Button className="mt-6 w-full rounded-xl" variant="outline" asChild>
              <Link href="/client">{t("getNewCard")}</Link>
            </Button>
          </div>
        </motion.div>
      </ClientShell>
    );
  }

  const milestones = parseStampMilestones(card.stampMilestones);
  const progress = Math.min(100, (card.currentCycleStamps / card.stampThreshold) * 100);
  const hint = nextMilestoneHintText(card.currentCycleStamps, card.stampThreshold, milestones, t);
  const dateLocale = lang === "fr" ? "fr-FR" : "en-US";
  const rewards = Array.isArray(card.rewards) ? card.rewards : [];
  const upcomingMilestones = milestones.filter((m) => m.position > card.currentCycleStamps);
  const showRewardsSection = rewards.length > 0 || upcomingMilestones.length > 0;

  return (
    <ClientShell primaryColor={card.primaryColor} secondaryColor="#0E9F6E">
      <motion.div
        className="flex flex-col min-h-[100dvh] max-w-md mx-auto pb-6"
        variants={fadeUp}
        initial="initial"
        animate="animate"
      >
        <motion.header
          className="px-5 pt-4 pb-3 flex items-center justify-between gap-3"
          variants={headerStagger}
          initial="initial"
          animate="animate"
        >
          <motion.div variants={headerItem} className="flex items-center gap-2.5 min-w-0">
            <Mascot role="client" size="xs" animate={false} className="shrink-0" />
            <div className="min-w-0">
              <h1 className="text-lg font-bold leading-tight truncate text-foreground drop-shadow-sm">
                {card.clientName}
              </h1>
              <p
                className="text-[11px] font-semibold uppercase tracking-wide truncate"
                style={{ color: card.primaryColor }}
              >
                {card.businessName}
              </p>
            </div>
          </motion.div>
          <motion.div variants={headerItem} className="shrink-0">
            <CardLinkBar code={card.cardCode} primaryColor={card.primaryColor} />
          </motion.div>
        </motion.header>

        <div className="px-5 flex-1">
          <motion.div
            ref={cardRef}
            className="relative w-full rounded-3xl overflow-hidden border border-white/70 shadow-[0_8px_32px_rgba(15,23,42,0.12)]"
            variants={cardReveal}
            initial="initial"
            animate="animate"
          >
            <div
              className="absolute inset-0 bg-cover bg-center pointer-events-none"
              style={{
                backgroundImage: `url(${FIDELITY_CARD_BG})`,
                opacity: 0.75,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/55 via-white/35 to-white/65 pointer-events-none" />

            <div className="relative p-5 flex justify-center">
              <motion.div
                className="bg-white p-3.5 rounded-2xl shadow-lg border border-gray-200/90"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 340, damping: 28, delay: 0.12 }}
              >
                <QRCodeSVG value={cardPageUrl(card.cardCode)} size={188} level="H" fgColor="#111" />
              </motion.div>
            </div>

            <div className="relative mx-4 mb-4 rounded-2xl bg-white/95 backdrop-blur-md border border-white/80 shadow-sm px-4 py-4">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-semibold text-gray-700">{t("progress")}</span>
                <span className="text-lg font-bold tabular-nums" style={{ color: card.primaryColor }}>
                  {card.currentCycleStamps}/{card.stampThreshold}
                </span>
              </div>

              <div className="h-2.5 rounded-full bg-gray-200/80 overflow-hidden mb-4 shadow-inner">
                <motion.div
                  className="h-full rounded-full shadow-sm"
                  style={{ backgroundColor: card.primaryColor }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>

              {hint && (
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.35 }}
                  className="text-xs text-center font-semibold mb-3 px-3 py-2 rounded-xl bg-amber-50 text-amber-950 border border-amber-200/80 shadow-sm"
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

              <p className="text-center text-xs font-medium text-gray-600 mt-5">{t("showQrHint")}</p>
            </div>
          </motion.div>

          {showRewardsSection && (
            <motion.div variants={scaleIn} className="mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 px-1">
                {t("myRewards")}
              </h3>
              <div className="space-y-2">
                {rewards.map((reward, i) => {
                  const isPending = !reward.redeemedAt;
                  const inner = (
                    <>
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                          isPending ? "bg-amber-400" : "bg-emerald-100"
                        }`}
                      >
                        {isPending ? (
                          <Gift className="h-5 w-5 text-white" />
                        ) : (
                          <CheckCircle className="h-5 w-5 text-emerald-600" />
                        )}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-semibold text-foreground truncate">{reward.rewardDescription}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(reward.createdAt).toLocaleDateString(dateLocale, {
                            month: "short",
                            day: "numeric",
                          })}
                          {" · "}
                          {isPending ? t("rewardPending") : t("rewardRedeemed")}
                        </p>
                        {isPending && (
                          <p className="text-xs text-amber-700 mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {t("tapToRedeem")}
                          </p>
                        )}
                      </div>
                      {isPending && <ChevronRight className="h-5 w-5 text-amber-600 shrink-0" />}
                    </>
                  );

                  return (
                    <motion.div
                      key={reward.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      {isPending ? (
                        <Link
                          href={`/reward/${reward.id}`}
                          className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 shadow-sm active:scale-[0.98] transition-transform"
                        >
                          {inner}
                        </Link>
                      ) : (
                        <Link
                          href={`/reward/${reward.id}`}
                          className="flex items-center gap-3 p-4 rounded-2xl bg-white/80 backdrop-blur border border-white/60 shadow-sm active:scale-[0.98] transition-transform"
                        >
                          {inner}
                        </Link>
                      )}
                    </motion.div>
                  );
                })}
                {upcomingMilestones.map((milestone, i) => (
                  <motion.div
                    key={`upcoming-${milestone.position}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (rewards.length + i) * 0.05 }}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-white/60 backdrop-blur border border-dashed border-gray-300"
                  >
                    <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 bg-gray-100 border border-gray-200">
                      <Gift className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-semibold text-muted-foreground truncate">{milestone.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t("rewardUpcoming", { position: milestone.position })}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </ClientShell>
  );
}
