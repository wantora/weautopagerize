export default function sleep(ms, value = null) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(value);
    }, ms);
  });
}
