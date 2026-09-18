export const THRESHOLDS = {
  formulaVersion: "1.0.0",

  chain: {
    // Confirmation depth indexer — jangan proses blok paling ujung untuk menghindari reorg
    confirmations: 3,
  },

  explorer: {
    // Sumber indexed (Blockscout) untuk riwayat per-address. RPC-only tidak bisa (Spec 01).
    // TTL cache read-through; setelah lewat, refetch dari explorer.
    cacheTtlHours: 24,
    // Batas halaman walk pagination (Blockscout v2 default 50/halaman) —
    // cegah query tak terbatas untuk wallet sangat aktif.
    maxPages: 40,
    // Timeout per request ke explorer (ms).
    requestTimeoutMs: 10000,
  },

  trustGraph: {
    // Definisi deterministik "repeat relationship" (Spec 04): >= 2 interaksi langsung.
    repeatInteractionMin: 2,
    // Batas halaman walk tx list untuk derivasi counterparty (selaras explorer.maxPages).
    maxCounterpartyPages: 40,
    // TTL cache read-through relationship.
    cacheTtlHours: 24,
  },

  proof: {
    // Model confidence Spec 02: nilai statis per verification_method (bukan dituning per-proof).
    // indexed  = diambil langsung dari sumber indexed apa adanya.
    // derived  = dihitung/diturunkan dari data indexed.
    confidenceByMethod: {
      indexed: 1.0,
      derived: 0.7,
    },
  },

  baseline: {
    max: 100,
    // TBD — indikator & bobot baseline on-chain belum diputuskan (PRD §10.2)
    walletAgeMaxPoints: 50,
    walletAgeFullAtDays: 365,
    txCountMaxPoints: 50,
    txCountFullAt: 100,
  },

  vouch: {
    max: 400,
    // Vouch ke-n dari wallet yang sama ke target yang sama:
    // bobot = stake * decayFactor^(n-1)
    decayFactor: 0.5,
    // Konversi stake (wei) ke poin skor — TBD, bergantung tokenomics (PRD §10.3)
    pointsPerToken: 1,
    // Cooldown penarikan stake (hari) — TBD, tuning Fase 13.
    // Stake yang sedang terlibat dispute dikunci sementara (Disputed/Slashed tidak bisa withdraw).
    withdrawCooldownDays: 30,
  },

  review: {
    max: 100,
    multiplier: 20, // rata_rata_rating (1-5) * 20
  },

  invite: {
    bonus: 50,
    // Dampak negatif ke inviter kalau yang diundang kena dispute — TBD (Fase 6)
    inviterPenaltyOnInviteeDispute: 25,
  },

  badge: {
    bonusPerBadge: 50,
    maxCountedBadges: 2,
    // TBD — skor minimum untuk bisa memberi attestation (PRD §10.1)
    minScoreToAttest: 200,
    // TBD — jumlah attestation dari wallet berbeda untuk jadi terverifikasi
    minAttestationsToVerify: 3,
  },

  dispute: {
    // Penalti = subtotal * penaltyRatio, dipotong selama dispute open
    penaltyRatio: 0.5,
    // TBD — jumlah report dari wallet berbeda yang memicu freeze (PRD §10.1)
    minReportsToFreeze: 3,
    // TBD — skor minimum agar sebuah wallet boleh mengajukan report
    minScoreToReport: 300,
  },

  gatedAccess: {
    // TBD — skor minimum untuk membuka konten ter-gate (PRD §10.1)
    minScore: 400,
  },
} as const;
