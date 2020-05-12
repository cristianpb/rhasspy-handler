export interface Slot {
  slotName: string; //"hour"
  confidence: number; //1
  value: {
    kind: string; // "hour"
    value: string; // 7
  }
  rawValue: string // "siete"
}

export interface Intent {
  sessionId: string; // ""
  siteId: string; // "default"
  input: string; // "una alarma a las 7 y 6"
  intent: {
    intentName: string; // "setWakeUpAlarm"
    confidenceScore: number; // 1
  }
  slots: Slot[];
  asrTokens: [];
  asrConfidence: number; // 1
}

