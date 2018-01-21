export default function waitForMutation(target, options, testFn = null) {
  return new Promise((resolve, reject) => {
    const observer = new MutationObserver((mutations) => {
      if (testFn === null || testFn(mutations)) {
        observer.disconnect();
        resolve();
      }
    });
    observer.observe(target, options);
  });
}
