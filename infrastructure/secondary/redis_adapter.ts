import { Redis } from '@upstash/redis'
import type { DatabasePort, ConversationMeta } from '@domain/ports/database_port.ts';

export function createRedisDatabaseAdapter(url: string, token: string): DatabasePort {
  const redisClient = new Redis({ url, token });
  const kMeta = (id: string) => `conv:${id}:meta`;
  const kMsgs = (id: string) => `conv:${id}:msgs`;
  return {
    async appendMessages(sessionId: string, title: string, model: string, shouldPersistMeta: boolean, ...contents: Array<string>) {
      const ts = new Date().toISOString();
      const metaKey = kMeta(sessionId);
      const msgsKey = kMsgs(sessionId);

      shouldPersistMeta && await redisClient.json.set(
        metaKey,
        '$',
        { title, model, createdAt: ts, updatedAt: ts, messagesKey: msgsKey },
        { nx: true }
      );

      await redisClient.rpush(msgsKey, ...contents);
      !shouldPersistMeta && await redisClient.expire(msgsKey, 1000);
      shouldPersistMeta && await redisClient.json.merge(metaKey, '$', { updatedAt: ts });
    },
    async getConversationMessages(sessionId: string) {
      const rawMessages = await redisClient.lrange(kMsgs(sessionId), 0, -1);
      if (!rawMessages?.length) return [];

      return rawMessages.map((content, index)=> ({
        role: index % 2 ? 'assistant' : 'user', content
      }));
    },
    async getConversations() {
      let scanCursor = "0";
      const [_cursor, metaKeys] = await redisClient.scan(scanCursor, { match: "*:meta" });
      const metaValues = metaKeys.length > 0 ? await redisClient.json.mget<Array<ConversationMeta>>(metaKeys, "$") : [];
      return metaValues.flat();
    }
  }
}
