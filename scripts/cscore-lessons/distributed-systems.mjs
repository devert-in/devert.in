// Distributed Systems - rewritten lesson bodies. See operating-systems.mjs for
// the authoring rules. This subject is the theory under System Design's
// practical vocabulary, so the cross-references to that subject are load-bearing
// rather than decorative - the payoff is a student seeing quorum math and
// recognising the CAP trade-off they already met.

export const DISTRIBUTED_SYSTEMS = {
  "introduction-to-distributed-systems": {
    concept: `## Three Things That Stop Being True

::: story
Write a program for one machine and you get guarantees for free, without ever noticing you had them.

There's one clock, and everything agrees on it. Memory doesn't randomly stop existing halfway through a function. A value you wrote is there when you read it back.

Split that program across machines and all three of those quietly stop holding.
:::

A **distributed system** is a set of independent computers coordinating over a network to appear as one coherent system.

::: cards What you lose
No shared clock :: Every machine has its own, and they drift. There is no authoritative "now".
Independent failure :: Any machine or link can die at any moment, without warning, while the rest carries on.
Unreliable messages :: They can be delayed, lost, duplicated, or arrive out of order.
:::

::: remember
That third point has a consequence worth sitting with: in a distributed system you frequently cannot tell the difference between a machine that has crashed and one that is merely slow.

Both look identical from outside - silence. And almost every hard problem in this subject descends from that one ambiguity.
:::

::: checkpoint
A service stops responding to your requests. What do you actually know?
- ( ) It has crashed
- (x) Nothing definite - it may have crashed, or be slow, or the network between you may have failed
- ( ) The network is down
- ( ) It's overloaded
> Silence is ambiguous, and this is why timeouts are a guess rather than a diagnosis. Acting on the wrong interpretation - assuming crashed when it's slow - is how split-brain incidents start.
:::

## Where This Sits

::: story
This platform's System Design subject already covered load balancing, caching, sharding and the CAP theorem - the practical vocabulary of large systems.

This subject is the layer underneath: the actual algorithms, and the proofs about what is and isn't possible.

CAP theorem told you there's a trade-off. Here you'll meet the quorum math that implements it.
:::

::: behind
Most of this theory is older than the systems using it. Lamport clocks are from 1978, Paxos from 1989, two-phase commit from the 1970s.

Which means etcd, Spanner and Kafka are careful engineering implementations of decades-old papers rather than novel inventions - and reading the original papers is genuinely still the best way to understand them.
:::`,
  },

  "distributed-system-models": {
    concept: `## Two Shapes, Two Assumptions

::: cards Architectural models
Client-server :: Designated servers provide, clients request. Easy to reason about, and the server is a bottleneck and a failure point unless designed around.
Peer-to-peer :: Every machine is an equal peer, both providing and consuming. No special machine to lose - and coordinating without a central authority is genuinely harder.
:::

::: story
Notice the trade is the same one that recurs throughout this subject: centralisation buys simplicity and concentrates risk.

A coordinator makes the algorithm easy to describe and creates one machine whose loss stops everything.
:::

## The Timing Assumption Matters More

::: cards
Synchronous model :: Assumes known bounds on message delivery and processing time. Convenient - you can reason about timeouts meaningfully. Real networks rarely honour it.
Asynchronous model :: No timing assumptions at all. A message may take arbitrarily long, so a slow machine is indistinguishable from a dead one. Pessimistic, and realistic.
:::

::: remember
This isn't an academic distinction. What you assume about timing determines what you can *prove*.

Most serious distributed-systems theory - including the impossibility result in the consensus lesson - is stated in the asynchronous model, because an algorithm proven correct under generous timing assumptions can fail in production when those assumptions lapse.
:::

::: checkpoint
Why do most distributed algorithms assume the asynchronous model rather than the synchronous one?
- ( ) Asynchronous systems are faster
- (x) Real networks don't guarantee timing bounds, so an algorithm relying on them can fail exactly when the network degrades
- ( ) Synchronous models are harder to implement
- ( ) It's a historical convention
> Correctness under the weaker assumption. An algorithm that needs bounded delivery is an algorithm that breaks during the network event you most needed it to survive.
:::

::: mistake
Assuming any real system is purely one architecture is the other common error.

Most large systems are layered: client-server at the user-facing edge, with those servers coordinating peer-to-peer among themselves internally. A database cluster running consensus behind a load balancer is both models at once.
:::

::: behind
The **partially synchronous** model is the practical middle ground: timing bounds hold *eventually*, though not always and not from the start.

That turns out to be exactly what Raft and similar algorithms rely on to make progress. Pessimistic enough to be safe, optimistic enough to terminate - which is the compromise the next few lessons live inside.
:::`,
  },

  "clock-synchronization-logical-clocks": {
    concept: `## There Is No "Now"

::: story
Two events happen on two machines. Which came first?

Each machine timestamped its own event using its own clock. Those clocks disagree - by microseconds or milliseconds, drifting apart continuously because their crystal oscillators are physically not identical.

Network time protocols narrow the gap. They cannot close it. Perfect agreement on the current instant across independent machines is not achievable.
:::

## Lamport's Move

::: story
Leslie Lamport's 1978 answer was to stop trying.

Don't track real time. Track *causality* - which events could have influenced which. That's the question distributed systems actually need answered, and unlike real time, it's answerable exactly.
:::

::: cards The rule, complete
Local event :: counter = counter + 1
Sending :: include your current counter in the message
Receiving :: counter = max(own counter, received counter) + 1
:::

That's the whole algorithm. Three lines, and it guarantees something useful.

::: remember
The guarantee: **if A causally influenced B, then clock(A) < clock(B).**

And crucially, not the converse. If clock(A) < clock(B), A may have influenced B - or the two may be entirely concurrent and unrelated, and got those numbers by accident.

One direction holds. The other doesn't, and assuming it does is the standard mistake.
:::

::: checkpoint
clock(A) = 5, clock(B) = 7, on different machines. What do you know?
- ( ) A definitely happened before B in real time
- (x) Nothing definite - B may have been influenced by A, or the two may be concurrent
- ( ) They're definitely concurrent
- ( ) B influenced A
> Lamport clocks detect *possible* causality, not its absence. Ordering two concurrent events is the thing they explicitly don't do - and if you need that, you need the extension below.
:::

::: mistake
Treating Lamport clocks as timestamps is the failure mode. They're not a clock in any everyday sense - they don't measure duration, can't be compared to wall time, and don't tell you how long ago something happened.

They order causally-related events. That's all, and it's enough for the problems this subject is about.
:::

::: behind
**Vector clocks** extend the single counter to one per machine, and gain something real: they can *detect concurrency*.

If neither vector is component-wise greater than or equal to the other, the events are provably concurrent - which plain Lamport clocks cannot establish.

The cost is size, growing with the number of machines. Which is the recurring shape of these trade-offs: more precise information, more overhead to carry it.
:::`,
  },

  "mutual-exclusion-in-distributed-systems": {
    concept: `## The Lock That Has No Kernel

::: story
On one machine, mutual exclusion is a solved problem. The operating system sees every process, holds the lock table, and arbitrates. The Operating Systems subject covers it in a lesson.

Across machines there is no operating system with that view. Nobody can see everyone. And there's no shared clock to timestamp requests and pick a winner.

The same problem, with every convenient assumption removed.
:::

## Two Approaches

::: cards
Centralised coordinator :: One designated machine grants permission, queueing others. Simple, easy to verify - and its death stops mutual exclusion for everyone.
Token ring :: A single token circulates among machines in a logical ring. Hold the token, enter the critical section, pass it on. No coordinator to lose.
:::

::: story
The token approach removes the single point of failure and introduces a new question: what if the token is lost?

The machine holding it crashes before passing it along. Now nobody may enter, forever, and no machine knows whether the token is in flight or gone.

Detecting a lost token and safely regenerating exactly one replacement is its own protocol - and it's harder than it sounds, because generating two tokens is worse than having none.
:::

::: checkpoint
The centralised coordinator crashes while three machines are queued. What happens?
- ( ) The queued machines proceed in order
- (x) Mutual exclusion stops working entirely - nobody can be granted access
- ( ) The next machine becomes coordinator automatically
- ( ) Only the queued machines are affected
> Everything stops. Automatic failover is possible and it's a separate mechanism - which needs its own agreement about who takes over, and that is the consensus problem in the next lesson.
:::

::: remember
Both approaches have real costs. Centralised: one machine's failure is total. Token ring: a machine may wait for a full ring traversal even when nobody else wants access, and token loss needs recovery.

Which is a fair summary of this subject generally - there is no option without a cost, only options whose costs suit your situation.
:::

::: behind
**Ricart-Agrawala** is the fully decentralised alternative: a machine wanting access broadcasts a timestamped request to *every* other machine, and proceeds only after every one replies.

No coordinator, no token. Ties broken by the previous lesson's logical clocks - which is a nice demonstration that the clock work wasn't abstract.

The cost is message volume: every entry requires messages proportional to the cluster size, which stops being viable as clusters grow.
:::`,
  },

  "consensus-algorithms-paxos-raft": {
    concept: `## Agreeing On One Thing

::: story
Which transaction committed first. Which machine is the new primary. Whether this value is 3 or 4.

A group of machines has to agree on a single answer, and some of them may crash partway through the conversation. Every other coordination problem in this subject reduces to this one.
:::

## The Result That Says You Can't

::: story
The **FLP impossibility result** - Fischer, Lynch and Paterson, 1985 - proves something uncomfortable.

In a fully asynchronous system, with even *one* machine that might fail, no algorithm can guarantee both reaching consensus and terminating in finite time.

Not "hasn't been found". Proven impossible, in the same way the Halting Problem is proven impossible.
:::

::: remember
And yet consensus algorithms work in production every day. The resolution isn't that FLP is wrong - it's that FLP assumes the *fully* asynchronous model.

Real algorithms assume **partial synchrony**: timing bounds hold eventually. Under that slightly stronger assumption, termination becomes achievable.

FLP tells you exactly which assumption you cannot do without. That's more useful than a discouragement.
:::

::: checkpoint
Given FLP proves consensus can't be guaranteed, how does etcd work reliably?
- ( ) It ignores the theory
- (x) It assumes partial synchrony - timing bounds eventually hold - which is weaker than synchronous but stronger than what FLP assumes
- ( ) It only tolerates zero failures
- ( ) FLP applies only to theoretical systems
> A slightly stronger timing assumption than FLP's worst case. In a permanently unstable network Raft genuinely may not make progress - and it's designed to stay *safe* while failing to progress, which is the right priority.
:::

## Paxos And Raft

::: cards
Paxos :: Lamport, 1989. Leaderless multi-round proposal and acceptance, requiring majority agreement. Correct, foundational, and famously difficult to understand or implement correctly.
Raft :: Designed for understandability, with the same guarantees. Elects an explicit leader by randomised timeout; the leader then sequences all decisions.
:::

::: didyouknow
Raft's design goal was *comprehensibility* - unusual for an algorithm paper, and it worked. The paper is titled "In Search of an Understandable Consensus Algorithm".

Which is why etcd, Consul and most modern systems implement Raft rather than Paxos. Being correct wasn't the differentiator; being implementable correctly by ordinary teams was.
:::

::: remember
Both need a **majority** to agree, which is why cluster sizes are odd. Five machines tolerate two failures; six also tolerate two, while costing more and being no safer.

Even-sized clusters are a common misconfiguration for exactly this reason.
:::

::: behind
**Byzantine fault tolerance** raises the difficulty: machines might not merely crash but actively lie, sending contradictory information to different peers.

BFT consensus needs more than two-thirds honest participants, against a simple majority for crash-only failures - which is the price of not trusting the participants.

That's the regime blockchains operate in, and why they're so much more expensive than a Raft cluster doing superficially similar work.
:::`,
  },

  "distributed-transactions-two-phase-commit": {
    concept: `## All Or Nothing, Across Machines

::: story
One database gives you ACID transactions almost for free, because one engine controls all the data and can simply refuse to half-finish.

Now the order lives in one service's database and the inventory in another's. Both must change or neither may.

Nobody is in charge of both.
:::

**Two-phase commit** is the classic protocol for that.

::: timeline The two phases
Phase 1 - voting :: The coordinator sends PREPARE to every participant. Each does the work needed to be *able* to commit - validating, acquiring locks - and votes YES or NO.
Phase 2 - decision :: All voted yes, so the coordinator sends COMMIT to everyone. Any voted no, so it sends ABORT and everyone rolls back.
:::

::: remember
The key property of a YES vote: the participant has promised it *can* commit and must honour that promise later. It holds its locks and waits.

Which is exactly what makes the failure below so bad.
:::

## The Weakness

::: story
The coordinator crashes after collecting all the YES votes and before sending the decision.

Every participant is now stuck. It cannot commit - the coordinator might have decided abort. It cannot abort - the coordinator might have decided commit. It promised to be able to do either, so it must do neither, holding its locks.

And it stays that way until the coordinator returns. Which might be a long time, and everything touching those locked rows is blocked meanwhile.
:::

::: checkpoint
Why can't a participant that voted YES decide for itself after the coordinator disappears?
- ( ) It lacks the permission
- (x) Because other participants may have voted differently - deciding alone risks disagreeing with them and breaking atomicity
- ( ) It doesn't know its own vote
- ( ) It can, after a timeout
> It doesn't know what everyone else voted. Committing when someone else voted no produces exactly the half-finished state the protocol existed to prevent - so blocking is the *correct* behaviour, which is what makes it hard to fix.
:::

::: mistake
2PC is often presented as the solution to distributed transactions. It's the classic one and it is a **blocking** protocol, which is disqualifying for many production systems.

Any answer about 2PC that doesn't mention the blocking window is incomplete, and interviewers ask specifically to see whether it comes up unprompted.
:::

::: behind
**Three-phase commit** adds an intermediate phase so participants can make progress after certain coordinator failures.

It's more complex, and it still has edge cases around network partitions - which is CAP arriving again. Which is why many modern systems abandon this direction entirely for the **Saga** pattern from the System Design subject: a sequence of local transactions with compensating actions, trading atomicity for the ability to never block.
:::`,
  },

  "fault-tolerance-replication": {
    concept: `## Surviving The Failure You Assumed

::: story
Every technique in this subject exists because components fail. Consensus, mutual exclusion, distributed transactions - all of them are machinery for continuing to behave correctly while parts of the system die.

**Fault tolerance** is the goal those techniques serve, and **replication** is the most direct way to get it.
:::

Keep identical copies of data on several machines. One dies, the others serve. No interruption.

::: story
Which immediately raises a question you can't avoid: when a write lands on one replica, how many others must acknowledge it before you call the write successful?

Wait for all of them and a single slow replica stalls every write. Wait for none and a reader hitting a different replica sees stale data.
:::

## Quorums

::: cards With N replicas
W :: The write quorum - how many replicas must acknowledge a write.
R :: The read quorum - how many replicas a read consults.
:::

::: remember
The guarantee: **if W + R > N, a read is certain to see the most recent write.**

The reasoning is counting. Any set of W replicas and any set of R replicas out of N must share at least one member when W + R exceeds N - and that shared replica participated in the write, so the read sees it.

Not a convention. Arithmetic.
:::

::: checkpoint
N = 3, W = 2, R = 2. Does a read always see the latest write?
- (x) Yes - 2 + 2 = 4 > 3, so the quorums must overlap
- ( ) No, only if the same replicas are used
- ( ) Only when no failures occur
- ( ) Impossible to determine
> They must overlap by at least one replica, and that one has the write. This is the most common production configuration precisely because it gives strong consistency while tolerating one replica being down.
:::

::: remember
Tuning W and R is tuning the CAP trade-off, concretely.

High W means strong write consistency and writes that fail when replicas are unavailable. Low W and low R means high availability and reads that may be stale.

The System Design subject called this strong versus eventual consistency. This is the dial.
:::

::: behind
Systems deliberately configured with W + R ≤ N have given up the guarantee on purpose - Cassandra with W=1, R=1 being the common example.

Writes acknowledge after one replica, reads consult one replica, and they may not be the same one. Fast, highly available, and eventually consistent.

Which is a legitimate choice for a view counter and a bad one for a balance - and the same cluster can be configured differently per query, which is the real power of tunable quorums.
:::`,
  },

  "distributed-file-systems": {
    concept: `## Storing More Than One Machine Holds

::: story
A dataset is forty terabytes. No single machine holds it, and buying one that could would be absurd even if it existed.

So the file has to live across many machines while still looking like a file to whatever reads it.
:::

A **distributed file system** does that - and it's this whole subject applied to one problem, with replication for fault tolerance and coordination for consistency.

## The GFS And HDFS Design

::: timeline How a file is stored
Split into blocks :: Fixed size, typically 64-128MB. Deliberately large, so metadata overhead stays tiny relative to data volume.
Replicate each block :: Usually three copies on three machines. Losing any one machine loses no data.
Track it centrally :: A master, or NameNode, records which blocks form which file and which machines hold each replica.
:::

::: remember
That master is the centralised coordinator pattern from the mutual exclusion lesson, with the same single-point-of-failure concern - which real deployments address by replicating the master's own metadata.

Recognising the pattern recurring is the point. The same structural choice, the same weakness, in a different application.
:::

::: checkpoint
Why are blocks 128MB rather than, say, 4KB?
- ( ) Disks can't handle smaller blocks
- (x) Metadata overhead - tracking every block's location for a 40TB file in 4KB units would be an unmanageable index
- ( ) Networks require large transfers
- ( ) It's arbitrary
> Metadata volume. 40TB in 4KB blocks is ten billion entries to track; in 128MB blocks it's around 300,000. The master has to hold that index in memory, which decides the block size.
:::

## Built For One Workload

::: cards What this design assumes
Large files :: Gigabytes upward. A 2KB file wastes an entire block's worth of tracking for almost no data.
Written once, read many :: Appended and then analysed repeatedly. In-place random updates are not what it's for.
Throughput over latency :: Reading a terabyte fast matters; reading one byte quickly does not.
:::

::: mistake
Which is why HDFS is a poor general-purpose filesystem, and it's a real misapplication rather than a theoretical one.

Your laptop has thousands of small, frequently-modified files - the exact opposite profile. Storage systems are designed around an assumed access pattern, and a system used outside its pattern performs badly while appearing to work.
:::

::: behind
Modern object stores like S3 have moved past the single-master design, distributing metadata management too - applying this subject's consensus algorithms so even the index layer is fault-tolerant without one special machine.

Which closes a loop: the centralised coordinator was the simple answer, and consensus is what let systems stop needing it.
:::`,
  },

  "interview-questions": {
    concept: `## Theory, Asked Practically

::: story
Distributed systems interviews at senior level rarely ask you to state a definition.

They ask what happens when a coordinator dies mid-protocol, or why a cluster has five machines rather than four, or how you'd tune a system that needs fast reads and correct writes.

Which are the same topics, approached from the direction they matter.
:::

## The Answer Shape

::: timeline What a strong answer does
State the mechanism :: What the algorithm or property actually is, precisely.
Name the failure mode :: What breaks, and when. This is what distinguishes read-about-it from thought-about-it.
Connect it outward :: To System Design's practical vocabulary. This is the senior-level move.
:::

::: reveal What connecting outward sounds like
Asked about quorum replication, an adequate answer states W + R > N and stops.

A strong one continues:

"So with N=3, W=2, R=2 you get strong consistency and tolerate one replica down. Drop to W=1, R=1 and you've chosen availability and eventual consistency instead.

Which is the CAP trade-off made concrete - it isn't a philosophical choice about the system, it's two integers, configurable per query in something like Cassandra. Same cluster, strong consistency for a payment write, eventual for a view counter."

Same fact. The second version shows you know what it's *for*.
:::

::: cards The four to have cold
Consensus, and Raft over Paxos :: The problem, FLP's impossibility result, and that Raft won on understandability rather than capability.
2PC's blocking weakness :: Both phases, and why a coordinator crash between them leaves participants stuck holding locks.
Quorum math :: W + R > N, why it's arithmetic rather than convention, and what tuning it trades.
Lamport clocks :: The update rule, the happens-before guarantee, and the converse that doesn't hold.
:::

::: checkpoint
Asked why a Raft cluster has five nodes rather than six, what's the answer?
- ( ) Five is faster
- (x) Both tolerate two failures, since both need a majority - so six costs more for no additional fault tolerance
- ( ) Six would be more reliable
- ( ) Raft requires odd numbers
> Majority of six is four, so it survives two failures - identical to five, at greater cost. It's a small question that reliably separates people who've operated a cluster from people who've read about one.
:::

::: mistake
The common failure here isn't ignorance of the algorithms - it's treating them as separate from System Design's material.

Quorum replication *is* the CAP trade-off. The Saga pattern exists *because* of 2PC's blocking. Presenting these as unrelated topics reads as memorisation, and the connections are what the senior-level question is looking for.
:::

::: behind
At the most senior levels, expect questions about combining approaches rather than choosing one.

Raft for a small critical metadata layer, eventually-consistent quorum replication for the bulk data - simultaneously, in one architecture, because the two layers have genuinely different requirements.

Real systems mix techniques per layer. Applying one model uniformly is usually the sign of a design that hasn't been examined closely.
:::`,
  },
};
