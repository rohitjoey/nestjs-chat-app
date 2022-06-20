import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ChatService } from './chat.service';
// @WebSocketGateway(80, { namespace: 'chat' })

type user = {
  id: string;
  username: string;
  room: string;
};

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private chatService: ChatService) {}
  @WebSocketServer()
  server: Server;
  users: user[] = [];
  botName = 'Bot';

  private logger: Logger = new Logger('ChatGateway');

  afterInit() {
    this.logger.log('Init');
  }

  @SubscribeMessage('joinRoom')
  handleJoin(
    @MessageBody() msgObject: { username: string; room: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user: user = {
      id: client.id,
      username: msgObject.username,
      room: msgObject.room,
    };
    this.users.push(user);

    client.join(user.room);
    client.emit(
      'chat',
      this.chatService.formatMessage(
        this.botName,
        `Welcome ${user.username.toUpperCase()}`,
      ),
    );

    client.broadcast
      .to(user.room)
      .emit(
        'chat',
        this.chatService.formatMessage(
          this.botName,
          `${user.username.toUpperCase()} has joined the chat`,
        ),
      );

    const roomUsers = this.users.filter(
      (element) => element.room === user.room,
    );
    this.server.to(user.room).emit('roomUsers', { room: user.room, roomUsers });
  }

  async handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // console.log('disconnnect');
    const index = this.users.findIndex((user) => user.id === client.id);
    let leavingUser: user;
    if (index !== -1) {
      leavingUser = this.users.splice(index, 1)[0];
    }
    if (leavingUser) {
      this.server
        .to(leavingUser.room) //because the splice method return in form of an array
        .emit(
          'chat',
          this.chatService.formatMessage(
            this.botName,
            `${leavingUser.username.toUpperCase()} has left the chat`,
          ),
        );

      const roomUsers = this.users.filter(
        (element) => element.room === leavingUser.room,
      );
      this.server
        .to(leavingUser.room)
        .emit('roomUsers', { room: leavingUser.room, roomUsers });
    }
  }

  @SubscribeMessage('chat')
  handleMessage(
    @MessageBody() message: string,
    @ConnectedSocket() client: Socket,
  ): void {
    // console.log(message);

    const currentUser = this.users.find((element) => element.id === client.id);
    this.server
      .to(currentUser.room)
      .emit(
        'chat',
        this.chatService.formatMessage(currentUser.username, message),
      );
  }
}
