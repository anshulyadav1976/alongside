const urgentPatterns = [
  /\bkill myself\b/i,
  /\bsuicide\b/i,
  /\bhurt myself\b/i,
  /\bgoing to hurt someone\b/i,
  /\bcan't stay safe\b/i,
  /\bdo not want to live\b/i,
];

export function safetyLevel(text: string) {
  return urgentPatterns.some((pattern) => pattern.test(text)) ? "urgent" as const : "normal" as const;
}

export function safetyResponse() {
  return "I’m really sorry this feels this intense. I can’t keep you safe by myself—please contact local emergency services or a trusted person who can be with you right now. If you’re in immediate danger, call your local emergency number now.";
}
