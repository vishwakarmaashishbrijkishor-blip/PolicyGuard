import express from "express";
import { adminUsersRouter } from "./routes/admin-users";
import { healthRouter } from "./routes/public-health";

export const app = express();
app.use(express.json());
app.use(healthRouter);
app.use(adminUsersRouter);
