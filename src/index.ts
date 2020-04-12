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
client.on('connect', function () {
  console.log('[Handler Log] Connected to MQTT broker ' + hostname);
  client.subscribe('hermes/#');
  rhasspymopidy.subscribeOnline();
});

/* On Message */
client.on('message', function (topic, message) {
  if (topic === 'hermes/asr/startListening') {
    onListeningStateChanged(true);
  } else if (topic === 'hermes/asr/stopListening') {
    onListeningStateChanged(false);
  } else if (topic.match(/hermes\/hotword\/.+\/detected/g) !== null) {
    onHotwordDetected()
  } else if (topic.match(/hermes\/intent\/.+/g) !== null) {
    onIntentDetected(JSON.parse(message));
  }
});

/* Snips actions */
function onIntentDetected (intent: any) { //TODO
  console.log(`[Handler Log] Intent detected: ${JSON.stringify(intent)}`);
  const {intent: {intentName} = null} = intent;
  if (intentName === 'cristianpb:radioOn') {
    rhasspymopidy.radioOn(intent);
  } else if (intentName === 'cristianpb:speakerInterrupt') {
    rhasspymopidy.stopMopidy();
  } else if (intentName === 'cristianpb:playArtist') {
    console.log(intent);
    const {slots = null} = intent
    if ((slots) && (slots.length > 0)) {
      const {value = null} = slots[0];
      rhasspymopidy.searchArtist([value.value]);
    }
  } else if (intentName === 'cristianpb:volumeDown') {
    rhasspymopidy.volumeDown();
  } else if (intentName === 'cristianpb:nextSong') {
    rhasspymopidy.nextSong();
  } else if (intentName === 'cristianpb:volumeUp') {
    rhasspymopidy.volumeUp();
  } else if (intentName === 'cristianpb:volumeSet') {
    const {slots = null} = intent
    if ((slots) && (slots.length > 0)) {
      const {value = null} = slots[0]
      rhasspymopidy.volumeSet(value['value']);
    } else {
      rhasspymopidy.speak(`No entendí ${intentName}`);
    }
  } else if (intentName === 'ChangeLightState') {
	  const {slots = null} = intent
	    if ((slots) && (slots.length > 0)) {
	      const {value = null} = slots[0]
		    console.log('VVV', value);
		    if (value['value'] == 'encender') changeState(true);
		    if (value['value'] == 'apagar') changeState(false);
	    }
  } else if (intentName === 'LightsOn') {
	  changeState(true);
	  rhasspymopidy.speak(`Esta mierda se prendió`);
  } else if (intentName === 'LightsOff') {
	  changeState(false);
	  rhasspymopidy.speak(`Duérmase chino marica`);
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
