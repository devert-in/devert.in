package com.devert.backend.dto;

public class CodeRunRequest {
    private String language;
    private String code;
    private String stdin;

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getStdin() { return stdin; }
    public void setStdin(String stdin) { this.stdin = stdin; }
}
