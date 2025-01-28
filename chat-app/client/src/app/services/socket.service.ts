import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;

  constructor() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    this.socket = io('http://localhost:3000', {
      transports: ['polling'], // Remove websocket for now
      auth: {
        token: currentUser?.token
      }
    });

    this.socket.on('connect', () => {
      console.log('Socket connected successfully:', this.socket.id);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }


  joinChannel(channelId: string) {
    console.log('Joining channel:', channelId);
    this.socket.emit('join-channel', channelId);
  }

  leaveChannel(channelId: string) {
    console.log('Leaving channel:', channelId);
    this.socket.emit('leave-channel', channelId);
  }

  sendMessage(message: any) {
    console.log('Sending message:', message);
    this.socket.emit('send-message', message);
  }

  onNewMessage(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('new-message', (message) => {
        console.log('New message received:', message);
        observer.next(message);
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}