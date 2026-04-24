import { connect } from 'mqtt';
import { exec } from 'shelljs';
import { CronJob } from 'cron';
import { blinking, changeState } from './relay';
import { ledsOn, ledsOff, ledsYellow, ledsRed, stopLoop } from './lights';
import { Slot, Intent } from './@types/intent';

const hostname = process.env.HOST_MQTT || 'localhost';
const PORT_MQTT = process.env.PORT_MQTT || 1883;
const client = connect(`mqtt://${hostname}:${PORT_MQTT}`);

CronJob.from({
	cronTime: '00 11-21 * * 1-5',
	onTick: () => {
	  blinking(5000);
	  let currentTime = new Date();
	  // RhasspyMopidy.speak(`Son las ${currentTime.toTimeString().substring(0, 2).replace(/^0+/, '')}`);
  },
	start: true,
	timeZone: 'Europe/Paris'
});

/* On Connect MQTT */
client.on('connect', () => {
  console.log('[Handler Log] Connected to MQTT broker ' + hostname);
  ledsOff()
  client.subscribe('hermes/#');
});

/* On Message */
client.on('message', (topic) => {
  if (topic == 'hermes/blink') {
    blinking(5000);
  } else if (topic == 'hermes/ledsOn') {
    ledsOn()
  } else if (topic == 'hermes/ledsOff') {
    ledsOff()
  } else if (topic === 'hermes/lightsOn') {
	  changeState(1);
  } else if (topic === 'hermes/lightsOff') {
	  changeState(0);
  } 
});

/* On Error */
client.on('error', (error) => {
  console.log("[Handler Log] Error");
  console.log("[Handler Log] Error: " + error);
});

/* Rhasspy actions */
export function onIntentDetected (intent: Intent) { //TODO
  console.log(`[Handler Log] Intent detected: ${JSON.stringify(intent)}`);
  const intentName = intent && intent.intent ? intent.intent.intentName : undefined;
  const {slots = null} = intent
  let slotValues; 
  if ((slots) && (slots.length > 0)) {
    slotValues = slots.map((slot: Slot) => slot.value.value)[0]
  }
  if (intentName === 'RebootService') {
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
        break;
    }
  }
}

function restartCommand (command: string, message: string) {
  exec(command, function (_, __, stderr) {
    console.log('Hay un pequeno problema');
  });
}

process.on('SIGINT', function () {
  client.unsubscribe('hermes/#');
  console.log('Bye, bye!');
	process.exit(0);
});
