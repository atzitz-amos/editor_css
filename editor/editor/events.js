!function (e) {
    class Events {
        constructor(editor) {
            this.editor = editor;

            this.events = {};
        }

        trigger(type, event) {
            if (!this.events[type]) return;
            for (let callback of this.events[type]) {
                callback(event);
            }
        }

        on(type, callback) {
            if (!this.events[type]) this.events[type] = [];
            this.events[type].push(callback);
        }
    }

    e.Events = Events;
}(window.EDITOR || (window.EDITOR = {}));