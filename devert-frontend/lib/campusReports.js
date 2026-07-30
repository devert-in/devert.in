// Shared report-export infrastructure for Campus Admin. One generic
// exporter (CSV/Excel/PDF) driven by a plain {columns, rows} shape, plus a
// data-gathering function per report type below - every one backed by data
// that already exists elsewhere in this codebase (fetchRosterStudents,
// fetchClassrooms/fetchClassroomAnalytics, fetchContestRegistrations/
// fetchContestSubmissions, fetchPendingStudents). Nothing here invents a
// metric that isn't already computed somewhere in the app.
//
// CSV keeps the existing Blob-download pattern already used 3x in this
// codebase (campus-manage.jsx's exportRosterCsv/downloadBulkAssignTemplate,
// campus-classrooms.jsx's downloadClassroomCsv). Excel reuses the `xlsx`
// package that's ALREADY an installed dependency (see lib/contests.js's
// xlsxToCsvText) - no new dependency for that format. PDF is the one
// genuinely new dependency (jspdf + jspdf-autotable), dynamically imported
// the same way `xlsx` already is, so it stays out of the main bundle.

import { fetchRosterStudents, fetchPendingStudents, fetchClassrooms } from "./institutions";
import { fetchClassroomAnalytics } from "./classroomAnalytics";
import { fetchContestRegistrations, fetchContestSubmissions } from "./contests";

function slug(v) {
  return (v || "report").toString().trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function csvEscape(v) {
  return `"${String(v ?? "").replace(/"/g, '""')}"`;
}

function toCsvText(columns, rows) {
  const header = columns.map(c => csvEscape(c.label)).join(",");
  const body = rows.map(r => columns.map(c => csvEscape(c.value(r))).join(","));
  return [header, ...body].join("\n");
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function toExcelBuffer(columns, rows, sheetName) {
  const XLSX = await import("xlsx");
  const data = rows.map(r => {
    const obj = {};
    columns.forEach(c => { obj[c.label] = c.value(r); });
    return obj;
  });
  const sheet = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, (sheetName || "Report").slice(0, 31));
  return XLSX.write(wb, { type: "array", bookType: "xlsx" });
}

async function toPdfBlob(columns, rows, title) {
  // Named export, not default. jspdf's package.json exports map resolves to a
  // DIFFERENT build per environment: the browser gets jspdf.es.min.js (where
  // `default` and `jsPDF` are the same binding) but node gets
  // jspdf.node.min.js (where `default` is an object and only `jsPDF` is the
  // constructor). Destructuring `default` therefore works in the app and throws
  // "JsPDF is not a constructor" anywhere it is exercised outside a browser,
  // including a test. The named export is correct in both.
  const { jsPDF: JsPDF } = await import("jspdf");
  // jspdf-autotable v5 exports a STANDALONE function - autoTable(doc, opts) -
  // and no longer patches jsPDF's prototype on import. The v3 style this used
  // to be written in (`await import("jspdf-autotable")` for its side effect,
  // then `pdf.autoTable({...})`) fails at runtime with
  // "pdf.autoTable is not a function", and only at runtime: the import
  // succeeds, the build passes, and it breaks when a user clicks Export.
  // v5 does still ship applyPlugin() for the old call style, but the function
  // form is the documented API and does not depend on prototype mutation.
  const { default: autoTable } = await import("jspdf-autotable");
  const pdf = new JsPDF({ orientation: columns.length > 5 ? "landscape" : "portrait" });
  pdf.setFontSize(14);
  pdf.text(title, 14, 15);
  autoTable(pdf, {
    startY: 20,
    head: [columns.map(c => c.label)],
    body: rows.map(r => columns.map(c => String(c.value(r) ?? ""))),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [0, 128, 128] },
  });
  return pdf.output("blob");
}

// report: { title, filename, columns: [{ label, value(row) }], rows }
// format: "csv" | "excel" | "pdf"
export async function downloadReport(report, format) {
  const { title, filename, columns, rows } = report;
  if (format === "csv") {
    downloadBlob(new Blob([toCsvText(columns, rows)], { type: "text/csv;charset=utf-8" }), `${filename}.csv`);
  } else if (format === "excel") {
    const buf = await toExcelBuffer(columns, rows, title);
    downloadBlob(new Blob([buf], { type: "application/octet-stream" }), `${filename}.xlsx`);
  } else if (format === "pdf") {
    const blob = await toPdfBlob(columns, rows, title);
    downloadBlob(blob, `${filename}.pdf`);
  }
}

