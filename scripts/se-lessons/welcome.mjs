// Module: welcome - regenerated from Firestore by
// scripts/regen-se-lesson-file.mjs. Firestore is the authoritative copy of
// authored content; this file is the reviewable source for the next edit.
//
// Prose fields are template literals, so any inline-code backtick in the text
// appears here escaped as \`. That escaping is generated, not hand-written -
// see the header of the regen script for why.

export const WELCOME = {

  "why-this-course-exists": {
    subtitle: "The gap between writing code and understanding software",
    difficulty: "Beginner",
    estimatedMinutes: 12,
    xpReward: 20,
    coinReward: 8,
    learningObjectives: [
      "Name the specific gap this course closes, and recognise it in yourself",
      "Explain why learning a framework first tends to produce fragile knowledge",
      "Describe what it means to understand a system rather than a syntax",
    ],
    story: `A third-year student sits down to build a project. She has finished a React course - a good one, 40 hours, with certificates. She can write components, manage state, style with Tailwind.

She builds a login form. It looks perfect.

Then she needs it to actually log someone in, and everything stops.

Where do the users go? Something called a database, apparently. How does the form talk to it? Not directly, it turns out - something has to sit in between, and she is not sure what or why. Someone mentions an API. Someone else says never put the database password in the frontend, and she does not understand what would go wrong if she did.

She has spent 40 hours learning React and cannot finish a login form.

**Nothing she learned was wrong.** She just learned one piece of a system nobody ever showed her the shape of.`,
    problemStatement: `Most programming education teaches **tools** in isolation. A React course teaches React. A Node course teaches Node. A MongoDB course teaches MongoDB.

None of them teach the thing that connects them, because that thing is not a tool - it is an understanding. And it turns out that understanding is what actually separates someone who can follow a tutorial from someone who can build a product.

So people learn framework after framework, waiting for the picture to assemble itself. Sometimes it does, after a few years and several confusing projects. Usually it assembles badly, with gaps that surface at the worst moments - in an interview, or in production.`,
    concept: `## What this course is

This course teaches the system, not the syntax.

By the end you will be able to trace a single click - from a browser on your phone, through the internet, into a server, down to a database, and all the way back to pixels changing on screen - and explain what every step is for.

That sounds modest. It is the single most useful thing you can know as a software engineer, and most graduates cannot do it.

::: analogy
Learning React before understanding the web is like learning to drive by memorising the gearbox. You will move, and you will have no idea what to do when the engine light comes on.
:::

## What it is not

::: cards
Not a React course :: React appears, but as one answer to a problem you will understand first. The problem outlives the framework.
Not a Node course :: Same. Backends are a concept; Express and Spring Boot are two implementations of it.
Not a bootcamp :: There is no promise that finishing this makes you employable. It makes you *teachable* - every framework you learn afterwards will have somewhere to fit.
Not a shortcut :: It is roughly 90 hours of reading and building. There is no version of this that takes a weekend.
:::

## Why the order matters

Every module here answers a question the previous one raises. That is deliberate, and it is the opposite of how most curricula are arranged.

::: flow
The internet exists -> so machines can talk -> so a browser can ask a server for something -> so a server needs somewhere to keep data -> so it needs to know who is asking -> so all of it needs to run somewhere real
:::

You could read these in any order. You will get more out of reading them in this one.

::: checkpoint
A student says: "I know React and Node, but I don't understand how they talk to each other." What is actually missing?
- ( ) More React practice
- ( ) A better Node tutorial
- (x) An understanding of HTTP, APIs and the client-server boundary
- ( ) A different framework
> The gap is not in either tool. It is in the layer between them - the request/response model that every frontend and backend in the world communicates over. Modules 1, 4 and 7 are about exactly that.
:::

## The one promise

You will not finish this course having memorised anything. You will finish it able to reason about systems you have never seen.

When you open an unfamiliar codebase and find a folder called \`controllers\`, you will know what is probably inside it and why. When an interviewer asks how you would design a URL shortener, you will not be guessing at the shape of the answer.

That is the whole goal.`,
    commonMistakes: [
      "Skipping Modules 1 and 2 because they contain no code - they are the load-bearing ones, and everything after them assumes you read them",
      "Treating this as a substitute for building things. Reading about authentication is not the same as having debugged a broken token at 2am",
      "Trying to finish fast. The lessons are short on purpose; the understanding is not",
      "Waiting until you feel 'ready' to start Module 3. You will not feel ready. Start anyway",
    ],
    industryPerspective: `In a real engineering team, almost nobody is hired to write React. They are hired to change a system safely.

That means reading code somebody else wrote, working out which layer a bug lives in, and predicting what a change will break. A senior engineer's advantage is rarely that they know more syntax - it is that they have an accurate mental model of how the pieces fit, so they can guess where the problem is before opening a file.

Interviews reflect this. "Build a component" is a junior screen. "Walk me through what happens when a user submits this form" is the question that decides the offer, and it is a systems question wearing an implementation costume.`,
    devertCaseStudy: `DeVert is a live example of a decision this course will teach you to reason about.

For the vast majority of what the platform does, **there is no application server in the request path**: the frontend is a static export - plain HTML, CSS and JavaScript on a CDN - and it talks to Firestore directly from the browser, with no Express or Spring Boot sitting in the middle.

But DeVert does have a real backend - **a Spring Boot service, deployed on Google Cloud Run** - and what it does is instructive: only the things a browser genuinely cannot be trusted with. Sending email with real SMTP credentials. Grading code against hidden test cases the student must never see. That is the whole list.

That split has a consequence you will meet properly in Module 4: if the browser talks straight to the database for everything else, then **the database itself has to enforce every rule**. Who may read what, who may write what, how much a value may change by. In DeVert that lives in a single file of Firestore security rules, and if a rule there is wrong, that is not a small bug - it is the entire vulnerability, because nothing else is checking.

By Module 4 you will be able to say whether that split was a good trade. By Module 6 you will understand what it costs.`,
    knowledgeChecks: [
      {
        "question": "What gap does this course primarily aim to close?",
        "options": [
          "Not knowing enough JavaScript syntax",
          "Not understanding how the parts of a software system connect to each other",
          "Not having built enough React projects",
          "Not knowing which framework is most popular",
        ],
        "correctIndex": 1,
        "explanation": "The gap is systemic, not syntactic. Someone can know React and Node well and still be unable to explain how a form submission reaches a database - that connective understanding is what this course teaches.",
      },
      {
        "question": "Why does this course cover the internet and HTTP before any framework?",
        "options": [
          "Because frameworks are unimportant",
          "Because every frontend and backend communicates over that layer, so it is what the frameworks are built on top of",
          "Because it is easier",
          "Because HTTP is newer than React",
        ],
        "correctIndex": 1,
        "explanation": "Frameworks are implementations of ideas that live in the request/response model. Learning the model first means each framework becomes an example of something you already understand rather than a set of rules to memorise.",
      },
      {
        "question": "DeVert talks to its database directly from the browser. What does that force to be true?",
        "options": [
          "The database must be very fast",
          "The security rules on the database must enforce every access rule themselves, because nothing else is in the path to check",
          "The frontend must be written in React",
          "There can be no user accounts",
        ],
        "correctIndex": 1,
        "explanation": "With no server in between, there is no other place to put authorisation logic. The database's own rules become the entire trust boundary - which is exactly why a mistake in them is not a small bug.",
      },
    ],
    assignment: {
      "reflection": "Write down, in your own words and without looking anything up, what you currently think happens between clicking a login button and being logged in. Keep it. You will rewrite it at the end of Module 7 and the difference will be the clearest measure of what you learned.",
      "observation": "Open any website you use daily, open your browser's developer tools, and go to the Network tab. Reload the page. You do not need to understand any of it yet - just notice how many separate requests one page made.",
      "reading": "Read the module list on the course roadmap and note which two modules you expect to be hardest for you. Revisit that note when you get there.",
    },
    summary: "Most programming education teaches tools in isolation, which leaves people able to write components but unable to finish a login form. The missing piece is not more syntax - it is an understanding of how the parts of a system connect. This course teaches that connective layer first, so that every framework you learn afterwards has somewhere to fit. By the end you will be able to trace one click from a browser all the way to a database and back, and explain the purpose of every step.",
    goingDeeper: `## Why this gap exists at all

It is not that educators are careless. It is that systems knowledge is hard to sell and hard to assess.

"Learn React in 40 hours" is a promise with a visible outcome - you finish with a portfolio piece. "Understand how the web works" produces nothing you can screenshot, and it is genuinely difficult to write a multiple-choice test for. So the market optimises for the thing it can package, and the connective understanding is left as an exercise for the reader.

::: didyouknow
The formal name for what this course teaches is closest to *systems thinking* - reasoning about a whole made of interacting parts, where the interesting behaviour lives in the interactions rather than in any single component. It predates software by decades; the ideas come from biology and control engineering.
:::

The upside of the gap being common is that closing it is unusually high-leverage. It is one of the few things you can learn that makes you noticeably better at every language and framework simultaneously, including ones that have not been invented yet.`,
    resources: [
      {
        "kind": "link",
        "title": "MDN: How the web works",
        "url": "https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/How_the_Web_works",
        "description": "Mozilla's short overview. Read it now, reread it after Module 2 - it will feel obvious the second time.",
      },
      {
        "kind": "link",
        "title": "roadmap.sh",
        "url": "https://roadmap.sh",
        "description": "Community-maintained developer roadmaps. Useful for seeing how much territory exists; unhelpful as a study order.",
      },
    ],
    tags: [
      "orientation",
      "systems-thinking",
      "motivation",
    ],
  },

  "what-you-will-be-able-to-build": {
    subtitle: "The concrete outcome, stated plainly",
    difficulty: "Beginner",
    estimatedMinutes: 10,
    xpReward: 20,
    coinReward: 8,
    learningObjectives: [
      "State exactly what you will be able to build and explain after this course",
      "Distinguish between the things this course makes you good at and the things it does not",
      "Identify which module delivers which capability",
    ],
    prerequisites: [
      "Why This Course Exists",
    ],
    story: `There is a particular kind of interview answer that ends a conversation early.

The interviewer asks: *"A user uploads a profile picture. Walk me through everything that happens."*

The weak answer names technologies. "So, um, React would send it to the backend, and then it goes to the database."

The strong answer is a chain, and it has decisions in it. The file goes from an input element to the browser's memory. The browser cannot send it as JSON, so it is sent as multipart form data. It does not go to the database - databases are bad at large binary files - it goes to object storage, and what goes in the database is the *URL*. The server needs to check the file is actually an image and not a 4GB executable. The upload should probably not go through the server at all; a pre-signed URL lets the browser upload straight to storage.

Same question. One answer is a list of nouns; the other is a system with reasons.

**The second answer is what this course is for.**`,
    concept: `## What you will be able to do

By the last module, these should all be things you can do without looking them up.

::: cards What you'll be able to do
Trace any request :: Take any user action on any web product and describe the full path it travels and back, naming what each layer is responsible for.
Explain why, not just what :: Say why an API exists between a frontend and a database, why passwords are hashed and never encrypted, why a browser blocked your request with a CORS error.
Read an unfamiliar codebase :: Open a project you have never seen, recognise the layers from the folder names, and find where a given piece of logic probably lives.
Choose between options :: Decide whether something belongs in the frontend or the backend, in a relational or a document database, in a session or a token - and defend the choice.
Debug by layer :: Given a bug, narrow down which tier it lives in before reading any code. This is most of what debugging actually is.
Deploy something real :: Take a project off localhost and put it somewhere a stranger can use it, with secrets handled properly.
:::

## Which module gets you there

::: timeline The build-up
Modules 1-2 :: The internet and one complete request. After this, "the backend returns JSON" stops being a phrase you repeat and becomes a thing you can picture.
Modules 3-5 :: The three tiers - frontend, backend, database - each on its own terms, with the vocabulary each one uses.
Module 6 :: Identity. The hardest module conceptually, and the one that most improves your interview answers.
Module 7 :: The tiers become one product. This is the lesson where it clicks.
Module 8 :: It leaves your laptop. Git, secrets, builds, hosting, and a first honest look at containers.
Module 9 :: The same reasoning applied to Instagram, WhatsApp, Netflix - and to DeVert itself.
:::

## What this course will not do for you

Being straight about this is more useful than overselling.

::: mistake
This course will not make you a good React developer, teach you to write idiomatic Go, or prepare you for a specific certification. It will not make you employable on its own - that takes projects, and projects take time. What it does is make everything you learn next stick, because it will have somewhere to attach to.
:::

::: checkpoint
Where should the decision "reject uploads larger than 5MB" be enforced?
- ( ) Only in the frontend, so the user gets instant feedback
- ( ) Only in the backend
- (x) In both - the frontend for feedback, the backend because the frontend can be bypassed
- ( ) In the database
> Frontend validation is a courtesy to the user; it is not security, because anyone can send a request without your frontend. Any rule that matters has to be enforced where the client cannot reach. This idea recurs in Modules 4 and 6 and is one of the most valuable things here.
:::`,
    commonMistakes: [
      "Expecting to be job-ready at the end. This course makes you teachable, not hireable - the projects do that part",
      "Reading the module list and skipping to Module 7 because it sounds like the interesting one. It only clicks because 1-6 came first",
      "Measuring progress in lessons completed rather than in whether you can explain a request out loud without notes",
    ],
    industryPerspective: `Engineering job ladders are surprisingly explicit that this is what they are measuring.

Read almost any company's promotion criteria and the junior-to-mid transition is described in terms of *scope*: a junior implements a well-specified task, a mid-level engineer owns a feature end to end. Owning a feature end to end means touching every tier - the interface, the API, the data model, the migration, the deploy - and knowing when to ask for help.

You cannot own a feature end to end while there are tiers you find mysterious. That is why this material pays off in a way that a fifth framework does not.`,
    devertCaseStudy: `Every capability listed above is exercisable on DeVert itself, because the whole platform is a worked example of the choices in this course.

Its code execution feature is a good one to hold onto. When a student runs code in CodeLab, the code does not execute in the browser and it does not execute in Firestore. It goes to a small Spring Boot service, which forwards it to a sandboxed execution provider, gets the output back, and grades it against test cases the student is never allowed to see.

Ask yourself now why it must work that way. Why can the browser not just run the code? Why can the test cases not live alongside the problem in the database, where they would be easier to author?

You will be able to answer both by the end of Module 6, and the reasoning is the same reasoning that decides where a file-size check belongs.`,
    knowledgeChecks: [
      {
        "question": "Which of these is the clearest sign you have actually learned this material?",
        "options": [
          "You have completed every lesson",
          "You can trace a user action through every layer and explain what each is responsible for, without notes",
          "You can name more frameworks than before",
          "You scored well on the knowledge checks",
        ],
        "correctIndex": 1,
        "explanation": "Completion and quiz scores are proxies. The real test is whether you can produce the chain out loud, with reasons - which is also exactly what a systems interview asks for.",
      },
      {
        "question": "Why is frontend-only validation insufficient for a rule that matters?",
        "options": [
          "Because it is slower",
          "Because a client can be bypassed entirely - requests can be sent without your frontend",
          "Because JavaScript cannot validate file sizes",
          "Because the database rejects it anyway",
        ],
        "correctIndex": 1,
        "explanation": "Your frontend is a convenience you ship to users, not a gate. Anyone can craft a request directly, so any rule with real consequences must also be enforced somewhere the client cannot reach.",
      },
    ],
    assignment: {
      "reflection": "Pick one product you use daily. Write down three questions about how it works that you genuinely cannot answer right now. Keep the list; by Module 9 you should be able to answer all three.",
      "observation": "Find a job posting for a junior software engineer. Count how many of the listed requirements are specific tools versus general understanding. Notice the ratio.",
    },
    summary: "By the end of this course you should be able to trace any user action through every layer of a system and explain the purpose of each step, read an unfamiliar codebase and predict where logic lives, choose between architectural options and defend the choice, debug by narrowing to a tier, and deploy something real with secrets handled properly. It will not make you a specialist in any single framework, and it will not make you employable on its own - projects do that. What it does is make everything you learn next stick.",
    goingDeeper: `## Why "walk me through a request" is the interview question that matters

It is almost impossible to fake, and it scales across every level of seniority.

A weak candidate names technologies. A decent one produces the chain. A strong one produces the chain and then volunteers the trade-offs - what breaks under load, what happens if the database is briefly unavailable, which step you would cache.

::: interview
The same question works for a 20-year veteran and a new graduate, because the *depth* of the answer scales rather than the answer being right or wrong. That is why it is so widely used, and why preparing for it is not a trick - the preparation is just genuinely understanding the system.
:::

Notice that none of this requires knowing a framework's API surface. You could answer it well having never written React, and answer it badly having shipped React for three years.`,
    resources: [
      {
        "kind": "link",
        "title": "System Design Primer",
        "url": "https://github.com/donnemartin/system-design-primer",
        "description": "Far beyond this course's scope, but skim the table of contents to see where this material leads.",
      },
    ],
    tags: [
      "orientation",
      "outcomes",
      "interviews",
    ],
  },

  "how-software-actually-changed-the-world": {
    subtitle: "Why this is worth three months of your attention",
    difficulty: "Beginner",
    estimatedMinutes: 12,
    xpReward: 20,
    coinReward: 8,
    learningObjectives: [
      "Explain what software changed that previous technologies could not",
      "Describe why marginal cost near zero is the property that matters",
      "Recognise the same pattern in products you use every day",
    ],
    story: `In 1995, if you wanted to send a photograph to a friend in another country, you took the film to a shop, waited three days, put a print in an envelope, bought a stamp, and waited two weeks. The whole chain cost real money and involved perhaps six people doing physical work.

Today you send it in under a second and the marginal cost is so close to zero that nobody bothers to measure it.

Notice what actually changed. It was not that photographs got better. It was that **the cost of moving one more copy of something fell to nothing**, and once that happened, entire industries built on the assumption of scarcity had no floor to stand on.

That is the whole story of software, repeated in category after category.`,
    problemStatement: `It is easy to work in software for years and never notice why it is economically strange.

Every previous technology had a marginal cost. Build one more car, pay for one more car's worth of steel. Print one more newspaper, pay for paper and ink and a lorry. That cost put a floor under prices and a ceiling on how fast anything could spread.

Software has essentially none. Writing a program is expensive once; running it for the ten-millionth user costs a rounding error. Almost everything else that feels surprising about the industry follows from that single property.`,
    concept: `## The property that explains most of it

::: cards
Near-zero marginal cost :: The tenth user and the ten-millionth cost roughly the same to serve. This is why software companies can give a product away and still work, and why "free tier" is a strategy rather than charity.
Instant distribution :: A fix written this morning can be running for every user this afternoon. No manufacturing, no shipping, no recall.
Composability :: Software is built from other software. A payment feature that would have been a two-year project in 1995 is now an afternoon and an API call.
Compounding :: Because it composes, each layer makes the next one cheaper. Today's afternoon project rests on decades of other people's decades.
:::

## What that did, concretely

::: timeline A rough shape of the change
Automation of the routine :: Work that was rule-following - filing, routing, reconciling - largely stopped being done by people. This displaced a great deal of clerical employment and created a different kind.
Collapse of distance :: A team in Hyderabad and a team in Berlin work on the same codebase in the same hour. Whole categories of firm became possible that had no reason to exist before.
Collapse of scarcity :: Music, film, encyclopaedias, maps, courses. Anything that could be represented as information stopped being scarce, and the industries built on its scarcity had to become something else.
Measurement of everything :: The uncomfortable one. Systems that are cheap to run are also cheap to instrument, so behaviour that was previously unobserved became data. Most of the last decade's arguments about technology are downstream of this.
:::

::: checkpoint
A startup builds a product that costs 500,000 rupees to develop and 2 rupees per user per month to run. What does the near-zero marginal cost mainly change about their strategy?
- ( ) They should charge as much as possible immediately
- (x) Growth matters more than per-unit margin early on, because serving many more users barely raises cost
- ( ) They should limit signups to control expenses
- ( ) Nothing - it is the same as any business
> With a high fixed cost and a negligible variable one, the dominant question is how many users you can reach, not how much each costs to serve. This is why so much of the industry optimises for growth first - it is a rational response to the cost structure, not a fashion.
:::

## The part worth being honest about

::: mistake
"Software changed the world" is usually said as unqualified praise. It is more accurate and more useful to say software changed the *cost structure* of moving and processing information, and that the consequences were mixed. The same property that put an encyclopaedia in everyone's pocket also made mass surveillance economically trivial, and both followed from the same fact about marginal cost.
:::

Understanding that is not cynicism - it is the beginning of being able to make a considered decision about what you build. Every architecture in this course carries a choice about what to collect, what to keep, and who can see it.`,
    commonMistakes: [
      "Treating 'software ate the world' as a slogan rather than a claim about cost structure that you can actually reason with",
      "Assuming the change is finished. Most of the world's routine information work is still done by hand",
      "Confusing what is technically possible with what is worth doing - the interesting engineering questions are usually the second kind",
    ],
    industryPerspective: `The observation is usually credited to Marc Andreessen's 2011 essay "Why Software Is Eating the World", though the underlying economics were described decades earlier.

What is genuinely useful about it for an engineer is not the prediction but the diagnostic: when you see an industry still operating on the assumption that copies are expensive, you are usually looking at something about to change. Retail, taxis, hotels, cinema, and education have all been through some version of it.

It also explains a career fact worth knowing: the highest-leverage engineering work is usually not making something faster, but removing a step that a human was doing because nothing else could.`,
    devertCaseStudy: `DeVert exists because of exactly this property, and its architecture is an unusually literal example.

The platform serves its entire frontend as static files from a CDN and talks to a managed database directly from the browser, so there is no application server to scale for the majority of what it does - the one exception, a small Spring Boot service on Google Cloud Run for email and code grading, is deliberately kept out of that path (see Module 1). The practical consequence: the cost of the thousandth student is close to indistinguishable from the cost of the tenth, and the cost of the hundred-thousandth is not much worse.

That is what makes it possible for a student to build a learning platform at all. Twenty years ago the same product needed a server rack, a sysadmin and a monthly bill that a college student could not carry. The reason DeVert can exist is that almost every expensive part of it is now someone else's commodity.

You will meet the trade-offs of that choice in Module 4 and Module 8. It is not free - it moves the entire security burden into the database's rules - but the cost structure is why it is worth doing.`,
    knowledgeChecks: [
      {
        "question": "Which property of software best explains why a company can offer a free tier and still be viable?",
        "options": [
          "Software is easier to write than hardware",
          "Serving one more user costs almost nothing, so the cost of non-paying users is small",
          "Free users always convert to paying users",
          "Software has no fixed costs",
        ],
        "correctIndex": 1,
        "explanation": "Fixed costs in software are high; marginal costs are near zero. That asymmetry is what makes giving the product to many non-paying users a survivable strategy rather than a fatal one.",
      },
      {
        "question": "What is the most accurate framing of software's effect on the world?",
        "options": [
          "It made everything better",
          "It changed the cost structure of moving and processing information, with mixed consequences that follow from that same change",
          "It mainly made entertainment cheaper",
          "It replaced most jobs",
        ],
        "correctIndex": 1,
        "explanation": "The precise claim is about cost, and it explains both the benefits and the harms - an encyclopaedia in every pocket and trivially cheap surveillance are two consequences of the same property.",
      },
    ],
    assignment: {
      "reflection": "Name one industry near you that still assumes copies are expensive. What would change if that assumption broke?",
      "observation": "Pick one thing you did this week that would have been impossible or expensive in 1995. Trace what specifically made it cheap - was it distribution, storage, computation, or someone else's API?",
    },
    summary: "Software's defining economic property is that the marginal cost of serving one more user is near zero, while the cost of building it is paid once. Almost everything surprising about the industry follows from that: free tiers as strategy, growth over margin, instant global distribution, and the collapse of industries built on information being scarce. The honest version of the claim is that software changed the cost structure of handling information, and the consequences were mixed - the same property that made encyclopaedias free made mass surveillance cheap.",
    goingDeeper: `## Why composability compounds

The reason a student can build a payment flow in an afternoon is not that payments got simpler. It is that someone else absorbed the complexity and exposed a small interface over it.

That is the actual engine of the industry: each generation packages its hard problems so the next generation can treat them as a one-line call. Operating systems hid hardware. Databases hid storage. Cloud providers hid datacentres. Managed auth hid cryptography.

::: didyouknow
This is also why "reinventing the wheel" is such a strong taboo in engineering culture, sometimes to a fault. The instinct is correct on average - the compounding only works if you build on top rather than sideways - but it produces a real blind spot about when the abstraction you inherited is the wrong shape for your problem.
:::

You will see the seam in Module 8. Docker, CI/CD and managed hosting are all the same move applied to deployment, and the reason deploying is now a git push rather than a weekend is that a lot of people packaged a lot of pain.`,
    resources: [
      {
        "kind": "link",
        "title": "Why Software Is Eating the World",
        "url": "https://a16z.com/why-software-is-eating-the-world/",
        "description": "Andreessen, 2011. Short, and the framing is still the standard reference.",
      },
    ],
    tags: [
      "orientation",
      "economics",
      "context",
    ],
  },

  "the-engineer-s-career-map": {
    subtitle: "The roles this course opens, and what each actually does",
    difficulty: "Beginner",
    estimatedMinutes: 13,
    xpReward: 20,
    coinReward: 8,
    learningObjectives: [
      "Distinguish the main engineering roles by what they are responsible for, not by their tech stack",
      "Explain what changes between junior, mid and senior beyond years served",
      "Identify which parts of this course map to which role",
    ],
    prerequisites: [
      "What You Will Be Able to Build",
    ],
    story: `A student asks a question that sounds reasonable and is not: *"Should I become a frontend developer or a backend developer?"*

It sounds like choosing a subject. It is closer to asking a doctor whether to become a left-hand specialist.

In a real team the labels describe *where you spend most of your time*, not a boundary you are forbidden to cross. The frontend engineer who cannot read the API response they are consuming is slow. The backend engineer who has no idea how their JSON gets rendered designs awkward endpoints. The ones who get promoted are the ones who can step across when the bug requires it.

Choose a place to go deep. Do not choose a place to stop.`,
    concept: `## The roles, by responsibility

Every role below is defined by what it owns rather than by which framework it uses, because the frameworks change every four years and the responsibilities do not.

::: cards
Frontend :: Owns what the user sees and touches. Real difficulty: state, accessibility, performance on a cheap phone, and the fact that you control none of the environment your code runs in.
Backend :: Owns correctness and rules. Real difficulty: data modelling, concurrency, failure handling, and being the last line of defence because the client cannot be trusted.
Full stack :: Owns a feature end to end across both. Not "knows everything" - knows enough of each tier to ship a whole slice without waiting on someone.
DevOps / Platform :: Owns the path from a commit to production, and the reliability of what is running there. Their users are other engineers.
Data :: Owns pipelines, warehousing and the correctness of what analysis is based on. Adjacent to backend, different instincts.
Mobile :: Like frontend, with the extra constraints of app stores, offline behaviour and devices you cannot update on demand.
QA / SDET :: Owns confidence. At its best, it is automation engineering, not clicking through screens.
Security :: Owns the adversarial view. Usually a specialisation entered after several years in one of the above.
:::

## What actually changes with seniority

This is the part almost nobody explains, and it is not years.

::: timeline The ladder, honestly
Junior :: Given a well-specified task, completes it. Success is the task working. Needs the problem framed by someone else.
Mid :: Given a feature, owns it end to end across tiers. Success is the feature working *and* not breaking things next to it. Frames small problems themselves.
Senior :: Given an ambiguous problem, works out what should be built and what should not. Success includes the things they talked the team out of. Their code is often the least interesting part of their contribution.
Staff and beyond :: Works on problems that span teams - architecture, standards, the decisions that are expensive to reverse. Increasingly about writing and persuasion rather than code.
:::

::: remember
The junior-to-mid jump is almost exactly "can you own a feature across every tier". You cannot do that while any tier is a mystery to you. That is the specific, mercenary reason this course is worth three months.
:::

::: checkpoint
Two engineers have four years' experience. One has shipped many well-specified tickets accurately. The other has repeatedly taken vague requests and worked out what should be built. Who is more likely to be operating at senior level?
- ( ) The first - accuracy and volume matter most
- (x) The second - handling ambiguity is the defining senior skill
- ( ) Both are equal at four years
- ( ) Impossible to say without knowing their stacks
> Seniority tracks the ambiguity of the problems you can be handed, not throughput or tenure. An engineer who needs every problem pre-framed stays dependent on someone else doing the harder half.
:::

## Which parts of this course serve which role

::: flow
Modules 1-2 -> everyone, without exception -> Module 3 -> frontend and mobile -> Modules 4-5 -> backend and data -> Module 6 -> everyone, and it decides most interviews -> Modules 7-8 -> full stack and platform
:::

The honest summary: Modules 1, 2, 6 and 7 are non-negotiable whatever you become. The rest you can weight toward where you want to go deep.`,
    commonMistakes: [
      "Choosing frontend or backend as an identity before understanding either well enough to have a preference",
      "Believing 'full stack' means knowing everything, rather than being able to ship one feature across the whole stack",
      "Assuming seniority arrives with years. It arrives with the ability to handle problems nobody has framed for you",
      "Optimising a CV for the stack in job ads today, which is a two-year-old snapshot by the time you graduate",
      "Dismissing DevOps and QA as less technical - platform work is often the hardest engineering in a company",
    ],
    industryPerspective: `Look at published engineering ladders - Dropbox, Rent the Runway and CircleCI have public ones - and a consistent pattern appears: the levels are described almost entirely in terms of **scope and ambiguity**, and almost not at all in terms of technology.

You will not find "knows React" at any level. You will find "delivers well-defined tasks", then "owns a feature", then "identifies and scopes problems", then "influences across teams".

This has a practical consequence for how you spend your time. Learning a fifth framework moves you sideways. Learning to own a whole feature moves you up a level, and it requires exactly the cross-tier understanding this course exists to build.`,
    devertCaseStudy: `DeVert is a useful case study in role boundaries because it deliberately has almost no backend, which forces the question of where responsibility lives.

Most of the platform is frontend code talking straight to Firestore. So who owns correctness? The answer is that the *security rules* do - a single file that decides who may read and write what, and by how much a value may change. That file is doing the job an entire backend authorisation layer would normally do.

Which means someone working on DeVert cannot be purely a frontend engineer in the traditional sense. Adding a feature means touching the interface, the data model, and the rules that guard it - a full-stack slice, even though there is barely a server.

The small Spring Boot service that does exist covers precisely the two things a browser cannot be trusted with: sending email with real credentials, and grading code against hidden test cases. That is a clean illustration of where a backend is genuinely load-bearing rather than conventional.`,
    knowledgeChecks: [
      {
        "question": "What most accurately distinguishes a mid-level engineer from a junior one?",
        "options": [
          "Knowing more frameworks",
          "Being able to own a feature end to end across every tier, rather than completing a pre-specified task",
          "Having three or more years of experience",
          "Writing faster code",
        ],
        "correctIndex": 1,
        "explanation": "Published engineering ladders describe this transition almost entirely as a change in scope - from executing a defined task to owning a whole slice, which requires understanding every tier it touches.",
      },
      {
        "question": "What does 'full stack' actually mean in a working team?",
        "options": [
          "Knowing every technology in the stack deeply",
          "Being able to ship one complete feature across frontend, backend and data without waiting on someone else",
          "Being equally skilled at frontend and backend",
          "Working alone on projects",
        ],
        "correctIndex": 1,
        "explanation": "It describes reach, not omniscience. Almost every full-stack engineer is noticeably stronger on one side; what makes them full stack is that neither side blocks them.",
      },
      {
        "question": "Which modules of this course are essential regardless of the role you end up in?",
        "options": [
          "Only Module 3, since everyone touches the frontend",
          "Modules 1, 2, 6 and 7 - the internet, one full request, identity, and integration",
          "Only Module 8, since everything must be deployed",
          "All ten equally",
        ],
        "correctIndex": 1,
        "explanation": "Every role communicates over HTTP, deals with identity, and works inside a request lifecycle. The tier-specific modules can be weighted toward your direction; those four cannot be skipped by anyone.",
      },
    ],
    assignment: {
      "reflection": "Write one sentence on which tier you currently find most mysterious. That is the module to slow down on, not skip.",
      "observation": "In any job posting you find, separate the requirements into 'specific tool' and 'general capability'. Notice which list the seniority signals sit in.",
      "reading": "Find one public engineering career ladder online and read the junior and mid-level descriptions. Count how many requirements name a specific technology.",
    },
    summary: "Engineering roles are defined by what they are responsible for, not by their tech stack - frontend owns what the user touches, backend owns correctness and rules, platform owns the path to production. Seniority tracks the ambiguity of problems you can be handed, not years served: the junior-to-mid jump is essentially the ability to own a feature across every tier, which is impossible while any tier is a mystery. Modules 1, 2, 6 and 7 matter regardless of which role you choose; the rest you can weight toward where you want depth.",
    goingDeeper: `## Why "T-shaped" is the usual advice

The common recommendation is to be T-shaped: broad familiarity across the stack, deep expertise in one area. The broad bar is what lets you work with people and diagnose across boundaries; the deep stem is what makes you worth hiring for something specific.

This course is deliberately the horizontal bar. It will not make you deep in anything. It is what makes the depth you build afterwards usable.

::: interview
A practical note on interviews: for most junior and mid roles, breadth is what gets tested, because companies know your specific stack knowledge will be replaced by theirs within months. The systems questions are a proxy for how quickly you will become useful.
:::

## On specialising too early

There is a real cost to choosing a specialisation before you have felt the other tiers. Preferences formed from tutorials are mostly preferences about tutorials.

The more reliable route is to build one complete thing badly, notice which part you resented least, and go deep there. That is much better information than any amount of reading about what the roles are like.`,
    resources: [
      {
        "kind": "link",
        "title": "progression.fyi",
        "url": "https://progression.fyi",
        "description": "A collection of real, public engineering career ladders. Skim three and notice how little technology appears in them.",
      },
      {
        "kind": "link",
        "title": "The Staff Engineer's Path",
        "url": "https://noidea.dog/staff",
        "description": "Tanya Reilly's writing on what seniority beyond senior actually involves. Far ahead of where you are; useful for direction.",
      },
    ],
    tags: [
      "orientation",
      "careers",
      "seniority",
    ],
  },

  "how-to-use-this-course": {
    subtitle: "How to read it so it actually sticks",
    difficulty: "Beginner",
    estimatedMinutes: 10,
    xpReward: 20,
    coinReward: 8,
    learningObjectives: [
      "Use the lesson structure deliberately rather than reading top to bottom",
      "Know which parts are optional and which are load-bearing",
      "Set a pace you will still be keeping in six weeks",
    ],
    story: `Two people start this course on the same Monday.

The first reads four modules in three days. It feels excellent - fast, productive, a lot of pages behind them. On Thursday they cannot remember what a DNS resolver does, and by the following week they have stopped opening it.

The second reads one lesson a day. Every lesson, they answer the knowledge check before scrolling to the answer, and they write two lines in the notes box about what surprised them. Six weeks later they are on Module 6, they have a small working app, and they can explain a request without hesitating.

The second person read fewer pages and learned more, and the difference is not intelligence or discipline. It is that the second person used the structure and the first person only used the text.`,
    concept: `## What a lesson is made of

Every lesson here has up to sixteen parts, and they are in a deliberate order. Nothing is decoration.

::: timeline How a lesson is built
Story :: Comes first, always, before any terminology. It exists so the concept has somewhere to land. Do not skip it to "get to the real content" - it is doing work.
The problem :: What goes wrong without this idea. A concept you cannot state a problem for is a concept you will forget.
How it works :: The main body. Long lessons get a jump rail at the top so you can move between sections.
Step by step :: The same idea again, traced concretely. If the body felt abstract, this is where it lands.
Mini demo :: Code you can read and copy. Small on purpose.
Where people go wrong :: Read this one twice. Knowing the common mistake is often more useful than knowing the correct version.
Industry and Inside DeVert :: How this is actually done in production, and how this very platform does it.
Knowledge check :: Graded, and it gates lesson completion. Answer before you scroll.
Lab and assignment :: Where the reading turns into memory.
Summary, Going deeper, Resources :: The recap, the optional depth, and where to go next.
:::

Not every lesson has all sixteen. A lesson only shows the parts that were written for it, so the shape varies.

## How to actually read one

::: cards
Answer checkpoints before scrolling :: The inline "Quick check" boxes are ungraded and free to retry. Guessing and being wrong is more useful than reading the right answer - the failed prediction is what makes it stick.
Use the notes box :: Two lines in your own words beats a highlighted paragraph. If you cannot write it in your own words, you have not got it yet.
Do the labs :: Reading about authentication and having debugged a token are different kinds of knowledge, and only one survives an interview.
Skip Going Deeper freely :: It is explicitly optional and collapsed by default. It is there for the second read.
:::

## Pace

::: remember
One lesson a day finishes this course in about three months. Four lessons a day finishes it in three weeks and you will retain a fraction of it. Pick the pace you will still be keeping in six weeks, not the one that feels impressive today.
:::

Nothing is locked. If you already know HTTP, skip to Module 4 - the roadmap marks what you have done but never forbids anything. That is deliberate: a 100-lesson course with a sequential lock is a course people abandon at lesson 12.

::: checkpoint
You read a lesson, understood it while reading, and cannot explain it the next morning. What is the most likely fix?
- ( ) Read it again more slowly
- ( ) Read the next lesson and come back
- (x) Try to explain it from memory first, then reread only the parts you got wrong
- ( ) Watch a video instead
> Rereading feels productive and mostly reinforces the illusion of knowing. Retrieval - trying to produce it from memory and failing - is what actually builds durable memory. It is also uncomfortable, which is why most people reread instead.
:::

## The video slot

Every lesson has a video section. Right now it says the video is coming, because it is - the written lessons are complete and self-contained, and nothing here is waiting on a recording. When the series covers a topic, the video appears in that slot with chapters.`,
    commonMistakes: [
      "Reading the lesson body and skipping the story, which is the part that makes the body make sense",
      "Scrolling past a checkpoint to see the answer. The wrong guess is where the learning happens",
      "Reading four lessons in a sitting. Retention falls off a cliff after about one",
      "Treating Going Deeper as required and then feeling behind. It is optional and marked as such",
      "Never touching the notes box - writing two lines in your own words is the cheapest retention tool here",
    ],
    industryPerspective: `The technique this course is built around has a name in cognitive psychology: **retrieval practice**. Testing yourself on material produces markedly better long-term retention than rereading it, and the effect is one of the more robustly replicated findings in the field.

It is also unpopular, because rereading feels like learning and retrieval feels like failing. The checkpoints in these lessons are ungraded and instantly retryable specifically to make failing cheap enough that you will actually do it.

The same principle is why good engineering teams do code review and incident retrospectives out loud rather than circulating documents. Producing an explanation is a different cognitive act from recognising one.`,
    devertCaseStudy: `A small detail with a reason behind it: this course does not lock lessons.

Elsewhere on DeVert, the older Learning Paths feature *does* gate each task on finishing the previous one. That suits a short guided path with ten steps and a clear sequence.

It would be wrong here. This is a 100-lesson reference course, and a learner who already understands HTTP but is shaky on databases should be able to go straight to Module 5. Locking would turn a resource people return to for two years into a queue they abandon in week three.

What the platform does instead: your progress is stored per lesson, the roadmap shows what you have finished, and completion is entirely advisory. The one thing that *is* enforced is that a lesson with a knowledge check cannot be marked complete until you have submitted it - because the XP for completion should mean you engaged with the check, not that you scrolled past it.`,
    knowledgeChecks: [
      {
        "question": "Why does each lesson open with a story instead of a definition?",
        "options": [
          "To make the lesson longer",
          "So the concept has a concrete situation to attach to before the terminology arrives",
          "Because definitions are inaccurate",
          "To fill space while the videos are recorded",
        ],
        "correctIndex": 1,
        "explanation": "A definition given before you have a reason to care is almost impossible to retain. The story creates the gap that the concept then fills.",
      },
      {
        "question": "You understood a lesson yesterday but cannot explain it today. What is most effective?",
        "options": [
          "Reread the lesson slowly",
          "Attempt to explain it from memory, then reread only the parts you got wrong",
          "Move on and hope it becomes clear later",
          "Highlight the important paragraphs",
        ],
        "correctIndex": 1,
        "explanation": "Retrieval practice - producing the answer from memory, including failing to - builds durable memory far better than rereading, which mostly produces a comfortable feeling of familiarity.",
      },
      {
        "question": "Why is nothing in this course locked behind completing earlier lessons?",
        "options": [
          "Because the order does not matter",
          "Because it is a 100-lesson reference course, and forcing a strict sequence makes people abandon it rather than skip to what they need",
          "Because locking is technically difficult",
          "Because there are no prerequisites between lessons",
        ],
        "correctIndex": 1,
        "explanation": "The recommended order genuinely matters and the roadmap shows it - but enforcing it would break the course's other job as something you return to for a specific answer. Advisory order, not a gate.",
      },
    ],
    assignment: {
      "practice": "Pick a fixed time of day you will read one lesson. Write it down. The specific time matters more than the amount.",
      "reflection": "Go back to the previous lesson and use the notes box for the first time - two lines, your own words, on what surprised you.",
    },
    summary: "Each lesson has up to sixteen parts in a deliberate order: the story comes first so the concept has somewhere to land, the problem statement makes it memorable, and the checkpoints exist to be attempted before you read the answer. Read one lesson a day rather than four - retention falls off sharply after the first. Use the notes box in your own words, do the labs, and skip Going Deeper freely since it is optional. Nothing is locked, so if you already know a topic, move on.",
    goingDeeper: `## Why the checkpoints are ungraded

There is a real tension in educational design between assessment and learning. The moment a question counts for something, people optimise for getting it right - which means they stop guessing, and guessing is where the learning is.

So this course splits them. The inline **checkpoints** are ungraded, instantly retryable, and store nothing. The end-of-lesson **knowledge check** is recorded and gates completion. The first is for learning; the second is for confirming.

::: behind
This is also why the checkpoint reveals the correct answer even when you get it wrong, rather than just saying "try again". Withholding the answer to force another attempt sounds rigorous but mostly produces frustration and guessing at random - and a learner who has already committed to a wrong answer is at the exact moment of maximum receptiveness to the right one.
:::

## On the three-month estimate

Roughly 90 hours of material, one lesson a day, is about three months. That is a long time and it is worth being honest that most people who start will not finish.

The ones who do tend to share one habit: they attached it to something already in their day. Reading one lesson with morning coffee survives; "I'll do some learning when I have time" does not, because you will not have time.`,
    resources: [
      {
        "kind": "link",
        "title": "Retrieval practice: a research overview",
        "url": "https://www.retrievalpractice.org/library",
        "description": "The evidence base for why the checkpoints work the way they do.",
      },
      {
        "kind": "link",
        "title": "Make It Stick",
        "url": "https://www.hup.harvard.edu/books/9780674729018",
        "description": "Brown, Roediger & McDaniel. The most readable book on how learning actually works. Optional, and genuinely worth it.",
      },
    ],
    tags: [
      "orientation",
      "how-to-study",
      "retrieval-practice",
    ],
  },

};
