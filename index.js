const mqtt = require('mqtt');
require('dotenv').config()
const Mopidy = require("mopidy");
const Parser = require('rss-parser');
const fs = require('fs');
const Path = require('path');
const axios = require('axios');
const hostname = "localhost";
const client  = mqtt.connect(`mqtt://${hostname}`);
const RADIOS = {
  'vibra': ['tunein:station:s84760'],
  'la mega': ['tunein:station:s86588'],
  'la cariñosa': ['tunein:station:s143839'],
  'caracol': ['tunein:station:s16182'],
  'clasica': ['tunein:station:s25732'],
  'suavecita': ['tunein:station:s33937'],
  'ascensor': ['http://somafm.com/groovesalad.pls'],
  'lounge': ['http://somafm.com/illstreet.pls'],
  'regetón': ['tunein:station:s269960'],
  'noventa': ['tunein:station:s89818']
}

if (process.env.BLUETOOTH == "true") {
  const blue = require("bluetoothctl");

  /* Automatic Bluetooth connection */
  blue.Bluetooth()

  blue.on(blue.bluetoothEvents.Device, function (devices) {
    const hasBluetooth=blue.checkBluetoothController();
    if(hasBluetooth) {
      devices.forEach((device) => {
        blue.connect(device.mac)
      })
    }
  })
}

//
/* On Connect MQTT */
client.on('connect', function () {
  console.log("[Snips Log] Connected to MQTT broker " + hostname);
  downloadPostcast('http://fapi-top.prisasd.com/podcast/caracol/la_luciernaga/itunestfp/podcast.xml');
  client.publish("hermes/tts/say", `{"siteId":"default","lang": "es", "text":"Connectado"}`)
  client.subscribe('hermes/#');
  volumeSet(13);
});

/* On Message */
client.on('message', function (topic, message) {
    if (topic === "hermes/asr/startListening") {
        onListeningStateChanged(true);
    } else if (topic === "hermes/asr/stopListening") {
        onListeningStateChanged(false);
    } else if (topic.match(/hermes\/hotword\/.+\/detected/g) !== null) {
        onHotwordDetected()
    } else if (topic.match(/hermes\/intent\/.+/g) !== null) {
        onIntentDetected(JSON.parse(message));
    }
});

/* Snips actions */
function onIntentDetected(intent) {
  console.log(`[Snips Log] Intent detected: ${JSON.stringify(intent)}`);
  const {intent: {intentName} = null} = intent;
  if (intentName == 'cristianpb:radioOn') {
    console.log(intent);
    const {slots = null} = intent
    if ((slots) && (slots.length > 0)) {
      const {rawValue = null} = slots[0]
      if (Object.keys(RADIOS).indexOf(rawValue) >= 0) {
        client.publish("hermes/tts/say", `{"siteId":"default","lang": "es", "text":"Voy a sintonizar ${rawValue}"}`)
        connectMopidyRadio(RADIOS[rawValue]);
      } else if (rawValue == 'la luciérnaga') {
        client.publish("hermes/tts/say", `{"siteId":"default","lang": "es", "text":"Voy a sintonizar la luciérnaga"}`)
        console.log('Playing la luciérnaga');
        const files = fs.readdirSync('/var/lib/mopidy/media');
        console.log(`file:///var/lib/mopidy/media/${files[files.length-1]}`);
        connectMopidyRadio([`file:///var/lib/mopidy/media/${files[files.length-1]}`, `file:///var/lib/mopidy/media/${files[files.length-2]}`]);
      } else {
        client.publish("hermes/tts/say", `{"siteId":"default","lang": "es", "text":"Radio desconocida"}`)
        console.log("Unkown");
      }
    } else {
      client.publish("hermes/tts/say", `{"siteId":"default","lang": "es", "text":"No entendí"}`)
    }
  } else if (intentName == 'cristianpb:speakerInterrupt') {
    stopMopidy();
  } else if (intentName == 'cristianpb:playArtist') {
    console.log(intent);
    const {slots = null} = intent
    if ((slots) && (slots.length > 0)) {
      const {rawValue = null} = slots[0]
      searchArtist([rawValue]);
    }
  } else if (intentName == 'cristianpb:volumeDown') {
    volumeDown();
  } else if (intentName == 'cristianpb:nextSong') {
    nextSong();
  } else if (intentName == 'cristianpb:volumeUp') {
    volumeUp();
  } else if (intentName == 'cristianpb:volumeSet') {
    const {slots = null} = intent
    if ((slots) && (slots.length > 0)) {
      const {value = null} = slots[0]
      volumeSet(value['value']);
    } else {
      client.publish("hermes/tts/say", `{"siteId":"default","lang": "es", "text":"No entendí ${intentName}"}`)
    }
  } else {
      client.publish("hermes/tts/say", `{"siteId":"default","lang": "es", "text":"No se que hacer"}`)
  }
}

function onHotwordDetected() {
  client.publish("hermes/tts/say", `{"siteId":"default","lang": "es", "text":"Si?"}`)
  console.log("[Snips Log] Hotword detected");
}

