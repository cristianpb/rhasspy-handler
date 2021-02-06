import { connect } from 'mqtt';
import { exec } from 'shelljs';
import { CronJob } from 'cron';
import { RhasspyMopidy } from './rhasppymopidy';
import { volumeSetSnapcast } from './snapcast';
import { blinking, changeState } from './relay';
import { ledsOn, ledsOff, ledsYellow, ledsRed, stopLoop } from './lights';
import { setWakeUpAlarm, listCurrentAlarms, deleteAllAlarms, listNextAlarms } from './alarms';
import { Slot, Intent } from './@types/intent';

const hostname = process.env.HOST_MQTT;
const PORT_MQTT = process.env.PORT_MQTT || 1883;
const client = connect(`mqtt://${hostname}:${PORT_MQTT}`);
const rhasspymopidy = new RhasspyMopidy()

const job = new CronJob({
  // At minute 0 past every hour from 9 through 21.”
  cronTime: '00 11-21 * * 1-5',
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
  ledsOff()
  client.subscribe('hermes/#');
  client.subscribe('rhasspy/#');
  rhasspymopidy.subscribeOnline();
});

/* On Message */
client.on('message', (topic, message) => {
  if (topic == 'hermes/asr/startListening') {
    onListeningStateChanged(true);
  } else if (topic == 'hermes/asr/stopListening') {
    onListeningStateChanged(false);
  } else if (topic.match(/hermes\/intent\/.+/g) !== null) {
    ledsYellow()
    onIntentDetected(JSON.parse(message.toString()));
  } else if (topic == 'hermes/nlu/intentNotRecognized') {
    ledsRed()
  }
});

/* Rhasspy actions */
export function onIntentDetected (intent: Intent) { //TODO
  console.log(`[Handler Log] Intent detected: ${JSON.stringify(intent)}`);
  const {intent: {intentName} = null} = intent;
  const {slots = null} = intent
  let slotValues; 
  if ((slots) && (slots.length > 0)) {
    slotValues = slots.map((slot: Slot) => slot.value.value)[0]
  }
  if (intentName === 'RadioOn') {
    rhasspymopidy.radioOn(slotValues);
  } else if (intentName === 'SpeakerInterrupt') {
    rhasspymopidy.stopMopidy();
  } else if (intentName === 'PlayArtist') {
    rhasspymopidy.searchArtist(slotValues);
  } else if (intentName === 'PlayList') {
    rhasspymopidy.setPlaylist(slotValues);
  } else if (intentName === 'NextSong') {
    rhasspymopidy.nextSong();
  } else if (intentName === 'VolumeUp') {
    rhasspymopidy.volumeUp();
  } else if (intentName === 'VolumeDown') {
    rhasspymopidy.volumeDown();
  } else if (intentName === 'VolumeSet') {
    processVolume(slotValues, slots)
  } else if (intentName === 'LightsOn') {
	  changeState(1);
	  rhasspymopidy.speak(`encendido`);
  } else if (intentName === 'LightsOff') {
	  changeState(0);
	  rhasspymopidy.speak(`apagado`);
  } else if (intentName === 'SetWakeUpAlarm') {
    processAlarm(slotValues, slots)
  } else if (intentName === 'ListCurrentAlarms') {
    listCurrentAlarms();
  } else if (intentName === 'ListNextAlarms') {
    listNextAlarms();
  } else if (intentName === 'DeleteAllAlarms') {
    deleteAllAlarms();
  } else if (intentName === 'RebootService') {
    switch (slotValues) {
      case 'raspi':
        restartCommand(`systemctl restart rhasspy.service`, 'rhasspy reiniciado');
        break;
      case 'mopidy':
        restartCommand('systemctl restart mopidy.service', 'mopidy reiniciado');
        break;
      case 'aplicación':
        restartCommand('systemctl restart handler.service', 'applicacion reininicada');
        break;
      case 'snapcast':
        restartCommand('systemctl restart snapclient.service', 'applicacion reininicada');
        break;
      case 'raspberry':
        restartCommand('reboot', 'reiniciado');
        break;
      default:
        rhasspymopidy.speak(`No entendí ${intentName}`);
        break;
    }
  } else {
    rhasspymopidy.speak('No se que hacer');
  }
}

function onHotwordDetected () {
	console.log('[Handler Log] Hotword detected');
}

function onListeningStateChanged (listening: boolean) {
  if (listening) ledsOn()
  if (!listening) stopLoop()
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

const processAlarm = (slotValues: string|number, slots: Slot[]) => {
  let hour
  let minutes
  if (slotValues && slots.length > 1) {
    slots.forEach((slot: Slot) => {
      if (slot.slotName === 'hour') {
        hour = Number(slot.value.value)
      }
    })
    slots.forEach((slot: Slot) => {
      if (slot.slotName === 'minutes') {
        minutes = Number(slot.value.value)
      }
    })
    if (hour && minutes && hour < 24 && minutes < 60) {
      setWakeUpAlarm(hour, minutes);
    } else {
      rhasspymopidy.speak(`Entendí ${hour} y ${minutes}`);
    }
  } else {
    rhasspymopidy.speak(`No entendí la hora de la alarma`);
  }
}

const processVolume = (slotValues: string|number, slots: Slot[]) => {
  let volume
  let place
  if (slotValues && slots.length > 1) {
    slots.forEach((slot: Slot) => {
      if (slot.slotName === 'volumeLevel') {
        volume = Number(slot.value.value)
      }
    })
    slots.forEach((slot: Slot) => {
      if (slot.slotName === 'place') {
        place = slot.value.value
      }
    })
    if (volume && volume < 100 && place) {
      if (place === 'sala') volumeSetSnapcast('raspimov', volume)
      if (place === 'habitación') volumeSetSnapcast('raspi', volume)
      if (place === 'cocina') volumeSetSnapcast('raspicam', volume)
    } else if (volume && volume < 100) {
      rhasspymopidy.volumeSet(volume);
    } else {
      rhasspymopidy.speak(`No se que volumen poner`);
    }
  } else {
    rhasspymopidy.speak(`No entendí el volumen a poner`);
  }
}


process.on('SIGINT', function () {
  client.unsubscribe('hermes/#');
  rhasspymopidy.close();
  console.log('Bye, bye!');
	process.exit(0);
});
