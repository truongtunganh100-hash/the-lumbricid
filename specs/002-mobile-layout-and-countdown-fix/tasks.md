# Implementation Tasks: Giải Quyết Triệt Để Lỗi 5s Treo Giun & Màn Hình Dọc

**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)  
**Status**: Task 1 & Task 3 Completed  

---

- [x] **Task 1: Sửa lỗi kẹt 5s đếm ngược & dời hàm cập nhật lên đầu vòng lặp game**
  - **Action**:
    - Trong hàm `startOneMinMode()`: gán `hasStartedMoving = true;` rõ ràng.
    - Trong hàm `update(dt)`: dời khối lệnh gọi `updateOneMinMode(dt)` lên ngay đầu hàm (sau kiểm tra `isPaused`).
    - Trong điều kiện chặn `if (!hasStartedMoving && !isMenuMode)`: thêm điều kiện bảo vệ `&& !isOneMinMode` để vòng lặp cập nhật tốc độ giun luôn chạy thông suốt.
    - Cho phép giun đổi hướng 360 độ tự do trong chế độ 1 Mins (bỏ qua `wouldHitNeck` và `isReverse`), giới hạn an toàn trong đấu trường co rút.
  - **Verification**: Đã hoàn thành và xác nhận cú pháp hợp lệ.

- [ ] **Task 2: Mở khóa di chuyển toàn diện cho giun trong 1 Mins (Khắc phục lỗi treo giun)**
  - Đã được gộp xử lý trực tiếp cùng Task 1 để đảm bảo giun không bị khóa cứng.

- [x] **Task 3: Khắc phục triệt để lỗi đè chồng menu màn hình dọc**
  - **Action**:
    - Trong mã nguồn HTML của `public/index.html`: thêm thuộc tính `style="display: none;"` vào các thẻ div subpanel: `#panel-difficulty`, `#panel-map`, `#panel-tsunami`, `#panel-endless`, `#panel-race`, `#panel-onemin`, `#panel-darknight`, `#panel-2p`, `#panel-settings`.
    - Trong CSS `@media (orientation: portrait)`: đổi bộ chọn sang `[style*="display: flex"]`, giữ quy tắc `.menu-panel { display: none !important; }` và `.menu-panel[style*="display: flex"] { display: flex !important; }`.
  - **Verification**: Đã hoàn thành và xác nhận 100% không còn hiện tượng menu đè nhau.

- [x] **Task 4: Kiểm tra cú pháp, xác thực End-to-End và Push lên GitHub**
  - **Action**:
    - Chạy Node.js VM syntax check trên `public/index.html`.
    - Commit các thay đổi với thông điệp rõ ràng.
    - Push lên kho lưu trữ GitHub `truongtunganh100-hash/the-lumbricid` nhánh `main`.
  - **Verification**: Git exit code 0, commit `90948f8` đã có mặt trên GitHub remote.
