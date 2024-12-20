!function (e) {
    e.parser = {};
    e.parser.Token = class {
        constructor(type, value, loc) {
            this.type = type;
            this.value = value;
            this.loc = loc;
        }
    };
    e.parser.TokenTypes = {
        EOF: "EOF",
        EOL: "EOL",
        EQ: "EQ",
        IDENTIFIER: "IDENTIFIER",
        KEYWORD: "KEYWORD",
        LITERAL: "STRING",
        NUMBER: "NUMBER",
        OPERATOR: "OPERATOR",
        OP_EQ: "OP_EQ",
        OP_LOGICAL: "OP_LOGICAL",
        COMPARISON: "COMPARISON",
        ARROW: "ARROW",
        COMMA: "COMMA",
        COLON: "COLON",
        SEMICOLON: "SEMICOLON",
        DOT: "DOT",
        OPEN_PAREN: "OPEN_PAREN",
        CLOSE_PAREN: "CLOSE_PAREN",
        OPEN_BRACE: "OPEN_BRACE",
        CLOSE_BRACE: "CLOSE_BRACE",
        OPEN_BRACKET: "OPEN_BRACKET",
        CLOSE_BRACKET: "CLOSE_BRACKET",
    }
    e.parser.Source = class {
        crow = 0;
        ccol = 0;
        cacheRow = 0;
        cacheCol = 0;
        cache = "";

        constructor(src) {
            this.initial = src;
            this.value = src;
        }

        consume() {
            if (this.value.length === 0) return null;
            let ch = this.value[0];
            if (ch === "\n") {
                this.crow++;
                this.ccol = 0;
            } else {
                this.ccol++;
            }
            this.value = this.value.slice(1);
            return ch;
        }

        save() {
            if (this.cache === "") {
                this.cacheRow = this.crow;
                this.cacheCol = this.ccol;
            }
            this.cache += this.seek();
        }

        clearCache() {
            let c = this.cache;
            this.cache = "";
            return c;
        }

        seek() {
            return this.value[0];
        }

        seekNext() {
            return this.value[1];
        }

        find(c) {
            return this.value.indexOf(c, 1);
        }

        slice(end) {
            return this.value.slice(0, end);
        }

        jump(n) {
            this.value = this.value.slice(n);
            this.ccol += n;
        }

        push(c) {
            this.value = c + this.value;
        }

    }

    e.parser.createTokenizer = (lang, code) => {
        return {
            lang: lang,
            src: new e.parser.Source(code),
            pos: 0,
            index: 0,
            tokens: [],
            resolveIdentifiers: function () {
                if (this.src.cache !== "") {
                    let cache = this.src.clearCache();
                    if (lang.isKeyword(cache)) {
                        return new e.parser.Token(e.parser.TokenTypes.KEYWORD, cache, [this.src.cacheRow, this.src.cacheCol, this.src.crow, this.src.ccol]);
                    } else {
                        return new e.parser.Token(e.parser.TokenTypes.IDENTIFIER, cache, [this.src.cacheRow, this.src.cacheCol, this.src.crow, this.src.ccol]);
                    }
                }
                return null;
            },
            collect: function (predicate) {
                let result = "";
                while (this.src.value !== "" && predicate(this.src.seek())) {
                    result += this.src.consume();
                }
                return result;
            },

            seek: function () {
                return this.lookAhead(1);
            },
            lookAhead: function (d) {
                while (this.tokens.length < this.index + d) {
                    this.tokens.push(this.lang.tokenize(this));
                }
                return this.tokens[this.index + d - 1];
            },
            consume: function () {
                let t = this.seek();
                this.index++;
                return t;
            },
            lookBehind: function (d = 1) {
                return this.tokens[this.index - d];
            }
        };
    };
    e.parser.createParser = (lang, code) => {
        return new lang.parser(e.parser.createTokenizer(lang, code));
    }

    e.parser.languages = {};

}(window.EDITOR || (window.EDITOR = {}));