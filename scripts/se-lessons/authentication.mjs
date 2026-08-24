// Module 6 - Authentication.
//
// Follows the authoring rules documented at the top of welcome.mjs.
//
// MODULE FRAME: the career-map lesson calls this the hardest module
// conceptually, and the one that most improves a learner's interview
// answers. HTTP forgets the caller after every single request; every lesson
// here is infrastructure built to fake a safe memory of them - hashing,
// sessions, tokens, OAuth - ending on the line between authentication
// (proving who you are) and authorization (what you're allowed to do),
// which is where a large share of real breaches actually start.

export const AUTHENTICATION = {

  "the-identity-problem": {
    subtitle: "HTTP forgets you the instant the response finishes arriving",
    difficulty: "Beginner",
    estimatedMinutes: 14,
    xpReward: 20,
    coinReward: 8,
    learningObjectives: [
      "Explain precisely what 'HTTP is stateless' means, and why that is a deliberate design choice rather than an oversight",
      "Describe the two general shapes every mechanism in this module is a variant of: the server remembering and handing out a pointer, or the client carrying the proof itself",
      "Separate 'who are you', 'are you still you' and 'what are you allowed to do' into three distinct questions, and explain why conflating them causes real bugs",
    ],
    prerequisites: [],
    story: `Picture a building where every door has its own guard, and none of the guards talk to each other. You show ID at the front entrance. Thirty seconds later, at the lift, a different guard asks for your ID again - not because anything is wrong, but because as far as that guard is concerned you are a stranger who just arrived. The lobby guard already forgot you the moment you walked past.

That is roughly what HTTP does to you, on every site you use, by design. Your browser sends a request, the server answers, and then - by the actual specification of the protocol - the server owes that request nothing further. The very next request, one second later, from the exact same browser, arrives looking exactly as unfamiliar as one from a stranger on the other side of the planet who has never visited before.

Sites do not feel that way to use. You sign in once and the site treats you as signed in for hours, sometimes weeks. That entire experience - one continuous, recognisable "you" persisting across dozens of separate requests - is not something HTTP gives you for free. Every mechanism in this module exists purely to fake it, safely.`,
    problemStatement: `HTTP was designed to serve documents, not relationships. A request arrives, gets a response, and the connection can be discarded - no request carries any built-in memory of a previous one, and no server is required to keep any. That statelessness is not a bug later versions forgot to patch; it is the specific property that let one server answer millions of unrelated requests from millions of unrelated visitors without keeping any of them in memory, which is a large part of why the web scaled the way it did.

The cost of that choice falls entirely on you, the engineer, the moment a site needs to answer "is this the same person who signed in a moment ago?" Nothing in HTTP answers that question. You have to build the answer yourself, out of something the browser will voluntarily carry from one request to the next, and something the server can check against - and everything from here to the end of this module is a way of doing exactly that.`,
    concept: `## Two shapes, one problem

Every identity mechanism this module covers is a variation on one idea: the client holds a small piece of evidence, and every later request carries that evidence along, so the server can look at it and decide who is - probably - asking.

::: cards The two families every later lesson is a variant of
Server remembers, client carries a pointer :: The server keeps the actual facts - who is signed in, what they're allowed to do - in its own storage, and hands the client only an opaque id pointing at that record. This is the session model.
Client carries the proof itself :: The server hands the client a self-contained, signed statement of who they are, and checks the signature rather than looking anything up. This is the token model, and it is what a JWT is.
:::

Neither is "the" answer. They are a genuine trade-off, covered properly in a few lessons' time, and almost every real system you will touch picked one of these two shapes - sometimes both, for different parts of itself.

## Three questions people mash into one

A large share of authentication bugs come from treating this as one problem when it is actually three, answered at different times for different reasons.

::: timeline The three questions, in the order they get answered
Who are you? :: Proven once, usually at signup or login - a password checked against a stored hash, or a Google account vouching for you. This is authentication.
Are you still you? :: Checked on every later request, without repeating the first proof - a cookie, a session lookup, a token's signature. This is what "being logged in" actually is.
What are you allowed to do? :: A separate question entirely, checked after the first two are already settled - are you an admin, do you own this record, can you afford this action. This is authorization, and it gets a lesson of its own later in this module precisely because conflating it with the first two is how a lot of real breaches start.
:::

::: remember
"Logged in" really just means "the second question keeps answering yes, without the server making you repeat the first." Hashing, sessions, tokens, OAuth - every mechanism ahead in this module is infrastructure for answering question two cheaply, having already paid the cost of answering question one exactly once.
:::

## Why none of this can live in the connection itself

It is tempting to assume the browser's open connection to the server is itself some kind of identity - after all, it feels continuous while a page is open. It is not, and will not be for reasons covered in this lesson's Going Deeper: connections get recycled, load balancers terminate them, and a single visit routinely spans several. Identity has to be carried explicitly, inside the request itself, or it does not exist at all.

::: checkpoint
A server handles two requests, three seconds apart, from the exact same browser tab and the same physical machine. By the bare HTTP specification alone, what does the server know about whether these two requests are "the same session"?
- ( ) It knows they're the same, because they share an IP address
- (x) Nothing at all - HTTP itself carries no concept of one request being related to a previous one
- ( ) It knows because browsers number their requests sequentially
- ( ) It knows because the underlying TCP connection stayed open
> An IP address is not identity - a much earlier lesson on NAT covers exactly why several people can share one - and HTTP defines no field linking one request to a prior one. Any sense of continuity has to be manufactured deliberately, which is the entire subject of this module.
:::`,
    codeExample: {
      language: "javascript",
      code: `// Two separate requests to the same endpoint, one right after the other.
// Nothing about HTTP itself links them, no matter how "continuous" this
// feels from inside a single open browser tab.

const first = await fetch("/api/whoami");
console.log(await first.json());
// { user: null }

const second = await fetch("/api/whoami");
console.log(await second.json());
// { user: null } -- again. Even if a login happened in another tab a
// second ago, THIS fetch carries no evidence of it, because nothing
// attached any. Every later lesson in this module is about what has to
// be added to these requests to make the second call return a real user.`,
      expectedOutput: `Both calls print { user: null }, because a bare fetch() carries nothing that identifies the caller. Once a login mechanism exists, one extra thing changes about this exact code: a cookie the browser attaches automatically, or an Authorization header the caller adds explicitly. Nothing about the requests otherwise changes shape - the identity always rides alongside the request, never inside HTTP's own plumbing.`,
    },
    commonMistakes: [
      "Assuming the server 'just knows' who is making a request because it's the same browser that logged in a moment ago - nothing about HTTP carries that information automatically",
      "Treating 'authenticated' and 'authorized' as one check, when they are two separate questions answered at different times for different reasons",
      "Believing an IP address or a User-Agent header identifies a returning visitor reliably enough to use as identity",
      "Assuming an open TCP connection or a browser tab staying open implies the server remembers anything about who is using it",
    ],
    industryPerspective: `Almost no production team implements identity from first principles today, and that is itself the industry's verdict on how easy this is to get subtly wrong. Managed identity providers - Firebase Authentication, Auth0, Okta, AWS Cognito - exist specifically because "remember who's signed in, safely, across every request" has a long tail of easy-to-miss failure modes: fixation, replay, insecure comparison, token leakage, none of which show up in a demo and all of which show up in an incident report.

The practical result is that most engineers now spend far less time writing login forms and far more time correctly wiring up a provider's SDK and reading the token or session it hands back. That does not make this module optional - reading a decoded token correctly, or knowing why a cookie needs \`HttpOnly\`, is exactly the layer above "which button do I click in the Firebase console", and it is the layer interviewers actually probe.`,
    devertCaseStudy: `DeVert picked one of the two families in this lesson's cards entirely: the client-carries-the-proof model, in its purest form. There is no DeVert password anywhere - the platform's only sign-in method is Google Sign-In via Firebase Authentication, and Firebase issues a signed ID token (a JWT) that the browser holds and attaches to every request to Firestore.

That single decision quietly answers this lesson's three questions in a specific order worth noticing now, because the rest of this module unpacks each step: "who are you" is answered once, by Google, inside Firebase's sign-in flow. "Are you still you" is answered by that same token being valid and unexpired on every later request - no server-side session record exists anywhere to check. "What are you allowed to do" is answered separately again, by Firestore Security Rules reading claims directly off that same token - including a custom \`admin: true\` claim that is not part of what Google ever told Firebase, and had to be added by DeVert itself. You will meet exactly how by the end of this module.`,
    knowledgeChecks: [
      {
        question: "What does it mean, precisely, for HTTP to be 'stateless'?",
        options: [
          "Every request must open a brand-new TCP connection",
          "No request carries any built-in memory of a previous request, and no server is required to keep any",
          "HTTP cannot carry cookies",
          "A request cannot include a body",
        ],
        correctIndex: 1,
        explanation: "Statelessness is about memory, not connections or payloads: HTTP defines no mechanism by which a server automatically recalls anything about a prior request from the same client.",
      },
      {
        question: "A site keeps you 'logged in' across dozens of requests. What is actually happening?",
        options: [
          "HTTP has a hidden field the browser fills in automatically",
          "The client carries a piece of evidence on every request, and the server checks that evidence fresh each time - HTTP itself provides none of this",
          "The server remembers your IP address permanently",
          "Browsers invented sessions as part of the HTML specification",
        ],
        correctIndex: 1,
        explanation: "Continuity is manufactured, not native. A cookie pointing at a session, or a token carried in a header, is what actually rides along on each request - HTTP contributes nothing toward it.",
      },
      {
        question: "Why is it a mistake to treat 'proving who you are' and 'being allowed to do a specific thing' as the same check?",
        options: [
          "They aren't actually different in practice",
          "Because authentication happens once and settles who you are, while authorization is a separate, later question that can change without you ever signing in again - conflating them is a common source of security bugs",
          "Because authorization is always checked before authentication",
          "Because only admin accounts ever need authorization checks",
        ],
        correctIndex: 1,
        explanation: "A signed-in user is a settled fact; what that specific user may do to a specific resource is a question asked again for every action, and it has its own lesson later in this module for exactly this reason.",
      },
    ],
    lab: {
      title: "Watch HTTP forget you, live",
      brief: `Every request your browser makes really does start from zero, as far as bare HTTP is concerned. You can watch the exact piece of evidence that fakes continuity, in your own devtools, on any site you're signed into right now.`,
      steps: [
        "Open devtools' Network tab on a site you're signed into, and reload the page.",
        "Click any one request in the list and open its Request Headers - find Cookie: or Authorization:, whichever the site uses. One of the two is present on nearly every request once you're signed in.",
        "Click a second, unrelated request from the same reload and compare - notice the identical value attached to it too, despite being a completely separate request to a completely different URL.",
        "Open a private/incognito window to the same site, signed out, and inspect the same kind of request there - the header is either missing entirely or holds a different value.",
        "That header is the whole answer to 'how does the server know it's still me' - nothing about HTTP itself does. One piece of evidence, resent on every single request, is doing all of the work.",
      ],
      starterCode: `# No commands needed - this lab is entirely devtools UI.
# Chrome/Edge/Firefox: F12 -> Network tab -> reload -> click any request
# -> Headers -> look for "Cookie:" or "Authorization:" under Request Headers.`,
    },
    assignment: {
      reflection: "In your own words, explain why 'the server recognises my browser' cannot be literally true under plain HTTP - name the actual piece of evidence that would have to exist for recognition to happen at all.",
      observation: "Find a site with a strict idle timeout (many banking sites have one) and stay signed in but idle until it signs you out. Note roughly how long that took, and consider what the timeout is actually protecting against.",
    },
    summary: "HTTP is deliberately stateless: no request carries any built-in memory of a previous one, and no server is required to keep any - a design choice that let the web scale, not an oversight. Everything that feels like 'staying signed in' is manufactured on top of that gap: the client carries a small piece of evidence - a cookie pointing at a session, or a signed token - on every request, and the server checks it fresh each time. That leaves three genuinely separate questions: who are you, are you still you, and what are you allowed to do. The rest of this module is essentially one mechanism per question, ending on why conflating the last one with the first two is where real security bugs tend to start.",
    goingDeeper: `## Why not just use the open connection as identity?

It feels like it should work: a browser tab keeps one connection open to a server for as long as the page is loaded, so surely the server can just remember which connection belongs to whom.

It cannot, for reasons that only show up once a system is real rather than a toy. A load balancer in front of more than one server terminates the browser's connection and opens a fresh one to whichever backend server happens to be free, so "the same connection" the browser thinks it has isn't the same connection the application code sees. Modern browsers pool and reuse connections across unrelated tabs and requests for performance. HTTP/2 and HTTP/3 deliberately multiplex many logically separate requests over one physical connection. And the same person routinely uses two devices, or two tabs, at once - which "one connection, one identity" cannot represent at all.

::: behind
This is exactly why HTTP keep-alive - reusing one connection for several requests - was invented purely as a performance optimisation, to avoid the cost of a fresh TCP and TLS handshake for every request, and was never intended as an identity mechanism. Conflating "this connection stayed open" with "this is still the same authenticated user" is a mistake early web frameworks occasionally made and modern ones deliberately avoid, precisely because connections are an infrastructure detail that can be torn down and rebuilt beneath an application at any moment, invisibly.
:::`,
    resources: [
      { kind: "link", title: "MDN: An overview of HTTP", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview", description: "Covers HTTP's statelessness directly, alongside the request/response model this lesson assumes." },
      { kind: "link", title: "OWASP Authentication Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html", description: "The industry-standard reference this whole module draws from. Worth skimming now and rereading at the end." },
    ],
    tags: ["authentication", "http", "identity", "fundamentals"],
  },

  "signup-and-login": {
    subtitle: "The two forms that quietly decide your entire security posture",
    difficulty: "Beginner",
    estimatedMinutes: 15,
    xpReward: 21,
    coinReward: 8,
    learningObjectives: [
      "Trace exactly what a server should do, step by step, when a signup form is submitted",
      "Trace exactly what a server should do when a login form is submitted, and why checking a password is more involved than it sounds",
      "Explain user enumeration, and why a login form must never reveal which half of the credentials was wrong",
    ],
    prerequisites: ["The Identity Problem"],
    story: `Researchers looking at a well-known site once noticed something nobody had treated as a vulnerability: its login form said "no account with that email" for a wrong email, and "incorrect password" for a right email with a wrong password. Two different sentences.

That difference sounds like a UX nicety - helpful error messages, surely a good thing. It is also a machine an attacker can run a million times a minute. Feed it a list of a million email addresses, one guess of a password each, and read only the message back. Every "no account with that email" gets discarded. Every "incorrect password" confirms a real, live, registered account - no password needed, just the one bit of information the form gave away for free.

The site had not been "hacked" in any dramatic sense. It had simply answered a slightly different question than the one it thought it was answering, and the difference between those two questions is most of what this lesson is about.`,
    problemStatement: `Signup and login look like one feature - "the auth form" - and they are actually two forms doing fundamentally different jobs, each with its own way to go wrong.

Signup creates a brand-new identity record from data a stranger just typed in, which means every field arriving needs validating and nothing sensitive may ever be written down in a form that could later leak. Login instead verifies a claim against a record that already exists, which means the response to a wrong guess has to be treated as carefully as the response to a right one - because what a login form reveals to someone who is wrong is just as security-relevant as what it grants to someone who is right.`,
    concept: `## What signup actually does

::: flow
Browser submits an email and password -> server checks the email isn't already registered -> the password is hashed, never stored as typed (next lesson covers exactly how) -> a new account record is written -> often, a verification email confirms the address is real -> the account exists, though not necessarily "trusted" yet
:::

Notice that the raw password appears in that diagram exactly once - in transit, over HTTPS, in the very first arrow - and never again. By the time anything is written to a database, it has already become the hash the next lesson explains, and the original string is simply gone, never logged, never emailed back, never stored anywhere "just in case".

## What login actually does

::: timeline Step by step, on every attempt
Look up the account by email :: Find the stored record, if one exists at all.
Compare the submitted password against the stored hash :: Never against a stored password - there usually isn't one, and the next lesson explains exactly what this comparison looks like.
Respond identically either way :: Whether the email didn't exist, or the email existed but the password was wrong, return the exact same generic message - never two different ones.
Only then issue evidence of being signed in :: A cookie, a session, or a token - the actual subject of the next few lessons - and only after both checks above have passed.
:::

::: remember
The dangerous line in this lesson's story isn't "the site told me my password was wrong" - it's a login form that tells an attacker, one guess at a time, which email addresses even have an account. That's called user enumeration, and it's a named, catalogued vulnerability class in its own right, because knowing which of a million addresses are registered on a site is valuable to an attacker even without a single correct password - it turns an untargeted list into a targeted one.
:::

## Why none of this can be trusted to the browser

A signup form's client-side validation - "passwords must match", "that doesn't look like an email" - is a courtesy to a legitimate user typing quickly, and nothing more. Anyone can send a request directly to the server with none of that JavaScript ever having run, so every rule that actually matters - is this email already taken, is this password long enough, is this really a valid email - has to be re-checked on whatever receives the request, or it does not exist as a rule at all. This is the same point an earlier module makes about file-size limits, applied to identity instead of uploads.

::: checkpoint
A login form returns "No account found with that email address" for a wrong email, and "Incorrect password, please try again" for a right email with a wrong password. What is the actual problem with this design?
- ( ) Nothing - clear error messages are good UX
- (x) It lets an attacker enumerate which email addresses have an account on the site, without ever needing a correct password
- ( ) It is slower than a single generic message
- ( ) It violates HTTP's stateless design
> Two distinct messages turn a login attempt into a free oracle: run a list of addresses through it and every "incorrect password" reply confirms a real account exists, with zero cost to the attacker. A single generic "invalid email or password" response answers the same functional question to a real user while giving an attacker nothing to distinguish.
:::`,
    codeExample: {
      language: "javascript",
      code: `// A minimal login handler - the shape almost every backend framework follows.
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await db.users.findOne({ email });

  // One generic failure for BOTH "no such user" and "wrong password" -
  // never two different messages. See this lesson's checkpoint.
  const invalidCredentials = () =>
    res.status(401).json({ error: "Invalid email or password" });

  if (!user) return invalidCredentials();

  // bcrypt.compare is the actual subject of the next lesson - never
  // compare against a stored password directly, because there isn't one.
  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) return invalidCredentials();

  // Only past this point does the server issue any proof of being signed
  // in - a cookie or a token, covered in the lessons right after this one.
  const evidence = await issueSignedInEvidence(user);
  res.json({ evidence });
});`,
      expectedOutput: `A request with a wrong email and a request with a right email but wrong password both produce the identical response: status 401, { "error": "Invalid email or password" }. A request with the correct pair produces a 200 carrying whatever "evidence" the site uses to stay signed in. From outside, a wrong email and a wrong password are indistinguishable - which is the entire point.`,
    },
    commonMistakes: [
      "Returning a different error message for 'wrong email' versus 'wrong password', which enables user enumeration",
      "Validating a signup form only in the browser's JavaScript and skipping the same checks on the server",
      "Placing no limit on login attempts, which turns a slow brute-force guess into an unlimited one",
      "Emailing a user their own password back to them at signup 'as a receipt' - if that's possible at all, it means the password was never hashed in the first place",
      "Trusting any field the client sends at signup beyond email and password - for instance a 'role' or 'accountType' field a browser request can set to anything it likes",
    ],
    industryPerspective: `Generic login errors and rate limiting are both explicit, named items in the OWASP Authentication Cheat Sheet, not stylistic preferences - they're there because user enumeration and credential stuffing (trying leaked email/password pairs from one breach against an unrelated site) are two of the most common real-world attacks against login forms, and both are cheap to run at scale precisely because so many sites still get one of these two things wrong.

Rate limiting in particular has become close to mandatory: after some number of failed attempts for one account, or from one source, further attempts are slowed, CAPTCHA-gated, or temporarily locked out. GitHub, Google and most large sites layer in device fingerprinting and anomaly detection on top of this - not because the basic idea is insufficient, but because attackers adapted to basic rate limiting by spreading attempts across many accounts and many source addresses at once, which a per-account or per-IP limit alone does not catch.`,
    devertCaseStudy: `This lesson describes a form DeVert deliberately does not have. There is no DeVert signup page asking for an email and a password, and no DeVert login form to run an enumeration attack against, because the platform's only sign-in method is Google Sign-In through Firebase Authentication - there is no DeVert password to hash, mistype, forget, or leak in the first place.

Firebase Authentication still performs a version of "signup or login" internally, just not the one this lesson opens with: the first time a given Google account signs in, Firebase creates a user record on DeVert's behalf; every time after that is a login against the record already created. But that decision, and the credential check behind it, happens entirely inside Google's and Firebase's infrastructure - DeVert's own code never receives a password, never stores one, and never has the chance to leak one, because it is never in a position to.

That is not DeVert dodging this lesson's hard problem so much as delegating it wholesale to an organisation whose entire job is getting exactly this right at a scale and security budget no small platform could match. The trade-off, covered properly two lessons from now, is that DeVert's users can only ever sign in with a Google account - there is no "forgot password" flow to build, because there is no DeVert password to forget.`,
    knowledgeChecks: [
      {
        question: "Why is returning two different error messages - 'no such email' versus 'wrong password' - a security problem?",
        options: [
          "It's slower to generate two messages",
          "It lets an attacker determine which email addresses have a real account, without needing a correct password at all",
          "It violates the HTTP specification",
          "It only matters if the site has no rate limiting",
        ],
        correctIndex: 1,
        explanation: "This is user enumeration: distinguishing the two failure cases turns a login form into a free tool for confirming which addresses are registered, which is valuable to an attacker on its own.",
      },
      {
        question: "Why is client-side (JavaScript) validation on a signup form not actually a security control?",
        options: [
          "Because JavaScript cannot check string lengths",
          "Because a request can be sent directly to the server, bypassing any JavaScript entirely, so only server-side checks are ever guaranteed to run",
          "Because signup forms don't need validation",
          "Because browsers disable JavaScript by default",
        ],
        correctIndex: 1,
        explanation: "Client-side validation is a courtesy for a legitimate user typing normally. Anyone can craft and send a raw request that skips the browser and its JavaScript altogether, so any rule that matters must also be enforced on the server.",
      },
      {
        question: "In the login handler shown in this lesson, what happens between finding no matching user and finding a user whose password doesn't match?",
        options: [
          "Two different status codes are returned",
          "The exact same 401 response with the exact same generic error message is returned in both cases",
          "The 'no such user' case returns immediately, while the wrong-password case retries the lookup",
          "Only the wrong-password case is logged",
        ],
        correctIndex: 1,
        explanation: "Both failure paths call the same invalidCredentials() function, producing an identical response - which is precisely what prevents an outside observer from telling the two cases apart.",
      },
    ],
    lab: {
      title: "Find (or fail to find) a real user-enumeration bug",
      brief: `You are going to compare login error messages on a real site without ever attempting an actual break-in - just observing what one wrong guess reveals, which is entirely within a normal user's own account.`,
      steps: [
        "Pick any site where you have a real account, and attempt to sign in with an email address that is definitely not registered (something you just made up). Note the exact wording of the error.",
        "Now attempt to sign in with your own real email address and a deliberately wrong password. Note the exact wording of that error.",
        "Compare the two messages word for word. If they're identical, the site is following this lesson's advice. If they differ, you've just found the exact enumeration gap this lesson describes.",
        "Try the same comparison on a second site you use. Note whether large, security-conscious platforms and smaller ones differ in how careful they are here.",
      ],
      starterCode: `# No commands needed - use any real login form you already have an
# account on. Compare:
#   1. A made-up, never-registered email address
#   2. Your real email address with a wrong password
# Read both error messages character by character.`,
    },
    assignment: {
      reflection: "Explain in two or three sentences why 'the server told me my password was wrong' is a completely different problem from 'the server told me which emails have accounts' - even though a beginner might describe both as 'the login form gave me feedback'.",
      practice: "Sketch, in plain English or pseudocode, the exact sequence of checks a signup endpoint should run before writing a new account record - list every check in order.",
    },
    summary: "Signup creates a new identity record from unverified input and must never store a raw password anywhere, even briefly; login verifies a claim against an existing record and must respond identically whether the email or the password was wrong, to avoid user enumeration - a named, catalogued vulnerability where distinct error messages let an attacker confirm which accounts exist without ever guessing a correct password. Neither check can be trusted to client-side JavaScript, since any request can bypass the browser entirely. DeVert sidesteps almost this entire lesson by having no signup or login form of its own at all - its only sign-in method is Google Sign-In via Firebase Authentication, so there is no DeVert password to hash, leak, or enumerate against in the first place.",
    goingDeeper: `## Timing attacks: the enumeration bug that survives identical messages

Even a login endpoint that returns the exact same error text for both failure cases can still leak information through timing. If looking up a nonexistent email fails instantly, but a wrong password for a real account takes measurably longer - because a real password hash actually gets compared, and comparing takes real time - an attacker measuring response times alone can sometimes tell the two cases apart even with identical error text.

::: behind
The standard defence is to make both failure paths take roughly the same amount of work: some systems perform a dummy hash comparison against a fixed, meaningless hash even when no user was found, purely so the "no such user" path costs approximately the same time as the "wrong password" path. It's a small detail, and it's exactly the kind of subtlety that makes rolling your own authentication a genuinely deep rabbit hole - which is a large part of why the industry perspective above leans so heavily on established libraries and providers rather than bespoke code.
:::`,
    resources: [
      { kind: "link", title: "OWASP: Authentication Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html", description: "Covers generic error messages, rate limiting and credential stuffing defences in detail." },
      { kind: "link", title: "OWASP: Credential Stuffing", url: "https://owasp.org/www-community/attacks/Credential_stuffing", description: "Why leaked password lists from one breach are reused against unrelated sites, and what defends against it." },
    ],
    tags: ["authentication", "login", "signup", "security"],
  },

  "password-hashing-and-why-never-to-store-a-password": {
    subtitle: "The one-way function that means even the site itself doesn't know your password",
    difficulty: "Intermediate",
    estimatedMinutes: 18,
    xpReward: 24,
    coinReward: 10,
    learningObjectives: [
      "Explain why hashing, not encryption, is the correct operation for storing a password",
      "Read a real bcrypt hash and explain what each of its parts encodes",
      "Explain what a salt defends against, and why bcrypt has one built in automatically",
      "Explain why increasing the cost factor is a deliberate, tunable defence rather than wasted computation",
    ],
    prerequisites: ["Signup and Login"],
    story: `In 2012, LinkedIn was breached and roughly 6.5 million password hashes leaked. Within days, a large share of them had been cracked and were circulating in plain text on forums - not because the attacker broke the hashing algorithm, but because LinkedIn had used a fast, unsalted SHA-1 hash, and fast is exactly the wrong property for this particular job.

A hash designed to be fast can be tried billions of times a second on modern hardware. A common password hashed the same way twice always produces the same output, so an attacker only ever needs to hash the whole list of the ten million most common passwords once, and check every leaked hash against that list in one pass - a rainbow table. LinkedIn's hashes fell not because SHA-1 is broken as a hash function, but because SHA-1 was never meant for this job, and the industry had known that for years before the breach happened.

Every password-hashing algorithm that came after - bcrypt, scrypt, Argon2 - is a direct engineering response to that exact failure mode: deliberately, tunably slow, and salted so the same password never produces the same stored value twice.`,
    problemStatement: `A server that needs to verify a password later, without ever storing it, sounds like it should require encryption - scramble it now, unscramble it to check later. That is precisely the wrong instinct, and understanding why is the entire point of this lesson.

Encryption is reversible by design - whoever holds the key can always get the original back, which means anyone who ever gets the key (an attacker, a subpoena, a careless key rotation) gets every plaintext password ever encrypted with it. What a login actually needs is never to see the original password again after the moment it is first checked, while still being able to confirm a future guess matches. That is not encryption. That is hashing - and specifically, hashing built for exactly this job.`,
    concept: `## Hashing versus encryption - the distinction that matters

::: cards Two fundamentally different operations
Encryption :: Reversible. Given the right key, ciphertext becomes plaintext again. Correct for data you need to read back later - a message, a file, a database column you'll display to its owner.
Hashing :: One-way. There is no key that turns a hash back into the original input - by design, not merely by difficulty. Correct for data you only ever need to compare against, never to see again.
:::

A password is squarely the second case. The server never needs to know what your password is - it only ever needs to answer "does this new guess match the one you set before", and a one-way hash answers that without ever holding the answer to "what is it".

## Why a plain hash still isn't enough

A basic cryptographic hash like SHA-256 is one-way, but it is also fast - built for verifying file integrity, where speed is exactly what you want. Two problems follow immediately if you use a fast hash for passwords:

::: cards
Identical inputs, identical outputs :: Every user who chose "password123" gets the exact same stored hash, so cracking one instantly cracks all of them - and an attacker can precompute hashes for the most common passwords once, into a rainbow table, and reuse that table against every leaked database they ever get their hands on.
Fast means brute-forceable :: Modern hardware can compute billions of SHA-256 hashes per second. A hash designed to be fast is a hash designed to make guessing every possible password quick.
:::

The fix for both is one algorithm, doing two things at once: a random per-password **salt**, and deliberate **slowness**. That algorithm, in practice, is almost always bcrypt, scrypt or Argon2 - never a general-purpose hash like MD5 or SHA-256.

## Reading a real bcrypt hash

A bcrypt hash looks like this:

  $2b$12$KIXQ4z8N0y6r50F1U8s3F.eqjW1z3p9m4kS8bU8kQyq6z6h6z6h6O

::: cards What each section actually encodes
$2b$ :: The algorithm identifier - which version of bcrypt produced this hash.
12 :: The cost factor - how many rounds of internal hashing to run. Each increment doubles the work, so 12 is roughly 4,096 times slower to compute than a cost of 1.
Next 22 characters :: The salt - randomly generated fresh for this one password, at the moment it was hashed.
The rest :: The actual hash output, computed from the password AND that salt together.
:::

Because the salt is random per password and stored right alongside the hash, two users with the identical password "hunter2" get two completely different stored hashes - which is exactly what defeats a rainbow table, since precomputing one table per possible salt is infeasible.

::: remember
\`bcrypt.compare(attempt, storedHash)\` never "decrypts" anything - there is nothing to decrypt. It reads the salt and cost factor back out of the stored hash itself, re-runs the exact same hashing process on the new attempt using that same salt and cost, and checks whether the result matches byte for byte. The comparison itself, done correctly, also runs in constant time regardless of how much of the string matches, so an attacker timing the response cannot learn anything from how quickly a wrong guess was rejected.
:::

::: checkpoint
Two users both set their password to "sunshine1". Their stored bcrypt hashes are completely different strings. Why?
- ( ) bcrypt is broken and produces random output
- (x) Each password was hashed with its own randomly generated salt, so identical passwords never produce identical stored hashes
- ( ) One of the accounts must have a different password than they think
- ( ) bcrypt hashes change every time you compare them
> The salt is generated fresh, per password, at hashing time, and stored as part of the hash string itself. Identical inputs with different salts produce entirely different outputs, which is precisely what defeats a precomputed rainbow-table attack.
:::

## Why "increase the cost factor" is a real, ongoing decision

Hardware gets faster every year, which means a cost factor considered comfortably slow in 2015 is measurably faster to brute-force today. This is not a one-time setting - it is a dial teams are expected to revisit, raising it as hardware improves, so that a cost factor of 12 today might reasonably become 13 or 14 in a few years, imposing the same real-world delay on an attacker despite faster processors.`,
    codeExample: {
      language: "javascript",
      code: `import bcrypt from "bcrypt";

// SIGNUP - never store the raw password, not even for a moment longer
// than it takes to hash it.
const rawPassword = "correct horse battery staple";
const costFactor = 12; // each +1 roughly doubles the work required
const passwordHash = await bcrypt.hash(rawPassword, costFactor);

console.log(passwordHash);
// "$2b$12$KIXQ4z8N0y6r50F1U8s3F.eqjW1z3p9m4kS8bU8kQyq6z6h6z6h6O"
// This exact string is what gets written to the database. The variable
// rawPassword should now be discarded and never logged, ever.

// LOGIN - compare, never decrypt. There is nothing to decrypt.
const attempt = "correct horse battery staple";
const matches = await bcrypt.compare(attempt, passwordHash);
console.log(matches); // true

const wrongAttempt = "correct horse battery staple!";
console.log(await bcrypt.compare(wrongAttempt, passwordHash)); // false`,
      expectedOutput: `passwordHash prints a 60-character string starting "$2b$12$" - the algorithm version and cost factor are visible in plain sight, followed by a 22-character salt, followed by the actual hash. bcrypt.compare(attempt, passwordHash) returns true only when hashing "attempt" with the salt and cost factor extracted from passwordHash reproduces that exact stored string - it never reverses passwordHash back into a password, because that operation does not exist.`,
    },
    commonMistakes: [
      "Storing a password with a fast general-purpose hash like MD5 or SHA-256 instead of a password-specific algorithm like bcrypt, scrypt or Argon2",
      "Encrypting a password instead of hashing it, which means anyone who ever gets the encryption key gets every password back in plain text",
      "Hashing without a salt, or reusing one fixed salt for every user, which makes identical passwords produce identical (and rainbow-table-crackable) hashes",
      "Choosing a cost factor once and never revisiting it as hardware gets faster",
      "Comparing a submitted password to a stored hash with a plain string equality check instead of the library's own compare function, which can leak timing information",
    ],
    industryPerspective: `NIST's own digital identity guidelines (SP 800-63B) explicitly require a "memory-hard" hashing function for stored passwords - one that costs real memory as well as real time to compute, specifically to blunt attacks run on GPUs and custom hardware, which are extremely good at raw computation but far more expensive to scale in memory. bcrypt is moderately memory-hard; Argon2, the winner of the 2015 Password Hashing Competition, was designed around exactly this property from the start and is now the recommendation OWASP leads with for new systems.

The 2012 LinkedIn breach referenced in this lesson's story is now taught as close to a textbook case precisely because the failure was so avoidable - password-specific hashing algorithms already existed and were already recommended practice at the time. The recurring lesson engineers draw from it is blunt: whatever hashing library your framework or platform ships by default is very likely the correct choice, and writing a custom one is one of the more reliable ways to reintroduce a solved problem.`,
    devertCaseStudy: `This lesson describes a problem DeVert's own code never has to solve, and it's worth being explicit about why rather than treating that as incidental. Because the platform's only sign-in method is Google Sign-In through Firebase Authentication, no DeVert password is ever typed into a DeVert form, sent to a DeVert server, or written into a DeVert database - there is no \`passwordHash\` field anywhere in a DeVert user document, because there was never a raw password on DeVert's side to hash in the first place.

That responsibility sits entirely with Google, whose password-storage practices are, unsurprisingly, well beyond what a small team could reasonably build and maintain on its own - this is precisely the kind of "solved problem, don't rebuild it" case the industry perspective above describes. What DeVert does instead is receive a signed token from Firebase once Google has already vouched for the user, which is the subject of two lessons from now.

The one place a hash genuinely does real work inside DeVert's own infrastructure is unrelated to login: the Cloud Run backend proxies Judge0 code execution for CodeLab using an API key that must never reach the browser, kept entirely server-side rather than hashed - a different problem (secret-keeping, not password-verification) with a different correct answer, which the deployment module covers.`,
    knowledgeChecks: [
      {
        question: "Why is hashing the correct operation for storing a password, rather than encryption?",
        options: [
          "Hashing is faster to compute than encryption",
          "Encryption is reversible given the right key, meaning anyone who obtains that key recovers every plaintext password - hashing has no reverse operation at all, by design",
          "Encryption cannot be applied to text data",
          "Hashing takes up less storage space",
        ],
        correctIndex: 1,
        explanation: "A server never needs to see a password again after first checking it - only to confirm a future guess matches. Encryption's reversibility is a liability here, not a feature; hashing removes the plaintext from existence entirely.",
      },
      {
        question: "Two users choose the identical password. Why do they end up with completely different stored bcrypt hashes?",
        options: [
          "bcrypt produces random output regardless of input",
          "Each hash includes a randomly generated salt unique to that password, so identical inputs never produce identical stored output",
          "Only one of the two hashes is actually correct",
          "bcrypt hashes are re-randomized every time the account logs in",
        ],
        correctIndex: 1,
        explanation: "The salt is generated fresh per password and stored as part of the hash string. This is specifically what defeats rainbow-table attacks, which rely on identical inputs producing identical, precomputable outputs.",
      },
      {
        question: "What does increasing bcrypt's cost factor actually accomplish?",
        options: [
          "It makes the resulting hash string shorter",
          "It deliberately increases how much computation is required per hash attempt, making brute-force guessing proportionally slower even as hardware gets faster",
          "It encrypts the hash a second time",
          "It changes which characters are allowed in the password",
        ],
        correctIndex: 1,
        explanation: "Cost factor is a tunable slowness dial, roughly doubling with each increment - a deliberate defence against brute-force guessing, meant to be raised over time as hardware speeds up.",
      },
    ],
    lab: {
      title: "Hash a password and watch bcrypt's own structure",
      brief: `bcrypt's output format is designed to be self-describing - you can read the algorithm version, cost factor and salt straight off the string, no documentation required. Seeing that with real output makes "the hash carries its own recipe" concrete.`,
      steps: [
        "In a Node.js project, run \`npm install bcrypt\`, then hash the same password twice with \`await bcrypt.hash(\"test1234\", 12)\` in two separate calls.",
        "Compare the two resulting strings character by character. They should be entirely different, despite hashing the identical password - that's the salt at work.",
        "Split either hash on its dollar signs and identify the three sections: algorithm version, cost factor, and the salt+hash portion.",
        "Call \`await bcrypt.compare(\"test1234\", <either hash from step 1>)\` and confirm it returns true for both, despite the hashes themselves being different strings.",
        "Time \`await bcrypt.hash(\"test1234\", 10)\` versus \`await bcrypt.hash(\"test1234\", 14)\` using \`console.time\`/\`console.timeEnd\` - notice roughly how much slower four extra cost-factor steps make it.",
      ],
      starterCode: `import bcrypt from "bcrypt";

const hash1 = await bcrypt.hash("test1234", 12);
const hash2 = await bcrypt.hash("test1234", 12);
console.log(hash1);
console.log(hash2);
console.log(hash1 === hash2); // false - different salts, same password

console.time("cost 10");
await bcrypt.hash("test1234", 10);
console.timeEnd("cost 10");

console.time("cost 14");
await bcrypt.hash("test1234", 14);
console.timeEnd("cost 14");`,
    },
    assignment: {
      reflection: "Explain in your own words why 'the site can email me my forgotten password' is a strong signal the site is doing this badly - what would have to be true about their storage for that feature to even be possible?",
      practice: "Run the lab above and record the actual millisecond difference between cost factor 10 and cost factor 14 on your own machine.",
      reading: "Read the password storage section of the OWASP Authentication Cheat Sheet linked below and note which algorithm it recommends first, and why.",
    },
    summary: "Passwords must be hashed, never encrypted, because hashing has no reverse operation at all while encryption is reversible by design given its key - and a server should never be able to recover a password it once received. A general-purpose fast hash like SHA-256 is still the wrong tool, because speed enables brute-forcing and identical inputs produce identical, rainbow-table-crackable outputs. Password-specific algorithms like bcrypt solve both problems at once: a random salt unique to each password defeats precomputed tables, and a deliberately expensive cost factor - tunable upward as hardware improves - makes each individual guess slow. bcrypt.compare never decrypts anything; it re-derives the hash from the same salt and cost factor and checks for an exact match.",
    goingDeeper: `## Argon2 and the Password Hashing Competition

bcrypt dates to 1999 and has held up remarkably well, but it is not the newest word on this problem. Argon2, which won a public, multi-year Password Hashing Competition in 2015, was designed from scratch to be memory-hard in a stronger sense than bcrypt - deliberately expensive not just in CPU time but in the amount of RAM required per hash attempt, which disproportionately hurts attackers trying to run millions of parallel guesses on cheap, memory-limited hardware like GPUs.

::: didyouknow
"Memory-hard" exists as a design goal specifically because GPUs and custom ASICs are extraordinarily good at raw repeated computation but comparatively expensive to equip with large amounts of fast memory per parallel unit. A hashing algorithm that requires real memory per guess narrows the hardware advantage an attacker can bring to bear, in a way that a purely CPU-slow algorithm does not.
:::

OWASP's current guidance leads with Argon2id for new systems, with bcrypt still listed as an entirely acceptable choice - not a mistake to fix, just an earlier and slightly less strong point on the same design spectrum. Migrating an existing bcrypt-based system to Argon2 is rarely urgent; choosing between them for a brand-new one is a fair, small decision either way.`,
    resources: [
      { kind: "link", title: "OWASP: Password Storage Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html", description: "The canonical, regularly updated recommendation on which algorithm and parameters to use today." },
      { kind: "link", title: "bcrypt npm package", url: "https://www.npmjs.com/package/bcrypt", description: "The library used in this lesson's code example, with its full API documented." },
    ],
    tags: ["authentication", "hashing", "bcrypt", "security"],
  },

  "sessions-and-cookies": {
    subtitle: "How a login turns into an ongoing conversation the server can check",
    difficulty: "Intermediate",
    estimatedMinutes: 17,
    xpReward: 23,
    coinReward: 9,
    learningObjectives: [
      "Trace the full session-cookie flow from a successful login through to a later authenticated request",
      "Explain what a session actually stores, and why the cookie itself holds none of it",
      "Name the cookie attributes that matter for a session cookie specifically, and what each one defends against",
      "Explain why session storage has to be shared once more than one server is involved",
    ],
    prerequisites: ["Password Hashing and Why Never to Store a Password"],
    story: `A password check, by itself, only answers a question for one instant: was this specific guess, submitted right now, correct? The moment the response for that request finishes sending, the server has already forgotten it happened - exactly as this module's opening lesson described HTTP forgetting everything, by default.

So a login has to do one more thing, immediately after the password check succeeds, or the whole exercise was pointless: it has to hand the browser something it can bring back on every future request, so the server never has to ask for that password again this visit. That "something" is either a session, covered in this lesson, or a token, covered in the next - and a session is the older, still enormously common answer.

The trick is simple to say and easy to get subtly wrong: the cookie itself should hold almost nothing of value. What matters lives on the server, and the cookie is just a claim ticket pointing at it.`,
    problemStatement: `Immediately after \`bcrypt.compare\` returns true, the server knows exactly one thing: this particular request, at this particular moment, proved it knew the right password. That knowledge is worthless for the next request unless something durable gets created and something portable gets handed to the browser to reference it by.

The session-and-cookie approach solves this by keeping the actual facts - who is signed in, since when, with what permissions - entirely on the server, in a session store, and handing the browser only an opaque, unguessable id. Every later request brings that id back automatically via a cookie, the server looks it up, and finds the same facts again without a single further password check.`,
    concept: `## The three parts of a session

::: cards
Session ID :: A long, random, unguessable string. Meaningless by itself - useful only as a lookup key.
Session store :: Wherever the server keeps the data that id points to - in memory for a toy project, or a shared store like Redis for anything running more than one server.
Session data :: The actual content: which user this is, when they signed in, anything else worth remembering for the length of this visit.
:::

## The full flow, end to end

::: timeline From a successful login to a later authenticated request
Password check succeeds :: bcrypt.compare returns true, exactly as the previous lesson covered.
A new session is created :: A fresh, random session id is generated - never reused from before login, which defends against session fixation - and a record is written to the session store mapping that id to this user.
Set-Cookie goes to the browser :: The session id, and only the id, is sent back as a cookie - HttpOnly so page JavaScript can never read it, Secure so it's only ever sent over HTTPS, and typically SameSite=Lax.
Every later request :: The browser attaches that cookie automatically. The server reads the id, looks it up in the session store, and finds the user it points to - no password check repeated.
Logout :: The server deletes the session record. The browser's cookie may still physically exist, but the id it holds now points at nothing at all.
:::

::: remember
Notice the cookie never holds "who is signed in" directly - only a pointer to a record that says so. This matters because a cookie is just text sitting in a browser; if it directly held something like a role or a user id in a form the server trusted at face value, anyone could simply edit it. An opaque, random id that means nothing without the matching server-side record removes that whole category of tampering.
:::

## Why the store has to be shared once there's more than one server

A single toy server can keep sessions in a plain in-memory object - id in, user out - and it works fine, right up until there is a second server.

::: cards Three places a session can live
In-process memory :: Simplest, and it breaks the moment a load balancer sends two requests from the same signed-in user to two different servers - one of them has simply never heard of that session id.
Sticky sessions :: A load balancer configured to always route one user to the same server, which papers over the problem without solving it - and fails the moment that one server restarts.
Shared store (Redis, a database) :: Every server reads and writes the same external store, so it does not matter which one handles any given request. This is the standard production answer once more than one server exists.
:::

::: checkpoint
An app runs behind a load balancer with two servers, each keeping sessions in its own memory, with no sticky routing. A user logs in on server A, and their very next request happens to land on server B. What happens?
- ( ) Nothing - the two servers' memory is automatically shared
- (x) Server B has no record of that session id, so the user appears signed out despite having just signed in successfully
- ( ) The cookie itself gets rejected by server B
- ( ) The load balancer merges the two servers' memory on the fly
> Each server's in-memory session store is private to that one process. Without a shared store like Redis, a session created on server A is invisible to server B - which is exactly the scaling failure that makes shared session storage close to mandatory in production.
:::

## The cookie attributes that actually matter here

::: cards Every attribute is a rule about when the cookie is sent
HttpOnly :: Page JavaScript can never read this cookie's value at all, which limits what an injected malicious script (XSS) can steal even if it manages to run.
Secure :: Sent only ever over HTTPS, never plain HTTP, closing off interception on an untrusted network.
SameSite=Lax (or Strict) :: Withholds the cookie on most cross-site requests, which is the modern defence against cross-site request forgery - a different site tricking your browser into sending an authenticated request to this one.
Expiry / Max-Age :: How long the cookie itself persists in the browser - separate from how long the session record on the server stays valid, which the server enforces independently.
:::`,
    codeExample: {
      language: "javascript",
      code: `// LOGIN - after bcrypt.compare succeeds, create a session and hand the
// browser only a pointer to it.
app.post("/login", async (req, res) => {
  const user = await verifyCredentials(req.body); // previous lesson's job

  const sessionId = crypto.randomUUID(); // fresh - never reused from before login
  await sessionStore.set(sessionId, { userId: user.id, createdAt: Date.now() });

  res.cookie("sessionId", sessionId, {
    httpOnly: true,   // page JavaScript can never read this value
    secure: true,      // only ever sent over HTTPS
    sameSite: "lax",   // withheld on most cross-site requests
    maxAge: 1000 * 60 * 60 * 8, // 8 hours
  });
  res.json({ ok: true });
});

// EVERY LATER REQUEST - the browser attaches the cookie automatically.
app.get("/api/me", async (req, res) => {
  const sessionId = req.cookies.sessionId;
  const session = sessionId && await sessionStore.get(sessionId);

  if (!session) return res.status(401).json({ error: "Not signed in" });
  res.json({ userId: session.userId });
});

// LOGOUT - destroy the record. The cookie's id, if it still exists in the
// browser, now points at nothing.
app.post("/logout", async (req, res) => {
  await sessionStore.delete(req.cookies.sessionId);
  res.clearCookie("sessionId");
  res.json({ ok: true });
});`,
      expectedOutput: `After /login, the response carries a Set-Cookie header the browser stores and automatically re-attaches to every later request to this site. Calling GET /api/me afterward returns { "userId": ... } without the client ever resending a password. After /logout, the exact same request to /api/me returns 401 - not because the cookie vanished from the browser (clearCookie asks it to, but that's a courtesy, not a guarantee), but because sessionStore.get() now returns nothing for that id.`,
    },
    commonMistakes: [
      "Storing meaningful data - a user id, a role, a permission flag - directly inside the cookie itself, rather than an opaque id pointing at a server-side record",
      "Keeping sessions in a single server's memory and being confused when users behind a load balancer randomly appear signed out",
      "Omitting HttpOnly or Secure on a session cookie, leaving it readable by an injected script or sendable over plain HTTP",
      "Believing logout means 'the browser deletes the cookie', when what actually matters is the server destroying the record the cookie's id pointed to",
      "Never regenerating the session id at the moment of login, leaving an application open to session fixation",
    ],
    industryPerspective: `Framework defaults are a good tell for how seriously this is taken in practice: Express with express-session, Django, Rails and PHP all default to a signed, HttpOnly, short-idle-timeout cookie holding nothing but an opaque id, and all of them regenerate that id on login automatically, without a developer having to remember, precisely because session fixation was for years a routine finding in web security audits.

The shared-store requirement is also why Redis became close to mandatory infrastructure for any web application expected to run on more than one server: it answers a lookup fast enough to check on every single request without adding noticeable latency, and treating session storage as "just another key-value pair in Redis" is the standard industry answer rather than a shortcut. Idle timeout, separately, is a business decision as much as a technical one - a banking app might expire a session after a couple of minutes of inactivity, while a content site tolerates a day, and that choice has nothing to do with the mechanics above and everything to do with how bad a stolen, still-valid session id would actually be for that particular product.`,
    devertCaseStudy: `DeVert has no session store anywhere in its architecture, and that absence is the clearest possible illustration of the trade-off this lesson sets up for the next lesson to resolve. When a student signs in, Firebase Auth issues a signed JWT rather than a session id pointing at a record the server must keep. That token already carries the claims Firestore's security rules need directly - \`request.auth.uid\`, and a custom \`admin\` claim - so there's no lookup to perform on every request, and critically, no sessions table anywhere that a server restart could lose.

The cost is exactly the one named in this lesson's remember box, applied to tokens instead of sessions: DeVert cannot instantly kill one specific signed-in user's access the way deleting a session record would, because there is no session record to delete. Revoking access before a token's natural expiry needs an explicit mechanism - which is precisely why granting or revoking DeVert's \`admin\` custom claim via \`scripts/set-admin-claim.mjs\` explicitly requires that user to sign out and back in. The old token stays technically valid, by design, until it's naturally refreshed or expires on its own - the session model's easy "delete one row" revocation simply isn't available in a system with no sessions table to delete a row from.`,
    knowledgeChecks: [
      {
        question: "What does a session id actually represent, by itself, with no server-side record behind it?",
        options: [
          "The user's full profile, compressed into a short string",
          "An opaque lookup key that means nothing until matched against a server-side record",
          "A password",
          "A cryptographic proof of identity that needs no lookup",
        ],
        correctIndex: 1,
        explanation: "A session id is just a random string. The account, permissions or data it represents only exist because a server is holding a record that string happens to key into.",
      },
      {
        question: "Why does storing sessions in a single server's own memory break down once a load balancer distributes requests across multiple servers?",
        options: [
          "It doesn't - all servers automatically share process memory",
          "A session created on one server is invisible to the others, so a request landing on a different server finds no matching record",
          "Load balancers do not support cookies",
          "In-memory storage is always slower than a shared store",
        ],
        correctIndex: 1,
        explanation: "Each server's memory is private to that process. Without sticky routing or a shared store like Redis, only the server that created a session actually knows about it - the classic reason shared session storage becomes necessary once an app scales past one machine.",
      },
      {
        question: "Which cookie attribute specifically prevents a malicious script running on the same page from reading a session cookie's value?",
        options: ["Secure", "SameSite", "HttpOnly", "Max-Age"],
        correctIndex: 2,
        explanation: "HttpOnly hides the cookie from any JavaScript running on the page - a direct defence limiting what an XSS attack can steal even if it manages to execute code on the page at all.",
      },
    ],
    lab: {
      title: "Watch a session appear, and stop working, without touching a browser at all",
      brief: `A session cookie's value is inspectable in your own devtools on any site using classic sessions, including the exact moment logout severs the connection between the cookie and anything it used to mean.`,
      steps: [
        "Sign into a site you believe uses classic sessions (look for a cookie named something like sessionid, connect.sid, JSESSIONID or PHPSESSID) and copy that cookie's value somewhere safe.",
        "Sign out through the site's normal logout flow, then check devtools' Application/Storage tab - note whether the cookie disappeared entirely, or is still present but you can no longer use the site as signed in.",
        "Sign back in and compare the new cookie's value against the one you copied earlier - a different value on every login is session regeneration happening in front of you, exactly as this lesson describes.",
        "If the site offers a 'sign out of all devices' option, use it from one browser and confirm a second, still-open browser also loses access immediately - that's the server deleting a session record, not any cookie being touched.",
      ],
      starterCode: `# No commands needed - this lab is entirely devtools UI.
# Chrome/Edge: F12 -> Application tab -> Cookies
# Firefox: F12 -> Storage tab -> Cookies
#
# Look for a cookie named one of: sessionid, connect.sid, JSESSIONID, PHPSESSID`,
    },
    assignment: {
      reflection: "Explain in two sentences why 'the browser still has the cookie' and 'the user is still signed in' are not actually the same fact.",
      observation: "Find a site whose session cookie's value visibly changes between one login and the next, and treat that as direct evidence of session regeneration.",
      practice: "Sketch, in plain English, what a shared Redis-backed session store buys you that in-memory storage on a single server does not.",
    },
    summary: "A session is server-side state - who is signed in, since when - referenced by an opaque id the cookie merely carries; the cookie itself should hold nothing meaningful. Login creates a fresh session record and id; every later request looks that id up automatically via the cookie; logout deletes the record, regardless of whether the browser's cookie physically still exists. In-memory session storage breaks the moment more than one server is involved, which is why shared stores like Redis are standard in production. HttpOnly, Secure and SameSite are the cookie attributes doing real security work, and regenerating the session id at login defends against session fixation. DeVert has no session store at all, having chosen the token-based alternative this lesson sets up for the next lesson to explain.",
    goingDeeper: `## Sliding versus absolute expiry

A session can expire two different ways: an absolute lifetime ("this session dies eight hours after login, no matter what") or a sliding one ("this session dies after thirty minutes of inactivity, resetting on every request"). Most systems use sliding expiry for convenience and add an absolute cap on top, so an account left open in a browser tab for a week doesn't stay valid forever just because something in the background keeps refreshing it.

## Why sessions haven't disappeared even with tokens everywhere

::: interview
"Why would you choose sessions over JWTs for a new project?" is a fair systems-design question, and the honest answer is: whenever instant revocation matters more than avoiding a shared store. Banking, admin panels and anything where "kick this user out right now" needs to actually work immediately still lean toward server-side sessions - or tokens paired with an explicit revocation check - because a signed token nobody can un-sign is a poor fit for "I need this access gone in the next request, not whenever it happens to expire naturally."
:::`,
    resources: [
      { kind: "link", title: "OWASP Session Management Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html", description: "The industry-standard reference on session fixation, regeneration and secure session design." },
      { kind: "link", title: "MDN: Using HTTP cookies", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies", description: "The full reference for every cookie attribute mentioned in this lesson." },
    ],
    tags: ["authentication", "sessions", "cookies", "security"],
  },

  "jwt-tokens-explained-properly": {
    subtitle: "A signed statement you can read but not forge",
    difficulty: "Intermediate",
    estimatedMinutes: 19,
    xpReward: 25,
    coinReward: 10,
    learningObjectives: [
      "Explain the three parts of a JWT and what each one is actually for",
      "Correctly distinguish decoding a token from verifying it, and explain why the second is the only one that matters for trust",
      "Explain why a JWT's payload must never contain anything secret, since it is only encoded, not encrypted",
      "Explain what 'claims' are, using DeVert's own admin claim as a concrete example",
    ],
    prerequisites: ["Sessions and Cookies"],
    story: `Paste any JWT into a JavaScript console and run one line of code, and its entire payload - every field inside it - prints out in plain, readable JSON. No secret key required. No login needed. Just \`atob()\`, the same built-in function that decodes any base64 string.

That is not a bug, and it is not a weakness someone forgot to close. It is exactly how a JWT is supposed to work, and it trips up almost everyone who meets the format for the first time - because the natural assumption is that anything called a "token" that "proves who you are" must be some kind of ciphertext, unreadable without a key. A JWT is the opposite: readable by anyone who has it, and forgeable by no one who doesn't hold the one key that signed it. Those are two entirely different properties, and this lesson is about not confusing them.`,
    problemStatement: `The previous lesson's session model requires the server to keep a record of every signed-in user somewhere it can look up on every request. That is a real cost - storage, replication across servers, and the ongoing job of expiring old records. A token-based approach avoids the lookup entirely by having the server hand the client a statement about itself that the client cannot alter without the change being detectable.

That statement needs three things at once: a standard shape both sides agree on, a way to prove it was genuinely issued by the server and not tampered with afterward, and a way for anyone reading it to tell what it claims without needing a database at all. JWT (JSON Web Token) is the format almost the entire industry converged on for exactly this job.`,
    concept: `## The three parts, literally

A JWT is a single string made of three base64url-encoded sections, separated by dots:

  header.payload.signature

::: cards What each section actually is
Header :: A small JSON object naming the signing algorithm and token type - e.g. { "alg": "RS256", "typ": "JWT" }. Tells the verifier how to check the signature.
Payload :: A JSON object holding the actual claims - facts about the token's subject, like who it belongs to and when it expires. This is the part people mean when they say "what's in the token".
Signature :: Computed by the issuer over the header and payload together, using a secret or private key only the issuer holds. This is the part that actually proves the token wasn't forged or altered.
:::

## Decoding is not verifying - the single most important sentence in this lesson

Anyone can take the payload section, base64-decode it, and read the resulting JSON - it requires no key, no secret, no permission of any kind, because base64 is an encoding, not encryption. \`atob()\` in a browser console does it in one call.

::: remember
Decoding a JWT tells you what it claims. Verifying a JWT tells you whether those claims can be trusted - by recomputing the signature from the header and payload using the issuer's public key or shared secret, and checking it matches the signature attached to the token. A server that reads a token's payload without also verifying its signature is trusting a string an attacker could have written by hand.
:::

This is exactly why a JWT's payload must never hold anything actually secret - a password, a credit card number, an internal system id you'd rather stay private. Anyone who ever gets hold of the token - a browser extension, a proxy log, a careless \`console.log\` - can read every field in it without breaking anything at all.

## Claims: the vocabulary a payload speaks

::: cards Common claim types
Registered claims :: Standard field names the JWT specification defines - sub (subject, usually a user id), iat (issued at), exp (expiry timestamp), iss (issuer).
Custom claims :: Anything the issuer chooses to add - a role, a plan tier, a permission flag. These are exactly as trustworthy as the issuer that signed the token, and no more.
:::

::: checkpoint
A JWT's payload contains \`{ "sub": "user_42", "admin": true, "exp": 1755003600 }\`. A developer reads this with atob() and, seeing admin: true, grants the request admin access without checking anything else. What is wrong with this?
- ( ) atob() cannot decode JWT payloads
- (x) Decoding the payload only reveals what it claims - it says nothing about whether the signature is valid, so the developer has no actual proof this token wasn't forged or tampered with
- ( ) JWTs cannot contain boolean values
- ( ) The exp field means the token has already expired
> Reading the JSON inside a token's payload is trivial and proves nothing on its own. Trust comes entirely from verifying the signature against the issuer's key - skip that step, and admin: true might as well have been typed into the payload by the attacker themselves.
:::

## Why JWTs avoid the session lookup entirely

Because a valid signature is proof enough that the payload hasn't changed since the issuer signed it, a server can trust a JWT's claims without a database round trip at all - it recomputes and checks the signature, reads sub and exp and any custom claims directly, and answers the request. That is the entire appeal: no session store, no shared Redis instance, no lookup on the hot path of every single request.

::: remember
The trade-off this buys is the one the previous lesson's Going Deeper named from the other direction: a session can be revoked instantly by deleting one record; a JWT, once issued, stays cryptographically valid until it naturally expires, because nobody can un-sign it early. Revoking one specific token before its natural expiry generally requires either a short expiry plus frequent reissue, or an explicit blocklist checked on top of signature verification - which quietly reintroduces the shared-lookup cost tokens were meant to avoid.
:::`,
    codeExample: {
      language: "javascript",
      code: `// A real JWT has three base64url parts separated by dots.
const token =
  "eyJhbGciOiJSUzI1NiIsImtpZCI6ImFiYzEyMyJ9." +
  "eyJzdWIiOiJ1c2VyXzEyMyIsImVtYWlsIjoicHJpeWFAZXhhbXBsZS5jb20iLCJhZG1pbiI6dHJ1ZSwiaWF0IjoxNzU1MDAwMDAwLCJleHAiOjE3NTUwMDM2MDB9." +
  "s3cr3t_signature_only_the_issuer_could_produce";

// DECODING - reading the payload requires no key at all. This is NOT
// verification; it is just reversing an encoding, same as reading base64
// anywhere else.
const [headerB64, payloadB64] = token.split(".");
const payload = JSON.parse(atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")));

console.log(payload);
// {
//   sub: "user_123",
//   email: "priya@example.com",
//   admin: true,
//   iat: 1755000000,
//   exp: 1755003600
// }

// VERIFYING - the part that actually matters, and the part that
// genuinely requires the issuer's key. This is what a real server does
// server-side; it is not something you'd ever do by hand with atob().
// const verifiedPayload = jwt.verify(token, publicKey, { algorithms: ["RS256"] });
// verifiedPayload throws if the signature doesn't match - meaning the
// token was tampered with, expired, or never legitimately issued at all.`,
      expectedOutput: `Decoding prints the full payload object, including admin: true, using nothing but atob() - proving how trivially readable a JWT's payload is to anyone who holds the token, with or without permission. Actually calling something like jwt.verify() with the correct public key either returns that same payload (proving the signature is authentic and the token untampered) or throws an error - and only the second outcome is something a server should ever act on.`,
    },
    commonMistakes: [
      "Putting sensitive data - a password, a raw credit card number, an internal secret - directly into a JWT payload, since anyone holding the token can decode and read it with zero effort",
      "Treating a token as trustworthy after decoding its payload, without also verifying its cryptographic signature",
      "Trusting a client to set or modify a claim like 'role' or 'admin' themselves, rather than only ever trusting claims the server itself signed in the first place",
      "Storing a long-lived JWT somewhere JavaScript can read it (like localStorage) for a use case where an HttpOnly cookie would resist theft via an injected script better",
      "Assuming a JWT can be individually revoked the same way a session record can simply be deleted",
    ],
    industryPerspective: `JWT is standardised as RFC 7519, and its dominance is largely about avoiding the shared-session-store problem in distributed systems: a microservice architecture with a dozen independently scaled services can each verify a JWT locally with a shared public key, with zero coordination between them and no shared database of active sessions to keep consistent - a genuinely large operational simplification over sessions in that specific setup.

The industry has also learned some hard lessons about JWT implementation specifically. A once-real vulnerability class involved trusting the "alg" field inside the token's own header - some libraries would happily accept a token claiming "alg: none" (no signature at all) or let an attacker swap an asymmetric algorithm for a symmetric one the server would then verify against its own public key as if it were a shared secret. Modern libraries default to an explicit allow-list of accepted algorithms passed by the verifying code, specifically closing that hole - which is exactly why the code example above passes \`algorithms: ["RS256"]\` explicitly rather than trusting whatever the token's own header claims.`,
    devertCaseStudy: `Every fact in this lesson is directly load-bearing on DeVert's actual architecture, not a hypothetical. When a student signs in with Google, Firebase Authentication issues a signed ID token - a JWT - and DeVert's Firestore Security Rules are, quite literally, the "server" verifying it on every single read and write: rules like \`request.auth.uid\` and \`request.auth.token.admin\` are reading claims directly off that verified token, with Firestore itself performing the signature check before a rule ever runs.

The custom \`admin\` claim mentioned throughout this lesson is a real, concrete example of a custom claim in the sense defined above: it is not something Google ever told Firebase about a user, and it is not something the browser can set. It is granted entirely server-side, using the Firebase Admin SDK, in \`scripts/set-admin-claim.mjs\`:

  const user = await admin.auth().getUserByEmail(email);
  await admin.auth().setCustomUserClaims(user.uid, { admin: true });

That claim only becomes real inside a signed token after the affected user signs out and back in - exactly the trade-off this lesson names: DeVert cannot rewrite a token already issued, so the change waits for the next one. And because DeVert also has a separate, stricter \`superAdmin\` claim reserved for payments and revenue data, this module's later lesson on roles builds directly on the exact custom-claims mechanism this lesson introduces.`,
    knowledgeChecks: [
      {
        question: "What is the actual difference between decoding a JWT and verifying one?",
        options: [
          "There is no difference - they mean the same thing",
          "Decoding reads the claims inside the payload, which requires no key at all; verifying checks the signature against the issuer's key to confirm the claims can actually be trusted",
          "Decoding requires the issuer's private key; verifying does not",
          "Verifying only works on tokens issued in the last hour",
        ],
        correctIndex: 1,
        explanation: "Decoding is just reversing a base64 encoding - anyone can do it. Verifying is the cryptographic step that actually establishes trust, and it's the only one a server should ever act on.",
      },
      {
        question: "Why must a JWT's payload never contain genuinely sensitive data, like a password?",
        options: [
          "JWT payloads have a strict size limit that excludes it",
          "The payload is only base64-encoded, not encrypted, so anyone holding the token can read every field in it with no key required",
          "JWTs automatically strip sensitive-looking fields",
          "Sensitive data would break the signature verification",
        ],
        correctIndex: 1,
        explanation: "Base64 is a reversible encoding, not encryption - readable by anyone with the string. A JWT's confidentiality is essentially zero; its actual guarantee is integrity - that the payload wasn't altered since signing.",
      },
      {
        question: "In DeVert's real setup, what determines whether a signed-in user's Firestore requests are treated as an admin's?",
        options: [
          "A role field the browser sends with each request",
          "The admin claim inside their verified Firebase ID token, which only a server-side script using the Firebase Admin SDK can set",
          "Whether their email address matches a hardcoded list",
          "A cookie set by the login page",
        ],
        correctIndex: 1,
        explanation: "Firestore Security Rules check request.auth.token.admin off the verified JWT itself. That claim is granted entirely server-side via setCustomUserClaims - never something the client can set or influence.",
      },
    ],
    lab: {
      title: "Decode a real JWT, and watch verification actually fail",
      brief: `jwt.io is the standard tool for exactly this lesson - it decodes a token's payload instantly, and separately shows you whether a signature you supply actually verifies. Seeing both halves side by side is the fastest way to make 'decoding isn't verifying' concrete.`,
      steps: [
        "Sign into a site that uses Firebase Authentication (or generate a test token any other way you have access to), and copy its ID token or JWT.",
        "Paste it into jwt.io's decoder panel. Read the decoded header and payload - note every claim present, including any expiry timestamp.",
        "Without touching the signature, edit one character of the decoded payload on the right-hand side (for example, flip a boolean claim). Watch the 'signature verified' indicator immediately flip to invalid.",
        "In your own browser console, run atob() on just the payload section of any JWT you have (split the token on '.' and take the middle piece) and confirm you get the identical JSON jwt.io showed you - no tool required, no key required.",
      ],
      starterCode: `// In a browser console, with any JWT string assigned to \`token\`:
const payloadSection = token.split(".")[1];
const payload = JSON.parse(atob(payloadSection.replace(/-/g, "+").replace(/_/g, "/")));
console.log(payload);
// No key, no login, no permission needed for this step - which is the
// entire point of this lesson.`,
    },
    assignment: {
      reflection: "Explain in two or three sentences why 'I can read this token's payload' and 'I can trust this token's payload' are entirely different claims, using the jwt.io experiment above as your evidence.",
      observation: "Find a JWT you have legitimate access to (your own session on a site that uses one) and list every claim in its payload, noting which are registered claims (sub, exp, iat) and which look custom to that specific application.",
      practice: "Sketch what would need to be true for someone to forge a valid admin: true claim in a JWT they don't have signing rights for - and explain why that's effectively impossible with a properly configured signature algorithm.",
    },
    summary: "A JWT is three base64url sections - header, payload, signature - joined by dots. The payload holds claims (registered ones like sub and exp, or custom ones an issuer adds) and is only encoded, never encrypted, so anyone holding the token can decode and read it with a single function call and no key. Trust comes entirely from the signature: verifying it against the issuer's key confirms the payload hasn't been altered since signing, which is the only step that actually matters for security - decoding alone proves nothing. JWTs let a server skip a session-store lookup entirely, at the cost of being unable to instantly revoke one token before its natural expiry. DeVert's Firestore Security Rules verify a real Firebase-issued JWT on every request, reading claims including a custom admin flag that only a server-side Admin SDK script can ever set.",
    goingDeeper: `## Symmetric versus asymmetric signing

A JWT can be signed two structurally different ways. With a symmetric algorithm like HS256, one shared secret both signs and verifies - fine when only one server ever needs to check tokens, since that same server issued them. With an asymmetric algorithm like RS256, a private key signs and a separate public key verifies - the public key can be handed out freely to any number of independent services, each able to verify tokens without ever holding anything that could forge one. Firebase Authentication uses RS256 for exactly this reason: Firestore's rules engine, Cloud Functions, and any other service that needs to check a token can all verify independently against Google's published public keys, with no shared secret to protect or rotate.

::: interview
"Why does Firebase use RS256 instead of a simpler shared-secret algorithm?" is a fair systems question, and the honest answer traces straight back to this lesson: asymmetric signing lets many independent verifiers check a token's authenticity without any of them being trusted enough to have signed one themselves. It's the same reasoning behind HTTPS certificates, applied to authentication tokens instead of website identities.
:::`,
    resources: [
      { kind: "link", title: "jwt.io", url: "https://jwt.io", description: "The standard JWT decoder/debugger used throughout this lesson's lab - decode any token and inspect signature verification directly." },
      { kind: "link", title: "RFC 7519: JSON Web Token (JWT)", url: "https://datatracker.ietf.org/doc/html/rfc7519", description: "The actual specification defining the three-part structure and registered claim names used in this lesson." },
    ],
    tags: ["authentication", "jwt", "tokens", "security"],
  },

  "oauth-and-google-sign-in": {
    subtitle: "Letting Google vouch for you, without DeVert ever seeing a password",
    difficulty: "Intermediate",
    estimatedMinutes: 18,
    xpReward: 24,
    coinReward: 10,
    learningObjectives: [
      "Explain the problem OAuth solves and why 'just send us your Google password' was never on the table",
      "Trace a real Google Sign-In flow from button click to a usable identity token",
      "Distinguish an identity provider's token from the app's own session or JWT built on top of it",
      "Explain what DeVert gains, and gives up, by supporting only Google Sign-In",
    ],
    prerequisites: ["JWT: Tokens Explained Properly"],
    story: `In the mid-2000s, it was common for a travel-booking site to ask a user for their email password directly, so it could log in to their inbox and scan for flight confirmations. Users typed real Gmail or Yahoo passwords into third-party forms constantly, because there was no other way to grant "read my recent emails" without handing over everything.

That model has an obvious, enormous problem: the third-party site now holds a password capable of doing anything the real account can do - reading every email ever sent, resetting other linked accounts, all of it - to grant a favour as narrow as "check for flight confirmations". There was no way to ask for less. OAuth exists specifically to replace "hand over your password" with "let the identity provider itself decide exactly what to grant, and tell the requesting site only that, never the password."`,
    problemStatement: `A site that wants to let users sign in "with Google" has two theoretical options. It could ask the user to type their actual Google password into a form on its own site - the mid-2000s model, and a genuinely dangerous one, since that password could now do anything a real Google login could do, on a server the user has no reason to trust with it. Or it could redirect the user to Google itself, let Google handle the actual password check on Google's own login page, and receive back only a token proving Google vouches for this specific person - never the password itself.

OAuth (and OpenID Connect, the identity layer built on top of it that most "Sign in with X" buttons actually use) formalises the second option into a protocol every major provider and every major app now speaks the same dialect of.`,
    concept: `## The actors, named plainly

::: cards Who's who in an OAuth/OIDC flow
Resource owner :: The person - you, clicking "Sign in with Google".
Client :: The app requesting access - DeVert, in this module's running example.
Authorization server :: Google's own login and consent infrastructure. This is where the actual password gets checked, on Google's servers, never the client's.
Identity/resource server :: Whatever ends up issuing the actual token the client receives and uses afterward - for OpenID Connect sign-in, an ID token asserting who the user is.
:::

The property worth sitting with: the client (DeVert) never sees a password, never touches Google's login form, and never has the technical ability to intercept what the user types there, because the entire password-entry step happens on a page Google itself serves, not one the client controls.

## The flow, traced step by step

::: timeline A real Google Sign-In, start to finish
User clicks "Sign in with Google" :: The client redirects (or opens a popup) to Google's own authorization endpoint - a Google-controlled URL, not the client's.
User authenticates directly with Google :: Password, 2FA, passkey - whatever Google itself requires - happens entirely on Google's page. The client sees none of it.
Google asks for consent :: "DeVert wants to know your name and email" - the user explicitly agrees to what's being shared, scoped narrowly rather than "everything".
Google redirects back with a code :: A short-lived authorization code goes back to the client - not a password, not even the final token yet, just a code proving this exchange happened.
The client exchanges the code for tokens :: Behind the scenes, that code is traded for an ID token (a JWT, exactly as the previous lesson described) asserting who the user is, signed by Google.
The app builds its own session on top :: The client (or, as in DeVert's case, Firebase acting on the client's behalf) treats that verified identity as proven, and issues whatever the app itself uses going forward.
:::

::: remember
The authorization code exists specifically so the actual token exchange can happen server-to-server, away from the browser's address bar and history, rather than tokens themselves flying around as URL parameters where a browser history entry or a referrer header could leak them. This is a deliberate hardening step, not an arbitrary extra round trip.
:::

## Why "Sign in with Google" isn't quite OAuth on its own

Plain OAuth was designed for authorization - "let this app post to my timeline on my behalf" - not identity. OpenID Connect is a thin, standard layer on top of OAuth specifically for "tell me who this person is", adding the ID token format the previous lesson already covered. Almost every "Sign in with X" button you've ever clicked is OpenID Connect wearing OAuth's plumbing underneath, and the distinction rarely matters day to day - but it's why the ID token you receive at the end looks exactly like the JWT from the previous lesson, because it is one.

::: checkpoint
A user clicks "Sign in with Google" on a site. At what point does that site's own server ever see the user's actual Google password?
- ( ) Briefly, during the redirect back from Google
- ( ) When the authorization code is exchanged for a token
- (x) Never, at any point in the flow - the password is checked entirely on Google's own login page, which the requesting site never controls or observes
- ( ) Only if the user enables it in their Google account settings
> The entire point of the redirect to Google's own authorization endpoint is that password entry happens on a page the requesting site cannot see, intercept, or log. It receives back only a code, and later a signed token - never the credential itself.
:::

## What DeVert actually receives, concretely

Firebase Authentication handles almost the entire flow above on DeVert's behalf: it opens the Google popup, manages the redirect, exchanges the code, and hands the frontend a Firebase-issued ID token that already encodes Google's vouching for this user - the exact JWT the previous lesson decoded and verified.`,
    codeExample: {
      language: "javascript",
      code: `import { GoogleAuthProvider, signInWithPopup, signInWithCredential } from "firebase/auth";
import { auth } from "@/lib/firebase";

// The button-click handler DeVert's login page actually runs.
async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();

  // This one call runs the ENTIRE flow from this lesson's timeline:
  // opens Google's own login popup, the user authenticates directly with
  // Google (never with this code), Google redirects back with a code,
  // and Firebase exchanges that code for a signed ID token behind the
  // scenes - all before this line resolves.
  await signInWithPopup(auth, provider);

  // From here on, auth.currentUser holds a real, signed-in Firebase user
  // whose ID token was issued because Google vouched for them - this
  // code never touched a Google password, or any password at all.
}

// A fallback path DeVert also supports, when a popup is blocked: Google
// hands back an access token directly, which gets exchanged the same way.
async function signInWithGoogleAccessToken(accessToken) {
  const credential = GoogleAuthProvider.credential(null, accessToken);
  await signInWithCredential(auth, credential);
}`,
      expectedOutput: `After signInWithPopup resolves, auth.currentUser is a real signed-in user object. Calling await auth.currentUser.getIdTokenResult() returns the decoded, verified claims from that user's Firebase ID token - including any custom claims DeVert has granted, like admin. At no point in this code does a password, from Google or anywhere else, ever appear in a variable, a network request DeVert's own server can read, or a log line.`,
    },
    commonMistakes: [
      "Assuming an app using 'Sign in with Google' ever sees or handles the user's actual Google password at any point",
      "Confusing the authorization code (short-lived, meant to be exchanged once) with the final access or ID token it gets exchanged for",
      "Treating OAuth and OpenID Connect as unrelated protocols, rather than OIDC being a thin identity layer standardised on top of OAuth's existing plumbing",
      "Building a custom 'connect your Google account' flow from raw OAuth primitives instead of using a maintained library or managed provider, given how many subtle steps (state parameters, PKCE, token exchange) exist to get right",
    ],
    industryPerspective: `The 'state' parameter in a real OAuth flow (omitted from this lesson's simplified timeline for clarity) exists specifically to prevent cross-site request forgery against the sign-in flow itself - a randomly generated value the client sends before redirecting to Google and checks matches on the way back, closing a real attack where a malicious page tricks a victim's browser into completing someone else's sign-in flow. PKCE (Proof Key for Code Exchange), originally designed for mobile apps that can't safely keep a client secret, has since become recommended for web apps too, adding a dynamically generated secret per sign-in attempt so even an intercepted authorization code can't be exchanged by anyone except the party that started that specific flow.

The practical result across the industry is that essentially nobody hand-rolls raw OAuth request URLs and token exchanges anymore. Every major identity provider ships an SDK (Firebase Auth, Google Identity Services, Auth0's libraries) that implements state, PKCE, and the token exchange correctly, and the honest engineering advice is close to universal: use the SDK, don't reimplement the redirect dance by hand, because the failure modes are subtle and the blast radius of getting one wrong is an entire authentication system.`,
    devertCaseStudy: `This lesson's entire flow is, quite literally, DeVert's only sign-in path - there is no alternative to compare it against, because DeVert deliberately has no DeVert password at all. \`devert-frontend/app/login/page.jsx\` runs almost exactly the code shown above: a GoogleAuthProvider, a call to signInWithPopup(auth, provider), and a fallback that exchanges a Google access token via GoogleAuthProvider.credential() and signInWithCredential() when a popup gets blocked - covering both branches of this lesson's timeline in real, shipped code.

The result downstream is the whole reason this module keeps returning to it: Firebase Authentication becomes DeVert's entire authorization server and identity provider in one, and the token it hands back is the same signed JWT the previous lesson dissected, read directly by Firestore's Security Rules on every request. DeVert's AuthContext then layers a further check on top of that token - reading \`token.claims.admin === true\` off the result of \`getIdTokenResult()\` - which is a custom claim Google never granted and Firebase never invented on its own; it exists only because DeVert's own server-side script explicitly added it, the exact mechanism the next two lessons build on.

The trade-off is equally real and worth naming plainly: DeVert has no email/password recovery flow to build, maintain, or ever get wrong, because it never offered password sign-in to begin with - but a student without a Google account, or one unwilling to use it, simply cannot make a DeVert account at all. That is a deliberate, accepted limitation, not an oversight.`,
    knowledgeChecks: [
      {
        question: "In a real 'Sign in with Google' flow, at what point does the requesting app (the client) see the user's actual Google password?",
        options: [
          "During the redirect back from Google with the authorization code",
          "Never - password entry happens entirely on Google's own login page, which the client neither controls nor observes",
          "During the token exchange step",
          "Only for apps that request extra scopes",
        ],
        correctIndex: 1,
        explanation: "The whole design of OAuth/OIDC routes password entry through the identity provider's own interface specifically so the requesting app never has the technical opportunity to see or capture it.",
      },
      {
        question: "What is the actual relationship between OAuth and OpenID Connect?",
        options: [
          "They are competing, unrelated standards",
          "OpenID Connect is a thin identity layer standardised on top of OAuth's existing authorization plumbing, adding a standard ID token for 'who is this person'",
          "OAuth is used only for mobile apps, OIDC only for websites",
          "OpenID Connect replaced OAuth entirely and OAuth is now deprecated",
        ],
        correctIndex: 1,
        explanation: "OAuth alone was built for authorization (granting access to act on a user's behalf); OIDC layers identity on top of it, which is why an OIDC ID token is structurally the same JWT format the previous lesson covers.",
      },
      {
        question: "What does Firebase's signInWithPopup(auth, provider) call actually do, in terms of this lesson's timeline?",
        options: [
          "It sends the user's Google password directly to Firebase's servers",
          "It runs the entire OAuth/OIDC redirect, consent, code exchange and token-issuing flow on the app's behalf, resolving only once a verified Firebase ID token exists",
          "It skips Google entirely and creates a DeVert-only password",
          "It only works if the user has previously granted DeVert access manually",
        ],
        correctIndex: 1,
        explanation: "That single call is Firebase's SDK handling every step this lesson traced - the popup, Google's own authentication page, consent, code exchange - so the calling code never touches any of the individual OAuth mechanics directly.",
      },
    ],
    lab: {
      title: "Watch a real OAuth redirect happen, hop by hop",
      brief: `Any 'Sign in with Google' button on a real site will show you this lesson's entire timeline live in your browser's address bar and devtools, if you watch closely during the click.`,
      steps: [
        "Find any site with a 'Sign in with Google' button (or use DeVert's own /login page) and open devtools' Network tab before clicking it.",
        "Click the button and watch the address bar during the popup or redirect - note the domain changes to a real Google-owned URL (accounts.google.com) the moment the login page appears.",
        "After authenticating, watch for the redirect back to the original site's domain, and look in the Network tab for a request carrying a 'code' parameter - that's the authorization code from this lesson's timeline.",
        "If using DeVert's own login page, after signing in, open the console and inspect what auth.currentUser exposes - note that no password field, Google's or otherwise, appears anywhere in it.",
      ],
      starterCode: `# No commands needed - watch the address bar and Network tab during any
# real "Sign in with Google" flow. Look specifically for the moment the
# domain becomes accounts.google.com, and the later request carrying a
# "code" query parameter on the way back.`,
    },
    assignment: {
      reflection: "Explain in two or three sentences why 'the app redirects you to Google's own page to enter your password' is a fundamentally safer design than 'the app has its own form asking for your Google password'.",
      observation: "Find a site offering both email/password sign-up and Google Sign-In, and compare how much personal data each path asks the user to hand over directly to that site.",
    },
    summary: "OAuth exists to replace 'hand a third-party site your password' with 'let the identity provider check the password itself, and tell the requesting site only what you agreed to share'. OpenID Connect adds a standard identity layer on top of OAuth's authorization plumbing, which is why a real 'Sign in with Google' flow ends in an ID token - the same JWT format the previous lesson covered - rather than any raw OAuth access grant. The client never sees the actual password: the user authenticates directly on the identity provider's own page, an authorization code comes back first, and only then gets exchanged, usually server-to-server, for the real token. DeVert's entire authentication system is exactly this flow, run through Firebase's SDK, and it is DeVert's only sign-in path - there is no DeVert password to offer as an alternative.",
    goingDeeper: `## Scopes: asking for less than everything

A real OAuth consent screen doesn't just say "let this app in" - it lists specific scopes, like "view your basic profile info" versus "read your contacts" versus "manage your calendar", and a user can often decline some while granting others. This is the direct fix for this lesson's opening story: instead of a password capable of anything, an app requests exactly the narrow slice of access it needs, and the provider enforces that boundary on every subsequent API call, not just at consent time.

::: didyouknow
DeVert's Google Sign-In requests only the minimal scopes needed for identity - name, email, profile picture - never Gmail access, calendar access, or anything else Google's API surface could theoretically grant. That narrowness is itself a design decision worth noticing: the app only ever asks for what it actually uses.
:::

## Refresh tokens, briefly

An ID token, like any JWT, expires - often within an hour. Rather than forcing a full re-authentication every hour, OAuth systems typically also issue a longer-lived refresh token, which the client (or, in DeVert's case, the Firebase SDK, automatically and invisibly) exchanges for a fresh ID token as the old one nears expiry, without the user ever re-clicking "Sign in with Google" or reauthenticating with Google directly.`,
    resources: [
      { kind: "link", title: "OAuth 2.0 Simplified", url: "https://www.oauth.com", description: "Aaron Parecki's plain-language explanation of the full OAuth flow, including the state parameter and PKCE this lesson's industry perspective mentions." },
      { kind: "link", title: "OpenID Connect explained", url: "https://openid.net/developers/how-connect-works/", description: "The official OIDC working group's short explanation of how identity is layered on top of OAuth." },
    ],
    tags: ["authentication", "oauth", "google-sign-in", "firebase"],
  },

  "authentication-vs-authorization": {
    subtitle: "Two questions, asked at different times, by different code",
    difficulty: "Intermediate",
    estimatedMinutes: 16,
    xpReward: 23,
    coinReward: 9,
    learningObjectives: [
      "State the precise difference between authentication and authorization in one sentence each",
      "Identify which HTTP status code corresponds to a failure of each, and why the two are not interchangeable",
      "Explain why a system can authenticate a user perfectly and still be catastrophically wrong about authorization",
    ],
    prerequisites: ["OAuth and Google Sign-In"],
    story: `A hospital's patient portal, audited some years ago, correctly required every user to sign in with a real, verified account before seeing anything - authentication, done properly. Once signed in, though, a patient could change the numeric ID in the browser's address bar and pull up a different patient's lab results, medications, and diagnosis history. Nobody had to guess a password. Nobody had to break an encryption scheme. They just changed a number.

The system had answered "who are you" flawlessly and never once asked "should this specific person see this specific record". Those are genuinely two different questions, checked by different code, at different moments - and this was a system where the first one worked perfectly while the second one didn't exist at all.`,
    problemStatement: `Everything in this module up to this lesson has been about answering exactly one question well: proving, and then continuing to recognise, who someone is. That question, fully solved, still leaves a completely separate one untouched - once you know exactly who is asking, what are they actually allowed to do?

Conflating the two is one of the most common, and most damaging, mistakes in real systems, because a system with excellent authentication can still hand every signed-in user access to everything, if nothing separately checks the second question for every single action.`,
    concept: `## The one-sentence version of each

::: cards
Authentication (AuthN) :: Proving identity. "Who are you?" Answered once per session or token, via a password, a biometric, or - as in DeVert's case - Google vouching for you through OAuth.
Authorization (AuthZ) :: Granting or denying a specific action. "Are YOU allowed to do THIS, to THIS resource, right now?" Answered again, separately, for every action that matters - not once per session.
:::

::: remember
A useful test: authentication answers a question about a person in general. Authorization answers a question about a person and a specific resource and a specific action, together, at this specific moment. "Is this a real, signed-in user?" is authentication. "Can this user delete this post?" is authorization, and the answer can be no even for a perfectly real, fully authenticated user - most users, for most posts they didn't write, is exactly that case.
:::

## The status codes that map to each - and why mixing them up is itself a bug

::: cards
401 Unauthorized :: Actually about authentication, despite the confusing name - "I don't know who you are at all" (missing or invalid credentials/token).
403 Forbidden :: About authorization - "I know exactly who you are, and the answer is still no" (a real, valid, signed-in identity, correctly denied this specific action).
:::

Returning 401 when the real answer is "you're signed in fine, you're just not allowed to do this" is a genuine, common bug - it tells a legitimate, correctly authenticated user that something is wrong with their login, when nothing is; the actual problem is a permission they don't have and re-logging in won't fix.

## Why the hospital story happened

The bug in this lesson's story is a specific, named vulnerability class: **broken object-level authorization**, referred to as IDOR (Insecure Direct Object Reference) in older material - a system checks that you're signed in, then trusts a resource id you supply directly, without separately confirming that resource actually belongs to, or is permitted to, you.

::: checkpoint
An API endpoint GET /api/orders/:orderId correctly rejects any request with no valid signed-in session. A signed-in user changes the orderId in the URL to a number that isn't theirs, and the endpoint happily returns someone else's order. What is missing?
- ( ) Authentication - the session check is broken
- (x) Authorization - the endpoint never checks that this specific order belongs to this specific signed-in user
- ( ) HTTPS - the connection isn't encrypted
- ( ) A password reset flow
> Authentication here works exactly as intended - an unauthenticated request is correctly rejected. What's missing is a completely separate check: does resource #orderId actually belong to the user making this specific request? That is authorization, and it has to be checked per-resource, not assumed from "they're signed in".
:::

## Why the two really do need separate code, not one shared check

It's tempting to write one gatekeeping function and assume it covers both, but they answer different questions with different data at different times: authentication typically runs once, early, often as shared middleware; authorization typically has to run per-resource, per-action, close to the actual operation being performed, because the answer depends on which specific record and which specific action - information a generic "are you signed in" check never has.`,
    codeExample: {
      language: "javascript",
      code: `// AUTHENTICATION: who is this, at all? Runs once, shared across routes.
function requireSignedIn(req, res, next) {
  if (!req.auth) return res.status(401).json({ error: "Sign in required" });
  next();
}

// AUTHORIZATION: is THIS signed-in user allowed to do THIS thing, to THIS
// specific resource? Runs separately, close to the actual action.
function requireOwnerOrAdmin(req, res, next) {
  const isOwner = req.auth.uid === req.params.ownerId;
  const isAdmin = req.auth.token.admin === true;
  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: "Not allowed to modify this resource" });
  }
  next();
}

app.delete(
  "/posts/:ownerId/:postId",
  requireSignedIn,        // 401 if this fails - "I don't know you"
  requireOwnerOrAdmin,    // 403 if this fails - "I know you, and it's still no"
  deletePostHandler
);`,
      expectedOutput: `A request with no valid auth at all is stopped by requireSignedIn and returns 401 - it never even reaches the ownership check. A request from a real, signed-in user attempting to delete someone else's post passes requireSignedIn (they're a real user) but is stopped by requireOwnerOrAdmin with 403 - the system knows exactly who they are, and the answer is still no. Only a request from the actual owner, or an admin, reaches deletePostHandler at all.`,
    },
    commonMistakes: [
      "Checking that a user is signed in, then trusting any resource id they supply without confirming it actually belongs to or is permitted for them (broken object-level authorization / IDOR)",
      "Returning 401 for an authorization failure, telling a correctly signed-in user something is wrong with their login when the actual issue is a missing permission",
      "Assuming a single 'auth check' covers both questions, rather than writing authentication as shared middleware and authorization as a separate, resource-specific check",
      "Performing an authorization check on the frontend only - hiding a delete button from users who shouldn't see it - without the backend independently re-checking before actually deleting anything",
    ],
    industryPerspective: `Broken Object Level Authorization has topped or near-topped the OWASP API Security Top 10 for years running, precisely because it's such an easy trap: a team gets authentication right (using a real, tested library, exactly as the earlier signup lesson recommended), feels the "auth problem" is solved, and then writes route after route trusting whatever id arrives in the URL or request body without a per-resource ownership check on each one.

The standard mitigation isn't clever - it's disciplined: every single endpoint that reads or modifies a specific resource re-verifies that the authenticated user is actually permitted to touch that specific resource, every time, rather than relying on the frontend to only ever construct 'valid' requests. Security audits and bug bounty programs treat IDOR as one of the highest-value bug classes to hunt for specifically because it's common, easy to find by simply changing a number in a URL, and consistently severe when found.`,
    devertCaseStudy: `DeVert's own architecture makes this lesson's distinction unusually visible, because there's no application server hiding it: Firestore Security Rules are where both questions get answered, explicitly, in the same file, and the difference between the two shows up as different conditions in the same rule.

  match /pulse_posts/{postId} {
    allow read: if request.auth != null;
    allow update: if request.auth.uid == resource.data.authorId
                   || request.auth.token.admin == true;
  }

\`request.auth != null\` is pure authentication - are you signed in at all, regardless of who. \`request.auth.uid == resource.data.authorId\` is pure authorization - granted you're a real, signed-in user, are you specifically the author of this exact post (or an admin)? A user can satisfy the first condition and fail the second constantly - any signed-in student reading someone else's post is exactly that case, working as intended.

This is also precisely why DeVert's coin economy rules (governing \`user_earnings\`, \`pulse_posts\` engagement counters, \`coin_transactions\`) are held to the bounded-delta pattern documented in \`firestore.rules\`: authentication alone - "a real signed-in user is making this write" - would never be enough to protect real money. A perfectly authenticated, perfectly real student is still not authorized to move their own coin balance by an arbitrary amount, which is exactly the authorization half of this lesson's distinction, enforced at the one layer that has no application server behind it to double-check.`,
    knowledgeChecks: [
      {
        question: "Which one-sentence description correctly matches authorization, not authentication?",
        options: [
          "Proving who someone is, typically once per session or token",
          "Deciding whether a specific, already-identified person may perform a specific action on a specific resource",
          "Checking that a password matches a stored hash",
          "Issuing a signed token after a successful login",
        ],
        correctIndex: 1,
        explanation: "Authentication settles identity once; authorization is asked again for essentially every action, and depends on which resource and which action, not just who the person is in general.",
      },
      {
        question: "A signed-in, fully authenticated user requests DELETE on a post they didn't write, and the server correctly refuses. Which status code should that response use?",
        options: ["401 Unauthorized", "403 Forbidden", "404 Not Found", "500 Internal Server Error"],
        correctIndex: 1,
        explanation: "The server knows exactly who this user is - authentication succeeded - and is refusing based on permission, which is what 403 signals. 401 would incorrectly suggest a problem with their login.",
      },
      {
        question: "An endpoint correctly requires a valid signed-in session, but then returns whatever record matches an id the client supplies in the URL, with no ownership check. What vulnerability class is this?",
        options: [
          "Cross-site scripting (XSS)",
          "Broken object-level authorization (IDOR) - authentication succeeded, but authorization for that specific resource was never checked",
          "SQL injection",
          "Session fixation",
        ],
        correctIndex: 1,
        explanation: "This is the exact failure from the hospital story: identity is verified correctly, but nothing separately confirms the requested resource actually belongs to, or is permitted for, that identified user.",
      },
    ],
    lab: {
      title: "Find the authentication check versus the authorization check in a real rules file",
      brief: `DeVert's own firestore.rules is a working example of this lesson's exact distinction, written in plain conditions you can read without needing to run any code.`,
      steps: [
        "Open firestore.rules in the DeVert repository and find any match block guarding a collection you recognise (posts, submissions, profiles).",
        "For each allow rule, identify whether its condition checks 'is there a real signed-in user at all' (authentication) or 'is this specific signed-in user permitted for this specific document' (authorization) - some rules do both, joined by || or &&.",
        "Find isAdmin() (or a similar helper) in the same file and note that it's checking a custom claim off request.auth.token - directly the mechanism the earlier JWT lesson covered.",
        "Write down, for one rule of your choosing, what a request would need to satisfy authentication but still fail authorization - a concrete scenario, not just a definition.",
      ],
      starterCode: `# No commands needed. Open firestore.rules in the DeVert repo and read
# a few match blocks, separating each condition into:
#   AUTHENTICATION -> "is request.auth non-null at all?"
#   AUTHORIZATION  -> "does this specific auth.uid/claim satisfy THIS resource?"`,
    },
    assignment: {
      reflection: "Rewrite the hospital story from this lesson's opening in your own words, but as a one-line rule that would have fixed it - what condition, specifically, was missing?",
      practice: "Take any API you've used or built and identify one endpoint where a resource id appears in the URL. Write down what authorization check that endpoint must perform beyond 'is the caller signed in'.",
    },
    summary: "Authentication answers 'who are you', settled once per session or token. Authorization answers 'are you allowed to do this specific thing, to this specific resource, right now', and has to be checked again for essentially every action - a perfectly authenticated user is routinely, correctly denied plenty of authorization. The two map to different HTTP status codes (401 for authentication failures, 403 for authorization failures), and confusing them - or worse, skipping authorization entirely after authentication succeeds - produces broken object-level authorization, a common, severe, and easy-to-introduce vulnerability class where a signed-in user can access or modify records that aren't theirs simply by changing an id. DeVert's Firestore rules answer both questions explicitly, in the same file, as separate conditions.",
    goingDeeper: `## Why this distinction gets its own lesson instead of folding into 'security'

Splitting these into two named concepts, rather than one fuzzy "auth" bucket, exists because they fail independently and get fixed independently. A team can have flawless authentication - a real, audited, unbreakable login system - and still ship a catastrophic authorization bug the very next sprint, in a completely unrelated endpoint, because nothing about fixing one automatically protects the other.

::: interview
"What's the difference between authentication and authorization?" is one of the most reliably asked interview questions in this entire subject area, precisely because a wrong or vague answer signals a candidate hasn't yet separated these into two mental categories - and a candidate who instead answers with the hospital-style example above, unprompted, is usually signalling real, hard-won experience rather than a memorised definition.
:::`,
    resources: [
      { kind: "link", title: "OWASP: Broken Object Level Authorization", url: "https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/", description: "The API Security Top 10 entry for the IDOR-style failure this lesson's story and checkpoint both describe." },
      { kind: "link", title: "MDN: HTTP response status codes - 401 vs 403", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Status", description: "The full status code reference, useful for confirming exactly when each of 401 and 403 is specified to apply." },
    ],
    tags: ["authentication", "authorization", "security", "api-design"],
  },

  "roles-and-permissions": {
    subtitle: "Turning 'who are you' into 'what can you touch', at scale",
    difficulty: "Intermediate",
    estimatedMinutes: 18,
    xpReward: 25,
    coinReward: 10,
    learningObjectives: [
      "Explain role-based access control and why it scales better than checking individual users by name",
      "Explain what a custom claim is and trace exactly how one gets minted, attached to a token, and read back",
      "Explain why a role change doesn't take effect until the affected user's token is refreshed",
      "Distinguish a coarse role like admin from a narrower one like DeVert's superAdmin, and explain why both exist",
    ],
    prerequisites: ["Authentication vs Authorization"],
    story: `An early version of a well-known project management tool famously checked admin access with a line close to \`if (user.email === "founder@company.com")\`. It worked, for exactly as long as there was exactly one admin and their email address never changed. The moment a second person needed admin access, someone had to go find that line of code, in production, and edit it - and forget to update it once, in a later migration, and either the wrong person keeps admin access forever or the right person never gets it at all.

That approach doesn't fail because the engineer was careless. It fails because "admin" was encoded as a fact about one specific hardcoded identity, rather than a role that could be granted to, or taken from, anyone at all. Almost every real permission system, at some point, made this exact mistake before fixing it - which is worth knowing before writing the first version, rather than after the second admin needs adding.`,
    problemStatement: `Once authentication and authorization are both working, a real system still needs to decide something the previous lesson didn't cover: how does a specific user come to have a specific permission at all, and how is that fact represented in a way that scales past one hardcoded admin?

The two dominant answers are role-based access control (grouping permissions under named roles like "admin" or "editor" and assigning users to roles) and, at finer granularity, permission-based systems (granting specific individual capabilities directly). Almost every real system leans on the first, and this lesson is about how a role actually gets attached to a specific, verifiable identity - not just asserted somewhere a client could tamper with it.`,
    concept: `## Role-based access control, in one picture

::: cards
Users :: The people. Each is assigned one or more roles.
Roles :: Named groupings - admin, editor, viewer - that bundle a set of permissions together under one label.
Permissions :: The actual granular capabilities - delete-any-post, view-revenue, ban-user - that a role grants.
:::

The advantage over checking individual users by name or email, as in this lesson's story: granting a permission to a role automatically grants it to everyone holding that role, present and future, without touching a single line of code per person. Revoking a role from one user removes exactly the permissions that role bundled, and nothing else.

## Where a role actually has to live to be trustworthy

A role only means anything if the system checking it can't be fooled by a client claiming to hold it. That rules out anything the client can set or send itself - a "role" field in a request body, a value in localStorage, a hidden form field - because all of those are exactly as trustworthy as asking an attacker to self-report their own permissions.

::: remember
The previous lesson's JWT coverage already named the actual answer: a custom claim, minted server-side, baked into a signed token the client cannot alter without breaking the signature. A role has to live there - inside something cryptographically tied to the issuer - or it isn't actually enforced at all, just displayed.
:::

## How a custom claim actually gets from "granted" to "enforced"

::: timeline The full lifecycle of a custom claim
Granted, server-side only :: Using an admin SDK with elevated, trusted credentials - never anything reachable from a browser - a claim like { admin: true } is attached to a specific user's account.
Not yet in any token :: The user's current, already-issued token was signed before this claim existed, and signatures can't be edited after the fact - so nothing changes for them yet.
Sign-out and sign-in, or a forced refresh :: The next time a fresh token is issued for that user, the identity provider bakes the current claims into it at that moment.
Enforced, everywhere, immediately :: From that point on, every system verifying that token - a security rule, a backend check - sees the claim and can act on it, with no separate lookup required.
:::

::: checkpoint
A platform grants a user the admin role by updating a custom claim server-side. The user does not sign out; they keep using the app with their existing browser tab open. What is true about their access right now?
- ( ) They immediately have admin access, since the claim was granted
- (x) They do NOT yet have admin access in practice, because their currently held token was signed before the claim existed and tokens can't be edited after signing - it takes effect once a fresh token is issued
- ( ) The claim is rejected because the user didn't request it themselves
- ( ) Admin access is granted the next time they load any page, without needing a fresh token
> A signed token is immutable once issued - nothing about it can be edited in place, including baking in a brand-new claim. The claim is real and stored, but it only becomes visible to anything checking the token once a new one is minted, which is why a sign-out/sign-in or an explicit refresh is the actual trigger, not the grant itself.
:::

## Coarse roles versus narrower ones

A single "admin" role is often too blunt an instrument once a system holds more than one category of sensitive data. A platform admin who can moderate content and manage users is not automatically someone who should see revenue and payout data - those are different blast radii if the account is ever compromised, and bundling them under one role means every admin, including ones who only ever needed moderation powers, becomes a target for the financial data too.

::: remember
The fix isn't abandoning roles - it's adding a stricter, narrower one on top for the more sensitive slice, checked independently. A user can hold the broader role and lack the narrower one entirely, which is exactly the point: the narrower role exists so the blast radius of a compromised "regular admin" account doesn't automatically include the platform's most sensitive data.
:::`,
    codeExample: {
      language: "javascript",
      code: `// scripts/set-admin-claim.mjs (the real shape of DeVert's own script) -
// run with the Firebase Admin SDK's elevated, server-side credentials.
// This can NEVER run from a browser; it requires a service account key.
import admin from "firebase-admin";

const email = process.argv[2];
const revoke = process.argv.includes("--revoke");

const user = await admin.auth().getUserByEmail(email);

// Preserve any other custom claims already set on this user - this line
// only ever touches the "admin" key, never overwrites the whole object.
await admin.auth().setCustomUserClaims(user.uid, {
  ...user.customClaims,
  admin: revoke ? null : true,
});

console.log(
  \`\${revoke ? "Revoked" : "Granted"} admin claim for \${email} (uid: \${user.uid}).\`
);
// The affected user must sign out and back in (or force a token
// refresh) before their NEXT id token actually contains "admin": true -
// the token they're currently holding was already signed before this
// claim existed, exactly as this lesson's timeline describes.`,
      expectedOutput: `Running "node scripts/set-admin-claim.mjs someone@example.com" prints "Granted admin claim for someone@example.com (uid: ...)". Nothing about that user's current session changes immediately - only once they sign out and back in does a fresh ID token get issued containing "admin": true, at which point every Firestore Security Rule checking request.auth.token.admin starts treating them as an admin, with zero additional server-side lookup required.`,
    },
    commonMistakes: [
      "Hardcoding a specific email address as the check for admin access, rather than a role or claim that can be granted to, or revoked from, anyone",
      "Expecting a newly granted role to take effect immediately in an already-open session, without accounting for tokens being immutable once signed",
      "Bundling every sensitive capability under one broad 'admin' role, rather than adding a narrower, separately-checked role for the most sensitive data",
      "Letting a client set or influence its own role or permission claim in any way, rather than that value only ever being set by trusted, server-side code",
      "Forgetting that revoking a role has the identical latency problem as granting one - an already-issued token keeps the old claim until it's refreshed or naturally expires",
    ],
    industryPerspective: `Role-based access control is old enough to predate the web entirely - it's the standard model in operating system permissions, database grants, and enterprise identity systems going back decades, and essentially every modern identity provider (Auth0, Okta, AWS IAM, Firebase) implements some version of custom claims or attached roles as its primary extension point for exactly this pattern.

The "narrower role for the most sensitive data" idea from this lesson has a formal name in security literature: the principle of least privilege, applied at the role-design level rather than just the individual-permission level - every account should hold the smallest set of roles that lets it do its actual job, and the most sensitive capabilities should sit behind the narrowest, least-frequently-granted role available, specifically so that compromising a typical admin account doesn't automatically compromise everything.`,
    devertCaseStudy: `Everything in this lesson maps directly onto two real, distinct claims in DeVert's system. \`admin\` is the broader role - granted or revoked via \`scripts/set-admin-claim.mjs\`, exactly as shown in this lesson's code example - and it covers the platform-admin surfaces: content moderation, community management, the admin console's various tabs.

\`superAdmin\` is the narrower role from this lesson's "coarse versus narrow" section, made concrete: a stricter, separate claim, granted via its own dedicated script (\`scripts/set-super-admin-claim.mjs\`), reserved specifically for financial and revenue data - exactly the kind of sensitive surface this lesson argues shouldn't be bundled into every ordinary admin's blast radius. On the client, \`AuthContext.js\` resolves both off the very same token fetch - \`isAdmin\` and \`isSuperAdmin\` are read together, sharing one \`adminChecked\` readiness flag - but they remain two independent booleans an admin console screen can check separately: a regular admin sees moderation tools; only a superAdmin sees payout and revenue surfaces.

And the sign-out requirement from this lesson's timeline is not a footnote in DeVert's case - it's explicitly documented in the codebase's own comments, precisely because it's the single most common way this mechanism gets misunderstood: grant the claim, and nothing visibly changes until the affected user's token is actually refreshed.`,
    knowledgeChecks: [
      {
        question: "What is the main advantage of role-based access control over hardcoding a specific user's email as the admin check?",
        options: [
          "It runs faster",
          "Granting or revoking a role automatically affects everyone holding it, present and future, without editing code per individual person",
          "It requires no server-side code at all",
          "It removes the need for authentication entirely",
        ],
        correctIndex: 1,
        explanation: "Roles decouple 'who has this permission' from the code itself. Adding a second admin, or removing the first one, becomes a data change rather than a deploy.",
      },
      {
        question: "A user is granted the admin custom claim server-side, but keeps their browser tab open without signing out. What is true right now?",
        options: [
          "They immediately gain admin access on their next request",
          "They do not yet have admin access in practice - their currently held token was signed before the claim existed, and it takes a fresh token (via sign-out/sign-in or a forced refresh) for the claim to actually appear",
          "The grant fails silently and must be repeated",
          "Admin access applies only to new documents created after the grant, not new sessions",
        ],
        correctIndex: 1,
        explanation: "A signed token is immutable. The claim is real in Firebase's records the moment it's set, but nothing checking the user's current token sees it until a new token is actually issued.",
      },
      {
        question: "Why does DeVert have a separate superAdmin claim in addition to admin, rather than one single admin role covering everything?",
        options: [
          "Because Firebase requires at least two custom claims per project",
          "So the most sensitive surfaces (payments and revenue data) sit behind a narrower, separately-granted role, limiting the blast radius if a typical admin account is ever compromised",
          "Because admin and superAdmin are actually the same claim under two different names",
          "So regular admins can grant themselves superAdmin when needed",
        ],
        correctIndex: 1,
        explanation: "This is the principle of least privilege applied to role design: bundling financial data access into every ordinary admin account would mean every admin, however narrow their actual job, becomes a target for the platform's most sensitive information.",
      },
    ],
    lab: {
      title: "Trace a custom claim from script to enforced rule",
      brief: `Rather than running an admin script yourself (which needs a real service account key you likely don't have), this lab traces the claim's actual path through DeVert's own real code, reading each link in the chain.`,
      steps: [
        "Open scripts/set-admin-claim.mjs and read exactly what it does - note that it requires firebase-admin and a service account, never anything a browser could run.",
        "Open devert-frontend/context/AuthContext.js and find where isAdmin is set - note it comes from token.claims.admin, read off a result of getIdTokenResult(), not from any Firestore document.",
        "Open firestore.rules and find isAdmin() (or the equivalent helper) - confirm it checks request.auth.token.admin, the exact same claim, now enforced at the database layer independently of the frontend.",
        "Write down, in one sentence per hop, the full chain: script grants claim -> token eventually carries it -> AuthContext reads it -> firestore.rules independently re-checks it. Note that three completely separate pieces of code all have to agree, and none of them trust each other blindly.",
      ],
      starterCode: `# No commands needed - read three files in this order:
#   1. scripts/set-admin-claim.mjs        (where the claim is granted)
#   2. devert-frontend/context/AuthContext.js  (where the client reads it)
#   3. firestore.rules                    (where it's independently enforced)`,
    },
    assignment: {
      reflection: "Explain in your own words why granting a role and enforcing a role are two separate steps in this lesson's timeline, and what specifically bridges the gap between them.",
      observation: "Find any product you use with distinct account tiers (free/pro, member/moderator/admin) and note what changes in the interface between tiers - that's roles made visible in a UI, sitting on top of the same claim-style mechanism underneath.",
      practice: "Sketch a role hierarchy for a small hypothetical app of your choosing - name at least three roles and one narrower, higher-sensitivity role that shouldn't be bundled into the broadest one.",
    },
    summary: "Role-based access control groups permissions under named roles rather than checking individual users by identity, so granting or revoking access becomes a data change rather than a code change. A role only means anything if it lives somewhere a client can't tamper with - a custom claim baked into a signed token by trusted, server-side code - and because tokens are immutable once issued, a newly granted role doesn't take effect until the affected user's token is actually refreshed, typically via sign-out and sign-in. Bundling every sensitive capability into one broad role widens the blast radius of a single compromised account, which is why narrower, separately-granted roles for the most sensitive data are standard practice. DeVert implements exactly this with two claims - admin for platform moderation, and a stricter superAdmin reserved for financial and revenue data - both minted by dedicated server-side scripts and independently re-checked in Firestore's own security rules.",
    goingDeeper: `## Why permissions sometimes get modeled more finely than roles alone

Pure role-based access control assumes a fixed, relatively small set of named bundles covers every situation - fine for most apps, but it strains once permissions need to vary per-resource rather than platform-wide (this specific document's owner, this specific team's members). Attribute-based access control (ABAC) generalises the idea: instead of "does this role grant this permission", the check becomes "given this user's attributes, this resource's attributes, and the current context, is this action allowed" - a more flexible, more expensive-to-reason-about model usually reached for only once plain roles genuinely stop being sufficient.

::: didyouknow
DeVert's Firestore rules already blend both ideas without necessarily naming it that way: request.auth.token.admin is a pure role check (RBAC), while request.auth.uid == resource.data.authorId is closer to an attribute check comparing the requester's identity against the specific resource's own data - the same pattern the previous lesson's Firestore rule example combined with an OR.
:::`,
    resources: [
      { kind: "link", title: "Firebase: Control Access with Custom Claims", url: "https://firebase.google.com/docs/auth/admin/custom-claims", description: "The official documentation for exactly the setCustomUserClaims mechanism this lesson's code example uses." },
      { kind: "link", title: "NIST: Role Based Access Control", url: "https://csrc.nist.gov/projects/role-based-access-control", description: "The formal origin and definition of RBAC, for readers who want the model's theoretical grounding." },
    ],
    tags: ["authentication", "authorization", "roles", "custom-claims"],
  },

  "the-auth-mistakes-that-cause-breaches": {
    subtitle: "The same handful of mistakes, made by teams who knew better",
    difficulty: "Intermediate",
    estimatedMinutes: 20,
    xpReward: 28,
    coinReward: 12,
    learningObjectives: [
      "Recognise the recurring, named mistakes behind a large share of real authentication breaches",
      "Explain why trusting any client-supplied field for identity or permission is the common thread through nearly all of them",
      "Audit a piece of authentication code for at least three of the specific mistakes this lesson covers",
    ],
    prerequisites: ["Roles and Permissions"],
    story: `Almost every headline authentication breach, read carefully after the fact, turns out to be one of a genuinely short list of mistakes - not some exotic cryptographic break nobody could have anticipated. A password stored the wrong way. A field trusted that should never have been trusted. A check that ran on the wrong side of the request.

That's the uncomfortable and useful truth this closing lesson leans on: the individual mechanisms across this whole module - hashing, sessions, tokens, OAuth, roles - are each, on their own, well understood and hard to break when used correctly. Breaches overwhelmingly happen at the seams between them, where an assumption quietly goes unchecked. This lesson is a tour of those seams, using the vocabulary the rest of this module already built.`,
    problemStatement: `Every lesson so far in this module taught one mechanism, correctly, in isolation. Real breaches rarely come from an isolated mechanism being fundamentally broken - bcrypt is not broken, JWT signatures are not broken, OAuth is not broken. They come from a handful of recurring assumptions about trust boundaries that quietly turn out to be false, almost always at the exact seam between two of this module's earlier lessons.

Knowing the mechanisms is necessary but not sufficient. This lesson is about the specific, repeated ways teams who understood every mechanism individually still shipped a breach anyway.`,
    concept: `## The trust boundary, restated

Nearly every mistake in this lesson reduces to one sentence: **the client is not a trusted source of anything about itself.** Not its role, not its permissions, not even, in a subtler case below, its own claimed identity if the check verifying that identity is done wrong. Every mistake below is a specific, concrete way that sentence gets violated.

::: cards Six recurring mistakes, and which earlier lesson each one violates
Storing passwords with a fast, unsalted hash (or none at all) :: Violates the hashing lesson - the fix already exists; the mistake is simply not using it.
Trusting a client-sent role or permission field :: Violates the roles lesson - "role": "admin" typed into a request body is exactly as trustworthy as an attacker typing it themselves.
Decoding a JWT's payload without verifying its signature :: Violates the JWT lesson directly - reading admin: true off an unverified token is trusting a string, not a proof.
Skipping per-resource authorization after authentication succeeds :: Violates the authentication-vs-authorization lesson - broken object-level authorization, this module's earlier hospital story.
Sensitive data placed inside a JWT payload :: Also violates the JWT lesson - anyone holding the token can decode and read it; a JWT has integrity, not confidentiality.
No rate limiting or lockout on login attempts :: Violates the signup-and-login lesson - an unlimited number of guesses turns "the password is hard to guess" into a matter of time, not difficulty.
:::

## Why these specific mistakes, and not others, recur

Each one is individually easy to get right, and collectively easy to miss, because they sit at a boundary rather than inside a mechanism - the exact place a code reviewer is least likely to be looking, since the surrounding code, taken in isolation, looks completely correct. A login handler that hashes properly, checks a role field from the request body, and returns a nicely formatted response reads as clean, working code in a review - the flaw is a missing check, not a wrong one, and missing checks are the hardest kind of bug to spot by reading code that exists.

::: remember
A genuinely useful habit: for every piece of data a server acts on, ask "could a client have supplied this value directly, and if so, on what basis am I trusting it?" A user id read from a verified token's sub claim: trustworthy, because the token's signature vouches for it. The exact same user id read from a request body's "userId" field: not trustworthy at all, because nothing stops a request from claiming to be anyone.
:::

## A quick audit, applied

::: checkpoint
A backend endpoint receives { "userId": "user_42", "role": "admin" } in a JSON request body and grants admin-level access based on the role field. What is the single specific mistake here, in this module's own vocabulary?
- ( ) The password wasn't hashed correctly
- (x) A client-supplied field is being trusted for authorization, when role should only ever come from a server-verified source like a custom claim on a signed token
- ( ) The JWT's signature wasn't checked
- ( ) The session wasn't regenerated at login
> This is the roles-and-permissions mistake specifically: nothing about a JSON body's own contents is trustworthy just because it arrived over HTTPS. "role": "admin" here means only that whoever sent the request typed those characters - the same as it would mean coming from an actual admin or from anyone with a text editor and curl.
:::

## Why "we'll add security later" reliably fails

Every mistake catalogued above is dramatically cheaper to avoid at design time than to retrofit once real user data and real permissions already depend on the wrong assumption. Retrofitting "actually check the role server-side" after launch means auditing every endpoint that currently trusts the client, migrating however many records were written under the old, wrong assumption, and doing all of it while the system stays live - which is exactly why this module puts hashing, sessions, tokens and roles before this lesson rather than after: each one is a specific defence against one of these exact mistakes, learned before the shortcut ever gets taken.`,
    codeExample: {
      language: "javascript",
      code: `// BAD - trusting whatever the client claims about its own permissions.
app.post("/admin/delete-user", (req, res) => {
  if (req.body.role === "admin") {
    // Anyone can send { "role": "admin" } in a request body. This check
    // trusts a string an attacker typed, not a proof of anything.
    deleteUser(req.body.targetUserId);
    return res.json({ ok: true });
  }
  res.status(403).json({ error: "Not allowed" });
});

// GOOD - the only trustworthy source of "is this caller an admin" is a
// claim minted server-side and baked into a signature the client cannot
// forge, checked directly off the verified token, never off the body.
app.post("/admin/delete-user", requireSignedIn, (req, res) => {
  const isAdmin = req.auth.token.admin === true; // from the VERIFIED token
  if (!isAdmin) {
    return res.status(403).json({ error: "Not allowed" });
  }
  deleteUser(req.body.targetUserId);
  res.json({ ok: true });
});`,
      expectedOutput: `Against the BAD handler, a request body of { "role": "admin", "targetUserId": "user_9" } succeeds regardless of who actually sent it - curl, a browser devtools console, or a real admin, all equally. Against the GOOD handler, the identical request body is rejected with 403 unless req.auth.token.admin is actually true on the caller's own verified token - a fact only a trusted, server-side script could have set in the first place, exactly as the previous lesson's set-admin-claim.mjs demonstrated.`,
    },
    commonMistakes: [
      "Storing passwords with a fast, general-purpose hash instead of bcrypt/scrypt/Argon2, or storing them with no hashing at all",
      "Trusting any client-supplied field - a role, a permission flag, a userId in a request body - as a basis for an authorization decision",
      "Reading claims out of a JWT's payload without verifying its signature first, treating decoding as if it were proof",
      "Checking authentication but skipping a per-resource authorization check, allowing any signed-in user to access or modify records that aren't theirs",
      "Placing sensitive data directly inside a JWT payload, forgetting that a token's contents are readable by anyone holding it",
    ],
    industryPerspective: `The OWASP Top 10 - a periodically updated, industry-consensus ranking of the most critical web application security risks - has featured some version of "broken authentication" or "identification and authentication failures" in nearly every edition since the list began, alongside broken access control (this module's authorization side) consistently near the very top. That persistence across more than a decade of updates is itself the finding: these are not niche, exotic risks being newly discovered - they are the same handful of mistakes, recurring across a constantly changing landscape of frameworks and languages, because the underlying trust-boundary error is a human and organisational one, not a technology-specific one.

Security-focused code review at mature engineering organisations often specifically trains reviewers to ask this lesson's "could a client have supplied this, and on what basis am I trusting it" question on every single field an endpoint reads - not as a one-time audit, but as a standing habit applied to new code as it's written, precisely because retrofitting it after a breach is dramatically more expensive than asking it during review the first time.`,
    devertCaseStudy: `DeVert's own architecture makes several of this lesson's mistakes structurally harder to make, and its documented design decisions are direct, deliberate responses to specific ones on this list. There is no DeVert password to store badly, because there is no DeVert password at all - the earlier hashing lesson's entire risk category is sidestepped by not having a password to hash in the first place.

The client-supplied-role mistake is exactly why DeVert's admin-ness was migrated away from a hardcoded email check during a documented security-hardening effort, to the custom-claim mechanism the roles lesson covered - a hardcoded email is a milder version of the same trust-boundary error as a client-sent role field, since both encode "who is trusted" somewhere other than a server-verified claim.

Most directly, DeVert's coin economy is where "trusting a client-supplied value" would be catastrophic in a very literal, financial sense - coins convert to real payouts. Because the platform has no application server in most of its request path, firestore.rules is the only thing standing between a user and forging their own balance, which is exactly why any rule touching user_earnings, pulse_posts engagement counters, or coin_transactions is required to keep a bounded-delta pattern: a non-owner may only ever move a counter by a validated ±1 or a known reward amount read live from system/economy, never an arbitrary client-supplied value. That constraint is this lesson's "never trust a client-supplied field" mistake, applied to real money, with no second layer behind the rules to catch a mistake if the rule itself ever got it wrong.`,
    knowledgeChecks: [
      {
        question: "What single trust-boundary principle do nearly all the mistakes in this lesson reduce to?",
        options: [
          "Passwords must always be at least 12 characters",
          "The client is not a trustworthy source of any fact about itself - its role, permissions, or claimed identity must be verified server-side, never taken at face value",
          "All traffic must use HTTPS",
          "Sessions are always safer than tokens",
        ],
        correctIndex: 1,
        explanation: "Every mistake catalogued - trusted role fields, unverified JWT payloads, skipped per-resource authorization - is a specific violation of the same underlying rule: nothing the client asserts about itself is trustworthy without independent, server-side verification.",
      },
      {
        question: "A backend grants admin access based on { \"role\": \"admin\" } arriving in a request body. Which mistake from this lesson does this represent?",
        options: [
          "Weak password hashing",
          "Trusting a client-supplied field for an authorization decision, instead of a server-verified claim",
          "Missing rate limiting",
          "Placing sensitive data in a JWT payload",
        ],
        correctIndex: 1,
        explanation: "Any value inside a request body is exactly as trustworthy as whoever sent that request. Authorization decisions need to be based on something the client cannot forge, like a verified token's custom claim.",
      },
      {
        question: "Why does OWASP's list of top web security risks keep featuring broken authentication and broken access control across more than a decade of updates?",
        options: [
          "Because these are newly discovered, exotic vulnerabilities each year",
          "Because the underlying trust-boundary mistakes are human and organisational, not tied to any specific technology, so they recur across constantly changing frameworks and languages",
          "Because most frameworks deliberately leave these vulnerable by default",
          "Because OWASP has not updated its methodology in years",
        ],
        correctIndex: 1,
        explanation: "The mistakes are conceptual, not technological - a new framework doesn't automatically prevent a team from trusting a client-sent role field. That's why the same categories persist across editions even as the specific tools in use change completely.",
      },
    ],
    lab: {
      title: "Audit a real endpoint against this lesson's checklist",
      brief: `You now have a concrete list of the specific, recurring mistakes behind most real breaches. This lab applies that list to real code rather than a hypothetical - either DeVert's own, or any backend project you have access to.`,
      steps: [
        "Pick any API endpoint in a real codebase you can read - DeVert's Cloud Run backend, or any personal project.",
        "For every field the endpoint reads from the request (body, query params, headers), write down where that value actually comes from and whether it's independently verified server-side, or simply trusted at face value.",
        "Check whether any authorization decision in that endpoint depends on a value from that first list - if so, flag it against this lesson's 'trusting a client-supplied field' mistake specifically.",
        "If the endpoint reads a JWT or similar token, confirm the code actually calls a verify function (not just a decode function) before trusting anything inside it.",
        "Write a one-paragraph summary: which of this lesson's six named mistakes does this endpoint avoid, and which (if any) does it risk?",
      ],
      starterCode: `# No commands needed. For one real endpoint, list every field it reads
# from the request, and for each one write:
#   SOURCE: request body / query param / header / verified token claim
#   TRUSTED BECAUSE: (a real reason, or "not verified - risk")`,
    },
    assignment: {
      reflection: "Pick the single mistake from this lesson you'd have been most likely to make yourself before starting this module, and explain in two or three sentences why - be specific about which earlier lesson's defence you now know to reach for instead.",
      practice: "Take the BAD code example from this lesson's codeExample and rewrite it from scratch, in your own words, explaining in a comment exactly why each change matters.",
      reading: "Read the current OWASP Top 10's entries for broken access control and identification/authentication failures, and note one real-world example cited for each that matches a mistake from this lesson.",
    },
    summary: "Most real authentication breaches don't come from a broken cryptographic mechanism - bcrypt, JWT signatures and OAuth all hold up fine when used correctly. They come from a short, recurring list of trust-boundary mistakes at the seams between mechanisms: storing passwords insecurely, trusting a client-supplied role or permission field, reading a JWT's payload without verifying its signature, skipping per-resource authorization after authentication succeeds, and placing sensitive data somewhere it's readable by anyone holding the token. Nearly every one of these reduces to a single rule: the client is not a trustworthy source of any fact about itself, and every value a server acts on needs a real answer to 'on what basis am I trusting this'. DeVert's own security-hardening history - moving off a hardcoded admin email, and holding its coin economy rules to a strict bounded-delta pattern - are both direct, documented responses to mistakes on this exact list.",
    goingDeeper: `## Defence in depth, applied to this module

No single lesson in this module is meant to be the only thing standing between a system and a breach - each is one layer, and real systems tend to survive a mistake in one layer specifically because another layer independently catches it. A leaked JWT is less catastrophic if it's short-lived. A missing per-resource check in the frontend is less catastrophic if the backend (or, in DeVert's case, the security rules) independently re-checks it anyway. That redundancy - assuming any single layer might fail, and building the next one so it doesn't automatically cascade - is what "defence in depth" actually means in practice, rather than a slogan.

::: interview
"Tell me about a security mistake you'd watch for in a code review" is a common senior-engineer interview question precisely because the strong answers all sound like this lesson: specific, named, and tied to a concrete trust boundary - "I'd check whether this authorization decision depends on anything the client could have supplied directly" - rather than a vague "I'd make sure it's secure." Naming the actual mechanism you're checking for is what distinguishes real experience from a memorised buzzword.
:::

## Where this module leaves you

Every mechanism in this module - hashing, sessions, cookies, JWTs, OAuth, roles - answers one of the three questions the very first lesson posed: who are you, are you still you, what are you allowed to do. This closing lesson is the reminder that knowing each mechanism individually is necessary, not sufficient - the actual discipline is asking, for every piece of data a system acts on, which of those three questions it's really answering, and whether the answer came from somewhere trustworthy.`,
    resources: [
      { kind: "link", title: "OWASP Top 10", url: "https://owasp.org/www-project-top-ten/", description: "The industry-consensus ranking this lesson references throughout, updated periodically with real, current examples." },
      { kind: "link", title: "OWASP Authentication Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html", description: "A practical checklist covering nearly every mistake this lesson names, worth rereading now that the whole module's vocabulary is in place." },
    ],
    tags: ["authentication", "security", "breaches", "owasp"],
  },

};
