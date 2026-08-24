package com.devert.backend.dto;

// contestId/questionId come from the URL path (see ContestGradingController),
// not this body - only language/code are the client's own input.
public class ContestCodeSubmitRequest {
    private String language;
    private String code;

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
}
