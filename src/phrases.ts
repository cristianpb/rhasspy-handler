import fs from 'fs';
import { RhasspyMopidy } from './rhasspymopidy';

export const readPhrase = (phrases: string) => {
  const data = fs.readFileSync(`./data/${phrases}.txt`,'utf8').split('\n');
  const item = data[Math.floor(Math.random() * data.length)];
  RhasspyMopidy.speak(item);
  return item;
}
