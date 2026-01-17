"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, limit, doc, updateDoc } from "firebase/firestore";
import { Loader2, User, MoreHorizontal, Circle } from "lucide-react";

export default function UsersAdminPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const q = query(collection(db, "users"), limit(100));
                const querySnapshot = await getDocs(q);
                const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                items.sort((a, b) => (b.lastLogin?.seconds || 0) - (a.lastLogin?.seconds || 0));
                setUsers(items);
            } catch (error) {
                console.error("Error fetching users:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const handleRoleChange = async (userId, newRole) => {
        setUpdating(userId);
        try {
            const userRef = doc(db, "users", userId);
            await updateDoc(userRef, { role: newRole });

            // Update local state
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (error) {
            console.error("Error updating role:", error);
            alert("Failed to update role");
        } finally {
            setUpdating(null);
        }
    };

    const isActiveRecently = (lastLogin) => {
        if (!lastLogin) return false;
        const now = new Date();
        const loginDate = lastLogin.toDate();
        const diffHours = (now - loginDate) / (1000 * 60 * 60);
        return diffHours < 24;
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold font-sans text-white mb-2">USER ROSTER</h1>
                    <p className="text-gray-400 font-mono text-sm">Global User Registry & Engagement Metrics.</p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold font-sans text-neon-blue">{users.length}</div>
                    <div className="text-xs font-mono text-gray-500 uppercase">Total Enrolled</div>
                </div>
            </div>

            <div className="bg-background border border-white/10 rounded-lg overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-white/5 border-b border-white/10">
                        <tr>
                            <th className="p-4 font-mono text-xs text-gray-500 uppercase">User Identity</th>
                            <th className="p-4 font-mono text-xs text-gray-500 uppercase">Status</th>
                            <th className="p-4 font-mono text-xs text-gray-500 uppercase">Role / Clearance</th>
                            <th className="p-4 font-mono text-xs text-gray-500 uppercase">Joined</th>
                            <th className="p-4 font-mono text-xs text-gray-500 uppercase text-right">Lifetime Spent</th>
                            <th className="p-4 font-mono text-xs text-gray-500 uppercase">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="p-8 text-center text-gray-500 font-mono">
                                    <Loader2 className="animate-spin inline mr-2" size={16} /> SYNCING USER DATA...
                                </td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="p-8 text-center text-gray-500 font-mono">
                                    NO USERS FOUND. (Wait for new registrations).
                                </td>
                            </tr>
                        ) : (
                            users.map(user => {
                                const isOnline = isActiveRecently(user.lastLogin);
                                return (
                                    <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400 border border-white/5 group-hover:border-neon-cyan/50 transition-colors">
                                                    {user.photoURL ? (
                                                        <img src={user.photoURL} alt="avatar" className="w-full h-full rounded-full object-cover" />
                                                    ) : (
                                                        <User size={14} />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-sm text-white">{user.displayName || "Unknown"}</div>
                                                    <div className="text-xs text-gray-500 font-mono">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm font-mono">
                                            <div className={`flex items-center gap-2 ${isOnline ? 'text-neon-green' : 'text-gray-500'}`}>
                                                <Circle size={8} fill={isOnline ? "currentColor" : "none"} />
                                                {isOnline ? "ACTIVE" : "OFFLINE"}
                                            </div>
                                        </td>
                                        <td className="p-4 text-xs font-mono">
                                            {updating === user.id ? (
                                                <Loader2 className="animate-spin text-neon-cyan" size={14} />
                                            ) : (
                                                <select
                                                    value={user.role || "user"}
                                                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                    className="bg-black border border-white/10 rounded px-2 py-1 text-gray-300 focus:border-neon-cyan focus:outline-none"
                                                >
                                                    <option value="user">USER</option>
                                                    <option value="executor">EXECUTOR</option>
                                                    <option value="admin">ADMIN</option>
                                                </select>
                                            )}
                                        </td>
                                        <td className="p-4 text-xs text-gray-500 font-mono">
                                            {user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="p-4 text-right font-mono text-white">
                                            <span className="text-gray-600 mr-1">$</span>
                                            {user.totalSpent?.toFixed(2) || "0.00"}
                                        </td>
                                        <td className="p-4">
                                            <button className="p-2 hover:bg-neon-cyan/10 hover:text-neon-cyan rounded transition-colors text-gray-400">
                                                <MoreHorizontal size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
