export type Department = "CSE" | "CSE-AI&ML" | "CSE-DS" | "ECE" | "IT" | "MECH" | "AERO";
export type AcademicYear = "2021-22" | "2022-23" | "2023-24" | "2024-25" | "2025-26";
export type CompanyType = "Product" | "Service";

export interface PlacementRecord {
  id: string;
  studentName: string;
  department: Department;
  year: AcademicYear;
  company: string;
  role: string;
  ctc: number;
  type: CompanyType;
}

export const departments: Department[] = ["CSE", "CSE-AI&ML", "CSE-DS", "ECE", "IT", "MECH", "AERO"];
export const academicYears: AcademicYear[] = ["2021-22", "2022-23", "2023-24", "2024-25", "2025-26"];

export const placementRecords: PlacementRecord[] = [
  { id: "p1", studentName: "K. Sai Nikhil", department: "CSE", year: "2025-26", company: "Amazon", role: "SDE-1", ctc: 24, type: "Product" },
  { id: "p2", studentName: "M. Sindhu Reddy", department: "CSE-AI&ML", year: "2025-26", company: "Salesforce", role: "Associate Software Engineer", ctc: 24, type: "Product" },
  { id: "p3", studentName: "P. Rohit Varma", department: "IT", year: "2024-25", company: "Amazon", role: "SDE-1", ctc: 21, type: "Product" },
  { id: "p4", studentName: "T. Ananya Rao", department: "CSE-DS", year: "2024-25", company: "Salesforce", role: "Associate Software Engineer", ctc: 22, type: "Product" },
  { id: "p5", studentName: "B. Vikram Chary", department: "CSE", year: "2024-25", company: "EPAM Systems", role: "Junior Software Engineer", ctc: 16, type: "Product" },
  { id: "p6", studentName: "S. Divya Sri", department: "CSE-AI&ML", year: "2023-24", company: "Amazon", role: "SDE-1", ctc: 19, type: "Product" },
  { id: "p7", studentName: "G. Charan Teja", department: "IT", year: "2023-24", company: "EPAM Systems", role: "Junior Software Engineer", ctc: 15, type: "Product" },
  { id: "p8", studentName: "N. Harshita", department: "CSE", year: "2022-23", company: "Amazon", role: "SDE-1", ctc: 18, type: "Product" },
  { id: "p9", studentName: "A. Yashwanth", department: "CSE-DS", year: "2025-26", company: "EPAM Systems", role: "Junior Software Engineer", ctc: 17, type: "Product" },
  { id: "p10", studentName: "R. Pranathi", department: "CSE-AI&ML", year: "2025-26", company: "Amazon", role: "SDE-1", ctc: 20, type: "Product" },
  { id: "p11", studentName: "V. Sathwik Reddy", department: "CSE", year: "2025-26", company: "Deloitte", role: "Analyst", ctc: 9, type: "Service" },
  { id: "p12", studentName: "D. Meghana", department: "ECE", year: "2025-26", company: "Deloitte", role: "Analyst", ctc: 8.5, type: "Service" },
  { id: "p13", studentName: "K. Abhinav", department: "IT", year: "2024-25", company: "Deloitte", role: "Analyst", ctc: 8, type: "Service" },
  { id: "p14", studentName: "L. Sowmya", department: "CSE-DS", year: "2024-25", company: "TCS", role: "TCS Digital - Developer", ctc: 9, type: "Service" },
  { id: "p15", studentName: "C. Nikhilesh", department: "CSE", year: "2023-24", company: "TCS", role: "TCS Digital - Developer", ctc: 7, type: "Service" },
  { id: "p16", studentName: "P. Keerthana", department: "CSE-AI&ML", year: "2023-24", company: "Accenture", role: "Digital Engineer", ctc: 6.5, type: "Service" },
  { id: "p17", studentName: "J. Rakesh", department: "ECE", year: "2022-23", company: "Accenture", role: "Associate Software Engineer", ctc: 4.5, type: "Service" },
  { id: "p18", studentName: "M. Bhargavi", department: "IT", year: "2022-23", company: "Accenture", role: "Digital Engineer", ctc: 6, type: "Service" },
  { id: "p19", studentName: "S. Uday Kiran", department: "CSE", year: "2021-22", company: "Accenture", role: "Associate Software Engineer", ctc: 4.25, type: "Service" },
  { id: "p20", studentName: "V. Lakshmi Priya", department: "CSE-DS", year: "2021-22", company: "Cognizant", role: "GenC", ctc: 4, type: "Service" },
  { id: "p21", studentName: "K. Manikanta", department: "MECH", year: "2021-22", company: "TCS", role: "TCS Ninja", ctc: 3.6, type: "Service" },
  { id: "p22", studentName: "A. Sruthi", department: "CSE", year: "2022-23", company: "Cognizant", role: "GenC Pro", ctc: 6.5, type: "Service" },
  { id: "p23", studentName: "B. Naveen Kumar", department: "AERO", year: "2022-23", company: "TCS", role: "TCS Ninja", ctc: 3.6, type: "Service" },
  { id: "p24", studentName: "T. Swathi", department: "IT", year: "2023-24", company: "Cognizant", role: "GenC", ctc: 4.5, type: "Service" },
  { id: "p25", studentName: "R. Deepak Reddy", department: "CSE-AI&ML", year: "2023-24", company: "Cognizant", role: "GenC Pro", ctc: 7, type: "Service" },
  { id: "p26", studentName: "N. Alekhya", department: "CSE-DS", year: "2024-25", company: "Cognizant", role: "GenC", ctc: 4.5, type: "Service" },
  { id: "p27", studentName: "G. Praveen", department: "ECE", year: "2024-25", company: "TekSystems", role: "Associate Consultant", ctc: 5, type: "Service" },
  { id: "p28", studentName: "S. Manasa", department: "MECH", year: "2025-26", company: "TekSystems", role: "Associate Consultant", ctc: 5.5, type: "Service" },
  { id: "p29", studentName: "K. Rahul Yadav", department: "CSE", year: "2025-26", company: "TekSystems", role: "Associate Consultant", ctc: 6, type: "Service" },
  { id: "p30", studentName: "D. Anusha", department: "IT", year: "2025-26", company: "Capgemini", role: "Analyst", ctc: 5, type: "Service" },
  { id: "p31", studentName: "M. Vamsi Krishna", department: "CSE-AI&ML", year: "2024-25", company: "Capgemini", role: "Associate Software Engineer", ctc: 4.5, type: "Service" },
  { id: "p32", studentName: "P. Tejaswini", department: "CSE-DS", year: "2023-24", company: "Capgemini", role: "Analyst", ctc: 4.25, type: "Service" },
  { id: "p33", studentName: "V. Srikanth", department: "ECE", year: "2022-23", company: "Capgemini", role: "Associate Software Engineer", ctc: 4.5, type: "Service" },
  { id: "p34", studentName: "A. Nikitha", department: "CSE", year: "2021-22", company: "Capgemini", role: "Analyst", ctc: 4.25, type: "Service" },
  { id: "p35", studentName: "R. Chaitanya", department: "IT", year: "2021-22", company: "TCS", role: "TCS Ninja", ctc: 3.36, type: "Service" },
  { id: "p36", studentName: "S. Harika", department: "CSE-AI&ML", year: "2022-23", company: "Accenture", role: "Digital Engineer", ctc: 6.5, type: "Service" },
  { id: "p37", studentName: "K. Bhanu Teja", department: "CSE", year: "2023-24", company: "Amazon", role: "SDE-1", ctc: 19, type: "Product" },
  { id: "p38", studentName: "M. Spandana", department: "CSE-DS", year: "2022-23", company: "EPAM Systems", role: "Junior Software Engineer", ctc: 14, type: "Product" },
  { id: "p39", studentName: "G. Akhil Reddy", department: "IT", year: "2021-22", company: "EPAM Systems", role: "Junior Software Engineer", ctc: 12, type: "Product" },
  { id: "p40", studentName: "N. Sahithi", department: "CSE-AI&ML", year: "2021-22", company: "Salesforce", role: "Associate Software Engineer", ctc: 20, type: "Product" },
  { id: "p41", studentName: "P. Vinay Kumar", department: "CSE", year: "2022-23", company: "Salesforce", role: "Associate Software Engineer", ctc: 21, type: "Product" },
  { id: "p42", studentName: "T. Greeshma", department: "ECE", year: "2023-24", company: "Deloitte", role: "Analyst", ctc: 7.5, type: "Service" },
  { id: "p43", studentName: "B. Sandeep", department: "MECH", year: "2024-25", company: "TCS", role: "TCS Ninja", ctc: 3.8, type: "Service" },
  { id: "p44", studentName: "K. Jahnavi", department: "AERO", year: "2024-25", company: "TCS", role: "TCS Ninja", ctc: 3.8, type: "Service" },
  { id: "p45", studentName: "R. Mounika", department: "CSE-DS", year: "2025-26", company: "TCS", role: "TCS Digital - Developer", ctc: 9, type: "Service" },
  { id: "p46", studentName: "V. Kiran Kumar", department: "IT", year: "2025-26", company: "Accenture", role: "Digital Engineer", ctc: 7, type: "Service" },
  { id: "p47", studentName: "S. Pravallika", department: "CSE", year: "2021-22", company: "Cognizant", role: "GenC", ctc: 4, type: "Service" },
  { id: "p48", studentName: "A. Rohit Sharma", department: "CSE-AI&ML", year: "2022-23", company: "Deloitte", role: "Analyst", ctc: 7.5, type: "Service" },
  { id: "p49", studentName: "M. Snigdha", department: "CSE-DS", year: "2023-24", company: "TekSystems", role: "Associate Consultant", ctc: 4.5, type: "Service" },
  { id: "p50", studentName: "K. Vishnu Vardhan", department: "ECE", year: "2021-22", company: "TekSystems", role: "Associate Consultant", ctc: 4.5, type: "Service" },
  { id: "p51", studentName: "G. Lasya Priya", department: "IT", year: "2022-23", company: "TekSystems", role: "Associate Consultant", ctc: 5, type: "Service" },
  { id: "p52", studentName: "P. Sujith", department: "CSE", year: "2024-25", company: "Cognizant", role: "GenC Pro", ctc: 7, type: "Service" },
  { id: "p53", studentName: "N. Divya Bharathi", department: "MECH", year: "2022-23", company: "Capgemini", role: "Analyst", ctc: 4.25, type: "Service" },
  { id: "p54", studentName: "R. Karthik Reddy", department: "AERO", year: "2023-24", company: "Capgemini", role: "Analyst", ctc: 4.25, type: "Service" },
  { id: "p55", studentName: "V. Amulya", department: "CSE-AI&ML", year: "2025-26", company: "Accenture", role: "Digital Engineer", ctc: 8, type: "Service" },
];

export function offersByYear() {
  return academicYears.map((year) => ({
    year,
    offers: placementRecords.filter((record) => record.year === year).length,
  }));
}

export function ctcTierDistribution() {
  const tiers = [
    { label: "< 6 LPA", min: 0, max: 6 },
    { label: "6-10 LPA", min: 6, max: 10 },
    { label: "10-15 LPA", min: 10, max: 15 },
    { label: "15+ LPA", min: 15, max: Infinity },
  ];
  return tiers.map((tier) => ({
    tier: tier.label,
    students: placementRecords.filter((record) => record.ctc >= tier.min && record.ctc < tier.max).length,
  }));
}

export function recruiterShare() {
  const counts = new Map<string, number>();
  for (const record of placementRecords) {
    counts.set(record.company, (counts.get(record.company) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([company, count]) => ({ company, count }));
}

export const wallOfFame = placementRecords
  .filter((record) => record.ctc >= 14)
  .sort((a, b) => b.ctc - a.ctc)
  .slice(0, 8);
