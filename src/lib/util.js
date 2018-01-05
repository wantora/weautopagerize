
export function checkOrigin(url) {
  return (
    !(location.protocol === "https:" && url.protocol !== "https:") &&
    url.host === location.host
  );
}

export function getDir(url) {
  const dirURL = new URL(url.href);
  dirURL.pathname = dirURL.pathname.replace(/([^/]+)$/, "");
  dirURL.search = "";
  dirURL.hash = "";
  return dirURL;
}

export function validateURL(urlStr) {
  try {
    new URL(urlStr);
    return true;
  } catch (error) {
    return false;
  }
}

export function sleep(ms, value = null) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(value);
    }, ms);
  });
}

export function xpath(exp, context) {
  const doc = context.ownerDocument || context;
  const result = doc.evaluate(exp, context, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
  const ret = [];
  
  for (let i = 0, len = result.snapshotLength; i < len; i++) {
    ret.push(result.snapshotItem(i));
  }
  return ret;
}

export function xpathAt(exp, context) {
  const doc = context.ownerDocument || context;
  const result = doc.evaluate(exp, context, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
  
  return result.singleNodeValue;
}

export function parseHTMLDocument(text) {
  const parser = new DOMParser();
  return parser.parseFromString(text, "text/html");
}

const REGEXP_SPECIAL_CHARACTERS = [".", "\\", "[", "]", "|", "^", "$", "(", ")", "*", "+", "?", "{", "}"];

export function parseGlob(pattern) {
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

export function sleepVisible() {
  return new Promise((resolve, reject) => {
    const listener = () => {
      if (!document.hidden) {
        document.removeEventListener("visibilitychange", listener);
        resolve(null);
      }
    };
    document.addEventListener("visibilitychange", listener);
    listener();
  });
}

export function sleepDOMContentLoaded() {
  return new Promise((resolve, reject) => {
    if (document.readyState === "loading") {
      window.addEventListener("DOMContentLoaded", () => {
        resolve(null);
      }, {once: true});
    } else {
      resolve(null);
    }
  });
}
