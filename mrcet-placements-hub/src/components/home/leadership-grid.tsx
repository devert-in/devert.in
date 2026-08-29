"use client";

import { motion } from "framer-motion";
import { leadership } from "@/lib/data/leadership";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

export function LeadershipGrid() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Institutional Leadership</h2>
        <p className="mt-2 text-sm text-foreground/60 sm:text-base">
          The vision and guidance driving MRCET&apos;s placement success story.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {leadership.map((member, index) => (
          <motion.div
            key={member.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.45, delay: index * 0.06 }}
          >
            <Card className="card-hover h-full">
              <CardContent className="flex h-full flex-col items-center gap-3 p-6 text-center">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg">{member.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-base font-bold leading-snug">{member.name}</h3>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gold-600">{member.title}</p>
                </div>
                <p className="text-sm italic text-foreground/65">&ldquo;{member.quote}&rdquo;</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
