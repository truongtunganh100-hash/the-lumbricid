# Project Development Rules

## Specification-Driven Development (SDD / spec-kit)
Whenever the user uses the slash command `/spec` or `/spec <feature description>`:
1. Follow the **GitHub spec-kit** Specification-Driven Development (SDD) methodology defined in the `spec` skill.
2. Code serves specifications: Do not start writing code immediately.
3. Automatically organize the feature under `specs/<NNN>-<short-name>/`:
   - `spec.md`: User stories prioritized by P1 (MVP), P2..., Given/When/Then acceptance criteria, edge cases, functional requirements.
   - `plan.md`: Technical architecture, data models, affected files, interfaces.
   - `tasks.md`: Sequenced, testable implementation checklist with verification steps.
4. Present the specification to the user before executing the tasks.

## Tự Động Đẩy Lên GitHub (Auto-Push to GitHub)
Luôn luôn tự động `git commit` và `git push origin main` ngay sau mỗi lần hoàn thành sửa đổi code, cân bằng gameplay hoặc thêm tính năng mới, không cần người dùng phải nhắc nhở thủ công.
