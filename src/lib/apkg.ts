/**
 * Build a real Anki `.apkg` package entirely in the browser.
 *
 * An .apkg is a zip containing a SQLite database (`collection.anki2`) plus a
 * `media` manifest. We replicate Anki's documented schema (the same approach as
 * genanki) so the file imports natively — with a proper note type and deck, no
 * manual field mapping.
 *
 * Cards are exported as fresh "new" cards: the receiving Anki schedules them
 * from scratch. (Mnemo Med keeps its own spaced-repetition state locally.)
 *
 * sql.js (SQLite/wasm) and jszip are imported dynamically so they only load
 * when a user actually exports.
 */

export interface ApkgCard {
  front: string;
  back: string;
  tags: string[];
}

const SCHEMA = `
CREATE TABLE col (
  id integer primary key, crt integer not null, mod integer not null,
  scm integer not null, ver integer not null, dty integer not null,
  usn integer not null, ls integer not null, conf text not null,
  models text not null, decks text not null, dconf text not null, tags text not null
);
CREATE TABLE notes (
  id integer primary key, guid text not null, mid integer not null,
  mod integer not null, usn integer not null, tags text not null,
  flds text not null, sfld integer not null, csum integer not null,
  flags integer not null, data text not null
);
CREATE TABLE cards (
  id integer primary key, nid integer not null, did integer not null,
  ord integer not null, mod integer not null, usn integer not null,
  type integer not null, queue integer not null, due integer not null,
  ivl integer not null, factor integer not null, reps integer not null,
  lapses integer not null, left integer not null, odue integer not null,
  odid integer not null, flags integer not null, data text not null
);
CREATE TABLE revlog (
  id integer primary key, cid integer not null, usn integer not null,
  ease integer not null, ivl integer not null, lastIvl integer not null,
  factor integer not null, time integer not null, type integer not null
);
CREATE TABLE graves (usn integer not null, oid integer not null, type integer not null);
CREATE INDEX ix_notes_usn on notes (usn);
CREATE INDEX ix_cards_usn on cards (usn);
CREATE INDEX ix_revlog_usn on revlog (usn);
CREATE INDEX ix_cards_nid on cards (nid);
CREATE INDEX ix_cards_sched on cards (did, queue, due);
CREATE INDEX ix_revlog_cid on revlog (cid);
CREATE INDEX ix_notes_csum on notes (csum);
`;

const CARD_CSS = `.card {
  font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  font-size: 20px; text-align: center; color: #14181f; background: #fff;
}
hr#answer { height: 1px; border: 0; background: #d7dce5; margin: 16px 0; }`;

function guid(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let s = "";
  for (let i = 0; i < 10; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

async function fieldChecksum(text: string): Promise<number> {
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(text));
  const hex = [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return parseInt(hex.slice(0, 8), 16);
}

function sanitizeTag(t: string): string {
  return t.trim().replace(/\s+/g, "_");
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportApkg(deckName: string, cards: ApkgCard[], filename: string): Promise<void> {
  if (cards.length === 0) throw new Error("No cards to export.");

  const initSqlJs = (await import("sql.js")).default;
  const wasmUrl = (await import("sql.js/dist/sql-wasm.wasm?url")).default;
  const JSZip = (await import("jszip")).default;

  const SQL = await initSqlJs({ locateFile: () => wasmUrl });
  const db = new SQL.Database();
  db.run(SCHEMA);

  const now = Date.now();
  const nowS = Math.floor(now / 1000);
  const modelId = now;
  const deckId = now + 1;
  const deck = (deckName || "Mnemo Med").trim() || "Mnemo Med";

  const models = {
    [modelId]: {
      id: modelId,
      name: "Mnemo Med Basic",
      type: 0,
      mod: nowS,
      usn: -1,
      sortf: 0,
      did: deckId,
      tmpls: [
        {
          name: "Card 1",
          ord: 0,
          qfmt: "{{Front}}",
          afmt: '{{FrontSide}}\n\n<hr id="answer">\n\n{{Back}}',
          bqfmt: "",
          bafmt: "",
          did: null,
          bfont: "",
          bsize: 0,
        },
      ],
      flds: [
        { name: "Front", ord: 0, sticky: false, rtl: false, font: "Arial", size: 20, media: [] },
        { name: "Back", ord: 1, sticky: false, rtl: false, font: "Arial", size: 20, media: [] },
      ],
      css: CARD_CSS,
      latexPre: "",
      latexPost: "",
      req: [[0, "any", [0]]],
      tags: [],
      vers: [],
    },
  };

  const decks = {
    "1": {
      id: 1, name: "Default", mod: nowS, usn: -1, lrnToday: [0, 0], revToday: [0, 0],
      newToday: [0, 0], timeToday: [0, 0], collapsed: false, browserCollapsed: false,
      desc: "", dyn: 0, conf: 1, extendNew: 10, extendRev: 50,
    },
    [deckId]: {
      id: deckId, name: deck, mod: nowS, usn: -1, lrnToday: [0, 0], revToday: [0, 0],
      newToday: [0, 0], timeToday: [0, 0], collapsed: false, browserCollapsed: false,
      desc: "Exported from Mnemo Med", dyn: 0, conf: 1, extendNew: 10, extendRev: 50,
    },
  };

  const dconf = {
    "1": {
      id: 1, name: "Default", mod: 0, usn: 0, maxTaken: 60, autoplay: true, timer: 0, replayq: true,
      new: { bury: true, delays: [1, 10], initialFactor: 2500, ints: [1, 4, 7], order: 1, perDay: 20 },
      rev: { bury: true, ease4: 1.3, ivlFct: 1, maxIvl: 36500, perDay: 200, hardFactor: 1.2 },
      lapse: { delays: [10], leechAction: 1, leechFails: 8, minInt: 1, mult: 0 },
      dyn: false,
    },
  };

  const conf = {
    nextPos: cards.length + 1, estTimes: true, activeDecks: [1], sortType: "noteFld",
    timeLim: 0, sortBackwards: false, addToCur: true, curDeck: deckId, newBury: true,
    newSpread: 0, dueCounts: true, curModel: String(modelId), collapseTime: 1200,
  };

  db.run(
    "INSERT INTO col VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
    [1, nowS, now, now, 11, 0, 0, 0, JSON.stringify(conf), JSON.stringify(models), JSON.stringify(decks), JSON.stringify(dconf), "{}"]
  );

  for (let i = 0; i < cards.length; i++) {
    const c = cards[i];
    const noteId = now + i * 2;
    const cardId = now + i * 2 + 1;
    const front = c.front.trim();
    const back = c.back.trim();
    const flds = `${front}${back}`;
    const tags = c.tags.length ? ` ${c.tags.map(sanitizeTag).filter(Boolean).join(" ")} ` : "";
    const csum = await fieldChecksum(front);

    db.run("INSERT INTO notes VALUES (?,?,?,?,?,?,?,?,?,?,?)", [
      noteId, guid(), modelId, nowS, -1, tags, flds, front, csum, 0, "",
    ]);
    // type 0 = new, queue 0 = new; due = position
    db.run("INSERT INTO cards VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", [
      cardId, noteId, deckId, 0, nowS, -1, 0, 0, i + 1, 0, 0, 0, 0, 0, 0, 0, 0, "",
    ]);
  }

  const data = db.export();
  db.close();

  const zip = new JSZip();
  zip.file("collection.anki2", data);
  zip.file("media", "{}");
  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
  triggerDownload(blob, filename);
}
