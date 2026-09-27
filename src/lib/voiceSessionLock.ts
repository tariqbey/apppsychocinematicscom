/**
 * Only one live voice session may run in the app at a time (Ava, the Director AI
 * GPT-Live coach, or the Gemini coach). Claiming the voice stops whoever had it,
 * so the user never hears two voices at once.
 */

type Owner = { id: symbol; stop: () => void };

let owner: Owner | null = null;

export function claimVoice(id: symbol, stop: () => void): void {
  if (owner && owner.id !== id) {
    const previous = owner;
    owner = null;
    try {
      previous.stop();
    } catch (e) {
      console.warn("[voice] couldn't stop the previous session", e);
    }
  }
  owner = { id, stop };
}

export function releaseVoice(id: symbol): void {
  if (owner?.id === id) owner = null;
}
