// API service — gọi OpenRouter để sinh quiz từ nội dung bài học
// Model: meta-llama/llama-3.1-8b-instruct (từ .env)

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const MODEL = import.meta.env.VITE_LLM_MODEL || "meta-llama/llama-3.1-8b-instruct";

/**
 * Sinh bộ câu hỏi trắc nghiệm từ nội dung bài học
 * @param {Object} lesson - Lesson object từ lessons.js
 * @param {number} questionCount - Số câu hỏi muốn sinh (10-30)
 * @returns {Promise<Array>} - Mảng câu hỏi quiz
 */
export async function generateQuiz(lesson, questionCount = 15) {
  const prompt = buildPrompt(lesson, questionCount);

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://vlearn.edu.vn",
      "X-Title": "VLearn AI Quiz",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.error?.message || `API error ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) throw new Error("API trả về nội dung trống");

  return parseQuizResponse(content);
}

// ─── System Prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Bạn là một chuyên gia giáo dục AI, nhiệm vụ là tạo câu hỏi trắc nghiệm chất lượng cao từ nội dung bài giảng về AI và sản phẩm công nghệ.

Nguyên tắc tạo câu hỏi:
1. Câu hỏi phải bám sát nội dung transcript được cung cấp — không bịa thêm kiến thức ngoài bài
2. Mỗi câu có đúng 4 lựa chọn (A, B, C, D) — chỉ có 1 đáp án đúng
3. Câu gây nhiễu (distractors) phải hợp lý, không quá dễ phân biệt
4. Giải thích phải tham chiếu đúng nguồn từ bài giảng, ngắn gọn và rõ ràng
5. Phân bố câu hỏi đều theo các chủ đề trong bài
6. Tránh câu hỏi quá đơn giản (chỉ đọc lại định nghĩa) — ưu tiên câu hỏi vận dụng và phân tích

Trả về JSON với format chính xác sau:
{
  "questions": [
    {
      "question": "Nội dung câu hỏi?",
      "options": ["Lựa chọn A", "Lựa chọn B", "Lựa chọn C", "Lựa chọn D"],
      "correct": 0,
      "explanation": "Giải thích tại sao đáp án đúng, dựa trên nội dung bài giảng.",
      "topic": "Chủ đề của câu hỏi",
      "difficulty": "easy|medium|hard"
    }
  ]
}

"correct" là index của đáp án đúng (0=A, 1=B, 2=C, 3=D).`;

// ─── Build Prompt ─────────────────────────────────────────────────────────────
function buildPrompt(lesson, questionCount) {
  return `Tạo ${questionCount} câu hỏi trắc nghiệm từ bài giảng sau:

**Bài học:** ${lesson.title} (${lesson.subtitle})
**Các chủ đề chính:** ${lesson.topics.join(", ")}

**Nội dung bài giảng (trích dẫn từ transcript thật):**
${lesson.excerpts}

---
Yêu cầu:
- Sinh đúng ${questionCount} câu hỏi
- Câu hỏi bằng tiếng Việt
- Mỗi câu hỏi phải rõ ràng, không mơ hồ
- Giải thích phải hữu ích, giúp học viên hiểu sâu hơn
- Độ khó: khoảng 30% easy, 50% medium, 20% hard
- Trả về JSON hợp lệ theo format đã định`;
}

// ─── Parse Response ───────────────────────────────────────────────────────────
function parseQuizResponse(content) {
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    // Thử extract JSON từ trong markdown code block nếu model wrap lại
    const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      parsed = JSON.parse(match[1]);
    } else {
      // Last resort: tìm {...} đầu tiên
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Không parse được JSON từ response của AI");
      }
    }
  }

  const questions = parsed?.questions;
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("Response không có danh sách câu hỏi hợp lệ");
  }

  // Validate và normalize từng câu hỏi
  return questions.map((q, i) => ({
    id: i,
    question: q.question || `Câu ${i + 1}`,
    options: Array.isArray(q.options) && q.options.length === 4
      ? q.options
      : ["A", "B", "C", "D"],
    correct: typeof q.correct === "number" && q.correct >= 0 && q.correct <= 3
      ? q.correct
      : 0,
    explanation: q.explanation || "Xem lại nội dung bài giảng.",
    topic: q.topic || "Kiến thức chung",
    difficulty: ["easy", "medium", "hard"].includes(q.difficulty)
      ? q.difficulty
      : "medium",
  }));
}
