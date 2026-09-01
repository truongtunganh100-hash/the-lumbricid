// server.js — Máy chủ LAN cho "the Lumbricid"
// Chức năng:
//  1) Phục vụ file game tĩnh trong thư mục /public (index.html, ...)
//  2) Làm cầu nối WebSocket theo "mã phòng" để 2 người chơi trên cùng
//     mạng LAN (hoặc bất kỳ mạng nào truy cập được tới máy chủ này)
//     ghép cặp với nhau và đồng bộ các sự kiện: chết cả 2, hồi sinh,
//     rời trận, hiệu ứng roll gửi cho đối thủ.
//
// Chạy:
//   npm install
//   npm start
// Rồi mở trình duyệt tới http://<IP-LAN-cua-may-nay>:3000

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
  try {
    let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
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

// maxPayload: chặn bớt các gói tin bất thường/quá khổ (ảnh khung hình chia
// màn hình bình thường chỉ tầm vài chục KB do đã được nén & thu nhỏ ở client).
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

// [FIX RÒ RỈ PHÒNG] Nếu 1 kết nối gọi "create" hoặc "join" trong khi đang
// còn đứng trong 1 phòng cũ (ví dụ bấm tạo phòng 2 lần, hoặc vào phòng
// khác mà không thoát phòng cũ trước) thì phòng cũ sẽ bị "mồ côi" —
// không ai dọn vì sự kiện "close" chỉ dọn phòng MỚI NHẤT mà ws đang đứng.
// Theo thời gian các phòng mồ côi này tích tụ lại gây rò rỉ bộ nhớ trên
// server. Hàm này đảm bảo luôn rời sạch phòng cũ trước khi vào phòng mới.
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
        // [CŨ - GIỮ LẠI ĐỂ TƯƠNG THÍCH] Không còn dùng để tự hồi sinh nữa,
        // xem "readyRestart" bên dưới — cơ chế mới bắt buộc CẢ HAI người
        // chơi cùng xác nhận sẵn sàng thì vòng mới mới thực sự bắt đầu.
        const room = rooms.get(ws.room);
        if (!room) break;
        if (ws.role === "host") room.hostDead = false; else room.guestDead = false;
        break;
      }
      case "readyRestart": {
        // [CHƠI LẠI CẦN CẢ 2 XÁC NHẬN] Một người bấm CHƠI LẠI → chỉ đánh
        // dấu "sẵn sàng" cho vai trò đó. Chỉ khi CẢ HAI (host & guest) đều
        // đã sẵn sàng thì mới phát lệnh "bothReadyRestart" cho cả 2 cùng
        // lúc, tránh 1 bên vào lại vòng chơi mới trong khi bên kia vẫn còn
        // đứng ở màn hình thua (lệch thời điểm bắt đầu, không công bằng).
        const room = rooms.get(ws.room);
        if (!room) break;
        if (ws.role === "host") room.hostReadyRestart = true; else room.guestReadyRestart = true;
        if (room.hostReadyRestart && room.guestReadyRestart) {
          room.hostDead = false; room.guestDead = false;
          room.hostReadyRestart = false; room.guestReadyRestart = false;
          safeSend(room.host, { type: "bothReadyRestart" });
          safeSend(room.guest, { type: "bothReadyRestart" });
        } else {
          // Báo cho người còn lại biết đối thủ đã sẵn sàng, để họ biết
          // chỉ còn chờ mình bấm nữa là vào vòng mới.
          const other = peerOf(ws, room);
          safeSend(other, { type: "opponentReadyRestart" });
        }
        break;
      }
      case "pause": {
        // [THÔNG BÁO TẠM DỪNG] Chuyển tiếp trạng thái Tạm Dừng/Tiếp Tục
        // của người này cho người kia biết, để họ không tưởng nhầm là bị
        // lag khi thấy khung hình đứng im.
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
      case "state": {
        // [STATE SYNC] Trạng thái nhẹ (toạ độ thân giun, cờ hiệu ứng...)
        // gửi với tần suất cao để bên nhận nội suy mượt — chỉ relay thẳng,
        // không lưu, không log (tần suất cao, tránh spam log).
        const room = rooms.get(ws.room);
        if (!room) break;
        const other = peerOf(ws, room);
        safeSend(other, Object.assign({}, msg, { type: "state" }));
        break;
      }
      case "mapState": {
        // [STATE SYNC] Bố cục bản đồ (đá + thức ăn) của người gửi — chỉ
        // gửi khi bản đồ thay đổi nên tần suất thấp hơn nhiều so với "state".
        const room = rooms.get(ws.room);
        if (!room) break;
        const other = peerOf(ws, room);
        safeSend(other, Object.assign({}, msg, { type: "mapState" }));
        break;
      }
      case "frame": {
        // [SPLIT VIEW] Chuyển tiếp ảnh chụp canvas (đã nén JPEG, base64)
        // từ người này sang cho người kia xem trong khung chia màn hình.
        // Không lưu lại, không log — chỉ relay thẳng, luôn lấy khung mới
        // nhất (không cần hàng đợi vì phía nhận chỉ hiển thị ảnh mới nhất).
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
        // Người chơi hủy phòng khi đang chờ (chưa ai vào)
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
    console.log(`[ROOM] Kết nối của vai trò "${ws.role}" trong phòng ${ws.room} bị đóng (mất mạng nền / đóng tab / khóa màn hình...) → hủy phòng.`);
    safeSend(other, { type: "opponentDisconnected" });
    cleanupRoom(ws.room);
  });
});

// Ping định kỳ để dọn các kết nối chết (mất mạng đột ngột)
const HEARTBEAT_MS = 30000;
const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    try { ws.ping(); } catch (e) {}
  });
}, HEARTBEAT_MS);

wss.on("close", () => clearInterval(heartbeatInterval));

server.listen(PORT, () => {
  console.log("========================================");
  console.log(" the Lumbricid — LAN server đang chạy");
  console.log(` Local:   http://localhost:${PORT}`);
  console.log(" Trên mạng LAN, dùng IP máy này, ví dụ:");
  console.log(`   http://192.168.x.x:${PORT}`);
  console.log("========================================");
});
