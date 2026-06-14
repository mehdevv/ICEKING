import { useRoute, Link, useLocation } from "wouter";
import { useGetRewardClaim } from "@/api";
import { Button, Card, Skeleton } from "@heroui/react";
import { motion } from "framer-motion";
import { scaleIn } from "@/lib/motion";
import { Gift, ArrowLeft, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function RewardClaim() {
  const [, params] = useRoute("/rewards/:token");
  const token = params?.token ?? "";

  const { data: reward, isLoading, error } = useGetRewardClaim(token, {
    query: { enabled: !!token },
  });
  const [, navigate] = useLocation();

  if (!token) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center p-4">
        <p className="text-muted-foreground">Invalid reward link.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-neutral-100 p-4 flex flex-col items-center py-12 max-w-md mx-auto">
        <Skeleton className="h-12 w-48 mb-8 rounded-lg" />
        <Skeleton className="w-full aspect-square rounded-3xl" />
      </div>
    );
  }

  if (error || !reward) {
    return (
      <div className="min-h-[100dvh] bg-neutral-100 p-4 flex flex-col items-center justify-center max-w-md mx-auto">
        <Card className="p-8 text-center w-full">
          <h2 className="text-xl font-bold mb-2">No Pending Reward</h2>
          <p className="text-muted-foreground mb-6">
            This customer has no reward waiting to be claimed.
          </p>
          <Button variant="secondary" onPress={() => navigate(`/card/${token}`)}>
            View Loyalty Card
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="min-h-[100dvh] flex flex-col items-center py-8 px-4 max-w-md mx-auto"
      style={{ backgroundColor: `${reward.primaryColor}12` }}
    >
      <Link href={`/card/${token}`} className="self-start mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-primary min-h-12">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Card
      </Link>

      <motion.div className="w-full" variants={scaleIn} initial="initial" animate="animate">
        <motion.div
          className="flex justify-center mb-6"
          animate={{ rotate: [0, -5, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        >
          <div
            className="h-20 w-20 rounded-full flex items-center justify-center shadow-lg"
            style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}
          >
            <Gift className="h-10 w-10 text-white" />
          </div>
        </motion.div>

        <Card className="p-6 text-center shadow-xl border-t-4" style={{ borderTopColor: reward.primaryColor }}>
          <p className="text-sm text-muted-foreground uppercase tracking-wide">{reward.businessName}</p>
          <h1 className="text-2xl font-bold mt-2">{reward.clientName}</h1>
          <p className="text-lg font-semibold mt-4" style={{ color: reward.primaryColor }}>
            {reward.rewardDescription}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Earned {new Date(reward.createdAt).toLocaleDateString()}
          </p>

          <div className="mt-8 p-6 bg-neutral-50 rounded-2xl">
            <QrCode className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-medium mb-4">Show this to staff to redeem</p>
            <div className="inline-block bg-white p-4 rounded-xl shadow-sm">
              <QRCodeSVG value={`reward:${reward.id}`} size={180} level="H" />
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            Staff will mark this reward as redeemed in the dashboard.
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
