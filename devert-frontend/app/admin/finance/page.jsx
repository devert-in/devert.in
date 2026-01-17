"use client";

import { CreditCard, DollarSign, TrendingUp, Download } from "lucide-react";

export default function FinanceAdminPage() {
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold font-sans text-white mb-2">FINANCIAL OVERVIEW</h1>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-[#050505] p-6 border border-white/10 rounded-lg">
                    <div className="text-gray-500 text-xs font-mono uppercase mb-2 flex items-center gap-2">
                        <DollarSign size={14} /> TOTAL REVENUE
                    </div>
                    <div className="text-3xl font-bold text-white">$0.00</div>
                </div>
                <div className="bg-[#050505] p-6 border border-white/10 rounded-lg">
                    <div className="text-gray-500 text-xs font-mono uppercase mb-2 flex items-center gap-2">
                        <CreditCard size={14} /> PENDING PAYOUTS
                    </div>
                    <div className="text-3xl font-bold text-neon-cyan">$0.00</div>
                </div>
                <div className="bg-[#050505] p-6 border border-white/10 rounded-lg">
                    <div className="text-gray-500 text-xs font-mono uppercase mb-2 flex items-center gap-2">
                        <TrendingUp size={14} /> ACTIVE ESCROW
                    </div>
                    <div className="text-3xl font-bold text-neon-green">$0.00</div>
                </div>
            </div>

            <div className="p-12 text-center border border-dashed border-white/10 rounded-lg text-gray-600 font-mono">
                Transaction history module is ready for integration with Payment Gateway.
            </div>
        </div>
    );
}
