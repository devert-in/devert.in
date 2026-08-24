// REST APIs - rewritten lesson bodies. See operating-systems.mjs for the
// authoring rules. Note this subject deliberately overlaps Computer Networks'
// HTTP/HTTPS lessons: that subject asks where HTTP sits in the stack, this one
// asks how to design with it. The cross-references are kept so a student
// meeting both knows they're two angles on one protocol, not a repetition.

export const REST_APIS = {
  "http": {
    concept: `## Request, Response, Repeat

::: story
Every page you load, every app that fetches anything, every backend service calling another one - all of it is the same two-step exchange.

A client asks. A server answers. That's the entire shape of the protocol, happening billions of times a second.
:::

**HTTP** runs on top of TCP (from the Computer Networks subject) and does nothing more complicated than that: request in, response out.

::: cards What each half carries
Request :: A **method** (the action), a **URL** (what it acts on), **headers** (metadata), and optionally a **body** (data being sent).
Response :: A **status code** (the outcome), **headers**, and optionally a **body** (the content, or an error).
:::

## The Methods, And What Each Promises

::: cards
GET :: Fetch something. No side effects - this is a promise, not a suggestion.
POST :: Create a new resource, or submit data.
PUT :: Replace an existing resource entirely.
PATCH :: Update part of an existing resource.
DELETE :: Remove a resource.
:::

::: remember
PUT and PATCH are not synonyms. **PUT replaces the whole resource** - fields you omit are gone. **PATCH updates the fields you send** and leaves the rest alone.

Sending a PATCH-shaped body to a PUT endpoint is a real way to silently blank out half a record.
:::

::: checkpoint
Why is using GET for a delete action a genuine problem, not just poor style?
- ( ) GET requests are slower
- (x) Browsers, caches and crawlers freely re-fetch GET URLs - so something will eventually trigger it without a user asking
- ( ) GET can't include a URL parameter
- ( ) It isn't a problem
> Because the whole web treats GET as safe to repeat. A search crawler following links, a browser prefetching, a user hitting back - any of them can fire it. There are real historical cases of crawlers deleting content through GET-based admin links.
:::

::: didyouknow
That safety promise is load-bearing infrastructure. It's why browsers can cache GET responses, why the back button can re-display a page without re-submitting anything, and why prefetching is safe at all.

Break it in your API and you're not violating a convention - you're breaking assumptions the entire web is built on.
:::

::: behind
Two properties worth naming precisely, because interviewers use them.

**Safe** means no side effects - GET, HEAD. **Idempotent** means calling it repeatedly has the same effect as calling it once - GET, PUT and DELETE all qualify, since deleting twice leaves the same state.

POST is neither. Which is exactly why a double-clicked submit button can create two orders, and why retry logic has to treat POST differently from everything else.
:::`,
  },

  "rest": {
    concept: `## A Style, Not A Technology

::: story
REST isn't something you install. There's no REST library to import and no REST protocol to speak.

It's a set of design principles for using HTTP well - which is why two APIs can both claim to be RESTful and look quite different.
:::

**REST** - Representational State Transfer - describes how a client and server should communicate over HTTP. An API following the principles is called RESTful.

## Statelessness

::: story
The server remembers nothing about you between requests.

Every request must carry everything needed to process it - including who you are. Nothing is inferred from what you sent a moment ago.
:::

::: cards Why that's worth the inconvenience
Any server can serve any request :: No instance holds client-specific memory, so a load balancer can route freely and adding servers requires no coordination.
Restarts are harmless :: A server that dies mid-session hasn't lost anything, because it wasn't holding anything.
:::

::: checkpoint
An API stores logged-in user state in server memory. What breaks when a second server is added behind a load balancer?
- ( ) Nothing, load balancers handle this
- (x) A request routed to the second server has no record of the session, so the user appears logged out at random
- ( ) The first server stops responding
- ( ) Only POST requests fail
> Intermittent, unreproducible logouts - roughly half the time with two servers. Which is the single most common symptom of stateful design meeting horizontal scaling, and it's why token-based auth exists.
:::

## URLs Name Things, Methods Do Things

::: cards
RESTful :: \`GET /users/42\`, \`DELETE /users/42\`. The URL is a noun; the verb is the method.
Not RESTful :: \`GET /getUser?id=42\`, \`GET /deleteUser?id=42\`. The action is baked into the path - and that second one is a GET that deletes.
:::

::: remember
The practical benefit of the convention is that it makes an unfamiliar API guessable.

If \`GET /books/42\` works, you can reasonably predict \`DELETE /books/42\` and \`GET /authors/7\` without reading documentation. That predictability is most of what "uniform interface" buys.
:::

::: behind
REST's original definition - Roy Fielding's 2000 dissertation - includes **HATEOAS**: responses should contain links to related actions, so a client discovers the API by following them rather than hardcoding URLs.

Almost no production API does this. Which means most things called REST are a pragmatic subset - worth knowing if you ever meet someone arguing your API isn't really RESTful, because by the strict definition they're probably right and it probably doesn't matter.
:::`,
  },

  "json": {
    concept: `## The Format Everything Settled On

::: story
Two systems written in different languages, by different teams, on different continents, need to exchange structured data.

They agreed on JSON. Almost everyone did, and quite quickly.
:::

**JSON** is a text format for structured data, with a deliberately small type system.

::: cards The complete list of types
Strings :: \`"hello"\` - always double-quoted.
Numbers :: \`42\`, \`3.14\`. No separate integer and float types.
Booleans :: \`true\`, \`false\`.
null :: The absence of a value.
Arrays :: \`[1, 2, 3]\` - ordered, and may hold mixed types.
Objects :: \`{ "key": "value" }\` - and objects and arrays nest arbitrarily deep.
:::

::: checkpoint
Which of these is not valid JSON?
- ( ) \`{"count": null}\`
- ( ) \`{"tags": ["a", "b"]}\`
- (x) \`{onSave: function() {}}\`
- ( ) \`{"nested": {"deep": {"deeper": 1}}}\`
> Functions aren't a JSON type, and unquoted keys aren't valid either - that example breaks both rules. JSON carries data only, which is precisely why it's safe to accept from a stranger.
:::

## Where It Differs From JavaScript

::: mistake
JSON looks like a JavaScript object literal because it was derived from one, and the differences catch people out when hand-writing it.

Keys **must** be double-quoted. Trailing commas are invalid. Single quotes are invalid. Comments aren't allowed at all.

Which is why a config file that "looks fine" fails to parse - it's valid JavaScript and invalid JSON.
:::

::: story
JSON displaced XML for two reasons that compound.

It's shorter - no closing tag repeating every field name. And it maps directly onto structures every language already has, so parsing is one built-in call producing objects and arrays you can use immediately.

XML gave you a document tree to navigate. JSON gives you the data.
:::

::: behind
**JSON Schema** is a separate specification for describing what a JSON document should contain - required fields, types, value ranges.

It's what lets an API validate a request body before any business logic touches it, and generate accurate documentation from the same definition. Worth knowing about the moment you have more than one consumer to keep honest.
:::`,
  },

  "crud": {
    concept: `## Four Operations, Every Application

::: story
Users, products, orders, comments, invoices, playlists.

Whatever the thing is, you need to make one, look at them, change one, and remove one. Almost every screen in almost every application is one of those four.
:::

**CRUD** - Create, Read, Update, Delete - names them, and REST maps them onto HTTP methods directly.

## The Mapping

::: cards The mapping worth memorising
Create :: \`POST /books\` - new book's data in the body.
Read :: \`GET /books\` to list, \`GET /books/42\` to fetch one. Two distinct endpoints.
Update :: \`PUT /books/42\` to replace, \`PATCH /books/42\` to change a field.
Delete :: \`DELETE /books/42\`.
:::

::: remember
Learn this once and you can design endpoints for a resource you've never seen. Asked to build an API for Invoices, or Comments, or Appointments, the shape is already decided - which is exactly why this comes up as an interview exercise.
:::

::: checkpoint
Why are "list all" and "fetch one" treated as two separate endpoints rather than one?
- ( ) Historical accident
- (x) They return different shapes - an array versus a single object - and take different parameters
- ( ) Fetching one is faster
- ( ) They're actually the same endpoint
> Different response shapes and different inputs. \`GET /books\` returns a collection and usually accepts filters and pagination; \`GET /books/42\` returns one object or a 404. Collapsing them means a response whose type depends on the arguments.
:::

::: mistake
The most common CRUD design error is a 201 that returns nothing useful.

After \`POST /books\` the client needs the created resource - specifically its server-assigned id, which it had no way to know. Return the created object, or the client's next move is a guess.
:::

::: behind
Real list endpoints add **pagination**: \`GET /books?page=2&limit=20\`.

Returning every row of a large table in one response is fine on a hundred records and catastrophic on a million - and the failure arrives suddenly, once real data volume shows up. Designing the list endpoint paginated from the start costs almost nothing and saves an urgent migration later.
:::`,
  },

  "authentication": {
    concept: `## Two Questions, Not One

::: story
A logged-in user tries to delete another user's account and is refused.

Nothing failed to identify them. The system knows exactly who they are - and that's precisely why it knows they aren't allowed.
:::

::: cards Distinct questions
Authentication :: Who are you? Verified by a password, or a token proving you already logged in.
Authorization :: What may you do? Given that identity, is this specific action permitted?
:::

::: remember
Authentication comes first and answers identity. Authorization comes second and answers permission.

A regular user is fully authenticated and correctly denied an admin action - which is the cleanest one-sentence example, and worth having ready because this pair is asked constantly.
:::

## Why APIs Moved Away From Sessions

::: story
The traditional approach: log in, the server creates a session record it keeps, and hands you a session ID in a cookie. Every later request presents the cookie and the server looks up who you are.

It works, and it means the server is remembering something - which is the exact thing REST's statelessness rules out.
:::

::: cards The scaling problem it creates
One server :: Fine. The session lives in memory, right where the lookup happens.
Several servers :: Each needs access to the same session store, or a request landing on the wrong instance finds no session and the user is randomly logged out.
:::

::: checkpoint
What does token-based authentication change?
- ( ) Tokens are encrypted, cookies aren't
- (x) The token is self-contained, so any server can verify identity with no shared lookup
- ( ) The server remembers the token instead of the session
- ( ) It removes the need for a login step
> Self-containment. The client carries proof of identity, the server verifies it independently, and nothing needs to be stored or shared - which restores statelessness for an authenticated API.
:::

::: behind
Statelessness costs something real, and it's worth being honest about: **revocation is hard**.

Deleting a session logs someone out instantly. A self-contained token stays valid until it expires, because there's no central list to remove it from - so a password change doesn't immediately invalidate a stolen token.

Real systems answer with short-lived tokens plus a refresh mechanism, or a deliberately stateful blocklist for the cases where immediate revocation genuinely matters. Which means fully stateless auth is a bit of a simplification in practice.
:::`,
  },

  "jwt": {
    concept: `## Three Parts, One Signature

::: story
The server needs to hand you something that proves who you are, that you carry back on every request, and that you cannot alter.

Not something it remembers - something you hold.
:::

A **JWT** is a compact string of three period-separated parts: \`header.payload.signature\`.

::: cards
Header :: Base64-encoded JSON naming the token type and signing algorithm.
Payload :: Base64-encoded JSON holding claims - user id, role, expiry timestamp.
Signature :: A cryptographic hash of the header and payload, computed with a secret key only the server knows.
:::

## What The Signature Actually Does

::: story
Change one character of the payload - say, role from "user" to "admin".

The server recomputes the expected signature from the modified payload using its secret, compares it against the signature in the token, and they don't match. Rejected.

You cannot forge a valid signature without the secret. That's the entire guarantee.
:::

## The Part That Trips Everyone

::: mistake
The header and payload are **base64-encoded, not encrypted**.

Base64 is not a security measure. It's a way of representing data in text, and reversing it takes one function call or a website. Anyone who intercepts a JWT can read every claim inside it immediately.

So: never put anything sensitive in a JWT payload. No passwords, no card numbers, no personal data you wouldn't hand to whoever intercepts the request.
:::

::: checkpoint
What does a JWT's signature guarantee?
- ( ) The payload is secret
- (x) The payload hasn't been altered since the server signed it
- ( ) The token cannot be stolen
- ( ) The token never expires
> Integrity, not confidentiality. Readable by anyone, modifiable by nobody - two different properties, and conflating them is the mistake this whole lesson is built around.
:::

::: remember
Stated as a pair: **signed means tamper-evident. Encoded means readable.** A JWT is both, and only one of them is a secret-keeping property.

Which is why "it's in the JWT so it's safe" is exactly backwards.
:::

::: behind
Because any server sharing the secret trusts a valid unexpired token, a stolen token is as good as stolen credentials until it expires.

Which is why production JWTs are short-lived - often 15 to 60 minutes - paired with a longer-lived **refresh token** stored more carefully and sent over a more restricted path.

The short expiry limits the damage window; the refresh token means users aren't re-logging in every twenty minutes. That's the trade, made deliberately.
:::`,
  },

  "oauth": {
    concept: `## Access Without The Password

::: story
An app wants to read your Google Calendar.

The naive approach is to ask for your Google password. Which would give it your email, your files, your photos, your entire account - forever, with no way to revoke just that one app without changing the password you use everywhere.
:::

**OAuth** exists to make that unnecessary: limited, specific, revocable access to your data on one service, granted to another, without the second one ever seeing your password.

## The Flow

::: timeline The flow
You click "Sign in with Google" :: On the third-party app.
You're redirected to Google :: Google's own page, on Google's own domain. This matters - you type your password only to Google.
You approve a specific scope :: "Allow this app to view your calendar." Not send email, not read contacts. Only what was requested.
Google issues an access token :: To the app. Not your password - a token representing exactly the approved scope.
The app uses the token :: For calendar calls on your behalf, and nothing else.
You can revoke it :: From Google's settings, at any time, without affecting any other app or your password.
:::

::: checkpoint
Why does the login step happen on Google's domain rather than in the app?
- ( ) It's faster
- (x) So your password is only ever typed into Google - the app never sees it, and you can verify the domain
- ( ) Google requires it for branding
- ( ) It avoids CORS problems
> You're authenticating to Google, not to the app. Which is also why a "Sign in with Google" form that appears *inside* an app rather than redirecting is a phishing pattern - the domain in the address bar is the thing you're checking.
:::

::: remember
OAuth and JWT are constantly presented as alternatives and are not.

**OAuth is a framework** - the flow above, defining how delegated access is granted. **JWT is a token format** - the three-part signed string from the last lesson.

OAuth's access tokens are very often JWTs. So a real system commonly uses both: OAuth for the protocol, JWT for the token's shape.
:::

::: didyouknow
The revocation property is the underrated part. Every app you've ever granted access to sits in a list in your account settings, individually removable.

Which is only possible because none of them ever had your password. Delegated access made per-app revocation a thing that can exist.
:::

::: behind
OAuth defines several **grant types** for different app architectures.

**Authorization Code** is the flow above, for apps with a backend that can keep a secret. **PKCE** is the variant for browser-only and mobile apps, which genuinely cannot hide a secret in shipped code.

Picking the wrong one is a real vulnerability rather than a style choice - the implicit flow, once standard for single-page apps, is now discouraged for exactly this reason.
:::`,
  },

  "status-codes": {
    concept: `## Three Digits That Should Tell The Truth

::: story
An API returns \`200 OK\` with a body reading \`{"error": "not found"}\`.

Every monitoring dashboard now reports a perfectly healthy service. Every client that checks the status code before parsing sees success. The error is invisible to everything except a human reading the body.
:::

Status codes are how a response says what happened, and the first digit sets the category.

::: cards The five ranges
1xx :: Informational. Rarely seen directly.
2xx :: Success.
3xx :: Redirection.
4xx :: Client error - the request was wrong.
5xx :: Server error - the request was fine, the server failed.
:::

::: remember
The 4xx/5xx split is a statement about whose fault it is, and it matters operationally.

**4xx means don't page anyone** - a client sent something invalid. **5xx means wake someone up** - your code broke. Returning 4xx for your own bug hides real failures; returning 5xx for bad input creates false alarms.
:::

## The Seven Worth Knowing Cold

::: cards
200 OK :: Generic success.
201 Created :: A POST created something. Distinct from 200 and worth using precisely.
400 Bad Request :: Malformed or invalid input.
401 Unauthorized :: Actually means *not authenticated*. The name is a historical misnomer.
403 Forbidden :: Authenticated, but not permitted.
404 Not Found :: No such resource.
500 Internal Server Error :: Something broke on your side.
:::

::: checkpoint
A logged-in user requests another user's private data. Which code?
- ( ) 401 Unauthorized
- (x) 403 Forbidden
- ( ) 400 Bad Request
- ( ) 404 Not Found
> 403. They're authenticated, so 401 would be wrong and would prompt a client to re-authenticate pointlessly. 401 and 403 map exactly onto authentication versus authorization from two lessons ago.
:::

::: mistake
401 and 403 are the most confused pair here, and the names are actively unhelpful - "Unauthorized" is the one that means unauthenticated.

The way to keep it straight: **401 means "I don't know who you are."** **403 means "I know exactly who you are, and no."**
:::

::: didyouknow
Some APIs deliberately return 404 instead of 403 for resources you aren't allowed to see.

The reason is subtle: 403 confirms the resource exists, which is itself information. Returning 404 reveals nothing about whether the id is real - a small, deliberate lie in the service of not leaking the shape of your data.
:::

::: behind
**422 Unprocessable Entity** sits between 400 and success: the request is syntactically valid JSON but fails semantic validation - a well-formed field holding a malformed email, or a date in the past where a future one was required.

Some APIs distinguish it carefully; many use 400 for both. Worth knowing it exists when you need the finer distinction.
:::`,
  },

  "api-testing": {
    concept: `## No Frontend Required

::: story
The backend endpoint is finished. The frontend won't exist for three weeks.

There is nothing to wait for. An API speaks HTTP, and anything that speaks HTTP can exercise it right now.
:::

::: cards Two tools for manual testing
curl :: Command line, scriptable, available everywhere. Also the format every API's documentation examples are written in.
Postman :: A GUI for the same idea - build requests, save them into collections, inspect responses visually. Better for exploration and for sharing a request with a teammate.
:::

  curl -X POST https://api.example.com/books \\
    -H "Content-Type: application/json" \\
    -d '{"title": "1984"}'

::: remember
Being able to write that from memory is a genuinely expected backend skill. \`-X\` for the method, \`-H\` for a header, \`-d\` for the body - and forgetting the Content-Type header is the reason a correct-looking request gets rejected.
:::

## Why Manual Testing Isn't Enough

::: story
You test the endpoint by hand. It works. You move on.

Six weeks later someone refactors a shared validation helper. The endpoint now returns 500 for one specific input.

Nobody tests it by hand, because it was working. It's discovered by a user.
:::

::: cards What automated tests pin down
Expected status :: \`POST /books\` with valid data returns 201.
Expected body :: The created book comes back, with its assigned id.
Expected failures :: A missing required field returns 400, not 500 and not 200.
:::

::: checkpoint
An automated test asserts only that the endpoint returns 200. What can still break undetected?
- ( ) Nothing - 200 means it worked
- (x) The response body's shape or contents, which the test never looked at
- ( ) The status code
- ( ) Only performance
> Everything about the actual answer. A test asserting only the status passes happily while the response returns an empty object - which is how a test suite ends up green and worthless.
:::

::: remember
The reason automated API tests matter is the same reason any automated test matters, from the Software Engineering subject: they catch **regressions** - things that used to work and quietly stopped.

Manual testing verifies today. Automated testing verifies every day after, including the day someone changes something unrelated.
:::

::: behind
**Contract testing** addresses APIs consumed by other teams. Rather than testing the API alone, an agreed request/response contract is verified from both the provider's and each consumer's side independently.

It catches a breaking shape change before deployment - specifically the failure where the provider's own tests all pass because they were updated alongside the change, and a consumer nobody tested against breaks in production.
:::`,
  },
};
