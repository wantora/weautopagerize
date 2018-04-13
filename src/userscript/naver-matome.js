function domFilter(url, doc) {
  const currentElement = doc.querySelector(
    ".MdPagination03 strong, .MdPagination04 strong"
  );
  if (!currentElement) {
    return;
  }
  const nextElement = currentElement.nextElementSibling;
  if (!nextElement) {
    return;
  }

  const nextURL = new URL(url);
  nextURL.searchParams.set("page", nextElement.textContent);
  nextElement.setAttribute("data-next-url", nextURL);
}

domFilter(location.href, document);

document.addEventListener("AutoPagerizeResponseFilterRequest", (ev) => {
  const doc = new DOMParser().parseFromString(
    ev.detail.responseText,
    "text/html"
  );
  domFilter(ev.detail.responseURL, doc);

  document.dispatchEvent(
    new CustomEvent("AutoPagerizeResponseFilterResponse", {
      detail: {
        responseText: doc.documentElement.outerHTML,
      },
    })
  );
});

document.dispatchEvent(
  new CustomEvent("AutoPagerize_launchAutoPager", {
    detail: {
      siteinfo: [
        {
          url: "^https?://matome\\.naver\\.jp/odai/",
          nextLink: "//*/@data-next-url",
          pageElement: '//div[contains(@class, "MdMTMWidgetList01")]',
          options: {
            useResponseFilter: true,
          },
          exampleUrl: "https://matome.naver.jp/odai/2143478691035538101",
        },
        {
          url: "^https?://matome\\.naver\\.jp/topic/",
          nextLink: "//*/@data-next-url",
          pageElement: '//ul[contains(@class, "MdMTMTtlList02")]',
          options: {
            useResponseFilter: true,
          },
          exampleUrl: "https://matome.naver.jp/topic/1LwZ0",
        },
      ],
    },
  })
);
