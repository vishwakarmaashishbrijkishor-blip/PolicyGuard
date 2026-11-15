import { db } from "../db/client";

export interface User {
  id: string;
  email: string;
  name: string;
  nickname?: string;
}

export async function listUsers(): Promise<User[]> {
  const result = await db.query<User>("SELECT id, email, name, nickname FROM users");
  return result.rows;
}

export async function createUser(input: User): Promise<User> {
  await db.query("INSERT INTO users (id, email, name) VALUES ($1, $2, $3)", [
    input.id,
    input.email,
    input.name,
  ]);
  return input;
}