// ---------------- Report definitions ----------------

export async function gatherRosterReport(institutionId, institutionName) {
  const students = await fetchRosterStudents(institutionId);
  return {
    title: "Student Roster",
    filename: `${slug(institutionName)}-roster`,
    columns: [
      { label: "Name", value: s => s.name },
      { label: "Roll Number", value: s => s.rollNumber },
      { label: "Department", value: s => s.department },
      { label: "Year", value: s => s.year },
      { label: "Section", value: s => s.section },
      { label: "Status", value: s => s.status },
      { label: "Classroom", value: s => s.classroomId || "" },
    ],
    rows: students,
  };
}

export async function gatherPendingRequestsReport(institutionId, institutionName) {
  const pending = await fetchPendingStudents(institutionId);
  return {
    title: "Pending Requests",
    filename: `${slug(institutionName)}-pending-requests`,
    columns: [
      { label: "Name", value: s => s.name },
      { label: "Roll Number", value: s => s.rollNumber },
      { label: "Department", value: s => s.department },
      { label: "Year", value: s => s.year },
      { label: "Section", value: s => s.section },
      { label: "Requested At", value: s => s.requestedAt?.toDate ? s.requestedAt.toDate().toLocaleString() : "" },
    ],
    rows: pending,
  };
}

// Institution-wide, across every classroom - the aggregate view Command
// Center's Classroom Overview table links out to. Deliberately fetches full
// per-classroom analytics (fetchClassroomAnalytics) only here, on-demand at
// export time, not on every Command Center page load - see that function's
// own cost (multiple reads per classroom) in lib/classroomAnalytics.js.
export async function gatherClassroomAnalyticsReport(institutionId, institutionName) {
  const [classrooms, roster] = await Promise.all([
    fetchClassrooms(institutionId),
    fetchRosterStudents(institutionId),
  ]);
  const byClassroom = new Map();
  roster.forEach(s => {
    if (!s.classroomId) return;
    if (!byClassroom.has(s.classroomId)) byClassroom.set(s.classroomId, []);
    byClassroom.get(s.classroomId).push(s);
  });
  const rows = await Promise.all(classrooms.map(async c => {
    const students = byClassroom.get(c.id) || [];
    if (students.length === 0) {
      return { year: c.year, department: c.department, section: c.section, totalStudents: 0, activeToday: 0, avgScore: 0, avgXp: 0, avgProblemsSolved: 0 };
    }
    const { kpis } = await fetchClassroomAnalytics(institutionId, students);
    return { year: c.year, department: c.department, section: c.section, ...kpis };
  }));
  return {
    title: "Classroom Analytics Summary",
    filename: `${slug(institutionName)}-classroom-analytics`,
    columns: [
      { label: "Year", value: r => r.year },
      { label: "Department", value: r => r.department },
      { label: "Section", value: r => r.section },
      { label: "Students", value: r => r.totalStudents },
      { label: "Active Today", value: r => r.activeToday },
      { label: "Avg Score", value: r => r.avgScore },
      { label: "Avg XP", value: r => r.avgXp },
      { label: "Avg Problems Solved", value: r => r.avgProblemsSolved },
    ],
    rows,
  };
}

export async function gatherContestResultsReport(contestId, contestTitle) {
  const [registrations, submissions] = await Promise.all([
    fetchContestRegistrations(contestId),
    fetchContestSubmissions(contestId),
  ]);
  const submissionByUid = new Map(submissions.map(s => [s.uid, s]));
  const rows = registrations.map(r => {
    const sub = submissionByUid.get(r.uid);
    return {
      name: r.campusFullName || r.handle || r.uid,
      rollNumber: r.rollNumber || "",
      submitted: !!sub,
      score: sub?.score ?? "",
      maxScore: sub?.maxScore ?? "",
      accuracy: sub?.accuracy ?? "",
    };
  });
  return {
    title: `Contest Results - ${contestTitle}`,
    filename: `${slug(contestTitle)}-results`,
    columns: [
      { label: "Name", value: r => r.name },
      { label: "Roll Number", value: r => r.rollNumber },
      { label: "Submitted", value: r => r.submitted ? "Yes" : "No" },
      { label: "Score", value: r => r.score },
      { label: "Max Score", value: r => r.maxScore },
      { label: "Accuracy", value: r => r.accuracy },
    ],
    rows,
  };
}
