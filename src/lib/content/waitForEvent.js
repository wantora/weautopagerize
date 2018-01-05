export default function waitForEvent(target, type, testFn = null) {
  return new Promise((resolve, reject) => {
    const listener = (ev) => {
      if (testFn === null || testFn(ev)) {
        target.removeEventListener(type, listener);
        resolve(ev);
      }
    };
    target.addEventListener(type, listener);
  });
}
