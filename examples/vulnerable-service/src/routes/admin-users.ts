import { Router } from "express";
import { requireRole } from "../auth/require-role";
import { createUser, listUsers } from "../services/user-service";

export const adminUsersRouter = Router();

adminUsersRouter.get("/admin/users", requireRole("admin"), async (_req, res) => {
  res.json(await listUsers());
});

adminUsersRouter.post("/admin/users", async (req, res) => {
  const created = await createUser(req.body);
  res.status(201).json(created);
});
