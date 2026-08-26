import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

// Display content for the /ranks ladder (color, requirement blurb, perks).
// The XP thresholds that actually assign a user's tier live separately in
// AuthContext.getTier() and are NOT driven by this config, so admin edits
// here only change what's shown, never who qualifies for what.
export const DEFAULT_TIERS = [
  { tier: "LEGEND",    color: "#FFD700", req: "Invited only",      xp: "10,000+", locked: true,
    perks: ["Lifetime access", "Direct duo mentorship", "Custom badge", "Featured on homepage"] },
  { tier: "ELITE",     color: "#FF6B35", req: "Top 10% in Arena",  xp: "5,000+",  locked: true,
    perks: ["Priority mission slots", "Profile badge", "Early access to features", "XP 2x multiplier"] },
  { tier: "ARCHITECT", color: "#00FFFF", req: "Win 1 Mission",     xp: "2,000+",  locked: false,
    perks: ["Mentor badge", "Private channels", "Mission creation rights", "Resume review"] },
  { tier: "BUILDER",   color: "#00FF41", req: "Ship 1 project",    xp: "500+",    locked: false,
    perks: ["Full platform access", "Shipyard rights", "Arena access", "Intel feed"] },
  { tier: "RECRUIT",   color: "#666",    req: "Join the platform", xp: "0",       locked: false,
    perks: ["Grind access (1/day)", "Read-only Intel", "Mission browsing"] },
];

export async function loadTierLadder() {
  try {
    const snap = await getDoc(doc(db, "system", "ranks"));
    const tiers = snap.exists() ? snap.data().tiers : null;
    return Array.isArray(tiers) && tiers.length ? tiers : DEFAULT_TIERS;
  } catch (err) {
    console.error(err);
    return DEFAULT_TIERS;
  }
}
