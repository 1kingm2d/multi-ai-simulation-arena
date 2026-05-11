/**
 * FILE: server/services/summarizer.ts
 * PURPOSE: Conversation summarization
 */
import { Message } from "../../types/index.ts";
import { callModel } from "./openRouter.ts";
import { DEFAULT_SETTINGS } from "../config.ts";

export async function summarize(messages: Message[]): Promise<string> {
  const text = messages.map(m => `${m.role}: ${m.content}`).join("\n");
  const prompt = [
    { role: "system", content: "Summarize this conversation segment concisely, preserving key plot developments and character dynamics. [cite: 102]" },
    { role: "user", content: text }
  ];

  try {
    const res = await callModel(DEFAULT_SETTINGS.summaryModel, prompt);
    return res.choices[0].message.content;
  } catch {
    return "The conversation continues from previous interactions.";
  }
}