let globalScrolled = false;

function checkScrollable() {
  if (
    document.scrollingElement.scrollHeight ===
    document.scrollingElement.clientHeight
  ) {
    return false;
  }

  let ele = document.body;
  while (ele.nodeType === Node.ELEMENT_NODE) {
    if (window.getComputedStyle(ele)["overflow-y"] === "hidden") {
      return false;
    }
    ele = ele.parentNode;
  }
  return true;
}

export default class ScrollListener {
  constructor(callback) {
    this._callback = callback;

    let timeoutId = null;
    this._listener = (ev) => {
      if (!globalScrolled) {
        if (
          ev.type === "scroll" ||
          (ev.type === "resize" && !checkScrollable())
        ) {
          globalScrolled = true;
        } else {
          return;
        }
      }

      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        timeoutId = null;
        this._callback.call(null);
      }, 200);
    };
    this._initialCall = () => {
      if (!globalScrolled && !checkScrollable()) {
        globalScrolled = true;
      }
      if (globalScrolled) {
        this._callback.call(null);
      }
    };
  }
  enable() {
    window.addEventListener("scroll", this._listener, {passive: true});
    window.addEventListener("resize", this._listener, {passive: true});
    if (document.readyState !== "complete") {
      window.addEventListener("load", this._initialCall, {
        passive: true,
        once: true,
      });
    }
    this._initialCall();
  }
  disable() {
    window.removeEventListener("scroll", this._listener, {passive: true});
    window.removeEventListener("resize", this._listener, {passive: true});
    window.removeEventListener("load", this._initialCall, {
      passive: true,
      once: true,
    });
  }
}
