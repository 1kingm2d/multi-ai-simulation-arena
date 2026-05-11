/**
 * FILE: server/services/voiceConfig.ts
 * PURPOSE: Default voice presets per model
 */
import { VoiceSettings } from "../../types/index.ts";

const DEFAULTS: Record<string, VoiceSettings> = {
  "grok":    { pitch: 0.8,  rate: 0.85, volume: 1.0, voiceName: null },
  "gpt4o":   { pitch: 1.1,  rate: 1.0,  volume: 1.0, voiceName: null },
  "claude":  { pitch: 1.0,  rate: 0.9,  volume: 0.9, voiceName: null },
  "gemini":  { pitch: 1.3,  rate: 1.2,  volume: 1.0, voiceName: null },
  "deepseek":{ pitch: 0.95, rate: 1.0,  volume: 1.0, voiceName: null },
  "qwen":    { pitch: 1.2,  rate: 1.15, volume: 1.0, voiceName: null }
};

export const getDefaultVoiceConfig = (modelId: string): VoiceSettings => 
  DEFAULTS[modelId] || { pitch: 1.0, rate: 1.0, volume: 1.0, voiceName: null };