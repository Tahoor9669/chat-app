import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChannelService {
  private apiUrl = 'http://localhost:3000/api/channels';

  constructor(private http: HttpClient) {}

  getChannelMessages(channelId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${channelId}/messages`);
  }

  sendMessage(channelId: string, message: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${channelId}/messages`, message);
  }

  getChannels(groupId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/group/${groupId}`);
  }
}