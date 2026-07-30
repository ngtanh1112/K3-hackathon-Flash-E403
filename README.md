# Mini Hackathon AI - Batch 03

Repo nộp bài của nhóm cho Mini Hackathon AI: **SPEC -> Prototype -> Demo**.

Đề tài: **AI tạo đề trắc nghiệm / quiz dựa trên slide VLearn** để giúp học viên ôn lại ý chính sau mỗi buổi học lý thuyết.

## Thành Viên

| Mã HV | Họ tên | Vai trò / phần việc chính |
|---|---|---|
| [Mã HV] | [Tên thành viên 1] | Product discovery, evidence, spec |
| [Mã HV] | [Tên thành viên 2] | UX flow, prototype UI |
| [Mã HV] | [Tên thành viên 3] | AI integration, backend / logic |
| [Mã HV] | [Tên thành viên 4] | Evaluation, golden set, validation |
| [Mã HV] | [Tên thành viên 5] | Demo slides, tổng hợp, reflection |

## Phân Công Theo Artifact

| Artifact | Người phụ trách | Ghi chú |
|---|---|---|
| `spec.md` | [Tên] | AI Spec theo template của hackathon |
| `codebase/` | [Tên] | Prototype CP2: dán tài liệu, tạo quiz mock, làm quiz, xem kết quả |
| `eval/` | [Tên] | Golden set và kết quả các lần chạy |
| `validation/` | [Tên] | Feedback log từ user test |
| `demo-slides.pdf` | [Tên] | Slide demo 6 trang |
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
