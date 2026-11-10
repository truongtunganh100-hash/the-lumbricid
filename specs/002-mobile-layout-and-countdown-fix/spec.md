# Feature Specification: Giải Quyết Triệt Để Lỗi 5s Treo Giun & Màn Hình Dọc

**Feature Directory**: `specs/002-mobile-layout-and-countdown-fix`  
**Created**: 2026-11-10  
**Updated**: 2026-11-10 (Đặc biệt đi sâu nghiên cứu cơ chế đóng băng vòng lặp game)  
**Status**: Ready for Review / Alignment  
**Input**: "/spec không có lỗi joystick chỉ có lỗi 5s không đếm ngược bắt đầu và treo giun ở đấy không Di chuyển được cần đặc biệt nghiên cứu khắc phục"  

---

## 1. Overview & Root Cause Summary
Người dùng xác nhận: **Cụm Joystick ảo không bị lỗi hiển thị**.  
Vấn đề nghiêm trọng và duy nhất khiến game không chơi được là:
1. **Lỗi kẹt ở 5s không đếm ngược bắt đầu**: Sau khi bấm Bắt đầu vào chế độ 1 Mins, màn hình đứng yên ở số 5, đồng hồ đếm ngược không giảm (`5.0` vĩnh viễn), nhạc không phát và màn chơi không thể bắt đầu.
2. **Lỗi treo giun tại chỗ không thể di chuyển**: Giun bị khóa cứng ngay vị trí xuất phát, dù gạt cần điều khiển hay bấm bất kỳ phím nào thì giun cũng không nhúc nhích.
3. **Lỗi giao diện màn hình dọc (Portrait)**: Các panel menu (`#panel-difficulty`, `#panel-map`, `#panel-onemin`) vẫn có nguy cơ đè chồng lên nhau khi mở game ở chiều dọc.

### Kết Quả Nghiên Cứu Kỹ Thuật Chuyên Sâu (Deep Investigation):
* **Nguyên nhân 1 (Chặn toàn bộ vòng lặp cập nhật)**:  
  Trong hàm `update(dt)` (dòng 187):
  ```javascript
  if (!hasStartedMoving && !isMenuMode) return;
  ```
  Biến cờ `hasStartedMoving` được khởi tạo bằng `false` trong `resetGame()`. Trong cơ chế game rắn săn mồi truyền thống, biến này chỉ chuyển thành `true` khi giun tự động di chuyển. Trong chế độ `1 Mins`, giun không tự di chuyển, và hàm `setDesiredDirection()` lại thực hiện `return` ngay khi `isOneMinMode === true`, khiến `hasStartedMoving` **mãi mãi bằng `false`**.  
  Hệ quả: Hàm `update(dt)` thực hiện `return;` ngay lập tức ở mọi khung hình! Vòng lặp cập nhật `updateOneMinMode(dt)` (nằm ở dòng 230) **không bao giờ được chạm tới**, khiến đồng hồ đếm ngược kẹt cứng ở 5s mãi mãi!
* **Nguyên nhân 2 (Cơ chế chống quay ngược đầu và cổ của Rắn Cổ Điển)**:  
  Trong hàm xử lý di chuyển ô lưới:
  ```javascript
  const isReverse = ...;
  const wouldHitNeck = ...;
  if (!isReverse && !wouldHitNeck) { worm.dir = proposedDir; }
  ```
  Game cổ điển cấm rắn quay đầu 180 độ hoặc đi vào đốt cổ của chính mình. Nhưng ở chế độ 1 Mins (Just Shapes & Beats), người chơi xuất phát với thân giun nằm ngang và cần đổi hướng né đạn linh hoạt. Khi người chơi gạt cần ngược về hướng thân giun, điều kiện `wouldHitNeck` khóa cứng hướng đi, khiến `worm.dir` giữ nguyên `{x: 0, y: 0}` và giun bị treo tại chỗ!
* **Nguyên nhân 3 (Tự cắn thân và chạm biên bản đồ)**:  
  Vòng lặp va chạm mặc định của game xử lý va chạm thân `headHitsSelfCell` và biên bản đồ `head.y === rows - 1` kích hoạt `triggerGameOver()`, không phù hợp với đấu trường khép kín (Bounded Arena) của Just Shapes & Beats.

---

## 2. User Scenarios & Acceptance Criteria

