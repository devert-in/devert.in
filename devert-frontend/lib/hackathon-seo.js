// Shared build-time SEO helpers for the statically-generated per-hackathon
// route (app/h/[slug]/**). Runs only inside generateStaticParams/
// generateMetadata (server-only, executed once at `next build` -
// output: 'export' has no per-request server), reusing the exact same
// public client Firestore reads hackathons-app.jsx and sitemap.ts already
// rely on. No admin credentials, no new secrets. Mirrors the shape of
// devert-campus/lib/campus-seo.js, the same pattern already proven for
// institution pages there.
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, orderBy, query } from "firebase/firestore";

const SITE = "https://devert.in";

// Same query hackathons-app.jsx's listing view already runs - doc ID is the
// slug (see scripts/upsert-devertathon26.mjs's db.doc(`hackathons/${SLUG}`)).
export async function hackathonStaticParams() {
  const snap = await getDocs(query(collection(db, "hackathons"), orderBy("createdAt", "desc"))).catch(() => null);
  if (!snap) return [];
  return snap.docs.map((d) => ({ slug: d.id }));
}

// Returns null (not a throw) for an unknown/removed slug so the page
// component can call notFound() instead of failing the whole build - same
// convention as campusInstitutionForSlug.
export async function hackathonForSlug(slug) {
  const snap = await getDoc(doc(db, "hackathons", slug)).catch(() => null);
  return snap?.exists() ? { id: snap.id, ...snap.data() } : null;
}

function trimmedDescription(hackathon) {
  const source = hackathon.tagline?.trim() || hackathon.description?.trim() || "";
  return source.length > 160 ? `${source.slice(0, 157)}...` : source;
}

export function buildHackathonMetadata(hackathon, slug) {
  const url = `${SITE}/h/${slug}`;
  const title = hackathon.title;
  const description = trimmedDescription(hackathon);
  const image = hackathon.bannerImage || `${SITE}/og-image.png`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title, description, url,
      siteName: "DeVert",
      type: "website",
      images: [{ url: image, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title, description,
      images: [image],
    },
    robots: { index: true, follow: true },
  };
}

const ATTENDANCE_MODE = {
  in_person: "https://schema.org/OfflineEventAttendanceMode",
  virtual: "https://schema.org/OnlineEventAttendanceMode",
  hybrid: "https://schema.org/MixedEventAttendanceMode",
};

// Best-effort parse of a free-text fee string (e.g. "₹950 / team") into a
// clean Offer - only emitted when both a currency symbol and a number are
// found, never a guessed/rounded value. A fee that doesn't parse (a
// different event writes "Free" or "Contact organizer") just means no
// `offers` object, not a malformed one.
function parseOffer(hackathon, url) {
  const fee = hackathon.registrationFee?.trim();
  if (!fee) return null;
  const amountMatch = fee.match(/[\d,]+(\.\d+)?/);
  if (!amountMatch) return null;
  const price = amountMatch[0].replace(/,/g, "");
  const priceCurrency = fee.includes("₹") ? "INR" : fee.includes("$") ? "USD" : fee.includes("€") ? "EUR" : null;
  if (!priceCurrency) return null;
  return { "@type": "Offer", price, priceCurrency, url, availability: "https://schema.org/InStock" };
}

// Real, non-fabricated schema.org objects built only from fields that
// actually exist on the doc (cross-referenced against
// scripts/upsert-devertathon26.mjs). startDate/endDate are omitted rather
// than guessed when registrationOpen/submissionDeadline etc. are null (true
// for devertathon26 today - eventDateLabel stays plain text in the
// description, same reasoning as that script's own comment on those fields).
export function hackathonJsonLd(hackathon, slug) {
  const url = `${SITE}/h/${slug}`;
  const startDate = hackathon.registrationOpen?.toDate?.()?.toISOString();
  const endDate = hackathon.submissionDeadline?.toDate?.()?.toISOString() || hackathon.resultsDate?.toDate?.()?.toISOString();
  const offer = parseOffer(hackathon, url);

  const event = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: hackathon.title,
    description: hackathon.description || hackathon.tagline || "",
    url,
    eventStatus: "https://schema.org/EventScheduled",
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
    ...(hackathon.mode && ATTENDANCE_MODE[hackathon.mode] ? { eventAttendanceMode: ATTENDANCE_MODE[hackathon.mode] } : {}),
    ...(hackathon.venue ? { location: { "@type": "Place", name: hackathon.venue } } : {}),
    ...(hackathon.bannerImage ? { image: [hackathon.bannerImage] } : {}),
    organizer: { "@type": "Organization", name: "DeVert", url: SITE },
    ...(offer ? { offers: offer } : {}),
  };

  const breadcrumbList = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: "Events", item: `${SITE}/events` },
      { "@type": "ListItem", position: 3, name: hackathon.title, item: url },
    ],
  };

  const jsonLd = [event, breadcrumbList];

  // Only when the exact same Q&A content is already visible on the page
  // (FaqRow, hackathon-detail-view.jsx) - never hidden crawler-only content.
  if (hackathon.faq?.length > 0) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: hackathon.faq.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    });
  }

  return jsonLd;
}
