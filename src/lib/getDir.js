export default function getDir(url) {
  const dirURL = new URL(url.href);
  dirURL.pathname = dirURL.pathname.replace(/([^/]+)$/, "");
  dirURL.search = "";
  dirURL.hash = "";
  return dirURL;
}
