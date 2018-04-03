const REGEXP_SPECIAL_CHARACTERS = [
  ".",
  "\\",
  "[",
  "]",
  "|",
  "^",
  "$",
  "(",
  ")",
  "*",
  "+",
  "?",
  "{",
  "}",
];
const REGEXP_FLAGS = "i";

export default function parseGlobList(patterns) {
  const regexps = [];
  const globs = [];

  for (const pattern of patterns) {
    if (pattern.startsWith("/") && pattern.endsWith("/")) {
      const src = pattern.slice(1, -1);

      // syntax test
      new RegExp(src, REGEXP_FLAGS);

      regexps.push(src);
    } else {
      let src = "";
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
      globs.push(src);
    }
  }

  if (globs.length > 0) {
    regexps.unshift(`^(?:${globs.join("|")})$`);
  }
  let source;
  if (regexps.length > 0) {
    source = regexps.join("|");
  } else {
    source = "(?!)";
  }
  return new RegExp(source, REGEXP_FLAGS);
}
