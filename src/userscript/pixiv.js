import waitForEvent from "../lib/content/waitForEvent";
import waitForMutation from "../lib/content/waitForMutation";

function getRoot(iframe) {
  const bookmarkNewIllustRoot = iframe.contentDocument.getElementById("js-mount-point-latest-following");
  if (bookmarkNewIllustRoot) {
    return {
      root: bookmarkNewIllustRoot,
      items: JSON.parse(bookmarkNewIllustRoot.getAttribute("data-items")),
    };
  } else {
    return {
      root: iframe.contentDocument.getElementById("js-react-search-mid"),
      items: JSON.parse(iframe.contentDocument.getElementById("js-mount-point-search-result-list")
        .getAttribute("data-items")),
    };
  }
}

function getParentLink(element) {
  let link = element;
  do {
    if (link.tagName.toLowerCase() === "a") {
      return link;
    }
  } while ((link = link.parentNode));
  return null;
}

function fixLazyload(root, items) {
  const itemMap = new Map(items.map((item) => [item.illustId, item]));
  for (const element of root.querySelectorAll(".js-lazyload")) {
    const illustId = new URLSearchParams(getParentLink(element).search).get("illust_id");
    if (illustId) {
      element.style.backgroundImage = `url("${itemMap.get(illustId).url}")`;
      element.classList.remove("js-lazyload");
    }
  }
}

async function iframeFetch(url) {
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  iframe.src = url;
  document.body.appendChild(iframe);
  
  await waitForEvent(iframe.contentWindow, "DOMContentLoaded");
  const {root, items} = getRoot(iframe);
  
  const testFn = () => root.children.length > 0;
  if (!testFn()) {
    await waitForMutation(root, {childList: true, subtree: true}, testFn);
  }
  
  fixLazyload(root, items);
  const result = {
    responseURL: iframe.contentWindow.location.href,
    responseText: iframe.contentDocument.documentElement.outerHTML,
  };
  iframe.parentElement.removeChild(iframe);
  return result;
}

document.addEventListener("AutoPagerizeUserFetchRequest", (ev) => {
  iframeFetch(ev.detail.url).then((response) => {
    document.dispatchEvent(new CustomEvent("AutoPagerizeUserFetchResponse", {detail: response}));
  });
});

document.dispatchEvent(new CustomEvent("AutoPagerize_launchAutoPager", {detail: {
  siteinfo: [
    {
      url: "^https?://www\\.pixiv\\.net/bookmark_new_illust(_r18)?\\.php",
      nextLink: '//a[@rel="next"]',
      pageElement: '//*[@id="js-mount-point-latest-following"]',
      options: {
        useUserFetch: true,
      },
    },
    {
      url: "^https?://www\\.pixiv\\.net/search\\.php",
      nextLink: '//a[@rel="next"]',
      pageElement: '//*[@id="js-react-search-mid"]',
      options: {
        useUserFetch: true,
      },
    },
  ],
}}));
