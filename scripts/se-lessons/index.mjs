// Registry of authored Software Engineering Fundamentals lesson bodies, keyed by
// module id exactly as it appears in seModules. Add a module file, import it here,
// and scripts/write-se-lessons.mjs picks it up - a module absent from this map is
// left alone, which is what lets authoring roll out module by module rather than
// all at once.
//
// Keys inside each module file are LESSON IDS - the slug of the lesson title as
// produced by lib/se-curriculum-data.mjs's seeder. The writer never creates a
// lesson, so a mistyped id is reported as SKIPPED rather than silently seeding a
// lesson outside the curriculum.

import { WELCOME } from "./welcome.mjs";
import { THE_INTERNET } from "./the-internet.mjs";
import { REAL_APPLICATIONS } from "./real-applications.mjs";
import { AUTHENTICATION } from "./authentication.mjs";
import { CONNECTING_EVERYTHING } from "./connecting-everything.mjs";

export const SE_LESSONS = {
  welcome: WELCOME,
  "the-internet": THE_INTERNET,
  "real-applications": REAL_APPLICATIONS,
  authentication: AUTHENTICATION,
  "connecting-everything": CONNECTING_EVERYTHING,
};
