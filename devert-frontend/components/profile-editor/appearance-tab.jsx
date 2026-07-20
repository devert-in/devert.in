"use client";

import ThemePicker from "./theme-picker";
import SectionOrderEditor from "./section-order-editor";

export default function AppearanceTab({ theme, onThemeChange, sectionOrder, hiddenSections, onSectionsChange }) {
  return (
    <div className="space-y-10">
      <ThemePicker accent={theme.accent} onChange={accent => onThemeChange({ ...theme, accent })} />
      <SectionOrderEditor
        order={sectionOrder}
        hidden={hiddenSections}
        onChange={({ order, hidden }) => onSectionsChange(order, hidden)}
      />
    </div>
  );
}
