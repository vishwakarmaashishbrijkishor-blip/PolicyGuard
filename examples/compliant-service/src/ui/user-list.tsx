import { listUsers } from "../services/user-service";

// UI code depends on the service layer, never on the database client.
export async function UserList() {
  const users = await listUsers();
  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
