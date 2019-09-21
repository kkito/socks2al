import * as net from "net";
import { IClientHandler } from "./protocal";
import { Logger } from "./utils/logger";

let seqSeed: number = 1;
export class ClientHandler implements IClientHandler {
  public static ipbytes(str: string): Buffer {
    const nums = str.split(".", 4);
    const bytes = Buffer.alloc(4);
    for (let i = 0; i < 4; ++i) {
      bytes[i] = parseInt(nums[i], 10);
    }
    return bytes;
  }

  public version = 2;

  protected socket: net.Socket;
  protected unHandleBuffer: Buffer = Buffer.alloc(0);
  protected inited = false;
  protected connected = false;
  protected seq: number;

  constructor(socket: net.Socket) {
    this.socket = socket;
    this.seq = seqSeed += 1;
    this.socket.on("data", data => {
      this.onData(data);
    });

    // TODO other event
  }

  protected onData(data: Buffer) {
    Logger.info("======= onData " + this.seq);
    Logger.info(JSON.stringify(data));
    Logger.info(data.toString());
    this.unHandleBuffer = Buffer.concat([this.unHandleBuffer, data]);
    this.handleData();
  }

  protected handleData(): boolean {
    if (!this.inited) {
      if (this.unHandleBuffer.length >= 3) {
        // TODO 第三位 0-255 位数据，怎么截取？
        const data = this.unHandleBuffer.slice(0, 3);
        if (data[0] !== 5) {
          throw new Error(`invalid version ${data[0]}`);
        }
        Logger.info("======= write ==");
        // TODO 第二位返回值是0 不用登陆，还有其他类型
        this.socket.write(Buffer.from([5, 0]));
        this.inited = true;
        this.unHandleBuffer.slice(3);
        this.unHandleBuffer = this.unHandleBuffer.slice(3);
      }
    } else if (!this.connected) {
      // 已经初始化之后数据处理
      if (this.unHandleBuffer.length >= 5) {
        const hostSize = this.unHandleBuffer.readInt8(4);
        Logger.info(`request host size is ${hostSize}`);
        const fullSize = 5 + hostSize + 2;
        if (this.unHandleBuffer.length >= fullSize) {
          const data = this.unHandleBuffer.slice(0, fullSize);
          this.unHandleBuffer = this.unHandleBuffer.slice(fullSize);
          const host = data.slice(5, 5 + hostSize).toString();
          Logger.info(`host is ${host}`);
          if (host !== "www.baidu.com") {
            return false;
          }
          const port = data.readInt16BE(5 + hostSize);
          Logger.info(`port is ${port}`);

          const dstSock = new net.Socket();
          dstSock.setKeepAlive(false);
          dstSock
            .on("connect", () => {
              Logger.info("connnecteddddddd");
              let writeBuf = Buffer.from([5, 0, 0, 0x01]);
              writeBuf = Buffer.concat([
                writeBuf,
                ClientHandler.ipbytes(dstSock.localAddress)
              ]);
              Logger.info(`local address ${dstSock.localAddress}`);
              Logger.info(`local port ${dstSock.localPort}`);
              const portBuf = Buffer.alloc(2);
              portBuf.writeUInt16BE(dstSock.localPort, 0, true);
              writeBuf = Buffer.concat([writeBuf, portBuf]);

              Logger.info(`write to client port is ${writeBuf.length}`);
              Logger.info(JSON.stringify(writeBuf));
              this.socket.write(writeBuf);
              this.connected = true;
              Logger.info(`done write to client port is ${writeBuf.length}`);
              this.socket.pipe(dstSock).pipe(this.socket);
              this.socket.resume();
            })
            .connect(443, "182.61.200.6");
        }
      }
    } else {
      Logger.info(`conntected!!!!!!`);
    }
    return false;
  }
}
