import { Router } from "express";

export const healthRouter = Router();

// policyguard: public-route reason="health check for load balancers"
healthRouter.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});
