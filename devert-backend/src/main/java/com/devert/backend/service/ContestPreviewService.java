package com.devert.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;

// Same shape as PortfolioPreviewService - reads a contests/{id} doc server-side
// purely to render Open Graph/Twitter meta tags for link-preview crawlers.
// contests/{id} is public-read once published (firestore.rules), so this
// reveals nothing a client couldn't already read - institution-scoped
// contests simply render the same "not found" fallback a crawler would get
// for any other invalid id, since this reads whatever's there without
// checking institutionId/status (those crawler-serving contexts were never
// meant to be shared publicly, so there's nothing extra to protect here -
// the id itself is the only thing a link ever carries).
@Service
public class ContestPreviewService {

    @Autowired(required = false)
    private Firestore db;

    private static final String DEFAULT_OG_IMAGE = "https://devert.in/logo.png";
    private static final String SITE_NAME = "DeVert.in";

    public String renderPreviewHtml(String contestId) {
        String safeId = HtmlUtils.htmlEscape(contestId == null ? "" : contestId);
        String canonicalUrl = "https://devert.in/contest/" + safeId;

        if (db == null) {
            return fallbackHtml(canonicalUrl, "Contest on DeVert", "Compete in a scheduled, ranked contest on DeVert Arena.");
        }

        try {
            DocumentSnapshot doc = db.collection("contests").document(contestId).get().get();
            if (!doc.exists()) {
                return fallbackHtml(canonicalUrl, "Contest not found | DeVert", "This contest may have ended or been removed.");
            }

            String title = HtmlUtils.htmlEscape(str(doc.getString("title"), "Contest"));
            String category = HtmlUtils.htmlEscape(str(doc.getString("category"), ""));
            String description = HtmlUtils.htmlEscape(str(doc.getString("description"), ""));
            String bannerUrl = HtmlUtils.htmlEscape(str(doc.getString("bannerUrl"), DEFAULT_OG_IMAGE));

            String fullTitle = title + " | " + SITE_NAME;
            String fullDescription = !description.isEmpty() ? description
                : !category.isEmpty() ? "A " + category + " contest on DeVert Arena."
                : "Compete in a scheduled, ranked contest on DeVert Arena.";

            return previewHtml(canonicalUrl, fullTitle, fullDescription, bannerUrl);
        } catch (Exception e) {
            return fallbackHtml(canonicalUrl, "Contest on DeVert", "Compete in a scheduled, ranked contest on DeVert Arena.");
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
