import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Camera, Upload, Shuffle, Download, X as XIcon, ArrowRight, ArrowLeft,
  RefreshCw, Sparkles, Copy, Check, Sliders, Palette, Image as ImageIcon,
  ShieldCheck, Zap, User, MapPin, Briefcase, Volume2, VolumeX, Move,
  Tag, Smartphone, Monitor, Share2
} from "lucide-react";

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Anton&family=Archivo+Black&family=Caveat:wght@600;700&family=Outfit:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;700&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');`;

// Web Audio Synthesizer (Zero external dependencies)
function playSound(type = 'click', soundEnabled = true) {
  if (!soundEnabled) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    
    if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } else if (type === 'shutter') {
      const bufferSize = ctx.sampleRate * 0.08;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      noise.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    } else if (type === 'stamp') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    }
  } catch (e) {}
}

const FILTERS = [
  { id: "original", label: "ORIGINAL", css: "none" },
  { id: "golden", label: "GOLDEN HOUR", css: "saturate(1.6) brightness(1.08) hue-rotate(-8deg) contrast(1.08)" },
  { id: "cyber", label: "CYBER NEON", css: "contrast(1.25) saturate(1.8) hue-rotate(160deg) brightness(1.05)" },
  { id: "film", label: "35MM FILM", css: "contrast(1.15) brightness(0.95) saturate(0.85) sepia(0.15)" },
  { id: "noir", label: "NOIR CLASSIC", css: "grayscale(1) contrast(1.3) brightness(0.98)" },
  { id: "sunset", label: "GOA SUNSET", css: "saturate(1.7) contrast(1.1) sepia(0.2) hue-rotate(-15deg)" },
];

const TITLES = [
  "THE DATA ALCHEMIST", "THE CODE NOMAD", "THE SYSTEM ARCHITECT", "THE AI EXPLORER",
  "THE CHAOS ENGINEER", "THE PIXEL PUSHER", "THE NIGHT SHIPPER", "THE BUG WHISPERER",
  "THE STACK SURFER", "THE PROMPT POET", "THE LATE-NIGHT BUILDER", "THE DEMO DAY DAREDEVIL",
  "THE FULL-STACK WIZARD", "THE AGENTIC CRAFTSMAN", "THE SOLANA SURFER", "THE NEURAL ARCHITECT"
];

const STICKER_CATALOG = [
  { id: "frame_in_goa", text: "#FrameInGoa", icon: "📸", bg: "#FF4980", color: "#FFFFFF", relX: 0.76, relY: 0.22 },
  { id: "ai_pioneer", text: "AI PIONEER", icon: "🚀", bg: "#7000FF", color: "#FFFFFF", relX: 0.72, relY: 0.42 },
  { id: "goa_local", text: "GOA LOCAL", icon: "🌴", bg: "#00B894", color: "#FFFFFF", relX: 0.80, relY: 0.62 },
  { id: "built_24h", text: "BUILT IN 24H", icon: "⚡", bg: "#FF7675", color: "#FFFFFF", relX: 0.75, relY: 0.80 },
  { id: "coffee_fueled", text: "COFFEE FUELED", icon: "☕", bg: "#6C5CE7", color: "#FFFFFF", relX: 0.18, relY: 0.78 },
  { id: "agentic", text: "AGENTIC WIZARD", icon: "🤖", bg: "#FD79A8", color: "#FFFFFF", relX: 0.14, relY: 0.30 },
];

const STACK_PRESETS = [
  "Full Stack · AI", "React · Node · Python", "Flutter · Dart",
  "Web3 · Solana · Rust", "UI/UX · Design Systems", "LLMs · PyTorch", "Go · Cloud Native"
];

const LOCATION_PRESETS = [
  "Goa, India 🌴", "Anjuna Code Hub", "Panaji Tech Lab", "Vagator Sunset Bay", "Remote / Everywhere"
];

const TEMPLATES = [
  { id: "goapass", name: "GOA VIP PASS", blurb: "Vibrant tropical badge with holographic stamps & #FrameInGoa star.", icon: "🌴" },
  { id: "license", name: "CREATIVE LICENSE", blurb: "Vintage paper texture, paperclip polaroid & wax seal.", icon: "🪪" },
  { id: "digital", name: "CYBER TERMINAL", blurb: "Matrix neon grid, dark mono aesthetic & active status line.", icon: "⚡" },
  { id: "sunset", name: "SUNSET CLUB", blurb: "Luxurious gradient card with gold foil frame & builder seal.", icon: "🌅" },
];

