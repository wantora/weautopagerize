import waitForEvent from "../lib/content/waitForEvent";
import waitForMutation from "../lib/content/waitForMutation";

function getRoot(iframe) {
  const bookmarkNewIllustRoot = iframe.contentDocument.getElementById(
    "js-mount-point-latest-following"
  );
  if (bookmarkNewIllustRoot) {
    return {
      root: bookmarkNewIllustRoot,
      items: JSON.parse(bookmarkNewIllustRoot.getAttribute("data-items")),
    };
  } else {
    return {
      root: iframe.contentDocument.getElementById("js-react-search-mid"),
      items: JSON.parse(
        iframe.contentDocument
          .getElementById("js-mount-point-search-result-list")
          .getAttribute("data-items")
      ),
    };
  }
}

function getParentLink(element) {
  let link = element;
  do {
    if (link.tagName.toLowerCase() === "a") {
      return link;
    }
  } while ((link = link.parentNode) && link.nodeType === Node.ELEMENT_NODE);
  return null;
}

function fixLazyload(root, items) {
  for (const element of root.querySelectorAll('div[style*="display"]')) {
    if (element.style.display === "none") {
      element.style.display = "";
    }
  }

  const illustImageMap = new Map(
    items.map((item) => [item.illustId, item.url])
  );
  const userImageMap = new Map(
    items.map((item) => [item.userId, item.userImage])
  );

  for (const element of root.querySelectorAll(".js-lazyload")) {
    const link = getParentLink(element);
    if (link) {
      const m = link.pathname.match(/^\/artworks\/(\d+)$/);
      const imageURL = m
        ? illustImageMap.get(m[1])
        : userImageMap.get(new URLSearchParams(link.search).get("id"));

      if (imageURL) {
        element.style.backgroundImage = `url("${imageURL}")`;
        element.classList.remove("js-lazyload");
      }
    }
  }
}

async function iframeFetch(url) {
  const iframe = document.createElement("iframe");
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.src = url;
  document.body.appendChild(iframe);

  await waitForEvent(iframe.contentWindow, "DOMContentLoaded");

  try {
    const {root, items} = getRoot(iframe);

    const testFn = () => root.children.length > 0;
    if (!testFn()) {
      await waitForMutation(root, {childList: true, subtree: true}, testFn);
    }

    fixLazyload(root, items);
  } catch (error) {
    console.error(error);
  }

  const result = {
    responseURL: iframe.contentWindow.location.href,
    responseText: iframe.contentDocument.documentElement.outerHTML,
  };
  iframe.parentElement.removeChild(iframe);
  return result;
}

document.addEventListener("AutoPagerizeUserFetchRequest", async (ev) => {
  const response = await iframeFetch(ev.detail.url);
  document.dispatchEvent(
    new CustomEvent("AutoPagerizeUserFetchResponse", {detail: response})
  );
});

document.dispatchEvent(
  new CustomEvent("AutoPagerize_launchAutoPager", {
    detail: {
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
    },
  })
);
