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
  { id: "frame1", label: "1", name: "VIP LANYARD PASS" },
  { id: "frame2", label: "2", name: "CREATIVE LICENSE" },
  { id: "frame3", label: "3", name: "CYBER TERMINAL" },
  { id: "frame4", label: "4", name: "GOA SUNSET CLUB" },
  { id: "none", label: "None", name: "MINIMAL BADGE" },
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
    for (let i = 0; i < data.length; i += 4) {
      const lum = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
      data[i] = Math.floor(11 + (254 - 11) * lum);
      data[i + 1] = Math.floor(104 + (225 - 104) * lum);
      data[i + 2] = Math.floor(57 + (1 - 57) * lum);
    }
    ctx.putImageData(imgData, px, py);
  } else if (filterId === "dither") {
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

// Lanyard Punch Slot Hole
function drawLanyardSlot(ctx, cx, cy) {
  ctx.save();
  // Outer punch oval slot
  ctx.beginPath();
  ctx.ellipse(cx, cy, 32, 10, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#1A1A1A";
  ctx.fill();
  ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Metal rivet ring
  ctx.beginPath();
  ctx.ellipse(cx, cy, 34, 12, 0, 0, Math.PI * 2);
  ctx.strokeStyle = "#CBD5E1";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
}

// Master Renderer for Card Front
function renderCardFront(ctx, img, filterId, frameId, details, idCode) {
  ctx.clearRect(0, 0, CARD_W, CARD_H);

  // Background base
  const bg = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  bg.addColorStop(0, "#0B6839");
  bg.addColorStop(1, "#084E2A");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Dots matrix pattern matching hhgoa.com
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

  // Top Punch Slot Hole for Lanyard Clip
  drawLanyardSlot(ctx, CARD_W / 2, cy + 22);

  // Banner Header
  const headerY = cy + 42;
  drawRoundedRect(ctx, cx, headerY, cw, 78, 16);
  ctx.save();
  ctx.clip();
  ctx.fillStyle = "#0B6839";
  ctx.fillRect(cx, headerY, cw * 0.68, 78);
  ctx.fillStyle = "#FF0080";
  ctx.fillRect(cx + cw * 0.68, headerY, cw * 0.32, 78);
  ctx.fillStyle = "#FEE101";
  ctx.fillRect(cx + cw * 0.68 - 3, headerY, 6, 78);
  ctx.restore();

  ctx.fillStyle = "#FFFBE8";
  ctx.font = "900 34px 'Imbue', serif";
  ctx.textBaseline = "middle";
  ctx.fillText("HACKER HOUSE GOA 2026", cx + 28, headerY + 39);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "800 15px 'Victor Mono', monospace";
  ctx.textAlign = "right";
  ctx.fillText("#FrameInGoa", cx + cw - 24, headerY + 39);
  ctx.textAlign = "left";

  // Photo Frame
  const px = cx + 32, py = cy + 132, pw = 270, ph = 330;
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

  // Profile Details
  const dx = px + pw + 40;
  let dy = py + 14;

  ctx.fillStyle = "#0B6839";
  ctx.font = "800 13px 'Victor Mono', monospace";
  ctx.fillText("1. BUILDER NAME", dx, dy);
  ctx.font = "900 36px 'Archivo Black', sans-serif";
  ctx.fillStyle = "#000000";
  ctx.fillText((details.name || "KULDEEP LAKHERA").toUpperCase(), dx, dy + 38);

  dy += 88;
  ctx.fillStyle = "#0B6839";
  ctx.font = "800 13px 'Victor Mono', monospace";
  ctx.fillText("2. ROLE / TITLE", dx, dy);
  ctx.font = "800 24px 'Space Grotesk', sans-serif";
  ctx.fillStyle = "#FF0080";
  ctx.fillText((details.title || "FULL STACK DEVELOPER").toUpperCase(), dx, dy + 28);

  dy += 74;
  ctx.fillStyle = "#0B6839";
  ctx.font = "800 13px 'Victor Mono', monospace";
  ctx.fillText("3. SOCIALS LINK", dx, dy);
  ctx.font = "700 17px 'Victor Mono', monospace";
  ctx.fillStyle = "#0B6839";
  ctx.fillText(details.social || "https://x.com/KuldeepLakhera9", dx, dy + 26);

  dy += 70;
  ctx.font = "800 14px 'Victor Mono', monospace";
  ctx.fillStyle = "#0B6839";
  ctx.fillText("OCT 28–31 · 2026 · GOA, INDIA · 2:47 PM STUDIO", dx, dy + 24);

  // Footer Barcode + ID
  const fy = cy + ch - 60;
  drawBarcode(ctx, cx + 32, fy, 240, 38, "#0B6839");

  ctx.font = "800 20px 'Victor Mono', monospace";
  ctx.fillStyle = "#0B6839";
  ctx.textAlign = "right";
  ctx.fillText(idCode, cx + cw - 32, fy + 24);
  ctx.textAlign = "left";

  // Stamp Badge
  ctx.save();
  ctx.translate(cx + cw - 120, fy - 68);
  ctx.rotate(-0.2);
  ctx.strokeStyle = "rgba(11,104,57,0.7)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 48, 0, Math.PI * 2);
  ctx.stroke();
  ctx.font = "800 11px 'Victor Mono', monospace";
  ctx.fillStyle = "rgba(11,104,57,0.85)";
  ctx.textAlign = "center";
  ctx.fillText("#FrameInGoa", 0, -6);
  ctx.fillText("VERIFIED 2026", 0, 10);
  ctx.textAlign = "left";
  ctx.restore();
}

// Master Renderer for Card Back
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

  drawLanyardSlot(ctx, CARD_W / 2, cy + 22);

  ctx.fillStyle = "#1A1A1A";
  ctx.fillRect(cx, cy + 60, cw, 70);

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(cx + 40, cy + 170, cw - 260, 50);
  ctx.font = "700 22px 'Caveat', cursive";
  ctx.fillStyle = "#0B6839";
  ctx.fillText("Verified HH Goa Builder #FrameInGoa", cx + 60, cy + 202);

  ctx.fillStyle = "#EAE3CD";
  ctx.fillRect(cx + cw - 200, cy + 170, 160, 50);
  ctx.font = "800 18px 'Victor Mono', monospace";
  ctx.fillStyle = "#FF0080";
  ctx.fillText("CVC 2026", cx + cw - 180, cy + 202);

  ctx.fillStyle = "#0B6839";
  ctx.font = "900 28px 'Imbue', serif";
  ctx.fillText("HACKER HOUSE GOA 2026", cx + 40, cy + 270);

  ctx.font = "700 14px 'Victor Mono', monospace";
  ctx.fillStyle = "#000000";
  ctx.fillText("OFFICIAL VIP CREDENTIAL · NON-TRANSFERABLE", cx + 40, cy + 300);
  ctx.fillText("DATES: OCTOBER 28–31, 2026 · GOA, INDIA", cx + 40, cy + 325);
  ctx.fillText("HOST: 2:47 PM STUDIO · LESS NOISE. MORE SIGNAL.", cx + 40, cy + 350);

  drawBarcode(ctx, cx + 40, cy + ch - 70, cw - 80, 40, "#0B6839");

  ctx.font = "800 14px 'Victor Mono', monospace";
  ctx.fillStyle = "#FF0080";
  ctx.textAlign = "center";
  ctx.fillText(`BUILDER ID: ${idCode} · #FrameInGoa`, CARD_W / 2, cy + ch - 15);
  ctx.textAlign = "left";
}

export default function App() {
  const [name, setName] = useState("Kuldeep Lakhera");
  const [title, setTitle] = useState("Full Stack Developer");
  const [social, setSocial] = useState("https://x.com/KuldeepLakhera9");
  const [photoSrc, setPhotoSrc] = useState(SAMPLE_AVATARS[0].url);
  const [imgEl, setImgEl] = useState(null);
  const [frame, setFrame] = useState("frame1");
  const [filter, setFilter] = useState("normal");
  const [viewMode, setViewMode] = useState("3d");
  const [isFlipped, setIsFlipped] = useState(false);
  const [idCode] = useState(randomId());
  const [zoom, setZoom] = useState(1);
  const [offsetY, setOffsetY] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  const [copied, setCopied] = useState(false);

  // 3D Lanyard Hanging Pendulum Physics State
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, px: 50, py: 50, active: false });
  const [sway, setSway] = useState(0);

  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const liveCanvasRef = useRef(null);

  // Lanyard natural hanging pendulum oscillation loop
  useEffect(() => {
    let frameId;
    let startTime = Date.now();
    const animateSway = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      setSway(Math.sin(elapsed * 1.8) * 1.5);
      frameId = requestAnimationFrame(animateSway);
    };
    frameId = requestAnimationFrame(animateSway);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Load photo
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

  // 3D Tilt Handlers
  const handleMouseMove = (e) => {
    if (viewMode !== "3d") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const px = (x / rect.width) * 100;
    const py = (y / rect.height) * 100;
    const rx = -((y - rect.height / 2) / (rect.height / 2)) * 18;
    const ry = ((x - rect.width / 2) / (rect.width / 2)) * 18;
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
    link.download = `hh-goa-2026-pass-${(name || "kuldeep_lakhera").replace(/\s+/g, "_").toLowerCase()}.png`;
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

  // Calculate 3D Transform including pendulum sway
  const currentRotateX = viewMode === "3d" ? (tilt.active ? tilt.rx : 0) : 0;
  const currentRotateY = viewMode === "3d" ? (tilt.active ? tilt.ry : sway) : 0;

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
        {/* Header */}
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
            Design your official 3D Hanging Lanyard HH Goa 2026 Builder Credential. Customize your name, stack, and photo to generate your shareable badge.
          </p>
        </div>

        {/* Main Grid */}
        <div className="main-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, alignItems: "start" }}>
          
          {/* Left Column: Form Controls with Defaults: Kuldeep Lakhera, Full Stack Developer */}
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
                  placeholder="e.g. Kuldeep Lakhera"
                  maxLength={30}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 900, textTransform: "uppercase", marginBottom: 4 }}>
                  2. ROLE / TITLE <span style={{ color: "#0B6839" }}>*</span>
                </label>
                <input
                  className="neo-input"
                  type="text"
                  placeholder="e.g. Full Stack Developer"
                  maxLength={40}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 900, textTransform: "uppercase", marginBottom: 4 }}>
                  3. SOCIALS LINK <span style={{ color: "#0B6839" }}>*</span>
                </label>
                <input
                  className="neo-input"
                  type="text"
                  placeholder="e.g. https://x.com/KuldeepLakhera9"
                  value={social}
                  onChange={(e) => setSocial(e.target.value)}
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
                    padding: "14px", textAlign: "center", cursor: "pointer", marginBottom: 10
                  }}
                >
                  <Upload size={20} color="#0B6839" style={{ marginBottom: 4 }} />
                  <div style={{ fontFamily: "'Imbue', serif", fontSize: 16, fontWeight: 900, color: "#0B6839", textTransform: "uppercase" }}>
                    CLICK OR DROP PHOTO HERE
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
                </div>

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
                  onClick={() => updateCanvas()}
                >
                  GENERATE ID CARD
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: 3D Hanging Lanyard ID Card Preview */}
          <div style={{
            background: "#FFFBE8", padding: 20, borderRadius: 12,
            boxShadow: "7px 7px 0px 0px #084e2a", color: "#000"
          }}>
            {/* View Mode & Flip Toggle */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  className={`custom-btn ${viewMode === "3d" ? "custom-btn-pink" : "custom-btn-outline-pink"}`}
                  style={{ padding: "6px 14px", fontSize: 11, borderRadius: 999 }}
                  onClick={() => setViewMode("3d")}
                >
                  3D HANGING CARD
                </button>
                <button
                  type="button"
                  className={`custom-btn ${viewMode === "2d" ? "custom-btn-pink" : "custom-btn-outline-pink"}`}
                  style={{ padding: "6px 14px", fontSize: 11, borderRadius: 999 }}
                  onClick={() => setViewMode("2d")}
                >
                  2D FLAT CARD
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

            {/* 3D Hanging Lanyard Stage Container */}
            <div style={{
              background: "radial-gradient(circle, #154233 0%, #05130E 100%)",
              border: "2px solid #000", borderRadius: 16,
              padding: "50px 12px 20px", position: "relative", overflow: "hidden", minHeight: 380
            }}>
              
              {/* Lanyard Fabric Straps hanging from top neck anchor */}
              <div style={{
                position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                width: 140, height: 60, zIndex: 10, pointerEvents: "none"
              }}>
                {/* Left Strap */}
                <div style={{
                  position: "absolute", top: -20, left: 35, width: 24, height: 70,
                  background: "linear-gradient(90deg, #0B6839 0%, #124e3b 50%, #0B6839 100%)",
                  transform: "rotate(-18deg)", borderLeft: "1px solid #FEE101", borderRight: "1px solid #FEE101",
                  boxShadow: "0 4px 8px rgba(0,0,0,0.5)"
                }} />
                
                {/* Right Strap */}
                <div style={{
                  position: "absolute", top: -20, right: 35, width: 24, height: 70,
                  background: "linear-gradient(90deg, #0B6839 0%, #124e3b 50%, #0B6839 100%)",
                  transform: "rotate(18deg)", borderLeft: "1px solid #FEE101", borderRight: "1px solid #FEE101",
                  boxShadow: "0 4px 8px rgba(0,0,0,0.5)"
                }} />

                {/* Metallic Swivel Clip Connector */}
                <div style={{
                  position: "absolute", bottom: 2, left: "50%", transform: "translateX(-50%)",
                  width: 32, height: 26, background: "linear-gradient(180deg, #E2E8F0 0%, #94A3B8 100%)",
                  borderRadius: "4px 4px 10px 10px", border: "2px solid #1E293B",
                  boxShadow: "0 4px 8px rgba(0,0,0,0.6)"
                }}>
                  {/* Swivel Ring Hole */}
                  <div style={{
                    width: 12, height: 12, borderRadius: "50%", background: "#0F172A",
                    margin: "5px auto 0", border: "2px solid #CBD5E1"
                  }} />
                </div>
              </div>

              {/* 3D Hanging Card Physics Stage */}
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
                    ? `rotateX(${currentRotateX}deg) rotateY(${currentRotateY}deg) scale3d(1.01, 1.01, 1.01)`
                    : "none",
                  transition: tilt.active ? "transform 0.08s ease-out" : "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
                  position: "relative",
                  borderRadius: 14,
                  overflow: "hidden",
                  boxShadow: viewMode === "3d"
                    ? `0 30px 60px rgba(0,0,0,0.7), 0 0 25px rgba(11,104,57,0.4)`
                    : "0 10px 25px rgba(0,0,0,0.4)"
                }}>
                  <canvas ref={liveCanvasRef} style={{ width: "100%", height: "auto", display: "block" }} />
                  <canvas ref={canvasRef} style={{ display: "none" }} />

                  {/* Specular Glossy Light Reflection */}
                  {viewMode === "3d" && tilt.active && (
                    <div style={{
                      position: "absolute", inset: 0, pointerEvents: "none",
                      background: `radial-gradient(circle at ${tilt.px}% ${tilt.py}%, rgba(255,255,255,0.38) 0%, transparent 60%)`,
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
          Built by <span style={{ color: "#FEE101" }}>Kuldeep Lakhera</span> for <span style={{ color: "#FEE101" }}>Hacker House Goa 2026</span> · 28 – 31 OCT 2026 · Goa, India
        </div>
      </footer>
    </div>
  );
}
