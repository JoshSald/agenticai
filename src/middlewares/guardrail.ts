import { Request, Response, NextFunction } from "express";

const bannedPatterns = [/kill/i, /hack/i, /terror/i];

export const guardrail = (req: Request, res: Response, next: NextFunction) => {
  const { prompt } = req.body;

  if (bannedPatterns.some((pattern) => pattern.test(prompt))) {
    return res.status(400).json({
      error: "Prompt contains disallowed content",
    });
  }

  next();
};
