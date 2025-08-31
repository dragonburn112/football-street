import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const players = pgTable("players", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  position: text("position").notNull(),
  pace: integer("pace").notNull(),
  shooting: integer("shooting").notNull(),
  passing: integer("passing").notNull(),
  dribbling: integer("dribbling").notNull(),
  defense: integer("defense").notNull(),
  physical: integer("physical").notNull(),
  overall: integer("overall").notNull(),
  isFusion: integer("is_fusion").notNull().default(0), // 0 = false, 1 = true
});

export const insertPlayerSchema = createInsertSchema(players).pick({
  name: true,
  position: true,
  pace: true,
  shooting: true,
  passing: true,
  dribbling: true,
  defense: true,
  physical: true,
  overall: true,
  isFusion: true,
}).extend({
  pace: z.number().min(1).max(99),
  shooting: z.number().min(1).max(99),
  passing: z.number().min(1).max(99),
  dribbling: z.number().min(1).max(99),
  defense: z.number().min(1).max(99),
  physical: z.number().min(1).max(99),
});

export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof players.$inferSelect;
