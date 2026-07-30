// Cloud Fundamentals - rewritten lesson bodies. See operating-systems.mjs for
// the authoring rules. The three provider lessons (AWS/Azure/GCP) are mostly
// name-mapping, so they lean on cards and stay short rather than being padded
// to match the others - a lesson whose real content is a lookup table should
// read like one.

export const CLOUD_FUNDAMENTALS = {
  "cloud-computing": {
    concept: `## The Guess You Used To Have To Make

::: story
Before cloud computing, launching a website meant buying servers.

Which meant guessing, months ahead, how much traffic you'd get. Guess low and the site falls over on your best day. Guess high and you've bought hardware that sits idle, depreciating, having been paid for in full up front.

There was no third option. Capacity was a purchase, not a dial.
:::

**Cloud computing** is renting computing resources on demand and paying for what you use - closer to an electricity bill than to building a power station.

## Three Levels Of How Much You Manage

::: cards From most control to least
IaaS :: Raw virtual machines, storage, networking. You handle the OS, the runtime, everything above. An empty apartment you furnish yourself.
PaaS :: The provider manages the OS and runtime; you deploy code. A furnished apartment.
SaaS :: A finished application you just use. A hotel room.
:::

::: cards Real examples
IaaS :: AWS EC2, Azure Virtual Machines
PaaS :: Heroku, Google App Engine
SaaS :: Gmail, Salesforce
:::

::: checkpoint
You deploy code and never touch an operating system, but you did write the application. Which model?
- ( ) IaaS
- (x) PaaS
- ( ) SaaS
- ( ) None of these
> PaaS. IaaS would mean managing the OS yourself; SaaS would mean not writing the application at all.
:::

## The Actual Advantage

::: remember
**Elasticity** is the thing physical hardware cannot do at any price: scale up during a spike, back down afterward, and pay only for what was consumed at each moment.

Not "it's cheaper" - it often isn't, at steady high load. The advantage is that capacity stops being a guess you commit to in advance.
:::

::: didyouknow
A flash sale needing forty times normal capacity for two hours is a genuinely hard problem to own hardware for. You'd buy forty times the servers and use them for two hours a year.

On a cloud provider it's a configuration change and a slightly larger bill that month. That specific shape of problem is what the model was built for.
:::

::: behind
**Serverless** - the last lesson in this subject - pushes further along the same spectrum. You don't manage servers, and you don't think about capacity at all: individual functions scale per invocation.

Worth seeing as another point on this control-versus-convenience line rather than a separate idea.
:::`,
  },

  "aws-basics": {
    concept: `## Four Services Cover Most Of It

::: story
AWS has hundreds of services, and a newcomer's reasonable reaction to the console is that this is unlearnable.

It isn't, because the distribution is heavily skewed. A large share of real AWS usage is four services in combination.
:::

## The Four

::: cards The four worth knowing first
EC2 :: Elastic Compute Cloud. Rentable virtual machines - the classic IaaS building block.
S3 :: Simple Storage Service. Object storage for files: images, backups, static assets.
RDS :: Relational Database Service. A managed PostgreSQL or MySQL, with AWS handling backups, patching and replication.
Lambda :: Serverless compute. Run a function on demand, with no server to manage.
:::

::: checkpoint
Your app lets users upload profile photos and stores their account details. Which two services?
- ( ) EC2 for both
- (x) S3 for the photos, RDS for the account details
- ( ) RDS for both
- ( ) Lambda for both
> Object storage for files, a relational database for structured records. Putting images into a database column is possible and something you regret at scale.
:::

::: mistake
S3 and RDS get conflated because both are "where data goes". They solve different problems: S3 stores blobs you retrieve whole, RDS stores rows you query and join.

The tell is whether you ever need to ask a question *about* the data. If yes, it's a database.
:::

::: remember
The concepts transfer between providers even though names don't. Learning EC2 properly means understanding rented virtual machines - which is Azure VMs and GCP Compute Engine too, under different labels.

Which is what the next two lessons are about.
:::

::: behind
AWS pricing follows the elasticity model directly: EC2 by the second or hour of runtime, S3 by gigabyte stored plus transfer, Lambda by invocation and execution time.

Which means your application's *usage pattern* is a cost decision, not only an architectural one - an idle EC2 instance bills identically to a busy one, and that's frequently where a surprising bill comes from.
:::`,
  },

  "azure-basics": {
    concept: `## The Same Ideas, Microsoft's Names

::: story
Azure is the second-largest provider, and its distinctive strength isn't a technical capability AWS lacks.

It's integration. A company already running Windows Server, Active Directory and .NET finds that Azure fits its existing identity, tooling and licensing without a translation layer.
:::

That's usually the actual reason enterprises choose it - continuity with what they already operate, not a feature comparison.

## The Mapping

::: cards Azure to AWS, directly
Azure Virtual Machines :: AWS EC2
Azure Blob Storage :: AWS S3
Azure SQL Database :: AWS RDS
Azure Functions :: AWS Lambda
:::

::: checkpoint
You know AWS well and join a company running on Azure. Roughly what do you have to learn?
- ( ) A completely different model of cloud computing
- (x) Mostly new names and console layouts for concepts you already understand
- ( ) Nothing - the two are identical
- ( ) Only the billing differences
> Names, tooling and some genuine behavioural differences - but the mental model transfers. "Nothing" overstates it; the concepts are shared and the details aren't.
:::

::: remember
This is the useful takeaway of the provider lessons. IaaS/PaaS/SaaS, virtual machines, object storage, managed databases, serverless functions - the vocabulary is provider-specific and the concepts are not.

Which is also why interviewers ask you to map services across providers: it separates understanding cloud from having memorised one console.
:::

::: behind
Some organisations deliberately run **multi-cloud** - workloads across more than one provider, or at minimum the ability to move.

The motivation is avoiding lock-in and improving negotiating position. The cost is real: provider-specific configuration, tooling and quirks all have to be managed twice, even where the concepts are identical. Frequently more expensive than the lock-in it avoids.
:::`,
  },

  "gcp-basics": {
    concept: `## Strong Where Google Was Strong

::: story
GCP is third by market share, and its strengths track Google's own history rather closely.

Data analytics and machine learning - because Google spent two decades solving those problems for Search and YouTube before selling anything. MapReduce, which shaped the entire big-data ecosystem, came out of that work years before GCP existed as a product.
:::

::: cards GCP to the others
Compute Engine :: EC2 / Azure VMs
Cloud Storage :: S3 / Blob Storage
Cloud SQL :: RDS / Azure SQL Database
Cloud Functions :: Lambda / Azure Functions
:::

## The Kubernetes Connection

::: story
Kubernetes was created at Google, based on their internal cluster manager Borg, and then open-sourced.

Which is why **GKE** - Google Kubernetes Engine - has the reputation it does. GCP didn't adopt Kubernetes; Kubernetes came from there.
:::

::: checkpoint
Why does GCP have a particular reputation for Kubernetes specifically?
- ( ) It's the only provider offering managed Kubernetes
- (x) Kubernetes originated at Google, from their internal Borg system
- ( ) Kubernetes only runs on GCP
- ( ) It's marketing rather than substance
> Origin. All three major providers offer managed Kubernetes now - GCP's advantage is having built the thing, and having run its own infrastructure this way long before it was a product.
:::

::: didyouknow
**BigQuery** is the clearest single example of the data strength: a serverless warehouse that runs SQL across enormous datasets with no infrastructure to provision at all.

You write a query against terabytes and it returns. There's nothing to size, and that's the part that's hard to build.
:::

::: remember
Three lessons, one point: providers differentiate on ecosystem, history and specific strengths - not on whether they can rent you a virtual machine.

Choose on which strengths matter for your workload, and on which ecosystem you're already in.
:::`,
  },

  "virtual-machines": {
    concept: `## Many Computers, One Machine

::: story
A cloud provider rents you "a server". They do not walk into a data centre and assign you a physical box.

One physical machine is running dozens of separate customers' servers, each convinced it has hardware to itself. The technology making that possible is what makes cloud computing economically possible at all.
:::

**Virtualization** runs multiple isolated virtual computers - each with its own operating system - on one physical machine.

## The Hypervisor

The software layer between physical hardware and each VM, allocating and isolating CPU, memory and storage, while letting each guest OS believe it has exclusive hardware.

::: cards Two types
Type 1 - bare metal :: Runs directly on the hardware. What data centres and cloud providers use, for performance and isolation.
Type 2 - hosted :: Runs as an application on an existing OS. VirtualBox on your laptop. Convenient for local testing, with more overhead.
:::

::: checkpoint
You rent a cloud VM. Is the hardware yours alone?
- ( ) Yes, that's what renting a server means
- (x) No - you share physical hardware with other customers, isolated by the hypervisor
- ( ) Only on the largest instance types
- ( ) It depends on the operating system
> Shared, and isolated in software rather than by physical separation. Providers do offer dedicated hardware at a premium, precisely because the default isn't.
:::

::: remember
The isolation is enforced, not conventional. A VM genuinely cannot read another VM's memory - the hypervisor doesn't map it.

Which is what makes renting a fraction of a machine to a stranger a viable business.
:::

::: behind
VMs carry real overhead: each one boots a complete operating system kernel, consuming memory and startup time before your application runs at all.

Ten VMs means ten kernels doing largely identical work. That specific waste is what **containers** - the next lesson - exist to remove.
:::`,
  },

  "containers": {
    concept: `## Sharing The Kernel

::: story
A VM's overhead is a whole operating system per instance. Ten VMs, ten kernels, ten boot sequences, ten copies of essentially the same thing.

A container asks a sharper question: if the host already has a working kernel, why does each isolated application need its own?
:::

A **container** packages an application with its dependencies, and **shares the host's kernel** rather than carrying one.

## Side By Side

::: cards The structural difference
Virtual machine :: App + dependencies + a complete guest OS kernel, on a hypervisor. Minutes to boot, hundreds of megabytes upward, strong isolation.
Container :: App + dependencies, using the host's kernel via a container runtime. Seconds or less to start, tens of megabytes, somewhat weaker isolation.
:::

::: story
The apartment analogy is more accurate here than it usually is.

VMs are separate buildings, each with its own foundation. Containers are apartments in one building - genuinely private, and sharing plumbing and structure.

Which is cheaper and denser, and means a problem in the foundation affects everyone.
:::

::: checkpoint
Why does a container start in under a second when a VM takes a minute?
- ( ) Containers are smaller files
- (x) There's no kernel to boot - the host's is already running, so only the application starts
- ( ) Containers skip security checks
- ( ) They're pre-warmed by the provider
> No boot sequence. Almost all of a VM's startup time is operating system initialisation, and a container simply doesn't do it.
:::

::: mistake
Describing a container as "a lightweight VM" gets you through casual conversation and fails the follow-up question, which is always about the mechanism.

The distinction that matters: **a VM virtualises hardware; a container isolates processes.** Different layer, different guarantees.
:::

::: remember
The trade-off is real and usually acceptable. Shared kernel means a kernel-level vulnerability can potentially cross container boundaries in a way it couldn't cross a VM boundary.

Which is why untrusted multi-tenant workloads still often get VMs, and why your own microservices get containers.
:::

::: behind
Two Linux kernel features do the actual work.

**Namespaces** control what a process can see - its own filesystem view, process list, network interfaces - despite sharing one kernel. **cgroups** limit what it can consume: CPU, memory, disk I/O.

Docker, next lesson, is a well-designed interface over these primitives rather than a technology of its own.
:::`,
  },

  "docker": {
    concept: `## What Made Containers Usable

::: story
Namespaces and cgroups existed for years before Docker, and almost nobody used them directly - they were kernel features with no convenient way in.

Docker, in 2013, added three things: a simple CLI, a standard image format, and a public registry to share prebuilt images. The underlying capability didn't change. Access to it did.
:::

## Image Versus Container

::: cards The pair people mix up
Image :: A read-only packaged template - your code plus dependencies, frozen into a distributable artifact. A **class**.
Container :: A running instance created from an image. An **object**.
:::

::: remember
That's the OOP analogy exactly, and it holds all the way: many independent containers from one image, just as many objects from one class.

\`docker build\` produces an image. \`docker run\` instantiates one.
:::

::: checkpoint
You run the same image three times. What exists?
- ( ) Three images
- (x) One image and three independent containers
- ( ) One container serving three requests
- ( ) Three images sharing one container
> One template, three instances - each with its own filesystem changes and process state, all from the same unchanged image.
:::

## The Dockerfile

A plain-text recipe for building an image:

  FROM node:18
  COPY . /app
  WORKDIR /app
  RUN npm install
  CMD ["node", "server.js"]

::: remember
This file is what kills "works on my machine".

The entire runtime environment - base OS, language version, dependencies, start command - is captured in a version-controlled text file. Anyone who builds it gets the same image, including the CI server and the person who joins in a year.

The environment stopped being something you set up and became something you can diff.
:::

::: behind
Images build in **layers**, one per instruction, and Docker caches unchanged layers between builds.

Which makes instruction order a performance decision. Put dependency installation *before* copying your application code, and editing one source file reuses the cached \`npm install\` layer. Reverse them and every build reinstalls everything - the same Dockerfile, minutes slower on every single build.
:::`,
  },

  "kubernetes": {
    concept: `## Beyond One Container At A Time

::: story
\`docker run\` starts a container. Production needs forty of them, across a dozen machines, restarted when they crash, load-balanced across replicas, scaled with demand, and updated without downtime.

Doing that by hand is not a smaller version of the same job. It's a different job.
:::

**Kubernetes** - created at Google, open-sourced - is container orchestration: automating deployment, scaling and management across a cluster.

## Declare What You Want

::: story
The important idea isn't the vocabulary, it's the model.

You don't write "if a container crashes, restart it". You declare "three replicas of this should be running", and a control loop continuously compares actual state to that declaration and corrects any difference.

Kubernetes is closer to a thermostat than a script.
:::

::: cards Three building blocks
Pod :: The smallest deployable unit - usually one container, sometimes a tightly-coupled group that must run together.
Deployment :: Manages a set of identical Pod replicas. Handles rolling updates and replaces Pods that die.
Service :: A stable network address for reaching a Deployment's Pods, unchanged as individual Pods are created and destroyed beneath it.
:::

::: checkpoint
One Pod in a 3-replica Deployment crashes at 3am. What happens?
- ( ) The Deployment drops to 2 until someone intervenes
- (x) The controller notices actual state doesn't match desired state and starts a replacement automatically
- ( ) All three Pods restart
- ( ) The Service returns errors until morning
> A replacement starts, and the Service stops routing to the dead Pod meanwhile. Nobody is paged - which is the entire value proposition.
:::

::: remember
Why a **Service** exists is worth being clear about: Pods are disposable and their addresses change constantly.

Anything that needed to reach "the app" by chasing individual Pod addresses would break continuously. The Service is a stable name in front of a deliberately unstable set.
:::

::: mistake
Adopting Kubernetes for a small application is a common and expensive error.

It's built for the problem of many containers across many machines. With three containers on one machine, you inherit the operational complexity - cluster upgrades, networking, RBAC, YAML - and none of the benefit.
:::

::: behind
The reconciliation is implemented as many independent **controllers**, one per resource type, each running the same watch-compare-correct loop.

That control-loop pattern isn't unique to Kubernetes - it recurs anywhere a distributed system has to self-heal toward a target state. Recognising it makes a lot of infrastructure design look familiar.
:::`,
  },

  "serverless": {
    concept: `## A Misleading Name

::: story
Servers still exist. They run your code, in a data centre, on hardware.

What's absent is *your* involvement with them: no provisioning, no patching, no capacity planning, no thinking about how many there should be.

"Serverless" describes your responsibilities, not the architecture.
:::

You write a **function**; the provider runs it on a trigger - an HTTP request, a file upload, a timer - and scales concurrent executions with demand.

## Billing Taken To Its Limit

::: cards
Traditional server :: Always running, always billed. Whether it handled a thousand requests this hour or none.
Serverless function :: Billed per invocation and execution time. Nothing calling it means nothing to pay.
:::

::: checkpoint
A function runs 200 times a day, taking 300ms each. Roughly what are you billed for?
- ( ) A full day of server time
- (x) About 60 seconds of execution, plus 200 invocations
- ( ) A monthly minimum regardless of use
- ( ) Nothing - serverless is free
> A minute of compute. Which is why event-driven and infrequent workloads are where this model wins outright against an always-on instance.
:::

## The Two Trade-offs

::: cards
Cold starts :: If a function hasn't run recently, the provider must initialise a fresh execution environment first - real, noticeable latency on that request. Subsequent calls hit a warm environment and are fast.
Vendor lock-in :: Each provider's triggers, configuration and runtime conventions differ. A containerised app moves between providers far more easily than a set of Lambda functions does.
:::

::: mistake
Cold starts are the trade-off people discover in production rather than in planning.

A function invoked constantly rarely cold-starts. One invoked a few times an hour cold-starts most times it's called - so the workload with the best cost profile for serverless often has the worst latency profile, which is an uncomfortable pairing if the endpoint is user-facing.
:::

::: remember
Serverless suits event-driven work that doesn't need to be always-on: processing an upload, handling a webhook, a nightly job.

It suits a latency-sensitive, constantly-busy API considerably less well - at which point you're provisioning warm capacity and have arrived back at a server with extra steps.
:::

::: behind
**Provisioned concurrency** keeps a set number of environments pre-warmed, removing cold starts for latency-sensitive functions.

And you pay for that capacity continuously, whether or not it's used - which is to say, the fix for serverless's main drawback is to make it slightly less serverless. A clean example of a trade-off that can be moved but not removed.
:::`,
  },
};
