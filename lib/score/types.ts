export type Address = `0x${string}`;

export type VouchStatus = "active" | "disputed" | "slashed" | "withdrawn";
export type DisputeStatus = "open" | "dismissed" | "upheld";
export type BadgeStatus = "unverified" | "community_verified";

export type ScoreTriggerEvent =
  | "vouch_received"
  | "review_received"
  | "dispute_opened"
  | "dispute_resolved"
  | "badge_verified"
  | "invite_bonus"
  | "manual_recalc"
  | "onchain_refresh";

/** Data mentah yang dibutuhkan untuk menghitung skor. Tidak ada I/O di dalam score engine. */
export interface ScoreInput {
  address: Address;
  onchain: {
    firstTxAt: Date | null;
    txCount: number;
  };
  vouchesReceived: Array<{
    fromAddress: Address;
    stakeAmount: bigint;
    status: VouchStatus;
    createdAt: Date;
  }>;
  reviewsReceived: Array<{ rating: number }>;
  invitedBy: Address | null;
  verifiedBadgeCount: number;
  hasActiveDispute: boolean;
}

/** Rincian tiap komponen skor. Disimpan apa adanya ke score_snapshots.breakdown. */
export interface ScoreBreakdown {
  baselineOnchain: number;
  totalVouchWeighted: number;
  reviewScore: number;
  bonusInvite: number;
  bonusRoleBadge: number;
  disputePenalty: number; // angka negatif, atau 0
  subtotalBeforePenalty: number;
}

export interface ScoreResult {
  address: Address;
  totalScore: number;
  breakdown: ScoreBreakdown;
  formulaVersion: string; // dinaikkan tiap bobot formula berubah
  computedAt: Date;
}
