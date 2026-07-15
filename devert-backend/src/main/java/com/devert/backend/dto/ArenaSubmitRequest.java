package com.devert.backend.dto;

public class ArenaSubmitRequest {
    private String matchId;
    private String language;
    private String code;

    public String getMatchId() { return matchId; }
    public void setMatchId(String matchId) { this.matchId = matchId; }
    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
}
