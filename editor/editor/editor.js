!function (e) {
    class Caret {
        constructor(editor) {
            this.editor = editor;
            this.C = e.properties.get(editor.handle);

            this.position = new e._Position.Position(this.editor.view, new e._Position.LogicalPosition(0, 0));
            this.vertMovementPos = 0;
        }

        setVertMovementPos() {
            this.vertMovementPos = Math.max(this.vertMovementPos, this.position.logical.tw);
        }

        setPosition(type, x, y) {
            if (type === "logical") {
                this.position.logical.tw = x;
                this.position.logical.lh = y;
            } else if (type === "visual") {
                this.position.visual = new e._Position.VisualPosition(x, y);  // So that we trigger the setter
            }
            this.editor.data.activeLine = this.position.logical.lh;
        }
    }

    class Selection {
        selectionActive = false;

        constructor(editor) {
            this.editor = editor;
            this.C = e.C;

            this.startPos = new e._Position.Position(editor.view, new e._Position.LogicalPosition(0, 0));
            this._endPos = null;
        }

        setStartPos(x = null, y = null) {
            if (x === null) x = this.editor.caret.position.logical.tw;
            if (y === null) y = this.editor.caret.position.logical.lh;
            this.startPos.logical.tw = x;
            this.startPos.logical.lh = y;
        }

        setEndPos(x, y) {
            this._endPos = new e._Position.Position(this.editor.view, new e._Position.LogicalPosition(x, y));
        }

        setActive(active) {
            this.selectionActive = active;
        }

        cancel() {
            this.setActive(false);
            this._endPos = null;
        }

        get direction() {
            return (this.startPos.logical.lh < this.editor.caret.position.logical.lh || (this.startPos.logical.lh === this.editor.caret.position.logical.lh && this.startPos.logical.tw < this.editor.caret.position.logical.tw)) ? "right" : "left";
        }

        get endPos() {
            return this._endPos === null ? this.editor.caret.position : this._endPos;
        }
    }

    class EditorData {
        constructor() {
            this.lines = [];
            this.activeLine = 0;
        }

        add(line) {
            this.lines.push(line);
        }

        take(n, from) {
            return this.lines.slice(from, from + n);
        }

        lineno(line) {
            return this.lines.indexOf(line);
        }

        selected(stw, slh, etw, elh) {
            let result = [];
            if (slh === elh) {
                return [this.lines[slh].contentSlice(stw, etw)];
            }
            for (let i = slh; i <= elh; i++) {
                let line = this.lines[i];
                if (i === slh) {
                    result.push(line.contentSlice(stw));
                } else if (i === elh) {
                    result.push(line.contentSlice(0, etw));
                } else {
                    result.push(line.toCopiable());
                }
            }
            return result;
        }

        get active() {
            return this.lines[this.activeLine];
        }

        get textContent() {
            return this.lines.map(x => x.content).join("\n");
        }
    }

    class Line {
        constructor(content) {
            this.content = content;
            this.inlineIcons = [];
        }

        addInlineIcon(icon) {
            this.inlineIcons.push(icon);
        }

        clearInlineIcons() {
            this.inlineIcons = [];
        }

        getVisualOffset(tw) {
            let offset = 0;
            for (let icon of this.inlineIcons) {
                if (icon.position < tw) {
                    offset += icon.width;
                }
            }
            return offset;
        }

        getVisualOffsetFromVisual(vx) {
            let offset = 0;
            for (let icon of this.inlineIcons) {
                if (icon.span && icon.span.getBoundingClientRect().x > vx) {
                    offset += icon.width;
                }
            }
            return offset;
        }

        render(editor) {
            let result = this._render(editor);
            for (let icon of this.inlineIcons) {
                for (let i = 0; i < result.length; i++) {
                    let start = result[i].position;
                    if (start <= icon.position && icon.position <= start + result[i].length) {
                        let [a, b] = result[i].split(icon.position - start);
                        result.splice(i, 1, a, icon, b);
                        break;
                    }
                }
            }

            return result.map(x => x.render());
        }

        _render(editor) {
            let tks = editor.highlighted_tokens;
            let result = [];
            let y = editor.data.lineno(this);
            // Find the tokens that are in this line
            for (let tk of tks) {
                result.push(tk);
            }
            return result;
        }

        selectWord(pos) {
            let i = 0;
            for (let group of this.content.split(" ")) {
                if (i + group.length >= pos) {
                    return [i, i + group.length];
                }
                i += group.length + 1
            }
            return [0, 0];
        }

        writeAt(pos, data) {
            // TODO, for now because this.contents is always equal to [string], we can avoid calculating the chunk of content
            this.content = this.content.substring(0, pos) + data + this.content.substring(pos);
        }

        deleteAt(pos, direction = -1) {
            if (direction === 1) {
                this.content = this.content.substring(0, pos - 1) + this.content.substring(pos);
            } else {
                this.content = this.content.substring(0, pos) + this.content.substring(pos + 1);
            }
        }

        slice(pivot, to = "right") {
            if (to === "left") {
                let content = this.content.slice(0, pivot);
                this.content = this.content.slice(pivot);
                return content;
            } else {
                let content = this.content.slice(pivot);
                this.content = this.content.slice(0, pivot);
                return content;
            }
        }

        contentSlice(start, end = null) {
            if (end === null) {
                return this.content.slice(start);
            }
            return this.content.slice(start, end);
        }

        remove(start, end) {
            this.content = this.content.substring(0, start) + this.content.substring(end);
        }

        append(content) {
            this.content += content;
        }

        toCopiable() {
            return this.content;
        }

        get logicalLength() {
            return this.content.length;
        }
    }

    class Editor {
        highlighted_tokens = [];

        constructor(handle, element) {
            this.handle = handle;
            this.C = e.properties.get(handle);

            this.E = document.createElement("div");
            this.E.classList.add("editor");
            this.E.classList.add("dark");
            element.appendChild(this.E);

            this.view = new e.View(this, this.E);
            this.listener = new e.Listener(this);
            this.events = new e.Events(this);
            this.command = new e.Commands();

            this.view.init();
            this.listener.bind(this.view);

            this.caret = new e.Caret(this);
            this.selection = new e.Selection(this);
            this.data = new e.EditorData();

            this.data.add(new e.Line(""));
            this.view.render();

            this.registerEvents();
            this.registerCommands();
        }

        registerEvents() {
            this.events.on("input/input", (event) => {
                this.command("write", event.data);
            });

            this.events.on("input/keydown", (event) => {
                if (["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End"].includes(event.key) && !this.selection.selectionActive) {
                    this.selection.setStartPos();
                    if (event.shiftKey) this.selection.setActive(true);
                }
                switch (event.key) {
                    case "ArrowRight":
                        if (this.selection.selectionActive && !event.shiftKey) {
                            if (this.selection.direction === "left") {
                                this.command("caret/moveTo", this.selection.startPos.logical.tw, this.selection.startPos.logical.lh);
                            }
                            this.selection.cancel();
                            this.view.update();
                        } else {
                            this.command("caret/moveHoriz", 1);
                        }
                        break;
                    case "ArrowLeft":
                        if (this.selection.selectionActive && !event.shiftKey) {
                            if (this.selection.direction === "right") {
                                this.command("caret/moveTo", this.selection.startPos.logical.tw, this.selection.startPos.logical.lh);
                            }
                            this.selection.cancel();
                            this.view.update();
                        } else {
                            this.command("caret/moveHoriz", -1);
                        }
                        break;
                    case "ArrowDown":
                        if (this.selection.selectionActive && !event.shiftKey) {
                            if (this.selection.direction === "left") {
                                this.command("caret/moveTo", this.selection.startPos.logical.tw, this.selection.startPos.logical.lh);
                            }
                            this.selection.cancel();
                            this.view.update();
                        }
                        this.command("caret/moveVert", 1);
                        break;
                    case "ArrowUp":
                        if (this.selection.selectionActive && !event.shiftKey) {
                            if (this.selection.direction === "right") {
                                this.command("caret/moveTo", this.selection.startPos.logical.tw, this.selection.startPos.logical.lh);
                            }
                            this.selection.cancel();
                            this.view.update();
                        }
                        this.command("caret/moveVert", -1);
                        break;
                    case "Enter":
                        this.command("nl");
                        break;
                    case "Backspace":
                        this.command("delete");
                        break;
                    case "Delete":
                        this.command("delete", 1);
                        break;
                    case "Tab":
                        event.preventDefault();
                        this.command("write", "    ");
                        break;
                    case "Home":
                        if (this.selection.selectionActive && !event.shiftKey) {
                            if (this.selection.direction === "right") {
                                this.command("caret/moveTo", this.selection.startPos.logical.tw, this.selection.startPos.logical.lh);
                            }
                            this.selection.cancel();
                            this.view.update();
                        } else {
                            this.command("caret/moveTo", 0, this.data.activeLine);
                        }
                        break;
                    case "End":
                        if (this.selection.selectionActive && !event.shiftKey) {
                            if (this.selection.direction === "right") {
                                this.command("caret/moveTo", this.selection.startPos.logical.tw, this.selection.startPos.logical.lh);
                            }
                            this.selection.cancel();
                            this.view.update();
                        } else {
                            this.command("caret/moveTo", this.data.active.logicalLength, this.data.activeLine);
                        }
                        break;
                }
                if (event.ctrlKey) {
                    switch (event.key) {
                        case "a":
                            this.selection.setStartPos(0, 0);
                            this.selection.setEndPos(this.data.lines[this.data.lines.length - 1].logicalLength, this.data.lines.length - 1);
                            this.selection.setActive(true);
                            this.view.update();
                            break;
                        case "c":
                            if (!this.selection.selectionActive) {
                                this.selection.setStartPos(0, this.data.activeLine);
                                this.selection.setEndPos(this.data.active.logicalLength, this.data.activeLine);
                                this.selection.setActive(true);
                            }
                            let startPos = this.selection.startPos.logical;
                            let endPos = this.selection.endPos.logical;
                            let content = this.data.selected(startPos.tw, startPos.lh, endPos.tw, endPos.lh).join("\n");
                            navigator.clipboard.writeText(content);
                            this.view.update();
                            break;
                    }
                }

                this.view.layer_caret.blinkReset();
            });

            this.events.on("mouse/move", (event) => {
                if (event.buttons === 1) {
                    if (!this.selection.selectionActive) this.selection.setStartPos();
                    this.selection.setActive(true);

                    let bbox = this.view.layers.getBoundingClientRect();
                    this.command("caret/moveToVisual", event.clientX - bbox.x, event.clientY - bbox.y);
                }
            });

            this.events.on("mouse/down", (event) => {
                if (!this.selection.selectionActive) this.selection.setStartPos();
                if (event.shiftKey) this.selection.setActive(true); else {
                    this.selection.cancel();
                }

                event.preventDefault();
                this.command("input/focus");
                this.view.layer_caret.blinkReset();

                let bbox = this.view.layers.getBoundingClientRect();
                this.command("caret/moveToVisual", event.clientX - bbox.x, event.clientY - bbox.y);

                if (event.detail % 3 === 2) {
                    this.events.trigger("mouse/dbl", event);
                }
                if (event.detail % 3 === 0) {
                    this.events.trigger("mouse/trpl", event);
                }
            });

            this.events.on("mouse/dbl", (event) => {
                let [x1, x2] = this.data.active.selectWord(this.caret.position.logical.tw);
                this.selection.setStartPos(x1, this.data.activeLine);
                this.selection.setEndPos(x2, this.data.activeLine);
                this.selection.setActive(true);
                this.view.update();
            });

            this.events.on("mouse/trpl", (event) => {
                this.selection.setStartPos(0, this.data.activeLine);
                this.selection.setEndPos(this.data.active.logicalLength, this.data.activeLine);
                this.selection.setActive(true);
                this.view.update();
            });


            this.events.on("window/resize", (event) => {

            });

            this.events.on("mouse/wheel", (event) => {
                this.view.scrollBy(event.deltaX, event.deltaY / 2);
            });
        }

        registerCommands() {
            // This is where all the logic unfolds
            this.command.registerCommand("write", (data) => {
                if (this.selection.selectionActive) {
                    this.command("deleteSelection");
                }
                data.replace("\t", "    ");
                data.split("\n").forEach((ln, i) => {
                    let line = this.data.active;
                    let position = this.caret.position.logical;

                    line.writeAt(position.tw, data);
                    this.command("caret/moveHoriz", data.length);

                });
                this.update_highlighted_tokens();
                this.view.render();
            });
            this.command.registerCommand("delete", (direction = -1) => {
                if (this.selection.selectionActive) {
                    return this.command("deleteSelection");
                }
                let line = this.data.active;
                let position = this.caret.position.logical;

                if (position.tw === 0 && direction === -1) {
                    this.command("deleteLine", line);
                } else if (position.tw === line.logicalLength && direction === 1) {
                    this.command("deleteLine", this.data.lines[this.data.activeLine + 1]);
                } else {
                    line.deleteAt(position.tw + direction, direction);

                    if (direction === -1) this.command("caret/moveHoriz", -1);
                    this.update_highlighted_tokens();
                    this.view.ensureCaretInView();
                    this.view.render();
                }
            });
            this.command.registerCommand("deleteLine", (line) => {
                let lineno = this.data.lineno(line);
                if (lineno === 0 || lineno === -1) return;

                let content = line.content;

                if (this.data.activeLine === lineno) {
                    this.data.activeLine--;
                }

                let prevLine = this.data.lines[lineno - 1];
                this.caret.setPosition("logical", prevLine.logicalLength, lineno - 1);
                prevLine.content += content;
                this.data.lines.splice(lineno, 1);

                this.update_highlighted_tokens();
                this.view.ensureCaretInView();
                this.view.render();
            });
            this.command.registerCommand("deleteSelection", () => {
                let sx = this.selection.startPos.logical.tw, sy = this.selection.startPos.logical.lh;
                let ex = this.selection.endPos.logical.tw, ey = this.selection.endPos.logical.lh;
                let startLine = this.data.lines[sy];
                let endLine = this.data.lines[ey];

                if (sy === ey) {
                    sx > ex && ([sx, ex] = [ex, sx]);
                    this.data.lines[sy].remove(sx, ex);
                    this.caret.setPosition("logical", sx, sy);
                } else {
                    if (sy > ey) {
                        [startLine, endLine] = [endLine, startLine];
                        [sx, ex] = [ex, sx];
                        [sy, ey] = [ey, sy];
                    }
                    startLine.remove(sx, startLine.logicalLength);
                    let content = endLine.slice(ex, "right");
                    startLine.append(content);
                    this.data.lines.splice(sy + 1, ey - sy);
                    this.caret.setPosition("logical", sx, sy);
                }

                this.selection.cancel();
                this.update_highlighted_tokens();
                this.view.ensureCaretInView();
                this.view.render();
            });
            this.command.registerCommand("nl", () => {
                let line = this.data.lines[this.data.activeLine];
                let content = line.slice(this.caret.position.logical.tw);

                this.data.lines.splice(++this.data.activeLine, 0, new e.Line(content));

                this.caret.setPosition("logical", 0, this.data.activeLine);
                this.update_highlighted_tokens();
                this.view.ensureCaretInView();
                this.view.render();
            });

            this.command.registerCommand("input/focus", () => {
                this.view.focus();
            });

            this.command.registerCommand("caret/moveHoriz", (n) => {
                let newPos = this.caret.position.logical.tw + n;
                if (newPos < 0) {
                    this.command("caret/moveVert", -1, "end");
                } else if (newPos > this.data.active.logicalLength) {
                    this.command("caret/moveVert", 1, "begin");
                } else {
                    this.caret.setPosition("logical", newPos, this.data.activeLine);
                    this.view.ensureCaretInView();
                    this.view.render();
                }
                this.caret.vertMovementPos = 0;
            });
            this.command.registerCommand("caret/moveVert", (n, anchor) => {
                let newLinePos = this.data.activeLine + n;
                if (newLinePos < 0 || newLinePos > this.data.lines.length - 1) return this.view.layer_caret.blinkReset();

                this.caret.setVertMovementPos();
                this.data.activeLine = newLinePos;

                if (anchor === "begin") {
                    this.caret.setPosition("logical", 0, newLinePos);
                } else if (anchor === "end") {
                    this.caret.setPosition("logical", this.data.active.logicalLength, newLinePos);
                } else {
                    this.caret.setPosition("logical", Math.min(this.data.active.logicalLength, this.caret.vertMovementPos), newLinePos);
                }
                this.view.ensureCaretInView();
                this.view.render();
            });
            this.command.registerCommand("caret/moveTo", (tw, lh) => {
                lh = Math.max(0, Math.min(this.data.lines.length - 1, lh));
                tw = Math.max(0, Math.min(this.data.lines[lh].logicalLength, tw));
                this.caret.setPosition("logical", tw, lh);
                this.view.update();
                this.caret.vertMovementPos = 0;
            });
            this.command.registerCommand("caret/moveToVisual", (x, y) => {
                let lh = Math.max(0, Math.min(this.data.lines.length - 1, Math.floor((y + this.view.scroll.scrollY) / this.C.get("view.line.height"))));
                let tw = Math.round((this.view.scroll.scrollX + x - this.data.lines[lh].getVisualOffsetFromVisual(this.view.scroll.scrollX + x)) / this.C.get("view.line.charSize"));
                this.command("caret/moveTo", tw, lh);
            });
        }

        markError(err) {
            let start = err.loc[0];

            while (start <= err.loc[2]) {
                this.view.markError(start++, err);
            }
        }

        resetErrors() {
            this.view.resetErrors();
        }

        update_highlighted_tokens() {
            let text = this.data.textContent;
            this.highlighted_tokens = e.parser.highlighter.highlight(this, text, "js");
        }
    }

    e.Line = Line;
    e.Caret = Caret;
    e.Selection = Selection;
    e.EditorData = EditorData;
    e.Editor = Editor;

    window.editor = {
        __handle: 0, create: function (root) {
            if (document.readyState !== "complete") {
                throw ": Editor cannot be created before the document is ready.";
            }
            return new Editor(this.__handle++, root);
        }
    }
}(window.EDITOR || (window.EDITOR = {}));