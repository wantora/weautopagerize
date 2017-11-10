import Prefs from "./Prefs";

export default class OptionManager {
  constructor(options) {
    this._options = options;
  }
  init() {
    Prefs.get(this._options.map((opt) => opt.name)).then((values) => {
      this._options.forEach((opt) => {
        const value = values[opt.name];
        const element = document.getElementById(`pref_${opt.name}`);
        
        opt.updater.load(element, value);
        
        element.addEventListener("change", () => {
          Prefs.set({[opt.name]: opt.updater.save(element)});
        });
      });
    });
  }
}
