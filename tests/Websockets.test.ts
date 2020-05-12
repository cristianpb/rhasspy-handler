import WebSocket from 'ws';
import { GroupsRaw, ClientsRaw, Group } from '../src/@types/snapcast';

const ws = new WebSocket('ws://localhost:1780/jsonrpc');

let groups: Group[] = []

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
    groups.forEach(group => {
      console.log("gop", group);
      group.clients.forEach(client => {
      if (client.name == 'raspimov') setVolume(client.id, 20)
      })
    })
  }, 2500);
});
 
ws.on('message', (message: any) => {
  handleMessage(message);
});

function handleMessage (message: any) {
  console.log(message)
  let { result } = JSON.parse(message)
  if (result && result.server && result.server.groups) {
    groups = result.server.groups.map((group:GroupsRaw) => {
      return {
        group: group.id,
        clients: group.clients.map((client: ClientsRaw) => {
          console.log('client', client.host.name);
          return {id: client.id, name: client.host.name}
        })
      }
    })
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
