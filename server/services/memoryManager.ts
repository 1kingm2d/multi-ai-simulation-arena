/**
 * FILE: server/services/memoryManager.ts
 * PURPOSE: Context preparation and token management
 */
import { Simulation, Message } from "../../types/index.ts";
import { DEFAULT_SETTINGS } from "../config.ts";
import { summarize } from "./summarizer.ts";

export const estimateTokens = (text: string) => Math.ceil(text.length / 4);

export async function prepareContext(simulation: Simulation): Promise<any[]> {
  const history = simulation.messages;
  const totalTokens = estimateTokens(history.map(m => m.content).join(""));

  if (totalTokens < DEFAULT_SETTINGS.summarizeThreshold) {
    return history.map(m => ({ role: m.role, content: m.content }));
  }

  const systemPrompt = history[0];
  const midPoint = Math.floor(history.length / 2);
  const toSummarize = history.slice(1, midPoint);
  const recent = history.slice(midPoint);

  const summary = await summarize(toSummarize);

  return [
    { role: systemPrompt.role, content: systemPrompt.content },
    { role: "system", content: `[CONVERSATION SUMMARY: ${summary}]` },
    ...recent.map(m => ({ role: m.role, content: m.content }))
  ];
}