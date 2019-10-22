import Profanease = require('../index');
import * as wordList from '../static/languages/index';

test('Profanease: Default', () => {
  let isProfane = new Profanease();
  expect(isProfane.clean('I am fucking asshole')).toEqual('I am ******* *******');
});

test('Profanease: lang :en', () => {
  let isProfane = new Profanease({ lang: 'en' });
  expect(isProfane.clean("Don't be an ash0le")).toEqual("Don't be an ******");
});

test('Profanease: placeHolder :x', () => {
  let isProfane = new Profanease({ placeHolder: 'x' });
  expect(isProfane.clean("Don't be an ash0le")).toEqual("Don't be an xxxxxx");
});

test('Profanease: addWords', () => {
  let isProfane = new Profanease();
  isProfane.addWords(['some', 'bad', 'word']);
  expect(isProfane.clean('some bad word!')).toBe('**** *** ****!');
});

test('Profanease: exclude initialize then same addWords', () => {
  let isProfane = new Profanease({ exclude: ['ash0le', 'some', 'bad', 'word'] });
  isProfane.addWords(['some', 'bad', 'word']);
  expect(isProfane.clean('some bad word like ash0le!')).toBe('**** *** **** like ash0le!');
});

test('Profanease: addWords on initialize', () => {
  let isProfane = new Profanease({ list: ['some', 'bad', 'word'] });
  expect(isProfane.clean('some bad word!')).toEqual('**** *** ****!');
});

test('Profanease: emptyList:True', () => {
  let isProfane = new Profanease({ emptyList: true });
  expect(isProfane.clean('hell this wont clean anything')).toEqual('hell this wont clean anything');
});

test('Profanease: emptyList:True and List of array passing', () => {
  let isProfane = new Profanease({ emptyList: true, list: ['some', 'bad', 'word'] });
  expect(isProfane.clean('hell this wont clean anything')).toEqual('hell this wont clean anything');
});

test('Profanease: removeWords', () => {
  let isProfane = new Profanease();
  isProfane.removeWords(['hells', 'sadist']);
  expect(isProfane.clean('some hells word!')).toEqual('some hells word!');
});

test('Profanease: wordsList for es', () => {
  let isProfane = new Profanease();
  expect(isProfane.wordsList('es')).toEqual(expect.arrayContaining(wordList.default.es));
});

test('Profanease: wordsList for en', () => {
  let isProfane = new Profanease();
  expect(isProfane.wordsList()).toEqual(expect.arrayContaining(wordList.default.en));
});
