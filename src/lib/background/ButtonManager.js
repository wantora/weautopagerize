export default class ButtonManager {
  init() {
    // empty
  }
  setState(tabId, state) {
    return browser.browserAction.setIcon({
      path: `button.svg#${state}`,
      tabId: tabId,
    });
  }
}
