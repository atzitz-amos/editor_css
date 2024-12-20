!function (e) {
    e.components = {
        Text: class {
            constructor(text, position, class_ = null, role = null) {
                this.text = text;
                this.position = position;
                this.class_ = class_ || [];
                this.role = role;
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
                if (this.role) {
                    span.setAttribute("data-role", this.role);
                }
                return span;
            }

            _render(span) {
                return span;
            }

            split(pos) {
                return [
                    new e.components.HighlightedToken(this.text.substring(0, pos), this.position, null, this.class_),
                    new e.components.HighlightedToken(this.text.substring(pos), this.position, null, this.class_)
                ]
            }
        }
    }
    Object.assign(e.components, {
        HighlightedToken: class extends e.components.Text {
            constructor(token, position, type_ = null, class_ = null, role = null) {
                super(token, position, class_, role);
                this.type_ = type_;
            }

            _render(span) {
                span.classList.add("hi-token");
                span.classList.add(this.type_.class_);
                return span;
            }
        },
        TokenGroup: class {
            constructor(tokens, pos, class_ = null, role = null) {
                this.tokens = tokens;
                this.position = pos;
                this.class_ = class_ || [];
                this.role = role;
            }

            get textContent() {
                return this.tokens.map(t => t.textContent).join("");
            }

            get length() {
                return this.tokens.reduce((acc, t) => acc + t.length, 0);
            }

            render() {
                let div = document.createElement("div");
                div.classList.add(...this.class_);
                div.classList.add("il");
                if (this.role) {
                    div.setAttribute("data-role", this.role);
                }
                this.tokens.forEach(t => div.appendChild(t.render()));
                return div;
            }

            split(pos) {
                let left = [];
                let right = [];
                let acc = 0;
                for (let t of this.tokens) {
                    if (acc + t.length <= pos) {
                        left.push(t);
                    } else if (acc < pos) {
                        let [l, r] = t.split(pos - acc);
                        left.push(l);
                        right.push(r);
                    } else {
                        right.push(t);
                    }
                    acc += t.length;
                }
                return [new e.components.TokenGroup(left, this.class_), new e.components.TokenGroup(right, this.class_)];
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