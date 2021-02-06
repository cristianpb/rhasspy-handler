import fs from 'fs';
import { RhasspyMopidy } from './rhasspymopidy';

export const readPhrase = () => {
  const data = fs.readFileSync('./data/phrases.txt','utf8').split('\n');
  var item = data[Math.floor(Math.random() * data.length)];
  RhasspyMopidy.speak(item);
}
