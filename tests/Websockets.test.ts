import WebSocket from 'ws';
import { GroupsRaw, ClientsRaw, Client } from '../src/@types/snapcast';

//const ws = new WebSocket('ws://localhost:1780/jsonrpc');
const ws = new WebSocket('ws://10.3.141.129:1780/jsonrpc');

const clients: Client[] = []

/* Error Event Handler */
ws.on('error',  (e) => {
  // need to get both the statusCode and the reason phrase
  console.log(e);
});

ws.on('open', () => {
  console.log("OPEN")
  let message = {
      jsonrpc: '2.0',
      id: 8,
      method: 'Server.GetStatus',
  }
  ws.send(JSON.stringify(message));
  setTimeout(function timeout() {
    setVolume(clients.filter((x:Client)=> x.name == 'raspimov').pop().id, 20)
  }, 1500);
});
 
ws.on('message', (message: any) => {
  handleMessage(message);
});

function handleMessage (message: any) {
  console.log(message)
  let { result } = JSON.parse(message)
  if (result && result.server && result.server.groups) {
    let clientsRaw = result.server.groups.map((x:GroupsRaw) => x.clients.pop())
    clientsRaw.forEach((x:ClientsRaw) => clients.push({id: x.id, name: x.host.name}))
  }
}

function setVolume(id:string, volumeLevel: number) {
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
}
