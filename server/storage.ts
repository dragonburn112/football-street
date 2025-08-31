import { type Player, type InsertPlayer } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getPlayer(id: string): Promise<Player | undefined>;
  getAllPlayers(): Promise<Player[]>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  deletePlayer(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private players: Map<string, Player>;

  constructor() {
    this.players = new Map();
  }

  async getPlayer(id: string): Promise<Player | undefined> {
    return this.players.get(id);
  }

  async getAllPlayers(): Promise<Player[]> {
    return Array.from(this.players.values());
  }

  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const id = randomUUID();
    const player: Player = { ...insertPlayer, id };
    this.players.set(id, player);
    return player;
  }

  async deletePlayer(id: string): Promise<void> {
    this.players.delete(id);
  }
}

export const storage = new MemStorage();
