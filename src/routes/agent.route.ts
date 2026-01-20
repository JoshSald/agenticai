import { Router } from "express";
import { validate } from "../middlewares/validate";
import { guardrail } from "../middlewares/guardrail";
import { agentRequestSchema } from "../schemas/agent.schema";
import { orchestratorAgent } from "../agents/orchestrator.agent";

const router = Router();

router.post(
  "/agent",
  validate(agentRequestSchema),
  guardrail,
  async (req, res, next) => {
    try {
      const result = await orchestratorAgent(req.body.prompt, req.body.context);
      res.status(200).json({
        recommendations: result?.recommendations ?? "",
        matches: Array.isArray(result?.matches) ? result.matches : [],
      });

      console.log(
        "API RESPONSE:",
        JSON.stringify(
          {
            recommendations: result?.recommendations ?? "",
            matches: Array.isArray(result?.matches) ? result.matches : [],
          },
          null,
          2,
        ),
      );
    } catch (err) {
      next(err);
    }
  },
);

export default router;
