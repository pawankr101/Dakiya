import type { Response } from "./index.js";
import { Dictionary } from "@dakiya/shared";

export class SSEManager {
    static #clients = new Dictionary<Response>();
}
