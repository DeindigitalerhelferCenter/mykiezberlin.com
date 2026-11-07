/**
 * Full-screen goal celebration for Berlin clubs.
 * Goals that already happened when the page opened are never replayed.
 */
(function () {
  const LIVE_POLL_MS = 60000;
  const IDLE_POLL_MS = 300000;
  const OVERLAY_MS = 6500;
  const CONFETTI_COLORS = ["#0052A5", "#FFFFFF", "#E30613", "#F2D91C"];

  const seenGoals = new Set();
  let firstLoad = true;

  function applause() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const audio = new AudioCtx();
    audio.resume().catch(() => {});
    const seconds = 2.6;
    const buffer = audio.createBuffer(1, audio.sampleRate * seconds, audio.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i += 1) {
      const clap = Math.abs(Math.sin(i / 900)) > 0.55 ? 1 : 0.35;
      const fade = 1 - i / samples.length;
      samples[i] = (Math.random() * 2 - 1) * clap * fade * 0.35;
    }
    const source = audio.createBufferSource();
    const filter = audio.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1800;
    source.buffer = buffer;
    source.connect(filter).connect(audio.destination);
    source.onended = () => audio.close();
    source.start();
  }

  function confetti(canvas) {
    const ctx = canvas.getContext("2d");
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    const pieces = Array.from({ length: 140 }, () => ({
      x: Math.random() * canvas.width,
      y: -Math.random() * canvas.height,
      size: 6 + Math.random() * 8,
      speed: 2.5 + Math.random() * 4,
      drift: Math.random() * 2 - 1,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    }));
    function frame() {
      if (!canvas.isConnected) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of pieces) {
        p.y += p.speed;
        p.x += p.drift;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size * 0.6);
      }
      requestAnimationFrame(frame);
    }
    frame();
  }

  function celebrate(match, goal) {
    document.getElementById("goal-overlay")?.remove();
    const overlay = document.createElement("div");
    overlay.id = "goal-overlay";
    overlay.setAttribute("role", "alert");
    overlay.style.cssText = "position:fixed;inset:0;z-index:2000;display:flex;align-items:center;justify-content:center;text-align:center;padding:24px;background:rgba(0,40,90,.92);color:#fff;font-family:inherit;cursor:pointer";
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "position:absolute;inset:0;pointer-events:none";
    const box = document.createElement("div");
    box.style.position = "relative";
    const line = (text, css) => {
      const el = document.createElement("div");
      el.textContent = text;
      el.style.cssText = css;
      box.appendChild(el);
    };
    line("TOOOR!", "font-size:64px;font-weight:900;letter-spacing:2px");
    line(goal.team, "font-size:22px;font-weight:800;margin-top:8px");
    if (goal.scorer) line(`${goal.scorer}${goal.minute ? ` · ${goal.minute}'` : ""}`, "font-size:20px;margin-top:10px");
    line(`${match.home} ${goal.score} ${match.away}`, "font-size:18px;font-weight:700;margin-top:18px");
    overlay.append(canvas, box);
    overlay.onclick = () => overlay.remove();
    document.body.appendChild(overlay);
    confetti(canvas);
    applause();
    setTimeout(() => overlay.remove(), OVERLAY_MS);
  }

  async function poll() {
    let live = false;
    try {
      const res = await fetch("/api/goals");
      if (res.ok) {
        const { matches = [] } = await res.json();
        live = matches.some((m) => m.live);
        for (const match of matches) {
          for (const goal of match.goals) {
            if (seenGoals.has(goal.id)) continue;
            seenGoals.add(goal.id);
            if (!firstLoad && match.live && goal.forBerlin) celebrate(match, goal);
          }
        }
        firstLoad = false;
      }
    } catch (e) {
      // The next poll retries; a missed poll must never disturb the page.
    }
    setTimeout(poll, live ? LIVE_POLL_MS : IDLE_POLL_MS);
  }

  window.addEventListener("load", poll);
})();
