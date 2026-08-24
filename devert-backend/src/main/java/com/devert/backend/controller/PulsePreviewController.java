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

import com.devert.backend.service.PulsePreviewService;

// Called only by the pulsePreviewRouter Cloud Function when it detects a
// link-preview crawler hitting /pulse/{id} - never by real browsers, which
// the Function routes straight to the static SPA instead. Always returns 200
// with best-effort meta tags, same fail-soft contract as the other preview controllers.
@RestController
@RequestMapping("/api/pulse")
@CrossOrigin(origins = "*")
public class PulsePreviewController {

    @Autowired
    private PulsePreviewService previewService;

    @GetMapping("/preview/{id}")
    public ResponseEntity<String> preview(@PathVariable String id) {
        String html = previewService.renderPreviewHtml(id);
        return ResponseEntity.ok()
            .header(HttpHeaders.CACHE_CONTROL, "public, max-age=300")
            .contentType(MediaType.TEXT_HTML)
            .body(html);
    }
}
