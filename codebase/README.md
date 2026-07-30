# VLearn AI Quiz

Prototype VLearn có viewer học liệu, sidebar AI Quiz và chế độ Admin để upload slide.

## Cách Chạy

```powershell
npm install
npm run dev
```

Nếu PowerShell chặn `npm.ps1`, dùng:

```powershell
npm.cmd run dev
```

## Cấu Hình AI API

File `.env` đã được thêm ở thư mục `codebase`:

```env
VITE_OPENAI_API_KEY=
VITE_OPENAI_MODEL=gpt-4o-mini
```

Điền API key vào `VITE_OPENAI_API_KEY`, sau đó restart dev server. Khi chưa có key hoặc API lỗi, app tự dùng bộ câu hỏi mẫu để demo không bị đứt luồng.

Lưu ý: đây là frontend demo, biến `VITE_` sẽ được bundle cho trình duyệt. Chỉ dùng key thật khi chạy local/hackathon, không deploy công khai theo cách này.

## Chức Năng

- Chọn học liệu theo từng ngày học.
- Tìm kiếm tài liệu trong sidebar.
- Viewer PDF với tài liệu demo và file PDF admin upload.
- Toolbar có đọc, bút ghi chú, highlight, zoom, reset, download, xóa note.
- VLearn Visual Explain: bật công cụ `Visual Explain`, kéo khoanh vùng trên slide/PDF, chọn câu hỏi nhanh hoặc nhập câu hỏi tự do để nhận giải thích trong ngữ cảnh bài học.
- Các vùng đã khoanh được lưu thành trace trong phiên học và được đưa vào prompt tạo quiz để cá nhân hóa câu hỏi.
- VLearn Tutor: nút `Tutor` nổi bên phải mở panel chat hỏi đáp tự do theo ngữ cảnh tài liệu, trang đang xem, Agenda và Visual Explain traces.
- Điều hướng trang và hiển thị số trang.
- Sidebar AI Quiz: generate, chọn đáp án, nộp, feedback, next/previous, điểm, accuracy, weak topics, retry.
- Toggle Student/Admin trên header.
- Admin upload PDF/PPT/PPTX, nhập mô tả và nội dung/ghi chú slide để AI tạo quiz.
- Khi admin chọn PDF/PPTX, app tự trích xuất toàn bộ text đọc được trong slide để AI tạo câu hỏi sát nội dung hơn. Ô ghi chú chỉ là tùy chọn để bổ sung trọng tâm.
- Học liệu upload được lưu trong `localStorage` của trình duyệt cho demo.

## Flow Demo

1. Chạy app và mở URL Vite.
2. Ở chế độ Student, chọn tài liệu và bấm `Quiz`.
3. Bấm `Generate Quiz`, làm bài và xem kết quả.
4. Chuyển sang `Admin`, upload slide mới và nhập ghi chú/nội dung chính.
5. App tự quay về Student, tài liệu mới xuất hiện trong sidebar và có thể tạo quiz từ nội dung vừa nhập.
