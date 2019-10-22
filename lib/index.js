"use strict";
var wordList = require("./static/languages/index");
var isProfane = /** @class */ (function () {
    function isProfane(option) {
        this.lang = option && option.lang && this.isValidLang(option.lang) ? option.lang : 'en';
        this.list =
            option && option.emptyList
                ? []
                : Array.prototype.concat.apply(wordList.default[this.lang], option && option.list ? option.list : []);
        this.placeHolder = (option && option.placeHolder) || '*';
        this.regex = (option && option.regex) || /[^a-zA-Z0-9|\$|\@]|\^/g;
        this.replaceRegex = (option && option.replaceRegex) || /\w/g;
        this.exclude = (option && option.exclude) || [];
    }
    isProfane.prototype.clean = function (wordToClean) {
        var _this = this;
        return wordToClean
            .split(/\b/)
            .map(function (word) {
            return _this.isProfaneWord(word) ? _this.replaceWord(word) : word;
        })
            .join('');
    };
    isProfane.prototype.wordsList = function (lang) {
        return lang && this.isValidLang(lang) ? wordList.default[lang] : this.list;
    };
    isProfane.prototype.addWords = function (words) {
        var _a;
        var _this = this;
        (_a = this.list).push.apply(_a, words);
        words
            .map(function (word) { return word.toLowerCase(); })
            .forEach(function (word) {
            if (_this.exclude.includes(word)) {
                _this.exclude.splice(_this.exclude.indexOf(word), 1);
            }
        });
    };
    isProfane.prototype.removeWords = function (words) {
        var _this = this;
        words.map(function (word) {
            word.toLowerCase();
            _this.exclude.push(word);
        });
    };
    isProfane.prototype.isValidLang = function (lang) {
        return (Object.keys(wordList.default)
            .map(function (key, index) {
            return key === lang;
        })
            .includes(true) || false);
    };
    isProfane.prototype.isProfaneWord = function (wordToCheck) {
        var _this = this;
        return (this.list.filter(function (word) {
            var wordExp = new RegExp("\\b" + word.replace(/(\W)/g, '\\$1') + "\\b", 'gi');
            return !_this.exclude.includes(word.toLowerCase()) && wordExp.test(wordToCheck);
        }).length > 0 || false);
    };
    isProfane.prototype.replaceWord = function (wordToReplace) {
        return wordToReplace.replace(this.regex, '').replace(this.replaceRegex, this.placeHolder);
    };
    return isProfane;
}());
module.exports = isProfane;
//# sourceMappingURL=index.js.map