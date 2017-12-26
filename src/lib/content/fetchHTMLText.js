import MIMEType from "whatwg-mimetype";
import {checkOrigin, sleep} from "../util";

const REQUEST_INTERVAL = 1000;
let lastRequestTime = 0;

export default function fetchHTMLText(url) {
  if (!checkOrigin(url)) {
    return Promise.reject(new Error("Same-Origin Error"));
  }
  
  const now = Date.now();
  if (now < lastRequestTime + REQUEST_INTERVAL) {
    return sleep((lastRequestTime + REQUEST_INTERVAL) - now + 10)
      .then(() => fetchHTMLText(url));
  }
  lastRequestTime = now;
  
  return fetch(url, {credentials: "include", redirect: "follow"}).then((response) => {
    const responseURL = new URL(response.url);
    if (!checkOrigin(responseURL)) {
      throw new Error(`Same-Origin Error: ${responseURL.href}`);
    }
    
    const contentType = response.headers.get("Content-Type");
    if (contentType === null) {
      throw new Error(`Content-Type Error: ${contentType}`);
    }
    const mimeType = new MIMEType(contentType);
    if (!mimeType.isHTML() && mimeType.essence !== "application/xhtml+xml") {
      throw new Error(`Content-Type Error: ${contentType}`);
    }
    
    return response.arrayBuffer().then((ab) => {
      const charset = mimeType.parameters.get("charset") || document.characterSet;
      const textDecoder = new TextDecoder(charset);
      const text = textDecoder.decode(ab);
      
      return {realURL: responseURL, text: text};
    });
  });
}
