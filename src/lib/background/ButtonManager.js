export default class ButtonManager {
  init() {
    // empty
  }
  setState(tabId, state) {
    browser.browserAction.setIcon({
      path: `button.svg#${state}`,
      tabId: tabId,
    });
  }
}
