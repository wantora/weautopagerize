
export function checkOrigin(url) {
  return url.host === location.host;
}

export function getDir(url) {
  const dirURL = new URL(url.href);
  dirURL.pathname = dirURL.pathname.replace(/([^/]+)$/, "");
  dirURL.search = "";
  dirURL.hash = "";
  return dirURL;
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
