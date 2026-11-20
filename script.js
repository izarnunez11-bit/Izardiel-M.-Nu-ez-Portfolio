// IZAR PORTFOLIO v7
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;

// ---------- Split hero heading into words ----------
$$("[data-split]").forEach(el => {
  const nodes = [...el.childNodes];
  el.textContent = "";
  let i = 0;
  const add = (child) => {
    const w = document.createElement("span");
    w.className = "word";
    const inner = document.createElement("span");
    inner.style.setProperty("--i", i++);
    inner.append(child);
    w.append(inner);
    el.append(w, " ");
  };
  nodes.forEach(n => {
    if (n.nodeType === 3) n.textContent.trim().split(/\s+/).filter(Boolean).forEach(t => add(document.createTextNode(t)));
    else add(n);
  });
});

// ---------- Preloader -> hero entrance ----------
document.body.classList.add("loading");
(function preload() {
  const pre = $("#preloader"), pct = $("#prePct"), fill = $("#preFill"), msg = $("#preMsg"), greet = $("#preGreet");
  const MIN = reduce ? 0 : 4200;           // how long the loading screen lasts (ms) - make it bigger to slow it down
  const greetings = ["Hello", "Kumusta", "Welcome", "Hola", "Bonjour"];
  const msgs = [[0, "Getting things ready"], [30, "Warming up the stars"], [60, "Setting the mood"], [90, "Almost there"], [100, "Welcome!"]];
  let shown = 0, loaded = document.readyState === "complete", finished = false, g = 0, lastMsg = -1;
  const t0 = performance.now();

  addEventListener("load", () => { loaded = true; });
  setTimeout(() => { loaded = true; }, 6000); // safety: never get stuck

  // greeting changes every so often
  const gTimer = setInterval(() => {
    greet.classList.add("out");
    setTimeout(() => {
      g = (g + 1) % greetings.length;
      greet.textContent = greetings[g];
      greet.classList.remove("out");
    }, 300);
  }, 850);

  function finish() {
    if (finished) return;
    finished = true;
    clearInterval(gTimer);
    pre.classList.add("leaving");                 // content fades out first
    setTimeout(() => {
      pre.classList.add("done");                  // then the curtain lifts
      document.body.classList.remove("loading");
      // the hero starts animating while the curtain is still lifting, so there's no empty gap
      setTimeout(() => { document.body.classList.add("ready"); startTyping(); runCounters(); }, reduce ? 0 : 350);
    }, reduce ? 0 : 850);
  }

  (function tick() {
    const p = Math.min((performance.now() - t0) / MIN, 1);
    const eased = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    let target = eased * 100;
    if (!loaded) target = Math.min(target, 90); // wait for real loading before 100%
    shown += (target - shown) * 0.1;
    if (target - shown < 0.4) shown = target;
    const n = Math.round(shown);
    pct.textContent = n + "%";
    fill.style.transform = `scaleX(${shown / 100})`;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (n >= msgs[i][0]) { if (lastMsg !== i) { lastMsg = i; msg.textContent = msgs[i][1]; } break; }
    }
    if (shown >= 100) return setTimeout(finish, 650);
    requestAnimationFrame(tick);
  })();
})();

// ---------- Typewriter ----------
const roles = ["web development.", "programming in C#.", "AI & object detection.", "building cool things."];
function startTyping() {
  const el = $("#typed");
  if (!el) return;
  if (reduce) { el.textContent = roles[0]; return; }
  let r = 0, c = 0, del = false;
  (function tick() {
    const word = roles[r];
    el.textContent = word.slice(0, c);
    if (!del && c === word.length) { del = true; return setTimeout(tick, 1600); }
    if (del && c === 0) { del = false; r = (r + 1) % roles.length; }
    c += del ? -1 : 1;
    setTimeout(tick, del ? 35 : 70);
  })();
}

// ---------- Counters ----------
function runCounters() {
  $$("[data-count]").forEach(el => {
    const end = +el.dataset.count;
    if (reduce) { el.textContent = end; return; }
    const t0 = performance.now(), dur = 1600;
    (function step(t) {
      const p = Math.min((t - t0) / dur, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  });
}

// ---------- Profile photo: hover hint + hidden photo swap ----------
(function avatar() {
  const btn = $("#avatarBtn");
  if (!btn) return;
  const base = $("#avBase"), next = $("#avNext"), hint = $("#avHint");

  const photos = ["zar.jpg", "daddyshome.jpg"];
  const hints = ["click me", "go back?"];
  photos.forEach(src => { new Image().src = src; }); // preload
  let idx = 0, busy = false;

  btn.addEventListener("click", e => {
    if (busy) return;
    busy = true;
    idx = (idx + 1) % photos.length;

    // reveal opens from the exact spot that was clicked (center for keyboard)
    const r = btn.getBoundingClientRect();
    const cx = e.detail === 0 ? 50 : ((e.clientX - r.left) / r.width) * 100;
    const cy = e.detail === 0 ? 50 : ((e.clientY - r.top) / r.height) * 100;
    btn.style.setProperty("--cx", cx + "%");
    btn.style.setProperty("--cy", cy + "%");

    next.src = photos[idx];
    btn.classList.add("running");

    setTimeout(() => {
      base.src = photos[idx];
      btn.classList.add("reset");
      btn.classList.remove("running");
      void btn.offsetWidth; // force reflow
      btn.classList.remove("reset");
      hint.textContent = hints[idx];
      busy = false;
    }, reduce ? 50 : 1050);
  });

  // the hover hint follows the cursor
  btn.addEventListener("mousemove", e => {
    const r = btn.getBoundingClientRect();
    btn.style.setProperty("--hx", Math.min(Math.max(e.clientX - r.left, 60), r.width - 60) + "px");
    btn.style.setProperty("--hy", Math.max(e.clientY - r.top, 40) + "px");
  });
})();

// ---------- Header, progress, timeline (one scroll handler) ----------
const header = $("#header"), bar = $("#scrollProgress"), tl = $("#timeline"), tlLine = $("#timelineLine");
const toTop = $("#toTop"), ttRing = $("#ttRing");
let ticking = false;
function onScroll() {
  // hysteresis so the header never flickers between flat and floating
  if (scrollY > 60) header.classList.add("scrolled");
  else if (scrollY < 20) header.classList.remove("scrolled");
  const max = document.documentElement.scrollHeight - innerHeight;
  bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
  if (toTop) {
    toTop.classList.toggle("show", scrollY > 500);
    ttRing.style.strokeDashoffset = 131.95 * (1 - (max > 0 ? scrollY / max : 0));
  }
  if (tl) {
    const r = tl.getBoundingClientRect();
    const p = Math.min(Math.max((innerHeight * 0.6 - r.top) / r.height, 0), 1);
    tlLine.style.height = p * 100 + "%";
  }
  ticking = false;
}
addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
onScroll();

// ---------- Mobile nav ----------
const menuToggle = $("#menuToggle"), navLinks = $("#navLinks"), navItems = $$(".nav-link");
menuToggle.addEventListener("click", () => navLinks.classList.toggle("open"));
navItems.forEach(l => l.addEventListener("click", () => navLinks.classList.remove("open")));

// ---------- Reveal ----------
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("show"); io.unobserve(e.target); } });
}, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
$$(".reveal").forEach(el => io.observe(el));

