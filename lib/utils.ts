export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export type TabooValidationResult = {
  sanitizedPrompt: string;
  forbiddenWordsUsed: string[];
};

export function validateTabooWords(
  prompt: string,
  tabooWords: string[]
): TabooValidationResult {
  const forbiddenWordsUsed: string[] = [];
  let sanitizedPrompt = prompt;

  for (const taboo of tabooWords) {
    const regex = new RegExp(escapeRegex(taboo), "gi");
    if (regex.test(prompt)) {
      forbiddenWordsUsed.push(taboo);
      sanitizedPrompt = sanitizedPrompt.replace(regex, "___");
    }
  }

  return { sanitizedPrompt, forbiddenWordsUsed };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
