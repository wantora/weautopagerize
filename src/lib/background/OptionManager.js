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
        const messageElement = document.getElementById(`prefMessage_${opt.name}`);
        
        opt.updater.load(element, value);
        this._validate(opt, messageElement, value);
        
        const onChange = () => {
          const newValue = opt.updater.save(element);
          Prefs.set({[opt.name]: newValue});
          this._validate(opt, messageElement, newValue);
        };
        
        let timeoutId;
        element.addEventListener("input", () => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            onChange();
          }, 500);
        });
        element.addEventListener("change", () => {
          clearTimeout(timeoutId);
          onChange();
        });
      });
    });
  }
  _validate(opt, messageElement, value) {
    if (opt.validator && messageElement) {
      messageElement.textContent = opt.validator(value);
    }
  }
}
