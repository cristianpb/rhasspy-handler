import fs from 'fs';
import axios from 'axios';
import Mopidy from "mopidy";
import { RADIOS } from './radios';

const hostname = process.env.HOST;
const mopidyClient = new Mopidy({
  webSocketUrl: `ws://${hostname}:6680/mopidy/ws/`
});


export class RhasspyMopidy {
  async speak (text: string) {
    const res = await axios({url: `http://${hostname}:12101/api/text-to-speech`, method: 'POST', data: `${text}`});
    return res.status
  }

  volumeSet (volumeNumber: number) {
    console.log(`Volume set to ${volumeNumber}`)
    mopidyClient.mixer.setVolume([Number(volumeNumber)]);
    this.speak(`Volumen a ${volumeNumber}`);
  }

  volumeUp () {
    console.log('Volume up');
    mopidyClient.mixer.setVolume([50]);
    this.speak('Volumen alto');
  }

  async volumeDown () {
    console.log('Volume down');
    mopidyClient.mixer.setVolume([5])
    this.speak('Volumen bajo');
  }

  async stopMopidy () {
    console.log('Stopping moppidy');
    await mopidyClient.playback.stop()
    await mopidyClient.tracklist.clear()
    this.speak('Silencio');
  }

  async setRadio (radioName: string, radioUri: string) {
    await mopidyClient.tracklist.clear()
    await mopidyClient.playback.pause()
    let tracks = await mopidyClient.tracklist.add({uris: radioUri})
    console.log('Tracks', tracks);
    if (radioUri[0].includes('podcast')) {
      tracks = [tracks[tracks.length - 1]]
    }
    try {
      this.speak(`Voy a sintonizar ${radioName}`);
      await mopidyClient.playback.play({tlid: tracks[0].tlid});
    } catch (e) {
      console.log(e);
      await mopidyClient.playback.stop()
      this.speak('Tengo un pequeño problema');
    }
  }

  setMyRadios (radio: string) {
    let radioUri = RADIOS[radio]
    this.setRadio(radio, radioUri)
  }

  async searchArtist (value: string) {
    console.log(`Searching for ${value}`)
    this.speak(`Buscando canciones de ${value}`);
    let result = await mopidyClient.library.search({'any': value, 'uris': ['soundcloud:']})
    console.log(result);
    let songUri = result[0]['tracks'].map((item: any) => item.uri);
    console.log('Playin', songUri);
    this.setRadio(value, songUri);
  }

  nextSong () {
    console.log('Next');
    this.speak('Siguiente canción');
    mopidyClient.playback.next();
  }

  radioOn (intent: any) { //TODO
    console.log(intent);
    const {slots = null} = intent;
    if ((slots) && (slots.length > 0)) {
      const {value = null} = slots[0];
      if (Object.keys(RADIOS).indexOf(value.value) >= 0) {
        this.setMyRadios(value.value);
      } else if (value.value === 'la luciérnaga') {
        const files = fs.readdirSync(process.env.PODCAST_DIR);
        console.log(`file://${process.env.PODCAST_DIR}/${files[files.length - 1]}`);
        this.setRadio('la luciérnaga', [`file://${process.env.PODCAST_DIR}/${files[files.length - 1]}`, `file://${process.env.PODCAST_DIR}/${files[files.length-2]}`]);
      } else {
        this.speak('Radio desconocida')
        console.log('Unkown');
      }
    } else {
      this.speak('No entendí');
    }
  }

  close() {
    mopidyClient.off();
  }

  subscribeOnline() {
    mopidyClient.on('state:online', async () => {
      await this.speak('Conectado');
      this.volumeSet(13);
    })
  }

  subscribeOffline() {
    mopidyClient.on('state:offline', async () => {
      this.speak('Desconectado');
    })
  }


};

//const rhasspymopidy = new RhasppyMopidy()
//mopidyClient.on('state:online', async () => {
//  await rhasspymopidy.speak('Connectado');
//  rhasspymopidy.volumeSet(13);
//  //rhasspymopidy.setMyRadios('ascensor');
//  //rhasspymopidy.searchArtist('ozuna');
//  //rhasspymopidy.nextSong();
//})
//mopidyClient.on('state:offline', async () => {
//  rhasspymopidy.speak('Desconectado');
//})
//export.defaults = RhasppyMopidy
//module.exports = RhasppyMopidy;
