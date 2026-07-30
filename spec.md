# AI Spec

> Hạn chót spec: 23:59 ngày 1. Sau mốc này chỉ cập nhật prototype, eval, validation và demo nếu thể lệ yêu cầu giữ nguyên spec.

## 1. Problem Statement

- Sau mỗi buổi học lý thuyết trên VLearn, học viên xem slide xong nhưng khó nhớ các ý chính khi chuyển sang làm bài tập hoặc ôn lại.
- Người gặp vấn đề: học viên VLearn và giáo viên / mentor muốn tạo bài ôn tập nhanh sau buổi học.
- Dấu hiệu: slide thường là tài liệu một chiều; nếu không có retrieval practice, học viên dễ quên nội dung vừa học.

## 2. Evidence & Impact

- Bằng chứng từ `data/`, khảo sát, interview, log học tập hoặc quan sát sản phẩm.
- Trích dẫn ngắn / mã đoạn minh họa.
- Nếu giải quyết tốt, tác động mong đợi là gì?

## 3. User & Job To Be Done

- Người dùng chính: học viên VLearn sau buổi học lý thuyết.
- Người dùng phụ: giáo viên / mentor cần tạo quiz nhanh từ slide.
- Bối cảnh sử dụng: sau khi học xong slide, học viên mở công cụ, dán nội dung slide và làm quiz ngắn.
- Job to be done: khi vừa học xong lý thuyết, tôi muốn có quiz nhanh từ slide để tự kiểm tra xem mình đã nhớ ý chính chưa.
- Kết quả mong muốn: có câu hỏi trắc nghiệm, đáp án đúng, điểm và gợi ý ôn tập.

## 4. Product Slice & Design

- Lát cắt sản phẩm tối thiểu sẽ demo CP2: trang web có thể bấm từ đầu đến cuối flow tạo quiz.
- Input: nội dung slide / tài liệu và yêu cầu tạo quiz.
- Output: bộ câu hỏi trắc nghiệm, lựa chọn đáp án, điểm sau khi nộp, gợi ý ôn tập.
- Luồng thao tác: mở trang -> dán tài liệu -> gõ yêu cầu -> bấm Tạo quiz -> chọn đáp án -> bấm Nộp bài -> xem kết quả.
- Phần working: giao diện, validate input, render quiz, chọn đáp án, chấm điểm, reset flow.
- Phần mock: sinh câu hỏi và gợi ý ôn tập, chưa gọi AI thật.
- Màn hình / flow chính: `codebase/index.html`.

## 5. Hard Parts, Risks & Assumptions

- Chỗ khó về AI / dữ liệu / UX / kỹ thuật:
- Giả định quan trọng:
- Rủi ro sai kết quả, ảo giác, bias, bảo mật dữ liệu:

## 6. Mitigation & Fallback

- Cách giảm rủi ro:
- Khi AI trả lời sai hoặc không đủ thông tin, sản phẩm sẽ làm gì?
- Giới hạn rõ ràng của prototype:

## 7. Evaluation

- Golden set nằm ở file nào trong `eval/`:
- Metrics:
- Tiêu chí pass / fail:
- Kết quả các lần chạy:
- Nhận xét trung thực sau khi đo:

## 8. Validation

- Ai đã test:
- Cách test:
- Feedback chính:
- Thay đổi sau validation:

## 9. Demo Plan

- Tình huống demo: học viên vừa học xong một slide lý thuyết và muốn ôn lại bằng quiz ngắn.
- Dữ liệu demo: đoạn slide mẫu có sẵn trong prototype hoặc đoạn tài liệu dán tay.
- Lời gọi AI thật sẽ được show: CP2 chưa cần AI thật; phần sinh quiz đang mock và sẽ thay bằng AI ở CP3.
- Kết quả mong đợi: người xem thấy flow bấm được liên tục đến màn hình điểm.
