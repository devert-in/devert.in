package com.devert.backend.service;

import java.security.SecureRandom;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.FieldValue;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.SetOptions;
import com.google.firebase.auth.ActionCodeSettings;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserRecord;

// Creates and manages Principal/HOD/Faculty-Class-Teacher accounts entirely
// server-side via the Admin SDK, bypassing Firestore rules by design (same
// trust boundary GradingService already established for hidden test cases).
// Two things a browser can never safely do on its own: (1) create another
// person's Firebase Auth account without hijacking the CALLER's own signed-in
// session, and (2) generate an initial password that nobody but the target
// account holder (via their own password-reset email) ever sees. See
// firestore.rules' roleAssignments/{uid} write rule - isAdmin()-only,
// i.e. no legitimate client write path exists for this collection at all;
// this service is the only thing that ever writes to it.
@Service
public class AdminAccountService {

    @Autowired(required = false)
    private Firestore db;

    @Autowired(required = false)
    private FirebaseAuth firebaseAuth;

    @Autowired
    private EmailService emailService;

    @Autowired
    private RateLimiter rateLimiter;

    @Value("${app.frontend.password-reset-url}")
    private String passwordResetUrl;

    // Every password-reset link this service generates lands on our own
    // branded page (see that page's own comment for why) instead of Firebase
    // Hosting's default <project>.firebaseapp.com/__/auth/action - the oobCode
    // Firebase appends still does all the real work, only the domain the
    // user actually sees changes. campus/role are carried as plain query
    // params (not sensitive - just routing hints) so that page can point its
    // "Continue" button straight at this account's own login page without
    // ever needing to sign in first just to look up where it belongs.
    private ActionCodeSettings passwordResetSettings(String institutionId, String roleKey) {
        String url = passwordResetUrl + "?campus=" + institutionId + "&role=" + loginUrlSegment(roleKey);
        return ActionCodeSettings.builder().setUrl(url).build();
    }

    // Who may create/manage which role - the literal "new role = configuration,
    // not redesign" surface on the backend side (lib/permissions.js's
    // ROLE_CATALOG + system/rolePermissionDefaults are the equivalent surface
    // for the frontend/rules side). A future role just needs one new entry
    // here plus one new roleKey value everywhere else - no new code paths.
    private static final Map<String, Set<String>> WHO_CAN_ACT = Map.of(
        "principal", Set.of("institutionAdmin"),
        "hod", Set.of("institutionAdmin", "principal"),
        "facultyClassTeacher", Set.of("institutionAdmin", "principal", "hod")
    );

    private static final Set<String> VALID_ROLE_KEYS = Set.of("principal", "hod", "facultyClassTeacher");

    private void requireConfigured() {
        if (db == null || firebaseAuth == null) {
            throw new IllegalStateException("Admin account management isn't configured yet (missing FIREBASE_SERVICE_ACCOUNT_JSON).");
        }
    }

    // ---- caller resolution -------------------------------------------------

    private static class CallerContext {
        final String kind; // "institutionAdmin" | "principal" | "hod" | "facultyClassTeacher" | null
        final String department;
        final String classroomId;
        CallerContext(String kind, String department, String classroomId) {
            this.kind = kind; this.department = department; this.classroomId = classroomId;
        }
    }

    // admins/{uid} existence takes precedence over any roleAssignment, same
    // precedence firestore.rules' isInstitutionAdmin() gives the admins
    // subcollection over everything else.
    private CallerContext resolveCaller(String institutionId, String callerUid) throws Exception {
        DocumentSnapshot adminSnap = institutionDoc(institutionId).collection("admins").document(callerUid).get().get();
        if (adminSnap.exists()) return new CallerContext("institutionAdmin", null, null);

        DocumentSnapshot roleSnap = institutionDoc(institutionId).collection("roleAssignments").document(callerUid).get().get();
        if (roleSnap.exists() && "active".equals(roleSnap.getString("status"))) {
            @SuppressWarnings("unchecked")
            Map<String, Object> scope = (Map<String, Object>) roleSnap.get("scope");
            String department = scope != null ? (String) scope.get("department") : null;
            String classroomId = scope != null ? (String) scope.get("classroomId") : null;
            return new CallerContext(roleSnap.getString("roleKey"), department, classroomId);
        }
        return new CallerContext(null, null, null);
    }

