import { connect } from 'mqtt';
import { onIntentDetected } from '../src/index';
import { Intent } from '../src/@types/intent';
import { RhasspyMopidy, mopidyClient } from '../src/rhasspymopidy';

const hostname = process.env.HOST;
const client = connect(`mqtt://${hostname}`);
const rhasspymopidy = new RhasspyMopidy()

class IntentJest implements Intent {
  sessionId = "";
  siteId = "";
  input = "";
  intent: any;
  slots: any[];
  asrTokens: any;
  asrConfidence = 1;
  constructor(intentName: string, slot: string|null) {
    this.intent = {
      intentName: intentName,
      confidenceScore: 1,
    }
    this.slots = slot ? [{
      value: {
        value: slot
      }
    }] : []
  }
}

const intentRadio = new IntentJest('RadioOn', 'vibra')
const intentVolumeDown = new IntentJest('VolumeDown', null)
const intentVolumeSet = new IntentJest('VolumeSet', '15')
const intentSilence = new IntentJest('SpeakerInterrupt', null)
const intentLightsOn = new IntentJest('LightsOn', null)
const intentPlaylist = new IntentJest('PlayList', 'viva latino')

client.on('connect', () => {
  mopidyClient.on('state:online', async () => {
    //onIntentDetected(intentVolumeUp)
    //onIntentDetected(intentVolumeDown)
    onIntentDetected(intentVolumeSet)
    //onIntentDetected(intentSilence)
    //onIntentDetected(intentLightsOn)
    //onIntentDetected(intentPlaylist)
    //onIntentDetected(intentRadio)
  })
})
