import * as net from 'net'
import { ClientHandler } from './client-handler';
import { IServer, IServerOptions } from "./protocal";
import { Logger } from './utils/logger';

export class Server implements IServer {
  public todo = 1

  public constructor(options:IServerOptions) {
    const server = net.createServer(client => {
      client.setTimeout(options.timeout)
      // tslint:disable-next-line:no-unused-expression
      new ClientHandler(client)
      Logger.info('new handler!')

    })

    server.listen({
      host: options.host,
      port: options.port
    })
    Logger.info(`server start ${options.host}:${options.port}`)
  }

}
