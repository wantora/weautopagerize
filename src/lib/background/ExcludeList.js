import Prefs from "./Prefs";
import parseGlobList from "../parseGlobList";

export default class ExcludeList {
  constructor() {
    this._regExp = [];
  }
  async init() {
    Prefs.on("excludeList", (newValue) => {
      this._update(newValue);
    });

    const {excludeList} = await Prefs.get(["excludeList"]);
    this._update(excludeList);
  }
  check(urlStr) {
    return this._regExp.test(urlStr);
  }
  _update(excludeList) {
    try {
      this._regExp = parseGlobList(excludeList);
    } catch (error) {
      console.error(error); // eslint-disable-line no-console
    }
  }
}
