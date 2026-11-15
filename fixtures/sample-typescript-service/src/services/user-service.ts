import { db } from "../db/client";

export interface User {
  id: string;
  email: string;
  name: string;
}

export async function listUsers(): Promise<User[]> {
  const result = await db.query<User>("SELECT id, email, name FROM users");
  return result.rows;
}
