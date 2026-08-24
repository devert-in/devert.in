"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Shield, Mail, AlertCircle } from "lucide-react";

const EFFECTIVE_DATE = "June 23, 2026";

const SECTIONS = [
  {
    id: "overview",
    title: "01. Overview",
    content: `DeVert ("we", "our", "us") operates devert.in - a developer platform for building, shipping, and competing. This Privacy Policy explains what data we collect, why we collect it, how we store it, and your rights over it. By using DeVert, you agree to the practices described here. If you disagree, please do not use the platform.`,
  },
  {
    id: "data-collected",
    title: "02. Data We Collect",
    items: [
      { label: "Google Account Data", desc: "When you sign in with Google, we receive your name, email address, and profile photo. We do not receive your Google password." },
      { label: "Platform Activity", desc: "XP points, tier level, arena match history, grind log entries, missions progress, shipped projects, and streak data generated through your use of the platform." },
      { label: "Usage Data", desc: "Pages visited, features used, and session metadata. This is used to improve the platform and is not sold to third parties." },
      { label: "User-Provided Data", desc: "Any bio, skills, or profile information you manually add to your Dev Card." },
    ],
  },
  {
    id: "how-we-use",
    title: "03. How We Use Your Data",
    items: [
      { label: "Authentication", desc: "To verify your identity and maintain your session securely." },
      { label: "Platform Features", desc: "To power your Dev Card, leaderboard ranking, arena matches, missions, and grind log." },
      { label: "Communication", desc: "To notify you about platform updates, new features, or policy changes. You can opt out of non-essential communications." },
      { label: "Analytics", desc: "To understand how the platform is used and improve it. Analytics data is aggregated and anonymized where possible." },
    ],
  },
  {
    id: "data-storage",
    title: "04. Data Storage & Security",
    content: `Your data is stored in Google Firebase (Firestore database and Firebase Authentication), hosted on Google Cloud infrastructure with servers in the asia-south1 region (Mumbai, India). We implement industry-standard security measures including:\n\n• Role-based Firestore security rules - you can only read/write your own data\n• HTTPS-only transmission (TLS 1.3)\n• No passwords stored - authentication is delegated entirely to Google OAuth\n\nNo system is 100% secure. In the event of a data breach that affects your personal data, we will notify you within 72 hours.`,
  },
  {
    id: "third-parties",
    title: "05. Third-Party Services",
    items: [
      { label: "Google Firebase", desc: "Authentication, database (Firestore), and file storage. Subject to Google's Privacy Policy." },
      { label: "Firebase Hosting", desc: "Hosts the devert.in website. Subject to Google's Terms of Service." },
      { label: "Google Analytics", desc: "Used for usage analytics. You can opt out via browser settings or ad blockers." },
    ],
  },
  {
    id: "data-retention",
    title: "06. Data Retention",
    content: `We retain your data for as long as your account is active. If you request account deletion, we will delete your personal data within 30 days, except where retention is required by law. Platform activity data (arena matches, leaderboard history) may be retained in anonymized/aggregated form after account deletion.`,
  },
  {
    id: "your-rights",
    title: "07. Your Rights",
    items: [
      { label: "Access", desc: "Request a copy of all personal data we hold about you." },
      { label: "Correction", desc: "Update or correct inaccurate data via your Dev Card settings." },
      { label: "Deletion", desc: "Request complete deletion of your account and associated data." },
      { label: "Portability", desc: "Request your data in a machine-readable format." },
      { label: "Objection", desc: "Object to processing of your data for analytics or marketing purposes." },
    ],
  },
  {
    id: "cookies",
    title: "08. Cookies",
    content: `We use essential cookies for authentication session management (Firebase Auth tokens). We do not use advertising cookies or sell cookie data to third parties. You can disable non-essential cookies via your browser settings, though this may affect platform functionality.`,
  },
  {
    id: "children",
    title: "09. Children's Privacy",
    content: `DeVert is not intended for users under the age of 13. We do not knowingly collect personal data from children under 13. If you believe a child has provided us with personal data, contact our Grievance Officer immediately.`,
  },
  {
    id: "changes",
    title: "10. Changes to This Policy",
    content: `We may update this Privacy Policy from time to time. Significant changes will be notified via the platform or email. Continued use of DeVert after changes constitutes acceptance of the updated policy. The effective date at the top of this page reflects the most recent revision.`,
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen pt-10 pb-32 px-6 relative">
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />

      <div className="relative max-w-3xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <p className="font-mono text-xs text-neon-green/55 mb-3 tracking-wider">// /privacy - legal.policy</p>
          <h1 className="font-sans font-bold tracking-tighter text-white leading-none mb-3" style={{ fontSize: "clamp(2.5rem,7vw,4.5rem)" }}>
            PRIVACY <span className="text-neon-cyan">POLICY</span>
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-xs text-white/35">Effective: {EFFECTIVE_DATE}</span>
            <span className="font-mono text-xs text-white/15">·</span>
            <span className="font-mono text-xs text-white/35">Governing Law: India (IT Act 2000)</span>
          </div>
        </motion.div>

        {/* Grievance Officer Banner */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="terminal-window mb-8 border-neon-green/20"
          style={{ borderColor: "rgba(0,255,65,0.2)" }}
        >
          <div className="p-5 flex items-start gap-4">
            <Shield size={18} className="text-neon-green flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-mono text-xs text-neon-green mb-1 font-bold tracking-wider">GRIEVANCE OFFICER (IT Rules 2021)</p>
              <p className="font-mono text-xs text-white/50 mb-2">
                As required under Rule 3(1)(c) of the IT (Intermediary Guidelines) Rules 2021, we have appointed a Grievance Officer.
              </p>
              <p className="font-mono text-xs text-white/65">Name: <span className="text-white/85">Samuel Prasad</span></p>
              <p className="font-mono text-xs text-white/65">Email: <a href="mailto:devert.contact@gmail.com" className="text-neon-cyan hover:underline">devert.contact@gmail.com</a></p>
              <p className="font-mono text-xs text-white/65">Platform: <span className="text-white/85">devert.in</span></p>
              <p className="font-mono text-xs text-white/40 mt-2">Response time: within 24 hours · Resolution: within 15 days</p>
            </div>
          </div>
        </motion.div>

        {/* Sections */}
        <div className="space-y-6">
          {SECTIONS.map((section, i) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.04 }}
              className="terminal-window"
            >
              <div className="terminal-header">
                <div className="terminal-dot bg-red-500/70" />
                <div className="terminal-dot bg-yellow-500/70" />
                <div className="terminal-dot bg-green-500/70" />
                <span className="font-mono text-[10px] text-white/25 ml-2">{section.id}.md</span>
              </div>
              <div className="p-5">
                <h2 className="font-mono text-sm text-neon-cyan font-bold mb-3">{section.title}</h2>
                {section.content && (
                  <p className="font-mono text-xs text-white/50 leading-relaxed whitespace-pre-line">{section.content}</p>
                )}
                {section.items && (
                  <div className="space-y-3">
                    {section.items.map((item, j) => (
                      <div key={j} className="border-l-2 border-neon-green/20 pl-3">
                        <p className="font-mono text-xs text-white/75 font-bold mb-0.5">{item.label}</p>
                        <p className="font-mono text-xs text-white/45 leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Contact */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="mt-8 terminal-window"
        >
          <div className="p-5 flex items-center gap-4">
            <Mail size={16} className="text-white/30 flex-shrink-0" />
            <div>
              <p className="font-mono text-xs text-white/50 leading-relaxed">
                Questions about this policy? Contact us at{" "}
                <a href="mailto:devert.contact@gmail.com" className="text-neon-cyan hover:underline">devert.contact@gmail.com</a>
                {" "}or read our{" "}
                <Link href="/terms" className="text-neon-cyan hover:underline">Terms of Service</Link>.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