// ---------- Active nav ----------
const spy = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      navItems.forEach(l => l.classList.toggle("active", l.getAttribute("href") === "#" + e.target.id));
      $$("#sideDots a").forEach(d => d.classList.toggle("on", d.dataset.s === e.target.id));
    }
  });
}, { rootMargin: "-35% 0px -55% 0px" });
$$("main section[id]").forEach(s => spy.observe(s));

// ---------- Cursor glow, card spotlight + tilt, magnetic buttons ----------
if (fine && !reduce) {
  const glow = $("#cursorGlow");
  let gx = 0, gy = 0, tx = 0, ty = 0;
  addEventListener("mousemove", e => { tx = e.clientX; ty = e.clientY; glow.classList.add("on"); });
  document.addEventListener("mouseleave", () => glow.classList.remove("on"));
  (function loop() {
    gx += (tx - gx) * 0.12; gy += (ty - gy) * 0.12;
    glow.style.transform = `translate(${gx}px,${gy}px)`;
    requestAnimationFrame(loop);
  })();

  $$(".tilt").forEach(card => {
    card.addEventListener("mouseenter", () => card.classList.add("tilting"));
    card.addEventListener("mousemove", e => {
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      card.style.setProperty("--mx", x + "px");
      card.style.setProperty("--my", y + "px");
      const rx = (0.5 - y / r.height) * 8, ry = (x / r.width - 0.5) * 8;
      card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px)`;
    });
    card.addEventListener("mouseleave", () => {
      card.classList.remove("tilting");
      card.style.transform = "";
    });
  });

  $$(".magnetic").forEach(btn => {
    btn.addEventListener("mousemove", e => {
      const r = btn.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.25;
      const y = (e.clientY - r.top - r.height / 2) * 0.35;
      btn.style.transform = `translate(${x}px,${y}px)`;
    });
    btn.addEventListener("mouseleave", () => (btn.style.transform = ""));
  });
}

// ---------- Stars background, themes, music, extras ----------
(function addons() {
  const root = document.documentElement;
  const store = {
    get: (k, d) => { try { return localStorage.getItem(k) || d; } catch (e) { return d; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  // settings panel
  const dock = $("#dock"), fab = $("#fab");
  fab.addEventListener("click", () => fab.setAttribute("aria-expanded", dock.classList.toggle("open")));
  document.addEventListener("click", e => { if (!dock.contains(e.target)) dock.classList.remove("open"); });
  addEventListener("keydown", e => { if (e.key === "Escape") dock.classList.remove("open"); });

  // animated background canvas (default: stars, visitors can switch)
  const cv = $("#bgCanvas"), ctx = cv.getContext("2d");
  const themes = $$("#themes button"), bgs = $$("#bgs button"), anim = $("#animToggle");
  let W, H, mode = "stars", items = [], rgb = "192,132,252", t = 0, run = true, shoot = null;
  const mouse = { x: -999, y: -999 };
  const chars = "01<>/{}[]();=+*#$";
  addEventListener("mousemove", e => { mouse.x = e.clientX; mouse.y = e.clientY; });

  function colors() { rgb = getComputedStyle(root).getPropertyValue("--rgb2").trim() || rgb; }
  function init() {
    items = [];
    if (mode === "network") for (let i = 0; i < Math.min(W * H / 16000, 80); i++)
      items.push({ x: Math.random() * W, y: Math.random() * H, vx: Math.random() * .4 - .2, vy: Math.random() * .4 - .2, r: Math.random() * 1.6 + .6 });
    if (mode === "stars") for (let i = 0; i < Math.min(W * H / 5000, 200); i++)
      items.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.4 + .3, s: Math.random() * 2 + .5, p: Math.random() * 6.28 });
    if (mode === "rain") for (let i = 0; i < Math.ceil(W / 18); i++)
      items.push({ y: Math.random() * H / 16, sp: Math.random() * .2 + .08, l: -1 });
    if (mode === "fireflies") for (let i = 0; i < Math.min(W * H / 26000, 45); i++)
      items.push({ x: Math.random() * W, y: Math.random() * H, a: Math.random() * 6.28, sp: Math.random() * .5 + .2, r: Math.random() * 2 + 1.2, p: Math.random() * 6.28, s: Math.random() * 1.5 + .6 });
    if (mode === "snow") for (let i = 0; i < Math.min(W * H / 9000, 130); i++)
      items.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 2.2 + .6, sp: Math.random() * .9 + .4, sw: Math.random() * 6.28, sa: Math.random() * .6 + .2 });
    ctx.clearRect(0, 0, W, H);
  }
  function size() {
    const d = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * d; cv.height = H * d;
    ctx.setTransform(d, 0, 0, d, 0, 0);
    init();
  }
  addEventListener("resize", size);

  (function frame() {
    requestAnimationFrame(frame);
    if (!run || document.hidden || mode === "off" || mode === "aurora") return;
    t += .016;

    if (mode === "rain") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,.1)"; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "source-over";
      ctx.font = "14px monospace"; ctx.fillStyle = `rgba(${rgb},.6)`;
      items.forEach((c, i) => {
        const r = c.y | 0;
        if (r !== c.l) { c.l = r; ctx.fillText(chars[Math.random() * chars.length | 0], i * 18, r * 16); }
        c.y += c.sp;
        if (c.y * 16 > H && Math.random() > .97) c.y = 0;
      });
      return;
    }

    ctx.clearRect(0, 0, W, H);

    if (mode === "stars") {
      const tx = mouse.x < 0 ? 0 : mouse.x / W - .5, ty = mouse.y < 0 ? 0 : mouse.y / H - .5;
      mouse.px = (mouse.px || 0) + (tx - (mouse.px || 0)) * .05;
      mouse.py = (mouse.py || 0) + (ty - (mouse.py || 0)) * .05;
      items.forEach(s => {
        ctx.fillStyle = `rgba(${rgb},${.25 + .75 * Math.abs(Math.sin(t * s.s + s.p))})`;
        ctx.beginPath(); ctx.arc(s.x - mouse.px * 46 * s.r, s.y - mouse.py * 46 * s.r, s.r, 0, 6.283); ctx.fill();
      });
      if (!shoot && Math.random() < .004) shoot = { x: Math.random() * W * .7, y: Math.random() * H * .5, l: 0 };
      if (shoot) {
        ctx.strokeStyle = `rgba(${rgb},${1 - shoot.l / 40})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(shoot.x, shoot.y); ctx.lineTo(shoot.x - 60, shoot.y - 30); ctx.stroke();
        shoot.x += 12; shoot.y += 6;
        if (++shoot.l > 40) shoot = null;
      }
      return;
    }

    if (mode === "fireflies") {
      items.forEach(f => {
        f.a += (Math.random() - .5) * .15;
        f.x += Math.cos(f.a) * f.sp; f.y += Math.sin(f.a) * f.sp;
        if (f.x < -10) f.x = W + 10; if (f.x > W + 10) f.x = -10;
        if (f.y < -10) f.y = H + 10; if (f.y > H + 10) f.y = -10;
        const glow = .15 + .85 * Math.abs(Math.sin(t * f.s + f.p));
        const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 7);
        g.addColorStop(0, `rgba(${rgb},${glow})`);
        g.addColorStop(1, `rgba(${rgb},0)`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r * 7, 0, 6.283); ctx.fill();
      });
      return;
    }

    if (mode === "snow") {
      ctx.fillStyle = `rgba(${rgb},.75)`;
      items.forEach(s => {
        s.y += s.sp; s.sw += .02;
        s.x += Math.sin(s.sw) * s.sa;
        if (s.y > H + 5) { s.y = -5; s.x = Math.random() * W; }
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
      });
      return;
    }

    // network
    for (let i = 0; i < items.length; i++) {
      const p = items[i], dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
      if (d < 140) { p.x += dx / d * 1.2; p.y += dy / d * 1.2; }
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      ctx.fillStyle = `rgba(${rgb},.8)`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
      for (let j = i + 1; j < items.length; j++) {
        const q = items[j], dist = Math.hypot(p.x - q.x, p.y - q.y);
        if (dist < 120) {
          ctx.strokeStyle = `rgba(${rgb},${(1 - dist / 120) * .28})`; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
        }
      }
    }
  })();

  // theme + animations (saved in the browser)
  function setTheme(v) {
    root.dataset.theme = v; store.set("theme", v);
    themes.forEach(b => b.classList.toggle("on", b.dataset.theme === v));
    colors();
  }
  function setBg(v) {
    mode = v; root.dataset.bg = v; store.set("bg", v);
    bgs.forEach(b => b.classList.toggle("on", b.dataset.bg === v));
    init();
  }
  function setAnim(on) {
    root.classList.toggle("calm", !on); run = on; anim.checked = on; store.set("anim", on ? "1" : "0");
    if (!on) ctx.clearRect(0, 0, W, H);
  }
  themes.forEach(b => b.addEventListener("click", () => setTheme(b.dataset.theme)));
  bgs.forEach(b => b.addEventListener("click", () => setBg(b.dataset.bg)));
  anim.addEventListener("change", () => setAnim(anim.checked));

  size();
  setTheme(store.get("theme", "purple"));
  setBg(store.get("bg", reduce ? "off" : "stars"));   // stars is the default
  setAnim(store.get("anim", reduce ? "0" : "1") === "1");

  // music
  const TRACK_NAME = "HYBS - Tip Toe";
  const bgm = $("#bgm"), mus = $("#music"), mb = $("#musicBtn"), title = $("#musicTitle"), vol = $("#vol");
  bgm.volume = +vol.value;
  vol.addEventListener("input", () => (bgm.volume = +vol.value));
  mb.addEventListener("click", async () => {
    if (bgm.paused) {
      try { await bgm.play(); } catch (e) { title.textContent = "Music file not found"; }
    } else bgm.pause();
  });
  bgm.addEventListener("play", () => { mus.classList.add("playing"); title.textContent = TRACK_NAME; mb.setAttribute("aria-label", "Pause music"); });
  bgm.addEventListener("pause", () => { mus.classList.remove("playing"); title.textContent = "Play music"; mb.setAttribute("aria-label", "Play music"); });
  bgm.addEventListener("error", () => (title.textContent = "Music file not found"));

  // profile card 3D tilt
  const pc = $("#pcard");
  if (pc && fine && !reduce) {
    pc.addEventListener("mousemove", e => {
      const r = pc.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      pc.style.transform = `perspective(1000px) rotateX(${-y * 7}deg) rotateY(${x * 8}deg)`;
    });
    pc.addEventListener("mouseleave", () => (pc.style.transform = ""));
  }

  // click sparks
  addEventListener("click", e => {
    if (root.classList.contains("calm") || e.target.closest(".dock")) return;
    for (let i = 0; i < 8; i++) {
      const s = document.createElement("i"), a = i / 8 * 6.283, d = 30 + Math.random() * 30;
      s.className = "spark";
      s.style.left = e.clientX + "px"; s.style.top = e.clientY + "px";
      s.style.setProperty("--dx", Math.cos(a) * d + "px");
      s.style.setProperty("--dy", Math.sin(a) * d + "px");
      document.body.append(s);
      setTimeout(() => s.remove(), 700);
    }
  });
})();

