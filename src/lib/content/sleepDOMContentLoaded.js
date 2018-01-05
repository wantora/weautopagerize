export default function sleepDOMContentLoaded() {
  return new Promise((resolve, reject) => {
    if (document.readyState === "loading") {
      window.addEventListener("DOMContentLoaded", () => {
        resolve(null);
      }, {once: true});
    } else {
      resolve(null);
    }
  });
}
