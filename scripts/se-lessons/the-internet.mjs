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

The backend is not. It runs on Google Cloud Run's **asia-south1** region - Mumbai, a single instance, one location. That was a deliberate choice: most of DeVert's traffic is from India, and the backend handles only email and code grading, neither of which is on the critical path of reading a page. A student browsing lessons never touches it.

But it does mean that submitting code in CodeLab carries a round trip to Mumbai on top of the actual execution time. For a feature where the user already expects a wait, that is an acceptable trade. For page loads it would not have been - which is why the pages are not served that way.`,
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

The one place addresses do matter is the Cloud Run-hosted backend, where the platform's CORS configuration controls which *origins* may call it - a different mechanism, and one you will meet properly in Module 7.`,
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

When code is submitted in CodeLab, the browser makes an HTTPS request to the backend in Mumbai, which forwards it to an execution provider, waits for the result, and returns it. Every one of those hops is packets over best-effort IP, and any of them can be slow or lossy.

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

\`devert.in\` resolves to Firebase Hosting's CDN, which is why the interface loads from somewhere near the user. But the platform also uses \`NEXT_PUBLIC_API_URL\` to reach its backend, hosted on Google Cloud Run under a completely different name (a \`*.run.app\` domain) - so a single product spans two providers, joined only by DNS.

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

  "isps-and-the-path-your-data-takes": {
    subtitle: "Who actually owns the wires between you and everywhere else",
    difficulty: "Beginner",
    estimatedMinutes: 15,
    xpReward: 22,
    coinReward: 9,
    learningObjectives: [
      "Explain what an ISP actually provides and where it sits in the chain",
      "Distinguish Tier 1, Tier 2 and Tier 3 providers by what they pay for",
      "Explain peering and transit, and why two networks choose one over the other",
      "Trace a realistic path from a home connection to a distant server",
    ],
    prerequisites: ["Networks, Packets and Routers", "IP Addresses"],
    story: `A college WiFi connection and a home fibre connection both claim "100 Mbps" on a speed test. A student's app loads instantly on campus and drags at home, every evening, at almost exactly the same hour.

Nothing about the app changed. What changed is which network stands between the student and the server - and that network is not one link, it is a chain of businesses, each of which decided, by contract, whether to hand traffic to the next one quickly or slowly. In the evening, when everyone in the city gets home and starts streaming, the seams in that chain are where the slowdown actually happens.

An ISP is not "the internet". It is the first business in a chain of businesses that agreed, commercially, to move your packets somewhere else.`,
    problemStatement: `IP addressing and packet routing, covered in earlier lessons, explain how a packet finds its way hop by hop. They do not explain *who owns each hop*, or why one path is fast and a seemingly similar one is not.

The internet is not a single organisation that provisions bandwidth for the common good. It is thousands of independently owned networks, and every packet that crosses a boundary between two of them does so because someone agreed - usually for money - to carry it. Understanding an ISP as a business, not a utility, explains a lot of behaviour that otherwise looks like a bug: peak-hour slowdowns, connections to nearby servers performing worse than expected, and why moving a hosting region can fix a complaint no code change touches.`,
    concept: `## What an ISP actually sells you

Not "the internet" - a connection *to* the internet's edge, plus the promise that they will find a path from there to wherever your packet needs to go.

::: cards What the acronym hides
Access :: The physical last mile to your building - fibre, cable, or a cell tower. This is what you are actually paying for.
Routing :: The ISP's own network of routers that gets your packet from your building to somewhere it can hand off to other networks.
Transit :: Agreements with larger networks to carry your traffic onward when the destination is not on the ISP's own network - which is almost always.
:::

## The tiers, roughly

::: cards
Tier 1 :: Owns global backbone infrastructure and reaches every other network on the internet without paying anyone for transit - only a handful of these exist worldwide (Lumen, NTT and Telia are commonly cited examples).
Tier 2 :: Regional or national networks - most large consumer ISPs. They peer with some networks for free and pay Tier 1 providers for the rest.
Tier 3 :: Local access providers that mostly buy transit from someone bigger and resell connectivity to homes and businesses.
:::

## Peering vs transit

::: flow
Two networks -> similar size, roughly equal traffic both ways -> peer directly, for free -> smaller network -> pays a bigger one for transit
:::

::: remember
Peering exists because it is cheaper for two networks to run a direct link between them than to pay a third party to carry traffic that mostly cancels out anyway. Transit exists because a small network cannot reach the rest of the internet on its own and must pay someone who can.
:::

## Why the path is a business decision, not a shortest path

Routers pick "best" routes using BGP (Border Gateway Protocol), and "best" is shaped by cost and policy as much as by distance. Two ISPs can be a few kilometres apart and route traffic between them via another country entirely, because that is the path a contract, not a map, determined.

::: checkpoint
Two customers in the same city, on different ISPs, want to reach each other. Why might their traffic route via a data centre in another country instead of directly?
- ( ) BGP always finds the geographically shortest path
- (x) Their ISPs may lack a direct peering agreement, so traffic follows whichever paid transit route BGP prefers
- ( ) The internet's cables are laid out by government
- ( ) TCP requires the longest path for reliability
> Distance is not what BGP optimises for. If two ISPs never negotiated a peering agreement, traffic transits whichever provider's paid path connects them - even if geography suggests a shorter one exists.
:::

## Content Delivery Networks: buying your way out of this problem

This is why companies like Google, Netflix and Cloudflare pay to place servers *inside* ISP networks, or directly at exchange points - to shortcut the chain of business agreements and land content close to the user, without depending on how well any two ISPs happen to peer.

::: didyouknow
Internet exchange points exist specifically so many networks can peer with each other in one building instead of running a separate cable to every other network individually. India's own exchange points, such as NIXI in Mumbai, are a large part of why India-to-India traffic increasingly stays inside the country rather than routing via Singapore or the US, as it often did a decade ago.
:::`,
    commonMistakes: [
      "Treating 'my ISP' and 'the internet' as the same thing, rather than one business in a chain of them",
      "Assuming a route between two nearby points is always the shortest physical path - it follows business agreements, not geography",
      "Blaming a server's code for slowness that is actually a peering or transit bottleneck between networks",
      "Believing every ISP can reach every other network for free - most pay for transit, and that cost shapes routing decisions",
      "Forgetting that CDNs solve exactly this problem by paying for proximity rather than making a single server faster",
    ],
    industryPerspective: `In 2014, Netflix traffic to Comcast customers in the US degraded sharply - buffering, dropped resolution - not because Netflix's servers were slow, but because the links between Netflix's transit providers and Comcast's network were congested, and neither side would pay to expand them. Netflix eventually paid Comcast directly for a dedicated connection, and speeds recovered overnight with no change to a single line of Netflix's code.

That is one of the clearest public examples of what this lesson is about: a "slow app" complaint that had nothing to do with the app. Any engineer troubleshooting performance for users in a specific country or on a specific ISP should suspect this before suspecting their own server - and the fix, when it is real, usually is not code. It is buying a better path, whether that means a CDN, a direct peering link, or simply picking a hosting region with better connectivity to the actual users.`,
    devertCaseStudy: `DeVert never negotiates directly with any ISP, and it does not need to, because it depends entirely on infrastructure that has already fought this battle at scale.

The frontend is served from Firebase Hosting, which runs on Google's own network - one of the very few Tier 1-scale networks with points of presence at exchanges across India. A student on a home connection reaching a DeVert page is very likely handed off to Google's network within their own city, not routed overseas, because Google has already paid for that proximity everywhere it matters.

The Cloud Run backend is different, and deliberately so: it runs from a single region, asia-south1 (Mumbai), rather than being globally distributed like the static frontend. That is a conscious trade - email and CodeLab grading are not on the critical path of reading a lesson, so a Mumbai-only backend is an acceptable extra hop for the minority of requests that touch it, in exchange for not paying to run it globally.

If DeVert one day saw meaningful traffic from students outside India, this is exactly the lesson that would justify - or not - paying for additional Cloud Run regions. That is a peering-and-proximity decision, not a code change.`,
    knowledgeChecks: [
      {
        question: "What does an ISP's Tier 1/2/3 classification actually describe?",
        options: ["How fast their connection is", "Whether they pay for transit or reach the whole internet through peering alone", "How many customers they have", "Which country regulates them"],
        correctIndex: 1,
        explanation: "Tier 1 networks reach everywhere without paying transit; Tier 2 and Tier 3 pay for at least some of their onward connectivity. It is a statement about business relationships, not raw speed.",
      },
      {
        question: "Why do two similarly-sized networks often peer for free rather than pay a third party?",
        options: ["Government mandates it", "Their traffic in each direction roughly cancels out, so a direct link is cheaper than paying transit for both", "Peering is required by TCP", "Smaller networks are not allowed to peer"],
        correctIndex: 1,
        explanation: "Peering makes economic sense when the traffic volumes are roughly balanced - the cost of a direct link is lower than what both sides would otherwise pay a transit provider.",
      },
      {
        question: "A CDN placing servers inside ISP networks is mainly solving which problem?",
        options: ["Making servers faster", "Shortening the chain of business agreements traffic has to cross to reach a user", "Encrypting traffic", "Reducing the price of hosting"],
        correctIndex: 1,
        explanation: "A CDN's advantage is proximity bought in advance, bypassing whatever peering or transit bottlenecks might otherwise sit between a distant origin server and the user.",
      },
    ],
    lab: {
      title: "Map your own path",
      brief: `You already ran a traceroute in an earlier lesson. This time, look at what each hop actually reveals about who owns it.`,
      steps: [
        "Run a traceroute to a distant site: \`tracert google.com\` (Windows) or \`traceroute google.com\` (macOS/Linux).",
        "For any hop whose IP resolves to a hostname, look at the domain in that name - ISP names and exchange point names often appear directly in it.",
        "Take one hop's IP address and look it up at bgp.he.net (search the IP) - note which organisation owns the network it belongs to.",
        "Compare a traceroute to a server in your own country against one to a server on another continent, and count how many distinct organisations appear across the two.",
      ],
      starterCode: `# Trace to somewhere nearby and somewhere far
tracert google.com                # Windows
traceroute www.bbc.co.uk           # macOS / Linux

