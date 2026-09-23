"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, XCircle, ExternalLink, ChevronDown, ChevronUp,
  Lightbulb, Sigma, AlertTriangle, Route, Briefcase, Building2,
  Users, TrendingUp, Bookmark, BookmarkCheck, ArrowRight,
} from "lucide-react";
import {
  deriveRelatedQuestions, companyFrequencyInSet, questionGlobalStats,
  compareToAverageTime, topicAccuracy,
} from "@/lib/aptitude";

const DIFF_COLOR = { easy: "#00FF41", medium: "#FF9500", hard: "#FF5050" };

function Panel({ title, icon: Icon, color = "#00FFFF", defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-white/8 rounded-lg overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3.5 py-2.5 hover:bg-white/2 transition-colors text-left">
        <Icon size={12} style={{ color }} className="flex-shrink-0" />
        <span className="font-mono text-[11px] flex-1" style={{ color }}>{title}</span>
        {open ? <ChevronUp size={12} className="text-white/25" /> : <ChevronDown size={12} className="text-white/25" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="px-3.5 pb-3.5 pt-1 border-t border-white/5 space-y-2.5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Badge({ children, color = "rgba(255,255,255,0.35)" }) {
  return (
    <span className="font-mono text-[9px] px-2 py-0.5 rounded-full flex-shrink-0"
      style={{ color, background: `${color}15`, border: `1px solid ${color}30` }}>
      {children}
    </span>
  );
}

export function QuestionWorkspace({
  topic, question, questionIndex, totalQuestions,
  topicQuestions, selected, onSelect, answered, onSubmit, onNext, onClose,
  attemptEntry, weakTopics, topicStats, bookmarked, onToggleBookmark,
  lastAttemptTimeSec, onJumpToQuestion,
}) {
  const globalStats = questionGlobalStats(question);
  const yourBestTime = attemptEntry?.bestTimeSec ?? lastAttemptTimeSec;
  const timeDeltaPct = compareToAverageTime(lastAttemptTimeSec ?? yourBestTime, globalStats.avgTimeSec);
  const related = answered ? deriveRelatedQuestions(topicQuestions, question) : null;
  const companies = question.companies || [];
  const examTags = question.examTags || [];
  const companyFreq = companies.length ? companyFrequencyInSet(topicQuestions) : [];
  const acc = topicAccuracy(topicStats, topic.id);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="font-mono text-[10px] text-white/25 tracking-wider">QUESTION {questionIndex + 1} / {totalQuestions}</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          {question.subtopic && <Badge color="#A78BFA">{question.subtopic}</Badge>}
          {question.estimatedTimeSec > 0 && <Badge>{"~"}{question.estimatedTimeSec}s</Badge>}
          {question.difficulty && <Badge color={DIFF_COLOR[question.difficulty] || "#00FFFF"}>{question.difficulty}</Badge>}
          <button onClick={onToggleBookmark} className="text-white/25 hover:text-neon-cyan transition-colors" title="Bookmark / revise later">
            {bookmarked ? <BookmarkCheck size={13} style={{ color: "#00FFFF" }} /> : <Bookmark size={13} />}
          </button>
        </div>
      </div>

      <p className="font-mono text-[13px] text-white/80 leading-relaxed whitespace-pre-wrap">{question.question}</p>

      <div className="space-y-1.5">
        {question.options.map((opt, oi) => {
          const isCorrect = answered && oi === question.correctIndex;
          const isWrongPick = answered && oi === selected && oi !== question.correctIndex;
          return (
            <button key={oi} disabled={answered} onClick={() => onSelect(oi)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors disabled:cursor-default"
              style={{
                background: isCorrect ? "rgba(0,255,65,0.08)" : isWrongPick ? "rgba(255,80,80,0.08)" : selected === oi ? "rgba(0,255,255,0.06)" : "rgba(255,255,255,0.03)",
                border: isCorrect ? "1px solid rgba(0,255,65,0.35)" : isWrongPick ? "1px solid rgba(255,80,80,0.35)" : selected === oi ? "1px solid rgba(0,255,255,0.3)" : "1px solid rgba(255,255,255,0.06)",
              }}>
              <span className="w-3.5 h-3.5 rounded-full border flex-shrink-0"
                style={{ borderColor: selected === oi ? "#00FFFF" : "rgba(255,255,255,0.2)", background: selected === oi && !answered ? "#00FFFF" : "transparent" }} />
              <span className="font-mono text-[12px] text-white/75 flex-1">{opt}</span>
              {isCorrect && <CheckCircle2 size={13} style={{ color: "#00FF41" }} />}
              {isWrongPick && <XCircle size={13} style={{ color: "#FF5050" }} />}
            </button>
          );
        })}
      </div>

      {!answered ? (
        <motion.button whileHover={selected !== null ? { scale: 1.01 } : {}} whileTap={selected !== null ? { scale: 0.98 } : {}}
          onClick={onSubmit} disabled={selected === null}
          className="w-full font-mono text-sm py-2.5 rounded-xl transition-all disabled:opacity-40"
          style={{ background: "#00FFFF", color: "#050505" }}>
          submit
        </motion.button>
      ) : (
        <>
          <div className="flex items-center gap-2 font-mono text-xs px-3 py-2 rounded-lg"
            style={selected === question.correctIndex
              ? { color: "#00FF41", background: "rgba(0,255,65,0.06)", border: "1px solid rgba(0,255,65,0.2)" }
              : { color: "#FF5050", background: "rgba(255,80,80,0.06)", border: "1px solid rgba(255,80,80,0.2)" }}>
            {selected === question.correctIndex ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
            {selected === question.correctIndex ? "Correct" : "Incorrect - review the solution below"}
          </div>

          {(question.explanation || question.shortcut || question.formula || question.commonMistake || question.alternativeApproach || question.interviewTip || question.videoUrl) && (
            <Panel title="SOLUTION" icon={Lightbulb} color="#00FF41" defaultOpen>
              {question.explanation && (
                <div>
                  <p className="font-mono text-[9px] text-white/25 tracking-wider mb-1">METHOD 1 - STEP BY STEP</p>
                  <p className="font-mono text-[11px] text-white/60 leading-relaxed whitespace-pre-wrap">{question.explanation}</p>
                </div>
              )}
              {question.shortcut && (
                <div>
                  <p className="font-mono text-[9px] text-white/25 tracking-wider mb-1">METHOD 2 - SHORTCUT</p>
                  <p className="font-mono text-[11px] text-white/60 leading-relaxed whitespace-pre-wrap">{question.shortcut}</p>
                </div>
              )}
              {question.formula && (
                <div className="flex items-start gap-1.5">
                  <Sigma size={11} className="text-neon-cyan/60 mt-0.5 flex-shrink-0" />
                  <p className="font-mono text-[11px] text-neon-cyan/80">{question.formula}</p>
                </div>
              )}
              {question.commonMistake && (
                <div className="flex items-start gap-1.5">
                  <AlertTriangle size={11} className="text-orange-400/70 mt-0.5 flex-shrink-0" />
                  <p className="font-mono text-[11px] text-white/50"><span className="text-orange-400/80">Common mistake: </span>{question.commonMistake}</p>
                </div>
              )}
              {question.alternativeApproach && (
                <div className="flex items-start gap-1.5">
                  <Route size={11} className="text-white/40 mt-0.5 flex-shrink-0" />
                  <p className="font-mono text-[11px] text-white/50">{question.alternativeApproach}</p>
                </div>
              )}
              {question.interviewTip && (
                <div className="flex items-start gap-1.5">
                  <Briefcase size={11} className="text-neon-purple/60 mt-0.5 flex-shrink-0" />
                  <p className="font-mono text-[11px] text-white/50"><span className="text-neon-purple/80">Interview tip: </span>{question.interviewTip}</p>
                </div>
              )}
              {question.videoUrl && (
                <a href={question.videoUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-[10px] text-neon-purple hover:underline">
                  <ExternalLink size={9} /> watch video explanation
                </a>
              )}
            </Panel>
          )}

          <Panel title="ANALYSIS" icon={TrendingUp} color="#00FFFF">
            <div className="grid grid-cols-2 gap-2">
              {globalStats.attemptCount > 0 && (
                <>
                  <div>
                    <p className="font-mono text-[9px] text-white/25 tracking-wider">GLOBAL ACCURACY</p>
                    <p className="font-mono text-sm text-white/70">{globalStats.accuracy}%</p>
                  </div>
                  <div>
                    <p className="font-mono text-[9px] text-white/25 tracking-wider">ATTEMPTS</p>
                    <p className="font-mono text-sm text-white/70">{globalStats.attemptCount.toLocaleString()}</p>
                  </div>
                </>
              )}
              {lastAttemptTimeSec != null && (
                <div>
                  <p className="font-mono text-[9px] text-white/25 tracking-wider">YOUR TIME</p>
                  <p className="font-mono text-sm text-white/70">{lastAttemptTimeSec}s</p>
                </div>
              )}
              {globalStats.avgTimeSec != null && (
                <div>
                  <p className="font-mono text-[9px] text-white/25 tracking-wider">AVG TIME</p>
                  <p className="font-mono text-sm text-white/70">{globalStats.avgTimeSec}s</p>
                </div>
              )}
            </div>
            {timeDeltaPct !== null && (
              <p className="font-mono text-[10px]" style={{ color: timeDeltaPct >= 0 ? "#00FF41" : "#FF9500" }}>
                You were {Math.abs(timeDeltaPct)}% {timeDeltaPct >= 0 ? "faster" : "slower"} than average.
              </p>
            )}
            {acc !== null && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="font-mono text-[9px] text-white/25 tracking-wider">{topic.name.toUpperCase()} PROGRESS</p>
                  <p className="font-mono text-[10px] text-white/40">{acc}%</p>
                </div>
                <div className="w-full h-1.5 bg-white/6 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${acc}%`, background: acc >= 70 ? "#00FF41" : acc >= 40 ? "#FF9500" : "#FF5050" }} />
                </div>
              </div>
            )}
            {weakTopics?.length > 0 && (
              <p className="font-mono text-[10px] text-orange-400/80 leading-relaxed">
                You frequently struggle with: {weakTopics.map(t => t.topic.name).join(", ")}.
              </p>
            )}
            {attemptEntry?.history?.length > 1 && (
              <div>
                <p className="font-mono text-[9px] text-white/25 tracking-wider mb-1">YOUR ATTEMPTS</p>
                <div className="flex gap-1.5 flex-wrap">
                  {attemptEntry.history.map((h, i) => (
                    <span key={i} className="font-mono text-[9px] px-1.5 py-0.5 rounded"
                      style={h.correct ? { color: "#00FF41", background: "rgba(0,255,65,0.08)" } : { color: "#FF5050", background: "rgba(255,80,80,0.08)" }}>
                      #{i + 1} {h.correct ? "correct" : "wrong"}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Panel>

          {(companies.length > 0 || examTags.length > 0 || question.recentAskings?.length > 0) && (
            <Panel title="COMPANIES & EXAMS" icon={Building2} color="#FF9500">
              {companyFreq.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {companyFreq.map(({ company, count }) => (
                    <Badge key={company} color="#FF9500">{company} {count > 1 && `×${count}`}</Badge>
                  ))}
                </div>
              )}
              {examTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {examTags.map(tag => <Badge key={tag} color="#A78BFA">{tag}</Badge>)}
                </div>
              )}
              {question.recentAskings?.length > 0 && (
                <div className="space-y-1">
                  <p className="font-mono text-[9px] text-white/25 tracking-wider">ASKED RECENTLY</p>
                  {question.recentAskings.map((a, i) => (
                    <p key={i} className="font-mono text-[11px] text-white/50 flex items-center gap-1.5">
                      <Users size={10} className="text-white/25" /> {a.company} {a.exam} · {a.year}
                    </p>
                  ))}
                </div>
              )}
            </Panel>
          )}

          {related && (related.easy.length + related.medium.length + related.hard.length > 0) && (
            <Panel title="RELATED QUESTIONS" icon={ArrowRight} color="#00FF41">
              {["easy", "medium", "hard"].map(diff => related[diff].length > 0 && (
                <div key={diff} className="space-y-1">
                  <p className="font-mono text-[9px] tracking-wider" style={{ color: DIFF_COLOR[diff] }}>{diff.toUpperCase()}</p>
                  {related[diff].map(q => (
                    <button key={q.id} onClick={() => onJumpToQuestion(q.id)}
                      className="w-full text-left font-mono text-[11px] text-white/55 hover:text-white/85 transition-colors truncate block">
                      {q.question}
                    </button>
                  ))}
                </div>
              ))}
            </Panel>
          )}

          {questionIndex < totalQuestions - 1 ? (
            <button onClick={onNext}
              className="w-full font-mono text-sm py-2.5 rounded-xl text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/8 transition-colors">
              next question →
            </button>
          ) : (
            <button onClick={onClose}
              className="w-full font-mono text-sm py-2.5 rounded-xl text-neon-green border border-neon-green/30 hover:bg-neon-green/8 transition-colors">
              topic complete - back to topics
            </button>
          )}
        </>
      )}
    </div>
  );
}
