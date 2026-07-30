# AI Quiz - VLearn UI Prototype

Prototype CP2 cho tính năng **AI Quiz** tích hợp trực tiếp vào giao diện đọc slide của VLearn.

## Cách Chạy

```powershell
npm install
npm run dev
```

Sau đó mở URL Vite hiển thị trên terminal, thường là:

```text
http://localhost:5173
```

## Flow CP2

1. Mở giao diện VLearn giả lập.
2. Bấm nút toggle `Quiz` sát mép phải.
3. Sidebar `AI Quiz` trượt vào.
4. Bấm `Generate Quiz`.
5. Làm từng câu hỏi.
6. Bấm `Submit Answer` để xem đúng / sai và explanation.
7. Bấm `Next` đến hết quiz.
8. Xem màn hình hoàn thành, điểm, accuracy và weak topics.
9. Bấm `Retry Quiz` để làm lại.

## Công Nghệ

- React
- TailwindCSS
- Framer Motion
- Lucide Icons

## Trạng Thái Prototype

- Không có backend.
- Không gọi AI thật.
- Dữ liệu quiz là mock.
- Giao diện được dựng để giống VLearn và chứng minh flow bấm được cho Checkpoint 2.
