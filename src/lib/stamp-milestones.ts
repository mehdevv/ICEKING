export type StampMilestone = {
  position: number;
  label: string;
};

export function parseStampMilestones(raw: unknown): StampMilestone[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (item): item is StampMilestone =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as StampMilestone).position === "number" &&
        typeof (item as StampMilestone).label === "string" &&
        (item as StampMilestone).label.trim().length > 0,
    )
    .map((item) => ({
      position: Math.floor(item.position),
      label: item.label.trim(),
    }))
    .sort((a, b) => a.position - b.position);
}

export function clampMilestonesToThreshold(
  milestones: StampMilestone[],
  threshold: number,
): StampMilestone[] {
  return milestones
    .filter((m) => m.position >= 1 && m.position <= threshold)
    .sort((a, b) => a.position - b.position);
}

export function getMilestoneAt(
  milestones: StampMilestone[],
  position: number,
): StampMilestone | undefined {
  return milestones.find((m) => m.position === position);
}

export function resolveStampReward(
  newCycleStamps: number,
  threshold: number,
  milestones: StampMilestone[],
  fallbackReward: string,
): {
  rewardTriggered: boolean;
  rewardDescription: string | null;
  finalCycleStamps: number;
} {
  const milestone = getMilestoneAt(milestones, newCycleStamps);

  if (milestone) {
    return {
      rewardTriggered: true,
      rewardDescription: milestone.label,
      finalCycleStamps: newCycleStamps >= threshold ? 0 : newCycleStamps,
    };
  }

  if (newCycleStamps >= threshold) {
    return {
      rewardTriggered: true,
      rewardDescription: fallbackReward || "Loyalty reward",
      finalCycleStamps: 0,
    };
  }

  return {
    rewardTriggered: false,
    rewardDescription: null,
    finalCycleStamps: newCycleStamps,
  };
}
