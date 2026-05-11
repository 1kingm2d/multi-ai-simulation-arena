/**
 * FILE: ai.ts
 * PURPOSE: Logic for OpenRouter API requests.
 */
import { CONFIG, getApiKeys } from "./config.ts";
import { Message } from "./db.ts";

export const AI = {
  async chat(modelEndpoint: string, messages: Message[], roleName: string, simTitle: string) {
    const keys = getApiKeys();
    if (keys.length === 0) throw new Error("No API Keys configured");
    
    // Pick a random key (basic load balancing)
    const apiKey = keys[Math.floor(Math.random() * keys.length)];

    const systemPrompt = `You are playing the role of ${roleName} in a simulation titled "${simTitle}". 
    Stay in character. Be concise but impactful. Do not break the fourth wall.`;

    const formattedMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content }))
    ];

    const response = await fetch(CONFIG.OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:8000",
        "X-Title": "Multi-AI Arena"
      },
      body: JSON.stringify({
        model: modelEndpoint,
        messages: formattedMessages,
        temperature: 0.8
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || "OpenRouter Error");
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }
};