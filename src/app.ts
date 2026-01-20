import express from "express";
import agentRoutes from "./routes/agent.route";
import { errorHandler } from "./middlewares/errorHandler";

export const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(agentRoutes);

app.use(errorHandler);
