// Safety net: strip any markdown the model slips in so saved kit text is always
// clean, readable plain text. Bullets are normalized to "- ".
export function cleanText(input: string): string {
  return input
    .replace(/\r\n/g, "\n")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "") // headings: "## Foo" -> "Foo"
    .replace(/\*\*(.+?)\*\*/g, "$1") // bold **x**
    .replace(/__(.+?)__/g, "$1") // bold __x__
    .replace(/`{1,3}([^`]+)`{1,3}/g, "$1") // inline/code `x`
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links [text](url) -> text
    .replace(/^\s{0,3}[-*•]\s+/gm, "- ") // normalize list bullets to "- "
    .replace(/^\s{0,3}>\s?/gm, "") // blockquotes
    .replace(/^\s{0,3}([-*_]){3,}\s*$/gm, "") // horizontal rules ---
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1$2") // italic *x* -> x
    .replace(/[ \t]+\n/g, "\n") // trailing spaces
    .replace(/\n{3,}/g, "\n\n") // cap blank lines
    .trim();
}
