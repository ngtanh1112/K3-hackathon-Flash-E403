# Thay Đổi Sau Vòng User Validation (Changes After Validation)

### Thay đổi 1 — Giao diện mặc định Sidebar
- **Vấn đề:** 3/5 người thử nghiệm lúng túng khi mở sidebar thấy màn hình Chat Q&A trước.
- **Sửa đổi:** Thiết lập `SIDEBAR_MODE.QUIZ` làm chế độ mặc định. Khi nhấn nút "AI Quiz", học viên thấy ngay Intro Card với các tùy chọn số lượng câu hỏi (10, 15, 20, 25, 30) và nút "Sinh Quiz bằng AI".

### Thay đổi 2 — Không đóng Sidebar khi đổi bài
- **Vấn đề:** Học viên cần đọc tài liệu bài khác để tham chiếu nhưng việc đổi bài làm đóng/reset toàn bộ sidebar.
- **Sửa đổi:** Tách rời trạng thái hiển thị sidebar (`isOpen`) và bài giảng tích cực (`activeLesson`). Việc chuyển bài ở thanh menu trái chỉ cập nhật nội dung PDF Viewer, giữ nguyên Sidebar đang mở và hội thoại chat.

### Thay đổi 3 — Ô Chat Nhanh Tích Hợp (Quick AI Chat)
- **Vấn đề:** Học viên muốn vừa chọn nhanh số câu vừa có thể gõ câu hỏi linh hoạt mà không muốn chuyển tab qua lại.
- **Sửa đổi:** Thêm ô nhập liệu chat nhanh ở góc dưới của Intro Card. Nhập lệnh `"tạo 20 quiz"` hoặc câu hỏi bất kỳ sẽ được AI tự động xử lý ngay trong luồng.
