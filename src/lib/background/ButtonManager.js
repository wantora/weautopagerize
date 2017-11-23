export default class ButtonManager {
  setState(tabId, state) {
    return browser.browserAction.setIcon({
      path: `button.svg#${state}`,
      tabId: tabId,
    });
  }
}
