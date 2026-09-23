"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, BarChart3, Package, Shield, ClipboardList, Settings as SettingsIcon,
  LogOut, ExternalLink, Building2, Users,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, getCountFromServer, serverTimestamp } from "firebase/firestore";
import { ROLE_CATALOG, PERMISSIONS, PERMISSION_LABELS } from "@/lib/permissions";
import { logAdminActivity } from "@/lib/adminActivityLog";
import { Section } from "@/components/admin/admin-ui";
import { ActivityLogPanel } from "@/components/admin/activity-log-panel";

const MANAGE_TABS = [
  { key: "overview", label: "OVERVIEW",  icon: BarChart3,     color: "#00FFFF" },
  { key: "products", label: "PRODUCTS",  icon: Package,       color: "#00FF41" },
  { key: "roles",    label: "ROLES",     icon: Shield,        color: "#C77DFF" },
  { key: "audit",    label: "AUDIT LOG", icon: ClipboardList, color: "#FF9500" },
  { key: "settings", label: "SETTINGS",  icon: SettingsIcon,  color: "#FFD700" },
];

// ── Overview ──────────────────────────────────────────────────────────────────

function OverviewPanel() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const load = async () => {
      const [usersSnap, institutionsSnap, registrySnap] = await Promise.allSettled([
        getCountFromServer(collection(db, "users")),
        getCountFromServer(collection(db, "institutions")),
        getDoc(doc(db, "system", "productRegistry")),
      ]);
      const products = registrySnap.status === "fulfilled" && registrySnap.value.exists()
        ? Object.values(registrySnap.value.data().products || {}) : [];
      setStats({
        totalUsers:       usersSnap.status === "fulfilled" ? usersSnap.value.data().count : 0,
        totalInstitutions: institutionsSnap.status === "fulfilled" ? institutionsSnap.value.data().count : 0,
        publishedProducts: products.filter(p => p.status === "PUBLISHED").length,
        totalProducts:     products.length,
      });
    };
    load().catch(console.error);
  }, []);

  const tiles = stats ? [
    { label: "TOTAL USERS",        value: stats.totalUsers,        icon: Users,     color: "#00FFFF" },
    { label: "CAMPUS INSTITUTIONS", value: stats.totalInstitutions, icon: Building2, color: "#00FF41" },
    { label: "PUBLISHED PRODUCTS", value: `${stats.publishedProducts} / ${stats.totalProducts}`, icon: Package, color: "#FF9500" },
  ] : [];

  return (
    <div className="space-y-6">
      {!stats ? (
        <p className="font-mono text-xs text-white/25 animate-pulse">loading...</p>
      ) : (
        <div className="grid sm:grid-cols-3 gap-3">
          {tiles.map(t => (
            <div key={t.label} className="border border-white/8 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <t.icon size={13} style={{ color: t.color }} />
                <span className="font-mono text-[9px] text-white/30 tracking-wider">{t.label}</span>
              </div>
              <p className="font-sans text-2xl font-bold text-white">{t.value}</p>
            </div>
          ))}
        </div>
      )}
      <div className="border border-white/8 rounded-lg p-4">
        <p className="font-mono text-[10px] text-white/30 mb-3 tracking-wider">RECENT ACTIVITY</p>
        <ActivityLogPanel />
      </div>
    </div>
  );
}

// ── Products ──────────────────────────────────────────────────────────────────

const STATUS_META = {
  PUBLISHED:     { label: "Published",     color: "#00FF41" },
  NOT_PUBLISHED: { label: "Not Published", color: "rgba(255,255,255,0.35)" },
};

