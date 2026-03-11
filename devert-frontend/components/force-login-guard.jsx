"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { Loader2, ShieldAlert } from "lucide-react";

export function ForceLoginGuard({ children }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        if (!loading) {
            // List of public paths
            const publicPaths = ["/login"];

            // Logic: If not logged in AND not on a public path
            if (!user && !publicPaths.includes(pathname)) {
                // Redirect to login
                console.log("Force Login: Redirecting to /login");
                router.replace("/login");
            } else {
                setIsChecking(false);
            }
        }
    }, [user, loading, pathname, router]);

    // If loading auth state, show a minimal loader
    if (loading) {
        return (
            <div className="h-screen w-screen bg-[#050505] flex flex-col items-center justify-center text-white">
                <Loader2 className="animate-spin text-neon-cyan mb-4" size={32} />
                <p className="font-mono text-xs text-gray-500 animate-pulse">VERIFYING_IDENTITY...</p>
            </div>
        );
    }

    // While performing the redirect check for unauthenticated users on protected routes
    // we want to render nothing or a spinner to prevent "flash of content"
    if (!user && pathname !== "/login") {
        return (
            <div className="h-screen w-screen bg-[#050505] flex flex-col items-center justify-center text-white">
                <ShieldAlert className="text-red-500 mb-4 animate-pulse" size={32} />
                <p className="font-mono text-xs text-red-500">ACCESS_RESTRICTED // REDIRECTING</p>
            </div>
        );
    }

    return <>{children}</>;
}
