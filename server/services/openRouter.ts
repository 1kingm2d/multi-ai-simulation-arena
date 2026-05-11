/**
 * FILE: server/services/openRouter.ts
 * PURPOSE: OpenRouter API communication with key rotation and retry logic.
 */
import { CONFIG } from "../config.ts";

export class AllKeysExhaustedError extends Error {
  constructor() {
    super("All API keys are currently rate-limited or unavailable. Please wait 30-60 seconds.");
    this.name = "AllKeysExhaustedError";
  }
}

let currentKeyIndex = 0;

export async function callModel(modelEndpoint: string, messages: any[]) {
  const rawKeys = Deno.env.get("OPENROUTER_API_KEYS");
  const keys: string[] = rawKeys ? JSON.parse(rawKeys) : [];
  
  if (keys.length === 0) throw new Error("No API keys found in environment.");

  for (let attempt = 0; attempt < keys.length; attempt++) {
    const keyIndex = (currentKeyIndex + attempt) % keys.length;
    const apiKey = keys[keyIndex];

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelEndpoint,
          messages: messages,
          temperature: 0.8
        }),
        signal: AbortSignal.timeout(30000) // 30s timeout [cite: 116]
      });

      if (response.ok) {
        currentKeyIndex = keyIndex; // Stick with this key for next time
        const data = await response.json();
        return data.choices[0].message.content;
      }

      if (response.status === 429) {
        console.warn(`Key #${keyIndex} rate limited. Rotating...`);
        const wait = Math.min(200 * Math.pow(2, attempt), 2000);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }
    } catch (err) {
      console.error(`Key #${keyIndex} failed: ${err.message}`);
    }
  }

  throw new AllKeysExhaustedError();
}