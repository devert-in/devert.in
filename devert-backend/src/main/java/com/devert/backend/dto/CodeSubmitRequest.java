package com.devert.backend.dto;

public class CodeSubmitRequest {
    private String uid;
    private String problemId;
    private String language;
    private String code;

    public String getUid() { return uid; }
    public void setUid(String uid) { this.uid = uid; }
    public String getProblemId() { return problemId; }
    public void setProblemId(String problemId) { this.problemId = problemId; }
    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
}
