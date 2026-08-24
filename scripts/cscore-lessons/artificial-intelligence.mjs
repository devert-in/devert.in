// Artificial Intelligence - rewritten lesson bodies. See operating-systems.mjs
// for the authoring rules. This subject is classical/symbolic AI, deliberately
// distinct from the Machine Learning subject - so the boundary between them is
// stated repeatedly and on purpose, because conflating the two is the single
// most common misunderstanding a student arrives with.

export const ARTIFICIAL_INTELLIGENCE = {
  "introduction-to-ai": {
    concept: `## AI Is Not Machine Learning

::: story
Ask most people what AI means today and they'll describe machine learning - systems that learn from data.

But GPS route-finding is AI, and learns nothing. A chess engine is AI, and learns nothing. A rule-based medical diagnostic system from 1976 was AI, and learned nothing.

ML is one approach within AI. It's currently the dominant one, and it isn't the field.
:::

**Artificial Intelligence** is the broad study of making machines do things that would require intelligence if a person did them. This subject covers the classical, symbolic techniques - search, knowledge representation, expert systems, game playing - which predate ML and remain genuinely useful.

## Four Ways To Define Intelligence

::: cards
Thinking humanly :: Mimicking actual human cognitive processes.
Thinking rationally :: Following formal logical rules correctly.
Acting humanly :: Behaving indistinguishably from a person - the Turing Test.
Acting rationally :: Taking whatever action best achieves the goal, regardless of whether it resembles human thought.
:::

::: remember
Modern AI leans on the last one, for a practical reason: it's measurable.

You can test whether a system achieved its goal. You cannot test whether it "really thought", because nobody can define the criterion - which is why the Turing Test is famous and no longer the target.
:::

::: checkpoint
A chess engine evaluates millions of positions per second - nothing like how a grandmaster thinks. Is it intelligent?
- ( ) No - it doesn't reason like a human
- (x) Under "acting rationally", yes - it achieves the goal effectively, and the method needn't resemble human cognition
- ( ) Only if it beats a human
- ( ) The question is unanswerable
> Which framing you pick decides the answer, and this is why the framing matters. Under "thinking humanly" it isn't intelligent; under "acting rationally" it plainly is.
:::

::: behind
The term was coined at the 1956 Dartmouth Conference, and the field has since been through several **AI winters** - funding collapses following predictions that didn't arrive on schedule.

Worth knowing because the pattern recurs. Confident timelines, disappointment, retrenchment, then genuine incremental progress - which is a useful lens for evaluating any current claim about where AI will be in five years.
:::`,
  },

  "intelligent-agents": {
    concept: `## Perceive, Then Act

::: story
A thermostat, a chess program and a self-driving car have nothing obvious in common.

All three perceive an environment and act on it to achieve a goal. That single frame describes all of them, and it's what lets one subject cover all three.
:::

An **agent** perceives through sensors and acts through actuators, in pursuit of a goal.

::: cards Four types, increasing in sophistication
Simple reflex :: Acts on the current perception alone, via fixed condition-action rules. No memory. A thermostat.
Model-based reflex :: Maintains an internal model of the world, tracking what it can't currently see.
Goal-based :: Considers possible future actions and picks one that leads toward an explicit goal.
Utility-based :: Ranks the different ways of achieving a goal by preference, choosing the best rather than merely a workable one.
:::

::: checkpoint
A navigation app finds a route that reaches your destination, but chooses among several valid routes by weighing time, tolls and traffic. Which type?
- ( ) Simple reflex
- ( ) Model-based reflex
- ( ) Goal-based
- (x) Utility-based
> Goal-based would stop at "a route that arrives". Weighing several arriving routes against each other by preference is what makes it utility-based - the goal isn't enough to determine the answer.
:::

## What Rationality Actually Means

::: story
A self-driving car brakes for what its sensors report as an obstacle. There was no obstacle - a sensor glitched.

Was the decision irrational?

No. Given what it knew, braking was correct. Rationality is judged against the information available at the time, not against what turned out to be true.
:::

::: remember
**A rational agent takes the action expected to maximise its performance measure, given its percepts and built-in knowledge.**

Not the action that turns out best. The action that was right to take with what it had - which is why a well-designed agent can make a decision that looks wrong in hindsight without having been badly designed.
:::

::: mistake
Reading rationality as omniscience is the standard error, and it makes the concept useless.

If rationality required always being right afterward, no physical agent could ever be rational, since none has complete information. The definition is deliberately about the decision process rather than the outcome.
:::

::: behind
A **learning agent** adds one thing to all four types: it improves its own behaviour from experience, rather than having behaviour fixed at design time.

Which is precisely where this subject meets the Machine Learning subject. The agent framework is classical AI; making the agent learn is what ML contributes to it.
:::`,
  },

  "search-algorithms-uninformed-informed": {
    concept: `## Finding The Sequence Of Actions

::: story
A goal-based agent needs a plan - a sequence of actions from where it is to where it wants to be.

Frame the problem as a **state space**: every possible situation is a state, actions connect states, and finding a plan means finding a path.

Which turns planning into graph traversal, and makes the DSA path's BFS and DFS immediately relevant.
:::

::: cards Two families
Uninformed :: BFS and DFS. Explore systematically with no idea which direction is promising. Complete, and can waste enormous effort.
Informed :: Uses a **heuristic** - an estimate of how far a state is from the goal - to explore promising states first.
:::

::: story
The value of a heuristic is easiest to see negatively.

Searching for a route from Chennai to Delhi, uninformed search explores in every direction equally - including south, into the sea. A heuristic as crude as straight-line distance immediately deprioritises that, without ever computing an actual route.
:::

## A*

::: cards Two numbers per state
g(n) :: The actual cost already incurred to reach state n.
h(n) :: The heuristic estimate of remaining cost from n to the goal.
:::

**A\*** prioritises the smallest **f(n) = g(n) + h(n)** - balancing what a path has cost so far against what it's estimated to still cost.

::: remember
A* finds the genuinely optimal path when its heuristic is **admissible** - meaning it never *overestimates* the true remaining cost.

Underestimating is safe. Overestimating makes A* dismiss a path that was actually best, and it will confidently return a worse route.
:::

::: checkpoint
Why is straight-line distance an admissible heuristic for road navigation?
- ( ) It's usually about right
- (x) Roads can never be shorter than the straight line, so it can only underestimate
- ( ) It's computed quickly
- ( ) It isn't admissible
> It's a guaranteed lower bound by geometry. Which is what admissibility requires - and note being *fast* to compute is a separate desirable property that doesn't affect correctness.
:::

::: behind
**Greedy best-first** search uses only h(n), ignoring the cost already spent.

Faster, and it will happily walk a long way down a path that looked promising early, because it has no memory of what that progress cost. A* keeps g(n) precisely to avoid that.

The trade shows up throughout search: speed against guaranteed quality.
:::`,
  },

  "knowledge-representation-reasoning": {
    concept: `## Facts A Machine Can Reason With

::: story
"All humans are mortal. Socrates is human. Therefore Socrates is mortal."

Trivial for you. For a machine, the hard part isn't the inference - it's storing the first sentence in a form that *permits* the inference.
:::

::: cards Two logics
Propositional :: Whole statements, each true or false, joined by AND, OR, NOT, IMPLIES. Simple, and cannot express general rules about objects.
First-order :: Adds objects, **predicates** (properties and relations), and **quantifiers** - ∀ for all, ∃ there exists.
:::

::: story
In propositional logic you can state "Socrates is mortal" as an atomic fact, and "Plato is mortal", and so on - one statement per person, forever.

First-order logic states it once:

  ∀x Human(x) → Mortal(x)
  Human(Socrates)
  ⊢ Mortal(Socrates)

The conclusion is *derived*, not stored. Which is the entire point - and it's what lets a knowledge base be smaller than the set of facts it knows.
:::

::: checkpoint
Why can't propositional logic express "all humans are mortal"?
- ( ) It can, using AND across every human
- (x) It has no way to quantify over objects - it can only assert specific statements, not general rules
- ( ) The statement is too long
- ( ) It requires fuzzy logic
> No quantifiers and no objects. Enumerating every human with AND fails on anyone not yet listed, which is exactly what a general rule is for.
:::

## The Graph Alternative

::: cards Semantic networks
Nodes :: Concepts and objects - Dog, Animal, Loyal.
Labelled edges :: Relationships - Dog *isA* Animal, Dog *hasProperty* Loyal.
:::

::: remember
Easier for humans to draw and read than formal logic, and expressing largely the same knowledge.

Which is not a competing approach so much as a more approachable notation - and it's the direct ancestor of the **knowledge graphs** behind search engines answering factual questions today.
:::

::: behind
Google's Knowledge Graph is this idea at billions of facts, and increasingly combined with machine learning.

That combination has a name - **neuro-symbolic AI** - and an active research community, aiming to pair symbolic reasoning's precision and explainability with ML's ability to learn from data.

Which is a reasonable summary of where this whole subject is heading.
:::`,
  },

  "expert-systems": {
    concept: `## Encoding An Expert

::: story
In the 1970s, MYCIN diagnosed bacterial infections by applying several hundred IF-THEN rules extracted from interviews with human specialists.

It reportedly outperformed junior doctors. It learned nothing from data - every rule was written down by a person who knew the domain.
:::

An **expert system** emulates a specialist's decision-making in one narrow domain, through explicit rules.

::: cards Two components, deliberately separate
Knowledge base :: The domain's facts and IF-THEN rules. Gathered from human experts - a process called knowledge engineering.
Inference engine :: The reasoning mechanism, domain-independent. Applies rules to facts to derive conclusions.
:::

::: remember
The separation is the architectural insight. The inference engine knows nothing about medicine or cars - so the same engine drives a different expert system by swapping the knowledge base.

Reasoning as reusable infrastructure, domain knowledge as data.
:::

## Two Directions To Reason

::: cards
Forward chaining :: Start from known facts, apply matching rules, derive new facts, repeat. Data-driven: "given these symptoms, what could it be?"
Backward chaining :: Start from a hypothesis, find rules that would prove it, check whether *their* conditions hold, recursively. Goal-driven: "could it be this specifically?"
:::

::: checkpoint
A support system is asked "is this outage caused by the database?" Which strategy fits?
- ( ) Forward chaining
- (x) Backward chaining - there's a specific hypothesis to verify
- ( ) Neither
- ( ) Both are equally efficient
> A specific hypothesis makes it goal-driven. Forward chaining would derive every conclusion the facts support and then check whether yours is among them - correct, and wasteful.
:::

::: mistake
Expert systems are **brittle** at their boundaries, and this is their defining limitation.

Inside the encoded rules they're excellent and fully explainable. Outside them they don't degrade gracefully - they give a confident answer derived from rules that don't apply, with no signal that the situation is novel.

A doctor recognises an unfamiliar presentation. A rule set has no concept of unfamiliarity.
:::

::: remember
That brittleness is a large part of why the field shifted toward machine learning, which generalises better to novel input.

And the cost of that shift was explainability - an expert system can always show you the rule that fired. Which is a trade the field is still arguing about, particularly in medicine and lending.
:::

::: behind
Rule-based systems didn't disappear; they moved and changed names.

Business rules engines, compliance checks, fraud-detection rules and insurance underwriting are all expert systems in this exact architecture - typically now running *alongside* an ML model rather than instead of one.
:::`,
  },

  "adversarial-search-game-playing": {
    concept: `## Someone Is Working Against You

::: story
The search lessons assumed a neutral world - you plan a route and the road doesn't rearrange itself to stop you.

In chess it does. Every second move is chosen by someone trying to make your plan fail.

Which breaks ordinary search: there's no point finding a beautiful path to victory if your opponent simply won't take the moves it requires.
:::

**Minimax** handles this by assuming the opponent plays optimally against you.

::: cards Alternating layers
Your turn - MAX :: You'll pick the move that maximises your score.
Opponent's turn - MIN :: They'll pick the move that minimises it.
:::

Evaluate to some depth, then propagate values back up: each MIN node takes the minimum of its children, each MAX node the maximum.

::: remember
Assuming a perfect opponent is deliberately pessimistic, and that's the right default.

It produces the move with the best guaranteed worst case. If the opponent plays badly you do better than predicted - which is the acceptable direction to be wrong in.
:::

## Alpha-Beta Pruning

::: story
Minimax examines every branch to full depth, and the tree grows exponentially. Chess is far too wide to search deeply this way.

Alpha-beta tracks the best score each player can already guarantee. The moment a branch provably cannot beat what's already been found, it stops exploring it - because the result of that branch cannot change the final answer.
:::

::: checkpoint
Does alpha-beta pruning change the move Minimax would have chosen?
- ( ) Yes - it approximates to save time
- (x) No - it returns the identical move, having examined far fewer positions
- ( ) Only for shallow searches
- ( ) It sometimes finds a better move
> Provably identical output. It skips only branches that cannot affect the result - which is what makes it a free optimisation rather than a trade-off, and it's the most-asked detail about it.
:::

::: didyouknow
The saving is dramatic enough to change what's possible. With well-ordered moves, alpha-beta can search roughly twice as deep in the same time as plain Minimax.

Two extra plies in chess is a substantial strength difference - which is why every serious engine has used it since the 1960s.
:::

::: behind
For Go, even alpha-beta is hopeless - the branching factor is far too large.

**Monte Carlo Tree Search** takes a different approach: run many random simulated playouts and use the aggregate results to estimate move quality, rather than searching exhaustively.

MCTS combined with a neural network evaluating positions is what beat the world's best Go players - classical search and machine learning in one system, which is exactly the combination this subject keeps pointing at.
:::`,
  },

  "fuzzy-logic-ai-ethics": {
    concept: `## Degrees, Not Booleans

::: story
Is 28 degrees hot?

Classical logic demands a threshold. Say 30 - so 29.9 is not hot and 30.1 is hot, and a system built on that rule behaves discontinuously at an arbitrary line nobody experiences.

Nobody perceives temperature that way. It's hot to a degree.
:::

**Fuzzy logic** allows a degree of truth between 0 and 1. At 28 degrees, "hot" might hold to degree 0.6 and "warm" to 0.4 - both, simultaneously.

::: cards Where it earns its place
Control systems :: A washing machine's "if the load is fairly heavy and fairly dirty, wash somewhat longer" adjusts smoothly rather than jumping at a cutoff.
Inherently graded concepts :: Hot, tall, fast, crowded. Real properties without natural boundaries.
Imprecise sensors :: Where a hard threshold would make noise near the boundary cause visible oscillation.
:::

::: mistake
Fuzzy logic is not vague reasoning, despite the name suggesting it.

It's a rigorous mathematical framework with defined operations for combining degrees of truth. It represents imprecision *precisely* - which is the opposite of being imprecise about it.
:::

::: checkpoint
A thermostat with a hard 22-degree cutoff sits at 21.9 and rises to 22.1, repeatedly. What happens?
- ( ) Nothing - it works correctly
- (x) It switches on and off repeatedly at the boundary, cycling the system
- ( ) It ignores small changes automatically
- ( ) It fails permanently
> Oscillation at the threshold, which wears equipment and annoys everyone. Fuzzy control ramps the response, so small changes near the boundary produce small changes in output rather than a switch.
:::

## Ethics, As An Engineering Concern

::: cards Three that recur
Bias :: A system reasoning from biased data or rules reproduces that bias - and at scale, and with the appearance of objectivity.
Transparency :: Can a decision be explained to the person it affected? An expert system can name the rule; many ML models cannot.
Accountability :: When a system causes harm, who is responsible - the developer, the deploying organisation, or nobody?
:::

::: remember
These aren't philosophical decoration. They're design constraints that determine what you're permitted to build in lending, hiring, medicine and criminal justice.

And the transparency point connects directly to this subject: rule-based systems are more explainable than most ML. Which is a live reason to still choose one, in domains where "we cannot say why" is not an acceptable answer.
:::

::: behind
The bias problem is worse than "the data was flawed", and worth stating carefully.

A model reproducing historical hiring bias isn't malfunctioning - it learned the pattern present in its training data, correctly. The bias was in the world, was recorded faithfully, and is now applied consistently and quickly.

Which makes it a problem you cannot fix by improving the algorithm.
:::`,
  },

  "interview-questions": {
    concept: `## Classical AI, Asked Alongside ML

::: story
AI interviews at product companies now mostly assume you mean machine learning.

Which makes the classical material a differentiator rather than a liability - a candidate who can explain A*'s admissibility condition and why alpha-beta is free demonstrates a foundation most ML-only candidates don't have.
:::

## The Answer Shape

::: timeline
State the mechanism :: Precisely. The formula, the condition, the architecture.
Give the concrete case :: Straight-line distance as a heuristic. MYCIN. A thermostat.
Place it against ML :: How this differs from, or combines with, the data-driven approach.
:::

::: reveal What placing it against ML sounds like
Asked about expert systems, an adequate answer describes the knowledge base and inference engine.

A strong one continues:

"The trade against machine learning is explainability against generalisation. An expert system can always show which rule fired, which matters enormously in medicine or lending - and it's brittle outside its encoded rules, giving confident answers to situations it has no rules for.

ML generalises better to novel input and usually can't explain itself. Which is why high-stakes systems often run both: an ML model to flag, explicit rules to decide what's permitted."

Same architecture described. The second answer shows you know when to reach for it.
:::

::: cards The five to have cold
Agent types and rationality :: The four types, and that rationality is judged on available information rather than hindsight.
A* :: f(n) = g(n) + h(n), and that admissibility - never overestimating - is what guarantees optimality.
Expert system architecture :: Knowledge base plus inference engine, and forward versus backward chaining.
Minimax and alpha-beta :: The alternating min/max, and that pruning is provably identical output.
One ethics concern, concretely :: Bias or explainability, with a real example rather than a definition.
:::

::: checkpoint
Asked "is AI the same as machine learning?", what's the strong answer?
- ( ) Yes, in modern usage
- (x) No - ML is one data-driven approach within AI, which also includes search, knowledge representation and rule-based systems that learn nothing
- ( ) No, AI only means robotics
- ( ) They're unrelated fields
> ML as a subset. Naming the non-learning techniques that are still AI is what makes the answer convincing rather than merely correct.
:::

::: mistake
The recurring stumble is asserting alpha-beta "approximates" Minimax to save time.

It doesn't. Identical result, fewer positions examined - and interviewers ask specifically because the difference between "faster approximation" and "free optimisation" reveals whether you understand why it can prune safely.
:::

::: behind
At senior level, expect questions about **neuro-symbolic** approaches - combining symbolic reasoning with learned models.

AlphaGo is the accessible example: Monte Carlo Tree Search from this subject, with a neural network evaluating positions. Neither alone would have worked.

Which is the useful closing thought for this subject. Classical AI and ML aren't competing eras; they're complementary tools, and the interesting systems use both.
:::`,
  },
};
