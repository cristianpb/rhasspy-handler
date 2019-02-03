const mqtt = require('mqtt');
const say = require('say')
const Mopidy = require("mopidy");
const hostname = "192.168.43.254";
const client  = mqtt.connect(`mqtt://${hostname}`);
const RADIOS = {
  'vibra': ['tunein:station:s84760'],
  'la mega': ['tunein:station:s86588'],
  'la carinosa': ['tunein:station:s143839'],
  'caracol': ['tunein:station:s16182']
}

client.on('connect', function () {
  console.log("[Snips Log] Connected to MQTT broker " + hostname);
  say.speak('Connected')
  client.subscribe('hermes/#');
});

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

function onIntentDetected(intent) {
  console.log("[Snips Log] Intent detected: " + JSON.stringify(intent));
  const {intent: {intentName} = null} = intent;
  if (intentName == 'cristianpb:radioOn') {
    console.log(intent);
    const {slots = null} = intent
    const {rawValue = null} = slots[0]
    if (Object.keys(RADIOS).indexOf(rawValue) >= 0) {
      connectMopidy(rawValue);
    } else {
      say.speak("Radio unkown");
    }
  }
}

function onHotwordDetected() {
    console.log("[Snips Log] Hotword detected");
}

function onListeningStateChanged(listening) {
    console.log("[Snips Log] " + (listening ? "Start" : "Stop") + " listening");
}

function connectMopidy(radio_name) {
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
  say.text(`Playing ${radio}`)
  await mopidy.tracklist.clear()
  await mopidy.playback.pause()
  await mopidy.tracklist.add({uris: RADIOS[radio]})
  tracks = await mopidy.tracklist.getTlTracks();
  await mopidy.playback.play({tlid: tracks[0].tlid});
}
