export default function updateButtonState(tabId, state) {
  return browser.browserAction.setIcon({
    path: `button.svg#${state}`,
    tabId: tabId,
  });
}
