import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { AnimatePresence, motion } from "framer-motion";
import JSZip from "jszip";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
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
  ScanSearch,
  Search,
  Send,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import "./styles.css";

const STORAGE_KEY = "vlearn.materials.v1";
const TUTOR_CHAT_STORAGE_KEY = "vlearn.tutorChats.v1";
const QUIZ_SETTINGS_STORAGE_KEY = "vlearn.quizSettings.v1";
const QUIZ_ATTEMPTS_STORAGE_KEY = "vlearn.quizAttempts.v1";
const VISUAL_TRACE_STORAGE_KEY = "vlearn.visualTraces.v1";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

function isTemporaryFileUrl(url) {
  return (
    typeof url === "string" &&
    (url.startsWith("data:") || url.startsWith("blob:"))
  );
}

const builtinMaterialIds = new Set([
  "public-ai-llm-foundation",
  "public-problem-discovery",
]);
const legacyDefaultMaterialIds = new Set([
  "day01-ai-foundation",
  "day01-retrieval-practice",
  "day02-prompting",
]);

const defaultMaterials = [
  {
    id: "public-ai-llm-foundation",
    day: "Day 1",
    name: "AI LLM foundation.pdf",
    pages: 29,
    type: "application/pdf",
    url: encodeURI("/AI LLM foundation.pdf"),
    uploadedBy: "VLearn",
    uploadedAt: "2026-07-30T00:00:00.000Z",
    description: "AI & LLM Foundation",
    notes:
      "Attention, Transformer, prompt, retrieval practice, đánh giá câu hỏi trắc nghiệm.",
  },
  {
    id: "public-problem-discovery",
    day: "Day 2",
    name: "X\u00e1c \u0111\u1ecbnh b\u00e0i to\u00e1n cho AI.pdf",
    pages: 29,
    type: "application/pdf",
    url: "/X%C3%A1c%20%C4%91%E1%BB%8Bnh%20b%C3%A0i%20to%C3%A1n%20cho%20AI.pdf",
    uploadedBy: "VLearn",
    uploadedAt: "2026-07-30T00:00:00.000Z",
    description: "X\u00e1c \u0111\u1ecbnh b\u00e0i to\u00e1n cho AI",
    notes:
      "Ôn tập chủ động giúp học viên nhớ lâu hơn so với chỉ đọc lại slide.",
  },
  {
    id: "day02-prompting",
    day: "Day 2",
    name: "day02_prompting.pdf",
    pages: 41,
    type: "application/pdf",
    url: "",
    uploadedBy: "VLearn",
    uploadedAt: "2026-07-30T00:00:00.000Z",
    description: "Prompting fundamentals",
    notes:
      "Prompt rõ mục tiêu, bối cảnh, định dạng đầu ra và tiêu chí đánh giá.",
  },
];

function mergeDefaultMaterials(savedMaterials = []) {
  const savedById = new Map(savedMaterials.map((item) => [item.id, item]));
  const availableDefaults = defaultMaterials.filter((item) => item.url);
  const mergedDefaults = availableDefaults.map((item) => ({
    ...item,
    ...(savedById.get(item.id) || {}),
    url: item.url,
    needsReupload: false,
  }));
  const customMaterials = savedMaterials.filter(
    (item) =>
      !builtinMaterialIds.has(item.id) &&
      !legacyDefaultMaterialIds.has(item.id),
  );
  return [...mergedDefaults, ...customMaterials];
}

function loadMaterials() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const normalized = saved.map((item) => ({
      ...item,
      url: isTemporaryFileUrl(item.url) ? "" : item.url,
      needsReupload: Boolean(isTemporaryFileUrl(item.url)),
    }));
    return mergeDefaultMaterials(normalized);
  } catch {
    return mergeDefaultMaterials();
  }
}

function saveMaterials(materials) {
  const metadataOnly = materials.map((item) => ({
    ...item,
    url: isTemporaryFileUrl(item.url) ? "" : item.url,
    needsReupload: item.needsReupload || Boolean(isTemporaryFileUrl(item.url)),
  }));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(metadataOnly));
  } catch {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Browser storage may be unavailable; the in-memory demo state still works.
    }
  }
}

function getInitialTutorMessage() {
  return {
    role: "assistant",
    content:
      "Xin chào! Mình là VLearn Tutor. Bạn có thể hỏi tự do về slide đang mở, hoặc dùng Visual Explain để khoanh vùng rồi hỏi tiếp tại đây.",
  };
}

