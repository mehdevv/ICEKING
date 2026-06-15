import { motion } from "framer-motion";
import { CheckCircle2, Gift } from "lucide-react";
import { getMilestoneAt, type StampMilestone } from "@/lib/stamp-milestones";
import { staggerContainer, staggerItem, reducedMotion } from "@/lib/motion";

type Props = {
  stampThreshold: number;
  currentStamps: number;
  milestones: StampMilestone[];
  primaryColor: string;
  compact?: boolean;
};

export default function ClientStampGrid({
  stampThreshold,
  currentStamps,
  milestones,
  primaryColor,
  compact = false,
}: Props) {
  const stamps = Array.from({ length: stampThreshold });

  return (
    <motion.div
      className={`grid grid-cols-5 ${compact ? "gap-2" : "gap-3"}`}
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {stamps.map((_, i) => {
        const position = i + 1;
        const filled = i < currentStamps;
        const prize = getMilestoneAt(milestones, position);
        const isNext = !filled && position === currentStamps + 1;

        return (
          <motion.div
            key={position}
            variants={staggerItem}
            className={`flex flex-col items-center gap-1 ${compact ? "min-h-[3.5rem]" : "min-h-[4.5rem]"}`}
          >
            <motion.div
              className={`w-full aspect-square rounded-full flex items-center justify-center border-2 ${
                isNext ? "ring-2 ring-offset-1" : ""
              }`}
              style={{
                borderColor: filled ? primaryColor : prize ? "#F59E0B" : "#E5E7EB",
                backgroundColor: filled ? `${primaryColor}22` : prize ? "#FEF3C7" : "transparent",
                ringColor: isNext ? `${primaryColor}55` : undefined,
              }}
              animate={
                isNext && !reducedMotion
                  ? { scale: [1, 1.06, 1], boxShadow: [`0 0 0 0 ${primaryColor}00`, `0 0 0 6px ${primaryColor}22`, `0 0 0 0 ${primaryColor}00`] }
                  : filled && !reducedMotion
                    ? { scale: [0.8, 1.05, 1] }
                    : {}
              }
              transition={
                isNext
                  ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
                  : { type: "spring", stiffness: 400, damping: 20 }
              }
            >
              {filled ? (
                <CheckCircle2 className={compact ? "w-5 h-5" : "w-6 h-6"} style={{ color: primaryColor }} />
              ) : prize ? (
                <Gift className={compact ? "w-4 h-4 text-amber-600" : "w-5 h-5 text-amber-600"} />
              ) : (
                <span className="text-xs font-semibold text-gray-400">{position}</span>
              )}
            </motion.div>
            {prize && (
              <span className="text-[10px] text-center leading-tight font-semibold text-amber-800 line-clamp-2 w-full">
                {prize.label}
              </span>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}

export function nextMilestoneHint(
  currentStamps: number,
  stampThreshold: number,
  milestones: StampMilestone[],
): string | null {
  const upcoming = milestones
    .filter((m) => m.position > currentStamps && m.position <= stampThreshold)
    .sort((a, b) => a.position - b.position)[0];
  if (!upcoming) return null;
  const remaining = upcoming.position - currentStamps;
  return `${remaining} more stamp${remaining === 1 ? "" : "s"} until: ${upcoming.label}`;
}
