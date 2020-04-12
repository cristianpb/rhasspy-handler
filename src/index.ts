import { connect } from 'mqtt';
import { exec } from 'shelljs';
import { CronJob } from 'cron';
import { RhasspyMopidy } from './rhasppymopidy';
import { blinking, changeState } from './relay';

const hostname = process.env.HOST;
const client = connect(`mqtt://${hostname}`);
const rhasspymopidy = new RhasspyMopidy()

const job = new CronJob({
  // At minute 0 past every hour from 9 through 21.”
  cronTime: '00 9-21 * * *',
  onTick: function () {
	  blinking(5000);
	  let currentTime = new Date();
	  rhasspymopidy.speak(`Son las ${currentTime.toTimeString().substring(0, 2).replace(/^0+/, '')}`);
  },
  timeZone: 'Europe/Paris'
});
job.start();

/* On Connect MQTT */
client.on('connect', () => {
  console.log('[Handler Log] Connected to MQTT broker ' + hostname);
  client.subscribe('hermes/#');
  rhasspymopidy.subscribeOnline();
});

/* On Message */
client.on('message', (topic, message) => {
  if (topic === 'hermes/asr/startListening') {
    onListeningStateChanged(true);
  } else if (topic === 'hermes/asr/stopListening') {
    onListeningStateChanged(false);
  } else if (topic.match(/hermes\/hotword\/.+\/detected/g) !== null) {
    onHotwordDetected()
  } else if (topic.match(/hermes\/intent\/.+/g) !== null) {
    onIntentDetected(JSON.parse(message.toString()));
  }
});

interface Slot {
  slotName: string;
  confidence: number;
  value: {
    kind: string;
    value: string;
  }
  rawValue: string
}

interface Intent {
  sessionId: string;
  siteId: string;
  input: string;
  intent: {
    intentName: string;
    confidenceScore: number;
  }
  slots: Slot[];
  asrTokens: [];
  asrConfidence: number;
}

/* Snips actions */
function onIntentDetected (intent: Intent) { //TODO
  console.log(`[Handler Log] Intent detected: ${JSON.stringify(intent)}`);
  const {intent: {intentName} = null} = intent;
  if (intentName === 'RadioOn') {
    const {slots = null} = intent
    let slotValues; 
    if ((slots) && (slots.length > 0)) {
      slotValues = slots.map((slot: Slot) => slot.value.value)
      rhasspymopidy.radioOn(slotValues[0]);
    } else {
      rhasspymopidy.radioOn(null);
    }
  } else if (intentName === 'SpeakerInterrupt') {
    rhasspymopidy.stopMopidy();
  } else if (intentName === 'PlayArtist') {
    const {slots = null} = intent
    if ((slots) && (slots.length > 0)) {
      const slotValues = slots.map((slot: Slot) => slot.value.value)
      rhasspymopidy.searchArtist(slotValues[0]);
    }
  } else if (intentName === 'PlayList') {
    const {slots = null} = intent
    if ((slots) && (slots.length > 0)) {
      const slotValues = slots.map((slot: Slot) => slot.value.value)
      rhasspymopidy.setPlaylist(slotValues[0]);
    }
  } else if (intentName === 'VolumeDown') {
    rhasspymopidy.volumeDown();
  } else if (intentName === 'NextSong') {
    rhasspymopidy.nextSong();
  } else if (intentName === 'VolumeUp') {
    rhasspymopidy.volumeUp();
  } else if (intentName === 'VolumeSet') {
    const {slots = null} = intent
    if ((slots) && (slots.length > 0)) {
      const slotValues = slots.map((slot: Slot) => parseInt(slot.value.value))
      rhasspymopidy.volumeSet(slotValues[0]);
    } else {
      rhasspymopidy.speak(`No se que volumen poner`);
    }
  } else if (intentName === 'ChangeLightState') {
	  const {slots = null} = intent
    if ((slots) && (slots.length > 0)) {
      const slotValues = slots.map((slot: Slot) => slot.value.value)
      if (slotValues[0] == 'encender') changeState(1);
      if (slotValues[0] == 'apagar') changeState(0);
    }
  } else if (intentName === 'LightsOn') {
	  changeState(1);
	  rhasspymopidy.speak(`encendido`);
  } else if (intentName === 'LightsOff') {
	  changeState(0);
	  rhasspymopidy.speak(`apagado`);
  } else if (intentName === 'RebootService') {
    const {slots = null} = intent
    if ((slots) && (slots.length > 0)) {
      const {value = null} = slots[0]
      console.log('GET', value['value']);
      if (value['value'] === 'raspi') restartCommand(`systemctl restart rhasspy.service`, 'rhasspy reiniciado');
      if (value['value'] === 'mopidy') restartCommand('systemctl restart mopidy.service', 'mopidy reiniciado');
      if (value['value'] === 'aplicación') restartCommand('systemctl restart handler.service', 'applicacion reininicada');
      if (value['value'] === 'raspberry') restartCommand('reboot', 'reiniciado');
    } else {
      rhasspymopidy.speak(`No entendí ${intentName}`);
    }
  } else {
    rhasspymopidy.speak('No se que hacer');
  }
}

function onHotwordDetected () {
	blinking(1000);
	rhasspymopidy.speak("Si?")
	console.log('[Handler Log] Hotword detected');
}

function onListeningStateChanged (listening: boolean) {
  console.log('[Handler Log] ' + (listening ? 'Start' : 'Stop') + ' listening');
}

function restartCommand (command: string, message: string) {
  exec(command, function (_, __, stderr) {
    if (stderr) {
      rhasspymopidy.speak('Hay un pequeno problema');
    } else {
      rhasspymopidy.speak(message);
    }
  });
}

process.on('SIGINT', function () {
  client.unsubscribe('hermes/#');
  rhasspymopidy.close();
  console.log('Bye, bye!');
	process.exit(0);
});
