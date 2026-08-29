export interface RecruitmentStep {
  title: string;
  description: string;
}

export interface CompanyHireRecord {
  year: string;
  hires: number;
}

export interface Company {
  slug: string;
  name: string;
  initials: string;
  colorFrom: string;
  colorTo: string;
  sector: string;
  type: "Product" | "Service";
  website: string;
  overview: string;
  eligibility: {
    minCgpa: number;
    backlogsAllowed: boolean;
    eligibleBranches: string[];
  };
  historicalHires: CompanyHireRecord[];
  recruitmentPattern: RecruitmentStep[];
}

export const companies: Company[] = [
  {
    slug: "amazon",
    name: "Amazon",
    initials: "AMZ",
    colorFrom: "#0F2C59",
    colorTo: "#1B3C73",
    sector: "E-commerce & Cloud Computing",
    type: "Product",
    website: "https://www.amazon.jobs",
    overview:
      "Amazon recruits from MRCET for SDE-1 and Operations Leadership roles, hiring across CSE, CSE-AI&ML, IT, and ECE. Known for its bar-raiser interview philosophy and strong emphasis on Leadership Principles alongside deep technical rigor.",
    eligibility: {
      minCgpa: 7.0,
      backlogsAllowed: false,
      eligibleBranches: ["CSE", "CSE-AI&ML", "CSE-DS", "IT", "ECE"],
    },
    historicalHires: [
      { year: "2021-22", hires: 6 },
      { year: "2022-23", hires: 9 },
      { year: "2023-24", hires: 12 },
      { year: "2024-25", hires: 15 },
      { year: "2025-26", hires: 18 },
    ],
    recruitmentPattern: [
      { title: "Online Assessment", description: "Two coding problems on data structures and algorithms plus a work-simulation module, proctored, 90 minutes." },
      { title: "Technical Interview 1", description: "Deep dive into DSA, problem-solving on a shared doc, and one Leadership Principle behavioral question." },
      { title: "Technical Interview 2", description: "System design fundamentals for freshers (low-level design), OOP concepts, and a second coding problem." },
      { title: "Bar Raiser Round", description: "Cross-functional senior interviewer assessing Leadership Principles fit and overall consistency across rounds." },
      { title: "HR Discussion", description: "Compensation, relocation preferences, and offer rollout discussion." },
    ],
  },
  {
    slug: "tcs",
    name: "TCS",
    initials: "TCS",
    colorFrom: "#0F2C59",
    colorTo: "#274A86",
    sector: "IT Services & Consulting",
    type: "Service",
    website: "https://www.tcs.com/careers",
    overview:
      "Tata Consultancy Services is MRCET's largest mass recruiter, hiring under the TCS Ninja (entry-level) and TCS Digital (premium) tracks across nearly every branch on campus. TCS Digital pays significantly higher and targets students with strong CS fundamentals.",
    eligibility: {
      minCgpa: 6.0,
      backlogsAllowed: true,
      eligibleBranches: ["CSE", "CSE-AI&ML", "CSE-DS", "ECE", "IT", "MECH", "AERO"],
    },
    historicalHires: [
      { year: "2021-22", hires: 140 },
      { year: "2022-23", hires: 165 },
      { year: "2023-24", hires: 190 },
      { year: "2024-25", hires: 210 },
      { year: "2025-26", hires: 230 },
    ],
    recruitmentPattern: [
      { title: "TCS NQT (National Qualifier Test)", description: "Quantitative aptitude, verbal ability, reasoning, and a coding section covering basic programming." },
      { title: "Technical Interview", description: "Fundamentals of programming languages, DBMS, OOPs concepts, and academic project discussion." },
      { title: "Managerial Round", description: "Puzzle-solving, teamwork scenarios, and willingness to relocate/rotational shifts." },
      { title: "HR Interview", description: "Background verification, career aspirations, and offer letter formalities." },
    ],
  },
  {
    slug: "cognizant",
    name: "Cognizant",
    initials: "CTS",
    colorFrom: "#0F2C59",
    colorTo: "#1B3C73",
    sector: "IT Services & Consulting",
    type: "Service",
    website: "https://careers.cognizant.com",
    overview:
      "Cognizant's GenC (Genesis of Cognizant) program is a major recruiter at MRCET, offering roles in application development and digital engineering with structured onboarding training academies.",
    eligibility: {
      minCgpa: 6.0,
      backlogsAllowed: true,
      eligibleBranches: ["CSE", "CSE-AI&ML", "CSE-DS", "ECE", "IT"],
    },
    historicalHires: [
      { year: "2021-22", hires: 80 },
      { year: "2022-23", hires: 95 },
      { year: "2023-24", hires: 88 },
      { year: "2024-25", hires: 110 },
      { year: "2025-26", hires: 120 },
    ],
    recruitmentPattern: [
      { title: "Cognizant Aptitude Test (AMCAT-based)", description: "Quantitative, logical reasoning, verbal, and automata coding round." },
      { title: "Technical + HR Combined Interview", description: "Core CS fundamentals, a live coding exercise, and cultural-fit HR questions in a single panel round." },
    ],
  },
  {
    slug: "capgemini",
    name: "Capgemini",
    initials: "CAP",
    colorFrom: "#0F2C59",
    colorTo: "#1B3C73",
    sector: "IT Consulting & Engineering",
    type: "Service",
    website: "https://www.capgemini.com/careers",
    overview:
      "Capgemini hires for its Analyst and Associate Software Engineer roles under the Pool Campus and Smart Hiring drives, with a well-known focus on the pseudo-code test format.",
    eligibility: {
      minCgpa: 6.0,
      backlogsAllowed: true,
      eligibleBranches: ["CSE", "CSE-AI&ML", "CSE-DS", "ECE", "IT", "MECH"],
    },
    historicalHires: [
      { year: "2021-22", hires: 55 },
      { year: "2022-23", hires: 60 },
      { year: "2023-24", hires: 70 },
      { year: "2024-25", hires: 78 },
      { year: "2025-26", hires: 85 },
    ],
    recruitmentPattern: [
      { title: "Games-Based Assessment", description: "Cognitive ability games measuring numerical, logical, and attention-based reasoning." },
      { title: "Pseudo-Code Test", description: "Pseudocode-based logic building and English comprehension section." },
      { title: "Technical Interview", description: "OOP concepts, SDLC basics, and a walkthrough of academic projects." },
      { title: "HR Interview", description: "Communication assessment and offer discussion." },
    ],
  },
  {
    slug: "accenture",
    name: "Accenture",
    initials: "ACN",
    colorFrom: "#0F2C59",
    colorTo: "#1B3C73",
    sector: "IT Consulting & Technology Services",
    type: "Service",
    website: "https://www.accenture.com/careers",
    overview:
      "Accenture recruits under Associate Software Engineer (ASE) and Digital Engineer profiles, running one of the highest-volume drives at MRCET each year with cognitive and technical assessments.",
    eligibility: {
      minCgpa: 6.5,
      backlogsAllowed: true,
      eligibleBranches: ["CSE", "CSE-AI&ML", "CSE-DS", "ECE", "IT", "MECH", "AERO"],
    },
    historicalHires: [
      { year: "2021-22", hires: 90 },
      { year: "2022-23", hires: 105 },
      { year: "2023-24", hires: 100 },
      { year: "2024-25", hires: 118 },
      { year: "2025-26", hires: 130 },
    ],
    recruitmentPattern: [
      { title: "Cognitive & Technical Assessment", description: "Verbal, reasoning, numerical ability sections followed by a coding assessment." },
      { title: "Communication Assessment (Versant)", description: "Automated spoken-English evaluation for clarity and fluency." },
      { title: "Technical Interview", description: "Programming fundamentals, database queries, and project deep-dive." },
      { title: "HR Interview", description: "Flexibility on location/shifts and career motivation discussion." },
    ],
  },
  {
    slug: "deloitte",
    name: "Deloitte",
    initials: "DEL",
    colorFrom: "#0F2C59",
    colorTo: "#1B3C73",
    sector: "Professional Services & Consulting",
    type: "Service",
    website: "https://www2.deloitte.com/careers",
    overview:
      "Deloitte USI hires Analysts for its technology and consulting divisions, with a rigorous multi-round process that places heavy weight on case-based reasoning and structured group discussions.",
    eligibility: {
      minCgpa: 7.0,
      backlogsAllowed: false,
      eligibleBranches: ["CSE", "CSE-AI&ML", "CSE-DS", "IT", "ECE"],
    },
    historicalHires: [
      { year: "2021-22", hires: 18 },
      { year: "2022-23", hires: 22 },
      { year: "2023-24", hires: 26 },
      { year: "2024-25", hires: 30 },
      { year: "2025-26", hires: 34 },
    ],
    recruitmentPattern: [
      { title: "Online Assessment", description: "Quant, logical reasoning, and a case-study comprehension section." },
      { title: "Group Discussion", description: "Business/technology topic discussed in groups of 8-10, evaluated on clarity and collaboration." },
      { title: "Technical Interview", description: "CS fundamentals, SQL queries, and resume-based project questioning." },
      { title: "HR / Partner Interview", description: "Final round with a senior partner focused on values and long-term fit." },
    ],
  },
  {
    slug: "epam",
    name: "EPAM Systems",
    initials: "EPM",
    colorFrom: "#0F2C59",
    colorTo: "#1B3C73",
    sector: "Software Engineering & Digital Platforms",
    type: "Product",
    website: "https://www.epam.com/careers",
    overview:
      "EPAM Systems runs a highly technical hiring bar for its Junior Software Engineer program, with strong emphasis on core programming, OOP design, and problem-solving depth over rote memorization.",
    eligibility: {
      minCgpa: 7.5,
      backlogsAllowed: false,
      eligibleBranches: ["CSE", "CSE-AI&ML", "CSE-DS", "IT"],
    },
    historicalHires: [
      { year: "2021-22", hires: 8 },
      { year: "2022-23", hires: 10 },
      { year: "2023-24", hires: 14 },
      { year: "2024-25", hires: 16 },
      { year: "2025-26", hires: 20 },
    ],
    recruitmentPattern: [
      { title: "Online Coding Test", description: "Two DSA problems of medium difficulty plus an OOP design question." },
      { title: "Technical Interview 1", description: "Core Java/Python fundamentals, data structures, and complexity analysis." },
      { title: "Technical Interview 2", description: "System design basics, database design, and hands-on whiteboard coding." },
      { title: "HR Interview", description: "Culture fit, English communication, and relocation discussion." },
    ],
  },
  {
    slug: "salesforce",
    name: "Salesforce",
    initials: "SFC",
    colorFrom: "#0F2C59",
    colorTo: "#1B3C73",
    sector: "Cloud Software & CRM",
    type: "Product",
    website: "https://www.salesforce.com/company/careers",
    overview:
      "Salesforce hires a small, highly selective cohort for its Associate Software Engineer program, valuing strong CS fundamentals, coding fluency, and Trailhead-style continuous learning mindset.",
    eligibility: {
      minCgpa: 8.0,
      backlogsAllowed: false,
      eligibleBranches: ["CSE", "CSE-AI&ML", "CSE-DS", "IT"],
    },
    historicalHires: [
      { year: "2021-22", hires: 3 },
      { year: "2022-23", hires: 4 },
      { year: "2023-24", hires: 5 },
      { year: "2024-25", hires: 6 },
      { year: "2025-26", hires: 7 },
    ],
    recruitmentPattern: [
      { title: "Online Assessment", description: "DSA-focused coding round with two problems on arrays/strings and trees/graphs." },
      { title: "Technical Interview 1", description: "Live coding on data structures with follow-up complexity optimization discussion." },
      { title: "Technical Interview 2", description: "OOP design, database fundamentals, and a short take on cloud computing concepts." },
      { title: "Hiring Manager Round", description: "Behavioral interview centered on Salesforce's Ohana culture and growth mindset." },
    ],
  },
  {
    slug: "teksystems",
    name: "TekSystems",
    initials: "TEK",
    colorFrom: "#0F2C59",
    colorTo: "#1B3C73",
    sector: "IT Staffing & Consulting Services",
    type: "Service",
    website: "https://www.teksystems.com/careers",
    overview:
      "TekSystems places graduate engineers into client-facing IT consulting engagements, with an emphasis on adaptability, communication skills, and foundational programming ability.",
    eligibility: {
      minCgpa: 6.0,
      backlogsAllowed: true,
      eligibleBranches: ["CSE", "CSE-AI&ML", "ECE", "IT", "MECH"],
    },
    historicalHires: [
      { year: "2021-22", hires: 20 },
      { year: "2022-23", hires: 24 },
      { year: "2023-24", hires: 22 },
      { year: "2024-25", hires: 28 },
      { year: "2025-26", hires: 32 },
    ],
    recruitmentPattern: [
      { title: "Aptitude & English Assessment", description: "Quantitative reasoning combined with a business-English comprehension test." },
      { title: "Technical Interview", description: "Programming basics, SDLC awareness, and a client-scenario problem-solving discussion." },
      { title: "HR Interview", description: "Consulting mindset, adaptability to client environments, and offer discussion." },
    ],
  },
];

export function getCompanyBySlug(slug: string): Company | undefined {
  return companies.find((company) => company.slug === slug);
}
