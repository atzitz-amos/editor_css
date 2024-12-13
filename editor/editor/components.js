!function (e) {
    e.components = {
        Text: class {
            constructor(text, position, class_ = null) {
                this.text = text;
                this.position = position;
                this.class_ = class_ || [];
            }

            get textContent() {
                return this.text;
            }

            get length() {
                return this.text.length;
            }

            render() {
                let span = document.createElement("span");
                span.classList.add(...this.class_);
                span.textContent = this.text;
                span = this._render(span);
                return span;
            }

            _render(span) {
                return span;
            }

            split(pos) {
                return [
                    new e.components.HighlightedToken(this.text.substring(0, pos), this.position, this.class_),
                    new e.components.HighlightedToken(this.text.substring(pos), this.position, this.class_)
                ]
            }
        }
    }
    Object.assign(e.components, {
        HighlightedToken: class extends e.components.Text {
            constructor(token, position, class_ = null) {
                super(token, position, class_);
            }

            _render(span) {
                span.classList.add("hi-token");
                return span;
            }
        },
        Tab: class extends e.components.Text {
            constructor(position, class_ = null) {
                super("    ", position, class_);
            }

            get textContent() {
                return "    ";
            }

            get length() {
                return 4;
            }

            _render(span) {
                span.classList.add("tab");
                return span;
            }
        },
        GutterIcon: class {
            constructor(lineNo, text, icon, class_ = null) {
                this.lineNo = lineNo;
                this.text = text;
                this.icon = icon;
                this.class_ = class_ || [];
            }
        },
        InlineIcon: class {
            constructor(editor, position, text, icon, class_ = null) {
                this.editor = editor;
                this.position = position;
                this.text = text;
                this.icon = icon;

                this.span = null;
                this.class_ = class_ || [];
            }

            get textContent() {
                return "";
            }

            get length() {
                return 0;
            }

            get width() {
                return this.span ? this.span.getBoundingClientRect().width + 6.5 : 0;
            }

            render() {
                this.span = document.createElement("span");
                this.span.classList.add(...this.class_);
                this.span.classList.add("inline-icon");
                this.span.textContent = this.text;

                return this.span;
            }
        }
    });

    e.logical_components = {};
}(window.EDITOR || (window.EDITOR = {}));