    private void authorize(CallerContext caller, String targetRoleKey, String targetDepartment) {
        Set<String> allowedKinds = WHO_CAN_ACT.get(targetRoleKey);
        if (caller.kind == null || allowedKinds == null || !allowedKinds.contains(caller.kind)) {
            throw new SecurityException("You are not authorized to manage " + targetRoleKey + " accounts.");
        }
        // An HOD's authority is scoped to their own department - they may act
        // on Faculty/Class Teacher accounts only within it, never on another
        // department's, even though "hod" is in facultyClassTeacher's allowed
        // set above.
        if ("hod".equals(caller.kind) && "facultyClassTeacher".equals(targetRoleKey)) {
            if (caller.department == null || !caller.department.equals(targetDepartment)) {
                throw new SecurityException("You may only manage Faculty/Class Teacher accounts within your own department.");
            }
        }
    }

    private DocumentReference institutionDoc(String institutionId) {
        return db.collection("institutions").document(institutionId);
    }

    // ---- create -------------------------------------------------------------

    public Map<String, Object> createAccount(String callerUid, String institutionId, String roleKey, String email,
                                              String displayName, String department, String classroomId) throws Exception {
        requireConfigured();
        if (institutionId == null || institutionId.isBlank()) throw new IllegalArgumentException("institutionId is required.");
        if (!VALID_ROLE_KEYS.contains(roleKey)) throw new IllegalArgumentException("Unknown role: " + roleKey);
        if (email == null || email.isBlank()) throw new IllegalArgumentException("email is required.");
        if (displayName == null || displayName.isBlank()) throw new IllegalArgumentException("displayName is required.");
        if ("hod".equals(roleKey) && (department == null || department.isBlank())) {
            throw new IllegalArgumentException("department is required for an HOD account.");
        }
        if ("facultyClassTeacher".equals(roleKey) && (classroomId == null || classroomId.isBlank())) {
            throw new IllegalArgumentException("classroomId is required for a Faculty/Class Teacher account.");
        }

        CallerContext caller = resolveCaller(institutionId, callerUid);
        String targetDepartment = department;
        if ("facultyClassTeacher".equals(roleKey)) {
            // Re-derive the classroom's OWN department server-side - never trust
            // a client-supplied department for the scope match below, and an
            // HOD creating Faculty must only ever succeed inside their own
            // department's classrooms.
            DocumentSnapshot classroomSnap = institutionDoc(institutionId).collection("classrooms").document(classroomId).get().get();
            if (!classroomSnap.exists()) throw new IllegalArgumentException("Classroom not found: " + classroomId);
            targetDepartment = classroomSnap.getString("department");
        }
        authorize(caller, roleKey, targetDepartment);

        // Exactly one active holder per (roleKey, scope) - "one Principal per
        // institution", "one HOD per department", "one Class Teacher per
        // classroom", all per the spec. Replacing someone means disabling
        // their account first (status endpoint), then creating the new one -
        // kept as two explicit actions rather than silently reassigning
        // hodUid/classTeacherUid while the PREVIOUS holder's roleAssignment
        // (the actual rules-level authorization source, not the denormalized
        // uid field) is still active.
        CollectionReference roleAssignments = institutionDoc(institutionId).collection("roleAssignments");
        var existingQuery = roleAssignments.whereEqualTo("roleKey", roleKey).whereEqualTo("status", "active");
        if ("hod".equals(roleKey)) existingQuery = existingQuery.whereEqualTo("scope.department", targetDepartment);
        if ("facultyClassTeacher".equals(roleKey)) existingQuery = existingQuery.whereEqualTo("scope.classroomId", classroomId);
        List<QueryDocumentSnapshot> existing = existingQuery.get().get().getDocuments();
        if (!existing.isEmpty()) {
            throw new IllegalStateException(roleLabel(roleKey) + " already has an active holder for this scope - disable them first.");
        }

        // Reuse an existing Firebase Auth account (e.g. the person already
        // signed in via Google elsewhere on DeVert) rather than erroring on
        // EMAIL_EXISTS; only mint a brand-new one if genuinely new. Either
        // way, the generated password is used exactly once, right here, to
        // satisfy Firebase Auth's create-account API, and is never returned
        // to the caller, logged, or persisted anywhere - the target person's
        // only path in is their own password-reset email below.
        UserRecord user;
        try {
            user = firebaseAuth.getUserByEmail(email);
        } catch (FirebaseAuthException notFound) {
            UserRecord.CreateRequest createRequest = new UserRecord.CreateRequest()
                .setEmail(email)
                .setDisplayName(displayName)
                .setPassword(generateSecurePassword());
            user = firebaseAuth.createUser(createRequest);
        }
        String uid = user.getUid();

        String finalTargetDepartment = targetDepartment;
        db.runTransaction(tx -> {
            Map<String, Object> roleAssignment = new HashMap<>();
            roleAssignment.put("uid", uid);
            roleAssignment.put("institutionId", institutionId);
            roleAssignment.put("roleKey", roleKey);
            Map<String, Object> scope = new HashMap<>();
            // department is persisted for facultyClassTeacher too, not just
            // hod. finalTargetDepartment is already the classroom's OWN
            // server-derived department for that role (see above - it is what
            // authorize() just scope-checked), so this stores a value that was
            // never client-supplied. It is what lets firestore.rules'
            // roleAssignments read rule do what its comment always claimed -
            // "an HOD may read their own department's OTHER role-assignment
            // docs (e.g. seeing which Faculty/Class Teachers are assigned in
            // their own department)". Without it, scope.department was null on
            // every Faculty doc, isHodOfDepartment() could never match one,
            // and an HOD's Faculty tab was permanently empty.
            //
            // This grants no authority: isHodOfDepartment() requires
            // roleKey == 'hod' as a separate conjunct, so a Faculty doc
            // carrying a department is still only ever a Faculty doc. The
            // one-active-holder-per-scope query above filters on
            // scope.department for 'hod' only, so it is unaffected too.
            //
            // Still null for 'principal' specifically - that role is
            // institution-wide, and its `department` argument is unvalidated
            // client input no code path uses, so storing it would be the one
            // way a caller could smuggle a department onto a doc.
            boolean departmentScoped = "hod".equals(roleKey) || "facultyClassTeacher".equals(roleKey);
            scope.put("department", departmentScoped ? finalTargetDepartment : null);
            scope.put("classroomId", "facultyClassTeacher".equals(roleKey) ? classroomId : null);
            roleAssignment.put("scope", scope);
            roleAssignment.put("permissionOverrides", Map.of());
            roleAssignment.put("displayName", displayName);
            roleAssignment.put("email", email);
            roleAssignment.put("status", "active");
            roleAssignment.put("createdAt", FieldValue.serverTimestamp());
            roleAssignment.put("createdBy", callerUid);
            roleAssignment.put("updatedAt", FieldValue.serverTimestamp());
            roleAssignment.put("updatedBy", callerUid);
            roleAssignment.put("lastLoginAt", null);
            roleAssignment.put("failedLoginCount", 0);
            roleAssignment.put("lastFailedLoginAt", null);
            roleAssignment.put("lockedUntil", null);
            tx.set(institutionDoc(institutionId).collection("roleAssignments").document(uid), roleAssignment);

            if ("hod".equals(roleKey)) {
                String deptKey = slugify(finalTargetDepartment);
                tx.set(institutionDoc(institutionId).collection("departments").document(deptKey),
                    Map.of("hodUid", uid), SetOptions.merge());
            }
            if ("facultyClassTeacher".equals(roleKey)) {
                tx.set(institutionDoc(institutionId).collection("classrooms").document(classroomId),
                    Map.of("classTeacherUid", uid), SetOptions.merge());
            }
            return null;
        }).get();

        writeAuditLog(institutionId, callerUid, "create_" + roleKey, uid, displayName + " <" + email + ">");

        boolean emailSent = true;
        try {
            String resetLink = firebaseAuth.generatePasswordResetLink(email, passwordResetSettings(institutionId, roleKey));
            emailService.sendAccountSetupEmail(email, displayName, roleLabel(roleKey), resetLink);
        } catch (Exception e) {
            emailSent = false; // account exists regardless - resend-setup covers retry
        }

        Map<String, Object> result = new HashMap<>();
        result.put("uid", uid);
        result.put("emailSent", emailSent);
        return result;
    }

