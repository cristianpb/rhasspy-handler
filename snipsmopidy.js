const mqtt = require('mqtt');
const Mopidy = require("mopidy");
const RADIOS = require('./radios');
const hostname = process.env.HOST ;
const mqtt_client = mqtt.connect(`mqtt://${hostname}`);
const mopidy_client = new Mopidy({
  webSocketUrl: `ws://${hostname}:6680/mopidy/ws/`,
});

class SnipsMopidy {
  constructor() {
    //this.mqtt_client = mqtt.connect(`mqtt://${hostname}`);
  }

  speak(text) {
    console.log('READING', text);
    mqtt_client.publish("hermes/tts/say", `{"siteId":"default","lang": "es", "text": "${text}"}`)
  }

  volumeSet(volumeNumber) {
    console.log(`Volume set to ${volumeNumber}`)
    mopidy_client.mixer.setVolume([Number(volumeNumber)]);
    this.speak(`Volumen a ${volumeNumber}`);
  }

  volumeUp() {
    console.log('Volume up');
    mopidy_client.mixer.setVolume([50]);
    this.speak('Volumen alto');
  }

  async volumeDown () {
    console.log('Volume down');
    mopidy_client.mixer.setVolume([5])
    this.speak('Volumen bajo');
  }

  async stopMopidy() {
    console.log('Stopping moppidy');
    await mopidy_client.playback.stop()
    await mopidy_client.tracklist.clear()
    this.speak('Silencio');
  }

  async setRadio(radio_name, radioUri) {
    await mopidy_client.tracklist.clear()
    await mopidy_client.playback.pause()
    let tracks = await mopidy_client.tracklist.add({uris: radioUri})
    console.log('Tracks', tracks);
    if (radioUri[0].includes('podcast')) {
      tracks = [tracks[tracks.length - 1]]
    }
    try {
      this.speak(`Voy a sintonizar ${radio_name}`);
      await mopidy_client.playback.play({tlid: tracks[0].tlid});
    } catch (e) {
      console.log(e);
      await mopidy_client.playback.stop()
      this.speak('Tengo un pequeño problema');
    }
  }

  setMyRadios(radio) {
    let radioUri = RADIOS[radio]
    this.setRadio(radio, radioUri)
  }

  async searchArtist(Value) {
    console.log(`Searching for ${Value}`)
    this.speak(`Buscando canciones de ${Value}`);
    let result = await mopidy_client.library.search({'any': Value, 'uris': ['soundcloud:']})
    console.log(result);
    let songUri = result[0]['tracks'].map(item => item.uri);
    console.log('Playin', songUri);
    this.setRadio(Value, songUri);
  }

  nextSong() {
    console.log('Next');
    this.speak('Siguiente canción');
    mopidy_client.playback.next();
  }
};

const snipsmopidy = new SnipsMopidy()
mopidy_client.on("state:online", async () => {
  snipsmopidy.volumeSet(13);
  //snipsmopidy.setMyRadios('ascensor');
  //snipsmopidy.searchArtist('ozuna');
  //snipsmopidy.nextSong();
})
module.exports = snipsmopidy;
