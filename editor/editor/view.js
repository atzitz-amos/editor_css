!function (e, $$) {
    function _sizr(view) {
        let sizer = $$("div.editor-sizer", view.view);
        sizer.innerHTML = "a";

        view.C.define("view.line.charSize", "f", () => sizer.getBoundingClientRect().width, "px");
    }

    const _Layers = {
        _LayerInner: class {
            constructor(view) {
                this.view = view;
                this.E = $$("div.editor-layer.layer-inner", view.layers);

                this.lineCount = Math.floor(view.C.get("view.height") / view.C.get("view.line.height"));
                this.lines = this.buildLines();
            }

            buildLines() {
                let lines = [];

                this.edgelines = [$$("div.editor-line.editor-line-edge", this.E)];
                for (let i = 0; i < this.lineCount; i++) {
                    lines.push($$("div.editor-line", this.E));
                }
                this.edgelines.push($$("div.editor-line.editor-line-edge", this.E));
                return lines;
            }
        },

        _LayerCaret: class {
            constructor(view) {
                this.view = view;

                this.E = $$("div.editor-layer.layer-caret", view.layers);
                this.caret = $$("div.editor-caret", this.E);
                this.input = $$("input.editor-input", this.E);

                this._blink = setInterval(this.blink.bind(this), 750);
            }

            blink() {
                this.caret.classList.toggle("blink");
            }

            blinkReset() {
                this.caret.classList.remove("blink");
                clearInterval(this._blink);
                this._blink = setInterval(this.blink.bind(this), 750);
            }

            update() {
                let caretPos = this.view.editor.caret.position.visual;
                this.input.style.left = caretPos.vx + "px";
                this.input.style.top = caretPos.vy + "px";
                this.caret.style.left = caretPos.vx + "px";
                this.caret.style.top = caretPos.vy + "px";

            }
        },

        _LayerSelection: class {
            constructor(view) {
                this.view = view;

                this.E = $$("div.editor-layer.layer-selection", view.layers);
            }

            update() {
                this.cancel();

                let selection = this.view.editor.selection;
                if (!selection.selectionActive) return;
                let start = selection.startPos;
                let end = selection.endPos;

                if (start.offScreen && end.offScreen) return;

                let sx = start.visual.vx, sy = start.visual.vy, ex = end.visual.vx, ey = end.visual.vy;

                if (sy > ey) {
                    [sy, ey] = [ey, sy];
                    [sx, ex] = [ex, sx];
                } else if (sy === ey && sx > ex) {
                    [sx, ex] = [ex, sx];
                }

                let selectionLineCount = ((ey - sy) / this.view.C.get("view.line.height"));

                if (sy === ey) {
                    let firstline = $$("div.editor-selection.selection-start", this.E);
                    firstline.style.left = sx + "px";
                    firstline.style.top = sy + "px";
                    firstline.style.width = ex - sx + "px";
                } else {
                    let firstline = $$("div.editor-selection.selection-start", this.E);
                    firstline.style.left = sx + "px";
                    firstline.style.top = sy + "px";
                    firstline.style.width = this.view.C.get("view.width") - sx + "px";
                    if (selectionLineCount >= 2) {
                        let mainselection = $$("div.editor-selection.selection-body", this.E);
                        mainselection.style.top = sy + this.view.C.get("view.line.height") + "px";
                        mainselection.style.height = (selectionLineCount - 1) * this.view.C.get("view.line.height") + "px";
                    }
                    let lastline = $$("div.editor-selection.selection-end", this.E);
                    lastline.style.top = ey + "px";
                    lastline.style.width = ex + "px";
                }
            }

            cancel() {
                this.E.innerHTML = "";
            }
        },

        _LayerActiveLine: class {
            constructor(view) {
                this.view = view;

                this.E = $$("div.editor-layer.layer-active-line", view.layers);
                this._activeLine = $$("div.editor-active-line", this.E);
            }

            update() {
                this._activeLine.style.top = this.view.C.get("view.line.height") * this.view.editor.data.activeLine - this.view.scroll.scrollY + "px";
            }
        }
    }

    const _Position = {
        LogicalPosition: class {
            constructor(tw, lh) {
                this.tw = tw;
                this.lh = lh;
            }
        }, VisualPosition: class {
            constructor(vx, vy) {
                this.vx = vx;
                this.vy = vy;
            }
        }, Position: class {
            constructor(view, logical) {
                this.view = view;
                this._logical = logical;
                this._visual = new _Position.VisualPosition(logical.tw * view.C.get("view.line.charSize") - view.scroll.scrollX, logical.lh * view.C.get("view.line.height") - view.scroll.scrollY);
            }

            get offScreen() {
                return (this._visual.vx < 0 || this._visual.vx > this.view.C.get("view.width") || this._visual.vy < 0 || this._visual.vy > this.view.C.get("view.height"));
            }

            get visual() {
                let vx = this.view.editor.data.lines[this._logical.lh].getVisualOffset(this._logical.tw) + this._logical.tw * this.view.C.get("view.line.charSize");
                let vy = this._logical.lh * this.view.C.get("view.line.height");
                this._visual = new _Position.VisualPosition(vx - this.view.scroll.scrollX, vy - this.view.scroll.scrollY);
                return this._visual;
            }

            get logical() {
                return this._logical;
            }

            set logical(value) {
                this._logical = value;
                this._visual = new _Position.VisualPosition(value.tw * this.view.C.get("view.line.charSize") - this.view.scroll.scrollX, value.lh * this.view.C.get("view.line.height") - this.view.scroll.scrollY);
            }

            set visual(value) {
                this._visual = value;
                this._logical = new _Position.LogicalPosition(Math.round(value.vx / this.view.C.get("view.line.charSize")) + this.view.scroll.scrollX, Math.round(value.vy / this.view.C.get("view.line.height")) + this.view.scroll.scrollY);
            }

        }, Scrolling: class {
            constructor(view, scrollX, scrollY) {
                this.view = view;
                this.scrollX = scrollX;
                this.scrollY = scrollY;
            }

            get scrollYLines() {
                return Math.ceil(this.scrollY / this.view.C.get("view.line.height"));
            }

            get scrollYOffset() {
                return this.scrollY % this.view.C.get("view.line.height");
            }

            set scrollYLines(value) {
                this.scrollY = value * this.view.C.get("view.line.height");
            }
        }
    }

    class GutterLine {
        constructor(gutter, lineNo) {
            this.gutter = gutter;
            this.lineNo = lineNo;

            this.E = $$("div.editor-gutter-line", gutter.E);
            this.E.textContent = lineNo + 1;
        }
    }

    class Gutter {
        constructor(view) {
            this.view = view;

            this.E = $$("div.editor-gutter", view.view);

            this.lineCount = Math.floor(view.C.get("view.height") / view.C.get("view.line.height"));
            this.lines = this.buildLines();
        }

        buildLines() {
            let lines = [];

            this.edgelines = [$$("div.editor-gutter-line.editor-line-edge", this.E)];
            for (let i = 0; i < this.lineCount; i++) {
                lines.push($$("div.editor-gutter-line", this.E));
            }
            this.edgelines.push($$("div.editor-gutter-line.editor-line-edge", this.E));
            return lines;
        }

        set(start, end) {
            for (let i = 0; i < this.lineCount; i++) {
                if (start + i >= end) this.lines[i].innerHTML = ""; else this.lines[i].innerHTML = `<span class='line-number'>${start + i + 1}</span>`;
            }
        }

        setNumLength(length) {
            this.view.C.set("gutter.numLength", length);
        }

    }

    class View {
        constructor(editor, root) {
            this.editor = editor;
            this.root = root;

            this.C = EDITOR.properties.get(editor.handle);

            this.scroll = new _Position.Scrolling(this, 0, 0);
        }

        init() {
            this.view = $$("div.editor-view", this.root);

            this.C.define("view.width", "i", 600, "px", EDITOR.properties.style_updater(this.view, "--editor-width"));
            this.C.define("view.height", "i", 400, "px", EDITOR.properties.style_updater(this.view, "--editor-height"));
            this.C.define("view.gutter.width", "i", 60, "px", EDITOR.properties.style_updater(this.view, "--editor-gutter-width"));

            this.C.define("view.line.height", "i", 25, "px", EDITOR.properties.style_updater(this.view, "--editor-line-height"));
            this.C.define("view.caret.height", "i", 20, "px", EDITOR.properties.style_updater(this.view, "--editor-caret-height"));

            this.C.define("view.line.fontSize", "i", 16, "px", EDITOR.properties.style_updater(this.view, "--editor-font-size"));
            _sizr(this);

            this.C.define("gutter.numLength", "i", 1, "px", (r, v) => {
                this.view.style.setProperty("--editor-gutter-num-size", v * this.C.get("view.line.charSize") + "px");
            });

            this.gutter = new Gutter(this);

            this.layers = $$("div.editor-layers", this.view);
            this.layer_inner = new _Layers._LayerInner(this);
            this.layer_caret = new _Layers._LayerCaret(this);
            this.layer_selection = new _Layers._LayerSelection(this);
            this.layer_active_line = new _Layers._LayerActiveLine(this);

            this.C.define("view.scroll.offsetY", "i", 0, "px", EDITOR.properties.style_updater(this.view, "--editor-scroll-offsetY"));
        }

        ensureCaretInView() {
            let caretPos = this.editor.caret.position.visual;

            let height = this.C.get("view.height");

            if (caretPos.vy >= height || caretPos.vy < 0) {
                this.scroll.scrollY += caretPos.vy - height + this.C.get("view.line.height") * 2;
                this.scroll.scrollY = Math.max(0, this.scroll.scrollY);
            }
        }

        render() {
            this.C.set("view.scroll.offsetY", 0);
            this.layer_caret.input.value = "";
            this.layer_caret.input.focus();

            let scrollLines = this.scroll.scrollYLines;
            let scrollOffset = this.scroll.scrollYOffset;

            this.gutter.set(scrollLines, Math.min(this.editor.data.lines.length, scrollLines + this.layer_inner.lineCount));
            this.gutter.setNumLength(Math.floor(Math.log10(this.editor.data.lines.length)) + 1);

            let data = this.editor.data.take(this.layer_inner.lineCount, scrollLines);
            for (let i = 0; i < this.layer_inner.lineCount; i++) {
                this.renderLine(this.layer_inner.lines[i], data[i]);
            }

            if (scrollOffset) {
                if (scrollLines > 0) {
                    this.renderLine(this.layer_inner.edgelines[0], this.editor.data.lines[scrollLines - 1]);
                    this.gutter.edgelines[0].innerHTML = `<span class='line-number'>${scrollLines}</span>`;
                    this.C.set("view.scroll.offsetY", this.C.get("view.line.height") - scrollOffset);
                }
                if (scrollLines + this.layer_inner.lineCount < this.editor.data.lines.length) {
                    this.renderLine(this.layer_inner.edgelines[1], this.editor.data.lines[scrollLines + this.layer_inner.lineCount]);
                    this.gutter.edgelines[1].innerHTML = `<span class='line-number'>${scrollLines + this.layer_inner.lineCount}</span>`;
                }
            }

            this.update();
        }

        renderLine(line, data) {
            let children = data && data.render() || [];
            line.innerHTML = "";
            children.forEach((x, j) => {
                line.appendChild(x);
            });
        }

        scrollBy(deltaX, deltaY) {
            this.scroll.scrollX += this.checkScrollX(deltaX);
            this.scroll.scrollY += this.checkScrollY(deltaY);
            this.render();
        }

        update() {
            // Faster than re-rendering the whole view, only update the caret and active line
            this.layer_active_line.update();
            this.layer_caret.update();
            this.layer_selection.update();
        }

        focus() {
            this.layer_caret.input.focus();
        }

        checkScrollX(deltaX) {
            return 0;
        }

        checkScrollY(deltaY) {
            if (this.scroll.scrollY + deltaY < 0) return 0;
            // We give us a little bit of space at the bottom, 2 lines
            if (this.scroll.scrollY + deltaY > (this.editor.data.lines.length - this.layer_inner.lineCount + 2) * this.C.get("view.line.height")) return Math.max(0, (this.editor.data.lines.length - this.layer_inner.lineCount + 2) * this.C.get("view.line.height") - this.scroll.scrollY);
            return deltaY;
        }
    }

    class Listener {
        constructor(editor) {
            this.editor = editor;
        }

        bind(view) {
            view.layer_caret.input.addEventListener("input", this._onevent.bind(this, "input/input"));
            view.layer_caret.input.addEventListener("keydown", this._onevent.bind(this, "input/keydown"));
            view.layer_caret.input.addEventListener("keyup", this._onevent.bind(this, "input/keyup"));

            view.layers.addEventListener("mousemove", this._onevent.bind(this, "mouse/move"), {passive: true});
            view.layers.addEventListener("mousedown", this._onevent.bind(this, "mouse/down"));
            view.layers.addEventListener("mouseup", this._onevent.bind(this, "mouse/up"));
            view.layers.addEventListener("mousewheel", this._onevent.bind(this, "mouse/wheel"), {passive: true});

            view.view.addEventListener("focusin", this._onevent.bind(this, "view/focus"));
            view.view.addEventListener("focusout", this._onevent.bind(this, "view/blur"));

            window.addEventListener("resize", this._onevent.bind(this, "window/resize"));
        }

        _onevent(type, event) {
            this.editor.events.trigger(type, event);
        }
    }

    e._Position = _Position;
    e._Layers = _Layers;
    e.View = View;
    e.Listener = Listener;
}(window.EDITOR || (window.EDITOR = {}), function (s, sper = null) {
    function _(e, t, v) {
        switch (t) {
            case '.':
                e.classList.add(v);
                break;
            case '#':
                e.id = v;
                break;
        }
    }

    let name = ""
    let el = null;
    let type = null;
    for (let i of s) {
        if ([".", "#"].includes(i)) {
            if (!el) {
                el = document.createElement(name);
            } else {
                _(el, type, name);
            }
            type = i;
            name = "";
        } else name += i;
    }
    _(el, type, name);

    if (sper) {
        sper.appendChild(el);
    }
    return el;
});