!function (e) {
    e.properties = {
        __cache: {}, get: function (handle) {
            return this.__cache[handle] || (this.__cache[handle] = {
                _values: {}, _typeValidation: function (k, v) {
                    let [type, ...x] = this._values[k];
                    switch (type) {
                        case "i":
                            return typeof v == "number";
                        case "s":
                            return typeof v == "string";
                        case "f":
                            throw "Property of type `f` is final and cannot be set.";
                        case "a":
                            return Array.isArray(v);
                        default:
                            return false;
                    }
                }, define: function (name, type, initial = null, suffix = "", updateHook = null) {
                    if (name === "__proto__" || name === "prototype") return;
                    if (initial == null) {
                        switch (type) {
                            case "i":
                                initial = 0;
                                break;
                            case "s":
                                initial = "";
                                break;
                            case "a":
                                initial = [];
                                break;
                            default:
                                break;
                        }
                    }
                    this._values[name] = [type, initial, suffix, updateHook];
                    if (updateHook) updateHook(this.getWithUnit(name), this.get(name));
                }, set: function (key, value) {
                    if (key !== "__proto__" && key !== "prototype") {
                        if (key in this._values && this._typeValidation(key, value)) {
                            this._values[key][1] = value;
                            if (this._values[key][3]) this._values[key][3](this.getWithUnit(key), this.get(key));  // Update Hook
                        } else {
                            throw "Unknown constant or mismatched value type: " + key;
                        }
                    }
                }, getWithUnit: function (key) {
                    if (key in this._values && key !== "__proto__" && key !== "prototype") {
                        let val = this._values[key][1];
                        if (this._values[key][0] === "f") val = val();
                        return val + this._values[key][2];
                    }
                }, get: function (key) {
                    if (key in this._values && key !== "__proto__" && key !== "prototype") {
                        return this._values[key][0] === "f" ? this._values[key][1]() : this._values[key][1];
                    }
                }
            });
        }, style_updater: function (element, property) {
            return value => element.style.setProperty(property, value);
        }
    }
}(window.EDITOR || (window.EDITOR = {}));