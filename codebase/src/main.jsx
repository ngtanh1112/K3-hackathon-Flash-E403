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
  Moon,
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
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// ─── Root Layout ──────────────────────────────────────────────────────────────
function Layout() {
  const [quizOpen, setQuizOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeLesson, setActiveLesson] = useState(lessons[0]);

  return (
    <div className="h-screen overflow-hidden bg-slate-100 text-vlearn-ink flex flex-col">
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
          className="relative z-10 flex items-center justify-center w-5 bg-white border-r border-l border-vlearn-line text-slate-400 hover:text-vlearn-teal hover:bg-vlearn-teal-light transition-colors shrink-0"
          title={sidebarOpen ? "Ẩn sidebar" : "Hiện sidebar"}
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
  return (
    <header className="flex h-[52px] shrink-0 items-center justify-between border-b border-vlearn-line bg-white px-4 gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <button className="grid h-8 w-8 shrink-0 place-items-center rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
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
          <div className="h-7 w-7 shrink-0 grid place-items-center rounded-md bg-vlearn-teal-light text-vlearn-teal">
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
        <button className="h-8 px-3 rounded-md border border-vlearn-line text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
          VI
        </button>
        <button className="grid h-8 w-8 place-items-center rounded-md border border-vlearn-line text-slate-500 hover:bg-slate-50 transition-colors">
          <Moon size={16} />
        </button>
        <div className="flex items-center gap-2 rounded-full border border-vlearn-line bg-slate-50 px-3 py-1.5 ml-1">
          <div className="h-6 w-6 rounded-full bg-vlearn-teal-light text-vlearn-teal grid place-items-center">
            <UserRound size={14} />
          </div>
          <span className="text-xs font-bold text-slate-700">Sinh viên ẩn danh</span>
        </div>
      </div>
    </header>
  );
}

// ─── Left Sidebar ─────────────────────────────────────────────────────────────
function LeftSidebar({ activeLesson, onSelectLesson }) {
  const [openDays, setOpenDays] = useState({ 1: true, 2: true });

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
    <aside className="h-full w-[240px] overflow-y-auto bg-white border-r border-vlearn-line flex flex-col">
      <div className="px-4 pt-4 pb-3 border-b border-vlearn-line">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen size={15} className="text-vlearn-teal shrink-0" />
          <p className="text-sm font-bold">Học liệu môn học</p>
        </div>
        <p className="text-xs text-vlearn-muted pl-[23px]">
          Chương, slide và tài liệu đã upload
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
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors group"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-4 w-4 rounded-full border-2 border-vlearn-teal text-vlearn-teal grid place-items-center shrink-0">
            <ChevronRight size={9} />
          </div>
          <div className="min-w-0 text-left">
            <p className="text-sm font-bold leading-tight">Day {day}</p>
            <p className="text-[10px] text-vlearn-muted leading-tight mt-0.5">
              {dayLessons.length} TÀI LIỆU · ACTIVE
            </p>
          </div>
        </div>
        <div className="text-slate-400 group-hover:text-slate-600 transition-colors">
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
                    className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors ${
                      isActive
                        ? "bg-vlearn-teal-light border border-vlearn-teal/30"
                        : "hover:bg-slate-50 border border-transparent"
                    }`}
                  >
                    <div className={`h-5 w-5 shrink-0 rounded-full border-2 grid place-items-center ${
                      isActive
                        ? "border-vlearn-teal bg-vlearn-teal text-white"
                        : "border-slate-300 text-slate-300"
                    }`}>
                      {isActive && <Check size={10} strokeWidth={3} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-bold truncate leading-tight ${
                        isActive ? "text-vlearn-teal" : "text-slate-700"
                      }`}>
                        {lesson.file}
                      </p>
                      <p className="text-[10px] text-vlearn-muted mt-0.5">
                        {lesson.pages} trang
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
      className={`relative min-w-0 flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
        quizOpen ? "mr-[390px]" : "mr-0"
      }`}
    >
      {/* Floating toolbar */}
      <div className="absolute left-4 right-4 top-3 z-10 flex items-center justify-between rounded-xl border border-vlearn-line bg-white/96 px-3 py-2 shadow-toolbar backdrop-blur-sm">
        <div className="flex items-center gap-1">
          <ToolbarBtn active icon={<Send size={14} />} label="Đọc" />
          <ToolbarBtn icon={<PenLine size={14} />} label="Bút" />
          <ToolbarBtn icon={<Highlighter size={14} />} label="Highlight" />
          <ToolbarBtn icon={<MoreHorizontal size={14} />} />
          <div className="mx-2 h-5 w-px bg-vlearn-line" />
          <span className="rounded-full bg-vlearn-teal-light px-3 py-1 text-xs font-bold text-vlearn-teal">
            Trang {page} · 1 note
          </span>
        </div>
        <div className="flex items-center gap-1">
          <ToolbarBtn icon={<ZoomOut size={14} />} onClick={zoomOut} />
          <span className="px-2 text-xs font-bold text-slate-600 min-w-[40px] text-center">{zoom}%</span>
          <ToolbarBtn icon={<ZoomIn size={14} />} onClick={zoomIn} />
          <div className="mx-2 h-5 w-px bg-vlearn-line" />
          <ToolbarBtn icon={<Plus size={14} />} />
          <ToolbarBtn icon={<Download size={14} />} />
          <ToolbarBtn icon={<RotateCcw size={14} />} muted />
          <ToolbarBtn icon={<Trash2 size={14} />} muted />
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
                <div className="w-[800px] h-[600px] flex mx-auto items-center justify-center bg-slate-50 rounded-2xl ring-1 ring-slate-200/50 text-slate-400 mt-10">
                  <Loader2 className="animate-spin w-8 h-8" />
                </div>
              }
            >
              {Array.from(new Array(numPages || 0), (el, index) => (
                <div key={`page_${index + 1}`} className="mb-16">
                  <div className="flex items-center justify-between py-2 text-[10px] font-bold text-slate-400 mb-4 border-b border-slate-200/50">
                    <span>Trang {index + 1} / {totalPages}</span>
                    <span>{lesson?.file || 'day01_302.pdf'}</span>
                  </div>
                  <div className="relative rounded-2xl bg-white shadow-xl overflow-hidden ring-1 ring-slate-200/50 mx-auto w-fit min-h-[400px]">
                    <Page 
                      pageNumber={index + 1} 
                      width={800} 
                      scale={zoom / 100}
                      renderTextLayer={true}
                      renderAnnotationLayer={false}
                      className="bg-white"
                    />
                    {/* Watermark overlay */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10">
                      <span className="transform -rotate-[20deg] text-3xl font-black text-slate-500 whitespace-nowrap select-none">
                        26AI.KHANHLIN.VINUNI.EDU.VN
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </Document>
          ) : (
            <div className="min-h-[400px]">
              <div className="flex items-center justify-between py-2 text-[10px] font-bold text-slate-400 mb-4 border-b border-slate-200/50">
                <span>Trang {page} / {totalPages}</span>
                <span>{lesson?.file || 'day01_302.pdf'}</span>
              </div>
              <SlideCard lesson={lesson} page={page} zoom={zoom} />
            </div>
          )}
        </div>
      </div>

      {/* Left/Right arrows */}
        <>
          <button
            onClick={prevPage} disabled={page <= 1}
            className="absolute left-0 top-1/2 -translate-y-1/2 grid h-16 w-9 place-items-center rounded-r-xl border border-vlearn-line bg-white text-slate-400 shadow-toolbar hover:text-vlearn-teal transition-colors disabled:opacity-30 z-20"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={nextPage} disabled={page >= totalPages}
            className="absolute right-0 top-1/2 -translate-y-1/2 grid h-16 w-9 place-items-center rounded-l-xl border border-vlearn-line bg-white text-slate-400 shadow-toolbar hover:text-vlearn-teal transition-colors disabled:opacity-30 z-20"
          >
            <ChevronRight size={20} />
          </button>
        </>


      {/* Bottom nav */}
        <div className="absolute bottom-0 left-0 right-0 flex h-[56px] items-center justify-center gap-4 border-t border-vlearn-line bg-white/96 backdrop-blur-sm z-20">
          <button onClick={prevPage} disabled={page <= 1}
            className="grid h-8 w-8 place-items-center rounded-full border border-vlearn-line text-slate-500 hover:border-vlearn-teal hover:text-vlearn-teal transition-colors disabled:opacity-30">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold text-slate-600">
            Trang <b className="text-slate-900">{page}</b> / {totalPages}
          </span>
          <button onClick={nextPage} disabled={page >= totalPages}
            className="grid h-8 w-8 place-items-center rounded-full border border-vlearn-line text-slate-500 hover:border-vlearn-teal hover:text-vlearn-teal transition-colors disabled:opacity-30">
            <ChevronRight size={16} />
          </button>
        </div>
    </section>
  );
}

