# Implementation Plan: Giải Quyết Triệt Để Lỗi 5s Treo Giun & Màn Hình Dọc

**Feature Directory**: `specs/002-mobile-layout-and-countdown-fix`  
**Date**: 2026-11-10  
**Spec Reference**: [spec.md](./spec.md)  

---

## 1. Technical Architecture & Detailed Implementation

### 1.1 Affected File
- `public/index.html` (chứa toàn bộ logic HTML, CSS và JavaScript của game client).

### 1.2 Giải Pháp Cho Lỗi 1: Đếm Ngược 5s Bị Kẹt Không Chạy
1. **Dời vị trí gọi `updateOneMinMode(dt)` lên đầu hàm `update(dt)`**:
   Hiện tại `updateOneMinMode(dt)` nằm sau dòng kiểm tra `if (!hasStartedMoving && !isMenuMode) return;`.
   *Hành động*:
   Đặt lệnh gọi:
   ```javascript
   if (isOneMinMode && !isMenuMode && !isPaused && !gameOver && !gameWin) {
     updateOneMinMode(dt);
   }
   ```
   ngay tại đầu hàm `update(dt)` (sau khối cập nhật `isPaused`). Khi đó, bất kể `hasStartedMoving` có giá trị gì, vòng lặp 1 Mins mode vẫn đếm ngược chính xác từ 5.0 xuống 0.0 theo thời gian thực.
2. **Kích hoạt cờ `hasStartedMoving = true`**:
   Trong hàm `startOneMinMode()`, gán rõ ràng `hasStartedMoving = true;`.
   Trong điều kiện chặn của hàm `update(dt)`:
   ```javascript
   if (!hasStartedMoving && !isMenuMode && !isOneMinMode) return;
   ```
   Ngăn chặn 100% khả năng game bị ngắt trước khi cập nhật vị trí di chuyển của giun.

---

### 1.3 Giải Pháp Cho Lỗi 2: Giun Bị Treo Khóa Cứng Không Di Chuyển Được
1. **Bỏ qua kiểm tra `wouldHitNeck` và `isReverse` cho chế độ 1 Mins**:
   Trong vòng lặp cập nhật bước đi:
   ```javascript
   const proposedDir = worm.nextDir;
   const curDir = worm.dir;
   if (isOneMinMode) {
     if (proposedDir.x !== 0 || proposedDir.y !== 0) {
       worm.dir = proposedDir;
     }
   } else {
     const isReverse = (curDir.x !== 0 || curDir.y !== 0) && proposedDir.x === -curDir.x && proposedDir.y === -curDir.y;
     const wouldHitNeck = worm.body.length > 1 && (worm.body[0].x + proposedDir.x === worm.body[1].x) && (worm.body[0].y + proposedDir.y === worm.body[1].y);
     if (!isReverse && !wouldHitNeck && (proposedDir.x !== 0 || proposedDir.y !== 0)) {
       worm.dir = proposedDir;
     }
   }
   ```
   Điều này cho phép người chơi đổi hướng ngược lại (180 độ) bất kỳ lúc nào để né đạn và đòn tấn công mà không bị kẹt vào thân giun.
2. **Loại bỏ va chạm tự cắn thân và rơi map trong 1 Mins**:
   - Vô hiệu hóa `headHitsSelfCell` khi `isOneMinMode === true`.
   - Giới hạn tọa độ giun (Arena Clamping): Khi giun chạm viền đấu trường, tọa độ giun được giữ an toàn bên trong viền (`Math.max(1, Math.min(cols - 2, head.x))`), không kích hoạt Game Over rơi map.

---

### 1.4 Giải Pháp Cho Lỗi 3: Đè Chồng Menu Màn Hình Dọc
1. Thêm `style="display: none;"` mặc định vào các thẻ div subpanel trong HTML: `#panel-difficulty`, `#panel-map`, `#panel-onemin`, `#panel-tsunami`, `#panel-endless`, `#panel-race`, `#panel-darknight`, `#panel-2p`, `#panel-settings`.
2. Trong CSS `@media (orientation: portrait)`, chuyển đổi toàn bộ bộ chọn từ `:not([style*="display: none"])` sang `[style*="display: flex"]`.

---

## 2. Test & Verification Plan
- Chạy test node VM compile check để bảo đảm không có lỗi cú pháp JS.
- Mở game trên DevTools di động, xác nhận:
  1. Menu dọc mở từng trang độc lập, không còn đè chồng.
  2. Bấm Bắt đầu 1 Mins: Đếm ngược 5s chạy ngay lập tức `5 -> 4 -> 3 -> 2 -> 1 -> 0`.
  3. Gạt cần Joystick: Giun lướt đi mượt mà theo mọi hướng 360 độ, đổi hướng liên tục không bị kẹt.
  4. Sau 5s đếm ngược: Đạn bắn ra, nhạc Web Audio phát vang, thanh tiến trình chạy đều đặn.
