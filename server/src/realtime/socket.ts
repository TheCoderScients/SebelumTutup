import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { env } from '../config/env.js';

let io: Server | null = null;
const onlineSockets = new Set<string>();

export function initRealtime(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: env.NODE_ENV === 'production' ? false : env.CLIENT_ORIGIN,
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    onlineSockets.add(socket.id);
    broadcastOnlineCount();

    socket.on('post:join', (postId: string) => {
      if (typeof postId === 'string' && postId.length < 80) {
        socket.join(`post:${postId}`);
      }
    });

    socket.on('post:leave', (postId: string) => {
      if (typeof postId === 'string' && postId.length < 80) {
        socket.leave(`post:${postId}`);
      }
    });

    socket.on('disconnect', () => {
      onlineSockets.delete(socket.id);
      broadcastOnlineCount();
    });
  });

  return io;
}

export function getOnlineCount() {
  return onlineSockets.size;
}

export function broadcastOnlineCount() {
  io?.emit('site:online_count', { count: getOnlineCount() });
}

export function emitPostCreated(payload: unknown) {
  io?.emit('post:created', payload);
}

export function emitPostUpdated(postId: string, payload: unknown) {
  io?.emit('post:updated', payload);
}

export function emitPostDeleted(postId: string) {
  io?.emit('post:deleted', { postId });
}

export function emitCommentCreated(postId: string, payload: unknown) {
  io?.to(`post:${postId}`).emit('comment:created', payload);
}

export function emitReactionUpdated(postId: string, payload: unknown) {
  io?.emit('reaction:updated', payload);
}

export function emitVoteUpdated(postId: string, payload: unknown) {
  io?.emit('vote:updated', payload);
}