    // ---- status / reset-password / permissions / resend-setup --------------

    public void setStatus(String callerUid, String institutionId, String targetUid, String status) throws Exception {
        requireConfigured();
        if (!"active".equals(status) && !"disabled".equals(status)) throw new IllegalArgumentException("Unknown status: " + status);
        DocumentSnapshot target = requireRoleAssignment(institutionId, targetUid);
        authorize(resolveCaller(institutionId, callerUid), target.getString("roleKey"), departmentOf(target));

        // Belt (Firebase Auth session killed outright) and suspenders
        // (roleAssignments.status, which every rules-level scope check also
        // requires to be "active") - a disabled account loses access even
        // mid-session, not just on its next sign-in attempt.
        firebaseAuth.updateUser(new UserRecord.UpdateRequest(targetUid).setDisabled("disabled".equals(status)));
        institutionDoc(institutionId).collection("roleAssignments").document(targetUid)
            .set(Map.of("status", status, "updatedAt", FieldValue.serverTimestamp(), "updatedBy", callerUid), SetOptions.merge())
            .get();
        writeAuditLog(institutionId, callerUid, "set_status_" + status, targetUid, null);
    }

    public void resetPassword(String callerUid, String institutionId, String targetUid) throws Exception {
        requireConfigured();
        DocumentSnapshot target = requireRoleAssignment(institutionId, targetUid);
        authorize(resolveCaller(institutionId, callerUid), target.getString("roleKey"), departmentOf(target));

        String email = target.getString("email");
        String resetLink = firebaseAuth.generatePasswordResetLink(email, passwordResetSettings(institutionId, target.getString("roleKey")));
        emailService.sendAccountSetupEmail(email, target.getString("displayName"), roleLabel(target.getString("roleKey")), resetLink);
        writeAuditLog(institutionId, callerUid, "reset_password", targetUid, null);
    }

