import fs from 'fs';
import axios from 'axios';
import Mopidy from 'mopidy';
import { RADIOS } from './radios';

const hostnameMopidy = process.env.HOST_MOPIDY || 'localhost';
const hostnameRhasspy = process.env.HOST_RHASSPY || 'localhost';
const mopidyClient: any = new Mopidy({
  webSocketUrl: `ws://${hostnameMopidy}:6680/mopidy/ws/`
});

function shuffle(array: any) {
	let currentIndex = array.length;
	let temporaryValue, randomIndex;

	while (0 !== currentIndex) {
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		// And swap it with the current element.
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}
	return array;
};

export abstract class RhasspyMopidy {
  public static async speak (text: string) {
    try {
      const res = await axios({url: `http://${hostnameRhasspy}:12101/api/text-to-speech`, method: 'POST', data: `${text}`});
      return res.status
    } catch (e) {
      console.log(e.Error.toString());
      return false 
    }
  }

  public static volumeSet (volumeNumber: number, speak = true) {
    console.log(`Volume set to ${volumeNumber}`)
    mopidyClient.mixer.setVolume([Number(volumeNumber)]);
    if (speak) {
      RhasspyMopidy.speak(`Volumen a ${volumeNumber}`);
    }
  }

  public static volumeUp () {
    RhasspyMopidy.volumeSet(50)
  }

  public static async volumeDown () {
    RhasspyMopidy.volumeSet(5)
  }

  public static async stopMopidy () {
    console.log('Stopping moppidy');
    await mopidyClient.playback.stop()
    await mopidyClient.tracklist.clear()
    RhasspyMopidy.speak('Silencio');
  }

  public static async setRadio (radioName: string, radioUri: string[]) {
    await mopidyClient.playback.stop()
    await mopidyClient.tracklist.clear()
    let tracks = await mopidyClient.tracklist.add({uris: radioUri})
    console.log('Tracks', tracks);
    if (radioUri[0].includes('podcast')) {
      tracks = [tracks[tracks.length - 1]]
    }
    try {
      RhasspyMopidy.speak(`Voy a sintonizar ${radioName}`);
      await mopidyClient.playback.play({tlid: tracks[0].tlid});
    } catch (e) {
      console.log(e);
      await mopidyClient.playback.stop()
      RhasspyMopidy.speak('Tengo un pequeño problema');
    }
  }

  public static setMyRadios (radio: string) {
    let radioUri = RADIOS[radio]
    RhasspyMopidy.setRadio(radio, radioUri)
  }

  public static async searchArtist (value: string) {
    let result = await mopidyClient.library.search({'query': {'any': [value]}, 'uris': ['local:']})
    let songUris = result[0]['tracks'].map((item: any) => item.uri);
    RhasspyMopidy.setRadio(value, songUris);
  }

  public static async setPlaylist(playlistName: string) {
    const playlists = await mopidyClient.playlists.asList();
    const playlist = await playlists.find((playlist: Playlist) => playlist.name === playlistName.replace(' ','-'))
    if (playlist) {
      const items = await mopidyClient.playlists.getItems({uri: playlist.uri})
      shuffle(items);
      await mopidyClient.playback.stop()
      await mopidyClient.tracklist.clear()
      const tracks = await mopidyClient.tracklist.add({uris: items.map((item: Track) => item.uri)})
      await mopidyClient.playback.play({tlid: tracks[0].tlid});
    }
  }

  public static nextSong () {
    console.log('Next');
    RhasspyMopidy.speak('Siguiente canción');
    mopidyClient.playback.next();
  }

  public static radioOn (slotValue: string|null) {
    console.log(slotValue);
    if (slotValue in RADIOS) {
      RhasspyMopidy.setMyRadios(slotValue);
    } else if (slotValue === 'la luciérnaga') {
      const files = fs.readdirSync(process.env.PODCAST_DIR);
      console.log(`file://${process.env.PODCAST_DIR}/${files[files.length - 1]}`);
      RhasspyMopidy.setRadio('la luciérnaga', [`file://${process.env.PODCAST_DIR}/${files[files.length - 1]}`, `file://${process.env.PODCAST_DIR}/${files[files.length-2]}`]);
    } else {
      console.log('Unkown');
      RhasspyMopidy.speak('Radio desconocida')
    }
  }

  public static close() {
    mopidyClient.off();
  }

  public static subscribeOnline() {
    mopidyClient.on('state:online', async () => {
      console.log('[Handler mopidy]: Conectado');
      RhasspyMopidy.volumeSet(10, false);
      await RhasspyMopidy.speak('Conectado');
    })
  }

  public static subscribeOffline() {
    mopidyClient.on('state:offline', async () => {
      RhasspyMopidy.speak('Desconectado');
    })
  }

};

interface Playlist {
  __model__: string;
  uri: string;  //'m3u:viva-latino.m3u',
  name: string; //'viva-latino',
  type: string; // 'playlist' }
}

interface Track {
  __model__: string; // 'Ref',
  uri: string; //'file:///var/lib/mopidy/music/ROSAL%C3%83%C2%8DA%20-%20Dolerme.m4a',
  name: string; // 'ROSALA - DOLERME - LETRA - LYRICS (English Translation)',
  type: string; //  'track'
}

