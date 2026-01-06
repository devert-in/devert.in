const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// NOTE: in a real production script you would use a service account.
// For quick local seeding, we can use the client SDK or just run this with 
// 'firebase-admin' IF you have Google Application Credentials set up.
// OR, easier for you: We can make a temporary UI page in the frontend to "Seed Database" 
// so we don't need to mess with Service Account keys right now.

const HACKATHONS = [
    {
        title: "Global AI Challenge 2026",
        description: "Build the next generation of AI agents. Focus on autonomous systems and ethical AI.",
        date: "Feb 15 - Feb 17, 2026",
        prizes: "$50,000 Prize Pool",
        tags: ["AI/ML", "Python", "Agents"],
        status: "OPEN"
    },
    {
        title: "DeFi Spring Hack",
        description: "Revolutionize finance with Web3. Build on Ethereum, Solana, or Polygon.",
        date: "Mar 10 - Mar 12, 2026",
        prizes: "$100,000 Prize Pool",
        tags: ["Blockchain", "Solidity", "Rust"],
        status: "UPCOMING"
    },
    {
        title: "Green Tech Summit",
        description: "Sustainable solutions for a better planet. IoT and Data Science focus.",
        date: "Jan 20 - Jan 22, 2026",
        prizes: "$25,000 Prize Pool",
        tags: ["IoT", "Data Science", "Hardware"],
        status: "CLOSED"
    }
];

const COURSES = [
    {
        title: "Full Stack Matrix",
        description: "Master the MERN stack with a focus on scalable architecture and deployment.",
        modules: 12,
        duration: "24h 15m",
        level: "Intermediate",
        thumbnail: "from-gray-900 to-black"
    },
    {
        title: "Rust for Systems",
        description: "Low-level programming simply explained. Memory safety without garbage collection.",
        modules: 8,
        duration: "16h 30m",
        level: "Advanced",
        thumbnail: "from-orange-900 to-black"
    },
    {
        title: "Docker & K8s Zero to Hero",
        description: "Containerization and orchestration for modern devops workflows.",
        modules: 15,
        duration: "18h 45m",
        level: "Beginner",
        thumbnail: "from-blue-900 to-black"
    }
];

async function seed() {
    // This is a placeholder. 
    // I will actually create a React component 'SeedButton' instead 
    // because running this node script requires complex auth setup.
}
