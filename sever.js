// server.js — Máy chủ Multiplayer cho "the Lumbricid"
// Chức năng:
//  1) Phục vụ file game tĩnh trong thư mục /public (khi chạy Local/LAN)
//  2) Làm cầu nối WebSocket theo "mã phòng" để 2 người chơi ghép cặp 
//     và đồng bộ các sự kiện: chết cả 2, hồi sinh, rời trận, hiệu ứng roll, split view...
//  3) Tương thích hoàn toàn với các Cloud Hosting (Render, Railway, Koyeb) & Netlify.

const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav"
};

const server = http.createServer((req, res) => {
  // Thêm CORS Header hỗ trợ gọi API từ Netlify nếu cần
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  try {
    let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);

    // Health check endpoint cho Cloud Services (Render/Railway/Koyeb)
    if (urlPath === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", message: "Server is running smoothly!" }));
      return;
    }

    if (urlPath === "/") urlPath = "/index.html";
    if (urlPath === "/favicon.ico") { res.writeHead(204); res.end(); return; }
    
    const filePath = path.normalize(path.join(PUBLIC_DIR, urlPath));
    if (!filePath.startsWith(PUBLIC_DIR)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Không tìm thấy file.");
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
      res.end(data);
    });
  } catch (e) {
    res.writeHead(500);
    res.end("Lỗi máy chủ.");
  }
});

// Chặn bớt các gói tin bất thường/quá khổ
const wss = new WebSocket.Server({ server, maxPayload: 3 * 1024 * 1024 });

// rooms: Map<code, { host: ws|null, guest: ws|null, diff: string, hostDead: bool, guestDead: bool }>
const rooms = new Map();

function genRoomCode() {
  let code;
  do {
    code = String(Math.floor(1000 + Math.random() * 9000));
  } while (rooms.has(code));
  return code;
}

function safeSend(ws, obj) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    try { ws.send(JSON.stringify(obj)); } catch (e) { /* ignore */ }
  }
}

function peerOf(ws, room) {
  return ws.role === "host" ? room.guest : room.host;
}

function cleanupRoom(code) {
  rooms.delete(code);
}

// Dọn dẹp phòng cũ tránh rò rỉ bộ nhớ khi người chơi tạo/vào phòng mới
function leaveCurrentRoom(ws) {
  if (!ws.room) return;
  const room = rooms.get(ws.room);
  if (room) {
    const other = peerOf(ws, room);
    safeSend(other, { type: "opponentLeft" });
    cleanupRoom(ws.room);
  }
  ws.room = null;
  ws.role = null;
}

