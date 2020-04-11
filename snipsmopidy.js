const fs = require('fs');
const mqtt = require('mqtt');
const Mopidy = require('mopidy');
const RADIOS = require('./radios');
const axios = require('axios');
const hostname = process.env.HOST;
const mopidyClient = new Mopidy({
  webSocketUrl: `ws://${hostname}:6680/mopidy/ws/`
});

class SnipsMopidy {
  async speak (text) {
    const res = await axios({url: 'http://localhost:12101/api/text-to-speech', method: 'POST', data: `${text}`});
    return res.status
  }

  volumeSet (volumeNumber) {
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

  async setRadio (radioName, radioUri) {
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

  setMyRadios (radio) {
    let radioUri = RADIOS[radio]
    this.setRadio(radio, radioUri)
  }

  async searchArtist (Value) {
    console.log(`Searching for ${Value}`)
    this.speak(`Buscando canciones de ${Value}`);
    let result = await mopidyClient.library.search({'any': Value, 'uris': ['soundcloud:']})
    console.log(result);
    let songUri = result[0]['tracks'].map(item => item.uri);
    console.log('Playin', songUri);
    this.setRadio(Value, songUri);
  }

  nextSong () {
    console.log('Next');
    this.speak('Siguiente canción');
    mopidyClient.playback.next();
  }

  radioOn (intent) {
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
      SnipsMopidy.speak('No entendí');
    }
  }
};

const snipsmopidy = new SnipsMopidy()
mopidyClient.on('state:online', async () => {
  await snipsmopidy.speak('Connectado');
  snipsmopidy.volumeSet(13);
  //snipsmopidy.setMyRadios('ascensor');
  //snipsmopidy.searchArtist('ozuna');
  //snipsmopidy.nextSong();
})
//mopidyClient.on('state:offline', async () => {
//  snipsmopidy.speak('Desconectado');
//})
module.exports = snipsmopidy;
