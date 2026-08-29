"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import type { RecruitmentStep } from "@/lib/data/companies";

export function RecruitmentTimeline({ steps }: { steps: RecruitmentStep[] }) {
  return (
    <ol className="relative flex flex-col gap-8 border-l-2 border-border-subtle pl-8">
      {steps.map((step, index) => (
        <motion.li
          key={step.title}
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.4, delay: index * 0.12 }}
          className="relative"
        >
          <span className="absolute -left-[2.55rem] flex h-8 w-8 items-center justify-center rounded-full bg-navy-gradient text-white shadow-md">
            <CheckCircle2 size={16} />
          </span>
          <p className="text-xs font-bold uppercase tracking-wide text-gold-600">Round {index + 1}</p>
          <h3 className="mt-0.5 text-base font-bold">{step.title}</h3>
          <p className="mt-1 text-sm text-foreground/65">{step.description}</p>
        </motion.li>
      ))}
    </ol>
  );
}
