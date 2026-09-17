import {
  bigint,
  bigserial,
  char,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type { ScoreBreakdown } from "@/lib/score/types";

/**
 * Representasi kode dari SQL di Spec 00 §2.
 * Jika berbeda dengan spec, SQL di spec yang menang dan file ini yang diperbaiki.
 */

const timestamptz = (name: string) =>
  timestamp(name, { withTimezone: true, mode: "date" });

export const wallets = pgTable(
  "wallets",
  {
    address: char("address", { length: 42 }).primaryKey(),
    alias: varchar("alias", { length: 32 }),
    invitedBy: char("invited_by", { length: 42 }).references(
      (): AnyPgColumn => wallets.address,
    ),
    firstSeenAt: timestamptz("first_seen_at").notNull().defaultNow(),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    updatedAt: timestamptz("updated_at").notNull().defaultNow(),
  },
  (t) => [index("idx_wallets_invited_by").on(t.invitedBy)],
);

export const walletOnchainStats = pgTable("wallet_onchain_stats", {
  address: char("address", { length: 42 })
    .primaryKey()
    .references(() => wallets.address),
  // NULL di MVP — first_tx_at bukan dependency sampai historical source ditentukan
  firstTxAt: timestamptz("first_tx_at"),
  txCount: integer("tx_count").notNull().default(0),
  fetchedAt: timestamptz("fetched_at").notNull().defaultNow(),
});

export const vouches = pgTable(
  "vouches",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    chainId: integer("chain_id").notNull(),
    txHash: char("tx_hash", { length: 66 }).notNull(),
    logIndex: integer("log_index").notNull(),
    blockNumber: bigint("block_number", { mode: "number" }).notNull(),
    fromAddress: char("from_address", { length: 42 })
      .notNull()
      .references(() => wallets.address),
    toAddress: char("to_address", { length: 42 })
      .notNull()
      .references(() => wallets.address),
    stakeAmount: numeric("stake_amount", { precision: 78, scale: 0 }).notNull(),
    status: varchar("status", { length: 16 }).notNull().default("active"),
    createdAt: timestamptz("created_at").notNull(),
  },
  (t) => [
    // Identitas event minimal chain_id + tx_hash + log_index — indexer idempoten
    unique("vouches_tx_identity").on(t.chainId, t.txHash, t.logIndex),
    index("idx_vouches_to").on(t.toAddress, t.status),
    index("idx_vouches_pair").on(t.fromAddress, t.toAddress, t.createdAt),
  ],
);

export const reviews = pgTable(
  "reviews",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    fromAddress: char("from_address", { length: 42 })
      .notNull()
      .references(() => wallets.address),
    toAddress: char("to_address", { length: 42 })
      .notNull()
      .references(() => wallets.address),
    rating: smallint("rating").notNull(),
    comment: text("comment"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (t) => [
    // Satu wallet hanya satu review per target — cegah spam rating
    unique("reviews_pair").on(t.fromAddress, t.toAddress),
    check("reviews_rating_range", sql`${t.rating} BETWEEN 1 AND 5`),
    index("idx_reviews_to").on(t.toAddress),
  ],
);

export const disputes = pgTable(
  "disputes",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    targetAddress: char("target_address", { length: 42 })
      .notNull()
      .references(() => wallets.address),
    status: varchar("status", { length: 16 }).notNull().default("open"),
    openedAt: timestamptz("opened_at").notNull().defaultNow(),
    resolvedAt: timestamptz("resolved_at"),
    resolutionNote: text("resolution_note"),
  },
  (t) => [index("idx_disputes_target").on(t.targetAddress, t.status)],
);

export const disputeReports = pgTable(
  "dispute_reports",
  {
    disputeId: bigint("dispute_id", { mode: "number" })
      .notNull()
      .references(() => disputes.id),
    reporterAddress: char("reporter_address", { length: 42 })
      .notNull()
      .references(() => wallets.address),
    reason: text("reason"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.disputeId, t.reporterAddress] })],
);

export const roleBadges = pgTable(
  "role_badges",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    address: char("address", { length: 42 })
      .notNull()
      .references(() => wallets.address),
    role: varchar("role", { length: 32 }).notNull(),
    status: varchar("status", { length: 16 }).notNull().default("unverified"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (t) => [unique("role_badges_address_role").on(t.address, t.role)],
);

export const badgeAttestations = pgTable(
  "badge_attestations",
  {
    badgeId: bigint("badge_id", { mode: "number" })
      .notNull()
      .references(() => roleBadges.id),
    attesterAddress: char("attester_address", { length: 42 })
      .notNull()
      .references(() => wallets.address),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.badgeId, t.attesterAddress] })],
);

export const scoreSnapshots = pgTable(
  "score_snapshots",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    address: char("address", { length: 42 })
      .notNull()
      .references(() => wallets.address),
    totalScore: integer("total_score").notNull(),
    breakdown: jsonb("breakdown").$type<ScoreBreakdown>().notNull(),
    triggerEvent: varchar("trigger_event", { length: 32 }).notNull(),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (t) => [index("idx_snapshots_address_time").on(t.address, t.createdAt)],
);

export const indexerState = pgTable(
  "indexer_state",
  {
    contractName: varchar("contract_name", { length: 64 }).notNull(),
    chainId: integer("chain_id").notNull(),
    lastBlock: bigint("last_block", { mode: "number" }).notNull().default(0),
    updatedAt: timestamptz("updated_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.contractName, t.chainId] })],
);
