import MIMEType from "whatwg-mimetype";
import checkOrigin from "../checkOrigin";
import sleep from "../sleep";
import waitForEvent from "./waitForEvent";

async function nativeFetch(url) {
  const response = await fetch(url, {
    credentials: "include",
    redirect: "follow",
    headers: {
      "User-Agent": navigator.userAgent, // https://github.com/wantora/weautopagerize/issues/6
    },
  });
  const responseURL = new URL(response.url);

  const contentType = response.headers.get("Content-Type");
  if (contentType === null) {
    throw new Error(`Content-Type Error: ${contentType}`);
  }
  const mimeType = new MIMEType(contentType);
  if (!mimeType.isHTML() && mimeType.essence !== "application/xhtml+xml") {
    throw new Error(`Content-Type Error: ${contentType}`);
  }

  const ab = await response.arrayBuffer();
  const charset = mimeType.parameters.get("charset") || document.characterSet;
  const textDecoder = new TextDecoder(charset);
  const responseText = textDecoder.decode(ab);

  return {responseURL, responseText};
}

function dispatchCustomEvent(type, options) {
  document.dispatchEvent(
    new document.defaultView.CustomEvent(
      type,
      cloneInto(options, document.defaultView)
    )
  );
}

async function userFetch(url) {
  const eventPromise = waitForEvent(document, "AutoPagerizeUserFetchResponse");
  dispatchCustomEvent("AutoPagerizeUserFetchRequest", {
    bubbles: true,
    detail: {
      url: url.href,
    },
  });

  const ev = await eventPromise;
  const {responseURL, responseText} = ev.detail;
  return {responseURL: new URL(responseURL), responseText};
}

async function responseFilter(response) {
  const eventPromise = waitForEvent(
    document,
    "AutoPagerizeResponseFilterResponse"
  );
  dispatchCustomEvent("AutoPagerizeResponseFilterRequest", {
    bubbles: true,
    detail: {
      responseURL: response.responseURL.href,
      responseText: response.responseText,
    },
  });

  const ev = await eventPromise;
  const {responseText} = ev.detail;
  return {
    responseURL: response.responseURL,
    responseText,
  };
}

const REQUEST_INTERVAL = 1000;
let lastRequestTime = 0;

export default async function fetchHTMLText(url, options) {
  if (!checkOrigin(url) && url.protocol === "http:") {
    const httpsURL = new URL(url.href);
    httpsURL.protocol = "https:";

    if (checkOrigin(httpsURL)) {
      return fetchHTMLText(httpsURL, options);
    }
  }

  const now = Date.now();
  if (now < lastRequestTime + REQUEST_INTERVAL) {
    await sleep(lastRequestTime + REQUEST_INTERVAL - now + 10);
    return fetchHTMLText(url, options);
  }
  lastRequestTime = now;

  const {useUserFetch, useResponseFilter} = Object.assign(
    {
      useUserFetch: false,
      useResponseFilter: false,
    },
    options || {}
  );

  let response = await (useUserFetch ? userFetch(url) : nativeFetch(url));
  if (!checkOrigin(response.responseURL)) {
    throw new Error(`Same-Origin Error: ${response.responseURL.href}`);
  }

  if (useResponseFilter) {
    response = await responseFilter(response);
  }

  return response;
}
