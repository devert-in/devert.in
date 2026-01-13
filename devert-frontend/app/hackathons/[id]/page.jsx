import HackathonDetailsPage from "./client";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

// This function is required for static export with dynamic routes
export async function generateStaticParams() {
    try {
        const querySnapshot = await getDocs(collection(db, "hackathons"));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
        }));
    } catch (error) {
        console.error("Error generating static params:", error);
        return [];
    }
}

export default function Page() {
    return <HackathonDetailsPage />;
}