function ToolbarBtn({ icon, label, active = false, muted = false, onClick }) {
  return (
    <button onClick={onClick}
      className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition-colors ${
        active ? "bg-vlearn-teal-light text-vlearn-teal border border-vlearn-teal/30"
        : muted ? "text-slate-300 hover:text-slate-500"
        : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      {icon}
      {label && <span>{label}</span>}
    </button>
  );
}

function SlideCard({ lesson, page, zoom }) {
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
      <article className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden aspect-[4/3] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-2.5 bg-white shrink-0">
          <span className="text-xs font-semibold text-slate-400">Trang {page} / {lesson?.pages || 83}</span>
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
          <div className="flex-1 bg-white p-12 flex flex-col">
            <div className="mb-6 flex items-center gap-3">
              <div className="h-8 w-2 bg-vlearn-teal rounded-full" />
              <h2 className="text-2xl font-black text-slate-800">
                {lesson?.topics?.[contentIndex % (lesson?.topics?.length || 1)] || "Nội dung bài học"}
              </h2>
            </div>
            
            <div className="flex-1 rounded-xl bg-slate-50 border border-slate-100 p-8">
              <p className="text-lg text-slate-700 leading-relaxed font-medium">
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
  if (isOpen) return null;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="absolute right-0 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-1.5 rounded-l-xl border border-r-0 border-vlearn-teal/40 bg-white px-2.5 py-4 text-vlearn-teal shadow-vlearn hover:bg-vlearn-teal-light transition-colors"
      title="Mở AI Quiz"
    >
      <BrainCircuit size={18} />
      <span className="text-[10px] font-black tracking-wider"
        style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}>
        AI Quiz
      </span>
    </motion.button>
  );
}

