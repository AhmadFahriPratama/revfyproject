"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";

import { DepthButton } from "@/components/depth-button";
import { saveAttempt, type AttemptRecord } from "@/lib/attempts";
import { useAuth } from "@/lib/auth";
import type { PreviewQuestion } from "@/lib/dataset";

type SimulationRunnerProps = {
  slug: string;
  title: string;
  tier: "gratis" | "berbayar";
  category: string;
  mode: string;
  focus: string;
  durationValue: number;
  adaptiveNote: string | null;
  questions: PreviewQuestion[];
};

type ResultSummary = {
  correct: number;
  answered: number;
  unanswered: number;
  score: number;
  accuracy: number;
};

type BackendStatus = "checking" | "ready" | "guest" | "disabled" | "error";

function formatClock(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(safe % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function buildResultSummary(questions: PreviewQuestion[], answers: Record<string, string>): ResultSummary {
  const correct = questions.filter((question) => answers[question.id] === question.answer).length;
  const answered = Object.values(answers).filter(Boolean).length;
  const unanswered = questions.length - answered;
  const accuracy = questions.length === 0 ? 0 : Math.round((correct / questions.length) * 100);

  return {
    correct,
    answered,
    unanswered,
    score: accuracy,
    accuracy,
  };
}

function buildTopicBreakdown(questions: PreviewQuestion[], answers: Record<string, string>) {
  const topics = questions.reduce((accumulator, question) => {
    const topic = question.topic ?? "General Focus";
    const current = accumulator.get(topic) ?? { topic, total: 0, correct: 0, accuracy: 0 };
    current.total += 1;

    if (answers[question.id] === question.answer) {
      current.correct += 1;
    }

    accumulator.set(topic, current);
    return accumulator;
  }, new Map<string, { topic: string; total: number; correct: number; accuracy: number }>());

  return Array.from(topics.values())
    .map((item) => ({
      ...item,
      accuracy: item.total > 0 ? Math.round((item.correct / item.total) * 100) : 0,
    }))
    .sort((left, right) => right.total - left.total);
}

export function SimulationRunner({
  slug,
  title,
  tier,
  category,
  mode,
  focus,
  durationValue,
  adaptiveNote,
  questions,
}: SimulationRunnerProps) {
  const { ready, session } = useAuth();
  const totalSeconds = durationValue * 60;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);
  const [finished, setFinished] = useState(false);
  const [summary, setSummary] = useState<ResultSummary | null>(null);
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("checking");
  const [resumeNotice, setResumeNotice] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [progressDirty, setProgressDirty] = useState(false);
  const savedRef = useRef(false);

  const currentQuestion = questions[Math.min(currentIndex, questions.length - 1)];
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const hasMeaningfulProgress = answeredCount > 0 || currentIndex > 0 || remainingSeconds < totalSeconds;

  async function persistProgress() {
    if (!ready || !session || backendStatus !== "ready" || finished || !hasMeaningfulProgress) {
      return;
    }

    try {
      setSaveState("saving");

      const response = await fetch("/api/progress", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tier,
          slug,
          title,
          category,
          focus,
          currentIndex,
          remainingSeconds,
          questionCount: questions.length,
          answers,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save progress");
      }

      setSaveState("saved");
      setLastSavedAt(new Date().toISOString());
    } catch {
      setSaveState("error");
    }
  }

  async function clearRemoteProgress() {
    if (!session || backendStatus !== "ready") {
      return;
    }

    try {
      await fetch("/api/progress", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tier,
          slug,
        }),
      });
      setLastSavedAt(null);
      setSaveState("idle");
    } catch {
      setSaveState("error");
    }
  }

  async function startOver() {
    savedRef.current = false;
    setFinished(false);
    setSummary(null);
    setAnswers({});
    startTransition(() => setCurrentIndex(0));
    setRemainingSeconds(totalSeconds);
    setProgressDirty(false);
    setResumeNotice("Simulasi direset dari awal.");
    await clearRemoteProgress();
  }

  useEffect(() => {
    if (!ready) {
      return;
    }

    savedRef.current = false;
    setFinished(false);
    setSummary(null);
    setAnswers({});
    setCurrentIndex(0);
    setRemainingSeconds(totalSeconds);
    setResumeNotice(null);
    setLastSavedAt(null);
    setSaveState("idle");
    setProgressDirty(false);

    if (!session) {
      setBackendStatus("guest");
      setResumeNotice("Login diperlukan jika Anda ingin melanjutkan progress yang tersimpan.");
      return;
    }

    let cancelled = false;

    const loadRemoteProgress = async () => {
      setBackendStatus("checking");

      try {
        const params = new URLSearchParams({
          tier,
          slug,
        });
        const response = await fetch(`/api/progress?${params.toString()}`, {
          cache: "no-store",
        });

        if (cancelled) {
          return;
        }

        if (response.status === 404) {
          setBackendStatus("ready");
          setResumeNotice("Belum ada progress tersimpan untuk set ini.");
          return;
        }

        if (response.status === 503) {
          setBackendStatus("disabled");
          setResumeNotice("Fitur resume belum tersedia untuk sesi ini.");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to load progress");
        }

        const payload = (await response.json()) as {
          ok: boolean;
          progress: {
            currentIndex: number;
            remainingSeconds: number;
            answers: Record<string, string>;
            updatedAt?: string;
          };
        };

        const restoredIndex = Math.max(0, Math.min(payload.progress.currentIndex ?? 0, questions.length - 1));
        const restoredSeconds = Math.max(0, Math.min(payload.progress.remainingSeconds ?? totalSeconds, totalSeconds));

        startTransition(() => {
          setCurrentIndex(restoredIndex);
        });
        setAnswers(payload.progress.answers ?? {});
        setRemainingSeconds(restoredSeconds);
        setLastSavedAt(payload.progress.updatedAt ?? null);
        setBackendStatus("ready");
        setResumeNotice("Progress terakhir berhasil dipulihkan.");
      } catch {
        if (!cancelled) {
          setBackendStatus("error");
          setResumeNotice("Progress sebelumnya belum bisa dimuat. Simulasi tetap bisa dilanjutkan.");
        }
      }
    };

    void loadRemoteProgress();

    return () => {
      cancelled = true;
    };
  }, [questions.length, ready, session, slug, tier, totalSeconds]);

  const finishAttempt = () => {
    if (savedRef.current && summary) {
      return;
    }

    setSummary(buildResultSummary(questions, answers));
    setFinished(true);
    startTransition(() => setCurrentIndex(0));
  };

  useEffect(() => {
    if (finished) {
      return;
    }

    if (remainingSeconds <= 0) {
      finishAttempt();
      return;
    }

    const timeout = window.setTimeout(() => {
      setRemainingSeconds((current) => current - 1);
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [finishAttempt, finished, remainingSeconds]);

  useEffect(() => {
    if (!progressDirty || !ready || !session || backendStatus !== "ready" || finished) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void persistProgress();
      setProgressDirty(false);
    }, 650);

    return () => window.clearTimeout(timeout);
  }, [answers, backendStatus, currentIndex, finished, progressDirty, ready, remainingSeconds, session]);

  useEffect(() => {
    if (!ready || !session || backendStatus !== "ready" || finished || !hasMeaningfulProgress) {
      return;
    }

    const elapsed = totalSeconds - remainingSeconds;

    if (elapsed <= 0 || elapsed % 15 !== 0) {
      return;
    }

    void persistProgress();
  }, [backendStatus, finished, hasMeaningfulProgress, ready, remainingSeconds, session, totalSeconds]);

  useEffect(() => {
    if (!finished || !summary || savedRef.current) {
      return;
    }

    const elapsedMinutes = Math.max(1, Math.ceil((durationValue * 60 - remainingSeconds) / 60));
    const topicBreakdown = buildTopicBreakdown(questions, answers);
    const record: AttemptRecord = {
      id: `${slug}-${Date.now()}`,
      title,
      slug,
      tier,
      category,
      focus,
      username: session?.username ?? "guest",
      correct: summary.correct,
      answered: summary.answered,
      total: questions.length,
      score: summary.score,
      accuracy: summary.accuracy,
      completedAt: new Date().toISOString(),
      durationMinutes: elapsedMinutes,
      topicBreakdown,
    };

    savedRef.current = true;
    saveAttempt(record);

    void (async () => {
      if (!session || backendStatus !== "ready") {
        return;
      }

      try {
        await fetch("/api/attempts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(record),
        });

        await clearRemoteProgress();
        setResumeNotice("Hasil simulasi berhasil disimpan.");
      } catch {
        setResumeNotice("Hasil simulasi tersimpan, tetapi belum tersinkron penuh.");
      }
    })();
  }, [answers, backendStatus, category, durationValue, finished, focus, questions, remainingSeconds, session, slug, summary, tier, title]);

  const selectAnswer = (value: string) => {
    if (finished) {
      return;
    }

    setAnswers((current) => ({
      ...current,
      [currentQuestion.id]: value,
    }));
    setProgressDirty(true);
  };

  const jumpToQuestion = (index: number) => {
    if (index === currentIndex) {
      return;
    }

    startTransition(() => setCurrentIndex(index));
    setProgressDirty(true);
  };

  return (
    <div className="stack-xl">
      <section className="simulation-layout">
        <article className="glass-panel simulation-main">
          <div className="section-heading">
            <span className="eyebrow">Simulation Engine</span>
            <h1>{title}</h1>
            <p>
              {focus} · {mode} · {questions.length} soal aktif
            </p>
          </div>

          {adaptiveNote ? <div className="answer-box"><p>{adaptiveNote}</p></div> : null}
          {resumeNotice ? (
            <div className="simulation-banner">
              <p>{resumeNotice}</p>
              <div className="meta-row meta-row--tight">
                <span>
                  Resume: {backendStatus === "ready" ? "aktif" : backendStatus === "checking" ? "memeriksa" : backendStatus === "guest" ? "login diperlukan" : backendStatus === "disabled" ? "tidak tersedia" : "gagal"}
                </span>
                <span>
                  Save: {saveState === "idle" ? "standby" : saveState === "saving" ? "menyimpan" : saveState === "saved" ? "tersimpan" : "error"}
                </span>
                {lastSavedAt ? <span>Last save {new Date(lastSavedAt).toLocaleTimeString("id-ID")}</span> : null}
              </div>
            </div>
          ) : null}

          <div className="simulation-question-head">
            <span className="card-tag">Question {currentIndex + 1}</span>
            <span className="simulation-status">{answers[currentQuestion.id] ? `Terjawab ${answers[currentQuestion.id]}` : "Belum dijawab"}</span>
          </div>

          <h2 className="simulation-question-title">{currentQuestion.question}</h2>

          {(currentQuestion.topic || currentQuestion.difficulty) && (
            <div className="meta-row meta-row--tight">
              {currentQuestion.topic ? <span>{currentQuestion.topic}</span> : null}
              {currentQuestion.difficulty ? <span>{currentQuestion.difficulty}</span> : null}
            </div>
          )}

          <div className="simulation-options">
            {currentQuestion.options.map(([key, value]) => {
              const selected = answers[currentQuestion.id] === key;
              const correct = finished && currentQuestion.answer === key;
              const wrong = finished && selected && currentQuestion.answer !== key;

              return (
                <button
                  key={key}
                  type="button"
                  className={[
                    "simulation-option",
                    selected ? "simulation-option--selected" : "",
                    correct ? "simulation-option--correct" : "",
                    wrong ? "simulation-option--wrong" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => selectAnswer(key)}
                  disabled={finished}
                >
                  <strong>{key}</strong>
                  <span>{value}</span>
                </button>
              );
            })}
          </div>

          {finished ? (
            <div className="answer-box">
              <strong>Jawaban benar: {currentQuestion.answer}</strong>
              {currentQuestion.tip ? <p>Trik: {currentQuestion.tip}</p> : null}
              <p>{currentQuestion.explanation}</p>
            </div>
          ) : null}

          <div className="simulation-actions">
            <DepthButton tone="ghost" onClick={() => jumpToQuestion(Math.max(0, currentIndex - 1))}>
              Soal sebelumnya
            </DepthButton>
            {finished ? (
              <DepthButton href="/dashboard" tone="cyan">
                Lihat hasil di dashboard
              </DepthButton>
            ) : currentIndex < questions.length - 1 ? (
              <DepthButton onClick={() => jumpToQuestion(currentIndex + 1)}>Soal berikutnya</DepthButton>
            ) : (
              <DepthButton tone="cyan" onClick={() => finishAttempt()}>
                Selesaikan simulasi
              </DepthButton>
            )}
          </div>
        </article>

        <aside className="glass-panel simulation-sidebar">
          <div className="timer-block">
            <span className="eyebrow">Timer</span>
            <strong>{formatClock(remainingSeconds)}</strong>
            <p>{finished ? "Simulasi selesai. Review dan skor sudah disimpan secara lokal." : "Waktu terus berjalan sampai simulasi diselesaikan atau habis."}</p>
          </div>

          <div className="content-grid content-grid--two">
            <article className="stat-surface simulation-mini-stat">
              <span>Terjawab</span>
              <strong>{answeredCount}</strong>
            </article>
            <article className="stat-surface simulation-mini-stat">
              <span>Total</span>
              <strong>{questions.length}</strong>
            </article>
          </div>

          {summary ? (
            <div className="stack-sm">
              <div className="list-row">
                <strong>Score</strong>
                <span>{summary.score}</span>
              </div>
              <div className="list-row">
                <strong>Akurasi</strong>
                <span>{summary.accuracy}%</span>
              </div>
              <div className="list-row">
                <strong>Benar</strong>
                <span>{summary.correct}</span>
              </div>
              <div className="list-row">
                <strong>Belum dijawab</strong>
                <span>{summary.unanswered}</span>
              </div>
            </div>
          ) : null}

          <div className="section-heading">
            <span className="eyebrow">Navigator</span>
            <h2>Lompat antar soal</h2>
          </div>

          <div className="question-rail">
            {questions.map((question, index) => {
              const answered = Boolean(answers[question.id]);
              const active = index === currentIndex;
              const correct = finished && answers[question.id] === question.answer;
              const wrong = finished && answered && answers[question.id] !== question.answer;

              return (
                <button
                  key={question.id}
                  type="button"
                  className={[
                    "question-rail__item",
                    active ? "question-rail__item--active" : "",
                    answered ? "question-rail__item--answered" : "",
                    correct ? "question-rail__item--correct" : "",
                    wrong ? "question-rail__item--wrong" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => jumpToQuestion(index)}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>

          {!finished ? (
            <div className="simulation-sidebar-actions">
              <DepthButton tone="ghost" onClick={() => void startOver()}>
                Mulai ulang
              </DepthButton>
              <DepthButton tone="cyan" onClick={() => finishAttempt()}>
                Akhiri sekarang
              </DepthButton>
            </div>
          ) : (
            <DepthButton tone="ghost" onClick={() => void startOver()}>
              Ulangi simulasi
            </DepthButton>
          )}
        </aside>
      </section>

      {finished ? (
        <section className="stack-md">
          <div className="section-heading">
            <span className="eyebrow">Review</span>
            <h2>Tinjau seluruh jawaban</h2>
          </div>
          <div className="content-grid content-grid--two">
            {questions.map((question, index) => {
              const selected = answers[question.id] ?? "-";
              const correct = selected === question.answer;

              return (
                <details
                  key={question.id}
                  className={[
                    "glass-panel",
                    "review-disclosure",
                    "review-card",
                    correct ? "review-card--correct" : "review-card--wrong",
                  ].join(" ")}
                  open={!correct && index === 0}
                >
                  <summary className="review-disclosure__summary">
                    <div className="review-disclosure__summary-content">
                      <span className="card-tag">Review {index + 1}</span>
                      <div className="meta-row meta-row--tight">
                        <span>Pilihanmu: {selected}</span>
                        <span>Kunci: {question.answer}</span>
                      </div>
                    </div>
                    <h3>{question.question}</h3>
                  </summary>
                  <div className="review-disclosure__body">
                    {question.tip ? <p>Trik: {question.tip}</p> : null}
                    <p>{question.explanation}</p>
                  </div>
                </details>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
