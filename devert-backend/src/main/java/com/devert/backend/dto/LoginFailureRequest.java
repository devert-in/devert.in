package com.devert.backend.dto;

// No auth header accompanies this - a failed signInWithEmailAndPassword
// means there is no valid Firebase session to verify at all. This endpoint
// is intentionally unauthenticated bookkeeping only (see AdminAccountService's
// recordLoginFailure), rate-limited per institution+email.
public class LoginFailureRequest {
    private String institutionId;
    private String email;

    public String getInstitutionId() { return institutionId; }
    public void setInstitutionId(String institutionId) { this.institutionId = institutionId; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