function ProductsPanel() {
  const [products, setProducts] = useState(null);
  const [saving,    setSaving]    = useState(null);

  const load = () => {
    getDoc(doc(db, "system", "productRegistry"))
      .then(snap => setProducts(snap.exists() ? snap.data().products : {}))
      .catch(() => setProducts({}));
  };
  useEffect(() => { load(); }, []);

  const toggle = async (key) => {
    const current = products[key];
    const nextStatus = current.status === "PUBLISHED" ? "NOT_PUBLISHED" : "PUBLISHED";
    setSaving(key);
    try {
      const updated = { ...products, [key]: { ...current, status: nextStatus } };
      await setDoc(doc(db, "system", "productRegistry"), { products: updated, updatedAt: serverTimestamp() });
      setProducts(updated);
      logAdminActivity(
        nextStatus === "PUBLISHED" ? "product.publish" : "product.unpublish",
        `${current.label} -> ${nextStatus}`,
        "global",
      );
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(null);
    }
  };

  if (products === null) return <p className="font-mono text-xs text-white/25 animate-pulse">loading...</p>;

  return (
    <div className="space-y-2">
      <p className="font-mono text-[10px] text-white/18 mb-3">
        Visibility only for now - toggling status here does not yet gate real page access.
      </p>
      {Object.entries(products).map(([key, p]) => {
        const meta = STATUS_META[p.status] || STATUS_META.NOT_PUBLISHED;
        return (
          <div key={key} className="flex items-center gap-3 border border-white/6 rounded-lg px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="font-sans text-sm text-white/85">{p.label}</p>
              <p className="font-mono text-[10px] text-white/25">{p.href}</p>
            </div>
            <span className="font-mono text-[10px] px-2 py-1 rounded flex-shrink-0" style={{ color: meta.color, background: `${meta.color}15` }}>
              {meta.label}
            </span>
            <button onClick={() => toggle(key)} disabled={saving === key}
              className="font-mono text-[10px] px-3 py-1.5 border rounded flex-shrink-0 transition-colors disabled:opacity-50"
              style={{ color: "#00FFFF", borderColor: "rgba(0,255,255,0.3)" }}
            >
              {saving === key ? "..." : p.status === "PUBLISHED" ? "Disable" : "Publish"}
            </button>
            {key === "core" && (
              <a href="/admin" className="font-mono text-[10px] flex items-center gap-1 text-white/30 hover:text-white/60 transition-colors flex-shrink-0">
                Manage <ExternalLink size={10} />
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Roles ─────────────────────────────────────────────────────────────────────

function RolesPanel() {
  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[10px] text-white/30 mb-3 tracking-wider">CAMPUS INSTITUTION ROLES</p>
        <div className="space-y-2">
          {Object.entries(ROLE_CATALOG).map(([key, role]) => (
            <div key={key} className="border border-white/6 rounded-lg px-4 py-3">
              <p className="font-sans text-sm text-white/85">{role.label}</p>
              <p className="font-mono text-[10px] text-white/25">scope: {role.scopeType}</p>
            </div>
          ))}
          <div className="border border-white/6 rounded-lg px-4 py-3">
            <p className="font-sans text-sm text-white/85">Institution Admin</p>
            <p className="font-mono text-[10px] text-white/25">scope: institution (via institutions/{"{id}"}/admins doc)</p>
          </div>
        </div>
      </div>
      <div>
        <p className="font-mono text-[10px] text-white/30 mb-3 tracking-wider">PERMISSION CATALOG ({PERMISSIONS.length})</p>
        <div className="flex flex-wrap gap-1.5">
          {PERMISSIONS.map(p => (
            <span key={p} className="font-mono text-[9px] text-white/40 border border-white/8 px-1.5 py-0.5 rounded">
              {PERMISSION_LABELS[p] || p}
            </span>
          ))}
        </div>
      </div>
      <p className="font-mono text-[10px] text-white/18">
        &quot;View As Role&quot; preview is not built yet - deferred to a later pass.
      </p>
    </div>
  );
}

// ── Settings ──────────────────────────────────────────────────────────────────

function SettingsPanel() {
  return <p className="font-mono text-xs text-white/25">Nothing to configure globally yet.</p>;
}

// ── Shell ─────────────────────────────────────────────────────────────────────

function ManagePageInner() {
  const { user, loading, isSuperAdmin, adminChecked, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    const fromUrl = searchParams.get("tab");
    return MANAGE_TABS.some(t => t.key === fromUrl) ? fromUrl : "overview";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.history.replaceState(null, "", `/manage?tab=${activeTab}`);
  }, [activeTab]);

  // Same "route never existed" pattern as /admin - no access-denied screen,
  // just a silent redirect, gated strictly on isSuperAdmin (not isAdmin - a
  // plain DeVert Core admin already has /admin, and should not land here).
  useEffect(() => {
    if (loading || !adminChecked) return;
    if (!user || !isSuperAdmin) router.replace("/");
  }, [user, loading, isSuperAdmin, adminChecked]);

  if (loading || !adminChecked || !user || !isSuperAdmin) {
    return <main className="min-h-screen bg-background" />;
  }

  return (
    <main className="min-h-screen pt-10 pb-32 px-6 relative">
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />

      <div className="relative max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="font-mono text-xs text-neon-green/55 mb-3 tracking-wider flex items-center gap-1.5">
              <Globe size={11} /> // /manage - control_center.sh
            </p>
            <h1 className="font-sans font-bold tracking-tighter text-white leading-none" style={{ fontSize: "clamp(2rem,5vw,3.5rem)" }}>
              DEVERT <span className="text-neon-cyan">CONTROL CENTER</span>
            </h1>
            <p className="font-mono text-xs text-white/30 mt-2">{user.email}</p>
          </div>
          <button onClick={async () => { await logout(); router.push("/"); }}
            className="font-mono text-xs text-white/25 hover:text-red-400 transition-colors flex items-center gap-1.5 mt-2"
          >
            <LogOut size={12} /> logout
          </button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="terminal-window mb-6 overflow-hidden"
        >
          <div className="terminal-header">
            <span className="font-mono text-[10px] text-white/25 ml-2">control_center.tabs</span>
          </div>
          <div className="flex items-stretch overflow-x-auto no-scrollbar">
            {MANAGE_TABS.map((tab, i) => {
              const isActive = activeTab === tab.key;
              const Icon = tab.icon;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className="relative flex items-center gap-2 px-5 py-3.5 font-mono text-[11px] tracking-wider flex-shrink-0 transition-all"
                  style={{
                    color: isActive ? tab.color : "rgba(255,255,255,0.3)",
                    background: isActive ? `${tab.color}08` : "transparent",
                    borderRight: i < MANAGE_TABS.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  }}
                >
                  <Icon size={12} />
                  {tab.label}
                  {isActive && (
                    <motion.div layoutId="manageTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-[2px]"
                      style={{ background: tab.color }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}
          >
            {activeTab === "overview" && (
              <Section title="ECOSYSTEM OVERVIEW" icon={BarChart3} color="#00FFFF" defaultOpen={true}>
                <OverviewPanel />
              </Section>
            )}
            {activeTab === "products" && (
              <Section title="PRODUCT REGISTRY" icon={Package} color="#00FF41" defaultOpen={true}>
                <ProductsPanel />
              </Section>
            )}
            {activeTab === "roles" && (
              <Section title="ROLES & PERMISSIONS" icon={Shield} color="#C77DFF" defaultOpen={true}>
                <RolesPanel />
              </Section>
            )}
            {activeTab === "audit" && (
              <Section title="GLOBAL AUDIT LOG" icon={ClipboardList} color="#FF9500" defaultOpen={true}>
                <ActivityLogPanel />
              </Section>
            )}
            {activeTab === "settings" && (
              <Section title="SETTINGS" icon={SettingsIcon} color="#FFD700" defaultOpen={true}>
                <SettingsPanel />
              </Section>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}

export default function ManagePage() {
  return (
    <Suspense fallback={null}>
      <ManagePageInner />
    </Suspense>
  );
}
