export type OpenAIStreamDelta = {
  choices?: Array<{ delta?: { content?: string } }>;
};

export async function readOpenAITextStream({
  response,
  onDelta,
}: {
  response: Response;
  onDelta: (deltaText: string) => void;
}) {
  if (!response.body) throw new Error("No response body");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let textBuffer = "";
  let streamDone = false;

  const handleLine = (rawLine: string): { done: boolean; partial: boolean } => {
    let line = rawLine;
    if (line.endsWith("\r")) line = line.slice(0, -1); // CRLF

    if (line.startsWith(":")) return { done: false, partial: false }; // SSE keepalive/comment
    if (line.trim() === "") return { done: false, partial: false };
    if (!line.startsWith("data: ")) return { done: false, partial: false };

    const jsonStr = line.slice(6).trim();
    if (jsonStr === "[DONE]") return { done: true, partial: false };

    try {
      const parsed = JSON.parse(jsonStr) as OpenAIStreamDelta;
      const content = parsed.choices?.[0]?.delta?.content;
      if (typeof content === "string" && content) onDelta(content);
      return { done: false, partial: false };
    } catch {
      // Most commonly: JSON split across chunks. Re-buffer and wait for more.
      return { done: false, partial: true };
    }
  };

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;

    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
      const line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);

      const { done: lineDone, partial } = handleLine(line);
      if (partial) {
        textBuffer = line + "\n" + textBuffer;
        break;
      }
      if (lineDone) {
        streamDone = true;
        break;
      }
    }
  }

  // Final flush in case the stream ended without a trailing newline.
  if (textBuffer.trim()) {
    for (const rawLine of textBuffer.split("\n")) {
      const { done } = handleLine(rawLine);
      if (done) break;
    }
  }
}
