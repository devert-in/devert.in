"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { FileText, AlertTriangle } from "lucide-react";

const EFFECTIVE_DATE = "June 23, 2026";

const SECTIONS = [
  {
    id: "acceptance",
    title: "01. Acceptance of Terms",
    content: `By accessing or using DeVert ("the Platform", "devert.in"), you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, do not use the platform.\n\nThese Terms constitute a legally binding agreement between you and DeVert, governed by the laws of India including the Information Technology Act, 2000 and its amendments.`,
  },
  {
    id: "eligibility",
    title: "02. Eligibility",
    content: `You must be at least 13 years of age to use DeVert. By using the platform, you represent that:\n\n• You are at least 13 years old\n• You have the legal capacity to enter into these Terms\n• You are not prohibited from using the platform under applicable laws\n• Your use will comply with all applicable laws and regulations`,
  },
  {
    id: "account",
    title: "03. Your Account",
    items: [
      { label: "Registration", desc: "You register using Google OAuth. You are responsible for all activity that occurs under your account." },
      { label: "Accuracy", desc: "You agree to provide accurate information. Impersonation or misrepresentation will result in immediate account termination." },
      { label: "Security", desc: "Notify us immediately at devert.contact@gmail.com if you suspect unauthorized access to your account." },
      { label: "One Account", desc: "Each person may maintain only one account. Duplicate accounts may be removed without notice." },
    ],
  },
  {
    id: "conduct",
    title: "04. Acceptable Use",
    content: `You agree NOT to:\n\n• Upload, post, or share content that is illegal, harmful, threatening, abusive, harassing, defamatory, or obscene\n• Cheat, manipulate, or exploit bugs in arena matches or leaderboard rankings\n• Attempt to gain unauthorized access to other users' accounts or platform systems\n• Use bots, scrapers, or automated tools to interact with the platform without written permission\n• Reverse engineer, decompile, or attempt to extract source code from the platform\n• Use the platform to spam, phish, or distribute malware\n• Violate any applicable law or regulation`,
  },
  {
    id: "content",
    title: "05. User-Generated Content",
    content: `By submitting content (projects, comments, code, bio) to DeVert, you grant us a non-exclusive, royalty-free, worldwide license to display and distribute that content within the platform.\n\nYou retain ownership of your content. You are solely responsible for the content you post. We reserve the right to remove any content that violates these Terms without notice.\n\nDeVert does not claim ownership over your code, projects, or intellectual work.`,
  },
  {
    id: "ip",
    title: "06. Intellectual Property",
    content: `The DeVert name, logo, design system, and platform code are the intellectual property of DeVert and are protected under applicable IP laws.\n\nYou may not copy, reproduce, distribute, or create derivative works of the platform without express written permission.\n\nUser content remains the property of respective users. Platform content (missions, challenges, curriculum) is owned by DeVert.`,
  },
  {
    id: "arena",
    title: "07. Arena & Competitions",
    content: `DeVert arena matches and competitions are conducted fairly. By participating:\n\n• You agree to compete honestly without external assistance during timed challenges\n• Match results are final once recorded\n• DeVert reserves the right to disqualify users found cheating\n• XP and rankings earned through dishonest means may be revoked\n\nPrizes (if any) for competitions will be governed by separate competition-specific terms announced at the time.`,
  },
  {
    id: "termination",
    title: "08. Account Termination",
    content: `We reserve the right to suspend or terminate your account at any time for:\n\n• Violation of these Terms\n• Fraudulent or abusive behaviour\n• Extended inactivity (12+ months)\n\nYou may delete your account at any time from your Dev Card page. Upon deletion, your data will be removed within 30 days per our Privacy Policy.\n\nWe will not be liable for any loss resulting from account termination due to Terms violations.`,
  },
  {
    id: "disclaimer",
    title: "09. Disclaimer of Warranties",
    content: `DeVert is provided "as is" and "as available" without warranties of any kind, express or implied. We do not guarantee:\n\n• Uninterrupted or error-free operation\n• Accuracy or completeness of platform content\n• That the platform will meet your specific requirements\n\nUse of the platform is at your own risk.`,
  },
  {
    id: "liability",
    title: "10. Limitation of Liability",
    content: `To the maximum extent permitted by Indian law, DeVert shall not be liable for:\n\n• Indirect, incidental, or consequential damages\n• Loss of data, revenue, or profits\n• Damages resulting from unauthorized access to your account\n\nOur total liability for any claim arising from use of the platform shall not exceed ₹1,000 (Indian Rupees One Thousand).`,
  },
  {
    id: "governing-law",
    title: "11. Governing Law & Disputes",
    content: `These Terms are governed by the laws of India. Any disputes arising from these Terms or use of the platform shall be subject to the exclusive jurisdiction of courts in Hyderabad, Telangana, India.\n\nBefore initiating legal proceedings, you agree to first attempt resolution by contacting our Grievance Officer at devert.contact@gmail.com. We will respond within 24 hours and attempt resolution within 15 days.`,
  },
  {
    id: "changes",
    title: "12. Changes to Terms",
    content: `We may update these Terms at any time. Significant changes will be communicated via the platform or email at least 7 days before taking effect. Continued use of the platform after changes constitutes acceptance of the new Terms.\n\nThe effective date at the top of this page reflects the most recent revision.`,
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen pt-10 pb-32 px-6 relative">
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />

      <div className="relative max-w-3xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <p className="font-mono text-xs text-neon-green/55 mb-3 tracking-wider">// /terms - legal.tos</p>
          <h1 className="font-sans font-bold tracking-tighter text-white leading-none mb-3" style={{ fontSize: "clamp(2.5rem,7vw,4.5rem)" }}>
            TERMS OF <span className="text-neon-cyan">SERVICE</span>
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-xs text-white/35">Effective: {EFFECTIVE_DATE}</span>
            <span className="font-mono text-xs text-white/15">·</span>
            <span className="font-mono text-xs text-white/35">Jurisdiction: Hyderabad, India</span>
          </div>
        </motion.div>

        {/* TL;DR Banner */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="terminal-window mb-8"
          style={{ borderColor: "rgba(0,255,255,0.2)" }}
        >
          <div className="p-5 flex items-start gap-4">
            <AlertTriangle size={18} className="text-neon-cyan flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-mono text-xs text-neon-cyan mb-2 font-bold tracking-wider">TL;DR - THE SHORT VERSION</p>
              <div className="space-y-1">
                {[
                  "Build honestly. Don't cheat in the arena.",
                  "Don't be toxic or post harmful content.",
                  "Your code and projects are yours. We don't claim them.",
                  "We can terminate accounts that violate these terms.",
                  "Disputes go to Hyderabad courts under Indian law.",
                ].map((line, i) => (
                  <p key={i} className="font-mono text-xs text-white/50">
                    <span className="text-neon-green/60 mr-2">›</span>{line}
                  </p>
                ))}
              </div>
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
                      <div key={j} className="border-l-2 border-neon-cyan/20 pl-3">
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

        {/* Footer note */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
          className="mt-8 terminal-window"
        >
          <div className="p-5 flex items-center gap-4">
            <FileText size={16} className="text-white/30 flex-shrink-0" />
            <p className="font-mono text-xs text-white/50 leading-relaxed">
              Questions? Contact{" "}
              <a href="mailto:devert.contact@gmail.com" className="text-neon-cyan hover:underline">devert.contact@gmail.com</a>
              {" "}· Also read our{" "}
              <Link href="/privacy" className="text-neon-cyan hover:underline">Privacy Policy</Link>.
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
