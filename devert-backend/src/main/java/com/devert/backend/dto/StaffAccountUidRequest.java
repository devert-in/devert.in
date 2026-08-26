package com.devert.backend.dto;

// Shared shape for the two staff-account actions that only need to name the
// target account - resend-setup and reset-password.
public class StaffAccountUidRequest {
    private String institutionId;
    private String uid;

    public String getInstitutionId() { return institutionId; }
    public void setInstitutionId(String institutionId) { this.institutionId = institutionId; }
    public String getUid() { return uid; }
    public void setUid(String uid) { this.uid = uid; }
}
