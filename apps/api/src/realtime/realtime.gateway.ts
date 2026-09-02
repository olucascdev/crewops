import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import type { Server, Socket } from "socket.io";

@WebSocketGateway({
  cors: {
    origin: process.env.WEB_ORIGIN?.split(",") ?? ["http://localhost:3000"],
    credentials: true,
  },
})
export class RealtimeGateway {
  @WebSocketServer()
  server!: Server;

  @SubscribeMessage("technician.location_event")
  locationEvent(@MessageBody() body: unknown, @ConnectedSocket() socket: Socket) {
    socket.broadcast.emit("operations.location_event", body);
    return { accepted: true };
  }
}
