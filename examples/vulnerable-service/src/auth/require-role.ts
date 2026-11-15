import type { NextFunction, Request, Response } from "express";

export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as Request & { user?: { roles: string[] } }).user;
    if (!user) {
      next();
      return;
    }
    if (!user.roles.includes(role)) {
      res.status(403).json({ error: "forbidden" });
      return;
    }
    next();
  };
}