wss.on("connection", (ws) => {
  ws.room = null;
  ws.role = null;
  ws.isAlive = true;

  ws.on("pong", () => { ws.isAlive = true; });

  ws.on("message", (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch (e) { return; }
    if (!msg || typeof msg.type !== "string") return;

    switch (msg.type) {
      case "create": {
        leaveCurrentRoom(ws);
        const code = genRoomCode();
        rooms.set(code, {
          host: ws, guest: null,
          diff: (typeof msg.diff === "string" ? msg.diff : "normal"),
          hostDead: false, guestDead: false,
          hostReadyRestart: false, guestReadyRestart: false
        });
        ws.room = code; ws.role = "host";
        safeSend(ws, { type: "created", room: code });
        console.log(`[ROOM] Đã tạo phòng ${code} (độ khó: ${rooms.get(code).diff}). Đang chờ người 2...`);
        break;
      }
      case "join": {
        const code = String(msg.room || "").trim();
        const room = rooms.get(code);
        console.log(`[ROOM] Có người thử vào phòng "${code}" — phòng hiện có: [${[...rooms.keys()].join(", ") || "(trống)"}]`);
        if (!room) { safeSend(ws, { type: "error", message: "Mã phòng không tồn tại." }); break; }
        if (room.guest) { safeSend(ws, { type: "error", message: "Phòng đã có đủ 2 người chơi." }); break; }
        if (room.host === ws) { safeSend(ws, { type: "error", message: "Bạn không thể tự vào phòng của chính mình." }); break; }
        leaveCurrentRoom(ws);
        room.guest = ws;
        ws.room = code; ws.role = "guest";
        safeSend(room.host, { type: "start", player: 1, diff: room.diff, room: code });
        safeSend(ws, { type: "start", player: 2, diff: room.diff, room: code });
        console.log(`[ROOM] Ghép cặp thành công ở phòng ${code}.`);
        break;
      }
      case "death": {
        const room = rooms.get(ws.room);
        if (!room) break;
        if (ws.role === "host") room.hostDead = true; else room.guestDead = true;
        if (room.hostDead && room.guestDead) {
          safeSend(room.host, { type: "bothDead" });
          safeSend(room.guest, { type: "bothDead" });
        }
        break;
      }
      case "restartRound": {
        const room = rooms.get(ws.room);
        if (!room) break;
        if (ws.role === "host") room.hostDead = false; else room.guestDead = false;
        break;
      }
      case "readyRestart": {
        const room = rooms.get(ws.room);
        if (!room) break;
        if (ws.role === "host") room.hostReadyRestart = true; else room.guestReadyRestart = true;
        if (room.hostReadyRestart && room.guestReadyRestart) {
          room.hostDead = false; room.guestDead = false;
          room.hostReadyRestart = false; room.guestReadyRestart = false;
          safeSend(room.host, { type: "bothReadyRestart" });
          safeSend(room.guest, { type: "bothReadyRestart" });
        } else {
          const other = peerOf(ws, room);
          safeSend(other, { type: "opponentReadyRestart" });
        }
        break;
      }
      case "pause": {
        const room = rooms.get(ws.room);
        if (!room) break;
        const other = peerOf(ws, room);
        safeSend(other, { type: "opponentPause", paused: !!msg.paused });
        break;
      }
      case "rollEffect": {
        const room = rooms.get(ws.room);
        if (!room) break;
        const other = peerOf(ws, room);
        safeSend(other, { type: "rollEffect", effect: msg.effect });
        break;
      }
      case "frame": {
        const room = rooms.get(ws.room);
        if (!room) break;
        if (typeof msg.data !== "string") break;
        const other = peerOf(ws, room);
        safeSend(other, { type: "frame", data: msg.data });
        break;
      }
      case "leaveMatch": {
        const room = rooms.get(ws.room);
        if (!room) break;
        const other = peerOf(ws, room);
        safeSend(other, { type: "opponentLeft" });
        cleanupRoom(ws.room);
        ws.room = null; ws.role = null;
        break;
      }
      case "cancelRoom": {
        if (ws.room && rooms.has(ws.room)) cleanupRoom(ws.room);
        ws.room = null; ws.role = null;
        break;
      }
      default:
        break;
    }
  });

  ws.on("close", () => {
    if (!ws.room) return;
    const room = rooms.get(ws.room);
    if (!room) return;
    const other = peerOf(ws, room);
    console.log(`[ROOM] Kết nối của "${ws.role}" trong phòng ${ws.room} bị đóng -> Hủy phòng.`);
    safeSend(other, { type: "opponentDisconnected" });
    cleanupRoom(ws.room);
  });
});

// Ping định kỳ để dọn các kết nối chết
const HEARTBEAT_MS = 30000;
const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    try { ws.ping(); } catch (e) {}
  });
}, HEARTBEAT_MS);

wss.on("close", () => clearInterval(heartbeatInterval));

// Lắng nghe ở mọi giao diện mạng (0.0.0.0) để tương thích Cloud Hosting
server.listen(PORT, "0.0.0.0", () => {
  console.log("========================================");
  console.log(` the Lumbricid Server đang chạy ở cổng ${PORT}`);
  console.log(` Health check: http://localhost:${PORT}/health`);
  console.log("========================================");
});