    public void resendSetup(String callerUid, String institutionId, String targetUid) throws Exception {
        // Identical mechanics to resetPassword - kept as a separate endpoint
        // purely so the Manage Admins UI can offer "Resend setup email" on a
        // freshly-created account distinctly from "Reset password" on an
        // established one, without implying anything actually differs server-side.
        resetPassword(callerUid, institutionId, targetUid);
    }

    public void updatePermissions(String callerUid, String institutionId, String targetUid, Map<String, Boolean> permissionOverrides) throws Exception {
        requireConfigured();
        DocumentSnapshot target = requireRoleAssignment(institutionId, targetUid);
        authorize(resolveCaller(institutionId, callerUid), target.getString("roleKey"), departmentOf(target));

        institutionDoc(institutionId).collection("roleAssignments").document(targetUid)
            .set(Map.of("permissionOverrides", permissionOverrides == null ? Map.of() : permissionOverrides,
                "updatedAt", FieldValue.serverTimestamp(), "updatedBy", callerUid), SetOptions.merge())
            .get();
        writeAuditLog(institutionId, callerUid, "update_permissions", targetUid, null);
    }

    private DocumentSnapshot requireRoleAssignment(String institutionId, String uid) throws Exception {
        DocumentSnapshot snap = institutionDoc(institutionId).collection("roleAssignments").document(uid).get().get();
        if (!snap.exists()) throw new IllegalArgumentException("No staff account found: " + uid);
        return snap;
    }

    @SuppressWarnings("unchecked")
    private String departmentOf(DocumentSnapshot roleAssignment) {
        Map<String, Object> scope = (Map<String, Object>) roleAssignment.get("scope");
        return scope != null ? (String) scope.get("department") : null;
    }

    // ---- login bookkeeping (Part A6 / B6) -----------------------------------

    // Self-action - the account logging in, verified by its own ID token
    // (never a body-supplied uid). Resets the failure counters and stamps
    // lastLoginAt; a no-op (not an error) if this uid has no roleAssignment
    // at all, since login-success is also called from student/admin flows
    // that don't have one.
    // Returns true only if a stamp was actually written, so a caller that
    // already knows it HAS a roleAssignment (CampusStaffLogin verifies this
    // before calling) can tell a real drop apart from the legitimate no-op
    // below - otherwise a silently unwritten stamp is indistinguishable from
    // "never signed in" in Manage > Security.
    public boolean recordLoginSuccess(String uid, String institutionId) throws Exception {
        if (db == null || institutionId == null || institutionId.isBlank()) return false;
        DocumentReference ref = institutionDoc(institutionId).collection("roleAssignments").document(uid);
        if (!ref.get().get().exists()) return false;
        ref.set(Map.of("lastLoginAt", FieldValue.serverTimestamp(), "failedLoginCount", 0,
            "lockedUntil", null), SetOptions.merge()).get();
        return true;
    }

