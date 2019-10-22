interface IOptions {
    lang?: string;
    placeHolder?: string;
    exclude?: string[];
    list?: string[];
    emptyList?: boolean;
    regex?: RegExp;
    replaceRegex?: RegExp;
}
export declare class Profanity implements IOptions {
    lang: string;
    list: string[];
    placeHolder: string;
    regex: RegExp;
    replaceRegex: RegExp;
    exclude: string[];
    constructor(option?: IOptions);
    clean(wordToClean: string): string;
    wordsList(lang?: string): any;
    addWords(words: string[]): void;
    removeWords(words: string[]): void;
    private isValidLang;
    private isProfane;
    private replaceWord;
}
export {};