function createTutorSession(title = "Đoạn chat mới") {
  const now = new Date().toISOString();
  return {
    id: `chat-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title,
    createdAt: now,
    updatedAt: now,
    messages: [getInitialTutorMessage()],
  };
}

function loadTutorChats(materialId) {
  try {
    const allChats = JSON.parse(
      localStorage.getItem(TUTOR_CHAT_STORAGE_KEY) || "{}",
    );
    const saved = allChats[materialId];
    if (saved?.sessions?.length) return saved;
  } catch {
    // Ignore unavailable browser storage.
  }
  const session = createTutorSession();
  return { activeSessionId: session.id, sessions: [session] };
}

function saveTutorChats(materialId, state) {
  try {
    const allChats = JSON.parse(
      localStorage.getItem(TUTOR_CHAT_STORAGE_KEY) || "{}",
    );
    allChats[materialId] = state;
    localStorage.setItem(TUTOR_CHAT_STORAGE_KEY, JSON.stringify(allChats));
  } catch {
    // Chat still works in memory if localStorage is unavailable.
  }
}

const defaultQuizSettings = {
  easy: 40,
  medium: 40,
  hard: 20,
};

function loadQuizSettings() {
  try {
    return {
      ...defaultQuizSettings,
      ...JSON.parse(localStorage.getItem(QUIZ_SETTINGS_STORAGE_KEY) || "{}"),
    };
  } catch {
    return defaultQuizSettings;
  }
}

function saveQuizSettings(settings) {
  try {
    localStorage.setItem(QUIZ_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Quiz settings still work in memory.
  }
}

function summarizeQuestionForHistory(question) {
  if (typeof question === "string") return question;
  return `${question?.testedConcept ? `Concept: ${question.testedConcept} | ` : ""}${question?.question || ""} | ${(question?.options || []).join(" / ")} | ${question?.explanation || ""}`;
}

function getQuestionConceptKey(question) {
  const correctOption = question?.options?.[question?.correct] || "";
  const text = `${question?.testedConcept || ""} ${question?.question || ""} ${correctOption} ${question?.sourcePage || ""}`;
  return tokenizeForMatch(text).slice(0, 14).sort().join(" ");
}

function questionSimilarityScore(a = "", b = "") {
  const aTokens = new Set(tokenizeForMatch(a));
  const bTokens = new Set(tokenizeForMatch(b));
  if (!aTokens.size || !bTokens.size) return 0;
  let overlap = 0;
  aTokens.forEach((token) => {
    if (bTokens.has(token)) overlap += 1;
  });
  return overlap / Math.min(aTokens.size, bTokens.size);
}

function isSimilarQuestion(question, history = []) {
  const text =
    typeof question === "string"
      ? cleanQuizText(question).toLowerCase()
      : cleanQuizText(summarizeQuestionForHistory(question)).toLowerCase();
  if (!text) return false;
  return history.some((item) => {
    if (typeof question !== "string" && typeof item !== "string") {
      const currentKey = getQuestionConceptKey(question);
      const previousKey = getQuestionConceptKey(item);
      if (currentKey && previousKey && currentKey === previousKey) return true;
    }
    const previous = cleanQuizText(
      summarizeQuestionForHistory(item),
    ).toLowerCase();
    if (!previous) return false;
    return (
      previous.includes(text.slice(0, 70)) ||
      text.includes(previous.slice(0, 70)) ||
      questionSimilarityScore(text, previous) >= 0.72
    );
  });
}

function mergeUniqueQuizQuestions(existing, incoming, targetCount) {
  const next = [...existing];
  incoming.forEach((question) => {
    if (next.length >= targetCount) return;
    if (!isSimilarQuestion(question, next)) next.push(question);
  });
  return next;
}

function trimQuizPhrase(value = "", maxLength = 110) {
  const text = cleanQuizText(value);
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  return cleanQuizText(cut.slice(0, Math.max(20, cut.lastIndexOf(" "))));
}

function splitFocusConcept(value = "") {
  const text = cleanQuizText(value)
    .replace(/[“”]/g, '"')
    .replace(/[ˮ]/g, '"');
  const [termPart, ...rest] = text.split(/\s+[—–-]\s+|:\s+/);
  const term = trimQuizPhrase(termPart || text, 58);
  const detail = trimQuizPhrase(rest.join(" - ") || text, 130);
  return { term, detail };
}

function makePedagogicFallbackQuestion(focus, index = 0, difficulty = "medium") {
  const { term, detail } = splitFocusConcept(focus);
  const normalized = `${term} ${detail}`.toLowerCase();

  const byConcept = [
    {
      match: /machine learning|học từ dữ liệu|viết luật tay/i,
      question: "Machine learning khác cách viết luật tay ở điểm nào?",
      correct: "Hệ thống học quy luật từ dữ liệu thay vì con người viết sẵn từng luật",
      distractors: [
        "Con người phải viết đầy đủ mọi quy tắc xử lý bằng tay",
        "Mô hình chỉ ghi nhớ ví dụ mà không khái quát được quy luật",
        "Hệ thống chỉ dùng để tạo văn bản, hình ảnh hoặc âm thanh mới",
      ],
    },
    {
      match: /deep learning|mạng nơ-ron|neural/i,
      question: "Đặc điểm nào mô tả đúng Deep Learning trong bài học?",
      correct: "Dùng mạng nơ-ron nhiều tầng để tự học đặc trưng từ dữ liệu",
      distractors: [
        "Chỉ là cách viết luật thủ công với nhiều điều kiện hơn",
        "Là khái niệm bao trùm toàn bộ AI và Machine Learning",
        "Chỉ dùng để lưu trữ dữ liệu, không tham gia học mẫu",
      ],
    },
    {
      match: /generative ai|genai|ai tạo sinh|nội dung mới/i,
      question: "Generative AI được dùng để làm gì theo bài học?",
      correct: "Tạo ra nội dung mới dựa trên mẫu và ngữ cảnh đã học",
      distractors: [
        "Chỉ phân loại dữ liệu đã có mà không tạo đầu ra mới",
        "Chỉ thay thế bước xác định bài toán của người học",
        "Chỉ hoạt động khi mọi câu trả lời đã được viết sẵn",
      ],
    },
    {
      match: /llm|large language model|mô hình ngôn ngữ/i,
      question: "LLM có vai trò gì trong bức tranh AI được trình bày?",
      correct: "Là mô hình ngôn ngữ lớn xử lý và sinh nội dung dạng ngôn ngữ",
      distractors: [
        "Là tên gọi chung cho mọi hệ thống AI trong mọi lĩnh vực",
        "Là cơ sở dữ liệu tĩnh chỉ dùng để lưu văn bản",
        "Là phương pháp viết luật tay cho từng câu trả lời",
      ],
    },
    {
      match: /ai|artificial intelligence|trí tuệ nhân tạo|chiếc ô/i,
      question: "Trong quan hệ giữa AI, ML, Deep Learning và LLM, AI được hiểu như thế nào?",
      correct: "AI là khái niệm bao trùm các hệ thống có yếu tố thông minh",
      distractors: [
        "AI là một nhánh nhỏ hơn Deep Learning",
        "AI chỉ là tên gọi khác của một mô hình ngôn ngữ lớn",
        "AI chỉ xuất hiện khi hệ thống tạo được hình ảnh mới",
      ],
    },
    {
      match: /problem statement|xác định.*bài toán|bài toán gốc|thu hẹp/i,
      question: "Vì sao cần xác định rõ Problem Statement trước khi chọn giải pháp AI?",
      correct: "Để hiểu đúng vấn đề cần giải quyết trước khi quyết định dùng công nghệ nào",
      distractors: [
        "Để bỏ qua bước tìm hiểu người dùng và đi thẳng vào triển khai",
        "Để chứng minh mọi bài toán đều cần mô hình AI phức tạp",
        "Để chọn công nghệ mới nhất trước khi biết vấn đề thật sự",
      ],
    },
  ];

  const matched = byConcept.find((item) => item.match.test(normalized));
  if (matched) {
    const choice = makeMultipleChoice(matched.correct, shuffleItems(matched.distractors));
    return {
      questionStem: matched.question,
      question: matched.question,
      testedConcept: trimQuizPhrase(term || matched.correct, 60),
      options: choice.options,
      correct: choice.correct,
      explanation: `${matched.correct}; đây là ý trọng tâm được nêu trong tài liệu. [Trang 1]`,
      sourcePage: 1,
      sourceLabel: "Bài học",
      difficulty,
      personalized: false,
      visualTrace: null,
    };
  }

  const stems = [
    `Ý nào diễn giải đúng nhất về "${term}"?`,
    `Người học cần hiểu điều gì về "${term}"?`,
    `Nhận định nào đúng với trọng tâm "${term}"?`,
    `Nếu áp dụng nội dung "${term}", cách hiểu nào là phù hợp nhất?`,
  ];
  const correct = detail && detail !== term ? detail : term;
  const distractors = [
    "Bỏ qua việc hiểu vấn đề và chọn công nghệ trước",
    "Xem mọi bài toán đều cần dùng mô hình AI phức tạp",
    "Đánh giá thành công chỉ bằng độ mới của công nghệ",
    "Dựa vào cảm tính thay vì căn cứ trong tài liệu",
  ];
  const choice = makeMultipleChoice(trimQuizPhrase(correct, 120), shuffleItems(distractors));
  return {
    questionStem: stems[index % stems.length],
    question: stems[index % stems.length],
    testedConcept: trimQuizPhrase(term, 60),
    options: choice.options,
    correct: choice.correct,
    explanation: `Đáp án đúng diễn giải trực tiếp trọng tâm "${trimQuizPhrase(correct, 100)}". [Trang 1]`,
    sourcePage: 1,
    sourceLabel: "Bài học",
    difficulty,
    personalized: false,
    visualTrace: null,
  };
}

function forceFillQuizQuestions(
  material,
  questions,
  targetCount,
  previousQuestions = [],
  quizSettings = defaultQuizSettings,
) {
  let next = mergeUniqueQuizQuestions([], questions, targetCount);
  let guard = 0;
  while (next.length < targetCount && guard < 6) {
    const fallback = normalizeQuizQuestions(
      makeContentFallbackQuestions(
        material,
        Math.max(targetCount - next.length, 4),
        [...previousQuestions, ...next.map(summarizeQuestionForHistory)],
        quizSettings,
      ),
      Math.max(targetCount - next.length, 4),
      material,
    );
    fallback.forEach((item) => {
      if (next.length < targetCount && !isSimilarQuestion(item, next)) {
        next.push(item);
      }
    });
    guard += 1;
  }
  if (next.length < targetCount) {
    const fallback = normalizeQuizQuestions(
      makeContentFallbackQuestions(material, targetCount * 2, [], quizSettings),
      targetCount * 2,
      material,
    );
    fallback.forEach((item) => {
      if (next.length < targetCount && !isSimilarQuestion(item, next)) {
        next.push(item);
      }
    });
  }
  const focusItems = getQuizFocusItems(getMaterialQuizContext(material)).filter(
    isUsableQuizFocus,
  );
  const emergencyFocus = [
    "Xác định rõ bài toán trước khi chọn giải pháp AI",
    "Hiểu mục tiêu học tập và các khái niệm cốt lõi trong bài",
    "Phân biệt đúng vai trò của các thành phần trong hệ thống AI",
    "Nhận diện sai lầm thường gặp khi áp dụng AI vào sản phẩm",
    "Liên hệ nội dung bài học với tình huống ứng dụng thực tế",
  ];
  const difficultyPlan = buildDifficultyPlan(targetCount, quizSettings);
  const difficultyQueue = [
    ...Array(difficultyPlan.easy).fill("easy"),
    ...Array(difficultyPlan.medium).fill("medium"),
    ...Array(difficultyPlan.hard).fill("hard"),
  ];
  while (next.length < targetCount) {
    const focusPool = focusItems.length ? focusItems : emergencyFocus;
    const focus = cleanQuizText(focusPool[next.length % focusPool.length]);
    const draft = makePedagogicFallbackQuestion(
      focus,
      next.length,
      difficultyQueue[next.length] || "medium",
    );
    const normalizedDraft = normalizeQuizQuestions([draft], 1, material)[0];
    if (normalizedDraft && !isSimilarQuestion(normalizedDraft, next)) {
      next.push(normalizedDraft);
    } else {
      const emergency = makePedagogicFallbackQuestion(
        emergencyFocus[next.length % emergencyFocus.length],
        next.length + 1,
        difficultyQueue[next.length] || "medium",
      );
      next.push(normalizeQuizQuestions([emergency], 1, material)[0] || emergency);
    }
  }
  return next.slice(0, targetCount);
}

function loadQuizAttempts(materialId) {
  try {
    const allAttempts = JSON.parse(
      localStorage.getItem(QUIZ_ATTEMPTS_STORAGE_KEY) || "{}",
    );
    return allAttempts[materialId] || [];
  } catch {
    return [];
  }
}

function saveQuizAttempt(materialId, attempt) {
  try {
    const allAttempts = JSON.parse(
      localStorage.getItem(QUIZ_ATTEMPTS_STORAGE_KEY) || "{}",
    );
    const attempts = [...(allAttempts[materialId] || []), attempt].slice(-20);
    allAttempts[materialId] = attempts;
    localStorage.setItem(
      QUIZ_ATTEMPTS_STORAGE_KEY,
      JSON.stringify(allAttempts),
    );
    return attempts;
  } catch {
    // Attempts are optional; quiz still works without localStorage.
    return [];
  }
}

function deleteQuizAttempt(materialId, attemptId) {
  try {
    const allAttempts = JSON.parse(
      localStorage.getItem(QUIZ_ATTEMPTS_STORAGE_KEY) || "{}",
    );
    allAttempts[materialId] = (allAttempts[materialId] || []).filter(
      (attempt) => attempt.id !== attemptId,
    );
    localStorage.setItem(
      QUIZ_ATTEMPTS_STORAGE_KEY,
      JSON.stringify(allAttempts),
    );
    return allAttempts[materialId] || [];
  } catch {
    return [];
  }
}

function clearQuizAttempts(materialId) {
  try {
    const allAttempts = JSON.parse(
      localStorage.getItem(QUIZ_ATTEMPTS_STORAGE_KEY) || "{}",
    );
    allAttempts[materialId] = [];
    localStorage.setItem(
      QUIZ_ATTEMPTS_STORAGE_KEY,
      JSON.stringify(allAttempts),
    );
  } catch {
    // Ignore storage errors.
  }
  return [];
}

function getAttemptedQuestionHistory(materialId) {
  return loadQuizAttempts(materialId)
    .flatMap((attempt) => attempt.questions || [])
    .map((question) => summarizeQuestionForHistory(question));
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () =>
      reject(reader.error || new Error("Không đọc được file ảnh"));
    reader.readAsDataURL(file);
  });
}

function loadVisualTraces() {
  try {
    return JSON.parse(localStorage.getItem(VISUAL_TRACE_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function safeTraceForStorage(trace) {
  const imageDataUrl =
    trace.imageDataUrl && trace.imageDataUrl.length < 220000
      ? trace.imageDataUrl
      : "";
  return { ...trace, imageDataUrl };
}

function saveVisualTraces(tracesByMaterial) {
  try {
    const compact = Object.fromEntries(
      Object.entries(tracesByMaterial).map(([materialId, traces]) => [
        materialId,
        traces.slice(-20).map(safeTraceForStorage),
      ]),
    );
    localStorage.setItem(VISUAL_TRACE_STORAGE_KEY, JSON.stringify(compact));
  } catch {
    // Trace history still works in memory if storage quota is full.
  }
}

function formatDate(value) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function getPageSections(text = "") {
  const matches = [
    ...String(text).matchAll(/Trang\s+(\d+):\s*([\s\S]*?)(?=Trang\s+\d+:|$)/gi),
  ];
  return matches
    .map((match) => ({ page: Number(match[1]), text: match[2].trim() }))
    .filter((item) => item.page && item.text);
}

function tokenizeForMatch(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 4);
}

function findBestSourcePage(material, question) {
  const sections = getPageSections(
    material?.extractedText || getMaterialQuizContext(material),
  );
  if (!sections.length) return Number(question?.sourcePage || 1) || 1;
  const correctOption = question?.options?.[question.correct] || "";
  const queryTokens = new Set(
    tokenizeForMatch(
      `${question?.question || ""} ${correctOption} ${question?.explanation || ""}`,
    ),
  );
  let best = { page: sections[0].page, score: 0 };
  for (const section of sections) {
    const pageTokens = new Set(tokenizeForMatch(section.text));
    let score = 0;
    queryTokens.forEach((token) => {
      if (pageTokens.has(token)) score += 1;
    });
    if (
      correctOption &&
      section.text.toLowerCase().includes(correctOption.toLowerCase())
    )
      score += 8;
    if (score > best.score) best = { page: section.page, score };
  }
  return best.page;
}

function repairCitationText(content, fallbackPage = 1, forcePage = false) {
  const page = Math.max(1, Number(fallbackPage) || 1);
  let repaired = String(content || "")
    .replace(/\[Trang\s*(?:xx|x|\?+)\]/gi, `[Trang ${page}]`)
    .replace(/\[Page\s*(?:xx|x|\?+)\]/gi, `[Trang ${page}]`)
    .trim();
  if (forcePage) {
    repaired = repaired.replace(/\[Trang\s+\d+\]/gi, `[Trang ${page}]`);
  }
  return /\[Trang\s+\d+\]/i.test(repaired)
    ? repaired
    : `${repaired} [Trang ${page}]`;
}

function cleanQuizText(value = "") {
  return String(value)
    .replace(/^\s*\((?:dễ|trung bình|khó|easy|medium|hard)\)\s*/i, "")
    .replace(/^\s*\[(?:dễ|trung bình|khó|easy|medium|hard)\]\s*/i, "")
    .replace(/^\s*\[[^\]]{1,24}\]\s*/u, "")
    .replace(/^\s*(?:define|explain|describe|ask|question|quiz)\s*:\s*/i, "")
    .replace(/^\s*[.'"“”‘’`]+\s*/u, "")
    .replace(/\s*[.'"“”‘’`]+\s*$/u, "")
    .replace(/\b(?:[A-ZĐ]\s){3,}[A-ZĐ]\b/g, (match) =>
      match.replace(/\s+/g, ""),
    )
    .replace(/\b(?:[A-ZĐ]\s){2,}[a-zà-ỹ]/g, (match) =>
      match.replace(/\s+/g, ""),
    )
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function hasBrokenOcrText(value = "") {
  const text = String(value).trim();
  const tokens = text.split(/\s+/).filter(Boolean);
  const singleLetterTokens = tokens.filter((token) =>
    /^[\p{L}]$/u.test(token),
  ).length;
  return (
    singleLetterTokens >= 3 ||
    /(?:\b[\p{Lu}Đ]\s+){3,}/u.test(text) ||
    /\bDIAMOND\s*\d+\b/i.test(text) ||
    /NGVẤ\s*NĐỀ|NGVANDE|NGVẤNĐỀ/i.test(text)
  );
}

function isUsableQuizFocus(value = "") {
  const text = cleanQuizText(value);
  return (
    text.length >= 18 &&
    text.length <= 180 &&
    !hasBrokenOcrText(value) &&
    !hasBrokenOcrText(text) &&
    !hasBadQuizFormatting(text) &&
    !isTruncatedQuizText(text)
  );
}

function hasBadQuizFormatting(value = "") {
  const text = String(value);
  return (
    hasBrokenOcrText(text) ||
    /(?:[A-ZĐ]\s){4,}/.test(text) ||
    /^\s*\[[^\]]{1,24}\]/u.test(text) ||
    text.length < 8
  );
}

function hasBadQuizQuestionWording(value = "") {
  const text = String(value).trim();
  return (
    /^\s*[.]/.test(text) ||
    /^\s*['"“”‘’`]*(?:define|explain|describe|ask|question|quiz)\s*:/i.test(
      text,
    ) ||
    /^theo\s+(?:agenda|nội dung slide|slide|tài liệu)/i.test(text) ||
    /^mục đích chính của phần\s+["“]/i.test(text) ||
    /^câu nào phản ánh đúng nội dung được trình bày\??$/i.test(text) ||
    /^nếu phải giải thích nhanh cho bạn học, ý nào là phù hợp nhất\??$/i.test(text) ||
    /bất kỳ phương pháp|bất kỳ cách|tại sao.+bị nhầm lẫn.+bất kỳ/i.test(text) ||
    /xin lỗi|không biết làm điều đó|không biết làm điều này/i.test(text)
  );
}

function hasValidQuestionShape(value = "") {
  const text = String(value).trim();
  return (
    text.length >= 18 && text.endsWith("?") && !/[.!]$/.test(text.slice(0, -1))
  );
}

function hasWeakQuizExplanation(value = "") {
  const text = String(value).trim();
  return (
    !text ||
    /^ôn lại nội dung slide liên quan/i.test(text) ||
    /^xem lại nội dung slide/i.test(text) ||
    /^câu này kiểm tra/i.test(text) ||
    /^đáp án đúng bám vào trọng tâm/i.test(text)
  );
}

function isTruncatedQuizText(value = "") {
  const text = String(value).trim();
  return (
    /(?:\.\.\.|…)$/.test(text) ||
    /(?:\b(và|hoặc|là|của|trong|với|để|từ|về|như|khi|nếu))$/i.test(text)
  );
}

function hasUnbalancedOptionLengths(options = []) {
  const lengths = options
    .map((option) => option.split(/\s+/).filter(Boolean).length)
    .filter(Boolean);
  if (lengths.length !== 4) return true;
  const min = Math.min(...lengths);
  const max = Math.max(...lengths);
  return max > Math.max(12, min * 2.7);
}

function hasDuplicateSemanticOptions(options = []) {
  return options.some((option, index) =>
    options
      .slice(index + 1)
      .some((other) => questionSimilarityScore(option, other) >= 0.82),
  );
}

function hasGenericQuizOption(value = "") {
  const text = String(value).trim();
  return (
    /^một\s+(?:nội dung|nhận định|phương án|ý|kết luận)\s+/i.test(text) ||
    /không liên quan đến bài học|đánh lạc hướng người học|ngoài phạm vi agenda|không có căn cứ trong slide|không dựa trên tài liệu/i.test(text)
  );
}

function hasShallowHierarchyQuestion(question = "", options = []) {
  const text = String(question);
  const normalized = text.toLowerCase();
  const conceptAliases = [
    ["ai", "artificial intelligence", "trí tuệ nhân tạo"],
    ["ml", "machine learning", "học máy"],
    ["deep learning", "học sâu"],
    ["genai", "generative ai", "ai tạo sinh"],
    ["llm", "large language model", "mô hình ngôn ngữ lớn"],
  ];
  const conceptsInQuestion = conceptAliases.filter((aliases) =>
    aliases.some((alias) => normalized.includes(alias)),
  );
  const optionsText = options.join(" ").toLowerCase();
  const optionConceptHits = conceptAliases.filter((aliases) =>
    aliases.some((alias) => optionsText.includes(alias)),
  );
  return (
    conceptsInQuestion.length >= 3 &&
    optionConceptHits.length >= 3 &&
    /nằm ở đâu|cùng một hệ|hệ nào|ở đâu trong/i.test(text)
  );
}

function normalizeQuizQuestions(items, limit = 20, material = null) {
  if (!Array.isArray(items)) return [];
  const normalizedItems = items
    .filter(
      (item) =>
        item?.question &&
        Array.isArray(item?.options) &&
        item.options.length === 4,
    )
    .map((item) => {
      const rawQuestionText = String(
        item.questionStem || item.stem || item.question || "",
      );
      const rawOptionTexts = item.options.map((option) => String(option || ""));
      const rawExplanationText = String(item.explanation || "");
      const questionText = cleanQuizText(rawQuestionText);
      const optionTexts = item.options.map((option) => cleanQuizText(option));
      const explanationText = cleanQuizText(item.explanation || "");
      const normalized = {
        question: questionText,
        options: optionTexts,
        correct: Number.isInteger(item.correct)
          ? Math.min(Math.max(item.correct, 0), 3)
          : 0,
        explanation: explanationText,
        testedConcept: cleanQuizText(item.testedConcept || ""),
        personalized: false,
        sourceLabel:
          item.sourceLabel && !/visual|trace/i.test(String(item.sourceLabel))
            ? String(item.sourceLabel)
            : "Bài học",
        sourcePage: Number(item.sourcePage || item.page || 0) || 0,
        difficulty: ["easy", "medium", "hard"].includes(item.difficulty)
          ? item.difficulty
          : "medium",
        visualTrace: null,
        rawQuestionText,
        rawOptionTexts,
        rawExplanationText,
      };
      const sourcePage =
        findBestSourcePage(material, normalized) || normalized.sourcePage || 1;
      return {
        ...normalized,
        sourcePage,
        explanation: repairCitationText(
          normalized.explanation,
          sourcePage,
          true,
        ),
      };
    })
    .filter(
      (item) =>
        item.question &&
        hasValidQuestionShape(item.question) &&
        !hasBadQuizQuestionWording(item.rawQuestionText) &&
        !hasBadQuizQuestionWording(item.question) &&
        !isTruncatedQuizText(item.question) &&
        item.rawOptionTexts.every(
          (option) => !hasBadQuizFormatting(option) && !hasGenericQuizOption(option),
        ) &&
        item.options.every(
          (option) =>
            option &&
            !hasBadQuizFormatting(option) &&
            !hasGenericQuizOption(option) &&
            !hasBadQuizQuestionWording(option) &&
            !isTruncatedQuizText(option),
        ) &&
        !hasWeakQuizExplanation(item.rawExplanationText) &&
        !hasWeakQuizExplanation(item.explanation) &&
        !isTruncatedQuizText(item.explanation) &&
        !hasUnbalancedOptionLengths(item.options) &&
        !hasDuplicateSemanticOptions(item.options) &&
        !hasShallowHierarchyQuestion(item.question, item.options),
    )
    .map(
      ({ rawQuestionText, rawOptionTexts, rawExplanationText, ...item }) =>
        item,
    );
  const uniqueItems = [];
  normalizedItems.forEach((item) => {
    if (!isSimilarQuestion(item, uniqueItems)) uniqueItems.push(item);
  });
  return uniqueItems.slice(0, limit);
}

function getImportantSentences(text) {
  return text
    .split(/(?<=[.!?])\s+|\n+|(?:\s+-\s+)/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 35 && item.length <= 220)
    .filter((item) => isUsableQuizFocus(item))
    .filter(
      (item, index, list) =>
        list.findIndex(
          (other) => other.toLowerCase() === item.toLowerCase(),
        ) === index,
    )
    .slice(0, 80);
}

function shuffleItems(items) {
  return [...items]
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function suggestQuestionCount(material) {
  const pages = Number(material?.pages) || 1;
  const contextWords = getMaterialQuizContext(material)
    .split(/\s+/)
    .filter(Boolean).length;
  if (pages <= 12 && contextWords < 1800) return 5;
  if (pages <= 35 && contextWords < 5000) return 10;
  if (pages <= 80 && contextWords < 11000) return 15;
  return 20;
}

function buildDifficultyPlan(count, settings = defaultQuizSettings) {
  const total = Math.max(
    1,
    Number(settings.easy || 0) +
      Number(settings.medium || 0) +
      Number(settings.hard || 0),
  );
  const raw = {
    easy: (count * Number(settings.easy || 0)) / total,
    medium: (count * Number(settings.medium || 0)) / total,
    hard: (count * Number(settings.hard || 0)) / total,
  };
  const plan = {
    easy: Math.floor(raw.easy),
    medium: Math.floor(raw.medium),
    hard: Math.floor(raw.hard),
  };
  let remaining = count - plan.easy - plan.medium - plan.hard;
  ["medium", "easy", "hard"]
    .sort((a, b) => raw[b] - Math.floor(raw[b]) - (raw[a] - Math.floor(raw[a])))
    .forEach((level) => {
      if (remaining > 0) {
        plan[level] += 1;
        remaining -= 1;
      }
    });
  return {
    ...plan,
    summary: `${plan.easy} dễ, ${plan.medium} trung bình, ${plan.hard} khó`,
    lines: [
      `easy: ${plan.easy} câu - kiểm tra nhận biết khái niệm và ý chính trong Agenda`,
      `medium: ${plan.medium} câu - kiểm tra giải thích, so sánh, liên hệ giữa các phần`,
      `hard: ${plan.hard} câu - kiểm tra áp dụng, phát hiện hiểu sai, tình huống chuyển giao`,
    ],
  };
}

function getQuizFocusItems(context = "") {
  const agendaLines = getAgendaFocus(context)
    .split(/\n+/)
    .map((item) => cleanQuizText(item.replace(/^[-•\d.)\s]+/, "")))
    .filter((item) => isUsableQuizFocus(item));
  const importantLines = getImportantSentences(context)
    .map((item) => cleanQuizText(item))
    .filter((item) => isUsableQuizFocus(item));
  const seen = new Set();
  return [...agendaLines, ...importantLines]
    .filter((item) => {
      const key = tokenizeForMatch(item).slice(0, 10).join(" ");
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 40);
}

function buildQuizBlueprint(
  count,
  context = "",
  previousQuestions = [],
  difficultyPlan = buildDifficultyPlan(count),
) {
  const focusItems = getQuizFocusItems(context);
  const previousText = previousQuestions.join("\n").toLowerCase();
  const freshFocus = focusItems.filter((item) => {
    const tokens = tokenizeForMatch(item).slice(0, 6);
    if (!tokens.length) return true;
    return (
      tokens.filter((token) => previousText.includes(token)).length <
      Math.ceil(tokens.length * 0.7)
    );
  });
  const pool = freshFocus.length ? freshFocus : focusItems;
  const types = shuffleItems([
    "nhận biết khái niệm",
    "mục đích hoặc vai trò",
    "so sánh hai ý gần nhau",
    "quan hệ nguyên nhân - hệ quả",
    "thứ tự hoặc quy trình",
    "ứng dụng vào tình huống học tập",
    "phát hiện hiểu sai thường gặp",
    "chọn phát biểu đúng nhất",
  ]);
  const levels = [
    ...Array.from({ length: difficultyPlan.easy }, () => "easy"),
    ...Array.from({ length: difficultyPlan.medium }, () => "medium"),
    ...Array.from({ length: difficultyPlan.hard }, () => "hard"),
  ];
  return Array.from({ length: count }, (_, index) => {
    const focus = pool.length
      ? pool[index % pool.length]
      : "ý chính khác trong tài liệu";
    return `${index + 1}. difficulty=${levels[index] || "medium"} | loại=${types[index % types.length]} | trọng tâm="${focus}"`;
  });
}

function makeMultipleChoice(correctText, wrongOptions) {
  const correctIndex = Math.floor(Math.random() * 4);
  const options = [...wrongOptions.slice(0, 3)];
  options.splice(correctIndex, 0, correctText);
  return { options, correct: correctIndex };
}

function getAgendaFocus(text) {
  const lines = text
    .split(/\n+|Trang\s+\d+:/)
    .map((item) => item.trim())
    .filter(Boolean);
  const agendaIndex = lines.findIndex((line) =>
    /agenda|mục tiêu|nội dung chính|lộ trình|outline/i.test(line),
  );
  if (agendaIndex >= 0) {
    return lines.slice(agendaIndex, agendaIndex + 10).join("\n");
  }
  const agendaLike = lines.filter((line) =>
    /bài toán|problem|user needs|success|context|planning|tools|model|agent|evaluation|workflow|pipeline|metric/i.test(
      line,
    ),
  );
  return agendaLike.slice(0, 12).join("\n");
}

function makeContentFallbackQuestions(
  material,
  count = 5,
  previousQuestions = [],
  quizSettings = defaultQuizSettings,
) {
  const context = getMaterialQuizContext(material);
  const sentences = getImportantSentences(context);
  const agendaSentences = getImportantSentences(getAgendaFocus(context));
  const base = sentences.length
    ? sentences
    : [
        `${material?.description || material?.name || "Tài liệu này"} là trọng tâm của bài học đang mở.`,
        `Học viên cần ôn lại các ý chính trong ${material?.name || "slide"}.`,
      ];
  const previousSet = new Set(
    previousQuestions.map((item) => item.toLowerCase()),
  );
  const candidates = [
    ...agendaSentences.map((item) => ({ text: item, personalized: false })),
    ...shuffleItems(base).map((item) => ({ text: item, personalized: false })),
  ]
    .filter((item) => isUsableQuizFocus(item.text))
    .filter((item) => {
      const text = item.text.toLowerCase();
      return !previousQuestions.some((previous) => {
        const normalized = previous.toLowerCase();
        return (
          normalized.includes(text.slice(0, 70)) ||
          text.includes(normalized.slice(0, 70))
        );
      });
    });

  const fallbackCandidates = [
    ...agendaSentences.map((item) => ({ text: item, personalized: false })),
    ...base.map((item) => ({ text: item, personalized: false })),
  ].filter((item) => isUsableQuizFocus(item.text));

  const difficultyPlan = buildDifficultyPlan(count, quizSettings);
  const difficultyQueue = [
    ...Array(difficultyPlan.easy).fill("easy"),
    ...Array(difficultyPlan.medium).fill("medium"),
    ...Array(difficultyPlan.hard).fill("hard"),
  ];

  const emergencyCandidates = [
    "Xác định rõ bài toán trước khi chọn giải pháp AI",
    "Hiểu mục tiêu học tập và các khái niệm cốt lõi trong bài",
    "Phân biệt đúng vai trò của các thành phần trong hệ thống AI",
    "Nhận diện sai lầm thường gặp khi áp dụng AI vào sản phẩm",
    "Liên hệ nội dung bài học với tình huống ứng dụng thực tế",
  ].map((text) => ({ text, personalized: false }));

  const sourcePool = candidates.length
    ? candidates
    : fallbackCandidates.length
      ? shuffleItems(fallbackCandidates)
      : emergencyCandidates;
  const selectedCandidates = Array.from(
    { length: count },
    (_, index) => sourcePool[index % sourcePool.length],
  );

  return selectedCandidates.map((candidate, index) => {
    const compact = cleanQuizText(
      candidate.text.replace(/^Trang\s+\d+:\s*/i, "").trim(),
    );
    const focus = isUsableQuizFocus(compact)
      ? compact
      : cleanQuizText(
          material?.description ||
            emergencyCandidates[index % emergencyCandidates.length]?.text ||
            "Nội dung trọng tâm của slide",
        );
    return makePedagogicFallbackQuestion(
      focus,
      index,
      difficultyQueue[index] || "medium",
    );
  });
}

function getVisualTraceContext(traces = []) {
  if (!traces.length) return "Chưa có vùng nào người học khoanh để hỏi.";
  return traces
    .slice(-6)
    .map((trace, index) => {
      const rect = trace.selection;
      return [
        `Trace ${index + 1}:`,
        `- Trang: ${trace.page}`,
        `- Câu hỏi người học chọn/nhập: ${trace.question}`,
        `- Vùng khoanh: x=${Math.round(rect.x)}%, y=${Math.round(rect.y)}%, w=${Math.round(rect.width)}%, h=${Math.round(rect.height)}%`,
        `- Giải thích đã trả: ${trace.answer}`,
      ].join("\n");
    })
    .join("\n\n");
}
function completeQuizQuestions(
  material,
  questions,
  targetCount,
  previousQuestions = [],
  quizSettings = defaultQuizSettings,
) {
  let next = questions.slice(0, targetCount);
  let guard = 0;
  while (next.length < targetCount && guard < 4) {
    const fallback = normalizeQuizQuestions(
      makeContentFallbackQuestions(
        material,
        targetCount - next.length,
        [...previousQuestions, ...next.map(summarizeQuestionForHistory)],
        quizSettings,
      ),
      targetCount - next.length,
      material,
    );
    fallback.forEach((item) => {
      if (
        next.length < targetCount &&
        !isSimilarQuestion(item, [...previousQuestions, ...next])
      ) {
        next.push(item);
      }
    });
    guard += 1;
  }
  return next.slice(0, targetCount);
}

function cleanExtractedText(value) {
  return value
    .replace(/\s+/g, " ")
    .replace(/([.!?])\s+/g, "$1\n")
    .trim();
}

async function extractPdfText(file) {
  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  return extractPdfDocumentText(pdf);
}

async function extractPdfTextFromUrl(url) {
  const pdf = await pdfjsLib.getDocument({ url }).promise;
  return extractPdfDocumentText(pdf);
}

async function extractPdfDocumentText(pdf) {
  const pages = [];
  for (let index = 1; index <= pdf.numPages; index += 1) {
    const page = await pdf.getPage(index);
    const content = await page.getTextContent();
    const text = content.items.map((item) => item.str).join(" ");
    if (text.trim()) pages.push(`Trang ${index}: ${text}`);
  }
  return cleanExtractedText(pages.join("\n"));
}

function xmlTextToPlainText(xmlText) {
  const documentXml = new DOMParser().parseFromString(
    xmlText,
    "application/xml",
  );
  return Array.from(documentXml.getElementsByTagName("a:t"))
    .map((node) => node.textContent || "")
    .join(" ");
}

async function extractPptxText(file) {
  const zip = await JSZip.loadAsync(file);
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort(
      (a, b) =>
        Number(a.match(/\d+/)?.[0] || 0) - Number(b.match(/\d+/)?.[0] || 0),
    );
  const slides = [];
  for (const name of slideFiles) {
    const xml = await zip.files[name].async("text");
    const text = xmlTextToPlainText(xml);
    if (text.trim())
      slides.push(
        `${name.replace("ppt/slides/", "").replace(".xml", "")}: ${text}`,
      );
  }
  return cleanExtractedText(slides.join("\n"));
}

async function extractSlideText(file) {
  if (
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf")
  ) {
    return extractPdfText(file);
  }
  if (file.name.toLowerCase().endsWith(".pptx")) {
    return extractPptxText(file);
  }
  return "";
}

function getMaterialQuizContext(material) {
  const extractedText = material?.extractedText?.trim();
  if (extractedText) return extractedText;
  const explicitNotes = material?.notes?.trim();
  if (explicitNotes) return explicitNotes;
  return [
    `Tài liệu được admin upload: ${material?.name || "slide"}.`,
    `Buổi học: ${material?.day || "chưa xác định"}.`,
    `Mô tả: ${material?.description || material?.name || "chưa có mô tả"}.`,
    `Số trang: ${material?.pages || "chưa rõ"}.`,
    `Loại file: ${material?.type || "slide"}.`,
    "Hãy tạo câu hỏi ôn tập dựa trên tên tài liệu, mô tả và ngữ cảnh lớp học. Nếu thông tin chưa đủ chi tiết, ưu tiên câu hỏi khái niệm tổng quát liên quan đến chủ đề trong tên file.",
  ].join("\n");
}

function makeVisualFallbackExplanation(material, selection, question) {
  const sentences = getImportantSentences(getMaterialQuizContext(material));
  const focus = sentences.slice(0, 4).join(" ");
  return [
    `Bạn đang hỏi vùng đã khoanh ở trang ${selection.page}.`,
    focus
      ? `Dựa trên nội dung đọc được từ slide, vùng này nên được hiểu trong mạch chính sau: ${focus}`
      : "Hiện app chưa đọc được đủ nội dung chữ từ slide này, nên phần giải thích chỉ dựa trên tên tài liệu và vị trí vùng khoanh.",
    `Với câu hỏi "${question}", điểm cần ghi nhớ là: hãy liên hệ vùng đang khoanh với tiêu đề slide, bullet gần nó và vai trò của nó trong bài học thay vì học thuộc riêng lẻ.`,
  ].join("\n\n");
}

async function createVisualExplanation(
  material,
  selection,
  question,
  selectedImageDataUrl = "",
) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const model = import.meta.env.VITE_OPENAI_MODEL || "gpt-4o-mini";
  if (!apiKey) {
    throw new Error("Chưa cấu hình VITE_OPENAI_API_KEY trong file .env");
  }

  const prompt = [
    "Bạn là VLearn Tutor, trợ lý học tập trong VLearn.",
    "Bài toán bạn giải quyết: giúp người học hiểu nội dung trong slide bài giảng đang mở, trả lời câu hỏi về khái niệm, hình/diagram, ví dụ, điểm cần nhớ và định hướng ôn tập dựa trên học liệu.",
    "Constraints bắt buộc:",
    "- Chỉ trả lời trong phạm vi slide/tài liệu bài học đang mở và Visual Trace được cung cấp.",
    "- Không bịa kiến thức ngoài slide. Nếu tài liệu không đủ căn cứ, nói rõ là không đủ căn cứ.",
    "- Không làm bài hộ, không đưa đáp án kiểm tra/assignment nếu yêu cầu không nhằm mục tiêu học hiểu.",
    "- Không trả lời các yêu cầu ngoài phạm vi học liệu VLearn, ví dụ: viết code không liên quan đến slide, tư vấn đời sống, nội dung nhạy cảm, hoặc câu hỏi không có căn cứ trong tài liệu.",
    "- Nếu người học hỏi ngoài phạm vi, từ chối ngắn gọn và hướng họ hỏi lại về slide hiện tại.",
    "- Nếu câu hỏi liên quan đến bài học, luôn chèn citation dạng [Trang 15] với số trang cụ thể ngay sau ý có căn cứ.",
    "- Được dùng Markdown gọn: bullet, **bold**, bảng nhỏ, code inline nếu chính slide có code. Không tạo code block dài trừ khi slide đang dạy đúng nội dung đó.",
    "Bạn là VLearn Visual Explain.",
    "Nhiệm vụ: giải thích vùng người học vừa khoanh trên slide, trong ngữ cảnh toàn bộ tài liệu bài giảng.",
    "Quan trọng: nếu có ảnh vùng khoanh, hãy ưu tiên đọc và giải thích chính ảnh đó, sau đó liên hệ với NỘI DUNG SLIDE. Không bịa nội dung ngoài ảnh/text được cung cấp.",
    "Trả lời trực tiếp đúng câu hỏi người học chọn/nhập. Không bắt buộc chia thành các mục cố định như 'Vùng này là gì', 'Dụng ý trong bài', 'Cần ghi nhớ'.",
    "Nếu người học hỏi 'hình này muốn nói gì' thì giải thích thông điệp chính của hình; nếu hỏi ví dụ thì cho ví dụ; nếu hỏi ghi nhớ gì thì chỉ nêu các ý cần nhớ.",
    `Tên tài liệu: ${material?.name}`,
    `Mô tả: ${material?.description}`,
    `Trang đang xem: ${selection.page}`,
    `Vùng khoanh theo phần trăm slide: x=${Math.round(selection.x)}%, y=${Math.round(selection.y)}%, w=${Math.round(selection.width)}%, h=${Math.round(selection.height)}%`,
    `Câu hỏi của người học: ${question}`,
    `NỘI DUNG SLIDE:\n${getMaterialQuizContext(material)}`,
  ].join("\n");

  const userContent = selectedImageDataUrl
    ? [
        { type: "text", text: prompt },
        { type: "image_url", image_url: { url: selectedImageDataUrl } },
      ]
    : prompt;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.25,
      messages: [{ role: "user", content: userContent }],
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API lỗi ${response.status}`);
  }

  const data = await response.json();
  const answer = data.choices?.[0]?.message?.content?.trim();
  if (!answer) throw new Error("AI không trả về giải thích hợp lệ");
  return answer;
}

async function createQuizWithAI(
  material,
  questionCount,
  previousQuestions = [],
  quizSettings = defaultQuizSettings,
) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const model = import.meta.env.VITE_OPENAI_MODEL || "gpt-4o-mini";
  if (!apiKey) {
    throw new Error("Chưa cấu hình VITE_OPENAI_API_KEY trong file .env");
  }

  const quizSeed = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const variantMode = pickRandom([
    "concept-check",
    "agenda-coverage",
    "application-scenario",
    "common-misconception",
    "compare-and-contrast",
    "process-ordering",
    "example-transfer",
  ]);
  const agendaFocus = getAgendaFocus(getMaterialQuizContext(material));
  const difficultyPlan = buildDifficultyPlan(questionCount, quizSettings);
  const quizContext = getMaterialQuizContext(material);
  const candidateCount = Math.min(
    36,
    Math.max(questionCount * 3, questionCount + 10),
  );
  const quizBlueprint = buildQuizBlueprint(
    candidateCount,
    quizContext,
    previousQuestions,
    difficultyPlan,
  );
  const previousConceptKeys = previousQuestions
    .map((item) => tokenizeForMatch(item).slice(0, 12).join(" "))
    .filter(Boolean)
    .slice(-60);
  const systemPrompt = [
    "Bạn là VLearn Quiz Generator, chuyên gia thiết kế câu hỏi trắc nghiệm học tập.",
    "Nhiệm vụ: tạo câu hỏi giúp người học hiểu đúng bài học, không chỉ nhận diện chữ trong slide.",
    "Mỗi câu hỏi phải có chính xác 1 đáp án đúng hoàn toàn; 3 đáp án còn lại là hiểu sai hợp lý nhưng sai rõ theo tài liệu.",
    "Không tạo câu hỏi rác, câu hỏi quá chung, câu hỏi chỉ chép một mảnh slide, hoặc câu hỏi mà đáp án đúng là nguyên dòng trích thô.",
    "Không tạo distractor kiểu 'Một nội dung không liên quan', 'Một nhận định chung', 'Một phương án đánh lạc hướng', 'Ngoài phạm vi Agenda'.",
    "Không tạo nhiều câu kiểm tra cùng một ý. Mỗi câu phải có testedConcept khác nhau hoặc kiểm tra cùng concept ở cấp độ tư duy khác nhau.",
    "Luôn trả JSON hợp lệ, không markdown, không giải thích ngoài JSON.",
  ].join("\n");

  const prompt = [
    "Tạo quiz cho VLearn từ học liệu sau.",
    `Tạo ${candidateCount} câu hỏi trắc nghiệm ứng viên bằng tiếng Việt từ đúng nội dung học liệu sau. Hệ thống sẽ lọc và chỉ hiển thị ${questionCount} câu tốt nhất.`,
    "Quy tắc bắt buộc:",
    "- Chỉ hỏi các ý xuất hiện trong phần NỘI DUNG SLIDE.",
    "- Không tự thêm chủ đề ngoài slide, không hỏi kiến thức nền nếu slide không nhắc tới.",
    "- Ưu tiên mạnh phần AGENDA / mục tiêu / nội dung chính của buổi học. Mỗi câu nên bám một mục agenda khác nhau nếu có thể.",
    "- Không bám vào chi tiết nhỏ, tiểu tiết, tên riêng phụ, ví dụ thoáng qua hoặc mảnh chữ rời rạc nếu chi tiết đó không phục vụ Agenda/mục tiêu học tập.",
    "- Không tạo câu hỏi suy diễn quá xa nội dung slide. Mọi câu hỏi, đáp án đúng và giải thích phải có bằng chứng trực tiếp trong slide.",
    "- Không tự gán hoặc tự định nghĩa một khái niệm không xuất hiện rõ trong tài liệu.",
    "- Không tạo câu hỏi từ Visual Trace, vùng khoanh, lịch sử Tutor hoặc ghi chú cá nhân. Quiz chỉ dựa trên Agenda và nội dung slide/tài liệu.",
    "- Mỗi câu hỏi phải bám đúng mục tiêu Agenda của bài học, có tính sư phạm cao, giúp người học hiểu bản chất thay vì học mẹo.",
    "- Bộ quiz phải phủ kiến thức cốt lõi của slide: Agenda, khái niệm nền, quan hệ giữa các thành phần, quy trình/cách áp dụng và lỗi hiểu sai thường gặp.",
    `- Phân bổ độ khó thực chất theo cấu hình Admin: ${difficultyPlan.summary}. easy hỏi nhận biết ý chính; medium hỏi giải thích/liên hệ; hard hỏi áp dụng hoặc phát hiện hiểu sai dựa trên slide. Trả field difficulty là \"easy\", \"medium\" hoặc \"hard\" cho từng câu.`,
    "- Tuyệt đối không ghi nhãn độ khó vào nội dung question. Không bắt đầu câu hỏi bằng '(Dễ)', '(Trung bình)', '(Khó)', '[easy]', '[medium]' hoặc '[hard]'. Độ khó chỉ nằm trong field difficulty.",
    "- Tuyệt đối không ghi nhãn phân loại vào đáp án. Không dùng tiền tố như '[Tạo]', '[Chọn mẫu]', '[Suy nghĩ]', '[Diễn giải]' hoặc bất kỳ cụm trong ngoặc vuông nào ở đầu option.",
    "- Field questionStem/question phải là câu hỏi hiển thị cuối cùng, hoàn chỉnh bằng tiếng Việt, kết thúc bằng dấu hỏi. Không dùng tiền tố tiếng Anh như 'Define:', 'Explain:', 'Describe:', 'Question:', không mở đầu bằng dấu chấm hoặc dấu nháy.",
    "- Không bắt đầu câu hỏi bằng 'Theo Agenda', 'Theo nội dung slide', 'Theo slide' hoặc 'Theo tài liệu'. Hãy hỏi trực tiếp vào khái niệm/tình huống cần kiểm tra.",
    "- Không đưa cụm 'Define:' hoặc tên bước nội bộ vào đáp án. Nếu nội dung nói về bước Define thì diễn đạt tự nhiên, ví dụ: 'Thu hẹp vấn đề để xác định đúng bài toán gốc'.",
    "- Đáp án phải là mệnh đề tự nhiên, đầy đủ, có nghĩa khi đứng một mình. Không dùng câu đùa, câu xin lỗi, câu kiểu 'tôi không biết', hoặc lựa chọn quá vô lý.",
    "- Không tạo câu hỏi mơ hồ/què logic như 'Tại sao X bị nhầm lẫn với bất kỳ phương pháp nào khác?'. Nếu hỏi hiểu sai, hãy hỏi dạng: 'Hiểu sai phổ biến nào về X cần tránh?' hoặc 'Phát biểu nào sau đây là sai/đúng theo slide?'.",
    "- Không tạo câu hỏi phân cấp mơ hồ kiểu 'AI, ML, Deep Learning, GenAI và LLM nằm ở đâu trong cùng một hệ?'. Nếu hỏi quan hệ giữa các khái niệm này, hãy hỏi rõ: 'Khái niệm nào bao trùm các khái niệm còn lại?' hoặc 'Thứ tự quan hệ nào đúng theo slide?'.",
    "- Nếu câu hỏi đã liệt kê nhiều khái niệm, đáp án không được chỉ là một khái niệm trong chính danh sách đó trừ khi câu hỏi hỏi rõ 'khái niệm nào bao trùm'.",
    "- Không lặp lại câu hỏi nằm trong DANH SÁCH CÂU HỎI ĐÃ TẠO TRƯỚC ĐÓ.",
    "- Không lặp lại các concept key trong DANH SÁCH CONCEPT ĐÃ HỎI. Nếu trùng concept key thì phải chuyển sang trọng tâm khác.",
    "- Trong cùng một bộ quiz, không được tạo hai câu kiểm tra cùng một khái niệm, cùng một đáp án đúng, hoặc cùng một bằng chứng slide dù diễn đạt khác nhau.",
    "- Các câu hỏi không được trùng ngữ nghĩa. Không được tạo cặp kiểu 'khái niệm chính của LLM là gì?' và 'LLM được định nghĩa là gì?' nếu cùng đáp án.",
    "- Nếu một khái niệm đã được hỏi rồi, hãy chuyển sang mục Agenda khác, quan hệ khác, quy trình khác hoặc lỗi hiểu sai khác.",
    "- Không chỉ đổi thứ tự đáp án; phải đổi trọng tâm câu hỏi, cách hỏi hoặc phần kiến thức được kiểm tra.",
    "- Nếu lịch sử đã có câu hỏi tương tự, hãy chọn mục Agenda khác hoặc đổi sang tình huống ứng dụng/sai lầm thường gặp.",
    "- Phải có đúng 4 đáp án và có đúng 1 đáp án hoàn toàn đúng. Ba đáp án nhiễu phải sai rõ theo tài liệu, không được có nhiều đáp án cùng đúng một phần gây nhập nhằng.",
    "- Ba đáp án nhiễu phải là lỗi hiểu sai hợp lý của người học, cùng chủ đề với đáp án đúng, không phải câu rác hoặc câu hiển nhiên vô lý.",
    "- Đáp án đúng không được là nguyên một mảnh heading hoặc bullet thô copy từ slide nếu có thể diễn giải thành mệnh đề tự nhiên.",
    "- Câu hỏi không được hỏi 'mục đích chính của phần \"<mảnh slide>\"' hoặc 'câu nào phản ánh đúng nội dung được trình bày' vì quá chung.",
    "- Mỗi câu phải có testedConcept ngắn để thể hiện concept được kiểm tra; các testedConcept trong cùng bộ không được trùng.",
    "- Tránh đáp án mất cân bằng độ dài: bốn đáp án phải cùng loại nghĩa và độ dài tương đối gần nhau; không để đáp án đúng dài vượt trội hoặc cụ thể vượt trội.",
    "- Không để câu hỏi, đáp án hoặc giải thích bị cắt cụt, kết thúc bằng dấu ba chấm, hoặc kết thúc ở một liên từ/giới từ như 'và', 'của', 'trong', 'với'.",
    "- Đa dạng loại câu hỏi trong cùng bộ: khái niệm, mục đích, so sánh, thứ tự/quy trình, ứng dụng, lỗi thường gặp. Không dùng một khuôn hỏi lặp lại.",
    "- Tuân thủ BLUEPRINT CÂU HỎI bên dưới: mỗi dòng là một trọng tâm/loại câu khác nhau. Không dồn nhiều câu vào cùng một trọng tâm.",
    `- Lần generate này dùng VARIANT MODE: ${variantMode}. Hãy làm câu hỏi đúng tinh thần mode này.`,
    "- Nếu nội dung slide quá ít, trả về câu hỏi về chính phần ít đó, không bịa thêm.",
    "Mỗi câu có đúng 4 lựa chọn, một đáp án đúng, giải thích ngắn và trích đúng ý từ slide. Explanation phải nêu lý do cụ thể vì sao đáp án đúng, không được viết chung chung kiểu 'ôn lại nội dung slide liên quan'.",
    "- Explanation bắt buộc có citation dạng [Trang 15] với SỐ TRANG CỤ THỂ chỉ ra slide/trang chứa căn cứ cho đáp án. Citation phải khớp trang có nội dung làm căn cứ, không chọn bừa theo trang đang mở. Tuyệt đối không dùng placeholder [Trang xx], [Trang x] hoặc [Page xx].",
    `Chỉ trả JSON hợp lệ theo schema và có đúng ${candidateCount} phần tử trong questions: {\"questions\":[{\"questionStem\":\"Câu hỏi hoàn chỉnh bằng tiếng Việt?\",\"question\":\"Câu hỏi hoàn chỉnh bằng tiếng Việt?\",\"testedConcept\":\"khái niệm được kiểm tra\",\"options\":[\"Đáp án A tự nhiên\",\"Đáp án B tự nhiên\",\"Đáp án C tự nhiên\",\"Đáp án D tự nhiên\"],\"correct\":0,\"explanation\":\"Giải thích cụ thể vì sao đúng và vì sao các hướng sai không phù hợp. [Trang 15]\",\"sourcePage\":15,\"difficulty\":\"easy\",\"personalized\":false,\"sourceLabel\":\"Bài học\"}]}`,
    `Tên tài liệu: ${material.name}`,
    `Mô tả: ${material.description}`,
    `SEED ĐỂ ĐA DẠNG HÓA: ${quizSeed}`,
    `VARIANT MODE: ${variantMode}`,
    `AGENDA / TRỌNG TÂM ƯU TIÊN:\n${agendaFocus || "Không tìm thấy agenda rõ ràng, hãy suy ra từ tiêu đề và các bullet chính."}`,
    `KẾ HOẠCH ĐỘ KHÓ:\n${difficultyPlan.lines.join("\n")}`,
    `BLUEPRINT CÂU HỎI PHẢI PHỦ:\n${quizBlueprint.join("\n")}`,
    `DANH SÁCH CONCEPT ĐÃ HỎI:\n${previousConceptKeys.length ? previousConceptKeys.join("\n") : "Chưa có."}`,
    `DANH SÁCH CÂU HỎI ĐÃ TẠO TRƯỚC ĐÓ:\n${previousQuestions.length ? previousQuestions.join("\n") : "Chưa có."}`,
    `NỘI DUNG SLIDE:\n${quizContext}`,
  ].join("\n");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.85,
      presence_penalty: 0.9,
      frequency_penalty: 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API lỗi ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "{}";
  const parsed = JSON.parse(content);
  const questions = forceFillQuizQuestions(
    material,
    normalizeQuizQuestions(parsed.questions, candidateCount, material),
    questionCount,
    previousQuestions,
    quizSettings,
  );
  if (!questions.length) throw new Error("AI không trả về bộ câu hỏi hợp lệ");
  return questions;
}

function makeTutorFallbackAnswer(material, question, page = 1) {
  const context = getMaterialQuizContext(material);
  const agenda = getAgendaFocus(context);
  const traces = getVisualTraceContext(material?.visualTraces);
  const focus = getImportantSentences(`${agenda}\n${context}`)
    .slice(0, 4)
    .join(" ");
  return [
    `Mình chưa gọi được AI API nên đang trả lời theo nội dung đã đọc từ slide. [Trang ${page}]`,
    focus
      ? `Theo ngữ cảnh bài học, trọng tâm liên quan là: ${focus}`
      : `Tài liệu hiện tại là ${material?.name || "slide đang mở"}. Bạn có thể hỏi cụ thể hơn về thuật ngữ, biểu đồ hoặc đoạn nội dung muốn hiểu.`,
    material?.visualTraces?.length
      ? `Mình cũng thấy bạn đã có trace Visual Explain trước đó: ${traces.slice(0, 400)}${traces.length > 400 ? "..." : ""}`
      : "Bạn có thể dùng Visual Explain để khoanh vùng trên slide, rồi hỏi tiếp tại đây để mình trả lời sát ngữ cảnh hơn.",
    question ? `Câu hỏi của bạn: "${question}"` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

async function askVlearnTutor(
  material,
  page,
  messages,
  question,
  imageDataUrl = "",
) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const model = import.meta.env.VITE_OPENAI_MODEL || "gpt-4o-mini";
  if (!apiKey) {
    throw new Error("Chưa cấu hình VITE_OPENAI_API_KEY trong file .env");
  }

  const prompt = [
    "Bạn là VLearn Tutor, trợ lý học theo ngữ cảnh slide.",
    "Trả lời tiếng Việt, rõ ràng, ngắn gọn. Nếu câu hỏi mơ hồ, giải thích theo ngữ cảnh slide hiện tại và gợi ý người học khoanh vùng bằng Visual Explain.",
    "Không bịa nội dung ngoài slide. Nếu nội dung không đủ, nói rõ giới hạn.",
    "Nếu người học gửi ảnh, trước tiên phải kiểm tra ảnh/câu hỏi có liên quan đến slide hoặc tài liệu đang mở không. Nếu ảnh hoặc câu hỏi không liên quan đến nội dung bài học, từ chối ngắn gọn và hướng người học hỏi lại về slide.",
    "Không giải bài hộ, không viết code hoặc trả lời yêu cầu ngoài phạm vi học liệu, trừ khi slide hiện tại đang dạy trực tiếp nội dung đó.",
    "Khi trả lời câu hỏi liên quan đến bài học, luôn chèn citation dạng [Trang xx] ngay sau ý có liên quan. Citation phải dùng số trang trong tài liệu, ví dụ [Trang 15].",
    "Nếu đang dùng ngữ cảnh trang hiện tại, ưu tiên citation trang hiện tại.",
    `Tài liệu: ${material?.name}`,
    `Mô tả: ${material?.description}`,
    `Trang slide hiện tại: ${page}`,
    `Agenda/trọng tâm:\n${getAgendaFocus(getMaterialQuizContext(material)) || "Không tìm thấy agenda rõ."}`,
    `Visual trace:\n${getVisualTraceContext(material?.visualTraces)}`,
    `Nội dung slide/tài liệu:\n${getMaterialQuizContext(material)}`,
  ].join("\n");

  const userContent = imageDataUrl
    ? [
        { type: "text", text: question },
        { type: "image_url", image_url: { url: imageDataUrl } },
      ]
    : question;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.35,
      messages: [
        { role: "system", content: prompt },
        ...messages
          .slice(-8)
          .map((message) => ({ role: message.role, content: message.content })),

        { role: "user", content: userContent },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API lỗi ${response.status}`);
  }

  const data = await response.json();
  const answer = data.choices?.[0]?.message?.content?.trim();
  if (!answer) throw new Error("Tutor không trả về câu trả lời hợp lệ");
  return answer;
}

function Layout() {
  const [materials, setMaterials] = useState(loadMaterials);
  const [activeId, setActiveId] = useState(materials[0]?.id);
  const [quizOpen, setQuizOpen] = useState(false);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(400);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(390);
  const [quizSettings, setQuizSettings] = useState(loadQuizSettings);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageJumpRequest, setPageJumpRequest] = useState(null);
  const [role, setRole] = useState("student");
  const [query, setQuery] = useState("");
  const [visualTracesByMaterial, setVisualTracesByMaterial] =
    useState(loadVisualTraces);
  const [tutorEvent, setTutorEvent] = useState(null);

  useEffect(() => saveMaterials(materials), [materials]);
  useEffect(() => saveQuizSettings(quizSettings), [quizSettings]);
  useEffect(
    () => saveVisualTraces(visualTracesByMaterial),
    [visualTracesByMaterial],
  );

  useEffect(() => {
    const pending = materials.filter(
      (item) =>
        item.type === "application/pdf" &&
        item.url &&
        !isTemporaryFileUrl(item.url) &&
        !item.extractedText &&
        !item.extractingText,
    );
    if (!pending.length) return;
    pending.forEach(async (item) => {
      setMaterials((items) =>
        items.map((material) =>
          material.id === item.id
            ? { ...material, extractingText: true }
            : material,
        ),
      );
      try {
        const extractedText = await extractPdfTextFromUrl(item.url);
        setMaterials((items) =>
          items.map((material) =>
            material.id === item.id
              ? { ...material, extractedText, extractingText: false }
              : material,
          ),
        );
      } catch {
        setMaterials((items) =>
          items.map((material) =>
            material.id === item.id
              ? { ...material, extractingText: false }
              : material,
          ),
        );
      }
    });
  }, [materials]);

  const activeMaterial =
    materials.find((item) => item.id === activeId) || materials[0];
  const activeVisualTraces = visualTracesByMaterial[activeMaterial?.id] || [];
  const activeMaterialWithTraces = activeMaterial
    ? { ...activeMaterial, visualTraces: activeVisualTraces }
    : activeMaterial;

  function addMaterial(material) {
    setMaterials((items) => [material, ...items]);
    setActiveId(material.id);
    setRole("student");
  }

  function deleteMaterial(id) {
    setMaterials((items) => {
      const next = items.filter((item) => item.id !== id);
      if (activeId === id) setActiveId(next[0]?.id);
      return next;
    });
  }

  function addVisualTrace(materialId, trace) {
    setVisualTracesByMaterial((items) => ({
      ...items,
      [materialId]: [...(items[materialId] || []), trace].slice(-20),
    }));
  }

  function deleteVisualTrace(materialId, traceId) {
    setVisualTracesByMaterial((items) => ({
      ...items,
      [materialId]: (items[materialId] || []).filter(
        (trace) => trace.id !== traceId,
      ),
    }));
  }

  function clearVisualTraces(materialId) {
    setVisualTracesByMaterial((items) => ({
      ...items,
      [materialId]: [],
    }));
  }

  function sendVisualTraceToTutor(trace) {
    setTutorEvent({ id: `visual-${Date.now()}`, trace });
    setTutorOpen(true);
  }

  function beginResize(panel, event) {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = panel === "left" ? leftSidebarWidth : rightSidebarWidth;

    function handleMove(moveEvent) {
      const delta =
        panel === "left"
          ? moveEvent.clientX - startX
          : startX - moveEvent.clientX;
      const min = panel === "left" ? 300 : 340;
      const max = panel === "left" ? 560 : 680;
      const nextWidth = Math.min(max, Math.max(min, startWidth + delta));
      if (panel === "left") {
        setLeftSidebarWidth(nextWidth);
      } else {
        setRightSidebarWidth(nextWidth);
      }
    }

    function handleUp() {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  }

  return (
    <div className="h-screen overflow-hidden bg-[#f3f7fb] text-vlearn-ink">
      <Header role={role} onRoleChange={setRole} material={activeMaterial} />
      <div className="flex h-[calc(100vh-90px)]">
        <LeftSidebar
          materials={materials}
          activeId={activeMaterial?.id}
          width={leftSidebarWidth}
          onResizeStart={(event) => beginResize("left", event)}
          onSelect={setActiveId}
          role={role}
          query={query}
          onQueryChange={setQuery}
          onDelete={deleteMaterial}
        />
        <main className="relative flex min-w-0 flex-1">
          {role === "admin" ? (
            <AdminPanel
              onUpload={addMaterial}
              materials={materials}
              quizSettings={quizSettings}
              onQuizSettingsChange={setQuizSettings}
            />
          ) : (
            <>
              <PDFViewer
                material={activeMaterialWithTraces}
                quizOpen={quizOpen || tutorOpen}
                sidePanelWidth={rightSidebarWidth}
                visualTraces={activeVisualTraces}
                onAddVisualTrace={(trace) =>
                  addVisualTrace(activeMaterial.id, trace)
                }
                onDeleteVisualTrace={(traceId) =>
                  deleteVisualTrace(activeMaterial.id, traceId)
                }
                onVisualTraceToTutor={sendVisualTraceToTutor}
                onPageChange={setCurrentPage}
                pageJumpRequest={pageJumpRequest}
              />
              <TutorToggle
                isOpen={tutorOpen}
                quizOpen={quizOpen}
                onClick={() => setTutorOpen(true)}
              />
              <QuizToggle
                isOpen={quizOpen}
                tutorOpen={tutorOpen}
                onClick={() => setQuizOpen(true)}
              />
              <AnimatePresence>
                {quizOpen && (
                  <QuizSidebar
                    material={activeMaterialWithTraces}
                    quizSettings={quizSettings}
                    width={rightSidebarWidth}
                    onResizeStart={(event) => beginResize("right", event)}
                    onJumpPage={(pageNumber) =>
                      setPageJumpRequest({ page: pageNumber, id: Date.now() })
                    }
                    onClose={() => setQuizOpen(false)}
                  />
                )}
                {tutorOpen && (
                  <TutorSidebar
                    material={activeMaterialWithTraces}
                    page={currentPage}
                    event={tutorEvent}
                    width={rightSidebarWidth}
                    onResizeStart={(event) => beginResize("right", event)}
                    onJumpPage={(pageNumber) =>
                      setPageJumpRequest({ page: pageNumber, id: Date.now() })
                    }
                    onClose={() => setTutorOpen(false)}
                  />
                )}
              </AnimatePresence>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function Header({ role, onRoleChange, material }) {
  return (
    <header className="flex h-[90px] items-center justify-between border-b border-vlearn-line bg-white px-8">
      <div className="flex min-w-0 items-center gap-4">
        <button
          className="grid h-10 w-10 place-items-center rounded-xl border border-vlearn-line text-vlearn-blue"
          title="Quay lại"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-3 border-r border-vlearn-line pr-4">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-vlearn-blue font-black text-white">
            V
          </div>
          <div className="text-2xl font-extrabold">
            <span className="text-red-600">V</span>Learn
          </div>
        </div>
        <button
          className="grid h-10 w-10 place-items-center rounded-xl border border-vlearn-line bg-vlearn-soft text-vlearn-blue"
          title="Học liệu"
        >
          <BookOpen size={20} />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold leading-tight">
            {material?.name || "Chưa có tài liệu"}
          </h1>
          <p className="truncate text-sm font-medium text-vlearn-muted">
            COMP2010 · {material?.description || "Course learning material"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          className="grid h-10 w-10 place-items-center rounded-xl border border-vlearn-line text-vlearn-blue"
          title="Ngôn ngữ"
        >
          <Languages size={18} />
        </button>
        <button
          className="grid h-10 w-10 place-items-center rounded-xl border border-vlearn-line text-vlearn-blue"
          title="Giao diện tối"
        >
          <Moon size={18} />
        </button>
        <div className="flex rounded-xl border border-vlearn-line bg-vlearn-soft p-1">
          {["student", "admin"].map((item) => (
            <button
              key={item}
              onClick={() => onRoleChange(item)}
              className={`h-9 rounded-lg px-3 text-sm font-extrabold ${role === item ? "bg-vlearn-blue text-white" : "text-vlearn-blue"}`}
            >
              {item === "student" ? "Student" : "Admin"}
            </button>
          ))}
        </div>
        <div className="ml-2 flex items-center gap-3 rounded-full border border-vlearn-line bg-vlearn-soft px-5 py-3">
          <UserRound size={20} className="text-vlearn-blue" />
          <div>
            <p className="text-sm font-bold text-vlearn-blue">
              {role === "admin" ? "Quản trị viên" : "Sinh viên"}
            </p>
            <p className="text-base font-bold">
              {role === "admin" ? "Admin demo" : "Anonymous student"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

function LeftSidebar({
  materials,
  activeId,
  width,
  onResizeStart,
  onSelect,
  role,
  query,
  onQueryChange,
  onDelete,
}) {
  const filtered = materials.filter((item) =>
    `${item.name} ${item.day} ${item.description}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const grouped = filtered.reduce((acc, item) => {
    acc[item.day] = [...(acc[item.day] || []), item];
    return acc;
  }, {});

  return (
    <aside
      className="relative h-full shrink-0 overflow-y-auto border-r border-vlearn-line bg-white px-6 py-7"
      style={{ width }}
    >
      <div
        onMouseDown={onResizeStart}
        className="absolute right-0 top-0 z-20 h-full w-2 cursor-ew-resize border-r border-transparent hover:border-vlearn-blue/50 hover:bg-vlearn-blue/10"
        title="Kéo để đổi độ rộng sidebar"
      />
      <div className="mb-6 flex gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-vlearn-line bg-vlearn-soft text-vlearn-blue">
          <BookOpen size={22} />
        </div>
        <div>
          <h2 className="text-xl font-extrabold">Học liệu môn học</h2>
          <p className="mt-3 text-lg font-bold">Course learning materials</p>
          <p className="mt-4 text-sm leading-7 text-vlearn-muted">
            Chương, slide và tài liệu đã upload
          </p>
        </div>
      </div>

      <label className="mb-5 flex h-11 items-center gap-2 rounded-xl border border-vlearn-line bg-[#fbfdff] px-3">
        <Search size={17} className="text-vlearn-muted" />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
          placeholder="Tìm tài liệu"
        />
      </label>

      <div className="space-y-5 border-t border-vlearn-line pt-5">
        {Object.entries(grouped).map(([day, docs], index) => (
          <DayCard
            key={day}
            title={day}
            subtitle={`${docs.length} tài liệu · active`}
            open={index === 0}
          >
            <div className="space-y-3 pt-4">
              {docs.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => onSelect(doc.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-4 py-4 text-left transition ${
                    activeId === doc.id
                      ? "border-[#9cb9d8] bg-[#eef5fb] shadow-sm"
                      : "border-vlearn-line bg-white hover:bg-slate-50"
                  }`}
                >
                  <FileText size={18} className="text-vlearn-blue" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-extrabold">
                      {doc.name}
                    </span>
                    <span className="mt-2 block text-sm text-vlearn-muted">
                      {doc.pages || "?"} trang · {doc.uploadedBy}
                    </span>
                  </span>
                  {activeId === doc.id && (
                    <Check size={16} className="text-vlearn-blue" />
                  )}
                  {role === "admin" && !doc.id.startsWith("day0") && (
                    <span
                      onClick={(event) => {
                        event.stopPropagation();
                        onDelete(doc.id);
                      }}
                      className="grid h-8 w-8 place-items-center rounded-lg text-red-500 hover:bg-red-50"
                    >
                      <Trash2 size={15} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </DayCard>
        ))}
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
            {open && (
              <span className="rounded-full bg-[#dfeaf4] px-3 py-1 text-xs font-bold text-vlearn-blue">
                STUDYING
              </span>
            )}
          </div>
          <p className="mt-2 text-sm font-medium leading-5 text-[#8a9bb3]">
            {subtitle}
          </p>
        </div>
        <ChevronDown size={18} className="text-[#8a9bb3]" />
      </div>
      {children}
    </section>
  );
}

function AdminPanel({
  onUpload,
  materials,
  quizSettings,
  onQuizSettingsChange,
}) {
  const [day, setDay] = useState("Day 1");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileData, setFileData] = useState("");
  const [fileType, setFileType] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [extractStatus, setExtractStatus] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [pages, setPages] = useState(1);
  const [message, setMessage] = useState("");
  const fileRef = useRef(null);

  function updateQuizSetting(key, value) {
    onQuizSettingsChange((settings) => ({
      ...settings,
      [key]: Math.max(0, Math.min(100, Number(value) || 0)),
    }));
  }

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setFileType(file.type || "application/octet-stream");
    setExtractedText("");
    setIsExtracting(true);
    setExtractStatus("Đang đọc nội dung slide...");
    if (fileData?.startsWith("blob:")) {
      URL.revokeObjectURL(fileData);
    }
    setFileData(URL.createObjectURL(file));
    try {
      const text = await extractSlideText(file);
      setExtractedText(text);
      const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;
      setExtractStatus(
        text
          ? `Đã trích xuất toàn bộ text đọc được từ slide: khoảng ${wordCount} từ, ${text.length} ký tự. AI sẽ dùng nội dung này để tạo quiz.`
          : "Chưa đọc được text trong file này. AI sẽ dùng tên file và mô tả để tạo quiz.",
      );
    } catch (error) {
      setExtractStatus(
        `Không đọc được nội dung slide: ${error.message}. AI sẽ dùng tên file và mô tả.`,
      );
    } finally {
      setIsExtracting(false);
    }
  }

  function submit(event) {
    event.preventDefault();
    if (!fileName || !fileData) {
      setMessage("Vui lòng chọn file slide để upload.");
      return;
    }
    if (isExtracting) {
      setMessage("Đang đọc nội dung slide, vui lòng chờ hoàn tất rồi upload.");
      return;
    }
    const trimmedNotes = notes.trim();
    onUpload({
      id: `upload-${Date.now()}`,
      day,
      name: fileName,
      pages: Number(pages) || 1,
      type: fileType,
      url: fileData,
      uploadedBy: "Admin",
      uploadedAt: new Date().toISOString(),
      description: description || fileName,
      notes: trimmedNotes,
      extractedText,
    });
    setDescription("");
    setNotes("");
    setFileName("");
    setFileData("");
    setFileType("");
    setExtractedText("");
    setExtractStatus("");
    setIsExtracting(false);
    setPages(1);
    if (fileRef.current) fileRef.current.value = "";
    setMessage("Đã upload slide và thêm vào học liệu.");
  }

  return (
    <section className="h-full flex-1 overflow-y-auto bg-[#eef4fa] p-8">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_360px] gap-6">
        <form
          onSubmit={submit}
          className="rounded-2xl border border-vlearn-line bg-white p-6 shadow-vlearn"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-vlearn-soft text-vlearn-blue">
              <Upload size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black">Upload slide cho lớp học</h2>
              <p className="mt-1 text-sm font-semibold text-vlearn-muted">
                Admin thêm PDF/PPT. Ghi chú là tùy chọn, app vẫn tạo quiz nếu bỏ
                trống.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Buổi học">
              <select
                value={day}
                onChange={(event) => setDay(event.target.value)}
                className="form-control"
              >
                {["Day 1", "Day 2", "Day 3", "Day 4", "Day 5"].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Field>
            <Field label="Số trang">
              <input
                type="number"
                min="1"
                value={pages}
                onChange={(event) => setPages(event.target.value)}
                className="form-control"
              />
            </Field>
          </div>

          <Field label="Tên/mô tả tài liệu">
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="form-control"
              placeholder="Ví dụ: AI & LLM Foundation"
            />
          </Field>

          <Field label="File slide">
            <input
              ref={fileRef}
              onChange={handleFile}
              type="file"
              accept=".pdf,.ppt,.pptx"
              className="form-control file:mr-4 file:rounded-lg file:border-0 file:bg-vlearn-blue file:px-4 file:py-2 file:font-bold file:text-white"
            />
          </Field>
          {extractStatus && (
            <p className="mt-3 rounded-xl border border-vlearn-line bg-vlearn-soft px-4 py-3 text-sm font-bold text-vlearn-blue">
              {extractStatus}
            </p>
          )}
          {extractedText && (
            <div className="mt-3 rounded-xl border border-vlearn-line bg-[#fbfdff] p-4">
              <p className="text-sm font-black text-vlearn-blue">
                Preview nội dung đọc từ slide
              </p>
              <p className="mt-2 max-h-28 overflow-y-auto text-sm font-semibold leading-6 text-vlearn-muted">
                {extractedText.slice(0, 900)}
              </p>
            </div>
          )}

          <Field label="Ghi chú slide cho AI tạo quiz (tùy chọn)">
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="form-control min-h-[190px] resize-none leading-6"
              placeholder="Có thể bỏ trống. Nếu nhập outline/nội dung chính, quiz sẽ sát nội dung slide hơn."
            />
          </Field>

          <div className="mt-4 rounded-2xl border border-vlearn-line bg-[#fbfdff] p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="font-black text-vlearn-blue">
                  Phân bổ độ khó quiz
                </p>
                <p className="mt-1 text-xs font-semibold text-vlearn-muted">
                  Admin quy định tỉ lệ, hệ thống tự quy đổi theo số câu
                  5/10/15/20.
                </p>
              </div>
              <span className="rounded-full bg-vlearn-soft px-3 py-1 text-xs font-black text-vlearn-blue">
                {quizSettings.easy}/{quizSettings.medium}/{quizSettings.hard}
              </span>
            </div>
            {[
              ["easy", "Dễ"],
              ["medium", "Trung bình"],
              ["hard", "Khó"],
            ].map(([key, label]) => (
              <label
                key={key}
                className="mb-3 grid grid-cols-[90px_1fr_52px] items-center gap-3 text-sm font-bold text-vlearn-muted"
              >
                <span>{label}</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={quizSettings[key]}
                  onChange={(event) =>
                    updateQuizSetting(key, event.target.value)
                  }
                  className="accent-vlearn-blue"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={quizSettings[key]}
                  onChange={(event) =>
                    updateQuizSetting(key, event.target.value)
                  }
                  className="h-9 rounded-lg border border-vlearn-line bg-white px-2 text-right text-sm font-black text-vlearn-blue outline-none"
                />
              </label>
            ))}
          </div>

          <button
            disabled={isExtracting}
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-vlearn-blue font-extrabold text-white shadow-vlearn disabled:bg-[#b9c8d9]"
          >
            <Upload size={18} />
            {isExtracting ? "Đang đọc slide..." : "Upload slide"}
          </button>
          {message && (
            <p className="mt-4 rounded-xl border border-vlearn-line bg-[#fbfdff] px-4 py-3 text-sm font-bold text-vlearn-blue">
              {message}
            </p>
          )}
        </form>

        <aside className="rounded-2xl border border-vlearn-line bg-white p-5 shadow-vlearn">
          <h3 className="text-lg font-black">Tài liệu hiện có</h3>
          <div className="mt-4 space-y-3">
            {materials.slice(0, 8).map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-vlearn-line bg-[#fbfdff] p-4"
              >
                <p className="truncate font-extrabold">{item.name}</p>
                <p className="mt-2 text-sm font-semibold text-vlearn-muted">
                  {item.day} · {item.pages} trang
                </p>
                <p className="mt-2 text-xs font-semibold text-vlearn-muted">
                  {formatDate(item.uploadedAt)}
                </p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label className="mt-4 block">
      <span className="mb-2 block text-sm font-black text-vlearn-blue">
        {label}
      </span>
      {children}
    </label>
  );
}

const quickVisualQuestions = [
  "Giải thích vùng này",
  "Hình này muốn nói gì?",
  "Tôi cần ghi nhớ điều gì?",
  "Giải thích đơn giản hơn",
  "Cho tôi một ví dụ",
];

function PDFViewer({
  material,
  quizOpen,
  sidePanelWidth = 390,
  visualTraces,
  onAddVisualTrace,
  onDeleteVisualTrace,
  onVisualTraceToTutor,
  onPageChange,
  pageJumpRequest,
}) {
  const [zoom, setZoom] = useState(100);
  const [page, setPage] = useState(1);
  const [detectedPdfPages, setDetectedPdfPages] = useState(null);
  const [notes, setNotes] = useState([]);
  const [tool, setTool] = useState("read");
  const [highlighted, setHighlighted] = useState(false);
  const [selectionStart, setSelectionStart] = useState(null);
  const [selectionRect, setSelectionRect] = useState(null);
  const [visualQuestion, setVisualQuestion] = useState("");
  const [visualAnswer, setVisualAnswer] = useState("");
  const [visualLoading, setVisualLoading] = useState(false);
  const [visualError, setVisualError] = useState("");
  const [traceHistoryOpen, setTraceHistoryOpen] = useState(false);
  const visualLayerRef = useRef(null);
  const pdfCanvasRef = useRef(null);
  const totalPages = detectedPdfPages || material?.pages || 1;

  useEffect(() => {
    setPage(1);
    setDetectedPdfPages(null);
    onPageChange?.(1);
  }, [material?.id]);

  useEffect(() => {
    onPageChange?.(page);
  }, [page, onPageChange]);

  useEffect(() => {
    if (!pageJumpRequest?.page) return;
    setPage(Math.min(Math.max(1, pageJumpRequest.page), totalPages));
  }, [pageJumpRequest?.id]);

  function addNote() {
    setNotes((items) => [
      ...items,
      { id: Date.now(), page, text: `Ghi chú trang ${page}` },
    ]);
  }

  function downloadMaterial() {
    if (!material?.url) return;
    const link = document.createElement("a");
    link.href = material.url;
    link.download = material.name;
    link.click();
  }

  function getLayerPoint(event) {
    const layer = visualLayerRef.current;
    if (!layer) return { x: 0, y: 0 };
    const bounds = layer.getBoundingClientRect();
    return {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    };
  }

  function toPercentRect(rect) {
    const layer = visualLayerRef.current;
    if (!layer) return rect;
    const bounds = layer.getBoundingClientRect();
    return {
      x: (rect.x / bounds.width) * 100,
      y: (rect.y / bounds.height) * 100,
      width: (rect.width / bounds.width) * 100,
      height: (rect.height / bounds.height) * 100,
      page,
    };
  }

  function getSelectedImageDataUrl() {
    const canvas = pdfCanvasRef.current;
    const layer = visualLayerRef.current;
    if (!canvas || !layer || !selectionRect) return "";
    const layerBounds = layer.getBoundingClientRect();
    const scaleX = canvas.width / layerBounds.width;
    const scaleY = canvas.height / layerBounds.height;
    const cropX = Math.max(0, Math.round(selectionRect.x * scaleX));
    const cropY = Math.max(0, Math.round(selectionRect.y * scaleY));
    const cropW = Math.min(
      canvas.width - cropX,
      Math.round(selectionRect.width * scaleX),
    );
    const cropH = Math.min(
      canvas.height - cropY,
      Math.round(selectionRect.height * scaleY),
    );
    if (cropW < 8 || cropH < 8) return "";

    const output = document.createElement("canvas");
    output.width = cropW;
    output.height = cropH;
    const context = output.getContext("2d");
    context.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
    return output.toDataURL("image/png");
  }

  function startVisualSelection(event) {
    if (tool !== "visual") return;
    event.preventDefault();
    const point = getLayerPoint(event);
    setSelectionStart(point);
    setSelectionRect({ x: point.x, y: point.y, width: 0, height: 0 });
    setVisualAnswer("");
    setVisualError("");
  }

  function updateVisualSelection(event) {
    if (tool !== "visual" || !selectionStart) return;
    const point = getLayerPoint(event);
    setSelectionRect({
      x: Math.min(selectionStart.x, point.x),
      y: Math.min(selectionStart.y, point.y),
      width: Math.abs(point.x - selectionStart.x),
      height: Math.abs(point.y - selectionStart.y),
    });
  }

  function finishVisualSelection() {
    if (!selectionStart || !selectionRect) return;
    setSelectionStart(null);
    if (selectionRect.width < 24 || selectionRect.height < 24) {
      setSelectionRect(null);
    }
  }

  async function explainSelection(question) {
    if (!selectionRect) return;
    const selectedQuestion =
      question || visualQuestion || "Giải thích vùng này";
    const selection = toPercentRect(selectionRect);
    setVisualQuestion(selectedQuestion);
    setVisualLoading(true);
    setVisualError("");
    const selectedImageDataUrl = getSelectedImageDataUrl();
    try {
      const answer = await createVisualExplanation(
        material,
        selection,
        selectedQuestion,
        selectedImageDataUrl,
      );
      setVisualAnswer(answer);
      const trace = {
        id: `trace-${Date.now()}`,
        page,
        question: selectedQuestion,
        answer,
        selection,
        imageDataUrl: selectedImageDataUrl,
        createdAt: new Date().toISOString(),
      };
      onAddVisualTrace?.(trace);
      onVisualTraceToTutor?.(trace);
    } catch (error) {
      const answer = makeVisualFallbackExplanation(
        material,
        selection,
        selectedQuestion,
      );
      setVisualAnswer(answer);
      setVisualError(
        `${error.message}. Đang dùng giải thích fallback từ nội dung slide.`,
      );
      const trace = {
        id: `trace-${Date.now()}`,
        page,
        question: selectedQuestion,
        answer,
        selection,
        imageDataUrl: selectedImageDataUrl,
        createdAt: new Date().toISOString(),
      };
      onAddVisualTrace?.(trace);
      onVisualTraceToTutor?.(trace);
    } finally {
      setVisualLoading(false);
    }
  }

  function clearVisualSelection() {
    setSelectionRect(null);
    setSelectionStart(null);
    setVisualQuestion("");
    setVisualAnswer("");
    setVisualError("");
  }

  return (
    <section
      className="relative min-w-0 flex-1 overflow-hidden transition-all duration-300"
      style={{ marginRight: quizOpen ? sidePanelWidth : 0 }}
    >
      <div className="absolute left-6 right-6 top-5 z-10 flex items-center justify-between rounded-2xl border border-vlearn-line bg-white/95 px-4 py-3 shadow-vlearn backdrop-blur">
        <div className="flex items-center gap-2">
          <ToolbarButton
            active={tool === "read"}
            onClick={() => setTool("read")}
            icon={<Send size={16} />}
            label="Đọc"
          />
          <ToolbarButton
            active={tool === "pen"}
            onClick={() => {
              setTool("pen");
              addNote();
            }}
            icon={<PenLine size={16} />}
            label="Bút"
          />
          <ToolbarButton
            active={highlighted}
            onClick={() => setHighlighted((value) => !value)}
            icon={<Highlighter size={16} />}
            label="Highlight"
          />
          <ToolbarButton
            active={tool === "visual"}
            onClick={() =>
              setTool((value) => (value === "visual" ? "read" : "visual"))
            }
            icon={<ScanSearch size={16} />}
            label="Visual Explain"
          />
          <button
            type="button"
            onClick={() => setTraceHistoryOpen((value) => !value)}
            className="ml-4 rounded-full bg-vlearn-soft px-4 py-2 text-sm font-extrabold text-vlearn-blue hover:bg-white"
          >
            Trang {page} · {notes.length} note · {visualTraces.length} trace
          </button>
        </div>
        <div className="flex items-center gap-2">
          <ToolbarButton
            onClick={() => setZoom((value) => Math.max(60, value - 10))}
            icon={<ZoomOut size={16} />}
          />
          <span className="w-12 text-center text-sm font-extrabold">
            {zoom}%
          </span>
          <ToolbarButton
            onClick={() => setZoom((value) => Math.min(160, value + 10))}
            icon={<ZoomIn size={16} />}
          />
          <div className="mx-2 h-8 w-px bg-vlearn-line" />
          <ToolbarButton onClick={addNote} icon={<Plus size={17} />} />
          <ToolbarButton
            onClick={downloadMaterial}
            icon={<Download size={16} />}
          />
          <ToolbarButton
            onClick={() => {
              setZoom(100);
              setPage(1);
            }}
            icon={<RotateCcw size={16} />}
            muted
          />
          <ToolbarButton
            onClick={() => setNotes([])}
            icon={<Trash2 size={16} />}
            muted
          />
        </div>
      </div>

      <div
        className={`h-full overflow-y-auto bg-[#eaf1f8] pb-28 pt-32 ${quizOpen ? "px-3" : "px-8"}`}
      >
        <div
          className="relative mx-auto"
          style={{ width: `${zoom}%`, maxWidth: quizOpen ? 940 : 1050 }}
        >
          {material?.url && material.type === "application/pdf" ? (
            <PdfPageCanvas
              key={`${material.id}-${material.url}`}
              url={material.url}
              page={page}
              canvasRef={pdfCanvasRef}
              onTotalPages={setDetectedPdfPages}
            />
          ) : material?.needsReupload ? (
            <div className="rounded-2xl border border-[#9ec5e7] bg-white p-8 text-center shadow-vlearn">
              <p className="text-xl font-black text-vlearn-blue">
                Cần upload lại file PDF
              </p>
              <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-6 text-vlearn-muted">
                File upload trong bản demo chỉ giữ được trong phiên trình duyệt.
                Metadata vẫn còn, nhưng dữ liệu file đã mất sau khi reload. Vào
                tab Admin và upload lại file này để xem slide và dùng Visual
                Explain.
              </p>
            </div>
          ) : (
            <SlidePage
              page={page}
              total={totalPages}
              title={material?.description || "Slide preview"}
              material={material}
              highlighted={highlighted}
              zoom={100}
            />
          )}
          {tool === "visual" && (
            <div
              ref={visualLayerRef}
              onMouseDown={startVisualSelection}
              onMouseMove={updateVisualSelection}
              onMouseUp={finishVisualSelection}
              onMouseLeave={finishVisualSelection}
              className="absolute inset-0 z-20 cursor-crosshair rounded-2xl border-2 border-dashed border-vlearn-blue/40 bg-vlearn-blue/5"
            >
              <div className="absolute left-4 top-4 rounded-xl bg-white/95 px-4 py-2 text-sm font-black text-vlearn-blue shadow-vlearn">
                Kéo chuột để khoanh vùng cần giải thích
              </div>
              {selectionRect && (
                <div
                  className="absolute border-2 border-vlearn-blue bg-vlearn-blue/15 shadow-vlearn"
                  style={{
                    left: selectionRect.x,
                    top: selectionRect.y,
                    width: selectionRect.width,
                    height: selectionRect.height,
                  }}
                />
              )}
              {selectionRect && !selectionStart && (
                <VisualExplainMenu
                  rect={selectionRect}
                  question={visualQuestion}
                  loading={visualLoading}
                  onQuestionChange={setVisualQuestion}
                  onAsk={explainSelection}
                  onClear={clearVisualSelection}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {(visualAnswer || visualError || visualLoading) && (
        <VisualExplainPanel
          loading={visualLoading}
          error={visualError}
          answer={visualAnswer}
          question={visualQuestion}
          traceCount={visualTraces.length}
          onClose={clearVisualSelection}
        />
      )}

      {traceHistoryOpen && (
        <VisualTraceHistoryPanel
          traces={visualTraces}
          onClose={() => setTraceHistoryOpen(false)}
          onDeleteTrace={onDeleteVisualTrace}
          onClearTraces={() =>
            onDeleteVisualTrace
              ? visualTraces.forEach((trace) => onDeleteVisualTrace(trace.id))
              : null
          }
          onOpenTrace={(trace) => {
            setPage(Math.min(Math.max(1, trace.page || 1), totalPages));
            setVisualQuestion(trace.question || "");
            setVisualAnswer(trace.answer || "");
            setVisualError("");
            setTraceHistoryOpen(false);
          }}
        />
      )}

      <button
        onClick={() => setPage((value) => Math.max(1, value - 1))}
        className="absolute left-0 top-1/2 grid h-20 w-12 -translate-y-1/2 place-items-center rounded-r-2xl border border-vlearn-line bg-white text-[#8aa1bc] shadow-vlearn"
      >
        <ChevronLeft size={28} />
      </button>
      <button
        onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
        className="absolute right-0 top-1/2 grid h-20 w-12 -translate-y-1/2 place-items-center rounded-l-2xl border border-vlearn-line bg-white text-[#8aa1bc] shadow-vlearn"
      >
        <ChevronRight size={28} />
      </button>

      <div className="absolute bottom-0 left-0 right-0 flex h-[86px] items-center justify-center gap-5 border-t border-vlearn-line bg-white/95 shadow-[0_-10px_28px_rgba(15,79,147,0.08)]">
        <button
          onClick={() => setPage((value) => Math.max(1, value - 1))}
          className="grid h-11 w-11 place-items-center rounded-full border border-vlearn-line text-[#91a4bd]"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="grid gap-2 text-sm font-semibold text-vlearn-muted">
          <span>
            Trang <b className="px-2 text-vlearn-ink">{page}</b> / {totalPages}
          </span>
          <span>{material?.name}</span>
        </div>
        <button
          onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
          className="grid h-11 w-11 place-items-center rounded-full border border-vlearn-line text-vlearn-blue"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </section>
  );
}

function PdfPageCanvas({ url, page, canvasRef, onTotalPages }) {
  //const [status, setStatus] = useState("Đang tải trang PDF...");

  useEffect(() => {
    let cancelled = false;
    let renderTask = null;

    async function renderPage() {
      try {
        // setStatus("Đang tải trang PDF...");
        if (!url) {
          throw new Error("thiếu URL file PDF");
        }
        const pdf = await pdfjsLib.getDocument({ url }).promise;
        if (cancelled) return;
        onTotalPages(pdf.numPages);
        const safePage = Math.min(Math.max(page, 1), pdf.numPages);
        const pdfPage = await pdf.getPage(safePage);
        if (cancelled) return;
        const viewport = pdfPage.getViewport({ scale: 1.6 });
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        renderTask = pdfPage.render({ canvasContext: context, viewport });
        await renderTask.promise;
        if (!cancelled) setStatus("");
      } catch (error) {
        if (!cancelled) setStatus(`Không render được PDF: ${error.message}`);
      }
    }

    renderPage();

    return () => {
      cancelled = true;
      renderTask?.cancel?.();
    };
  }, [url, page, canvasRef, onTotalPages]);

  return (
    <div className="relative rounded-2xl border border-[#9ec5e7] bg-white shadow-vlearn">
      {status && (
        <p className="absolute left-4 top-4 z-10 rounded-xl bg-vlearn-soft px-4 py-3 text-sm font-black text-vlearn-blue">
          {status}
        </p>
      )}
      <canvas
        ref={canvasRef}
        className="block h-auto w-full rounded-xl bg-white"
      />
    </div>
  );
}

function VisualExplainMenu({
  rect,
  question,
  loading,
  onQuestionChange,
  onAsk,
  onClear,
}) {
  return (
    <div
      className="absolute z-30 w-[360px] overflow-hidden rounded-2xl border border-[#b8d0ea] bg-white/95 shadow-[0_24px_60px_rgba(15,79,147,0.20)] backdrop-blur"
      style={{
        left: Math.max(
          12,
          Math.min(rect.x + rect.width + 12, window.innerWidth - 820),
        ),
        top: Math.max(rect.y, 12),
      }}
      onMouseDown={(event) => event.stopPropagation()}
      onMouseMove={(event) => event.stopPropagation()}
      onMouseUp={(event) => event.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b border-vlearn-line bg-vlearn-soft px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-vlearn-blue text-white">
            <ScanSearch size={16} />
          </div>
          <div>
            <p className="text-sm font-black text-vlearn-blue">
              Visual Explain
            </p>
            <p className="text-xs font-semibold text-vlearn-muted">
              Vùng đã khoanh sẽ được lưu thành trace
            </p>
          </div>
        </div>
        <button
          onClick={onClear}
          className="grid h-8 w-8 place-items-center rounded-full border border-vlearn-line bg-white text-vlearn-muted"
        >
          <X size={15} />
        </button>
      </div>
      <div className="p-4">
        <div className="flex flex-wrap gap-2">
          {quickVisualQuestions.map((item) => (
            <button
              key={item}
              onClick={() => onAsk(item)}
              disabled={loading}
              className="rounded-full border border-vlearn-line bg-[#fbfdff] px-3 py-2 text-left text-xs font-black text-vlearn-ink hover:border-vlearn-blue hover:bg-vlearn-soft hover:text-vlearn-blue disabled:opacity-50"
            >
              {item}
            </button>
          ))}
        </div>
        <div className="mt-4 flex gap-2 rounded-xl border border-vlearn-line bg-[#fbfdff] p-2">
          <input
            value={question}
            onChange={(event) => onQuestionChange(event.target.value)}
            placeholder="Nhập câu hỏi tự do..."
            className="min-w-0 flex-1 bg-transparent px-2 text-sm font-semibold outline-none"
          />
          <button
            onClick={() => onAsk(question)}
            disabled={loading}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-vlearn-blue text-white disabled:bg-[#b9c8d9]"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function VisualExplainPanel({
  loading,
  error,
  answer,
  question,
  traceCount,
  onClose,
}) {
  return (
    <aside className="absolute bottom-24 right-5 z-40 w-[460px] overflow-hidden rounded-2xl border border-[#b8d0ea] bg-white shadow-[0_24px_70px_rgba(15,79,147,0.22)]">
      <div className="border-b border-vlearn-line bg-[#f7fbff] px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-vlearn-blue text-white">
              <ScanSearch size={20} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-vlearn-blue">
                VLearn Visual Explain
              </p>
              <h3 className="mt-1 text-lg font-black leading-6">
                {question || "Giải thích vùng đã khoanh"}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full border border-vlearn-line bg-white text-vlearn-muted"
          >
            <X size={15} />
          </button>
        </div>
      </div>
      <div className="p-5">
        {error && (
          <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">
            {error}
          </p>
        )}
        {loading ? (
          <div className="rounded-xl border border-vlearn-line bg-[#fbfdff] p-4 text-sm font-bold text-vlearn-muted">
            Đang phân tích vùng chọn trong ngữ cảnh slide...
          </div>
        ) : (
          <div className="max-h-[340px] overflow-y-auto rounded-xl border border-vlearn-line bg-[#fbfdff] p-4">
            <SimpleMarkdownText content={answer} />
          </div>
        )}
        <div className="mt-4 flex items-center justify-between rounded-xl bg-vlearn-soft px-4 py-3">
          <span className="text-xs font-black uppercase tracking-wide text-vlearn-blue">
            Tutor context
          </span>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-vlearn-blue">
            {traceCount} trace saved
          </span>
        </div>
      </div>
    </aside>
  );
}

function VisualTraceHistoryPanel({
  traces,
  onOpenTrace,
  onDeleteTrace,
  onClearTraces,
  onClose,
}) {
  return (
    <aside className="absolute right-5 top-24 z-40 flex max-h-[calc(100vh-150px)] w-[420px] flex-col overflow-hidden rounded-2xl border border-[#b8d0ea] bg-white shadow-[0_24px_70px_rgba(15,79,147,0.22)]">
      <div className="flex items-start justify-between gap-3 border-b border-vlearn-line bg-[#f7fbff] px-5 py-4">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-vlearn-blue">
            Visual Explain History
          </p>
          <h3 className="mt-1 text-lg font-black">Các vùng đã hỏi</h3>
          <p className="mt-1 text-xs font-semibold text-vlearn-muted">
            {traces.length} trace được lưu cho tài liệu này
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClearTraces}
            disabled={!traces.length}
            className="grid h-8 w-8 place-items-center rounded-full border border-red-100 bg-red-50 text-red-600 disabled:opacity-40"
            title="Xóa tất cả trace"
          >
            <Trash2 size={15} />
          </button>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full border border-vlearn-line bg-white text-vlearn-muted"
          >
            <X size={15} />
          </button>
        </div>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {!traces.length && (
          <div className="rounded-xl border border-vlearn-line bg-[#fbfdff] p-4 text-sm font-semibold leading-6 text-vlearn-muted">
            Chưa có vùng nào được lưu. Dùng Visual Explain, khoanh một vùng trên
            slide và đặt câu hỏi để tạo trace.
          </div>
        )}
        {[...traces].reverse().map((trace) => (
          <article
            key={trace.id}
            className="overflow-hidden rounded-2xl border border-vlearn-line bg-[#fbfdff]"
          >
            {trace.imageDataUrl && (
              <div className="bg-white p-2">
                <img
                  src={trace.imageDataUrl}
                  alt="Vùng đã khoanh"
                  className="max-h-36 w-full rounded-xl border border-vlearn-line object-contain"
                />
              </div>
            )}
            <div className="p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="rounded-full bg-vlearn-soft px-3 py-1 text-xs font-black text-vlearn-blue">
                  Trang {trace.page}
                </span>
                <span className="text-xs font-semibold text-vlearn-muted">
                  {trace.createdAt ? formatDate(trace.createdAt) : ""}
                </span>
              </div>
              <p className="font-black leading-6 text-vlearn-ink">
                {trace.question}
              </p>
              <div className="mt-2 line-clamp-4 text-sm leading-6 text-vlearn-muted">
                <MarkdownContent content={trace.answer} />
              </div>
              <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
                <button
                  type="button"
                  onClick={() => onOpenTrace(trace)}
                  className="h-10 rounded-xl bg-vlearn-blue text-sm font-black text-white"
                >
                  Xem lại trace này
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteTrace?.(trace.id)}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-red-100 bg-red-50 text-red-600 hover:bg-red-100"
                  title="Xóa trace"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </aside>
  );
}

function ToolbarButton({
  icon,
  label,
  active = false,
  muted = false,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
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

function SlidePage({ page, total, title, material, highlighted, zoom }) {
  return (
    <article
      className="mx-auto mb-9 max-w-[1050px] rounded-[26px] border border-[#9ec5e7] bg-[#fffdf5] p-6 shadow-sm"
      style={{
        transform: `scale(${zoom / 100})`,
        transformOrigin: "top center",
      }}
    >
      <div className="flex items-center justify-between border-b border-[#efe8d7] pb-4 text-xs font-semibold text-[#7894b9]">
        <div className="grid gap-3">
          <span>
            Trang {page} / {total}
          </span>
          <span>
            Page {page} / {total}
          </span>
        </div>
        <span>{material?.name}</span>
      </div>
      <div className="relative mt-5 h-[430px] overflow-hidden rounded-2xl border border-[#c9d7c8] bg-[#96b99f] p-9 shadow">
        <p className="mb-16 text-xs font-bold text-[#21334d]">
          AI IN ACTION - {material?.day}
        </p>
        <h2
          className={`text-3xl font-black text-[#172033] ${highlighted ? "bg-yellow-200" : ""}`}
        >
          {title}
        </h2>
        <p className="mt-4 max-w-xl text-sm italic leading-6 text-[#38513f]">
          {material?.notes}
        </p>
        <p className="absolute bottom-9 left-9 text-xs font-semibold text-[#21334d]">
          Instructor: Mai Anh Nguyen
        </p>
        <p className="absolute right-10 top-1/2 -rotate-12 text-2xl font-black tracking-widest text-[#7ea287]/60">
          VLEARN.EDU.VN
        </p>
      </div>
    </article>
  );
}

function TutorToggle({ isOpen, quizOpen, onClick }) {
  if (isOpen) return null;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={`absolute right-4 z-20 flex -translate-y-1/2 items-center gap-2 rounded-l-2xl border border-vlearn-line bg-white px-3 py-4 text-sm font-extrabold text-vlearn-blue shadow-vlearn ${quizOpen ? "top-[42%]" : "top-[46%]"}`}
    >
      <Bot size={20} />
      Tutor
    </motion.button>
  );
}

function QuizToggle({ isOpen, tutorOpen, onClick }) {
  if (isOpen) return null;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={`absolute right-4 z-20 flex -translate-y-1/2 items-center gap-2 rounded-l-2xl border border-vlearn-line bg-white px-3 py-4 text-sm font-extrabold text-vlearn-blue shadow-vlearn ${tutorOpen ? "top-[58%]" : "top-[54%]"}`}
    >
      <BrainCircuit size={20} />
      Quiz
    </motion.button>
  );
}

function TutorMessageContent({ content, onJumpPage }) {
  return <MarkdownContent content={content} onJumpPage={onJumpPage} />;
}

function LegacyTutorMessageContent({ content, onJumpPage }) {
  const normalizedContent = String(content).replace(
    /\[Trang\s*(?:xx|x|\?+)\]/gi,
    "[Trang 1]",
  );
  const parts = normalizedContent.split(/(\[Trang\s+\d+\])/gi);
  return (
    <p className="whitespace-pre-line">
      {parts.map((part, index) => {
        const match = part.match(/\[Trang\s+(\d+)\]/i);
        if (!match)
          return (
            <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
          );
        const pageNumber = Number(match[1]);
        return (
          <button
            key={`${part}-${index}`}
            onClick={() => onJumpPage?.(pageNumber)}
            className="mx-1 inline-flex rounded-full border border-vlearn-line bg-white px-2 py-0.5 text-xs font-black text-vlearn-blue hover:bg-vlearn-soft"
            title={`Nhảy đến trang ${pageNumber}`}
          >
            {part}
          </button>
        );
      })}
    </p>
  );
}

function SimpleMarkdownText({ content }) {
  return <MarkdownContent content={content} />;
}

function InlineMarkdown({ text, onJumpPage }) {
  const normalized = String(text || "").replace(/\*\*/g, "");
  const parts = normalized.split(/(\[Trang\s+\d+\])/gi);
  return parts.map((part, index) => {
    const match = part.match(/\[Trang\s+(\d+)\]/i);
    if (!match)
      return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;
    const pageNumber = Number(match[1]);
    return (
      <button
        key={`${part}-${index}`}
        onClick={() => onJumpPage?.(pageNumber)}
        className="mx-1 inline-flex rounded-full border border-vlearn-line bg-white px-2 py-0.5 text-xs font-black text-vlearn-blue hover:bg-vlearn-soft"
        title={`Nhảy đến trang ${pageNumber}`}
      >
        {part}
      </button>
    );
  });
}

function MarkdownContent({ content, onJumpPage }) {
  const normalizedContent = String(content || "").replace(
    /\[Trang\s*(?:xx|x|\?+)\]/gi,
    "[Trang 1]",
  );
  const blocks = normalizedContent.split(/```/);
  return (
    <div className="space-y-3 text-sm font-semibold leading-7 text-vlearn-muted">
      {blocks.map((block, blockIndex) => {
        if (blockIndex % 2 === 1) {
          const code = block.replace(/^\w+\n/, "").trim();
          return (
            <pre
              key={`code-${blockIndex}`}
              className="overflow-x-auto rounded-xl bg-[#0f172a] p-3 text-xs font-semibold leading-5 text-slate-100"
            >
              <code>{code}</code>
            </pre>
          );
        }
        return block.split(/\n+/).map((rawLine, lineIndex) => {
          const line = rawLine.trim();
          if (!line) return null;
          const heading = line.match(/^#{1,4}\s+(.+)/);
          if (heading) {
            return (
              <h4
                key={`${blockIndex}-${lineIndex}`}
                className="pt-1 text-base font-black text-vlearn-ink"
              >
                {heading[1].replace(/\*\*/g, "")}
              </h4>
            );
          }
          const bullet = line.match(/^[-*]\s+(.+)/);
          return (
            <p
              key={`${blockIndex}-${lineIndex}`}
              className={bullet ? "pl-4 before:mr-2 before:content-['•']" : ""}
            >
              <InlineMarkdown
                text={bullet ? bullet[1] : line}
                onJumpPage={onJumpPage}
              />
            </p>
          );
        });
      })}
    </div>
  );
}

function LegacySimpleMarkdownText({ content }) {
  const lines = String(content || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  return (
    <div className="space-y-3 text-sm font-semibold leading-7 text-vlearn-muted">
      {lines.map((line, index) => {
        const heading = line.match(/^#{1,4}\s+(.+)/);
        if (heading) {
          return (
            <h4
              key={`${line}-${index}`}
              className="pt-1 text-base font-black text-vlearn-ink"
            >
              {heading[1]}
            </h4>
          );
        }
        const bullet = line.match(/^[-*]\s+(.+)/);
        return (
          <p
            key={`${line}-${index}`}
            className={bullet ? "pl-4 before:mr-2 before:content-['•']" : ""}
          >
            {(bullet ? bullet[1] : line).replace(/\*\*/g, "")}
          </p>
        );
      })}
    </div>
  );
}

function TutorSidebar({
  material,
  page,
  event,
  width = 390,
  onResizeStart,
  onJumpPage,
  onClose,
}) {
  const [chatState, setChatState] = useState(() =>
    loadTutorChats(material?.id || "default"),
  );
  const [input, setInput] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const handledEventRef = useRef(null);

  useEffect(() => {
    setChatState(loadTutorChats(material?.id || "default"));
  }, [material?.id]);

  useEffect(() => {
    saveTutorChats(material?.id || "default", chatState);
  }, [material?.id, chatState]);

  useEffect(() => {
    if (!event?.trace || handledEventRef.current === event.id) return;
    handledEventRef.current = event.id;
    const trace = event.trace;
    const content = [
      `Kết quả Visual Explain đã được lưu để bạn hỏi tiếp. [Trang ${trace.page || page}]`,
      trace.question ? `**Câu hỏi gốc:** ${trace.question}` : "",
      trace.answer || "",
    ]
      .filter(Boolean)
      .join("\n\n");
    updateSessionById(chatState.activeSessionId, (session) => ({
      ...session,
      updatedAt: new Date().toISOString(),
      messages: [
        ...session.messages,
        {
          role: "assistant",
          content,
          imageDataUrl: trace.imageDataUrl || "",
        },
      ],
    }));
  }, [event?.id]);

  const activeSession =
    chatState.sessions.find(
      (session) => session.id === chatState.activeSessionId,
    ) || chatState.sessions[0];
  const messages = activeSession?.messages || [getInitialTutorMessage()];

  function updateActiveSession(updater) {
    updateSessionById(chatState.activeSessionId, updater);
  }

  function updateSessionById(sessionId, updater) {
    setChatState((state) => ({
      ...state,
      sessions: state.sessions.map((session) => {
        if (session.id !== sessionId) return session;
        return updater(session);
      }),
    }));
  }

  function createNewChat() {
    const session = createTutorSession();
    setChatState((state) => ({
      activeSessionId: session.id,
      sessions: [session, ...state.sessions],
    }));
    setInput("");
  }

  function switchChat(sessionId) {
    setChatState((state) => ({ ...state, activeSessionId: sessionId }));
    setInput("");
    setImageDataUrl("");
  }

  function deleteChat(sessionId) {
    setChatState((state) => {
      const nextSessions = state.sessions.filter(
        (session) => session.id !== sessionId,
      );
      const fallbackSession = nextSessions[0] || createTutorSession();
      return {
        activeSessionId:
          state.activeSessionId === sessionId
            ? fallbackSession.id
            : state.activeSessionId,
        sessions: nextSessions.length ? nextSessions : [fallbackSession],
      };
    });
  }

  async function attachImage(file) {
    if (!file || !file.type?.startsWith("image/")) return;
    const dataUrl = await readFileAsDataUrl(file);
    setImageDataUrl(dataUrl);
  }

  async function handlePaste(event) {
    const file = Array.from(event.clipboardData?.files || []).find((item) =>
      item.type.startsWith("image/"),
    );
    if (file) {
      event.preventDefault();
      await attachImage(file);
    }
  }

  async function sendQuestion() {
    const question = input.trim();
    if ((!question && !imageDataUrl) || loading) return;
    const sessionId = chatState.activeSessionId;
    const userMessage = {
      role: "user",
      content: question || "Hãy giải thích ảnh này trong ngữ cảnh bài học.",
      imageDataUrl,
    };
    const title =
      messages.length <= 1
        ? question.slice(0, 42) || "Đoạn chat mới"
        : activeSession.title;
    updateSessionById(sessionId, (session) => ({
      ...session,
      title,
      updatedAt: new Date().toISOString(),
      messages: [...session.messages, userMessage],
    }));
    setInput("");
    setImageDataUrl("");
    setLoading(true);
    try {
      const answer = await askVlearnTutor(
        material,
        page,
        messages,
        userMessage.content,
        userMessage.imageDataUrl,
      );
      updateSessionById(sessionId, (session) => ({
        ...session,
        updatedAt: new Date().toISOString(),
        messages: [...session.messages, { role: "assistant", content: answer }],
      }));
    } catch (error) {
      updateSessionById(sessionId, (session) => ({
        ...session,
        updatedAt: new Date().toISOString(),
        messages: [
          ...session.messages,
          {
            role: "assistant",
            content: `${makeTutorFallbackAnswer(material, question, page)}\n\n(${error.message})`,
          },
        ],
      }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.aside
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="absolute right-0 top-0 z-30 flex h-full flex-col border-l border-vlearn-line bg-white shadow-[-12px_0_32px_rgba(15,79,147,0.12)]"
      style={{ width }}
    >
      <div
        onMouseDown={onResizeStart}
        className="absolute left-0 top-0 z-40 h-full w-2 cursor-ew-resize border-l border-transparent hover:border-vlearn-blue/50 hover:bg-vlearn-blue/10"
        title="Kéo để đổi độ rộng panel"
      />
      <div className="flex items-start justify-between border-b border-vlearn-line px-5 py-5">
        <div className="flex gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-vlearn-soft text-vlearn-blue">
            <Bot size={22} />
          </div>
          <div>
            <h2 className="text-xl font-black">VLearn Tutor</h2>
            <p className="mt-1 text-sm font-medium text-emerald-600">
              Trợ lý học theo ngữ cảnh
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={createNewChat}
            className="grid h-9 w-9 place-items-center rounded-full border border-vlearn-line text-vlearn-blue"
            title="Tạo đoạn chat mới"
          >
            <Plus size={18} />
          </button>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full border border-vlearn-line text-vlearn-muted"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="border-b border-vlearn-line bg-[#fbfdff] px-5 py-3">
        <p className="text-xs font-black uppercase tracking-wide text-vlearn-blue">
          Ngữ cảnh
        </p>
        <p className="mt-1 truncate text-sm font-semibold text-vlearn-muted">
          {material?.name} · Trang slide {page} ·{" "}
          {material?.visualTraces?.length || 0} trace
        </p>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {chatState.sessions.map((session) => (
            <div
              key={session.id}
              className={`flex max-w-[220px] shrink-0 overflow-hidden rounded-full border ${
                session.id === chatState.activeSessionId
                  ? "border-vlearn-blue bg-vlearn-blue text-white"
                  : "border-vlearn-line bg-white text-vlearn-blue"
              }`}
            >
              <button
                onClick={() => switchChat(session.id)}
                className="min-w-0 flex-1 truncate px-3 py-2 text-xs font-black"
                title={session.title}
              >
                {session.title}
              </button>
              <button
                onClick={() => deleteChat(session.id)}
                className="grid w-8 place-items-center border-l border-white/20 text-current opacity-80 hover:opacity-100"
                title="Xóa đoạn chat"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="mb-4 flex flex-wrap gap-2">
          {[
            "Tóm tắt slide này",
            "Giải thích đơn giản hơn",
            "Cho ví dụ dễ hiểu",
            "Tôi cần ghi nhớ gì?",
          ].map((item) => (
            <button
              key={item}
              onClick={() => setInput(item)}
              className="rounded-full border border-vlearn-line bg-[#fbfdff] px-3 py-2 text-xs font-black text-vlearn-blue hover:bg-vlearn-soft"
            >
              {item}
            </button>
          ))}
        </div>
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm font-semibold leading-6 shadow-sm ${
                  message.role === "user"
                    ? "bg-vlearn-blue text-white"
                    : "border border-vlearn-line bg-[#fbfdff] text-vlearn-muted"
                }`}
              >
                {message.imageDataUrl && (
                  <img
                    src={message.imageDataUrl}
                    alt="Ảnh đính kèm"
                    className="mb-3 max-h-44 w-full rounded-xl border border-white/30 object-contain"
                  />
                )}
                <TutorMessageContent
                  content={message.content}
                  onJumpPage={onJumpPage}
                />
              </div>
            </div>
          ))}
          {loading && (
            <div className="rounded-2xl border border-vlearn-line bg-[#fbfdff] px-4 py-3 text-sm font-bold text-vlearn-muted">
              Tutor đang trả lời...
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-vlearn-line bg-white px-5 py-4">
        {imageDataUrl && (
          <div className="mb-3 flex items-center gap-3 rounded-2xl border border-vlearn-line bg-[#fbfdff] p-2">
            <img
              src={imageDataUrl}
              alt="Ảnh sắp gửi"
              className="h-14 w-20 rounded-xl border border-vlearn-line object-contain"
            />
            <p className="min-w-0 flex-1 text-xs font-bold text-vlearn-muted">
              Ảnh sẽ được kiểm tra liên quan đến bài học trước khi Tutor trả
              lời.
            </p>
            <button
              onClick={() => setImageDataUrl("")}
              className="grid h-8 w-8 place-items-center rounded-full border border-vlearn-line text-vlearn-muted"
            >
              <X size={14} />
            </button>
          </div>
        )}
        <div className="flex gap-2 rounded-2xl border border-vlearn-line bg-[#fbfdff] p-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => attachImage(event.target.files?.[0])}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-vlearn-line bg-white text-vlearn-blue"
            title="Dán hoặc tải ảnh lên để hỏi"
          >
            <Upload size={17} />
          </button>
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onPaste={handlePaste}
            onKeyDown={(event) => {
              if (event.key === "Enter") sendQuestion();
            }}
            placeholder="Nhập câu hỏi, paste ảnh hoặc hỏi về slide..."
            className="min-w-0 flex-1 bg-transparent px-2 text-sm font-semibold outline-none"
          />
          <button
            onClick={sendQuestion}
            disabled={(!input.trim() && !imageDataUrl) || loading}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-vlearn-blue text-white disabled:bg-[#b9c8d9]"
          >
            <Send size={17} />
          </button>
        </div>
      </div>
    </motion.aside>
  );
}

function QuizSidebar({
  material,
  quizSettings = defaultQuizSettings,
  width = 390,
  onResizeStart,
  onJumpPage,
  onClose,
}) {
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [source, setSource] = useState("");
  const [error, setError] = useState("");
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [questionHistory, setQuestionHistory] = useState([]);
  const [questionCount, setQuestionCount] = useState(5);
  const [attemptVersion, setAttemptVersion] = useState(0);
  const savedAttemptRef = useRef(null);

  const score = useMemo(
    () =>
      answers.filter((answer, index) => answer === questions[index]?.correct)
        .length,
    [answers, questions],
  );
  const completed =
    started && !loading && questions.length > 0 && current >= questions.length;
  const question = questions[current];
  const attemptedHistory = useMemo(
    () => getAttemptedQuestionHistory(material?.id || "default"),
    [material?.id, attemptVersion],
  );
  const quizAttempts = useMemo(
    () => loadQuizAttempts(material?.id || "default"),
    [material?.id, attemptVersion],
  );

  useEffect(() => {
    savedAttemptRef.current = null;
  }, [material?.id, questions]);

  useEffect(() => {
    if (!completed || savedAttemptRef.current === questions) return;
    savedAttemptRef.current = questions;
    saveQuizAttempt(material?.id || "default", {
      id: `attempt-${Date.now()}`,
      createdAt: new Date().toISOString(),
      score,
      total: questions.length,
      answers,
      questions,
    });
    setAttemptVersion((value) => value + 1);
  }, [completed, material?.id, questions, answers, score]);

  async function generateQuiz() {
    setLoading(true);
    setError("");
    setStarted(false);
    setQuestions([]);
    setCurrent(0);
    setSelected(null);
    setSubmitted(false);
    setAnswers([]);
    try {
      const freshAttemptedHistory = getAttemptedQuestionHistory(
        material?.id || "default",
      );
      const previousQuizQuestions = [
        ...freshAttemptedHistory,
        ...questionHistory,
      ];
      const batch = await createQuizWithAI(
        material,
        questionCount,
        previousQuizQuestions,
        quizSettings,
      );
      const generated = mergeUniqueQuizQuestions([], batch, questionCount);
      const aiQuestions = forceFillQuizQuestions(
        material,
        generated,
        questionCount,
        previousQuizQuestions,
        quizSettings,
      );
      setQuestions(aiQuestions);
      setQuestionHistory((items) =>
        [...items, ...aiQuestions.map(summarizeQuestionForHistory)].slice(-80),
      );
      setSource("AI");
    } catch (err) {
      const freshAttemptedHistory = getAttemptedQuestionHistory(
        material?.id || "default",
      );
      const previousQuizQuestions = [
        ...freshAttemptedHistory,
        ...questionHistory,
      ];
      const fallback = forceFillQuizQuestions(
        material,
        normalizeQuizQuestions(
          makeContentFallbackQuestions(
            material,
            questionCount,
            previousQuizQuestions,
            quizSettings,
          ),
          questionCount,
          material,
        ),
        questionCount,
        previousQuizQuestions,
        quizSettings,
      );
      setQuestions(fallback);
      setQuestionHistory((items) =>
        [...items, ...fallback.map(summarizeQuestionForHistory)].slice(-80),
      );
      setSource("Slide text");
      setError(
        `${err.message}. Đang tạo câu hỏi fallback từ nội dung đã đọc trong slide.`,
      );
    } finally {
      setStarted(true);
      setLoading(false);
    }
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

  function handleDeleteAttempt(attemptId) {
    deleteQuizAttempt(material?.id || "default", attemptId);
    setAttemptVersion((value) => value + 1);
  }

  function handleClearAttempts() {
    clearQuizAttempts(material?.id || "default");
    setAttemptVersion((value) => value + 1);
  }

  return (
    <motion.aside
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="absolute right-0 top-0 z-30 flex h-full flex-col border-l border-vlearn-line bg-white shadow-[-12px_0_32px_rgba(15,79,147,0.12)]"
      style={{ width }}
    >
      <div
        onMouseDown={onResizeStart}
        className="absolute left-0 top-0 z-40 h-full w-2 cursor-ew-resize border-l border-transparent hover:border-vlearn-blue/50 hover:bg-vlearn-blue/10"
        title="Kéo để đổi độ rộng panel"
      />
      <div className="flex items-start justify-between border-b border-vlearn-line px-5 py-5">
        <div className="flex gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-vlearn-soft text-vlearn-blue">
            <BrainCircuit size={22} />
          </div>
          <div>
            <h2 className="text-xl font-black">AI Quiz</h2>
            <p className="mt-1 text-sm font-medium text-vlearn-muted">
              Kiểm tra mức độ hiểu bài
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="grid h-9 w-9 place-items-center rounded-full border border-vlearn-line text-vlearn-muted"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        {!started && (
          <IntroCard
            material={material}
            loading={loading}
            questionCount={questionCount}
            suggestedCount={suggestQuestionCount(material)}
            quizSettings={quizSettings}
            attemptCount={quizAttempts.length}
            attempts={quizAttempts}
            onQuestionCountChange={setQuestionCount}
            onGenerate={generateQuiz}
            onDeleteAttempt={handleDeleteAttempt}
            onClearAttempts={handleClearAttempts}
            onJumpPage={onJumpPage}
          />
        )}
        {started && error && (
          <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">
            Đang dùng quiz mẫu: {error}
          </p>
        )}
        {started && !completed && question && (
          <>
            <ProgressBar
              current={current + 1}
              total={questions.length}
              source={source}
            />
            <QuestionCard
              question={question}
              current={current}
              selected={selected}
              submitted={submitted}
              onSelect={setSelected}
              onJumpPage={onJumpPage}
            />
          </>
        )}
        {completed && (
          <ResultCard
            score={score}
            total={questions.length}
            questions={questions}
            answers={answers}
            attempts={quizAttempts}
            onJumpPage={onJumpPage}
            onRetry={generateQuiz}
          />
        )}
      </div>

      {started && !completed && question && (
        <div className="border-t border-vlearn-line bg-white px-5 py-4">
          <button
            onClick={submitAnswer}
            disabled={selected === null || submitted}
            className="mb-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-vlearn-blue font-extrabold text-white disabled:cursor-not-allowed disabled:bg-[#b9c8d9]"
          >
            <Check size={18} />
            Nộp câu trả lời
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

function IntroCard({
  material,
  loading,
  questionCount,
  suggestedCount,
  quizSettings,
  attemptCount = 0,
  attempts = [],
  onQuestionCountChange,
  onGenerate,
  onDeleteAttempt,
  onClearAttempts,
  onJumpPage,
}) {
  const difficultyPlan = buildDifficultyPlan(questionCount, quizSettings);
  return (
    <section className="rounded-2xl border border-vlearn-line bg-[#fbfdff] p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-2 text-sm font-bold text-emerald-600">
        <Sparkles size={18} />
        Contextual learning assistant
      </div>
      <p className="mb-3 text-xs font-semibold text-vlearn-muted">
        Ngữ cảnh: {material?.name}
      </p>
      <h3 className="text-lg font-black">Tạo quiz từ bài học đang mở</h3>
      <p className="mt-3 text-sm leading-6 text-vlearn-muted">
        Bấm Generate Quiz để tạo câu hỏi ưu tiên Agenda, mục tiêu bài học và
        kiến thức cốt lõi trong slide. Hệ thống sẽ tạo đủ bộ câu hỏi rồi mới
        hiển thị quiz.
      </p>
      {attemptCount > 0 && (
        <p className="mt-3 rounded-xl border border-vlearn-line bg-white px-3 py-2 text-xs font-black text-vlearn-blue">
          Đã lưu {attemptCount} lượt làm quiz cho bài này. Lần tạo mới sẽ tránh
          lặp lại các câu đã làm.
        </p>
      )}
      {material?.extractingText && (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
          Đang đọc text từng trang để tạo citation đúng và phủ Agenda tốt hơn...
        </p>
      )}
      <div className="mt-5 rounded-2xl border border-vlearn-line bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-black text-vlearn-blue">Số câu hỏi</p>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[5, 10, 15, 20].map((count) => (
            <button
              key={count}
              onClick={() => onQuestionCountChange(count)}
              className={`h-10 rounded-xl border text-sm font-black ${
                questionCount === count
                  ? "border-vlearn-blue bg-vlearn-blue text-white"
                  : "border-vlearn-line bg-[#fbfdff] text-vlearn-blue"
              }`}
            >
              {count}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onQuestionCountChange(suggestedCount)}
          className="mt-3 h-10 w-full rounded-xl border border-vlearn-line bg-vlearn-soft text-sm font-black text-vlearn-blue hover:bg-white"
        >
          Đề xuất {suggestedCount} câu để phủ kiến thức slide
        </button>
        <div className="mt-3 rounded-xl bg-[#fbfdff] p-3 text-xs font-bold leading-5 text-vlearn-muted">
          <p className="font-black text-vlearn-blue">
            Độ khó theo Admin: {difficultyPlan.summary}
          </p>
          <p>
            Dễ: nhận biết ý chính. Trung bình: giải thích/liên hệ. Khó: áp dụng
            hoặc phát hiện hiểu sai.
          </p>
        </div>
      </div>
      <button
        onClick={onGenerate}
        disabled={loading || material?.extractingText}
        className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-vlearn-blue font-extrabold text-white shadow-vlearn disabled:bg-[#b9c8d9]"
      >
        <Bot size={18} />
        {material?.extractingText
          ? "Đang đọc slide..."
          : loading
            ? "Đang tạo..."
            : "Generate Quiz"}
      </button>
      <QuizAttemptHistory
        attempts={attempts}
        onDeleteAttempt={onDeleteAttempt}
        onClearAttempts={onClearAttempts}
        onJumpPage={onJumpPage}
      />
    </section>
  );
}

function QuizAttemptHistory({
  attempts = [],
  onDeleteAttempt,
  onClearAttempts,
  onJumpPage,
}) {
  if (!attempts.length) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-vlearn-line bg-white px-4 py-4 text-sm font-semibold text-vlearn-muted">
        Chưa có lịch sử làm quiz cho bài này.
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-2xl border border-vlearn-line bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-vlearn-blue">
            Lịch sử câu đã làm
          </p>
          <p className="mt-1 text-xs font-semibold text-vlearn-muted">
            Xem lại các lần generate và câu đã trả lời
          </p>
        </div>
        <button
          type="button"
          onClick={onClearAttempts}
          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-700 hover:bg-white"
        >
          Xóa tất cả
        </button>
      </div>
      <div className="space-y-3">
        {[...attempts].reverse().map((attempt, attemptIndex) => (
          <details
            key={attempt.id || `${attempt.createdAt}-${attemptIndex}`}
            className="rounded-xl border border-vlearn-line bg-[#fbfdff] p-3"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-vlearn-ink">
                  Lần {attempts.length - attemptIndex}: {attempt.score}/
                  {attempt.total}
                </p>
                <p className="mt-1 text-xs font-semibold text-vlearn-muted">
                  {formatDate(attempt.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onDeleteAttempt?.(attempt.id);
                }}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50"
                title="Xóa lần làm này"
              >
                <Trash2 size={15} />
              </button>
            </summary>
            <div className="mt-3 space-y-3">
              {(attempt.questions || []).map((question, questionIndex) => {
                const selectedAnswer = attempt.answers?.[questionIndex];
                const answeredCorrectly = selectedAnswer === question.correct;
                return (
                  <article
                    key={`${question.question}-${questionIndex}`}
                    className="rounded-xl border border-vlearn-line bg-white p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-black leading-6">
                        {questionIndex + 1}. {question.question}
                      </p>
                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-black ${answeredCorrectly ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
                      >
                        {answeredCorrectly ? "Đúng" : "Sai"}
                      </span>
                    </div>
                    <div className="mt-2 space-y-2">
                      {(question.options || []).map((option, optionIndex) => {
                        const isCorrectOption =
                          optionIndex === question.correct;
                        const isSelectedWrong =
                          selectedAnswer === optionIndex && !isCorrectOption;
                        const isSelectedCorrect =
                          selectedAnswer === optionIndex && isCorrectOption;
                        return (
                          <div
                            key={`${option}-${optionIndex}`}
                            className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                              isCorrectOption
                                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                : isSelectedWrong
                                  ? "border-red-300 bg-red-50 text-red-700"
                                  : "border-vlearn-line bg-white text-vlearn-muted"
                            }`}
                          >
                            {String.fromCharCode(65 + optionIndex)}. {option}
                            {isSelectedCorrect ? " · Bạn chọn đúng" : ""}
                            {isSelectedWrong ? " · Bạn chọn sai" : ""}
                            {isCorrectOption && !isSelectedCorrect
                              ? " · Đáp án đúng"
                              : ""}
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-2 text-xs font-semibold leading-5 text-vlearn-muted">
                      <TutorMessageContent
                        content={repairCitationText(
                          question.explanation,
                          question.sourcePage || 1,
                        )}
                        onJumpPage={onJumpPage}
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

function ProgressBar({ current, total, source }) {
  return (
    <section className="mb-5 rounded-2xl border border-vlearn-line bg-[#fbfdff] p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-black">Quiz Progress</p>
        <p className="text-sm font-extrabold text-vlearn-blue">
          {current} / {total} · {source}
        </p>
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

function QuestionCard({
  question,
  current,
  selected,
  submitted,
  onSelect,
  onJumpPage,
}) {
  const isCorrect = selected === question.correct;
  const difficultyLabel =
    { easy: "Dễ", medium: "Trung bình", hard: "Khó" }[question.difficulty] ||
    "Trung bình";

  return (
    <section className="rounded-2xl border border-vlearn-line bg-white p-5 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-extrabold text-vlearn-blue">
          Question {current + 1}
        </p>
        <span className="rounded-full border border-vlearn-line bg-[#fbfdff] px-3 py-1 text-xs font-black text-vlearn-muted">
          {difficultyLabel}
        </span>
      </div>
      {question.sourceLabel && (
        <div className="mb-3 inline-flex rounded-full border border-vlearn-line bg-vlearn-soft px-3 py-1 text-xs font-black text-vlearn-blue">
          {question.sourceLabel}
        </div>
      )}
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
        <div
          className={`mt-5 rounded-2xl border p-4 ${isCorrect ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}
        >
          <p
            className={`font-black ${isCorrect ? "text-emerald-700" : "text-red-700"}`}
          >
            {isCorrect ? "Correct" : "Incorrect"}
          </p>
          {!isCorrect && (
            <p className="mt-2 text-sm font-semibold text-vlearn-ink">
              Correct Answer: {String.fromCharCode(65 + question.correct)}
            </p>
          )}
          <p className="mt-3 text-sm font-black">Explanation</p>
          <div className="mt-1 text-sm leading-6 text-vlearn-muted">
            <TutorMessageContent
              content={repairCitationText(
                question.explanation,
                question.sourcePage || 1,
              )}
              onJumpPage={onJumpPage}
            />
          </div>
        </div>
      )}
    </section>
  );
}

function ResultCard({
  score,
  total,
  questions,
  answers,
  attempts = [],
  onJumpPage,
  onRetry,
}) {
  const accuracy = Math.round((score / total) * 100);
  const weakTopics = questions
    .filter((question, index) => answers[index] !== question.correct)
    .map((question) => question.question)
    .slice(0, 3);

  return (
    <section className="rounded-2xl border border-vlearn-line bg-white p-5 text-center shadow-sm">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-vlearn-soft text-vlearn-blue">
        <Sparkles size={26} />
      </div>
      <h3 className="text-2xl font-black">Quiz Completed</h3>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-vlearn-line bg-[#fbfdff] p-4">
          <p className="text-sm font-bold text-vlearn-muted">Score</p>
          <p className="mt-2 text-2xl font-black text-vlearn-blue">
            {score} / {total}
          </p>
        </div>
        <div className="rounded-2xl border border-vlearn-line bg-[#fbfdff] p-4">
          <p className="text-sm font-bold text-vlearn-muted">Accuracy</p>
          <p className="mt-2 text-2xl font-black text-vlearn-blue">
            {accuracy}%
          </p>
        </div>
      </div>
      <div className="mt-5 rounded-2xl border border-vlearn-line bg-[#fbfdff] p-4 text-left">
        <p className="font-black">Review Weak Topics</p>
        <ul className="mt-3 space-y-2 text-sm text-vlearn-muted">
          {(weakTopics.length
            ? weakTopics
            : ["Bạn đã trả lời đúng toàn bộ câu hỏi."]
          ).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div className="mt-5 space-y-4 text-left">
        <div className="flex items-center justify-between">
          <p className="font-black">Review All Questions</p>
          <span className="rounded-full bg-vlearn-soft px-3 py-1 text-xs font-black text-vlearn-blue">
            {questions.length} câu
          </span>
        </div>
        {questions.map((question, questionIndex) => {
          const selectedAnswer = answers[questionIndex];
          const answeredCorrectly = selectedAnswer === question.correct;
          return (
            <article
              key={`${question.question}-${questionIndex}`}
              className="rounded-2xl border border-vlearn-line bg-[#fbfdff] p-4"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-vlearn-blue">
                    Question {questionIndex + 1}
                  </p>
                  <h4 className="mt-1 text-base font-black leading-6">
                    {question.question}
                  </h4>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${answeredCorrectly ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
                >
                  {answeredCorrectly ? "Đúng" : "Sai"}
                </span>
              </div>
              <div className="space-y-2">
                {question.options.map((option, optionIndex) => {
                  const isCorrectOption = optionIndex === question.correct;
                  const isSelectedWrong =
                    selectedAnswer === optionIndex && !isCorrectOption;
                  const isSelectedCorrect =
                    selectedAnswer === optionIndex && isCorrectOption;
                  return (
                    <div
                      key={`${option}-${optionIndex}`}
                      className={`flex items-start gap-3 rounded-xl border px-3 py-2 text-sm font-semibold ${
                        isCorrectOption
                          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                          : isSelectedWrong
                            ? "border-red-300 bg-red-50 text-red-700"
                            : "border-vlearn-line bg-white text-vlearn-muted"
                      }`}
                    >
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-current text-xs font-black">
                        {String.fromCharCode(65 + optionIndex)}
                      </span>
                      <span className="min-w-0 flex-1">{option}</span>
                      {isSelectedCorrect && (
                        <span className="shrink-0 text-xs font-black">
                          Bạn chọn
                        </span>
                      )}
                      {isSelectedWrong && (
                        <span className="shrink-0 text-xs font-black">
                          Bạn chọn sai
                        </span>
                      )}
                      {isCorrectOption && !isSelectedCorrect && (
                        <span className="shrink-0 text-xs font-black">
                          Đáp án đúng
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 rounded-xl border border-vlearn-line bg-white p-3">
                <p className="text-xs font-black text-vlearn-ink">
                  Explanation
                </p>
                <div className="mt-1 text-sm font-semibold leading-6 text-vlearn-muted">
                  <TutorMessageContent
                    content={repairCitationText(
                      question.explanation,
                      question.sourcePage || 1,
                    )}
                    onJumpPage={onJumpPage}
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {attempts.length > 0 && (
        <div className="mt-5 space-y-3 text-left">
          <div className="flex items-center justify-between">
            <p className="font-black">Lịch sử các lần làm</p>
            <span className="rounded-full bg-vlearn-soft px-3 py-1 text-xs font-black text-vlearn-blue">
              {attempts.length} lần
            </span>
          </div>
          {[...attempts].reverse().map((attempt, attemptIndex) => (
            <details
              key={attempt.id || `${attempt.createdAt}-${attemptIndex}`}
              className="rounded-2xl border border-vlearn-line bg-[#fbfdff] p-4"
              open={attemptIndex === 0}
            >
              <summary className="cursor-pointer list-none font-black text-vlearn-ink">
                Lần {attempts.length - attemptIndex} · {attempt.score}/
                {attempt.total} · {formatDate(attempt.createdAt)}
              </summary>
              <div className="mt-4 space-y-3">
                {(attempt.questions || []).map(
                  (attemptQuestion, questionIndex) => {
                    const selectedAnswer = attempt.answers?.[questionIndex];
                    const answeredCorrectly =
                      selectedAnswer === attemptQuestion.correct;
                    return (
                      <article
                        key={`${attemptQuestion.question}-${questionIndex}`}
                        className="rounded-xl border border-vlearn-line bg-white p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-black leading-6">
                            {questionIndex + 1}. {attemptQuestion.question}
                          </p>
                          <span
                            className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-black ${answeredCorrectly ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
                          >
                            {answeredCorrectly ? "Đúng" : "Sai"}
                          </span>
                        </div>
                        <div className="mt-2 space-y-2">
                          {(attemptQuestion.options || []).map(
                            (option, optionIndex) => {
                              const isCorrectOption =
                                optionIndex === attemptQuestion.correct;
                              const isSelectedWrong =
                                selectedAnswer === optionIndex &&
                                !isCorrectOption;
                              return (
                                <div
                                  key={`${option}-${optionIndex}`}
                                  className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                                    isCorrectOption
                                      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                      : isSelectedWrong
                                        ? "border-red-300 bg-red-50 text-red-700"
                                        : "border-vlearn-line bg-white text-vlearn-muted"
                                  }`}
                                >
                                  {String.fromCharCode(65 + optionIndex)}.{" "}
                                  {option}
                                  {selectedAnswer === optionIndex
                                    ? " · Bạn chọn"
                                    : ""}
                                  {isCorrectOption ? " · Đáp án đúng" : ""}
                                </div>
                              );
                            },
                          )}
                        </div>
                        <div className="mt-2 text-xs font-semibold leading-5 text-vlearn-muted">
                          <TutorMessageContent
                            content={repairCitationText(
                              attemptQuestion.explanation,
                              attemptQuestion.sourcePage || 1,
                            )}
                            onJumpPage={onJumpPage}
                          />
                        </div>
                      </article>
                    );
                  },
                )}
              </div>
            </details>
          ))}
        </div>
      )}
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