// ─── Quiz States ──────────────────────────────────────────────────────────────
const QUIZ_STATE = {
  INTRO: "intro",
  LOADING: "loading",
  ACTIVE: "active",
  RESULT: "result",
  ERROR: "error",
};

// ─── Quiz Sidebar ──────────────────────────────────────────────────────────────
function QuizSidebar({ isOpen, lesson, onClose }) {
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
    setQuizState(QUIZ_STATE.INTRO);
    setQuestions([]);
    setCurrent(0);
    setSelected(null);
    setSubmitted(false);
    setAnswers([]);
    setQuestionCount(lesson?.estimatedQuestions || 15);
  }, [lesson?.id]);

  const score = useMemo(
    () => answers.filter((a, i) => a === questions[i]?.correct).length,
    [answers, questions]
  );

  const completed = quizState === QUIZ_STATE.ACTIVE && current >= questions.length && questions.length > 0;

  const handleGenerate = useCallback(async () => {
    setQuizState(QUIZ_STATE.LOADING);
    setErrorMsg("");
    try {
      const qs = await generateQuiz(lesson, questionCount);
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

  const handleSubmit = () => {
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
    if (nextIdx >= questions.length) {
      setQuizState(QUIZ_STATE.RESULT);
    }
  };

  const handlePrev = () => {
    if (current === 0) return;
    const prev = current - 1;
    setCurrent(prev);
    setSelected(answers[prev] ?? null);
    setSubmitted(answers[prev] !== undefined);
  };

  const handleRetry = () => {
    setQuizState(QUIZ_STATE.INTRO);
    setQuestions([]);
    setCurrent(0);
    setSelected(null);
    setSubmitted(false);
    setAnswers([]);
  };

  return (
    <motion.aside
      initial={false}
      animate={{ 
        x: isOpen ? 0 : "100%",
        boxShadow: isOpen ? "-8px 0 24px rgba(15,23,42,0.08)" : "none" 
      }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="absolute right-0 top-0 z-30 flex h-full w-[390px] flex-col border-l border-vlearn-line bg-white"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-vlearn-line px-5 py-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-vlearn-teal-light text-vlearn-teal">
            <BrainCircuit size={20} />
          </div>
          <div>
            <h2 className="text-base font-black">AI Quiz</h2>
            <p className="text-xs font-medium text-vlearn-muted">
              {lesson?.title || "Kiểm tra mức độ hiểu bài"}
            </p>
          </div>
        </div>
        <button onClick={onClose}
          className="grid h-8 w-8 place-items-center rounded-full border border-vlearn-line text-vlearn-muted hover:bg-slate-50 hover:text-slate-700 transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {quizState === QUIZ_STATE.INTRO && (
          <IntroCard
            lesson={lesson}
            questionCount={questionCount}
            onChangeCount={setQuestionCount}
            onGenerate={handleGenerate}
          />
        )}
        {quizState === QUIZ_STATE.LOADING && <LoadingCard lesson={lesson} questionCount={questionCount} />}
        {quizState === QUIZ_STATE.ERROR && (
          <ErrorCard message={errorMsg} onRetry={handleGenerate} />
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
            onRetry={handleRetry}
            onRegenerate={handleGenerate}
          />
        )}
      </div>

      {/* Bottom action bar — only during active quiz */}
      {quizState === QUIZ_STATE.ACTIVE && current < questions.length && (
        <div className="border-t border-vlearn-line bg-white px-4 py-3 shrink-0">
          <button
            onClick={handleSubmit}
            disabled={selected === null || submitted}
            className="mb-2.5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-vlearn-teal font-extrabold text-white text-sm transition-colors hover:bg-vlearn-teal-dark disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Check size={16} />
            Xác nhận đáp án
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handlePrev} disabled={current === 0}
              className="h-9 rounded-xl border border-vlearn-line text-sm font-bold text-vlearn-muted hover:bg-slate-50 transition-colors disabled:opacity-40"
            >
              ← Câu trước
            </button>
            <button
              onClick={handleNext} disabled={!submitted}
              className="h-9 rounded-xl border border-vlearn-teal/50 text-sm font-bold text-vlearn-teal hover:bg-vlearn-teal-light transition-colors disabled:opacity-40"
            >
              Câu sau →
            </button>
          </div>
        </div>
      )}
    </motion.aside>
  );
}

