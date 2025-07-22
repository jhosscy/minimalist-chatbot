import { Redis } from '@upstash/redis'
import type { DatabasePort } from '../../domain/ports/database_port.ts';

export function createRedisDatabaseAdapter(url: string, token: string): DatabasePort {
  const redisClient = new Redis({ url, token })
  return {
    async appendMessages(sessionId: string, ...messages: Array<string>) {
      await redisClient.rpush(sessionId, ...messages);
      await redisClient.expire(sessionId, 300);
    },
    async getConversationMessages(sessionId: string) {
      const rawMessages = await redisClient.lrange(sessionId, 0, -1);
      if (!rawMessages?.length) [];

      return rawMessages.map((content, index)=> ({
        role: index % 2 ? 'assistant' : 'user', content
      }));
    }
  }
}
