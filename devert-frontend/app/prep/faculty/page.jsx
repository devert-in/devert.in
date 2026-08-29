"use client";

// /prep/faculty — the monitoring cockpit (design §2). Faculty/TPO/admin only.
// Every number shown here is recomputed client-side from responses + the
// answer key at read time — prepSubmissions.responses is the only thing
// trusted from Firestore (design §5, §9's scoreSubmission contract).

import { useState, useEffect, useCallback } from "react";
import { BarChart3, Users2, ListChecks, Activity, RefreshCw, AlertCircle, Loader2 } from "lucide-react";
import { RequireStaff } from "@/components/prep/guards";
import { PrepShell, BracketButton, EmptyState } from "@/components/prep/ui";
import { ExamGroupSelector } from "@/components/prep/faculty/ExamGroupSelector";
import { CohortSummaryTab } from "@/components/prep/faculty/CohortSummaryTab";
import { StudentsTab } from "@/components/prep/faculty/StudentsTab";
import { QuestionAnalysisTab } from "@/components/prep/faculty/QuestionAnalysisTab";
import { PracticePulseTab } from "@/components/prep/faculty/PracticePulseTab";
import { StudentDrilldown } from "@/components/prep/faculty/StudentDrilldown";
import { getExams, getClassGroups, getPaper, getKey, getSubmissionsForExam, getStudents } from "@/lib/prep/db";
import { recomputeAll } from "@/components/prep/faculty/facultyUtils";

const TABS = [
  { id: "summary", label: "COHORT SUMMARY", icon: BarChart3 },
  { id: "students", label: "STUDENTS", icon: Users2 },
  { id: "questions", label: "QUESTION ANALYSIS", icon: ListChecks },
  { id: "pulse", label: "PRACTICE PULSE", icon: Activity },
];

function FacultyDashboard() {
  const [exams, setExams] = useState(null);
  const [examsError, setExamsError] = useState("");
  const [classGroups, setClassGroups] = useState([]);
  const [examId, setExamId] = useState("");
  const [group, setGroup] = useState("ALL");
  const [tab, setTab] = useState("summary");

  const [examData, setExamData] = useState(null); // { paper, key, submissions, students, records, loading, error }

  const [drilldown, setDrilldown] = useState(null); // student row or null

  const loadRoot = useCallback(async () => {
    setExamsError("");
    setExams(null);
    try {
      const [examList, groupList] = await Promise.all([
        getExams({ publishedOnly: false, max: 200 }),
        getClassGroups({ activeOnly: false, max: 200 }),
      ]);
      setExams(examList);
      setClassGroups(groupList);
    } catch (err) {
      setExamsError(err?.message || "Failed to load exams");
      setExams([]);
    }
  }, []);

  useEffect(() => {
    // Fetch-on-mount pattern: loadRoot resets loading/error state synchronously
    // before awaiting Firestore reads — standard data-fetch effect, no derivable
    // render-time equivalent exists here (network I/O).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadRoot();
  }, [loadRoot]);

  const loadExamData = useCallback(async () => {
    if (!examId) {
      setExamData(null);
      return;
    }
    setExamData((prev) => ({ ...(prev || {}), loading: true, error: "" }));
    try {
      const scopeGroup = group === "ALL" ? undefined : group;
      const [paper, key, submissions, students] = await Promise.all([
        getPaper(examId),
        getKey(examId),
        getSubmissionsForExam(examId, { classGroup: scopeGroup, max: 1500 }),
        getStudents({ classGroup: scopeGroup, max: 3000 }),
      ]);
      const records = recomputeAll(submissions, key, paper);
      setExamData({ paper, key, submissions, students, records, loading: false, error: "" });
    } catch (err) {
      setExamData({ loading: false, error: err?.message || "Failed to load exam data" });
    }
  }, [examId, group]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount, see loadRoot above
    loadExamData();
  }, [loadExamData]);

  const exam = (exams || []).find((e) => e.id === examId) || null;

  return (
    <PrepShell
      kicker="// /prep/faculty — cohort_monitor.sh"
      title="FACULTY"
      accent="COCKPIT"
      subtitle="Live cohort visibility keyed by roll number and class group. Scores are always recomputed from the answer key — never trusted from the submission."
      actions={
        <BracketButton variant="ghost" onClick={loadRoot} title="Reload exam and class-group lists">
          <RefreshCw size={11} /> REFRESH
        </BracketButton>
      }
    >
      {examsError && (
        <div className="flex items-center gap-2 font-mono text-xs text-[#FF3B3B] border border-[#FF3B3B]/25 bg-[#FF3B3B]/5 px-3 py-2.5 rounded mb-6">
          <AlertCircle size={13} className="flex-shrink-0" /> {examsError}
        </div>
      )}

      {!exams ? (
        <div className="flex items-center gap-2 font-mono text-xs text-white/35 py-10 justify-center">
          <Loader2 size={14} className="animate-spin" /> loading exams…
        </div>
      ) : (
        <>
          <ExamGroupSelector
            exams={exams}
            classGroups={classGroups}
            examId={examId}
            onExamChange={setExamId}
            group={group}
            onGroupChange={setGroup}
            examOptional
          />

          {/* Tab bar */}
          <div className="flex flex-wrap gap-2 mb-6" role="tablist" aria-label="Faculty dashboard sections">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(t.id)}
                  className={`font-mono text-[11px] px-3.5 py-2 border rounded-none inline-flex items-center gap-2 transition-colors cursor-pointer ${
                    active
                      ? "text-neon-cyan border-neon-cyan/40 bg-neon-cyan/5"
                      : "text-white/40 border-white/10 hover:text-white/70 hover:border-white/20"
                  }`}
                >
                  <Icon size={12} /> {t.label}
                </button>
              );
            })}
          </div>

          {tab === "pulse" ? (
            <PracticePulseTab group={group} classGroups={classGroups} />
          ) : !examId ? (
            <EmptyState
              icon={ListChecks}
              title="select an exam"
              message="Pick an exam above to see the cohort summary, student rows, and question analysis. Practice Pulse works without an exam."
            />
          ) : examData?.loading || !examData ? (
            <div className="flex items-center gap-2 font-mono text-xs text-white/35 py-10 justify-center">
              <Loader2 size={14} className="animate-spin" /> crunching submissions…
            </div>
          ) : examData.error ? (
            <EmptyState
              icon={AlertCircle}
              title="couldn't load exam data"
              message={examData.error}
              action={
                <BracketButton variant="cyan" onClick={loadExamData}>
                  RETRY
                </BracketButton>
              }
            />
          ) : tab === "summary" ? (
            <CohortSummaryTab exam={exam} records={examData.records} totalStudents={examData.students.length} group={group} />
          ) : tab === "students" ? (
            <StudentsTab
              exam={exam}
              paper={examData.paper}
              records={examData.records}
              students={examData.students}
              group={group}
              onOpenStudent={setDrilldown}
            />
          ) : (
            <QuestionAnalysisTab exam={exam} paper={examData.paper} records={examData.records} group={group} />
          )}
        </>
      )}

      <StudentDrilldown
        open={!!drilldown}
        onClose={() => setDrilldown(null)}
        student={drilldown}
        record={drilldown?.record || null}
      />
    </PrepShell>
  );
}

export default function FacultyPage() {
  return (
    <RequireStaff>
      <FacultyDashboard />
    </RequireStaff>
  );
}
