// Computer Networks - rewritten lesson bodies. See operating-systems.mjs for
// the authoring rules.
//
// Two subject-specific notes. First, the running analogy is a postal system,
// which the original OSI lesson already reached for and which extends cleanly
// all the way through addressing, routing, local delivery and sealed
// envelopes. Second, the source prose for this subject leaned hard on
// "genuinely", "actually" and "precisely" as filler - often several times per
// sentence. That's stripped throughout: the facts are kept, the throat-clearing
// isn't, since it's exactly the padding that made these pages feel generated.

export const COMPUTER_NETWORKS = {
  "osi-model": {
    concept: `## Why Split It Into Layers At All?

::: story
Posting a letter involves several jobs that have nothing to do with each other.

You write the message. You put it in an envelope and write an address. Someone drives it to a sorting office. A plane carries it across the country. A courier walks it to a door.

The pilot doesn't read your letter. You don't choose the plane. Nobody needs to understand anybody else's job - each layer only has to hand off cleanly to the one next to it.
:::

That separation is the whole idea behind the **OSI model**: seven layers, each with one responsibility, each only needing to talk to the layers directly above and below it.

## The Seven Layers, Bottom To Top

::: timeline From the wire to the app
1 - Physical :: The actual electrical signals, light pulses or radio waves carrying raw bits.
2 - Data Link :: Organises raw bits into frames and handles delivery between devices on the *same* local network. MAC addresses live here.
3 - Network :: Routes data *across* different networks. IP addresses live here.
4 - Transport :: Reliable ordered delivery (TCP), or fast delivery without those guarantees (UDP).
5 - Session :: Manages an ongoing conversation between two devices.
6 - Presentation :: Data format translation, encryption, compression.
7 - Application :: The protocols software uses directly - HTTP, DNS, SMTP.
:::

::: checkpoint
A colleague says "the site is up, DNS resolves, but the request is being rejected with a 403". Which layer are they describing?
- ( ) Layer 1 - Physical
- ( ) Layer 3 - Network
- (x) Layer 7 - Application
- ( ) Layer 4 - Transport
> Layer 7. Something is reaching the application and being turned away by it, which rules out everything underneath - the packets clearly arrived. That inference is what the layer vocabulary buys you.
:::

## The Honest Caveat

::: mistake
Real networks do not implement these seven layers as seven separate pieces of code. The **TCP/IP model** - four layers, next lesson - is what actually runs, and several of its layers correspond to more than one OSI layer squashed together.

Memorising OSI as a description of real software is the mistake. It's a *vocabulary*, not an implementation.
:::

::: remember
And as a vocabulary it's genuinely load-bearing. "This is a Layer 3 routing issue" versus "this is failing at Layer 7" communicates roughly where in a complicated stack the problem lives, in five words, to someone who has never seen your system. That's why it survives.
:::

::: behind
**Encapsulation** is the mechanism that joins the layers in practice.

On the way down the stack, each layer wraps the data from the layer above with its own header: a Transport-layer segment gets wrapped into a Network-layer packet, which gets wrapped into a Data-Link frame.

On the way up at the far end, each layer strips and reads its own header and passes the rest upward - which is exactly the envelope-inside-an-envelope structure the postal story started with.
:::`,
  },

  "tcp-ip": {
    concept: `## The Model That Actually Runs

::: story
OSI is the textbook. TCP/IP is the road.

Every network you will ever touch - the internet included - runs on TCP/IP, named after its two foundational protocols. It has four layers rather than seven, because it merges several of OSI's into one.
:::

::: cards The four layers, and what they absorbed
Application :: HTTP, DNS, SMTP. Combines OSI's Session, Presentation and Application into one.
Transport :: TCP and UDP. Maps directly onto OSI's Transport layer.
Internet :: IP addressing and routing. Maps onto OSI's Network layer.
Network Access :: Combines OSI's Data Link and Physical - frames and signals together.
:::

## Why This One Won

::: story
TCP/IP grew out of ARPANET, a US defence-funded research network built on an uncomfortable premise: assume parts of the network will be destroyed, and keep working anyway.

That requirement rules out a design with a control centre. There is nowhere to put one that isn't also a single point of failure.

So the design has no centre at all - and a network built to survive losing nodes turned out, decades later, to be a network that could survive *adding* billions of them.
:::

::: didyouknow
This is why the internet has no off switch. There is no authority that operates it. Independent networks - companies, universities, governments - agree to speak TCP/IP and interconnect, and that agreement is the entire arrangement. The robustness was designed for war and paid off in growth.
:::

::: checkpoint
Which TCP/IP layer would you be working at if you were choosing between reliable and unreliable delivery?
- ( ) Application
- (x) Transport
- ( ) Internet
- ( ) Network Access
> Transport - that's TCP versus UDP, and both get a full lesson later in this subject.
:::

::: remember
The rest of this subject maps onto these four layers. IP Addressing and Routing are the Internet layer. TCP and UDP are Transport. HTTP, HTTPS, DNS, FTP and SMTP are all Application. If you keep the four-layer picture in mind, every remaining lesson has an obvious place to sit.
:::

::: behind
The decentralised philosophy here isn't unique to networking - it recurs whenever a system has to survive the loss of any single participant. Git's distributed model, covered in this platform's Git & GitHub subject, makes the same bet for the same reason: no central copy means no copy whose loss is fatal.
:::`,
  },

  "ip-addressing": {
    concept: `## Every Device Needs An Address

::: story
A postal system can carry anything anywhere, and it is useless without addresses. "Deliver this to the tall house" doesn't scale past a village.

An **IP address** is the internet's addressing scheme: a unique number identifying a device on a network, so data knows where to go.
:::

This is the Network/Internet layer from the last two lessons, made concrete.

## Four Billion Wasn't Enough

::: cards
IPv4 :: 32-bit, written as four numbers 0-255 separated by dots - 192.168.1.1. About 4.3 billion possible addresses.
IPv6 :: 128-bit, written as groups of hex digits - 2001:0db8:85a3::8a2e:0370:7334. An address space so large it is expected to last indefinitely.
:::

::: didyouknow
4.3 billion sounded absurd in the 1980s, when a computer was a room and the idea of one per person was fantasy. Then came phones - two or three addresses per person - followed by televisions, doorbells, watches and light bulbs. IPv4 didn't run short because the estimate was careless. It ran short because the *category* of thing that needs an address changed.
:::

## Public, Private, And The Trick That Bought Time

::: cards
Public IP :: Globally unique and reachable from anywhere on the internet. Your router has one.
Private IP :: Only meaningful inside one local network - the 192.168.x.x and 10.x.x.x ranges. Deliberately reused across millions of unrelated networks, because nothing outside can address them directly.
:::

::: flow
Your laptop (private 192.168.1.5) -> Router (public 203.0.113.42) -> The internet
:::

**NAT** - Network Address Translation - is what makes that arrow work: the router rewrites outbound traffic to come from its single public address and remembers enough to route the replies back to the right device.

::: checkpoint
Right now, thousands of other homes have a device at exactly 192.168.1.5. Why is that not a catastrophe?
- ( ) Because those addresses are assigned in different countries
- (x) Because private addresses are only meaningful inside their own network and are never routed on the internet
- ( ) Because the router encrypts the address
- ( ) It is a conflict, but routers detect and fix it
> Nothing outside your network can address 192.168.1.5 at all, so there's nothing for the duplicates to collide with. It's the same reason thousands of buildings can each have a "Room 101".
:::

::: behind
**Subnetting** divides one larger address range into smaller logically separate sub-networks. A company might put employee devices on one subnet and guest WiFi on another - so guest traffic is structurally separated from internal systems rather than merely asked politely to behave.

That structural separation is a security tool as much as an organisational one, which is why subnetting shows up in security architecture discussions and not only in addressing ones.
:::`,
  },

  "routing": {
    concept: `## Nobody Knows The Whole Route

::: story
A letter posted in Chennai for a house in Oslo is not handed to someone who knows the way to Oslo.

It's handed to someone who knows it should go to the international sorting office. They hand it to someone who knows it should go on a flight to Europe. Eventually someone knows the street.

No single participant knows the whole route. Each one only knows the next step - and that's sufficient.
:::

**Routing** is deciding the path data takes across interconnected networks. A **router** makes that decision, for one hop, based on the packet's destination IP address.

::: flow
Your device -> Router A -> Router B -> Router C -> 8.8.8.8
:::

Each router consults its **routing table** - a list of known destination ranges and which direction to forward matching traffic - and forwards the packet one step onward. Then the next router does the same thing again.

::: checkpoint
A router receives a packet for an address that matches no entry in its routing table. What does it do?
- ( ) Broadcasts it to every connected network
- (x) Forwards it to its default route, or drops it if there isn't one
- ( ) Returns it to the sender to be re-addressed
- ( ) Stores it until a matching route appears
> Most routers have a default route - "anything I don't recognise, send that way" - which is how a home router handles the entire internet with a tiny table. With no default and no match, the packet is dropped.
:::

## The Route Is Not Fixed

::: story
Your traffic to the same server may take a different path today than it took yesterday.

Routers continuously exchange information about network conditions. If a link becomes congested or fails outright, traffic gets rerouted around it - often without either endpoint noticing anything happened at all.
:::

::: remember
That adaptability is where the internet's resilience actually comes from. It isn't that individual links are reliable - they aren't. It's that no single link is required, and the system re-decides constantly.
:::

::: mistake
Routing and switching get conflated constantly, and the distinction is worth fixing now because the next lesson depends on it. A **router** moves traffic *between* networks using IP addresses. A **switch** delivers traffic *within* one local network using MAC addresses. Different addresses, different scope, different job.
:::

::: behind
**BGP** - Border Gateway Protocol - is what holds internet-wide routing between large networks together, and it runs on mutual trust: networks announce which address ranges they can reach, and others believe them.

That trust is a real weakness. A misconfigured or malicious announcement can pull traffic meant for someone else's network toward yours - **BGP hijacking**. Several major internet outages have traced back to a single bad announcement at one provider, which is a striking amount of global stability resting on everyone announcing honestly.
:::`,
  },

  "switching": {
    concept: `## The Last Hop

::: story
Routing got the letter to the right building. Something still has to get it to the right desk.

That's a different job with different information. The street address is irrelevant now; what matters is which floor and which desk - and whoever does it needs to have learned the building's layout.
:::

**Switching** delivers data to the correct device *within* one local network. It works at the Data Link layer, using **MAC addresses** - a permanent hardware identifier burned into each network interface, unlike an IP address, which is logical and reassignable.

## How A Switch Learns The Building

::: timeline Learning by watching
A device sends its first frame :: The switch sees traffic arriving on a physical port with a source MAC address attached.
The switch takes a note :: "MAC AA:BB:CC:11:22:33 is reachable via port 1." Nobody configured this; it inferred it.
Future traffic is targeted :: Anything addressed to that MAC goes out port 1 only - not to every other device on the network.
:::

::: didyouknow
The device it replaced, a **hub**, had no table and no learning. Every frame went to every port, and every machine received traffic meant for its neighbours and was trusted to ignore it. A switch is faster because it sends less - and incidentally more private, because your neighbour's traffic no longer arrives at your network card at all.
:::

::: checkpoint
Your laptop and your phone are both on your home WiFi, and you copy a file between them. Does that traffic reach the internet?
- ( ) Yes - all traffic goes through your ISP
- (x) No - it's switched locally between the two devices and never leaves the network
- ( ) Only if the file is larger than one packet
- ( ) Yes, but it's encrypted first
> Local delivery is switching's whole job. The traffic never touches the routing path out to your ISP, which is why local transfers are fast and don't count against a data cap.
:::

::: remember
The switch/router distinction one more time, because interviewers ask it constantly: **switch, within one network, MAC addresses. Router, between networks, IP addresses.**

And your home "wireless router" is both devices in one box. It switches traffic between your phone and your laptop, and separately routes traffic bound for the internet out through your ISP.
:::

::: behind
**VLANs** - Virtual LANs - let one physical switch be divided into several logically isolated networks, even though every device is plugged into the same hardware.

A company can keep finance traffic isolated from guest WiFi without buying a second switch, because the separation is enforced in the switch's own configuration rather than by physical wiring.
:::`,
  },

  "dns": {
    concept: `## Nobody Remembers 142.250.80.46

::: story
You type google.com. No connection is ever made to a name - every connection needs an IP address.

Something has to turn one into the other, every single time, before anything else can happen. It's the phonebook lookup you never notice doing.
:::

**DNS** - the Domain Name System - translates human-readable domain names into IP addresses. It runs before essentially every other network operation on this page.

## Following A Lookup

::: timeline Resolving google.com from cold
Check the local cache :: Has this device looked this up recently? If so, stop here - this is the common case and it's why most lookups cost nothing.
Ask a resolver :: Usually your ISP's, or a public one like 8.8.8.8.
Resolver asks a root server :: Which points it toward the servers responsible for .com.
Resolver asks the .com TLD server :: Which points it toward the servers authoritative for google.com.
Resolver asks the authoritative server :: Which returns the actual IP address.
Answer returned and cached :: Your device gets the address, and the resolver keeps a copy so the next asker skips most of this.
:::

::: checkpoint
The first visit to a brand-new site feels slightly slower than the second. Which part of that is DNS?
- ( ) DNS is not involved in page load speed
- (x) The first visit walks the full resolution chain; the second reads a cached answer
- ( ) The second visit skips DNS entirely and forever
- ( ) DNS is slower on first visits by design
> The full chain on a cold lookup involves several round trips to different servers. Cached, it's one local read. Note the cache does expire - "forever" is wrong, and how long it lasts is set per record.
:::

::: didyouknow
Caching happens at several points along that chain, including at resolvers shared by thousands of people. Which means your "first" visit to a popular site is often served from a cache warmed by a stranger asking the same question minutes earlier.
:::

::: behind
DNS was designed for a friendlier internet than the one it runs on, and it shows.

**Cache poisoning** (or DNS spoofing) is an attack that tricks a resolver into caching a *wrong* IP for a legitimate domain - quietly sending everyone who trusts that resolver to an attacker's server while the address bar still says the right thing.

**DNSSEC** adds cryptographic signatures to DNS responses so a resolver can verify an answer really came from the authoritative source. Note what it does and doesn't do: it authenticates the answer, it doesn't encrypt the question.
:::`,
  },

  "dhcp": {
    concept: `## Nobody Configures Their Phone's IP Address

::: story
Every device on a network needs its own address. Imagine assigning them by hand: every phone, laptop, television and visitor's device, each one typed in, each one checked against a list so no two match.

Now imagine getting one wrong. Two devices with the same address, and traffic for one arrives at the other, intermittently, in a way that looks like a hardware fault.
:::

**DHCP** - Dynamic Host Configuration Protocol - makes this disappear. A device joining a network asks for an address and is given a valid, unused one, with no human involved.

## DORA

::: timeline The four-step exchange
Discover :: The new device broadcasts to the network - "is there a DHCP server that can give me an address?"
Offer :: A DHCP server replies with a specific available address.
Request :: The device formally asks to use that offered address.
Acknowledge :: The server confirms the assignment, with a lease time attached. The device can now use it.
:::

This whole exchange finishes in a fraction of a second, every time you join a WiFi network.

::: remember
The acronym is worth holding - **D**iscover, **O**ffer, **R**equest, **A**cknowledge - because interviewers ask for the sequence in order, and the middle two are easy to swap under pressure. The device discovers, the server offers, the device requests, the server acknowledges. Client, server, client, server.
:::

## Why Addresses Are Leased, Not Given

::: story
A café's router has a pool of a few hundred addresses and serves thousands of customers a month.

That works because nobody keeps their address. It's a **lease** with an expiry: renew it while you're there, and lose it when you leave. Tomorrow's customers get the addresses today's customers walked out with.
:::

::: checkpoint
A device disconnects and stays away past its lease expiry. What happens to its address?
- ( ) It's reserved for that device permanently
- (x) It returns to the pool and can be handed to a different device
- ( ) It's deleted and never reused
- ( ) The device keeps it and can resume using it any time
> Back in the pool. Which is also why the address your laptop had last week may belong to someone else's tablet today - and why you shouldn't hard-code a device's DHCP address anywhere that matters.
:::

::: behind
Unless you ask for the opposite. A **DHCP reservation** tells the server to always hand one specific device - identified by the MAC address from the Switching lesson - the same address every time.

You get DHCP's convenience with a predictable address, which is what a printer or a home server needs in order to be findable at the same place tomorrow.
:::`,
  },

  "http": {
    concept: `## The Protocol, Seen From The Network

::: story
This platform's REST APIs subject covers HTTP from the application side - methods, status codes, designing endpoints.

This lesson asks a narrower question: where does HTTP sit in the stack you've just spent six lessons building, and what does that position mean for its safety?
:::

**HTTP** is an Application-layer protocol - the top of the TCP/IP model - running on top of TCP.

::: flow
HTTP request -> TCP (reliable delivery) -> IP (routing) -> the wire
:::

Which means every HTTP request you've ever made was leaning on TCP's ordered reliable delivery underneath, and on DNS, IP addressing and routing before that to find the server at all. HTTP itself only defines what the *message* looks like.

::: checkpoint
HTTP relies on TCP rather than UDP. Why does that matter for a web page?
- ( ) Because UDP is not supported by browsers
- (x) Because a page with missing or reordered bytes is not a page
- ( ) Because HTTP messages are too large for UDP
- ( ) Because UDP cannot carry text
> Ordered, complete delivery. Half an HTML document, or one with its bytes shuffled, is useless in a way that half a second of dropped audio isn't - which is exactly the distinction the TCP and UDP lessons build on.
:::

## The Part Worth Being Alarmed About

::: story
HTTP traffic travels as plain text.

Not weakly encoded. Not obscured. Plain text - as in, anyone positioned to observe the traffic between your device and the server reads it exactly as you wrote it, including the contents of a login form, with no decoding effort of any kind.

On shared public WiFi, "positioned to observe" means anyone else in the café.
:::

::: mistake
The instinct that a password field is somehow protected because it renders as dots on screen is completely wrong, and it's a genuinely common misunderstanding. The dots are a display choice in your browser. The bytes on the wire are the password.
:::

::: remember
This single fact is the entire motivation for the next lesson. HTTPS is not a different protocol - it is this exact HTTP, wrapped in an encryption layer, specifically to close this hole.
:::

::: behind
**HTTP/2** and **HTTP/3** address performance rather than security.

HTTP/2 introduced **multiplexing**: many requests and responses sharing one TCP connection concurrently, instead of queueing or opening a new connection per request.

HTTP/3 goes further and abandons TCP for UDP, to escape **head-of-line blocking** - where one lost packet stalls everything queued behind it, even unrelated data. Rebuilding reliability on top of UDP to avoid a TCP limitation is a strange-sounding move that makes sense once you've read the UDP lesson.
:::`,
  },

  "https": {
    concept: `## The Same Letter, In A Sealed Envelope

::: story
The previous lesson left a login form travelling across a café's WiFi in plain text.

**HTTPS** is the fix, and it is less dramatic than it sounds: the same HTTP, wrapped in an encryption layer called **TLS**, applied before anything reaches the network.

Same letter. Sealed envelope. And, importantly, a way to check the envelope came from who it claims to.
:::

## The Handshake Before The Conversation

::: timeline What happens before any HTTP is sent
Agree on algorithms :: Client and server settle on which encryption methods they'll both use.
Server presents its certificate :: Proving it is who it claims to be. The client verifies it against the certificate authorities it trusts.
Exchange a key :: Asymmetric encryption is used briefly, to safely agree on a temporary symmetric key.
Switch to symmetric :: The rest of the session uses that much faster symmetric key for the actual data.
:::

::: reveal Why bother with two kinds of encryption?
Because they're good at different things.

Asymmetric encryption solves an impossible-sounding problem: two parties who have never met agreeing on a secret, in public, with an eavesdropper watching the whole exchange. That's remarkable, and it's also computationally expensive.

Symmetric encryption is far faster, but requires both sides to already share a secret key - which is precisely the thing they didn't have.

So TLS uses each for what it's good at: asymmetric briefly, to establish a shared secret, then symmetric for the bulk of the data. Neither could do the job alone.
:::

## What A Padlock Actually Claims

A **certificate** is issued by a **Certificate Authority** and proves that this server is the legitimate holder of this domain name. Your browser ships with a list of CAs it trusts; a certificate signed by one of them earns the padlock.

::: mistake
Clicking through a certificate warning is the one habit worth deliberately unlearning. That warning is not pedantry about an expired date - it is the exact mechanism designed to catch someone impersonating the site you asked for.

Encryption alone doesn't help you if you've encrypted a conversation with an attacker. The certificate check is what establishes *who you're talking to*, and dismissing it discards the half of HTTPS that makes the other half worth having.
:::

::: checkpoint
An attacker on your network intercepts your HTTPS traffic and presents their own certificate for your bank's domain. What stops the attack?
- ( ) The encryption prevents interception entirely
- (x) No trusted CA will sign a certificate for a domain they don't control, so the browser rejects it and warns you
- ( ) The bank detects the attacker and closes the connection
- ( ) Nothing - HTTPS cannot defend against this
> They can intercept traffic all they like; what they cannot do is produce a certificate for that domain signed by a CA your browser trusts. Which is why the warning is the defence, and why ignoring it is what completes the attack.
:::

::: behind
**Certificate pinning** goes a step further for applications with a small, known set of servers: the app hard-codes the exact certificate or public key it expects and rejects anything else - *even* a certificate correctly signed by a normally-trusted CA.

The threat that justifies it is a CA itself being compromised or coerced into issuing a fraudulent certificate. Pinning means the app doesn't have to trust the entire CA system, only one specific key.
:::`,
  },

  "ftp": {
    concept: `## Built For One Job, Before The Web

::: story
FTP predates HTTP. It was built when moving a file between two machines was itself the task, not an incidental part of loading a page.

That focus shows: directory listings, navigation, resuming an interrupted transfer - features HTTP had no reason to care about, because HTTP was designed to fetch documents rather than manage a filesystem.
:::

**FTP** - File Transfer Protocol - is an Application-layer protocol built specifically for transferring files.

## Two Connections, Not One

::: cards
Control connection :: Carries commands - list files, change directory, start this transfer. Stays open and responsive.
Data connection :: Carries the file contents only, and nothing else.
:::

::: remember
The reason for splitting them is worth understanding rather than memorising: a large slow transfer would otherwise monopolise the conversation. With a separate control channel, you can still ask questions and get status while the bytes are moving.
:::

## Why You Shouldn't Use It

::: mistake
Plain FTP transmits your username and password as plain text - the identical vulnerability the HTTP lesson described, with higher stakes, since these are credentials for a filesystem rather than the contents of one page.

Anyone observing the network reads your FTP password directly.
:::

::: cards The replacements
SFTP :: SSH File Transfer Protocol. A different protocol entirely, running over an encrypted SSH connection - the same SSH covered in this platform's Linux Fundamentals subject.
FTPS :: FTP itself, wrapped in TLS. Directly analogous to how HTTPS wraps HTTP.
:::

::: checkpoint
SFTP and FTPS both secure file transfer. How are they related?
- ( ) They're two names for the same protocol
- (x) They're genuinely different protocols - SFTP runs over SSH, FTPS is FTP wrapped in TLS
- ( ) SFTP is the newer version of FTPS
- ( ) FTPS runs over SSH and SFTP uses TLS
> Different protocols solving the same problem by different routes. The names being nearly identical is an unfortunate accident of history, and mixing them up is common enough that interviewers use it as a check.
:::

::: behind
FTP's two-connection design causes real trouble for firewalls and NAT. Because the data connection's port can be negotiated dynamically during the control conversation, a firewall has to *understand FTP specifically* to know which port to permit - rather than allowing one fixed predictable port the way simpler protocols need.

That's a recurring theme worth noticing: a design choice that was elegant for its own purposes becomes an ongoing tax once the environment around it changes.
:::`,
  },

  "smtp": {
    concept: `## Sending Is Not Receiving

::: story
Email feels like one thing and is at least two.

**SMTP** handles sending and relaying. Reading your inbox is a separate job handled by entirely different protocols - **IMAP**, or the older **POP3**. Assuming one protocol does both is the most common misunderstanding here.
:::

## An Email's Actual Journey

An email doesn't travel from your device to the recipient's inbox. It hops.

::: timeline From your outbox to their inbox
Your client to your mail server :: Over SMTP. Your outgoing server takes responsibility for the message.
Your server looks up where to send it :: Querying DNS for the recipient domain's MX record - the record naming which server handles that domain's mail.
Your server to their server :: Over SMTP again. This is the relay step, and it's why SMTP is described as a relay protocol.
Their server stores it :: The message sits in the recipient's mailbox.
They retrieve it later :: Over IMAP or POP3 - a different protocol, whenever they next check.
:::

::: checkpoint
Your email to a colleague bounces two hours after you sent it. What does the delay tell you?
- ( ) The message was never sent
- (x) It got at least as far as another server, which accepted it and then failed to deliver onward
- ( ) Your mail client is misconfigured
- ( ) The recipient deleted it
> An immediate rejection comes from your own server. A delayed bounce means something downstream accepted responsibility, tried, and gave up - so the failure is somewhere along the relay chain rather than at your end.
:::

::: didyouknow
This multi-hop structure explains why bounce messages are so varied and so cryptic. They're generated at different points by different servers run by different organisations, each describing a failure in its own words - which is why "550 5.1.1 unknown recipient" and "delivery delayed, will retry" feel like they came from different systems. They did.
:::

::: behind
Original SMTP had no way to verify that a sender was who they claimed to be, which made forging the "from" address trivial. Three mechanisms were bolted on to fix that:

**SPF** publishes which servers are permitted to send mail for a domain. **DKIM** cryptographically signs outgoing messages. **DMARC** ties the two together and tells receivers what to do when a check fails.

All three are published as DNS records, and mail failing them is commonly marked as spam or rejected outright. It's the same identity-verification theme as TLS certificates, arriving late to a protocol that didn't originally ask for it.
:::`,
  },

  "tcp": {
    concept: `## Registered Post

::: story
Two ways to send something important.

Drop it in a postbox and hope. Or send it registered: the recipient signs, you get confirmation, and if it goes missing the system notices and does something about it.

The second is slower and involves more paperwork. You choose it when arriving matters more than arriving quickly.
:::

**TCP** is registered post: a Transport-layer protocol providing **reliable, ordered, complete** delivery. UDP, next lesson, is the postbox.

## The Three-Way Handshake

Every TCP connection opens with the same three steps.

::: timeline Establishing a connection
SYN :: The client sends a synchronise request. "I'd like to open a connection."
SYN-ACK :: The server acknowledges it and sends its own synchronise request back. "Acknowledged, and likewise."
ACK :: The client acknowledges the server's. "Confirmed."
:::

Only now is the connection established, and only now can application data - an HTTP request, for instance - start flowing.

::: remember
Three steps, not two, and the reason is that *both* directions need establishing. Each side has to know the other is ready and has to agree on starting sequence numbers. Two steps would confirm one direction only.
:::

## How Loss Is Noticed

Every byte gets a **sequence number**. The receiver sends back **acknowledgements** confirming what it has received.

::: cards The consequences of that pairing
Loss is detected :: An acknowledgement that never arrives means the data probably didn't either. The sender retransmits automatically.
Order is restored :: Sequence numbers let the receiver reassemble data in the right order, however it arrived.
Duplicates are discarded :: A retransmission that turns out to be unnecessary is recognised and dropped.
:::

::: checkpoint
A packet is lost mid-download. What does your application have to do about it?
- ( ) Detect the gap and re-request the missing bytes
- (x) Nothing - TCP retransmits it before the application ever sees a gap
- ( ) Restart the download
- ( ) Switch to UDP
> Nothing at all. This is TCP's real gift: the application is handed a clean ordered byte stream and never learns that anything went wrong. Every retry mechanism you didn't have to write is this.
:::

::: behind
That reliability has a price, and it's mostly paid in latency.

The handshake costs a full round trip *before* any data moves - noticeable when the server is far away and the request is small. Acknowledgements add ongoing overhead. And a lost packet stalls everything behind it while it's recovered, even data that had already arrived safely.

That last cost is head-of-line blocking, and it's exactly why HTTP/3 chose to rebuild reliability on UDP instead. Which is the next lesson.
:::`,
  },

  "udp": {
    concept: `## When Late Is Worse Than Missing

::: story
You're on a video call and one packet - a twentieth of a second of audio - goes missing.

TCP would notice and fetch it. That takes a round trip. By the time the recovered audio arrives, the conversation has moved on by several words, and the correct data is now worse than useless: playing it would mean either a stutter or speech out of order.

The right response to that lost packet is to not care about it.
:::

**UDP** offers none of TCP's guarantees, and that's the point: no handshake, no guaranteed delivery, no guaranteed order. A lost packet is simply gone.

::: cards The trade, stated plainly
TCP :: Handshake required. Guaranteed delivery and order. Higher overhead and higher latency. Right for pages, downloads, email - anything where correctness beats speed.
UDP :: No handshake, send immediately. No guarantees at all. Lower overhead and lower latency. Right for live audio and video, gaming, DNS queries.
:::

::: remember
The framing that makes UDP click: for real-time data, **a late answer is a wrong answer**. TCP optimises for eventually correct. UDP optimises for currently useful. Neither is the better protocol; they answer different questions.
:::

## Where It's The Right Choice

::: cards
Live video and voice :: A dropped frame is a blip. A stutter while it's recovered is worse, and everyone has heard the difference.
Online multiplayer games :: The other player's position *now* matters. Their position 200ms ago, reliably delivered, is not worth having.
DNS queries :: A single small question and answer. If it's lost, asking again is cheaper than a handshake would have been in the first place.
:::

::: checkpoint
A game sends your character's position 60 times a second over UDP. One update is lost. What's the consequence?
- ( ) The game desynchronises and must reconnect
- (x) Essentially nothing - the next update supersedes it 16ms later
- ( ) The position is permanently wrong
- ( ) The client requests a retransmission
> The next update makes the lost one irrelevant. When data is a continuous stream of "here's the current state", losing one sample costs almost nothing - which is precisely the property that makes UDP appropriate.
:::

::: mistake
Reading UDP as a cruder, older, or unfinished TCP gets this backwards. It isn't missing features; it declines to provide them, because for some workloads those features are the problem. Choosing TCP reflexively for everything is the actual error.
:::

::: behind
**QUIC** is the interesting modern twist: a transport protocol running over UDP that rebuilds much of TCP's reliability on top - and it's what HTTP/3 uses.

Why go the long way round? To escape head-of-line blocking. QUIC carries multiple independent streams in one connection, each handling its own losses, so one lost packet stalls only its own stream instead of everything.

Starting from UDP's blank slate turned out to be easier than fixing that inside TCP - a protocol too widely deployed to change.
:::`,
  },

  "sockets": {
    concept: `## Where Code Meets The Network

::: story
Everything so far has been machinery. This lesson is the handle on it - the interface application code actually touches.
:::

A **socket** is one endpoint of a network connection, identified by an **IP address** plus a **port number**: which device, and which program on that device.

\`192.168.1.10:443\` names one socket - that machine, on the port conventionally used for HTTPS.

## Why Ports Exist

::: story
One machine can run a web server, a mail server and an SSH server at once. All three share a single IP address.

So when traffic arrives at that address, something has to decide which program it's for. The alternative - a separate IP address per program - would have exhausted IPv4 long before phones ever got the chance to.
:::

::: cards Well-known ports worth knowing
22 - SSH :: Remote shell access. The same SSH from this platform's Linux Fundamentals subject.
80 - HTTP :: Unencrypted web traffic.
443 - HTTPS :: Encrypted web traffic. The overwhelming majority of what you browse.
:::

These are conventions, not rules - a service can listen anywhere it's configured to. But convention is why a browser can be pointed at a bare domain name and know where to knock.

## One Listening Port, Thousands Of Clients

::: story
If a server listens on port 443 and ten thousand people connect to port 443, how does it keep them apart?

Because a connection isn't identified by the server's address alone. It's identified by all four values together: source IP, source port, destination IP, destination port.

Every client has a different source IP and port. So every connection is a distinct four-tuple, even though one of the four values is identical across all of them.
:::

::: checkpoint
You open two browser tabs to the same website. Both connect to the same server IP on port 443. How does the server distinguish them?
- ( ) It can't - they share one connection
- (x) Each tab's connection uses a different source port on your machine, making the four-tuple unique
- ( ) By reading a session cookie
- ( ) Your machine assigns each tab a different IP address
> Different source ports, assigned by your own operating system. Cookies distinguish *sessions* at the application layer - but the transport layer has already told them apart, before any HTTP is read.
:::

::: behind
The TCP/UDP distinction shows up here too, exactly as you'd expect from the last two lessons.

A **TCP socket** represents an established stateful connection - the handshake happened, and the operating system tracks that connection's state. A **UDP socket** is connectionless: no handshake, no tracked connection, just individual packets sent and received through one IP-and-port combination.
:::`,
  },

  "firewalls": {
    concept: `## The Gatekeeper

::: story
A building can be secured two ways.

Lock every individual office, and trust that nobody left theirs open. Or put someone on the door who checks everyone coming in and out - and *then* also lock the offices.

The second is more work, and it's the one that survives someone forgetting.
:::

A **firewall** monitors and controls traffic entering and leaving a network or device, according to predefined rules. Those rules filter on exactly the attributes this subject has spent ten lessons establishing: source IP, destination port, protocol.

## Deny By Default

::: cards Two ways to write the rules
Allow by default :: Everything is permitted unless a rule blocks it. You must anticipate every threat in advance - which means every threat you haven't thought of yet is already allowed in.
Deny by default :: Nothing is permitted unless a rule allows it. You must enumerate what you need - a finite list you actually know.
:::

::: remember
Deny-by-default wins on an asymmetry rather than a preference. The set of things you *need* is small, knowable and stable. The set of things that could hurt you is unbounded and grows without asking you.

Any policy requiring you to enumerate the second set is a policy that fails quietly, in the gap between the last threat you thought of and the next one that exists.
:::

::: checkpoint
A web server should accept HTTPS from anywhere and SSH only from the office. Under deny-by-default, how many rules?
- ( ) One - block everything except those two
- (x) Two allow rules; the deny is already the default
- ( ) Three - two allows plus an explicit final deny
- ( ) Four - one inbound and one outbound per service
> Two allows. Not needing a final catch-all deny is exactly the property that makes this posture safe: the absence of a rule is already a refusal, so forgetting to write something can't accidentally permit it.
:::

## Two Places To Stand

::: cards
Network-level :: A dedicated appliance, or your home router's built-in firewall. Filters at the network's boundary, before traffic reaches any device inside.
Host-based :: Built into an operating system - Windows Firewall, or iptables and ufw on Linux. Protects that one machine, including against traffic already inside the network.
:::

Well-run environments layer both. The network firewall assumes traffic inside is safe; the host firewall declines to assume that - which matters precisely when something already got in.

::: behind
A **stateful** firewall tracks the state of ongoing connections, so it recognises an inbound packet as a legitimate reply to a connection your device opened, and allows it without needing an explicit inbound rule.

A **stateless** firewall evaluates each packet alone, with no memory. That's both less secure - it can't distinguish a reply from an unsolicited connection attempt - and far more annoying to configure, since every expected reply needs a rule of its own.
:::`,
  },

  "network-security": {
    concept: `## Three Attacks, And What You Already Built

::: story
This lesson doesn't introduce new machinery. It takes the machinery from this whole subject and asks what it was defending against all along.
:::

These are network-level attacks, distinct from the application-level ones - SQL injection, XSS - covered in this platform's Security Fundamentals subject.

## Watching, Interfering, Overwhelming

::: cards
Packet sniffing :: Passively capturing traffic as it passes. An attacker on the same segment - shared public WiFi - reads anything unencrypted. Defended by HTTPS/TLS: captured traffic is unreadable without the key.
Man-in-the-middle :: Actively inserting yourself between two parties, able to read *and modify* traffic while both believe they're talking directly. Defended by TLS certificate verification: the attacker cannot produce a valid certificate for the domain.
DDoS :: Flooding a target with traffic from many distributed sources until it can no longer serve legitimate requests. Defended by rate-limiting, traffic filtering, and CDN-scale mitigation.
:::

::: remember
Sniffing and man-in-the-middle sound similar and differ in one decisive way: **sniffing reads, MITM rewrites.**

Encryption alone defeats the first completely - unreadable traffic is unreadable. It does *not* defeat the second, because an attacker who successfully impersonates the server holds the key. That's the gap certificate verification fills, and it's why HTTPS needs both halves.
:::

::: checkpoint
A DDoS attack is hitting a server. Why doesn't a firewall solve it?
- ( ) Firewalls cannot inspect that kind of traffic
- (x) The requests may be individually legitimate - the problem is volume, and the pipe is saturated before the firewall's decision matters
- ( ) Firewalls only filter outbound traffic
- ( ) It does solve it, if configured correctly
> Volume is the weapon. A firewall can drop traffic all day and the link into it is already full - which is why serious mitigation happens upstream, at providers with enough capacity to absorb the flood before it reaches you.
:::

## The Thread Running Through All Of It

::: story
Notice that no single defence in this lesson covers another one's job.

Encryption protects data in transit and does nothing about volume. Firewalls control what may arrive and cannot read what's inside an encrypted session. DDoS mitigation absorbs floods and cares nothing for content.

Each is complete for its own threat and useless for the others.
:::

::: remember
That's **defence in depth**, the same principle from this platform's Security Fundamentals subject, applied at the network layer: layers that fail independently, so no single failure is total.

And it cuts across layers too. A perfectly encrypted, firewalled connection offers no protection whatsoever against a SQL injection running on top of it. Network security and application security are not competing disciplines - they're two layers of one posture, and excellence at one buys nothing at the other.
:::

::: behind
Worth knowing where the real-world weak point usually is: not the cryptography.

TLS is not commonly broken. Certificates are misconfigured, expiry dates are missed, warnings are clicked through, firewall rules are left permissive after debugging, and mitigation is provisioned after the first outage rather than before.

The mathematics holds up. The operational discipline around it is what fails.
:::`,
  },

  "interview-questions": {
    concept: `## One Question That Contains The Whole Subject

::: story
Networking interviews are unusually predictable, and one question dominates them:

*"What happens when you type a URL into a browser and press enter?"*

It's asked constantly because it's almost impossible to answer well without genuinely understanding the stack. You cannot bluff a sequence. Either the steps come out in the right order, with the right protocol named at each one, or they don't.
:::

## The Answer, In Order

::: timeline Narrate it like this
DNS resolution :: The browser checks its cache, then queries a resolver, which walks root, TLD and authoritative servers to turn the domain into an IP address.
TCP three-way handshake :: SYN, SYN-ACK, ACK opens a connection to that IP on port 443.
TLS handshake :: Algorithms agreed, the server's certificate presented and verified, a symmetric key established.
HTTP request :: A GET travels over the now-encrypted connection.
Routing and switching :: The response crosses networks router by router, then reaches your device via local switching.
Render :: The browser parses the HTML, CSS and JavaScript it received.
:::

::: mistake
The most common way to fail this is a step out of order - describing the TLS handshake before DNS resolution.

It's worth seeing *why* that's wrong rather than just remembering the sequence: TLS is a handshake with a specific server, and until DNS resolves you don't know which machine to handshake with. The order isn't convention. Each step needs the previous one's output.
:::

::: cards Also reliably asked
Place a concept at its layer :: Given IP, MAC, HTTP, TCP - name the layer. Fast, factual, and a warm-up for something harder.
TCP vs UDP :: The trade, plus two concrete cases for each, plus why a late answer can be worse than a missing one.
HTTP vs HTTPS :: That HTTPS is HTTP wrapped in TLS, that plain HTTP is readable on the wire, and that the certificate is what identifies the server.
Switch vs router :: Within a network on MAC addresses, versus between networks on IP addresses.
:::

::: checkpoint
You finish the URL walkthrough well, and the interviewer asks how a CDN changes it. What are they doing?
- ( ) Testing whether your first answer was memorised
- (x) Extending the question - checking you can reason about the sequence rather than only recite it
- ( ) Changing topic
- ( ) Signalling your answer was wrong
> Extending it, and it's a good sign - they're only asking because the base answer landed. The short version: DNS returns an edge server near you instead of the origin, so the TCP and TLS handshakes happen over a much shorter round trip.
:::

::: interview
Narrate the URL sequence out loud until it's fluent - recorded, if you can stand it. It's the highest-return preparation in this entire subject, because it exercises every lesson at once and exposes exactly which step you skip when nobody is prompting you.
:::

::: behind
Senior rounds push on the same question rather than replacing it.

**HTTP keep-alive** reuses one TCP connection for many requests, avoiding a fresh handshake each time - which matters enormously when a page pulls sixty assets.

**DNS-based load balancing** returns different addresses to different clients, so the resolution step becomes a routing decision.

Both are extensions of the sequence you already know, which is why the base answer is worth making solid before reaching for them.
:::`,
  },
};
