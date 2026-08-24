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

import com.devert.backend.service.PortfolioPreviewService;

// Called only by the uHandleRouter Cloud Function when it detects a link-preview
// crawler (LinkedIn/Twitter/Slack/etc.) hitting /u/{handle} - never by real browsers,
// which the Function routes straight to the static SPA instead. Always returns 200
// with best-effort meta tags, even on a missing handle or a Firestore hiccup, so a
// crawler never sees a broken/empty preview.
@RestController
@RequestMapping("/api/portfolio")
@CrossOrigin(origins = "*")
public class PortfolioPreviewController {

    @Autowired
    private PortfolioPreviewService previewService;

    @GetMapping("/preview/{handle}")
    public ResponseEntity<String> preview(@PathVariable String handle) {
        String html = previewService.renderPreviewHtml(handle);
        return ResponseEntity.ok()
            .header(HttpHeaders.CACHE_CONTROL, "public, max-age=300")
            .contentType(MediaType.TEXT_HTML)
            .body(html);
    }
}
