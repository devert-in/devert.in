package com.devert.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;

// Same shape as PortfolioPreviewService/ContestPreviewService/CampusPreviewService.
// pulse_posts/{id} is public-read for approved posts (firestore.rules), so
// this reveals nothing a client couldn't already read directly - a
// not-yet-approved or deleted post simply renders the generic fallback,
// same as any other invalid id.
@Service
public class PulsePreviewService {

    @Autowired(required = false)
    private Firestore db;

    private static final String DEFAULT_OG_IMAGE = "https://devert.in/logo.png";
    private static final String SITE_NAME = "DeVert.in";

    public String renderPreviewHtml(String postId) {
        String safeId = HtmlUtils.htmlEscape(postId == null ? "" : postId);
        String canonicalUrl = "https://devert.in/pulse/" + safeId;

        if (db == null) {
            return fallbackHtml(canonicalUrl, "Pulse | DeVert.in", "The dev community feed on DeVert.");
        }

        try {
            DocumentSnapshot doc = db.collection("pulse_posts").document(postId).get().get();
            if (!doc.exists() || !"approved".equals(doc.getString("status"))) {
                return fallbackHtml(canonicalUrl, "Post not found | DeVert.in", "This post may have been removed.");
            }

            String title = HtmlUtils.htmlEscape(str(doc.getString("title"), ""));
            String caption = HtmlUtils.htmlEscape(str(doc.getString("caption"), ""));
            String handle = HtmlUtils.htmlEscape(str(doc.getString("handle"), ""));
            String imageUrl = HtmlUtils.htmlEscape(str(firstNonBlank(doc.getString("imageUrl"), doc.getString("photoURL")), DEFAULT_OG_IMAGE));

            String headline = !title.isEmpty() ? title : caption;
            String fullTitle = (!headline.isEmpty() ? headline : "A post") + " | DeVert Pulse";
            String description = !caption.isEmpty() && !caption.equals(headline) ? caption
                : !handle.isEmpty() ? "See @" + handle + "'s post on DeVert Pulse."
                : "See this post on DeVert Pulse.";

            return previewHtml(canonicalUrl, fullTitle, description, imageUrl);
        } catch (Exception e) {
            return fallbackHtml(canonicalUrl, "Pulse | DeVert.in", "The dev community feed on DeVert.");
        }
    }

    private String str(String v, String fallback) {
        return v != null && !v.isBlank() ? v : fallback;
    }

    private String firstNonBlank(String a, String b) {
        return a != null && !a.isBlank() ? a : b;
    }

    private String fallbackHtml(String canonicalUrl, String title, String description) {
        return previewHtml(canonicalUrl, HtmlUtils.htmlEscape(title), HtmlUtils.htmlEscape(description), DEFAULT_OG_IMAGE);
    }

    private String previewHtml(String canonicalUrl, String title, String description, String image) {
        return "<!DOCTYPE html>\n"
            + "<html lang=\"en\">\n"
            + "<head>\n"
            + "<meta charset=\"utf-8\">\n"
            + "<title>" + title + "</title>\n"
            + "<meta name=\"description\" content=\"" + description + "\">\n"
            + "<link rel=\"canonical\" href=\"" + canonicalUrl + "\">\n"
            + "<meta property=\"og:site_name\" content=\"" + SITE_NAME + "\">\n"
            + "<meta property=\"og:type\" content=\"article\">\n"
            + "<meta property=\"og:title\" content=\"" + title + "\">\n"
            + "<meta property=\"og:description\" content=\"" + description + "\">\n"
            + "<meta property=\"og:image\" content=\"" + image + "\">\n"
            + "<meta property=\"og:url\" content=\"" + canonicalUrl + "\">\n"
            + "<meta name=\"twitter:card\" content=\"summary_large_image\">\n"
            + "<meta name=\"twitter:title\" content=\"" + title + "\">\n"
            + "<meta name=\"twitter:description\" content=\"" + description + "\">\n"
            + "<meta name=\"twitter:image\" content=\"" + image + "\">\n"
            + "<meta http-equiv=\"refresh\" content=\"0;url=" + canonicalUrl + "\">\n"
            + "</head>\n"
            + "<body>Redirecting to <a href=\"" + canonicalUrl + "\">" + canonicalUrl + "</a>...</body>\n"
            + "</html>";
    }
}
