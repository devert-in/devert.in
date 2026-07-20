package com.devert.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;

// Same shape as PortfolioPreviewService/ContestPreviewService. institutions/{slug}
// is public-read in firestore.rules (directory browsing needs it), so this
// reveals nothing a client couldn't already read directly.
@Service
public class CampusPreviewService {

    @Autowired(required = false)
    private Firestore db;

    private static final String DEFAULT_OG_IMAGE = "https://devert.in/logo.png";
    private static final String SITE_NAME = "DeVert.in";

    public String renderPreviewHtml(String slug) {
        String safeSlug = HtmlUtils.htmlEscape(slug == null ? "" : slug);
        String canonicalUrl = "https://devert.in/campus/" + safeSlug;

        if (db == null) {
            return fallbackHtml(canonicalUrl, "DeVert Campus", "Structured learning & placement prep, run by your college.");
        }

        try {
            DocumentSnapshot doc = db.collection("institutions").document(slug).get().get();
            if (!doc.exists()) {
                return fallbackHtml(canonicalUrl, "College not found | DeVert Campus", "This college isn't on DeVert Campus (yet).");
            }

            String name = HtmlUtils.htmlEscape(str(doc.getString("name"), safeSlug));
            String location = HtmlUtils.htmlEscape(str(doc.getString("location"), ""));
            String description = HtmlUtils.htmlEscape(str(doc.getString("description"), ""));
            String logoUrl = HtmlUtils.htmlEscape(str(doc.getString("logoUrl"), DEFAULT_OG_IMAGE));

            String title = name + " | DeVert Campus";
            String fullDescription = !description.isEmpty() ? description
                : !location.isEmpty() ? name + "'s workspace on DeVert Campus, " + location + "."
                : name + "'s structured learning & placement prep workspace on DeVert Campus.";

            return previewHtml(canonicalUrl, title, fullDescription, logoUrl);
        } catch (Exception e) {
            return fallbackHtml(canonicalUrl, "DeVert Campus", "Structured learning & placement prep, run by your college.");
        }
    }

    private String str(String v, String fallback) {
        return v != null && !v.isBlank() ? v : fallback;
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
            + "<meta property=\"og:type\" content=\"website\">\n"
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
