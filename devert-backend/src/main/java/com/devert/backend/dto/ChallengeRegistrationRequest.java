package com.devert.backend.dto;

public class ChallengeRegistrationRequest {
    private String email;
    private String teamName;
    private String leadName;

    public ChallengeRegistrationRequest() {
    }

    public ChallengeRegistrationRequest(String email, String teamName, String leadName) {
        this.email = email;
        this.teamName = teamName;
        this.leadName = leadName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getTeamName() {
        return teamName;
    }

    public void setTeamName(String teamName) {
        this.teamName = teamName;
    }

    public String getLeadName() {
        return leadName;
    }

    public void setLeadName(String leadName) {
        this.leadName = leadName;
    }
}
