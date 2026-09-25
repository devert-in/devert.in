"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet, Coins, TrendingUp, ArrowRight, CheckCircle,
  Clock, XCircle, ChevronDown, Info, Heart, MessageSquare, Bookmark,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { db, functions } from "@/lib/firebase";
import { httpsCallable } from "firebase/functions";
import {
  doc, onSnapshot, collection, query, where,
  orderBy, getDocs,
} from "firebase/firestore";
import { ECONOMY as COINS, loadEconomy } from "@/lib/economy";
import { fetchWeeklyLeaderboardSettings } from "@/lib/institutions";

const CONVERSION_LOCKED_MESSAGE = "Reward conversion is temporarily locked until this week's leaderboard is finalized by your campus administrator.";

function StatCard({ label, value, sub, color = "#00FFFF" }) {
  return (
    <div className="terminal-window p-5 flex flex-col gap-2">
      <p className="font-mono text-[10px] text-white/30 tracking-wider">{label}</p>
      <p className="font-sans font-bold text-2xl" style={{ color }}>{value}</p>
      {sub && <p className="font-mono text-[10px] text-white/25">{sub}</p>}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending:  { color: "#FF9500", label: "PENDING"  },
    approved: { color: "#00FF41", label: "APPROVED" },
    rejected: { color: "#FF5050", label: "REJECTED" },
  };
  const m = map[status] || map.pending;
  return (
    <span className="font-mono text-[9px] px-1.5 py-0.5 rounded"
      style={{ color: m.color, background: `${m.color}10`, border: `1px solid ${m.color}25` }}>
      {m.label}
    </span>
  );
}

