import PageInfo from "./PageInfo";
import ScrollListener from "./ScrollListener";
import fetchHTMLText from "./fetchHTMLText";
import {xpath, xpathAt, getDir, parseHTMLDocument} from "../util";

const BASE_REMAIN_HEIGHT = 400;

function getElementRect(element) {
  const rect = element.getBoundingClientRect();
  if (rect.top === 0 && rect.right === 0 && rect.bottom === 0 && rect.left === 0) {
    return null;
  } else {
    return rect;
  }
}

function getBorderLine(element) {
  let pos = null;
  
  if (element.nodeType === Node.ELEMENT_NODE) {
    const rect = getElementRect(element);
    if (rect) {
      pos = rect.top + document.scrollingElement.scrollTop;
    }
  }
  if (pos === null) {
    const prev = element.previousSibling;
    if (prev && prev.nodeType === Node.ELEMENT_NODE) {
      const rect = getElementRect(prev);
      if (rect) {
        pos = rect.bottom + document.scrollingElement.scrollTop;
      }
    }
  }
  if (pos === null) {
    pos = document.scrollingElement.scrollHeight * 0.8;
  }
  
  return pos - BASE_REMAIN_HEIGHT;
}

export default class AutoPager {
  constructor(info, url, doc, {prefs, pageNo = 1, loadedURLs = [], insertPoint = null}) {
    this._info = info;
    this._url = url;
    this._doc = doc;
    this._prefs = prefs;
    this._pageNo = pageNo;
    this._loadedURLs = new Set([...loadedURLs, this._url.href]);
    this._insertPoint = insertPoint;
    
    this._baseURL = this._getBaseURL();
    this._nextURL = this._getNextURL();
    this._scrollListener = new ScrollListener(() => {
      try {
        this._onScroll();
      } catch (error) {
        PageInfo.logError(error);
        PageInfo.update({state: "error"});
      }
    });
    this._userActiveListener = (newValue, oldValue) => {
      try {
        if (newValue !== oldValue) {
          if (newValue) {
            this._scrollListener.enable();
            this._onScroll();
          } else {
            this._scrollListener.disable();
          }
        }
      } catch (error) {
        PageInfo.logError(error);
        PageInfo.update({state: "error"});
      }
    };
  }
  get info() {
    return this._info;
  }
  get url() {
    return this._url;
  }
  get pageNo() {
    return this._pageNo;
  }
  test() {
    return Boolean(this._nextURL && xpathAt(this._info.pageElement, this._doc));
  }
  nextURLIsLoaded() {
    return this._loadedURLs.has(this._nextURL.href);
  }
  start() {
    if (!this._updateInsertPoint()) {
      const error = new Error("insertPoint not found");
      PageInfo.logError(error);
      PageInfo.update({state: "error"});
      return;
    }
    
    PageInfo.update({state: "enable"});
    PageInfo.emitter.on("userActive", this._userActiveListener);
    
    if (PageInfo.data.userActive) {
      this._scrollListener.enable();
      this._onScroll();
    }
  }
  insertPageElements() {
    if (!this._updateInsertPoint()) {
      return false;
    }
    
    const pageElements = xpath(this._info.pageElement, this._doc)
      .map((e) => document.importNode(e, true));
    if (pageElements.length === 0) {
      return false;
    }
    
    const fragment = this._createSeparatorFragment(
      pageElements[0].nodeType === Node.ELEMENT_NODE &&
      pageElements[0].tagName.toLowerCase() === "tr"
    );
    pageElements.forEach((pageElement) => {
      if (this._prefs.openLinkInNewTab) {
        this._openInNewTabElementLink(pageElement);
      }
      this._expandElementURL(pageElement);
      fragment.appendChild(pageElement);
    });
    this._insertPoint.parentNode.insertBefore(fragment, this._insertPoint);
    
    pageElements.forEach((pageElement) => {
      this._dispatchInsertedEvent(pageElement);
    });
    document.dispatchEvent(new Event("GM_AutoPagerizeNextPageLoaded", {bubbles: true}));
    
    return true;
  }
  _onScroll() {
    const scrollingElement = document.scrollingElement;
    const scrollBottom = scrollingElement.scrollTop + scrollingElement.clientHeight;
    const borderLine = getBorderLine(this._insertPoint);
    
    if (scrollBottom > borderLine) {
      PageInfo.emitter.removeListener("userActive", this._userActiveListener);
      this._scrollListener.disable();
      this._loadNext();
    }
  }
  _loadNext() {
    PageInfo.log({type: "loading", url: this._nextURL.href});
    PageInfo.update({state: "loading"});
    
    fetchHTMLText(this._nextURL).then(({realURL, text}) => {
      if (!this._loadedURLs.has(realURL.href)) {
        const newLoadedURLs = [...this._loadedURLs, this._nextURL.href];
        const doc = parseHTMLDocument(text);
        const nextAutoPager = new AutoPager(this._info, realURL, doc, {
          prefs: this._prefs,
          pageNo: this._pageNo + 1,
          loadedURLs: newLoadedURLs,
          insertPoint: this._insertPoint,
        });
        
        if (nextAutoPager.insertPageElements()) {
          PageInfo.log({type: "insert", url: nextAutoPager.url.href, pageNo: nextAutoPager.pageNo});
          if (nextAutoPager.test()) {
            nextAutoPager.start();
            return;
          }
        }
      }
      
      PageInfo.log({type: "end"});
      PageInfo.update({state: "default"});
    }).catch((error) => {
      PageInfo.logError(error);
      PageInfo.update({state: "error"});
    });
  }
  _getBaseURL() {
    const base = this._doc.querySelector("base[href]");
    if (base) {
      try {
        return new URL(base.getAttribute("href"), this._url);
      } catch (error) {
        // pass
      }
    }
    return this._url;
  }
  _getNextURL() {
    const element = xpathAt(this._info.nextLink, this._doc);
    if (!element) { return null; }
    
    let value = null;
    if (element.nodeType === Node.ELEMENT_NODE) {
      value = element.getAttribute("href") || element.getAttribute("action");
    } else if (element.nodeType === Attr.ATTRIBUTE_NODE) {
      value = element.value;
    }
    if (!value) { return null; }
    
    let nextURL = null;
    try {
      nextURL = new URL(value, this._baseURL);
    } catch (error) {
      return null;
    }
    if (nextURL.protocol !== "http:" && nextURL.protocol !== "https:") { return null; }
    
    return nextURL;
  }
  _updateInsertPoint() {
    if (
      this._insertPoint === null ||
      this._insertPoint.compareDocumentPosition(document) & Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC // eslint-disable-line max-len
    ) {
      let newInsertPoint = null;
      if (this._info.insertBefore) {
        newInsertPoint = xpathAt(this._info.insertBefore, document);
      }
      if (!newInsertPoint) {
        const pageElements = xpath(this._info.pageElement, document);
        if (pageElements.length !== 0) {
          const element = pageElements[pageElements.length - 1];
          newInsertPoint = element.nextSibling || element.parentNode.appendChild(document.createTextNode(" "));
        }
      }
      this._insertPoint = newInsertPoint;
      
      if (!this._insertPoint) {
        return false;
      }
    }
    return true;
  }
  _openInNewTabElementLink(element) {
    xpath("descendant-or-self::a[@href] | descendant-or-self::area[@href]", element).forEach((anchor) => {
      if (
        (anchor.protocol === "http:" || anchor.protocol === "https:") &&
        !anchor.getAttribute("href").startsWith("#") &&
        !anchor.hasAttribute("target")
      ) {
        anchor.target = "_blank";
        anchor.relList.add("noopener");
      }
    });
  }
  _expandElementURL(element) {
    if (getDir(this._baseURL).href === getDir(new URL(location.href)).href) {
      return;
    }
    
    xpath("descendant-or-self::a/@href | descendant-or-self::area/@href | descendant-or-self::img/@src", element).forEach((attr) => {
      const value = attr.value;
      if (value.startsWith("/") || value.startsWith("#")) {
        return;
      }
      
      try {
        // 相対パスなら例外発生
        new URL(value);
      } catch (e1) {
        try {
          attr.value = new URL(value, this._baseURL).href;
        } catch (e2) {
          // pass
        }
      }
    });
  }
  _createSeparatorFragment(tableMode) {
    const fragment = document.createDocumentFragment();
    
    const paragraph = document.createElement("p");
    paragraph.className = "autopagerize_page_info";
    paragraph.appendChild(document.createTextNode("page: "));
    
    const anchor = document.createElement("a");
    anchor.className = "autopagerize_link";
    anchor.href = this._url.href;
    anchor.textContent = String(this._pageNo);
    if (this._prefs.openLinkInNewTab) {
      anchor.target = "_blank";
      anchor.relList.add("noopener");
    }
    paragraph.appendChild(anchor);
    
    if (tableMode) {
      const colNodes = xpath("child::tr[1]/child::*[self::td or self::th]", this._insertPoint.parentNode);
      const colums = colNodes.reduce((prev, e) => prev + (parseInt(e.getAttribute("colspan"), 10) || 1), 0);
      
      const td = document.createElement("td");
      td.setAttribute("colspan", colums);
      td.appendChild(paragraph);
      
      const tr = document.createElement("tr");
      tr.appendChild(td);
      
      fragment.appendChild(tr);
    } else {
      const hr = document.createElement("hr");
      hr.className = "autopagerize_page_separator";
      fragment.appendChild(hr);
      fragment.appendChild(paragraph);
    }
    
    return fragment;
  }
  _dispatchInsertedEvent(pageElement) {
    const ev = document.createEvent("MutationEvent");
    ev.initMutationEvent("AutoPagerize_DOMNodeInserted", true, false,
      this._insertPoint.parentNode, null, this._url, null, null);
    pageElement.dispatchEvent(ev);
  }
}
