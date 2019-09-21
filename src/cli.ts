import { Server } from "./server";
import { Logger } from "./utils/logger";

const s = new Server({host:'0.0.0.0', port:4321, timeout: 600})
Logger.info(`${s}`)

