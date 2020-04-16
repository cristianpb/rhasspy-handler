export interface Client {
  name: string;
  id: string;
}

export interface ClientsRaw {
  config: {
    instance: number;
    latency: number;
    name: string;
    volume: {
      muted: boolean;
      percent: number;
    }
  };
  connected:boolean;
  host:{
    arch: string;
    ip: string;
    mac: string;
    name: string;
    os: string;
  };
  id: string;
  lastSeen:{
    sec: number;
    usec: number;
  };
  snapclient:{
    name: string;
    protocolVersion: number;
    version: string;
  };
}

export interface GroupsRaw {
  clients: ClientsRaw[];
  id: string;
  muted: boolean;
  name: string;
  stream_id: string;
}

