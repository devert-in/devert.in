package com.devert.backend.dto;

public class PayoutStatusRequest {
    private String email;
    private String displayName;
    private String status; // "approved" | "rejected"
    private int coins;
    private double inrAmount;

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public int getCoins() { return coins; }
    public void setCoins(int coins) { this.coins = coins; }
    public double getInrAmount() { return inrAmount; }
    public void setInrAmount(double inrAmount) { this.inrAmount = inrAmount; }
}
