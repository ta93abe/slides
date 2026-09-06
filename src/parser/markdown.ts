import rehypeShiki from "@shikijs/rehype";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";
import { visit } from "unist-util-visit";

type ImageNode = {
  type: "image";
  url: string;
};

function rewriteRelativeImages(slug: string) {
  return () => (tree: unknown) => {
    visit(tree as never, "image", (node: ImageNode) => {
      if (!node.url || /^(https?:|data:|\/)/i.test(node.url)) {
        return;
      }
      const cleaned = node.url.replace(/^\.\//, "");
      node.url = cleaned.startsWith(`${slug}/`)
        ? `/media/${cleaned}`
        : `/media/${slug}/${cleaned}`;
    });
  };
}

export async function markdownToHtml(
  markdown: string,
  slug: string,
): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(rewriteRelativeImages(slug))
    .use(remarkRehype, { allowDangerousHtml: false })
    .use(rehypeShiki, {
      theme: "min-dark",
    })
    .use(rehypeStringify)
    .process(markdown);

  return String(file).trim();
}
