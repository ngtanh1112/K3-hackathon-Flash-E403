# Mini Hackathon AI — Batch 03 · Nhóm Flash-E403 · Zone A

Repo nộp bài của nhóm cho Mini Hackathon AI: **SPEC → Prototype → Demo**.

**Đề tài:** AI Quiz Comprehension Check — sinh câu hỏi kiểm tra hiểu bài tức thì từ transcript bài giảng VLearn, giúp học viên phát hiện lỗ hổng kiến thức ngay sau khi học xong.

**Hướng:** A — VLearn · **Loại:** Tính năng mới

## Thành Viên

| Mã HV | Họ tên | Vai trò / phần việc chính |
|---|---|---|
| 2A202601487 | Lê Ngọc Khánh | Thiết kế giao diện & UX, Front-end prototype, UI/UX implementation |
| 2A202601793 | Vũ Ngọc Thiện | Thu thập data, mining chatlog, xây golden set |
| 2A202601137 | Lê Mạnh Cương | Prompt engineering, AI integration, backend logic |
| 2A202602016 | Nguyễn Hoài Nam | Spec, Product Discovery, viết AI Spec |
| 2A202601775 | Nguyễn Tuấn Anh | Kịch bản demo, user validation, tổng hợp feedback |

## Phân Công Theo Artifact

| Artifact | Người phụ trách | Ghi chú |
|---|---|---|
| `spec.md` | Nguyễn Hoài Nam | AI Spec đầy đủ §1–§9 theo template hackathon |
| `codebase/` | Lê Mạnh Cương + Lê Ngọc Khánh | React SPA: PDF viewer + AI Quiz sidebar + Chat Q&A |
| `eval/` | Vũ Ngọc Thiện | Golden set 20+ case + bảng kết quả các lượt chạy |
| `validation/` | Nguyễn Tuấn Anh | Feedback log ≥5 người + changelog |
| `demo-slides.pdf` | Nguyễn Tuấn Anh | Slide demo 6 trang |
| `reflection/` | Mỗi thành viên | Mỗi người 1 file cá nhân |

## Cấu Trúc Repo

```text
repo/
|-- README.md
|-- spec.md
|-- demo-slides.pdf
|-- codebase/
|-- eval/
|-- validation/
`-- reflection/
```

## Lưu Ý Nộp Bài

- Không commit API key, token, file `.env` hoặc data pack gốc.
- Chỉ đưa vào repo các trích dẫn ngắn / mã đoạn cần thiết để minh họa evidence.
- Ghi trung thực kết quả đo, kể cả khi chưa đạt mục tiêu.
- Trong `codebase/`, ghi rõ phần nào là mock và phần nào gọi AI thật.
