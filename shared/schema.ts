import { z } from "zod";

// Firebase-based schemas (no longer using Drizzle for storage)
export const playerCardSchema = z.object({
  id: z.string(), // This will be the user's UID
  uid: z.string(), // User ID who owns this card
  name: z.string().min(1, "Player name is required"),
  profilePic: z.string().optional(), // URL or emoji for profile picture
  pace: z.number().min(1).max(99),
  shooting: z.number().min(1).max(99),
  passing: z.number().min(1).max(99),
  dribbling: z.number().min(1).max(99),
  defense: z.number().min(1).max(99),
  physical: z.number().min(1).max(99),
  overall: z.number().min(1).max(99),
  createdAt: z.any(), // Firebase Timestamp
  updatedAt: z.any(), // Firebase Timestamp
});

export const createPlayerCardSchema = playerCardSchema.omit({
  id: true,
  uid: true,
  createdAt: true,
  updatedAt: true,
});

// Schema for unassigned player cards (cards created by admins but not assigned to members yet)
export const unassignedPlayerCardSchema = z.object({
  id: z.string(), // Unique ID for the unassigned card
  name: z.string().min(1, "Player name is required"),
  profilePic: z.string().optional(), // URL or emoji for profile picture
  pace: z.number().min(1).max(99),
  shooting: z.number().min(1).max(99),
  passing: z.number().min(1).max(99),
  dribbling: z.number().min(1).max(99),
  defense: z.number().min(1).max(99),
  physical: z.number().min(1).max(99),
  overall: z.number().min(1).max(99),
  createdBy: z.string(), // UID of admin who created this card
  createdAt: z.any(), // Firebase Timestamp
});

export const createUnassignedPlayerCardSchema = unassignedPlayerCardSchema.omit({
  id: true,
  createdBy: true,
  createdAt: true,
});

// Schema for player form that works with both assigned and unassigned cards
export const playerFormSchema = z.object({
  name: z.string().min(1, "Player name is required"),
  profilePic: z.string().optional(),
  pace: z.number().min(1).max(99),
  shooting: z.number().min(1).max(99),
  passing: z.number().min(1).max(99),
  dribbling: z.number().min(1).max(99),
  defense: z.number().min(1).max(99),
  physical: z.number().min(1).max(99),
  overall: z.number().min(1).max(99),
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
    isAdmin: z.boolean().default(false),
    joinedAt: z.any(), // Firebase Timestamp
  })),
});

export const createGroupSchema = z.object({
  name: z.string().min(1, "Group name is required"),
});

export const joinGroupSchema = z.object({
  code: z.string().length(6, "Group code must be 6 characters"),
});

export const matchSchema = z.object({
  id: z.string(),
  createdBy: z.string(),
  name: z.string().min(1, "Match name is required"),
  numberOfTeams: z.number().min(2).max(3),
  playersPerTeam: z.number().min(3).max(11),
  selectedPlayerIds: z.array(z.string()), // UIDs of selected players
  teams: z.array(z.object({
    name: z.string(),
    players: z.array(z.string()), // player UIDs
    totalStats: z.object({
      pace: z.number(),
      shooting: z.number(),
      passing: z.number(),
      dribbling: z.number(),
      defense: z.number(),
      physical: z.number(),
      overall: z.number(),
    }),
  })),
  status: z.enum(["draft", "active", "completed"]).default("draft"),
  createdAt: z.any(), // Firebase Timestamp
  updatedAt: z.any(), // Firebase Timestamp
});

export const createMatchSchema = matchSchema.omit({
  id: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
  teams: true,
  status: true,
});

export type PlayerCard = z.infer<typeof playerCardSchema>;
export type CreatePlayerCard = z.infer<typeof createPlayerCardSchema>;
export type UnassignedPlayerCard = z.infer<typeof unassignedPlayerCardSchema>;
export type CreateUnassignedPlayerCard = z.infer<typeof createUnassignedPlayerCardSchema>;
export type PlayerFormData = z.infer<typeof playerFormSchema>;
export type Group = z.infer<typeof groupSchema>;
export type CreateGroup = z.infer<typeof createGroupSchema>;
export type JoinGroup = z.infer<typeof joinGroupSchema>;
export type Match = z.infer<typeof matchSchema>;
export type CreateMatch = z.infer<typeof createMatchSchema>;

// Legacy types for compatibility (will be removed)
export type Player = PlayerCard;
export type InsertPlayer = CreatePlayerCard;
