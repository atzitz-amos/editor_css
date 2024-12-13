!function (e) {
    e.parser.languages.js = {
        tokenize: function (tk) {
            let result;
            let t;

            let TT = e.parser.TokenTypes;

            while (!result) {
                if (tk.src.value.length === 0) {
                    return new e.parser.Token(TT.EOF, "", [tk.crow, tk.ccol, tk.crow, tk.ccol]);
                }
                let c = tk.src.seek();

                switch (c) {
                    case " ":
                    case "\n":
                        t = tk.resolveIdentifiers();
                        if (t !== null) return t;
                        break;

                    case "=":
                        t = tk.resolveIdentifiers();
                        if (t !== null) return t;

                        let q = tk.collect(x => x === "=");
                        if (q === "=") {
                            return new e.parser.Token(TT.EQ, "=", [tk.crow, tk.ccol - 1, tk.crow, tk.ccol]);
                        } else {
                            return new e.parser.Token(TT.COMPARISON, q, [tk.crow, tk.ccol - q.length, tk.crow, tk.ccol]);
                        }

                    case ">":
                    case "<":
                        t = tk.resolveIdentifiers();
                        if (t !== null) return t;

                        if (tk.src.seekNext() === "=") {
                            tk.src.consume();
                            result = new e.parser.Token(TT.COMPARISON, c + "=", [tk.crow, tk.ccol - 1, tk.crow, tk.ccol + 1]);
                        } else {
                            result = new e.parser.Token(TT.COMPARISON, c, [tk.crow, tk.ccol, tk.crow, tk.ccol + 1]);
                        }
                        break;

                    case "+":
                    case "-":
                    case "*":
                    case "/":
                    case "%":
                    case "&":
                    case "|":
                    case "^":
                    case "!":
                    case "~":
                        t = tk.resolveIdentifiers();
                        if (t !== null) return t;

                        if (c === "-" && tk.src.seekNext() === ">") {
                            tk.src.consume();
                            tk.src.consume();
                            return new e.parser.Token(TT.ARROW, "->", [tk.crow, tk.ccol - 2, tk.crow, tk.ccol]);
                        }

                        let end = tk.crow + 1;
                        let type = TT.OPERATOR;

                        if ((c === "*" || c === "|" || c === "&") && tk.src.seekNext() === c) {
                            tk.src.consume();
                            c += c;

                            end++;
                        }
                        if (tk.src.seekNext() === "=") {
                            tk.src.consume();
                            type = TT.OP_EQ;
                            c += "=";

                            end++;
                        }
                        result = new e.parser.Token(type, c, [tk.crow, tk.ccol, tk.crow, end]);
                        break;

                    case "(":
                        t = tk.resolveIdentifiers();
                        if (t !== null) return t;
                        result = new e.parser.Token(TT.OPEN_PAREN, c, [tk.crow, tk.ccol, tk.crow, tk.ccol + 1]);
                        break;

                    case ")":
                        t = tk.resolveIdentifiers();
                        if (t !== null) return t;
                        result = new e.parser.Token(TT.CLOSE_PAREN, c, [tk.crow, tk.ccol, tk.crow, tk.ccol + 1]);
                        break;

                    case "{":
                        t = tk.resolveIdentifiers();
                        if (t !== null) return t;
                        result = new e.parser.Token(TT.OPEN_BRACE, c, [tk.crow, tk.ccol, tk.crow, tk.ccol + 1]);
                        break;

                    case "}":
                        t = tk.resolveIdentifiers();
                        if (t !== null) return t;
                        result = new e.parser.Token(TT.CLOSE_BRACE, c, [tk.crow, tk.ccol, tk.crow, tk.ccol + 1]);
                        break;

                    case "[":
                        t = tk.resolveIdentifiers();
                        if (t !== null) return t;
                        result = new e.parser.Token(TT.OPEN_BRACKET, c, [tk.crow, tk.ccol, tk.crow, tk.ccol + 1]);
                        break;

                    case "]":
                        t = tk.resolveIdentifiers();
                        if (t !== null) return t;
                        result = new e.parser.Token(TT.CLOSE_BRACKET, c, [tk.crow, tk.ccol, tk.crow, tk.ccol + 1]);
                        break;

                    case ";":
                        t = tk.resolveIdentifiers();
                        if (t !== null) return t;
                        result = new e.parser.Token(TT.SEMICOLON, c, [tk.crow, tk.ccol, tk.crow, tk.ccol + 1]);
                        break;

                    case ",":
                        t = tk.resolveIdentifiers();
                        if (t !== null) return t;
                        result = new e.parser.Token(TT.COMMA, c, [tk.crow, tk.ccol, tk.crow, tk.ccol + 1]);
                        break;

                    case ".":
                        t = tk.resolveIdentifiers();
                        if (t !== null) return t;
                        result = new e.parser.Token(TT.DOT, c, [tk.crow, tk.ccol, tk.crow, tk.ccol + 1]);
                        break;

                    case "'":
                    case '"':
                    case "`":
                        t = tk.resolveIdentifiers();
                        if (t !== null) return t;

                        let n = tk.src.find(c);
                        if (n === -1) {
                            throw "Error: unterminated string";
                        }
                        result = new e.parser.Token(TT.LITERAL, tk.src.slice(n), [tk.crow, tk.ccol, tk.crow, tk.ccol + n]);
                        tk.src.jump(n + 1);
                        break;
                    default:
                        if (!Number.isNaN(c) && tk.src.cache === "") {
                            t = tk.resolveIdentifiers();
                            if (t !== null) return t;

                            let num = tk.collect(x => !Number.isNaN(x));
                            return new e.parser.Token(TT.NUMBER, num, [tk.crow, tk.ccol - num.length, tk.crow, tk.ccol]);
                        } else {
                            tk.src.save();
                        }
                }

                tk.src.consume();
            }
            return result;
        },
        isKeyword: function (word) {
            return ["abstract", "arguments", "await", "boolean", "break", "byte", "case", "catch", "char", "class", "const", "continue", "debugger", "default", "delete", "do", "double", "else", "enum", "eval", "export", "extends", "false", "final", "finally", "float", "for", "function", "goto", "if", "implements", "import", "in", "instanceof", "int", "interface", "let", "long", "native", "new", "null", "package", "private", "protected", "public", "return", "short", "static", "super", "switch", "synchronized", "this", "throw", "throws", "transient", "true", "try", "typeof", "var", "void", "volatile", "while", "with", "yield"].includes(word);
        }
    }
}(window.EDITOR || (window.EDITOR = {}));