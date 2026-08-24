// Shared framer-motion variants for DeVert Campus - so every screen's
// mount-in feels the same instead of each file inventing its own transition
// numbers. Plain variant objects (no framer-motion dependency added - it's
// already used by campus-ui.jsx and campus-learning.jsx). Pass via
// `variants={fadeIn} initial="hidden" animate="visible"`, or spread
// `{...fadeIn}` for a one-off `initial`/`animate`/`transition` triplet.

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.35, ease: "easeOut" } },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: "easeOut" } },
};

export const slideUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

// Wrap a list's parent in `variants={staggerContainer} initial="hidden"
// animate="visible"` and give each child `variants={slideUp}` - children
// stagger in automatically without each one declaring its own delay.
export const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
