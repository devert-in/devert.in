package com.devert.backend.dto;

public class CreateStaffAccountRequest {
    private String institutionId;
    // "principal" | "hod" | "facultyClassTeacher" - see AdminAccountService's
    // WHO_CAN_CREATE matrix for exactly which caller roles may create which.
    private String roleKey;
    private String email;
    private String displayName;
    // Required only for roleKey == "hod" - one of lib/institutions.js's DEPARTMENTS.
    private String department;
    // Required only for roleKey == "facultyClassTeacher" - an existing
    // institutions/{id}/classrooms/{classroomId} doc id.
    private String classroomId;

    public String getInstitutionId() { return institutionId; }
    public void setInstitutionId(String institutionId) { this.institutionId = institutionId; }
    public String getRoleKey() { return roleKey; }
    public void setRoleKey(String roleKey) { this.roleKey = roleKey; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public String getClassroomId() { return classroomId; }
    public void setClassroomId(String classroomId) { this.classroomId = classroomId; }
}
