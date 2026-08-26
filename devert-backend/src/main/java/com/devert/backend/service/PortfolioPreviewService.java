package com.devert.backend.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;

// Reads the public users/{uid} doc server-side (same admin-SDK access GradingService
// uses for CodeLab) purely to render Open Graph/Twitter meta tags for link-preview
// crawlers (LinkedIn, Twitter, Slack, etc.) - real browsers never see this HTML, they
// get redirected straight to the actual static SPA at /u/{handle}. users/{uid} is
// already fully public-read in firestore.rules, so this reveals nothing the client
// couldn't already read itself.
@Service
public class PortfolioPreviewService {

    @Autowired(required = false)
    private Firestore db;

    // Reuses the same logo.png already referenced site-wide by app/layout.jsx's
    // metadata - no separate OG-specific asset exists, and this one's already
    // proven to be the right dimensions/branding for a link preview.
    private static final String DEFAULT_OG_IMAGE = "https://devert.in/logo.png";
    private static final String SITE_NAME = "DeVert.in";

    public String renderPreviewHtml(String handle) {
        String safeHandle = HtmlUtils.htmlEscape(handle == null ? "" : handle);
        String canonicalUrl = "https://devert.in/u/" + safeHandle;

        if (db == null) {
            return fallbackHtml(canonicalUrl, "@" + safeHandle + " on DeVert", "A developer portfolio, hosted by DeVert.");
        }

        try {
            QuerySnapshot snap = db.collection("users")
                .whereEqualTo("handle", handle)
                .limit(1)
                .get()
                .get();
            List<QueryDocumentSnapshot> docs = snap.getDocuments();
            if (docs.isEmpty()) {
                return fallbackHtml(canonicalUrl, "@" + safeHandle + " on DeVert", "This developer hasn't shipped yet.");
            }

            var data = docs.get(0).getData();
            String displayName = HtmlUtils.htmlEscape(str(data.get("displayName"), safeHandle));
            String headline = HtmlUtils.htmlEscape(str(data.get("headline"), ""));
            String bio = HtmlUtils.htmlEscape(str(data.get("bio"), ""));
            String photoURL = HtmlUtils.htmlEscape(str(data.get("photoURL"), DEFAULT_OG_IMAGE));

            String title = displayName + (headline.isEmpty() ? "" : " — " + headline) + " | " + SITE_NAME;
            String description = !bio.isEmpty() ? bio
                : !headline.isEmpty() ? headline
                : "View " + displayName + "'s developer portfolio on DeVert.";

            return previewHtml(canonicalUrl, title, description, photoURL);
        } catch (Exception e) {
            return fallbackHtml(canonicalUrl, "@" + safeHandle + " on DeVert", "A developer portfolio, hosted by DeVert.");
        }
    }

    private String str(Object v, String fallback) {
        return v instanceof String s && !s.isBlank() ? s : fallback;
    }

    private String fallbackHtml(String canonicalUrl, String title, String description) {
        return previewHtml(canonicalUrl, HtmlUtils.htmlEscape(title), HtmlUtils.htmlEscape(description), DEFAULT_OG_IMAGE);
    }

    // Already-escaped inputs only past this point.
    private String previewHtml(String canonicalUrl, String title, String description, String image) {
        return "<!DOCTYPE html>\n"
            + "<html lang=\"en\">\n"
            + "<head>\n"
            + "<meta charset=\"utf-8\">\n"
            + "<title>" + title + "</title>\n"
            + "<meta name=\"description\" content=\"" + description + "\">\n"
            + "<link rel=\"canonical\" href=\"" + canonicalUrl + "\">\n"
            + "<meta property=\"og:site_name\" content=\"" + SITE_NAME + "\">\n"
            + "<meta property=\"og:type\" content=\"profile\">\n"
            + "<meta property=\"og:title\" content=\"" + title + "\">\n"
            + "<meta property=\"og:description\" content=\"" + description + "\">\n"
            + "<meta property=\"og:image\" content=\"" + image + "\">\n"
            + "<meta property=\"og:url\" content=\"" + canonicalUrl + "\">\n"
            + "<meta name=\"twitter:card\" content=\"summary\">\n"
            + "<meta name=\"twitter:title\" content=\"" + title + "\">\n"
            + "<meta name=\"twitter:description\" content=\"" + description + "\">\n"
            + "<meta name=\"twitter:image\" content=\"" + image + "\">\n"
            + "<meta http-equiv=\"refresh\" content=\"0;url=" + canonicalUrl + "\">\n"
            + "</head>\n"
            + "<body>Redirecting to <a href=\"" + canonicalUrl + "\">" + canonicalUrl + "</a>...</body>\n"
            + "</html>";
    }
}
