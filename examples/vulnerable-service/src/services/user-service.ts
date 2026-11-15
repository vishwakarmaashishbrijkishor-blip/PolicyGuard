import { db } from "../db/client";

// Breaking change: the required `email` property was removed from the exported User type.
export interface User {
  id: string;
  name: string;
}

export async function listUsers(): Promise<User[]> {
  const result = await db.query<User>("SELECT id, name FROM users");
  return result.rows;
}

export async function createUser(input: User): Promise<User> {
  await db.query("INSERT INTO users (id, name) VALUES ($1, $2)", [input.id, input.name]);
  return input;
}
