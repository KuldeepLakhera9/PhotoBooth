import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Camera, Upload, Shuffle, Download, X as XIcon, ArrowRight, ArrowLeft,
  RefreshCw, Sparkles, Copy, Check, Sliders, Palette, Image as ImageIcon,
  ShieldCheck, Zap, User, MapPin, Briefcase, Share2, ExternalLink, RotateCw,
  Layers, Eye, Monitor
} from "lucide-react";

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Imbue:opsz,wght@10..120,400;700;900&family=Victor+Mono:wght@500;700;800&family=Archivo+Black&family=Outfit:wght@400;600;700;800&family=Space+Grotesk:wght@500;700;800&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');`;

const FILTERS = [
  { id: "normal", label: "Normal" },
  { id: "dualtone", label: "Dual Tone" },
  { id: "dither", label: "Dither" },
  { id: "ascii", label: "ASCII" },
  { id: "grayscale", label: "Grayscale" },
  { id: "pixelate", label: "Pixelate" },
];

const FRAMES = [
  { id: "none", label: "None", name: "MINIMAL BADGE" },
  { id: "frame1", label: "1", name: "VIP BUILDER PASS" },
  { id: "frame2", label: "2", name: "CREATIVE LICENSE" },
  { id: "frame3", label: "3", name: "CYBER TERMINAL" },
  { id: "frame4", label: "4", name: "GOA SUNSET CLUB" },
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
  return "HH26-" + Math.random().toString(36).slice(2, 6).toUpperCase();
}

// Canvas Image Filter Effect Pipeline
function applyCanvasFilter(ctx, filterId, px, py, pw, ph) {
  if (filterId === "normal") return;

  const imgData = ctx.getImageData(px, py, pw, ph);
  const data = imgData.data;

  if (filterId === "grayscale") {
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
      data[i] = avg;
      data[i + 1] = avg;
      data[i + 2] = avg;
    }
    ctx.putImageData(imgData, px, py);
  } else if (filterId === "dualtone") {
    // HH Goa Green (#0B6839) & Cyber Yellow (#FEE101) map
    for (let i = 0; i < data.length; i += 4) {
      const lum = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
      data[i] = Math.floor(11 + (254 - 11) * lum);      // Red
      data[i + 1] = Math.floor(104 + (225 - 104) * lum); // Green
      data[i + 2] = Math.floor(57 + (1 - 57) * lum);     // Blue
    }
    ctx.putImageData(imgData, px, py);
  } else if (filterId === "dither") {
    // Retro dither thresholding
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      const v = avg > 128 ? 255 : 0;
      data[i] = v === 255 ? 255 : 11;
      data[i + 1] = v === 255 ? 251 : 104;
      data[i + 2] = v === 255 ? 232 : 57;
    }
    ctx.putImageData(imgData, px, py);
  } else if (filterId === "pixelate") {
    const size = 8;
    for (let y = 0; y < ph; y += size) {
      for (let x = 0; x < pw; x += size) {
        const i = (y * pw + x) * 4;
        const r = data[i], g = data[i + 1], b = data[i + 2];
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(px + x, py + y, size, size);
      }
    }
  } else if (filterId === "ascii") {
    // Matrix ASCII Overlay
    ctx.fillStyle = "rgba(11, 104, 57, 0.9)";
    ctx.fillRect(px, py, pw, ph);
    ctx.fillStyle = "#FEE101";
    ctx.font = "700 10px 'Victor Mono', monospace";
    const chars = "01#GOA2026HH";
    for (let y = 0; y < ph; y += 12) {
      for (let x = 0; x < pw; x += 10) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(char, px + x, py + y + 8);
      }
    }
  }
}

