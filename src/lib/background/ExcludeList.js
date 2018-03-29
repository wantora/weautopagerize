import Prefs from "./Prefs";
import parseGlob from "../parseGlob";

export default class ExcludeList {
  constructor() {
    this._list = [];
  }
  async init() {
    Prefs.on("excludeList", (newValue) => {
      this._update(newValue);
    });

    const {excludeList} = await Prefs.get(["excludeList"]);
    this._update(excludeList);
  }
  check(urlStr) {
    return this._list.some((reg) => reg.test(urlStr));
  }
  _update(excludeList) {
    const newList = [];

    excludeList.forEach((str) => {
      try {
        newList.push(parseGlob(str));
      } catch (error) {
        console.error(error); // eslint-disable-line no-console
      }
    });

    this._list = newList;
  }
}
