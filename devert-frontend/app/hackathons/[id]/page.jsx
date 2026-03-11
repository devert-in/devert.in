import HackathonDetailsPage from "./client";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

// This function is required for static export with dynamic routes
export async function generateStaticParams() {
    try {
        const querySnapshot = await getDocs(collection(db, "hackathons"));
        const routes = querySnapshot.docs.map(doc => ({
            id: doc.id,
        }));

        // Push our static mock genesis sprint so Firebase Static Export recognizes it natively
        routes.push({ id: "mock_genesis_sprint" });
        return routes;
    } catch (error) {
        console.error("Error generating static params:", error);
        return [{ id: "mock_genesis_sprint" }];
    }
}

export default function Page() {
    return <HackathonDetailsPage />;
}
