package com.devert.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.devert.backend.service.CampusPreviewService;

// Called only by the campusPreviewRouter Cloud Function when it detects a
// link-preview crawler hitting /campus/{slug} - never by real browsers, which
// the Function routes straight to the static SPA instead. Always returns 200
// with best-effort meta tags, same fail-soft contract as PortfolioPreviewController.
@RestController
@RequestMapping("/api/campus")
@CrossOrigin(origins = "*")
public class CampusPreviewController {

    @Autowired
    private CampusPreviewService previewService;

    @GetMapping("/preview/{slug}")
    public ResponseEntity<String> preview(@PathVariable String slug) {
        String html = previewService.renderPreviewHtml(slug);
        return ResponseEntity.ok()
            .header(HttpHeaders.CACHE_CONTROL, "public, max-age=300")
            .contentType(MediaType.TEXT_HTML)
            .body(html);
    }
}
