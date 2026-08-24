import admin from "firebase-admin";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(path.join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function main() {
  await db.collection("opportunities").doc("gfg-mongodb-campus-mantri-level-2").set({
    title: "GeeksforGeeks x MongoDB Campus Mantri - Level 2",
    organizationName: "GeeksforGeeks",
    type: "Free Certification",
    shortDescription: "Continue your Campus Mantri journey by learning MongoDB through a structured set of free courses and earning certificates while building industry-relevant database skills.",
    detailedDescription: "Continue your Campus Mantri journey by learning MongoDB through a structured set of free courses and earning certificates while building industry-relevant database skills.",
    organizationLogoUrl: "",
    bannerUrl: "",
    registrationUrl: "https://gfgcdn.com/tu/10jJ/",
    officialWebsite: "",
    sourceUrl: "",
    eligibility: {},
    details: { certificate: true },
    tags: ["MongoDB", "Database", "Backend", "Certification", "Campus Mantri", "Free Course"],
    featured: true,
    status: "published",
    publishedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    views: 0, applyClicks: 0, saveCount: 0, shareCount: 0,
  }, { merge: true });
  console.log("Seeded: GeeksforGeeks x MongoDB Campus Mantri - Level 2");
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
