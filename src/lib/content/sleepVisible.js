export default function sleepVisible() {
  return new Promise((resolve, reject) => {
    const listener = () => {
      if (!document.hidden) {
        document.removeEventListener("visibilitychange", listener);
        resolve(null);
      }
    };
    document.addEventListener("visibilitychange", listener);
    listener();
  });
}
