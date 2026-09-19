import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.url().optional(),
  AI_PROVIDER: z.enum(["anthropic", "ollama", "demo"]).optional(),
});

export const env = schema.parse({
  DATABASE_URL: process.env.DATABASE_URL || undefined,
  AI_PROVIDER: process.env.AI_PROVIDER || undefined,
});
