

import React, { useMemo, useState, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Bot,
  BrainCircuit,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  FileText,
  Highlighter,
  Loader2,
  MessageSquare,
  MessagesSquare,
  Moon,
  Sun,
  MoreHorizontal,
  PenLine,
  Plus,
  RefreshCw,
  RotateCcw,
  Send,
  Sparkles,
  Tag,
  Trash2,
  Trophy,
  UserRound,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import "./styles.css";
import { lessons, getLessonById } from "./data/lessons.js";
import { generateQuiz } from "./api/quizService.js";
import { sendChatMessage, parseIntent } from "./api/chatService.js";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// ─── i18n: từ điển VI / EN ─────────────────────────────────────────────────────
const translations = {
  vi: {
    hideSidebar: "Ẩn sidebar",
    showSidebar: "Hiện sidebar",
    lessonMaterials: "Học liệu môn học",
    lessonMaterialsDesc: "Chương, slide và tài liệu đã upload",
    filesUnit: "TÀI LIỆU",
    active: "ACTIVE",
    pagesUnit: "trang",
    anonymousStudent: "Sinh viên ẩn danh",
    toolRead: "Đọc",
    toolPen: "Bút",
    toolHighlight: "Highlight",
    page: "Trang",
    note: "note",
    openQuiz: "Mở AI Quiz",
    aiQuiz: "AI Quiz",
    chat: "Chat",
    contextualQuiz: "Contextual AI Quiz",
    questionCountLabel: "Số câu hỏi muốn sinh",
    aiWillGenerate: (n) => `AI sẽ sinh ${n} câu dựa trên nội dung bài giảng thật`,
    generateQuizBtn: (n) => `Sinh Quiz bằng AI (${n} câu)`,
    quickChatHint: "Hỏi AI về bài học hoặc ra lệnh tạo quiz",
    quickChatPlaceholder: 'Ví dụ: "tạo 20 quiz" hoặc hỏi bất kỳ...',
    poweredBy: (model) => `Powered by ${model} via OpenRouter`,
    aiGenerating: "AI đang sinh câu hỏi",
    generatingSteps: [
      "Đọc nội dung bài giảng...",
      "Phân tích các khái niệm chính...",
      (n) => `Sinh ${n} câu hỏi trắc nghiệm...`,
      "Tạo giải thích chi tiết...",
      "Hoàn thiện bộ câu hỏi...",
    ],
    errorTitle: "Không sinh được câu hỏi",
    retry: "Thử lại",
    backToChatQA: "Quay lại Chat Q&A",
    quizProgress: "Quiz Progress",
    correctCount: "đúng",
    questionLabel: "Câu",
    confirmAnswer: "Xác nhận đáp án",
    prev: "← Trước",
    next: "Sau →",
    difficultyEasy: "Dễ",
    difficultyMedium: "Vừa",
    difficultyHard: "Khó",
    correctBanner: "✓ Chính xác!",
    wrongBanner: (letter) => `✗ Chưa đúng — Đáp án: ${letter}`,
    explanationLabel: "Giải thích",
    quizComplete: "Hoàn thành Quiz!",
    scoreLabel: "Điểm",
    accuracyLabel: "Accuracy",
    wrongLabel: "Sai",
    reviewTopics: (n) => `📌 Chủ đề cần ôn lại (${n} câu)`,
    reviewWrong: (n) => `Xem lại câu sai (${n})`,
    yourAnswer: "Bạn chọn",
    notAnswered: "Chưa trả lời",
    correctAnswerLabel: "Đáp án đúng",
    retryQuiz: "Làm lại",
    newQuiz: "Quiz mới",
    chatPlaceholder: 'Hỏi về bài học... hoặc "tạo quiz 20"',
    chatHint: "AI chỉ trả lời trong phạm vi bài học · Enter để gửi",
    gradeExcellent: "Xuất sắc 🏆",
    gradeGood: "Khá tốt 👍",
    gradeAverage: "Trung bình 📚",
    gradeWeak: "Cần ôn thêm 💪",
    undo: "Hoàn tác",
    clearAnnotations: "Xoá ghi chú trang này",
  },
  en: {
    hideSidebar: "Hide sidebar",
    showSidebar: "Show sidebar",
    lessonMaterials: "Course materials",
    lessonMaterialsDesc: "Chapters, slides and uploaded documents",
    filesUnit: "FILES",
    active: "ACTIVE",
    pagesUnit: "pages",
    anonymousStudent: "Anonymous student",
    toolRead: "Read",
    toolPen: "Pen",
    toolHighlight: "Highlight",
    page: "Page",
    note: "note",
    openQuiz: "Open AI Quiz",
    aiQuiz: "AI Quiz",
    chat: "Chat",
    contextualQuiz: "Contextual AI Quiz",
    questionCountLabel: "Number of questions to generate",
    aiWillGenerate: (n) => `AI will generate ${n} questions based on the real lecture content`,
    generateQuizBtn: (n) => `Generate Quiz with AI (${n} questions)`,
    quickChatHint: "Ask the AI about the lesson or request a quiz",
    quickChatPlaceholder: 'E.g. "generate 20 quiz" or ask anything...',
    poweredBy: (model) => `Powered by ${model} via OpenRouter`,
    aiGenerating: "AI is generating questions",
    generatingSteps: [
      "Reading lesson content...",
      "Analyzing key concepts...",
      (n) => `Generating ${n} multiple-choice questions...`,
      "Creating detailed explanations...",
      "Finalizing question set...",
    ],
    errorTitle: "Could not generate questions",
    retry: "Retry",
    backToChatQA: "Back to Chat Q&A",
    quizProgress: "Quiz Progress",
    correctCount: "correct",
    questionLabel: "Question",
    confirmAnswer: "Confirm answer",
    prev: "← Prev",
    next: "Next →",
    difficultyEasy: "Easy",
    difficultyMedium: "Medium",
    difficultyHard: "Hard",
    correctBanner: "✓ Correct!",
    wrongBanner: (letter) => `✗ Incorrect — Answer: ${letter}`,
    explanationLabel: "Explanation",
    quizComplete: "Quiz Complete!",
    scoreLabel: "Score",
    accuracyLabel: "Accuracy",
    wrongLabel: "Wrong",
    reviewTopics: (n) => `📌 Topics to review (${n})`,
    reviewWrong: (n) => `Review wrong answers (${n})`,
    yourAnswer: "You chose",
    notAnswered: "Not answered",
    correctAnswerLabel: "Correct answer",
    retryQuiz: "Retry",
    newQuiz: "New quiz",
    chatPlaceholder: 'Ask about the lesson... or "generate 20 quiz"',
    chatHint: "AI only answers within the lesson scope · Enter to send",
    gradeExcellent: "Excellent 🏆",
    gradeGood: "Good 👍",
    gradeAverage: "Average 📚",
    gradeWeak: "Needs review 💪",
    undo: "Undo",
    clearAnnotations: "Clear this page's annotations",
  },
};

// ─── Theme + Language contexts ─────────────────────────────────────────────────
const ThemeContext = React.createContext({ theme: "light", toggleTheme: () => { } });
const useTheme = () => React.useContext(ThemeContext);

const LanguageContext = React.createContext({ lang: "vi", t: translations.vi, toggleLang: () => { } });
const useLang = () => React.useContext(LanguageContext);

function AppProviders({ children }) {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem("vlearn-theme") || "light"; } catch { return "light"; }
  });
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem("vlearn-lang") || "vi"; } catch { return "vi"; }
  });

  React.useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    try { localStorage.setItem("vlearn-theme", theme); } catch { }
  }, [theme]);

  React.useEffect(() => {
    try { localStorage.setItem("vlearn-lang", lang); } catch { }
  }, [lang]);

  const toggleTheme = useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), []);
  const toggleLang = useCallback(() => setLang((l) => (l === "vi" ? "en" : "vi")), []);

  const themeValue = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);
  const langValue = useMemo(() => ({ lang, t: translations[lang], toggleLang }), [lang, toggleLang]);

  return (
    <ThemeContext.Provider value={themeValue}>
      <LanguageContext.Provider value={langValue}>
        {children}
      </LanguageContext.Provider>
    </ThemeContext.Provider>
  );
}