export default function WalletPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [earnings,  setEarnings]  = useState(null);
  const [userData,  setUserData]  = useState(null);
  const [requests,  setRequests]  = useState([]);
  const [pageLoad,  setPageLoad]  = useState(true);

  // XP conversion
  const [converting, setConverting] = useState(false);
  const [converted,  setConverted]  = useState(false);
  const [cError,     setCError]     = useState("");

  // Payout form
  const [method,   setMethod]  = useState("upi");
  const [upiId,    setUpiId]   = useState("");
  const [bankName, setBankName] = useState("");
  const [accNum,   setAccNum]  = useState("");
  const [ifsc,     setIfsc]    = useState("");
  const [coins,    setCoins]   = useState("");
  const [pError,   setPError]  = useState("");
  const [pSaving,  setPSaving] = useState(false);
  const [pSuccess, setPSuccess] = useState(false);
  const [transactions, setTransactions] = useState([]);
  // Only ever true for a student on a campus with an active weekly-lock
  // policy - a general platform user with no institutionId has no weekly
  // leaderboard concept at all, so their conversions are never gated.
  const [conversionLocked, setConversionLocked] = useState(false);

  // earnings (Coins) and userData (XP) are LIVE subscriptions, not one-time
  // getDoc()s - this is the one page whose entire purpose is showing an
  // accurate balance, so a reward landing (Daily Learning, CodeLab, a
  // contest grade) while the tab is already open must update the displayed
  // number immediately, the same way quick-stats-row.jsx/campus-app.jsx's
  // Overview already do for the identical documents, instead of only
  // refreshing on a manual reload.
  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login?next=/wallet"); return; }

    const unsubEarnings = onSnapshot(doc(db, "user_earnings", user.uid), snap => {
      setEarnings(snap.exists() ? snap.data() : { pulseCoins: 0, totalCoins: 0 });
    }, () => setEarnings({ pulseCoins: 0, totalCoins: 0 }));
    const unsubUser = onSnapshot(doc(db, "users", user.uid), snap => {
      setUserData(snap.exists() ? snap.data() : {});
    }, () => setUserData({}));

    Promise.all([
      getDocs(query(
        collection(db, "payout_requests"),
        where("uid", "==", user.uid),
        orderBy("createdAt", "desc"),
      )),
      // No orderBy alongside this equality filter, on purpose - avoids
      // needing a composite index just to list one user's own transactions.
      getDocs(query(collection(db, "coin_transactions"), where("uid", "==", user.uid))),
      loadEconomy(),
    ])
      .then(([reqSnap, txSnap]) => {
        setRequests(reqSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setTransactions(
          txSnap.docs.map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
        );
      })
      .catch(console.error)
      .finally(() => setPageLoad(false));

    return () => { unsubEarnings(); unsubUser(); };
  }, [user, authLoading]);

  useEffect(() => {
    if (!userData?.institutionId) { setConversionLocked(false); return; }
    fetchWeeklyLeaderboardSettings(userData.institutionId)
      .then(s => setConversionLocked(s.rewardConversionLocked !== false))
      .catch(() => setConversionLocked(false));
  }, [userData?.institutionId]);

  // Both money operations run server-side (functions/index.js convertXpToCoins
  // / requestPayout): the server reads the live XP / coin balance, applies
  // system/economy's rates and caps, and writes everything in one Admin SDK
  // transaction. firestore.rules no longer lets this page raise its own coins
  // or create a payout request directly - that is what let a client pick its
  // own INR amount and claim one balance many times.
  const handleConvertXP = async () => {
    if (!user) return;
    setCError("");
    if (conversionLocked) { setCError(CONVERSION_LOCKED_MESSAGE); return; }
    setConverting(true);
    try {
      const { data } = await httpsCallable(functions, "convertXpToCoins")({});
      const gainable = data?.coins || 0;
      if (gainable < 1) {
        setCError(data?.remainingToday === 0 ? "Daily conversion limit reached - try again tomorrow." : "Not enough XP to convert yet.");
        return;
      }
      setUserData(p  => ({ ...p, xp: (p?.xp || 0) - (data.xpSpent || gainable * COINS.XP_PER_COIN) }));
      setEarnings(p  => ({
        pulseCoins: (p?.pulseCoins || 0) + gainable,
        totalCoins: (p?.totalCoins || 0) + gainable,
      }));
      setTransactions(prev => [{ id: `local-${Date.now()}`, uid: user.uid, type: "xp_convert", amount: gainable, createdAt: { seconds: Date.now() / 1000 } }, ...prev]);
      setConverted(true);
      setTimeout(() => setConverted(false), 3000);
    } catch (e) {
      console.error(e);
      setCError(e?.message || "Conversion failed.");
    }
    finally { setConverting(false); }
  };

  const handlePayoutRequest = async () => {
    setPError("");
    if (conversionLocked) return setPError(CONVERSION_LOCKED_MESSAGE);
    const coinAmt = parseInt(coins);
    if (!coinAmt || coinAmt < COINS.MIN_PAYOUT)
      return setPError(`Minimum payout is ${COINS.MIN_PAYOUT.toLocaleString()} coins (₹${(COINS.MIN_PAYOUT / COINS.COINS_PER_INR).toFixed(2)}).`);
    if (coinAmt > (earnings?.pulseCoins || 0))
      return setPError("Not enough coins.");
    if (method === "upi" && !upiId.trim())
      return setPError("Enter your UPI ID.");
    if (method === "bank" && (!accNum.trim() || !ifsc.trim()))
      return setPError("Account number and IFSC are required.");

    setPSaving(true);
    try {
      await httpsCallable(functions, "requestPayout")({
        coins: coinAmt, method,
        upiId: method === "upi" ? upiId.trim() : "",
        bankName: method === "bank" ? bankName.trim() : "",
        accountNumber: method === "bank" ? accNum.trim() : "",
        ifscCode: method === "bank" ? ifsc.trim() : "",
      });
      setEarnings(p => ({
        pulseCoins: (p?.pulseCoins || 0) - coinAmt,
        totalCoins:  p?.totalCoins || 0,
      }));
      setCoins(""); setUpiId(""); setBankName(""); setAccNum(""); setIfsc("");
      setPSuccess(true);
      setTimeout(() => setPSuccess(false), 4000);
      getDocs(query(collection(db, "payout_requests"), where("uid", "==", user.uid), orderBy("createdAt", "desc")))
        .then(snap => setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    } catch (e) { setPError(e?.message || "Payout request failed."); }
    finally { setPSaving(false); }
  };

  if (authLoading || pageLoad) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="font-mono text-xs text-white/25 animate-pulse">loading wallet...</p>
      </main>
    );
  }

  if (!user) return null;

  const pulseCoins   = earnings?.pulseCoins || 0;
  const xp           = userData?.xp         || 0;
  const convertable  = Math.min(Math.floor(xp / COINS.XP_PER_COIN), 5000);
  const inrAvailable = pulseCoins / COINS.COINS_PER_INR;
  const canPayout    = pulseCoins >= COINS.MIN_PAYOUT;

  // "Today" in IST, so the boundary matches when the rest of the platform
  // resets daily challenges/streaks.
  const startOfTodayIST = (() => {
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const nowIST = new Date(Date.now() + IST_OFFSET_MS);
    nowIST.setUTCHours(0, 0, 0, 0);
    return (nowIST.getTime() - IST_OFFSET_MS) / 1000;
  })();
  const todayEarnings = transactions
    .filter(t => (t.createdAt?.seconds || 0) >= startOfTodayIST)
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const TX_LABELS = {
    like_received:    { label: "Like received",    color: "#FF5050" },
    comment_received: { label: "Comment received", color: "#00FFFF" },
    save_received:    { label: "Save received",    color: "#A78BFA" },
    xp_convert:       { label: "XP converted",      color: "#00FF41" },
  };

  return (
    <main className="min-h-screen pt-10 pb-32 relative">
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />

      <div className="relative max-w-2xl lg:max-w-5xl mx-auto px-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <p className="font-mono text-xs text-neon-green/55 mb-3 tracking-wider">// /wallet - devert_coins.sol</p>
          <h1 className="font-sans font-bold tracking-tighter text-white leading-none mb-2 flex items-center gap-3"
            style={{ fontSize: "clamp(2.5rem,7vw,4.5rem)" }}>
            WALLET <Coins className="text-neon-cyan" style={{ width: "0.75em", height: "0.75em" }} />
          </h1>
          <p className="font-mono text-xs text-white/30">
            Earn coins from likes, comments &amp; saves on your Pulse posts.
          </p>
        </motion.div>

        <div className="lg:grid lg:grid-cols-5 lg:gap-6 lg:items-start">
        <div className="lg:col-span-3">

        {/* Balance grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <StatCard
              label="PULSE COINS"
              value={pulseCoins.toLocaleString()}
              sub="available to withdraw"
              color="#FF9500"
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <StatCard
              label="INR VALUE"
              value={`₹${inrAvailable.toFixed(2)}`}
              sub={`at ${COINS.COINS_PER_INR.toLocaleString()} coins = ₹1`}
              color="#00FFFF"
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="col-span-2 sm:col-span-1">
            <StatCard
              label="YOUR XP"
              value={xp.toLocaleString()}
              sub={`= ${convertable} convertable coins`}
              color="#00FF41"
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <StatCard
              label="LIFETIME EARNED"
              value={(earnings?.totalCoins || 0).toLocaleString()}
              sub="coins, all-time"
              color="#C77DFF"
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <StatCard
              label="TODAY'S EARNINGS"
              value={`+${todayEarnings.toLocaleString()}`}
              sub="coins since midnight IST"
              color="#FF9500"
            />
          </motion.div>
        </div>

        {/* Earning rates info */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22 }}
          className="terminal-window mb-8">
          <div className="terminal-header">
            <span className="font-mono text-[10px] text-white/25 ml-2">earning_rates.json</span>
          </div>
          <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "per like",    icon: Heart,      value: `+${COINS.PER_LIKE}`,    color: "#FF5050" },
              { label: "per comment", icon: MessageSquare, value: `+${COINS.PER_COMMENT}`, color: "#00FFFF" },
              { label: "per save",    icon: Bookmark,   value: `+${COINS.PER_SAVE}`,    color: "#A78BFA" },
              { label: "100 XP",      icon: null,       value: "+1 coin",                color: "#00FF41" },
            ].map(r => (
              <div key={r.label} className="text-center">
                <p className="font-mono font-bold text-lg" style={{ color: r.color }}>{r.value}</p>
                <p className="font-mono text-[10px] text-white/30 mt-0.5 flex items-center justify-center gap-1">
                  {r.icon && <r.icon size={10} />} {r.label}
                </p>
              </div>
            ))}
          </div>
          <div className="px-5 pb-4">
            <p className="font-mono text-[10px] text-white/18">
              Min payout: {COINS.MIN_PAYOUT.toLocaleString()} coins (₹{(COINS.MIN_PAYOUT / COINS.COINS_PER_INR).toFixed(0)}) ·
              Processed manually within 3-5 business days.
            </p>
          </div>
        </motion.div>

        {/* XP → Coins conversion */}
        {convertable > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="terminal-window mb-8">
            <div className="terminal-header">
              <span className="font-mono text-[10px] text-white/25 ml-2">xp_convert.sh</span>
            </div>
            <div className="p-5">
              <p className="font-mono text-xs text-white/45 mb-4">
                You have <span style={{ color: "#00FF41" }}>{xp.toLocaleString()} XP</span> → convert{" "}
                <span style={{ color: "#FF9500" }}>{convertable.toLocaleString()} coins</span> ({convertable * COINS.XP_PER_COIN} XP used).
              </p>
              {conversionLocked && (
                <p className="font-mono text-[10.5px] text-orange-400/80 mb-3 flex items-center gap-1.5">
                  <Clock size={11} /> {CONVERSION_LOCKED_MESSAGE}
                </p>
              )}
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                onClick={handleConvertXP}
                disabled={converting || converted || conversionLocked}
                className="w-full font-mono text-xs py-2.5 border transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                style={converted
                  ? { color: "#00FF41", borderColor: "rgba(0,255,65,0.4)", background: "rgba(0,255,65,0.06)" }
                  : { color: "#FF9500", borderColor: "rgba(255,149,0,0.35)", background: "rgba(255,149,0,0.04)" }
                }
              >
                {converted ? (
                  <><CheckCircle size={12} /> converted +{convertable} coins!</>
                ) : converting ? "converting..." : (
                  <><TrendingUp size={12} /> convert {convertable.toLocaleString()} XP → {convertable} coins</>
                )}
              </motion.button>
              {cError && !conversionLocked && <p className="font-mono text-[10px] text-red-400 mt-2">{cError}</p>}
            </div>
          </motion.div>
        )}

        {/* Payout request */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="terminal-window mb-8">
          <div className="terminal-header">
            <Wallet size={10} className="ml-2 text-white/25" />
            <span className="font-mono text-[10px] text-white/25 ml-1">withdraw.sh</span>
          </div>
          <div className="p-5 space-y-4">
            {!canPayout ? (
              <div className="text-center py-4">
                <p className="font-mono text-xs text-white/30 mb-2">
                  {COINS.MIN_PAYOUT.toLocaleString()} coins needed to withdraw
                </p>
                <div className="w-full h-1.5 bg-white/6 rounded-full overflow-hidden mb-2">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, (pulseCoins / COINS.MIN_PAYOUT) * 100)}%`, background: "#FF9500" }} />
                </div>
                <p className="font-mono text-[10px] text-white/20">
                  {pulseCoins.toLocaleString()} / {COINS.MIN_PAYOUT.toLocaleString()} coins
                  ({(COINS.MIN_PAYOUT - pulseCoins).toLocaleString()} to go)
                </p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {pSuccess ? (
                  <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="text-center py-6">
                    <CheckCircle size={28} className="mx-auto mb-3" style={{ color: "#00FF41" }} />
                    <p className="font-mono text-sm text-neon-green mb-1">Request submitted!</p>
                    <p className="font-mono text-[10px] text-white/30">We&apos;ll process it within 3-5 business days.</p>
                  </motion.div>
                ) : (
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="space-y-4">
                    {/* Coin amount */}
                    <div>
                      <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">COINS TO WITHDRAW</p>
                      <input type="number" value={coins} onChange={e => setCoins(e.target.value)}
                        placeholder={`min ${COINS.MIN_PAYOUT.toLocaleString()}`}
                        className="w-full font-mono text-xs text-white/80 px-3 py-2 rounded outline-none transition-colors"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
                        onFocus={e => (e.target.style.borderColor = "rgba(0,255,255,0.35)")}
                        onBlur={e  => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                      />
                      {coins && parseInt(coins) >= COINS.MIN_PAYOUT && (
                        <p className="font-mono text-[10px] mt-1" style={{ color: "#00FF41" }}>
                          = ₹{(parseInt(coins) / COINS.COINS_PER_INR).toFixed(2)}
                        </p>
                      )}
                    </div>

                    {/* Method */}
                    <div>
                      <p className="font-mono text-[10px] text-white/30 mb-2 tracking-wider">PAYMENT METHOD</p>
                      <div className="flex gap-2">
                        {["upi", "bank"].map(m => (
                          <button key={m} onClick={() => setMethod(m)}
                            className="flex-1 font-mono text-xs py-2 rounded transition-colors"
                            style={{
                              color:      method === m ? "#00FFFF" : "rgba(255,255,255,0.35)",
                              background: method === m ? "rgba(0,255,255,0.08)" : "rgba(255,255,255,0.03)",
                              border:     method === m ? "1px solid rgba(0,255,255,0.3)" : "1px solid rgba(255,255,255,0.08)",
                            }}
                          >{m === "upi" ? "UPI" : "Bank Transfer"}</button>
                        ))}
                      </div>
                    </div>

                    {/* UPI fields */}
                    {method === "upi" && (
                      <div>
                        <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">UPI ID</p>
                        <input type="text" value={upiId} onChange={e => setUpiId(e.target.value)}
                          placeholder="yourname@upi"
                          className="w-full font-mono text-xs text-white/80 px-3 py-2 rounded outline-none transition-colors"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
                          onFocus={e => (e.target.style.borderColor = "rgba(0,255,255,0.35)")}
                          onBlur={e  => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                        />
                      </div>
                    )}

                    {/* Bank fields */}
                    {method === "bank" && (
                      <div className="space-y-3">
                        <div>
                          <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">BANK NAME</p>
                          <input type="text" value={bankName} onChange={e => setBankName(e.target.value)}
                            placeholder="State Bank of India"
                            className="w-full font-mono text-xs text-white/80 px-3 py-2 rounded outline-none transition-colors"
                            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
                            onFocus={e => (e.target.style.borderColor = "rgba(0,255,255,0.35)")}
                            onBlur={e  => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                          />
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div>
                            <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">ACCOUNT NUMBER</p>
                            <input type="text" value={accNum} onChange={e => setAccNum(e.target.value)}
                              placeholder="1234567890"
                              className="w-full font-mono text-xs text-white/80 px-3 py-2 rounded outline-none transition-colors"
                              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
                              onFocus={e => (e.target.style.borderColor = "rgba(0,255,255,0.35)")}
                              onBlur={e  => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                            />
                          </div>
                          <div>
                            <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">IFSC CODE</p>
                            <input type="text" value={ifsc} onChange={e => setIfsc(e.target.value.toUpperCase())}
                              placeholder="SBIN0001234"
                              className="w-full font-mono text-xs text-white/80 px-3 py-2 rounded outline-none transition-colors"
                              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
                              onFocus={e => (e.target.style.borderColor = "rgba(0,255,255,0.35)")}
                              onBlur={e  => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {conversionLocked && (
                      <p className="font-mono text-[10.5px] text-orange-400/80 flex items-center gap-1.5">
                        <Clock size={11} /> {CONVERSION_LOCKED_MESSAGE}
                      </p>
                    )}
                    {pError && <p className="font-mono text-[10px] text-red-400">{pError}</p>}

                    <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                      onClick={handlePayoutRequest} disabled={pSaving || conversionLocked}
                      className="w-full font-mono text-xs py-3 border transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      style={{ color: "#00FFFF", borderColor: "rgba(0,255,255,0.3)", background: "rgba(0,255,255,0.04)" }}
                    >
                      {pSaving ? "submitting..." : <><Wallet size={12} /> request payout</>}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </motion.div>

        </div>
        <div className="lg:col-span-2">

        {/* Transaction history */}
        {transactions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
            className="terminal-window mb-8">
            <div className="terminal-header">
              <Coins size={10} className="ml-2 text-white/25" />
              <span className="font-mono text-[10px] text-white/25 ml-1">earnings_ledger.log</span>
            </div>
            <div className="divide-y divide-white/5 max-h-72 overflow-y-auto">
              {transactions.slice(0, 30).map(t => {
                const meta = TX_LABELS[t.type] || { label: t.type, color: "#00FFFF" };
                const date = t.createdAt?.seconds ? new Date(t.createdAt.seconds * 1000) : null;
                return (
                  <div key={t.id} className="flex items-center gap-3 px-5 py-2.5">
                    <span className="font-mono text-xs flex-1" style={{ color: meta.color }}>{meta.label}</span>
                    <span className="font-mono text-[10px] text-white/25">{date ? date.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}</span>
                    <span className="font-mono text-xs text-neon-green flex-shrink-0">+{t.amount}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Past requests */}
        {requests.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="terminal-window">
            <div className="terminal-header">
              <Clock size={10} className="ml-2 text-white/25" />
              <span className="font-mono text-[10px] text-white/25 ml-1">payout_history.log</span>
            </div>
            <div className="divide-y divide-white/5">
              {requests.map(req => (
                <div key={req.id} className="flex items-center gap-3 px-5 py-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-mono text-sm font-semibold" style={{ color: "#00FFFF" }}>
                        ₹{(req.inrAmount || 0).toFixed(2)}
                      </span>
                      <span className="font-mono text-[10px] text-white/30">{(req.coins || 0).toLocaleString()} coins</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] text-white/25 border border-white/8 px-1.5 py-0.5 rounded">{req.method}</span>
                      {req.method === "upi" && req.upiId && (
                        <span className="font-mono text-[10px] text-white/30">{req.upiId}</span>
                      )}
                      {req.method === "bank" && req.accountNumber && (
                        <span className="font-mono text-[10px] text-white/30">••••{req.accountNumber.slice(-4)}</span>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        </div>
        </div>
      </div>
    </main>
  );
}
