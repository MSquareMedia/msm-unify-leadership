/* Runs the real Code.gs and Thanks.gs against in-memory stand-ins for Google's services.
   Usage:  node apps-script/test/harness.js [output-dir]
   It checks validation, the Sheet row, both emails, double submits and rate limits for every seat,
   and writes sample emails to the output directory so you can open them in a browser. */
const fs = require("fs"), path = require("path"), vm = require("vm");
const root = path.join(__dirname, "..");
const outDir = process.argv[2] || path.join(__dirname, "out");
fs.mkdirSync(outDir, { recursive: true });

const outbox = [], rows = [], formats = [], formulas = {}, files = [];
const cacheStore = new Map();
const tzFmt = (d, fmt) => {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true }).formatToParts(d).map(x => [x.type, x.value]));
  const mon = p.month, mon3 = mon.slice(0, 3), mm = String(["January","February","March","April","May","June","July","August","September","October","November","December"].indexOf(mon) + 1).padStart(2, "0");
  return fmt.replace("yyyyMMdd", p.year + mm + String(p.day).padStart(2, "0")).replace("d MMMM yyyy", p.day + " " + mon + " " + p.year)
    .replace("d MMM yyyy, h:mm a", p.day + " " + mon3 + " " + p.year + ", " + p.hour + ":" + p.minute + " " + p.dayPeriod.toUpperCase());
};
const sheet = {
  getLastRow: () => rows.length + 1, getSheetId: () => 0,
  getRange: (r, c, nr, nc) => ({
    setNumberFormats: f => { formats[r] = f[0]; }, setValues: v => { rows[r - 2] = v[0]; },
    setFormula: f => { formulas[r + ":" + c] = f; }, setValue: v => { rows[r - 2][c - 1] = v; }
  })
};
const ctx = {
  console, Math, JSON, Date, String, Number, Object, Array, RegExp, Map, encodeURIComponent,
  CacheService: { getScriptCache: () => ({ get: k => cacheStore.get(k) || null, put: (k, v) => cacheStore.set(k, v) }) },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  Utilities: {
    newBlob: (bytes, type, name) => ({ bytes, type, name }), base64Decode: s => Buffer.from(s, "base64"), base64Encode: s => Buffer.from(s).toString("base64"),
    formatDate: (d, tz, fmt) => tzFmt(d, fmt)
  },
  DriveApp: { getFolderById: () => ({ createFile: blob => { files.push(blob); return { getUrl: () => "https://drive.google.com/file/d/FAKE" + files.length + "/view" }; } }) },
  SpreadsheetApp: { openById: () => ({ getSheetByName: () => sheet, getUrl: () => "https://docs.google.com/spreadsheets/d/FAKE/edit", insertSheet: () => sheet }), flush() {} },
  MailApp: { sendEmail: o => outbox.push(o) },
  ContentService: { MimeType: { JSON: "json" }, createTextOutput: s => ({ setMimeType() { return { getContent: () => s }; } }) }
};
vm.createContext(ctx);
for (const f of ["Thanks.gs", "Code.gs"]) vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), ctx, { filename: f });
const post = payload => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(payload) } }).getContent());
const seats = vm.runInContext("Object.keys(THANKS)", ctx);

let pass = 0, fail = 0;
const ok = (cond, msg) => { cond ? pass++ : (fail++, console.log("FAIL:", msg)); };
const base = i => ({
  ref: "LDR-20261111-T" + String(i).padStart(3, "0").slice(-3).replace(/\d/g, c => "ABCDEFGHIJ"[c]),
  data: { name: "Asha Verma", email: "asha" + i + "@example.com", phone: "+91 98100 00000", location: "Gurugram, India", title: "Chief Operating Officer", company: "Example Ltd", experience: "20 to 24", notice: "Up to 30 days", linkedin: "https://www.linkedin.com/in/asha", link: "", source: "LinkedIn", role: seats[i],
    case: "In the first 90 days I would map every market by revenue per student, choose the three corridors with the widest margin, and set a weekly review with one named owner for each gap." },
  resume: { name: "Asha-CV.pdf", type: "application/pdf", size: 40, base64: Buffer.from("%PDF-1.4 test").toString("base64") }
});

