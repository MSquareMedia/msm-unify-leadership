/* MSM Unify leadership microsite behavior. No scroll listeners: IntersectionObserver only. */
(function () {
  "use strict";

  var CFG = window.MSM_CONFIG || {};
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ROLES = window.ROLES || [];
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var money = function (s) { return String(s).replace(/Rs /g, "₹"); };
  var BEST_FIT = "Best fit, you decide";
  var ROOT = window.OPEN_ROLE ? "../../" : "";
  var HOME_PATH = window.OPEN_ROLE ? null : location.pathname;
  var SLA = window.SLA || { ack: 2, outcome: 5 };
  var BEST_FIT_THANKS = { lead: "You asked us to match you to the best-fit seat, so your application will be read against every open leadership role.", ready: "Come ready to tell us where you would add the most value in your first year, and how you would measure it." };
  function roleUrl(id) { return (window.SITE_URL || (location.origin + "/")) + "roles/" + id + "/"; }
  function setUrl(u) { try { history.replaceState(null, "", u); } catch (e) {} }

  /* ---------- Role cards ---------- */
  var grid = $("#rolesGrid"), soon = $("#soonGrid");
  ROLES.forEach(function (r, i) {
    var b = document.createElement("a");
    b.href = ROOT + "roles/" + r.id + "/";
    b.className = (r.soon ? "role role-soon" : "role") + " rv";
    b.style.setProperty("--i", i % 4);
    b.setAttribute("data-id", r.id);
    b.innerHTML =
      '<span class="role-ico"><i class="ph-bold ' + r.icon + '"></i></span>' +
      '<span class="role-main"><span class="role-fn">' + esc(r.fn) + "</span>" +
      "<h3>" + esc(r.title) + "</h3><p>" + esc(money(r.hook)) + "</p></span>" +
      '<span class="role-foot"><span class="chips">' + r.chips.map(function (c) { return '<span class="chip">' + esc(money(c)) + "</span>"; }).join("") + "</span>" +
      '<span class="role-go">' + (r.soon ? "Read more" : "Read the story") + ' <i class="ph-bold ph-arrow-right"></i></span></span>';
    b.addEventListener("click", function (e) { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return; e.preventDefault(); openStory(r.id, true); });
    (r.soon ? soon : grid).appendChild(b);
  });

  /* ---------- Story drawer ---------- */
  var dlg = $("#story"), body = $("#storyBody"), current = 0;
  function list(items) { return items.map(function (t) { return "<li>" + esc(money(t)) + "</li>"; }).join(""); }

  function renderStory(r) {
    var h = '<div class="story-hero"><div class="role-fn">' + esc(r.fn) + "</div>" +
      '<h2 id="storyTitle">' + esc(r.title) + "</h2><p>" + esc(money(r.hook)) + "</p>" +
      '<div class="chips">' + r.chips.map(function (c) { return '<span class="chip">' + esc(money(c)) + "</span>"; }).join("") + "</div></div>";
    if (r.soon) {
      h += '<div class="story-text"><h3>The full profile is coming</h3><p>We are finalizing the profile for this seat. Apply now and tell us why you fit. Your application will be considered for this seat as soon as its profile goes live.</p></div>';
      body.innerHTML = h; return;
    }
    h += '<div class="story-text"><h3>The story</h3>' + r.story.map(function (p) { return "<p>" + esc(money(p)) + "</p>"; }).join("") + "</div>";
    if (r.meta) h += '<div class="story-text"><p><strong>Where and who:</strong> ' + esc(r.meta) + "</p></div>";
    h += "<h3>What you would own</h3><ul class=\"owns\">" + r.owns.map(function (t) { return '<li><i class="ph-bold ph-arrow-bend-down-right"></i><span>' + esc(money(t)) + "</span></li>"; }).join("") + "</ul>";
    if (r.milestones) {
      h += "<h3>Your first year</h3><ul class=\"timeline\">" + r.milestones.map(function (m) { return "<li><b>" + esc(m.when) + "</b>" + esc(money(m.text)) + "</li>"; }).join("") + "</ul>";
    }
    if (r.measures) h += "<h3>" + esc(r.measuresTitle || "How success is measured") + "</h3><ul class=\"bring\">" + list(r.measures) + "</ul>";
    h += "<h3>Who thrives here</h3><ul class=\"bring\">" + list(r.bring) + "</ul>";
    h += '<div class="story-why">' + esc(money(r.why)) + "</div>";
    body.innerHTML = h + shareRow(r);
  }
  function shareRow(r) {
    var u = roleUrl(r.id), t = r.share.title + " | MSM Unify", enc = encodeURIComponent;
    return '<div class="share"><h3>Know someone for this seat?</h3><div class="share-btns">' +
      '<button type="button" class="chip-btn" data-copy="' + esc(u) + '"><i class="ph-bold ph-link"></i><span>Copy link</span></button>' +
      '<a class="chip-btn" target="_blank" rel="noopener" href="https://www.linkedin.com/sharing/share-offsite/?url=' + enc(u) + '"><i class="ph-bold ph-linkedin-logo"></i><span>LinkedIn</span></a>' +
      '<a class="chip-btn" target="_blank" rel="noopener" href="https://wa.me/?text=' + enc(t + " " + u) + '"><i class="ph-bold ph-whatsapp-logo"></i><span>WhatsApp</span></a>' +
      '<a class="chip-btn" target="_blank" rel="noopener" href="https://twitter.com/intent/tweet?text=' + enc(t) + "&url=" + enc(u) + '"><i class="ph-bold ph-x-logo"></i><span>X</span></a>' +
      '<a class="chip-btn" href="mailto:?subject=' + enc(t) + "&body=" + enc(r.share.desc + "\n\n" + u) + '"><i class="ph-bold ph-envelope-simple"></i><span>Email</span></a></div></div>';
  }
  body.addEventListener("click", function (e) {
    var b = e.target.closest("[data-copy]"); if (!b) return;
    var span = b.querySelector("span");
    (navigator.clipboard ? navigator.clipboard.writeText(b.dataset.copy) : Promise.reject()).then(function () { span.textContent = "Copied"; }, function () { span.textContent = "Press Ctrl C"; window.prompt("Copy this link", b.dataset.copy); });
    setTimeout(function () { span.textContent = "Copy link"; }, 2000);
  });

  function openStory(id, push) {
    var idx = ROLES.findIndex(function (r) { return r.id === id; });
    if (idx < 0) return;
    current = idx;
    renderStory(ROLES[idx]);
    body.scrollTop = 0;
    if (!dlg.open) { dlg.showModal(); document.body.style.overflow = "hidden"; }
    if (push) setUrl(ROOT + "roles/" + id + "/");
  }
  function step(d) { openStory(ROLES[(current + d + ROLES.length) % ROLES.length].id, true); }
  function closeStory() { dlg.close(); }
  $("#prevRole").addEventListener("click", function () { step(-1); });
  $("#nextRole").addEventListener("click", function () { step(1); });
  $("#closeStory").addEventListener("click", closeStory);
  dlg.addEventListener("click", function (e) { if (e.target === dlg) closeStory(); });
  dlg.addEventListener("close", function () { document.body.style.overflow = ""; if (HOME_PATH) setUrl(HOME_PATH); });
  dlg.addEventListener("keydown", function (e) { if (e.key === "ArrowRight") step(1); if (e.key === "ArrowLeft") step(-1); });

  /* ---------- Application: one question at a time ---------- */
  var form = $("#appForm"), qs = $$(".q", form), qi = 0;
  var backBtn = $("#backBtn"), nextBtn = $("#nextBtn"), sendBtn = $("#sendBtn"), enterHint = $("#enterHint");
  var DRAFT_KEY = "msm-leadership-draft-v2";
  var fileInput = $("#f-file"), dropText = $("#dropText"), drop = $("#drop"), dropHelp = $("#dropHelp"), dropBar = $("#dropBar");
  var caseEl = $("#f-case"), caseCount = $("#caseCount");
  var QID = qs.map(function (q) { return q.dataset.q; });
  var qIndex = function (id) { return QID.indexOf(id); };
  var GENERIC_NINETY = { q: "What would you change in your first 90 days?", chips: ["Listen and map the business", "Fix one broken process", "Win one early result", "Build the team", "Set the numbers we track"] };

  // Seat deck
  var deck = $("#deck");
  var seats = ROLES.map(function (r) { return { v: r.title, s: r.fn, h: r.hook, c: r.chips }; }).concat([{ v: BEST_FIT, s: "Flexible", h: "Not sure which seat fits? We will read you against every open seat.", c: [] }]);
  deck.innerHTML = seats.map(function (o) {
    return '<label class="seat-card"><input type="radio" name="role" value="' + esc(o.v) + '"><span class="sc-fn">' + esc(o.s) + '</span><span class="sc-t">' + esc(o.v) + '</span><span class="sc-h">' + esc(money(o.h)) + '</span><span class="sc-chips">' + o.c.map(function (c) { return "<em>" + esc(money(c)) + "</em>"; }).join("") + '</span><i class="ph-bold ph-check-circle"></i></label>';
  }).join("");
  $("#deckPrev").addEventListener("click", function () { deck.scrollBy({ left: -deck.clientWidth * 0.8, behavior: reduce ? "auto" : "smooth" }); });
  $("#deckNext").addEventListener("click", function () { deck.scrollBy({ left: deck.clientWidth * 0.8, behavior: reduce ? "auto" : "smooth" }); });

  function field(el) { return el.closest(".field"); }
  function setErr(el, msg) {
    var f = field(el); if (!f) return;
    f.classList.toggle("invalid", !!msg);
    var p = $(".err", f); if (p) p.textContent = msg || "";
    el.setAttribute("aria-invalid", msg ? "true" : "false");
  }
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function validUrl(v) { try { var u = new URL(v); return u.protocol === "http:" || u.protocol === "https:"; } catch (e) { return false; } }
  function checked(name) { return form.querySelector('input[name="' + name + '"]:checked'); }

  function validate(id) {
    var bad = null;
    function fail(el, msg) { setErr(el, msg); if (!bad) bad = el; }
    function val(name) { return form.elements[name].value.trim(); }
    if (id === "seat") {
      $("#err-role").textContent = checked("role") ? "" : "Choose a seat to continue.";
      if (!checked("role")) bad = form.querySelector('input[name="role"]');
    }
    if (id === "name") { if (!val("name")) fail(form.elements.name, "Tell us your name."); else setErr(form.elements.name, ""); }
    if (id === "reach") {
      if (!emailRe.test(val("email"))) fail(form.elements.email, "Enter a valid email address."); else setErr(form.elements.email, "");
      if (val("phone").replace(/\D/g, "").length < 8) fail(form.elements.phone, "Enter a phone number with country code."); else setErr(form.elements.phone, "");
    }
    if (id === "where") { if (!val("location")) fail(form.elements.location, "Tell us where you are based."); else setErr(form.elements.location, ""); }
    if (id === "work") {
      if (!val("title")) fail(form.elements.title, "Add your current title."); else setErr(form.elements.title, "");
      if (!val("company")) fail(form.elements.company, "Add your current company."); else setErr(form.elements.company, "");
    }
    if (id === "level") {
      ["experience", "notice"].forEach(function (n) {
        var first = form.querySelector('input[name="' + n + '"]');
        if (!checked(n)) fail(first, "Pick one."); else setErr(first, "");
      });
    }
    if (id === "linkedin") {
      var l = val("linkedin");
      if (!validUrl(l) || l.toLowerCase().indexOf("linkedin.com") < 0) fail(form.elements.linkedin, "Enter a LinkedIn link, for example https://www.linkedin.com/in/your-name"); else setErr(form.elements.linkedin, "");
    }
    if (id === "resume") {
      var f = fileInput.files[0], maxB = (CFG.maxResumeMB || 5) * 1048576;
      if (!f) fail(fileInput, "Attach your resume.");
      else if (!/\.(pdf|docx?)$/i.test(f.name)) fail(fileInput, "Use a PDF, DOC or DOCX file.");
      else if (f.size > maxB) fail(fileInput, "The file is larger than " + (CFG.maxResumeMB || 5) + " MB.");
      else setErr(fileInput, "");
    }
    if (id === "plan") {
      var t = caseEl.value.trim();
      if (t.length < 80) fail(caseEl, "Write at least 80 characters. You have " + t.length + "."); else setErr(caseEl, "");
    }
    if (id === "extras") {
      var u = form.elements.link; if (u.value.trim() && !validUrl(u.value.trim())) fail(u, "Enter a full link starting with https://"); else setErr(u, "");
    }
    if (id === "review") {
      var c = $("#f-consent");
      $("#err-consent").textContent = c.checked ? "" : "Please confirm to send your application.";
      if (!c.checked) bad = c;
    }
    if (bad) {
      bad.focus({ preventScroll: true });
      var host = bad.closest(".field") || bad.closest(".q");
      if (host && !reduce) { host.classList.remove("shake"); void host.offsetWidth; host.classList.add("shake"); }
    }
    return !bad;
  }

  var pathFill = $("#pathFill"), pathLabel = $("#pathLabel");
  function currentRole() { var r = checked("role"); return r ? r.value : ""; }
  function ninetyFor() {
    var r = ROLES.find(function (x) { return x.title === currentRole(); });
    return (r && r.ninety) || GENERIC_NINETY;
  }
  function renderPlan() {
    var n = ninetyFor();
    $("#planQ").textContent = n.q;
    $("#prompts").innerHTML = n.chips.map(function (c) { return '<button type="button" class="prompt">' + esc(money(c)) + "</button>"; }).join("");
  }
  $("#prompts").addEventListener("click", function (e) {
    var b = e.target.closest(".prompt"); if (!b) return;
    var cur = caseEl.value.replace(/\s+$/, "");
    caseEl.value = (cur ? cur + "\n" : "") + b.textContent + ": ";
    caseEl.focus(); caseEl.setSelectionRange(caseEl.value.length, caseEl.value.length);
    caseEl.dispatchEvent(new Event("input", { bubbles: true }));
    b.classList.add("used");
  });

  function go(n, dir) {
    n = Math.max(0, Math.min(QID.length - 1, n));
    form.dataset.dir = dir || (n >= qi ? "fwd" : "back");
    qs.forEach(function (q, i) { q.classList.toggle("is-active", i === n); });
    qi = n;
    var id = QID[n];
    if (id === "plan") renderPlan();
    if (id === "review") renderReview();
    backBtn.hidden = n === 0;
    nextBtn.hidden = id === "review";
    sendBtn.hidden = id !== "review";
    enterHint.hidden = id === "seat" || id === "review" || id === "plan" || id === "resume" || id === "level";
    pathFill.style.width = (QID.length > 1 ? (n / (QID.length - 1)) * 100 : 0) + "%";
    pathFill.parentNode.setAttribute("data-step", n);
    pathLabel.textContent = "Question " + (n + 1) + " of " + QID.length + ": " + qs[n].dataset.label;
    $("#seatChip").hidden = n === 0 || !currentRole();
    $("#seatChipName").textContent = currentRole();
    var target = id === "seat" ? (checked("role") || deck) : qs[n].querySelector("input:not([type=radio]):not([type=checkbox]):not([type=file]), textarea, input[type=radio]:checked, input[type=radio], input[type=checkbox], input[type=file]");
    if (target && target.focus) setTimeout(function () { try { target.focus({ preventScroll: true }); } catch (e) {} }, 60);
    save();
  }

  function advance() {
    var id = QID[qi];
    if (!validate(id)) return;
    if (id === "seat") flyChip();
    go(qi + 1, "fwd");
    scrollCard();
  }
  function flyChip() {
    var sel = checked("role"); if (!sel || reduce) return;
    var card = sel.closest(".seat-card"), chip = $("#seatChip"), from = card.getBoundingClientRect();
    chip.hidden = false; var to = chip.getBoundingClientRect(); chip.hidden = true;
    var clone = card.cloneNode(true); clone.className = "seat-card fly"; clone.style.cssText = "position:fixed;left:" + from.left + "px;top:" + from.top + "px;width:" + from.width + "px;height:" + from.height + "px;margin:0;z-index:70;pointer-events:none;";
    document.body.appendChild(clone);
    var dx = to.left - from.left, dy = to.top - from.top, sx = to.width / from.width, sy = to.height / from.height;
    var an = clone.animate([{ transform: "none", opacity: 1 }, { transform: "translate(" + dx + "px," + dy + "px) scale(" + sx + "," + sy + ")", opacity: 0.2 }], { duration: 650, easing: "cubic-bezier(0.16,1,0.3,1)" });
    an.onfinish = function () { clone.remove(); };
    setTimeout(function () { if (clone.parentNode) clone.remove(); }, 900);
  }
  function back() { go(qi - 1, "back"); }
  nextBtn.addEventListener("click", advance);
  backBtn.addEventListener("click", back);
  $("#seatChange").addEventListener("click", function () { go(0, "back"); });
  function scrollCard() { var c = $("#appCard"), r = c.getBoundingClientRect(); if (r.top < 0 || r.top > window.innerHeight * 0.4) c.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); }
  form.addEventListener("keydown", function (e) {
    if (e.key !== "Enter") return;
    var id = QID[qi], tag = e.target.tagName;
    if (tag === "TEXTAREA") { if (e.metaKey || e.ctrlKey) { e.preventDefault(); advance(); } return; }
    if (id === "review") return;
    if (tag === "BUTTON") return;
    e.preventDefault(); advance();
  });
  form.addEventListener("input", function (e) {
    var el = e.target; if (field(el) && field(el).classList.contains("invalid")) setErr(el, "");
    if (el === caseEl) caseCount.textContent = caseEl.value.length + " / 1200";
    save();
  });
  form.addEventListener("change", function (e) {
    if (e.target.name === "role") { $("#err-role").textContent = ""; $$(".seat-card", deck).forEach(function (c) { c.classList.toggle("is-sel", c.contains(e.target)); }); }
    var f = field(e.target); if (f && e.target.type === "radio") setErr(e.target, "");
    save();
  });

  // Review with edit shortcuts
  var LABELS = { role: "Seat", name: "Name", email: "Email", phone: "Phone", location: "Location", title: "Current title", company: "Company", experience: "Experience", notice: "Notice period", linkedin: "LinkedIn", link: "Portfolio", source: "Heard about us", case: "First 90 days" };
  var JUMP = { role: "seat", name: "name", email: "reach", phone: "reach", location: "where", title: "work", company: "work", experience: "level", notice: "level", linkedin: "linkedin", resume: "resume", case: "plan", link: "extras", source: "extras" };
  function data() {
    var d = {}; new FormData(form).forEach(function (v, k) { if (k !== "resume" && k !== "consent") d[k] = typeof v === "string" ? v.trim() : v; });
    return d;
  }
  function renderReview() {
    var d = data(), f = fileInput.files[0];
    var order = ["role", "name", "email", "phone", "location", "title", "company", "experience", "notice", "linkedin", "resume", "link", "source", "case"];
    $("#review").innerHTML = order.map(function (k) {
      var v = k === "resume" ? (f ? f.name : "") : d[k]; if (!v) return "";
      return '<div class="' + (k === "case" ? "wide" : "") + '"><dt>' + (k === "resume" ? "Resume" : LABELS[k]) + "</dt><dd>" + esc(v) + '</dd><button type="button" class="edit" data-go="' + JUMP[k] + '">Edit</button></div>';
    }).join("");
  }
  $("#review").addEventListener("click", function (e) { var b = e.target.closest(".edit"); if (b) go(qIndex(b.dataset.go), "back"); });

  // Resume drop zone: drag glow, simulated read progress, file card
  function fileChosen() {
    var f = fileInput.files[0];
    drop.classList.toggle("has-file", !!f); setErr(fileInput, "");
    if (!f) { dropText.innerHTML = "Drop your resume here or <u>browse</u>"; dropHelp.textContent = "PDF, DOC or DOCX, up to 5 MB"; $("#dropIcon").className = "ph-bold ph-upload-simple"; return; }
    dropText.innerHTML = "<b>" + esc(f.name) + "</b>"; dropHelp.textContent = (f.size / 1048576).toFixed(1) + " MB, ready";
    $("#dropIcon").className = "ph-bold ph-file-text";
    if (reduce) return;
    drop.classList.remove("loading"); void drop.offsetWidth; drop.classList.add("loading");
    setTimeout(function () { drop.classList.remove("loading"); }, 900);
  }
  fileInput.addEventListener("change", fileChosen);
  ["dragenter", "dragover"].forEach(function (ev) { drop.addEventListener(ev, function () { drop.classList.add("over"); }); });
  ["dragleave", "drop"].forEach(function (ev) { drop.addEventListener(ev, function () { drop.classList.remove("over"); }); });

  // Draft persistence (text answers only)
  function save() {
    try { var d = data(); d._q = qi; localStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch (e) {}
  }
  var restoredQ = 0;
  function restore() {
    try {
      var d = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null"); if (!d) return;
      Object.keys(d).forEach(function (k) {
        if (k === "_q") { restoredQ = d[k]; return; }
        var els = form.querySelectorAll('[name="' + k + '"]'); if (!els.length) return;
        if (els[0].type === "radio") { Array.prototype.forEach.call(els, function (r) { r.checked = r.value === d[k]; }); }
        else if (els[0].type !== "file" && els[0].type !== "checkbox") els[0].value = d[k];
      });
      var sel = checked("role"); if (sel) sel.closest(".seat-card").classList.add("is-sel");
      caseCount.textContent = caseEl.value.length + " / 1200";
    } catch (e) {}
  }
  restore();

  function setRole(title, goNext) {
    var r = Array.prototype.find.call(form.querySelectorAll('input[name="role"]'), function (i) { return i.value === title; });
    if (r) { r.checked = true; $$(".seat-card", deck).forEach(function (c) { c.classList.toggle("is-sel", c.contains(r)); }); $("#err-role").textContent = ""; r.closest(".seat-card").scrollIntoView({ inline: "center", block: "nearest" }); }
    if (goNext) go(1, "fwd"); else save();
  }

  // Submit
  function toBase64(file) {
    return new Promise(function (res, rej) {
      var fr = new FileReader();
      fr.onload = function () { res(String(fr.result).split(",")[1] || ""); };
      fr.onerror = function () { rej(fr.error); };
      fr.readAsDataURL(file);
    });
  }
  function makeRef() {
    var d = new Date(), p = function (n) { return String(n).padStart(2, "0"); };
    return "LDR-" + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var err = $("#sendErr"); err.textContent = "";
    var ids = QID.slice(0, -1).concat(["review"]);
    for (var i = 0; i < ids.length; i++) { if (!validate(ids[i])) { go(i, "back"); validate(ids[i]); return; } }
    if (form.company_website.value) { return finish(makeRef(), true); }
    var d = data(), f = fileInput.files[0], ref = makeRef();
    sendBtn.disabled = true; sendBtn.classList.add("is-busy"); $("span", sendBtn).textContent = "Sending";
    toBase64(f).then(function (b64) {
      var payload = { ref: ref, submittedAt: new Date().toISOString(), page: location.href.split("#")[0], data: d, resume: { name: f.name, type: f.type || "application/octet-stream", size: f.size, base64: b64 } };
      if (!CFG.applyEndpoint) { return new Promise(function (r) { setTimeout(function () { console.info("Preview mode, not sent:", payload.ref, d); r("demo"); }, 1100); }); }
      return fetch(CFG.applyEndpoint, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) })
        .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
        .then(function (j) { if (!j || !j.ok) throw new Error((j && j.error) || "Rejected"); return "sent"; });
    }).then(function (mode) { finish(ref, false, mode === "demo"); })
      .catch(function (ex) {
        console.error(ex);
        err.textContent = "We could not send your application. Check your connection and try again. Your answers are still here.";
        sendBtn.disabled = false; sendBtn.classList.remove("is-busy"); $("span", sendBtn).textContent = "Send application";
      });
  });

  var lastPass = null;
  function finish(ref, silent, demo) {
    var d = data(), first = (d.name || "").split(" ")[0] || "there";
    var role = ROLES.find(function (r) { return r.title === d.role; });
    var t = role ? role.thanks : BEST_FIT_THANKS;
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
    lastPass = { name: d.name, seat: d.role === BEST_FIT ? "Best fit leadership seat" : d.role, from: d.location, ref: ref };
    if (typeof buildCaption === "function") { shareCaption.value = buildCaption(role); say(""); }
    $("#pName").textContent = d.name; $("#pSeat").textContent = lastPass.seat; $("#pFrom").textContent = d.location; $("#refId").textContent = ref;
    $("#successTitle").textContent = "Thank you, " + first + ". Your application is in.";
    $("#successLead").textContent = money(t.lead);
    $("#successReady").textContent = money(t.ready);
    $("#successNext").textContent = "Our talent team will confirm we have read your application within " + SLA.ack + " working days, and an email with the details is on its way to " + d.email + ". After every interview you will hear the outcome within " + SLA.outcome + " working days.";
    $("#demoNote").hidden = !demo;
    form.style.display = "none"; $("#path").style.display = "none"; $("#seatChip").hidden = true;
    var s = $("#success"); s.classList.add("show"); s.focus({ preventScroll: true });
    $("#appCard").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    confetti();
  }
  $("#againBtn").addEventListener("click", function () {
    form.reset(); caseCount.textContent = "0 / 1200"; fileChosen();
    $$(".seat-card", deck).forEach(function (c) { c.classList.remove("is-sel"); });
    sendBtn.disabled = false; sendBtn.classList.remove("is-busy"); $("span", sendBtn).textContent = "Send application";
    $("#success").classList.remove("show"); form.style.display = ""; $("#path").style.display = ""; go(0, "back");
  });

  // Boarding pass as an image
  function passBlob() {
    return new Promise(function (resolve) {
      var W = 1200, H = 520, c = document.createElement("canvas"); c.width = W; c.height = H; var x = c.getContext("2d");
      function rr(px, py, w, h, r) { x.beginPath(); x.moveTo(px, py); x.lineTo(px + w - r, py); x.arcTo(px + w, py, px + w, py + r, r); x.lineTo(px + w, py + h); x.lineTo(px + r, py + h); x.arcTo(px, py + h, px, py + h - r, r); x.closePath(); }
      var logo = new Image();
      logo.onload = function () {
        (document.fonts && document.fonts.load ? document.fonts.load("800 40px Poppins") : Promise.resolve()).then(function () {
          x.fillStyle = "#E8252A"; x.fillRect(0, 0, W, H);
          x.fillStyle = "#fff"; rr(48, 44, 270, 96, 28); x.fill(); x.drawImage(logo, 66, 58, 234, 69);
          x.fillStyle = "#fff"; x.font = "600 26px Poppins, Arial"; x.fillText("LEADERSHIP BOARDING PASS", 350, 100);
          var lab = function (t, px, py) { x.fillStyle = "rgba(255,255,255,0.8)"; x.font = "600 20px Poppins, Arial"; x.fillText(t.toUpperCase(), px, py); };
          var val = function (t, px, py, size, maxw) { x.fillStyle = "#fff"; x.font = "800 " + size + "px Poppins, Arial"; while (x.measureText(t).width > maxw && size > 22) { size -= 2; x.font = "800 " + size + "px Poppins, Arial"; } x.fillText(t, px, py); };
          lab("Passenger", 48, 210); val(lastPass.name, 48, 262, 52, 720);
          lab("Seat", 48, 320); val(lastPass.seat, 48, 368, 36, 720);
          lab("From", 48, 428); val(lastPass.from, 48, 468, 30, 340);
          lab("Destination", 420, 428); val("5,000,000 learners by 2028", 420, 468, 30, 400);
          x.setLineDash([10, 10]); x.strokeStyle = "rgba(255,255,255,0.7)"; x.lineWidth = 3; x.beginPath(); x.moveTo(880, 30); x.lineTo(880, H - 30); x.stroke(); x.setLineDash([]);
          lab("Reference", 920, 210); x.fillStyle = "#fff"; x.font = "800 30px Poppins, Arial"; x.fillText(lastPass.ref, 920, 256);
          x.fillStyle = "#111"; var bx = 920; for (var i = 0; i < 34; i++) { var w = 2 + (i * 7 % 5); x.fillRect(bx, 300, w, 120); bx += w + 4 + (i % 3); if (bx > 1150) break; }
          c.toBlob(resolve);
        });
      };
      logo.src = ROOT + "assets/logo-wide.png";
    });
  }
  $("#savePass").addEventListener("click", function () {
    if (!lastPass) return;
    passBlob().then(function (b) { var a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "msm-unify-leadership-pass-" + lastPass.ref + ".png"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000); });
  });

  // Share the pass: editable caption, one-tap buttons
  var shareCaption = $("#shareCaption"), shareNote = $("#shareNote"), shareLink = "";
  function buildCaption(role) {
    shareLink = role ? roleUrl(role.id) : (window.SITE_URL || (location.origin + "/"));
    if (!role) return "I have applied for a leadership seat at MSM Unify. 225,000 students supported so far, and the 2028 mission is 5,000,000 learners. Seats are open: " + shareLink + "\n\n#MSMUnify #GlobalEducation #Leadership";
    return "I have applied for " + role.title + " at MSM Unify. " + money(role.hook) + "\n\nSeats are open: " + shareLink + "\n\n#MSMUnify #GlobalEducation #Leadership";
  }
  function say(t) { shareNote.textContent = t; }
  function copyText(t) {
    return (navigator.clipboard && window.isSecureContext ? navigator.clipboard.writeText(t) : Promise.reject()).catch(function () {
      shareCaption.focus(); shareCaption.select(); var ok = false; try { ok = document.execCommand("copy"); } catch (e) {} if (!ok) throw new Error("copy blocked");
    });
  }
  if (navigator.canShare && navigator.share) {
    try { if (navigator.canShare({ files: [new File(["x"], "p.png", { type: "image/png" })] })) $("#shareNative").hidden = false; } catch (e) {}
  }
  $("#sharePass").addEventListener("click", function (e) {
    var b = e.target.closest("[data-share]"); if (!b || !lastPass) return;
    var kind = b.dataset.share, cap = shareCaption.value, enc = encodeURIComponent;
    if (kind === "copy") { copyText(cap).then(function () { say("Caption copied."); }, function () { say("Select the caption and copy it."); }); return; }
    if (kind === "native") {
      passBlob().then(function (blob) {
        var file = new File([blob], "msm-unify-leadership-pass.png", { type: "image/png" });
        return navigator.share({ files: [file], text: cap, url: shareLink });
      }).catch(function () {});
      return;
    }
    if (kind === "x") { window.open("https://twitter.com/intent/tweet?text=" + enc(cap.replace(shareLink, "").replace(/\s+$/g, "")) + "&url=" + enc(shareLink), "_blank", "noopener"); return; }
    if (kind === "whatsapp") { window.open("https://wa.me/?text=" + enc(cap), "_blank", "noopener"); return; }
    // LinkedIn and Facebook do not accept pre-filled text: copy the caption, then open the share window.
    var url = kind === "linkedin" ? "https://www.linkedin.com/sharing/share-offsite/?url=" + enc(shareLink) : "https://www.facebook.com/sharer/sharer.php?u=" + enc(shareLink);
    copyText(cap).then(function () { say("Caption copied. Paste it into your post when " + (kind === "linkedin" ? "LinkedIn" : "Facebook") + " opens."); }, function () { say("Select the caption, copy it, then paste it into your post."); });
    window.open(url, "_blank", "noopener");
  });

  // Confetti: brand-shaped pieces, once, skipped under reduced motion
  function confetti() {
    if (reduce) return;
    var cv = document.createElement("canvas"); cv.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:80"; cv.setAttribute("aria-hidden", "true");
    document.body.appendChild(cv); var W = cv.width = innerWidth, H = cv.height = innerHeight, x = cv.getContext("2d");
    var cols = ["#E8252A", "#111111", "#FCAF17", "#E8252A", "#9E9E9E"], ps = [];
    for (var i = 0; i < 110; i++) ps.push({ x: W * (0.2 + Math.random() * 0.6), y: -20 - Math.random() * H * 0.3, vx: (Math.random() - 0.5) * 6, vy: 2 + Math.random() * 5, s: 8 + Math.random() * 12, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, c: cols[i % cols.length] });
    var t0 = performance.now();
    (function tick(t) {
      var el = t - t0; x.clearRect(0, 0, W, H);
      ps.forEach(function (p) { p.x += p.vx; p.y += p.vy; p.vy += 0.06; p.r += p.vr; x.save(); x.translate(p.x, p.y); x.rotate(Math.round(p.r * 2) * Math.PI / 4); x.fillStyle = p.c; x.beginPath(); var s = p.s; x.moveTo(-s / 2, -s / 2); x.arcTo(s / 2, -s / 2, s / 2, s / 2, s * 0.45); x.lineTo(s / 2, s / 2); x.arcTo(-s / 2, s / 2, -s / 2, -s / 2, s * 0.45); x.closePath(); x.fill(); x.restore(); });
      if (el < 2600) requestAnimationFrame(tick); else cv.remove();
    })(t0);
  }

  // Role drawer -> application
  $("#applyRole").addEventListener("click", function () {
    var title = ROLES[current].title;
    closeStory();
    setRole(title, true);
    $("#apply").scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  });
  go(restoredQ > 0 && restoredQ < QID.length - 1 && checked("role") ? restoredQ : 0, "fwd");

  
  /* ---------- Destinations explorer ---------- */
  var DEST = [
    { k: "North America", c: ["Canada", "USA"] },
    { k: "UK and Europe", c: ["UK", "Ireland", "Bulgaria", "Croatia", "Cyprus", "Czech Republic", "France", "Germany", "Greece", "Hungary", "Italy", "Latvia", "Malta", "Netherlands", "Poland", "Russia", "Spain", "Switzerland", "Turkey", "Ukraine"] },
    { k: "Asia Pacific and Central Asia", c: ["Australia", "India", "Kazakhstan", "Malaysia", "New Zealand", "Sri Lanka", "Thailand"] },
    { k: "Middle East", c: ["Israel", "Saudi Arabia", "UAE"] },
    { k: "Caribbean", c: ["Bahamas", "Cayman Islands", "Grenada", "Saint Kitts and Nevis"] }
  ];
  var tabs = $("#regionTabs"), panel = $("#regionPanel");
  tabs.innerHTML = DEST.map(function (r, i) {
    return '<button role="tab" type="button" aria-selected="' + (i === 0) + '" data-i="' + i + '"><span>' + esc(r.k) + '</span><b>' + r.c.length + "</b></button>";
  }).join("");
  function region(i) {
    $$("button", tabs).forEach(function (b, j) { b.setAttribute("aria-selected", j === i); });
    var r = DEST[i];
    panel.innerHTML = '<p class="region-count"><b>' + r.c.length + "</b> destination " + (r.c.length === 1 ? "country" : "countries") + " in " + esc(r.k) + '</p><ul class="chips-lg">' +
      r.c.map(function (n, j) { return '<li style="--d:' + (reduce ? 0 : j * 35) + 'ms">' + esc(n) + "</li>"; }).join("") + "</ul>";
  }
  tabs.addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) region(+b.dataset.i); });
  tabs.addEventListener("keydown", function (e) {
    var bs = $$("button", tabs), i = bs.indexOf(document.activeElement);
    if (i < 0) return;
    var n = e.key === "ArrowDown" || e.key === "ArrowRight" ? (i + 1) % bs.length : e.key === "ArrowUp" || e.key === "ArrowLeft" ? (i - 1 + bs.length) % bs.length : -1;
    if (n > -1) { e.preventDefault(); bs[n].focus(); region(n); }
  });
  region(0);

  /* ---------- Reveal on scroll ---------- */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (!e.isIntersecting) return; e.target.classList.add("in"); io.unobserve(e.target); });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  $$(".rv, #steps, #road").forEach(function (el) { io.observe(el); });

  /* ---------- Counters ---------- */
  var nf = new Intl.NumberFormat("en-US");
  var cio = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      cio.unobserve(e.target);
      var el = e.target, to = +el.dataset.count, suf = el.dataset.suffix || "", pre = el.dataset.prefix || "", dec = +el.dataset.decimals || 0;
      var fmt = function (v) { return pre + (dec ? v.toFixed(dec) : nf.format(Math.round(v))) + suf; };
      if (reduce) { el.textContent = fmt(to); return; }
      var t0 = performance.now(), dur = 1800;
      (function tick(t) {
        var p = Math.min((t - t0) / dur, 1), v = 1 - Math.pow(1 - p, 4);
        el.textContent = fmt(to * v);
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    });
  }, { threshold: 0.5 });
  $$("[data-count]").forEach(function (el) { cio.observe(el); });

  /* ---------- Statement word highlight ---------- */
  var st = $("#statement");
  if (st) {
    var hl = (st.dataset.hl || "").split(",");
    st.innerHTML = st.textContent.split(" ").map(function (w) {
      var plain = w.toLowerCase().replace(/[^a-z0-9,]/g, "").replace(/,$/, "");
      return '<span class="w' + (hl.indexOf(plain) > -1 ? " hl" : "") + '">' + esc(w) + "</span>";
    }).join(" ");
    var wio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.target.classList.toggle("on", e.isIntersecting || e.boundingClientRect.top < 0); });
    }, { rootMargin: "0px 0px -32% 0px" });
    $$(".w", st).forEach(function (w) { wio.observe(w); });
  }

  /* ---------- Nav state ---------- */
  var nav = $("#nav");
  var sentinel = document.createElement("div");
  sentinel.style.cssText = "position:absolute;top:0;height:8px;width:1px;pointer-events:none";
  document.body.prepend(sentinel);
  new IntersectionObserver(function (es) { nav.classList.toggle("is-stuck", !es[0].isIntersecting); }).observe(sentinel);

  /* ---------- Values accordion ---------- */
  var items = $$(".acc-item");
  function openItem(it) { items.forEach(function (x) { var o = x === it; x.classList.toggle("open", o); x.setAttribute("aria-expanded", o); }); }
  items.forEach(function (it) {
    it.addEventListener("mouseenter", function () { if (window.matchMedia("(hover:hover)").matches) openItem(it); });
    it.addEventListener("click", function () { openItem(it); });
    it.addEventListener("focus", function () { openItem(it); });
  });

  /* ---------- Hero depth on pointer ---------- */
  var hv = $("#heroVisual");
  if (hv && !reduce && window.matchMedia("(hover:hover)").matches) {
    hv.addEventListener("pointermove", function (e) {
      var r = hv.getBoundingClientRect();
      hv.style.setProperty("--px", ((e.clientX - r.left) / r.width - 0.5) * 18 + "px");
      hv.style.setProperty("--py", ((e.clientY - r.top) / r.height - 0.5) * 18 + "px");
    });
    hv.addEventListener("pointerleave", function () { hv.style.setProperty("--px", "0px"); hv.style.setProperty("--py", "0px"); });
  }

  /* ---------- Hero ticker: real links to every role ---------- */
  var tk = $("#ticker");
  if (tk) {
    var one = ROLES.map(function (r) { return '<a href="' + ROOT + "roles/" + r.id + '/" data-id="' + r.id + '">' + esc(r.title) + "</a>"; }).join("");
    tk.innerHTML = '<div class="ticker-set">' + one + '</div><div class="ticker-set" aria-hidden="true">' + one.replace(/<a /g, '<a tabindex="-1" ') + "</div>";
    tk.addEventListener("click", function (e) { var a = e.target.closest("a"); if (!a || e.metaKey || e.ctrlKey) return; e.preventDefault(); openStory(a.dataset.id, true); });
  }

  /* ---------- Deep link ---------- */
  if (window.OPEN_ROLE) openStory(window.OPEN_ROLE, false);
  var m = location.hash.match(/^#role=(.+)$/);
  if (m) openStory(decodeURIComponent(m[1]), false);
})();
