import { Router } from "express";
import { validate } from "../middlewares/validate";
import { guardrail } from "../middlewares/guardrail";
import { agentRequestSchema } from "../schemas/agent.schema";

const router = Router();

router.post("/agent", validate(agentRequestSchema), guardrail, (req, res) => {
  res.json({
    message: "Agent pipeline reached successfully",
    prompt: req.body.prompt,
  });
});

export default router;
