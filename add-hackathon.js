import { db } from './devert-frontend/lib/firebase.js';
import { collection, addDoc } from 'firebase/firestore';

async function addSecondHackathon() {
    try {
        const docRef = await addDoc(collection(db, 'hackathons'), {
            title: "Agent Builder Hackathon",
            registrationLink: "/challenge", // we will make a special page for it
            description: "A specialized buildathon strictly mapping prompts to logic and testing the mettle of AI generation mechanics.",
            startDate: "2026-05-10T09:00:00.000Z",
            endDate: "2026-05-12T18:00:00.000Z",
            registrationDeadline: "2026-04-30T23:59:00.000Z",
            prizes: "$5,000 + Swag",
            tags: ["Prompt Engineering", "Agents", "Hackathon"],
            status: "OPEN",
            isFeatured: true,
            isSpecialEvent: true, // we might route it special or just normal
            createdAt: new Date().toISOString()
        });
        console.log("Added doc: ", docRef.id);
    } catch (e) {
        console.error("Error: ", e);
    }
}
addSecondHackathon();
