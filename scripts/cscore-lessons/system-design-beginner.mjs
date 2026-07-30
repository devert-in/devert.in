// System Design (Beginner) - rewritten lesson bodies. See operating-systems.mjs
// for the authoring rules. The lessons build one architecture cumulatively -
// scale, then distribute, then cache, then split - and each lesson names the
// problem the previous one created, because that chain is the actual subject.

export const SYSTEM_DESIGN_BEGINNER = {
  "scalability": {
    concept: `## Working At 100 Users Proves Nothing

::: story
An app is fast, well-tested, and has no bugs. It serves a hundred users beautifully.

At ten thousand it falls over.

Nothing broke. No line of code became incorrect. The system simply met a load it was never shaped to handle - which is a property of architecture, not code quality.
:::

**Scalability** is the ability to absorb growing load - more users, more data, more requests - without collapsing or becoming unusably slow.

## Two Directions To Grow

::: cards
Vertical - scale up :: Make one machine more powerful. More CPU, more RAM, faster disks. Requires no architectural change at all, which is its whole appeal.
Horizontal - scale out :: Add more machines and spread the load. Needs something to distribute requests and keep machines coordinated - genuinely more complex.
:::

::: story
Vertical scaling has an ending. There is a largest machine that exists, and once you've bought it, there is nowhere left to go for any amount of money.

Horizontal scaling has no such wall. Whether you can afford it, or coordinate it, is a different question - but the ceiling isn't physical.
:::

::: checkpoint
A startup's single server is at 70% CPU and growth is steady. What's usually the right first move?
- ( ) Rewrite as microservices immediately
- (x) Scale vertically - it's simpler, cheaper, and buys real time
- ( ) Add a second server and a load balancer today
- ( ) Shard the database
> Scale up first. Horizontal scaling's complexity is a real cost, and paying it before you need it buys nothing. Google can't scale vertically; a startup at 70% of one machine absolutely can.
:::

::: remember
Which is the honest shape of this subject: every technique here has a genuine cost, and the skill is knowing when a problem is real enough to justify paying it.

Adopting Netflix's architecture at a thousand users is not preparation. It's complexity you have to operate for years before it earns anything.
:::

::: behind
Scaling horizontally creates a problem vertical scaling never had. If a user's session lives in memory on server 3, and their next request lands on server 7, that server has never heard of them.

This is precisely why horizontally-scaled systems favour **stateless**, token-based authentication - covered in this platform's REST APIs subject - rather than server-side sessions tied to one machine. The architecture choice forced the auth choice.
:::`,
  },

  "load-balancer": {
    concept: `## Something Has To Choose

::: story
You now have five servers. A request arrives.

Which one handles it? The client can't reasonably know - and shouldn't have to, since servers come and go.
:::

A **load balancer** sits in front of a group of servers, takes all incoming traffic, and distributes it. Clients know one address; the work spreads across however many machines are behind it.

::: flow
Client -> Load Balancer -> Server 1, Server 2, Server 3
:::

## How It Decides

::: cards
Round robin :: Cycle through servers in order - 1, 2, 3, 1, 2, 3. Simple, and completely blind to how busy each one currently is.
Least connections :: Send each request to whichever server has the fewest active connections. Smarter when requests take genuinely different amounts of time.
:::

::: story
Round robin fails in a specific and unlucky way.

Suppose one request in ten is a heavy report that takes thirty seconds, and the rest finish in milliseconds. Round robin cheerfully hands consecutive heavy requests to the same server while its neighbours idle - because it counts requests, not work.

Least connections notices that server is still busy and routes around it.
:::

::: checkpoint
All requests take almost exactly the same time to process. Which strategy performs better?
- ( ) Least connections, always
- (x) Neither meaningfully - with uniform request cost, round robin is effectively optimal
- ( ) Round robin is always worse
- ( ) Impossible to say
> With uniform work, cycling in order *is* even distribution, and the simpler strategy wins. Least connections earns its keep specifically when request cost varies.
:::

## The Part That Makes It Resilient

**Health checks**: the balancer periodically asks each server whether it's alive, and pulls any failing server out of rotation until it recovers.

::: remember
This is the difference between distributed and *resilient*. Without health checks, a crashed server keeps receiving its share of traffic and failing every request - and one machine in five failing means 20% of users see errors until a human notices.

With them, a crash becomes a non-event. The remaining servers absorb the load and nobody outside gets told.
:::

::: behind
The load balancer is now the thing everything depends on - so if there's only one, you've concentrated every failure into a single component. A crashed balancer takes down all five healthy servers behind it.

Production systems run multiple balancers, with DNS or lower-level networking spreading traffic across them. The general principle worth carrying: **anything that everything depends on needs its own redundancy**, and adding a component to improve reliability can reduce it if you add exactly one.
:::`,
  },

  "caching": {
    concept: `## Most Requests Ask The Same Question

::: story
A product page is viewed forty thousand times an hour. Each view runs the same database query and gets the same answer.

Thirty-nine thousand, nine hundred and ninety-nine of those queries were avoidable.
:::

**Caching** stores the result of an expensive operation so an identical later request is served from the stored copy instead of redoing the work. It's one of the highest-leverage techniques in system design, purely because real traffic repeats itself so heavily.

::: cards
Cache hit :: Already in the cache. Fast and cheap.
Cache miss :: Not there. Run the expensive operation, and usually store the result on the way back so the next request hits.
Hit rate :: The percentage served from cache. This is the number that determines whether the cache was worth adding at all.
:::

::: remember
A cache with a low hit rate is pure cost: you've added a component, a failure mode and a staleness risk, and avoided almost no work.

So the question to ask before caching anything is not "is this expensive?" but "is this expensive *and* requested repeatedly?"
:::

## The Genuinely Hard Part

::: story
Caching is easy. Knowing when a cached value has become a lie is not.

The price changed in the database ten minutes ago. Your cache is confidently serving the old one, and everything looks perfectly healthy.
:::

**Cache invalidation** - deciding when a cached value is stale - is the famously hard problem here.

::: cards Two strategies
Time-based expiration :: The entry expires after N seconds. Simple, and you accept serving stale data for up to that window - or refetching data that hadn't changed.
Explicit invalidation :: Clear the entry the moment its underlying data changes. Precise, and requires every write path to remember to do it - forever, including the one added next year.
:::

::: checkpoint
Product prices change once a day, at a known time. Best strategy?
- ( ) Explicit invalidation on every write
- (x) Time-based expiration, comfortably shorter than a day
- ( ) No caching - prices are too important
- ( ) Cache forever
> Time-based. The data's change rate is known and slow, so expiration gives you correctness within an acceptable window at almost no complexity - and doesn't require every future code path to remember anything.
:::

::: didyouknow
Caches live at several layers of a real system at once: the browser, a CDN, an in-memory store like Redis, and the database's own query cache.

Which means a stale value can be served by any of four things, and "I cleared the cache" is rarely as complete a statement as it sounds.
:::

::: behind
A **cache stampede** (or thundering herd) is the failure mode at expiry: a very popular entry expires, and every concurrent request misses simultaneously and hits the database at once.

The cache was protecting the database. At the instant of expiry it stops, and hands over the full unbuffered load in one spike - which can be worse than never having cached it.

The fix is to let one request recompute while the others briefly wait, rather than having ten thousand independently recompute the same value.
:::`,
  },

  "databases": {
    concept: `## The Choice You Live With Longest

::: story
Most architectural decisions can be revisited. Swapping a load balancer is an afternoon; swapping a database once it holds years of production data is a project with its own budget.

Which makes this the decision worth thinking about hardest and earliest.
:::

## SQL Or NoSQL

::: cards
SQL - relational :: Fixed schema, strong consistency, real transactions. Right when data has clear relationships and correctness is non-negotiable - orders, payments, inventory.
NoSQL :: Document stores, key-value stores, wide-column stores. Trades schema rigidity and some consistency for horizontal scalability and flexibility. Right for feeds, sessions, logs, high-volume semi-structured data.
:::

::: mistake
Choosing NoSQL for its scalability when the data is plainly relational is the common error, and the bill arrives later.

You haven't removed the relationships - they still exist in the domain. You've moved responsibility for enforcing them out of the database and into every piece of application code that touches the data, forever.
:::

## Two Different Ways To Add Servers

::: cards
Replication :: The *same* complete data on several servers. One primary takes writes; read replicas serve reads. Spreads read load, and gives you a machine to promote if the primary dies.
Sharding :: *Different portions* of the data on each server, split by some key. Users A-M here, N-Z there. Scales total data volume and write throughput past one machine.
:::

::: checkpoint
Reads outnumber writes 50 to 1 and the database is straining. Replication or sharding?
- (x) Replication - add read replicas to spread the read load
- ( ) Sharding - split the data across servers
- ( ) Neither; scale the database vertically forever
- ( ) Both immediately
> Replication. The bottleneck is read volume, and replicas address exactly that with far less complexity than sharding. Sharding is for when *writes* or total data size exceed one machine.
:::

::: remember
The distinction, since interviewers probe it: **replication copies, sharding divides.**

Replication gives you the same data in more places. Sharding gives you less data in each place. They solve different problems and large systems often use both.
:::

::: mistake
Sharding's real cost shows up in queries that span shards. A query answerable from one shard is fast; one needing data from all of them has to fan out, wait for every shard, and combine results.

Which means the shard key isn't a technical detail - it determines which queries stay cheap for the life of the system.
:::

::: behind
Replication forces a consistency decision. **Synchronous** replication waits for replicas to confirm before acknowledging a write - safer, slower. **Asynchronous** acknowledges immediately and replicates in the background - faster, and a replica can briefly serve stale data, or lose a very recent write if the primary dies before replicating it.

That's a concrete instance of the consistency-versus-availability tension this subject's last two lessons are about.
:::`,
  },

  "queues": {
    concept: `## Don't Make Them Wait

::: story
A user uploads a video. It needs transcoding into four resolutions, which takes six minutes.

The browser cannot sit spinning for six minutes. And the request cannot honestly return "done" when nothing has been done.
:::

A **message queue** lets one part of the system hand off work as a message, without waiting for it to be processed. A **producer** puts messages in; a **consumer** takes them out and processes them whenever it's ready.

## How The Upload Should Actually Work

::: timeline The upload, done properly
Upload arrives :: The API receives the file and stores it.
Message enqueued :: "Transcode video 42" goes onto the queue.
Response returns immediately :: "Upload received, processing." Under a second.
A consumer picks it up :: Independently, in the background, at its own pace.
Status updated :: The video is marked ready when transcoding finishes, minutes later.
:::

::: remember
The queue's real product is **decoupling**. The producer doesn't need to know how long the work takes, how many consumers exist, or whether any are running right now.

Which also means the producer can accept work faster than it can be processed - the backlog is visible in the queue instead of appearing as timeouts.
:::

::: checkpoint
The consumer service crashes for twenty minutes. What happens to work submitted during that window?
- ( ) It's rejected - users see errors
- (x) Messages wait in the queue and get processed when the consumer recovers
- ( ) It's lost
- ( ) The producer blocks until the consumer returns
> They wait. From the user's side nothing failed - their upload was accepted and processed, just later than usual. That absorption is a large part of why queues are worth the extra moving part.
:::

::: cards What decoupling buys
Resilience :: A consumer crash delays work instead of losing it.
Independent scaling :: Add consumers to drain a backlog faster, with no change to producers.
Load smoothing :: A traffic spike becomes a longer queue rather than a failed request.
:::

::: mistake
Expecting a queue to make things *fast* misreads what it does. The transcoding still takes six minutes. What changed is that nobody is waiting for it - the latency moved out of the user's request, it didn't disappear.
:::

::: behind
Most queues guarantee **at-least-once** delivery: if a consumer crashes halfway through, the message is redelivered and may be processed twice.

Which means consumer logic must be **idempotent** - processing the same message twice produces the same result, with no duplicate side effect. Sending a confirmation email twice is annoying; charging a card twice is a genuine incident. This is a design requirement of queue-based systems, not an edge case to handle later.
:::`,
  },

  "microservices": {
    concept: `## One Application, Or Many

::: story
A monolith holds everything - users, orders, payments, inventory - in one codebase, deployed as one unit.

A one-line change to the payment logic means redeploying all of it. And a memory leak in report generation can take down checkout, because they share a process.
:::

**Microservices** split that into independent, separately deployable services, each with its own codebase and often its own database, talking over the network.

::: cards What that buys
Independent deployment :: Update PaymentService without redeploying anything else. Smaller releases, smaller blast radius, faster cadence.
Independent scaling :: If OrderService needs ten times the capacity during a sale and UserService doesn't, scale only OrderService.
Technology freedom :: Each service can use the language and datastore that suits it, rather than one stack for everything.
:::

## What It Costs

::: cards The bill
Network calls replace function calls :: An in-process call cannot time out, arrive twice, or half-succeed. A network call can do all three, and every caller must now handle that.
Debugging spans services :: One user request touches five services with five sets of logs. "Where did this slow down?" stops being answerable from one place.
Transactions are gone :: Updating orders and inventory together was one atomic database transaction. Across two services with two databases, that guarantee no longer exists.
:::

::: checkpoint
A three-person startup is building its first product. Monolith or microservices?
- ( ) Microservices - it's the modern standard
- (x) Monolith - none of microservices' benefits apply yet, and all the costs do
- ( ) Microservices, to avoid rewriting later
- ( ) Either; the choice is stylistic
> A monolith. Independent deployment matters when teams block each other; independent scaling matters when services have genuinely different load. With three people and no users, you'd be paying distributed-systems complexity for benefits that don't exist yet.
:::

::: remember
Microservices solve *organisational* problems as much as technical ones. Their clearest benefit is letting many teams ship without coordinating - which is why they show up at companies with many teams.

A small team doesn't have that problem, and adopting the solution anyway means operating the overhead without receiving the payoff.
:::

::: mistake
Answering an interview question about microservices with only their benefits reads as inexperience, because everyone who has operated them has felt the costs.

An honest answer naming both trade-offs is stronger than an enthusiastic one - here, specifically, balance is the signal.
:::

::: behind
The **Saga** pattern addresses the lost-transaction problem. Instead of one atomic transaction, an operation becomes a sequence of local transactions, each with a **compensating action** that undoes it if a later step fails.

Payment succeeds, inventory reservation fails, so the payment is refunded. It works, and notice what it isn't: a refund is not a rollback. The money moved and moved back, and both events are visible. You've traded a guarantee for a procedure.
:::`,
  },

  "api-gateway": {
    concept: `## One Front Door

::: story
Microservices created a problem for clients. There are now nine services, and a mobile app that needs to know nine addresses - which change as services are added, moved, or split.

Every client becomes coupled to your internal architecture.
:::

An **API Gateway** is a single entry point in front of the whole architecture. Clients know one address; the gateway routes each request to whichever service handles it.

::: flow
Client -> API Gateway -> UserService, OrderService, PaymentService
:::

## The Other Half Of Its Job

::: story
Nine services each need to authenticate callers. Written nine times, in nine codebases, with nine opportunities to get it subtly wrong - and one to forget entirely.
:::

::: cards Cross-cutting concerns worth centralising
Authentication :: Verify the caller once, at the edge. Downstream services can trust what reaches them.
Rate limiting :: Cap requests per client in one place, protecting every service behind it uniformly.
Logging and monitoring :: One vantage point over all traffic, instead of reassembling a picture from nine log streams.
:::

::: checkpoint
Why centralise authentication at the gateway rather than in each service?
- ( ) It's faster
- (x) Nine implementations mean nine chances to get it wrong, and the ninth is the one that gets forgotten
- ( ) Services can't perform authentication
- ( ) It removes the need for authentication
> Consistency, and the failure mode that follows from duplication. A security control implemented nine times is really nine controls, and they will drift.
:::

::: remember
The gateway pattern pairs with microservices so naturally because it addresses two of their costs at once: client coupling to internal structure, and duplicated cross-cutting logic.

One component, two of the previous lesson's problems reduced.
:::

::: mistake
Centralising authentication doesn't mean services should trust anything that arrives unconditionally. If a service is reachable by anything other than the gateway, "the gateway already checked" is an assumption an attacker can invalidate.

Defence in depth applies here exactly as it does in the security subjects: the gateway is a layer, not a perimeter you can stop thinking behind.
:::

::: behind
Some gateways also perform **request aggregation** - calling several services and combining results into one response, so a dashboard needing profile and order data makes one request rather than three.

Useful on mobile, where round trips are expensive. Also a warning sign: a gateway accumulating enough business logic to know which services combine for which screen is quietly becoming a service of its own, and one everything depends on.
:::`,
  },

  "cdn": {
    concept: `## Distance Is Latency

::: story
A user in Chennai loads an image hosted in Virginia.

The request crosses an ocean, and the response crosses back. Nothing is misconfigured and nothing is slow - the data is simply travelling a very long way, at a speed physics caps.
:::

A **CDN** - Content Delivery Network - is caching applied geographically: servers in many locations worldwide, each holding cached copies of static content, so users are served from whichever is nearest.

::: flow
Without CDN: user in India -> origin server in USA
:::

::: flow
With CDN: user in India -> nearby edge server in India
:::

::: didyouknow
The floor here is physical. Light in fibre travels roughly 200,000 km per second, so a round trip between India and the US east coast costs something like 200ms before any server does any work.

No amount of optimisation removes that. Only moving the content closer does - which is the entire idea.
:::

## What Belongs On It

::: cards
Well suited :: Static content identical for everyone. Images, CSS, JavaScript bundles, fonts, public video.
Not suited :: Dynamic, personalised content. Your account balance, your inbox, your feed. There's nothing shareable to cache.
:::

::: checkpoint
Which of these should a CDN serve?
- ( ) A user's personal order history
- (x) The site's logo and stylesheet
- ( ) A live account balance
- ( ) A private message thread
> The static assets every visitor requests identically. Personalised content has a cache hit rate of one per user, which is the same as no cache plus extra machinery - and a real risk of serving one user's data to another.
:::

::: remember
So a real application uses both: a CDN for static assets, and its own origin servers - behind the load balancer and gateway from earlier lessons - for dynamic personalised data.

Which is why the architecture accumulates rather than replaces. Each lesson here added a component; none of them removed one.
:::

::: behind
**Edge computing** extends the idea from serving cached files to running actual logic at those same distributed locations.

Personalisation, authentication checks, request rewriting - happening physically near the user instead of requiring a round trip to origin. It's the same "move the work closer" instinct, applied to computation rather than storage, and it blurs the static/dynamic line this lesson draws.
:::`,
  },

  "consistency": {
    concept: `## When Does Everyone Else Find Out?

::: story
Data now lives in several places - replicas, shards, CDN caches. A write lands on one of them.

The other copies don't know yet. So a read arriving somewhere else, milliseconds later, has a choice to make about what to say.
:::

## Two Answers

::: cards
Strong consistency :: Every read, from anywhere, immediately reflects the latest write. Simple to reason about, and requires coordination between machines that costs latency and availability.
Eventual consistency :: Copies converge given enough time. A read shortly after a write might return stale data for a brief window. Cheaper and faster, and sometimes wrong for a moment.
:::

::: story
Whether that brief wrongness matters depends entirely on the data.

A like count showing 1,203 instead of 1,204 for two hundred milliseconds is invisible. Nobody has ever noticed, and no harm exists to measure.

A bank balance showing two different numbers to two readers is not a cosmetic issue.
:::

::: checkpoint
Classify these: creator payout balance, post like count, "last seen online", direct message content.
- ( ) All need strong consistency
- (x) Payout balance and message content need strong; like count and last-seen can be eventual
- ( ) All can be eventual
- ( ) Only the like count needs strong consistency
> Money and messages need to be right immediately. A stale like count or last-seen timestamp costs nothing - and a message that briefly doesn't appear is a bug report, which is why it belongs on the strong side.
:::

::: remember
The skill here is that this is decided **per feature**, not once per system.

Picking one model for an entire application means either paying coordination cost on like counts, or accepting staleness on payouts. Real large systems deliberately run both, and know which data is which.
:::

::: mistake
Eventual consistency is not "consistency we didn't get round to". It's a deliberate exchange: some correctness window, for real gains in latency and availability.

Made knowingly on data that tolerates it, it's good engineering. Made by accident on a balance, it's a defect with a respectable name.
:::

::: behind
This connects directly to the next and final lesson. Strong consistency during a network partition generally means refusing requests rather than risking a wrong answer - sacrificing availability. Eventual consistency means staying available and accepting temporary disagreement.

This lesson is the practical, feature-by-feature version of the formal trade-off the CAP Theorem describes.
:::`,
  },

  "cap-theorem": {
    concept: `## Pick Two, And You Don't Really Get Three Options

::: story
The CAP Theorem is usually taught as "choose two of three", which makes it sound like a menu.

It isn't, and understanding why is the whole point of the lesson.
:::

::: cards The three properties
Consistency :: Every read reflects the most recent write.
Availability :: Every request receives a response, even if it can't be guaranteed current.
Partition tolerance :: The system keeps working when a network failure splits it into groups that cannot talk to each other.
:::

## Why It's Really Only Two Options

::: story
Network partitions are not a design choice. Cables fail, switches die, data centres lose connectivity. Give any distributed system enough time and it will be partitioned.

So partition tolerance isn't something you select. It's a condition you're already in.

Which means the real question is what happens *when* the split occurs - and the answer has exactly two branches.
:::

::: cards The choice you actually face
CP - choose consistency :: Refuse some requests during the partition rather than risk returning stale or conflicting data. The system is correct and partly unavailable.
AP - choose availability :: Keep serving from both sides, accepting that they may disagree until the partition heals. The system is up and temporarily inconsistent.
:::

::: checkpoint
A network partition splits your cluster. A write arrives on one side. Under CP, what happens?
- ( ) It's accepted and reconciled later
- (x) It's refused, because the other side can't confirm and consistency can't be guaranteed
- ( ) It's accepted on both sides simultaneously
- ( ) The system shuts down entirely
> Refused. CP means correctness wins over answering - and note it's *some* requests, not a shutdown. Reads that can still be served safely often continue.
:::

::: remember
Different systems choose differently, and both choices are correct in context.

A payment system leans **CP** - briefly refusing a transfer is far better than two conflicting balances. A social feed leans **AP** - showing slightly stale posts beats showing an error page.

Naming which side a system should sit on, and why, is what a system design interview is actually asking for here.
:::

::: mistake
Reciting the three letters without the partition-is-unavoidable insight is the answer that sounds prepared and isn't.

"You can only have two of three" invites a follow-up about which two you'd drop, and the honest answer is that one of them was never on offer.
:::

::: behind
**PACELC** extends CAP, and some of CAP's own popularisers have called the original framing an oversimplification.

Its addition: even with no partition happening, a system still trades **latency** against **consistency** - waiting for replicas to agree costs milliseconds on every single request, partition or not.

Which is closer to how production systems actually behave. CAP describes the rare crisis; PACELC also describes the ordinary Tuesday.
:::`,
  },
};
