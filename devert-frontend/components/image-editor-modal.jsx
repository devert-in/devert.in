"use client";

import FilerobotImageEditor, { TABS, TOOLS } from "react-filerobot-image-editor";

// Dark theme override matching DeVert's terminal aesthetic (neon green on
// near-black), applied to Filerobot's internal panels/buttons/sliders/etc.
// Keys are @scaleflex/ui's flat palette tokens (see node_modules/@scaleflex/ui/utils/types/palette/color.js).
const DEVERT_EDITOR_THEME = {
  palette: {
    "bg-primary": "#0c0c0c",
    "bg-primary-light": "#111111",
    "bg-primary-hover": "rgba(255,255,255,0.06)",
    "bg-primary-active": "rgba(0,255,65,0.1)",
    "bg-primary-stateless": "#1a1a1a",
    "bg-secondary": "#050505",
    "bg-stateless": "#0c0c0c",
    "bg-active": "rgba(0,255,65,0.1)",
    "bg-hover": "rgba(255,255,255,0.05)",
    "bg-tooltip": "#050505",
    "bg-grey": "#1a1a1a",
    "txt-primary": "rgba(255,255,255,0.85)",
    "txt-secondary": "rgba(255,255,255,0.5)",
    "txt-secondary-invert": "rgba(255,255,255,0.85)",
    "txt-placeholder": "rgba(255,255,255,0.3)",
    "accent-primary": "#00FF41",
    "accent-primary-hover": "#00e639",
    "accent-primary-active": "#00cc33",
    "accent-stateless": "#00FF41",
    "accent_0_5_opacity": "rgba(0,255,65,0.05)",
    "accent_1_2_opacity": "rgba(0,255,65,0.12)",
    "accent_1_8_opacity": "rgba(0,255,65,0.18)",
    "accent_2_8_opacity": "rgba(0,255,65,0.28)",
    "accent_4_0_opacity": "rgba(0,255,65,0.4)",
    "borders-primary": "rgba(255,255,255,0.1)",
    "borders-primary-hover": "rgba(0,255,65,0.4)",
    "borders-secondary": "rgba(255,255,255,0.06)",
    "borders-strong": "rgba(255,255,255,0.15)",
    "borders-item": "rgba(255,255,255,0.08)",
    "icon-primary": "rgba(255,255,255,0.6)",
    "icons-primary-hover": "#00FF41",
    "icons-secondary": "rgba(255,255,255,0.4)",
    "icons-invert": "#0c0c0c",
    "btn-primary-text": "#050505",
    "btn-secondary-text": "rgba(255,255,255,0.8)",
    "link": "#00FFFF",
    "link-hover": "#00FFFF",
  },
};

// Full-screen in-app image editor for Pulse post photos: crop (freeform +
// presets), rotate/flip, resize, pen/shape/text annotations, blur/pixelate
// (for redacting API keys, emails, etc. in screenshots), filters, and
// brightness/contrast/saturation/warmth adjustments - all client-side,
// no third-party site required.
export function ImageEditorModal({ src, onSave, onClose }) {
  return (
    <div className="fixed inset-0 z-[70]">
      <FilerobotImageEditor
        source={src}
        theme={DEVERT_EDITOR_THEME}
        onSave={(editedImageObject) => onSave(editedImageObject.imageBase64)}
        onClose={() => onClose()}
        closeAfterSave
        tabsIds={[TABS.ADJUST, TABS.ANNOTATE, TABS.FINETUNE, TABS.FILTERS, TABS.RESIZE]}
        defaultTabId={TABS.ADJUST}
        defaultToolId={TOOLS.CROP}
        Crop={{
          ratio: "original",
          presetsItems: [
            { titleKey: "square",       ratio: 1 },
            { titleKey: "portrait",     ratio: 4 / 5 },
            { titleKey: "widescreen",   ratio: 16 / 9 },
          ],
        }}
        Rotate={{ angle: 90, componentType: "slider" }}
        Text={{ text: "Label / caption..." }}
        annotationsCommon={{ fill: "#00FF41", stroke: "#00FF41" }}
        savingPixelRatio={3}
        previewPixelRatio={typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1}
        defaultSavedImageType="jpeg"
        defaultSavedImageQuality={0.92}
        avoidChangesNotSavedAlertOnLeave={false}
      />
    </div>
  );
}
