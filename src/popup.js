function getActiveTab() {
  return browser.tabs.query({currentWindow: true, active: true}).then((tabs) => tabs[0]);
}

getActiveTab().then((tab) => {
  if (!tab) { return; }
  
  const port = browser.tabs.connect(tab.id, {name: "pageInfoPort"});
  port.onMessage.addListener((data) => {
    console.log("pageInfo", data);
  });
});
