import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_URL = 'https://api.funtime.su/method';
const AUTH_TOKEN = '1c35802.ac061102e6227d543e7d6515c6081b0b';

export interface ServersInfoResponse {
  success: boolean;
  response: string[];
}
export type EventType = 'all' | 'system' | 'user';

export interface LocationEvent {
  x: number;
  y: number;
  z: number;
}

export interface EventInfo {
  'event-type': EventType;
  id?: string;
  'time-seconds-left': number;
  phase?: string;
  loot?: string;
  'location-announced'?: boolean | string;
  'location-event'?: LocationEvent;
}

export interface ServerEvents {
  server: string;
  events: EventInfo[];
}

export interface EventsInfoResponse {
  response: ServerEvents[];
}
@Injectable({ providedIn: 'root' })
export class Services {
  private readonly http = inject(HttpClient);

  getServersInfo(): Observable<ServersInfoResponse> {
    return this.http.get<ServersInfoResponse>(`${API_URL}/servers-info`, {
      headers: { 'Authorization-Token': AUTH_TOKEN },
    });
  }
  getEventsInfo(serverTypes: string[], eventType: EventType = 'all'): Observable<EventsInfoResponse> {
    return this.http.get<EventsInfoResponse>(`${API_URL}/events-info`, {
      headers: { 'Authorization-Token': AUTH_TOKEN },
      params: {
        'event-type': eventType,
        'server-type': serverTypes.join(','),
      },
    });
  }
}
