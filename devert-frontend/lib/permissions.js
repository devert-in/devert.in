// Canonical permission catalog for the Principal/HOD/Faculty-Class-Teacher
// hierarchy - the single source of truth both the client (useHasPermission,
// the Manage Admins permissions editor) and firestore.rules' hasPermission()
// key off. A permission key here that firestore.rules doesn't also check is
// enforced client-side only (a UI gate, not a security boundary) - see
// campusNavConfig.js/campusPermissions.js's own comments on which of these
// are which. Adding a permission is just adding a string here plus, if it's a
// real write boundary and not just a UI toggle, one more disjunct in rules -
// no new architecture either way.
export const PERMISSIONS = [
  "students.view", "students.edit",
  "dailyLearning.publish", "programming.manage", "csCore.manage", "dsa.manage",
  "aptitude.manage", "fundamentals.manage", "companyPrep.manage", "assessments.manage",
  "analytics.view", "reports.export",
  "faculty.manage", "teachers.assign", "departments.manage", "classrooms.manage",
  "leaderboards.view", "announcements.manage", "contests.manage",
];

export const PERMISSION_LABELS = {
  "students.view": "View Students",
  "students.edit": "Edit Students",
  "dailyLearning.publish": "Publish Daily Learning",
  "programming.manage": "Manage Programming",
  "csCore.manage": "Manage CS Core",
  "dsa.manage": "Manage DSA",
  "aptitude.manage": "Manage Aptitude",
  "fundamentals.manage": "Manage Fundamentals",
  "companyPrep.manage": "Manage Company Vault",
  "assessments.manage": "Manage Assessments",
  "analytics.view": "View Analytics",
  "reports.export": "Export Reports",
  "faculty.manage": "Manage Faculty",
  "teachers.assign": "Assign Teachers",
  "departments.manage": "Manage Departments",
  "classrooms.manage": "Manage Classrooms",
  "leaderboards.view": "View Leaderboards",
  "announcements.manage": "Manage Announcements",
  "contests.manage": "Manage Contests",
};

// roleKey -> {label, scopeType} - drives the Manage Admins UI (which scope
// picker to show) and the three dedicated login pages. A future role (e.g.
// "placementOfficer") is one new entry here, one new key in
// system/rolePermissionDefaults, and one new entry in the backend's
// WHO_CAN_ACT matrix (AdminAccountService) - no other code changes.
export const ROLE_CATALOG = {
  principal: { label: "Principal", scopeType: "institution" },
  hod: { label: "Head of Department", scopeType: "department" },
  facultyClassTeacher: { label: "Faculty / Class Teacher", scopeType: "classroom" },
};

// Hardcoded fallback mirroring system/rolePermissionDefaults - used only if
// that doc is ever unreadable/missing (e.g. offline, a fresh institution
// before the doc's been seeded), so the UI degrades to "show nothing
// gated" rather than crash. Firestore rules' hasPermission() is the real
// source of truth for what's actually enforced; this is a client-side
// display fallback only. See scripts/seed-role-permission-defaults.mjs for
// the canonical seeded values, which should stay in sync with this shape.
export const FALLBACK_ROLE_PERMISSIONS = {
  principal: Object.fromEntries(PERMISSIONS.map(p => [p, true])),
  hod: {},
  facultyClassTeacher: {},
};
