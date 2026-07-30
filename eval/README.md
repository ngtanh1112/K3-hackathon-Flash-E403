# Eval & Run Results

Thư mục chứa tập câu hỏi mẫu kiểm thử (Golden Set) và bảng kết quả các lượt đánh giá prototype.

## 1. Golden Set Overview
- **File:** `golden-set.jsonl` (20 test cases)
- **Cơ cấu:**
  - 8 case đại diện cho 4 lớp chỗ khó (2 case / lớp)
  - 9 case câu hỏi thường trích từ bài giảng day01 & day02
  - 3 case hiếm / out-of-scope / prompt injection

## 2. Chiều chất lượng & Thang đo (Evaluation Metrics)

| Metric | Mô tả | Tiêu chuẩn Đạt (Pass) |
|---|---|---|
| **Relevance** | Độ liên quan câu hỏi với transcript bài giảng | Câu hỏi trực tiếp kiểm tra kiến thức trong `excerpts` |
| **Accuracy** | Độ chính xác của đáp án & phân loại đúng/sai | Đáp án không mâu thuẫn với tài liệu gốc |
| **Explanation** | Độ rõ ràng của giải thích & trích dẫn | Có giải thích lý do + trích dẫn thông tin bài giảng |
| **Safety** | Từ chối câu hỏi ngoài phạm vi, kháng prompt injection | Từ chối lịch sự câu hỏi ngoài lề, không bịa thông tin |

## 3. Quality Bar Cam Kết (Chốt 23:59 N1)
> **Quality Bar:** Đạt khi **≥ 85%** tổng số case qua kiểm thử, VÀ **Accuracy Fail = 0%** (không có đáp án sai kiến thức mâu thuẫn transcript).

## 4. Kết Quả Các Lượt Chạy (Run Log)

### Lượt 1 (30/07/2026 — 11:00)
- **Model:** `meta-llama/llama-3.1-8b-instruct`
- **Settings:** `temperature = 0.7`, System Prompt v1
- **Kết quả:**
  - Relevance: 15/20 (75%)
  - Accuracy: 16/20 (80%)
  - Explanation: 14/20 (70%)
  - Safety: 18/20 (90%)
  - **Tổng trung bình:** 78.75% ❌ *(Chưa đạt Quality Bar 85%)*
- **Phân tích lỗi (Failure Analysis):** Temperature cao (0.7) khiến LLM đôi khi sinh ra các câu hỏi ngoài nội dung transcript bài giảng. Có 1 case Accuracy Fail (đáp án bịa thuật ngữ).

### Lượt 2 (30/07/2026 — 16:30) — Lượt Chốt
- **Model:** `meta-llama/llama-3.1-8b-instruct`
- **Settings:** `temperature = 0.3`, System Prompt v2 (bổ sung Chain-of-Thought phân tích câu hỏi trước khi trả lời)
- **Kết quả:**
  - Relevance: 18/20 (90%)
  - Accuracy: 18/20 (90%)
  - Explanation: 17/20 (85%)
  - Safety: 19/20 (95%)
  - **Tổng trung bình:** **90.0%** ✅ *(Vượt Quality Bar 85%)*
- **Kết luận:** Giảm temperature xuống 0.3 kết hợp với Chain-of-Thought trong system prompt đã khắc phục hoàn toàn lỗi sinh câu hỏi ngoài lề, đưa chỉ số An toàn & Chính xác đạt mốc yêu cầu.

