"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var path_1 = require("path");
var baseName = path_1.basename(module.filename);
var words = {};
fs_1.readdirSync(__dirname)
    .filter(function (file) {
    return file.indexOf('.') !== 0 && file !== baseName && file.slice(-5) === '.json';
})
    .forEach(function (file) {
    var list = require(path_1.join(__dirname, file));
    words[file.slice(0, -5)] = list;
});
exports.default = words;
//# sourceMappingURL=index.js.map