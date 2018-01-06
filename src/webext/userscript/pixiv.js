function iframeFetch(url) {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = url;
    
    document.body.appendChild(iframe);
    
    iframe.contentWindow.addEventListener("DOMContentLoaded", () => {
      const root =
        iframe.contentDocument.getElementById("js-mount-point-latest-following") ||
        iframe.contentDocument.getElementById("js-react-search-mid");
      const callback = () => {
        if (root.children.length > 0) {
          resolve({
            responseURL: iframe.contentWindow.location.href,
            responseText: iframe.contentDocument.documentElement.outerHTML,
          });
          iframe.parentElement.removeChild(iframe);
        } else {
          setTimeout(callback, 100);
        }
      };
      callback();
    }, {once: true});
  });
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
