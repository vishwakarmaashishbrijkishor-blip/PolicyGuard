import { Pool } from "pg";

// UI code talking to the database directly.
const pool = new Pool({ connectionString: process.env["DATABASE_URL"] });

export async function UserList() {
  const { rows } = await pool.query("SELECT id, name FROM users");
  return (
    <ul>
      {rows.map((row: { id: string; name: string }) => (
        <li key={row.id}>{row.name}</li>
      ))}
    </ul>
  );
}
