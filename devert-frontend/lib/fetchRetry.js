// One shared retry for the raw network layer under every Judge0-backed call
// (CodeLab run/submit, Arena, and contest coding questions - see lib/codelab.js
// and lib/contests.js). Reported live: a student mid-contest hit "Failed to
// fetch" on both "run sample tests" and "submit contest", with a healthy
// backend on the other end (verified directly - the Cloud Run service
// answered a fresh test request in under a second) - a live contest with
// hundreds of students hitting the same Cloud Run/Judge0 path concurrently is
// exactly the situation where a brief connection blip is expected sometimes,
// and previously the student's only recourse was to notice the error
// themselves and press the button again by hand.
//
// Deliberately narrow: this catches ONLY fetch() throwing outright (a
// TypeError - the request never got a response at all), never a resolved
// response with a bad status. A 4xx/5xx IS the server's real answer and each
// call site already has its own considered message for those - blanket-
// retrying a real error response is a different (and wrong) kind of fix.
export async function fetchWithRetry(url, options, { retries = 1, delayMs = 1200 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetch(url, options);
    } catch (err) {
      lastErr = err;
      if (attempt < retries) await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  throw lastErr;
}