// ---------- Smooth parallax motion (mouse + scroll) ----------
(function motion() {
  if (reduce) return;
  const d1 = $(".decoration-one"), d2 = $(".decoration-two"), photo = $(".hero-photo");
  let mx = 0, my = 0, cx = 0, cy = 0, sy = scrollY, csy = scrollY;
  if (fine) addEventListener("mousemove", e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });
  addEventListener("scroll", () => { sy = scrollY; }, { passive: true });
  (function loop() {
    cx += (mx - cx) * .06; cy += (my - cy) * .06; csy += (sy - csy) * .08;
    if (d1) d1.style.translate = `${cx * -50}px ${cy * -40 + csy * .18}px`;
    if (d2) d2.style.translate = `${cx * 60}px ${cy * 50 + csy * .1}px`;
    if (photo) photo.style.translate = `${cx * -14}px ${cy * -10 - csy * .06}px`;
    requestAnimationFrame(loop);
  })();
})();

// ---------- Contact form ----------
(function contact() {
  const form = $("#contactForm");
  if (!form) return;
  // Put your real email here. It is used to open the visitor's email app.
  const TO_EMAIL = "izarnunez11@gmail.com";
  // Optional: paste a Formspree URL (https://formspree.io/f/xxxx) to receive messages directly without an email app.
  const ENDPOINT = "";

  const msg = $("#cfMsg"), count = $("#cfCount"), status = $("#cfStatus");
  const link = $("#mailLink");
  if (link) { link.href = "mailto:" + TO_EMAIL; link.querySelector("b").textContent = TO_EMAIL; }
  msg.addEventListener("input", () => { count.textContent = msg.value.length + " / 1000"; });

  const say = (t, bad) => { status.textContent = t; status.classList.toggle("err", !!bad); };
  const mark = (el, bad) => el.closest(".cf-field").classList.toggle("bad", bad);

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const f = new FormData(form);
    if (f.get("website")) return; // spam trap
    const name = f.get("name").trim(), email = f.get("email").trim(), subject = f.get("subject").trim(), message = f.get("message").trim();
    const okName = name.length > 0, okMail = /^\S+@\S+\.\S+$/.test(email), okMsg = message.length > 0;
    mark($("#cfName"), !okName); mark($("#cfEmail"), !okMail); mark(msg, !okMsg);
    if (!okName || !okMail || !okMsg) return say("Please fill in your name, a valid email, and your comment.", true);

    if (ENDPOINT) {
      say("Sending...");
      try {
        const r = await fetch(ENDPOINT, { method: "POST", headers: { Accept: "application/json" }, body: f });
        if (!r.ok) throw 0;
        form.reset(); count.textContent = "0 / 1000";
        burst(160); return say("Thank you! Your message was sent.");
      } catch (_) { return say("Something went wrong. Please try again.", true); }
    }
    const body = message + "\n\n— " + name + " (" + email + ")";
    location.href = "mailto:" + TO_EMAIL + "?subject=" + encodeURIComponent(subject || "Portfolio message from " + name) + "&body=" + encodeURIComponent(body);
    say("Opening your email app... if nothing opens, email me directly at " + TO_EMAIL + ".");
  });
  form.addEventListener("input", e => { if (e.target.closest(".cf-field")) mark(e.target, false); });
})();


