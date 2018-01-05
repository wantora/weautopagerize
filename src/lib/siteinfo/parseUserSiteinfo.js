import JSON5 from "json5";

export default function parseUserSiteinfo(str) {
  if (/^\s*$/.test(str)) {
    return null;
  }
  return JSON5.parse(str);
}
