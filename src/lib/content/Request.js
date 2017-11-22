
import {checkOrigin, sleep, parseHTMLDocument} from "../util";

const REQUEST_INTERVAL = 1000;
let lastRequestTime = 0;

const Request = {
  getDocument(url) {
    if (!checkOrigin(url)) {
      return Promise.reject(new Error("Same-Origin Error"));
    }
    
    const now = Date.now();
    if (now < lastRequestTime + REQUEST_INTERVAL) {
      return sleep((lastRequestTime + REQUEST_INTERVAL) - now + 10)
        .then(() => Request.getDocument(url));
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
      const mediaType = contentType.replace(/[ \t]*;[\S\s]*/, "");
      if (mediaType !== "text/html" && mediaType !== "application/xhtml+xml") {
        throw new Error(`Content-Type Error: ${contentType}`);
      }
      
      return response.arrayBuffer().then((ab) => {
        const textDecoder = new TextDecoder(document.characterSet);
        const text = textDecoder.decode(ab);
        
        return {realURL: responseURL, doc: parseHTMLDocument(text)};
      });
    });
  },
};

export default Request;