// ================= EXTRAS =================

// ---------- Smooth scroll engine (inertia for wheel + keys, eased jumps for links) ----------
const smooth = fine && !reduce;
let sCur = scrollY, sTar = scrollY, sRaf = 0;
const maxScroll = () => Math.max(0, document.documentElement.scrollHeight - innerHeight);
function sLoop() {
  sCur += (sTar - sCur) * 0.095;
  if (Math.abs(sTar - sCur) < 0.5) { sCur = sTar; sRaf = 0; scrollTo(0, sCur); return; }
  scrollTo(0, sCur);
  sRaf = requestAnimationFrame(sLoop);
}
function sGo(y) { sTar = Math.min(Math.max(y, 0), maxScroll()); if (!sRaf) sRaf = requestAnimationFrame(sLoop); }
function smoothTo(y) {
  if (smooth) sGo(y);
  else scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
}
function goTo(id) {
  const t = id === "home" ? null : document.getElementById(id);
  smoothTo(t ? t.getBoundingClientRect().top + scrollY : 0);
}
const scrollLocked = () => document.body.classList.contains("loading") || document.documentElement.classList.contains("modal-open");
if (smooth) {
  document.documentElement.style.scrollBehavior = "auto";
  // if the page moves by any other means (scrollbar drag, find-in-page), follow it
  addEventListener("scroll", () => {
    if (!sRaf || Math.abs(scrollY - sCur) > 4) { if (sRaf) { cancelAnimationFrame(sRaf); sRaf = 0; } sCur = sTar = scrollY; }
  }, { passive: true });
  addEventListener("wheel", e => {
    if (e.ctrlKey || e.metaKey || scrollLocked()) return;
    for (let el = e.target; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
      if (el.scrollHeight > el.clientHeight + 1 && /(auto|scroll)/.test(getComputedStyle(el).overflowY)) return; // inner scroll areas keep native wheel
    }
    e.preventDefault();
    const dy = e.deltaY * (e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? innerHeight : 1);
    if (!sRaf) sTar = sCur = scrollY;
    sGo(sTar + dy);
  }, { passive: false });
  addEventListener("keydown", e => {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || scrollLocked()) return;
    if (/^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(e.target.tagName) || e.target.isContentEditable) return;
    const k = e.key, page = innerHeight * 0.85;
    let to = null;
    if (!sRaf) sTar = sCur = scrollY;
    if (k === "ArrowDown") to = sTar + 80;
    else if (k === "ArrowUp") to = sTar - 80;
    else if (k === "PageDown" || (k === " " && !e.shiftKey)) to = sTar + page;
    else if (k === "PageUp" || (k === " " && e.shiftKey)) to = sTar - page;
    else if (k === "Home") to = 0;
    else if (k === "End") to = maxScroll();
    if (to === null) return;
    e.preventDefault(); sGo(to);
  });
}
document.addEventListener("click", e => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute("href");
  if (id === "#" || id === "#home") { e.preventDefault(); smoothTo(0); return; }
  if (!document.querySelector(id)) return;
  e.preventDefault();
  goTo(id.slice(1));
  history.replaceState(null, "", id);
});
if (toTop) toTop.addEventListener("click", () => smoothTo(0));