// Cover fit algorithm for any photo aspect ratio
function drawImageCover(ctx, img, x, y, w, h, zoom = 1, offsetX = 0, offsetY = 0) {
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

  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
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

function drawBarcode(ctx, x, y, w, h, color = "#0B6839") {
  ctx.save();
  ctx.fillStyle = color;
  let cx = x;
  let seed = 29;
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

// Master Renderer for Card Front
function renderCardFront(ctx, img, filterId, frameId, details, idCode) {
  ctx.clearRect(0, 0, CARD_W, CARD_H);

  if (frameId === "frame2") { // Creative License
    ctx.fillStyle = "#0D1117";
    ctx.fillRect(0, 0, CARD_W, CARD_H);

    const cx = 50, cy = 45, cw = CARD_W - 100, ch = CARD_H - 90;
    drawRoundedRect(ctx, cx, cy, cw, ch, 14);
    ctx.fillStyle = "#FFFBE8";
    ctx.fill();
    ctx.strokeStyle = "#0B6839";
    ctx.lineWidth = 4;
    ctx.stroke();

    // Header
    ctx.fillStyle = "#0B6839";
    ctx.font = "900 32px 'Imbue', serif";
    ctx.fillText("HACKER HOUSE GOA · CREATIVE LICENSE", cx + 230, cy + 50);
    ctx.font = "700 14px 'Victor Mono', monospace";
    ctx.fillStyle = "#FF0080";
    ctx.fillText("#FrameInGoa · OCT 28-31 2026", cx + 230, cy + 78);

    ctx.textAlign = "right";
    ctx.font = "800 24px 'Victor Mono', monospace";
    ctx.fillStyle = "#0B6839";
    ctx.fillText(idCode, cx + cw - 30, cy + 55);
    ctx.textAlign = "left";

    // Polaroid Frame
    const px = cx + 36, py = cy + 100, pw = 220, ph = 265;
    ctx.fillStyle = "#FFFFFF";
    ctx.shadowColor = "rgba(0,0,0,0.25)";
    ctx.shadowBlur = 12;
    ctx.fillRect(px, py, pw, ph + 34);
    ctx.shadowBlur = 0;

    ctx.save();
    ctx.beginPath();
    ctx.rect(px + 10, py + 10, pw - 20, ph - 20);
    ctx.clip();
    if (img) {
      drawImageCover(ctx, img, px + 10, py + 10, pw - 20, ph - 20, details.zoom, details.offsetX, details.offsetY);
      applyCanvasFilter(ctx, filterId, px + 10, py + 10, pw - 20, ph - 20);
    } else {
      ctx.fillStyle = "#E5E0D0";
      ctx.fillRect(px + 10, py + 10, pw - 20, ph - 20);
    }
    ctx.restore();

    // Details
    const dx = px + pw + 44;
    let dy = py + 10;
    const field = (label, val) => {
      ctx.font = "700 12px 'Victor Mono', monospace";
      ctx.fillStyle = "#0B6839";
      ctx.fillText(label, dx, dy);
      ctx.font = "700 24px 'Caveat', cursive";
      ctx.fillStyle = "#000000";
      ctx.fillText(val || "-", dx, dy + 26);
      dy += 62;
    };
    field("1. BUILDER NAME", details.name);
    field("2. ROLE / CLASS", details.title);
    field("3. SOCIAL HANDLE", details.social);

    drawBarcode(ctx, cx + 36, cy + ch - 48, 220, 28, "#0B6839");
    ctx.font = "700 13px 'Victor Mono', monospace";
    ctx.fillStyle = "#FF0080";
    ctx.fillText("LESS NOISE. MORE SIGNAL.", cx + cw - 260, cy + ch - 28);
    return;
  }

  if (frameId === "frame3") { // Cyber Terminal
    ctx.fillStyle = "#050B14";
    ctx.fillRect(0, 0, CARD_W, CARD_H);

    ctx.strokeStyle = "rgba(56, 239, 172, 0.12)";
    for (let gx = 0; gx < CARD_W; gx += 32) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, CARD_H); ctx.stroke();
    }

    const cx = 40, cy = 40, cw = CARD_W - 80, ch = CARD_H - 80;
    drawRoundedRect(ctx, cx, cy, cw, ch, 16);
    ctx.strokeStyle = "#38EFAC";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = "800 28px 'Victor Mono', monospace";
    ctx.fillStyle = "#38EFAC";
    ctx.fillText("HH.GOA // 2026", cx + 32, cy + 48);
    ctx.textAlign = "right";
    ctx.fillStyle = "#FEE101";
    ctx.font = "700 16px 'Victor Mono', monospace";
    ctx.fillText("SYS.STATUS: ONLINE", cx + cw - 32, cy + 48);
    ctx.textAlign = "left";

    const px = cx + 32, py = cy + 80, pw = 260, ph = 320;
    drawRoundedRect(ctx, px, py, pw, ph, 8);
    ctx.save();
    ctx.clip();
    if (img) {
      drawImageCover(ctx, img, px, py, pw, ph, details.zoom, details.offsetX, details.offsetY);
      applyCanvasFilter(ctx, filterId, px, py, pw, ph);
    } else {
      ctx.fillStyle = "#111827";
      ctx.fillRect(px, py, pw, ph);
    }
    ctx.restore();

    ctx.strokeStyle = "#38EFAC";
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, px, py, pw, ph, 8);
    ctx.stroke();

    const dx = px + pw + 40;
    let dy = py + 14;
    const row = (lbl, val, color = "#FFFFFF") => {
      ctx.font = "700 12px 'Victor Mono', monospace";
      ctx.fillStyle = "#38EFAC";
      ctx.fillText(lbl, dx, dy);
      ctx.font = "700 24px 'Space Grotesk', sans-serif";
      ctx.fillStyle = color;
      ctx.fillText(val || "-", dx, dy + 28);
      dy += 68;
    };

    row("1. OPERATOR", (details.name || "UNNAMED").toUpperCase());
    row("2. DESIGNATION", (details.title || "BUILDER").toUpperCase(), "#FEE101");
    row("3. SOCIAL LINK", details.social || "-", "#38EFAC");

    const fy = cy + ch - 54;
    ctx.font = "700 16px 'Victor Mono', monospace";
    ctx.fillStyle = "#94A3B8";
    ctx.fillText("UUID: " + idCode, cx + 32, fy);
    drawBarcode(ctx, cx + 32, fy + 14, cw - 64, 26, "#38EFAC");
    return;
  }

  if (frameId === "frame4") { // Goa Sunset
    const bg = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
    bg.addColorStop(0, "#2A0845");
    bg.addColorStop(0.5, "#6441A5");
    bg.addColorStop(1, "#FF512F");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CARD_W, CARD_H);

    const cx = 40, cy = 40, cw = CARD_W - 80, ch = CARD_H - 80;
    drawRoundedRect(ctx, cx, cy, cw, ch, 20);
    ctx.strokeStyle = "#FEE101";
    ctx.lineWidth = 3;
    ctx.stroke();

    drawRoundedRect(ctx, cx + 10, cy + 10, cw - 20, ch - 20, 16);
    ctx.fillStyle = "rgba(15, 10, 25, 0.7)";
    ctx.fill();

    ctx.fillStyle = "#FEE101";
    ctx.font = "800 32px 'Imbue', serif";
    ctx.fillText("GOA SUNSET BUILDER CLUB · #FrameInGoa", cx + 32, cy + 50);

    ctx.textAlign = "right";
    ctx.font = "700 15px 'Victor Mono', monospace";
    ctx.fillStyle = "#FF758C";
    ctx.fillText("MEMBER #" + idCode, cx + cw - 32, cy + 50);
    ctx.textAlign = "left";

    const px = cx + 32, py = cy + 80, pw = 260, ph = 330;
    drawRoundedRect(ctx, px, py, pw, ph, 12);
    ctx.save();
    ctx.clip();
    if (img) {
      drawImageCover(ctx, img, px, py, pw, ph, details.zoom, details.offsetX, details.offsetY);
      applyCanvasFilter(ctx, filterId, px, py, pw, ph);
    } else {
      ctx.fillStyle = "#2D1B4E";
      ctx.fillRect(px, py, pw, ph);
    }
    ctx.restore();

    ctx.strokeStyle = "#FEE101";
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, px, py, pw, ph, 12);
    ctx.stroke();

    const dx = px + pw + 40;
    let dy = py + 14;

    ctx.fillStyle = "#FEE101";
    ctx.font = "700 12px 'Victor Mono', monospace";
    ctx.fillText("BUILDER NAME", dx, dy);
    ctx.font = "800 32px 'Outfit', sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText((details.name || "YOUR NAME").toUpperCase(), dx, dy + 36);

    dy += 82;
    ctx.fillStyle = "#FEE101";
    ctx.font = "700 12px 'Victor Mono', monospace";
    ctx.fillText("ROLE / TITLE", dx, dy);
    ctx.font = "700 22px 'Space Grotesk', sans-serif";
    ctx.fillStyle = "#FF758C";
    ctx.fillText(details.title || "BUILDER", dx, dy + 28);

    dy += 74;
    ctx.fillStyle = "#FEE101";
    ctx.font = "700 12px 'Victor Mono', monospace";
    ctx.fillText("SOCIAL LINK", dx, dy);
    ctx.font = "700 18px 'Victor Mono', monospace";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(details.social || "-", dx, dy + 26);

    const fy = cy + ch - 54;
    drawBarcode(ctx, cx + 32, fy, cw - 64, 28, "#FEE101");
    return;
  }

  // Frame 1 / Default VIP BUILDER PASS (Matching HH Goa Official Brand)
  const bg = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  bg.addColorStop(0, "#0B6839");
  bg.addColorStop(1, "#084E2A");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Dots pattern
  ctx.fillStyle = "rgba(254, 225, 1, 0.12)";
  for (let x = 0; x < CARD_W; x += 24) {
    for (let y = 0; y < CARD_H; y += 24) {
      ctx.fillRect(x, y, 2, 2);
    }
  }

  const cx = 35, cy = 35, cw = CARD_W - 70, ch = CARD_H - 70;
  drawRoundedRect(ctx, cx, cy, cw, ch, 24);
  ctx.fillStyle = "#FFFBE8";
  ctx.fill();

  // Banner Header
  drawRoundedRect(ctx, cx, cy, cw, 80, 24);
  ctx.save();
  ctx.clip();
  ctx.fillStyle = "#0B6839";
  ctx.fillRect(cx, cy, cw * 0.68, 80);
  ctx.fillStyle = "#FF0080";
  ctx.fillRect(cx + cw * 0.68, cy, cw * 0.32, 80);
  ctx.fillStyle = "#FEE101";
  ctx.fillRect(cx + cw * 0.68 - 3, cy, 6, 80);
  ctx.restore();

  ctx.fillStyle = "#FFFBE8";
  ctx.font = "900 36px 'Imbue', serif";
  ctx.textBaseline = "middle";
  ctx.fillText("HACKER HOUSE GOA 2026", cx + 28, cy + 40);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "800 15px 'Victor Mono', monospace";
  ctx.textAlign = "right";
  ctx.fillText("#FrameInGoa", cx + cw - 24, cy + 40);
  ctx.textAlign = "left";

  // Photo Box
  const px = cx + 32, py = cy + 104, pw = 270, ph = 340;
  ctx.save();
  drawRoundedRect(ctx, px - 3, py - 3, pw + 6, ph + 6, 14);
  ctx.fillStyle = "#0B6839";
  ctx.fill();
  ctx.restore();

  ctx.save();
  drawRoundedRect(ctx, px, py, pw, ph, 10);
  ctx.clip();
  if (img) {
    drawImageCover(ctx, img, px, py, pw, ph, details.zoom, details.offsetX, details.offsetY);
    applyCanvasFilter(ctx, filterId, px, py, pw, ph);
  } else {
    ctx.fillStyle = "#EAE3CD";
    ctx.fillRect(px, py, pw, ph);
  }
  ctx.restore();

  drawStar(ctx, px + 8, py + 12, 16, "#FEE101", -0.2);

  // Details
  const dx = px + pw + 40;
  let dy = py + 14;

  ctx.fillStyle = "#0B6839";
  ctx.font = "800 13px 'Victor Mono', monospace";
  ctx.fillText("1. BUILDER NAME", dx, dy);
  ctx.font = "900 36px 'Archivo Black', sans-serif";
  ctx.fillStyle = "#000000";
  ctx.fillText((details.name || "YOUR NAME").toUpperCase(), dx, dy + 38);

  dy += 88;
  ctx.fillStyle = "#0B6839";
  ctx.font = "800 13px 'Victor Mono', monospace";
  ctx.fillText("2. ROLE / TITLE", dx, dy);
  ctx.font = "800 24px 'Space Grotesk', sans-serif";
  ctx.fillStyle = "#FF0080";
  ctx.fillText(details.title || "BUILDER", dx, dy + 28);

  dy += 74;
  ctx.fillStyle = "#0B6839";
  ctx.font = "800 13px 'Victor Mono', monospace";
  ctx.fillText("3. SOCIALS LINK", dx, dy);
  ctx.font = "700 18px 'Victor Mono', monospace";
  ctx.fillStyle = "#0B6839";
  ctx.fillText(details.social || "https://x.com/yourhandle", dx, dy + 26);

  dy += 70;
  ctx.font = "800 14px 'Victor Mono', monospace";
  ctx.fillStyle = "#0B6839";
  ctx.fillText("OCT 28–31 · 2026 · GOA, INDIA", dx, dy + 24);

  const fy = cy + ch - 60;
  drawBarcode(ctx, cx + 32, fy, 240, 38, "#0B6839");

  ctx.font = "800 20px 'Victor Mono', monospace";
  ctx.fillStyle = "#0B6839";
  ctx.textAlign = "right";
  ctx.fillText(idCode, cx + cw - 32, fy + 24);
  ctx.textAlign = "left";
}

