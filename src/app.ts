import express from "express";
import cors from "cors";
import agentRoutes from "./routes/agent.route";
import { errorHandler } from "./middlewares/errorHandler";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(agentRoutes);

app.use(errorHandler);
