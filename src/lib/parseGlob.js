const REGEXP_SPECIAL_CHARACTERS = [".", "\\", "[", "]", "|", "^", "$", "(", ")", "*", "+", "?", "{", "}"];

export default function parseGlob(pattern) {
  if (pattern.startsWith("/") && pattern.endsWith("/")) {
    return new RegExp(pattern.slice(1, -1), "i");
  } else {
    let src = "^";
    for (const s of pattern) {
      if (s === "*") {
        src += ".*";
      } else if (REGEXP_SPECIAL_CHARACTERS.includes(s)) {
        src += "\\";
        src += s;
      } else {
        src += s;
      }
    }
    src += "$";
    
    return new RegExp(src, "i");
  }
}
