export default function checkOrigin(url) {
  return (
    !(location.protocol === "https:" && url.protocol !== "https:") &&
    url.host === location.host
  );
}