### User Story 1 - Khởi Động Đếm Ngược 5s Trơn Tru & Bắt Đầu Màn Chơi (Priority: P1 - MVP)
Người chơi bấm "▶ BẮT ĐẦU (ĐẾM NGƯỢC 5S)", màn hình đếm ngược chính xác `5 -> 4 -> 3 -> 2 -> 1 -> 0` theo thời gian thực (mỗi giây phát 1 âm beep), sau đó nhạc nền Web Audio vang lên, đạn bắt đầu tung ra và trận đấu chính thức bắt đầu.

- **Acceptance Scenarios**:
  1. **Given** Người chơi bấm Bắt đầu chế độ 1 Mins,  
     **When** Vào đấu trường,  
     **Then** Đồng hồ `oneMinCountdownTimer` giảm liên tục từ 5.0 xuống 0.0 theo delta time thực tế.
  2. **Given** Đồng hồ đếm ngược chạm 0,  
     **When** Chuyển sang trạng thái `playing`,  
     **Then** Màn hình lóe sáng, âm thanh Supernova/Synth phát sống động, đạn nhịp điệu xuất hiện, thanh tiến trình `00.0s / 67.0s` bắt đầu chạy.

### User Story 2 - Mở Khóa Di Chuyển Tuyệt Đối Cho Giun Trong 1 Mins (Priority: P1 - MVP)
Người chơi có thể điều khiển giun di chuyển linh hoạt theo 8 hướng ngay lập tức bằng Joystick hoặc phím WASD mà không bao giờ bị treo, kẹt hay bị khóa bởi cơ chế cấm quay đầu cổ của rắn truyền thống.

- **Acceptance Scenarios**:
  1. **Given** Người chơi gạt cần Joystick hoặc bấm phím hướng,  
     **When** Hướng di chuyển khác `{0, 0}`,  
     **Then** Giun chuyển động mượt mà với tốc độ chuẩn 16 ô/giây (hoặc 38 ô/giây khi lướt Dash), đổi hướng 360 độ tự do mà không bị kẹt vào thân.
  2. **Given** Giun di chuyển chạm vào thành đấu trường (Arena Borders),  
     **When** Chạm viền co rút của màn chơi,  
     **Then** Tọa độ giun được giữ an toàn bên trong viền (Clamped), không kích hoạt Game Over vô lý.
  3. **Given** Người chơi thả tay khỏi Joystick / phím bấm,  
     **When** Không còn lực điều khiển,  
     **Then** Giun dừng lại đứng yên chuẩn xác tại vị trí đó (không tự trôi).

### User Story 3 - Chuẩn Hóa Hiển Thị Màn Hình Dọc (Priority: P1 - MVP)
Khi tải game hoặc mở menu trên điện thoại xoay dọc, chỉ có panel được chọn hiển thị, tất cả các panel khác ẩn 100% không đè chồng.

- **Acceptance Scenarios**:
  1. **Given** Mở game ở chế độ màn hình dọc,  
     **When** Chọn từng menu,  
     **Then** Duy nhất 1 menu hiển thị toàn màn hình rõ ràng, các menu khác có `display: none !important`.

---

## 3. Functional Requirements
- **FR-001**: Hệ thống MUST tách biệt vòng lặp `updateOneMinMode(dt)` để chạy độc lập ở đầu hàm `update(dt)`, không bao giờ bị phụ thuộc vào biến cờ `hasStartedMoving`.
- **FR-002**: Hệ thống MUST đặt `hasStartedMoving = true` ngay khi vào `startOneMinMode()`, và đảm bảo `updateKeyboardDirection()` / `updateOneMinDirection()` không bị chặn.
- **FR-003**: Hệ thống MUST vô hiệu hóa điều kiện `wouldHitNeck` và `isReverse` khi `isOneMinMode === true`, cho phép giun quay đầu tự do 180 độ.
- **FR-004**: Hệ thống MUST vô hiệu hóa chết do cắn thân (`headHitsSelfCell`) và giới hạn tọa độ giun trong khung đấu trường (`cols * gridSize`, `rows * gridSize`) trong chế độ 1 Mins.
- **FR-005**: Hệ thống MUST gán `style="display: none;"` mặc định lên các subpanel trong HTML và chỉ kích hoạt CSS flex khi có `[style*="display: flex"]`.

---

## 4. Success Criteria
- [ ] Đồng hồ 5s đếm ngược chạy mượt mà không bị kẹt tại 5s trên mọi thiết bị.
- [ ] Giun di chuyển ngay lập tức theo cần Joystick/phím bấm, không bị treo tại chỗ.
- [ ] Trận đấu bắt đầu sau 5s với đạn và nhạc synth hoạt động chính xác.
- [ ] Menu dọc không bị đè chồng.
