const I18n = {
  initHTML() {
    for (const ele of document.querySelectorAll("[data-i18n]")) {
      const key = ele.getAttribute("data-i18n");
      ele.textContent = browser.i18n.getMessage(key);
    }
  },
};

export default I18n;
