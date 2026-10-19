import { Router } from "express";
import type { DatabaseSync } from "node:sqlite";
import { limitOf } from "./helpers.ts";
import type { VaultBalancePage, VaultEventPage } from "./types.ts";

/** `GET /vault/:address` and its append-only funding history. */
export function vaultRouter(db: DatabaseSync): Router {
  const r = Router();

  r.get("/vault/:address", (req, res) => {
    const address = String(req.params.address);
    const balances = db
      .prepare(
        `SELECT e.token, e.balance, e.ledger
           FROM vault_events e
          WHERE e.user = ?
            AND NOT EXISTS (
              SELECT 1 FROM vault_events newer
               WHERE newer.user = e.user
                 AND newer.token = e.token
                 AND (newer.ledger > e.ledger OR
                      (newer.ledger = e.ledger AND newer.rowid > e.rowid))
            )
          ORDER BY e.token`,
      )
      .all(address) as VaultBalancePage["balances"];
    res.json({ address, balances } satisfies VaultBalancePage);
  });

  r.get("/vault/:address/events", (req, res) => {
    const address = String(req.params.address);
    const events = db
      .prepare(
        `SELECT tx_hash, kind, user, token, counterparty, amount, balance, ledger
           FROM vault_events
          WHERE user = ?
          ORDER BY ledger DESC, rowid DESC
          LIMIT ?`,
      )
      .all(address, limitOf(req.query.limit)) as VaultEventPage["events"];
    res.json({ address, events } satisfies VaultEventPage);
  });

  return r;
}