// ---------- Nav fisheye: links grow as the cursor gets close ----------
(function fisheye() {
  if (reduce) return;
  const zone = $(".navbar"), links = $$(".nav-link:not(.contact-link)");
  const wide = matchMedia("(min-width:701px)");
  const st = links.map(l => { l.style.setProperty("--s", "1"); l.style.transition = "color .3s, text-shadow .3s"; return { l, cur: 1, tar: 1 }; });
  let raf = 0, mx = 0, inside = false;
  const loop = () => {
    let moving = false;
    st.forEach(o => {
      o.cur += (o.tar - o.cur) * 0.17;
      if (Math.abs(o.tar - o.cur) < 0.002) o.cur = o.tar; else moving = true;
      o.l.style.setProperty("--s", o.cur.toFixed(3));
    });
    raf = moving ? requestAnimationFrame(loop) : 0;
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
  zone.addEventListener("mousemove", e => {
    if (!wide.matches) return;
    mx = e.clientX; inside = true;
    const peak = innerWidth > 900 ? 0.8 : 0.5, sig = innerWidth > 900 ? 72 : 52;
    st.forEach(o => {
      const r = o.l.getBoundingClientRect(), d = mx - (r.left + r.width / 2);
      o.tar = 1 + peak * Math.exp(-(d * d) / (2 * sig * sig));
    });
    kick();
  });
  zone.addEventListener("mouseleave", () => { inside = false; st.forEach(o => { o.tar = 1; }); kick(); });
})();

// ---------- Custom cursor (dot + ring that grows on clickable things) ----------
(function cursor() {
  if (!fine || reduce) return;
  const ring = document.createElement("div"), dot = document.createElement("div");
  ring.className = "cursor-ring"; dot.className = "cursor-dot";
  ring.setAttribute("aria-hidden", "true"); dot.setAttribute("aria-hidden", "true");
  document.body.append(ring, dot);
  let x = -100, y = -100, rx = -100, ry = -100;
  addEventListener("mousemove", e => {
    x = e.clientX; y = e.clientY;
    dot.style.transform = `translate(${x}px,${y}px)`;
    ring.classList.add("on"); dot.classList.add("on");
    const hot = e.target.closest && e.target.closest("a,button,input,textarea,select,label,.tilt,[data-theme],[data-bg]");
    ring.classList.toggle("big", !!hot);
  });
  document.addEventListener("mouseleave", () => { ring.classList.remove("on"); dot.classList.remove("on"); });
  addEventListener("mousedown", () => ring.classList.add("down"));
  addEventListener("mouseup", () => ring.classList.remove("down"));
  (function loop() {
    rx += (x - rx) * .16; ry += (y - ry) * .16;
    ring.style.transform = `translate(${rx}px,${ry}px)`;
    requestAnimationFrame(loop);
  })();
})();

// ---------- Logo scramble on hover ----------
(function scramble() {
  const logo = $(".logo");
  if (!logo || reduce) return;
  const node = logo.childNodes[0], final = "IZAR", pool = "01<>/{}[]#$%&";
  let busy = false;
  logo.addEventListener("mouseenter", () => {
    if (busy) return; busy = true;
    let f = 0;
    const iv = setInterval(() => {
      f++;
      node.textContent = final.split("").map((c, i) => (f > 6 + i * 4 ? c : pool[Math.random() * pool.length | 0])).join("");
      if (f > 6 + final.length * 4) { clearInterval(iv); node.textContent = final; busy = false; }
    }, 40);
  });
})();

// ---------- Skill percentages count up ----------
(function skillPct() {
  $$(".skill-item").forEach(item => {
    const bar = item.querySelector("i"), target = parseInt(getComputedStyle(bar).getPropertyValue("--w")) || 0;
    const em = document.createElement("em");
    em.className = "pct"; em.textContent = "0%";
    item.append(em);
    const obs = new IntersectionObserver(es => {
      if (!es[0].isIntersecting) return;
      obs.disconnect();
      if (reduce) { em.textContent = target + "%"; return; }
      const t0 = performance.now(), dur = 1500;
      (function step(t) {
        const p = Math.min((t - t0) / dur, 1);
        em.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + "%";
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    }, { threshold: .5 });
    obs.observe(item);
  });
})();

// ---------- Project filters ----------
(function filters() {
  const box = $("#filters"), cards = $$("#projectsGrid .project-card");
  if (!box) return;
  box.addEventListener("click", e => {
    const b = e.target.closest("button[data-f]");
    if (!b) return;
    $$("button", box).forEach(x => x.classList.toggle("on", x === b));
    const f = b.dataset.f;
    cards.forEach(c => {
      const match = f === "all" || c.dataset.cat === f;
      c.classList.toggle("gone", !match);
      if (match) { c.classList.add("show"); c.classList.remove("pop"); void c.offsetWidth; c.classList.add("pop"); }
    });
  });
})();

// ---------- Button ripple ----------
document.addEventListener("click", e => {
  const b = e.target.closest(".btn");
  if (!b || reduce) return;
  const r = b.getBoundingClientRect(), i = document.createElement("i");
  i.className = "ripple";
  i.style.left = e.clientX - r.left + "px"; i.style.top = e.clientY - r.top + "px";
  b.append(i);
  setTimeout(() => i.remove(), 750);
});

// ---------- Toast + copy email ----------
function showToast(text) {
  let t = $("#toastMsg");
  if (!t) { t = document.createElement("div"); t.id = "toastMsg"; t.className = "toast-msg"; t.setAttribute("role", "status"); document.body.append(t); }
  t.textContent = text; t.classList.add("show");
  clearTimeout(showToast.t); showToast.t = setTimeout(() => t.classList.remove("show"), 2200);
}
(function copyMail() {
  const btn = $("#copyMail"), mail = $("#mailLink");
  if (!btn || !mail) return;
  btn.addEventListener("click", async () => {
    const addr = mail.querySelector("b").textContent;
    try { await navigator.clipboard.writeText(addr); showToast("Email copied to clipboard ✓"); }
    catch (e) { showToast("Copy failed. Email: " + addr); }
  });
})();

// ---------- Live Philippine time ----------
(function clock() {
  const el = $("#clock");
  if (!el) return;
  const tick = () => { el.textContent = new Date().toLocaleTimeString("en-US", { timeZone: "Asia/Manila", hour: "2-digit", minute: "2-digit" }); };
  tick(); setInterval(tick, 15000);
})();


// ---------- Confetti + Konami code ----------
function burst(n) {
  if (reduce) return;
  n = n || 140;
  let cv = $("#confetti");
  if (!cv) { cv = document.createElement("canvas"); cv.id = "confetti"; cv.setAttribute("aria-hidden", "true"); document.body.append(cv); }
  const ctx = cv.getContext("2d"), d = Math.min(devicePixelRatio || 1, 2);
  cv.width = innerWidth * d; cv.height = innerHeight * d; ctx.setTransform(d, 0, 0, d, 0, 0);
  const cs = getComputedStyle(document.documentElement);
  const cols = ["--primary", "--secondary", "--accent", "--alt", "--deep"].map(v => cs.getPropertyValue(v).trim()).concat(["#ffffff"]);
  const ps = Array.from({ length: n }, () => ({
    x: innerWidth / 2, y: innerHeight * .62, vx: (Math.random() - .5) * 17, vy: -Math.random() * 16 - 6,
    w: Math.random() * 8 + 4, h: Math.random() * 5 + 3, r: Math.random() * 6.28, vr: (Math.random() - .5) * .4,
    c: cols[Math.random() * cols.length | 0], life: 0
  }));
  (function step() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    let alive = 0;
    ps.forEach(p => {
      p.vy += .33; p.vx *= .992; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life++;
      if (p.y < innerHeight + 30 && p.life < 220) {
        alive++;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
        ctx.globalAlpha = Math.max(0, 1 - p.life / 200); ctx.fillStyle = p.c;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
      }
    });
    if (alive) requestAnimationFrame(step); else ctx.clearRect(0, 0, innerWidth, innerHeight);
  })();
}
(function konami() {
  const seq = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  let i = 0;
  addEventListener("keydown", e => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === seq[i]) { i++; if (i === seq.length) { i = 0; burst(240); showToast("Konami code! You found the secret 🎮"); } }
    else i = k === seq[0] ? 1 : 0;
  });
})();

