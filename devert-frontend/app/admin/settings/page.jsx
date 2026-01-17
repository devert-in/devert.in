"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getAuth, updatePassword } from "firebase/auth";
import { useAuth } from "@/context/AuthContext";
import { ToggleLeft, ToggleRight, Save, ShieldAlert, Activity } from "lucide-react";

export default function SystemSettingsPage() {
    const [features, setFeatures] = useState({
        hackathons: true,
        contests: true,
        squadron: true,
        execution: true,
        postmortems: true,
        courses: true,
        payments: false, // Default off
        userRegistration: true,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState("");

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const docRef = doc(db, "system", "feature_flags");
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setFeatures({ ...features, ...docSnap.data() });
                } else {
                    // Create default if not exists
                    await setDoc(docRef, features);
                }
            } catch (err) {
                console.error("Error fetching feature flags:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const toggleFeature = (key) => {
        setFeatures(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const saveSettings = async () => {
        setSaving(true);
        setStatus("");
        try {
            const docRef = doc(db, "system", "feature_flags");
            await setDoc(docRef, features, { merge: true });
            setStatus("Settings applied successfully to all live nodes.");
            setTimeout(() => setStatus(""), 3000);
        } catch (err) {
            console.error("Error saving settings:", err);
            setStatus("Critical Error: Failed to propagate settings.");
        } finally {
            setSaving(false);
        }
    };

    const FeatureRow = ({ label, id, description }) => (
        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg hover:border-white/20 transition-all">
            <div>
                <div className="font-bold text-white font-mono">{label}</div>
                <div className="text-xs text-gray-500 font-mono">{description}</div>
            </div>
            <button
                onClick={() => toggleFeature(id)}
                className={`transition-colors ${features[id] ? "text-neon-green" : "text-gray-600"}`}
            >
                {features[id] ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
            </button>
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold font-sans text-white mb-2">SYSTEM PROTOCOLS</h1>
                    <p className="text-gray-400 font-mono text-sm">Enable or disable core platform modules.</p>
                </div>
            </div>

            <div className="grid gap-4 max-w-3xl">
                <FeatureRow
                    label="HACKATHONS_MODULE"
                    id="hackathons"
                    description="Allow users to view and join hackathons."
                />
                <FeatureRow
                    label="CONTESTS_ENGINE"
                    id="contests"
                    description="Enable War Games and coding contests."
                />
                <FeatureRow
                    label="SQUADRON_NET"
                    id="squadron"
                    description="Teammate finding and squad formation."
                />
                <FeatureRow
                    label="EXECUTION_PAYLOADS"
                    id="execution"
                    description="Freelance and bounty execution platform."
                />
                <FeatureRow
                    label="ARCHIVE_ACCESS (Postmortems)"
                    id="postmortems"
                    description="Access to past project case studies."
                />
                <FeatureRow
                    label="EDUCATION_GRID (Courses)"
                    id="courses"
                    description="Learning materials and course enrollment."
                />
                <FeatureRow
                    label="PAYMENT_GATEWAY"
                    id="payments"
                    description="Global payments processing (Warning: Use cautiously)."
                />
                <FeatureRow
                    label="NEW_USER_REGISTRATION"
                    id="userRegistration"
                    description="Allow new users to sign up to the platform."
                />
            </div>

            <div className="pt-6 border-t border-white/10 flex items-center justify-between max-w-3xl">
                <div className="text-sm font-mono text-yellow-500 flex items-center gap-2">
                    <ShieldAlert size={16} /> Changes reflect immediately across the platform.
                </div>
                <button
                    onClick={saveSettings}
                    disabled={saving}
                    className="bg-neon-cyan/10 border border-neon-cyan text-neon-cyan px-6 py-3 rounded hover:bg-neon-cyan hover:text-black transition-all flex items-center gap-2 font-bold font-mono"
                >
                    {saving ? <Activity className="animate-spin" size={18} /> : <Save size={18} />}
                    {saving ? "PROPAGATING..." : "SAVE_PROTOCOLS"}
                </button>
            </div>

            {status && (
                <div className={`mt-4 p-4 font-mono text-sm border ${status.includes("Error") ? "border-red-500 text-red-500" : "border-neon-green text-neon-green"}`}>
                    {status}
                </div>
            )}

            {/* Security Section */}
            <SecuritySection />
        </div>
    );
}

function SecuritySection() {
    const [newPass, setNewPass] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");
    const { user } = useAuth(); // Need to import useAuth

    const handleUpdate = async () => {
        if (!newPass || newPass.length < 6) {
            setMsg("Password must be at least 6 chars.");
            return;
        }
        setLoading(true);
        setMsg("");
        try {
            // Re-authentication might be required if session is old, but often works if fresh.
            await updatePassword(user, newPass);
            setMsg("SUCCESS: Password updated.");
            setNewPass("");
        } catch (e) {
            console.error(e);
            setMsg("ERROR: " + e.message + " (Try logging in again first)");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pt-12 mt-12 border-t border-white/10 max-w-3xl">
            <h2 className="text-2xl font-bold font-sans text-white mb-4">SECURITY_OVERRIDE</h2>
            <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-lg">
                <p className="text-gray-400 font-mono text-sm mb-4">Update Administrative Access Credentials (Password)</p>
                <div className="flex gap-4">
                    <input
                        type="password"
                        value={newPass}
                        onChange={(e) => setNewPass(e.target.value)}
                        placeholder="New Secure Password"
                        className="flex-1 bg-black border border-white/20 p-3 text-white font-mono text-sm focus:border-red-500 outline-none"
                    />
                    <button
                        onClick={handleUpdate}
                        disabled={loading}
                        className="bg-red-500 text-white px-6 py-3 font-bold font-mono hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                        {loading ? "UPDATING..." : "UPDATE_CREDENTIALS"}
                    </button>
                </div>
                {msg && <div className={`mt-2 font-mono text-xs ${msg.includes("SUCCESS") ? "text-neon-green" : "text-red-500"}`}>{msg}</div>}
            </div>
        </div>
    );
}
