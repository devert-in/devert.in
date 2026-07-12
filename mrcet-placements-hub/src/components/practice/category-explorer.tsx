"use client";

import { BookOpen } from "lucide-react";
import { practiceCategories } from "@/lib/data/practice";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

export function CategoryExplorer() {
  return (
    <Tabs defaultValue={practiceCategories[0].id}>
      <TabsList>
        {practiceCategories.map((category) => (
          <TabsTrigger key={category.id} value={category.id}>
            {category.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {practiceCategories.map((category) => (
        <TabsContent key={category.id} value={category.id}>
          <p className="mb-5 max-w-2xl text-sm text-foreground/60">{category.description}</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {category.topics.map((topic) => (
              <Card key={topic.title} className="card-hover h-full">
                <CardContent className="flex h-full flex-col gap-2 p-5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-100 text-gold-600 dark:bg-gold-500/15">
                    <BookOpen size={16} />
                  </span>
                  <h4 className="text-sm font-bold">{topic.title}</h4>
                  <p className="text-xs text-foreground/60">{topic.detail}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