// ---------- Command palette (Ctrl/Cmd + K, or press /) ----------
(function palette() {
  const box = $("#cmdk"), input = $("#cmdkInput"), list = $("#cmdkList");
  if (!box) return;
  const html = document.documentElement;
  const click = sel => () => { const el = $(sel); if (el) el.click(); };
  const nav = (label, id, kw) => ({ l: "Go to " + label, t: "Navigate", k: kw || label, run: () => goTo(id) });
  const theme = n => ({ l: "Theme: " + n[0].toUpperCase() + n.slice(1), t: "Theme", k: "color " + n, run: click('#themes [data-theme="' + n + '"]') });
  const bg = (n, label) => ({ l: "Background: " + label, t: "Background", k: "animation " + n, run: click('#bgs [data-bg="' + n + '"]') });
  const cmds = [
    nav("Home", "home"), nav("About", "about"), nav("Projects", "projects"), nav("Skills", "skills"),
    nav("Journey", "journey", "journey background timeline"), nav("Terminal", "terminal", "terminal console shell"), nav("Contact", "contact", "contact message email"),
    { l: "Open Aw Asen Coffee", t: "Project", k: "coffee shop order web app", run: () => window.open("awsen.html", "_blank", "noopener") },
    { l: "Open Kuwenta calculators", t: "Project", k: "kuwenta programming exercises calculator payroll loan tax", run: () => window.open("Kuwenta.html", "_blank", "noopener") },
    theme("purple"), theme("ocean"), theme("sunset"), theme("emerald"), theme("rose"), theme("gold"),
    bg("stars", "Stars"), bg("network", "Network"), bg("rain", "Code rain"), bg("aurora", "Aurora"), bg("fireflies", "Fireflies"), bg("snow", "Snow"), bg("off", "Off"),
    { l: "Play / pause music", t: "Action", k: "music song audio", run: click("#musicBtn") },
    { l: "Toggle animations", t: "Action", k: "motion calm reduce", run: click("#animToggle") },
    { l: "Copy email address", t: "Action", k: "mail email copy", run: click("#copyMail") },
    { l: "Party time", t: "Fun", k: "confetti celebrate", run: () => burst(200) },
    { l: "Back to top", t: "Navigate", k: "top scroll", run: () => smoothTo(0) }
  ];
  let shown = cmds, idx = 0, last = null;
  const render = q => {
    q = (q || "").trim().toLowerCase();
    shown = q ? cmds.filter(c => (c.l + " " + c.k + " " + c.t).toLowerCase().includes(q)) : cmds;
    idx = 0;
    list.innerHTML = shown.length
      ? shown.map((c, i) => '<li role="option" data-i="' + i + '"' + (i === 0 ? ' class="on"' : "") + '><span>' + c.l + "</span><em>" + c.t + "</em></li>").join("")
      : '<li class="none">No results. Try “theme” or “go to”.</li>';
  };
  const mark = () => {
    $$("li", list).forEach((li, i) => li.classList.toggle("on", i === idx));
    const on = $("li.on", list); if (on) on.scrollIntoView({ block: "nearest" });
  };
  const open = () => {
    if (document.body.classList.contains("loading")) return;
    last = document.activeElement; box.hidden = false; html.classList.add("modal-open");
    input.value = ""; render(""); requestAnimationFrame(() => input.focus());
  };
  const close = () => { box.hidden = true; html.classList.remove("modal-open"); if (last && last.focus) last.focus({ preventScroll: true }); };
  const exec = i => { const c = shown[i]; if (!c) return; close(); setTimeout(c.run, 120); };
  input.addEventListener("input", () => render(input.value));
  input.addEventListener("keydown", e => {
    if (e.key === "ArrowDown") { e.preventDefault(); idx = Math.min(idx + 1, shown.length - 1); mark(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); idx = Math.max(idx - 1, 0); mark(); }
    else if (e.key === "Enter") { e.preventDefault(); exec(idx); }
  });
  list.addEventListener("click", e => { const li = e.target.closest("li[data-i]"); if (li) exec(+li.dataset.i); });
  list.addEventListener("mousemove", e => { const li = e.target.closest("li[data-i]"); if (li && +li.dataset.i !== idx) { idx = +li.dataset.i; mark(); } });
  box.addEventListener("click", e => { if (e.target.hasAttribute("data-close")) close(); });
  addEventListener("keydown", e => {
    if ((e.key === "k" || e.key === "K") && (e.ctrlKey || e.metaKey)) { e.preventDefault(); box.hidden ? open() : close(); return; }
    if (e.key === "Escape" && !box.hidden) { close(); return; }
    if (e.key === "/" && box.hidden && !/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) && !e.target.isContentEditable) { e.preventDefault(); open(); }
  });
  const btn = $("#cmdBtn"); if (btn) btn.addEventListener("click", open);
})();

