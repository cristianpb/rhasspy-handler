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
    this.volumeSet(50)
  }

  async volumeDown () {
    this.volumeSet(5)
  }

  async stopMopidy () {
    console.log('Stopping moppidy');
    await mopidyClient.playback.stop()
    await mopidyClient.tracklist.clear()
    this.speak('Silencio');
  }

  async setRadio (radioName: string, radioUri: string[]) {
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
    console.log('Playing', songUri);
    this.setRadio(value, songUri);
  }

  nextSong () {
    console.log('Next');
    this.speak('Siguiente canción');
    mopidyClient.playback.next();
  }

  radioOn (slotValue: string|null) {
    console.log(slotValue);
    if (Object.keys(RADIOS).indexOf(slotValue) >= 0) {
      this.setMyRadios(slotValue);
    } else if (slotValue === 'la luciérnaga') {
      const files = fs.readdirSync(process.env.PODCAST_DIR);
      console.log(`file://${process.env.PODCAST_DIR}/${files[files.length - 1]}`);
      this.setRadio('la luciérnaga', [`file://${process.env.PODCAST_DIR}/${files[files.length - 1]}`, `file://${process.env.PODCAST_DIR}/${files[files.length-2]}`]);
    } else {
      console.log('Unkown');
      this.speak('Radio desconocida')
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