// Master Renderer for Card Back (Flipped view)
function renderCardBack(ctx, idCode) {
  ctx.clearRect(0, 0, CARD_W, CARD_H);

  const bg = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  bg.addColorStop(0, "#084E2A");
  bg.addColorStop(1, "#0B6839");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  ctx.fillStyle = "rgba(254, 225, 1, 0.15)";
  for (let x = 0; x < CARD_W; x += 24) {
    for (let y = 0; y < CARD_H; y += 24) {
      ctx.fillRect(x, y, 2, 2);
    }
  }

  const cx = 35, cy = 35, cw = CARD_W - 70, ch = CARD_H - 70;
  drawRoundedRect(ctx, cx, cy, cw, ch, 24);
  ctx.fillStyle = "#FFFBE8";
  ctx.fill();

  // Magnetic strip
  ctx.fillStyle = "#1A1A1A";
  ctx.fillRect(cx, cy + 50, cw, 70);

  // Signature field
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(cx + 40, cy + 160, cw - 260, 50);
  ctx.font = "700 22px 'Caveat', cursive";
  ctx.fillStyle = "#0B6839";
  ctx.fillText("Verified HH Goa Builder #FrameInGoa", cx + 60, cy + 192);

  // Security CVC code box
  ctx.fillStyle = "#EAE3CD";
  ctx.fillRect(cx + cw - 200, cy + 160, 160, 50);
  ctx.font = "800 18px 'Victor Mono', monospace";
  ctx.fillStyle = "#FF0080";
  ctx.fillText("CVC 2026", cx + cw - 180, cy + 192);

  // Event info block
  ctx.fillStyle = "#0B6839";
  ctx.font = "900 28px 'Imbue', serif";
  ctx.fillText("HACKER HOUSE GOA 2026", cx + 40, cy + 260);

  ctx.font = "700 14px 'Victor Mono', monospace";
  ctx.fillStyle = "#000000";
  ctx.fillText("OFFICIAL VIP CREDENTIAL · NON-TRANSFERABLE", cx + 40, cy + 290);
  ctx.fillText("DATES: OCTOBER 28–31, 2026 · GOA, INDIA", cx + 40, cy + 315);
  ctx.fillText("HOST: 2:47 PM STUDIO · LESS NOISE. MORE SIGNAL.", cx + 40, cy + 340);

  drawBarcode(ctx, cx + 40, cy + ch - 70, cw - 80, 40, "#0B6839");

  ctx.font = "800 14px 'Victor Mono', monospace";
  ctx.fillStyle = "#FF0080";
  ctx.textAlign = "center";
  ctx.fillText(`BUILDER ID: ${idCode} · #FrameInGoa`, CARD_W / 2, cy + ch - 15);
  ctx.textAlign = "left";
}