// ---------- Interactive terminal ----------
(function terminal() {
  const body = $("#termBody"), form = $("#termForm"), input = $("#termInput"), chips = $("#termChips"), wrap = $("#term");
  if (!body) return;
  const SKILLS = [["HTML", 70], ["CSS", 65], ["C#", 55], ["Canva", 75], ["Roboflow", 50], ["MS Office", 80]];
  const SECTIONS = ["home", "about", "projects", "skills", "journey", "terminal", "contact"];
  const THEMES = ["purple", "ocean", "sunset", "emerald", "rose", "gold"];
  const hist = []; let hi = 0;
  const line = (t, c) => { const d = document.createElement("span"); d.className = "ln" + (c ? " " + c : ""); d.textContent = t; body.append(d); };
  const link = (t, href) => { const d = document.createElement("span"), a = document.createElement("a"); d.className = "ln"; a.textContent = t; a.href = href; a.target = "_blank"; a.rel = "noopener"; d.append(a); body.append(d); };
  const out = arr => arr.forEach((x, i) => {
    const f = () => { typeof x === "string" ? line(x) : x.link ? link(x.t, x.link) : line(x.t, x.c); body.scrollTop = body.scrollHeight; };
    reduce ? f() : setTimeout(f, i * 38);
  });
  const bar = p => "█".repeat(Math.round(p / 10)) + "░".repeat(10 - Math.round(p / 10));
  const mail = () => { const m = $("#mailLink b"); return m ? m.textContent : ""; };
  const C = {
    help: () => ["Available commands:", "  about        who I am", "  skills       my toolkit", "  projects     things I've built", "  journey      my background",
      "  contact      how to reach me", "  coffee       ☕", "  theme <name> purple | ocean | sunset | emerald | rose | gold", "  cd <page>    jump to a section", "  ls           list the sections",
      "  open <name>  open a project (coffee, kuwenta)", "  music        play / pause", "  time         Philippine time", "  party        🎉", "  clear        clean the screen"],
    about: () => ["Izardiel Nuñez (Izar), BSIT student at Mindoro State University.", "I explore programming, web development and AI tools, and I learn best by building."],
    whoami: () => ["izar: aspiring IT professional"],
    skills: () => SKILLS.map(([n, p]) => (n + "            ").slice(0, 11) + bar(p) + " " + p + "%"),
    projects: () => ["1. Object Identifier   (Roboflow, custom image dataset)", { t: "2. Programming Exercises → Kuwenta calculators", link: "Kuwenta.html" }, { t: "3. Aw Asen Coffee → order-ahead coffee shop", link: "awsen.html" }, "Tip: try  open coffee  or  open kuwenta"],
    journey: () => ["2026 – now   BSIT, Mindoro State University", "2026         Senior High School, TVL – ICT Computer Programming", "Immersion    PCSO Calapan, work immersion experience"],
    contact: () => ["Email: " + mail(), "Type  mail  to open your email app, or scroll down and leave a comment."],
    mail: () => { location.href = "mailto:" + mail(); return ["Opening your email app..."]; },
    coffee: () => ["    ( (", "     ) )", "  .______.", "  |      |]", "  \\      /", "   `----'", "Aw Asen Coffee is open daily, 7AM to 9PM. Kape tayo!"],
    ls: () => [SECTIONS.join("   ")],
    pwd: () => ["/home/izar/portfolio"],
    time: () => ["Philippine time: " + new Date().toLocaleTimeString("en-US", { timeZone: "Asia/Manila" })],
    date: () => [new Date().toLocaleDateString("en-US", { timeZone: "Asia/Manila", weekday: "long", year: "numeric", month: "long", day: "numeric" })],
    music: () => { const b = $("#musicBtn"); if (b) b.click(); return ["Toggled the music ♪"]; },
    party: () => { burst(220); return ["🎉🎉🎉"]; },
    sudo: () => [{ t: "izar is not in the sudoers file. This incident will be reported. 😅", c: "err" }],
    echo: a => [a.join(" ")],
    theme: a => {
      const n = (a[0] || "").toLowerCase();
      if (!THEMES.includes(n)) return ["Usage: theme <name>", "Themes: " + THEMES.join(", ")];
      const b = $('#themes [data-theme="' + n + '"]'); if (b) b.click();
      return ["Theme set to " + n + " ✓"];
    },
    cd: a => {
      let n = (a[0] || "home").replace(/^\/|\/$/g, "").toLowerCase();
      if (n === ".." || n === "~") n = "home";
      if (!SECTIONS.includes(n)) return [{ t: "cd: no such section: " + n, c: "err" }, "Try:  ls"];
      goTo(n); return ["Going to " + n + "..."];
    },
    open: a => {
      const n = (a[0] || "").toLowerCase();
      if (/coffee|asen/.test(n)) { window.open("awsen.html", "_blank", "noopener"); return ["Opening Aw Asen Coffee..."]; }
      if (/kuwenta|exercise|calc/.test(n)) { window.open("Kuwenta.html", "_blank", "noopener"); return ["Opening Kuwenta..."]; }
      return ["Usage: open coffee | open kuwenta"];
    }
  };
  function run(raw) {
    const v = raw.trim();
    line("izar@portfolio:~$ " + raw, "cmd");
    if (!v) return;
    hist.push(v); hi = hist.length;
    const parts = v.split(/\s+/), name = parts[0].toLowerCase(), args = parts.slice(1);
    if (name === "clear") { body.textContent = ""; return; }
    const fn = C[name];
    if (!fn) { out([{ t: "command not found: " + parts[0] + ". Type 'help' to see what I can do.", c: "err" }]); return; }
    const res = fn(args); if (res) out(res);
    body.scrollTop = body.scrollHeight;
  }
  form.addEventListener("submit", e => { e.preventDefault(); const v = input.value; input.value = ""; run(v); });
  input.addEventListener("keydown", e => {
    if (e.key === "ArrowUp") { e.preventDefault(); if (hi > 0) input.value = hist[--hi]; }
    else if (e.key === "ArrowDown") { e.preventDefault(); input.value = hi < hist.length - 1 ? hist[++hi] : (hi = hist.length, ""); }
    else if (e.key === "Tab") {
      e.preventDefault();
      const v = input.value.toLowerCase(), m = Object.keys(C).filter(k => k.startsWith(v));
      if (v && m.length === 1) input.value = m[0] + " ";
    }
  });
  chips.addEventListener("click", e => { const b = e.target.closest("button[data-c]"); if (b) run(b.dataset.c); });
  wrap.addEventListener("click", e => { if (!getSelection().toString() && !e.target.closest("a,button")) input.focus({ preventScroll: true }); });
  out(["Welcome to Izar's terminal 👋", "Type 'help' to see the commands. Try 'coffee' or 'skills'."]);
})();