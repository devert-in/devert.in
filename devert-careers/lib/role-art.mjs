// Hand-made art for individual roles, keyed by slug (the job_openings doc id).
//
//   art   the illustration the on-page banner shows on its right side
//         (components/role-banner.jsx) - no text in it, the banner sets its
//         own text live
//   card  a finished 1200x630 link-preview image; when present it replaces
//         the card scripts/role-images.mjs would otherwise draw
//
// Files live in public/roles/. A role with no entry still gets a drawn card
// and the plain banner, so this map is optional polish, never a requirement.
export const ROLE_ART = {
  "devert-campus-leader": {
    art: "/roles/devert-campus-leader-art.jpg",
    card: "/roles/devert-campus-leader-card.jpg",
  },
};
