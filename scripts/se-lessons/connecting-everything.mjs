// Module 7 - Connecting Everything.
//
// Follows the authoring rules documented at the top of welcome.mjs.
//
// MODULE FRAME: this is the capstone. Modules 3-6 each taught one tier in
// isolation - frontend, backend, database, identity - and this is the module
// that makes a learner watch them work as one product. Every lesson here is
// grounded in DeVert's actual code, not an invented sample app, because the
// whole point is that a learner can go read the real file afterward. Two
// architectures run through every lesson: the common case (browser talks
// straight to Firestore, no devert-backend involved) and the exception (a
// real fetch to the Spring Boot service on Cloud Run, for email and CodeLab
// grading only). The final lesson builds Pulse's actual like button, end to
// end, because it already exists in the codebase exactly as described.

export const CONNECTING_EVERYTHING = {

  "the-full-request-lifecycle": {
    subtitle: "One click, and every tier it has to pass through",
    difficulty: "Intermediate",
    estimatedMinutes: 18,
    xpReward: 24,
    coinReward: 10,
    learningObjectives: [
      "Name every hop a request makes between a click and a pixel changing on screen",
      "Explain why DeVert's own lifecycle is usually shorter than the generic model, and where it isn't",
      "Recognise a real network round trip even when it's hidden behind one line of code",
    ],
    prerequisites: ["The Auth Mistakes That Cause Breaches"],
    story: `A bug report lands: "liking a post on Pulse feels laggy." The engineer who picks it up opens the codebase looking for the endpoint - a controller, a route, something in devert-backend that handles a like. There isn't one.

They almost close the ticket as "cannot reproduce, no such endpoint exists." That would be the wrong call. The request still happens - it just doesn't go where backend instinct expects. The click goes straight from a React event handler to Firestore, and the lag is a real network round trip to a database in another data centre, not to a server this team wrote.

You cannot debug a lifecycle you haven't actually mapped. Modules 3 through 6 taught you what a frontend does, what a backend does, what a database does, and how identity works - each on its own. Nobody has yet made you trace one click through all four in the same breath. That's this lesson, and it's the hinge the rest of the module turns on.`,
    problemStatement: `Knowing what a database index does and knowing what a fetch call does are both real knowledge. Neither tells you what happens, in order, when a user does one thing on a page you built.

That gap is exactly why "walk me through this request" is the interview question that separates people who've read about the pieces from people who've watched them fire in sequence. It's also why "it's slow" or "it's broken" is nearly useless as a bug report until someone narrows it to a tier - and narrowing it to a tier requires knowing which tiers a given feature actually touches, which, as the story above shows, is not always obvious from the outside.`,
    concept: `## The generic shape, end to end

Strip away any specific framework and a single request looks like this:

::: flow
Click -> browser assembles a request -> DNS resolves the host -> TCP/TLS handshake -> HTTP request sent -> server routes it to a handler -> handler runs business logic -> handler queries a database -> database returns rows -> handler shapes a response -> response travels back -> browser parses it -> UI re-renders -> pixels change
:::

That's roughly a dozen real steps for one click, and Modules 1 and 2 already covered most of them individually. This lesson's job is just gluing them into one chain you can hold in your head at once.

## Two lifecycles, one app

DeVert doesn't run that whole chain for most of what it does, and knowing which version you're looking at is the actual skill.

::: cards
Direct-to-Firestore (the common case) :: \`onSnapshot\`, \`getDoc\`, \`setDoc\` talk to Firestore's own servers straight from the browser via the client SDK. There is no devert-backend in this path at all - "the server that runs business logic" and "the database" have collapsed into one service, and its security rules do the job a backend's authorization layer would normally do.
Backend-mediated (the exception) :: Sending real email and grading CodeLab submissions go through the Spring Boot service on Google Cloud Run. This is the full generic chain, literally - a different hostname, its own DNS and TLS, an actual HTTP request \`devert-frontend\` constructs by hand, a Java controller that runs real logic, and *then* a call onward to Firestore or Judge0 from the server side.
:::

Nearly everything a student touches day to day - lessons, profiles, the leaderboard, Pulse - is the first kind. The second kind exists only for the two jobs a browser genuinely can't be trusted with: SMTP credentials and hidden test cases.

## Compressed doesn't mean skipped

The direct-to-Firestore path looks like it skips half the chain above. It relocates it instead. \`onSnapshot\` still resolves a hostname, still negotiates TLS, still sends real bytes to a real data centre, and can still be slow or fail like any network call. What's different is *where the business logic and authorization live*: instead of a controller method your team wrote, a Firestore security rule, evaluated on Google's servers, checks \`request.auth.uid\` and the shape of the write before it's allowed to commit. The rule is the handler. It just isn't Java.

## Where "the backend" actually is, per feature

::: checkpoint
A student says: "DeVert has no backend, so liking a post has basically zero network cost." What's wrong with that claim?
- ( ) Nothing - it's correct, Firestore reads are free
- (x) It treats "no custom server" as "no network hop at all" - the write still travels to a real remote service and can still be slow or fail
- ( ) Firestore runs inside the browser
- ( ) Likes don't use Firestore
> Firestore is still someone else's server, reached over the same internet Module 1 described. "No application server in the request path" describes who wrote the handler, not whether a network round trip happens.
:::`,
    walkthrough: `Trace a single like, concretely, tier by tier: a signed-in student taps the heart icon on a Pulse post.

1. **Browser** - the \`onClick\` handler fires. It optimistically flips the heart's colour and the count on screen *before* anything has been confirmed - that's a UI decision, not a network event yet.
2. **Client SDK** - the handler calls \`writeBatch\`, targeting two documents: a new \`pulse_likes\` record and an \`increment(1)\` on the post's \`likeCount\`.
3. **Network** - the SDK opens (or reuses) a connection to Firestore's servers. DNS, TLS, all of it, exactly as Module 1 described, just aimed at \`firestore.googleapis.com\` instead of a server DeVert runs.
4. **"Handler"** - Firestore evaluates the security rule for that write: is this user signed in, does the batch touch only the allowed fields, does \`likeCount\` move by exactly one. This is the entire backend logic for this feature, and it isn't code your team deployed.
5. **Database** - the write commits, or it's rejected and the whole batch fails.
6. **Back to every open client** - every browser with that post visible via \`onSnapshot\` receives the updated document and re-renders, not just the one that clicked.

Six real steps, one (5) inside a company DeVert doesn't operate, and step 4 replacing an entire controller with configuration. Compare CodeLab's "Run" button, the generic chain with nothing collapsed: a real \`fetch\` to a Cloud Run host, a Spring controller, a call out to Judge0, a JSON response your own code parses and renders. Same shape of chain, wildly different length.`,
    commonMistakes: [
      "Assuming 'no custom backend' means 'no request lifecycle' - the lifecycle still runs, just against someone else's server",
      "Treating Firestore security-rule evaluation as something that happens in the browser, when it happens on Firestore's servers before a write commits",
      "Forgetting that the two paths use entirely different hosts, which matters the moment CORS enters the picture (next lesson but one)",
      "Debugging a 'slow feature' by opening devert-backend first, for a feature that has no code there at all",
    ],
    industryPerspective: `Most production stacks make this chain considerably longer than DeVert's, not shorter: a load balancer, an API gateway doing auth and rate limiting, one or more microservices, a cache layer, sometimes a queue between the write and whatever reacts to it. Each hop answers a scaling or ownership problem, and each is also a place a request can fail or add latency.

DeVert sits at the other end of that spectrum, part of a broader pattern called BaaS - backend-as-a-service. Firebase, Supabase and similar products all make the same trade: collapse the middle tier, move authorization into the database's own rule engine. The pitch is real - less infrastructure to operate - and the cost is exactly what this project's own documentation names: the rules become the *entire* trust boundary, with nothing else behind them to catch a mistake.`,
    devertCaseStudy: `The clearest way to see both lifecycles is to compare two real files. \`components/pulse/pulse-app.jsx\`'s \`handleLike\` never imports \`fetch\` - it only ever touches \`writeBatch\`, \`increment\`, and the two Firestore documents mentioned above. \`lib/codelab.js\`'s \`runCode\` and \`submitCode\`, by contrast, read \`process.env.NEXT_PUBLIC_API_URL\`, build a real HTTP request, and \`await fetch(...)\` a Cloud Run URL that has nothing to do with Firestore at all.

Both are "DeVert." Neither is the whole picture on its own, and a learner who has only read one of those two files will misjudge how the other one works - which is exactly the trap the engineer in this lesson's story fell into.

One more detail worth holding onto for later lessons: \`runCode\` explicitly throws if \`NEXT_PUBLIC_API_URL\` is unset, rather than pretending the call succeeded. That's a deliberate error-handling choice, and it's the subject of a lesson two steps from here.`,
    knowledgeChecks: [
      {
        question: "In the generic request lifecycle, what does 'the handler runs business logic' correspond to when a DeVert feature talks directly to Firestore?",
        options: [
          "A Spring Boot controller method",
          "A Firestore security rule evaluating the write before it commits",
          "Nothing - there is no equivalent step",
          "The browser's own JavaScript",
        ],
        correctIndex: 1,
        explanation: "The rule is the handler. It runs on Firestore's servers, not the client's, and it's the only thing standing between a request and the database committing it.",
      },
      {
        question: "Why is it wrong to say a direct-to-Firestore write has 'no network cost'?",
        options: [
          "Firestore writes are always billed per byte",
          "The SDK still performs a real DNS/TLS/network round trip to Firestore's servers, which can be slow or fail",
          "Firestore requires a VPN",
          "It's actually correct - there is no network cost",
        ],
        correctIndex: 1,
        explanation: "Removing your own server from the path doesn't remove the network from the path. The call still crosses the internet to a real remote service.",
      },
      {
        question: "Which DeVert feature runs the full, uncollapsed generic lifecycle, including a real fetch to a server DeVert operates?",
        options: [
          "Viewing a lesson",
          "Liking a Pulse post",
          "Running or submitting code in CodeLab",
          "Following another user",
        ],
        correctIndex: 2,
        explanation: "CodeLab's run/submit calls are the one place the frontend constructs a real HTTP request to devert-backend on Cloud Run - the two jobs a browser can't be trusted to do itself.",
      },
    ],
    lab: {
      title: "Watch both lifecycles happen in one tab",
      brief: `You are going to open real devtools against the real platform and watch the two lifecycles produce genuinely different network traffic, so "collapsed" versus "full chain" stops being a description and becomes something you saw.`,
      steps: [
        "Open devert.in signed in, open DevTools' Network tab, and clear it.",
        "Like a Pulse post. Filter the network log for 'firestore' - you should see one or more requests to a googleapis.com host, not to devert.in itself.",
        "Now open CodeLab, pick any problem, and click Run. Filter for the API host instead (whatever NEXT_PUBLIC_API_URL resolves to) - you should see a distinct POST request that Firestore never touched.",
        "Compare the two requests' hosts, and note that one exists because devert-frontend wrote a fetch call and the other exists because the Firestore SDK wrote one for you.",
        "Reload the page and repeat the like. Notice the request happens again even though nothing in your own code changed - that's the SDK, not a cache.",
      ],
      starterCode: `// Nothing to write for this lab - it's an observation exercise.
// If you want to confirm which host your API calls actually hit, run this
// in the devtools console on any DeVert page:
console.log(process.env.NEXT_PUBLIC_API_URL);
// (This only works if you're running the dev build locally - production
// bundles inline the value at build time, so check the Network tab instead.)`,
    },
    assignment: {
      reflection: "In your own words, describe why 'DeVert has no backend' is true for some features and false for others. Name one feature of each kind.",
      observation: "Pick any product you use daily and guess, before checking anything, which of its features are likely backend-mediated versus a direct database read. Note your guesses.",
      practice: "Draw the twelve-step generic flow chart from memory, without looking back at this lesson, then compare it to the one above.",
    },
    summary: "A request's generic lifecycle runs about a dozen real steps from click to pixel: DNS, TCP/TLS, an HTTP request, server routing, business logic, a database query, and the trip back. DeVert runs that full chain only for its Spring Boot backend on Cloud Run, used exclusively for email and CodeLab grading. Everything else - the large majority of the app - talks directly to Firestore, where the security rules stand in for a handler's business logic and authorization. Collapsing the middle tier doesn't remove the network hop; it relocates the logic into rule configuration evaluated on someone else's servers, and that relocation is the entire subject of the coin-economy trust boundary this course has flagged before.",
    goingDeeper: `## Why BaaS lifecycles still need careful modelling

A shorter chain isn't a smaller problem - it relocates it. Every decision a controller would normally make has to be re-expressed as a rule Firestore evaluates declaratively, with no loop and no stack trace when it's wrong. A rule that correctly re-implements "only your own document, only this field, only by one" is a harder design exercise than the equivalent \`if\` statement, precisely because the rule language is deliberately limited.

::: didyouknow
Firestore's rule evaluation has a real, documented complexity budget - deeply nested \`get()\` calls inside a rule can hit resource limits, part of why the bounded-delta pattern favours flat, cheap checks over rules needing to read several other documents.
:::`,
    resources: [
      { kind: "link", title: "Firebase: How Cloud Firestore security rules work", url: "https://firebase.google.com/docs/firestore/security/get-started", description: "The official model for where rules sit in a Firestore request - read this once you've traced the like button yourself." },
      { kind: "link", title: "Google Cloud Run overview", url: "https://cloud.google.com/run/docs/overview/what-is-cloud-run", description: "What actually runs devert-backend, and why a container platform was the right fit for 'occasionally called, must scale to zero.'" },
    ],
    tags: ["request-lifecycle", "architecture", "integration"],
  },

  "calling-an-api-from-the-frontend": {
    subtitle: "Reaching past your own code, on purpose",
    difficulty: "Intermediate",
    estimatedMinutes: 18,
    xpReward: 25,
    coinReward: 10,
    learningObjectives: [
      "Construct a real fetch call with the correct method, headers and body for a JSON API",
      "Explain why checking a response's status is not optional",
      "Identify exactly which DeVert features make a real API call, and why the rest deliberately don't",
    ],
    prerequisites: ["The Full Request Lifecycle"],
    story: `A learner who has only ever used Firestore's SDK sits down to add a feature that has to call devert-backend, and freezes. Every other data operation in the codebase has been \`getDoc\` or \`onSnapshot\` - a function call that quietly does the networking for you. This one has none of that. There's a URL, a method, headers, a body to build by hand, and a response that might come back as almost anything.

That discomfort is the right instinct pointing at a true fact: calling an API is a different, more manual skill than calling a database SDK, and DeVert only asks for it in exactly two places. Everywhere else, the previous lesson's collapsed lifecycle means this skill never comes up. Here, it's the whole job.`,
    problemStatement: `A frontend and a backend are separate programs, often on separate machines, sometimes written in different languages. There is no shared memory, no direct function call between them - the only way one can ask the other for anything is to send it a message over the network and wait for a reply.

"Calling an API" is the name for constructing that message correctly: the right address, the right verb, the right shape of data, and then handling the fact that the reply might never come, or might come back saying no.`,
    concept: `## What a fetch call actually is

Under everything - axios, React Query, whatever a framework wraps around it - a browser talking to an API is four decisions:

::: cards
Method :: What kind of action - \`GET\` to read, \`POST\` to create or trigger something, \`PUT\`/\`PATCH\` to update, \`DELETE\` to remove. The server decides what each means; the client just has to say the right one.
Headers :: Metadata about the request. \`Content-Type: application/json\` tells the server how to parse the body. \`Authorization: Bearer <token>\` proves who's asking, when that matters.
Body :: The actual payload, for anything that isn't a plain GET - almost always a JSON string, built with \`JSON.stringify\`, never a raw JavaScript object.
Response handling :: The reply comes back as a stream you have to read and parse yourself, and its status code is not automatically checked for you.
:::

That last point is the one beginners miss most often, and it's covered properly in the next lesson - for now, just know that \`fetch\` resolving is not the same thing as the request succeeding.

## DeVert's two real API calls

Everything the previous lesson called "backend-mediated" goes through this pattern, and only through this pattern. \`lib/codelab.js\`'s \`runCode\` and \`submitCode\` build a request to \`\${NEXT_PUBLIC_API_URL}/api/coding/run\` and \`/api/coding/submit\` respectively - a real \`POST\`, a JSON body, and for \`submitCode\`, an \`Authorization\` header carrying the signed-in user's ID token, because grading has to know whose submission this is.

## The other 95% doesn't do this at all

Worth restating plainly, because it's easy to over-generalise from this lesson: lessons, profiles, Pulse, the leaderboard, notifications - none of it calls an API. It reads and writes Firestore directly. This lesson's pattern is the exception DeVert reaches for only when a browser genuinely cannot be trusted with something - real SMTP credentials, or hidden test cases a student must never see.

## Configuration, not a hardcoded string

The base URL is never typed literally into a component. It comes from \`process.env.NEXT_PUBLIC_API_URL\`, which differs between the mock/staging deployment and production. That's what lets the same frontend code point at different backends depending on where it's built - and it's also, deliberately, allowed to be *empty*: if it's unset, \`runCode\` throws a clear message instead of attempting a request to nowhere.

::: checkpoint
A teammate hardcodes \`fetch("https://devert-backend.onrender.com/api/coding/run", ...)\` directly inside a component. What's the concrete problem?
- ( ) Nothing, it will always work
- (x) It breaks the moment the backend's real URL changes or a second environment is deployed, since the address isn't configurable
- ( ) fetch cannot accept a full URL
- ( ) It's slower than using an environment variable
> The whole reason \`NEXT_PUBLIC_API_URL\` exists as a build-time env var is so devert-frontend can point at a mock/staging backend or production without a single line of component code changing.
:::`,
    walkthrough: `Build \`submitCode\`'s request the way \`lib/codelab.js\` actually does, one decision at a time.

1. **Read the base URL.** \`const base = process.env.NEXT_PUBLIC_API_URL || ""\`. If it's empty, stop and throw - there is nothing to call.
2. **Get proof of identity.** Grading has to be attributed to a real user, so \`await auth.currentUser.getIdToken()\` gets a fresh signed token from Firebase Auth (Module 6's territory, reused here).
3. **Build the request.** Method \`POST\`. Headers: \`Content-Type: application/json\` so the server knows how to parse the body, and \`Authorization: Bearer <token>\` so it knows who's submitting.
4. **Serialize the body.** \`JSON.stringify({ problemId, language, code, suppressReward })\` - not the raw object; \`fetch\` will not do this for you.
5. **Send it and wait.** \`await fetch(base + "/api/coding/submit", { method, headers, body })\`.
6. **Read the response as data, not success.** \`await res.json()\`, wrapped in a \`.catch(() => ({}))\` so a response that isn't valid JSON at all doesn't crash the caller outright.

Every one of those six steps is a deliberate decision someone made reading this exact lesson's material. Skip step 2 and grading can't tell whose code it's looking at. Skip step 4 and the server receives \`"[object Object]"\` instead of usable JSON.`,
    codeExample: {
      language: "javascript",
      code: `// A simplified version of lib/codelab.js's real submitCode().
async function submitCode({ problemId, language, code }) {
  const base = process.env.NEXT_PUBLIC_API_URL || "";
  if (!base) {
    throw new Error("Submissions aren't configured yet (NEXT_PUBLIC_API_URL is unset).");
  }
  if (!auth.currentUser) {
    throw new Error("Sign in to submit.");
  }

  const idToken = await auth.currentUser.getIdToken();

  const res = await fetch(base + "/api/coding/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + idToken,
    },
    body: JSON.stringify({ problemId, language, code }),
  });

  // Read the body as data first - res.ok is checked separately, in the
  // next lesson's territory, because a failed grade still returns JSON.
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}`,
      expectedOutput: `{
  "ok": true,
  "status": 200,
  "data": { "passed": true, "testsPassed": 8, "testsTotal": 8 }
}`,
    },
    commonMistakes: [
      "Passing a plain JavaScript object as the body instead of a JSON string - fetch will not stringify it for you",
      "Forgetting the Content-Type header and being confused when the server can't parse a perfectly well-formed body",
      "Hardcoding a backend URL instead of reading it from configuration, breaking the moment a second environment exists",
      "Assuming NEXT_PUBLIC_API_URL is always set, when the architecture deliberately allows it to be empty and expects callers to handle that",
    ],
    industryPerspective: `Almost every production frontend keeps its API calls behind a thin wrapper module rather than scattering raw \`fetch\` calls through components - exactly the shape of \`lib/codelab.js\`. That's not a style preference; it's the one place error handling, auth headers and the base URL get written once instead of copy-pasted at every call site, which is precisely how a missing \`Content-Type\` header turns into a two-hour debugging session shared by an entire team instead of one function.

It's also common for that same wrapper layer to be the first thing swapped out when a team adopts a data-fetching library like React Query or SWR - those libraries don't replace \`fetch\`, they wrap the same four decisions in retry, caching and loading-state logic. Understanding the raw shape first is what makes the library's defaults make sense later, rather than feeling like magic.`,
    devertCaseStudy: `\`lib/codelab.js\` is the whole reference for this lesson, and it's worth reading directly rather than taking this lesson's word for it: \`runCode\` (unauthenticated, used for the Playground and "Run" button) and \`submitCode\` (authenticated, used for actual grading) both follow the exact pattern above, differing only in whether an \`Authorization\` header is attached - because running code against sample tests doesn't need to know who you are, but a graded submission that awards XP absolutely does.

Both functions also share something this lesson hasn't covered yet: neither ever calls \`res.ok\` before deciding what to show a student. That's deliberate, and it's specifically because a 5xx response here isn't empty - it's \`CodeExecutionController\`'s generic error handler embedding the raw Java exception in \`data.error\`, which is meaningless and alarming shown verbatim to a learner. The next-but-one lesson covers exactly why raw errors need translating before they reach a UI.`,
    knowledgeChecks: [
      {
        question: "Why must a request body be passed through JSON.stringify before being sent?",
        options: [
          "fetch requires all bodies to be strings, and won't serialize a JavaScript object for you",
          "JSON.stringify makes the request faster",
          "It's optional and only affects formatting",
          "Because the server can't read JavaScript objects over HTTP under any circumstances",
        ],
        correctIndex: 0,
        explanation: "A request body sent over HTTP is bytes, not a live object reference. fetch does not stringify a plain object for you - passing one produces a useless '[object Object]' body.",
      },
      {
        question: "In submitCode, why is an Authorization header attached but not in runCode?",
        options: [
          "runCode is faster without it",
          "submitCode grades and awards XP, so the server needs to know whose submission it is; runCode only executes against sample tests and doesn't",
          "Authorization headers are required by all POST requests",
          "It's an arbitrary implementation detail with no reason",
        ],
        correctIndex: 1,
        explanation: "Identity only matters where the result has consequences. Grading attributes a real outcome to a real user; running code against visible sample tests carries no such stake.",
      },
      {
        question: "Why does NEXT_PUBLIC_API_URL come from an environment variable instead of being written directly into components?",
        options: [
          "Environment variables are faster to read",
          "So the same frontend code can point at different backends (mock/staging vs. production) without any component changing",
          "It's required by React",
          "To hide the URL from the browser entirely",
        ],
        correctIndex: 1,
        explanation: "The value differs by deployment. Reading it as configuration is what lets one codebase serve multiple environments; hardcoding it would tie the code to one specific backend forever.",
      },
    ],
    lab: {
      title: "Call a real public API by hand",
      brief: `You don't have credentials for devert-backend, so practice the exact same shape against a public API that exists specifically for this kind of exercise.`,
      steps: [
        "Open any page's devtools console (or a plain .html file with a <script> tag).",
        "GET a resource: fetch('https://api.github.com/users/octocat') then .then(r => r.json()).then(console.log). Read the resulting object.",
        "POST some JSON: fetch('https://httpbin.org/post', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hello: 'world' }) }).then(r => r.json()).then(console.log) - note how httpbin echoes back exactly what it received.",
        "Break it on purpose: send the POST again but pass body: { hello: 'world' } without JSON.stringify, and compare what httpbin says it received.",
        "Add a header and confirm httpbin saw it: add 'X-Test-Header': 'devert' to the headers object and find it in the echoed response.",
      ],
      starterCode: `// GET
fetch("https://api.github.com/users/octocat")
  .then(res => res.json())
  .then(data => console.log(data));

// POST with a JSON body
fetch("https://httpbin.org/post", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ hello: "world" }),
})
  .then(res => res.json())
  .then(data => console.log(data.json)); // httpbin echoes what it parsed`,
    },
    assignment: {
      reflection: "Explain, without looking back at the lesson, why submitCode needs an ID token and runCode doesn't.",
      practice: "Write a fetch call to any public JSON API of your choice, print the parsed response, then deliberately remove JSON.stringify and observe what breaks.",
      observation: "Open lib/codelab.js in the DeVert repo and find one detail this lesson didn't mention - a header, an error path, anything.",
    },
    summary: "Calling an API from the frontend means constructing a message by hand - a method, headers, a JSON-stringified body - and sending it across a real network boundary to a program your team doesn't control from this side. DeVert only does this for two features: running and submitting CodeLab code, both through lib/codelab.js's runCode and submitCode, which read the backend's URL from configuration rather than hardcoding it, and attach an Authorization header exactly when identity has consequences. Every other feature on the platform never does this at all - it talks to Firestore directly, as the previous lesson covered.",
    resources: [
      { kind: "link", title: "MDN: Using the Fetch API", url: "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch", description: "The canonical reference for every option fetch accepts." },
      { kind: "link", title: "httpbin.org", url: "https://httpbin.org", description: "A public service built specifically for practicing HTTP requests - it echoes back exactly what it received, which makes mistakes visible immediately." },
    ],
    tags: ["api", "fetch", "integration"],
  },

  "fetch-axios-and-what-they-actually-do": {
    subtitle: "Two ways to send the same request, and one thing that's neither",
    difficulty: "Intermediate",
    estimatedMinutes: 16,
    xpReward: 24,
    coinReward: 10,
    learningObjectives: [
      "Explain what fetch does natively and what axios adds on top of it",
      "Identify the one behavioural difference between them that causes the most bugs",
      "Explain why Firestore's onSnapshot is neither fetch nor axios, and what it is instead",
    ],
    prerequisites: ["Calling an API from the Frontend"],
    story: `A learner reads a tutorial that uses axios, then opens DeVert's actual \`lib/codelab.js\` expecting to find it imported somewhere, and it isn't. There's no axios in the entire frontend - just \`fetch\`, used directly, for exactly two API calls in the whole codebase.

That's not an oversight. It's a proportionality call: a library exists to solve a problem you have repeatedly, and a codebase with two API call sites doesn't have that problem yet. Understanding what axios actually buys you - and what fetch gives you for free - is what lets you make that same call correctly on your own projects, instead of importing a library out of habit.`,
    concept: `## What fetch actually does

\`fetch\` is a native browser API - no install, no import, available everywhere. It returns a promise that resolves once the response *headers* have arrived, not once the body is fully read, which is why reading a body is always a second \`await\` step (\`res.json()\`, \`res.text()\`).

## What axios adds

::: cards
Automatic JSON :: axios parses a JSON response body for you and hands you \`response.data\` directly - no separate \`.json()\` call.
Throws on error status :: A 404 or 500 response makes axios's promise *reject*, so a plain \`try/catch\` catches it. fetch does the opposite - more on that below.
Interceptors :: Code that runs on every outgoing request or incoming response, without editing every call site - a common place to attach an auth header globally or log every failure once.
Built-in timeout and cancellation :: A single \`timeout\` option, versus fetch needing a manually wired \`AbortController\`.
Works the same in Node and the browser :: Useful for isomorphic code; less relevant to a fully client-side app like DeVert.
:::

## The one difference that causes the most bugs

This is worth memorising on its own: **fetch only rejects on a genuine network failure - DNS not resolving, the connection dropping, no response at all.** A 404, a 401, a 500 - fetch treats every one of those as a *successful* fetch that happens to carry a non-2xx status. If you don't check \`res.ok\` (or \`res.status\`) yourself, a "Not Found" page can sail straight through your \`.then()\` as if it were the data you asked for. axios inverts this by default: any non-2xx status throws, landing in your \`catch\`.

Neither behaviour is wrong. They're different defaults, and the bug only happens when you assume the one you didn't check for.

::: checkpoint
A component does \`const data = await fetch(url).then(r => r.json())\` and then renders \`data.name\`. The server actually returned a 404 with a small JSON error body \`{ "error": "not found" }\`. What happens?
- ( ) fetch throws and the component shows an error boundary
- (x) The code runs fine, parses the error body as if it were real data, and data.name is undefined - probably rendering as blank rather than failing loudly
- ( ) The browser blocks the request
- ( ) JSON.parse refuses to parse an error response
> fetch resolved successfully - it got a response, just not the one the code expected. Nothing here checks res.ok, so a 404 is silently treated as data. This is precisely the gap axios closes by default, and precisely why any raw fetch call needs an explicit status check.
:::

## Neither of these is what Firestore uses

\`onSnapshot\` is not a wrapper around fetch and it isn't axios under the hood. It's a persistent, long-lived connection the SDK manages - closer to a stream than a request. A fetch call happens once and ends; an \`onSnapshot\` listener stays open, firing your callback again every time the underlying data changes, until you explicitly unsubscribe it. Confusing the two leads to a specific bug: treating a listener like a one-shot call and never calling its unsubscribe function, which leaks the connection every time the component using it unmounts.`,
    walkthrough: `Compare the identical request, first as fetch, then as axios, to see exactly where behaviour diverges.

**With fetch:** \`const res = await fetch(url); if (!res.ok) throw new Error("Request failed: " + res.status); const data = await res.json();\` - three explicit steps, and the middle one is the one people skip.

**With axios:** \`const { data } = await axios.get(url);\` - one line. If the server responds 404, this line throws immediately and a surrounding \`try/catch\` handles it; there's no separate status check because axios already did it.

Now the Firestore case, which is neither shape: \`const unsubscribe = onSnapshot(query(...), snap => { setPosts(snap.docs.map(d => d.data())); });\` - this line does not resolve once. It registers a callback that Firestore will call repeatedly, forever, until \`unsubscribe()\` is invoked - typically inside a \`useEffect\`'s cleanup function. Treating this like a fetch call - expecting it to "finish" - is the walkthrough's whole point: it's a subscription, not a request.`,
    codeExample: {
      language: "javascript",
      code: `// Same request, two libraries, genuinely different failure behaviour.

// --- fetch: resolves even on a 404, you must check status yourself ---
async function getUserFetch(id) {
  const res = await fetch("/api/users/" + id);
  if (!res.ok) {
    throw new Error("Request failed with status " + res.status);
  }
  return res.json();
}

// --- axios: throws automatically on any non-2xx status ---
// import axios from "axios";
async function getUserAxios(id) {
  const { data } = await axios.get("/api/users/" + id);
  return data; // a 404 here would have already thrown, landing in a catch
}

// --- onSnapshot: neither of the above - a subscription, not a request ---
function watchPosts(callback) {
  const q = query(collection(db, "pulse_posts"), orderBy("createdAt", "desc"));
  const unsubscribe = onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, err => {
    console.error(err);
  });
  return unsubscribe; // caller MUST call this on cleanup, or the listener leaks
}`,
      expectedOutput: `// fetch and axios both eventually produce the same shape of data on success:
{ id: "u_42", name: "Priya" }

// watchPosts never "returns" data - it calls its callback repeatedly:
// callback fired: [{ id: "p1", ... }, { id: "p2", ... }]
// callback fired again later: [{ id: "p1", ... }, { id: "p2", ... }, { id: "p3", ... }]`,
    },
    commonMistakes: [
      "Trusting a fetch response without checking res.ok, letting an error page or error JSON flow through as if it were valid data",
      "Assuming axios is required to call any API, when two call sites rarely justify a dependency",
      "Never calling onSnapshot's returned unsubscribe function, leaking a live connection every time the component unmounts",
      "Expecting Next.js's server-side fetch caching behaviour (used with output: 'export') to apply, when a fully static export has no server to cache anything on",
      "Reaching for AbortController-based cancellation on a Firestore listener, which uses unsubscribe instead - the two aren't interchangeable",
    ],
    industryPerspective: `Bundle size is the practical reason a lot of modern frontend teams default to plain \`fetch\` (or a tiny wrapper) rather than axios: axios is a real dependency shipped to every visitor, while \`fetch\` costs nothing extra because the browser already has it. Teams still reach for axios when they have many call sites and want interceptors and consistent error handling for free across all of them - the trade is dependency weight against consistency, and it genuinely goes either way depending on how much surface area there is to be consistent across.

The onSnapshot-versus-fetch distinction, meanwhile, is really a specific case of a bigger idea: polling versus pushing. A fetch call is you asking "what's the current state?" once. A subscription is the server telling you "here's what changed" as it happens. Chat apps, live dashboards, and collaborative editors all eventually need the second model, and getting comfortable with a subscription's different lifecycle - open, fire repeatedly, close - pays off well beyond Firestore specifically.`,
    devertCaseStudy: `DeVert's \`package.json\` has no axios dependency at all - both of its real API calls, in \`lib/codelab.js\`, use plain \`fetch\` directly, which is proportionate for exactly two call sites sharing one thin wrapper style. Both also explicitly \`.catch(() => ({}))\` around \`res.json()\`, precisely because a malformed or empty error response would otherwise throw a second, more confusing error on top of the first.

The onSnapshot side is everywhere else. \`pulse-app.jsx\`'s main feed opens a listener with \`setLoading(true)\` beforehand and \`setLoading(false)\` inside *both* the success and error callbacks - because a subscription that never fires doesn't resolve or reject the way a promise does, so the only way to know "we're done waiting for the first result" is to explicitly flip a flag inside the callback itself. That pattern - and the loading state it produces - is the entire subject of the next lesson.`,
    knowledgeChecks: [
      {
        question: "A server responds with a 500 status and a JSON error body. What does a plain fetch call do?",
        options: [
          "Rejects the promise automatically",
          "Resolves successfully - fetch only rejects on network failure, not on HTTP error status codes",
          "Throws a syntax error",
          "Retries the request automatically",
        ],
        correctIndex: 1,
        explanation: "fetch treats any received response, including a 500, as a resolved promise. Only checking res.ok (or res.status) yourself distinguishes success from an error response.",
      },
      {
        question: "What does axios do differently from fetch when a server responds with a 404?",
        options: [
          "Nothing - the behaviour is identical",
          "axios automatically rejects the promise on any non-2xx status, so a plain try/catch handles it",
          "axios retries the request up to three times",
          "axios silently ignores the response",
        ],
        correctIndex: 1,
        explanation: "This is the single most consequential difference between the two: axios's default error handling treats non-2xx as failure; fetch does not.",
      },
      {
        question: "Why is onSnapshot neither a fetch call nor an axios call?",
        options: [
          "It's actually built on top of fetch internally",
          "It registers a long-lived subscription that fires its callback repeatedly over time, rather than resolving once like a request",
          "It only works with axios installed",
          "There is no real difference",
        ],
        correctIndex: 1,
        explanation: "A request-response call happens once. onSnapshot opens a connection that stays open and calls your callback again every time the underlying data changes, until you explicitly unsubscribe.",
      },
    ],
    lab: {
      title: "Trigger the fetch bug on purpose",
      brief: `The gap between fetch resolving and a request actually succeeding is easy to describe and easy to miss in real code. Reproduce it deliberately so it's memorable.`,
      steps: [
        "In any devtools console, run: fetch('https://httpbin.org/status/404').then(r => console.log('ok:', r.ok, 'status:', r.status)) - notice the promise resolves fine.",
        "Now write code that would have been wrong: fetch('https://httpbin.org/status/404').then(r => r.json()).then(d => console.log('data:', d)).catch(e => console.log('caught:', e.message)) - watch it fail at .json() (no body), not at the status check you never wrote.",
        "Fix it properly: add an explicit if (!res.ok) throw new Error(...) before parsing, and confirm the catch now fires with a clear, deliberate message instead of a confusing JSON parse error.",
        "If you have Node with axios available, repeat the first request with axios.get('https://httpbin.org/status/404').catch(e => console.log('axios threw:', e.response.status)) and compare how immediately it fails.",
      ],
      starterCode: `// The bug: no status check
fetch("https://httpbin.org/status/404")
  .then(res => res.json())
  .then(data => console.log("data:", data))
  .catch(err => console.log("caught:", err.message));

// The fix: check res.ok before trusting the body
fetch("https://httpbin.org/status/404")
  .then(res => {
    if (!res.ok) throw new Error("Request failed: " + res.status);
    return res.json();
  })
  .then(data => console.log("data:", data))
  .catch(err => console.log("caught:", err.message));`,
    },
    assignment: {
      reflection: "Explain in two sentences why a fetch call resolving is not proof that a request succeeded.",
      practice: "Rewrite one of your own past fetch calls (or one from the lab) to explicitly check res.ok before parsing the body.",
    },
    summary: "fetch is a native, dependency-free way to send a request, but it only rejects on network failure - a 404 or 500 still resolves successfully, and checking res.ok is the caller's job. axios adds automatic JSON parsing, throws by default on any non-2xx status, and offers interceptors and built-in timeouts, at the cost of a real dependency. DeVert uses plain fetch for its two backend calls because two call sites don't justify a library. Firestore's onSnapshot is a third, different thing entirely - a persistent subscription that fires repeatedly rather than a one-shot request - and treating it like a fetch call is what causes leaked listeners.",
    resources: [
      { kind: "link", title: "MDN: Response.ok", url: "https://developer.mozilla.org/en-US/docs/Web/API/Response/ok", description: "Short and exact on what fetch does and doesn't consider a failure." },
      { kind: "link", title: "Firebase: Get realtime updates with Cloud Firestore", url: "https://firebase.google.com/docs/firestore/query-data/listen", description: "The official explanation of onSnapshot's subscription lifecycle, including when and why to unsubscribe." },
    ],
    tags: ["fetch", "axios", "firestore", "api"],
  },

  "cors-why-the-browser-blocked-you": {
    subtitle: "The browser's rule, not the server's, and not a bug",
    difficulty: "Intermediate",
    estimatedMinutes: 19,
    xpReward: 26,
    coinReward: 11,
    learningObjectives: [
      "Explain what the same-origin policy actually restricts and why it exists",
      "Read a CORS error and identify which header was missing or wrong",
      "Explain what a preflight request is and why some requests trigger one and others don't",
    ],
    prerequisites: ["Fetch, Axios and What They Actually Do"],
    story: `A working \`fetch\` call to devert-backend, tested from a local dev server, gets deployed - and immediately breaks. The console shows a request that never completes, and a red line: "has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource."

The instinctive reaction is to blame the network, or the server being down. Neither is true. The request reached the server. The server responded. The *browser* - not the server, not the network - looked at that response, decided the calling page wasn't allowed to see it, and threw it away before any application code ever ran. That's not a bug. It's the single security mechanism standing between "any website can silently make authenticated requests to any other site on your behalf" and the web as it actually works.`,
    problemStatement: `A browser tab can have your bank's site open in one tab and a malicious page in another, and that malicious page can absolutely make a request to your bank's servers using your own logged-in cookies - the browser attaches them automatically. What stops the malicious page from *reading the response* is the entire question this lesson answers.

Without that protection, any site you visit could quietly ask your bank for your balance, ask your email provider for your inbox, or ask any API you're authenticated with for your data, and read the answer. Something has to say no by default, and that something is the browser itself, enforcing a rule called the **same-origin policy**.`,
    concept: `## What "origin" actually means

An origin is the exact combination of scheme, host and port: \`https://devert.in\` and \`https://api.devert.in\` are *different origins*, even though they're clearly the same company - a different subdomain is enough. \`http://localhost:3000\` and \`http://localhost:8080\` are different origins too - only the port changed.

## The default rule

By default, a script running on origin A cannot read the response body of a request it makes to origin B, even if the request itself goes through and the server answers normally. The request happens. The response arrives at the browser. The browser hides it from the calling page unless origin B explicitly says "origin A is allowed to see this."

That permission is expressed as a response header: **Access-Control-Allow-Origin**. If it's missing, or doesn't match the calling page's origin, the browser blocks access to the response and your \`fetch\` promise rejects - which is exactly why this shows up as a network-looking failure even though the network worked perfectly.

## Preflight: the request that runs before your request

::: cards
Simple requests :: A plain GET, or a POST with only a few "safe" headers and a simple content type, goes straight through - the browser still checks the response header, but it doesn't ask permission first.
Requests that trigger a preflight :: A custom header (Authorization included), methods like PUT/PATCH/DELETE, or a Content-Type of application/json - which describes almost every real API call - all trigger a preflight.
What a preflight is :: The browser automatically sends an OPTIONS request first, asking "if I were to send this real request, with this method and these headers, would you allow it?" Only if the server answers yes does the browser send your actual request at all.
:::

## Reading a CORS error correctly

::: flow
"No Access-Control-Allow-Origin header" -> the server never sent permission for this origin -> "Method PATCH is not allowed" -> the preflight ran, but the server's allowed-methods list doesn't include PATCH -> a request that just hangs, no CORS message at all -> often not CORS at all - check for a network or DNS failure first
:::

::: checkpoint
A team's frontend calls their API from https://app.example.com. It works. They add a new admin panel at https://admin.example.com calling the exact same API, and it fails with a CORS error, even though the request method and headers are identical. Why?
- ( ) The admin panel has a bug in its fetch call
- (x) admin.example.com is a different origin from app.example.com, and the server's allowed-origins list doesn't include it yet
- ( ) CORS only allows one origin ever, permanently
- ( ) The API is down
> Same API, same method, same headers - only the calling origin changed, and that's the only thing CORS actually checks. The fix is adding the new origin to the server's configuration, not touching the frontend request at all.
:::

## CORS is a server decision, enforced by the browser

This is the detail that resolves most of the confusion: **the server decides who's allowed, and the browser enforces the decision.** A backend team configures which origins may call it; nothing about the frontend code can grant itself permission it wasn't given.`,
    walkthrough: `Trace a real CORS failure the way it actually happened on devert-backend, from its own source comments.

1. Originally, controllers used \`@CrossOrigin(origins = "*")\` per-endpoint - permissive, and scattered across every controller individually, which is itself a maintenance problem separate from security.
2. That was replaced with one central \`WebConfig\` class implementing \`WebMvcConfigurer\`, registering allowed origins from a single \`ALLOWED_ORIGINS\` environment variable - so adding a new preview channel or custom domain is a config change, not a redeploy touching multiple files.
3. The registration explicitly lists allowed methods: \`GET, POST, PUT, PATCH, DELETE, OPTIONS\`.
4. When an admin-accounts feature needed to send \`PATCH\` requests (to update a staff member's status or permissions), those requests failed in the browser with a generic "Failed to fetch" - not a clean HTTP error, because the *preflight* itself was being rejected; the real PATCH request never even left the browser.
5. The fix was adding \`PATCH\` to the allowed-methods list. Nothing about the frontend's request changed - the header configuration was the entire bug.

That's the whole lesson in one real incident: a request that looks completely correct in your own code can still fail, because the failure lives in configuration on the *other* side of the origin boundary, not in anything you wrote.`,
    codeExample: {
      language: "javascript",
      code: `// This fetch call is completely correct on the client side.
// If it still fails with a CORS error, the fix is NOT here - it's on the
// server, in its allowed-origins/allowed-methods configuration.
async function updateStaffStatus(staffId, status) {
  const base = process.env.NEXT_PUBLIC_API_URL || "";
  const idToken = await auth.currentUser.getIdToken();

  const res = await fetch(base + "/api/admin/staff/" + staffId, {
    method: "PATCH", // <- a method the server must explicitly allow
    headers: {
      "Content-Type": "application/json", // <- triggers a preflight
      "Authorization": "Bearer " + idToken, // <- also triggers a preflight
    },
    body: JSON.stringify({ status }),
  });

  if (!res.ok) throw new Error("Update failed: " + res.status);
  return res.json();
}

// What actually happens in the browser before the PATCH above is sent:
//   OPTIONS /api/admin/staff/123        (automatic, browser-generated)
//   -> server must respond with Access-Control-Allow-Methods including PATCH
//   -> only then does the browser send the real PATCH request above`,
      expectedOutput: `// If the server's allowed methods list is missing PATCH:
TypeError: Failed to fetch
// (No status code at all - the request never reached the network layer
// the application can inspect. The preflight itself was rejected.)

// After PATCH is added to WebConfig's .allowedMethods(...):
{ "id": "staff_7", "status": "active" }`,
    },
    commonMistakes: [
      "Trying to 'fix' a CORS error by changing something in the frontend request, when the permission is granted entirely by the server's configuration",
      "Assuming a CORS error means the request never reached the server - it usually did, and the server usually responded; the browser discarded the response",
      "Forgetting that adding a new custom header or a new HTTP method requires updating the server's allowed-headers/allowed-methods list, not just the client code",
      "Confusing a CORS failure ('Failed to fetch', no status code) with a genuine 4xx/5xx response, which are different failure classes needing different fixes",
      "Using a wildcard '*' for allowed origins on an endpoint that also accepts credentials, which browsers explicitly refuse to honour together",
    ],
    industryPerspective: `CORS is consistently one of the top sources of "it works locally, breaks in production" reports on real teams, precisely because local development often runs frontend and backend on the same host, or a dev proxy hides the cross-origin request entirely - so the very first time a team's code touches a genuine cross-origin call is the day it deploys.

The move from per-controller \`@CrossOrigin(origins = "*")\` annotations to one central, environment-driven configuration - exactly the change made in devert-backend's \`WebConfig\` - is a well-worn pattern for a reason: security-relevant configuration scattered across dozens of files is a security-relevant configuration nobody can audit. Centralizing it means "which origins can call us" is answerable by reading one file, not grepping the whole codebase.`,
    devertCaseStudy: `\`devert-backend/src/main/java/com/devert/backend/config/WebConfig.java\` is the entire CORS configuration for the platform's one real backend, and it's short enough to read in full: it registers \`/api/**\`, reads allowed origins from the \`ALLOWED_ORIGINS\` environment variable (split on commas), and lists allowed methods explicitly, with a comment noting exactly why \`PATCH\` had to be added after the fact - the AdminAccountController's status/permissions endpoints needed it, and its absence produced the generic "Failed to fetch" this lesson's walkthrough describes.

It uses \`allowedOriginPatterns\`, not \`allowedOrigins\` - a deliberate choice, because Firebase Hosting's preview-channel URLs follow a wildcard pattern, and only the pattern-matching variant of the method actually supports wildcards. Using the plain \`allowedOrigins\` method there would have silently failed to match any preview deploy, which is exactly the kind of CORS bug that looks like a mystery until you know to check which of the two nearly-identically-named methods was used.`,
    knowledgeChecks: [
      {
        question: "A fetch call to another origin completes on the server (visible in server logs) but the browser reports a CORS error. What actually happened?",
        options: [
          "The request never left the browser",
          "The server processed the request and responded, but the browser withheld the response from the calling script because no valid Access-Control-Allow-Origin permission was present",
          "The server crashed while handling the request",
          "The DNS lookup failed",
        ],
        correctIndex: 1,
        explanation: "CORS is enforced by the browser after the response has already arrived. The request and server-side processing both happened normally; only the calling script's visibility into the result was blocked.",
      },
      {
        question: "Which of these is most likely to trigger a CORS preflight request?",
        options: [
          "A plain GET request with no custom headers",
          "A POST with Content-Type: application/json and an Authorization header",
          "Loading an image from another origin",
          "A request to the same origin the page was served from",
        ],
        correctIndex: 1,
        explanation: "Custom headers (including Authorization) and a JSON content type are exactly the conditions that take a request out of the 'simple request' category and trigger an automatic OPTIONS preflight first.",
      },
      {
        question: "devert-backend added PATCH to its allowed-methods list after a real bug. What was the actual symptom before the fix?",
        options: [
          "A 405 Method Not Allowed with a clear message",
          "A generic 'Failed to fetch' with no HTTP status at all, because the preflight itself was rejected before the real PATCH request was ever sent",
          "The request succeeded but returned the wrong data",
          "A 401 Unauthorized error",
        ],
        correctIndex: 1,
        explanation: "When a preflight fails, the browser never sends the real request, so there's no HTTP status to inspect - just a generic network-looking failure, which is what made this bug harder to diagnose than an ordinary error response.",
      },
    ],
    lab: {
      title: "Watch a preflight happen",
      brief: `You can trigger and observe a real CORS preflight from any page's devtools, without touching devert-backend at all, using a public CORS-testing service.`,
      steps: [
        "Open devtools' Network tab on any page and clear it.",
        "In the console, run a simple GET to a permissive public API: fetch('https://api.github.com/users/octocat'). Check the Network tab - notice there is no separate OPTIONS request; this was a 'simple' request.",
        "Now run a POST with a JSON content type to the same kind of endpoint: fetch('https://httpbin.org/post', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }). Look for a request whose method is OPTIONS immediately before the POST - that's the preflight.",
        "Inspect the OPTIONS request's response headers for Access-Control-Allow-Origin and Access-Control-Allow-Methods, and compare them to what the actual POST needed.",
        "Deliberately try a cross-origin request likely to be blocked: open a page on one origin (or use a local file) and fetch() a URL known not to allow it, e.g. most bank or internal-tool URLs, and read the console's exact CORS error text.",
      ],
      starterCode: `// A "simple" request - no preflight
fetch("https://api.github.com/users/octocat");

// A request that triggers a preflight (custom Content-Type)
fetch("https://httpbin.org/post", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: "{}",
});

// Watch the Network tab: the second call produces an OPTIONS request
// FIRST, invisible to your own code, before the POST is ever sent.`,
    },
    assignment: {
      reflection: "Explain in your own words why CORS is enforced by the browser rather than the server, even though the server is the one granting permission.",
      observation: "Find one real CORS error in the wild (your own project, a public bug report, or the lab above) and identify exactly which header was missing or mismatched.",
      practice: "Write down the three conditions that turn a request into one that triggers a preflight, from memory, before checking this lesson again.",
    },
    summary: "CORS is the browser enforcing the same-origin policy: even when a cross-origin request reaches a server and gets a real response, the browser withholds that response from the calling script unless the server's Access-Control-Allow-Origin header explicitly permits that origin. Requests with custom headers, non-simple methods, or a JSON content type trigger an automatic OPTIONS preflight first, and a failed preflight shows up as a generic network-looking failure with no HTTP status at all. devert-backend centralizes this decision in one WebConfig class reading allowed origins from an environment variable - a real PATCH-related bug there is a live example of a preflight silently rejecting a request the frontend code had written correctly.",
    goingDeeper: `## Why credentials change the rules further

Requests that carry cookies or use \`credentials: "include"\` are held to a stricter standard: a server cannot answer such a request with a wildcard \`Access-Control-Allow-Origin: *\` - it must echo back one specific, real origin, and browsers will refuse the response otherwise. This is a deliberate extra safeguard: a wildcard-plus-credentials combination would mean "any site on the internet may make authenticated requests on this user's behalf and read the answer," which is exactly the attack the same-origin policy exists to prevent.

::: interview
"Why did adding an Authorization header suddenly cause an OPTIONS request that wasn't there before?" is a genuinely common interview question, and the answer is this lesson: a custom header takes a request out of the small "simple request" category the spec exempts from preflighting, so the browser has to ask permission first.
:::`,
    resources: [
      { kind: "link", title: "MDN: Cross-Origin Resource Sharing (CORS)", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS", description: "The definitive reference, including the exact preflight conditions and every relevant response header." },
      { kind: "link", title: "Spring: Cross Origin Requests", url: "https://docs.spring.io/spring-framework/reference/web/webmvc-cors.html", description: "The official Spring documentation for the WebMvcConfigurer pattern devert-backend's WebConfig actually uses." },
    ],
    tags: ["cors", "security", "http", "api"],
  },

  "loading-empty-and-error-states": {
    subtitle: "The three things a screen has to be able to say before it has real data",
    difficulty: "Intermediate",
    estimatedMinutes: 17,
    xpReward: 24,
    coinReward: 10,
    learningObjectives: [
      "Explain why a screen needs at least three distinct states before rendering real content",
      "Distinguish a genuine empty state from a loading state that never resolved",
      "Write an onSnapshot listener that sets all three states correctly",
    ],
    prerequisites: ["CORS: Why the Browser Blocked You"],
    story: `A new Pulse user signs up, and the feed is blank. For a fraction of a second, that blank feed and a *broken* feed look identical - nothing on the screen either way. If the loading state, the empty state and a failure had all been coded as "just don't show anything," this user would have no way to tell "the app is thinking" from "the app is empty" from "the app is broken," and neither would you, debugging it later from a screenshot.

Every one of those three situations is a real, distinct thing your code has to know it's in, and this is the lesson that makes them explicit instead of accidental.`,
    problemStatement: `Every screen that shows data fetched from somewhere else - Firestore, an API, anywhere - passes through a moment before that data has arrived, and has to account for the possibility that it never will, or that there's genuinely none to show.

A component that only knows how to render "here is the data" will render *something* wrong for two of those three situations by default: nothing at all, or a crash, or - worse - a fabricated placeholder that looks like real content but isn't.`,
    concept: `## The three states, named precisely

::: cards
Loading :: We have asked, and we don't have an answer yet. True from the moment a request or listener starts until the first real response arrives.
Empty :: We have an answer, and it is genuinely "there is nothing here." Not an error, not still loading - confirmed, real absence of data.
Error :: The request failed, or the listener reported a problem, and we do not have trustworthy data to show.
:::

Only after all three are ruled out does "render the real content" become the correct thing to do. Skipping straight to it is the single most common source of a screen that looks broken for a heartbeat, or worse, looks fine while lying.

## Why a fabricated placeholder is worse than an honest empty state

It's tempting to show a plausible-looking fake number - "0 likes," a greyed-out sample post - while data loads, reasoning that it looks less broken. It's the wrong instinct: a fabricated number that happens to load into a *real* one later is indistinguishable, for a moment, from the real one being wrong. An honest "loading" indicator, or an honest "no posts yet" message, never lies about what the app currently knows - even for a fraction of a second.

## Modelling this with onSnapshot

A one-shot fetch resolves once, so its three states map naturally onto a promise's own lifecycle: pending, resolved-with-data, rejected. A Firestore listener is different, per the previous two lessons - it's a subscription, not a promise - so the three states have to be tracked by hand, in local component state, exactly because there is no single moment it "finishes."

::: flow
Component mounts, loading = true -> onSnapshot registers -> first snapshot arrives -> loading = false, and now: empty if snap.docs.length === 0, otherwise render the real data -> OR the listener's error callback fires -> loading = false, error = true, and neither empty nor real data is shown
:::

## The trap of forgetting the error callback

\`onSnapshot\` takes a second, optional callback specifically for errors - a permissions-denied write to the security rules, a genuinely offline client, a malformed query. Omitting it doesn't make errors impossible; it makes them silent. \`loading\` simply never flips to \`false\`, and the screen is stuck looking like it's still thinking, forever, with no error ever surfaced anywhere a developer - or a user - could see it.

::: checkpoint
A component sets loading = true, opens an onSnapshot listener with no error callback, and a Firestore security rule denies the read entirely. What does the user see?
- ( ) A clear 'permission denied' error message
- (x) A spinner that never goes away, because the success callback never fires and there is no error callback to catch the failure and flip loading to false
- ( ) The previous page's content
- ( ) An empty state
> Without an explicit error callback, a denied or failed listener has no path to update state at all. The component is stuck exactly where it started - loading forever - which is a worse experience than an honest error message.
:::`,
    walkthrough: `Trace the three states through a real Pulse feed load, the way \`pulse-app.jsx\` actually structures it.

1. **Mount.** \`const [loading, setLoading] = useState(true)\` and \`const [posts, setPosts] = useState([])\` - loading starts true and posts starts as an empty array, deliberately indistinguishable from "genuinely no posts" until we know which one it is.
2. **Subscribe.** \`onSnapshot(query(...), successCallback, errorCallback)\` is called inside a \`useEffect\`, and its return value - the unsubscribe function - is returned from that same effect for cleanup.
3. **On success:** \`setPosts(snap.docs.map(...)); setLoading(false)\`. Loading ends here, and only here, for the happy path.
4. **On error:** \`console.error(err); setLoading(false)\`. Loading also ends here - the error path has its own way of turning the spinner off, entirely separate from the success path.
5. **In the render:** \`if (loading) return <Spinner />; if (posts.length === 0) return <p>no posts yet - be the first to post</p>; return posts.map(...)\` - three branches, checked in that order, each one only reachable once the ones before it are ruled out.

Notice step 5's empty-state text is not a generic "no data" - it's specific, honest, and slightly encouraging, because it's a real message written for a real product, not a placeholder nobody thought about.`,
    codeExample: {
      language: "javascript",
      code: `import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

function usePulseFeed(db) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "pulse_posts"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError(err);
        setLoading(false);
      }
    );

    return unsubscribe; // cleanup: stop listening when the component unmounts
  }, [db]);

  return { posts, loading, error };
}

function PulseFeed({ db }) {
  const { posts, loading, error } = usePulseFeed(db);

  if (loading) return "Loading feed...";
  if (error) return "Something went wrong loading the feed.";
  if (posts.length === 0) return "no posts yet - be the first to post";
  return posts.map(p => p.caption).join("\\n");
}`,
      expectedOutput: `// First render, before any snapshot arrives:
"Loading feed..."

// After the first snapshot, with zero documents:
"no posts yet - be the first to post"

// After the first snapshot, with real documents:
"My first post!\\nExcited to be here"`,
    },
    commonMistakes: [
      "Omitting onSnapshot's error callback, leaving loading stuck true forever when a read is denied or fails",
      "Rendering a fabricated placeholder number or sample item while loading, which is indistinguishable from real (and possibly wrong) data for a moment",
      "Checking for an empty array before loading has finished, so a real feed briefly flashes an incorrect 'no posts yet' message",
      "Treating an empty array as a falsy 'no data yet' signal identical to the initial state, instead of a separate, explicit loading flag",
      "Forgetting to return the unsubscribe function from useEffect, leaking the listener - covered fully by the previous lesson, but the bug shows up here first",
    ],
    industryPerspective: `Design systems at most product companies now ship pre-built loading, empty and error components specifically because engineers reliably forget one of the three under deadline pressure - it's common enough to have a name, "the missing state problem." Skeleton screens (grey placeholder shapes that mimic the real layout) are the industry's answer to loading specifically: they set an honest expectation of *shape* without claiming to show real data, which is the same principle as this lesson's "never fabricate a number" rule, applied to layout instead of content.

Empty states are also, in real products, treated as a genuine design opportunity rather than an afterthought - a well-written "no posts yet, be the first" nudges a specific next action, while a bare "No data" does nothing for the user standing at that exact moment of a brand-new account.`,
    devertCaseStudy: `\`pulse-app.jsx\`'s main feed is the reference implementation for this entire lesson: \`loading\` starts \`true\`, the \`onSnapshot\` call's error callback logs the error and sets \`loading\` to \`false\` right alongside the success path, and the actual empty-state copy in production is the plain, honest line \`"no posts yet - be the first to post"\` - never a fake sample post, never a placeholder count.

That "never fabricate" rule isn't unique to Pulse - it's a platform-wide convention. CodeLab's lesson code blocks fall back to a pre-authored *expected* output only when a real run genuinely fails, and they say so; nothing in DeVert invents a number and presents it as live data. Once you've internalized why - a fabricated value is indistinguishable from a real one being wrong, at exactly the moment a user or a developer most needs to trust what they're looking at - it stops feeling like a UI nicety and starts feeling like the same trust-boundary discipline this whole course has been building toward since Module 4's security rules.`,
    knowledgeChecks: [
      {
        question: "Why is a fabricated placeholder value (e.g. a fake '0 likes' while loading) worse than an honest loading indicator?",
        options: [
          "It's slower to render",
          "It's indistinguishable from a real value that happens to be wrong, undermining trust in the data the moment it matters most",
          "It uses more memory",
          "There's no real difference - both are fine",
        ],
        correctIndex: 1,
        explanation: "An honest loading state never claims to be real data. A fabricated placeholder that later gets replaced by real data is, for a moment, indistinguishable from real data being incorrect.",
      },
      {
        question: "What happens if an onSnapshot listener has no error callback and a security rule denies the read?",
        options: [
          "React throws a rendering error automatically",
          "The success callback fires with an empty result",
          "Nothing updates state at all - if loading started true, it stays true indefinitely, with no visible error",
          "The listener automatically retries with elevated permissions",
        ],
        correctIndex: 2,
        explanation: "Without an error callback, a failed listener has no path back into component state. Whatever state was set before the failure - typically 'loading' - just stays that way forever.",
      },
      {
        question: "In the correct render order, which check should happen last?",
        options: [
          "Checking if loading is true",
          "Checking if an error occurred",
          "Checking if the real data array is empty",
          "There is no meaningful order - all three can be checked in any sequence",
        ],
        correctIndex: 2,
        explanation: "Loading and error must both be ruled out first - only once you know a real, successful result has arrived can 'is it empty' be answered honestly, rather than confusing 'still loading' with 'genuinely nothing here.'",
      },
    ],
    lab: {
      title: "Build the three states, then break each one on purpose",
      brief: `Write a small onSnapshot-backed component locally (or trace one in DeVert's own devtools) and deliberately force each of the three states to confirm your code actually distinguishes them.`,
      steps: [
        "Write (or find, in pulse-app.jsx) a listener with all three states: loading, error, and the real data render, each behind its own explicit check.",
        "Force the loading state to be visible: add a short artificial delay before the query even runs, and confirm the loading UI actually shows rather than flashing past unnoticed.",
        "Force the empty state: point the same code at a query you know returns zero documents (a brand-new, empty collection, or a where() filter matching nothing) and confirm the honest empty message appears - not a blank screen, not a crash.",
        "Force the error state: temporarily query a collection your security rules deny (or simulate offline mode in devtools' Network tab) and confirm the error callback fires and loading correctly flips to false.",
        "Remove the error callback entirely and repeat the previous step - watch loading get stuck forever, exactly as this lesson describes.",
      ],
      starterCode: `function useCollectionState(db, collectionName) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, collectionName),
      (snap) => { setItems(snap.docs.map(d => d.data())); setLoading(false); },
      (err) => { setError(err); setLoading(false); } // remove this line to see the bug
    );
    return unsubscribe;
  }, [db, collectionName]);

  return { items, loading, error };
}`,
    },
    assignment: {
      reflection: "Describe, from memory, the correct order to check loading, error and empty, and explain what goes wrong if you check empty first.",
      observation: "Find a real app you use and force it offline mid-load (airplane mode, or devtools' offline toggle). Note whether it shows an honest error or gets stuck.",
      practice: "Add an explicit error callback to any onSnapshot listener you've written before that was missing one.",
    },
    summary: "Any screen showing data from Firestore or an API passes through three distinct states before real content is trustworthy to show: loading (no answer yet), empty (a confirmed, genuine absence of data) and error (the request or listener failed). Because onSnapshot is a subscription rather than a one-shot promise, all three have to be tracked explicitly in local state - most commonly a bug appears when the error callback is omitted, leaving loading stuck true forever. DeVert's own convention, seen throughout the platform, is to never fabricate a placeholder number or sample item to paper over loading - an honest 'no posts yet' is always safer than something that merely looks like real data.",
    resources: [
      { kind: "link", title: "Firebase: Handle listen errors", url: "https://firebase.google.com/docs/firestore/query-data/listen#events-metadata-changes", description: "The official onSnapshot error-callback signature and when it fires." },
      { kind: "link", title: "Nielsen Norman Group: Progress Indicators", url: "https://www.nngroup.com/articles/progress-indicators/", description: "Why an honest loading state materially changes how long a wait feels acceptable." },
    ],
    tags: ["ui-states", "firestore", "onsnapshot", "error-handling"],
  },

  "where-state-lives-across-the-stack": {
    subtitle: "Not everything belongs in one global box",
    difficulty: "Intermediate",
    estimatedMinutes: 17,
    xpReward: 24,
    coinReward: 10,
    learningObjectives: [
      "Distinguish server state, global client state and local component state",
      "Explain why DeVert has exactly one global React Context and what actually lives in it",
      "Decide, for a piece of new state, which of the three categories it belongs in",
    ],
    prerequisites: ["Loading, Empty and Error States"],
    story: `A learner building their first multi-page app puts everything into one giant global store - the current user, every page's form inputs, whether a modal is open, the results of three different data fetches - because it's the only pattern they've been taught, and it's genuinely simpler to reach for one box than to decide, each time, where something belongs.

Six weeks in, changing one dropdown's open/closed state re-renders half the app, because everything is wired to the same global object. The fix isn't a better global store. It's noticing that "is this dropdown open" was never global information to begin with - it was one component's own business, and it should have stayed there.`,
    problemStatement: `Every piece of state in an app is genuinely one of a small number of kinds, and each kind has a natural, correct place to live. Treating them as interchangeable - shoving local UI state into a global store, or re-fetching server data into local state that drifts out of sync with the real source of truth - is where most "why did this re-render" and "why is this stale" bugs actually come from.`,
    concept: `## The three kinds of state

::: cards
Server state :: Data that actually lives somewhere else - a database row, a Firestore document - and that your component is only ever *reflecting*, never truly owning. It can change underneath you at any moment, from another tab or another user.
Global client state :: Information genuinely needed in many unrelated places at once - who is currently signed in is the textbook example, because dozens of components across the whole app need to know it.
Local component state :: Everything that only matters to one component's own rendering - is this dropdown open, what has the user typed into this one field so far, which tab is selected on this one screen.
:::

Most real bugs about state come from misclassifying something - most often, treating local state as global, or treating server state as if it were plain local state you fully own.

## Why DeVert has exactly one global context

\`AuthContext\` is the platform's single global React Context, and what it actually holds is narrow and deliberate: the signed-in \`user\` object, their live \`userData\` profile document, a \`loading\` flag for whether auth has resolved yet, and \`isAdmin\`/\`isSuperAdmin\`/\`adminChecked\`, derived from custom claims on the user's ID token. Every one of those genuinely is needed almost everywhere - the navbar, every gated route, every write that needs to know whose write it is.

Almost nothing else on the platform is global state. A Pulse post's like count, a lesson's completion status, whether a modal is open - all of that is local to the component whose own \`onSnapshot\` listener or \`useState\` call owns it, precisely because dropping it all into one shared context would mean an unrelated part of the app re-renders every time any of it changes, exactly like the story above.

## Server state deserves its own category, not a demotion to "just state"

The previous lesson's loading/empty/error pattern exists specifically because server state behaves differently from state you invented yourself: it can be wrong, absent, slow to arrive, or change out from under you while you're looking at it. A \`useState\` holding a form's current input value doesn't need a loading flag - it was never fetched from anywhere. A \`useState\` mirroring an \`onSnapshot\` result absolutely does, because it's a local *copy* of something that lives elsewhere and might not have arrived yet.

::: checkpoint
A team stores a Pulse post's live likeCount inside their one global app-wide Context, reasoning "state should all be in one place for consistency." What's the practical cost?
- ( ) None - it's a valid choice
- (x) Every component subscribed to that Context re-renders whenever any post's like count changes anywhere in the feed, even components with no visible connection to that post
- ( ) The like count will be wrong
- ( ) Context cannot hold numbers
> A single shared Context re-renders every consumer on any change to any part of it. A value that only a handful of components ever need - a single post's own like count - belongs local to that post's own component or its own listener, not centralized where an unrelated update anywhere else triggers a needless re-render everywhere.
:::

## Optimistic local state, reconciled by the real source of truth

One more pattern worth naming precisely, because the next lesson builds an entire feature on it: it's common to update local state *immediately* on a user action - flip a heart icon the instant it's tapped - before the server write has actually confirmed, purely so the UI feels instant. That's not a violation of "server state is the real owner" - it's a temporary, optimistic guess, and the *actual* onSnapshot update that arrives moments later is what silently confirms or corrects it. The local state was never pretending to be more authoritative than the real document; it was buying a few hundred milliseconds of perceived speed.`,
    walkthrough: `Trace where three different pieces of state on a single Pulse screen actually live, and why each landed there.

1. **Who's signed in** (\`user.uid\`, used to know whose like this is) - lives in \`AuthContext\`, because the like button, the comment box, the follow button and the navbar all need it simultaneously, and none of them are meaningfully "closer" to that information than any other.
2. **The post's live likeCount** - lives in the feed component's own \`onSnapshot\` result, re-derived every time Firestore pushes an update, because it's server state that only this feed (and this post's own card) has any reason to render.
3. **Whether *this* card's comment drawer is open** - lives in a plain \`useState(false)\` inside that one card component, because no other component on the page has ever needed to know or care.

Notice the pattern: the more components genuinely need a value at the same moment, the more global it belongs; the more a value is actually a live copy of something Firestore owns, the more it needs the previous lesson's loading/empty/error handling wrapped around it; and the more a value is purely about one component's own momentary rendering decision, the more strongly it belongs local and nowhere else.`,
    commonMistakes: [
      "Reaching for a new global Context or store for state only one or two components actually need, causing unrelated re-renders across the app",
      "Copying a Firestore document into local state once and never resubscribing, so the local copy drifts out of sync with real, live data",
      "Treating optimistic local state as if it were the final answer, and never reconciling it against the real onSnapshot update that follows",
      "Storing derived values (e.g. a filtered or sorted copy of a list) as their own separate state instead of computing them from the real source each render",
    ],
    industryPerspective: `The React ecosystem has, over the last several years, converged on almost exactly this three-way split, formalized as separate tools: libraries like React Query or SWR exist specifically to manage server state (caching, revalidation, loading/error handling) as a distinct concern from client state, while Redux, Zustand or plain Context are reserved for the smaller amount of state that's genuinely global and client-owned. Teams that used one general-purpose global store for everything - a common default a few years ago - have largely moved away from it exactly because of the re-render and staleness problems this lesson describes; the fix wasn't a better global store, it was recognizing that most state was never global to begin with.

Firestore's \`onSnapshot\` effectively plays the role a server-state library plays elsewhere - DeVert doesn't need React Query, because the SDK it already uses provides the equivalent caching and live-update behaviour on its own.`,
    devertCaseStudy: `\`AuthContext.js\` is short enough to read end to end, and its shape confirms the "narrow and deliberate" claim above precisely: \`user\`, \`userData\`, \`loading\`, \`isAdmin\`, \`isSuperAdmin\`, \`adminChecked\` - six pieces of state, every one of them genuinely needed in unrelated corners of the app at the same time, and nothing else. \`isAdmin\` and \`isSuperAdmin\` are derived once, from the ID token's custom claims, inside the same \`onAuthStateChanged\` callback that sets \`user\` - deliberately resolved together so a caller doesn't have to reason about two different "is this ready yet" signals.

Everywhere else - Pulse's likes and comments, CodeLab's problem state, a lesson's own completion tracking - is local to the component or page whose own \`onSnapshot\` listener reads it. That's not an accident of a small codebase; it's the direct consequence of this lesson's principle applied consistently: a second global Context for "Pulse state" would mean an unrelated page re-renders every time any post, anywhere, gets a new like - for no benefit, since no other page ever reads that value.`,
    knowledgeChecks: [
      {
        question: "Why does DeVert keep AuthContext as its only global React Context, rather than adding more?",
        options: [
          "React only allows one Context per app",
          "Almost everything else is either local to one component or a live copy of server data best handled by its own onSnapshot listener, so nothing else is genuinely needed in many unrelated places at once",
          "Global Context is faster than local state",
          "Firestore requires a single Context to function",
        ],
        correctIndex: 1,
        explanation: "The test for 'should this be global' is whether many unrelated parts of the app truly need it simultaneously. Almost nothing on DeVert besides identity meets that bar.",
      },
      {
        question: "What's the main practical cost of putting narrowly-scoped state (like one post's like count) into a single global Context?",
        options: [
          "It becomes slower to read",
          "Every component subscribed to that Context re-renders on any change to any part of it, even unrelated parts",
          "It can no longer update in real time",
          "There is no real cost",
        ],
        correctIndex: 1,
        explanation: "A shared Context re-renders every consumer whenever any part of its value changes. Narrow state that only a couple of components need is cheaper and more correct kept local to them.",
      },
      {
        question: "A component flips a like button's colour instantly on tap, before the Firestore write has confirmed. What is that local state actually doing?",
        options: [
          "Replacing the need for the real Firestore write entirely",
          "Providing a temporary, optimistic guess that the incoming onSnapshot update will confirm or correct moments later",
          "Nothing - it's a bug",
          "Permanently overriding the server's value",
        ],
        correctIndex: 1,
        explanation: "Optimistic local state is a deliberate, temporary stand-in for perceived speed. It never claims to be more authoritative than the real document - the next real update reconciles it.",
      },
    ],
    lab: {
      title: "Classify a page's own state",
      brief: `Pick any page you've built, or any DeVert screen you can open, and sort every piece of state on it into the three categories - the exercise is faster than it sounds and immediately reveals anything misplaced.`,
      steps: [
        "Pick a page (your own project, or open Pulse's feed in DeVert and read pulse-app.jsx).",
        "List every distinct piece of state you can find - every useState, every Context value read, every onSnapshot result.",
        "For each one, write one of: SERVER (a live copy of something Firestore/an API owns), GLOBAL (genuinely needed in many unrelated places), or LOCAL (only this component cares).",
        "For anything marked GLOBAL, ask yourself honestly whether a second, more distant component actually reads it today - if not, it's probably LOCAL wearing a global costume.",
        "For anything marked SERVER, confirm it has the previous lesson's loading/error handling around it, not just a bare useState.",
      ],
      starterCode: `// A worked classification for pulse-app.jsx's PostCard component:
//
// user, userData, isAdmin        -> GLOBAL (from AuthContext)
// posts (feed's onSnapshot result) -> SERVER (live copy of pulse_posts)
// localLiked, localLikes          -> LOCAL, but doing optimistic duty for
//                                    a SERVER value (post.likeCount) -
//                                    reconciled by the next onSnapshot push
// showComments, showDetail        -> LOCAL (only this card's own UI)`,
    },
    assignment: {
      reflection: "Pick one piece of state from your own project and explain which of the three categories it belongs in, and why you originally put it somewhere else (if you did).",
      practice: "Read AuthContext.js in the DeVert repo and list every value it exposes, in one sentence each, on why it needs to be global rather than local.",
    },
    summary: "State comes in three genuinely different kinds: server state, which your component only ever reflects and which can change underneath you; global client state, needed simultaneously in many unrelated places, of which DeVert has exactly one example (AuthContext, holding identity and admin status); and local component state, which belongs to one component's own rendering and nowhere else. Most real state bugs come from misclassifying something - most commonly treating narrowly-needed local state as if it deserved a global home, which causes unrelated re-renders across the app. Optimistic local updates (flipping a like instantly on tap) are a deliberate, temporary exception - a guess the real onSnapshot update reconciles moments later, not a replacement for the server being the actual source of truth.",
    resources: [
      { kind: "link", title: "React docs: Sharing state between components", url: "https://react.dev/learn/sharing-state-between-components", description: "The official framing of 'lift state up only as far as it needs to go' - the local/global half of this lesson." },
      { kind: "link", title: "TkDodo: Practical React Query", url: "https://tkdodo.eu/blog/practical-react-query", description: "Written for React Query specifically, but the opening posts explain the server-state-versus-client-state split clearly regardless of which tool you use for it." },
    ],
    tags: ["state-management", "react-context", "architecture"],
  },

  "building-one-feature-end-to-end": {
    subtitle: "The like button, every tier, in order",
    difficulty: "Intermediate",
    estimatedMinutes: 30,
    xpReward: 30,
    coinReward: 13,
    learningObjectives: [
      "Build one small feature across the UI, the data layer, the trust boundary and the real-time update, in the right order",
      "Explain what plays the role of 'the backend' when there is no custom server for a given feature",
      "Identify exactly where each of this module's previous six lessons shows up inside a single real feature",
    ],
    prerequisites: ["Where State Lives Across the Stack"],
    story: `Every lesson in this module has been one slice of a single picture: the request lifecycle, calling an API, fetch versus axios, CORS, loading states, where state lives. None of it has shown all six at once, on one feature, because a lesson has to isolate a thing to teach it clearly.

This lesson doesn't isolate anything. It builds Pulse's like button - a feature that already exists, in production, in \`pulse-app.jsx\` and \`firestore.rules\`, exactly as described here - from an empty file to a working, real-time, trust-boundary-respecting feature. Every decision along the way is a callback to something a previous lesson in this course already taught you, and by the end you should be able to point at each one and say which module it came from.

This is the lesson where it clicks. That's not a slogan - it's the actual title this course's own roadmap gives this module, and it's true because a feature, unlike a lesson, doesn't let you look at only one tier at a time.`,
    problemStatement: `"Add a like button" sounds like a UI task. It is not. It requires deciding where the count lives, who's allowed to change it and by how much, what the user sees in the half-second before the write confirms, what every *other* user watching the same post sees a moment later, and what happens if any of that fails. A feature is small only when every one of those questions already has an obvious answer - and for a first feature, none of them do yet.

This lesson answers each question in order, the way an engineer actually would, rather than presenting a finished file and asking you to admire it.`,
    concept: `## The feature, named precisely

A signed-in user taps a heart on a Pulse post. The count goes up by exactly one, immediately, for them. Every other user currently looking at that post sees the count update too, within moments, without reloading. Tapping again removes the like. Nobody can inflate their own post's count, and nobody can move it by more than one at a time - not even by editing requests in devtools.

## Deciding where each responsibility lives

::: cards
The UI layer :: A button, an icon that changes colour, a number next to it, and a click handler. This is the only part of the feature most tutorials show.
The trust boundary :: Something has to stop a user from writing likeCount: 999999 directly. Module 4 taught you this has to be enforced somewhere the client can't reach. Here, per this module's very first lesson, that "somewhere" is a Firestore security rule, not a controller - there is no custom backend for this feature at all.
The write itself :: A batched Firestore write, from lesson one's "direct-to-Firestore" lifecycle, not a fetch call - liking a post is not one of the two jobs (email, code grading) that need devert-backend.
The real-time reflection :: An onSnapshot listener, per two lessons ago, so every viewer's count updates without a manual refresh - and per the loading/empty/error lesson, that listener needs to know what to show before its first result arrives.
The state that isn't global :: Per the previous lesson, none of this belongs in AuthContext. The like count is server state local to the feed; only whether *this user* has liked *this post* needs checking against their own uid.
:::

## Step 1: the trust boundary, decided before any UI exists

Decide the rule before writing a single component, because the rule is what makes every later step safe. A non-owner may touch \`pulse_posts/{postId}\`'s \`likeCount\` field, and only that field, and only by exactly +1 or -1 in a single write - never an arbitrary number, never alongside changes to any other field. This is the same bounded-delta shape this course's own documentation names as the load-bearing pattern behind DeVert's entire coin economy: a non-owner moves a shared counter by a validated ±1, never anything else.

::: mistake
Writing the UI first and "adding security later" is backwards, and it's exactly how a bounded-delta rule gets forgotten. Decide what a non-owner is allowed to do to shared data *before* any component gives them a button to try it with.
:::

## Step 2: the write, from the client that will use it

The like handler needs to do two things atomically - record *that this user* liked *this post* (so a second tap can be recognized as "already liked" and toggle it off), and adjust the shared counter. Both belong in one \`writeBatch\`, so they either both succeed or neither does; a Firestore document at \`pulse_likes/{postId}_{uid}\` is the record, and \`increment(1)\` on the post's \`likeCount\` is the counter move - both allowed, together, by exactly the rule from Step 1.

## Step 3: what the user sees before the write confirms

A write to Firestore is still a real network round trip, and waiting for it before changing the icon's colour would make every like feel sluggish. So local state flips optimistically, immediately, on tap; the batch commits moments later; and the real \`onSnapshot\` update that follows either silently confirms the UI's guess or - rarely, on a failed write - corrects it back.

## Step 4: what everyone else sees

Nothing in Steps 1-3 pushes an update to other viewers. That's what \`onSnapshot\` is for: the post document changed, so every open listener on it - not just the one who clicked - receives the new \`likeCount\` and re-renders, at no extra cost, because the feed was already using \`onSnapshot\` rather than a one-shot \`getDocs\`.

## Step 5: loading, empty, and a double-tap that can't double-count

Before the feed's first snapshot arrives, the previous lesson's loading state applies to the whole list. And a small but real bug needs its own guard: a fast double-tap firing two \`writeBatch\` calls before the first one's local state updates could increment twice for one like. A busy flag - disable the button mid-flight - closes that gap.`,
    walkthrough: `Build the feature in the order an engineer actually would, checking each step against the real files it lives in.

**1. Write the rule first.** In \`firestore.rules\`, inside \`match /pulse_posts/{postId}\`, an update is allowed for a non-owner only if the write's diff touches exactly one of a fixed set of counter fields (\`likeCount\` among them) and moves it by exactly \`-1\`, \`0\` or \`1\`. Nothing about likes exists yet in the UI - this rule is true and enforced regardless.

**2. Add the "have I liked this" record.** A like needs to be toggleable, which means the client needs to know, on load, which posts the current user has already liked. A dedicated \`pulse_likes\` collection, one document per \`{postId}_{uid}\` pair, answers that with a single query - existence of that document *is* "this user liked this post," with no separate boolean to keep in sync.

**3. Write the click handler.** On tap: read whether a like document already exists for this user and post; build a \`writeBatch\` that either deletes it and decrements \`likeCount\`, or creates it and increments \`likeCount\`; flip local optimistic state immediately, before \`await batch.commit()\` resolves; guard the whole thing behind a \`likeBusy\`/\`likeBusyId\` flag so a second tap mid-flight is ignored rather than double-counted.

**4. Confirm the read side already handles it.** The feed's existing \`onSnapshot\` listener needs no changes for other viewers to see the update - it was already subscribed to \`pulse_posts\`, and \`likeCount\` is a field on documents it already reads. "Notice you don't have to do anything" is itself worth noticing.

**5. Confirm loading/empty/error still holds.** The feed's loading state, from two lessons ago, covers the moment before any posts arrive at all; adding likes needed no second, separate loading state for this one number.

**6. Trace a like end to end, one more time, tier by tier:** browser event handler -> local optimistic state flips -> \`writeBatch\` sent over the network to Firestore -> the security rule from Step 1 evaluates the diff and allows or rejects it -> on success, the write commits -> every open \`onSnapshot\` listener on that post, on every device watching it, receives the new document and re-renders. Six steps. No devert-backend anywhere in the chain, and nothing in that chain is "skipped" - it's exactly this module's first lesson, traced on a feature you just built rather than one you only read about.`,
    codeExample: {
      language: "javascript",
      code: `// The like button, built in the order above. Simplified from the real
// handleLike() in components/pulse/pulse-app.jsx.

import { doc, writeBatch, increment, getDoc } from "firebase/firestore";

async function toggleLike({ db, post, user, isLiked, setLocalLiked, setLocalLikes, setBusy }) {
  if (!user || setBusy.current) return; // guard: no double-fire mid-flight
  setBusy.current = true;

  // Step 3: optimistic UI update, before the network write resolves.
  const next = !isLiked;
  setLocalLiked(next);
  setLocalLikes(count => count + (next ? 1 : -1));

  const likeRef = doc(db, "pulse_likes", post.id + "_" + user.uid);
  const postRef = doc(db, "pulse_posts", post.id);
  const batch = writeBatch(db);

  if (isLiked) {
    batch.delete(likeRef);
    batch.update(postRef, { likeCount: increment(-1) });
  } else {
    batch.set(likeRef, { postId: post.id, uid: user.uid, likedAt: new Date() });
    batch.update(postRef, { likeCount: increment(1) });
  }

  try {
    await batch.commit(); // Step 1's rule is evaluated here, server-side
  } catch (err) {
    // The write was rejected - roll the optimistic guess back.
    setLocalLiked(isLiked);
    setLocalLikes(count => count + (isLiked ? 1 : -1));
    console.error("Like failed:", err);
  } finally {
    setBusy.current = false;
  }
}

// Step 4: the read side needs NO new code - the feed's existing onSnapshot
// listener on pulse_posts already delivers the updated likeCount to every
// open viewer the moment the write above commits.

/* The matching rule, in firestore.rules (already present, not written here):

match /pulse_posts/{postId} {
  allow update: if isOwner(resource.data.uid)
    || (
      request.resource.data.diff(resource.data).affectedKeys().hasOnly(
        ['likeCount', 'commentCount', 'saveCount', 'shareCount', 'viewCount', 'repostCount']
      )
      && request.resource.data.diff(resource.data).affectedKeys().size() == 1
      && (request.resource.data.get('likeCount', 0) - resource.data.get('likeCount', 0)) in [-1, 0, 1]
      // ...the same bounded check repeated for each other counter field
    );
}
*/`,
      expectedOutput: `// A tap that likes a post the user hadn't liked yet:
// 1. UI immediately: heart fills red, count goes from 41 to 42
// 2. Network: writeBatch sent, security rule allows (+1 on likeCount only)
// 3. Confirmed: pulse_likes/postId_uid now exists
// 4. Every other open viewer's onSnapshot fires: their count also shows 42

// A tap on someone else's already-liked post, attempted a second time
// before the first write finished (double-tap): the busy guard skips it
// entirely - no batch is even built, so likeCount cannot move by 2.`,
    },
    commonMistakes: [
      "Building the UI before deciding the security rule, which is exactly how a bounded-delta check gets forgotten until an audit (or an exploit) finds it later",
      "Writing to likeCount and the pulse_likes record as two separate calls instead of one writeBatch, risking one succeeding without the other and leaving the count and the 'have I liked this' record disagreeing",
      "Forgetting the busy guard, letting a fast double-tap fire two writes before the first one's local state has settled, double-counting a single like",
      "Assuming other viewers need a separate 'push' mechanism, when the feed's existing onSnapshot listener already delivers the update for free because it was already subscribed to the same document",
      "Never rolling back the optimistic UI state on a failed write, leaving a user's screen showing a like that the security rules actually rejected",
    ],
    industryPerspective: `"Own a feature end to end" is the exact phrase this course's own earlier module used to describe the jump from junior to mid-level, and this lesson is what that phrase actually cashes out to: touching the data model, the authorization rule, the write, the optimistic UI, and the real-time propagation to other users, in that order, for one small feature. A senior engineer reviewing this work wouldn't be impressed by the button - buttons are easy. They'd check the rule first, because the rule is the one part of this feature a mistake in actually costs money or trust.

It's also worth naming the durable next step honestly, because this course doesn't pretend the current design is the permanent one: this project's own engineering notes are explicit that moving reward-granting logic server-side, via a Cloud Function, is "no longer blocked" now that billing and a functions deployment exist - it simply hasn't been done yet. If DeVert's like button ever needed to do something a bounded ±1 rule can't safely express - awarding variable XP based on a more complex condition, for instance - a Cloud Function triggered on the same write is exactly where that logic would move to, precisely because a security rule is deliberately too limited a language for anything beyond a bounded check.`,
    devertCaseStudy: `Everything in this lesson is a simplified read of two real files: \`components/pulse/pulse-app.jsx\`'s \`handleLike\`, and the \`pulse_posts\` match block in \`firestore.rules\`. The production version differs from the walkthrough above in exactly the ways you'd expect a real feature to: it also writes a notification to the post's author on a new like (skipped here, and correctly guarded so liking your own post never notifies yourself), and a comment explicit in the real code notes that Pulse engagement no longer grants XP or coins at all - a platform policy decided after this feature shipped, reserving rewards for Daily Learning, Programming and CS Core instead. The bounded-delta rule didn't change when that policy did; it was never about rewards in the first place, only about who may move a shared number and by how much.

That last detail is worth sitting with, because it's this whole module distilled into one fact: the security rule is the honest, load-bearing part of this feature, stable regardless of which reward policy is active this year. The UI, the reward logic, even whether likes grant anything at all - all of that is free to change. The rule guarding \`likeCount\` from being moved by anything other than a validated ±1 is the one piece of this feature that has to be right every single time, because - per this module's first lesson - there is no other tier standing behind it to catch a mistake.`,
    knowledgeChecks: [
      {
        question: "Why does this lesson write the Firestore security rule before writing any UI code?",
        options: [
          "Rules are required by Firestore's syntax to exist before any collection can be created",
          "The rule is what makes every later step safe to build on - deciding it after the UI exists is how a bounded-delta check gets forgotten",
          "It's faster to write rules first for performance reasons",
          "There is no real reason - the order doesn't matter",
        ],
        correctIndex: 1,
        explanation: "The trust boundary has to exist before anything relies on it. Writing the UI first and 'adding security later' is exactly the sequence that leads to a forgotten or incomplete rule.",
      },
      {
        question: "Why are the like-record write and the likeCount increment done in a single writeBatch instead of two separate calls?",
        options: [
          "writeBatch is required by Firestore for any update",
          "So both succeed or neither does, keeping the 'have I liked this' record and the shared counter from disagreeing if one write failed and the other didn't",
          "It's faster than two separate writes",
          "There is no functional reason, only style",
        ],
        correctIndex: 1,
        explanation: "A batch is atomic - both writes commit together or neither does. Two independent calls could leave the count changed without the like record existing, or vice versa.",
      },
      {
        question: "How do other users watching the same post see an updated like count, given that the like handler never explicitly notifies them?",
        options: [
          "A separate WebSocket server pushes the update",
          "Their own onSnapshot listener, already subscribed to that same post document, receives the change automatically the moment the write commits",
          "They must manually refresh the page",
          "devert-backend polls Firestore and broadcasts changes",
        ],
        correctIndex: 1,
        explanation: "No new mechanism is needed. The feed was already using onSnapshot rather than a one-shot read, so any write to the document it's watching is delivered to every open listener for free.",
      },
    ],
    lab: {
      title: "Build the like button yourself, end to end",
      brief: `Using a scratch Firestore project (or a sandbox collection in an existing one you control), build every step of this lesson yourself, in order, and confirm each one actually behaves the way the lesson describes.`,
      steps: [
        "Create a posts collection with a few documents, each with a likeCount field starting at 0.",
        "Write the security rule first: a non-owner may update a document only if the diff touches exactly likeCount, and only by -1, 0 or 1. Test it in the Firestore Rules Playground with a write of +1 (should pass) and +50 (should fail) before writing any client code.",
        "Write the click handler: a writeBatch that creates or deletes a likes/{postId}_{uid} document and increments/decrements likeCount by exactly one, guarded by a busy flag.",
        "Wire up optimistic local state: flip the icon and count immediately on tap, before await batch.commit() resolves.",
        "Open the same document in two browser tabs (or two devices) side by side. Like it from one tab and confirm the second tab's count updates on its own, with no manual refresh - this is the onSnapshot propagation from Step 4.",
        "Deliberately break the rule (temporarily allow any delta) and confirm you can now write likeCount: 999 directly from the browser console - then put the correct rule back and confirm the same write is rejected.",
      ],
      starterCode: `// Rules Playground test cases to run BEFORE writing any client code:
//
// Simulated write #1 (should ALLOW):
//   path: /pulse_posts/post123
//   auth: a different uid than the post's owner
//   data diff: { likeCount: existing + 1 }
//
// Simulated write #2 (should DENY):
//   path: /pulse_posts/post123
//   auth: a different uid than the post's owner
//   data diff: { likeCount: existing + 50 }
//
// Simulated write #3 (should DENY):
//   path: /pulse_posts/post123
//   auth: a different uid than the post's owner
//   data diff: { likeCount: existing + 1, commentCount: existing + 1 }
//   (moves two fields in one write - not allowed, even though each delta is valid alone)`,
    },
    assignment: {
      reflection: "Write, from memory and without re-reading this lesson, the six-step trace of a like from tap to every viewer's screen updating. Compare it against the walkthrough afterward.",
      observation: "Open DeVert's real firestore.rules and find the pulse_posts match block. Identify which line enforces 'exactly one field, exactly ±1' and explain it in your own words.",
      practice: "Extend the lab's like button into a save button (a second, independent boolean per user per post) reusing the same bounded-delta rule shape for a saveCount field instead of likeCount.",
    },
    summary: "Building one feature end to end means making five decisions in a deliberate order: what the trust boundary allows before any UI exists, what a single atomic write actually changes, what the user sees before that write confirms, what every other viewer sees once it does, and what guards against a fast double-action miscounting. DeVert's real like button answers all five without a custom backend at all - a Firestore security rule enforcing a bounded ±1 delta stands in for the authorization a controller would normally provide, a writeBatch makes the like record and the counter change together, optimistic local state makes the tap feel instant, and the feed's existing onSnapshot listener delivers the update to every other viewer for free. Every step traces back to an earlier lesson in this module and, further back, to modules on databases, security rules and identity - which is the whole point of a capstone: nothing here is a new idea, only old ideas finally shown working together on one feature.",
    goingDeeper: `## What would actually have to change to need a real backend here

The bounded-delta rule is deliberately limited: it can check that a number moved by exactly one, but it cannot express "and also check a rate limit across the last hour" or "and also award XP scaled to the post's category" - conditions that need to read more context or run real logic, not just compare two numbers.

::: didyouknow
This project's own engineering documentation is explicit that the durable fix for exactly this limitation - moving reward-granting logic server-side via a Cloud Function - is no longer blocked, now that billing is active and \`functions/\` is already deployed for other jobs. A Cloud Function triggered \`onUpdate\` of a \`pulse_posts\` document could run arbitrarily complex logic the client never sees or influences, the same way \`devert-backend\`'s Spring controller runs real logic for CodeLab grading. It simply hasn't been necessary for likes specifically, because a bounded ±1 has been sufficient for what likes need to guarantee.
:::

Recognising *when* a rules-only trust boundary is enough, and when a feature has actually outgrown it into needing a real trusted server path, is a judgment call worth being able to make deliberately - which is exactly what tracing this one feature, rule first, was meant to practice.`,
    resources: [
      { kind: "link", title: "Firebase: Atomic operations with writeBatch", url: "https://firebase.google.com/docs/firestore/manage-data/transactions", description: "The official reference for batched writes, including when to reach for a full transaction instead." },
      { kind: "link", title: "Firebase: Rules Playground", url: "https://firebase.google.com/docs/firestore/security/test-rules-emulator", description: "Test a security rule against simulated writes before any client code exists - exactly the order this lesson recommends." },
    ],
    tags: ["end-to-end", "firestore", "security-rules", "capstone"],
  },

};