// ─── Root Layout ──────────────────────────────────────────────────────────────
function Layout() {
  const [quizOpen, setQuizOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeLesson, setActiveLesson] = useState(lessons[0]);
  const { t } = useLang();

  return (
    <div className="h-screen overflow-hidden bg-slate-100 dark:bg-slate-900 text-vlearn-ink dark:text-slate-100 flex flex-col">
      <Header lesson={activeLesson} />
      <div className="flex flex-1 min-h-0">
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 240, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden shrink-0"
            >
              <LeftSidebar
                activeLesson={activeLesson}
                onSelectLesson={(lesson) => {
                  setActiveLesson(lesson);
                  setQuizOpen(false);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="relative z-10 flex items-center justify-center w-5 bg-white dark:bg-slate-800 border-r border-l border-vlearn-line dark:border-slate-700 text-slate-400 hover:text-vlearn-teal hover:bg-vlearn-teal-light dark:hover:bg-vlearn-teal/20 transition-colors shrink-0"
          title={sidebarOpen ? t.hideSidebar : t.showSidebar}
        >
          {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
        </button>

        <main className="relative flex min-w-0 flex-1">
          <PDFViewer lesson={activeLesson} quizOpen={quizOpen} />
          <QuizToggle isOpen={quizOpen} onClick={() => setQuizOpen(true)} />
          <QuizSidebar
            isOpen={quizOpen}
            lesson={activeLesson}
            onClose={() => setQuizOpen(false)}
          />
        </main>
      </div>
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
function Header({ lesson }) {
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLang, t } = useLang();
  return (
    <header className="flex h-[52px] shrink-0 items-center justify-between border-b border-vlearn-line dark:border-slate-700 bg-white dark:bg-slate-800 px-4 gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <button className="grid h-8 w-8 shrink-0 place-items-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2 shrink-0">
          <div className="h-7 w-7 rounded-md bg-vlearn-teal grid place-items-center">
            <span className="text-white font-black text-sm leading-none">V</span>
          </div>
          <span className="text-base font-black tracking-tight">
            <span className="text-vlearn-teal">V</span>Learn
          </span>
        </div>
        <div className="h-5 w-px bg-vlearn-line shrink-0" />
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-7 w-7 shrink-0 grid place-items-center rounded-md bg-vlearn-teal-light dark:bg-vlearn-teal/20 text-vlearn-teal">
            <FileText size={15} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold truncate leading-tight">
              {lesson?.file || "day01_302.pdf"}
            </p>
            <p className="text-xs text-vlearn-muted truncate leading-tight">
              COMP2010 · Lecture_material_ms2039d0
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={toggleLang}
          title={lang === "vi" ? "Switch to English" : "Chuyển sang Tiếng Việt"}
          className="h-8 px-3 rounded-md border border-vlearn-line dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          {lang === "vi" ? "VI" : "EN"}
        </button>
        <button
          onClick={toggleTheme}
          title={theme === "dark" ? "Chế độ sáng" : "Chế độ tối"}
          className="grid h-8 w-8 place-items-center rounded-md border border-vlearn-line dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <div className="flex items-center gap-2 rounded-full border border-vlearn-line dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 ml-1">
          <div className="h-6 w-6 rounded-full bg-vlearn-teal-light dark:bg-vlearn-teal/20 text-vlearn-teal grid place-items-center">
            <UserRound size={14} />
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{t.anonymousStudent}</span>
        </div>
      </div>
    </header>
  );
}

// ─── Left Sidebar ─────────────────────────────────────────────────────────────
function LeftSidebar({ activeLesson, onSelectLesson }) {
  const [openDays, setOpenDays] = useState({ 1: true, 2: true });
  const { t } = useLang();

  // Group lessons by day
  const byDay = useMemo(() => {
    const map = {};
    lessons.forEach((l) => {
      if (!map[l.day]) map[l.day] = [];
      map[l.day].push(l);
    });
    return map;
  }, []);

  return (
    <aside className="h-full w-[240px] overflow-y-auto bg-white dark:bg-slate-800 border-r border-vlearn-line dark:border-slate-700 flex flex-col">
      <div className="px-4 pt-4 pb-3 border-b border-vlearn-line dark:border-slate-700">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen size={15} className="text-vlearn-teal shrink-0" />
          <p className="text-sm font-bold">{t.lessonMaterials}</p>
        </div>
        <p className="text-xs text-vlearn-muted pl-[23px]">
          {t.lessonMaterialsDesc}
        </p>
      </div>

      <div className="flex-1 py-2">
        {Object.keys(byDay).map((day) => (
          <DayItem
            key={day}
            day={Number(day)}
            lessons={byDay[day]}
            isOpen={!!openDays[day]}
            activeLesson={activeLesson}
            onToggle={() => setOpenDays((p) => ({ ...p, [day]: !p[day] }))}
            onSelectLesson={onSelectLesson}
          />
        ))}
      </div>
    </aside>
  );
}

function DayItem({ day, lessons: dayLessons, isOpen, activeLesson, onToggle, onSelectLesson }) {
  const { t } = useLang();
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-4 w-4 rounded-full border-2 border-vlearn-teal text-vlearn-teal grid place-items-center shrink-0">
            <ChevronRight size={9} />
          </div>
          <div className="min-w-0 text-left">
            <p className="text-sm font-bold leading-tight">Day {day}</p>
            <p className="text-[10px] text-vlearn-muted leading-tight mt-0.5">
              {dayLessons.length} {t.filesUnit} · {t.active}
            </p>
          </div>
        </div>
        <div className="text-slate-400 group-hover:text-slate-600 dark:text-slate-300 transition-colors">
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-2 space-y-1">
              {dayLessons.map((lesson) => {
                const isActive = activeLesson?.id === lesson.id;
                return (
                  <button
                    key={lesson.id}
                    onClick={() => onSelectLesson(lesson)}
                    className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors ${isActive
                      ? "bg-vlearn-teal-light dark:bg-vlearn-teal/20 border border-vlearn-teal/30"
                      : "hover:bg-slate-50 dark:hover:bg-slate-700 border border-transparent"
                      }`}
                  >
                    <div className={`h-5 w-5 shrink-0 rounded-full border-2 grid place-items-center ${isActive
                      ? "border-vlearn-teal bg-vlearn-teal text-white"
                      : "border-slate-300 text-slate-300"
                      }`}>
                      {isActive && <Check size={10} strokeWidth={3} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-bold truncate leading-tight ${isActive ? "text-vlearn-teal" : "text-slate-700 dark:text-slate-200"
                        }`}>
                        {lesson.file}
                      </p>
                      <p className="text-[10px] text-vlearn-muted mt-0.5">
                        {lesson.pages} {t.pagesUnit}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── PDF Viewer ───────────────────────────────────────────────────────────────
function PDFViewer({ lesson, quizOpen }) {
  const [zoom, setZoom] = useState(100);
  const [page, setPage] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const { t } = useLang();

  // ── Công cụ Bút / Highlight ──
  const [tool, setTool] = useState("read"); // "read" | "pen" | "highlight"
  // annotations: { [`${lessonId}:${pageNumber}`]: [{ tool, points }] }
  const [annotations, setAnnotations] = useState({});

  const pageKeyFor = (p) => `${lesson?.id || "default"}:${p}`;
  const currentStrokes = annotations[pageKeyFor(page)] || [];

  const addStroke = useCallback((pageNum, stroke) => {
    setAnnotations((prev) => {
      const key = `${lesson?.id || "default"}:${pageNum}`;
      const list = prev[key] || [];
      return { ...prev, [key]: [...list, stroke] };
    });
  }, [lesson?.id]);

  const undoStroke = useCallback(() => {
    setAnnotations((prev) => {
      const key = pageKeyFor(page);
      const list = prev[key] || [];
      if (list.length === 0) return prev;
      return { ...prev, [key]: list.slice(0, -1) };
    });
  }, [lesson?.id, page]);

  const clearStrokes = useCallback(() => {
    setAnnotations((prev) => {
      const key = pageKeyFor(page);
      if (!prev[key] || prev[key].length === 0) return prev;
      return { ...prev, [key]: [] };
    });
  }, [lesson?.id, page]);

  const totalPages = numPages || lesson?.pages || 83;

  const zoomIn = () => setZoom((z) => Math.min(z + 25, 200));
  const zoomOut = () => setZoom((z) => Math.max(z - 25, 50));
  const prevPage = () => setPage((p) => Math.max(p - 1, 1));
  const nextPage = () => setPage((p) => Math.min(p + 1, totalPages));

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPage(1);
  }

  React.useEffect(() => {
    if (!lesson?.pdfFile) setPage(1);
  }, [lesson?.id]);

  return (
    <section
      className={`relative min-w-0 flex-1 flex flex-col overflow-hidden transition-all duration-300 ${quizOpen ? "mr-[390px]" : "mr-0"
        }`}
    >
      {/* Floating toolbar */}
      <div className="absolute left-4 right-4 top-3 z-10 flex items-center justify-between rounded-xl border border-vlearn-line dark:border-slate-700 bg-white/96 dark:bg-slate-900/90 px-3 py-2 shadow-toolbar backdrop-blur-sm">
        <div className="flex items-center gap-1">
          <ToolbarBtn active={tool === "read"} icon={<Send size={14} />} label={t.toolRead} onClick={() => setTool("read")} />
          <ToolbarBtn active={tool === "pen"} icon={<PenLine size={14} />} label={t.toolPen} onClick={() => setTool("pen")} />
          <ToolbarBtn active={tool === "highlight"} icon={<Highlighter size={14} />} label={t.toolHighlight} onClick={() => setTool("highlight")} />
          <ToolbarBtn icon={<MoreHorizontal size={14} />} />
          <div className="mx-2 h-5 w-px bg-vlearn-line dark:bg-slate-700" />
          <span className="rounded-full bg-vlearn-teal-light dark:bg-vlearn-teal/20 px-3 py-1 text-xs font-bold text-vlearn-teal">
            {t.page} {page} · {currentStrokes.length} {t.note}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <ToolbarBtn icon={<ZoomOut size={14} />} onClick={zoomOut} />
          <span className="px-2 text-xs font-bold text-slate-600 dark:text-slate-300 min-w-[40px] text-center">{zoom}%</span>
          <ToolbarBtn icon={<ZoomIn size={14} />} onClick={zoomIn} />
          <div className="mx-2 h-5 w-px bg-vlearn-line dark:bg-slate-700" />
          <ToolbarBtn icon={<Plus size={14} />} />
          <ToolbarBtn icon={<Download size={14} />} />
          <ToolbarBtn icon={<RotateCcw size={14} />} onClick={undoStroke} muted={currentStrokes.length === 0} title={t.undo} />
          <ToolbarBtn icon={<Trash2 size={14} />} onClick={clearStrokes} muted={currentStrokes.length === 0} title={t.clearAnnotations} />
        </div>
      </div>

      {/* Slide / PDF area with Notebook Background */}
      <div
        className="flex-1 overflow-y-auto relative pt-[68px] pb-24"
        style={{
          backgroundColor: '#f8fafc',
          backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #e2e8f0 31px, #e2e8f0 32px)'
        }}
      >
        <div className="mx-auto max-w-[900px] px-8">
          {lesson?.pdfFile ? (
            <Document
              file={lesson.pdfFile}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="w-[800px] h-[600px] flex mx-auto items-center justify-center bg-slate-50 dark:bg-slate-800/60 rounded-2xl ring-1 ring-slate-200/50 text-slate-400 mt-10">
                  <Loader2 className="animate-spin w-8 h-8" />
                </div>
              }
            >
              {Array.from(new Array(numPages || 0), (el, index) => (
                <div key={`page_${index + 1}`} className="mb-16">
                  <div className="flex items-center justify-between py-2 text-[10px] font-bold text-slate-400 mb-4 border-b border-slate-200/50">
                    <span>{t.page} {index + 1} / {totalPages}</span>
                    <span>{lesson?.file || 'day01_302.pdf'}</span>
                  </div>
                  <div className="relative rounded-2xl bg-white dark:bg-slate-800 shadow-xl overflow-hidden ring-1 ring-slate-200/50 mx-auto w-fit min-h-[400px]">
                    <Page
                      pageNumber={index + 1}
                      width={800}
                      scale={zoom / 100}
                      renderTextLayer={true}
                      renderAnnotationLayer={false}
                      className="bg-white dark:bg-slate-800"
                    />
                    {/* Watermark overlay */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10">
                      <span className="transform -rotate-[20deg] text-3xl font-black text-slate-500 dark:text-slate-400 whitespace-nowrap select-none">
                        26AI.KHANHLIN.VINUNI.EDU.VN
                      </span>
                    </div>
                    {/* Lớp vẽ Bút / Highlight */}
                    <DrawingLayer
                      tool={tool}
                      strokes={annotations[pageKeyFor(index + 1)] || []}
                      onAddStroke={(s) => addStroke(index + 1, s)}
                    />
                  </div>
                </div>
              ))}
            </Document>
          ) : (
            <div className="min-h-[400px]">
              <div className="flex items-center justify-between py-2 text-[10px] font-bold text-slate-400 mb-4 border-b border-slate-200/50">
                <span>{t.page} {page} / {totalPages}</span>
                <span>{lesson?.file || 'day01_302.pdf'}</span>
              </div>
              <div className="relative">
                <SlideCard lesson={lesson} page={page} zoom={zoom} />
                <DrawingLayer
                  tool={tool}
                  strokes={currentStrokes}
                  onAddStroke={(s) => addStroke(page, s)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Left/Right arrows */}
      <>
        <button
          onClick={prevPage} disabled={page <= 1}
          className="absolute left-0 top-1/2 -translate-y-1/2 grid h-16 w-9 place-items-center rounded-r-xl border border-vlearn-line dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 shadow-toolbar hover:text-vlearn-teal transition-colors disabled:opacity-30 z-20"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={nextPage} disabled={page >= totalPages}
          className="absolute right-0 top-1/2 -translate-y-1/2 grid h-16 w-9 place-items-center rounded-l-xl border border-vlearn-line dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 shadow-toolbar hover:text-vlearn-teal transition-colors disabled:opacity-30 z-20"
        >
          <ChevronRight size={20} />
        </button>
      </>


      {/* Bottom nav */}
      <div className="absolute bottom-0 left-0 right-0 flex h-[56px] items-center justify-center gap-4 border-t border-vlearn-line dark:border-slate-700 bg-white/96 dark:bg-slate-900/90 backdrop-blur-sm z-20">
        <button onClick={prevPage} disabled={page <= 1}
          className="grid h-8 w-8 place-items-center rounded-full border border-vlearn-line dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-vlearn-teal hover:text-vlearn-teal transition-colors disabled:opacity-30">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          {t.page} <b className="text-slate-900 dark:text-slate-100">{page}</b> / {totalPages}
        </span>
        <button onClick={nextPage} disabled={page >= totalPages}
          className="grid h-8 w-8 place-items-center rounded-full border border-vlearn-line dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-vlearn-teal hover:text-vlearn-teal transition-colors disabled:opacity-30">
          <ChevronRight size={16} />
        </button>
      </div>
    </section>
  );
}

// ─── Drawing Layer (Bút / Highlight overlay) ──────────────────────────────────
function DrawingLayer({ tool, strokes, onAddStroke }) {
  const svgRef = React.useRef(null);
  const [liveStroke, setLiveStroke] = useState(null);
  const drawingIdRef = React.useRef(null);

  const getPoint = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const x = rect.width ? ((e.clientX - rect.left) / rect.width) * 100 : 0;
    const y = rect.height ? ((e.clientY - rect.top) / rect.height) * 100 : 0;
    return { x, y };
  };

  const handlePointerDown = (e) => {
    if (tool === "read") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingIdRef.current = e.pointerId;
    setLiveStroke({ tool, points: [getPoint(e)] });
  };

  const handlePointerMove = (e) => {
    if (tool === "read" || drawingIdRef.current !== e.pointerId) return;
    setLiveStroke((prev) => (prev ? { ...prev, points: [...prev.points, getPoint(e)] } : prev));
  };

  const finishStroke = (e) => {
    if (tool === "read" || drawingIdRef.current === null) return;
    drawingIdRef.current = null;
    setLiveStroke((prev) => {
      if (prev && prev.points.length > 1) onAddStroke(prev);
      return null;
    });
  };

  const renderStroke = (s, i) => {
    const isHighlight = s.tool === "highlight";
    const pts = s.points.map((p) => `${p.x},${p.y}`).join(" ");
    return (
      <polyline
        key={i}
        points={pts}
        fill="none"
        stroke={isHighlight ? "#facc15" : "#ef4444"}
        strokeOpacity={isHighlight ? 0.45 : 0.9}
        strokeWidth={isHighlight ? 2.4 : 0.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={`absolute inset-0 w-full h-full z-10 ${tool === "read" ? "pointer-events-none" : "pointer-events-auto"}`}
      style={{ cursor: tool === "read" ? "default" : tool === "highlight" ? "cell" : "crosshair" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishStroke}
      onPointerLeave={finishStroke}
    >
      {strokes.map(renderStroke)}
      {liveStroke && renderStroke(liveStroke, "live")}
    </svg>
  );
}

function ToolbarBtn({ icon, label, active = false, muted = false, onClick, title }) {
  return (
    <button onClick={onClick} title={title} disabled={muted && !onClick}
      className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition-colors ${active ? "bg-vlearn-teal-light dark:bg-vlearn-teal/20 text-vlearn-teal border border-vlearn-teal/30"
        : muted ? "text-slate-300 hover:text-slate-500 dark:text-slate-400 disabled:cursor-not-allowed"
          : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
        }`}
    >
      {icon}
      {label && <span>{label}</span>}
    </button>
  );
}

function SlideCard({ lesson, page, zoom }) {
  const { t } = useLang();
  const scale = zoom / 100;

  // Lấy danh sách các đoạn trích từ lesson, chia nhỏ thành từng "trang slide"
  const paragraphs = lesson?.excerpts ? lesson.excerpts.split("\n\n").filter(Boolean) : [];
  const contentCount = paragraphs.length;

  // Tính toán nội dung để hiển thị trên trang hiện tại
  // Nếu là trang 1, hiển thị Title Card
  // Các trang sau hiển thị nội dung (lặp lại nếu số trang PDF lớn hơn số nội dung)
  const isTitlePage = page === 1;
  const contentIndex = (page - 2) % (contentCount || 1);
  const slideContent = paragraphs[contentIndex] || "Nội dung đang được cập nhật...";

  return (
    <div
      className="mx-auto max-w-[900px]"
      style={{ transform: `scale(${scale})`, transformOrigin: "top center" }}
    >
      <article className="rounded-2xl border border-slate-200 bg-white dark:bg-slate-800 shadow-sm overflow-hidden aspect-[4/3] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-2.5 bg-white dark:bg-slate-800 shrink-0">
          <span className="text-xs font-semibold text-slate-400">{t.page} {page} / {lesson?.pages || 83}</span>
          <span className="text-xs font-semibold text-slate-400">{lesson?.file}</span>
        </div>

        {isTitlePage ? (
          <div className="relative flex-1 bg-gradient-to-br from-[#2a6e5c] to-[#1a4d40] p-10 flex flex-col justify-center">
            <p className="text-[13px] font-bold text-emerald-300/80 mb-6 uppercase tracking-wider">
              AI IN ACTION — Day {lesson?.day || 1}
            </p>
            <h2 className="text-4xl font-black text-white leading-tight mb-4">
              {lesson?.title || "Foundation: Cách LLM hoạt động"}
            </h2>
            <p className="text-lg italic text-emerald-100/80 mb-8">{lesson?.subtitle}</p>
            <div className="flex flex-wrap gap-2 mt-auto">
              {lesson?.topics?.slice(0, 5).map((t) => (
                <span key={t} className="rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-sm font-bold text-white/90">
                  {t}
                </span>
              ))}
            </div>
            <p className="absolute right-12 top-12 text-3xl font-black tracking-widest text-white/5 pointer-events-none">
              VLEARN
            </p>
            <p className="absolute bottom-8 right-10 text-sm font-semibold text-emerald-200/50">
              Instructor: Mai Anh Nguyen (Blue)
            </p>
          </div>
        ) : (
          <div className="flex-1 bg-white dark:bg-slate-800 p-12 flex flex-col">
            <div className="mb-6 flex items-center gap-3">
              <div className="h-8 w-2 bg-vlearn-teal rounded-full" />
              <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">
                {lesson?.topics?.[contentIndex % (lesson?.topics?.length || 1)] || "Nội dung bài học"}
              </h2>
            </div>

            <div className="flex-1 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 p-8">
              <p className="text-lg text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                {slideContent.replace(/^\[T\d+-\d+\]\s*/, "")}
              </p>
            </div>

            <div className="mt-8 flex justify-between items-center text-xs font-bold text-slate-400">
              <p>Mã trích dẫn: {slideContent.match(/^\[T\d+-\d+\]/) || "[N/A]"}</p>
              <p>Khóa K3 - AI Product Hackathon</p>
            </div>
          </div>
        )}
      </article>
    </div>
  );
}

// ─── Quiz Toggle Button ────────────────────────────────────────────────────────
function QuizToggle({ isOpen, onClick }) {
  const { t } = useLang();
  if (isOpen) return null;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="absolute right-0 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-1.5 rounded-l-xl border border-r-0 border-vlearn-teal/40 bg-white dark:bg-slate-800 px-2.5 py-4 text-vlearn-teal shadow-vlearn hover:bg-vlearn-teal-light dark:hover:bg-vlearn-teal/20 transition-colors"
      title={t.openQuiz}
    >
      <BrainCircuit size={18} />
      <span className="text-[10px] font-black tracking-wider"
        style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}>
        {t.aiQuiz}
      </span>
    </motion.button>
  );
}

// ─── Sidebar Modes ────────────────────────────────────────────────────────────
const SIDEBAR_MODE = { CHAT: "chat", QUIZ: "quiz" };
const QUIZ_STATE = { INTRO: "intro", LOADING: "loading", ACTIVE: "active", RESULT: "result", ERROR: "error" };

// ─── AI Sidebar (2 chế độ: Chat Q&A + Quiz) ──────────────────────────────────
function QuizSidebar({ isOpen, lesson, onClose }) {
  const { t } = useLang();
  const [mode, setMode] = useState(SIDEBAR_MODE.QUIZ);

  // ── Chat state ──
  const [messages, setMessages] = useState([]); // [{role, content, streaming?}]
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = React.useRef(null);
  const inputRef = React.useRef(null);

  // ── Quiz state ──
  const [quizState, setQuizState] = useState(QUIZ_STATE.INTRO);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [questionCount, setQuestionCount] = useState(lesson?.estimatedQuestions || 15);

  // Reset khi đổi bài học
  React.useEffect(() => {
    setMessages([{
      role: "assistant",
      content: `Xin chào! Tôi là AI trợ giảng cho bài **"${lesson?.title}"**.\n\nBạn có thể hỏi tôi bất kỳ câu hỏi nào về nội dung bài học này. Ngoài ra:\n- Gõ **"tạo quiz [số]"** để tôi sinh ngay bộ câu hỏi (ví dụ: "tạo quiz 20")\n- Gõ **"tạo câu hỏi"** để vào giao diện tạo Quiz`,
    }]);
    setMode(SIDEBAR_MODE.CHAT);
    setInputText("");
    setIsSending(false);
    resetQuiz();
  }, [lesson?.id]);

  // Auto scroll chat
  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function resetQuiz() {
    setQuizState(QUIZ_STATE.INTRO);
    setQuestions([]);
    setCurrent(0);
    setSelected(null);
    setSubmitted(false);
    setAnswers([]);
    setQuestionCount(lesson?.estimatedQuestions || 15);
  }


  // ── Gọi AI sinh quiz ──
  const handleGenerateQuiz = useCallback(async (count) => {
    const qCount = count || questionCount;
    setMode(SIDEBAR_MODE.QUIZ);
    setQuizState(QUIZ_STATE.LOADING);
    setErrorMsg("");
    try {
      const qs = await generateQuiz(lesson, qCount);
      setQuestions(qs);
      setCurrent(0);
      setSelected(null);
      setSubmitted(false);
      setAnswers([]);
      setQuizState(QUIZ_STATE.ACTIVE);
    } catch (err) {
      setErrorMsg(err.message || "Có lỗi khi sinh câu hỏi");
      setQuizState(QUIZ_STATE.ERROR);
    }
  }, [lesson, questionCount]);

  // ── Xử lý chat nhanh từ IntroCard (ô chat nhỏ trong màn quiz) ──
  const handleQuickChat = useCallback(async (text) => {
    const lower = text.toLowerCase();
    const quizCountMatch =
      lower.match(/tạo\s*(\d+)\s*(quizz?|câu hỏi|câu)/i) ||
      lower.match(/(\d+)\s*(quizz?|câu hỏi|câu)/i) ||
      lower.match(/cho\s*tôi\s*(\d+)/i);
    if (quizCountMatch) {
      const finalCount = Math.min(Number(quizCountMatch[1]) || 15, 30);
      handleGenerateQuiz(finalCount);
      return;
    }
    const switchKws = ["tạo câu hỏi", "tạo quiz", "tạo quizz", "làm quiz", "bắt đầu quiz", "kiểm tra"];
    if (switchKws.some((kw) => lower.includes(kw))) {
      handleGenerateQuiz(questionCount);
      return;
    }
    // Câu hỏi thường → chuyển sang Chat và điền sẵn câu
    setMessages([]);
    setMode(SIDEBAR_MODE.CHAT);
    setTimeout(() => setInputText(text), 80);
  }, [handleGenerateQuiz, questionCount]);


  // ── Gửi chat message ──
  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isSending) return;

    // Client-side intent detection trước (nhanh hơn)
    const lower = text.toLowerCase();
    const quizCountMatch =
      lower.match(/tạo\s*(\d+)\s*(quizz?|câu hỏi|câu)/i) ||
      lower.match(/(\d+)\s*(quizz?|câu hỏi|câu)/i) ||
      lower.match(/cho\s*tôi\s*(\d+)/i);

    const switchKeywords = ["tạo câu hỏi", "tạo quiz", "tạo quizz", "làm quiz", "làm quizz", "bắt đầu quiz", "vào quiz", "chuyển quiz", "tạo quizzz"];
    const isSwitch = switchKeywords.some((kw) => lower.includes(kw)) && !quizCountMatch;


    const userMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");

    if (quizCountMatch) {
      const count = Math.min(Number(quizCountMatch[1]), 30);
      const finalCount = count > 0 ? count : 15;
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: `Tôi sẽ sinh ngay **${finalCount} câu hỏi** cho bài "${lesson?.title}". Vui lòng đợi nhé! 🧠`,
      }]);
      await new Promise((r) => setTimeout(r, 600));
      handleGenerateQuiz(finalCount);
      return;
    }

    if (isSwitch) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Chuyển sang giao diện Quiz cho bạn nhé! 🎯" }]);
      await new Promise((r) => setTimeout(r, 600));
      setMode(SIDEBAR_MODE.QUIZ);
      return;
    }

    // Gọi AI qua API với streaming
    setIsSending(true);
    const historyForAPI = messages.map((m) => ({ role: m.role, content: m.content }));

    // Thêm tin nhắn trống của AI để stream vào
    setMessages((prev) => [...prev, { role: "assistant", content: "", streaming: true }]);

    try {
      let fullText = "";
      await sendChatMessage(lesson, historyForAPI, text, (chunk) => {
        fullText += chunk;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: fullText, streaming: true };
          return updated;
        });
      });

      // Kiểm tra intent trong response AI
      const intent = parseIntent(fullText);
      if (intent.type === "switch_quiz") {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: "Chuyển sang giao diện Quiz cho bạn nhé! 🎯" };
          return updated;
        });
        await new Promise((r) => setTimeout(r, 600));
        setMode(SIDEBAR_MODE.QUIZ);
      } else if (intent.type === "generate_quiz") {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: `Đang sinh **${intent.count} câu hỏi** cho bài này, chờ tôi một chút nhé! 🧠`,
          };
          return updated;
        });
        await new Promise((r) => setTimeout(r, 600));
        handleGenerateQuiz(intent.count);
      } else {
        // Xoá flag streaming
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: fullText };
          return updated;
        });
      }
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: `⚠️ Xin lỗi, có lỗi xảy ra: ${err.message}. Vui lòng thử lại.`,
        };
        return updated;
      });
    } finally {
      setIsSending(false);
    }
  }, [inputText, isSending, messages, lesson, handleGenerateQuiz]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Quiz handlers ──
  const score = useMemo(
    () => answers.filter((a, i) => a === questions[i]?.correct).length,
    [answers, questions]
  );

  const handleSubmitAnswer = () => {
    if (selected === null) return;
    const next = [...answers];
    next[current] = selected;
    setAnswers(next);
    setSubmitted(true);
  };

  const handleNext = () => {
    const nextIdx = current + 1;
    setCurrent(nextIdx);
    setSelected(null);
    setSubmitted(false);
    if (nextIdx >= questions.length) setQuizState(QUIZ_STATE.RESULT);
  };

  const handlePrev = () => {
    if (current === 0) return;
    const prev = current - 1;
    setCurrent(prev);
    setSelected(answers[prev] ?? null);
    setSubmitted(answers[prev] !== undefined);
  };

  const handleBackToChat = () => {
    setMode(SIDEBAR_MODE.CHAT);
    resetQuiz();
  };

  return (
    <motion.aside
      initial={false}
      animate={{ x: isOpen ? 0 : "100%", boxShadow: isOpen ? "-8px 0 24px rgba(15,23,42,0.08)" : "none" }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="absolute right-0 top-0 z-30 flex h-full w-[390px] flex-col border-l border-vlearn-line dark:border-slate-700 bg-white dark:bg-slate-800"
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-vlearn-line dark:border-slate-700 px-5 py-3.5 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-vlearn-teal-light dark:bg-vlearn-teal/20 text-vlearn-teal shrink-0">
            <BrainCircuit size={18} />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-black leading-tight">{t.aiQuiz}</h2>
            <p className="text-[10px] font-medium text-vlearn-muted truncate">{lesson?.title}</p>
          </div>
        </div>
        <button onClick={onClose}
          className="grid h-8 w-8 place-items-center rounded-full border border-vlearn-line dark:border-slate-700 text-vlearn-muted hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
          <X size={15} />
        </button>
      </div>

      {/* ── Body ── */}
      <AnimatePresence mode="wait" initial={false}>
        {mode === SIDEBAR_MODE.CHAT ? (
          <motion.div
            key="chat"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.18 }}
            className="flex flex-1 flex-col min-h-0"
          >
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.map((msg, i) => (
                <ChatBubble key={i} message={msg} />
              ))}
              {isSending && messages[messages.length - 1]?.streaming !== true && (
                <TypingIndicator />
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-vlearn-line dark:border-slate-700 px-4 py-3 shrink-0 bg-white dark:bg-slate-800">
              <div className="rounded-xl border border-vlearn-line dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex items-end gap-2 px-3 py-2.5 focus-within:border-vlearn-teal/50 focus-within:bg-white dark:bg-slate-800 transition-colors">
                <textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t.chatPlaceholder}
                  rows={1}
                  disabled={isSending}
                  className="flex-1 resize-none bg-transparent text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none leading-5 max-h-[100px]"
                  style={{ height: "auto" }}
                  onInput={(e) => {
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim() || isSending}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-vlearn-teal text-white transition-colors hover:bg-vlearn-teal-dark disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  {isSending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                </button>
              </div>
              <p className="text-[9px] text-vlearn-muted text-center mt-2">
                {t.chatHint}
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.18 }}
            className="flex flex-1 flex-col min-h-0"
          >
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {quizState === QUIZ_STATE.INTRO && (
                <IntroCard
                  lesson={lesson}
                  questionCount={questionCount}
                  onChangeCount={setQuestionCount}
                  onGenerate={() => handleGenerateQuiz()}
                  onQuickChat={handleQuickChat}
                />
              )}
              {quizState === QUIZ_STATE.LOADING && <LoadingCard lesson={lesson} questionCount={questionCount} />}
              {quizState === QUIZ_STATE.ERROR && (
                <ErrorCard message={errorMsg} onRetry={() => handleGenerateQuiz()} onBackToChat={handleBackToChat} />
              )}
              {quizState === QUIZ_STATE.ACTIVE && questions.length > 0 && current < questions.length && (
                <>
                  <ProgressBar current={current + 1} total={questions.length} answers={answers} questions={questions} />
                  <QuestionCard
                    question={questions[current]}
                    current={current}
                    selected={selected}
                    submitted={submitted}
                    onSelect={setSelected}
                  />
                </>
              )}
              {quizState === QUIZ_STATE.RESULT && (
                <ResultCard
                  score={score}
                  total={questions.length}
                  questions={questions}
                  answers={answers}
                  lesson={lesson}
                  onRetry={resetQuiz}
                  onRegenerate={() => handleGenerateQuiz()}
                  onBackToChat={handleBackToChat}
                />
              )}
            </div>

            {/* Quiz action bar */}
            {quizState === QUIZ_STATE.ACTIVE && current < questions.length && (
              <div className="border-t border-vlearn-line dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 shrink-0">
                <button
                  onClick={handleSubmitAnswer}
                  disabled={selected === null || submitted}
                  className="mb-2.5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-vlearn-teal font-extrabold text-white text-sm transition-colors hover:bg-vlearn-teal-dark disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <Check size={16} />
                  {t.confirmAnswer}
                </button>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={handlePrev} disabled={current === 0}
                    className="h-9 rounded-xl border border-vlearn-line dark:border-slate-700 text-sm font-bold text-vlearn-muted hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-40"
                  >
                    {t.prev}
                  </button>
                  <button
                    onClick={handleBackToChat}
                    className="h-9 rounded-xl border border-vlearn-line dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    💬 {t.chat}
                  </button>
                  <button
                    onClick={handleNext} disabled={!submitted}
                    className="h-9 rounded-xl border border-vlearn-teal/50 text-sm font-bold text-vlearn-teal hover:bg-vlearn-teal-light dark:hover:bg-vlearn-teal/20 transition-colors disabled:opacity-40"
                  >
                    {t.next}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}

// ─── Chat Bubble ──────────────────────────────────────────────────────────────
function ChatBubble({ message }) {
  const isUser = message.role === "user";
  // Render markdown đơn giản
  const renderText = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br/>");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {!isUser && (
        <div className="h-7 w-7 shrink-0 rounded-full bg-vlearn-teal-light dark:bg-vlearn-teal/20 grid place-items-center text-vlearn-teal mt-0.5">
          <Bot size={14} />
        </div>
      )}
      <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs leading-5 ${isUser
        ? "bg-vlearn-teal text-white rounded-tr-sm"
        : "bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-tl-sm"
        }`}>
        <span dangerouslySetInnerHTML={{ __html: renderText(message.content) }} />
        {message.streaming && (
          <span className="inline-block w-1 h-3.5 bg-current ml-0.5 animate-pulse rounded-sm" />
        )}
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-2.5">
      <div className="h-7 w-7 shrink-0 rounded-full bg-vlearn-teal-light dark:bg-vlearn-teal/20 grid place-items-center text-vlearn-teal">
        <Bot size={14} />
      </div>
      <div className="bg-slate-100 dark:bg-slate-900 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 items-center">
        {[0, 1, 2].map((i) => (
          <motion.div key={i}
            className="w-1.5 h-1.5 rounded-full bg-slate-400"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Intro Card ───────────────────────────────────────────────────────────────
function IntroCard({ lesson, questionCount, onChangeCount, onGenerate, onQuickChat }) {
  const { t } = useLang();
  const options = [10, 15, 20, 25, 30];
  const [quickInput, setQuickInput] = useState("");
  const [isChatSending, setIsChatSending] = useState(false);

  const handleQuickSend = async () => {
    const text = quickInput.trim();
    if (!text || isChatSending) return;
    setQuickInput("");
    if (onQuickChat) onQuickChat(text);
  };

  return (
    <section className="space-y-4">
      {/* Lesson info */}
      <div className="rounded-2xl border border-vlearn-teal/30 bg-vlearn-teal-soft p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={14} className="text-vlearn-teal" />
          <span className="text-xs font-bold text-vlearn-teal">{t.contextualQuiz}</span>
        </div>
        <h3 className="text-sm font-black leading-snug mb-1">{lesson?.title}</h3>
        <p className="text-xs text-vlearn-muted mb-3">{lesson?.subtitle}</p>
        <div className="flex flex-wrap gap-1.5">
          {lesson?.topics?.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 rounded-full bg-vlearn-teal-light dark:bg-vlearn-teal/20 border border-vlearn-teal/20 px-2 py-0.5 text-[10px] font-bold text-vlearn-teal">
              <Tag size={8} />
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Số câu hỏi */}
      <div className="rounded-2xl border border-vlearn-line dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
        <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-3">{t.questionCountLabel}</p>
        <div className="flex gap-2 flex-wrap">
          {options.map((n) => (
            <button key={n} onClick={() => onChangeCount(n)}
              className={`h-9 w-12 rounded-xl border text-sm font-black transition-colors ${questionCount === n
                ? "border-vlearn-teal bg-vlearn-teal text-white"
                : "border-vlearn-line dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-vlearn-teal/50 hover:text-vlearn-teal"
                }`}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-vlearn-muted mt-2">
          {t.aiWillGenerate(questionCount)}
        </p>
      </div>

      <button onClick={onGenerate}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-vlearn-teal font-extrabold text-white text-sm shadow-vlearn hover:bg-vlearn-teal-dark transition-colors">
        <BrainCircuit size={18} />
        {t.generateQuizBtn(questionCount)}
      </button>

      {/* Quick AI Chat */}
      <div className="rounded-2xl border border-vlearn-line dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
          <MessageSquare size={10} />
          {t.quickChatHint}
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleQuickSend()}
            placeholder={t.quickChatPlaceholder}
            className="flex-1 text-[11px] rounded-lg border border-vlearn-line dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 py-2 outline-none focus:border-vlearn-teal/50 focus:bg-white dark:bg-slate-800 placeholder:text-slate-400 transition-colors"
          />
          <button
            onClick={handleQuickSend}
            disabled={!quickInput.trim()}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-vlearn-teal text-white hover:bg-vlearn-teal-dark transition-colors disabled:bg-slate-200 disabled:cursor-not-allowed"
          >
            <Send size={13} />
          </button>
        </div>
      </div>

      <p className="text-[9px] text-center text-vlearn-muted">
        {t.poweredBy(import.meta.env.VITE_LLM_MODEL || "Llama 3.1")}
      </p>
    </section>
  );
}


// ─── Loading Card ─────────────────────────────────────────────────────────────
function LoadingCard({ lesson, questionCount }) {
  const { t } = useLang();
  const [step, setStep] = useState(0);
  const steps = t.generatingSteps.map((s) => (typeof s === "function" ? s(questionCount) : s));
  React.useEffect(() => {
    const t = setInterval(() => setStep((s) => (s < steps.length - 1 ? s + 1 : s)), 1800);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
      <div className="relative">
        <div className="h-16 w-16 rounded-full bg-vlearn-teal-light dark:bg-vlearn-teal/20 flex items-center justify-center">
          <BrainCircuit size={28} className="text-vlearn-teal" />
        </div>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-vlearn-teal" />
      </div>
      <div>
        <p className="text-sm font-black text-slate-800 dark:text-slate-100 mb-1">{t.aiGenerating}</p>
        <p className="text-xs text-vlearn-muted max-w-[240px]">{lesson?.title}</p>
      </div>
      <AnimatePresence mode="wait">
        <motion.p key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          className="text-xs font-semibold text-vlearn-teal bg-vlearn-teal-light dark:bg-vlearn-teal/20 rounded-full px-4 py-2">
          {steps[step]}
        </motion.p>
      </AnimatePresence>
      <div className="flex gap-1 mt-2">
        {steps.map((_, i) => (
          <div key={i} className={`h-1.5 w-8 rounded-full transition-colors duration-500 ${i <= step ? "bg-vlearn-teal" : "bg-slate-200"}`} />
        ))}
      </div>
    </div>
  );
}

// ─── Error Card ───────────────────────────────────────────────────────────────
function ErrorCard({ message, onRetry, onBackToChat }) {
  const { t } = useLang();
  return (
    <div className="space-y-3">
      <button onClick={onBackToChat}
        className="flex items-center gap-1.5 text-xs font-bold text-vlearn-muted hover:text-vlearn-teal transition-colors">
        <ArrowLeft size={12} />
        {t.backToChatQA}
      </button>
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center space-y-3">
        <div className="h-12 w-12 rounded-full bg-red-100 text-red-500 grid place-items-center mx-auto">
          <AlertCircle size={22} />
        </div>
        <p className="text-sm font-black text-red-700">{t.errorTitle}</p>
        <p className="text-xs text-red-600 leading-5">{message}</p>
        <button onClick={onRetry}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-red-600 font-bold text-white text-sm hover:bg-red-700 transition-colors">
          <RefreshCw size={14} />
          {t.retry}
        </button>
      </div>
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ current, total, answers, questions }) {
  const { t } = useLang();
  const correct = answers.filter((a, i) => a === questions[i]?.correct).length;
  const answered = answers.filter((a) => a !== undefined).length;
  return (
    <section className="mb-4 rounded-2xl border border-vlearn-line dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
      <div className="mb-2.5 flex items-center justify-between">
        <p className="text-sm font-black">{t.quizProgress}</p>
        <div className="flex items-center gap-3 text-xs font-bold">
          {answered > 0 && <span className="text-emerald-600">{correct} {t.correctCount}</span>}
          <span className="text-vlearn-teal">{current} / {total}</span>
        </div>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-900">
        <motion.div className="h-full rounded-full bg-vlearn-teal"
          animate={{ width: `${(current / total) * 100}%` }} transition={{ duration: 0.3 }} />
      </div>
      <div className="flex gap-1 mt-3 flex-wrap">
        {Array.from({ length: total }).map((_, i) => {
          const ans = answers[i];
          const isAnswered = ans !== undefined;
          const isCorrect = isAnswered && ans === questions[i]?.correct;
          const isCurrent = i === current - 1;
          return (
            <div key={i} className={`h-2 w-2 rounded-full transition-colors ${isCurrent ? "bg-vlearn-teal ring-2 ring-vlearn-teal/30"
              : isCorrect ? "bg-emerald-500"
                : isAnswered ? "bg-red-400"
                  : "bg-slate-200"
              }`} />
          );
        })}
      </div>
    </section>
  );
}

// ─── Question Card ────────────────────────────────────────────────────────────
function QuestionCard({ question, current, selected, submitted, onSelect }) {
  const { t } = useLang();
  const isCorrect = selected === question.correct;
  const difficultyColor = {
    easy: "text-emerald-600 bg-emerald-50",
    medium: "text-amber-600 bg-amber-50",
    hard: "text-red-600 bg-red-50",
  }[question.difficulty] || "text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60";
  return (
    <section className="rounded-2xl border border-vlearn-line dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-vlearn-teal">{t.questionLabel} {current + 1}</p>
        <div className="flex items-center gap-2">
          {question.topic && (
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 rounded-full px-2 py-0.5">{question.topic}</span>
          )}
          {question.difficulty && (
            <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${difficultyColor}`}>
              {question.difficulty === "easy" ? t.difficultyEasy : question.difficulty === "medium" ? t.difficultyMedium : t.difficultyHard}
            </span>
          )}
        </div>
      </div>
      <h3 className="text-sm font-black leading-6 mb-4">{question.question}</h3>
      <div className="space-y-2">
        {question.options.map((option, index) => {
          const isActive = selected === index;
          const isCorrectAnswer = submitted && index === question.correct;
          const isWrong = submitted && isActive && index !== question.correct;
          return (
            <motion.button key={index} onClick={() => !submitted && onSelect(index)}
              whileTap={!submitted ? { scale: 0.98 } : {}}
              className={`flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition-colors ${isCorrectAnswer ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                : isWrong ? "border-red-300 bg-red-50 text-red-700"
                  : isActive ? "border-vlearn-teal/50 bg-vlearn-teal-light dark:bg-vlearn-teal/20 text-vlearn-teal"
                    : submitted ? "border-vlearn-line dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 cursor-default"
                      : "border-vlearn-line dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                }`}>
              <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px] font-black ${isCorrectAnswer ? "border-emerald-400 bg-emerald-100"
                : isWrong ? "border-red-400 bg-red-100"
                  : isActive ? "border-vlearn-teal bg-vlearn-teal text-white"
                    : "border-current"
                }`}>
                {isCorrectAnswer ? <Check size={10} strokeWidth={3} />
                  : isWrong ? <X size={10} strokeWidth={3} />
                    : String.fromCharCode(65 + index)}
              </span>
              <span className="leading-5 flex-1">{option}</span>
            </motion.button>
          );
        })}
      </div>
      <AnimatePresence>
        {submitted && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={`mt-4 rounded-xl border p-3 ${isCorrect ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
            <p className={`text-xs font-black mb-1 ${isCorrect ? "text-emerald-700" : "text-amber-700"}`}>
              {isCorrect ? t.correctBanner : t.wrongBanner(String.fromCharCode(65 + question.correct))}
            </p>
            <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mt-2">{t.explanationLabel}</p>
            <p className="text-[11px] leading-5 text-vlearn-muted mt-0.5">{question.explanation}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ─── Result Card ──────────────────────────────────────────────────────────────
function ResultCard({ score, total, questions, answers, lesson, onRetry, onRegenerate, onBackToChat }) {
  const { t } = useLang();
  const accuracy = Math.round((score / total) * 100);
  const [showReview, setShowReview] = useState(false);
  const grade =
    accuracy >= 90 ? { label: t.gradeExcellent, color: "text-emerald-600" }
      : accuracy >= 75 ? { label: t.gradeGood, color: "text-blue-600" }
        : accuracy >= 60 ? { label: t.gradeAverage, color: "text-amber-600" }
          : { label: t.gradeWeak, color: "text-red-600" };
  const wrongQuestions = questions.filter((q, i) => answers[i] !== q.correct);
  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-vlearn-line dark:border-slate-700 bg-white dark:bg-slate-800 p-5 text-center">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-vlearn-teal-light dark:bg-vlearn-teal/20 text-vlearn-teal">
          <Trophy size={24} />
        </div>
        <h3 className="text-lg font-black">{t.quizComplete}</h3>
        <p className={`text-sm font-bold mt-1 ${grade.color}`}>{grade.label}</p>
        <div className="mt-5 grid grid-cols-3 gap-3">
          {[[t.scoreLabel, `${score}/${total}`, "text-vlearn-teal"], [t.accuracyLabel, `${accuracy}%`, "text-vlearn-teal"], [t.wrongLabel, total - score, "text-red-500"]].map(([label, val, color]) => (
            <div key={label} className="rounded-xl border border-vlearn-line dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-3">
              <p className="text-[10px] font-bold text-vlearn-muted">{label}</p>
              <p className={`mt-1 text-xl font-black ${color}`}>{val}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 h-2 rounded-full bg-slate-100 dark:bg-slate-900 overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${accuracy >= 75 ? "bg-emerald-500" : accuracy >= 60 ? "bg-amber-500" : "bg-red-500"}`}
            initial={{ width: 0 }} animate={{ width: `${accuracy}%` }} transition={{ duration: 0.8, ease: "easeOut" }} />
        </div>
      </div>

      {wrongQuestions.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-black text-amber-800 mb-2">{t.reviewTopics(wrongQuestions.length)}</p>
          <ul className="space-y-1">
            {[...new Set(wrongQuestions.map((q) => q.topic))].map((topic) => (
              <li key={topic} className="text-xs text-amber-700 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />{topic}
              </li>
            ))}
          </ul>
        </div>
      )}

      {wrongQuestions.length > 0 && (
        <div>
          <button onClick={() => setShowReview((v) => !v)}
            className="w-full flex items-center justify-between rounded-xl border border-vlearn-line dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <span>{t.reviewWrong(wrongQuestions.length)}</span>
            {showReview ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <AnimatePresence>
            {showReview && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="space-y-3 mt-2">
                  {wrongQuestions.map((q) => {
                    const origIdx = questions.indexOf(q);
                    const userAnswer = answers[origIdx];
                    return (
                      <div key={q.id} className="rounded-xl border border-red-200 bg-red-50 p-3">
                        <p className="text-[10px] font-black text-red-600 mb-1">{t.questionLabel} {origIdx + 1} · {q.topic}</p>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-2">{q.question}</p>
                        <p className="text-[10px] text-red-600 mb-1">
                          {t.yourAnswer}: {userAnswer !== undefined ? `${String.fromCharCode(65 + userAnswer)}. ${q.options[userAnswer]}` : t.notAnswered}
                        </p>
                        <p className="text-[10px] text-emerald-700 mb-2">
                          {t.correctAnswerLabel}: {String.fromCharCode(65 + q.correct)}. {q.options[q.correct]}
                        </p>
                        <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-4">{q.explanation}</p>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <button onClick={onBackToChat}
          className="h-10 rounded-xl border border-vlearn-line dark:border-slate-700 font-bold text-slate-500 dark:text-slate-400 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
          💬 {t.chat}
        </button>
        <button onClick={onRetry}
          className="h-10 rounded-xl border border-vlearn-line dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
          {t.retryQuiz}
        </button>
        <button onClick={onRegenerate}
          className="h-10 rounded-xl bg-vlearn-teal font-bold text-white text-xs hover:bg-vlearn-teal-dark transition-colors shadow-vlearn">
          {t.newQuiz}
        </button>
      </div>
    </section>
  );
}

// ─── Mount ─────────────────────────────────────────────────────────────────────
createRoot(document.getElementById("root")).render(
  <AppProviders>
    <Layout />
  </AppProviders>
);