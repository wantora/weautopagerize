const Info = {
  updateStatus(status) {
    browser.runtime.sendMessage({type: "updateStatus", status: status});
  },
};

export default Info;
