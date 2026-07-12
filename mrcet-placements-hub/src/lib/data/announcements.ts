export interface Announcement {
  id: string;
  date: string;
  message: string;
}

export const announcements: Announcement[] = [
  {
    id: "ann-1",
    date: "18 Jul 2026",
    message: "Amazon Pre-Placement Talk scheduled in Seminar Hall 2 for CSE & IT final years.",
  },
  {
    id: "ann-2",
    date: "22 Jul 2026",
    message: "TCS Ninja & Digital combined registration deadline — update your resume on the portal.",
  },
  {
    id: "ann-3",
    date: "28 Jul 2026",
    message: "EPAM Systems on-campus coding round for pre-registered CSE-AI&ML students.",
  },
  {
    id: "ann-4",
    date: "02 Aug 2026",
    message: "Resume Building & LinkedIn Optimization workshop by the Training & Placement Cell.",
  },
  {
    id: "ann-5",
    date: "09 Aug 2026",
    message: "Salesforce Associate Software Engineer drive — shortlist announcement and mock interview slots.",
  },
];
