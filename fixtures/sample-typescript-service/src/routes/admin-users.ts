import { Router } from "express";
import { requireRole } from "../auth/require-role";
import { listUsers } from "../services/user-service";

export const adminUsersRouter = Router();

adminUsersRouter.get("/admin/users", requireRole("admin"), async (_req, res) => {
  res.json(await listUsers());
});
