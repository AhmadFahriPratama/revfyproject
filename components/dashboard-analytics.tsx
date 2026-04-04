"use client";

import { useMemo } from "react";

import type { AttemptRecord } from "@/lib/attempts";

function round(value: number) {
  return Math.round(value);
}

export function DashboardAnalytics({ attempts, allAttempts }: { attempts: AttemptRecord[]; allAttempts: AttemptRecord[] }) {
  const insights = useMemo(() => {
    const totalAttempts = attempts.length;
    const averageAccuracy = totalAttempts > 0 ? round(attempts.reduce((sum, attempt) => sum + attempt.accuracy, 0) / totalAttempts) : 0;
    const bestScore = totalAttempts > 0 ? Math.max(...attempts.map((attempt) => attempt.score)) : 0;
    const totalMinutes = attempts.reduce((sum, attempt) => sum + attempt.durationMinutes, 0);
    const totalCorrect = attempts.reduce((sum, attempt) => sum + attempt.correct, 0);
    const trend = [...attempts].slice(0, 6).reverse();

    const topicMap = attempts.reduce((accumulator, attempt) => {
      for (const item of attempt.topicBreakdown) {
        const current = accumulator.get(item.topic) ?? { topic: item.topic, total: 0, correct: 0 };
        current.total += item.total;
        current.correct += item.correct;
        accumulator.set(item.topic, current);
      }

      return accumulator;
    }, new Map<string, { topic: string; total: number; correct: number }>());

    const topics = Array.from(topicMap.values())
      .map((item) => ({
        ...item,
        accuracy: item.total > 0 ? round((item.correct / item.total) * 100) : 0,
      }))
      .sort((left, right) => right.total - left.total || right.accuracy - left.accuracy)
      .slice(0, 5);

    const leaderboard = Array.from(
      allAttempts.reduce((accumulator, attempt) => {
        const current = accumulator.get(attempt.username) ?? {
          username: attempt.username,
          sessions: 0,
          totalAccuracy: 0,
          bestScore: 0,
          totalCorrect: 0,
        };

        current.sessions += 1;
        current.totalAccuracy += attempt.accuracy;
        current.bestScore = Math.max(current.bestScore, attempt.score);
        current.totalCorrect += attempt.correct;
        accumulator.set(attempt.username, current);
        return accumulator;
      }, new Map<string, { username: string; sessions: number; totalAccuracy: number; bestScore: number; totalCorrect: number }>()),
    )
      .map(([, item]) => ({
        ...item,
        averageAccuracy: item.sessions > 0 ? round(item.totalAccuracy / item.sessions) : 0,
      }))
      .sort((left, right) => right.averageAccuracy - left.averageAccuracy || right.bestScore - left.bestScore)
      .slice(0, 5);

    return {
      totalAttempts,
      averageAccuracy,
      bestScore,
      totalMinutes,
      totalCorrect,
      trend,
      topics,
      leaderboard,
    };
  }, [allAttempts, attempts]);

  if (attempts.length === 0) {
    return (
      <section className="glass-panel card-surface">
        <div className="section-heading">
          <span className="eyebrow">Analytics Lokal</span>
          <h2>Insight akan muncul setelah simulasi pertama</h2>
        </div>
        <p>Begitu satu attempt selesai, dashboard ini akan menampilkan trend skor, breakdown topik, dan leaderboard lokal di browser Anda.</p>
      </section>
    );
  }

  return (
    <section className="stack-md">
      <div className="section-heading">
        <span className="eyebrow">Analytics Lokal</span>
        <h2>Ringkasan performa dari attempt yang tersimpan</h2>
      </div>

      <div className="analytics-grid">
        <article className="glass-panel stat-surface">
          <span>Total Attempt</span>
          <strong>{insights.totalAttempts}</strong>
        </article>
        <article className="glass-panel stat-surface">
          <span>Rata-rata Akurasi</span>
          <strong>{insights.averageAccuracy}%</strong>
        </article>
        <article className="glass-panel stat-surface">
          <span>Best Score</span>
          <strong>{insights.bestScore}</strong>
        </article>
        <article className="glass-panel stat-surface">
          <span>Total Menit</span>
          <strong>{insights.totalMinutes}</strong>
        </article>
      </div>

      <div className="content-grid content-grid--two">
        <article className="glass-panel card-surface">
          <div className="section-heading">
            <span className="eyebrow">Trend</span>
            <h2>6 attempt terakhir</h2>
          </div>
          <div className="analytics-bars">
            {insights.trend.map((attempt, index) => (
              <div key={attempt.id} className="analytics-bars__row">
                <div className="analytics-bars__label">
                  <strong>Run {index + 1}</strong>
                  <span>{attempt.title}</span>
                </div>
                <div className="analytics-bars__track">
                  <div className="analytics-bars__fill" style={{ width: `${attempt.accuracy}%` }} />
                </div>
                <strong>{attempt.accuracy}%</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="glass-panel card-surface">
          <div className="section-heading">
            <span className="eyebrow">Topik</span>
            <h2>Area yang paling sering Anda hadapi</h2>
          </div>
          <div className="analytics-bars">
            {insights.topics.map((topic) => (
              <div key={topic.topic} className="analytics-bars__row analytics-bars__row--stacked">
                <div className="analytics-bars__label">
                  <strong>{topic.topic}</strong>
                  <span>{topic.correct}/{topic.total} benar</span>
                </div>
                <div className="analytics-bars__track analytics-bars__track--compact">
                  <div className="analytics-bars__fill analytics-bars__fill--mint" style={{ width: `${topic.accuracy}%` }} />
                </div>
                <strong>{topic.accuracy}%</strong>
              </div>
            ))}
          </div>
        </article>
      </div>

      <article className="glass-panel card-surface">
        <div className="section-heading">
          <span className="eyebrow">Leaderboard Lokal</span>
          <h2>Peringkat akun yang pernah login di browser ini</h2>
        </div>
        <div className="leaderboard-list">
          {insights.leaderboard.map((item, index) => (
            <div key={item.username} className="leaderboard-row">
              <strong className="leaderboard-rank">#{index + 1}</strong>
              <div>
                <strong>{item.username}</strong>
                <p>{item.sessions} sesi · {item.totalCorrect} jawaban benar</p>
              </div>
              <span>{item.averageAccuracy}% avg</span>
              <span>Best {item.bestScore}</span>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
