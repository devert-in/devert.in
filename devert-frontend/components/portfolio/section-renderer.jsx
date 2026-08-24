"use client";

import TechStackSection from "./tech-stack-section";
import ProjectsSection from "./projects-section";
import ExperienceSection from "./experience-section";
import EducationSection from "./education-section";
import CertificationsSection from "./certifications-section";
import AchievementsSection from "./achievements-section";
import PulseSection from "./pulse-section";
import TimelineSection from "./timeline-section";
import ContactSection from "./contact-section";

// section-key -> component, driven by lib/portfolio-sections.js's
// effectiveSections(). Every key in ALL_SECTION_KEYS must have an entry here.
export function renderSection(key, data) {
  switch (key) {
    case "techstack":      return <TechStackSection key={key} skills={data.profile.skills} />;
    case "projects":       return <ProjectsSection key={key} projects={data.projects} />;
    case "experience":     return <ExperienceSection key={key} experience={data.profile.experience} />;
    case "education":      return <EducationSection key={key} education={data.profile.education} />;
    case "certifications": return <CertificationsSection key={key} certifications={data.profile.certifications} />;
    case "achievements":   return <AchievementsSection key={key} achievements={data.profile.achievements} />;
    case "pulse":          return <PulseSection key={key} posts={data.pulsePosts} />;
    case "timeline":
      return (
        <TimelineSection
          key={key}
          projects={data.projects}
          certifications={data.profile.certifications}
          achievements={data.profile.achievements}
          experience={data.profile.experience}
          education={data.profile.education}
        />
      );
    case "contact":        return <ContactSection key={key} profile={data.profile} onShare={data.onShare} />;
    default:               return null;
  }
}
