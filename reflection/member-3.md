# Reflection - Member 3

- Họ tên / Mã HV: Lê Mạnh Cương — 2A202601137
- Phần việc đã phụ trách: Prompt Engineering, tích hợp API OpenRouter, xử lý streaming chat và intent parsing (`chatService.js`, `quizService.js`).
- Quyết định quan trọng đã đóng góp: Đề xuất mô hình System Prompt với cơ chế Chain-of-Thought (bắt buộc AI phân tích câu hỏi trước khi trả lời) và thiết lập `temperature=0.3` để giảm thiểu tối đa hiện tượng ảo giác (hallucination), đảm bảo AI câu hỏi và câu trả lời hoàn toàn bám sát transcript bài giảng.
- Điều học được: Cách kiểm soát LLM thông qua System Prompt chặt chẽ, hiểu rõ rủi ro Cost-of-error trong giáo dục. Việc xây dựng cơ chế tự động chuyển đổi giữa Chat Q&A và Quiz giúp tối ưu hành trình trải nghiệm người dùng mà không cần thay đổi phức tạp giao diện.
- Điều sẽ làm khác nếu có thêm thời gian: Tích hợp RAG (Retrieval-Augmented Generation) với Vector Database (như ChromaDB/Pinecone) thay vì truyền trực tiếp đoạn transcript vào context window để xử lý bài giảng dài hàng trăm trang hiệu quả hơn.