export default function App() {
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [social, setSocial] = useState("");
  const [photoSrc, setPhotoSrc] = useState(SAMPLE_AVATARS[0].url);
  const [imgEl, setImgEl] = useState(null);
  const [frame, setFrame] = useState("frame1");
  const [filter, setFilter] = useState("normal");
  const [viewMode, setViewMode] = useState("3d"); // '3d' | '2d'
  const [isFlipped, setIsFlipped] = useState(false);
  const [idCode] = useState(randomId());
  const [zoom, setZoom] = useState(1);
  const [offsetY, setOffsetY] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isGenerated, setIsGenerated] = useState(true);

  // 3D Tilt State
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, px: 50, py: 50, active: false });

  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const liveCanvasRef = useRef(null);

  // Load photo element
  useEffect(() => {
    if (!photoSrc) { setImgEl(null); return; }
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => setImgEl(im);
    im.src = photoSrc;
  }, [photoSrc]);

  // Update canvas preview
  const updateCanvas = useCallback(() => {
    const details = { name, title, social, zoom, offsetX, offsetY };
    [liveCanvasRef.current, canvasRef.current].forEach((c) => {
      if (!c) return;
      c.width = CARD_W;
      c.height = CARD_H;
      const ctx = c.getContext("2d");
      if (isFlipped) {
        renderCardBack(ctx, idCode);
      } else {
        renderCardFront(ctx, imgEl, filter, frame, details, idCode);
      }
    });
  }, [name, title, social, photoSrc, frame, filter, isFlipped, idCode, zoom, offsetX, offsetY, imgEl]);

  useEffect(() => {
    updateCanvas();
  }, [updateCanvas]);

  const handleFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoSrc(reader.result);
      setIsGenerated(true);
    };
    reader.readAsDataURL(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoSrc(reader.result);
        setIsGenerated(true);
      };
      reader.readAsDataURL(f);
    }
  };

  // 3D Tilt Handlers
  const handleMouseMove = (e) => {
    if (viewMode !== "3d") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const px = (x / rect.width) * 100;
    const py = (y / rect.height) * 100;
    const rx = -((y - rect.height / 2) / (rect.height / 2)) * 16;
    const ry = ((x - rect.width / 2) / (rect.width / 2)) * 16;
    setTilt({ rx, ry, px, py, active: true });
  };

  const handleMouseLeave = () => {
    setTilt({ rx: 0, ry: 0, px: 50, py: 50, active: false });
  };

  const downloadPNG = () => {
    const tempC = document.createElement("canvas");
    tempC.width = CARD_W * 2;
    tempC.height = CARD_H * 2;
    const ctx = tempC.getContext("2d");
    ctx.scale(2, 2);
    const details = { name, title, social, zoom, offsetX, offsetY };
    if (isFlipped) {
      renderCardBack(ctx, idCode);
    } else {
      renderCardFront(ctx, imgEl, filter, frame, details, idCode);
    }

    const link = document.createElement("a");
    link.download = `hh-goa-2026-pass-${(name || "builder").replace(/\s+/g, "_").toLowerCase()}.png`;
    link.href = tempC.toDataURL("image/png");
    link.click();
  };

  const shareX = () => {
    const text = encodeURIComponent(
      `I just generated my official HH Goa 2026 Builder Pass! 🌴🪪\n\nGenerate yours: https://hhg-id.vercel.app\n\n#FrameInGoa @247pmstudio @hhgoa`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText("https://hhg-id.vercel.app");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      alert("Link copied: https://hhg-id.vercel.app");
    }
  };

  return (
    <div style={{
      fontFamily: "'Victor Mono', monospace",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "20px 16px 32px",
      boxSizing: "border-box"
    }}>
      <style>{FONT_IMPORT}{`
        .neo-input {
          width: 100%;
          box-sizing: border-box;
          padding: 8px 12px;
          border-radius: 8px;
          border: 2px solid #000;
          background: #FFFFFF;
          color: #000;
          font-family: 'Victor Mono', monospace;
          font-weight: 700;
          font-size: 13px;
        }
        .neo-input:focus {
          outline: none;
          border-color: #FF0080;
        }
        .custom-btn {
          cursor: pointer;
          border: 2px solid #000;
          font-family: 'Victor Mono', monospace;
          font-weight: 800;
          border-radius: 8px;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .custom-btn:hover {
          transform: translateY(-2px);
        }
        .custom-btn:active {
          transform: translateY(0);
        }
        .custom-btn-pink {
          background: #FF0080;
          color: #FFFFFF;
          border-color: #000;
        }
        .custom-btn-outline-pink {
          background: #FFFFFF;
          color: #FF0080;
          border-color: #FF0080;
        }
        .avatar-thumb {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          object-fit: cover;
          cursor: pointer;
          border: 2px solid transparent;
        }
        .avatar-thumb.active { border-color: #FF0080; }
        
        @media (max-width: 768px) {
          .main-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <main style={{ maxWidth: 1140, margin: "0 auto", width: "100%", flex: 1 }}>
        {/* Header bar matching official website */}
        <header style={{ width: "100%", marginBottom: 20 }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            flexWrap: "wrap", gap: 12, paddingBottom: 12
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  background: "#FFFBE8", color: "#0B6839", padding: "6px 12px",
                  borderRadius: 6, fontWeight: 900, fontSize: 16, border: "2px solid #000"
                }}>
                  HH GOA 2026
                </div>
                <div style={{
                  background: "#FEE101", color: "#000", padding: "6px 12px",
                  borderRadius: 6, fontWeight: 900, fontSize: 13, border: "2px solid #000"
                }}>
                  2:47 PM STUDIO
                </div>
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ color: "#FEE101", fontWeight: 800, fontSize: 13, letterSpacing: "0.08em" }}>
                OCT 28–31 · 2026 · GOA
              </div>
              <div style={{ color: "#FFFFFF", fontWeight: 800, fontSize: 12, letterSpacing: "0.08em" }}>
                LESS NOISE. MORE SIGNAL
              </div>
            </div>
          </div>
          <hr style={{ border: "none", borderTop: "2px solid rgba(255,255,255,0.3)", margin: 0 }} />
        </header>

        {/* Title area */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{
            fontFamily: "'Imbue', serif", fontSize: 44, fontWeight: 900,
            textTransform: "uppercase", letterSpacing: "0.02em", margin: 0
          }}>
            Hacker House Goa ID Card Generator
          </h1>
          <p style={{ color: "#FEE101", fontSize: 15, margin: "6px 0 0", maxWidth: 900, fontWeight: 700 }}>
            Design your own HH Goa 2026 themed photo frame generator. Upload your photo in the control panel below, choose your frame style, and generate your shareable credential.
          </p>
        </div>

        {/* Main Grid */}
        <div className="main-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, alignItems: "start" }}>
          
          {/* Left Column: Form Controls */}
          <div style={{
            background: "#FFFBE8", padding: 20, borderRadius: 12,
            boxShadow: "5px 5px 0px 0px #084e2a", color: "#000"
          }}>
            <h2 style={{
              fontFamily: "'Imbue', serif", fontSize: 20, fontWeight: 900,
              color: "#0B6839", textTransform: "uppercase", borderBottom: "1px solid rgba(11,104,57,0.2)",
              paddingBottom: 8, margin: "0 0 16px"
            }}>
              ADD YOUR DETAILS & PHOTO
            </h2>

            <form style={{ display: "flex", flexDirection: "column", gap: 14 }} onSubmit={(e) => e.preventDefault()}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 900, textTransform: "uppercase", marginBottom: 4 }}>
                  1. YOUR NAME <span style={{ color: "#0B6839" }}>*</span>
                </label>
                <input
                  className="neo-input"
                  type="text"
                  placeholder="e.g. Ravi Kishan"
                  maxLength={30}
                  value={name}
                  onChange={(e) => { setName(e.target.value); setIsGenerated(true); }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 900, textTransform: "uppercase", marginBottom: 4 }}>
                  2. ROLE / TITLE <span style={{ color: "#0B6839" }}>*</span>
                </label>
                <input
                  className="neo-input"
                  type="text"
                  placeholder="e.g. Creative Director"
                  maxLength={40}
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); setIsGenerated(true); }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 900, textTransform: "uppercase", marginBottom: 4 }}>
                  3. SOCIALS LINK <span style={{ color: "#0B6839" }}>*</span>
                </label>
                <input
                  className="neo-input"
                  type="text"
                  placeholder="e.g. https://x.com/BH4VE5H"
                  value={social}
                  onChange={(e) => { setSocial(e.target.value); setIsGenerated(true); }}
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 900, textTransform: "uppercase", marginBottom: 6 }}>
                  4. PHOTO UPLOAD <span style={{ color: "#0B6839" }}>*</span>
                </label>
                
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: "2px dashed #0B6839", borderRadius: 10, background: "#FFFFFF",
                    padding: "16px", textAlign: "center", cursor: "pointer", marginBottom: 10
                  }}
                >
                  <Upload size={20} color="#0B6839" style={{ marginBottom: 4 }} />
                  <div style={{ fontFamily: "'Imbue', serif", fontSize: 16, fontWeight: 900, color: "#0B6839", textTransform: "uppercase" }}>
                    CLICK OR DROP PHOTO HERE
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
                </div>

                {/* Sample Avatars */}
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 10, fontWeight: 800 }}>SAMPLES:</span>
                  {SAMPLE_AVATARS.map((av, i) => (
                    <img
                      key={i}
                      src={av.url}
                      alt={av.name}
                      className={`avatar-thumb ${photoSrc === av.url ? 'active' : ''}`}
                      onClick={() => setPhotoSrc(av.url)}
                    />
                  ))}
                </div>

                {/* Zoom / Shift Sliders */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
                  <div>
                    <label style={{ fontSize: 9, fontWeight: 800, color: "#0B6839" }}>ZOOM ({zoom.toFixed(1)}x)</label>
                    <input type="range" min="1" max="2" step="0.1" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} style={{ width: "100%" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 9, fontWeight: 800, color: "#0B6839" }}>SHIFT Y</label>
                    <input type="range" min="-1" max="1" step="0.1" value={offsetY} onChange={(e) => setOffsetY(parseFloat(e.target.value))} style={{ width: "100%" }} />
                  </div>
                </div>
              </div>

              {/* Select Frame */}
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 900, textTransform: "uppercase", marginBottom: 6 }}>
                  5. SELECT FRAME
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
                  {FRAMES.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      className={`custom-btn ${frame === f.id ? "custom-btn-pink" : "custom-btn-outline-pink"}`}
                      style={{ padding: "6px 2px", fontSize: 11 }}
                      onClick={() => setFrame(f.id)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Select Filters */}
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 900, textTransform: "uppercase", marginBottom: 6 }}>
                  6. SELECT FILTERS
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                  {FILTERS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      className={`custom-btn ${filter === f.id ? "custom-btn-pink" : "custom-btn-outline-pink"}`}
                      style={{ padding: "6px 4px", fontSize: 10 }}
                      onClick={() => setFilter(f.id)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 8, textAlign: "center" }}>
                <button
                  type="button"
                  className="custom-btn custom-btn-pink"
                  style={{ width: "100%", padding: "12px", fontSize: 14 }}
                  onClick={() => setIsGenerated(true)}
                >
                  GENERATE ID CARD
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: 3D/2D Card Preview */}
          <div style={{
            background: "#FFFBE8", padding: 20, borderRadius: 12,
            boxShadow: "7px 7px 0px 0px #084e2a", color: "#000"
          }}>
            {/* View Mode Toggle */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  className={`custom-btn ${viewMode === "3d" ? "custom-btn-pink" : "custom-btn-outline-pink"}`}
                  style={{ padding: "6px 14px", fontSize: 11, borderRadius: 999 }}
                  onClick={() => setViewMode("3d")}
                >
                  3D CARD
                </button>
                <button
                  type="button"
                  className={`custom-btn ${viewMode === "2d" ? "custom-btn-pink" : "custom-btn-outline-pink"}`}
                  style={{ padding: "6px 14px", fontSize: 11, borderRadius: 999 }}
                  onClick={() => setViewMode("2d")}
                >
                  2D CARD
                </button>
              </div>

              <button
                type="button"
                className="custom-btn custom-btn-outline-pink"
                style={{ padding: "6px 12px", fontSize: 11, gap: 4 }}
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <RotateCw size={12} /> {isFlipped ? "FRONT" : "FLIP BACK"}
              </button>
            </div>

            {/* Interactive Card Canvas Window */}
            <div style={{
              background: "#000000", border: "2px solid #000", borderRadius: 16,
              padding: 12, position: "relative", overflow: "hidden", minHeight: 340
            }}>
              <div
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{
                  perspective: viewMode === "3d" ? 1200 : "none",
                  transformStyle: viewMode === "3d" ? "preserve-3d" : "flat",
                  cursor: viewMode === "3d" ? "grab" : "default"
                }}
              >
                <div style={{
                  transform: viewMode === "3d"
                    ? `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale3d(1.02, 1.02, 1.02)`
                    : "none",
                  transition: tilt.active ? "transform 0.08s ease-out" : "transform 0.5s ease-out",
                  position: "relative",
                  borderRadius: 12,
                  overflow: "hidden",
                  boxShadow: viewMode === "3d" && tilt.active
                    ? `0 25px 40px rgba(0,0,0,0.6), 0 0 20px rgba(255,0,128,0.3)`
                    : "0 10px 25px rgba(0,0,0,0.4)"
                }}>
                  <canvas ref={liveCanvasRef} style={{ width: "100%", height: "auto", display: "block" }} />
                  <canvas ref={canvasRef} style={{ display: "none" }} />

                  {/* Glossy Specular Light Reflection */}
                  {viewMode === "3d" && tilt.active && (
                    <div style={{
                      position: "absolute", inset: 0, pointerEvents: "none",
                      background: `radial-gradient(circle at ${tilt.px}% ${tilt.py}%, rgba(255,255,255,0.35) 0%, transparent 60%)`,
                      mixBlendMode: "overlay"
                    }} />
                  )}
                </div>
              </div>
            </div>

            {/* Export & Share Controls */}
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <button
                  type="button"
                  className="custom-btn custom-btn-pink"
                  style={{ padding: "10px", fontSize: 11 }}
                  onClick={downloadPNG}
                >
                  <Download size={14} style={{ marginRight: 6 }} /> DOWNLOAD PNG
                </button>
                <button
                  type="button"
                  className="custom-btn custom-btn-pink"
                  style={{ padding: "10px", fontSize: 11 }}
                  onClick={shareX}
                >
                  <Share2 size={14} style={{ marginRight: 6 }} /> SHARE ON X
                </button>
              </div>

              <button
                type="button"
                className="custom-btn custom-btn-outline-pink"
                style={{ width: "100%", padding: "10px", fontSize: 11 }}
                onClick={copyLink}
              >
                <Copy size={14} style={{ marginRight: 6 }} /> {copied ? "COPIED LINK!" : "COPY APP LINK"}
              </button>
            </div>

          </div>

        </div>
      </main>

      {/* Footer matching hhgoa.com */}
      <footer style={{
        marginTop: 40, paddingTop: 16, borderTop: "2px solid rgba(255,255,255,0.3)",
        textAlign: "center", fontSize: 13
      }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 8, fontWeight: 700 }}>
          <a href="https://hhgoa.com/" target="_blank" rel="noopener noreferrer" style={{ color: "#FEE101", textDecoration: "none" }}>
            Official Website ↗
          </a>
          <a href="https://hhgoa.com/#check-hype" target="_blank" rel="noopener noreferrer" style={{ color: "#FEE101", textDecoration: "none" }}>
            Event Details ↗
          </a>
          <a href="https://hacker-house-goa-2026.devfolio.co/" target="_blank" rel="noopener noreferrer" style={{ color: "#FEE101", textDecoration: "none" }}>
            Devfolio Apply ↗
          </a>
        </div>
        <div style={{ color: "rgba(255,255,255,0.9)", fontWeight: 700 }}>
          Built for <span style={{ color: "#FEE101" }}>Hacker House Goa 2026</span> · 28 – 31 OCT 2026 · Goa, India
        </div>
      </footer>
    </div>
  );
}
