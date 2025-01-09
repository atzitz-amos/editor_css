!function (e) {
    e.parser.highlighter = {
        lang: {
            "js": e.parser.languages.js
        },
        _render: function (tokens) {
            let result = [];
            for (let tk of tokens) {
                if (tk.type === "group") {
                    result.push(new e.components.TokenGroup(this._render(tk.tokens), tk.loc[1], ["hi-group"], tk.role));
                } else {
                    result.push(new e.components.HighlightedToken(tk.value, tk.loc[1], {
                        class_: "hi-" + tk.type,
                        type: tk.type,
                        role: tk.role
                    }, [], tk.role));
                }
            }
            return result;
        },
        fillTheBlanks: function (result, text, last = null, until = true) {
            let final = [];
            last ??= 0;
            for (let j = 0; j < result.length; j++) {
                let token = result[j];
                if (token instanceof e.components.TokenGroup) {
                    token.tokens = this.fillTheBlanks(token.tokens, text, last, false);
                    final.push(token);
                    last = token.tokens[token.tokens.length - 1].position + token.tokens[token.tokens.length - 1].length;
                } else {
                    if (last < token.position) {
                        final.push(new e.components.Text(text.substring(last, token.position), last));
                    }
                    final.push(token);
                    last = token.position + token.length;
                }
            }
            if (until && last < text.length) {
                final.push(new e.components.Text(text.substring(last), last));
            }
            return final.length === 0 ? [new e.components.Text(text, 0)] : final;
        },
        highlight_AST: function (text, parser) {
            let result = [];
            let AST = parser.parseBlock();

            for (let nd of AST) {
                let tokenGroup = new e.components.TokenGroup(this._render(nd.tokens), nd.loc[1], ["hi-stmt", "stmt-" + nd.type]);
                result = result.concat(tokenGroup);
            }

            return this.fillTheBlanks(result, text);
        },
        highlight_TOKENS: function (text, lang) {
            if (typeof lang === "string") {
                lang = this.lang[lang];
            }

            let result = [];
            let tk = e.parser.createTokenizer(lang, text);

            while (true) {
                let t = tk.consume();
                if (t.type === e.parser.TokenTypes.EOF) {
                    break;
                }
                result.push(new e.components.HighlightedToken(t.value, t.loc[1], {
                    class_: "hi-" + t.type,
                    type: t.type
                }));
            }

            let final = [];
            let last = 0;
            for (let j = 0; j < result.length; j++) {
                let token = result[j];
                if (last < token.position) {
                    final.push(new e.components.Text(text.substring(last, token.position), last));
                }
                final.push(token);
                last = token.position + token.length;
            }
            if (last < text.length) {
                final.push(new e.components.Text(text.substring(last), last));
            }
            return final.length === 0 ? [new e.components.Text(text, 0)] : final;
        },
        highlight: function (editor, text, lang) {
            if (typeof lang === "string") {
                lang = this.lang[lang];
            }

            editor.resetErrors();

            let parser = e.parser.createParser(lang, text);
            try {
                let highlighted = this.highlight_AST(text, parser);
                parser.errors.forEach(err => editor.markError(err));
                return highlighted;
            } catch (e) {
                return this.highlight_TOKENS(text, lang);
            }
        }
    }
}(window.EDITOR || (window.EDITOR = {}));