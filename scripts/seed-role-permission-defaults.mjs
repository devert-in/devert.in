import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const db = admin.firestore();

// Default permission bundle per role - the literal "new role = configuration,
// not redesign" surface (see devert-frontend/lib/permissions.js's own
// comment, which this must stay in sync with). Keyed by roleKey, each value
// a map of permission-string -> true (only true entries are listed; a key
// absent here is NOT granted by default, an admin can still grant it as a
// per-account override via Manage Admins -> Permissions).
const rolePermissionDefaults = {
  principal: {
    "students.view": true, "students.edit": true,
    "dailyLearning.publish": true, "programming.manage": true, "csCore.manage": true,
    "dsa.manage": true, "aptitude.manage": true, "companyPrep.manage": true, "assessments.manage": true,
    "analytics.view": true, "reports.export": true,
    "faculty.manage": true, "teachers.assign": true, "departments.manage": true, "classrooms.manage": true,
    "leaderboards.view": true, "announcements.manage": true, "contests.manage": true,
  },
  hod: {
    "students.view": true, "students.edit": true,
    "dailyLearning.publish": true, "assessments.manage": true,
    "analytics.view": true, "reports.export": true,
    "faculty.manage": true, "teachers.assign": true, "departments.manage": true, "classrooms.manage": true,
    "leaderboards.view": true, "announcements.manage": true,
  },
  facultyClassTeacher: {
    "students.view": true,
    "dailyLearning.publish": true,
    "analytics.view": true, "reports.export": true,
    "leaderboards.view": true, "classrooms.manage": true,
  },
};

await db.doc("system/rolePermissionDefaults").set(rolePermissionDefaults);
console.log("system/rolePermissionDefaults seeded:", JSON.stringify(rolePermissionDefaults, null, 2));
