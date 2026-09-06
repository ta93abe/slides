function stripFences(markdown: string): string {
  return markdown.replace(/^(```+|~~~+)[^\n]*\n[\s\S]*?^\1\s*$/gm, "");
}

export function findForbidden(markdown: string): string[] {
  const exposed = stripFences(markdown);
  const errors: string[] = [];

  if (/^import\s/m.test(exposed) || /^export\s/m.test(exposed)) {
    errors.push("MDX の import / export は禁止です");
  }
  if (/<[A-Z][A-Za-z0-9]*(\s|\/?>)/.test(exposed)) {
    errors.push("JSX コンポーネントは禁止です");
  }
  if (/<style[\s>]/i.test(exposed)) {
    errors.push("デッキ内の style 要素は禁止です");
  }
  if (/\sstyle\s*=/i.test(exposed)) {
    errors.push("style 属性は禁止です");
  }
  if (/<script[\s>]/i.test(exposed)) {
    errors.push("script 要素は禁止です");
  }

  return errors;
}
