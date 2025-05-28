import { Injectable } from '@angular/core';
import SockJS from 'sockjs-client';
import { Client, IFrame, IMessage, Stomp } from '@stomp/stompjs';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Message } from '../models/message';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  private client: Client | null = null;
  private stompConnected = new BehaviorSubject<boolean>(false);
  private messageSubject = new Subject<Message>();

  constructor(private authService: AuthService) { }

  connect(): Observable<boolean> {
    if (!this.client) {
      const socket = new SockJS(`${environment.apiUrl}/ws`);
      this.client = Stomp.over(socket);

      this.client.connectHeaders = {
        Authorization: `Bearer ${this.authService.getToken()}`
      };

      this.client.onConnect = (frame: IFrame) => {
        console.log('Connected to WebSocket');
        this.stompConnected.next(true);
        this.subscribeToPrivateMessages();
      };

      this.client.onStompError = (frame: IFrame) => {
        console.error('STOMP error', frame);
        this.stompConnected.next(false);
      };

      this.client.activate();
    }

    return this.stompConnected.asObservable();
  }

  disconnect(): void {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.stompConnected.next(false);
    }
  }

  subsribeToConversation(conversationId: string): void {
    if (this.client && this.stompConnected.value) {
      this.client.subscribe(`/topic/conversation/${conversationId}`, (message: IMessage) => {
        const receivedMessage: Message = JSON.parse(message.body);
        this.messageSubject.next(receivedMessage);
      });
    }
  }

  private subscribeToPrivateMessages():void {
    if (this.client && this.stompConnected.value && this.authService.getCurrentUser()) {
      const username = this.authService.getCurrentUser()!.username;
      this.client.subscribe(`/user/${username}/queue/messages`, (message: IMessage) => {
        const receivedMessage: Message = JSON.parse(message.body);
        this.messageSubject.next(receivedMessage);
      });
    }
  }

  sendMessage(conversationId: string, content: string): void {
    if (this.client && this.stompConnected.value) {
      const currentUser = this.authService.getCurrentUser();
      if (currentUser) {
        this.client.publish({
          destination: `/app/chat/${conversationId}`,
          body: JSON.stringify({
            senderUsername: currentUser.username,
            content: content
          })
        });
      }
    }
  }

  getMessages(): Observable<Message> {
    return this.messageSubject.asObservable();
  }

  isConnected(): boolean {
    return this.stompConnected.value;
  }
}
