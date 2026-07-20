"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/firebase";
import {
  collection, query, where, getDocs, getDoc, doc, setDoc, deleteDoc,
  updateDoc, serverTimestamp, increment, limit, orderBy, onSnapshot,
} from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { writeNotification } from "@/components/notification-bell";
import { EnterHqModal } from "@/components/enter-hq-modal";
import HeroSection from "@/components/portfolio/hero-section";
import ShareModal from "@/components/portfolio/share-modal";
import { renderSection } from "@/components/portfolio/section-renderer";
import { effectiveSections } from "@/lib/portfolio-sections";

function getTierFromXP(xp = 0) {
  if (xp >= 10000) return { name: "LEGEND",    color: "#FFD700" };
  if (xp >= 5000)  return { name: "ELITE",     color: "#FF6430" };
  if (xp >= 2000)  return { name: "ARCHITECT", color: "#00FFFF" };
  if (xp >= 500)   return { name: "BUILDER",   color: "#00FF41" };
  return                  { name: "RECRUIT",   color: "#888888" };
}

export default function PublicDevCard() {
  const { user, userData } = useAuth();
  const pathname = usePathname();

  const [handle,   setHandle]   = useState("");
  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [following,setFollowing]= useState(false);
  const [fLoading, setFLoading] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [guestPromptOpen, setGuestPromptOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [pulsePosts, setPulsePosts] = useState([]);

  const isOwnProfile = user && profile && user.uid === profile.uid;

  /* ── resolve handle from pathname ── */
  useEffect(() => {
    const parts = pathname.split("/").filter(Boolean);
    const h = parts[1] || "";
    setHandle(h);
    setProfile(null);
    setFollowing(false);
  }, [pathname]);

  /* ── load profile: resolve handle -> uid once, then subscribe live ── */
  useEffect(() => {
    if (!handle) return;
    setLoading(true);
    setNotFound(false);
    let unsubscribeDoc = () => {};

    (async () => {
      try {
        const snap = await getDocs(
          query(collection(db, "users"), where("handle", "==", handle), limit(1))
        );
        if (snap.empty) { setNotFound(true); setLoading(false); return; }
        const uid = snap.docs[0].id;
        unsubscribeDoc = onSnapshot(doc(db, "users", uid), profileSnap => {
          if (!profileSnap.exists()) { setNotFound(true); setLoading(false); return; }
          const data = { ...profileSnap.data(), uid };
          setProfile({ ...data, tier: getTierFromXP(data.xp ?? 0) });
          setLoading(false);
        }, err => { console.error(err); setNotFound(true); setLoading(false); });
      } catch (e) {
        console.error(e);
        setNotFound(true);
        setLoading(false);
      }
    })();

    return () => unsubscribeDoc();
  }, [handle]);

  /* ── docked projects (Shipyard), owned by this profile ── */
  useEffect(() => {
    if (!profile?.uid) { setProjects([]); return; }
    getDocs(query(collection(db, "projects"), where("ownerId", "==", profile.uid), orderBy("createdAt", "desc")))
      .then(snap => setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(e => { console.error(e); setProjects([]); });
  }, [profile?.uid]);

  /* ── this user's own approved pulse posts ── */
  useEffect(() => {
    if (!profile?.uid) { setPulsePosts([]); return; }
    getDocs(query(
      collection(db, "pulse_posts"),
      where("uid", "==", profile.uid),
      where("status", "==", "approved"),
      orderBy("createdAt", "desc"),
      limit(10),
    ))
      .then(snap => setPulsePosts(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(e => { console.error(e); setPulsePosts([]); });
  }, [profile?.uid]);

  /* ── bump profileViews once per load, for anyone but the owner ── */
  useEffect(() => {
    if (!profile?.uid || isOwnProfile) return;
    updateDoc(doc(db, "users", profile.uid), { profileViews: increment(1) }).catch(() => {});
  }, [profile?.uid, isOwnProfile]);

  /* ── check follow state ── */
  useEffect(() => {
    if (!user || !profile || isOwnProfile) return;
    (async () => {
      const snap = await getDoc(doc(db, "follows", `${user.uid}_${profile.uid}`));
      setFollowing(snap.exists());
    })();
  }, [user, profile, isOwnProfile]);

  /* ── follow / unfollow ── */
  const toggleFollow = async () => {
    if (!user || !profile || isOwnProfile || fLoading) return;
    setFLoading(true);
    const followRef = doc(db, "follows", `${user.uid}_${profile.uid}`);
    const myRef     = doc(db, "users", user.uid);
    const theirRef  = doc(db, "users", profile.uid);
    try {
      if (following) {
        await deleteDoc(followRef);
        await updateDoc(myRef,    { followingCount: increment(-1) });
        await updateDoc(theirRef, { followersCount: increment(-1) });
        setFollowing(false);
      } else {
        await setDoc(followRef, { followerId: user.uid, followeeId: profile.uid, createdAt: serverTimestamp() });
        await updateDoc(myRef,    { followingCount: increment(1) });
        await updateDoc(theirRef, { followersCount: increment(1) });
        setFollowing(true);
        writeNotification(profile.uid, {
          type: "follow",
          title: `@${userData?.handle || "someone"} followed you`,
          body: "You have a new follower on DeVert.",
          ...(userData?.handle ? { ctaHref: `/u/${userData.handle}`, ctaLabel: "view profile" } : {}),
        });
      }
    } catch (e) { console.error(e); }
    setFLoading(false);
  };

  /* ─── loading ─── */
  if (loading || !handle) return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border border-white/10 border-t-neon-cyan rounded-full animate-spin" />
        <p className="font-mono text-xs text-white/20">loading portfolio...</p>
      </div>
    </main>
  );

  /* ─── not found ─── */
  if (notFound) return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <p className="font-mono text-2xl text-white/20 mb-3">404</p>
        <p className="font-mono text-sm text-white/30 mb-2">@{handle} not found</p>
        <p className="font-mono text-xs text-white/15 mb-8">// this dev hasn't shipped yet</p>
        <Link href="/"
          className="font-mono text-xs text-neon-cyan/60 border border-neon-cyan/20 px-4 py-2 rounded hover:bg-neon-cyan/6 transition-colors">
          ← back to devert.in
        </Link>
      </div>
    </main>
  );

  const narrativeStats = [
    profile.projects?.length || projects.length ? { label: "PROJECTS", value: projects.length, color: "#00FFFF" } : null,
    profile.certifications?.length ? { label: "CERTS", value: profile.certifications.length, color: "#00FF41" } : null,
    profile.experience?.length ? { label: "ROLES", value: profile.experience.length, color: "#FF9500" } : null,
    profile.achievements?.length ? { label: "AWARDS", value: profile.achievements.length, color: "#FFD700" } : null,
  ].filter(Boolean).slice(0, 4);

  const sections = effectiveSections(profile);
  const sectionData = { profile, projects, pulsePosts, onShare: () => setShareOpen(true) };

  return (
    <main className="min-h-screen pb-8">
      <div className="max-w-5xl mx-auto px-6 pt-8">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/" className="font-mono text-[10px] text-white/20 hover:text-white/40 transition-colors">devert.in</Link>
          <span className="font-mono text-[10px] text-white/10">/</span>
          <span className="font-mono text-[10px] text-white/25">u/{handle}</span>
          {isOwnProfile && (
            <Link href="/profile" className="ml-auto font-mono text-[10px] text-neon-cyan/60 border border-neon-cyan/20 px-2.5 py-1 rounded hover:bg-neon-cyan/6 transition-colors">
              edit portfolio
            </Link>
          )}
        </div>
      </div>

      <HeroSection
        profile={profile}
        handle={handle}
        tier={profile.tier}
        isOwnProfile={isOwnProfile}
        user={user}
        following={following}
        fLoading={fLoading}
        onToggleFollow={toggleFollow}
        onGuestFollow={() => setGuestPromptOpen(true)}
        shared={false}
        onShare={() => setShareOpen(true)}
        narrativeStats={narrativeStats}
      />

      {sections.map(key => renderSection(key, sectionData))}

      <div className="text-center pt-6 pb-4">
        <p className="font-mono text-[10px] text-white/12">
          // powered by{" "}
          <Link href="/" className="text-white/20 hover:text-neon-green transition-colors">devert.in</Link>
          {" "}- the developer arena
        </p>
      </div>

      {shareOpen && (
        <ShareModal handle={handle} onClose={() => setShareOpen(false)} />
      )}
      {guestPromptOpen && (
        <EnterHqModal onClose={() => setGuestPromptOpen(false)} next={`/u/${handle}`} />
      )}
    </main>
  );
}
