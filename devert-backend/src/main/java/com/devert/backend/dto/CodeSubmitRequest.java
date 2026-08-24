package com.devert.backend.dto;

public class CodeSubmitRequest {
    private String uid;
    private String problemId;
    private String language;
    private String code;
    // True when this problem is embedded inside a Daily Learning day/
    // assessment as one of its own completion requirements - that day
    // already grants one flat XP/coin/score reward for finishing everything
    // (concept + problems + MCQs), so this specific submission's own
    // standalone CodeLab reward is suppressed to avoid double-counting the
    // same piece of work. Defaults to false (a real, standalone DSA-tab
    // submission) so every existing caller that doesn't send this field
    // keeps its current behavior unchanged.
    private boolean suppressReward;

    public String getUid() { return uid; }
    public void setUid(String uid) { this.uid = uid; }
    public String getProblemId() { return problemId; }
    public void setProblemId(String problemId) { this.problemId = problemId; }
    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public boolean isSuppressReward() { return suppressReward; }
    public void setSuppressReward(boolean suppressReward) { this.suppressReward = suppressReward; }
}
