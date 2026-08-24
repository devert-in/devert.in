package com.devert.backend.dto;

public class StaffAccountStatusRequest {
    private String institutionId;
    private String uid;
    // "active" | "disabled"
    private String status;

    public String getInstitutionId() { return institutionId; }
    public void setInstitutionId(String institutionId) { this.institutionId = institutionId; }
    public String getUid() { return uid; }
    public void setUid(String uid) { this.uid = uid; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
