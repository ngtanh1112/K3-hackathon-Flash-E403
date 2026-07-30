import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Bot,
  BrainCircuit,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eraser,
  FileText,
  Highlighter,
  Languages,
  Moon,
  PenLine,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
  Trash2,
  UserRound,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import "./styles.css";

const quizQuestions = [
  {
    question: "Mục đích chính của Attention trong Transformers là gì?",
    options: [
      "Giúp mô hình tập trung vào các phần quan trọng của chuỗi đầu vào",
      "Nén toàn bộ dữ liệu thành một nhãn duy nhất",
      "Thay thế hoàn toàn bước huấn luyện",
      "Tạo màu sắc cho giao diện người dùng",
    ],
    correct: 0,
    explanation:
      "Attention cho phép mô hình gán trọng số khác nhau cho từng token, nhờ đó hiểu quan hệ ngữ cảnh tốt hơn.",
  },
  {
    question: "Vì sao quiz sau buổi học giúp học viên nhớ bài tốt hơn?",
    options: [
      "Vì học viên chỉ cần đọc lại slide",
      "Vì retrieval practice buộc học viên tự gọi lại kiến thức",
      "Vì quiz luôn dễ hơn bài tập",
      "Vì quiz thay thế toàn bộ bài giảng",
    ],
    correct: 1,
    explanation:
      "Khi tự trả lời câu hỏi, học viên phải chủ động nhớ lại kiến thức, từ đó tăng khả năng ghi nhớ dài hạn.",
  },
  {
    question: "Một câu hỏi trắc nghiệm tốt nên có đặc điểm nào?",
    options: [
      "Có nhiều đáp án đúng để tăng độ khó",
      "Dài nhất có thể",
      "Rõ ràng, kiểm tra một ý chính và có một đáp án đúng",
      "Không cần liên quan đến nội dung slide",
    ],
    correct: 2,
    explanation:
      "Câu hỏi tốt cần đo đúng một mục tiêu học tập, tránh mơ hồ và có đáp án đúng rõ ràng.",
  },
  {
    question: "Trong prototype CP2, phần nào đang được mock?",
    options: [
      "Việc mở panel bên phải",
      "Việc chọn đáp án",
      "Việc sinh câu hỏi bằng AI từ slide",
      "Việc chuyển câu hỏi tiếp theo",
    ],
    correct: 2,
    explanation:
      "Checkpoint 2 chỉ cần flow bấm được. Phần sinh quiz từ AI sẽ được thay bằng AI thật ở checkpoint sau.",
  },
  {
    question: "Tại sao nên đặt nút Generate Quiz trong panel?",
    options: [
      "Để người học thấy quiz được tạo từ bài học đang mở",
      "Để ẩn toàn bộ PDF Viewer",
      "Để thay thế sidebar tài liệu",
      "Để bỏ qua bước đọc slide",
    ],
    correct: 0,
    explanation:
      "Nút Generate Quiz tạo liên kết tự nhiên: đọc slide hiện tại trước, sau đó sinh quiz từ chính nội dung đó.",
  },
  {
    question: "Khi mở sidebar AI Quiz, PDF Viewer nên phản ứng thế nào?",
    options: [
      "Bị che bởi sidebar",
      "Tự thu nhỏ chiều ngang để vẫn đọc được nội dung",
      "Reload toàn bộ trang",
      "Biến mất hoàn toàn",
    ],
    correct: 1,
    explanation:
      "Prototype cần cho cảm giác tích hợp chính thức, vì vậy layout nên co giãn mượt thay vì che nội dung.",
  },
  {
    question: "Điểm mạnh chính của AI Quiz trên VLearn là gì?",
    options: [
      "Tạo thêm một trang web tách biệt",
      "Giúp học viên ôn tập ngay trong luồng đọc slide",
      "Bắt học viên nhập lại toàn bộ bài giảng",
      "Chỉ dùng để trang trí giao diện",
    ],
    correct: 1,
    explanation:
      "Tính năng có giá trị vì nằm đúng lúc học viên vừa xem tài liệu và cần kiểm tra mức độ hiểu bài.",
  },
  {
    question: "Khi học viên trả lời sai, panel nên hiển thị gì?",
    options: [
      "Chỉ báo sai và không giải thích",
      "Đáp án đúng và explanation ngắn",
      "Tự động đóng quiz",
      "Xóa toàn bộ câu hỏi",
    ],
    correct: 1,
    explanation:
      "Feedback tức thì giúp học viên hiểu vì sao sai và biết cần ôn lại phần nào.",
  },
  {
    question: "Accuracy trong màn hình kết quả thể hiện điều gì?",
    options: [
      "Tỷ lệ câu trả lời đúng",
      "Số trang PDF đã đọc",
      "Dung lượng file slide",
      "Số lần mở sidebar",
    ],
    correct: 0,
    explanation:
      "Accuracy là tỷ lệ đúng trên tổng số câu, giúp học viên nhìn nhanh mức độ nắm bài.",
  },
  {
    question: "Mục tiêu quan trọng nhất của Checkpoint 2 là gì?",
    options: [
      "Có AI thật hoạt động hoàn hảo",
      "Có giao diện đẹp nhưng không bấm được",
      "Bấm được đến cuối flow với dữ liệu mock",
      "Có đủ backend và database",
    ],
    correct: 2,
    explanation:
      "CP2 ưu tiên flow tương tác hoàn chỉnh: mở, bấm, submit, next, hoàn thành.",
  },
];