const SAMPLE_AVATARS = [
  { name: "Sample 1", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80" },
  { name: "Sample 2", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80" },
  { name: "Sample 3", url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80" },
  { name: "Sample 4", url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80" },
];

const CARD_W = 1000;
const CARD_H = 630;

function randomId() {
  return "H26-" + Math.random().toString(36).slice(2, 6).toUpperCase();
}

// Instant smart photo cover renderer (handles portrait, landscape, off-center aspect ratios)
function drawImageCover(ctx, img, x, y, w, h, zoom = 1, offsetX = 0, offsetY = 0, cutoutMode = false) {
  if (!img) return;
  const imgW = img.naturalWidth || img.width;
  const imgH = img.naturalHeight || img.height;
  if (!imgW || !imgH) return;

  const ir = imgW / imgH;
  const r = w / h;
  let sx, sy, sw, sh;

  if (ir > r) {
    sh = imgH / zoom;
    sw = sh * r;
    sx = (imgW - sw) / 2 + (offsetX * (imgW - sw)) / 2;
    sy = (imgH - sh) / 2 + (offsetY * (imgH - sh)) / 2;
  } else {
    sw = imgW / zoom;
    sh = sw / r;
    sx = (imgW - sw) / 2 + (offsetX * (imgW - sw)) / 2;
    sy = (imgH - sh) / 2 + (offsetY * (imgH - sh)) / 2;
  }

  sx = Math.max(0, Math.min(imgW - sw, sx));
  sy = Math.max(0, Math.min(imgH - sh, sy));

  if (cutoutMode) {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w / 2 - 8, h / 2 - 8, 0, 0, Math.PI * 2);
    ctx.clip();
  }

  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);

  if (cutoutMode) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();
  }
}

function drawStar(ctx, cx, cy, r, color, rot = 0) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.42;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function drawBarcode(ctx, x, y, w, h, color = "#1A1A2E") {
  ctx.save();
  ctx.fillStyle = color;
  let cx = x;
  let seed = 23;
  while (cx < x + w) {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    const bw = 2 + (seed % 6);
    if (seed % 3 !== 0) ctx.fillRect(cx, y, bw, h);
    cx += bw + 3;
  }
  ctx.restore();
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawStickers(ctx, cx, cy, cw, ch, stickers = []) {
  stickers.forEach((st, idx) => {
    ctx.save();
    const sx = cx + st.relX * cw;
    const sy = cy + st.relY * ch;
    ctx.translate(sx, sy);
    ctx.rotate(st.rot || ((idx % 2 === 0 ? 1 : -1) * 0.08));

    ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;

    drawRoundedRect(ctx, -75, -20, 150, 40, 20);
    ctx.fillStyle = st.bg;
    ctx.fill();

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.font = "800 13px 'Space Grotesk', sans-serif";
    ctx.fillStyle = st.color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${st.icon} ${st.text}`, 0, 1);
    ctx.restore();
  });
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(" ");
  let line = "";
  let cy = y;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    if (ctx.measureText(testLine).width > maxWidth && n > 0) {
      ctx.fillText(line, x, cy);
      line = words[n] + " ";
      cy += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, cy);
}

// Template Renderers with #FrameInGoa On-Brand Tags
function renderGoaPass(ctx, img, filterCss, details, idCode, stickers = []) {
  ctx.clearRect(0, 0, CARD_W, CARD_H);
  
  const grad = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  grad.addColorStop(0, "#082a20");
  grad.addColorStop(0.5, "#124e3b");
  grad.addColorStop(1, "#0a261c");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  ctx.strokeStyle = "rgba(127, 216, 196, 0.06)";
  ctx.lineWidth = 1;
  for (let i = 0; i < CARD_W; i += 30) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 200, CARD_H); ctx.stroke();
  }

  const starSeeds = [[40,40],[960,50],[70,580],[930,600],[500,20],[30,300],[970,320]];
  starSeeds.forEach(([sx, sy], i) => drawStar(ctx, sx, sy, 14, "rgba(255, 143, 177, 0.6)", i * 0.4));

  const cx = 40, cy = 50, cw = CARD_W - 80, ch = CARD_H - 100;
  ctx.save();
  drawRoundedRect(ctx, cx + 8, cy + 12, cw, ch, 32);
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fill();
  ctx.restore();

  drawRoundedRect(ctx, cx, cy, cw, ch, 32);
  ctx.fillStyle = "#FAF4E8";
  ctx.fill();

  // Header Banner
  drawRoundedRect(ctx, cx, cy, cw, 88, 32);
  ctx.save();
  ctx.clip();
  ctx.fillStyle = "#52C4A6";
  ctx.fillRect(cx, cy, cw * 0.65, 88);
  ctx.fillStyle = "#FF7597";
  ctx.fillRect(cx + cw * 0.65, cy, cw * 0.35, 88);
  
  ctx.fillStyle = "#FFD23F";
  ctx.fillRect(cx + cw * 0.65 - 3, cy, 6, 88);
  ctx.restore();

  ctx.fillStyle = "#0B261E";
  ctx.font = "800 30px 'Archivo Black', sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText("HH GOA 2026 · #FrameInGoa", cx + 32, cy + 44);

  for (let i = 0; i < 4; i++) {
    drawStar(ctx, cx + cw - 140 + i * 36, cy + 44, 14, "#FAF4E8");
  }

  // Photo Frame
  const px = cx + 36, py = cy + 116, pw = 280, ph = 345;
  ctx.save();
  drawRoundedRect(ctx, px - 3, py - 3, pw + 6, ph + 6, 16);
  ctx.fillStyle = "#FF4980";
  ctx.fill();
  ctx.restore();

  ctx.save();
  drawRoundedRect(ctx, px, py, pw, ph, 12);
  ctx.clip();
  if (img) {
    ctx.filter = filterCss;
    drawImageCover(ctx, img, px, py, pw, ph, details.zoom || 1, details.offsetX || 0, details.offsetY || 0, details.cutoutMode);
    ctx.filter = "none";
  } else {
    ctx.fillStyle = "#E2DAC8";
    ctx.fillRect(px, py, pw, ph);
  }
  ctx.restore();

  drawStar(ctx, px + 8, py + 12, 18, "#FFD23F", -0.2);

  // Details
  const dx = px + pw + 44;
  let dy = py + 12;

  ctx.fillStyle = "#574E3E";
  ctx.font = "700 14px 'Space Mono', monospace";
  ctx.fillText("BUILDER NAME", dx, dy);
  ctx.font = "800 38px 'Archivo Black', sans-serif";
  ctx.fillStyle = "#0B261E";
  ctx.fillText((details.name || "YOUR NAME").toUpperCase(), dx, dy + 40);

  dy += 94;
  ctx.font = "700 14px 'Space Mono', monospace";
  ctx.fillStyle = "#574E3E";
  ctx.fillText("TECH STACK / SKILLS", dx, dy);
  ctx.font = "700 22px 'Space Grotesk', sans-serif";
  ctx.fillStyle = "#0B261E";
  ctx.fillText(details.stack || "BUILDER", dx, dy + 30);

  dy += 74;
  ctx.font = "700 14px 'Space Mono', monospace";
  ctx.fillStyle = "#574E3E";
  ctx.fillText("TITLE & ROLE", dx, dy);
  ctx.font = "800 26px 'Caveat', cursive";
  ctx.fillStyle = "#D62860";
  wrapText(ctx, details.title || "THE BUILDER", dx, dy + 32, 310, 32);

  dy += 96;
  ctx.font = "700 14px 'Space Mono', monospace";
  ctx.fillStyle = "#574E3E";
  ctx.fillText("LOCATION", dx, dy);
  ctx.font = "700 20px 'Space Grotesk', sans-serif";
  ctx.fillStyle = "#0B261E";
  ctx.fillText((details.location || "GOA, INDIA").toUpperCase(), dx, dy + 28);

  const fy = cy + ch - 66;
  drawBarcode(ctx, cx + 36, fy, 240, 42, "#0B261E");

  ctx.font = "700 20px 'Space Mono', monospace";
  ctx.fillStyle = "#0B261E";
  ctx.textAlign = "right";
  ctx.fillText(idCode, cx + cw - 36, fy + 26);
  ctx.textAlign = "left";

  // Stamp
  ctx.save();
  ctx.translate(cx + cw - 120, fy - 68);
  ctx.rotate(-0.2);
  ctx.strokeStyle = "rgba(11,38,30,0.6)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 48, 0, Math.PI * 2);
  ctx.stroke();
  ctx.font = "800 11px 'Space Mono', monospace";
  ctx.fillStyle = "rgba(11,38,30,0.75)";
  ctx.textAlign = "center";
  ctx.fillText("#FrameInGoa", 0, -6);
  ctx.fillText("VERIFIED 2026", 0, 10);
  ctx.textAlign = "left";
  ctx.restore();

  drawStickers(ctx, cx, cy, cw, ch, stickers);
}

function renderLicense(ctx, img, filterCss, details, idCode, stickers = []) {
  ctx.clearRect(0, 0, CARD_W, CARD_H);
  ctx.fillStyle = "#0d0e12";
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  const cx = 55, cy = 50, cw = CARD_W - 110, ch = CARD_H - 100;
  ctx.save();
  ctx.translate(4, 6);
  ctx.rotate(0.012);
  drawRoundedRect(ctx, cx, cy, cw, ch, 10);
  ctx.fillStyle = "#F5ECD7";
  ctx.fill();
  ctx.strokeStyle = "#383125";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.strokeStyle = "rgba(56,49,37,0.06)";
  for (let i = 0; i < 22; i++) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + i * (ch / 22));
    ctx.lineTo(cx + cw, cy + i * (ch / 22) + 4);
    ctx.stroke();
  }

  ctx.fillStyle = "#262018";
  ctx.font = "800 28px 'Archivo Black', sans-serif";
  ctx.fillText("CREATIVE BUILDER LICENSE", cx + 240, cy + 55);
  ctx.font = "700 15px 'Space Mono', monospace";
  ctx.fillStyle = "#6E614E";
  ctx.fillText("#FrameInGoa · STATE OF CREATIVITY", cx + 240, cy + 85);

  ctx.textAlign = "right";
  ctx.font = "700 13px 'Space Mono', monospace";
  ctx.fillText("LIC #", cx + cw - 32, cy + 42);
  ctx.font = "800 28px 'Space Mono', monospace";
  ctx.fillStyle = "#C22938";
  ctx.fillText(idCode.replace("H26-", "GOA-"), cx + cw - 32, cy + 72);
  ctx.textAlign = "left";

  const px = cx + 40, py = cy + 110, pw = 220, ph = 265;
  ctx.save();
  ctx.translate(-3, 3);
  ctx.rotate(-0.025);
  ctx.fillStyle = "#FFFFFF";
  ctx.shadowColor = "rgba(0,0,0,0.25)";
  ctx.shadowBlur = 16;
  ctx.fillRect(px, py, pw, ph + 38);
  ctx.shadowBlur = 0;

  ctx.save();
  ctx.beginPath();
  ctx.rect(px + 12, py + 12, pw - 24, ph - 24);
  ctx.clip();
  if (img) {
    ctx.filter = filterCss;
    drawImageCover(ctx, img, px + 12, py + 12, pw - 24, ph - 24, details.zoom || 1, details.offsetX || 0, details.offsetY || 0, details.cutoutMode);
    ctx.filter = "none";
  } else {
    ctx.fillStyle = "#D6CFBF";
    ctx.fillRect(px + 12, py + 12, pw - 24, ph - 24);
  }
  ctx.restore();
  ctx.restore();

  ctx.save();
  ctx.translate(px + 24, py - 8);
  ctx.strokeStyle = "#7A8494";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(0, 32);
  ctx.lineTo(0, 4);
  ctx.arc(10, 4, 10, Math.PI, 0, true);
  ctx.lineTo(20, 28);
  ctx.arc(10, 28, 10, 0, Math.PI, true);
  ctx.stroke();
  ctx.restore();

  const dx = px + pw + 55;
  let dy = py + 12;
  const field = (label, value, size = 30) => {
    ctx.font = "700 13px 'Space Mono', monospace";
    ctx.fillStyle = "#6E614E";
    ctx.fillText(label, dx, dy);
    ctx.font = `700 ${size}px 'Caveat', cursive`;
    ctx.fillStyle = "#1F1A14";
    ctx.fillText(value, dx, dy + size + 2);
    dy += size + 36;
  };

  field("FULL NAME", (details.name || "YOUR NAME"));
  field("ROLE / CLASS", (details.title || "BUILDER"), 26);
  field("SPECIALTY", (details.stack || "FULL STACK"), 26);
  field("BASE LOCATION", (details.location || "GOA, INDIA"), 24);

  ctx.save();
  ctx.translate(cx + cw - 120, cy + ch - 120);
  ctx.rotate(0.15);
  ctx.strokeStyle = "rgba(168,34,50,0.6)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, 50, 0, Math.PI * 2);
  ctx.stroke();
  ctx.font = "700 12px 'Space Mono', monospace";
  ctx.fillStyle = "rgba(168,34,50,0.8)";
  ctx.textAlign = "center";
  ctx.fillText("#FrameInGoa", 0, -4);
  ctx.fillText("APPROVED 2026", 0, 12);
  ctx.textAlign = "left";
  ctx.restore();

  drawBarcode(ctx, cx + 40, cy + ch - 50, 220, 32, "#262018");
  ctx.font = "700 13px 'Space Mono', monospace";
  ctx.fillStyle = "#6E614E";
  ctx.fillText("EXPIRY: NEVER (LIFETIME BUILDER)", cx + cw - 310, cy + ch - 28);

  ctx.restore();
  drawStickers(ctx, cx, cy, cw, ch, stickers);
}

function renderDigital(ctx, img, filterCss, details, idCode, stickers = []) {
  ctx.clearRect(0, 0, CARD_W, CARD_H);
  const bg = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  bg.addColorStop(0, "#080C14");
  bg.addColorStop(1, "#0F172A");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  ctx.strokeStyle = "rgba(56, 239, 172, 0.08)";
  for (let gx = 0; gx < CARD_W; gx += 35) {
    ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, CARD_H); ctx.stroke();
  }
  for (let gy = 0; gy < CARD_H; gy += 35) {
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(CARD_W, gy); ctx.stroke();
  }

  const cx = 40, cy = 40, cw = CARD_W - 80, ch = CARD_H - 80;
  drawRoundedRect(ctx, cx, cy, cw, ch, 20);
  ctx.strokeStyle = "#38EFAC";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#38EFAC";
  ctx.fillRect(cx - 2, cy - 2, 20, 4);
  ctx.fillRect(cx - 2, cy - 2, 4, 20);
  ctx.fillRect(cx + cw - 18, cy - 2, 20, 4);
  ctx.fillRect(cx + cw + 2, cy - 2, 4, 20);

  ctx.font = "700 24px 'Space Mono', monospace";
  ctx.fillText("#FrameInGoa // 2026", cx + 32, cy + 46);
  ctx.textAlign = "right";
  ctx.fillStyle = "#11998E";
  ctx.font = "700 16px 'Space Mono', monospace";
  ctx.fillText("SYS.STATUS: ONLINE", cx + cw - 32, cy + 46);
  ctx.textAlign = "left";

  const px = cx + 32, py = cy + 85, pw = 270, ph = 330;
  drawRoundedRect(ctx, px, py, pw, ph, 10);
  ctx.save();
  ctx.clip();
  if (img) {
    ctx.filter = filterCss + " contrast(1.1)";
    drawImageCover(ctx, img, px, py, pw, ph, details.zoom || 1, details.offsetX || 0, details.offsetY || 0, details.cutoutMode);
    ctx.filter = "none";
    ctx.fillStyle = "rgba(56, 239, 172, 0.1)";
    ctx.fillRect(px, py, pw, ph);
  } else {
    ctx.fillStyle = "#111827";
    ctx.fillRect(px, py, pw, ph);
  }
  ctx.restore();

  ctx.strokeStyle = "#38EFAC";
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, px, py, pw, ph, 10);
  ctx.stroke();

  ctx.strokeStyle = "rgba(0,0,0,0.2)";
  for (let sy = py; sy < py + ph; sy += 4) {
    ctx.beginPath(); ctx.moveTo(px, sy); ctx.lineTo(px + pw, sy); ctx.stroke();
  }

  const dx = px + pw + 42;
  let dy = py + 10;
  const row = (label, value, size = 30, color = "#E2E8F0") => {
    ctx.font = "700 14px 'Space Mono', monospace";
    ctx.fillStyle = "#38EFAC";
    ctx.fillText(label, dx, dy);
    ctx.font = `700 ${size}px 'Space Grotesk', sans-serif`;
    ctx.fillStyle = color;
    wrapText(ctx, value, dx, dy + size + 2, 330, size + 4);
    dy += size + 48;
  };

  row("OPERATOR", (details.name || "UNNAMED").toUpperCase(), 34);
  row("CORE STACK", details.stack || "BUILDER", 22);
  row("DESIGNATION", details.title || "THE BUILDER", 22, "#FFD23F");
  row("LOCATION", (details.location || "GOA, INDIA").toUpperCase(), 20);

  const fy = cy + ch - 58;
  ctx.font = "700 18px 'Space Mono', monospace";
  ctx.fillStyle = "#94A3B8";
  ctx.fillText("UUID: " + idCode, cx + 32, fy);
  drawBarcode(ctx, cx + 32, fy + 16, cw - 64, 28, "#38EFAC");

  drawStickers(ctx, cx, cy, cw, ch, stickers);
}

function renderSunset(ctx, img, filterCss, details, idCode, stickers = []) {
  ctx.clearRect(0, 0, CARD_W, CARD_H);
  
  const grad = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  grad.addColorStop(0, "#2A0845");
  grad.addColorStop(0.5, "#6441A5");
  grad.addColorStop(1, "#FF512F");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  const cx = 40, cy = 40, cw = CARD_W - 80, ch = CARD_H - 80;
  drawRoundedRect(ctx, cx, cy, cw, ch, 24);
  ctx.strokeStyle = "#F0C27B";
  ctx.lineWidth = 4;
  ctx.stroke();

  drawRoundedRect(ctx, cx + 12, cy + 12, cw - 24, ch - 24, 18);
  ctx.fillStyle = "rgba(15, 10, 25, 0.65)";
  ctx.fill();

  ctx.fillStyle = "#F0C27B";
  ctx.font = "800 28px 'Outfit', sans-serif";
  ctx.fillText("GOA SUNSET CLUB · #FrameInGoa", cx + 36, cy + 52);

  ctx.textAlign = "right";
  ctx.font = "700 16px 'Space Mono', monospace";
  ctx.fillStyle = "#FF758C";
  ctx.fillText("MEMBER #" + idCode, cx + cw - 36, cy + 52);
  ctx.textAlign = "left";

  const px = cx + 36, py = cy + 86, pw = 270, ph = 340;
  drawRoundedRect(ctx, px, py, pw, ph, 14);
  ctx.save();
  ctx.clip();
  if (img) {
    ctx.filter = filterCss;
    drawImageCover(ctx, img, px, py, pw, ph, details.zoom || 1, details.offsetX || 0, details.offsetY || 0, details.cutoutMode);
    ctx.filter = "none";
  } else {
    ctx.fillStyle = "#2D1B4E";
    ctx.fillRect(px, py, pw, ph);
  }
  ctx.restore();

  ctx.strokeStyle = "#F0C27B";
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, px, py, pw, ph, 14);
  ctx.stroke();

  const dx = px + pw + 44;
  let dy = py + 14;

  ctx.fillStyle = "#F0C27B";
  ctx.font = "700 13px 'Space Mono', monospace";
  ctx.fillText("BUILDER", dx, dy);
  ctx.font = "800 36px 'Outfit', sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText((details.name || "YOUR NAME").toUpperCase(), dx, dy + 38);

  dy += 92;
  ctx.fillStyle = "#F0C27B";
  ctx.font = "700 13px 'Space Mono', monospace";
  ctx.fillText("SKILLSET", dx, dy);
  ctx.font = "700 22px 'Space Grotesk', sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(details.stack || "BUILDER", dx, dy + 28);

  dy += 74;
  ctx.fillStyle = "#F0C27B";
  ctx.font = "700 13px 'Space Mono', monospace";
  ctx.fillText("HONORARY TITLE", dx, dy);
  ctx.font = "700 26px 'Caveat', cursive";
  ctx.fillStyle = "#FF758C";
  wrapText(ctx, details.title || "THE BUILDER", dx, dy + 32, 320, 32);

  dy += 96;
  ctx.fillStyle = "#F0C27B";
  ctx.font = "700 13px 'Space Mono', monospace";
  ctx.fillText("HQ LOCATION", dx, dy);
  ctx.font = "700 20px 'Outfit', sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText((details.location || "GOA, INDIA").toUpperCase(), dx, dy + 28);

  const fy = cy + ch - 60;
  drawBarcode(ctx, cx + 36, fy, cw - 72, 32, "#F0C27B");

  drawStickers(ctx, cx, cy, cw, ch, stickers);
}

const RENDERERS = { goapass: renderGoaPass, license: renderLicense, digital: renderDigital, sunset: renderSunset };
const STEPS = ["welcome", "photo", "style", "details", "stickers", "template", "final"];

export default function App() {
  const [step, setStep] = useState("welcome");
  const [photoSrc, setPhotoSrc] = useState(SAMPLE_AVATARS[0].url);
  const [imgEl, setImgEl] = useState(null);
  const [filter, setFilter] = useState("golden");
  const [details, setDetails] = useState({
    name: "Alex Rivera",
    stack: "Full Stack · AI",
    location: "Goa, India 🌴",
    title: TITLES[0],
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
    cutoutMode: false
  });
  const [template, setTemplate] = useState("goapass");
  const [idCode] = useState(randomId());
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [copied, setCopied] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [theme, setTheme] = useState("emerald");
  const [stickers, setStickers] = useState([STICKER_CATALOG[0]]);
  const [exportFormat, setExportFormat] = useState("4k");
  const [draggingPhoto, setDraggingPhoto] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [tilt, setTilt] = useState({ rx: 0, ry: 0, px: 50, py: 50, active: false });

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const liveCanvasRef = useRef(null);
  const captureCanvasRef = useRef(null);

  const stepIndex = STEPS.indexOf(step);

  const goNext = () => {
    playSound('click', soundEnabled);
    setStep(STEPS[Math.min(stepIndex + 1, STEPS.length - 1)]);
  };

  const goBack = () => {
    playSound('click', soundEnabled);
    setStep(STEPS[Math.max(stepIndex - 1, 0)]);
  };

  // Instant image loading with zero lag
  useEffect(() => {
    if (!photoSrc) { setImgEl(null); return; }
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => setImgEl(im);
    im.src = photoSrc;
  }, [photoSrc]);

  // Realtime canvas update
  const updateCanvas = useCallback(() => {
    const filterCss = FILTERS.find((f) => f.id === filter)?.css || "none";
    const renderer = RENDERERS[template];

    [liveCanvasRef.current, canvasRef.current].forEach((c) => {
      if (!c) return;
      c.width = CARD_W;
      c.height = CARD_H;
      const ctx = c.getContext("2d");
      renderer(ctx, imgEl, filterCss, details, idCode, stickers);
    });
  }, [filter, template, details, imgEl, idCode, stickers]);

  useEffect(() => {
    updateCanvas();
  }, [updateCanvas]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraOn(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const startCamera = async () => {
    playSound('click', soundEnabled);
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      setCameraOn(true);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 50);
    } catch (e) {
      setCameraError("Camera permission denied. You can pick a photo or avatar sample below!");
      setCameraOn(false);
    }
  };

  const capturePhotoWithCountdown = () => {
    setCountdown(3);
    playSound('click', soundEnabled);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(interval);
          doCapture();
          return null;
        }
        playSound('click', soundEnabled);
        return prev - 1;
      });
    }, 800);
  };

  const doCapture = () => {
    playSound('shutter', soundEnabled);
    const video = videoRef.current;
    if (!video) return;
    const c = captureCanvasRef.current;
    c.width = video.videoWidth;
    c.height = video.videoHeight;
    const ctx = c.getContext("2d");
    ctx.translate(c.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    setPhotoSrc(c.toDataURL("image/png"));
    stopCamera();
  };

  const handleFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoSrc(reader.result);
    reader.readAsDataURL(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) {
      const reader = new FileReader();
      reader.onload = () => setPhotoSrc(reader.result);
      reader.readAsDataURL(f);
    }
  };

  const toggleSticker = (st) => {
    playSound('stamp', soundEnabled);
    setStickers((prev) => {
      const exists = prev.some((s) => s.id === st.id);
      if (exists) return prev.filter((s) => s.id !== st.id);
      return [...prev, st];
    });
  };

  const shuffleTitle = () => {
    playSound('click', soundEnabled);
    const t = TITLES[Math.floor(Math.random() * TITLES.length)];
    setDetails((d) => ({ ...d, title: t }));
  };

  // 3D Parallax Handlers
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const px = (x / rect.width) * 100;
    const py = (y / rect.height) * 100;
    const rx = -((y - rect.height / 2) / (rect.height / 2)) * 14;
    const ry = ((x - rect.width / 2) / (rect.width / 2)) * 14;
    setTilt({ rx, ry, px, py, active: true });
  };

  const handleMouseLeave = () => {
    setTilt({ rx: 0, ry: 0, px: 50, py: 50, active: false });
  };

  // Touch Pan/Drag Adjustment Handlers for Photo Positioning
  const handlePanStart = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setDraggingPhoto(true);
    setDragStart({ x: clientX, y: clientY });
  };

  const handlePanMove = (e) => {
    if (!draggingPhoto) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const deltaX = (clientX - dragStart.x) / 150;
    const deltaY = (clientY - dragStart.y) / 150;

    setDetails((d) => ({
      ...d,
      offsetX: Math.max(-1, Math.min(1, d.offsetX + deltaX)),
      offsetY: Math.max(-1, Math.min(1, d.offsetY + deltaY))
    }));
    setDragStart({ x: clientX, y: clientY });
  };

  const handlePanEnd = () => {
    setDraggingPhoto(false);
  };

  // Real Image File Export Download (Native Blob output)
  const downloadCard = () => {
    playSound('click', soundEnabled);
    const filterCss = FILTERS.find((f) => f.id === filter)?.css || "none";
    const renderer = RENDERERS[template];

    if (exportFormat === "story") {
      const storyC = document.createElement("canvas");
      storyC.width = 1080;
      storyC.height = 1920;
      const ctx = storyC.getContext("2d");

      const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1920);
      bgGrad.addColorStop(0, "#091E16");
      bgGrad.addColorStop(0.5, "#154233");
      bgGrad.addColorStop(1, "#05130E");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1080, 1920);

      ctx.fillStyle = "#FF6B4A";
      ctx.font = "800 36px 'Archivo Black', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("HH GOA 2026 · #FrameInGoa", 540, 220);

      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "700 20px 'Space Mono', monospace";
      ctx.fillText(`OFFICIAL BUILDER PASS · ${idCode}`, 540, 265);

      const cardCanvas = document.createElement("canvas");
      cardCanvas.width = CARD_W;
      cardCanvas.height = CARD_H;
      renderer(cardCanvas.getContext("2d"), imgEl, filterCss, details, idCode, stickers);

      const targetW = 980;
      const targetH = (CARD_H / CARD_W) * targetW;
      const targetX = (1080 - targetW) / 2;
      const targetY = (1920 - targetH) / 2;

      ctx.drawImage(cardCanvas, targetX, targetY, targetW, targetH);

      ctx.fillStyle = "#FFD23F";
      ctx.font = "700 24px 'Space Grotesk', sans-serif";
      ctx.fillText("🌴 BUILD IN GOA 2026 · #FrameInGoa 🌴", 540, 1720);

      const link = document.createElement("a");
      link.download = `hh-goa-story-frameingoa-${(details.name || "builder").replace(/\s+/g, "_").toLowerCase()}.png`;
      link.href = storyC.toDataURL("image/png");
      link.click();
    } else {
      const scale = exportFormat === "4k" ? 3 : 1;
      const tempC = document.createElement("canvas");
      tempC.width = CARD_W * scale;
      tempC.height = CARD_H * scale;
      const ctx = tempC.getContext("2d");
      ctx.scale(scale, scale);
      renderer(ctx, imgEl, filterCss, details, idCode, stickers);

      const link = document.createElement("a");
      link.download = `hh-goa-pass-frameingoa-${(details.name || "builder").replace(/\s+/g, "_").toLowerCase()}.png`;
      link.href = tempC.toDataURL("image/png");
      link.click();
    }
  };

  // Native Mobile File Share Sheet with attached PNG image + #FrameInGoa text
  const shareNativeOrSocial = async () => {
    playSound('click', soundEnabled);
    const c = canvasRef.current || liveCanvasRef.current;
    if (!c) return;

    const captionText = `I just generated my official HH Goa 2026 Builder Pass! 🌴🪪 #FrameInGoa`;

    c.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `hh-goa-pass-${idCode}.png`, { type: "image/png" });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: "HH Goa 2026 Builder Pass",
            text: captionText,
            files: [file]
          });
          return;
        } catch (err) {}
      }

      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(captionText)}&hashtags=FrameInGoa`;
      window.open(twitterUrl, "_blank");
    }, "image/png");
  };

  const copyToClipboard = async () => {
    playSound('click', soundEnabled);
    const c = canvasRef.current || liveCanvasRef.current;
    if (!c) return;
    c.toBlob(async (blob) => {
      try {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        alert("#FrameInGoa image copied to clipboard!");
      }
    });
  };

  const themeStyles = {
    emerald: {
      bg: "linear-gradient(135deg, #071f17 0%, #0d382a 50%, #061912 100%)",
      accent: "#FF6B4A",
      glow: "rgba(255,107,74,0.3)",
      cardBg: "rgba(13, 56, 42, 0.45)",
      border: "rgba(127, 216, 196, 0.2)"
    },
    cyber: {
      bg: "linear-gradient(135deg, #050B14 0%, #0A192F 50%, #02060D 100%)",
      accent: "#38EFAC",
      glow: "rgba(56,239,172,0.35)",
      cardBg: "rgba(10, 25, 47, 0.55)",
      border: "rgba(56, 239, 172, 0.25)"
    },
    sunset: {
      bg: "linear-gradient(135deg, #1A0B2E 0%, #3B154C 50%, #120520 100%)",
      accent: "#FF758C",
      glow: "rgba(255,117,140,0.35)",
      cardBg: "rgba(59, 21, 76, 0.45)",
      border: "rgba(240, 194, 123, 0.25)"
    }
  }[theme];

  return (
    <div style={{
      fontFamily: "'Space Grotesk', sans-serif",
      background: themeStyles.bg,
      minHeight: "100vh",
      color: "#F8FAFC",
      padding: "16px 12px 40px",
      boxSizing: "border-box",
      position: "relative",
      overflowX: "hidden"
    }}>
      <style>{FONT_IMPORT}{`
        .glass-panel {
          background: ${themeStyles.cardBg};
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid ${themeStyles.border};
          box-shadow: 0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1);
          border-radius: 24px;
        }
        .btn-glow {
          cursor: pointer;
          border: none;
          border-radius: 999px;
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 700;
          letter-spacing: 0.03em;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 48px;
        }
        .btn-glow:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 10px 25px ${themeStyles.glow};
        }
        .btn-glow:active {
          transform: translateY(0) scale(0.98);
        }
        .btn-primary {
          background: ${themeStyles.accent};
          color: #0F172A;
          padding: 14px 24px;
          font-size: 15px;
        }
        .btn-secondary {
          background: rgba(255,255,255,0.08);
          color: #F8FAFC;
          border: 1px solid ${themeStyles.border}!important;
          padding: 12px 20px;
          font-size: 14px;
        }
        .chip-option {
          cursor: pointer;
          border-radius: 16px;
          padding: 14px;
          border: 1.5px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          transition: all 0.2s ease;
        }
        .chip-option:hover {
          border-color: ${themeStyles.accent};
          background: rgba(255,255,255,0.08);
        }
        .chip-option.active {
          border-color: ${themeStyles.accent};
          background: ${themeStyles.glow};
          box-shadow: 0 0 20px ${themeStyles.glow};
        }
        .input-stylish {
          width: 100%;
          box-sizing: border-box;
          padding: 14px 16px;
          border-radius: 14px;
          border: 1px solid ${themeStyles.border};
          background: rgba(0,0,0,0.3);
          color: #F8FAFC;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 15px;
        }
        .input-stylish:focus {
          outline: none;
          border-color: ${themeStyles.accent};
        }
        .step-pill {
          padding: 8px 14px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
        }
        .step-pill.active {
          background: ${themeStyles.accent};
          color: #0F172A;
        }
        .step-pill.inactive {
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.6);
        }
        .avatar-thumb {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          object-fit: cover;
          cursor: pointer;
          border: 2px solid transparent;
        }
        .avatar-thumb.active { border-color: ${themeStyles.accent}; }
        
        @media (max-width: 768px) {
          .main-grid {
            grid-template-columns: 1fr !important;
          }
          .sticky-preview {
            position: relative !important;
            top: 0 !important;
            margin-bottom: 20px;
          }
        }
      `}</style>

      {/* Ambient background glow */}
      <div style={{
        position: "absolute", top: "-10%", left: "15%", width: 450, height: 450,
        background: themeStyles.glow, borderRadius: "50%", filter: "blur(140px)", pointerEvents: "none"
      }} />

      <div style={{ maxWidth: 1180, margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* Header bar */}
        <header style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 20, flexWrap: "wrap", gap: 12
        }}>
          <div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "4px 10px", borderRadius: 999, background: "rgba(255,255,255,0.08)",
              fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: themeStyles.accent, marginBottom: 4
            }}>
              <Sparkles size={12} /> HH GOA 2026 · #FrameInGoa
            </div>
            <h1 style={{ fontFamily: "'Anton', sans-serif", fontSize: 30, margin: 0, letterSpacing: "0.02em" }}>
              BUILDER PHOTOBOOTH
            </h1>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              className="btn-glow btn-secondary"
              style={{ padding: "8px 12px", minHeight: 40 }}
              onClick={() => { setSoundEnabled(!soundEnabled); playSound('click', true); }}
              title={soundEnabled ? "Mute Audio" : "Enable Audio"}
            >
              {soundEnabled ? <Volume2 size={15} color={themeStyles.accent} /> : <VolumeX size={15} color="rgba(255,255,255,0.4)" />}
            </button>

            <div style={{ display: "flex", gap: 4, background: "rgba(0,0,0,0.3)", padding: 4, borderRadius: 999, border: "1px solid rgba(255,255,255,0.1)" }}>
              <button className={`step-pill ${theme === 'emerald' ? 'active' : 'inactive'}`} onClick={() => { setTheme('emerald'); playSound('click', soundEnabled); }}>
                🌴 Emerald
              </button>
              <button className={`step-pill ${theme === 'cyber' ? 'active' : 'inactive'}`} onClick={() => { setTheme('cyber'); playSound('click', soundEnabled); }}>
                ⚡ Cyber
              </button>
              <button className={`step-pill ${theme === 'sunset' ? 'active' : 'inactive'}`} onClick={() => { setTheme('sunset'); playSound('click', soundEnabled); }}>
                🌅 Sunset
              </button>
            </div>
          </div>
        </header>

        {/* Main Mobile-Responsive Grid */}
        <div className="main-grid" style={{ display: "grid", gridTemplateColumns: step === "welcome" ? "1fr" : "minmax(320px, 1fr) 520px", gap: 24, alignItems: "start" }}>
          
          {/* Mobile Sticky Top Preview for instant feedback */}
          {step !== "welcome" && (
            <div className="sticky-preview" style={{ position: "sticky", top: 16, zIndex: 10 }}>
              <div className="glass-panel" style={{ padding: 16, textAlign: "center" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, padding: "0 4px" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: themeStyles.accent, letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 4 }}>
                    <Move size={13} /> 3D PARALLAX PREVIEW
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "'Space Mono', monospace" }}>
                    #FrameInGoa · {idCode}
                  </div>
                </div>

                <div
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  style={{ perspective: 1000, transformStyle: "preserve-3d", cursor: "pointer" }}
                >
                  <div style={{
                    transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale3d(1.02, 1.02, 1.02)`,
                    transition: tilt.active ? "transform 0.08s ease-out" : "transform 0.5s ease-out",
                    position: "relative", borderRadius: 16, overflow: "hidden",
                    boxShadow: tilt.active ? `0 20px 45px rgba(0,0,0,0.6), 0 0 25px ${themeStyles.glow}` : "0 12px 30px rgba(0,0,0,0.5)",
                    border: `1px solid ${themeStyles.border}`
                  }}>
                    <canvas ref={liveCanvasRef} style={{ width: "100%", height: "auto", display: "block" }} />
                    <canvas ref={canvasRef} style={{ display: "none" }} />

                    {tilt.active && (
                      <div style={{
                        position: "absolute", inset: 0, pointerEvents: "none",
                        background: `radial-gradient(circle at ${tilt.px}% ${tilt.py}%, rgba(255,255,255,0.3) 0%, transparent 60%)`,
                        mixBlendMode: "overlay"
                      }} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Left Column: Interactive Wizard Controls */}
          <div className="glass-panel" style={{ padding: 24 }}>
            
            {step !== "welcome" && (
              <div style={{ display: "flex", gap: 6, marginBottom: 20, overflowX: "auto", paddingBottom: 6 }}>
                {STEPS.slice(1).map((s, idx) => (
                  <button
                    key={s}
                    className={`step-pill ${s === step ? 'active' : 'inactive'}`}
                    onClick={() => { setStep(s); playSound('click', soundEnabled); }}
                  >
                    {idx + 1}. {s.toUpperCase()}
                  </button>
                ))}
              </div>
            )}

            {/* WELCOME STEP */}
            {step === "welcome" && (
              <div style={{ textAlign: "center", padding: "30px 16px" }}>
                <div style={{ fontSize: 44, marginBottom: 14 }}>🌴📸✨</div>
                <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 800, marginBottom: 10 }}>
                  HH Goa 2026 Builder Pass Studio
                </h2>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: "rgba(248,250,252,0.75)", maxWidth: 480, margin: "0 auto 28px" }}>
                  Instant, mobile-optimized builder pass generator. Upload any photo, pick a vibe, add custom stamps, and share with <b>#FrameInGoa</b>!
                </p>
                <button className="btn-glow btn-primary" onClick={goNext}>
                  CREATE MY PASS <ArrowRight size={18} />
                </button>
              </div>
            )}

            {/* STEP 1: PHOTO (Fast upload, dropzone, auto-centering for all aspect ratios) */}
            {step === "photo" && (
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 0, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                  <Camera size={18} color={themeStyles.accent} /> Fast Photo Upload
                </h3>

                {/* File Dropzone */}
                {!cameraOn && (
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    style={{
                      border: `2px dashed ${themeStyles.border}`, borderRadius: 16,
                      padding: "20px 14px", textAlign: "center", background: "rgba(0,0,0,0.2)",
                      marginBottom: 16, cursor: "pointer"
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={24} color={themeStyles.accent} style={{ marginBottom: 6 }} />
                    <div style={{ fontSize: 14, fontWeight: 700 }}>Tap or Drop Any Photo Here</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
                      Supports Portrait, Landscape, Square & Off-Center Photos
                    </div>
                  </div>
                )}

                {!cameraOn && (
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
                    <button className="btn-glow btn-primary" style={{ flex: 1 }} onClick={startCamera}>
                      <Camera size={15} /> Open Camera
                    </button>
                    <button className="btn-glow btn-secondary" style={{ flex: 1 }} onClick={() => fileInputRef.current?.click()}>
                      <Upload size={15} /> Select File
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
                  </div>
                )}

                {cameraError && (
                  <p style={{ color: "#FF758C", fontSize: 13, background: "rgba(255,117,140,0.1)", padding: 10, borderRadius: 10 }}>
                    {cameraError}
                  </p>
                )}

                {cameraOn && (
                  <div style={{ textAlign: "center", position: "relative", marginBottom: 16 }}>
                    <video ref={videoRef} autoPlay playsInline style={{ width: "100%", maxHeight: 260, borderRadius: 16, objectFit: "cover", transform: "scaleX(-1)", border: `2px solid ${themeStyles.accent}` }} />
                    
                    {countdown !== null && (
                      <div style={{
                        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                        fontSize: 64, fontWeight: 800, color: "#FFD23F", textShadow: "0 0 20px rgba(0,0,0,0.8)"
                      }}>
                        {countdown}
                      </div>
                    )}

                    <div style={{ marginTop: 10, display: "flex", gap: 10, justifyContent: "center" }}>
                      <button className="btn-glow btn-primary" onClick={capturePhotoWithCountdown}>
                        📷 Snap Photo (3s)
                      </button>
                      <button className="btn-glow btn-secondary" onClick={stopCamera}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Sample Avatars */}
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>
                    OR TAP A SAMPLE AVATAR:
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    {SAMPLE_AVATARS.map((av, i) => (
                      <img
                        key={i}
                        src={av.url}
                        alt={av.name}
                        className={`avatar-thumb ${photoSrc === av.url ? 'active' : ''}`}
                        onClick={() => { setPhotoSrc(av.url); stopCamera(); playSound('click', soundEnabled); }}
                      />
                    ))}
                  </div>
                </div>

                {/* Photo Drag & Pan Adjustments */}
                <div style={{ marginTop: 20, padding: 14, background: "rgba(0,0,0,0.2)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                      <Sliders size={13} color={themeStyles.accent} /> Touch Pan & Frame Adjust
                    </div>

                    <button
                      className={`step-pill ${details.cutoutMode ? 'active' : 'inactive'}`}
                      style={{ padding: "4px 8px", fontSize: 10 }}
                      onClick={() => { setDetails((d) => ({ ...d, cutoutMode: !d.cutoutMode })); playSound('click', soundEnabled); }}
                    >
                      ✨ Cutout Vignette: {details.cutoutMode ? "ON" : "OFF"}
                    </button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", display: "block", marginBottom: 2 }}>
                        Zoom ({details.zoom.toFixed(1)}x)
                      </label>
                      <input
                        type="range" min="1" max="2" step="0.1" value={details.zoom}
                        onChange={(e) => setDetails((d) => ({ ...d, zoom: parseFloat(e.target.value) }))}
                        style={{ width: "100%" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", display: "block", marginBottom: 2 }}>
                        Vertical Shift
                      </label>
                      <input
                        type="range" min="-1" max="1" step="0.1" value={details.offsetY}
                        onChange={(e) => setDetails((d) => ({ ...d, offsetY: parseFloat(e.target.value) }))}
                        style={{ width: "100%" }}
                      />
                    </div>
                  </div>
                </div>

                <canvas ref={captureCanvasRef} style={{ display: "none" }} />
                <NavRow onBack={goBack} onNext={goNext} />
              </div>
            )}

            {/* STEP 2: STYLE / FILTERS */}
            {step === "style" && (
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 0, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                  <Palette size={18} color={themeStyles.accent} /> Instant Photo Vibe
                </h3>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 10 }}>
                  {FILTERS.map((f) => (
                    <div
                      key={f.id}
                      className={`chip-option ${filter === f.id ? "active" : ""}`}
                      onClick={() => { setFilter(f.id); playSound('click', soundEnabled); }}
                      style={{ textAlign: "center", padding: 10 }}
                    >
                      <div style={{ width: "100%", height: 50, borderRadius: 8, marginBottom: 6, overflow: "hidden" }}>
                        {photoSrc && <img src={photoSrc} style={{ width: "100%", height: "100%", objectFit: "cover", filter: f.css }} alt={f.label} />}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em" }}>{f.label}</div>
                    </div>
                  ))}
                </div>

                <NavRow onBack={goBack} onNext={goNext} />
              </div>
            )}

            {/* STEP 3: DETAILS */}
            {step === "details" && (
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 0, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                  <User size={18} color={themeStyles.accent} /> Builder Profile
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: themeStyles.accent, marginBottom: 4, display: "block" }}>
                      BUILDER NAME
                    </label>
                    <input
                      className="input-stylish"
                      type="text"
                      placeholder="e.g. Alex Rivera"
                      value={details.name}
                      onChange={(e) => setDetails((d) => ({ ...d, name: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: themeStyles.accent, marginBottom: 4, display: "block" }}>
                      TECH STACK & ROLE
                    </label>
                    <input
                      className="input-stylish"
                      type="text"
                      placeholder="e.g. Full Stack · AI"
                      value={details.stack}
                      onChange={(e) => setDetails((d) => ({ ...d, stack: e.target.value }))}
                    />
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                      {STACK_PRESETS.map((st) => (
                        <button
                          key={st}
                          style={{
                            border: "none", background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.8)",
                            borderRadius: 999, padding: "4px 8px", fontSize: 10, cursor: "pointer"
                          }}
                          onClick={() => { setDetails((d) => ({ ...d, stack: st })); playSound('click', soundEnabled); }}
                        >
                          + {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: themeStyles.accent, marginBottom: 4, display: "block" }}>
                      HONORARY TITLE
                    </label>
                    <div style={{ display: "flex", gap: 6 }}>
                      <input
                        className="input-stylish"
                        type="text"
                        value={details.title}
                        onChange={(e) => setDetails((d) => ({ ...d, title: e.target.value }))}
                      />
                      <button className="btn-glow btn-secondary" style={{ padding: "8px 12px" }} onClick={shuffleTitle} title="Shuffle Title">
                        <Shuffle size={15} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: themeStyles.accent, marginBottom: 4, display: "block" }}>
                      LOCATION
                    </label>
                    <input
                      className="input-stylish"
                      type="text"
                      placeholder="e.g. Goa, India 🌴"
                      value={details.location}
                      onChange={(e) => setDetails((d) => ({ ...d, location: e.target.value }))}
                    />
                  </div>
                </div>

                <NavRow onBack={goBack} onNext={goNext} />
              </div>
            )}

            {/* STEP 4: STICKER STUDIO (#FrameInGoa default) */}
            {step === "stickers" && (
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 0, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                  <Tag size={18} color={themeStyles.accent} /> Sticker & Badge Studio
                </h3>

                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 14 }}>
                  Tap stickers to stamp them onto your pass badge in realtime!
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {STICKER_CATALOG.map((st) => {
                    const active = stickers.some((s) => s.id === st.id);
                    return (
                      <div
                        key={st.id}
                        className={`chip-option ${active ? "active" : ""}`}
                        onClick={() => toggleSticker(st)}
                        style={{ padding: 12, display: "flex", alignItems: "center", gap: 8 }}
                      >
                        <span style={{ fontSize: 20 }}>{st.icon}</span>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 800 }}>{st.text}</div>
                          <div style={{ fontSize: 10, color: active ? themeStyles.accent : "rgba(255,255,255,0.5)" }}>
                            {active ? "✓ Stamped" : "+ Stamp"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <NavRow onBack={goBack} onNext={goNext} />
              </div>
            )}

            {/* STEP 5: TEMPLATES */}
            {step === "template" && (
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 0, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                  <ImageIcon size={18} color={themeStyles.accent} /> Pass Design Template
                </h3>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {TEMPLATES.map((t) => (
                    <div
                      key={t.id}
                      className={`chip-option ${template === t.id ? "active" : ""}`}
                      onClick={() => { setTemplate(t.id); playSound('click', soundEnabled); }}
                      style={{ padding: 14 }}
                    >
                      <div style={{ fontSize: 22, marginBottom: 4 }}>{t.icon}</div>
                      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 800, marginBottom: 2 }}>
                        {t.name}
                      </div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", lineHeight: 1.3 }}>
                        {t.blurb}
                      </div>
                    </div>
                  ))}
                </div>

                <NavRow onBack={goBack} onNext={goNext} />
              </div>
            )}

            {/* STEP 6: FINAL EXPORT & NATIVE SHARE WITH #FrameInGoa */}
            {step === "final" && (
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 0, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                  <ShieldCheck size={18} color={themeStyles.accent} /> Download & Share #FrameInGoa
                </h3>

                {/* Format selection */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: themeStyles.accent, marginBottom: 6, display: "block" }}>
                    SELECT DOWNLOAD FORMAT
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                    <button
                      className={`step-pill ${exportFormat === '4k' ? 'active' : 'inactive'}`}
                      style={{ borderRadius: 10, textAlign: "center", padding: "8px 4px" }}
                      onClick={() => { setExportFormat('4k'); playSound('click', soundEnabled); }}
                    >
                      <Monitor size={12} style={{ verticalAlign: "-1px" }} /> 4K PNG
                    </button>
                    <button
                      className={`step-pill ${exportFormat === 'story' ? 'active' : 'inactive'}`}
                      style={{ borderRadius: 10, textAlign: "center", padding: "8px 4px" }}
                      onClick={() => { setExportFormat('story'); playSound('click', soundEnabled); }}
                    >
                      <Smartphone size={12} style={{ verticalAlign: "-1px" }} /> Story 9:16
                    </button>
                    <button
                      className={`step-pill ${exportFormat === 'standard' ? 'active' : 'inactive'}`}
                      style={{ borderRadius: 10, textAlign: "center", padding: "8px 4px" }}
                      onClick={() => { setExportFormat('standard'); playSound('click', soundEnabled); }}
                    >
                      <Download size={12} style={{ verticalAlign: "-1px" }} /> Standard
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {/* Download Real PNG file */}
                  <button className="btn-glow btn-primary" onClick={downloadCard} style={{ width: "100%" }}>
                    <Download size={16} /> DOWNLOAD REAL IMAGE FILE (.PNG)
                  </button>

                  {/* Native Mobile Share sheet / Twitter fallback with #FrameInGoa */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <button className="btn-glow btn-secondary" onClick={shareNativeOrSocial}>
                      <Share2 size={15} color={themeStyles.accent} /> SHARE #FrameInGoa
                    </button>
                    <button className="btn-glow btn-secondary" onClick={copyToClipboard}>
                      {copied ? <Check size={15} color="#38EFAC" /> : <Copy size={15} />}
                      {copied ? "COPIED!" : "COPY IMAGE"}
                    </button>
                  </div>

                  <button className="btn-glow btn-secondary" style={{ marginTop: 4 }} onClick={() => setStep("template")}>
                    <RefreshCw size={14} /> Change Template / Edit
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}

function NavRow({ onBack, onNext, nextDisabled }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 24 }}>
      <button className="btn-glow btn-secondary" onClick={onBack}>
        <ArrowLeft size={14} /> Back
      </button>
      <button
        className="btn-glow btn-primary"
        disabled={nextDisabled}
        style={nextDisabled ? { opacity: 0.5, cursor: "not-allowed" } : {}}
        onClick={onNext}
      >
        Next Step <ArrowRight size={14} />
      </button>
    </div>
  );
}
