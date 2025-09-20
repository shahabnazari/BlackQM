import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthenticatedSocket extends Socket {
  userId?: string;
  surveyId?: string;
}

export class WebSocketService {
  private static instance: WebSocketService;
  private io: SocketIOServer | null = null;
  private connectedUsers: Map<string, Set<string>> = new Map();

  private constructor() {}

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  public initialize(server: Server): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupMiddleware();
    this.setupEventHandlers();

    console.log('WebSocket service initialized');
  }

  private setupMiddleware(): void {
    if (!this.io) return;

    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token;

        if (!token) {
          return next(new Error('Authentication required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
          userId: string;
        };
        socket.userId = decoded.userId;

        // Verify user exists
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
        });

        if (!user) {
          return next(new Error('User not found'));
        }

        next();
      } catch (error: any) {
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`User ${socket.userId} connected`);

      // Track connected users
      this.addUserConnection(socket.userId!, socket.id);

      // Join survey room
      socket.on('join:survey', async (surveyId: string) => {
        try {
          // Verify user has access to survey
          const survey = await prisma.survey.findFirst({
            where: {
              id: surveyId,
              OR: [
                { createdBy: socket.userId },
                {
                  collaborations: {
                    some: {
                      userId: socket.userId,
                    },
                  },
                },
              ],
            },
          });

          if (!survey) {
            socket.emit('error', 'Access denied to survey');
            return;
          }

          socket.surveyId = surveyId;
          socket.join(`survey:${surveyId}`);

          // Notify others in the room
          socket.to(`survey:${surveyId}`).emit('user:joined', {
            userId: socket.userId,
            surveyId,
          });

          console.log(`User ${socket.userId} joined survey ${surveyId}`);
        } catch (error) {
          console.error('Error joining survey room:', error);
          socket.emit('error', 'Failed to join survey');
        }
      });

      // Leave survey room
      socket.on('leave:survey', (surveyId: string) => {
        socket.leave(`survey:${surveyId}`);
        socket.to(`survey:${surveyId}`).emit('user:left', {
          userId: socket.userId,
          surveyId,
        });
      });

      // Grid update events
      socket.on('grid:update', async (data: any) => {
        if (!socket.surveyId) {
          socket.emit('error', 'Not in a survey room');
          return;
        }

        // Broadcast to all users in the survey room
        socket.to(`survey:${socket.surveyId}`).emit('grid:updated', {
          userId: socket.userId,
          ...data,
        });
      });

      // Grid cell change
      socket.on('grid:cellChange', (data: any) => {
        if (!socket.surveyId) return;

        socket.to(`survey:${socket.surveyId}`).emit('grid:cellChanged', {
          userId: socket.userId,
          ...data,
        });
      });

      // Upload progress events
      socket.on('upload:progress', (data: any) => {
        if (!socket.surveyId) return;

        socket.to(`survey:${socket.surveyId}`).emit('upload:progressUpdate', {
          userId: socket.userId,
          ...data,
        });
      });

      // Stimulus upload complete
      socket.on('stimulus:uploaded', async (data: any) => {
        if (!socket.surveyId) return;

        // Broadcast to all users in the survey room
        socket.to(`survey:${socket.surveyId}`).emit('stimulus:added', {
          userId: socket.userId,
          ...data,
        });
      });

      // Collaboration cursor tracking
      socket.on('cursor:move', (data: any) => {
        if (!socket.surveyId) return;

        socket.to(`survey:${socket.surveyId}`).emit('cursor:moved', {
          userId: socket.userId,
          ...data,
        });
      });

      // Typing indicators
      socket.on('typing:start', (data: any) => {
        if (!socket.surveyId) return;

        socket.to(`survey:${socket.surveyId}`).emit('typing:started', {
          userId: socket.userId,
          ...data,
        });
      });

      socket.on('typing:stop', (data: any) => {
        if (!socket.surveyId) return;

        socket.to(`survey:${socket.surveyId}`).emit('typing:stopped', {
          userId: socket.userId,
          ...data,
        });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected`);

        this.removeUserConnection(socket.userId!, socket.id);

        if (socket.surveyId) {
          socket.to(`survey:${socket.surveyId}`).emit('user:disconnected', {
            userId: socket.userId,
          });
        }
      });
    });
  }

  // Helper methods for managing connections
  private addUserConnection(userId: string, socketId: string): void {
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, new Set());
    }
    this.connectedUsers.get(userId)!.add(socketId);
  }

  private removeUserConnection(userId: string, socketId: string): void {
    const connections = this.connectedUsers.get(userId);
    if (connections) {
      connections.delete(socketId);
      if (connections.size === 0) {
        this.connectedUsers.delete(userId);
      }
    }
  }

  // Public methods for emitting events from other services
  public joinRoom(clientId: string, room: string): void {
    if (this.io) {
      const socket = this.io.sockets.sockets.get(clientId);
      if (socket) {
        socket.join(room);
      }
    }
  }

  public leaveRoom(clientId: string, room: string): void {
    if (this.io) {
      const socket = this.io.sockets.sockets.get(clientId);
      if (socket) {
        socket.leave(room);
      }
    }
  }

  public sendToClient(clientId: string, event: string, data: any): void {
    if (this.io) {
      this.io.to(clientId).emit(event, data);
    }
  }

  public sendToRoom(room: string, event: string, data: any): void {
    if (this.io) {
      this.io.to(room).emit(event, data);
    }
  }

  public emitToRoom(room: string, event: string, data: any): void {
    if (this.io) {
      this.io.to(room).emit(event, data);
    }
  }

  public emitToUser(userId: string, event: string, data: any): void {
    const connections = this.connectedUsers.get(userId);
    if (connections && this.io) {
      connections.forEach((socketId) => {
        this.io!.to(socketId).emit(event, data);
      });
    }
  }

  public broadcastToAll(event: string, data: any): void {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  public sendToStudy(studyId: string, data: any): void {
    this.emitToRoom(`study:${studyId}`, 'study:update', data);
  }

  public getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  public isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  public getRoomMembers(room: string): string[] {
    if (!this.io) return [];

    const roomSockets = this.io.sockets.adapter.rooms.get(room);
    if (!roomSockets) return [];

    const members: string[] = [];
    roomSockets.forEach((socketId) => {
      const socket = this.io!.sockets.sockets.get(
        socketId,
      ) as AuthenticatedSocket;
      if (socket?.userId) {
        members.push(socket.userId);
      }
    });

    return members;
  }
}
