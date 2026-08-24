// Security Fundamentals - rewritten lesson bodies. See operating-systems.mjs
// for the authoring rules. This is application-level security (OWASP, injection,
// XSS, CSRF, JWT hardening), deliberately distinct from the Cyber Security
// subject's organisational focus - and the injection/XSS/CSRF trio share one
// root cause, so each lesson names it rather than treating them as separate
// facts to memorise.

export const SECURITY_FUNDAMENTALS = {
  "authentication": {
    concept: `## The Question Everything Else Assumes

::: story
Every other security control in this subject assumes one thing already worked: that the system knows who is making the request.

Get that wrong and permission checks are checking the wrong person's permissions, audit logs record the wrong name, and encryption protects data from everyone except the attacker who logged in as you.
:::

**Authentication** verifies identity. It runs first because nothing after it means anything without it.

## A Password Is Not Enough

::: story
Your password may already be in a breach you've never heard of, from a site you used once in 2019 and reused it on.

Nothing you did wrong, nothing you can detect, and no amount of password strength helps - the attacker isn't guessing it.
:::

::: cards The three factor categories
Something you know :: A password, a PIN. Cheap, and the only category that can be stolen without touching you.
Something you have :: A phone receiving a code, a hardware key. Requires physical proximity.
Something you are :: A fingerprint, face recognition. Hard to steal, and impossible to change once it is.
:::

**MFA** requires two or more *different* categories. Which is the part that matters - a password plus a security question is still one category, and both are stealable the same way.

::: checkpoint
An attacker has your correct password and MFA is enabled with an authenticator app. What stops them?
- ( ) The password is rejected as compromised
- (x) They also need the code from your physical device, which they don't have
- ( ) The account locks permanently
- ( ) Nothing - the password is enough
> The second factor. The password worked exactly as they hoped, and it wasn't sufficient - which is the entire design goal.
:::

## Never Store A Password You Could Recover

::: mistake
Two wrong ways to store a password, and the second one fools people.

**Plain text** is obviously catastrophic in a breach.

**Reversibly encrypted** feels responsible and isn't. Encryption exists to be reversed, so the decryption key must also exist somewhere - and an attacker who reached your database is well positioned to reach it too. One breach, every password.
:::

::: remember
The right answer is a one-way **hash**, covered in full two lessons from now.

The system never needs your actual password. It only needs to check that what you typed hashes to the same value as what it stored - which means it can verify you without ever being able to reveal you.

Which is also why a site that can email you your existing password has already told you something alarming about how it stores it.
:::

::: behind
MFA has a known weak factor: **SMS**.

**SIM swapping** - social-engineering a carrier into moving your number to an attacker's device - defeats SMS codes entirely, and it's a documented, repeatedly-used attack rather than a theoretical one.

Which is why security-conscious systems prefer authenticator apps, generating codes locally and never transmitting them, or hardware keys. All three are "something you have"; they are not equally strong.
:::`,
  },

  "authorization": {
    concept: `## Verified, And Still Not Allowed

::: story
An employee logs in successfully and tries to open a colleague's salary record.

The system knows precisely who they are. That's exactly how it knows to refuse.
:::

**Authorization** decides what a verified identity may do. Distinct question, distinct answer, and it runs after authentication rather than instead of it.

## Roles, Not People

::: story
Assigning permissions to individuals works for eleven users and collapses at eleven hundred.

Someone changes team and you're editing their permission list by hand. Someone leaves and nobody knows what they had. A new hire is granted access by copying whatever the last person had, including the parts they shouldn't.
:::

**RBAC** - Role-Based Access Control - assigns permissions to **roles**, and users to roles.

::: cards
Viewer :: read_reports
Editor :: read_reports, edit_reports
Admin :: read_reports, edit_reports, delete_reports, manage_users
:::

The check becomes "does this user's role include the permission this action needs" - one question, answerable consistently, and a new hire gets a role rather than an inherited pile.

::: checkpoint
A logged-in Viewer attempts to delete a report and is refused. Which control refused them?
- ( ) Authentication - their identity was rejected
- (x) Authorization - their identity was fine, their role lacks the permission
- ( ) Encryption
- ( ) The password policy
> Authorization. This distinction is asked constantly, and the one-line version is: they are who they say they are, and that isn't enough.
:::

## The Habit Worth Making Default

::: remember
**Least privilege**: grant every user, service and process the minimum access it needs to do its job. Nothing extra, nothing "in case it's useful later".

A backend service that only reads should hold read-only credentials. Not because you distrust the service - because the day it's compromised through something unrelated, read-only is the ceiling on what the attacker gets.
:::

::: mistake
The reasoning that defeats this is always the same and always sounds sensible: broader access now avoids a permissions ticket later.

It also means every future compromise of that component is maximally damaging. Least privilege doesn't reduce the chance of a breach at all - it decides how much a breach costs, and that decision is made months in advance.
:::

::: behind
**ABAC** - Attribute-Based Access Control - generalises RBAC. Access depends on multiple dynamic attributes at once: the user's department, the resource's classification, time of day, device location.

More expressive, and considerably harder to reason about - "why was this denied?" can require evaluating six attributes. Right when rules genuinely can't be expressed as a fixed set of roles, and overkill when they can.
:::`,
  },

  "encryption": {
    concept: `## Reversible, On Purpose

::: story
Encryption turns readable data into unreadable data, and back again.

The "and back again" is the whole point, and it's what separates encryption from the next lesson's hashing. Encryption keeps a secret; hashing throws it away.
:::

**Plaintext** plus a **key** produces **ciphertext**. Anyone with the key reverses it; anyone without it cannot.

## Two Kinds, Two Problems

::: cards
Symmetric :: One key encrypts and decrypts. Fast and efficient - and both parties need the same secret key already, which raises the question of how it got to both of them.
Asymmetric :: A mathematically linked pair. The **public** key encrypts and can be shared with anyone, including attackers. Only the **private** key decrypts. Solves key exchange, and is markedly slower.
:::

::: story
That key-exchange problem is genuinely hard. Two parties who have never met need a shared secret, over a network someone may be watching.

Asymmetric encryption solves something that sounds impossible: they agree on a secret in public, with the eavesdropper hearing every word and learning nothing usable.
:::

::: checkpoint
Why does TLS use asymmetric encryption briefly, then switch to symmetric?
- ( ) Asymmetric encryption is insecure for large data
- (x) Asymmetric solves key exchange; symmetric is far faster for the bulk transfer, so each does what it's good at
- ( ) Symmetric encryption can't be used over a network
- ( ) For backwards compatibility
> Each is used where it wins. Asymmetric establishes a shared symmetric key, then symmetric carries the session. Neither alone would be both secure and fast.
:::

## Two Places Data Needs Protecting

::: cards
In transit :: While moving across a network. HTTPS/TLS. Protects against interception.
At rest :: While stored on a disk or in a database. Protects against a stolen backup, a discarded drive, or a database file copied wholesale.
:::

::: remember
These defend against genuinely different attacks, and doing one doesn't help with the other.

HTTPS everywhere doesn't protect a database dump someone walked out with. An encrypted disk doesn't protect a login form posted over plain HTTP. A system needs both, and having one is not most of the way there.
:::

::: behind
The same public/private key pair also powers **digital signatures**, used for a different purpose.

Sign with your *private* key, and anyone can verify with your *public* key that the data came from you and wasn't altered. Encryption keeps data secret; signing proves origin and integrity.

Which is what JWT signatures do, and why they can use asymmetric keys instead of a shared secret - letting many services verify tokens while only one can issue them.
:::`,
  },

  "hashing": {
    concept: `## One Way Only

::: story
A hash takes any input and produces a fixed-size string. There is no key that turns it back.

Not "hard to reverse". No inverse operation exists - the information is gone by design, and that's the property being purchased.
:::

::: cards Two properties that make it useful
Deterministic :: The same input always produces the same hash. Which is what makes verification possible without storage.
Avalanche :: Change one character and the output is completely, unpredictably different. Which is what makes tampering detectable.
:::

So a login check hashes what you typed and compares it to what was stored. The system verifies you without ever holding your password.

## Why Naive Hashing Isn't Enough

::: story
An attacker doesn't try to reverse your hash. They precompute hashes for millions of common passwords once, and look yours up.

If "password123" is in the table - and it is - your stored hash reveals it instantly. No cracking, no computation at the time of attack. A lookup.
:::

That's a **rainbow table**, and it works because everyone who chose the same password has the same stored hash.

::: remember
**Salting** breaks it. Generate a unique random **salt** per password, and hash the combination: \`hash(password + salt)\`.

Now two users with identical passwords have completely different stored hashes - so a precomputed table would have to be rebuilt for every individual salt, which is not feasible at any scale.
:::

::: checkpoint
Salts are stored in plain text next to the hash. Doesn't that defeat the purpose?
- ( ) Yes - salts must be kept secret
- (x) No - a salt's job is uniqueness, not secrecy. Knowing it doesn't help against a precomputed table
- ( ) Salts are encrypted separately
- ( ) Only if the salt is short
> Uniqueness is the mechanism. The attacker can read the salt and still has to compute a fresh table for that one password - which is exactly the cost salting was added to impose.
:::

::: mistake
Confusing hashing with encryption leads to the wrong tool in both directions.

**Encryption is reversible** and protects secrets you need back - a stored API key. **Hashing is one-way** and verifies things you never need to recover - a password.

"Encrypt the passwords" sounds more secure than hashing and is strictly worse, because it means they can be recovered.
:::

::: behind
Password hashing should use bcrypt or Argon2 - never a general-purpose hash like SHA-256, even salted.

The reason inverts normal engineering instinct: bcrypt is deliberately **slow**. SHA-256 is fast, which is excellent for checksums and terrible here, because an attacker with your hash file benefits from speed exactly as much as you do.

A slow hash costs a legitimate login one computation nobody notices, and costs a brute-force attacker billions. The performance flaw is the security feature.
:::`,
  },

  "owasp": {
    concept: `## A Shared Vocabulary

::: story
A security audit reports "an A03 Injection vulnerability in the search endpoint".

Everyone reading it - the developer, the security lead, the compliance auditor, the contractor who joins next month - understands the same thing. Nobody has to define terms first.
:::

**OWASP** is a nonprofit maintaining free security resources, and its **Top 10** ranks the most critical, most common web application security risks, built from data contributed across the industry.

::: cards Why the list matters beyond naming threats
Shared terminology :: One agreed name per category, instead of each team inventing its own.
Priority from real data :: The ranking reflects what's actually being exploited, not what sounds alarming.
A checklist that exists :: Something concrete to review against, which is more than most teams had before it.
:::

## What's On It

::: cards Representative categories
A01 :: Broken Access Control
A02 :: Cryptographic Failures
A03 :: Injection - including SQL injection
A05 :: Security Misconfiguration
A07 :: Identification and Authentication Failures
:::

::: checkpoint
Is the Top 10 a fixed list?
- ( ) Yes, unchanged since publication
- (x) No - it's revised periodically as real-world data shifts, with categories merged and reprioritised
- ( ) It changes monthly
- ( ) Only the order changes
> Revised on a multi-year cycle. CSRF, for instance, had its own entry and was later folded into Broken Access Control - so quoting a category number without its year can be misleading.
:::

::: remember
The next three lessons - SQL injection, XSS, CSRF - are specific entries on this list, and the first two share a single root cause: **untrusted input treated as executable code rather than inert data**.

Seeing that one pattern is worth more than memorising three separate attacks, because it generalises to the attacks not yet on the list.
:::

::: behind
Two other OWASP resources are more immediately useful than the Top 10 itself once you're writing code.

The **Cheat Sheet Series** gives concrete, code-level prevention guidance per category - what to actually do, rather than what to fear. **ZAP** is a free scanner that tests a running application for many of these automatically.

The Top 10 tells you what matters. Those two tell you what to type.
:::`,
  },

  "sql-injection": {
    concept: `## Data That Becomes Instructions

::: story
A login query is assembled by joining strings:

  "SELECT * FROM users WHERE username = '" + input + "'"

Someone types \`' OR '1'='1\` as their username. The query the database receives is:

  SELECT * FROM users WHERE username = '' OR '1'='1'

\`'1'='1'\` is always true. They're logged in as whoever the first row happens to be, without knowing any password.
:::

Nothing was hacked in any exotic sense. The input arrived as data and left as **syntax**, because string concatenation cannot tell the difference.

::: cards How far it goes
Authentication bypass :: The example above. Log in as anyone.
Data extraction :: A crafted UNION returns the contents of other tables - users, payment records, anything readable.
Destruction :: In the worst configurations, dropping tables outright.
:::

## The Fix Is Structural

::: remember
**Parameterised queries** - prepared statements - are the answer, and they work by construction rather than by vigilance:

  db.query("SELECT * FROM users WHERE username = ?", [input])

The query *structure* and the *values* travel to the database separately. The database substitutes values as data, and there is no stage at which user input could be parsed as SQL.

The same \`' OR '1'='1\` input becomes a literal string to search for. It matches no username, and nothing happens.
:::

::: checkpoint
Why is escaping dangerous characters an inferior fix to parameterised queries?
- ( ) Escaping is slower
- (x) It requires correctly anticipating every dangerous pattern - one gap and the vulnerability returns, while parameterisation removes the possibility entirely
- ( ) Escaping doesn't work at all
- ( ) They're equivalent
> Escaping is a blocklist, and blocklists fail at the edges - different encodings, different database dialects, the case nobody thought of. Parameterisation doesn't filter anything; it removes the channel.
:::

::: mistake
The instinct to filter input rather than separate it is what keeps this vulnerability alive after twenty-five years.

Filtering is a bet that you thought of everything. Parameterisation makes the question moot - and it's also less code.
:::

::: behind
SQL injection is one instance of a pattern, not a special case.

**Command injection** - user input concatenated into a shell command. **NoSQL injection** - the same trick against a document database's query syntax. **LDAP injection**, **XPath injection**, and template injection all share it.

One rule covers all of them: **never mix untrusted input into anything that will be interpreted as syntax.** Keep structure and data separate, whatever the language being constructed.
:::`,
  },

  "xss": {
    concept: `## The Same Mistake, In The Browser

::: story
SQL injection put attacker syntax into a database query. **XSS** puts attacker JavaScript into a page - and it runs in someone *else's* browser, with their session, their cookies, their logged-in identity.

The victim did nothing but view a page.
:::

Same root cause as the last lesson: untrusted input rendered as code rather than displayed as text.

::: cards Three variants
Stored :: The script is saved - in a comment, a profile field, a forum post - and served to every subsequent viewer. One injection, thousands of victims. The most dangerous.
Reflected :: Echoed back in a single response, typically from a URL parameter. Needs the attacker to get one specific victim to click a crafted link.
DOM-based :: Happens entirely client-side, when JavaScript inserts untrusted input - a URL fragment, say - into the page. The server never sees it, so server-side defences never fire.
:::

::: checkpoint
Why is stored XSS considered worse than reflected?
- ( ) It's harder to fix
- (x) It's served to every viewer automatically, with no need to trick anyone into clicking anything
- ( ) It can access more data
- ( ) Reflected XSS doesn't execute
> Reach, with no social engineering required. A stored payload in a popular comment thread fires for every visitor - and the more trusted the page, the worse it is.
:::

## Output Encoding

::: remember
The fix is **output encoding**: before inserting untrusted content into a page, convert the characters that mean something in HTML into entities.

\`<\` becomes \`&lt;\`, \`>\` becomes \`&gt;\`, quotes become \`&quot;\` and \`&#39;\`.

A \`<script>\` tag becomes the literal text \`&lt;script&gt;\` - displayed on the page as characters, parsed as nothing.
:::

::: story
Modern frameworks do this automatically. React, Vue and Angular all encode interpolated values by default, which is why XSS is far rarer than it was.

Which means most XSS today arrives through a deliberate bypass: \`.innerHTML\`, or React's \`dangerouslySetInnerHTML\`.

That API is named the way it is on purpose. It's the only warning you get, and it's in the function name.
:::

::: mistake
Encoding must match the **context** it's inserted into. HTML-encoding is right for element content and wrong for a JavaScript string, a URL parameter, or a CSS value - each has different dangerous characters.

Which is another reason to let the framework handle it: it knows the context, and a hand-rolled escape function usually assumes one.
:::

::: behind
**Content Security Policy** is the second layer. A CSP header declares which sources scripts may load from - \`script-src 'self'\` permits only your own domain.

So even if a payload survives encoding, the browser refuses to execute it. Defence in depth: encoding stops injection, CSP stops execution, and you need one of them to fail before the other matters.
:::`,
  },

  "csrf": {
    concept: `## No Code Injected At All

::: story
You're logged into your bank in one tab. In another, you open an unrelated page that happens to contain:

  <img src="https://yourbank.com/transfer?amount=1000&to=attacker">

Your browser sees an image tag and fetches the URL. And because it's a request to yourbank.com, it attaches your yourbank.com session cookie - automatically, as it does for every request to that domain.

The bank receives a request with a valid session cookie. If it treats that as proof you intended this, the transfer happens.
:::

**CSRF** injects nothing. It exploits a browser behaviour that is working exactly as specified: cookies go with every request to their domain, regardless of which page triggered it.

::: cards Why this is a different class of bug
SQL injection and XSS :: Attacker-supplied content is executed as code. The fix is to stop treating input as syntax.
CSRF :: No attacker content runs anywhere. The request is legitimate in every mechanical sense - it just wasn't intended.
:::

::: checkpoint
The forged request carries a valid session cookie. What has the server actually failed to verify?
- ( ) That the user is authenticated
- (x) That the user *intended* this request - authentication proves identity, not intent
- ( ) That the cookie is genuine
- ( ) That the amount is valid
> Intent. The cookie honestly proves who the browser belongs to and says nothing about whether its owner asked for this - and that gap is the whole vulnerability.
:::

## CSRF Tokens

::: remember
The server includes a unique, unpredictable **token** in each legitimate page it serves, and requires it on every state-changing request.

The attacker's page can cause your browser to send a request with your cookie. It cannot read a token out of a page on another domain, and it cannot guess one.

So the forged request arrives correctly authenticated and without the token, and is refused.
:::

::: mistake
CSRF protection is often applied to obvious money-moving endpoints and forgotten on password change and email change.

Which are the two that matter most, because either one converts a single forged request into permanent account takeover.
:::

::: behind
The **SameSite** cookie attribute is the browser-level defence, and it's now the default in most browsers.

\`SameSite=Strict\` or \`Lax\` tells the browser not to send a cookie on cross-site requests at all - which kills the attack at the source rather than detecting it at the server.

It doesn't replace tokens. Older browsers, and some legitimate cross-site flows, mean the server-side check still earns its place - two independent mechanisms, either sufficient, both cheap.
:::`,
  },

  "jwt-security": {
    concept: `## Trusting The Attacker's Own Instructions

::: story
A JWT's header names the algorithm used to sign it. A verification library reads that header to know how to check the signature.

Read that sentence again, from an attacker's point of view.
:::

The **none algorithm attack**: the JWT specification permits \`alg: "none"\`, meaning unsigned. Some libraries trusted whatever the token's own header claimed - so an attacker could craft \`{"alg": "none"}\` with an empty signature and any payload they liked, and a vulnerable server accepted it without verifying anything.

::: cards The flaw and the fix
Vulnerable :: \`verify(token, algorithm = token.header.alg)\` - the token decides how it gets checked.
Fixed :: \`verify(token, expectedAlgorithm = "HS256")\` - the server decides, and rejects anything else regardless of what the header claims.
:::

::: checkpoint
What general principle does this attack violate?
- ( ) Passwords should be hashed
- (x) The verifying party must never let the thing being verified dictate how it's verified
- ( ) Tokens should be short-lived
- ( ) Encryption should be asymmetric
> Never accept security parameters from the untrusted side. It appears constantly in different costumes - a client-supplied role claim, a request header naming its own validation rules, a filename choosing its own permissions.
:::

## The Checklist

::: cards Before shipping JWT auth
Short expiry :: 15 to 60 minutes, with a refresh token for continuity. A stolen token is valid until it expires, and there is no reliable way to recall it.
Strong secret :: Long and randomly generated. A weak secret is brute-forceable offline, and a cracked secret means the attacker can mint valid tokens for anyone.
Enforce the algorithm :: Explicitly, server-side. Never from the header.
No sensitive data in the payload :: It's base64, not encryption. Anyone holding the token reads every claim.
Verify the claims you rely on :: Expiry, issuer, audience. A signature only proves the token is authentic, not that it was meant for you.
:::

::: mistake
That last one is the quiet failure. A valid signature means "someone with the secret issued this" - not "this token is for this service, and still current".

A token issued for a different service in the same system, signed with the same shared secret, verifies perfectly. Checking \`aud\` is what stops it being accepted where it doesn't belong.
:::

::: remember
Notice this whole subject converges on one idea. Injection: don't let input become syntax. XSS: don't let content become code. CSRF: don't let a cookie stand in for intent. JWT: don't let a token specify its own verification.

Every one is a boundary between *what someone sent you* and *what your system treats as authoritative* - and every vulnerability here is that boundary being assumed rather than enforced.
:::

::: behind
The none-algorithm flaw was found in several widely-used libraries and exploited in production, which is why modern JWT libraries require an explicit algorithm and refuse \`none\` outright.

A useful pattern to notice: the specification permitted something dangerous, and the libraries defaulted to permissive. Both had to be wrong for the vulnerability to exist - and the lasting fix was changing the default, not the spec.
:::`,
  },
};
