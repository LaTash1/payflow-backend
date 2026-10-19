import { Router } from "express";
import type { DatabaseSync } from "node:sqlite";
import type { ProtocolResponse } from "./types.ts";

/** `GET /protocol`: latest indexed fee and its change history. */
export function protocolRouter(db: DatabaseSync): Router {
  const r = Router();

  r.get("/protocol", (_req, res) => {
    const history = db
      .prepare(
        `SELECT tx_hash, old_fee_bps, new_fee_bps, ledger
           FROM fee_history
          ORDER BY ledger DESC, rowid DESC`,
      )
      .all() as ProtocolResponse["history"];
    const body: ProtocolResponse = {
      fee_bps: history[0]?.new_fee_bps ?? null,
      history,
    };
    res.json(body);
  });

  return r;
}