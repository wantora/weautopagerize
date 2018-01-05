export default function parseHTMLDocument(text) {
  const parser = new DOMParser();
  return parser.parseFromString(text, "text/html");
}
