import Prefs from "./Prefs";

export default class OptionManager {
  constructor(options) {
    this._options = options;
  }
  async init() {
    const values = await Prefs.get(this._options.map((opt) => opt.name));

    this._options.forEach((opt) => {
      const value = values[opt.name];
      const element = document.getElementById(`pref_${opt.name}`);
      const messageElement = document.getElementById(`prefMessage_${opt.name}`);

      opt.updater.load(element, value);
      this._validate(opt, messageElement, value);

      const onChange = async () => {
        const newValue = opt.updater.save(element);
        if (opt.permitter) {
          try {
            element.disabled = true;
            if (!(await opt.permitter(newValue))) {
              const prevValue = (await Prefs.get([opt.name]))[opt.name];
              opt.updater.load(element, prevValue);
              return;
            }
          } finally {
            element.disabled = false;
          }
        }
        this._validate(opt, messageElement, newValue);
        await Prefs.set({[opt.name]: newValue});
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
  }
  _validate(opt, messageElement, value) {
    if (opt.validator && messageElement) {
      messageElement.textContent = opt.validator(value);
    }
  }
}
