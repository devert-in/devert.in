// Module 1 - The Internet.
//
// Follows the authoring rules documented at the top of welcome.mjs.
//
// MODULE FRAME: this is the module people skip because it has no code, and it is
// the one everything after it depends on. Every lesson here should leave the
// learner able to answer a "why" question, not recite an acronym expansion.

export const THE_INTERNET = {

  "what-is-the-internet-physically": {
    subtitle: "Not a cloud. Cables.",
    difficulty: "Beginner",
    estimatedMinutes: 15,
    learningObjectives: [
      "Describe what the internet physically consists of",
      "Explain why 'the cloud' is a misleading name for a real building",
      "Reason about why physical distance still sets a floor on latency",
    ],
    prerequisites: [],
    story: `In 2011, a 75-year-old woman in Georgia was digging for scrap metal. Her spade went through a fibre-optic cable.

Armenia lost the internet. The entire country, for about twelve hours.

That story is worth holding onto, because it contradicts the mental model almost everyone starts with. "The cloud" sounds like something ambient and everywhere, resistant by nature. It is not. It is cables, and one of them was shallow enough for a pensioner with a spade to reach.

The internet is a physical object. Reasoning about it correctly starts with taking that literally.`,
    problemStatement: `Most beginners hold a model in which data goes "up" to the internet and comes back down. It is a comfortable picture and it makes several important things impossible to reason about.

If your model is a cloud, you cannot explain why a server in Mumbai answers faster than one in Virginia, why a video call to the next city is crisp and one across an ocean is not, or why any of the engineering effort around caching and content delivery exists at all.

Replace the cloud with cables and buildings, and all of those become obvious.`,
    concept: `## What is actually there

::: cards The physical internet
Cables :: The overwhelming majority of intercontinental traffic travels through fibre-optic cables on the seabed - roughly 500 of them, each about as thick as a garden hose. Not satellites. Cables.
Data centres :: Warehouses of computers with extraordinary power and cooling requirements. "The cloud" is a rental agreement for space in one of these.
Routers :: Specialised computers whose whole job is receiving data and deciding which cable to send it down next.
Exchange points :: Buildings where different networks physically interconnect and hand traffic to each other. There are a few hundred that matter.
Last mile :: The unglamorous bit from your building to your ISP - copper, fibre, or radio to a nearby tower.
:::

## The path your data actually takes

::: flow
Your device -> home router -> ISP -> exchange point -> undersea cable -> another ISP -> data centre -> the server
:::

Every arrow is a real physical hop with a real cost in time. That is the whole reason latency exists as an engineering concern.

## Why distance sets a floor

Light in fibre travels at roughly 200,000 km per second - about two-thirds of its speed in vacuum, because glass slows it.

Mumbai to London is about 7,200 km. So:

  7,200 km / 200,000 km/s = 36 ms one way
  round trip                = 72 ms minimum

That number is not an implementation detail you can optimise away. **It is physics.** No amount of faster code changes it. Real measurements come out higher - around 110ms - because the cable does not run straight and every router adds a little.

::: remember
This is why "just put it on a faster server" does not fix a slow app for users on another continent. The fix is to move the data closer, which is what a CDN is for.
:::

::: checkpoint
Your API is hosted in Virginia. Users in Singapore complain it feels sluggish, though your server responds in 20ms. What is the most likely dominant cost?
- ( ) The server is too slow
- ( ) The database query needs an index
- (x) Round-trip network latency across the Pacific, which no server-side optimisation removes
- ( ) Their internet connection is bad
> Singapore to Virginia is roughly 15,000 km of cable, so a round trip has a hard floor near 150ms before your server does anything at all. The answer is to serve those users from somewhere nearer, not to make the handler faster.
:::

## Why it survives most damage

The internet's defining design decision was to have no centre. There is no master computer; there are many networks that agree on how to pass traffic, and routers continuously recalculate paths.

So a severed cable usually causes congestion and re-routing rather than an outage. Armenia went dark because it had very few independent paths - not because the design failed, but because redundancy is something you have to actually buy.

::: didyouknow
The word "internet" is short for *internetwork* - a network of networks. That is the literal architecture: there is no single network, only a shared agreement about how independent ones interconnect.
:::`,
    commonMistakes: [
      "Believing intercontinental traffic mostly goes via satellite - it is overwhelmingly undersea cable, because cable is faster and much higher capacity",
      "Thinking 'the cloud' means something other than 'a computer in a building someone else maintains'",
      "Trying to optimise away latency that is set by the speed of light in glass",
      "Assuming a fast server means a fast experience, independent of where the user is",
      "Picturing one central internet backbone rather than many interconnecting networks",
    ],
    industryPerspective: `Cable ownership has shifted markedly. Undersea cables used to be laid by telecom consortia; a large share of new capacity is now funded by Google, Meta, Amazon and Microsoft, because at their traffic volumes owning the cable is cheaper than renting it.

The practical consequence for an engineer is **region selection**, which is often the highest-leverage performance decision available and is usually made in the first five minutes of a project by someone not thinking about it. Choosing \`us-east-1\` because it is the default, when your users are in India, imposes a permanent latency tax that no later optimisation recovers.

This is also the entire commercial premise of content delivery networks: not making servers faster, but making the distance shorter.`,
    devertCaseStudy: `DeVert's hosting reflects exactly this reasoning, in one place well and one place deliberately worse.

The frontend is served from Firebase Hosting's CDN, so the HTML, CSS and JavaScript come from a location near the user. A student in Hyderabad is not fetching the interface from Virginia.

The backend is not. It runs on Render's **Singapore** region - a single instance, one location. That was a deliberate choice: Singapore is the closest low-cost region to India, and the backend handles only email and code grading, neither of which is on the critical path of reading a page. A student browsing lessons never touches it.

But it does mean that submitting code in CodeLab carries a round trip to Singapore on top of the actual execution time. For a feature where the user already expects a wait, that is an acceptable trade. For page loads it would not have been - which is why the pages are not served that way.`,
    knowledgeChecks: [
      {
        question: "How does the overwhelming majority of intercontinental internet traffic travel?",
        options: ["Satellites", "Undersea fibre-optic cables", "Cellular towers", "Microwave relay towers"],
        correctIndex: 1,
        explanation: "Around 500 undersea cables carry the vast majority. Satellites add far more latency because of the distance to orbit and back, and carry a tiny fraction of total capacity.",
      },
      {
        question: "Light in fibre travels at about 200,000 km/s. What is the approximate minimum round-trip time over 10,000 km of cable?",
        options: ["10 ms", "50 ms", "100 ms", "500 ms"],
        correctIndex: 2,
        explanation: "10,000 km at 200,000 km/s is 50ms one way, so 100ms round trip - and that is a floor before routers or servers contribute anything.",
      },
      {
        question: "Why does a severed undersea cable rarely take a whole region offline?",
        options: [
          "Cables are repaired within minutes",
          "The internet has no centre - routers recalculate paths across other available routes",
          "Satellites take over automatically",
          "Each country keeps a local copy of the internet",
        ],
        correctIndex: 1,
        explanation: "It is a network of independent networks with multiple paths, so traffic re-routes. Places with few independent paths are the exception - which is exactly why Armenia went dark from one cut.",
      },
    ],
    lab: {
      title: "Trace a real path across the world",
      brief: `You are going to watch your own traffic cross the planet, hop by hop. This makes the physical model concrete in a way that reading cannot.`,
      steps: [
        "Open a terminal. On Windows run \`tracert google.com\`; on macOS or Linux run \`traceroute google.com\`.",
        "Count the hops. Each line is one router that handled your packet.",
        "Now trace something deliberately far away - try \`traceroute www.abc.net.au\` (Australia) or \`traceroute www.bbc.co.uk\` (UK).",
        "Compare the round-trip times in the last column. Notice where the big jumps happen - those are usually the long cable runs.",
        "Look up the great-circle distance between you and that country, divide by 200,000 km/s, double it, and compare your figure to the measured time. It should be in the same ballpark and somewhat lower than reality.",
      ],
      starterCode: `# Windows
tracert google.com

# macOS / Linux
traceroute google.com

# Some hops show * * * - that router is configured not to reply.
# It still forwarded your packet; it just declined to introduce itself.`,
    },
    assignment: {
      practice: "Run a traceroute to a server on another continent and count how many hops it takes.",
      reflection: "Write down the minimum possible round-trip time between you and a server in London, showing your arithmetic.",
      observation: "Find the submarine cable map at submarinecablemap.com and locate the cables that land nearest to you. Note how many there are - that number is your region's redundancy.",
    },
    summary: "The internet is physical: roughly 500 undersea fibre-optic cables, data centres, routers and exchange points, plus the last mile to your building. 'The cloud' is a rental agreement for space in a building. Because light in fibre travels at about 200,000 km/s, distance imposes a hard floor on latency that no code optimisation removes - which is why region selection and CDNs matter so much. The network has no centre, so a cut cable usually causes re-routing rather than an outage, provided the region has bought redundancy.",
    goingDeeper: `## Why not satellites for everything?

Starlink and its competitors are genuinely useful, and they are not going to replace cable for the paths that matter.

Geostationary satellites orbit at 35,786 km. Up and back is over 70,000 km, giving a floor around 480ms before anything else happens - unusable for interactive work. Low-earth-orbit constellations sit at 550 km, which brings latency down to something competitive, and for very long paths LEO can actually beat cable because radio in vacuum is faster than light in glass.

The limit is capacity. A single modern fibre pair carries terabits per second; a satellite carries gigabits and shares them across everyone in its footprint. Satellites win where cable does not reach; cable wins everywhere it does.

::: behind
There is an active niche where this inverts: high-frequency trading firms have paid for microwave and hollow-core-fibre links between exchanges specifically because the speed of light in air or vacuum beats glass. Shaving one millisecond off a 1,100 km path is worth tens of millions to them. It is the only industry where the refractive index of glass is a line item.
:::`,
    resources: [
      { kind: "link", title: "Submarine Cable Map", url: "https://www.submarinecablemap.com", description: "Every undersea cable in the world, interactive. Find the ones landing nearest you." },
      { kind: "link", title: "Latency numbers every programmer should know", url: "https://gist.github.com/jboner/2841832", description: "The canonical list. Note how a round trip to another continent compares to reading from disk." },
    ],
    tags: ["internet", "latency", "infrastructure"],
  },

  "ip-addresses": {
    subtitle: "How one machine out of billions gets found",
    difficulty: "Beginner",
    estimatedMinutes: 16,
    learningObjectives: [
      "Explain what an IP address identifies and what it does not",
      "Read an IPv4 address and say what range it belongs to",
      "Explain why IPv6 exists and why adoption has been slow",
      "Describe why your laptop's address is usually not visible to the internet",
    ],
    prerequisites: ["What Is the Internet, Physically?"],
    story: `Send a letter with no address on it and it goes nowhere. Obvious.

Less obvious: your laptop right now almost certainly has an address that is *not unique in the world*. Type \`192.168.1.5\` into a search of how many devices have that address and the answer is: an enormous number, simultaneously, all over the planet.

They do not collide, because that address is not a street address. It is more like "Flat 3" - meaningful inside one building, meaningless outside it. Something at the front door translates between "Flat 3" and an address the postal system can actually route.

That translation is happening on every request you make, and understanding it explains a great deal about why networking sometimes behaves strangely.`,
    problemStatement: `For two machines to exchange data, each needs a way to be identified. That sounds like it should require a globally unique number per device.

There are around 4.3 billion possible IPv4 addresses and far more than 4.3 billion connected devices. The maths stopped working years ago, and the internet did not stop working - which means something clever is going on, and that something leaks into everyday engineering in ways worth understanding.`,
    concept: `## What an IPv4 address is

Four numbers, each 0-255, separated by dots: \`142.250.183.206\`.

Each number is one byte, so the whole address is 32 bits - which is exactly why there are 2^32, about 4.3 billion, of them.

::: cards Ranges worth recognising on sight
127.0.0.1 :: Loopback. Always means "this machine". \`localhost\` resolves here.
10.x.x.x :: Private. Large internal networks.
172.16-31.x.x :: Private. The range people forget exists.
192.168.x.x :: Private. Almost every home router hands these out.
Everything else :: Public - routable on the open internet, and unique.
:::

The private ranges are reserved by agreement: routers on the public internet will not forward traffic to them. That is what makes it safe for millions of homes to reuse the same numbers.

## How reuse actually works

Your router has one public address, given by your ISP. Every device behind it has a private one. When you make a request, the router rewrites the packet's source address to its own public one and remembers that it did.

::: flow
Laptop 192.168.1.5 -> router rewrites source to 203.0.113.7 and notes the mapping -> the internet -> reply arrives at 203.0.113.7 -> router looks up the note -> delivered to 192.168.1.5
:::

That rewriting is called **NAT** - Network Address Translation. It is why 4.3 billion addresses have stretched to cover far more devices.

::: remember
NAT has a consequence that shapes a lot of software: an outside machine cannot start a conversation with your laptop, because it has no address that routes there. Your laptop must speak first. This is why peer-to-peer video calls need help connecting, and it is a large part of why the web settled on a model where clients call servers and never the reverse.
:::

::: checkpoint
Three people in different countries all report their laptop's address as 192.168.0.10. Who is wrong?
- ( ) Two of them must be misreading it
- (x) Nobody - it is a private address, meaningful only inside each of their own networks
- ( ) Their routers are misconfigured
- ( ) It is impossible for addresses to repeat
> 192.168.x.x is a reserved private range. Those three machines are unreachable from each other by that address, and their routers translate to distinct public addresses on the way out.
:::

## IPv6

The real fix for address exhaustion is a bigger address: 128 bits instead of 32, written in hexadecimal groups like \`2001:0db8:85a3::8a2e:0370:7334\`.

That gives about 3.4 x 10^38 addresses - enough that every device can have a genuinely unique public one and NAT becomes unnecessary.

Adoption has been slow, and the reason is instructive: IPv4 with NAT *works*. There is no crisis forcing the migration, so it has proceeded at the pace of hardware replacement rather than urgency. Both run side by side and will for years.

::: didyouknow
The 2^32 limit was not an oversight. IPv4 was specified in 1981, when the network had a few hundred hosts and the idea that every person would carry several connected devices was not a design consideration. 4.3 billion was absurdly generous at the time.
:::`,
    commonMistakes: [
      "Believing an IP address identifies a person or a device permanently - most are assigned dynamically and change",
      "Thinking 127.0.0.1 and your machine's network address are interchangeable; loopback never leaves the machine",
      "Forgetting 172.16-31.x.x is private, and being confused when a container network uses it",
      "Assuming a service reachable at localhost during development is reachable from another machine - it is not, unless bound to a routable address",
      "Treating an IP address as a reliable identity for security purposes when NAT means thousands of users can share one",
    ],
    industryPerspective: `IPv4 addresses are now a traded asset. Blocks change hands for tens of dollars per address, and cloud providers charge for public IPv4 while offering IPv6 free - a fairly direct signal of scarcity.

Two places this becomes a working engineer's problem. First, **rate limiting by IP** is much blunter than it looks: behind carrier-grade NAT, an entire mobile network region can share a handful of public addresses, so a per-IP limit can lock out thousands of legitimate users at once. Second, **IP-based geolocation** is approximate and frequently wrong, which matters if you are making access or compliance decisions with it.

Container networking is where most developers first meet private ranges properly. Docker hands out addresses on its own bridge network, and the classic confusion - a service on \`localhost:5432\` inside a container is not the host's Postgres - is exactly this lesson applied.`,
    devertCaseStudy: `DeVert never sees a user's IP address in any code it owns, and that is a consequence of its architecture rather than a privacy feature it built.

Because the frontend is static files on a CDN and the browser talks straight to Firestore, there is no application server in the request path to observe the connection. Identity comes from a Firebase Auth token attached to each request - a cryptographic proof of who the user is - and authorisation decisions in the security rules are made on \`request.auth.uid\`, never on where the request came from.

That is the right call, and for reasons this lesson explains: with NAT, an IP address is a poor identifier. An entire college computer lab shares one public address. Rate limiting DeVert by IP would throttle a whole classroom the moment one student was active; identifying a student by IP would be simply wrong.

The one place addresses do matter is the Render-hosted backend, where the platform's CORS configuration controls which *origins* may call it - a different mechanism, and one you will meet properly in Module 7.`,
    knowledgeChecks: [
      {
        question: "How many bits is an IPv4 address, and roughly how many addresses does that allow?",
        options: ["16 bits, 65 thousand", "32 bits, 4.3 billion", "64 bits, 18 quintillion", "128 bits, 3.4 x 10^38"],
        correctIndex: 1,
        explanation: "Four bytes of 8 bits each is 32 bits, giving 2^32 which is about 4.3 billion. 128 bits is IPv6.",
      },
      {
        question: "Which of these is NOT a private address range?",
        options: ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16", "8.8.8.0/24"],
        correctIndex: 3,
        explanation: "8.8.8.8 is Google's public DNS resolver - a routable public address. The other three are the reserved private ranges.",
      },
      {
        question: "Why can a machine on the internet not normally initiate a connection to your laptop at home?",
        options: [
          "Firewalls block all incoming traffic by law",
          "Your laptop has a private address that public routers will not forward to, so it must speak first",
          "Laptops cannot accept connections",
          "Your ISP charges extra for it",
        ],
        correctIndex: 1,
        explanation: "The private address is not routable from outside, and the router only has a NAT mapping once your machine has sent something out. This asymmetry shaped the client-server model of the web.",
      },
      {
        question: "Why is rate limiting purely by IP address risky?",
        options: [
          "IP addresses change too slowly",
          "Many users can share one public address behind NAT, so limiting one address can block thousands of people",
          "IP addresses are encrypted",
          "It is computationally expensive",
        ],
        correctIndex: 1,
        explanation: "Carrier-grade NAT and institutional networks put large numbers of users behind very few public addresses. A per-IP limit treats them as one actor.",
      },
    ],
    lab: {
      title: "Find both of your addresses",
      brief: `Every machine on a home network has two relevant addresses: the private one it knows about, and the public one the world sees. Seeing them differ is the moment NAT stops being abstract.`,
      steps: [
        "Find your PRIVATE address. Windows: \`ipconfig\`. macOS/Linux: \`ip addr\` or \`ifconfig\`. Look for something starting 192.168, 10., or 172.16-31.",
        "Find your PUBLIC address: visit ifconfig.me or run \`curl ifconfig.me\`.",
        "Compare them. They are different, and the second is shared with every other device in your building.",
        "Ask someone on a different network to run the same commands. Their private address may well match yours; their public one will not.",
        "Run \`ping 127.0.0.1\`. It replies instantly and no packet touched your network card - loopback never leaves the machine.",
      ],
      starterCode: `# Private address
ipconfig                 # Windows
ip addr                  # Linux
ifconfig                 # macOS

# Public address - what the internet sees
curl ifconfig.me

# Loopback: this never leaves your machine
ping 127.0.0.1`,
    },
    assignment: {
      practice: "Find your private and public addresses and note which private range yours falls into.",
      coding: "If you have Docker installed, run \`docker network inspect bridge\` and find the subnet it uses. Notice it is a private range.",
      reflection: "Explain in two sentences why a peer-to-peer video call between two home networks is harder to set up than a call through a central server.",
    },
    summary: "An IPv4 address is 32 bits written as four bytes, giving about 4.3 billion possibilities - fewer than there are devices. Reserved private ranges (10.x, 172.16-31.x, 192.168.x) are reused freely inside networks because public routers will not forward to them, and NAT on your router translates between a private address and its one public address. That asymmetry means outside machines cannot initiate contact with your laptop, which is a large part of why the web is client-server. IPv6 solves exhaustion with 128-bit addresses, and adoption is slow because IPv4 with NAT still works.",
    goingDeeper: `## Reading CIDR notation

You will constantly see addresses written like \`192.168.1.0/24\`. The number after the slash is how many leading bits are the *network*; the rest identify hosts within it.

  /24  ->  24 network bits, 8 host bits  ->  256 addresses
  /16  ->  16 network bits, 16 host bits ->  65,536 addresses
  /8   ->   8 network bits, 24 host bits ->  16,777,216 addresses

The rule: a \`/n\` block contains 2^(32-n) addresses. This is worth having reflexively, because it appears in firewall rules, cloud subnets and routing tables constantly.

Module 8 covers CIDR properly when subnetting matters for deployment.

## Why NAT was supposed to be temporary

NAT was introduced in the 1990s as a stopgap while IPv6 was finished. It is still here thirty years later, and it has had genuine architectural costs: it broke the internet's original assumption that any host could address any other, which is why peer-to-peer protocols need STUN and TURN servers, and why running a server from home is awkward.

::: interview
"Why does WebRTC need a STUN server?" is a question that sounds like trivia and is really this lesson. The answer is that both peers are behind NAT and neither has an address the other can reach, so they need a third party with a public address to discover how they appear from outside.
:::`,
    resources: [
      { kind: "link", title: "MDN: What is a URL?", url: "https://developer.mozilla.org/en-US/docs/Learn/Common_questions/Web_mechanics/What_is_a_URL", description: "Where addresses meet the names people actually type." },
      { kind: "cheatsheet", title: "IPv4 private address ranges (RFC 1918)", url: "https://datatracker.ietf.org/doc/html/rfc1918", description: "The document that reserved 10/8, 172.16/12 and 192.168/16. Short, and readable." },
    ],
    tags: ["internet", "ip", "nat", "ipv6"],
  },

  "networks-packets-and-routers": {
    subtitle: "Why data travels in pieces",
    difficulty: "Beginner",
    estimatedMinutes: 15,
    learningObjectives: [
      "Explain why data is split into packets instead of sent as one stream",
      "Describe what a router actually decides",
      "Explain why packets can arrive out of order, and who reassembles them",
      "Distinguish what IP guarantees from what TCP adds",
    ],
    prerequisites: ["IP Addresses"],
    story: `Imagine posting a 400-page manuscript to a publisher, and the only postal service available loses about one envelope in every fifty.

Send it as one parcel and a single loss costs you the whole manuscript.

Send it as 400 numbered envelopes, one page each, and a loss costs you page 213 - which you resend. The publisher sorts them by number on arrival, and it does not matter that they came by different vans on different days.

That is packet switching, and it is the single design decision that makes the internet work over infrastructure nobody can guarantee.`,
    problemStatement: `The telephone network worked the opposite way: it reserved a dedicated circuit between two parties for the duration of the call. Reliable, and enormously wasteful - the line sat idle every time nobody spoke, and it could not survive a cut without dropping the call.

A network connecting millions of machines cannot afford a reserved path per conversation, and it cannot assume any link stays up. It needs a model where capacity is shared, failure is normal, and no single loss is fatal.`,
    concept: `## Packets

Everything you send is chopped into small chunks - typically around 1,500 bytes. Each chunk is wrapped with a header saying where it came from, where it is going, and where it sits in the sequence.

::: cards What a packet carries
Source address :: Who sent it, so a reply can be routed back.
Destination address :: Where it is going. This is what routers read.
Sequence number :: Its position in the original data, so the receiver can reassemble in order.
Payload :: The actual slice of your data.
Checksum :: A number derived from the contents, used to detect corruption in transit.
:::

Because each packet is addressed independently, two packets from the same request can take entirely different physical routes and still arrive.

## What a router does

A router has one job, performed millions of times per second: look at a packet's destination, consult a table of "for addresses like this, the next best hop is that link", and forward it.

::: flow
Packet arrives -> read destination -> look up best next hop -> forward -> forget it entirely
:::

That last step matters. A router keeps no memory of the conversation. It is not tracking your download; it is making one independent forwarding decision per packet. This statelessness is why the internet scales - a router does not need to know about the millions of conversations passing through it.

::: remember
Routers make no promise. A packet may be delayed, duplicated, arrive out of order, or be silently dropped when a link is congested. The network is explicitly "best effort", and every guarantee you rely on is built on top by software at the endpoints.
:::

## Where reliability comes from

The layer that addresses and forwards packets is **IP**. It guarantees almost nothing.

The layer that turns that into something usable is **TCP**, and it runs only on the two endpoints - never in the routers between.

::: cards Who provides what
IP :: Addressing and routing. Best effort. May lose, duplicate or reorder.
TCP :: Numbers every byte, acknowledges what arrived, retransmits what did not, reassembles in order, and slows down when the network is congested.
UDP :: The deliberate opposite - no retransmission, no ordering, no congestion control. Chosen when late data is worse than missing data, as in live voice and video.
:::

::: checkpoint
During a video call the picture briefly blocks up, then recovers - but the call never pauses to catch up. Which transport is almost certainly in use?
- ( ) TCP, because it retransmits lost data
- (x) UDP, because a late frame is worthless in a live call so loss is simply accepted
- ( ) IP directly, with no transport layer
- ( ) It depends on the router
> If a video call used TCP, a lost packet would stall playback while it was retransmitted, and you would drift further behind real time with every loss. Live media prefers a brief glitch over growing delay, which is exactly the trade UDP makes.
:::

## Why this shapes the software you write

Every network error you will ever debug traces back to this model. A request that "sometimes fails" is usually a packet lost and a timeout reached. A slow API over a long distance is TCP waiting for acknowledgements across a round trip. Retry logic exists because the network beneath you is allowed to fail.

::: didyouknow
Packet switching was developed independently by Paul Baran in the United States and Donald Davies in the United Kingdom in the early 1960s. Baran's motivation was survivability - a communications network that would keep functioning after parts of it were destroyed. The design goal was resilience under partial failure, which is exactly the property that later made it suitable for a global public network.
:::`,
    commonMistakes: [
      "Believing packets from one request follow one fixed path - each is routed independently and they may diverge",
      "Assuming the network guarantees delivery. IP guarantees nothing; TCP builds the guarantee at the endpoints",
      "Thinking routers track your connection. They are stateless per packet, which is precisely why they scale",
      "Choosing TCP for live audio or video, where a retransmitted packet arrives too late to be useful",
      "Writing code with no timeout or retry, which quietly assumes a reliability the network never promised",
    ],
    industryPerspective: `The 1,500-byte figure is the Ethernet MTU, and it has a real operational bite: if a packet is larger than a link's MTU it must be fragmented or dropped, and misconfigured MTUs across a VPN or tunnel cause one of the more baffling failure modes in networking - small requests succeed, large ones hang forever.

The endpoint-only nature of TCP is also why **HTTP/3 exists**. TCP's ordering guarantee means one lost packet blocks every stream sharing that connection, so HTTP/3 moved to QUIC, which runs over UDP and reimplements reliability per stream. That is a direct consequence of this lesson: when the guarantee lives at the endpoints, you are free to build a different one.`,
    devertCaseStudy: `DeVert's code execution feature is where this becomes visible to a student.

When code is submitted in CodeLab, the browser makes an HTTPS request to the backend in Singapore, which forwards it to an execution provider, waits for the result, and returns it. Every one of those hops is packets over best-effort IP, and any of them can be slow or lossy.

So the client does not assume success. \`runCode\` in \`lib/codelab.js\` treats a failure as a real possibility, and the lesson code blocks elsewhere on the platform fall back to a pre-authored expected output the moment a run genuinely fails - never a fabricated result, and never a dead Run button left behind.

That fallback exists because of this lesson. A network that is allowed to drop packets is a network where "the request just failed" is a normal Tuesday, not an exception worth crashing over.`,
    knowledgeChecks: [
      {
        question: "Why is data split into packets rather than sent as one continuous stream?",
        options: [
          "Because computers cannot send large files",
          "So capacity can be shared and a single loss costs only one small piece rather than everything",
          "To make the data smaller",
          "Because routers can only read small messages",
        ],
        correctIndex: 1,
        explanation: "Packet switching shares links between many conversations and limits the cost of any single failure to one retransmitted chunk, instead of the whole transfer.",
      },
      {
        question: "What does a router decide for each packet it receives?",
        options: [
          "Whether the connection is authorised",
          "Which link to forward it out of, based on its destination address",
          "How to reassemble the original message",
          "Whether to encrypt it",
        ],
        correctIndex: 1,
        explanation: "One forwarding decision per packet, then it forgets. Reassembly and reliability happen at the endpoints, not in the routers.",
      },
      {
        question: "Which guarantees does IP provide on its own?",
        options: [
          "Ordered, reliable delivery",
          "Essentially none - delivery is best effort and packets may be lost, duplicated or reordered",
          "Encryption and integrity",
          "Guaranteed bandwidth",
        ],
        correctIndex: 1,
        explanation: "IP addresses and routes. TCP is what adds acknowledgement, retransmission and ordering, and it runs only on the two endpoints.",
      },
      {
        question: "Why does live video typically use UDP rather than TCP?",
        options: [
          "UDP is encrypted",
          "Because a retransmitted frame would arrive too late to be useful, so accepting loss beats growing delay",
          "Because UDP is always faster per packet",
          "Because routers do not forward TCP",
        ],
        correctIndex: 1,
        explanation: "TCP would stall the stream to recover a lost packet, pushing playback further behind real time with each loss. A momentary glitch is the better trade for live media.",
      },
    ],
    lab: {
      title: "Watch packets get lost",
      brief: `\`ping\` sends small packets and reports which came back. Running it long enough on a real connection will usually show at least some loss or variation - which makes "best effort" concrete rather than theoretical.`,
      steps: [
        "Run a sustained ping to a distant host: \`ping -c 50 www.abc.net.au\` on macOS/Linux, or \`ping -n 50 www.abc.net.au\` on Windows.",
        "Read the summary line at the end. Note the packet loss percentage and the min/avg/max times.",
        "Compare the spread between min and max. That variation is called jitter, and it is why live calls need a buffer.",
        "Now ping something nearby - your own router, usually \`192.168.1.1\`. Notice how much lower and tighter the times are.",
        "If you can, run the distant ping while streaming a video on the same connection. Watch the average time rise - that is congestion, and it is the condition under which routers start dropping packets.",
      ],
      starterCode: `# 50 packets to a distant host
ping -c 50 www.abc.net.au      # macOS / Linux
ping -n 50 www.abc.net.au      # Windows

# Your own router - same command, tiny distance
ping -c 20 192.168.1.1

# Read the final summary: loss %, and min/avg/max round trip.
# The gap between min and max is jitter.`,
    },
    assignment: {
      practice: "Run a 50-packet ping to another continent and record the loss percentage and the min/max spread.",
      reflection: "Explain in two sentences why a router being stateless is what allows the internet to scale.",
      observation: "Next time a page half-loads - text but no images - consider which packets made it and which did not.",
    },
    summary: "Data travels in packets: small independently-addressed chunks, each carrying source, destination, a sequence number and a checksum. Routers make one stateless forwarding decision per packet and keep no memory of the conversation, which is why the network scales. IP provides only best-effort delivery and may lose, duplicate or reorder packets; TCP adds acknowledgement, retransmission and ordering at the two endpoints, while UDP deliberately declines all of that for cases where late data is worse than missing data.",
    goingDeeper: `## Why one lost packet can stall a whole page

TCP guarantees ordered delivery of its byte stream. If packet 40 is lost, packets 41 onward are held in the receiver's buffer - they arrived, but they cannot be handed to the application until 40 is recovered, or the ordering promise breaks.

That is **head-of-line blocking**, and it became a serious web problem when HTTP/2 put many parallel streams over a single TCP connection: one lost packet stalls every stream at once, even ones whose data arrived perfectly.

::: behind
HTTP/3's answer was to stop using TCP. QUIC runs on UDP and implements reliability and ordering per stream rather than per connection, so a loss affecting one stream leaves the others untouched. It is a good example of a pattern worth recognising: when a guarantee is implemented at the endpoints, you are free to replace it with a different guarantee. Nothing in the routers had to change for HTTP/3 to work.
:::

## Congestion control, briefly

When a router's queue fills, it drops packets. TCP treats loss as a congestion signal and slows down, then cautiously speeds up again. Millions of independent connections doing this simultaneously is what keeps the internet from collapsing under its own load - and it is why a single connection rarely uses all available bandwidth immediately.`,
    resources: [
      { kind: "video", title: "How the Internet Works in 5 Minutes", url: "https://www.youtube.com/watch?v=7_LPdttKXPc", description: "A clear short overview of packet switching. Worth watching after reading this." },
      { kind: "link", title: "High Performance Browser Networking - TCP", url: "https://hpbn.co/building-blocks-of-tcp/", description: "Ilya Grigorik's book, free online. The TCP chapter is the best plain-language treatment available." },
    ],
    tags: ["internet", "packets", "tcp", "udp", "routing"],
  },

  "domain-names-and-dns": {
    subtitle: "How a name you can remember becomes a number a machine can route",
    difficulty: "Beginner",
    estimatedMinutes: 17,
    learningObjectives: [
      "Explain what DNS resolves and why the system is hierarchical",
      "Trace a resolution from a browser through to an authoritative server",
      "Explain why caching and TTL exist, and what they cost",
      "Recognise the common record types and what each is for",
    ],
    prerequisites: ["IP Addresses"],
    story: `Nobody types \`142.250.183.206\`. Everybody types \`google.com\`.

That translation happens billions of times a second, and here is what is genuinely surprising about it: there is no single computer anywhere holding a list of every domain name on the internet. Such a list would be too large to distribute, would be out of date within seconds, and would be a single point of failure for the entire web.

Instead the answer is assembled by asking a chain of servers, each of which knows only slightly more than "ask that one over there".

DNS is the internet's most successful piece of delegation.`,
    problemStatement: `Machines route by number; people remember names. Something has to map between them, and that something has three hard requirements at once.

It must be **global** - the same name resolves the same way everywhere. It must be **fast** - it happens before every single connection, so it cannot add noticeable delay. And it must be **decentralised** - no single organisation can be trusted with, or capable of, holding the whole mapping.

A single central lookup table satisfies the first and fails the other two badly.`,
    concept: `## Reading a domain name backwards

A domain name is a hierarchy, and it is written most-specific-first - which is the opposite of how the lookup proceeds.

  www.example.co.uk
   |      |     |  |
   |      |     |  +-- top-level domain (uk)
   |      |     +----- second level (co)
   |      +----------- the name someone registered (example)
   +------------------ a host or subdomain within it (www)

Resolution reads it right to left: start at the root, ask about \`uk\`, then \`co.uk\`, then \`example.co.uk\`, and finally the host.

## The chain of delegation

::: timeline Resolving example.com
Browser cache :: Have I looked this up recently? If yes, done - no network at all.
Operating system cache :: Same question, one level out. Also checks the hosts file.
Resolver :: Usually your ISP's, or a public one like 1.1.1.1. This is the server that does the real work on your behalf.
Root servers :: The resolver asks a root server. The root does not know example.com - it replies "for .com, ask these servers".
TLD servers :: The .com servers do not know the address either. They reply "for example.com, ask these nameservers".
Authoritative server :: This one actually holds the record, and answers with the IP address.
Back to you :: The resolver caches the answer and returns it. Your browser can finally open a connection.
:::

Notice that no server in that chain knew the whole answer. Each knew only who to ask next.

::: remember
The root servers do not contain domain records. They contain pointers to the servers responsible for each top-level domain. That is the entire trick - a hierarchy of referrals rather than a database of answers.
:::

## Caching, and what it costs

If every connection walked that whole chain, the web would be unusably slow and the root servers would collapse. So every layer caches, and each record carries a **TTL** - a number of seconds it may be reused.

::: cards The trade TTL makes
Long TTL (24 hours) :: Fast, cheap, resilient. But when you change where a domain points, some users keep going to the old address for up to a day.
Short TTL (60 seconds) :: Changes propagate almost immediately. Costs far more lookups, and a resolver outage hurts sooner.
The usual practice :: Run a long TTL normally. Lower it hours before a planned migration, move, then raise it again.
:::

::: checkpoint
You move your site to a new host and update its DNS record. A friend sees the new site immediately; you still see the old one. What is the most likely reason?
- ( ) The new host has not finished setting up
- (x) A cached record with a TTL that has not yet expired - somewhere between your browser and your resolver
- ( ) Your friend is using a different internet
- ( ) The DNS change failed
> Different people sit behind different caches with independent expiry. "It works for some people" during a DNS change is almost always caching, not a broken record. \`dig\` will show you the remaining TTL.
:::

## Record types worth knowing

::: cards
A :: Maps a name to an IPv4 address. The common case.
AAAA :: The same for IPv6. Four times the bits, hence four letters.
CNAME :: An alias - "this name is really that name, go resolve that instead".
MX :: Where to deliver email for this domain. Separate from where the website lives.
TXT :: Arbitrary text. Used for domain-ownership proofs and email anti-spoofing records.
NS :: Which nameservers are authoritative for this domain. This is the delegation itself.
:::

## Why this is not merely trivia

DNS is one of the most common causes of outages, and one of the most commonly misdiagnosed. A site that is "down for some people" is a caching question. A newly-issued certificate that will not validate is often a DNS record. An email that silently vanishes is frequently an MX or TXT record.

::: didyouknow
There are 13 root server *addresses*, not 13 machines - a limit set by how much would fit in a single early DNS response packet. Each address is served by hundreds of physical servers worldwide using anycast, where many machines share one IP and the network routes you to the nearest. Over 1,900 instances answer as those 13 addresses.
:::`,
    commonMistakes: [
      "Believing DNS changes are instant - caches hold old answers until their TTL expires, which is why 'it works for some people' happens",
      "Confusing the hierarchy's direction: names are written most-specific-first but resolved right to left, from the root inward",
      "Assuming the root servers hold domain records. They hold referrals to top-level domain servers",
      "Pointing a CNAME at a bare domain such as example.com, which the specification does not permit at the zone apex",
      "Debugging a website outage without checking DNS first, when it is one of the likeliest causes",
    ],
    industryPerspective: `Two DNS incidents are worth knowing because they demonstrate how much depends on this layer.

In October 2016 a large distributed attack against **Dyn**, a managed DNS provider, made Twitter, Reddit, Netflix, GitHub and Spotify effectively unreachable for much of a day. None of those services were down. Their names simply could not be resolved, which from a user's perspective is indistinguishable.

In October 2021 **Facebook** withdrew the network routes to its own DNS servers during a configuration change, taking Facebook, Instagram and WhatsApp offline for roughly six hours. It also locked staff out of buildings whose access systems depended on the same infrastructure.

The engineering lesson in both is the same: DNS is a dependency almost nobody lists in their architecture diagram, and it can take down services that are otherwise perfectly healthy.`,
    devertCaseStudy: `DeVert's own DNS is a small worked example of records doing different jobs.

\`devert.in\` resolves to Firebase Hosting's CDN, which is why the interface loads from somewhere near the user. But the platform also uses \`NEXT_PUBLIC_API_URL\` to reach its backend, hosted on Render under a completely different name - so a single product spans two providers, joined only by DNS.

The interesting operational consequence is what happens when that name cannot be resolved. The frontend is written so that a missing or unreachable API URL is not a crash: email notifications silently no-op, and lesson code examples fall back to their pre-authored expected output. A student browsing lessons never notices, because DNS failure for the backend degrades exactly one feature rather than the site.

That is a deliberate design response to this lesson. If you know DNS is a dependency that can fail independently, you build so that its failure is partial.`,
    knowledgeChecks: [
      {
        question: "What do the DNS root servers actually contain?",
        options: [
          "A record for every domain name on the internet",
          "Referrals to the servers responsible for each top-level domain",
          "The IP addresses of the most popular websites",
          "A cache of recent lookups",
        ],
        correctIndex: 1,
        explanation: "The root delegates. It answers 'for .com, ask these servers', which is what keeps the system decentralised and the root's own data tiny.",
      },
      {
        question: "You update a DNS record and some users still reach the old server. Why?",
        options: [
          "The update failed",
          "Cached records with unexpired TTLs are still being served from caches between those users and the authoritative server",
          "Those users have old browsers",
          "DNS updates require a restart",
        ],
        correctIndex: 1,
        explanation: "Every layer caches with independent expiry, so propagation is gradual rather than atomic. Lowering the TTL before a planned move is the standard mitigation.",
      },
      {
        question: "Which record type tells the world where to deliver email for a domain?",
        options: ["A", "CNAME", "MX", "TXT"],
        correctIndex: 2,
        explanation: "MX (mail exchange) records are separate from the A record for the website, which is why email and web hosting can live with completely different providers.",
      },
      {
        question: "What is the main cost of setting a very short TTL?",
        options: [
          "DNS records become less accurate",
          "Far more lookups reach your nameservers, and a resolver problem affects users sooner",
          "The domain becomes less secure",
          "Browsers stop caching entirely",
        ],
        correctIndex: 1,
        explanation: "Short TTLs buy fast propagation and pay for it in query volume and reduced resilience to upstream failure. It is a trade, not a free improvement.",
      },
    ],
    lab: {
      title: "Watch a resolution happen",
      brief: `\`dig\` shows you exactly what DNS returned, including the remaining TTL. Once you have watched a TTL count down, "DNS propagation" stops being mysterious.`,
      steps: [
        "Run \`dig google.com\` (macOS/Linux) or \`nslookup google.com\` (Windows). Find the ANSWER section and the IP address.",
        "Note the TTL - the number just before the record type. Run the same command again after ten seconds and watch it decrease. You are being served from a cache.",
        "Trace the whole delegation chain: \`dig +trace google.com\`. Read it top to bottom - root, then .com, then the authoritative servers. This is the timeline from this lesson, live.",
        "Look at other record types: \`dig google.com MX\` and \`dig google.com TXT\`. Notice mail is handled by different servers than the website.",
        "Compare resolvers: \`dig @1.1.1.1 google.com\` versus \`dig @8.8.8.8 google.com\`. Different caches, so possibly different remaining TTLs.",
      ],
      starterCode: `# The basic lookup - find the ANSWER section and the TTL
dig google.com
nslookup google.com            # Windows equivalent

# The full delegation chain, root inward
dig +trace google.com

# Other record types
dig google.com MX
dig google.com TXT

# Ask a specific resolver
dig @1.1.1.1 google.com`,
    },
    assignment: {
      practice: "Run \`dig +trace\` on any domain and count how many servers were consulted before an answer came back.",
      coding: "Run \`dig\` on the same domain twice, ten seconds apart, and record both TTL values. Explain the difference.",
      reflection: "Your site must move to a new host next Saturday. Describe what you would do to the TTL, and when.",
      observation: "Look up the MX records for your college or company domain. Note which provider actually handles the email.",
    },
    summary: "DNS turns names into addresses through a hierarchy of delegation rather than a central table: the root refers you to the top-level domain servers, which refer you to a domain's authoritative nameservers, which hold the actual record. Names are written most-specific-first but resolved right to left. Every layer caches, governed by each record's TTL, which trades propagation speed against query volume and resilience - and that caching is why a DNS change appears to take effect for some users before others.",
    goingDeeper: `## Why a CNAME cannot sit at the zone apex

You can point \`www.example.com\` at another name with a CNAME. You cannot generally do that for \`example.com\` itself.

The reason is that a CNAME says "this name is entirely an alias - go resolve that other name instead", and the specification forbids a CNAME coexisting with other records at the same name. But the zone apex must carry SOA and NS records to exist at all. So a CNAME there would conflict with mandatory records.

Providers work around it with non-standard record types - ALIAS, ANAME, or CNAME flattening - which resolve the target server-side and return an A record. Worth knowing because "why can't I CNAME my root domain" is a question that comes up on almost every first deployment.

## DNS over HTTPS, and who can see your lookups

Classic DNS is unencrypted, so your resolver and anyone on the path can see every name you look up - even when the subsequent connection is fully encrypted. DoH and DoT wrap the query in TLS, which closes that gap.

::: interview
This is a genuinely contested area rather than a settled improvement. Encrypting DNS shifts visibility from your network operator to whoever runs the resolver, and it complicates the DNS-based filtering that schools, companies and some countries rely on. Being able to describe the trade rather than just the technology is the more useful answer.
:::`,
    resources: [
      { kind: "link", title: "How DNS works, illustrated", url: "https://howdns.works", description: "A short comic explaining resolution. Genuinely good, and takes ten minutes." },
      { kind: "link", title: "dig command guide", url: "https://linux.die.net/man/1/dig", description: "The manual. Skim it for the query types you will actually use." },
    ],
    tags: ["internet", "dns", "caching", "ttl"],
  },

};
