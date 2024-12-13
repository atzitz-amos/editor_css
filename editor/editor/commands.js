!function (e) {
    e.Commands = function () {
        let callbacks = {};
        let f = function (cmd, ...args) {
            if (callbacks[cmd]) {
                return callbacks[cmd](...args);
            }
        };
        Object.assign(f, {
            registerCommand: function (cmd, callback) {
                callbacks[cmd] = callback;
            }
        });
        return f;
    }
}(window.EDITOR || (window.EDITOR = {}));