function onListeningStateChanged(listening) {
  console.log("[Snips Log] " + (listening ? "Start" : "Stop") + " listening");
}

function volumeSet (volumeNumber) {
  const mopidy = new Mopidy({
    webSocketUrl: `ws://${hostname}:6680/mopidy/ws/`,
  });
  mopidy.on("state:online", async (state) => {
    console.log(`Volume set to ${volumeNumber}`)
    client.publish("hermes/tts/say", `{"siteId":"default","lang": "es", "text":"Volumen a ${volumeNumber}"}`)
    await mopidy.mixer.setVolume([Number(volumeNumber)])
    await mopidy.off();
  });
}

function volumeUp () {
  const mopidy = new Mopidy({
    webSocketUrl: `ws://${hostname}:6680/mopidy/ws/`,
  });
  mopidy.on("state", async () => {
    console.log('Volume up');
    client.publish("hermes/tts/say", `{"siteId":"default","lang": "es", "text":"Volumen alto"}`)
    await mopidy.mixer.setVolume([50])
    mopidy.off();
  });
}

function volumeDown () {
  const mopidy = new Mopidy({
    webSocketUrl: `ws://${hostname}:6680/mopidy/ws/`,
  });
  mopidy.on("state", async () => {
    console.log('Volume down');
    client.publish("hermes/tts/say", `{"siteId":"default","lang": "es", "text":"Volumen bajo"}`)
    await mopidy.mixer.setVolume([5])
    mopidy.off();
  });
}


function stopMopidy() {
  const mopidy = new Mopidy({
    webSocketUrl: `ws://${hostname}:6680/mopidy/ws/`,
  });
  mopidy.on("state", async () => {
    console.log('Stopping moppidy');
    await mopidy.playback.stop()
    mopidy.off();
    client.publish("hermes/tts/say", `{"siteId":"default","lang": "es", "text":"Silencio"}`)
  });
}

function connectMopidyRadio(radio) {
  const mopidy = new Mopidy({
    webSocketUrl: `ws://${hostname}:6680/mopidy/ws/`,
  });
  mopidy.on("state", async () => {
    await setRadio(mopidy, radio);
  });
  mopidy.on("event", console.log);
}

async function setRadio (mopidy, radio) {
  await mopidy.tracklist.clear()
  await mopidy.playback.pause()
  await mopidy.tracklist.add({uris: radio})
  tracks = await mopidy.tracklist.getTlTracks();
  try {
    await mopidy.playback.play({tlid: tracks[0].tlid});
  } catch (e) {
    await mopidy.playback.stop()
    client.publish("hermes/tts/say", `{"siteId":"default","lang": "es", "text":"Tengo un pequeño problema"}`)
    console.log(e);
  }
  mopidy.off();
}

async function downloadPostcast(url) {
  let parser = new Parser();
  let feed = await parser.parseURL(url);
  console.log("RSS: ", feed.title);

  const dir = '/var/lib/mopidy/media' 
  const files = fs.readdirSync(dir)
    .map((fileName) => {
      return {
        name: fileName,
        time: fs.statSync(dir + '/' + fileName).mtime.getTime()
      };
    })
    .sort((a, b) => b.time - a.time) // Sort decending order
    .map((v) => v.name);

  feed.items.slice(0,5).forEach(async (item) => {
    let pieces = item.guid.split('/')
    console.log(`Checking : ${pieces[pieces.length-1]}`);
    if (files.indexOf(pieces[pieces.length-1]) === -1) {
      console.log(`Downloading ${item.title}:${item.guid}`)
      let { guid } = item; 
      await downloadFile(guid, pieces)
    }
  });

  // Delete old files
  if (files.length > 5) {
    files.slice(6, files.length).forEach((item) => {
      console.log(`Removing ${item}`)
      let path = Path.resolve(dir, item)
      fs.unlinkSync(path);
    })
  }
}

async function downloadFile (guid, pieces) {
  let path = Path.resolve('/var/lib/mopidy/media', pieces[pieces.length-1])
  const writer = fs.createWriteStream(path)
  const response = await axios({url: guid, method: 'GET', responseType: 'stream'})
  response.data.pipe(writer)

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve)
    writer.on('error', reject)
  })
}

function searchArtist (rawValue) {
  const mopidy = new Mopidy({
    webSocketUrl: `ws://${hostname}:6680/mopidy/ws/`,
  });
  mopidy.on("state", async () => {
    console.log(`Searching for ${rawValue}`)
    client.publish("hermes/tts/say", `{"siteId":"default","lang": "es", "text":"Buscando canciones de ${rawValue}"}`)
    let result = await mopidy.library.search({'any': rawValue, 'uris': ['soundcloud:']})
    await setRadio(mopidy, result[0]['tracks'].map(item => item.uri));
  });
}

function nextSong () {
  const mopidy = new Mopidy({
    webSocketUrl: `ws://${hostname}:6680/mopidy/ws/`,
  });
  mopidy.on("state", async () => {
    console.log('Next');
    client.publish("hermes/tts/say", `{"siteId":"default","lang": "es", "text":"Siguiente canción"}`)
    await mopidy.playback.next();
  });
}
