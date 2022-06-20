import { Injectable } from '@nestjs/common';
import * as moment from 'moment';

@Injectable()
export class ChatService {
  formatMessage(username: string, text: string) {
    return {
      username,
      text,
      time: moment().format('h:mm a'),
    };
  }
}