# For any hop's IP address, look up who owns it:
# https://bgp.he.net/ip/<the-address>`,
    },
    assignment: {
      practice: "Run traceroutes to a nearby server and a distant one, and count how many distinct network operators appear across both.",
      reflection: "Explain in two sentences why a shorter geographic path is not always the path your data actually takes.",
      observation: "Look up which company or organisation runs your own ISP's upstream transit, if you can find it, and note whether it is a Tier 1 or Tier 2 network.",
    },
    summary: "An ISP is one business in a chain of businesses, not a synonym for the internet itself. Tier 1 networks reach the whole internet through free peering; Tier 2 and Tier 3 networks pay for at least some transit, and that cost shapes which paths BGP actually prefers - which is why traffic between two nearby points can still route through a distant country if no direct peering agreement exists. CDNs exist to buy proximity to users directly, sidestepping this chain of agreements rather than making any single server faster.",
    goingDeeper: `## When the chain itself gets hijacked

BGP, the protocol routers use to agree on paths between networks, runs almost entirely on trust: a network announces "traffic for this address range should come to me", and neighbouring routers largely believe it. In February 2008, Pakistan Telecom, attempting to block YouTube domestically by court order, accidentally announced itself as the best route for YouTube's entire address range to the rest of the world - and for about two hours, a large share of global YouTube traffic tried to reach a network in Pakistan that had no idea what to do with it.

::: behind
Incidents like this are called BGP hijacks, and they still happen, sometimes by accident and sometimes deliberately. Proposed fixes exist (RPKI, which cryptographically signs "who is allowed to announce this address range") but adoption is voluntary and partial, which is a real and ongoing weak point in the internet's architecture - a system built on cooperation between competitors is only as reliable as everyone's willingness to configure it correctly.
:::

## Exchange points as a shortcut around all of this

An internet exchange point (IXP) is a building where dozens or hundreds of networks connect to a shared switch and can peer with any other member present, instead of negotiating and wiring a separate direct link to each one individually. It turns what would be an enormous number of individual bilateral agreements into one physical connection per network, and it is a large part of why regional traffic increasingly stays regional rather than taking a long detour through another continent's infrastructure.`,
    resources: [
      { kind: "link", title: "What is BGP?", url: "https://www.cloudflare.com/learning/security/glossary/what-is-bgp/", description: "Cloudflare's plain-language explainer on the protocol that decides which path your traffic actually takes." },
      { kind: "link", title: "Hurricane Electric BGP Toolkit", url: "https://bgp.he.net", description: "Look up any IP address or domain and see which network (ASN) actually owns it." },
    ],
    tags: ["internet", "isp", "peering", "bgp"],
  },

  "what-a-browser-actually-is": {
    subtitle: "Not the internet. A program that renders other people's data.",
    difficulty: "Beginner",
    estimatedMinutes: 14,
    xpReward: 20,
    coinReward: 8,
    learningObjectives: [
      "Describe the major components of a browser and what each is responsible for",
      "Explain the difference between the browser and 'the internet'",
      "Explain why each tab runs mostly isolated from the others, and why that matters",
      "Trace what happens between typing a URL and pixels changing on screen",
    ],
    prerequisites: ["Domain Names and DNS", "Networks, Packets and Routers"],
    story: `A piece of tech support folklore, retold in different words thousands of times: "I deleted the blue icon and now the internet doesn't work."

The user is not being unreasonable. From where they sit, the browser and the internet really do look like the same thing - one window, one experience, no visible seam. But the browser is closer to a media player for a very specific kind of media: it is a program, running entirely on your own machine, that knows how to ask remote computers for documents and then turn the answer into a page you can read and click.

Delete it, and the internet is exactly as reachable as before. There is simply no way left to look at it.`,
    problemStatement: `Calling the browser "the internet" hides a distinction that matters the moment something breaks. Is a blank page a network problem, a server problem, or a browser problem? Is a frozen tab a slow website or a browser bug? Where did that JavaScript error even come from?

None of those questions are answerable without a working model of what a browser actually is: a piece of local software with several distinct jobs, most of which have nothing to do with the network at all.`,
    concept: `## The browser's actual jobs

::: cards What a browser is made of
Networking stack :: Opens connections, speaks HTTP/HTTPS, handles DNS lookups and TLS - the part that actually talks to the outside world.
HTML parser :: Reads the raw text response and builds a tree of elements, the DOM, representing the page's structure.
CSS engine :: Reads stylesheets and computes, for every element in that tree, exactly how it should look.
Rendering engine :: Takes the styled tree and paints actual pixels - Chrome and Edge use Blink, Safari uses WebKit, Firefox uses Gecko.
JavaScript engine :: Executes the page's script - V8 in Chrome, SpiderMonkey in Firefox - which can change the DOM afterward, which is why pages update without a full reload.
:::

## From URL bar to pixels

::: timeline What happens when you press Enter
Parse the URL :: Work out the scheme, host and path, and whether this is even a navigation rather than a search.
Resolve the host :: A DNS lookup, as the earlier lesson covered, turns the name into an address.
Connect :: Open a TCP connection to that address, then a TLS handshake if the page is HTTPS.
Request :: Send an HTTP request for the resource.
Parse the response :: Build the DOM from the HTML as it streams in - modern browsers do not wait for the whole file to arrive.
Fetch subresources :: The parser finds image, stylesheet and script tags and fires off more requests for each, often in parallel.
Render :: Compute styles, lay out boxes, paint pixels - then re-run this whenever the DOM or styles change.
:::

::: remember
A single page load is rarely one request. A typical page fires dozens - the HTML, then CSS files, fonts, images and scripts, each discovered only once the browser has parsed enough of the previous response to know it exists.
:::

## Why tabs are mostly separate processes

Modern browsers run each tab, and often each origin, in its own operating-system process rather than as one shared program.

::: checkpoint
One browser tab freezes and becomes unresponsive. Your other twelve tabs keep working fine. What does that tell you about the browser's architecture?
- ( ) The browser has crashed and will recover automatically
- (x) Tabs are isolated into separate processes, so one hanging page does not block the others
- ( ) Only that tab is connected to the internet
- ( ) The page's server has crashed
> Modern multi-process browsers give each tab, and often each site, its own OS process. A runaway script can freeze its own tab without taking down the browser or any other tab - a deliberate engineering decision, not an accident.
:::

That isolation is also a security boundary: a hostile page in one tab cannot directly read another tab's memory, because they are different processes, with the operating system enforcing the wall between them.

## The user agent, and why servers ask

Every request a browser makes carries a header identifying itself - and it is honesty on the honour system, because a browser can claim to be anything. Servers sometimes use it to serve different code to old browsers, which is exactly why the header is trivially spoofable and nothing security-sensitive should ever depend on it.

::: didyouknow
Nearly every browser's identifying string still contains the word "Mozilla", including Chrome and Safari, which have nothing to do with the Mozilla project. It is a fossil from a 1990s trick: Netscape called itself Mozilla, servers started checking for that word to send fancier pages to Netscape-compatible browsers, and every subsequent browser copied the string so it would not be treated as second-class. Nobody would design it this way starting from scratch today.
:::`,
    commonMistakes: [
      "Treating the browser and 'the internet' as interchangeable, which makes debugging a blank page or a frozen tab much harder than it needs to be",
      "Assuming a page load is one request, rather than dozens discovered progressively as the HTML is parsed",
      "Trusting the User-Agent header as a reliable signal for anything that matters, when it is trivially spoofable",
      "Assuming a JavaScript error means the network failed, when the failure is often entirely local to the page's own script",
      "Forgetting that rendering engines differ (Blink, WebKit, Gecko), which is why a page can look subtly different across browsers even with identical code",
    ],
    industryPerspective: `The multi-process architecture described above exists largely because of Spectre and Meltdown, the 2018 CPU vulnerabilities that showed one process could, under some conditions, read memory it should not have access to. Putting each site in its own process turns a theoretical cross-site data leak into something the operating system's own memory protection blocks, at the cost of noticeably higher RAM usage - which is a large part of the actual, publicly stated reason Chrome uses more memory than it used to.

This is a useful pattern to notice generally: a browser's user-facing behaviour is very often the visible edge of a security decision made in response to a specific, named vulnerability, not an accident of poor engineering.`,
    devertCaseStudy: `DeVert leans unusually hard on what a browser can do on its own, because the architecture puts almost no server between the browser and the data.

Once a DeVert page's JavaScript bundle has loaded, the browser is not just rendering static content - it is running the Firestore client SDK directly, which opens its own long-lived connection to Google's servers and keeps it open. That is why likes, follows and notifications update live across tabs: the JavaScript engine is holding open connections and re-rendering the DOM every time new data arrives, with no page reload and, for most of the app, no traditional one-shot request/response call at all after the initial page load.

That also explains why the frontend is a static export in the first place: there is no server generating a fresh HTML page per request, because the entire application, once downloaded once, runs as a program inside the browser's JavaScript engine and fetches its own data from there. The browser is not a window onto DeVert's app; for most of the platform, the browser is where DeVert's app actually runs.`,
    knowledgeChecks: [
      {
        question: "What is the most accurate description of a web browser?",
        options: ["The internet itself", "A local program that requests, parses and renders remote documents", "A type of server", "A network protocol"],
        correctIndex: 1,
        explanation: "A browser is software running on your own machine. It talks to the internet, but is not itself the internet - the two remain distinct even though the seam is invisible in everyday use.",
      },
      {
        question: "Why does a single page load typically fire dozens of separate HTTP requests?",
        options: ["Browsers are inefficient by design", "The HTML is parsed progressively, and each linked resource - image, script, stylesheet - triggers its own request once discovered", "Servers require it", "DNS forces one request per file"],
        correctIndex: 1,
        explanation: "The browser fetches the HTML first, then discovers further resources as it parses that HTML, requesting each of them - often in parallel - as it goes.",
      },
      {
        question: "Why does modern browser architecture isolate each site or tab into its own OS process?",
        options: ["To use less memory", "To contain a runaway script to one tab and, since Spectre/Meltdown, to strengthen the boundary against cross-site memory reads", "Because HTML requires it", "To make pages load faster"],
        correctIndex: 1,
        explanation: "Process isolation contains crashes to a single tab and gives the operating system's own memory protection a real boundary to enforce between sites - directly relevant after CPU vulnerabilities showed cross-process memory reads were possible.",
      },
    ],
    lab: {
      title: "Watch a browser build a page",
      brief: `Devtools makes every step in this lesson's timeline directly observable. This lab watches a real page get built, request by request and process by process.`,
      steps: [
        "Open devtools' Network tab, reload any real site, and watch the waterfall of requests appear in order.",
        "Identify the very first request (the HTML) versus the requests that follow (CSS, JS, images) - notice how the later ones only start once the HTML has been parsed enough to reveal them.",
        "Open the browser's built-in task manager (in Chrome: menu > More tools > Task Manager) and find your open tabs listed as separate processes with their own memory usage.",
        "Click any request in the Network tab and find its Request Headers - locate the User-Agent string and notice it still begins with the word 'Mozilla'.",
      ],
      starterCode: `# No commands needed for this lab - it is entirely devtools UI.
# Chrome/Edge: F12 or Ctrl+Shift+I, then the Network tab.
# Task manager: Chrome menu -> More tools -> Task Manager.`,
    },
    assignment: {
      practice: "Reload a real site with devtools' Network tab open and count how many separate requests the page made in total.",
      reflection: "Explain in your own words why a frozen tab does not usually take down your whole browser.",
      observation: "Find the User-Agent string of the browser you're using right now, and note every piece of information it reveals about your setup.",
    },
    summary: "A browser is a local program with distinct jobs - a networking stack, an HTML parser, a CSS engine, a rendering engine and a JavaScript engine - that requests, parses and renders remote documents. A single page load is typically dozens of requests, discovered progressively as the HTML is parsed. Modern browsers isolate tabs and often sites into separate operating-system processes, which contains crashes and, since Spectre and Meltdown, strengthens the security boundary between sites. The User-Agent header identifies the browser but is trivially spoofable and should never be trusted for anything security-sensitive.",
    goingDeeper: `## Standards are why any of this interoperates at all

Nothing forces Chrome, Firefox and Safari to render the same HTML the same way - they do so, mostly, because they all implement the same published standards from bodies like the W3C and WHATWG. Where a spec is ambiguous or a browser vendor moves first, small differences creep in, which is the entire reason cross-browser testing exists as a discipline.

::: interview
"Why does this look different in Safari?" is a question with a real, specific universe of answers: a CSS feature not yet implemented in WebKit, a JavaScript API behind a flag, or occasionally a genuine disagreement between vendors about how a spec should behave. It is rarely a mystery - it is almost always traceable to one browser being ahead of, or diverging from, one specification.
:::

## The browser as a platform, not just a viewer

Modern browsers expose capabilities that have nothing to do with viewing documents - offline storage, background workers that run script without an open tab, access to a device's camera or location, all standardised so any website can request them the same way. Chromebooks push this furthest, treating the browser as close to the entire operating system a user needs. That trajectory is a direct continuation of what this lesson describes: a browser that started as a document viewer has become a full application runtime, which is exactly the capability DeVert's own architecture depends on.`,
    resources: [
      { kind: "link", title: "How Browsers Work", url: "https://www.html5rocks.com/en/tutorials/internals/howbrowserswork/", description: "Tali Garsiel's deep, still-relevant walkthrough of what actually happens inside a rendering engine." },
      { kind: "link", title: "MDN: How browsers work", url: "https://developer.mozilla.org/en-US/docs/Web/Performance/How_browsers_work", description: "A shorter, more current overview covering the same pipeline from parsing to paint." },
    ],
    tags: ["internet", "browsers", "rendering", "dom"],
  },

  "http-the-language-of-the-web": {
    subtitle: "The rules two strangers agree to before they'll talk",
    difficulty: "Beginner",
    estimatedMinutes: 16,
    xpReward: 22,
    coinReward: 9,
    learningObjectives: [
      "Explain what a protocol is and why HTTP is one",
      "Describe the anatomy of an HTTP request and response at a basic level",
      "Name the common HTTP methods and what each communicates",
      "Explain what 'stateless' means and why that was a deliberate design choice",
    ],
    prerequisites: ["What a Browser Actually Is"],
    story: `Picture a customs officer at a border who only accepts declarations in one exact format: your name on this line, your nationality on that one, your goods listed in a numbered list, in this order, or the form is rejected without being read.

That rigidity looks bureaucratic. It is also the only way two strangers - the officer and a traveller who has never met before - can exchange information without ambiguity. Neither has to know anything about the other beyond the form.

HTTP is that form. Every browser and every server on Earth, built by different companies in different decades, agree to fill it in exactly the same way. That agreement is the entire reason a browser built by one company can talk to a server built by a completely different one without either company ever having spoken to the other.`,
    problemStatement: `A browser and a server are built by people who have never met, running code written years apart, often in completely different programming languages. For a request to mean anything, both sides need to agree, in advance and in complete detail, on the shape a message takes and what each part of it means.

Without that agreement, "get me this page" said by a browser has no reason to be understood by a server, any more than a sentence in an unfamiliar language would be. HTTP is that shared shape - a specification of exactly what a request and a response must look like, so any implementation of either can talk to any implementation of the other.`,
    concept: `## What "protocol" actually means here

A protocol is just an agreed format, enforced by nobody, followed voluntarily by everyone because it is the only way to be understood. HTTP - HyperText Transfer Protocol - is the one browsers and web servers use.

## The anatomy of a request

::: cards A request, piece by piece
Method :: A verb stating the intent - GET, POST, and so on. Covered fully below.
Path :: Which resource - for example \`/lessons/http\`.
Headers :: Metadata - what format the client accepts, what browser it is, whether it is carrying a cookie, how large the body is.
Body :: Optional. Data being sent - a form, a JSON payload. GET requests conventionally have none.
:::

## The methods, and what each promises

::: cards
GET :: "Give me this, and don't change anything." Safe to repeat, safe to cache, and by convention has no body.
POST :: "Here is data - do something with it," usually creating something new. Not safe to repeat blindly - resubmitting a form can create a duplicate.
PUT :: "Replace this resource entirely with what I'm sending." Repeating it changes nothing further - it is idempotent.
PATCH :: "Apply this partial change." Update one field without resending the whole resource.
DELETE :: "Remove this." Idempotent - deleting something already deleted is still 'deleted'.
:::

::: remember
"Idempotent" means doing it twice has the same effect as doing it once. GET, PUT and DELETE are meant to be idempotent; POST is not. This is not a style suggestion - browsers, proxies and retry logic all rely on it. A browser will silently retry a failed GET; it will warn you before resubmitting a POST, because the spec itself says POST might not be safe to repeat.
:::

## The response, mirrored

::: cards A response, piece by piece
Status line :: A three-digit status code and short reason phrase - the subject of a later lesson.
Headers :: Content type, length, caching instructions, and more.
Body :: The actual content - HTML, JSON, an image, or nothing at all.
:::

## Stateless, on purpose

Each HTTP request is handled with no memory of any request before it. The server does not, by the protocol's own design, know that this request came from the same browser as the last one.

::: checkpoint
A server receives two GET requests for the same page from the same browser, thirty seconds apart. Per the HTTP protocol itself, what does the server know about the relationship between them?
- ( ) That they came from the same user, because the browser is the same
- (x) Nothing - HTTP itself carries no memory between requests unless something extra, like a cookie or a token, is added
- ( ) That the second is a retry of the first
- ( ) That the user is logged in
> Statelessness is deliberate: HTTP was designed so any server could handle any request independently, which is what let the web scale to millions of servers with no shared memory between them. Anything that feels like "the server remembers me" is built on top of HTTP using cookies or tokens - exactly what later lessons in this module cover.
:::

That statelessness is a trade, not a limitation nobody noticed. It is why a request can be served by any one of thousands of interchangeable servers behind a load balancer, with none of them needing to have handled your previous request - a large part of why the web scales as well as it does.`,
    industryPerspective: `HTTP/1.1, from 1997, is still the version most casually inspected in browser devtools, but production traffic today is mostly HTTP/2 or HTTP/3, both invisible to a developer reading headers because they preserve the exact same request/response model - methods, headers, status codes - while changing how the bytes actually move: multiplexing many requests over one connection, and in HTTP/3's case, moving off TCP entirely, as an earlier lesson in this module covered.

That stability is the point: code written against HTTP/1.1's semantics in the 1990s still runs, mostly unmodified, on HTTP/3 today. Very few technology specifications have stayed backward-compatible for this long, and it is a large part of why "the web" survived as a single coherent thing instead of fragmenting into incompatible dialects.`,
    devertCaseStudy: `DeVert has two very different relationships with HTTP, and knowing which one applies to a given feature explains a lot about how the platform behaves.

For most of the app - lessons, profiles, Pulse posts, the leaderboard - there is no hand-written HTTP request at all. The Firestore client SDK abstracts the wire protocol entirely; code calls something like \`onSnapshot(query, callback)\` and never constructs a method, path or header. Under the hood it is still HTTP-based traffic to Google's servers, but the SDK owns that layer completely.

The one place DeVert code speaks HTTP directly, by name, is the small Spring Boot backend on Cloud Run: the frontend sends a POST request carrying a student's submitted code to the CodeLab grading endpoint, and a POST carrying registration details to trigger an email. Both are unmistakably classic HTTP - a method, a JSON body, and a status code and JSON response coming back. That contrast is worth holding onto: most of DeVert's "requests" are invisible SDK calls, and the two that are not are exactly the two things a browser cannot be trusted to do on its own.`,
    knowledgeChecks: [
      {
        question: "What is an HTTP method actually communicating?",
        options: ["Which server to contact", "The requester's intent - for example to read, create, replace or delete a resource", "The file format of the response", "The user's identity"],
        correctIndex: 1,
        explanation: "GET, POST, PUT, PATCH and DELETE each state a different intent toward the resource named by the path - the method is a verb, not an address or a format.",
      },
      {
        question: "Why does it matter that GET is meant to be idempotent and POST is not?",
        options: ["It doesn't matter in practice", "Browsers and retry logic treat them differently - a GET can be safely retried automatically, a POST cannot without risking a duplicate action", "GET requests are always faster", "POST requests cannot carry a body"],
        correctIndex: 1,
        explanation: "Because a repeated GET has no further effect, it can be retried freely. A repeated POST might create a second order, a second signup, or a second payment, so clients treat it far more cautiously.",
      },
      {
        question: "What does it mean that HTTP is 'stateless'?",
        options: ["Servers cannot store any data", "Each request is handled with no built-in memory of previous requests from the same client", "HTTP does not use TCP", "Only GET requests are allowed"],
        correctIndex: 1,
        explanation: "HTTP itself carries no memory between requests. Anything that feels continuous - a login, a cart - is built on top of it using an extra mechanism like a cookie or token.",
      },
    ],
    lab: {
      title: "Read a real request by hand",
      brief: `Devtools shows every request's method, headers and body. This lab gets you reading one directly, then constructing your own with curl.`,
      steps: [
        "Open devtools' Network tab on any site, click one request, and examine its method, request headers and response headers.",
        "Run \`curl -v https://example.com\` in a terminal and read the request and response lines it prints - curl's -v flag shows the raw headers on both sides.",
        "Run \`curl -X POST https://httpbin.org/post -d \"name=test\"\` and compare it to a plain GET to the same host - notice the different method and that this one carries a body.",
        "Find one response header you don't recognise in either output and look up what it controls.",
      ],
      starterCode: `curl -v https://example.com

curl -X POST https://httpbin.org/post -d "name=test"
curl -X GET https://httpbin.org/get`,
    },
    assignment: {
      practice: "Use curl -v on any HTTPS site and identify the request method, the status line, and at least three response headers.",
      reflection: "Explain in two sentences why HTTP being stateless was a deliberate trade rather than an oversight.",
      observation: "Open devtools on a site with a login form, submit it, and check whether the request is a GET or a POST - and why that choice makes sense.",
    },
    summary: "HTTP is a shared, agreed format that lets any browser talk to any server without either needing to know anything about the other's implementation. A request carries a method stating intent (GET reads, POST usually creates, PUT replaces, PATCH partially updates, DELETE removes), a path, headers and an optional body; the response mirrors that shape with a status line, headers and a body. GET, PUT and DELETE are meant to be idempotent - safe to repeat - while POST is not, which is why browsers and retry logic treat them differently. HTTP itself is stateless by design, which is what let the web scale to countless interchangeable servers with no shared memory between them.",
    goingDeeper: `## The method nobody sends by hand: OPTIONS

Browsers automatically send an OPTIONS request - asking "am I even allowed to make this request?" - before certain cross-origin calls, without any code asking them to. This is the CORS preflight, and it is the browser enforcing, on the client's behalf, a security check the server must explicitly answer.

::: behind
This connects directly back to why an IP address is a poor way to control access: a server can't simply "block bad origins" by address, because a legitimate browser and a malicious script can both originate from the same address behind NAT. CORS instead has the *browser* ask the *server*, by name, "will you accept requests from this origin?" before letting the page's own script make the real request - a check that happens at the HTTP layer this lesson describes, and one you'll meet directly when frontend and backend are wired together later in the course.
:::`,
    resources: [
      { kind: "link", title: "MDN: An overview of HTTP", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview", description: "The clearest short reference for what HTTP actually specifies." },
      { kind: "link", title: "MDN: HTTP request methods", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods", description: "Every method, including the less common ones, with their idempotency and safety properties spelled out." },
    ],
    tags: ["internet", "http", "protocols", "methods"],
  },

  "https-tls-and-why-the-padlock-matters": {
    subtitle: "Same HTTP, wrapped so nobody in between can read or tamper with it",
    difficulty: "Beginner",
    estimatedMinutes: 16,
    xpReward: 22,
    coinReward: 9,
    learningObjectives: [
      "Explain what HTTPS actually adds to HTTP",
      "Describe, at a working level, what happens during a TLS handshake",
      "Explain what a certificate proves and what it does not",
      "Identify what the padlock icon does and does not guarantee",
    ],
    prerequisites: ["HTTP: The Language of the Web"],
    story: `In 2010, a Firefox extension called Firesheep was released as a deliberately alarming demonstration. Sitting on the same coffee-shop WiFi as anyone using Facebook, Twitter or a dozen other sites over plain HTTP, it would silently pluck their session cookies out of the air and show a one-click "log in as this person" button in a sidebar.

Nothing was hacked. The traffic was just travelling in the clear, over shared WiFi, readable by anyone with the right tool. Firesheep made that readable-by-anyone fact impossible to ignore, and it is a large part of why "HTTPS everywhere" became the industry default within a few years, rather than something only banks bothered with.

That padlock in your address bar is the direct answer to Firesheep.`,
    problemStatement: `Plain HTTP travels as readable text over every hop between you and a server - your WiFi, your ISP, every router in between. Anyone positioned on that path can read it, and, worse, can modify it in transit without either end noticing.

For a login form, a payment page, or - as a later module covers - an authentication token, that is not a theoretical risk. It is the difference between a private conversation and one shouted across a crowded room, where anyone can also interrupt and put words in your mouth.`,
    concept: `## What HTTPS actually is

HTTP, unchanged, run over a connection wrapped in TLS (Transport Layer Security). The methods, headers and status codes from the previous lesson are identical - TLS only changes what happens to the bytes between your machine and the server.

::: cards What TLS provides
Encryption :: Nobody on the path between you and the server can read the contents - not your ISP, not the WiFi owner, not a router in between.
Integrity :: Nobody can silently alter the data in transit without the change being detectable.
Authentication :: A certificate proves the server is who it claims to be - or more precisely, that whoever controls the matching private key also controls the domain name.
:::

## The handshake, at a working level

::: timeline What happens before a single byte of HTTP is sent
Client Hello :: Your browser states which TLS versions and cipher suites (encryption algorithms) it supports.
Server Hello + Certificate :: The server picks a cipher suite and presents its certificate - signed proof of its domain and public key.
Verification :: The browser checks the certificate against a chain of trust back to a small set of Certificate Authorities it already trusts.
Key exchange :: Both sides derive a shared secret key, without ever sending that key itself over the connection - the actual cryptographic trick that makes this work.
Encrypted from here on :: Every subsequent byte, including the entire HTTP request and response, is encrypted with that shared key.
:::

::: remember
The handshake adds a round trip or two before any actual data moves, which is why HTTPS used to have a reputation for being slower. Modern TLS (version 1.3) collapses this to effectively one round trip, and the padlock's performance cost today is close to negligible compared to what it prevents.
:::

## What the certificate proves, and what it does not

A certificate proves that whoever requested it controls the domain name it names, at the moment it was issued. It does not vouch for the honesty of the site's owner, the safety of its content, or anything about what it does with your data.

::: checkpoint
You see the padlock icon on a website asking for your bank details. What does the padlock actually guarantee?
- ( ) The site is legitimate and trustworthy
- (x) The connection is encrypted and the certificate matches the domain you are actually connected to
- ( ) The site cannot contain malware
- ( ) The company behind the site has been verified as honest
> The padlock is a statement about the transport - nobody on the path can read or tamper with your traffic, and you really are talking to the domain the address bar says. It says nothing about whether that domain belongs to someone trustworthy. A convincing phishing site can have a perfectly valid certificate for its own look-alike domain.
:::

## Certificate authorities and the chain of trust

Your browser ships with a small list of Certificate Authorities it trusts absolutely. A CA's whole business is verifying "this key belongs to this domain" before signing a certificate saying so - and if a CA signs falsely, browsers can and do remove it from the trusted list entirely, which has happened to more than one over the years.

::: didyouknow
Getting a certificate used to cost money and require manual verification, which is why HTTPS was mostly reserved for logins and checkouts as recently as the mid-2010s. Let's Encrypt, launched in 2016, issues certificates automatically and for free, and is a large reason "the whole site is HTTPS", not just the login page, became the default rather than the exception.
:::`,
    industryPerspective: `Google Chrome began marking plain HTTP pages as "Not Secure" in the address bar starting in 2018 - a deliberate and fairly aggressive push, with browser vendors using their market position to make an entire industry migrate faster than voluntary adoption would have managed alone.

It worked: HTTPS adoption across the web went from roughly a third of page loads to well over 90% within a few years. It is a rare case of a security best practice becoming close to universal not through regulation, but through free certificates removing the cost and browser UI removing the option to ignore it comfortably.`,
    devertCaseStudy: `Every DeVert surface is HTTPS-only, and enforcing that is not optional given how the app's trust model is built.

Firebase Hosting serves the frontend over HTTPS by default with an automatically managed certificate, and the Cloud Run backend does the same - Google does not offer a plain-HTTP Cloud Run endpoint for production traffic in the first place. That matters more here than on many sites, because of how DeVert establishes identity: every write to Firestore is checked against \`request.auth\`, populated from a Firebase Auth ID token that travels with the SDK's connection. If that token could be read off the wire - the exact Firesheep scenario from this lesson's story - anyone on the same coffee-shop WiFi as a student could impersonate them and write to Firestore as if they were that student, because the security rules have no other way to check identity.

TLS is not a nice-to-have layered on top of DeVert's security model here; it is a load-bearing part of it. The rules trust \`request.auth.uid\`, and that trust only holds if the token that produced it could not have been intercepted or altered in transit.`,
    knowledgeChecks: [
      {
        question: "What does HTTPS add to plain HTTP?",
        options: ["A faster connection", "Encryption, integrity checking and server identity verification, wrapped around the same HTTP request/response model", "A different set of HTTP methods", "Automatic caching"],
        correctIndex: 1,
        explanation: "TLS wraps the exact same HTTP - same methods, headers, status codes - and adds confidentiality, tamper detection and a verified identity for the server.",
      },
      {
        question: "What does a valid TLS certificate actually prove?",
        options: ["The website is trustworthy and safe", "That whoever holds the private key controls the domain name the certificate was issued for", "The site has no malware", "The company is verified as honest by the government"],
        correctIndex: 1,
        explanation: "A certificate is a statement about domain control, signed by a certificate authority - not a judgement on the intentions or safety of whoever runs the site.",
      },
      {
        question: "Why is TLS essential to a system where identity is proven by a token sent with every request?",
        options: ["It isn't - tokens are safe over any connection", "Without encryption, anyone on the same network could read the token in transit and impersonate its owner", "TLS makes tokens expire faster", "TLS is only about performance, not security"],
        correctIndex: 1,
        explanation: "A token intercepted in plain text is just as usable to an attacker as to its rightful owner. TLS is what keeps that token unreadable to everyone but the two endpoints of the connection.",
      },
    ],
    lab: {
      title: "Inspect a real certificate",
      brief: `You can see everything this lesson describes without writing a line of code - it is all sitting behind your browser's own padlock icon.`,
      steps: [
        "Click the padlock icon on any HTTPS site in your browser and view the certificate - note the domain it's issued for, the issuing Certificate Authority, and the validity dates.",
        "Visit http://neverssl.com deliberately - a site built specifically to stay on plain HTTP for testing - and notice how your browser treats it differently.",
        "If you have OpenSSL installed, run \`openssl s_client -connect google.com:443 -servername google.com\` and read the certificate chain it prints.",
        "Compare the certificate's Subject and Issuer fields - the domain being vouched for, and who vouched for it.",
      ],
      starterCode: `# See the TLS handshake and certificate chain from the command line
openssl s_client -connect google.com:443 -servername google.com

# A site deliberately kept on plain HTTP, for testing
# http://neverssl.com`,
    },
    assignment: {
      reflection: "Explain in two sentences the difference between what the padlock guarantees and what a user usually assumes it guarantees.",
      observation: "Look at three sites' certificates and note which Certificate Authority issued each one.",
      practice: "Visit neverssl.com over plain HTTP and note exactly how your browser's address bar signals the difference from an HTTPS site.",
    },
    summary: "HTTPS is HTTP run over a TLS-encrypted connection, adding confidentiality, tamper detection and a verified server identity without changing any of HTTP's own methods, headers or status codes. The TLS handshake exchanges supported options, presents a certificate the browser checks against a small set of trusted Certificate Authorities, and derives a shared encryption key before any HTTP data moves. A certificate proves control of a domain name - nothing about the trustworthiness of whoever runs it - so the padlock guarantees a private, unaltered connection to the domain shown, not that the site itself is safe.",
    goingDeeper: `## HSTS and mixed content

Even with HTTPS available, a browser will happily follow a plain-HTTP link if that is what a page provides. HSTS (HTTP Strict Transport Security) is a response header that tells the browser "never connect to this domain over plain HTTP again, for the next N seconds" - closing the gap where a single unencrypted link could otherwise downgrade the connection.

A related enforcement: browsers block "mixed content" - an HTTPS page trying to load a plain-HTTP image, script or stylesheet - specifically because an attacker could intercept that one insecure subresource and use it to compromise the otherwise-secure page around it. One encrypted page with one unencrypted script tag is not a partially secure page; it is an insecure page with a padlock on it.

::: interview
"Why does the browser block that one HTTP image on my HTTPS page?" is a genuinely common early bug, and the answer is always this: the browser is refusing to let a secure page host even one component an attacker on the network could tamper with, because a single compromised script is enough to compromise the whole page's trust.
:::`,
    resources: [
      { kind: "link", title: "How HTTPS Works", url: "https://howhttps.works", description: "A short, illustrated explainer of the handshake and certificate verification described in this lesson." },
      { kind: "link", title: "Let's Encrypt", url: "https://letsencrypt.org", description: "The free certificate authority that made HTTPS-by-default practical for the whole web." },
    ],
    tags: ["internet", "https", "tls", "security"],
  },

  "requests-and-responses-in-detail": {
    subtitle: "Everything the previous lesson glossed over",
    difficulty: "Intermediate",
    estimatedMinutes: 17,
    xpReward: 23,
    coinReward: 9,
    learningObjectives: [
      "Read a full HTTP request and response line by line",
      "Explain content negotiation and why Content-Type matters on both sides",
      "Distinguish query strings, path segments and request bodies by purpose",
      "Explain what a header is for, with several concrete examples",
    ],
    prerequisites: ["HTTP: The Language of the Web", "HTTPS, TLS and Why the Padlock Matters"],
    story: `A junior developer's API call works perfectly in a testing tool and fails every time from the actual app, with a cryptic "Unexpected token < in JSON at position 0".

The clue is in that error: the response started with a \`<\`, the first character of \`<!DOCTYPE html>\`. The server sent back an HTML error page - because it did not recognise what kind of response the client wanted - and the app tried to parse it as JSON anyway.

The fix was one line: a header. \`Accept: application/json\`, telling the server explicitly what shape of response the client could handle. Nothing about the URL, the method, or the actual data changed. The entire bug lived in a header nobody had thought to look at.`,
    problemStatement: `The previous lesson established that a request has a method, a path, headers and maybe a body - but "headers" was left as a vague bucket. In practice, a huge amount of real behaviour - what format comes back, whether something is cached, whether the request is even allowed to happen - is decided entirely by headers most first introductions skip.

The same is true of the body: "POST data" sounds like one thing, but a login form, a file upload and a JSON API call all send fundamentally different shapes of body, and mixing them up is one of the most common early-career bugs in web development.`,
    concept: `## The request, expanded

::: cards Where different data belongs in a request
Path :: The resource itself - \`/lessons/42\`. Identifies what.
Query string :: \`?sort=recent&page=2\` - optional parameters, usually for filtering, sorting or pagination on a GET.
Headers :: Metadata about the request or the client - not the data itself.
Body :: The actual payload being sent, present on POST/PUT/PATCH, conventionally absent on GET.
:::

::: remember
A common beginner mistake is sending a body with a GET request. It is not forbidden by the letter of the spec, but it is defined as having no meaning, so caches, proxies and many servers silently ignore or strip it. If data needs to travel with a GET, it belongs in the query string, not the body.
:::

## Headers worth actually knowing

::: cards
Content-Type :: What format the body is - application/json, text/html, multipart/form-data for file uploads. Both the request and the response carry one.
Accept :: What formats the client is willing to receive back - the header from this lesson's story.
Authorization :: Carries a credential - a token or key proving who is asking. A later module covers what goes in here in depth.
Cache-Control :: How long a response may be reused without asking again.
User-Agent :: Which browser or client is asking - spoofable, and not to be trusted for anything security-sensitive, as an earlier lesson covered.
:::

## Content negotiation

The same URL can return different representations of the same resource depending on what the client says it can accept - JSON for an API client, HTML for a browser. The server reads the Accept header, and the client reads Content-Type on the way back to know how to parse what arrived. Get this mismatched, and you get exactly the bug from this lesson's story.

## The three shapes a body actually takes

::: cards
application/json :: A JSON string body - the near-universal default for API-to-API and frontend-to-backend calls today.
application/x-www-form-urlencoded :: Classic HTML form data, key=value pairs joined with &, which is what a plain form submits by default.
multipart/form-data :: Required whenever a request includes binary data such as a file upload, because it can carry both text fields and raw bytes in one body without corrupting either.
:::

::: checkpoint
An upload form needs to send both a text caption and an image file in one request. Which Content-Type is required, and why?
- ( ) application/json, because it is the modern default
- (x) multipart/form-data, because it is the only common format that can carry both plain text fields and raw binary data in a single body without corrupting the bytes
- ( ) text/html, because the form is HTML
- ( ) It does not matter which is used
> JSON is text-only and cannot cleanly represent arbitrary binary bytes; url-encoded form data has the same problem. Multipart carries each field as its own clearly delimited part, which is exactly why a file-upload request looks structurally different in devtools than a normal JSON POST.
:::

## The response, expanded

The response mirrors the request's shape: a status line (the next lesson), response headers - Content-Type telling the client how to parse the body, and Set-Cookie if a cookie is being issued, two lessons from now - and a body.

::: didyouknow
Query strings have a practical size limit in most browsers and servers, commonly cited around 2,000 characters for maximum compatibility - one reason large or sensitive data goes in a request body instead, quite apart from URLs being logged in browser history and server access logs in plain text.
:::`,
    industryPerspective: `REST API design spends a surprising amount of effort on exactly these details, because getting them wrong produces APIs that "work" in the happy path and fail unpredictably elsewhere. A well-designed API is consistent about what goes in the path versus the query string - an id is a path segment, an optional filter is a query parameter - always sets Content-Type correctly on responses, and honours the client's Accept header rather than always returning one format regardless of what was asked for.

Tools like Postman and browser devtools exist largely to make this normally-invisible layer inspectable, because so much real debugging time goes into "the request looks right, so why is the response wrong" - and the answer is almost always sitting in a header neither side is logging.`,
    devertCaseStudy: `DeVert's one real HTTP-speaking surface - the Cloud Run backend - is a clean, small example of getting this right, precisely because it only has two jobs.

Both the CodeLab grading endpoint and the email-triggering endpoint accept a JSON request body, sent with Content-Type: application/json - the student's submitted code and the problem being attempted, with the server fetching hidden test cases itself server-side via firebase-admin rather than trusting anything sensitive to arrive from the browser. The response comes back as JSON too: pass/fail per test case, or a delivery acknowledgement for the email path.

Neither of these two flows involves a file upload - source code and email details are both comfortably plain text - so multipart/form-data never appears in DeVert's own backend calls, which is exactly the case JSON was built for. Everything else on the platform - the overwhelming majority of "requests" a student's session makes - never touches a hand-built HTTP body at all, because the Firestore SDK is doing that construction invisibly, as the HTTP lesson covered.`,
    knowledgeChecks: [
      {
        question: "Where does an optional filter like ?sort=recent belong in a request?",
        options: ["The request body", "The query string, appended to the path", "A custom header", "It cannot be sent on a GET"],
        correctIndex: 1,
        explanation: "Query strings are the conventional place for optional, non-identifying parameters like sorting or pagination, especially on requests that conventionally carry no body, like GET.",
      },
      {
        question: "Why does a request carrying both a text caption and an image file need Content-Type: multipart/form-data?",
        options: ["Because JSON is deprecated", "Because it is the format that can hold both plain text fields and raw binary bytes in one body without corrupting either", "Because images require encryption", "Because GET requests require it"],
        correctIndex: 1,
        explanation: "Multipart splits a body into clearly delimited parts, each with its own content type, which is what lets text and binary data coexist safely in a single request.",
      },
      {
        question: "A client sends Accept: application/json but the server ignores it and always returns HTML. What is the direct consequence for a client trying to JSON.parse the response?",
        options: ["Nothing, JSON.parse handles HTML fine", "It fails, because the response body is not valid JSON despite the client asking for JSON", "The server automatically converts it", "The request is resent automatically"],
        correctIndex: 1,
        explanation: "Content negotiation only works if the server actually honours the Accept header. If it ignores it, the client's assumption about the response format is simply wrong, and parsing fails.",
      },
    ],
    lab: {
      title: "Provoke a content-negotiation mismatch",
      brief: `httpbin.org is a public service built specifically for poking at HTTP requests and responses. This lab uses it to make headers visibly change behaviour.`,
      steps: [
        "Run \`curl -i -H \"Accept: application/json\" https://httpbin.org/get\` and note the JSON response and its Content-Type response header (the -i flag prints headers too).",
        "Run \`curl -i -H \"Accept: text/html\" https://httpbin.org/html\` and compare the Content-Type you get back to the previous step.",
        "In your browser devtools Network tab, submit any file-upload form on a site you use, click the request, and confirm its Content-Type says multipart/form-data with a boundary string.",
        "Run \`curl -i https://httpbin.org/post -X POST -d \"name=test\"\` and check whether the response's own JSON body echoes back the data you sent, confirming what the server actually received.",
      ],
      starterCode: `curl -i -H "Accept: application/json" https://httpbin.org/get
curl -i -H "Accept: text/html" https://httpbin.org/html

# See headers and body together with -i
curl -i https://httpbin.org/post -X POST -d "name=test"`,
    },
    assignment: {
      practice: "Send the same URL to httpbin.org with two different Accept headers and record how the Content-Type of the response changes.",
      reflection: "Explain in two sentences why sending a body on a GET request is a bad idea even though nothing technically stops you.",
      observation: "Find one file-upload feature you use regularly and inspect its request's Content-Type in devtools to confirm it is multipart/form-data.",
    },
    summary: "A request's path identifies the resource, the query string carries optional parameters, headers carry metadata like Content-Type, Accept, Authorization and User-Agent, and the body carries the actual payload on methods that support one. Content negotiation lets the same URL return different formats depending on what the client's Accept header requests, and mismatches between what a server sends and what a client expects to parse are a common, easily-diagnosed class of bug. Bodies come in three common shapes - JSON, url-encoded form data, and multipart form data - and only multipart can safely carry binary data like a file alongside plain text fields.",
    goingDeeper: `## Making POST safe to retry anyway

POST's lack of idempotency is a real operational problem: a payment request that times out after the server actually processed it, retried blindly, can charge a customer twice. The common industry fix is an idempotency key - a unique value the client generates once per logical operation and sends as a header, which the server stores and checks before processing. A duplicate request with the same key is recognised and returns the original result instead of repeating the action.

::: behind
Stripe's API is the most commonly cited real example of this pattern, and it is worth recognising as a general technique rather than a payments-specific trick: any POST endpoint with real-world consequences that might reasonably need retrying is a candidate for the same idea - the client supplies the uniqueness, and the server is the one that remembers whether it has seen it before.
:::`,
    resources: [
      { kind: "link", title: "MDN: HTTP headers", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers", description: "A categorised reference of headers, including the ones this lesson covers and many more." },
      { kind: "link", title: "httpbin.org", url: "https://httpbin.org", description: "A small public service built purely to let you see exactly what a request looked like when it arrived." },
    ],
    tags: ["internet", "http", "headers", "content-negotiation"],
  },

  "status-codes": {
    subtitle: "Three digits that tell you who's at fault before you read a line of the body",
    difficulty: "Beginner",
    estimatedMinutes: 15,
    xpReward: 21,
    coinReward: 8,
    learningObjectives: [
      "Explain what each status code class (1xx-5xx) broadly communicates",
      "Name the specific codes that come up constantly in real work and what each means",
      "Distinguish a client-caused failure from a server-caused one using the code alone",
      "Explain why the code matters even when the body also contains an error message",
    ],
    prerequisites: ["Requests and Responses in Detail"],
    story: `Buried in RFC 2324, an April Fools' joke specification from 1998, is status code 418: "I'm a teapot" - the correct response, the RFC insists with a straight face, from a teapot asked to brew coffee. Some real servers implement it as an easter egg to this day.

It is funny precisely because it follows the real rules perfectly: a 4xx code means "the request itself was the problem" - and asking a teapot to brew coffee is, structurally, exactly that kind of problem. The joke works because status codes are meaningful enough to make a joke about, which is the more useful thing to notice.

Read the first digit of any real status code, and before looking at anything else, you already know who is supposed to fix the problem.`,
    problemStatement: `A response can fail in wildly different ways - the resource does not exist, the user is not allowed to see it, the server crashed, the request was malformed - and a client program, or a human debugging one, needs to tell these apart before trying to parse whatever text came back, because that text is not guaranteed to be present, structured, or even in the format expected.

The status code is that first, load-bearing signal, and it exists specifically so a client can react correctly with zero assumptions about the body.`,
    concept: `## The five classes

::: cards
1xx Informational :: Rare to see directly - "keep going, more is coming." Mostly invisible to application code.
2xx Success :: The request was understood and the desired action happened.
3xx Redirection :: The client must look somewhere else to complete the request.
4xx Client error :: The request itself was the problem - bad syntax, missing auth, a resource that does not exist.
5xx Server error :: The request was probably fine; something broke on the server's side while handling it.
:::

::: remember
That first digit is the single most useful piece of information in a response, and it is available before parsing a single byte of the body. A retry loop should almost never blindly retry a 4xx - the request itself is the problem, and resending an identical bad request produces the same bad result - but often should retry a 5xx, especially after a short backoff, since the server may recover.
:::

## The codes that come up constantly

::: cards
200 OK :: The generic success. The request worked, here is the result.
201 Created :: Success, and specifically something new now exists - the conventional response to a successful POST that creates a resource.
204 No Content :: Success, and there is deliberately nothing to send back - common for a successful DELETE.
301 / 302 :: Permanently or temporarily moved - "the resource you want is now at this other URL."
304 Not Modified :: "You already have the current version cached - use that," saving a full re-download.
400 Bad Request :: The request was malformed in some way the server could not even process.
401 Unauthorized :: You need to authenticate, and have not - a poorly named code that really means "unauthenticated".
403 Forbidden :: You are authenticated, but not allowed to do this.
404 Not Found :: This specific resource does not exist.
409 Conflict :: The request conflicts with the resource's current state - for example a username already taken.
422 Unprocessable Entity :: Well-formed request, but the data in it fails validation.
429 Too Many Requests :: Rate limited - slow down.
500 Internal Server Error :: Something broke on the server, unspecified.
502 Bad Gateway :: A server acting as a proxy got an invalid response from the server behind it.
503 Service Unavailable :: The server is temporarily unable to handle the request - overloaded or down for maintenance.
:::

::: checkpoint
A request returns 403 Forbidden. What is the most accurate description of what went wrong?
- ( ) The server crashed
- ( ) The resource does not exist
- (x) The server understood who is asking and refused - they are identified, just not permitted to do this
- ( ) The client sent malformed data
> 403 specifically means the server knows who you are, or does not need to, and has decided you may not do this. That is a different failure from 401 (not authenticated at all) and a very different one from 404, which claims the resource is not there rather than that you are blocked from it - a distinction that matters because some APIs deliberately return 404 instead of 403 to avoid confirming a resource even exists.
:::

## 401 vs 403, precisely

This pair is the single most commonly confused set of codes in real work.

::: cards
401 Unauthorized :: "I don't know who you are, or your credentials are missing or invalid. Authenticate, then try again."
403 Forbidden :: "I know who you are, or don't need to. You specifically are not allowed to do this, and authenticating again will not change that."
:::

::: didyouknow
401's official name really is misleading - despite being called "Unauthorized", it actually means unauthenticated, not unauthorized. This mismatch between name and meaning has been part of HTTP's specification since the early days of the web, and nobody has fixed it, because renaming a status code that every client and server on Earth already relies on is far riskier than living with an imprecise name.
:::`,
    industryPerspective: `Well-designed APIs treat status codes as part of the contract, not an afterthought - returning 200 with an error message buried in the JSON body is a common anti-pattern precisely because it forces every client to parse the body just to know whether something worked, defeating the entire point of having a status line.

The 401-vs-403 distinction also shows up as a deliberate security choice: some APIs return 404 instead of 403 for a resource a user is not allowed to see, specifically so an attacker probing for private resources cannot tell the difference between "does not exist" and "exists but you're blocked" - a small, considered decision about how much information a status code should leak.`,
    devertCaseStudy: `Status codes mean two different things depending on which part of DeVert you are looking at, and mixing them up would be a real bug.

The Cloud Run backend speaks conventional HTTP status codes: a successful CodeLab grading run or email send returns 200 (or 201/204 where appropriate), a malformed request returns 400, and a genuine server-side failure - the execution provider unreachable, SMTP down - returns 500, which is exactly why the frontend can distinguish "the student's code failed the tests" (a normal 200 response carrying pass/fail data) from "the grading service itself is broken right now" (a 500, where falling back to a pre-authored expected output, as an earlier lesson covered, is the right response).

Firestore, on the other hand, never hands the browser an HTTP status code at all for the overwhelming majority of DeVert's operations - a denied write from the security rules surfaces as a JavaScript exception carrying a code like "permission-denied", not a 403. It is the same idea as this lesson - splitting client-caused failures from server-caused ones, and telling "you're not allowed" apart from "something broke" - implemented at a different layer, because there is no HTTP request in that path for a status code to travel on.`,
    knowledgeChecks: [
      {
        question: "A response comes back with status 503. What does that broadly indicate?",
        options: ["The client sent a malformed request", "The server is temporarily unable to handle the request - often overloaded or under maintenance", "The resource does not exist", "The user is not authenticated"],
        correctIndex: 1,
        explanation: "503 is a 5xx code, meaning the fault is on the server's side and is often temporary - a good candidate for a retry after a short delay.",
      },
      {
        question: "What is the key difference between 401 and 403?",
        options: ["401 is more severe than 403", "401 means not authenticated at all; 403 means authenticated but not permitted to do this specific thing", "They mean the same thing", "403 always means the server crashed"],
        correctIndex: 1,
        explanation: "401 asks for credentials that are missing or invalid. 403 already has valid credentials on file and is refusing anyway, because the authenticated identity simply isn't permitted.",
      },
      {
        question: "Why should a client generally avoid blindly retrying a 4xx response the way it might retry a 5xx?",
        options: ["4xx responses are always temporary", "The 4xx class means the request itself was the problem, so resending the identical request will fail the same way; a 5xx may succeed on retry since the server itself may recover", "Retrying is never safe for any status code", "4xx responses take longer to process"],
        correctIndex: 1,
        explanation: "A 4xx is a statement about the request being wrong. Resending the exact same wrong request produces the exact same failure - the client needs to change something first, not simply retry.",
      },
    ],
    lab: {
      title: "Provoke real status codes on purpose",
      brief: `httpbin.org has an endpoint built specifically to return whatever status code you ask for, which makes this the fastest way to see each one without needing a real error to happen.`,
      steps: [
        "Run \`curl -i https://httpbin.org/status/404\` and \`curl -i https://httpbin.org/status/500\` and note the first line of each response.",
        "Visit a URL you know is wrong on a real site - add random characters to a valid page's path - and check devtools' Network tab for the actual status code returned.",
        "Find a site that redirects (many bare domains redirect to their www version or vice versa) and run \`curl -i\` on it without following redirects, to see the 301/302 and the Location header telling you where to go next.",
        "Run \`curl -i https://httpbin.org/status/401\` and \`curl -i https://httpbin.org/status/403\` back to back and note both return almost no useful body text - the code itself is doing all the communicating.",
      ],
      starterCode: `curl -i https://httpbin.org/status/404
curl -i https://httpbin.org/status/500
curl -i https://httpbin.org/status/401
curl -i https://httpbin.org/status/403

# Without -L, curl shows the redirect instead of following it
curl -i https://github.com`,
    },
    assignment: {
      practice: "Provoke at least four different status codes using httpbin.org's /status/ endpoint and note what each one's class (2xx/4xx/5xx) tells you before reading anything else.",
      reflection: "Explain in two sentences why an API returning 200 with '{\"error\": true}' in the body is considered bad practice.",
      observation: "Find a real 404 page on a site you use and check, in devtools, that its actual HTTP status is 404 and not a 200 with an error message printed on the page.",
    },
    summary: "A status code's first digit alone tells you who is responsible for a failure - 4xx means the request itself was the problem, 5xx means the server broke while handling an otherwise reasonable request - which is why a client can react correctly before parsing any of the response body. The codes that matter most in daily work are 200, 201, 204, 301/302, 304, 400, 401, 403, 404, 409, 422, 429 and 500/502/503. 401 and 403 are the most commonly confused pair: 401 means not authenticated at all, 403 means authenticated but specifically not permitted. Good APIs treat the status code as part of the contract rather than burying real error information only in the body.",
    goingDeeper: `## 429 and Retry-After

A 429 Too Many Requests response often arrives with a Retry-After header, telling the client exactly how many seconds to wait before trying again. Respecting that header rather than retrying immediately is the difference between backing off politely and making the rate limiting worse by hammering the server harder right when it asked for less traffic.

::: interview
"How would you handle a 429 from a third-party API you depend on?" is a common systems-design question, and the strong answer names exponential backoff with jitter: wait progressively longer between retries, and add a small random variation so that many clients rate-limited at the same moment do not all retry at exactly the same instant and cause a fresh spike.
:::`,
    resources: [
      { kind: "link", title: "MDN: HTTP response status codes", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Status", description: "The full, categorised list, including several codes rare enough to skip in this lesson." },
      { kind: "link", title: "httpstatuses.com", url: "https://httpstatuses.com", description: "A quick-reference catalogue of every status code with a one-line explanation." },
    ],
    tags: ["internet", "http", "status-codes", "debugging"],
  },

  "cookies": {
    subtitle: "How a stateless protocol fakes having a memory",
    difficulty: "Beginner",
    estimatedMinutes: 16,
    xpReward: 22,
    coinReward: 9,
    learningObjectives: [
      "Explain what problem cookies were invented to solve",
      "Read the pieces of a Set-Cookie header and what each attribute controls",
      "Distinguish first-party from third-party cookies and why the latter became controversial",
      "Explain why HttpOnly and Secure matter for a cookie holding anything sensitive",
    ],
    prerequisites: ["Requests and Responses in Detail"],
    story: `In 1994, a Netscape engineer needed to solve a specific problem for an early e-commerce client: a shopping cart. A shopper adds an item, the server says "OK" and forgets everything, because HTTP - as an earlier lesson covered - remembers nothing between requests. Add a second item, and the server has no idea a cart already existed.

The fix borrowed an idea from a much older piece of software - Unix "magic cookies", small tokens a program hands back to itself later as proof of a prior interaction. Have the server hand the browser a small piece of data. Have the browser dutifully return that same piece of data with every subsequent request, without being asked why.

That is the entire idea, and it is over thirty years old. Nearly every "the site remembers me" experience on the modern web still runs on some version of that same trick.`,
    problemStatement: `HTTP's statelessness, covered two lessons ago, is a feature for scaling servers and a serious problem for building anything that feels continuous - a shopping cart, a login, a "you have 3 unread notifications" badge. The server needs some way to recognise "this request is part of the same visit as that earlier one", using a protocol that was explicitly designed not to provide that.

Cookies are the original, and still the most common, patch for that gap.`,
    concept: `## The mechanism itself

::: flow
Server sends a response with Set-Cookie: sessionId=abc123 -> browser stores it -> browser attaches Cookie: sessionId=abc123 to every future request to that domain -> server reads it back
:::

Notice what is actually happening: the server is not remembering anything about you directly. It is handing you a small piece of data and trusting you to return it - the "memory" lives in the cookie itself, or in a lookup the server does using it as a key.

## Reading a real Set-Cookie header

A real one looks like:

  Set-Cookie: sessionId=abc123; Domain=example.com; Path=/; Expires=Wed, 09 Sep 2026 10:00:00 GMT; HttpOnly; Secure; SameSite=Lax

::: cards Every attribute is a rule about when the cookie gets sent back
Domain / Path :: Which requests should include this cookie - scoped to a domain, and optionally a specific path within it.
Expires / Max-Age :: When the cookie should stop being sent. Omit both, and it is a "session cookie" - gone when the browser closes.
HttpOnly :: JavaScript on the page cannot read this cookie at all - only the browser's own request machinery can. A significant defence against a malicious script stealing it.
Secure :: Only ever sent over HTTPS, never plain HTTP - directly closing the Firesheep-style interception from the previous lesson.
SameSite :: Controls whether the cookie is sent on requests that originate from a different site than the one that set it - the modern defence against cross-site request forgery.
:::

::: remember
A cookie without HttpOnly and Secure set is not automatically broken, but it is needlessly exposed: readable by any script on the page, including an injected malicious one, and sendable over plain HTTP if an attacker can force a downgrade. For anything holding a session identifier, both flags should be considered close to mandatory.
:::

## First-party vs third-party

A first-party cookie is set by the domain you are actually visiting. A third-party cookie is set by a different domain embedded in that page - most commonly an ad network's script, present on thousands of unrelated sites, which lets that one company recognise the same browser across all of them.

::: checkpoint
You visit a news site and, minutes later, an unrelated shopping site shows an ad for a product you looked at earlier. What is the most likely mechanism?
- ( ) The news site sold your browsing history directly
- (x) A third-party tracking cookie, set by an ad network embedded on both sites, let that network recognise the same browser across both visits
- ( ) Your ISP is monitoring your traffic
- ( ) It is a coincidence
> An ad network's script embedded on many sites can set a cookie scoped to its own domain, then read that same cookie back on every other site carrying its script - building a cross-site profile without either site owner directly sharing anything. This is precisely the mechanism major browsers have been restricting by default in recent years.
:::

## Why third-party cookies became controversial, and are being phased out

Because the mechanism above works for legitimate uses - a "remember this cart across devices" widget - and for silent cross-site tracking using the exact same technical trick, with no protocol-level way to tell the two apart. Safari and Firefox block third-party cookies by default; Chrome has been moving the same direction. None of this changes first-party cookies - the login and session use case this lesson opened with - which remain fine and necessary.

::: didyouknow
The EU's "cookie consent" banners, dating back to a 2011 ePrivacy Directive amendment and tightened by GDPR, technically apply to nearly any non-essential cookie - but in practice they became near-universal mostly because of tracking cookies specifically, which is why a banner appears even on sites that only set one harmless first-party session cookie.
:::`,
    industryPerspective: `Cookies are also how session fixation and cross-site request forgery attacks work, which is why SameSite exists as a relatively recent addition to a thirty-year-old mechanism. Before SameSite, a malicious page on a completely different domain could trigger a request to your bank, and your browser would dutifully attach your bank's cookie to it anyway, because cookies were originally sent based purely on the target domain, with no concept of "but where did this request originate from".

SameSite=Lax, now the default in every major browser absent an explicit override, closes most of that hole by withholding the cookie on cross-site requests unless the navigation is a straightforward top-level link click. It is a good example of a decades-old protocol feature getting a security patch applied at the specification level, rather than requiring every website to defend itself individually.`,
    devertCaseStudy: `DeVert does not use cookies for authentication at all, and that is worth noticing precisely because cookies are the "default" answer this lesson describes.

Identity on DeVert runs entirely through the Firebase Auth SDK: after Google sign-in, the SDK holds an ID token and refreshes it automatically, storing it in the browser's own storage rather than as an HTTP cookie the server sets. Every Firestore read or write carries that token as part of the SDK's own connection, and Firestore's security rules check it via \`request.auth\` - a mechanism the next lesson covers in full.

That absence is a direct consequence of DeVert's architecture rather than an oversight: cookies are fundamentally a server setting a value for a browser to return, which is most useful when there is a traditional backend issuing them per request. DeVert's frontend has almost no server in that loop to set one. The one place a cookie-like mechanism could matter is the Cloud Run backend, and even there it does not issue session cookies - each CodeLab or email request is a single, self-contained call, not part of a longer server-tracked visit.`,
    knowledgeChecks: [
      {
        question: "What problem were cookies originally invented to solve?",
        options: ["Encrypting HTTP traffic", "Letting a server recognise that multiple requests belong to the same ongoing visit, despite HTTP being stateless", "Speeding up page loads", "Compressing response bodies"],
        correctIndex: 1,
        explanation: "A shopping cart needs the server to recognise repeat visits from the same browser. Cookies were the original fix for HTTP's total lack of built-in memory between requests.",
      },
      {
        question: "What does the HttpOnly attribute on a cookie prevent?",
        options: ["The cookie from being sent over HTTPS", "JavaScript running on the page from reading the cookie's value at all", "The cookie from expiring", "The server from setting the cookie"],
        correctIndex: 1,
        explanation: "HttpOnly hides the cookie from any script on the page, which limits the damage an injected malicious script can do even if it manages to run.",
      },
      {
        question: "How does a third-party ad network typically track a browser across unrelated sites?",
        options: ["By reading the site owner's server logs", "By setting a cookie scoped to its own domain via an embedded script present on many sites, then reading that same cookie back on each one", "By intercepting HTTPS traffic", "By asking each site owner directly"],
        correctIndex: 1,
        explanation: "The tracker's own domain, not the site you're visiting, owns the cookie - which is exactly why it can read the same cookie back regardless of which of its many partner sites you're currently on.",
      },
    ],
    lab: {
      title: "Read your own cookies",
      brief: `Every cookie set on a site you're logged into is inspectable right now, in your own devtools - including which ones are hidden from your own page's JavaScript.`,
      steps: [
        "Open devtools' Application tab (Chrome) or Storage tab (Firefox) on a site you're logged into, and find the Cookies panel.",
        "Pick one cookie and note its Domain, Expires, HttpOnly and Secure columns.",
        "Open the console and run \`document.cookie\` - compare what it prints to the full list in the storage panel. Any cookie missing from the console output but present in the panel is HttpOnly.",
        "On the same site, open the Network tab, reload, and find the Cookie header being sent on a request - confirm it matches what you saw in the storage panel.",
      ],
      starterCode: `// Run in the browser devtools console on a site you're logged into
document.cookie
// Compare this list to devtools > Application > Cookies.
// Any cookie missing here but present there is HttpOnly.`,
    },
    assignment: {
      reflection: "Explain in two sentences why a cookie without the Secure flag is a weaker design than one with it, even on a site that is mostly HTTPS.",
      observation: "Find one site with a visible cookie-consent banner and check its Cookies panel before and after you accept - note what gets added.",
      practice: "Inspect the cookies on a site you're logged into and identify which one is most likely holding your session or login state.",
    },
    summary: "Cookies let a server attach a small piece of data to a browser, which the browser then returns on every subsequent request - the original patch for HTTP's statelessness, invented at Netscape in 1994 for a shopping cart. A Set-Cookie header's attributes - Domain, Path, Expires, HttpOnly, Secure and SameSite - each control when and how the cookie is sent back, and HttpOnly plus Secure are close to mandatory for anything holding a session identifier. First-party cookies serve the site you're visiting; third-party cookies, set by an embedded script from a different domain, are what enabled cross-site tracking and are increasingly blocked by default in major browsers.",
    goingDeeper: `## Cookies versus localStorage

Browsers offer another place to store small pieces of data: localStorage. Unlike a cookie, it is never automatically sent with a request - a script has to read it and attach it deliberately - and it has no HttpOnly-equivalent protection, so any script running on the page, malicious or not, can always read it.

::: behind
That trade-off matters directly for anything holding an authentication token. A cookie with HttpOnly set is invisible to an XSS attack that manages to inject a script into your page - the malicious script simply cannot read it. Data in localStorage is always readable by any script on the page, by design, since that is the entire point of the API. Neither storage mechanism is universally "more secure" - it depends on what you're protecting against, which is exactly the kind of trade-off the next lesson on sessions explores from a different angle.
:::`,
    resources: [
      { kind: "link", title: "MDN: Using HTTP cookies", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies", description: "The full reference for every cookie attribute, including the ones this lesson only summarises." },
      { kind: "link", title: "SameSite cookies explained", url: "https://web.dev/articles/samesite-cookies-explained", description: "A clear, practical walkthrough of what SameSite actually protects against." },
    ],
    tags: ["internet", "cookies", "http", "security"],
  },

  "sessions": {
    subtitle: "The cookie holds a claim ticket, not the coat",
    difficulty: "Beginner",
    estimatedMinutes: 16,
    xpReward: 22,
    coinReward: 9,
    learningObjectives: [
      "Explain what a session actually is, beyond the cookie that merely points to it",
      "Trace the session lifecycle from login through to logout or expiry",
      "Compare in-memory, sticky-routing and shared-store session storage, and why only one survives multiple servers",
      "Explain session fixation and why regenerating the session ID at login defends against it",
    ],
    prerequisites: ["Cookies"],
    story: `A mid-sized retailer once pushed a routine deploy that restarted an internal cache server. Within seconds, support tickets started arriving: every signed-in customer had been logged out mid-purchase, carts emptied, nobody able to explain why.

Nobody's cookie had changed. Every browser in the building still held exactly the same \`sessionId=abc123\` it had a minute earlier, exactly as the previous lesson described. What had vanished was not the cookie - it was the record on the server that \`abc123\` pointed to: the actual list of items in that cart, the fact that this particular id belonged to a signed-in account at all.

The cookie is a claim ticket. Losing the ticket is annoying enough. Losing the coatroom the ticket points to loses everything the ticket ever stood for - and the ticket itself, still perfectly legible in your pocket, cannot tell you that.`,
    problemStatement: `The previous lesson showed a \`Set-Cookie\` header carrying \`sessionId=abc123\` and left that string as the whole story. It is not. A cookie can only ever hold a small piece of text the browser agrees to send back - by itself, \`abc123\` means nothing to anyone.

Something has to exist on the server side that maps that string to an actual account, cart or set of permissions, keeps that mapping around for as long as the visit lasts, finds it again on every request, and eventually throws it away. That mapping - the id, the data it points to, and the mechanism that stores and expires both - is the session. Where and how it lives turns out to matter a great deal the moment more than one server is involved.`,
    concept: `## What a session actually is

::: cards The three parts of a session
Session ID :: The opaque string the cookie carries - meaningless on its own, useful only as a lookup key.
Session store :: Wherever the server keeps the data that id points to - in memory, in a database, in a dedicated cache.
Session data :: The actual content: who is signed in, what is in their cart, which step of a multi-page form they are on.
Expiry :: A rule for when the session stops being valid - a fixed lifetime, an idle timeout, or an explicit logout.
:::

## The lifecycle, end to end

::: timeline From login to logout
Login succeeds :: The server verifies credentials, then creates a new session record and a fresh, random session id.
Set-Cookie :: That id goes to the browser exactly as the previous lesson described - typically HttpOnly and Secure, since anyone holding this id can act as the session.
Every later request :: The browser attaches the cookie automatically; the server looks the id up in its store and treats the request as coming from whoever that record says it does.
Logout or expiry :: The server deletes the record. The browser's cookie may still physically exist, but the id it holds now points at nothing.
:::

::: remember
Notice what "logging out" actually is, at the server: not clearing the cookie - the browser is not guaranteed to receive that instruction, and a cached page can still hold it - but destroying the record the id points to. A session id with no matching record behind it is functionally logged out, whatever the browser still has sitting in storage.
:::

## Where the session store actually lives

A single toy server can keep sessions in its own memory - a plain object, id in, data out. It falls apart the moment there is more than one server.

::: cards Three places a session can live
In-process memory :: Fastest and simplest, and it breaks the instant a load balancer sends two requests from the same user to two different servers - one of them has simply never heard of that session id.
Sticky sessions :: A load balancer configured to always route the same user to the same server, papering over the problem above without solving it - and it fails the moment that one server restarts or is taken out of rotation.
Shared store (Redis, Memcached, a database) :: Every server reads and writes the same external store, so it does not matter which one handles any given request. This is the standard production answer.
:::

::: checkpoint
An application runs behind a load balancer with three servers, each storing sessions in its own memory, with no sticky routing configured. A user logs in, and the very next request happens to be routed to a different server. What happens?
- ( ) Nothing - all three servers share memory automatically
- (x) The second server has no record of that session id, so the user appears logged out despite having just logged in
- ( ) The load balancer merges the servers' memory on the fly
- ( ) The cookie itself is rejected by the second server
> Each server's in-memory store is private to that one process. Without a shared store or sticky routing, a session created on one server is invisible to the others, and a request landing on a different server finds nothing at that id.
:::

## Session fixation, and why the ID gets regenerated at login

A subtler risk: if an attacker can get a victim to start using a session id the attacker already knows - say, by planting it in the browser before login - then once the victim signs in, the attacker's own copy of that same id is now signed in too, because the server just attached the victim's identity to an id the attacker already held.

::: didyouknow
The standard defence is to issue a brand-new session id at the exact moment of login, discarding whatever id existed before - so any id an attacker planted earlier becomes worthless the instant real authentication happens. This practice, called session regeneration, is one of the most common items on a web-framework security checklist, and most frameworks now do it automatically rather than leaving it for a developer to remember.
:::

## Stateful sessions versus stateless tokens

A session, as described above, is inherently stateful: the server must remember something to make it work, and that something needs storing, replicating across servers, and eventually cleaning up. An alternative avoids a server-side store entirely by putting the data directly inside a signed token the client holds instead - the next lesson's format is what usually carries it. The server verifies the token's signature rather than looking anything up, at the cost of being unable to instantly kill one specific token before it naturally expires.

::: remember
Neither approach is simply better. A session can be revoked instantly by deleting one record, but needs a shared store to work across servers. A token scales effortlessly across any number of stateless servers, but revoking one before its natural expiry generally means maintaining a blocklist somewhere - which quietly reintroduces the exact shared-state problem tokens were meant to avoid.
:::`,
    commonMistakes: [
      "Assuming a session is the cookie itself, rather than a server-side record the cookie merely points to",
      "Storing sessions in a single server's memory and being confused when users behind a load balancer randomly get logged out",
      "Believing logout means the browser deletes the cookie, when what actually matters is the server destroying the record it pointed to",
      "Never regenerating the session id at login, leaving an application open to session fixation",
      "Treating 'stateless' as strictly better than 'stateful' sessions, when each trades revocation speed against server-side storage cost",
    ],
    industryPerspective: `Framework defaults are a good tell for how seriously this is taken in practice. Express with express-session, Django, Rails and PHP all default to a signed, HttpOnly, short-idle-timeout cookie holding nothing but an opaque id - and all of them now regenerate that id on login without being asked, specifically because session fixation was, for years, a routine finding in web security audits.

The shared-store problem is also why Redis became close to mandatory infrastructure for any web application expected to run more than one server: it answers a lookup fast enough to check on every single request without adding noticeable latency, and treating session storage as "just another value in Redis" is the standard industry answer rather than a shortcut.

Idle timeout is the other lever teams tune deliberately, because it weighs completely different consequences depending on the product: a banking app might expire a session after two minutes of inactivity, while a content site tolerates a day, and that choice has nothing to do with the mechanics of sessions themselves - only with how bad a stolen, still-valid session id would actually be.`,
    devertCaseStudy: `DeVert has no session store anywhere in its architecture, and that absence is the clearest possible illustration of the stateless-versus-stateful choice this lesson describes.

When a student signs in, Firebase Auth issues a signed JWT - not a session id pointing at a record the server must keep. That token already carries the claims Firestore's security rules need directly (\`request.auth.uid\`, and the custom \`admin\` claim), so there is no lookup to perform on every request and, critically, no server anywhere holding a sessions table that a restart could lose. The Firestore SDK holds that token client-side, attaches it to every request itself, and refreshes it automatically before it expires - the token side of the trade-off above, not the session-store side.

The cost is exactly the one this lesson names: DeVert cannot instantly kill one specific signed-in session the way deleting a session record would. Revoking a compromised token before its natural expiry needs an explicit server-side check, which is precisely why granting or revoking the \`admin\` custom claim via \`scripts/set-admin-claim.mjs\` explicitly requires the affected user to sign out and back in - the old token stays technically valid, by design, until it is naturally refreshed or it expires on its own.`,
    knowledgeChecks: [
      {
        question: "What does a session id actually represent by itself, with no server-side record behind it?",
        options: ["The user's full profile data, compressed", "An opaque lookup key that means nothing until matched against a server-side record", "A password", "A cryptographic proof of identity"],
        correctIndex: 1,
        explanation: "A session id is just a string. The account, cart or permissions it represents only exist because a server is holding a record that string happens to key into.",
      },
      {
        question: "Why does storing sessions in a single server's own memory break down once a load balancer distributes requests across several servers?",
        options: [
          "It doesn't - all servers automatically share process memory",
          "A session created on one server is invisible to the others, so a request landing on a different server finds no matching record",
          "Load balancers do not support cookies",
          "In-memory storage is always slower than a database",
        ],
        correctIndex: 1,
        explanation: "Each server's memory is private to that process. Without sticky routing or a shared store like Redis, only the server that created a session actually knows about it.",
      },
      {
        question: "What is session fixation, and how does regenerating the session id at login defend against it?",
        options: [
          "It is a slow server response, fixed by caching",
          "An attacker gets a victim to use an id the attacker already knows; issuing a fresh id at login discards that planted id before it can be reused",
          "It is a bug where cookies expire too early",
          "It only affects sessions stored in a database, not in memory",
        ],
        correctIndex: 1,
        explanation: "If the id in use at login is discarded and replaced with a brand-new one, any id an attacker planted beforehand becomes worthless the moment real authentication happens.",
      },
    ],
    lab: {
      title: "Watch a session appear, and disappear",
      brief: `Every session-based site is inspectable through your own devtools, including the exact moment a session gets replaced at login and destroyed at logout.`,
      steps: [
        "Sign into any site that uses classic sessions, then open devtools' Application tab (Chrome) or Storage tab (Firefox) and find the session cookie - commonly named sessionid, connect.sid, JSESSIONID or PHPSESSID.",
        "Copy its value somewhere, then sign out. Reload the storage panel and check whether the cookie disappeared, or is still present but now points at a dead record.",
        "Sign back in, and compare the new cookie's value to the one you copied earlier - a different value on every login is session regeneration happening in front of you.",
        "If the site offers a 'sign out of all devices' option, use it and notice this browser is also logged out immediately, without this browser's own cookie ever being touched - that is server-side revocation, not a cookie change.",
      ],
      starterCode: `# No commands needed - this lab is entirely devtools UI.
# Chrome/Edge: F12 -> Application tab -> Cookies.
# Firefox: F12 -> Storage tab -> Cookies.
#
# Look for a cookie named one of:
#   sessionid, connect.sid, JSESSIONID, PHPSESSID`,
    },
    assignment: {
      reflection: "Explain in two sentences why 'the browser deleted the cookie' and 'the user is logged out' are not actually the same event.",
      observation: "Find a site whose session cookie's value visibly changes between one login and the next, and note that as evidence of session regeneration.",
      practice: "Sign into a site with devtools open, note the session cookie's value, sign out, and record whether the cookie was removed, replaced, or left unchanged but now dead.",
    },
    summary: "A session is server-side state - who is signed in, what is in their cart - referenced by an opaque id the cookie merely carries. Login creates a fresh session record and id; every later request looks that id up; logout or expiry destroys the record, regardless of whether the browser's cookie still physically exists. In-memory storage breaks the moment more than one server is involved, which is why shared stores like Redis are standard once an application scales beyond a single machine. Regenerating the session id at login defends against session fixation. Stateful sessions trade instant revocation for needing shared storage; stateless tokens, covered next, make the opposite trade.",
    goingDeeper: `## Sliding versus absolute expiry

A session can expire two different ways: an absolute lifetime ("this session dies eight hours after login, no matter what") or a sliding one ("this session dies after thirty minutes of inactivity, resetting on every request"). Most login systems use sliding expiry for convenience and add an absolute cap on top, so an account left open in a browser for a week does not stay valid forever just because something keeps refreshing it.

## Why sessions have not disappeared, even with tokens everywhere

::: interview
"Why would you choose sessions over JWTs for a new project?" is a fair systems-design question, and the honest answer is: whenever instant revocation matters more than avoiding a shared store. Banking, admin panels and anything where "kick this user out right now" needs to actually work immediately still lean toward server-side sessions, or toward tokens paired with a revocation check - because a signed token nobody can un-sign is a poor fit for "I need this access gone in the next request, not whenever it happens to expire."
:::`,
    resources: [
      { kind: "link", title: "MDN: Using HTTP cookies - session cookies", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#define_the_lifetime_of_a_cookie", description: "The session-vs-persistent cookie distinction referenced throughout this lesson." },
      { kind: "link", title: "OWASP Session Management Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html", description: "The industry-standard reference on session fixation, regeneration and secure session design." },
    ],
    tags: ["internet", "sessions", "cookies", "authentication"],
  },

  "json-how-machines-exchange-meaning": {
    subtitle: "The one data format almost everything eventually agrees to speak",
    difficulty: "Intermediate",
    estimatedMinutes: 17,
    xpReward: 23,
    coinReward: 9,
    learningObjectives: [
      "Explain what JSON is and why it displaced XML as the web's default data format",
      "Read and write valid JSON, including its exact allowed types and stricter syntax rules",
      "Explain the difference between a JSON string in transit and the native object it becomes once parsed",
      "Trace how JSON connects HTTP bodies, Content-Type headers and status codes into one coherent request",
    ],
    prerequisites: ["Requests and Responses in Detail"],
    story: `Douglas Crockford, who popularised JSON in the early 2000s, has said more than once that he did not invent it - he discovered it. JavaScript already had a syntax for writing an object directly in code: curly braces, keys, values, commas. Crockford noticed that if you just wrote that syntax down as plain text and sent it over the wire, any JavaScript engine could turn it straight back into a real object with one function call, no custom parser required.

At the time, the accepted way to exchange structured data between a browser and a server was XML, typically wrapped in SOAP - verbose, tag-heavy, and specified in enough detail that implementing it correctly took teams weeks. JSON did the same essential job in a fraction of the characters, using a syntax web developers were already staring at every day.

It won. Not because a standards committee chose it, but because it was simply easier to use than the alternative, and that turned out to be enough.`,
    problemStatement: `Every lesson in this module has quietly depended on structured data crossing the wire - a status carried in headers, a body needing a declared Content-Type, an API returning something richer than a single number or string. None of that works unless sender and receiver agree, in complete detail, on how a piece of structured data - an object with named fields, a list of records - gets turned into bytes and back again.

That agreement is JSON: a plain-text format for representing exactly the handful of data shapes almost every programming language already has some version of, simple enough to read by eye and universal enough that a server written in Java can hand data to a browser running JavaScript, or a Python script, or anything else, without either side needing to know or care what the other is written in.`,
    concept: `## The types JSON actually has

::: cards Every value JSON can represent
Object :: \`{ "key": value, ... }\` - an unordered set of named fields, each value being any JSON type, including another object.
Array :: \`[value, value, ...]\` - an ordered list; its values need not all be the same type.
String :: Text in double quotes only - single quotes are not valid JSON, even though they are valid JavaScript.
Number :: One numeric type - JSON makes no distinction between an integer and a decimal.
Boolean :: \`true\` or \`false\`, lowercase and unquoted.
null :: Explicitly "no value" - lowercase, unquoted, and distinct from an empty string or a field that is simply missing.
:::

That is the entire type system. Nothing else exists - no dates, no functions, no comments, and, deliberately, nothing that only one programming language happens to understand.

## Syntax rules that are stricter than they look

::: cards Rules JavaScript itself does not enforce
Double quotes only :: Both keys and string values require \`"\`, never \`'\` - code that is perfectly valid JavaScript can still be invalid JSON.
No trailing commas :: A comma after the last item in an object or array is a syntax error, unlike modern JavaScript, which tolerates one.
No comments :: The format has no comment syntax at all, on purpose - a deliberate simplicity Crockford defended for years against repeated requests to add one.
Keys are always strings :: Even a key that looks numeric must be quoted - \`{"1": "one"}\`, never \`{1: "one"}\`.
:::

::: checkpoint
Which of these is valid JSON?
- ( ) \`{name: 'Priya', age: 21,}\`
- (x) \`{"name": "Priya", "age": 21}\`
- ( ) \`{"name": "Priya", "age": 21,}\`
- ( ) \`{'name': "Priya", "age": 21}\`
> JSON requires double quotes around every key and string value, forbids a trailing comma after the last item, and never accepts an unquoted key - all shortcuts valid JavaScript happily allows, and all of them common sources of a parse error the first time someone hand-writes JSON instead of generating it.
:::

## JSON is text - until something parses it

A JSON value arriving over HTTP is just a string of characters, no different in kind from any other response body, until code deliberately turns it into a native data structure.

::: flow
Server holds a real object in memory -> JSON.stringify() turns it into JSON text -> travels as an HTTP body with Content-Type: application/json -> client receives that same text -> JSON.parse() turns it back into a native object
:::

::: remember
\`JSON.parse()\` on a string that is not valid JSON throws - it does not return a best guess. That exception is exactly what surfaced the \`<!DOCTYPE html>\` bug from an earlier lesson's story: an HTML error page is not JSON, and asking \`JSON.parse\` to treat it as JSON fails loudly, which is correct, safe behaviour rather than a flaw in \`JSON.parse\` itself.
:::

## How this ties the whole module together

Every earlier lesson supplies one piece of the trip a JSON payload actually takes. An HTTP method decides what the request means; a \`Content-Type: application/json\` header tells the other side how to interpret the bytes in the body; a status code says whether the attempt succeeded before a single byte of that JSON is even read; TLS makes sure nobody on the path between browser and server can read or alter that JSON in transit. JSON is not a competing idea next to any of that - it is the payload all of it exists to carry safely and legibly from one machine to another.

::: didyouknow
JSON has no schema enforcement built into the format itself - two services can agree to exchange JSON and still disagree about which fields are required, what type a field should be, or what happens when one is missing. That gap is exactly why separate schema specifications (JSON Schema, most widely) and typed-API conventions (OpenAPI, for describing a whole API's shapes) exist layered on top. JSON deliberately stayed simple; tooling grew up around it to add back the guarantees the format itself never promised.
:::`,
    codeExample: {
      language: "json",
      code: `{
  "passed": true,
  "testsPassed": 4,
  "testsTotal": 4,
  "results": [
    { "name": "handles empty input", "passed": true, "runtimeMs": 12 },
    { "name": "handles negative numbers", "passed": true, "runtimeMs": 9 },
    { "name": "handles large arrays", "passed": true, "runtimeMs": 41 },
    { "name": "matches expected output", "passed": true, "runtimeMs": 7 }
  ]
}`,
      expectedOutput: `This is the shape of a real CodeLab grading response - JSON text over the wire until the frontend calls JSON.parse() on it. After that call, response.passed is a real boolean, response.results is a real array of objects, and response.results[0].name is a real string - no longer characters that happen to look like an object, but an actual JavaScript object the rest of the code can work with directly.`,
    },
    commonMistakes: [
      "Writing JavaScript object-literal syntax and assuming it is automatically valid JSON - single quotes, trailing commas and unquoted keys are all rejected",
      "Assuming JSON.parse will tolerate a malformed or non-JSON string rather than throwing an exception",
      "Treating a JSON string and the object it parses into as the same thing, such as trying to read a field directly off a response before calling JSON.parse on it",
      "Sending a JSON response body without setting Content-Type: application/json, leaving the client to guess how to interpret it",
      "Assuming JSON supports comments or trailing commas because some permissive tooling, like JSON5 or a code editor's own object literals, happens to allow them",
    ],
    industryPerspective: `JSON is the default body format for the overwhelming majority of REST APIs today, and GraphQL - often framed as JSON's successor - still returns its results as JSON; what changed is the query language on the way in, not the wire format on the way out.

Because JSON itself enforces no schema, an entire layer of tooling exists specifically to add that back: JSON Schema lets a team specify exactly what a valid payload must contain, and OpenAPI (formerly Swagger) uses it to generate documentation, client libraries and validation from one shared description of an API's shapes, rather than everyone hand-writing the same contract into their own code and inevitably drifting out of sync.

For very high-throughput internal services, some teams move to binary formats - Protocol Buffers or MessagePack - that are smaller and faster to parse than text JSON, at the cost of no longer being human-readable in a browser's Network tab. That trade is deliberate: JSON wins by default because being readable at a glance is worth more than raw size for the vast majority of APIs, and teams reach for a binary format only once they have measured that the trade-off is actually worth paying for.`,
    devertCaseStudy: `Every document DeVert stores in Firestore already has the exact shape this lesson describes: fields with string keys, and values that are strings, numbers, booleans, nulls, nested objects, or arrays of any of those - the same handful of types JSON allows, because Firestore's document model is deliberately JSON-like. A user's profile document, a Pulse post, a coin_transactions record - all of it maps onto plain JSON almost field-for-field, which is exactly why Firestore's client SDK speaks JSON at the wire level under the hood, even though application code never constructs that JSON by hand.

The one place DeVert code sends and receives JSON explicitly, by name, is the Cloud Run backend covered in earlier lessons: the CodeLab grading endpoint accepts a JSON body - the submitted code and the problem being attempted - and returns a JSON body shaped like the code example above, with the server fetching hidden test cases itself server-side rather than trusting anything sensitive to arrive from the browser. The email-triggering endpoint follows the same pattern. Because that backend is written in Spring Boot, incoming JSON is deserialised into Java objects and outgoing Java objects are serialised back into JSON automatically by the framework - the exact stringify-then-parse round trip from this lesson's flow diagram, just performed by a library instead of by hand.`,
    knowledgeChecks: [
      {
        question: "Which of the following is NOT one of JSON's data types?",
        options: ["String", "Number", "Date", "Boolean"],
        correctIndex: 2,
        explanation: "JSON has no date type. Dates are conventionally sent as strings (often ISO 8601) or as a number of milliseconds, and the receiving code is responsible for turning that back into a real date itself.",
      },
      {
        question: "A server sends a JSON body but omits Content-Type: application/json. Why does that matter, given an earlier lesson on content negotiation?",
        options: [
          "It doesn't matter - all response bodies are assumed to be JSON by default",
          "The client has no reliable signal for how to interpret the bytes it received, which is exactly the mismatch that produced the '<!DOCTYPE html>' bug in an earlier lesson's story",
          "The request will be rejected by the server before it is even sent",
          "JSON responses are always compressed automatically",
        ],
        correctIndex: 1,
        explanation: "Content-Type is the header that tells the client what shape of data to expect. Without it declared correctly, a client calling JSON.parse on something that is not JSON fails exactly the way that earlier story described.",
      },
      {
        question: "Once code calls JSON.parse on a response body, what has actually changed?",
        options: [
          "Nothing - it is still just a string",
          "The text has become a native object or array in memory, with real fields and types the code can access directly, rather than characters that merely look like one",
          "The data has been encrypted",
          "The Content-Type header is generated at that point",
        ],
        correctIndex: 1,
        explanation: "Before JSON.parse, a response body is just text - readable, but not something you can call .fieldName on. Parsing turns it into an actual object, which is the entire point of the format existing.",
      },
    ],
    lab: {
      title: "Read, break, and fix real JSON",
      brief: `The browser console already has JSON.stringify and JSON.parse built in, which makes this the fastest way to see exactly where JSON's stricter rules bite.`,
      steps: [
        "Open devtools' console and run \`JSON.stringify({ name: \"Priya\", scores: [88, 92, 76], active: true })\` - notice the resulting string uses double quotes throughout, regardless of how you typed it.",
        "Run \`JSON.parse('{\"name\": \"Priya\"}').name\` and confirm you get back a real string you can use directly, not text you have to pick apart yourself.",
        "Deliberately break it: run \`JSON.parse(\"{name: 'Priya'}\")\` - single quotes, an unquoted key - and read the exact error message JSON.parse throws.",
        "Revisit httpbin.org/get from an earlier lesson's lab, or any API response you can inspect in the Network tab, and use devtools' built-in JSON viewer to expand its nested objects and arrays.",
        "Paste a JSON snippet with a deliberate trailing comma into jsonlint.com and read exactly what it flags and why.",
      ],
      starterCode: `// In the browser console:
JSON.stringify({ name: "Priya", scores: [88, 92, 76], active: true })

JSON.parse('{"name": "Priya"}').name

// This one is INVALID JSON - watch it throw:
JSON.parse("{name: 'Priya'}")`,
    },
    assignment: {
      reflection: "Explain in two sentences why JSON having no comment syntax is a deliberate trade-off rather than an oversight.",
      practice: "Run JSON.parse on a deliberately broken JSON string in your browser console and record the exact error message it throws.",
      observation: "Inspect one real API response in devtools' Network tab and note its Content-Type header alongside the actual JSON body underneath.",
    },
    summary: "JSON represents exactly six kinds of value - objects, arrays, strings, numbers, booleans and null - as plain text, with rules stricter than JavaScript's own object syntax: double-quoted keys and strings only, no trailing commas, no comments. It travels as an HTTP body declared by Content-Type: application/json, is only ever text until JSON.stringify and JSON.parse convert to and from a native object at each end, and it is the payload that HTTP methods, status codes and TLS - covered earlier in this module - all exist to move safely and legibly between machines that otherwise share nothing about how they were built.",
    goingDeeper: `## JSON5, JSONC, and why plain JSON stays strict

Some tools accept looser dialects - JSON5 allows comments, trailing commas and unquoted keys; JSONC (JSON with Comments) is JSON plus comments, used by tools like VS Code for config files people edit by hand. Neither is valid JSON proper, and a strict JSON.parse will reject both. They exist for human-edited config files, where a comment explaining a setting is worth more than strict interoperability - a different trade-off than an API response, which is almost always generated and consumed by code, never typed by a person.

## When JSON is not the answer

::: interview
"When would you NOT use JSON?" is a fair question to be asked, and the honest answer is: at extreme scale or extreme latency sensitivity, where a binary format like Protocol Buffers or MessagePack is smaller on the wire and faster to parse, at the cost of no longer being readable in a browser's Network tab without a decoder. Most applications never reach the point where that trade is worth making - JSON's readability is a genuine engineering advantage, not just a convenience, because it makes debugging a live production issue dramatically faster than staring at a hex dump.
:::`,
    resources: [
      { kind: "link", title: "JSON.org", url: "https://www.json.org", description: "Douglas Crockford's own site describing the format - short, precise, and the closest thing JSON has to an official spec page." },
      { kind: "link", title: "MDN: Working with JSON", url: "https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/JSON", description: "A practical walkthrough of JSON.parse and JSON.stringify with real examples." },
    ],
    tags: ["internet", "json", "apis", "data-formats"],
  },

};
