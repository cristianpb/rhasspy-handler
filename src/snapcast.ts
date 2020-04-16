import WebSocket from 'ws';
import { GroupsRaw, ClientsRaw, Client } from './@types/snapcast';

const hostname = process.env.HOST;
export const ws = new WebSocket(`ws://${hostname}:1780/jsonrpc`);
//const ws = new WebSocket('ws://10.3.141.129:1780/jsonrpc');

const clients: Client[] = []

/* Error Event Handler */
ws.on('error',  (e) => {
  // need to get both the statusCode and the reason phrase
  console.log('[Snapcast]: error:', e);
});

ws.on('open', () => {
  console.log('[Snapcast]: Connected')
  let message = {
      jsonrpc: '2.0',
      id: 8,
      method: 'Server.GetStatus',
  }
  ws.send(JSON.stringify(message));
});
 
ws.on('message', (message: any) => {
  handleMessage(message);
});

function handleMessage (message: any) {
  console.log('[Snapcast]: ', message)
  let { result } = JSON.parse(message)
  if (result && result.server && result.server.groups) {
    let clientsRaw = result.server.groups.map((x:GroupsRaw) => x.clients.pop())
    clientsRaw.forEach((x:ClientsRaw) => clients.push({id: x.id, name: x.host.name}))
    volumeSetSnapcast('raspi', 100);
    volumeSetSnapcast('raspicam', 30);
    volumeSetSnapcast('raspimov', 30);
  }
}

export function volumeSetSnapcast(name:string, volumeLevel: number) {
  let id = clients.find((x:Client)=> x.name == name) ? clients.find((x:Client)=> x.name == name).id : null
  if (id) {
    let message = { 
      id:8,
      jsonrpc:"2.0",
      method:"Client.SetVolume",
      params:{
        id,
        volume:{"muted":false,"percent":volumeLevel}
      }
    }
    ws.send(JSON.stringify(message));
    console.log(`[Handler snapcast]: volumen set to ${name}`);
  } else {
    console.log("[Snapcast]: No client with this name");
  }
}
