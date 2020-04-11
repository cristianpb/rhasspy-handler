const mqtt = require('mqtt');
const Parser = require('rss-parser');
const fs = require('fs');
const Path = require('path');
const axios = require('axios');
const shell = require('shelljs');
const CronJob = require('cron').CronJob;
require('dotenv').config()
const hostname = process.env.HOST;
const client = mqtt.connect(`mqtt://${hostname}`);
const SnipsMopidy = require('./snipsmopidy');
const relay = require('./relay');

const job = new CronJob({
  // At minute 0 past every hour from 9 through 21.”
  cronTime: '00 9-21 * * *',
  onTick: function () {
	  relay.blinking(5000);
	  let currentTime = new Date();
	  SnipsMopidy.speak(`Feliz navidad, son las ${currentTime.toTimeString().substring(0, 2).replace(/^0+/, '')}`);
  },
  timeZone: 'Europe/Paris'
});
job.start();

/* On Connect MQTT */
client.on('connect', function () {
  console.log('[Snips Log] Connected to MQTT broker ' + hostname);
  downloadPostcast(
    'http://fapi-top.prisasd.com/podcast/caracol/la_luciernaga/itunestfp/podcast.xml'
  );
  client.subscribe('hermes/#');
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
function onIntentDetected (intent) {
  console.log(`[Snips Log] Intent detected: ${JSON.stringify(intent)}`);
  const {intent: {intentName} = null} = intent;
  if (intentName === 'cristianpb:radioOn') {
    SnipsMopidy.radioOn(intent);
  } else if (intentName === 'cristianpb:speakerInterrupt') {
    SnipsMopidy.stopMopidy();
  } else if (intentName === 'cristianpb:playArtist') {
    console.log(intent);
    const {slots = null} = intent
    if ((slots) && (slots.length > 0)) {
      const {value = null} = slots[0];
      SnipsMopidy.searchArtist([value.value]);
    }
  } else if (intentName === 'cristianpb:volumeDown') {
    SnipsMopidy.volumeDown();
  } else if (intentName === 'cristianpb:nextSong') {
    SnipsMopidy.nextSong();
  } else if (intentName === 'cristianpb:volumeUp') {
    SnipsMopidy.volumeUp();
  } else if (intentName === 'cristianpb:volumeSet') {
    const {slots = null} = intent
    if ((slots) && (slots.length > 0)) {
      const {value = null} = slots[0]
      SnipsMopidy.volumeSet(value['value']);
    } else {
      SnipsMopidy.speak(`No entendí ${intentName}`);
    }
  } else if (intentName === 'ChangeLightState') {
	  const {slots = null} = intent
	    if ((slots) && (slots.length > 0)) {
	      const {value = null} = slots[0]
		    console.log('VVV', value);
		    if (value['value'] == 'encender') relay.changeState(1);
		    if (value['value'] == 'apagar') relay.changeState(0);
	    }
  } else if (intentName === 'LightsOn') {
	  relay.changeState(1);
	  SnipsMopidy.speak(`Esta mierda se prendió`);
  } else if (intentName === 'LightsOff') {
	  relay.changeState(0);
	  SnipsMopidy.speak(`Duérmase chino marica`);
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
      SnipsMopidy.speak(`No entendí ${intentName}`);
    }
  } else {
    SnipsMopidy.speak('No se que hacer');
  }
}

function onHotwordDetected () {
	relay.blinking(1000);
	SnipsMopidy.speak("Si?")
	console.log('[Snips Log] Hotword detected');
}

function onListeningStateChanged (listening) {
  console.log('[Snips Log] ' + (listening ? 'Start' : 'Stop') + ' listening');
}

function restartCommand (command, message) {
  shell.exec(command, function (code, stdout, stderr) {
    if (stderr) {
      SnipsMopidy.speak('Hay un pequeno problema');
    } else {
      SnipsMopidy.speak(message);
    }
  });
}

async function downloadPostcast (url) {
  let parser = new Parser();
  let feed = await parser.parseURL(url);
  console.log('RSS: ', feed.title);

  const dir = process.env.PODCAST_DIR; // '/var/lib/mopidy/media'
  const files = fs
    .readdirSync(dir)
    .map(fileName => {
      return {
        name: fileName,
        time: fs.statSync(dir + '/' + fileName).mtime.getTime()
      };
    })
    .sort((a, b) => b.time - a.time) // Sort decending order
    .map(v => v.name);

  feed.items.slice(0, 5).forEach(async item => {
    let pieces = item.guid.split('/');
    console.log(`Checking : ${pieces[pieces.length - 1]}`);
    if (files.indexOf(pieces[pieces.length - 1]) === -1) {
      console.log(`Downloading ${item.title}:${item.guid}`);
      let { guid } = item;
      await downloadFile(guid, pieces);
    }
  });

  // Delete old files
  if (files.length > 5) {
    files.slice(6, files.length).forEach(item => {
      console.log(`Removing ${item}`);
      let path = Path.resolve(dir, item);
      fs.unlinkSync(path);
    });
  }
}

async function downloadFile(guid, pieces) {
  let path = Path.resolve(process.env.PODCAST_DIR, pieces[pieces.length - 1]);
  const writer = fs.createWriteStream(path);
  const response = await axios({
    url: guid,
    method: 'GET',
    responseType: 'stream'
  });
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

process.on('SIGINT', function () {
  console.log('Bye, bye!');
	process.exit(0);
});
