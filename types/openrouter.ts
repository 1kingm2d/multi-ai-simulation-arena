/**
 * FILE: types/openrouter.ts
 * PURPOSE: Interfaces for OpenRouter API requests and responses
 */

export interface OpenRouterRequest {
  model: string;
  messages: { role: string; content: string }[];
  temperature?: number;
  max_tokens?: number;
}

export interface OpenRouterChoice {
  message: {
    role: string;
    content: string;
  };
}

export interface OpenRouterResponse {
  choices: OpenRouterChoice[];
  usage: {
    total_tokens: number;
  };
}

export interface OpenRouterErrorResponse {
  error: {
    message: string;
    code: number;
  };
}