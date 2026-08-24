// Campus lives on its own origin since the "Split Campus into standalone
// devert-campus app" commit - production hardcodes campus.devert.in (see
// reset-password/page.jsx's loginHrefFor, which has its own reasons to stay
// hardcoded). Every other same-origin "/campus" link reads this instead, so
// setting NEXT_PUBLIC_CAMPUS_URL in devert-frontend/.env.local (e.g.
// http://localhost:3001) points them all at a locally-running devert-campus
// instance, letting local Campus changes be clicked through end-to-end
// without touching production.
export const CAMPUS_URL = process.env.NEXT_PUBLIC_CAMPUS_URL || "https://campus.devert.in";
