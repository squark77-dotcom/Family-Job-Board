import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull().default("parent"),
  familyId: uuid("family_id"),
  avatar: text("avatar"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const familiesTable = pgTable("families", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  parentUserId: uuid("parent_user_id").notNull(),
  joinCode: text("join_code").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const childrenTable = pgTable(
  "children",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => familiesTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id").unique(),
    name: text("name").notNull(),
    avatar: text("avatar"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("children_family_idx").on(table.familyId)],
);

export const jobsTable = pgTable(
  "jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => familiesTable.id, { onDelete: "cascade" }),
    createdByUserId: uuid("created_by_user_id").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    points: integer("points").notNull(),
    type: text("type").notNull(),
    assignedChildId: uuid("assigned_child_id").references(() => childrenTable.id),
    claimedByChildId: uuid("claimed_by_child_id").references(() => childrenTable.id),
    status: text("status").notNull().default("to_do"),
    dueDate: timestamp("due_date", { withTimezone: true }),
    estimatedMinutes: integer("estimated_minutes"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("jobs_family_idx").on(table.familyId),
    index("jobs_status_idx").on(table.status),
  ],
);

export const submissionsTable = pgTable(
  "job_submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobsTable.id, { onDelete: "cascade" }),
    childId: uuid("child_id")
      .notNull()
      .references(() => childrenTable.id),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
    status: text("status").notNull().default("ready_for_review"),
    parentResponse: text("parent_response"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewedBy: uuid("reviewed_by"),
    reviewAction: text("review_action"),
  },
  (table) => [index("submissions_job_idx").on(table.jobId)],
);

export const pointsTransactionsTable = pgTable(
  "points_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => familiesTable.id, { onDelete: "cascade" }),
    childId: uuid("child_id")
      .notNull()
      .references(() => childrenTable.id),
    points: integer("points").notNull(),
    type: text("type").notNull(),
    jobId: uuid("job_id").references(() => jobsTable.id),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("points_family_idx").on(table.familyId),
    uniqueIndex("points_job_unique").on(table.jobId),
  ],
);

export const jobEventsTable = pgTable(
  "job_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobsTable.id, { onDelete: "cascade" }),
    actorUserId: uuid("actor_user_id").notNull(),
    eventType: text("event_type").notNull(),
    fromStatus: text("from_status"),
    toStatus: text("to_status"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("job_events_job_idx").on(table.jobId)],
);

export const insertUserSchema = createInsertSchema(usersTable);
export const insertFamilySchema = createInsertSchema(familiesTable);
export const insertChildSchema = createInsertSchema(childrenTable);
export const insertJobSchema = createInsertSchema(jobsTable);
export const insertSubmissionSchema = createInsertSchema(submissionsTable);
export const insertPointsTransactionSchema = createInsertSchema(pointsTransactionsTable);

export type UserRecord = typeof usersTable.$inferSelect;
export type FamilyRecord = typeof familiesTable.$inferSelect;
export type ChildRecord = typeof childrenTable.$inferSelect;
export type JobRecord = typeof jobsTable.$inferSelect;
export type SubmissionRecord = typeof submissionsTable.$inferSelect;
export type PointTransactionRecord = typeof pointsTransactionsTable.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;