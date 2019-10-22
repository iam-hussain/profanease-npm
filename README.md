# Profanease
A lightweight javascript detector and filter for profanity words / bad words written in typescript


* Works on ECMAScript all versions
* Support for multi language profanity detector and filter

# Installation 

Using npm:   
```js   
$ npm i is-profane
$ npm i --save is-profane 
```

In Node.js: 
```js   
var Profanease = require('profanease');
//or
import Profanease from 'profanease'
```

# Example Usage   

```js   
var isProfane = new Profanease({lang : 'en'});
console.log(isProfane.clean("Don't be an ash0le")); //Don't be an ******
//Multilingual support for word filtering
//Available language are ['ar','cs','da','en','eo','es','fa','fi','fr','hi','hu','it','ja','ko','nl','no','pl','pt','ru','sv','th','tlh','zh']
```
Note: Default value for Profanease { lang : 'en', placeHolder: '*' }.

**Placeholder Overrides**
```js   
var isProfane = new Profanease({ placeHolder: 'x'});
console.log(isProfane.clean("Don't be an ash0le")); //Don't be an xxxxxx
```

**Regex Overrides**
```js
var isProfane = new Profanease({ regex: /\*|\.|$/gi });
var isProfane = new Profanease({ replaceRegex:  /[A-Za-z0-9가-힣_]/g }); 
```

**Add words to the blacklist**
```js
var isProfane = new Profanease(); 
isProfane.addWords(['some', 'bad', 'word']);
isProfane.clean("some bad word!") //**** *** ****!

//or

var isProfane = new Profanease({ list: ['some', 'bad', 'word'] }); 
isProfane.clean("some bad word!") //**** *** ****!
```

**Instantiate with an empty list**
```js
var isProfane = new Profanease({ emptyList: true }); 
isProfane.clean('hell this wont clean anything'); //hell this wont clean anything
```

**Remove words from the blacklist**
```js
var isProfane = new Profanease();    
isProfane.removeWords(['hells', 'sadist']);
isProfane.clean("some hells word!"); //some hells word!
```

**Export words list with language**
```js
var isProfane = new Profanease();    
isProfane.wordsList('en'); // [ "*dyke", "*shit*"...]
isProfane.wordsList('es'); // [ "Asesinato", "Bollera",..]
// on error lang is 'en'
```

