package com.devert.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

// Replaces the old per-controller @CrossOrigin(origins = "*") - that let any site call
// /api/coding/run, /api/coding/submit and /api/notify/**. Origins are configurable via
// ALLOWED_ORIGINS (comma-separated) so a new preview channel or custom domain is an env
// var change, not a redeploy. allowedOriginPatterns (not allowedOrigins) so the
// Firebase preview-channel wildcard below actually matches.
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOriginPatterns(allowedOrigins.split(","))
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            .allowedHeaders("*");
    }
}
