export interface Slot {
  slotName: string;
  confidence: number;
  value: {
    kind: string;
    value: string;
  }
  rawValue: string
}

export interface Intent {
  sessionId: string;
  siteId: string;
  input: string;
  intent: {
    intentName: string;
    confidenceScore: number;
  }
  slots: Slot[];
  asrTokens: [];
  asrConfidence: number;
}

