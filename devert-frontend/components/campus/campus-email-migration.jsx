import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, getDoc, doc, writeBatch } from "firebase/firestore";
import { CAMPUS } from "@/lib/campus-theme";
import { CampusCard, CampusButton } from "@/components/campus/campus-ui";
import { Mail, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

export function CampusEmailMigration({ institutionId }) {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const runMigration = async () => {
    setRunning(true);
    setProgress("Fetching student roster...");
    setResults(null);
    setError(null);
    try {
      // 1. Fetch all students in this institution
      const snap = await getDocs(collection(db, "institutions", institutionId, "students"));
      const students = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
      
      // 2. Filter students who are missing an email
      const missingEmails = students.filter(s => !s.email || s.email === "(no email on file)");
      
      if (missingEmails.length === 0) {
        setProgress(null);
        setResults({ updated: 0, orphaned: 0, totalMissing: 0 });
        setRunning(false);
        return;
      }
      
      let updatedCount = 0;
      let orphanedCount = 0;
      
      setProgress(`Found ${missingEmails.length} students missing emails. Synchronizing records...`);
      
      // Process in chunks of 30
      for (let i = 0; i < missingEmails.length; i += 30) {
        const chunk = missingEmails.slice(i, i + 30);
        const batch = writeBatch(db);
        
        const privateDocs = await Promise.all(
          chunk.map(async (s) => {
            const privateSnap = await getDoc(doc(db, "users_private", s.uid));
            return { uid: s.uid, data: privateSnap.exists() ? privateSnap.data() : null };
          })
        );
        
        let batchHasWrites = false;
        privateDocs.forEach((pDoc) => {
          if (pDoc.data && pDoc.data.email) {
            batch.update(doc(db, "institutions", institutionId, "students", pDoc.uid), {
              email: pDoc.data.email,
            });
            batchHasWrites = true;
            updatedCount++;
          } else {
            orphanedCount++;
          }
        });
        
        if (batchHasWrites) {
          await batch.commit();
        }
        
        setProgress(`Synchronized ${Math.min(i + 30, missingEmails.length)} of ${missingEmails.length} records...`);
      }
      
      setProgress(null);
      setResults({ updated: updatedCount, orphaned: orphanedCount, totalMissing: missingEmails.length });
    } catch (e) {
      console.error("Migration error:", e);
      setError(e.message || "An unexpected error occurred during migration.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <CampusCard className="p-6 mt-6 border border-dashed" style={{ borderColor: CAMPUS.line }}>
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: CAMPUS.tealTint, color: CAMPUS.teal }}>
          <Mail size={20} />
        </div>
        <div className="flex-1">
          <h3 className="text-[15px] font-semibold mb-1" style={{ color: CAMPUS.ink }}>Historical Email Synchronization</h3>
          <p className="text-[13px] mb-4" style={{ color: CAMPUS.inkSoft, lineHeight: 1.5 }}>
            Some earlier student accounts may display as <b>(no email on file)</b> due to a previous privacy policy that scrubbed emails from public profiles. This utility securely synchronizes the canonical email addresses from the private user registry into your campus roster.
          </p>
          
          {error && (
            <div className="rounded-lg p-3.5 mb-4" style={{ background: CAMPUS.badTint, color: CAMPUS.bad }}>
              <p className="flex items-center gap-1.5 text-[12px] font-semibold">
                <AlertTriangle size={14} /> Migration Failed
              </p>
              <p className="text-[11.5px] mt-1 opacity-90">{error}</p>
            </div>
          )}
          
          {results && (
            <div className="rounded-lg p-3.5 mb-4" style={{ background: CAMPUS.tealTint, color: CAMPUS.teal }}>
              <p className="flex items-center gap-1.5 text-[12px] font-semibold">
                <CheckCircle2 size={14} /> Synchronization Complete
              </p>
              <p className="text-[11.5px] mt-1 opacity-90">
                Found {results.totalMissing} records missing emails. Successfully updated {results.updated}. 
                {results.orphaned > 0 ? ` Could not resolve ${results.orphaned} orphaned records.` : ""}
              </p>
            </div>
          )}

          <div className="flex items-center gap-4">
            <CampusButton 
              onClick={runMigration} 
              disabled={running}
              style={{ background: CAMPUS.chromeBg, color: CAMPUS.chromeFg }}
            >
              {running ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Running...
                </>
              ) : (
                "Run Synchronization"
              )}
            </CampusButton>
            
            {progress && (
              <span className="text-[12.5px] font-medium animate-pulse" style={{ color: CAMPUS.teal }}>
                {progress}
              </span>
            )}
          </div>
        </div>
      </div>
    </CampusCard>
  );
}