// ─── Intro Card ───────────────────────────────────────────────────────────────
function IntroCard({ lesson, questionCount, onChangeCount, onGenerate }) {
  const options = [10, 15, 20, 25, 30];
  return (
    <section className="space-y-4">
      {/* Lesson info */}
      <div className="rounded-2xl border border-vlearn-teal/30 bg-vlearn-teal-soft p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={14} className="text-vlearn-teal" />
          <span className="text-xs font-bold text-vlearn-teal">Contextual AI Quiz</span>
        </div>
        <h3 className="text-sm font-black leading-snug mb-1">{lesson?.title}</h3>
        <p className="text-xs text-vlearn-muted mb-3">{lesson?.subtitle}</p>
        <div className="flex flex-wrap gap-1.5">
          {lesson?.topics?.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 rounded-full bg-vlearn-teal-light border border-vlearn-teal/20 px-2 py-0.5 text-[10px] font-bold text-vlearn-teal">
              <Tag size={8} />
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Số câu hỏi */}
      <div className="rounded-2xl border border-vlearn-line bg-white p-4">
        <p className="text-xs font-bold text-slate-700 mb-3">Số câu hỏi muốn sinh</p>
        <div className="flex gap-2 flex-wrap">
          {options.map((n) => (
            <button
              key={n}
              onClick={() => onChangeCount(n)}
              className={`h-9 w-12 rounded-xl border text-sm font-black transition-colors ${
                questionCount === n
                  ? "border-vlearn-teal bg-vlearn-teal text-white"
                  : "border-vlearn-line text-slate-600 hover:border-vlearn-teal/50 hover:text-vlearn-teal"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-vlearn-muted mt-2">
          AI sẽ sinh {questionCount} câu hỏi dựa trên nội dung bài giảng thật
        </p>
      </div>

      {/* Generate button */}
      <button
        onClick={onGenerate}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-vlearn-teal font-extrabold text-white text-sm shadow-vlearn hover:bg-vlearn-teal-dark transition-colors"
      >
        <Bot size={18} />
        Sinh Quiz bằng AI ({questionCount} câu)
      </button>

      <p className="text-[10px] text-center text-vlearn-muted">
        Powered by {import.meta.env.VITE_LLM_MODEL || "Llama 3.1"} via OpenRouter
      </p>
    </section>
  );
}

// ─── Loading Card ─────────────────────────────────────────────────────────────
function LoadingCard({ lesson, questionCount }) {
  const [step, setStep] = useState(0);
  const steps = [
    "Đọc nội dung bài giảng...",
    "Phân tích các khái niệm chính...",
    `Sinh ${questionCount} câu hỏi trắc nghiệm...`,
    "Tạo giải thích chi tiết...",
    "Hoàn thiện bộ câu hỏi...",
  ];

  React.useEffect(() => {
    const timer = setInterval(() => {
      setStep((s) => (s < steps.length - 1 ? s + 1 : s));
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
      <div className="relative">
        <div className="h-16 w-16 rounded-full bg-vlearn-teal-light flex items-center justify-center">
          <BrainCircuit size={28} className="text-vlearn-teal" />
        </div>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-vlearn-teal"
        />
      </div>
      <div>
        <p className="text-sm font-black text-slate-800 mb-1">AI đang sinh câu hỏi</p>
        <p className="text-xs text-vlearn-muted max-w-[240px]">{lesson?.title}</p>
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={step}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="text-xs font-semibold text-vlearn-teal bg-vlearn-teal-light rounded-full px-4 py-2"
        >
          {steps[step]}
        </motion.p>
      </AnimatePresence>
      <div className="flex gap-1 mt-2">
        {steps.map((_, i) => (
          <div key={i} className={`h-1.5 w-8 rounded-full transition-colors duration-500 ${
            i <= step ? "bg-vlearn-teal" : "bg-slate-200"
          }`} />
        ))}
      </div>
    </div>
  );
}

// ─── Error Card ───────────────────────────────────────────────────────────────
function ErrorCard({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center space-y-3">
      <div className="h-12 w-12 rounded-full bg-red-100 text-red-500 grid place-items-center mx-auto">
        <AlertCircle size={22} />
      </div>
      <p className="text-sm font-black text-red-700">Không sinh được câu hỏi</p>
      <p className="text-xs text-red-600 leading-5">{message}</p>
      <button
        onClick={onRetry}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-red-600 font-bold text-white text-sm hover:bg-red-700 transition-colors"
      >
        <RefreshCw size={14} />
        Thử lại
      </button>
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ current, total, answers, questions }) {
  const correct = answers.filter((a, i) => a === questions[i]?.correct).length;
  const answered = answers.filter((a) => a !== undefined).length;

  return (
    <section className="mb-4 rounded-2xl border border-vlearn-line bg-white p-4">
      <div className="mb-2.5 flex items-center justify-between">
        <p className="text-sm font-black">Quiz Progress</p>
        <div className="flex items-center gap-3 text-xs font-bold">
          {answered > 0 && (
            <span className="text-emerald-600">{correct} đúng</span>
          )}
          <span className="text-vlearn-teal">{current} / {total}</span>
        </div>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <motion.div
          className="h-full rounded-full bg-vlearn-teal"
          animate={{ width: `${(current / total) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      {/* Dot indicators */}
      <div className="flex gap-1 mt-3 flex-wrap">
        {Array.from({ length: total }).map((_, i) => {
          const ans = answers[i];
          const isAnswered = ans !== undefined;
          const isCorrect = isAnswered && ans === questions[i]?.correct;
          const isCurrent = i === current - 1;
          return (
            <div key={i} className={`h-2 w-2 rounded-full transition-colors ${
              isCurrent ? "bg-vlearn-teal ring-2 ring-vlearn-teal/30"
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
  const isCorrect = selected === question.correct;
  const difficultyColor = {
    easy: "text-emerald-600 bg-emerald-50",
    medium: "text-amber-600 bg-amber-50",
    hard: "text-red-600 bg-red-50",
  }[question.difficulty] || "text-slate-600 bg-slate-50";

  return (
    <section className="rounded-2xl border border-vlearn-line bg-white p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-vlearn-teal">Câu {current + 1}</p>
        <div className="flex items-center gap-2">
          {question.topic && (
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">
              {question.topic}
            </span>
          )}
          {question.difficulty && (
            <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${difficultyColor}`}>
              {question.difficulty === "easy" ? "Dễ" : question.difficulty === "medium" ? "Vừa" : "Khó"}
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
            <motion.button
              key={index}
              onClick={() => !submitted && onSelect(index)}
              whileTap={!submitted ? { scale: 0.98 } : {}}
              className={`flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition-colors ${
                isCorrectAnswer ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                : isWrong ? "border-red-300 bg-red-50 text-red-700"
                : isActive ? "border-vlearn-teal/50 bg-vlearn-teal-light text-vlearn-teal"
                : submitted ? "border-vlearn-line bg-slate-50 text-slate-500 cursor-default"
                : "border-vlearn-line bg-white hover:bg-slate-50 text-slate-700 cursor-pointer"
              }`}
            >
              <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px] font-black ${
                isCorrectAnswer ? "border-emerald-400 bg-emerald-100"
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

      {/* Explanation */}
      <AnimatePresence>
        {submitted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-4 rounded-xl border p-3 ${
              isCorrect ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"
            }`}
          >
            <p className={`text-xs font-black mb-1 ${isCorrect ? "text-emerald-700" : "text-amber-700"}`}>
              {isCorrect ? "✓ Chính xác!" : `✗ Chưa đúng — Đáp án: ${String.fromCharCode(65 + question.correct)}`}
            </p>
            <p className="text-[11px] font-bold text-slate-600 mt-2">Giải thích</p>
            <p className="text-[11px] leading-5 text-vlearn-muted mt-0.5">{question.explanation}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ─── Result Card ──────────────────────────────────────────────────────────────
function ResultCard({ score, total, questions, answers, lesson, onRetry, onRegenerate }) {
  const accuracy = Math.round((score / total) * 100);
  const [showReview, setShowReview] = useState(false);

  const grade =
    accuracy >= 90 ? { label: "Xuất sắc 🏆", color: "text-emerald-600" }
    : accuracy >= 75 ? { label: "Khá tốt 👍", color: "text-blue-600" }
    : accuracy >= 60 ? { label: "Trung bình 📚", color: "text-amber-600" }
    : { label: "Cần ôn thêm 💪", color: "text-red-600" };

  const wrongQuestions = questions.filter((q, i) => answers[i] !== q.correct);

  return (
    <section className="space-y-4">
      {/* Score summary */}
      <div className="rounded-2xl border border-vlearn-line bg-white p-5 text-center">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-vlearn-teal-light text-vlearn-teal">
          <Trophy size={24} />
        </div>
        <h3 className="text-lg font-black">Hoàn thành Quiz!</h3>
        <p className={`text-sm font-bold mt-1 ${grade.color}`}>{grade.label}</p>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-vlearn-line bg-slate-50 p-3">
            <p className="text-[10px] font-bold text-vlearn-muted">Điểm</p>
            <p className="mt-1 text-xl font-black text-vlearn-teal">{score}/{total}</p>
          </div>
          <div className="rounded-xl border border-vlearn-line bg-slate-50 p-3">
            <p className="text-[10px] font-bold text-vlearn-muted">Accuracy</p>
            <p className="mt-1 text-xl font-black text-vlearn-teal">{accuracy}%</p>
          </div>
          <div className="rounded-xl border border-vlearn-line bg-slate-50 p-3">
            <p className="text-[10px] font-bold text-vlearn-muted">Sai</p>
            <p className="mt-1 text-xl font-black text-red-500">{total - score}</p>
          </div>
        </div>

        {/* Progress bar kết quả */}
        <div className="mt-4 h-2 rounded-full bg-slate-100 overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${accuracy >= 75 ? "bg-emerald-500" : accuracy >= 60 ? "bg-amber-500" : "bg-red-500"}`}
            initial={{ width: 0 }}
            animate={{ width: `${accuracy}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Weak topics */}
      {wrongQuestions.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-black text-amber-800 mb-2">
            📌 Chủ đề cần ôn lại ({wrongQuestions.length} câu)
          </p>
          <ul className="space-y-1">
            {[...new Set(wrongQuestions.map((q) => q.topic))].map((t) => (
              <li key={t} className="text-xs text-amber-700 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Review wrong answers */}
      {wrongQuestions.length > 0 && (
        <div>
          <button
            onClick={() => setShowReview((v) => !v)}
            className="w-full flex items-center justify-between rounded-xl border border-vlearn-line bg-white px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <span>Xem lại câu sai ({wrongQuestions.length})</span>
            {showReview ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <AnimatePresence>
            {showReview && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-3 mt-2">
                  {wrongQuestions.map((q, qi) => {
                    const origIdx = questions.indexOf(q);
                    const userAnswer = answers[origIdx];
                    return (
                      <div key={q.id} className="rounded-xl border border-red-200 bg-red-50 p-3">
                        <p className="text-[10px] font-black text-red-600 mb-1">
                          Câu {origIdx + 1} · {q.topic}
                        </p>
                        <p className="text-xs font-bold text-slate-800 mb-2">{q.question}</p>
                        <p className="text-[10px] text-red-600 mb-1">
                          Bạn chọn: {userAnswer !== undefined ? `${String.fromCharCode(65 + userAnswer)}. ${q.options[userAnswer]}` : "Chưa trả lời"}
                        </p>
                        <p className="text-[10px] text-emerald-700 mb-2">
                          Đáp án đúng: {String.fromCharCode(65 + q.correct)}. {q.options[q.correct]}
                        </p>
                        <p className="text-[10px] text-slate-600 leading-4">{q.explanation}</p>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onRetry}
          className="h-10 rounded-xl border border-vlearn-line font-bold text-slate-600 text-sm hover:bg-slate-50 transition-colors"
        >
          Làm lại
        </button>
        <button
          onClick={onRegenerate}
          className="h-10 rounded-xl bg-vlearn-teal font-bold text-white text-sm hover:bg-vlearn-teal-dark transition-colors shadow-vlearn"
        >
          Quiz mới
        </button>
      </div>
    </section>
  );
}

// ─── Mount ─────────────────────────────────────────────────────────────────────
createRoot(document.getElementById("root")).render(<Layout />);
