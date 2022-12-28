"use strict";
exports.__esModule = true;
exports.tokenize = exports.TokenType = void 0;
var path = require("path");
var os = require("os");
var fs = require("fs");
var TokenType;
(function (TokenType) {
    TokenType[TokenType["Number"] = 0] = "Number";
    TokenType[TokenType["String"] = 1] = "String";
    TokenType[TokenType["Identifier"] = 2] = "Identifier";
    TokenType[TokenType["Equals"] = 3] = "Equals";
    TokenType[TokenType["Let"] = 4] = "Let";
    TokenType[TokenType["OpenParen"] = 5] = "OpenParen";
    TokenType[TokenType["CloseParen"] = 6] = "CloseParen";
    TokenType[TokenType["BinaryOperator"] = 7] = "BinaryOperator";
})(TokenType = exports.TokenType || (exports.TokenType = {}));
var KEYWORDS = {
    let: TokenType.Let
};
function token(value, type) {
    if (value === void 0) { value = ""; }
    return { value: value, type: type };
}
function isalpha(src) {
    return src.toUpperCase() !== src.toLowerCase();
}
function isint(src) {
    var c = src.charCodeAt(0);
    var bounds = ["0".charCodeAt(0), "9".charCodeAt(0)];
    return c >= bounds[0] && c <= bounds[1];
}
function isskippable(src) {
    return src === " " || src === "\n" || src === "\t" || os.EOL;
}
function tokenize(sourceCode) {
    var tokens = new Array();
    var src = sourceCode.split("");
    while (src.length > 0) {
        if (src[0] === "(")
            tokens.push(token(src.shift(), TokenType.OpenParen));
        else if (src[0] === ")")
            tokens.push(token(src.shift(), TokenType.CloseParen));
        else if (src[0] === "+" || src[0] === "-" || src[0] === "/" || src[0] === "*")
            tokens.push(token(src.shift(), TokenType.BinaryOperator));
        else if (src[0] === "=")
            tokens.push(token(src.shift(), TokenType.Equals));
        else {
            // multi char tokens
            if (isint(src[0])) {
                var num = "";
                while (src.length > 0 && isint(src[0]))
                    num += src.shift();
                tokens.push(token(num, TokenType.Number));
            }
            else if (isalpha(src[0])) {
                var str = "";
                while (src.length > 0 && isalpha(src[0]))
                    str += src.shift();
                // check for reserved keywords
                var reserved = KEYWORDS[str];
                if (reserved) {
                    tokens.push(token(str, reserved));
                }
                else {
                    tokens.push(token(str, TokenType.String));
                }
            }
            else if (isskippable(src[0])) {
                src.shift();
            }
            else {
                console.log("Unidentified token in source: ", src[0]);
                process.exit();
            }
        }
    }
    return tokens;
}
exports.tokenize = tokenize;
var source = fs.readFileSync(path.join(__dirname, "test.lingo"), { encoding: "utf-8" });
console.log(source);
for (var _i = 0, _a = tokenize(source); _i < _a.length; _i++) {
    var token_1 = _a[_i];
    console.log(token_1);
}
