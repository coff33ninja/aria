import { z } from "zod";

export const msgSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
});

export const chatSchema = z.object({
  provider: z.enum(["openai", "anthropic"]),
  apiKey: z.string().min(1),
  model: z.string().optional(),
  system: z.string().min(1),
  prompt: z.string().min(1),
  history: z.array(msgSchema).max(10).optional(),
  stream: z.boolean().optional(),
});

export const backendSchema = z.object({
  backendUrl: z.string().url().min(1),
  model: z.string().optional(),
  system: z.string().min(1),
  prompt: z.string().min(1),
  history: z.array(msgSchema).max(10).optional(),
  stream: z.boolean().optional(),
});

export const backendPullDeleteSchema = z.object({
  backendUrl: z.string().url().min(1),
  model: z.string().min(1),
});

export const backendEmbeddingsSchema = z.object({
  backendUrl: z.string().url().min(1),
  model: z.string().optional(),
  prompt: z.string().min(1),
});

export const searchSchema = z.object({
  query: z.string().min(2),
});
