!function (e) {
    e.parser.languages.js = {
        tokenize: function (tk) {
            let result;
            let t;

            let TT = e.parser.TokenTypes;

            while (!result) {
                if (tk.src.value.length === 0) {
                    if ((t = tk.resolveIdentifiers())) {
                        return t;
                    }
                    return new e.parser.Token(TT.EOF, "", [tk.src.crow, tk.src.ccol, tk.src.crow, tk.src.ccol]);
                }
                let c = tk.src.seek();

                switch (c) {
                    case " ":
                    case "\n":
                        t = tk.resolveIdentifiers();
                        if (t !== null) return t;
                        if (c === "\n") {
                            result = new e.parser.Token(TT.EOL, c, [tk.src.crow, tk.src.ccol, tk.src.crow, tk.src.ccol + 1]);
                        }
                        break;

                    case "=":
                        t = tk.resolveIdentifiers();
                        if (t !== null) return t;

                        let q = tk.collect(x => x === "=");
                        if (q === "=") {
                            if (tk.src.seek() === ">") {
                                tk.src.consume();
                                return new e.parser.Token(TT.ARROW, "=>", [tk.src.crow, tk.src.ccol - 2, tk.src.crow, tk.src.ccol]);
                            }
                            return new e.parser.Token(TT.EQ, "=", [tk.src.crow, tk.src.ccol - 1, tk.src.crow, tk.src.ccol]);
                        } else {
                            return new e.parser.Token(TT.COMPARISON, q, [tk.src.crow, tk.src.ccol - q.length, tk.src.crow, tk.src.ccol]);
                        }

                    case ">":
                    case "<":
                        t = tk.resolveIdentifiers();
                        if (t !== null) return t;

                        if (tk.src.seekNext() === "=") {
                            tk.src.consume();
                            result = new e.parser.Token(TT.COMPARISON, c + "=", [tk.src.crow, tk.src.ccol - 1, tk.src.crow, tk.src.ccol + 1]);
                        } else {
                            result = new e.parser.Token(TT.COMPARISON, c, [tk.src.crow, tk.src.ccol, tk.src.crow, tk.src.ccol + 1]);
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

                        let start = tk.src.ccol;
                        let end = tk.src.ccol + 1;
                        let type = TT.OPERATOR;

                        if (c === "|" || c === "&" || c === "^") {
                            type = TT.OP_LOGICAL;
                        }
                        if ((c === "*" || c === "|" || c === "&" || c === "-" || c === "+") && tk.src.seekNext() === c) {
                            tk.src.consume();
                            c += c;

                            start--;
                        }
                        if (tk.src.seekNext() === "=") {
                            tk.src.consume();
                            type = TT.OP_EQ;
                            c += "=";

                            start--;
                        }
                        result = new e.parser.Token(type, c, [tk.src.crow, start, tk.src.crow, end]);
                        break;

                    case "(":
                        t = tk.resolveIdentifiers();
                        if (t !== null) return t;
                        result = new e.parser.Token(TT.OPEN_PAREN, c, [tk.src.crow, tk.src.ccol, tk.src.crow, tk.src.ccol + 1]);
                        break;

                    case ")":
                        t = tk.resolveIdentifiers();
                        if (t !== null) return t;
                        result = new e.parser.Token(TT.CLOSE_PAREN, c, [tk.src.crow, tk.src.ccol, tk.src.crow, tk.src.ccol + 1]);
                        break;

                    case "{":
                        t = tk.resolveIdentifiers();
                        if (t !== null) return t;
                        result = new e.parser.Token(TT.OPEN_BRACE, c, [tk.src.crow, tk.src.ccol, tk.src.crow, tk.src.ccol + 1]);
                        break;

                    case "}":
                        t = tk.resolveIdentifiers();
                        if (t !== null) return t;
                        result = new e.parser.Token(TT.CLOSE_BRACE, c, [tk.src.crow, tk.src.ccol, tk.src.crow, tk.src.ccol + 1]);
                        break;

                    case "[":
                        t = tk.resolveIdentifiers();
                        if (t !== null) return t;
                        result = new e.parser.Token(TT.OPEN_BRACKET, c, [tk.src.crow, tk.src.ccol, tk.src.crow, tk.src.ccol + 1]);
                        break;

                    case "]":
                        t = tk.resolveIdentifiers();
                        if (t !== null) return t;
                        result = new e.parser.Token(TT.CLOSE_BRACKET, c, [tk.src.crow, tk.src.ccol, tk.src.crow, tk.src.ccol + 1]);
                        break;

                    case ";":
                        t = tk.resolveIdentifiers();
                        if (t !== null) return t;
                        result = new e.parser.Token(TT.SEMICOLON, c, [tk.src.crow, tk.src.ccol, tk.src.crow, tk.src.ccol + 1]);
                        break;

                    case ",":
                        t = tk.resolveIdentifiers();
                        if (t !== null) return t;
                        result = new e.parser.Token(TT.COMMA, c, [tk.src.crow, tk.src.ccol, tk.src.crow, tk.src.ccol + 1]);
                        break;

                    case ".":
                        t = tk.resolveIdentifiers();
                        if (t !== null) return t;
                        result = new e.parser.Token(TT.DOT, c, [tk.src.crow, tk.src.ccol, tk.src.crow, tk.src.ccol + 1]);
                        break;

                    case ":":
                        t = tk.resolveIdentifiers();
                        if (t !== null) return t;
                        result = new e.parser.Token(TT.COLON, c, [tk.src.crow, tk.src.ccol, tk.src.crow, tk.src.ccol + 1]);
                        break;

                    case "'":
                    case '"':
                    case "`":
                        t = tk.resolveIdentifiers();
                        if (t !== null) return t;

                        let n = tk.src.find(c);
                        if (n === -1) {
                            // Just consume the rest of the file
                            result = new e.parser.Token(TT.LITERAL, tk.src.value, [tk.src.crow, tk.src.ccol, tk.src.crow, tk.src.ccol + tk.src.value.length]);
                            tk.src.jump(tk.src.value.length);
                            return result;
                        }
                        result = new e.parser.Token(TT.LITERAL, tk.src.slice(n + 1), [tk.src.crow, tk.src.ccol, tk.src.crow, tk.src.ccol + n + 1]);
                        tk.src.jump(n);
                        break;
                    default:
                        if (["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].includes(c) && tk.src.cache === "") {
                            let num = tk.collect(x => ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].includes(x));
                            return new e.parser.Token(TT.NUMBER, num, [tk.src.crow, tk.src.ccol - num.length, tk.src.crow, tk.src.ccol]);
                        } else {
                            tk.src.save();
                        }
                }

                tk.src.consume();
            }
            return result;
        },
        isKeyword: function (word) {
            return ["async", "abstract", "arguments", "await", "boolean", "break", "byte", "case", "catch", "char", "class", "const", "continue", "debugger", "default", "delete", "do", "double", "else", "enum", "eval", "export", "extends", "false", "final", "finally", "float", "for", "function", "goto", "if", "implements", "import", "in", "instanceof", "int", "interface", "let", "long", "native", "new", "null", "package", "private", "protected", "public", "return", "short", "static", "super", "switch", "synchronized", "this", "throw", "throws", "transient", "true", "try", "typeof", "var", "void", "volatile", "while", "with", "yield"].includes(word);
        }
    }

    const TT = e.parser.TokenTypes;

    e.parser.languages.js.parser = class {
        tokens = [];
        errors = [];

        current = [];
        _stack = [];

        constructor(tk) {
            this.tk = tk;
        }

        newScope(name, type) {
        }

        closeScope() {

        }

        newASTContext() {
            this._stack.push(this.current);
            this.current = [];
        }

        dropASTContext() {
            if (this.current.length >= 2) return;
            if (this.current.length === 1) {
                let old = this.current[0];
                this._stack[this._stack.length - 1].push(old);
            }
            this.current = this._stack.pop();
        }

        closeASTContext(type) {

        }

        mergeAndFlattenASTContext(type, obj, req) {
            let result = [];
            // Flatten
            let j = 0;
            for (let i = 0; i < this.current.length; i++) {
                let x = this.current[i];
                if (x.type === "group") {
                    x = x.tokens;
                }
                if (Array.isArray(x)) {
                    req ??= Object.keys(obj);
                    result.push({
                        type: "group",
                        role: req[j++] ?? "decorate",
                        tokens: x,
                        loc: [x[0].loc[0], x[0].loc[1], x[x.length - 1].loc[2], x[x.length - 1].loc[3]]
                    });
                } else {
                    result.push(x);
                }
            }
            // Merge
            let superCtx = this._stack.pop();
            superCtx.push({
                type: "group",
                role: type,
                tokens: result
            });
            this.current = superCtx;
            return result;
        }

        buildAST(type, obj, req) {
            let tokens = this.mergeAndFlattenASTContext(type, obj, req);
            return {
                type: type,
                tokens: tokens,
                loc: [tokens[0].loc[0], tokens[0].loc[1], tokens[tokens.length - 1].loc[2], tokens[tokens.length - 1].loc[3]],
                ...obj,
            };
        }

        markError(msg, type, loc) {
            // Skip 'till EOL or EOF
            // console.error(`Error '${type}' [${msg}] on line ` + loc[0] + " at column " + loc[1]);
            this.errors.push({
                loc: loc,
                type: type,
                message: msg
            })

            while (this.seek(true).type !== TT.EOL && this.seek().type !== TT.EOF) {
                this.consume();
            }

            throw "InterruptError";
        }

        seek(showEOL = false) {
            let x = this.tk.seek();
            if (x.type === TT.EOL && !showEOL) {
                this.consume();
                return this.seek();
            }
            return x;
        }

        consume(role = "decorate") {
            let t = this.tk.consume();
            this.tokens.push(t);
            this.current.push({
                role: role,
                loc: t.loc,
                type: t.type,
                value: t.value
            });
            return t;
        }

        eat(type, role = "decorate") {
            let t = this.consume(role);
            if (t.type === TT.EOL && type !== TT.EOL) {
                return this.eat(type, role);
            }
            if (t.type !== type) {
                this.markError("Expected " + type + " but got " + t.type, "SyntaxError", t.loc);
            }
            return t;
        }

        expectSemicolon() {
            if (this.seek().type !== TT.SEMICOLON) {
                this.markError("Expected semicolon", "SyntaxError", this.seek().loc);
            }
            this.eat(TT.SEMICOLON);
        }

        parseBlock() {
            let result = [];
            let t;
            while ((t = this.tk.seek()).type !== e.parser.TokenTypes.EOF && t.type !== TT.CLOSE_BRACE) {
                try {
                    if (t.type !== TT.EOL) {
                        result.push(this.parse(t));
                    } else {
                        this.consume();
                    }
                } catch (e) {
                    if (e !== "InterruptError") {
                        throw e;
                    }
                }
            }
            return result;
        }

        parse(t) {
            let result;

            if (t.type === TT.KEYWORD) {
                switch (t.value) {
                    case "async":
                    case "function":
                        result = this.parseFunctionDecl();
                        break;
                    case "if":
                        result = this.parseIfGroup();
                        break;
                    case "else":
                        this.markError("'else' token without preceding 'if' clause", "SyntaxError", t.loc);
                        break;
                    case "while":
                        result = this.parseWhile();
                        break;
                    case "for":
                        result = this.parseFor();
                        break;
                    case "switch":
                        result = this.parseSwitch();
                        break;
                    case "try":
                        result = this.parseTry();
                        break;
                    case "class":
                        // TODO: result = this.parseClassDecl();
                        break;
                    case "this":
                        this.newASTContext();
                        this.consume();
                        result = this.buildAST("This", {})
                        break;
                    default:
                        return this.parseStmt(t);
                }
            }
            return result ?? this.parseStmt(t);
        }

        parseStmt(t) {
            let result;
            if (t.type === TT.KEYWORD) {
                switch (t.value) {
                    case "let":
                        result = this.parseVariable("let");
                        break;
                    case "var":
                        result = this.parseVariable("var");
                        break;
                    case "const":
                        result = this.parseVariable("const");
                        break;
                    case "return":
                        result = this.parseReturn();
                        break;
                    case "break":
                        result = this.parseBreak();
                        break;
                    case "continue":
                        result = this.parseContinue();
                        break;
                    case "throw":
                        result = this.parseThrow();
                        break;
                    default:
                        this.markError("Unexpected token", "SyntaxError", t.loc);
                }
            } else if (t.type === TT.SEMICOLON) {
                this.eat(TT.SEMICOLON);
                return null;
            } else {
                result = this.parseExpr();
                return result;
            }

            return result;
        }

        parseFunctionDecl() {
            this.newASTContext();

            let isAsync = false
                , name
                , params
                , body;
            let firstToken, lastToken;

            while (this.seek().type === TT.KEYWORD) {
                if (!firstToken) {
                    firstToken = this.seek();
                }
                if (this.seek().value === "async") {
                    isAsync = true;
                    this.eat(TT.KEYWORD);
                } else if (this.seek().value === "function") {
                    this.eat(TT.KEYWORD);
                } else {
                    this.markError("Unexpected token", "SyntaxError", this.seek().loc);
                }
            }
            if (!firstToken) {
                this.markError("Expected 'function' keyword", "SyntaxError", this.seek().loc);
            }

            name = this.eat(TT.IDENTIFIER, "name");
            this.eat(TT.OPEN_PAREN);
            params = this.parseParameterList();
            this.eat(TT.CLOSE_PAREN);

            this.eat(TT.OPEN_BRACE);
            body = this.parseBlock();

            return this.buildAST("FunctionDecl", {
                isAsync: isAsync,
                isInline: false,
                isAnonymous: false,
                name: name,
                params: params,
                body: body
            }, ["params", "body"]);

        }

        parseParameterList() {
            this.newASTContext();
            let params = [];

            let t;
            while ((t = this.seek()).type !== TT.CLOSE_PAREN) {
                if (t.type === TT.DOT) {
                    this.eat(TT.DOT);
                    this.eat(TT.DOT);
                    this.eat(TT.DOT);
                    let name = this.eat(TT.IDENTIFIER, "name");
                    params.push(this.buildAST("Parameter", {
                        name: name,
                        init: null,
                        isRest: true
                    }));
                    if (this.seek().type !== TT.CLOSE_PAREN) {
                        this.markError("Rest parameter must be the last parameter", "SyntaxError", this.seek().loc);
                    }
                } else {
                    let name = this.eat(TT.IDENTIFIER, "name");
                    let init;
                    if (this.seek().type === TT.EQ) {
                        this.eat(TT.EQ);
                        init = this.parseExpr_L0();
                    }
                    params.push(this.buildAST("Parameter", {
                        name: name,
                        init: init,
                        isRest: false
                    }));
                    if (this.seek().type === TT.COMMA) {
                        this.eat(TT.COMMA);
                    }
                }
            }
            return params;
        }

        parseVariable(type, requireSemicolon = true) {
            this.newASTContext();
            this.eat(TT.KEYWORD);
            let name = this.eat(TT.IDENTIFIER, "name");
            let init;
            if (this.seek().type === TT.EQ) {
                this.eat(TT.EQ);
                init = this.parseExpr();
            }
            requireSemicolon && this.expectSemicolon();

            return this.buildAST("VariableDecl", {
                kind: type,
                name: name,
                init: init
            }, ["init"]);
        }

        parseBody(startToken, type, obj, req = []) {
            let body;
            if (this.seek().type === TT.OPEN_BRACE) {
                this.eat(TT.OPEN_BRACE);
                body = this.parseBlock();
                return this.buildAST(type, {
                    body: body,
                    ...obj
                }, [...req, "body"]);
            } else if (this.seek().type === TT.SEMICOLON) {
                this.eat(TT.SEMICOLON);
                return this.buildAST(type, {
                    body: [],
                    ...obj
                }, req);
            } else {
                body = [this.parseStmt(this.seek())];
                return this.buildAST(type, {
                    body: body,
                    ...obj
                }, [...req, "body"]);
            }
        }

        parseIfGroup() {
            this.newASTContext();

            let ifStmts = [this.parseIf()];
            while (this.seek().type === TT.KEYWORD && this.seek().value === "else") {
                this.eat(TT.KEYWORD);
                if (this.seek().type === TT.KEYWORD && this.seek().value === "if") {
                    ifStmts.push(this.parseIf());
                } else {
                    ifStmts.push(this.parseElse());
                }
            }
            return ifStmts.length === 1 ? ifStmts[0] : this.buildAST("IfGroup", {
                ifStmts: ifStmts
            });
        }

        parseElse() {
            this.newASTContext();

            let body, startToken, lastToken;

            startToken = this.eat(TT.KEYWORD);
            return this.parseBody(startToken, "ElseStmt", {});
        }

        parseIf() {
            this.newASTContext();

            let body, startToken, lastToken;

            startToken = this.eat(TT.KEYWORD);
            this.eat(TT.OPEN_PAREN);
            let cond = this.parseExpr();
            this.eat(TT.CLOSE_PAREN);

            return this.parseBody(startToken, "IfStmt", {cond: cond}, ["cond"]);
        }

        parseWhile() {
            this.newASTContext();

            let body, startToken, lastToken;
            startToken = this.eat(TT.KEYWORD);
            this.eat(TT.OPEN_PAREN);
            let cond = this.parseExpr();
            this.eat(TT.CLOSE_PAREN);

            return this.parseBody(startToken, "WhileStmt", {cond: cond});
        }

        parseFor() {
            this.newASTContext();

            let startToken = this.eat(TT.KEYWORD);
            this.eat(TT.OPEN_PAREN);

            let decl = this.parseVariable(this.seek().value, false);

            if (this.seek().type === TT.SEMICOLON) {
                this.eat(TT.SEMICOLON);
                let cond = this.parseExpr();
                this.eat(TT.SEMICOLON);
                let incr = this.parseExpr();
                this.eat(TT.CLOSE_PAREN);

                return this.parseBody(startToken, "ForIStmt", {
                    decl: decl,
                    cond: cond,
                    incr: incr
                }, ["decl", "cond", "incr"]);
            }

            let keyword = this.eat(TT.KEYWORD).value;
            if (keyword === "in") {
                let iter = this.parseExpr();
                this.eat(TT.CLOSE_PAREN);

                return this.parseBody(startToken, "ForInStmt", {decl: decl, in_: iter}, ["decl", "in_clause"]);
            } else if (keyword === "of") {
                let iter = this.parseExpr();
                this.eat(TT.CLOSE_PAREN);

                return this.parseBody(startToken, "ForOfStmt", {decl: decl, of_: iter}, ["decl", "of_clause"]);
            }
            this.markError("Unexpected token", "SyntaxError", this.seek().loc);
        }

        parseReturn() {
            this.newASTContext();

            let expr = null;
            if (this.seek().type !== TT.SEMICOLON) {
                expr = this.parseExpr();
            }
            this.expectSemicolon();
            return this.buildAST("ReturnStmt", {
                expr: expr
            });
        }

        parseBreak() {
            this.newASTContext();

            this.expectSemicolon();
            return this.buildAST("BreakStmt", {});
        }

        parseContinue() {
            this.newASTContext();

            this.expectSemicolon();
            return this.buildAST("ContinueStmt", {});
        }

        parseSwitch() {
            this.newASTContext();

            this.eat(TT.OPEN_PAREN);
            let expr = this.parseExpr();
            this.eat(TT.CLOSE_PAREN);
            this.eat(TT.OPEN_BRACE);
            let body = this.parseSwitchBody();
            this.eat(TT.CLOSE_BRACE);
            return this.buildAST("SwitchStmt", {
                expr: expr,
                ...body
            }, ["expr", "body"]);
        }

        parseSwitchBody() {
            this.newASTContext();

            let cases = [];
            let body = [];
            let t, i = 0;
            while ((t = this.seek()).type !== TT.CLOSE_BRACE) {
                if (t.type === TT.KEYWORD && t.value === "case") {
                    this.eat(TT.KEYWORD);
                    cases.push(this.buildAST("CaseStmt", {
                        expr: this.parseExpr(),
                        pos: i
                    }, ["expr"]));
                    this.eat(TT.COLON);
                } else if (t.type === TT.KEYWORD && t.value === "default") {
                    this.eat(TT.KEYWORD);
                    cases.push(this.buildAST("DefaultStmt", {
                        pos: i
                    }, []));
                    this.eat(TT.COLON);
                } else {
                    body.push(this.parseStmt(this.seek()));
                    i++;
                }
            }
            return {
                cases: cases,
                body: body
            };
        }

        parseTry() {
            this.newASTContext();

            let startToken = this.eat(TT.KEYWORD);

            let stmt = this.parseBody(startToken, "TryStmt", {});
            let catch_ = [];
            let finally_ = [];

            while (this.seek().type === TT.KEYWORD && (this.seek().value === "catch" || this.seek().value === "finally")) {
                if (this.seek().type === TT.KEYWORD && this.seek().value === "catch") {
                    catch_.push(this.parseCatch());
                }
                if (this.seek().type === TT.KEYWORD && this.seek().value === "finally") {
                    finally_.push(this.parseFinally());
                }
            }

            if (catch_.length === 0 && finally_.length === 0) {
                this.markError("Expected 'catch' or 'finally' block", "SyntaxError", this.seek().loc);
            }

            return this.buildAST("TryGroupStmt", {
                try_: stmt,
                catch_: catch_,
                finally_: finally_
            });
        }

        parseCatch() {
            this.newASTContext();
            let startToken = this.eat(TT.KEYWORD);

            this.eat(TT.OPEN_PAREN);
            let name = this.eat(TT.IDENTIFIER).value;
            this.eat(TT.CLOSE_PAREN);
            return this.parseBody(startToken, "CatchStmt", {identifier: name}, ["identifier"]);
        }

        parseFinally() {
            this.newASTContext();

            let startToken = this.eat(TT.KEYWORD);
            return this.parseBody(startToken, "FinallyStmt", {});
        }

        parseThrow() {
            this.newASTContext();

            let expr = this.parseExpr();

            this.expectSemicolon();
            return this.buildAST("ThrowStmt", {
                expr: expr
            });
        }

        parseExpr() {
            this.newASTContext();

            let result = [this.parseExpr_L0()];
            while (this.seek().type === TT.COMMA) {
                this.eat(TT.COMMA);
                result.push(this.parseExpr_L0());
            }
            this.dropASTContext();
            return result.length === 1 ? result[0] : this.buildAST("CommaExpr", {expr: result});
        }

        parseExpr_L0() {
            // Assignment and Miscellaneous

            this.newASTContext();
            if (this.seek().type === TT.DOT) {
                this.eat(TT.DOT);
                this.eat(TT.DOT);
                this.eat(TT.DOT);
                return this.buildAST("SpreadExpr", {expr: this.parseExpr_L0()});
            }
            let a = this.parseExpr_L1();
            if (this.seek().type === TT.OP_EQ) {
                let op = this.eat(TT.OP_EQ);
                let b = this.parseExpr_L0();
                return this.buildAST("OpEqExpr", {
                    left: a,
                    right: b,
                    op: op
                }, ["left", "right"]);
            } else if (this.seek().type === TT.EQ) {
                let op = this.eat(TT.EQ);
                let b = this.parseExpr_L0();
                return this.buildAST("OpEqExpr", {
                    left: a,
                    right: b,
                    op: op
                }, ["left", "right"]);
            }
            this.dropASTContext();
            return a;
        }

        parseExpr_L1() {
            // Logical
            this.newASTContext();

            let a = this.parseExpr_L2();
            if (this.seek().type === TT.OP_LOGICAL) {
                let op = this.eat(TT.OP_LOGICAL);
                let b = this.parseExpr_L1();
                return this.buildAST("OpLogicalExpr", {
                    left: a,
                    right: b,
                    op: op
                }, ["left", "right"]);
            }
            this.dropASTContext();
            return a;
        }

        parseExpr_L2() {
            // Equality and Comparison
            this.newASTContext();

            let a = this.parseExpr_L3();
            if (this.seek().type === TT.COMPARISON) {
                let op = this.eat(TT.COMPARISON);
                let b = this.parseExpr_L2();
                return this.buildAST("ComparisonExpr", {
                    left: a,
                    right: b,
                    op: op
                }, ["left", "right"]);
            } else if (this.seek().type === TT.KEYWORD && this.seek().value === "instanceof") {
                this.eat(TT.KEYWORD);
                let b = this.parseExpr_L2();
                return this.buildAST("InstanceOfExpr", {
                    left: a,
                    right: b
                });
            } else if (this.seek().type === TT.KEYWORD && this.seek().value === "in") {
                this.eat(TT.KEYWORD);
                let b = this.parseExpr_L2();
                return this.buildAST("InExpr", {
                    left: a,
                    right: b
                });
            }
            this.dropASTContext();
            return a;
        }

        parseExpr_L3() {
            // bitwise shift
            let a = this.parseMathExpr();
            // TODO
            return a;
        }

        parseMathExpr() {
            // Addition
            this.newASTContext();

            let a = this.parseTerm();
            while (this.seek().type === TT.OPERATOR && (this.seek().value === "+" || this.seek().value === "-")) {
                let op = this.eat(TT.OPERATOR);
                let b = this.parseTerm();
                a = this.buildAST("BinaryOpExpr", {
                    left: a,
                    right: b,
                    op: op
                }, ["left", "right"]);
            }
            this.dropASTContext();
            return a;
        }

        parseTerm() {
            // Multiplication
            this.newASTContext();

            let a = this.parseExpo();
            while (this.seek().type === TT.OPERATOR && (this.seek().value === "*" || this.seek().value === "/" || this.seek().value === "%")) {
                let op = this.eat(TT.OPERATOR);
                let b = this.parseExpo();
                a = this.buildAST("BinaryOpExpr", {
                    left: a,
                    right: b,
                    op: op
                }, ["left", "right"]);
            }
            this.dropASTContext();
            return a;
        }

        parseExpo() {
            // Exponential
            this.newASTContext();

            let a = this.parseFactor();
            if (this.seek().type === TT.OPERATOR && this.seek().value === "**") {
                let op = this.eat(TT.OPERATOR);
                let b = this.parseExpo();
                return this.buildAST("BinaryOpExpr", {
                    left: a,
                    right: b,
                    op: op
                }, ["left", "right"]);
            }
            this.dropASTContext();
            return a;
        }

        parseFactor() {
            // Unary, Postfix
            this.newASTContext();

            if (this.seek().type === TT.KEYWORD) {
                if (this.seek().value === "new") {
                    let expr = this.parseFactor();
                    let args = [];
                    if (this.seek().type === TT.OPEN_PAREN) {
                        this.eat(TT.OPEN_PAREN);
                        args = this.parseArgumentList();
                        this.eat(TT.CLOSE_PAREN);
                    }
                    return this.buildAST("NewExpr", {
                        expr: expr,
                        args: args
                    });
                } else if (this.seek().value === "delete") {
                    let expr = this.parseFactor();
                    return this.buildAST("DeleteExpr", {
                        expr: expr
                    });
                } else if (this.seek().value === "typeof") {
                    let expr = this.parseFactor();
                    return this.buildAST("TypeofExpr", {
                        expr: expr
                    });
                } else if (this.seek().value === "void") {
                    let expr = this.parseFactor();
                    return this.buildAST("VoidExpr", {
                        expr: expr
                    });
                } else if (this.seek().value === "this") {
                    let identifier = this.parseIdentifierGroup();
                    if (this.seek().type === TT.OPERATOR && (this.seek().value === "++" || this.seek().value === "--")) {
                        let op = this.eat(TT.OPERATOR);
                        return this.buildAST("PostfixExpr", {
                            expr: identifier,
                            op: op
                        }, ["expr"]);
                    }
                    this.dropASTContext();
                    return identifier;
                } else if (this.seek().value === "function") {
                    this.dropASTContext();
                    return this.parseFunctionDecl();
                } else {
                    this.markError("Unexpected token", "SyntaxError", this.seek().loc);
                }
            } else if (this.seek().type === TT.OPERATOR) {
                if (this.seek().value === "+" || this.seek().value === "-" || this.seek().value === "!" || this.seek().value === "~") {
                    let op = this.eat(TT.OPERATOR);
                    let expr = this.parseFactor();
                    return this.buildAST("UnaryOpExpr", {
                        expr: expr,
                        op: op
                    }, ["expr"]);
                } else if (this.seek().value === "++" || this.seek().value === "--") {
                    let op = this.eat(TT.OPERATOR);
                    let expr = this.parseIdentifierGroup();
                    return this.buildAST("PrefixExpr", {
                        expr: expr,
                        op: op
                    }, ["expr"]);
                }
            } else {
                let identifier = this.parseIdentifierGroup();
                if (this.seek().type === TT.OPERATOR && (this.seek().value === "++" || this.seek().value === "--")) {
                    let op = this.eat(TT.OPERATOR);
                    return this.buildAST("PostfixExpr", {
                        expr: identifier,
                        op: op
                    }, ["expr"]);
                }
                this.dropASTContext();
                return identifier;
            }
        }

        parseIdentifierGroup() {
            this.newASTContext();

            let identifier = this.parseIdentifierDottedExpression();
            while (true) {
                if (this.seek().type === TT.OPEN_BRACKET) {
                    this.eat(TT.OPEN_BRACKET);
                    let expr = this.parseExpr();
                    this.eat(TT.CLOSE_BRACKET);
                    identifier = this.parseIdentifierDottedExpression(this.buildAST("ArrayAccess", {
                        base: identifier,
                        expr: expr
                    }));
                } else if (this.seek().type === TT.OPEN_PAREN) {
                    this.eat(TT.OPEN_PAREN);
                    let args = this.parseArgumentList();
                    this.eat(TT.CLOSE_PAREN);
                    identifier = this.parseIdentifierDottedExpression(this.buildAST("FunctionCall", {
                        base: identifier,
                        args: args
                    }));
                } else {
                    this.dropASTContext();
                    return identifier;
                }
            }
        }

        parseIdentifierDottedExpression(nd) {
            this.newASTContext();

            nd ??= this.parseIdentifier();
            while (this.seek().type === TT.DOT) {
                this.eat(TT.DOT);
                nd = this.buildAST("MemberAccess", {
                    base: nd,
                    expr: this.parseIdentifier()
                });
            }
            this.dropASTContext();
            return nd;
        }

        parseIdentifier() {
            this.newASTContext();

            let startToken = this.seek();

            if (this.seek().type === TT.KEYWORD) {
                if (this.seek().value === "this") {
                    this.eat(TT.KEYWORD);
                    return this.buildAST("This", {});
                } else if (this.seek().value === "super") {
                    this.eat(TT.KEYWORD);
                    return this.buildAST("Super", {});
                } else if (this.seek().value === "function") {
                    this.dropASTContext();
                    return this.parseFunctionDecl();
                }
            }
            if (this.seek().type === TT.OPEN_PAREN) {
                let expr, req = false;
                this.eat(TT.OPEN_PAREN);
                if (this.seek().type !== TT.CLOSE_PAREN) {
                    expr = this.parseExpr();
                    req = true;
                } else {
                    if (this.tk.lookAhead(2).type !== TT.ARROW) {
                        this.markError("Expected '=>' token", "SyntaxError", this.seek().loc);
                    }
                    expr = null;
                }
                this.eat(TT.CLOSE_PAREN);
                if (this.seek().type === TT.ARROW) {
                    this.eat(TT.ARROW);

                    if (!expr) {
                        expr = [];
                    } else if (expr.type === "CommaExpr") {
                        expr = expr.expr;
                    } else {
                        expr = [expr];
                    }

                    let body = this.parseBody(startToken, "BlockStmt", {}).body;
                    return this.buildAST("FunctionDecl", {
                        isAsync: false,
                        isInline: true,
                        isAnonymous: true,
                        name: null,
                        params: expr,
                        body: body
                    }, req ? ["params", "body"] : ["body"]);
                } else {
                    this.dropASTContext();
                    return expr;
                }
            } else if (this.seek().type === TT.LITERAL) {
                return this.buildAST("Literal", {literal: this.eat(TT.LITERAL, "literal")});
            } else if (this.seek().type === TT.NUMBER) {
                return this.buildAST("Number", {number: this.eat(TT.NUMBER, "number")});
            } else if (this.seek().type === TT.OPEN_BRACKET) {
                this.eat(TT.OPEN_BRACKET);

                let values = [];
                while (this.seek().type !== TT.CLOSE_BRACKET) {
                    values.push(this.parseExpr_L0());
                    if (this.seek().type === TT.COMMA) {
                        this.eat(TT.COMMA);
                    } else {
                        break;
                    }
                }
                this.eat(TT.CLOSE_BRACKET);
                return this.buildAST("ArrayLiteral", {values: values});
            } else {
                return this.buildAST("Identifier", {name: this.eat(TT.IDENTIFIER, "identifier").value});
            }
        }

        parseArgumentList() {
            this.newASTContext();

            let args = [];
            let t;
            while ((t = this.seek()).type !== TT.CLOSE_PAREN) {
                args.push(this.parseExpr_L0());
                if (this.seek().type === TT.COMMA) {
                    this.eat(TT.COMMA);
                } else {
                    break;
                }
            }

            this.closeASTContext("param_list");

            return args;
        }
    }
}(window.EDITOR || (window.EDITOR = {}));