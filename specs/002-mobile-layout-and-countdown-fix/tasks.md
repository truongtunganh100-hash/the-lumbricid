# Implementation Tasks: Giải Quyết Triệt Để Lỗi 5s Treo Giun & Màn Hình Dọc

**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)  
**Status**: Ready for Execution  

---

- [ ] **Task 1: Sửa lỗi kẹt 5s đếm ngược & dời hàm cập nhật lên đầu vòng lặp game**
  - **Action**:
    - Trong hàm `startOneMinMode()`: gán `hasStartedMoving = true;` rõ ràng.
    - Trong hàm `update(dt)`: dời khối lệnh gọi `updateOneMinMode(dt)` lên ngay đầu hàm (sau kiểm tra `isPaused`).
    - Trong điều kiện chặn `if (!hasStartedMoving && !isMenuMode)`: thêm điều kiện bảo vệ `&& !isOneMinMode` để vòng lặp cập nhật tốc độ giun luôn chạy thông suốt.
  - **Verification**: Mở game chế độ 1 Mins, đồng hồ 5s đếm ngược chạy ngay lập tức `5 -> 4 -> 3 -> 2 -> 1 -> 0`.

- [ ] **Task 2: Mở khóa di chuyển toàn diện cho giun trong 1 Mins (Khắc phục lỗi treo giun)**
  - **Action**:
    - Trong hàm `update(dt)` tại đoạn kiểm tra đổi hướng: tách biệt điều kiện cho `isOneMinMode` để bỏ qua `wouldHitNeck` và `isReverse`, cho phép giun quay đầu 180 độ tự do né đạn.
    - Trong kiểm tra va chạm thân `headHitsSelfCell`: bỏ qua khi `isOneMinMode === true`.
    - Trong kiểm tra biên đấu trường: thay thế lệnh rơi map/game over bằng cơ chế giới hạn tọa độ an toàn (Clamping) bên trong viền đấu trường 1 Mins.
  - **Verification**: Gạt cần Joystick ảo hoặc bấm phím hướng, giun di chuyển ngay lập tức và có thể đảo chiều liên tục không bị đơ giật.

- [ ] **Task 3: Khắc phục triệt để lỗi đè chồng menu màn hình dọc**
  - **Action**:
    - Trong mã nguồn HTML của `public/index.html`: thêm thuộc tính `style="display: none;"` vào các thẻ div subpanel: `#panel-difficulty`, `#panel-map`, `#panel-tsunami`, `#panel-endless`, `#panel-race`, `#panel-onemin`, `#panel-darknight`, `#panel-2p`, `#panel-settings`.
    - Trong CSS `@media (orientation: portrait)`: đổi bộ chọn từ `:not([style*="display: none"])` sang `[style*="display: flex"]`.
  - **Verification**: Mở game ở chiều dọc điện thoại, các menu hiển thị riêng rẽ 100%, không còn hiện tượng 3 bảng đè nhau.

- [ ] **Task 4: Kiểm tra cú pháp, xác thực End-to-End và Push lên GitHub**
  - **Action**:
    - Chạy Node.js VM syntax check trên `public/index.html`.
    - Commit các thay đổi với thông điệp rõ ràng.
    - Push lên kho lưu trữ GitHub `truongtunganh100-hash/the-lumbricid` nhánh `main`.
  - **Verification**: Git exit code 0, commit có mặt trên GitHub remote.
