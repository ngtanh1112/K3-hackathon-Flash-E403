# User Validation & Feedback Log

Thư mục ghi nhận kết quả các phiên thử nghiệm sản phẩm trực tiếp với người dùng ngoài nhóm (User Test).

## 1. Phương Pháp Thử Nghiệm (Validation Protocol)
- **Đối tượng:** 5 người dùng ngoài nhóm (gồm 3 willing users đã đăng ký từ mốc CP1 + 2 học viên khóa K3).
- **Hình thức:** Phiên test 1-on-1 kéo dài 10 phút.
- **Quy trình:**
  1. Giao task thật: *"Bạn vừa đọc xong slide Day 01. Hãy dùng AI Quiz để tự kiểm tra kiến thức của mình."*
  2. Người thử nghiệm im lặng quan sát, ghi chép thao tác và ghi âm/quote lại nhận xét nguyên văn.
  3. Hỏi 3 câu chuẩn theo Guide §4.2:
     - *"Điều gì khó hiểu hoặc khó chịu nhất?"*
     - *"Kết quả này bạn có tin không — vì sao?"*
     - *"Bạn có dùng thật không — vì sao / vì sao chưa?"*

## 2. Bảng Logging Phản Hồi Trực Tiếp (Feedback Log)

| Thời gian | Người test (Tên / Vai) | Tình huống test | Feedback nguyên văn | Mức độ | Hành động tiếp theo |
|---|---|---|---|---|---|
| 30/07 14:00 | **Phan Trần Tường Vi** (Học viên K3) | Mở sidebar và chọn số câu hỏi | *"Mở ra thấy khung chat Q&A trước làm mình tưởng đây chỉ là chatbot thông thường, không biết bấm đâu để làm quiz."* | 🔴 Cao | Đổi mode mặc định khi mở sidebar thành Quiz Intro Card |
| 30/07 14:15 | **Nguyễn Minh Thái** (Học viên K3) | Nhập "tạo 20 quiz" trong khung chat | *"Mình gõ lệnh tạo quiz mà AI phản hồi chữ chạy lâu quá, thích nhấn nút chọn 20 câu nhanh hơn."* | 🟡 Trung bình | Thêm ô chat nhanh ngay dưới nút chọn số câu trong Intro Card |
| 30/07 14:30 | **Nguyễn Thị Xuân Mai** (Học viên K3) | Chọn bài giảng khác ở cây thư mục trái | *"Đang chat hỏi bài giảng này mà bấm sang bài khác xem slide là khung chat bị tự động đóng lại, phải mở lại từ đầu."* | 🔴 Cao | Giữ trạng thái Quiz/Chat sidebar mở liên tục khi chuyển bài giảng |
| 30/07 14:45 | **Đặng Văn Hùng** (Học viên ngoài nhóm) | Xem kết quả làm sai câu hỏi | *"Phần giải thích đáp án ghi đúng nhưng không trích dẫn bài giảng ở trang bao nhiêu nên mình vẫn phải đi mò slide."* | 🟡 Trung bình | Bổ sung mã trích dẫn đoạn transcript trong phần giải thích |
| 30/07 15:00 | **Trần Hoàng Nam** (Học viên ngoài nhóm) | Hỏi thử câu ngoài lề ("Hôm nay ăn gì?") | *"AI trả lời từ chối rất lịch sự, bảo chỉ hỗ trợ bài học làm mình thấy yên tâm không lo AI nói nhảm."* | 🟢 Tốt | Giữ nguyên System Prompt phân vùng phạm vi trả lời |

## 3. Tổng Hợp Thay Đổi Sau Validation (`changes-after-validation.md`)

### Thay đổi 1 — Giao diện mặc định Sidebar
- **Vấn đề:** 3/5 người thử nghiệm lúng túng khi mở sidebar thấy màn hình Chat Q&A trước.
- **Sửa đổi:** Thiết lập `SIDEBAR_MODE.QUIZ` làm chế độ mặc định. Khi nhấn nút "AI Quiz", học viên thấy ngay Intro Card với các tùy chọn số lượng câu hỏi (10, 15, 20, 25, 30) và nút "Sinh Quiz bằng AI".

### Thay đổi 2 — Không đóng Sidebar khi đổi bài
- **Vấn đề:** Học viên cần đọc tài liệu bài khác để tham chiếu nhưng việc đổi bài làm đóng/reset toàn bộ sidebar.
- **Sửa đổi:** Tách rời trạng thái hiển thị sidebar (`isOpen`) và bài giảng tích cực (`activeLesson`). Việc chuyển bài ở thanh menu trái chỉ cập nhật nội dung PDF Viewer, giữ nguyên Sidebar đang mở và hội thoại chat.

### Thay đổi 3 — Ô Chat Nhanh Tích Hợp (Quick AI Chat)
- **Vấn đề:** Học viên muốn vừa chọn nhanh số câu vừa có thể gõ câu hỏi linh hoạt mà không muốn chuyển tab qua lại.
- **Sửa đổi:** Thêm ô nhập liệu chat nhanh ở góc dưới của Intro Card. Nhập lệnh `"tạo 20 quiz"` hoặc câu hỏi bất kỳ sẽ được AI tự động xử lý ngay trong luồng.

