// Software Engineering - rewritten lesson bodies. See operating-systems.mjs
// for the authoring rules. This subject is about process rather than
// mechanism, so the stories lean on what actually goes wrong on real teams -
// the shipped-wrong-thing, the late merge, the 3am rollback - because the
// principles only make sense as answers to specific failures.

export const SOFTWARE_ENGINEERING = {
  "sdlc": {
    concept: `## Six Phases, And Why Skipping One Costs You

::: story
Nobody builds a house by stacking bricks and seeing what emerges. There's planning, architecture, a foundation, construction, inspection, and years of maintenance afterward - each depending on the one before being done properly.

Software works the same way, and the parallel holds in the uncomfortable direction too: discovering a problem with the foundation once the roof is on is a very different conversation from discovering it on paper.
:::

::: timeline The SDLC's six phases
Requirements :: Working out what the software actually needs to do. Its own lesson later.
Design :: Planning architecture and structure before writing code.
Implementation :: Actually writing it.
Testing :: Verifying it works. Its own lesson later.
Deployment :: Releasing it to real users. Also its own lesson.
Maintenance :: Fixing and improving it after release - and for most real software, by far the longest phase.
:::

::: didyouknow
That last point surprises people entering the industry. A product might be built in six months and maintained for eight years.

Which means most of a professional developer's career is spent in the phase that student projects never reach - working inside code someone else wrote, under constraints nobody wrote down.
:::

## Why Each Phase Exists

::: cards What skipping each one buys you
Skip requirements :: You build the wrong thing, correctly. A working product nobody needed - and no bug report will ever tell you.
Skip design :: An architecture that resists every change you'll want to make for the next five years.
Skip testing :: Your users find the bugs. They tell some of you and simply leave over the rest.
:::

::: checkpoint
A misunderstood requirement is caught during Maintenance rather than during Requirements. Roughly what's the cost difference?
- ( ) About the same - it's the same misunderstanding
- ( ) Perhaps twice as much
- (x) Orders of magnitude more
- ( ) Cheaper later, since the code already exists
> Orders of magnitude. In Requirements it's a conversation and a corrected sentence. In Maintenance it's understanding live code, patching, retesting, redeploying, and possibly migrating data users have already created.
:::

::: remember
That cost curve is the entire justification for taking the early phases seriously. They aren't bureaucracy standing between you and the real work - they're the cheapest place to be wrong.
:::

::: behind
SDLC is a *framework*, not a methodology. It describes which phases exist, not how to organise them.

Waterfall runs them strictly in sequence. Agile cycles through them repeatedly in miniature. Both are doing the same six phases - the disagreement is about ordering and batch size, and that disagreement is most of this subject.
:::`,
  },

  "agile": {
    concept: `## Built On An Admission

::: story
The uncomfortable premise Agile starts from: for most genuinely new software, you do not know what you need to build until you have built some of it and watched someone try to use it.

Not because the planning was lazy. Because the information doesn't exist yet.
:::

**Agile** is the philosophy that follows from taking that seriously: build and deliver working software in small increments, gather real feedback, and adapt - rather than specifying everything upfront and discovering the gaps at the end.

## The Four Value Pairs

::: cards The Agile Manifesto, 2001
Individuals and interactions :: over processes and tools
Working software :: over comprehensive documentation
Customer collaboration :: over contract negotiation
Responding to change :: over following a plan
:::

::: mistake
These are **prioritisations**, not rejections, and misreading them is the most common way Agile gets applied badly.

"Working software over comprehensive documentation" does not mean don't document. It means when the two compete for the same afternoon, the working software wins.

Teams that read the right-hand column as worthless produce undocumented systems with no plan and call it Agile.
:::

::: checkpoint
A team stops writing documentation entirely, citing the Manifesto. What have they misread?
- ( ) Nothing - that's what it says
- (x) A prioritisation as a rejection - documentation still has value, just less than working software
- ( ) The Manifesto only applies to Scrum teams
- ( ) Documentation was never mentioned
> A prioritisation. The word "over" compares two valuable things; it doesn't zero out the second one.
:::

::: remember
Agile is a philosophy, not a process. **Scrum** - the next lesson - is one concrete framework for practising it. Agile is the why; Scrum is a how.

Teams that say "we do Agile" almost always mean they do Scrum, or something descended from it.
:::

::: behind
Agile is not universally correct, and saying so out loud is a mark of understanding rather than heresy.

Safety-critical and heavily regulated software - avionics, certain medical devices - still uses rigorous upfront specification and verification, because the cost of a late-discovered defect there isn't a bad review, it's a fatality and a regulator.

Agile's strength is embracing change cheaply. Where change is expensive by nature and correctness must be proven before shipping rather than discovered after, that strength has nothing to work with.
:::`,
  },

  "scrum": {
    concept: `## Agile, With The Details Filled In

::: story
"Respond to change" and "collaborate with the customer" are good values and terrible instructions. A team that agrees with them on Monday still needs to know what to actually do on Tuesday.

Scrum is the answer that won: specific roles, specific meetings, specific rhythm.
:::

Work happens in **sprints** - fixed-length boxes, commonly two weeks, each ending with a working, potentially shippable increment.

## The Four Ceremonies

::: timeline Around each sprint
Sprint Planning :: At the start. The team decides what work goes into this sprint and commits to it.
Daily Standup :: Every day, about fifteen minutes. What I did, what I'm doing, what's blocking me. Synchronisation without a meeting.
Sprint Review :: At the end. Demonstrate the completed work to stakeholders and collect real feedback.
Sprint Retrospective :: Also at the end, and separately. The team examines its own *process* - what worked, what didn't, what changes next sprint.
:::

::: remember
Review and Retrospective are different meetings with different subjects, and conflating them loses the more valuable one.

**Review looks at the product.** Retrospective looks at **how the team works**. Skip the retrospective and a team repeats the same friction every fortnight indefinitely, which is exactly what makes it the first thing dropped when a sprint runs late - and exactly why dropping it is expensive.
:::

## The Three Roles

::: cards
Product Owner :: Decides *what* gets built and in what order. Owns the prioritised product backlog. Represents the business and the customer.
Scrum Master :: Facilitates the process. Removes blockers, shields the team from outside disruption. Does *not* direct the technical work.
Development Team :: Builds the product, and self-organises on *how* to accomplish what the Product Owner prioritised.
:::

::: mistake
The Scrum Master is not a project manager with a new title. A project manager assigns work; a Scrum Master removes obstacles to work the team assigned itself.

When the role collapses into "the person who decides who does what", the self-organising property the framework depends on is gone, and what's left is Waterfall with standups.
:::

::: checkpoint
Who decides which items the team works on next sprint, and who decides how those items get built?
- ( ) Scrum Master decides both
- (x) Product Owner prioritises what; the team decides how
- ( ) The team decides both
- ( ) Product Owner decides both
> What versus how is the cleanest division in Scrum. Priority is a business judgement; implementation is a technical one, and each belongs with whoever has the information.
:::

::: behind
**Velocity** - work completed per sprint, usually in story points - is tracked to make future planning more realistic. A team averaging 30 points can commit to roughly 30 next time.

It must never be used to compare teams. Story points are deliberately relative and team-specific, so "team A does 40 and team B does 25" is a comparison of two different scales. Using velocity as a performance target also reliably produces inflated estimates rather than faster work, which is a lesson organisations relearn constantly.
:::`,
  },

  "waterfall": {
    concept: `## One Direction Only

::: story
Waterfall is the original model, and its shape is in the name: progress flows down through the phases and never back up.

Requirements are finished before Design begins. Design is finished before anyone writes code. Each phase completes, is signed off, and closes.
:::

::: flow
Requirements -> Design -> Implementation -> Testing -> Deployment -> Maintenance
:::

## The Strength And The Weakness Are The Same Property

::: cards
As a strength :: Everything is specified before it's built. Stakeholders know exactly what's coming, documentation exists at every phase, and scope is unambiguous. Genuinely valuable when requirements are stable and well understood.
As a weakness :: Everything is specified before it's built. A misunderstanding surfacing during Testing means reopening a phase the model treats as closed - expensive, disruptive, and structurally unwelcome.
:::

::: remember
Notice those are the same sentence. Waterfall's rigidity is not a flaw that better discipline would fix - it's the mechanism that produces the predictability, and the mechanism that punishes discovery.

Whether it's a strength depends entirely on one question: **are the requirements actually knowable upfront?**
:::

::: checkpoint
For which project is Waterfall genuinely the better fit?
- ( ) A startup's first product, exploring what users want
- (x) A regulated avionics component with a fixed, certified specification
- ( ) A social app iterating weekly on engagement features
- ( ) An internal tool whose users are still deciding what they need
> The one where requirements are genuinely known in advance and the documentation is a regulatory deliverable rather than overhead. Everywhere else, Waterfall's rigidity has nothing to buy with it.
:::

::: mistake
Dismissing Waterfall as simply outdated is the lazier error, and it reads as inexperience in an interview.

It's a deliberate trade-off that still fits real contexts: aerospace, some government contracts, certain medical device software - places where the cost of a late defect is catastrophic and the documentation is itself a required output.
:::

::: behind
The **V-Model** is Waterfall's most useful refinement. It pairs each development phase with a corresponding verification phase - Requirements with Acceptance Testing, Design with System Testing, and so on.

The point is that each phase's test plan gets written *alongside* that phase, not at the end. It addresses plain Waterfall's most-earned criticism: testing arriving last, as an afterthought, when there's no schedule left for it.
:::`,
  },

  "requirement-analysis": {
    concept: `## "Make It Fast" Is Not A Requirement

::: story
A stakeholder says the system should be fast.

Fast compared to what? Measured how? Under what load? With how many records? On what connection?

Everyone nods. Everyone leaves the room with a different number in their head. Six months later the software is exactly as fast as somebody expected, and three people are disappointed.
:::

Ambiguous requirements are one of the best-documented causes of project failure - not because anyone was careless, but because agreement was assumed where none existed.

::: cards Vague versus testable
"The system should be fast" :: Unverifiable. There is no observation that could settle whether it was achieved.
"Search returns within 500ms for up to 1 million records" :: Testable. You can write the test today and it will pass or fail.
:::

## Two Kinds Of Requirement

::: cards
Functional :: What the system *does*. "Users can reset their password via email." These are the obvious ones - stakeholders volunteer them.
Non-functional :: How *well* it does it. Performance, security, scalability, usability. "Passwords must be hashed." "10,000 concurrent users." Nobody volunteers these.
:::

::: mistake
Non-functional requirements get forgotten precisely because they're invisible when present and catastrophic when absent.

No stakeholder asks for a system that doesn't fall over at 500 users, or one that doesn't store passwords in plain text - they assume it. Then the launch goes well, which is when both of those become the same emergency.
:::

::: checkpoint
"The app should be secure." What's wrong with it as a requirement?
- ( ) Nothing - security is essential
- (x) Nothing is testable - it names a goal without a single verifiable condition
- ( ) It should be a functional requirement instead
- ( ) It's too technical for stakeholders
> Untestable. Nobody can ever demonstrate it was met or missed. A usable version names specifics: passwords hashed with a named algorithm, sessions expiring after a stated period, all traffic over TLS.
:::

## Getting To Something Testable

::: cards Techniques that work
Ask concrete questions :: Don't accept "fast" - ask "how long is too long, and for how many records?" Stakeholders usually have a number and haven't been asked for it.
Write user stories :: "As a [role], I want [feature], so that [benefit]." The format forces *who* and *why* to be stated, and the why is where hidden assumptions live.
Prototype early :: A clickable mockup surfaces misunderstandings in an afternoon that a specification would hide until Testing.
:::

::: behind
**MoSCoW** prioritisation sorts a gathered requirement list into Must have, Should have, Could have, and Won't have this time.

The last category is the one that earns its place. Explicitly recording what you've decided *not* to do prevents it resurfacing later as an assumed omission - and it makes the first release's scope an agreement rather than a discovery.
:::`,
  },

  "uml": {
    concept: `## A Diagram Anyone Can Read

::: story
Two engineers sketch the same system on two whiteboards. One draws boxes with arrows. The other draws circles with dotted lines. Both explain their drawing perfectly well, in person.

Neither diagram means anything six months later without its author standing beside it.
:::

**UML** is a standardised set of visual notations for software design. The value is not that it's beautiful - it's that an engineer who has never met you can read your diagram correctly, without you there to explain your private conventions.

## The Two That Actually Get Used

::: cards
Class diagram :: The system's *static structure*. Classes, their attributes and methods, and the relationships between them - inheritance, composition, association. The same relationships from the OOP subject, drawn.
Sequence diagram :: The *dynamic flow* of one specific interaction over time. Which object calls which method, in what order, for a single scenario like "user submits login form".
:::

::: remember
Structure versus behaviour, and they answer different questions.

A class diagram answers "what exists and how is it related". A sequence diagram answers "what happens, in what order, when someone does X". A design discussion usually needs both, and reaching for the wrong one is why some diagrams explain nothing.
:::

::: checkpoint
You're documenting how a payment flows through four services, in order, including which calls happen synchronously. Which diagram?
- ( ) Class diagram
- (x) Sequence diagram
- ( ) Neither - describe it in prose
- ( ) Both are equally suitable
> Sequence. The question is fundamentally about ordering over time, which a class diagram has no way to express - it shows what's connected, not what happens when.
:::

## How Much To Actually Draw

::: mistake
The failure mode is trying to keep exhaustive, current UML for an entire codebase. Code changes faster than diagrams get updated, and a diagram that's subtly wrong is worse than none - people trust it and are misled.

The honest guideline: use UML deliberately, for the parts of a design complex enough that a shared picture genuinely helps. A whiteboard sketch during an architecture discussion, or a diagram in an onboarding doc for a genuinely gnarly subsystem. Not a mandated artifact for every class you write.
:::

::: behind
UML also defines **use case diagrams** - which actors can perform which actions, useful early for scoping a system's boundary - and **activity diagrams**, essentially flowcharts for a business process.

Worth knowing they exist. Class and sequence diagrams are what you'll actually be asked to sketch.
:::`,
  },

  "testing": {
    concept: `## Why The Shape Is A Pyramid

::: story
A team decides to test properly and writes a hundred end-to-end tests driving a real browser through real workflows. Genuine confidence, real user journeys, nothing mocked.

The suite takes fifty minutes. Developers stop running it before pushing. Six tests fail intermittently for reasons nobody can reproduce, so failures start getting ignored. Within a quarter, the most thorough test suite on the team is also the one nobody trusts.

Every one of those tests was a good test. The distribution was wrong.
:::

::: timeline The testing pyramid, base upward
Unit tests - the wide base :: One function or method, in isolation, dependencies mocked. Milliseconds each. When one fails, you know exactly what broke. Have thousands.
Integration tests - the middle :: Several pieces together - a service against a real database. Slower, fewer. Catches the broken interface between components that unit tests structurally cannot see.
End-to-end tests - the narrow top :: A complete user workflow through the whole system, often a real browser. Slowest, most brittle, most realistic. Have a handful, covering the journeys that must never break.
:::

::: remember
The shape follows from one trade-off: as you go up, realism increases and speed and precision both fall.

An inverted pyramid - mostly E2E, few unit tests - is a recognised anti-pattern with a predictable ending: a suite too slow to run often and too flaky to believe. Which is worse than a smaller suite people actually trust.
:::

::: checkpoint
A unit test suite passes completely, but the feature is broken in production. What did the unit tests structurally fail to check?
- ( ) Nothing - the tests must be wrong
- (x) That the pieces work *together* - each unit was correct against its mocks
- ( ) Whether the code compiles
- ( ) Whether users like the feature
> Integration. Every unit behaved correctly against its mocked dependencies, and the mocks didn't match reality. This exact gap is what the middle layer exists for, and it's why unit tests alone aren't sufficient however many you have.
:::

## Test-Driven Development

::: timeline Red, green, refactor
Red :: Write a failing test first, before any implementation. It describes the behaviour you want.
Green :: Write the minimum code that makes it pass. Not elegant - passing.
Refactor :: Now clean it up, re-running the test continuously to confirm you haven't broken it.
:::

::: didyouknow
TDD's less obvious benefit is what it does to your design. Writing the test first means you experience your own interface as a caller before you've committed to an implementation - and awkward interfaces are immediately, physically annoying to write tests against.

Code that's hard to test is usually code that's hard to use. TDD just makes you notice on day one instead of month three.
:::

::: behind
**Coverage** - the percentage of lines the test suite executes - is worth treating carefully rather than as a target.

100% coverage does not mean correct. A test can execute a line and assert nothing meaningful about it. Coverage reliably identifies code that is *definitely untested*; it says nothing about whether the covered code was checked properly.

Which is why coverage as a mandated number tends to produce tests written to touch lines rather than tests written to catch bugs.
:::`,
  },

  "version-control": {
    concept: `## The Assumption Underneath Everything Else

::: story
This subject has covered Agile's incremental delivery, Scrum's sprints, testing suites, and is about to cover CI/CD.

Every one of those quietly assumes something: that a team can track every change to a shared codebase, know who made it and why, work in parallel without overwriting each other, and undo a mistake.

Take that away and none of them function. Not "work less well" - cannot operate at all.
:::

This lesson situates version control in the engineering *process*. The mechanics - branches, commits, merges, pull requests - are covered properly in this platform's Git & GitHub subject.

## What Breaks Without It

::: cards What its absence actually costs
Parallel work :: Two engineers editing the same file have no safe way to combine their changes. Someone's work is lost, and often nobody notices which.
History :: No reliable answer to what changed between releases, who changed it, or why. Debugging becomes archaeology without artifacts.
Reverting :: No safety net. A bad change must be un-made by hand, from memory, under pressure.
Review :: No way to look at a proposed change before it lands, because there's no such thing as a proposed change.
:::

::: checkpoint
Why is CI/CD impossible without version control, rather than merely harder?
- ( ) CI/CD tools happen to require Git specifically
- (x) CI is defined as automated build-and-test triggered by changes merging into a shared branch - with no shared branch and no merges, there's nothing to trigger on
- ( ) CI/CD needs the commit history for its reports
- ( ) It isn't impossible, just slower
> The concept has no meaning without it. CI isn't a tool bolted onto version control; it's a practice defined in terms of it.
:::

::: remember
This is why version control is a non-negotiable baseline at every real company, regardless of size, methodology or stack.

It isn't a productivity tool teams adopt when they mature. It's the substrate the other practices are built on - and the reason it's easy to overlook is that nobody has worked without it recently enough to remember the alternative.
:::

::: behind
**Trunk-based development** versus **long-lived feature branches** is a real strategic choice with direct consequences for the next lesson.

Trunk-based means small frequent merges into the main branch, leaning on strong automated tests and feature flags to hide unfinished work. Long-lived branches keep work isolated longer, which means larger and more painful merges later.

CI's benefit scales with merge frequency, so the branching strategy largely determines how much CI can actually do for you.
:::`,
  },

  "ci-cd": {
    concept: `## Small Merges, Because Big Ones Hurt

::: story
Two developers start work on Monday on the same area of a codebase, on separate branches.

Merge on Tuesday: two days of divergence, a handful of conflicts, both changes fresh in both minds. Twenty minutes.

Merge in three weeks: hundreds of files, conflicts in code neither person remembers writing, and no confidence that a resolution which compiles is a resolution which is correct. Two days, and a lingering suspicion something got lost.

The conflicts are the same conflicts. The cost is not the same cost.
:::

**Continuous Integration** is merging into a shared main branch frequently - multiple times a day - with an automated build and test run on every merge.

::: remember
The insight isn't "automate the tests". It's that **integration pain grows non-linearly with divergence**, so the answer is to diverge less rather than to get better at merging.

Automation is what makes frequent merging safe. Frequency is what makes it valuable.
:::

## Delivery Versus Deployment

::: cards The distinction interviewers ask about
Continuous Delivery :: Every passing change is built, packaged, and *ready* to deploy at any moment. A human still decides when to press the button.
Continuous Deployment :: Every passing change goes to production *automatically*. No human gate at all.
:::

::: checkpoint
A team's pipeline builds, tests and packages every merge, and a release manager deploys twice a week. Which is this?
- (x) Continuous Delivery
- ( ) Continuous Deployment
- ( ) Neither
- ( ) Both, since the pipeline is fully automated
> Continuous Delivery - the human gate is exactly what distinguishes them. Automation up to the door, person on the handle.
:::

::: timeline A typical pipeline
Merge :: Code lands on the shared branch.
Build :: Compile and bundle. Fails here mean it doesn't even assemble.
Test :: Unit tests, then integration - fast ones first, so failures surface soonest.
Package :: A deployable artifact is produced and stored.
Deploy :: Automatically, under Continuous Deployment - or on a human's word, under Continuous Delivery.
:::

Any stage failing stops the pipeline. Broken code doesn't silently continue.

::: mistake
Continuous Deployment without genuinely trustworthy automated tests isn't fast, it's a way of shipping bugs at speed. The tests *are* the safety net once the human gate is removed - so removing the gate before earning the tests inverts the safety trade rather than improving it.
:::

::: behind
**Feature flags** resolve the tension people expect between deploying continuously and shipping unfinished work.

A feature's code merges and deploys immediately but stays hidden behind a flag until it's ready. Deployment and release become separate decisions - the code is live, the feature is not.

That separation is what makes continuous deployment compatible with features that take three weeks to finish.
:::`,
  },

  "deployment": {
    concept: `## Getting It Live Without Breaking It

::: story
"Copy the new code onto the server and restart it" works right up until it doesn't - and when it doesn't, every user is looking at the failure simultaneously, and your options are to fix it forward while they wait or scramble to reassemble what was working an hour ago.

Deployment strategy is the discipline of never being in that position.
:::

## Two Strategies

::: cards
Blue-green :: Two complete identical environments. Blue is live; deploy the new version to idle Green, test it there under production-like conditions, then switch all traffic to Green at once. Blue sits idle as an instant rollback. Costs you two full environments.
Canary :: One environment, gradual exposure. Send 5% of real traffic to the new version while 95% stays on the old. Watch error rates and latency. Increase gradually if healthy; route away entirely if not. Costs you a slower rollout.
:::

::: remember
Both are answers to the same question - *how do I limit what a bad release can damage* - and they answer it differently.

Blue-green limits damage by **duration**: the switch is instant, so exposure is short and reversal is immediate. Canary limits damage by **audience**: exposure is long but only ever a slice of users is at risk.
:::

::: checkpoint
A bug only appears under real production load, and 5% of traffic is enough to trigger it. Which strategy catches it before everyone is affected?
- ( ) Blue-green - the new version is tested before the switch
- (x) Canary - real traffic hits the new version at limited volume first
- ( ) Neither can catch load-dependent bugs
- ( ) Both catch it equally well
> Canary. Blue-green's pre-switch testing isn't real production load, so a load-dependent bug survives it and then meets 100% of users at once. That specific gap is what canary exists for.
:::

::: story
Neither strategy is worth anything without the thing they both assume.

If nobody notices the new version is failing, no rollback is triggered. The 5% canary group is a monitoring tool, and without monitoring it's just 5% of your users having a bad time silently.
:::

::: remember
**Rollback** is the shared safety net: the ability to return to a known-good version quickly and reliably, rather than debugging live production under pressure.

And rollback requires monitoring to be triggered at all. Deployment strategy and observability aren't separable concerns - they're two halves of one discipline, and a strategy without alerting is theatre.
:::

::: behind
Both strategies also assume something less obvious: that the old and new versions can coexist, at least briefly.

Database schema changes are where this gets genuinely hard. If the new version needs a column the old one doesn't have, rolling back may mean rolling back data - which is why experienced teams deploy schema changes separately from the code that uses them, in a backwards-compatible order.

The deployment strategy is easy. The state underneath it is the actual problem.
:::`,
  },

  "project-management": {
    concept: `## Three Corners, And You Don't Get All Of Them

::: story
"Can we add this feature, keep the deadline, and not grow the team?"

Sometimes yes, if the estimate was padded. Usually the honest answer is that one of the three has to move, and the only real question is which one moves deliberately versus which one moves by surprise in the final week.
:::

The **project management triangle**: **scope**, **time** and **cost** are interdependent. Change one and at least one other must give.

::: cards Three ways to absorb more scope
Extend time :: The deadline moves. Honest, and often the least damaging.
Increase cost :: Grow the team. Less effective than it sounds - see below.
Reduce scope :: Cut something else. Usually the option nobody proposes and frequently the right one.
:::

## Why Adding People Backfires

::: story
A project is three weeks late. Add three engineers.

They need to understand the codebase, which means the people who already understand it stop building and start explaining. Communication paths grow faster than headcount - five people have ten pairs, eight people have twenty-eight.

**Brooks's Law**: adding manpower to a late software project makes it later.
:::

::: remember
Software work isn't uniformly divisible. Some of it genuinely parallelises; some of it is one person understanding one problem, and a second person cannot halve that.

Which is Amdahl's Law from the Computer Organization subject, arriving in a completely different context - the sequential fraction sets the floor, and no amount of added capacity gets under it.
:::

::: checkpoint
A project is late. Which response is most likely to actually help?
- ( ) Add three engineers immediately
- (x) Cut scope to what the remaining time can genuinely deliver
- ( ) Keep everything and hope for a good final sprint
- ( ) Extend the deadline without changing anything else
> Cutting scope. It's the only option with no onboarding cost, no coordination overhead and no hope required - and it's the one that needs an explicit decision, which is precisely why it gets avoided.
:::

## Why Estimation Is So Hard

::: story
A builder who has built forty identical houses can estimate the forty-first accurately, because it's the same work.

Software features are almost never the same work. If it had been built before in your codebase, you'd be calling the existing function. Being new is the defining property of the task - which makes unknown complexity the normal case, not the exception.
:::

::: cards Techniques that help
Planning poker :: Team members estimate independently, then compare. Large disagreements are the signal - they mean two people understood the task differently, which is far more valuable to surface than the number itself.
Story points :: Relative complexity rather than hours. Sidesteps the false precision of "eleven hours" for something nobody has done before.
:::

::: behind
The **cone of uncertainty** describes what accuracy is even available: estimates made before requirements are understood are unavoidably poor, and they narrow as real work produces real understanding.

Which is the strongest argument for Agile's incremental re-planning. Not that upfront estimates are done carelessly - that early in a project, the information required for an accurate estimate does not exist yet, so treating an early number as a commitment is a category error rather than a discipline problem.
:::`,
  },
};