ok(JSON.parse(ctx.doGet().getContent()).ok === true, "doGet health check");
seats.forEach((s, i) => {
  const before = outbox.length, r = post(base(i));
  ok(r.ok === true, "seat accepted: " + s + " " + JSON.stringify(r));
  ok(outbox.length === before + 2, "two emails for " + s);
  const hr = outbox[before], cand = outbox[before + 1];
  ok(hr && hr.to === "hr@msmunify.com" && hr.subject.includes("Asha Verma") && hr.subject.includes(s), "HR subject names candidate and seat: " + (hr && hr.subject));
  ok(hr && hr.body.includes("Email: asha" + i + "@example.com") && hr.body.includes("Phone: +91 98100 00000") && hr.body.includes("Position: " + s), "HR email carries position, name, email, phone");
  ok(hr && hr.attachments && hr.attachments.length === 1, "resume attached for HR");
  ok(cand && cand.to === "asha" + i + "@example.com" && cand.replyTo === "hr@msmunify.com" && cand.name === "MSM Unify HR", "candidate email addressed from HR");
  ok(cand && cand.htmlBody.includes("Asha, we read this closely") && cand.htmlBody.includes("map every market"), "candidate email is personal: " + s);
  ok(cand && !/[—–]/.test(cand.htmlBody + cand.body + cand.subject), "no dashes in candidate email: " + s);
  ok(cand && !/\d\+|\+\d/.test(cand.htmlBody.replace(/%2B/g, "")), "no plus signs after figures in candidate email: " + s);
  if (i === 0 || i === 2 || i === seats.length - 1) {
    const tag = s.replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 40);
    fs.writeFileSync(path.join(outDir, "candidate-" + tag + ".html"), cand.htmlBody);
    if (i === 0) fs.writeFileSync(path.join(outDir, "hr-" + tag + ".html"), hr.htmlBody);
  }
});
ok(rows.length === seats.length, "one row per application: " + rows.length);
ok(rows[0][19] === "HR notified. Candidate emailed", "delivery status written: " + rows[0][19]);
ok(rows[0][16] === "New" && formats[2][0] === "@" && formats[2][15] === "General", "status New, text formats set");
ok(/HYPERLINK/.test(formulas["2:16"] || ""), "resume hyperlink formula");

// negative tests
const bad = (label, mut) => { const p = base(0); p.data.email = "neg" + label + "@example.com"; mut(p); const r = post(p); ok(r.ok === false, "rejects " + label + ": " + JSON.stringify(r)); };
bad("unknown seat", p => p.data.role = "CEO of Everything");
bad("bad email", p => p.data.email = "nope");
bad("short phone", p => p.data.phone = "123");
bad("no answer", p => p.data.case = "");
bad("bad extension", p => p.resume.name = "virus.exe");
bad("huge file", p => p.resume.base64 = "A".repeat(7 * 1024 * 1024));
bad("bad link", p => p.data.link = "javascript:alert(1)");
// double submit within ten minutes: same ref, no new emails
const dupBefore = outbox.length, again = post(base(0));
ok(again.ok && again.duplicate && outbox.length === dupBefore, "double submit is ignored");
// rate limit
let limited = false;
for (let k = 0; k < 6; k++) { const p = base(1); p.data.email = "spam@example.com"; p.data.role = seats[k]; const r = post(p); if (!r.ok) limited = true; }
ok(limited, "rate limit stops a flood from one address");
// formula injection: stored as text
const inj = base(2); inj.data.email = "inj@example.com"; inj.data.case = "=HYPERLINK(\"http://evil\",\"x\") plus a real answer long enough to pass validation of the answer field"; post(inj);
const last = rows[rows.length - 1];
ok(String(last[14]).startsWith("="), "injection stays literal text");
ok(formats[rows.length + 1][14] === "@", "injection cell formatted as text");
console.log(pass + " checks passed, " + fail + " failed. Seats tested: " + seats.length + ". Emails captured: " + outbox.length + ". Samples in " + outDir);
process.exit(fail ? 1 : 0);
