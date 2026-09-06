export function splitSlides(body: string): string[] {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const chunks: string[] = [];
  let buffer: string[] = [];
  let fenceChar: "`" | "~" | null = null;
  let fenceLen = 0;

  const flush = () => {
    const text = buffer.join("\n").trim();
    if (text.length > 0) {
      chunks.push(text);
    }
    buffer = [];
  };

  for (const line of lines) {
    if (!fenceChar) {
      const open = line.match(/^(`{3,}|~{3,})/);
      if (open) {
        fenceChar = open[1][0] as "`" | "~";
        fenceLen = open[1].length;
        buffer.push(line);
        continue;
      }
      if (/^-{3,}\s*$/.test(line)) {
        flush();
        continue;
      }
      buffer.push(line);
      continue;
    }

    buffer.push(line);
    const close = line.match(/^(`{3,}|~{3,})\s*$/);
    if (
      close &&
      close[1][0] === fenceChar &&
      close[1].length >= fenceLen
    ) {
      fenceChar = null;
      fenceLen = 0;
    }
  }

  flush();
  return chunks;
}
