import type { Response } from "./index.js";
import { Dictionary } from "../utils/index.js";

/****** Type Declarations: Start ***** */

type Res = Response<'http1'>;

/****** Type Declarations: End ***** */

export class SSEManager {
    static #clients = new Dictionary<Res>();


}
