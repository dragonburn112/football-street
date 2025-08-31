import { z } from "zod";

// Firebase-based schemas (no longer using Drizzle for storage)
export const playerCardSchema = z.object({
  id: z.string(),
  groupId: z.string(),
  createdBy: z.string(),
  name: z.string().min(1, "Player name is required"),
  position: z.string().min(1, "Position is required"),
  pace: z.number().min(1).max(99),
  shooting: z.number().min(1).max(99),
  passing: z.number().min(1).max(99),
  dribbling: z.number().min(1).max(99),
  defense: z.number().min(1).max(99),
  physical: z.number().min(1).max(99),
  overall: z.number().min(1).max(99),
  isFusion: z.boolean(),
  createdAt: z.any(), // Firebase Timestamp
});

export const createPlayerCardSchema = playerCardSchema.omit({
  id: true,
  groupId: true,
  createdBy: true,
  createdAt: true,
});

export const groupSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  createdBy: z.string(),
  createdAt: z.any(), // Firebase Timestamp
  members: z.array(z.object({
    uid: z.string(),
    displayName: z.string(),
    joinedAt: z.any(), // Firebase Timestamp
  })),
});

export const createGroupSchema = z.object({
  name: z.string().min(1, "Group name is required"),
});

export const joinGroupSchema = z.object({
  code: z.string().length(6, "Group code must be 6 characters"),
});

export type PlayerCard = z.infer<typeof playerCardSchema>;
export type CreatePlayerCard = z.infer<typeof createPlayerCardSchema>;
export type Group = z.infer<typeof groupSchema>;
export type CreateGroup = z.infer<typeof createGroupSchema>;
export type JoinGroup = z.infer<typeof joinGroupSchema>;

// Legacy types for compatibility (will be removed)
export type Player = PlayerCard;
export type InsertPlayer = CreatePlayerCard;
