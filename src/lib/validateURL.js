export default function validateURL(urlStr) {
  try {
    new URL(urlStr);
    return true;
  } catch {
    return false;
  }
}