    // Unauthenticated by necessity (see LoginFailureRequest) - rate-limited
    // per institution+email so this can't be used to hammer Firestore, and a
    // no-op for an unknown email so no speculative doc is ever created keyed
    // by an attacker-supplied string. Locks the account for 15 minutes after
    // 5 failures in a rolling window - an accepted tradeoff (same spirit as
    // RateLimiter's own in-process-only caveat): this makes a targeted
    // temporary lockout of a KNOWN admin email possible for anyone who knows
    // it, which is the standard cost of any simple lockout-after-N-failures
    // scheme and not something this pass tries to solve further (e.g. with
    // CAPTCHA or IP-based signals).
    public void recordLoginFailure(String institutionId, String email) throws Exception {
        if (db == null || institutionId == null || email == null || email.isBlank()) return;
        if (!rateLimiter.allow("login-attempt:" + institutionId + ":" + email.toLowerCase(), 10, 60 * 60 * 1000)) return;

        List<QueryDocumentSnapshot> matches = institutionDoc(institutionId).collection("roleAssignments")
            .whereEqualTo("email", email).limit(1).get().get().getDocuments();
        if (matches.isEmpty()) return;
        DocumentReference ref = matches.get(0).getReference();

        db.runTransaction(tx -> {
            DocumentSnapshot fresh = tx.get(ref).get();
            long failures = (fresh.contains("failedLoginCount") && fresh.getLong("failedLoginCount") != null
                ? fresh.getLong("failedLoginCount") : 0) + 1;
            Map<String, Object> update = new HashMap<>();
            update.put("failedLoginCount", failures);
            update.put("lastFailedLoginAt", FieldValue.serverTimestamp());
            if (failures >= 5) {
                update.put("lockedUntil", com.google.cloud.Timestamp.ofTimeSecondsAndNanos(
                    System.currentTimeMillis() / 1000 + 15 * 60, 0));
            }
            tx.set(ref, update, SetOptions.merge());
            return null;
        }).get();
    }

    // ---- helpers -------------------------------------------------------------

    private void writeAuditLog(String institutionId, String actorUid, String action, String targetUid, String details) throws Exception {
        Map<String, Object> entry = new HashMap<>();
        entry.put("actorUid", actorUid);
        entry.put("institutionId", institutionId);
        entry.put("action", action);
        entry.put("targetUid", targetUid);
        entry.put("details", details);
        entry.put("createdAt", FieldValue.serverTimestamp());
        institutionDoc(institutionId).collection("adminActivityLog").document().set(entry).get();
    }

    private static String roleLabel(String roleKey) {
        return switch (roleKey) {
            case "principal" -> "Principal";
            case "hod" -> "Head of Department";
            case "facultyClassTeacher" -> "Faculty / Class Teacher";
            default -> roleKey;
        };
    }

    // Mirrors campus-app.jsx's STAFF_LOGIN_ROLE (the inverse mapping) - the
    // short segment each role's dedicated login page lives at:
    // /campus/{institutionId}/{principal|hod|faculty}. Stamped onto the
    // password-reset link's continue URL so the branded reset-password page
    // knows exactly where to send someone next without any post-reset
    // sign-in/lookup step.
    private static String loginUrlSegment(String roleKey) {
        return switch (roleKey) {
            case "facultyClassTeacher" -> "faculty";
            default -> roleKey; // "principal", "hod" already match
        };
    }

    // Matches lib/institutions.js's slugifyClassroomPart exactly - department
    // keys and classroom keys share the same slugification rule.
    private static String slugify(String value) {
        if (value == null) return "";
        return value.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-+|-+$", "");
    }

    private static String generateSecurePassword() {
        SecureRandom random = new SecureRandom();
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
        StringBuilder sb = new StringBuilder(28);
        for (int i = 0; i < 28; i++) sb.append(chars.charAt(random.nextInt(chars.length())));
        return sb.toString();
    }
}