function Layout() {
  const [quizOpen, setQuizOpen] = useState(false);

  return (
    <div className="h-screen overflow-hidden bg-[#f3f7fb] text-vlearn-ink">
      <Header />
      <div className="flex h-[calc(100vh-90px)]">
        <LeftSidebar />
        <main className="relative flex min-w-0 flex-1">
          <PDFViewer quizOpen={quizOpen} />
          <QuizToggle isOpen={quizOpen} onClick={() => setQuizOpen(true)} />
          <AnimatePresence>
            {quizOpen && <QuizSidebar onClose={() => setQuizOpen(false)} />}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function Header() {
  return (
    <header className="flex h-[90px] items-center justify-between border-b border-vlearn-line bg-white px-8">
      <div className="flex items-center gap-4">
        <button className="grid h-10 w-10 place-items-center rounded-xl border border-vlearn-line text-vlearn-blue">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-3 border-r border-vlearn-line pr-4">
          <div className="h-8 w-8 rounded-lg bg-vlearn-blue text-white grid place-items-center font-black">V</div>
          <div className="text-2xl font-extrabold">
            <span className="text-red-600">V</span>Learn
          </div>
        </div>
        <button className="grid h-10 w-10 place-items-center rounded-xl border border-vlearn-line bg-vlearn-soft text-vlearn-blue">
          <BookOpen size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold leading-tight">day01_302.pdf</h1>
          <p className="text-sm font-medium text-vlearn-muted">COMP2010 · Lecture_material_ms2039d0_hnxpxy</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="h-10 rounded-xl border border-vlearn-line px-4 font-bold text-vlearn-blue">VI</button>
        <button className="grid h-10 w-10 place-items-center rounded-xl border border-vlearn-line text-vlearn-blue">
          <Moon size={18} />
        </button>
        <div className="ml-2 flex items-center gap-3 rounded-full border border-vlearn-line bg-vlearn-soft px-5 py-3">
          <UserRound size={20} className="text-vlearn-blue" />
          <div>
            <p className="text-sm font-bold text-vlearn-blue">Sinh viên ẩn danh</p>
            <p className="text-base font-bold">Anonymous student</p>
          </div>
        </div>
      </div>
    </header>
  );
}

function LeftSidebar() {
  const documents = [
    ["day01_302.pdf", "83 trang 83 pages", true],
    ["material_mrxpq9zu_t8e6xs....", "32 trang 32 pages", false],
  ];

  return (
    <aside className="h-full w-[400px] shrink-0 overflow-y-auto border-r border-vlearn-line bg-white px-6 py-7">
      <div className="mb-7 flex gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-vlearn-line bg-vlearn-soft text-vlearn-blue">
          <BookOpen size={22} />
        </div>
        <div>
          <h2 className="text-xl font-extrabold">Học liệu môn học</h2>
          <p className="mt-3 text-lg font-bold">Course learning materials</p>
          <p className="mt-4 text-sm leading-7 text-vlearn-muted">
            Chương, slide và tài liệu đã upload
            <br />
            Chapters, slides, and uploaded documents
          </p>
        </div>
      </div>

      <div className="space-y-5 border-t border-vlearn-line pt-5">
        <DayCard title="Day 1" subtitle="2 TÀI LIỆU · ACTIVE 2 DOCUMENTS · ACTIVE" open>
          <div className="space-y-3 pt-4">
            {documents.map(([name, meta, active]) => (
              <button
                key={name}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-4 text-left transition ${
                  active
                    ? "border-[#9cb9d8] bg-[#eef5fb] shadow-sm"
                    : "border-vlearn-line bg-white hover:bg-slate-50"
                }`}
              >
                <FileText size={18} className="text-vlearn-blue" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-extrabold">{name}</span>
                  <span className="mt-2 block text-sm text-vlearn-muted">{meta}</span>
                </span>
                {active && <Check size={16} className="text-vlearn-blue" />}
              </button>
            ))}
          </div>
        </DayCard>
        <DayCard title="Day 2" subtitle="1 TÀI LIỆU · ACTIVE 1 DOCUMENT · ACTIVE" />
        <DayCard title="Day 3" subtitle="2 TÀI LIỆU · ACTIVE 2 DOCUMENTS · ACTIVE" />
        <DayCard title="Day 4" subtitle="1 TÀI LIỆU · ACTIVE 1 DOCUMENT · ACTIVE" />
      </div>
    </aside>
  );
}

function DayCard({ title, subtitle, open = false, children }) {
  return (
    <section className="rounded-2xl border border-vlearn-line bg-[#fbfdff] p-4">
      <div className="flex items-start gap-3">
        <div className="mt-1 grid h-5 w-5 place-items-center rounded-full border-2 border-vlearn-blue text-vlearn-blue">
          <ChevronRight size={12} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-extrabold">{title}</h3>
            {open && <span className="rounded-full bg-[#dfeaf4] px-3 py-1 text-xs font-bold text-vlearn-blue">STUDYING</span>}
          </div>
          <p className="mt-2 text-sm font-medium leading-5 text-[#8a9bb3]">{subtitle}</p>
        </div>
        <ChevronDown size={18} className="text-[#8a9bb3]" />
      </div>
      {children}
    </section>
  );
}

function PDFViewer({ quizOpen }) {
  return (
    <section className={`relative min-w-0 flex-1 overflow-hidden transition-all duration-300 ${quizOpen ? "mr-[390px]" : "mr-0"}`}>
      <div className="absolute left-6 right-6 top-5 z-10 flex items-center justify-between rounded-2xl border border-vlearn-line bg-white/95 px-4 py-3 shadow-vlearn backdrop-blur">
        <div className="flex items-center gap-2">
          <ToolbarButton active icon={<Send size={16} />} label="Đọc" />
          <ToolbarButton icon={<PenLine size={16} />} label="Bút" />
          <ToolbarButton icon={<Highlighter size={16} />} label="Highlight" />
          <span className="ml-4 rounded-full bg-vlearn-soft px-4 py-2 text-sm font-extrabold text-vlearn-blue">Trang 1 · 1 note</span>
        </div>
        <div className="flex items-center gap-2">
          <ToolbarButton icon={<ZoomOut size={16} />} label="" />
          <span className="px-2 text-sm font-extrabold">100%</span>
          <ToolbarButton icon={<ZoomIn size={16} />} label="" />
          <div className="mx-2 h-8 w-px bg-vlearn-line" />
          <ToolbarButton icon={<Plus size={17} />} label="" />
          <ToolbarButton icon={<Download size={16} />} label="" />
          <ToolbarButton icon={<RotateCcw size={16} />} label="" muted />
          <ToolbarButton icon={<Trash2 size={16} />} label="" muted />
        </div>
      </div>

      <div className="h-full overflow-y-auto bg-[#eaf1f8] px-8 pb-28 pt-32">
        <SlidePage page={1} title="AI & LLM Foundation" large />
        <SlidePage page={2} title="Instructor" />
        <SlidePage page={3} title="Retrieval Practice" />
      </div>

      <button className="absolute left-0 top-1/2 grid h-20 w-12 -translate-y-1/2 place-items-center rounded-r-2xl border border-vlearn-line bg-white text-[#8aa1bc] shadow-vlearn">
        <ChevronLeft size={28} />
      </button>
      <button className="absolute right-0 top-1/2 grid h-20 w-12 -translate-y-1/2 place-items-center rounded-l-2xl border border-vlearn-line bg-white text-[#8aa1bc] shadow-vlearn">
        <ChevronRight size={28} />
      </button>

      <div className="absolute bottom-0 left-0 right-0 flex h-[86px] items-center justify-center gap-5 border-t border-vlearn-line bg-white/95 shadow-[0_-10px_28px_rgba(15,79,147,0.08)]">
        <button className="grid h-11 w-11 place-items-center rounded-full border border-vlearn-line text-[#91a4bd]">
          <ChevronLeft size={20} />
        </button>
        <div className="grid gap-2 text-sm font-semibold text-vlearn-muted">
          <span>Trang <b className="px-2 text-vlearn-ink">1</b> / 83</span>
          <span>Page <b className="px-2 text-vlearn-ink">21</b> / 83</span>
        </div>
        <button className="grid h-11 w-11 place-items-center rounded-full border border-vlearn-line text-vlearn-blue">
          <ChevronRight size={20} />
        </button>
      </div>
    </section>
  );
}

function ToolbarButton({ icon, label, active = false, muted = false }) {
  return (
    <button
      className={`flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-extrabold ${
        active
          ? "border-[#aac4df] bg-vlearn-soft text-vlearn-blue"
          : muted
            ? "border-vlearn-line bg-white text-[#b5c1d0]"
            : "border-vlearn-line bg-white text-[#40516a]"
      }`}
    >
      {icon}
      {label && <span>{label}</span>}
    </button>
  );
}

function SlidePage({ page, title, large = false }) {
  return (
    <article className="mx-auto mb-9 max-w-[1050px] rounded-[26px] border border-[#9ec5e7] bg-[#fffdf5] p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-[#efe8d7] pb-4 text-xs font-semibold text-[#7894b9]">
        <div className="grid gap-3">
          <span>Trang {page} / 83</span>
          <span>Page {page} / 83</span>
        </div>
        <span>day01_302.pdf</span>
      </div>
      <div className={`${large ? "h-[380px]" : "h-[210px]"} relative mt-5 overflow-hidden rounded-2xl border border-[#c9d7c8] bg-[#96b99f] p-9 shadow`}>
        <p className="mb-16 text-xs font-bold text-[#21334d]">AI IN ACTION - Day {page}</p>
        <h2 className="text-3xl font-black text-[#172033]">{title}</h2>
        <p className="mt-3 text-sm italic text-[#38513f]">
          Bạn đang dùng AI mỗi ngày - nhưng thực sự bên trong nó đang làm gì?
        </p>
        <p className="absolute bottom-9 left-9 text-xs font-semibold text-[#21334d]">Instructor: Mai Anh Nguyen (Blue)</p>
        <p className="absolute right-10 top-1/2 -rotate-24 text-2xl font-black tracking-widest text-[#7ea287]/60">
          VLEARN.EDU.VN
        </p>
      </div>
    </article>
  );
}

function QuizToggle({ isOpen, onClick }) {
  if (isOpen) return null;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="absolute right-4 top-1/2 z-20 flex -translate-y-1/2 items-center gap-2 rounded-l-2xl border border-vlearn-line bg-white px-3 py-4 text-sm font-extrabold text-vlearn-blue shadow-vlearn"
    >
      <BrainCircuit size={20} />
      Quiz
    </motion.button>
  );
}

function QuizSidebar({ onClose }) {
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState([]);

  const score = useMemo(
    () => answers.filter((answer, index) => answer === quizQuestions[index]?.correct).length,
    [answers],
  );
  const completed = started && current >= quizQuestions.length;
  const question = quizQuestions[current];

  function generateQuiz() {
    setStarted(true);
    setCurrent(0);
    setSelected(null);
    setSubmitted(false);
    setAnswers([]);
  }

  function submitAnswer() {
    if (selected === null) return;
    const nextAnswers = [...answers];
    nextAnswers[current] = selected;
    setAnswers(nextAnswers);
    setSubmitted(true);
  }

  function goNext() {
    setCurrent((value) => value + 1);
    setSelected(null);
    setSubmitted(false);
  }

  function goPrevious() {
    if (current === 0) return;
    const previousIndex = current - 1;
    setCurrent(previousIndex);
    setSelected(answers[previousIndex] ?? null);
    setSubmitted(Boolean(answers[previousIndex] !== undefined));
  }

  return (
    <motion.aside
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="absolute right-0 top-0 z-30 flex h-full w-[390px] flex-col border-l border-vlearn-line bg-white shadow-[-12px_0_32px_rgba(15,79,147,0.12)]"
    >
      <div className="flex items-start justify-between border-b border-vlearn-line px-5 py-5">
        <div className="flex gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-vlearn-soft text-vlearn-blue">
            <BrainCircuit size={22} />
          </div>
          <div>
            <h2 className="text-xl font-black">AI Quiz</h2>
            <p className="mt-1 text-sm font-medium text-vlearn-muted">Kiểm tra mức độ hiểu bài</p>
          </div>
        </div>
        <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-vlearn-line text-vlearn-muted">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        {!started && (
          <IntroCard onGenerate={generateQuiz} />
        )}

        {started && !completed && question && (
          <>
            <ProgressBar current={current + 1} total={quizQuestions.length} />
            <QuestionCard
              question={question}
              current={current}
              selected={selected}
              submitted={submitted}
              onSelect={setSelected}
            />
          </>
        )}

        {completed && (
          <ResultCard
            score={score}
            total={quizQuestions.length}
            onRetry={generateQuiz}
          />
        )}
      </div>

      {started && !completed && (
        <div className="border-t border-vlearn-line bg-white px-5 py-4">
          <button
            onClick={submitAnswer}
            disabled={selected === null || submitted}
            className="mb-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-vlearn-blue font-extrabold text-white disabled:cursor-not-allowed disabled:bg-[#b9c8d9]"
          >
            <Check size={18} />
            Submit Answer
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={goPrevious}
              disabled={current === 0}
              className="h-11 rounded-xl border border-vlearn-line font-bold text-vlearn-muted disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={goNext}
              disabled={!submitted}
              className="h-11 rounded-xl border border-vlearn-line font-bold text-vlearn-blue disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </motion.aside>
  );
}

function IntroCard({ onGenerate }) {
  return (
    <section className="rounded-2xl border border-vlearn-line bg-[#fbfdff] p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-2 text-sm font-bold text-emerald-600">
        <Sparkles size={18} />
        Contextual learning assistant
      </div>
      <p className="mb-3 text-xs font-semibold text-vlearn-muted">Ngữ cảnh: Slide trang 1</p>
      <h3 className="text-lg font-black">Tạo quiz từ bài học đang mở</h3>
      <p className="mt-3 text-sm leading-6 text-vlearn-muted">
        Sau khi đọc slide, bấm Generate Quiz để AI tạo 10 câu hỏi ôn tập ngay trong sidebar này.
      </p>
      <button
        onClick={onGenerate}
        className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-vlearn-blue font-extrabold text-white shadow-vlearn"
      >
        <Bot size={18} />
        Generate Quiz
      </button>
    </section>
  );
}

function ProgressBar({ current, total }) {
  return (
    <section className="mb-5 rounded-2xl border border-vlearn-line bg-[#fbfdff] p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-black">Quiz Progress</p>
        <p className="text-sm font-extrabold text-vlearn-blue">{current} / {total} Questions</p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#dce6f1]">
        <div
          className="h-full rounded-full bg-vlearn-blue transition-all duration-300"
          style={{ width: `${(current / total) * 100}%` }}
        />
      </div>
    </section>
  );
}

function QuestionCard({ question, current, selected, submitted, onSelect }) {
  const isCorrect = selected === question.correct;

  return (
    <section className="rounded-2xl border border-vlearn-line bg-white p-5 shadow-sm">
      <p className="mb-2 text-sm font-extrabold text-vlearn-blue">Question {current + 1}</p>
      <h3 className="text-lg font-black leading-7">{question.question}</h3>
      <div className="mt-5 space-y-3">
        {question.options.map((option, index) => {
          const active = selected === index;
          const correct = submitted && index === question.correct;
          const wrong = submitted && active && index !== question.correct;
          return (
            <button
              key={option}
              onClick={() => !submitted && onSelect(index)}
              className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${
                correct
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                  : wrong
                    ? "border-red-300 bg-red-50 text-red-700"
                    : active
                      ? "border-vlearn-blue bg-vlearn-soft text-vlearn-blue"
                      : "border-vlearn-line bg-white hover:bg-slate-50"
              }`}
            >
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-current text-xs font-black">
                {String.fromCharCode(65 + index)}
              </span>
              <span>{option}</span>
            </button>
          );
        })}
      </div>

      {submitted && (
        <div className={`mt-5 rounded-2xl border p-4 ${isCorrect ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
          <p className={`font-black ${isCorrect ? "text-emerald-700" : "text-red-700"}`}>
            {isCorrect ? "Correct" : "Incorrect"}
          </p>
          {!isCorrect && (
            <p className="mt-2 text-sm font-semibold text-vlearn-ink">
              Correct Answer: {String.fromCharCode(65 + question.correct)}
            </p>
          )}
          <p className="mt-3 text-sm font-black">Explanation</p>
          <p className="mt-1 text-sm leading-6 text-vlearn-muted">{question.explanation}</p>
        </div>
      )}
    </section>
  );
}

function ResultCard({ score, total, onRetry }) {
  const accuracy = Math.round((score / total) * 100);

  return (
    <section className="rounded-2xl border border-vlearn-line bg-white p-5 text-center shadow-sm">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-vlearn-soft text-vlearn-blue">
        <Sparkles size={26} />
      </div>
      <h3 className="text-2xl font-black">Quiz Completed</h3>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-vlearn-line bg-[#fbfdff] p-4">
          <p className="text-sm font-bold text-vlearn-muted">Score</p>
          <p className="mt-2 text-2xl font-black text-vlearn-blue">{score} / {total}</p>
        </div>
        <div className="rounded-2xl border border-vlearn-line bg-[#fbfdff] p-4">
          <p className="text-sm font-bold text-vlearn-muted">Accuracy</p>
          <p className="mt-2 text-2xl font-black text-vlearn-blue">{accuracy}%</p>
        </div>
      </div>
      <div className="mt-5 rounded-2xl border border-vlearn-line bg-[#fbfdff] p-4 text-left">
        <p className="font-black">Review Weak Topics</p>
        <ul className="mt-3 space-y-2 text-sm text-vlearn-muted">
          <li>Attention trong Transformers</li>
          <li>Retrieval practice sau buổi học</li>
          <li>Cách đánh giá chất lượng câu hỏi trắc nghiệm</li>
        </ul>
      </div>
      <button
        onClick={onRetry}
        className="mt-5 h-12 w-full rounded-xl bg-vlearn-blue font-extrabold text-white shadow-vlearn"
      >
        Retry Quiz
      </button>
    </section>
  );
}

createRoot(document.getElementById("root")).render(<Layout />);
