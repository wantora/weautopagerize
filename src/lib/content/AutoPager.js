import ScrollListener from "./ScrollListener";
import Request from "./Request";
import {xpath, xpathAt, getDir} from "../util";

const BASE_REMAIN_HEIGHT = 400;

function getBorderLine(element) {
  let top;
  
  if (element.nodeType === Node.ELEMENT_NODE) {
    top = element.getBoundingClientRect().top + document.scrollingElement.scrollTop;
  } else {
    const prev = element.previousSibling;
    if (prev && prev.nodeType === Node.ELEMENT_NODE) {
      top = prev.getBoundingClientRect().bottom + document.scrollingElement.scrollTop;
    } else {
      top = document.scrollingElement.scrollHeight * 0.8;
    }
  }
  
  return top - BASE_REMAIN_HEIGHT;
}

export default class AutoPager {
  static create(siteinfo) {
    for (const info of siteinfo) {
      const autoPager = new AutoPager(info, new URL(location.href), document, {});
      
      if (autoPager.test()) {
        console.log("weAutoPagerize_siteinfo", info);
        return autoPager;
      }
    }
    return null;
  }
  constructor(info, url, doc, {pageNo = 1, loadedURLs = [], insertPoint = null}) {
    this._info = info;
    this._url = url;
    this._doc = doc;
    this._pageNo = pageNo;
    this._loadedURLs = new Set(loadedURLs);
    this._loadedURLs.add(this._url.href);
    this._insertPoint = insertPoint;
    
    this._baseURL = this._getBaseURL();
    this._nextURL = this._getNextURL();
    this._scrollListener = new ScrollListener(() => {
      this._onScroll();
    });
  }
  test() {
    if (this._nextURL && xpathAt(this._info.pageElement, this._doc)) {
      return !this._loadedURLs.has(this._nextURL.href);
    } else {
      return false;
    }
  }
  start() {
    console.log("weAutoPagerize_start", this._url.href, this._doc, this._pageNo);
    
    if (!this._updateInsertPoint()) {
      return;
    }
    
    this._scrollListener.enable();
    this._onScroll();
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
    
    console.log("weAutoPagerize_insert", this._url.href, this._insertPoint, pageElements);
    
    const fragment = this._getSeparatorFragment(
      pageElements[0].nodeType === Node.ELEMENT_NODE &&
      pageElements[0].tagName.toLowerCase() === "tr"
    );
    pageElements.forEach((pageElement) => {
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
      this._scrollListener.disable();
      this._loadNext().catch((error) => {
        console.error(error); // eslint-disable-line no-console
      });
    }
  }
  _loadNext() {
    return Request.getDocument(this._nextURL).then(({realURL, doc}) => {
      if (this._loadedURLs.has(realURL.href)) {
        return;
      }
      this._loadedURLs.add(this._nextURL.href);
      this._loadedURLs.add(realURL.href);
      
      const nextAutoPager = new AutoPager(this._info, realURL, doc, {
        pageNo: this._pageNo + 1,
        loadedURLs: this._loadedURLs,
        insertPoint: this._insertPoint,
      });
      
      if (nextAutoPager.insertPageElements()) {
        if (nextAutoPager.test()) {
          nextAutoPager.start();
        }
      }
    });
  }
  _getBaseURL() {
    const base = this._doc.querySelector("base[href]");
    if (base) {
      return new URL(base.getAttribute("href"), this._url);
    } else {
      return this._url;
    }
  }
  _getNextURL() {
    const element = xpathAt(this._info.nextLink, this._doc);
    if (!element) { return null; }
    
    const value = element.getAttribute("href") || element.getAttribute("action") || element.value;
    if (!value) { return null; }
    
    const nextURL = new URL(value, this._baseURL);
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
        // eslint-disable-next-line no-console
        console.log(`insertPoint not found (insertBefore: ${this._info.insertBefore})`);
        return false;
      }
    }
    return true;
  }
  _expandElementURL(element) {
    if (getDir(this._baseURL).href === getDir(new URL(location.href)).href) {
      return;
    }
    
    xpath("descendant-or-self::a/@href | descendant-or-self::img/@src", element).forEach((attr) => {
      const value = attr.value;
      if (value.startsWith("/") || value.startsWith("#")) { return; }
      
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
  _getSeparatorFragment(tableMode) {
    const fragment = document.createDocumentFragment();
    
    const paragraph = document.createElement("p");
    paragraph.className = "autopagerize_page_info";
    paragraph.appendChild(document.createTextNode("page: "));
    
    const anchor = document.createElement("a");
    anchor.className = "autopagerize_link";
    anchor.href = this._url.href;
    anchor.textContent = String(this._pageNo);
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
