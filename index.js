const mqtt = require('mqtt');
const say = require('say')
const Mopidy = require("mopidy");
const hostname = "192.168.43.254";
const client  = mqtt.connect(`mqtt://${hostname}`);
const RADIOS = {
  'vibra': ['tunein:station:s84760'],
  'la mega': ['tunein:station:s86588'],
  'la carinosa': ['tunein:station:s143839'],
  'caracol': ['tunein:station:s16182'],
  'clasica': ['tunein:station:s25732'],
  'suavecita': ['tunein:station:s33937'],
  'noventa': ['tunein:station:s89818']
}

client.on('connect', function () {
  console.log("[Snips Log] Connected to MQTT broker " + hostname);
  say.speak('Connected')
  client.subscribe('hermes/#');
  volumeSet(13);
});

client.on('message', function (topic, message) {
    if (topic === "hermes/asr/startListening") {
        say.speak('Yes ?')
        onListeningStateChanged(true);
    } else if (topic === "hermes/asr/stopListening") {
        onListeningStateChanged(false);
    } else if (topic.match(/hermes\/hotword\/.+\/detected/g) !== null) {
        onHotwordDetected()
    } else if (topic.match(/hermes\/intent\/.+/g) !== null) {
        onIntentDetected(JSON.parse(message));
    }
});

function onIntentDetected(intent) {
  console.log(`[Snips Log] Intent detected: ${JSON.stringify(intent)}`);
  const {intent: {intentName} = null} = intent;
  if (intentName == 'cristianpb:radioOn') {
    console.log(intent);
    const {slots = null} = intent
    if ((slots) && (slots.length > 0)) {
      const {rawValue = null} = slots[0]
      if (Object.keys(RADIOS).indexOf(rawValue) >= 0) {
        connectMopidyRadio(rawValue);
      } else {
        say.speak("Radio unkown");
      }
    } else {
    say.speak(`Don't know what to do`)
    }
  } else if (intentName == 'cristianpb:speakerInterrupt') {
    stopMopidy();
  } else if (intentName == 'cristianpb:volumeDown') {
    volumeDown();
  } else if (intentName == 'cristianpb:volumeUp') {
    volumeUp();
  } else if (intentName == 'cristianpb:volumeSet') {
    const {slots = null} = intent
    if ((slots) && (slots.length > 0)) {
      const {value = null} = slots[0]
      volumeSet(value['value']);
    } else {
    say.speak(`Don't know what to do with ${intentName}`)
    }
  } else {
    say.speak(`Don't know what to do`)
  }
}

function onHotwordDetected() {
  say.speak('Yes ?')
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
    console.log("Im", state);
    console.log(`Volume set to ${volumeNumber}`)
    await say.speak(`Volume set to ${volumeNumber}`)
    await mopidy.mixer.setVolume([Number(volumeNumber)])
    await mopidy.off();
  });
}

function volumeUp () {
  const mopidy = new Mopidy({
    webSocketUrl: `ws://${hostname}:6680/mopidy/ws/`,
  });
  mopidy.on("state", async (state) => {
    console.log('Volume up');
    say.speak(`Volume up`)
    await mopidy.mixer.setVolume([50])
    mopidy.off();
  });
}

function volumeDown () {
  const mopidy = new Mopidy({
    webSocketUrl: `ws://${hostname}:6680/mopidy/ws/`,
  });
  mopidy.on("state", async (state) => {
    console.log('Volume down');
    say.speak(`Volume down`)
    await mopidy.mixer.setVolume([10])
    mopidy.off();
  });
}


function stopMopidy() {
  const mopidy = new Mopidy({
    webSocketUrl: `ws://${hostname}:6680/mopidy/ws/`,
  });
  mopidy.on("state", async (state) => {
    console.log('Stopping moppidy');
    say.speak(`Stopping`)
    await mopidy.playback.pause()
    mopidy.off();
  });
}

function connectMopidyRadio(radio_name) {
  const mopidy = new Mopidy({
    webSocketUrl: `ws://${hostname}:6680/mopidy/ws/`,
  });
  mopidy.on("state", async (state) => {
    console.log('Seting', radio_name);
    await setRadio(mopidy, radio_name);
  });
  mopidy.on("event", console.log);
}

async function setRadio (mopidy, radio) {
  say.speak(`Playing ${radio}`)
  await mopidy.tracklist.clear()
  await mopidy.playback.pause()
  await mopidy.tracklist.add({uris: RADIOS[radio]})
  tracks = await mopidy.tracklist.getTlTracks();
  await mopidy.playback.play({tlid: tracks[0].tlid});
  mopidy.off();
}
