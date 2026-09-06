// GATE Computer Networks - authored lesson content. Follows the authoring
// rules documented at the top of general-aptitude.mjs.

export const COMPUTER_NETWORKS = {

  // ---------------- Layering and Switching ----------------

  "principles-of-layering": {
    difficulty: "Easy",
    estimatedMinutes: 25,
    // Verified via YouTube oEmbed (2026-08-29) - real, publicly viewable.
    resources: [{
      kind: "video",
      title: "Layering in Computer Networks",
      url: "https://www.youtube.com/watch?v=FewtLNsjtRA",
      description: "Introduces the concept of layered network architectures and leads into the OSI reference model.",
    }],
    whatYoullLearn: [
      "Why networking is organized into layers at all, and what problem layering solves",
      "The OSI model's seven layers versus the TCP/IP model's four/five, and how they map onto each other",
      "Encapsulation: what actually happens to data as it moves down the stack",
      "Protocol Data Units (PDUs), and why each layer calls its data unit something different",
    ],
    prerequisites: [],
    concept: `## Layering: Isolating Complexity Behind Clean Interfaces

::: story
A network stack is organized into LAYERS, each solving one specific concern and exposing a clean interface to the layer above it - the physical layer worries about actual voltage/light signals, the transport layer worries about reliable delivery, and neither needs to know anything about how the other actually works internally. This separation is exactly what lets a web browser (application layer) work identically over WiFi, Ethernet, or a cellular connection (physical layer) without any changes.
:::

## OSI's Seven Layers vs TCP/IP's Practical Four

::: cards OSI (theoretical, 7 layers) top to bottom
Application, Presentation, Session :: (OSI splits these three; TCP/IP treats them as ONE combined Application layer in practice.)
Transport :: End-to-end delivery between processes (TCP/UDP).
Network :: Logical addressing and routing across networks (IP).
Data Link :: Framing and access to the physical medium within one network segment.
Physical :: Actual bits over the wire/air.
:::

::: mistake
Assuming the OSI model's seven layers are what's actually implemented in real networks. Real-world networking (the Internet) is built on the TCP/IP model, which COMBINES OSI's Application, Presentation, and Session layers into one practical Application layer - OSI is primarily a TEACHING/reference model, not literally what's running.
:::

## Encapsulation: Wrapping, Not Transforming

::: flow
1. Data starts at the Application layer :: The actual message/payload a user-facing program wants to send.
2. Each layer moving DOWN adds its own HEADER :: Transport wraps it with a TCP/UDP header, Network wraps THAT with an IP header, Data Link wraps THAT with a frame header (and often a trailer).
3. Nothing from a lower layer is ever re-interpreted by a higher one :: Each layer's header is meaningful only to its PEER layer on the receiving end - this is exactly what layering isolation means in practice.
4. On the receiving end, DECAPSULATION happens in reverse :: Each layer strips off and processes its own header, moving data UP the stack.
:::

## PDUs: Each Layer Names Its Own Data Unit

::: cards
Transport layer :: SEGMENT (TCP) or DATAGRAM (UDP).
Network layer :: PACKET.
Data Link layer :: FRAME.
Physical layer :: BIT (or symbol).
:::

::: checkpoint
As data moves DOWN the protocol stack from the Application layer toward the Physical layer, what happens to it at each layer?
- ( ) The data is compressed at every layer
- (x) Each layer adds its own header, wrapping the data further (encapsulation)
- ( ) Each layer removes information to make transmission faster
- ( ) The data is encrypted at every layer
- ( ) Nothing changes until the Physical layer
> This is encapsulation: each layer moving downward wraps the data with its own header (and sometimes trailer), without altering what the layers above already added - the receiving side reverses this exact process (decapsulation) layer by layer.
:::`,
    keyPoints: [
      "Layering isolates each networking concern behind a clean interface - a layer only needs to know how to talk to the layer directly above and below it.",
      "OSI has 7 layers (Application, Presentation, Session, Transport, Network, Data Link, Physical) - primarily a reference/teaching model. TCP/IP combines the top three into one practical Application layer.",
      "Encapsulation: each layer moving down adds its own header (wrapping, not transforming); decapsulation reverses this on receipt.",
      "PDU names differ per layer: segment/datagram (Transport), packet (Network), frame (Data Link), bit (Physical).",
    ],
    analogies: [
      "Layering is like sending a letter through a postal system: you write the letter (application data), put it in an envelope with a street address (transport/network headers), the postal service adds its own sorting labels (data link framing) - and each step only reads the label relevant to ITS job, never opening and re-reading the actual letter inside.",
    ],
    commonMistakes: [
      "Treating OSI's 7 layers as what's literally implemented in real Internet infrastructure, rather than recognising TCP/IP's practical 4-layer collapse.",
      "Confusing encapsulation with data transformation/compression - encapsulation only ADDS headers, it doesn't alter the payload itself.",
      "Mixing up PDU names across layers (calling a Network-layer PDU a 'frame', which is actually the Data Link layer's term).",
    ],
    memoryTricks: [
      "\"Segment, Packet, Frame, Bit\" - Transport down to Physical, one PDU name each, in that order.",
      "OSI has 7, TCP/IP has 4 (in practice) - TCP/IP just merges OSI's top 3 into one Application layer.",
    ],
    formulas: [],
    shortcuts: [
      "When a question names a specific PDU (segment, packet, frame), that name directly identifies which layer is being discussed - Transport, Network, or Data Link respectively.",
      "For an OSI-vs-TCP/IP mapping question, remember the collapse happens only at the TOP three layers - Transport, Network, Data Link, and Physical map directly across both models unchanged.",
    ],
    pyqRelevance: `Layering fundamentals (OSI vs TCP/IP layer count and mapping, PDU naming, encapsulation direction) are reliable early 1-mark GATE Computer Networks questions, often a warm-up before heavier protocol-specific numericals.`,
    interviewConnection: `Understanding layering and encapsulation is foundational for any network debugging discussion (e.g. reading a packet capture, where headers are literally nested exactly as encapsulation describes) and for explaining why a given networking bug belongs to a specific layer's concern.`,
    revisionSummary: `Layering isolates concerns behind clean interfaces. OSI: 7 layers (reference model). TCP/IP: 4 practical layers (top 3 OSI layers merged into one Application layer).

Encapsulation: each layer adds its own header moving down; decapsulation reverses it moving up. PDU names: segment/datagram (Transport), packet (Network), frame (Data Link), bit (Physical).`,
    shortNotes: {
      oneMinute: "Layering isolates concerns. OSI: 7 layers (reference). TCP/IP: 4 practical (merges OSI's top 3). Encapsulation: each layer adds a header going down; decapsulation reverses going up. PDUs: segment/datagram(Transport), packet(Network), frame(Data Link), bit(Physical).",
    },
    mcqs: [
      {
        question: "Which term describes the Protocol Data Unit at the Network layer?",
        options: ["Frame", "Segment", "Packet", "Bit"],
        correctIndex: 2,
        explanation: "The Network layer's PDU is called a packet - segment/datagram belongs to Transport, frame to Data Link, and bit to Physical.",
      },
    ],
    numericals: [],
  },

  "switching-circuit-packet-and-virtual-circuit": {
    difficulty: "Moderate",
    estimatedMinutes: 25,
    // Verified via YouTube oEmbed (2026-08-29) - real, publicly viewable.
    resources: [{
      kind: "video",
      title: "Switching Techniques in Computer Networks",
      url: "https://www.youtube.com/watch?v=-HlJ4psu5aU",
      description: "Covers circuit switching, packet switching, and virtual-circuit switching techniques.",
    }],
    whatYoullLearn: [
      "Circuit switching, and why it dedicates resources for an entire connection's duration",
      "Packet switching, and why it makes the opposite trade-off - no dedicated resources at all",
      "Virtual circuit switching as a deliberate middle ground between the two",
      "Comparing setup delay, resource utilization, and reliability across all three approaches",
    ],
    prerequisites: ["Principles of Layering"],
    concept: `## Three Ways To Move Data Through A Network

::: cards
Circuit switching :: A DEDICATED physical path is reserved for the ENTIRE duration of a connection (the classic telephone network model) - resources are guaranteed available, but sit IDLE (wasted) whenever the connection isn't actively transmitting.
Packet switching :: Data is broken into independent PACKETS, each routed independently, with NO dedicated resources reserved - efficient resource sharing, but no guarantee about delay or even that packets arrive in order.
Virtual circuit switching :: A LOGICAL (not physical) path is established once (a setup phase), and all packets for that connection follow the SAME path afterward - combining packet switching's resource sharing with a circuit-like consistent path.
:::

::: mistake
Assuming virtual circuit switching reserves PHYSICAL bandwidth the way true circuit switching does. It only establishes a fixed LOGICAL route (recorded in routing tables along the path) - the underlying physical links are still shared with other traffic, unlike genuine circuit switching's dedicated physical reservation.
:::

## Setup Delay, Utilization, Reliability: The Trade-offs

::: cards
Circuit switching :: HIGH setup delay (must establish the full dedicated path before ANY data flows). LOW utilization (idle time wastes reserved capacity). HIGH reliability once established (guaranteed bandwidth, no congestion-based loss).
Packet switching :: LOW (or no) setup delay - packets can start flowing immediately. HIGH utilization (shared resources, no reservation waste). Variable reliability - packets can be delayed, dropped, or arrive out of order.
Virtual circuit switching :: MODERATE setup delay (a setup phase is still needed, but no physical reservation). Better utilization than circuit switching (still shared). In-order delivery guaranteed along the established path (unlike plain packet/datagram switching).
:::

::: remember
Virtual circuit switching's key guarantee - packets arriving IN ORDER - comes specifically from every packet following the SAME established path, unlike pure (datagram-style) packet switching where different packets of the same connection could take genuinely different routes and arrive out of order.
:::

::: checkpoint
Why does circuit switching have poor resource UTILIZATION compared to packet switching, even though it guarantees reliable, consistent bandwidth?
- ( ) Circuit switching uses slower physical media
- (x) Dedicated resources sit idle whenever the connection isn't actively transmitting, since nothing else can use that reserved capacity
- ( ) Circuit switching only works for voice calls
- ( ) It has no relationship to utilization at all
> Circuit switching reserves resources for the ENTIRE connection duration regardless of whether data is actively flowing - any idle time (pauses in a phone conversation, for instance) is capacity that could have served other traffic but sits wasted instead, unlike packet switching's on-demand sharing.
:::`,
    keyPoints: [
      "Circuit switching: dedicated physical path for the whole connection - high setup delay, low utilization (idle time wasted), high reliability once established.",
      "Packet switching: independent packets, no dedicated resources - low setup delay, high utilization, variable reliability/ordering.",
      "Virtual circuit switching: a logical (not physical) fixed path established once - moderate setup delay, better utilization than circuit switching, guarantees in-order delivery along that path.",
      "Virtual circuit's in-order guarantee comes from every packet following the same established route, unlike pure packet (datagram) switching's independent per-packet routing.",
    ],
    analogies: [
      "Circuit switching is booking a private taxi for an entire evening (guaranteed available, but idle and wasted while you're inside a restaurant); packet switching is a shared ride-pooling service (efficient, but each trip might take a different route and arrive at unpredictable times); virtual circuit switching is a scheduled shuttle bus following one fixed route repeatedly, shared with others but consistent in path.",
    ],
    commonMistakes: [
      "Assuming virtual circuit switching physically reserves bandwidth like true circuit switching - it only fixes the logical PATH, not dedicated capacity.",
      "Assuming packet switching guarantees any ordering or delivery reliability - plain (datagram) packet switching provides neither by default.",
      "Underestimating circuit switching's setup delay cost, which must complete in full BEFORE any actual data transmission begins.",
    ],
    memoryTricks: [
      "\"Circuit: reserve everything, use it or waste it. Packet: reserve nothing, share everything. Virtual circuit: fix the ROUTE, still share the capacity.\" Three switching philosophies in one line each.",
      "Virtual circuit = the ordering guarantee of circuit switching's fixed path, with the resource-sharing efficiency of packet switching.",
    ],
    formulas: [],
    shortcuts: [
      "For a switching-comparison question, evaluate all three approaches along the SAME three axes every time (setup delay, utilization, reliability/ordering) - this consistent framework avoids missing a dimension.",
      "If a question mentions in-order delivery WITHOUT full physical bandwidth reservation, that's specifically describing virtual circuit switching, not plain packet switching or true circuit switching.",
    ],
    pyqRelevance: `Switching type comparison (circuit vs packet vs virtual circuit, along setup delay/utilization/reliability) is a recurring conceptual GATE question, often as a direct classification or trade-off comparison rather than a numerical.`,
    interviewConnection: `Understanding circuit vs packet switching trade-offs is foundational background for discussing why the modern Internet (packet-switched) handles bursty traffic efficiently but doesn't natively guarantee bandwidth the way a dedicated circuit (like an older telephone network) does - relevant to any QoS or network-architecture discussion.`,
    revisionSummary: `Circuit switching: dedicated physical path, high setup delay, low utilization (idle waste), high reliability once established.

Packet switching: independent packets, no dedication, low setup delay, high utilization, variable reliability/ordering.

Virtual circuit switching: fixed logical path (not physical reservation), moderate setup delay, better utilization than circuit switching, guarantees in-order delivery.`,
    shortNotes: {
      oneMinute: "Circuit switching: dedicated PHYSICAL path, high setup delay, low utilization (idle waste), reliable once set up. Packet switching: no dedication, low setup delay, high utilization, variable reliability/order. Virtual circuit: fixed LOGICAL path (shared capacity), moderate setup delay, guarantees in-order delivery.",
    },
    mcqs: [
      {
        question: "Which switching approach guarantees in-order packet delivery specifically because every packet follows the exact same established path?",
        options: ["Pure (datagram) packet switching", "Circuit switching only", "Virtual circuit switching", "None of these guarantee ordering"],
        correctIndex: 2,
        explanation: "Virtual circuit switching establishes one fixed logical path during setup, and every subsequent packet for that connection follows it - guaranteeing in-order arrival, unlike datagram-style packet switching where packets can take different routes.",
      },
    ],
    numericals: [],
  },

  "network-performance-metrics": {
    difficulty: "Moderate",
    estimatedMinutes: 30,
    // Verified via YouTube oEmbed (2026-08-29) - real, publicly viewable.
    resources: [{
      kind: "video",
      title: "Lec-98 : Bandwidth vs. Throughput vs. Latency | Computer Networks",
      url: "https://www.youtube.com/watch?v=cDVNU2j26Bs",
      description: "Compares bandwidth, throughput, and latency as core network performance metrics.",
    }],
    whatYoullLearn: [
      "Bandwidth vs throughput - two related but genuinely different measurements",
      "Latency's four components: propagation, transmission, queuing, and processing delay",
      "The bandwidth-delay product, and what it actually represents physically",
      "Computing total transfer time for a file, combining transmission and propagation delay correctly",
    ],
    prerequisites: ["Principles of Layering"],
    concept: `## Bandwidth vs Throughput: Capacity vs Actual Achieved Rate

::: mistake
Using "bandwidth" and "throughput" interchangeably. BANDWIDTH is the theoretical MAXIMUM capacity of a link (what it COULD carry). THROUGHPUT is the ACTUAL achieved rate in practice, which is always less than or equal to bandwidth due to congestion, protocol overhead, or other real-world limitations.
:::

## Latency's Four Components

::: cards
Propagation delay :: Time for a signal to physically TRAVEL across the medium - distance / propagation speed. Depends only on distance and the medium, NOT on data size or link bandwidth.
Transmission delay :: Time to actually PUSH all the bits of a message onto the link - message size / bandwidth. Depends on data size and bandwidth, NOT on distance.
Queuing delay :: Time a packet spends WAITING in a router/switch's buffer before being forwarded - depends entirely on current network congestion.
Processing delay :: Time a router takes to examine a packet's header and decide where to forward it - typically small, but real.
:::

::: remember
Propagation delay and transmission delay are frequently confused because both are "delay," but they depend on OPPOSITE factors: propagation depends on DISTANCE (not size), transmission depends on SIZE (not distance) - a short message sent across a very long distance can have transmission delay much smaller than propagation delay, and vice versa for a huge message sent a short distance.
:::

## The Bandwidth-Delay Product

::: story
Bandwidth x propagation delay gives the BANDWIDTH-DELAY PRODUCT - physically, this represents the MAXIMUM NUMBER OF BITS that can be "in flight" on the link at any instant, filling the entire pipe between sender and receiver before the first bit even arrives.
:::

::: remember
The bandwidth-delay product is exactly why a sender using a small, fixed window size can badly underutilize a high-bandwidth, high-delay ("long fat") link - if the window is smaller than the bandwidth-delay product, the sender is forced to pause and wait for acknowledgments instead of keeping the pipe continuously full.
:::

## Computing Total Transfer Time

::: flow
1. Compute transmission delay :: message size (bits) / bandwidth (bits per second).
2. Compute propagation delay :: distance / propagation speed.
3. For a SINGLE packet sent once :: Total time = transmission delay + propagation delay (the transmission happens first, THEN the last bit still has to propagate the full distance).
4. For MULTIPLE packets sent back to back :: Total time = (transmission delay x number of packets) + propagation delay (only ONE final propagation delay, since transmission of later packets overlaps with earlier packets' propagation).
:::

::: checkpoint
A 1000-bit message is sent over a link with bandwidth 1000 bits/second and propagation delay 2 seconds. What is the total time for the message to be fully received?
- ( ) 1 second
- ( ) 2 seconds
- (x) 3 seconds
- ( ) 4 seconds
> Transmission delay = 1000 bits / 1000 bps = 1 second. Propagation delay = 2 seconds (given). Total = transmission + propagation = 1 + 2 = 3 seconds - the last bit is pushed onto the link at t=1s, and then takes 2 more seconds to physically arrive.
:::`,
    keyPoints: [
      "Bandwidth: theoretical maximum capacity. Throughput: actual achieved rate, always <= bandwidth due to real-world limitations.",
      "Propagation delay depends on distance (not size). Transmission delay depends on size/bandwidth (not distance). Queuing delay depends on congestion. Processing delay is header-examination time.",
      "Bandwidth-delay product = bandwidth x propagation delay = maximum bits 'in flight' on the link at once - undersized windows underutilize high-bandwidth-delay links.",
      "Total transfer time for one packet: transmission delay + propagation delay. For back-to-back packets: (transmission delay x count) + one final propagation delay.",
    ],
    analogies: [
      "Transmission delay is how long it takes to push a whole train onto the tracks (depends on the train's length and how fast you can load cars); propagation delay is how long the train takes to actually travel the distance once fully loaded (depends only on distance and speed, not train length) - two genuinely independent quantities that happen to both be called 'delay'.",
    ],
    commonMistakes: [
      "Using 'bandwidth' and 'throughput' as synonyms, ignoring that throughput is bounded by (and typically less than) bandwidth in practice.",
      "Confusing propagation delay (distance-dependent) with transmission delay (size-dependent) - swapping which formula applies to which.",
      "For multi-packet transfers, incorrectly adding a full propagation delay PER packet instead of accounting for the overlap between later transmissions and earlier propagations.",
    ],
    memoryTricks: [
      "\"Transmission: how long to PUSH it out (size/bandwidth). Propagation: how long to TRAVEL (distance/speed).\" Different inputs, different formulas.",
      "Bandwidth-delay product = how many bits fit 'in the pipe' at once - a undersized window can't keep that pipe full.",
    ],
    formulas: [
      "Transmission delay = message size (bits) / bandwidth (bps).",
      "Propagation delay = distance / propagation speed.",
      "Single-packet total time = transmission delay + propagation delay.",
      "Bandwidth-delay product = bandwidth x propagation delay.",
    ],
    shortcuts: [
      "For a total-transfer-time numerical, always compute transmission and propagation delay SEPARATELY first, then combine per the single-vs-multi-packet formula - don't try to combine them in one step.",
      "If a question describes an underutilized high-speed, long-distance link, immediately think 'bandwidth-delay product vs window size' as the likely explanation.",
    ],
    pyqRelevance: `Transmission/propagation delay computation (total transfer time for a given message size, bandwidth, and distance) is one of the most reliable GATE Computer Networks numericals, appearing almost every year in some form.`,
    interviewConnection: `Bandwidth-delay product reasoning directly explains real-world TCP window-sizing and why "long fat network" (high bandwidth, high latency, e.g. satellite links) connections need larger windows to achieve good throughput - a genuine, practical networking performance topic.`,
    revisionSummary: `Bandwidth: max capacity. Throughput: actual achieved rate (<=bandwidth).

Propagation delay: distance-dependent. Transmission delay: size/bandwidth-dependent. Plus queuing (congestion) and processing delay.

Bandwidth-delay product = max bits in flight. Total time (one packet) = transmission + propagation; (multiple packets) = (transmission x count) + one propagation.`,
    shortNotes: {
      oneMinute: "Bandwidth: max capacity. Throughput: actual rate (<=bandwidth). Propagation delay: distance/speed (size-independent). Transmission delay: size/bandwidth (distance-independent). Bandwidth-delay product = max bits in flight. Total (1 packet) = transmission+propagation. Total (N packets) = N*transmission + 1 propagation.",
    },
    mcqs: [
      {
        question: "Which delay component depends on the physical distance between sender and receiver, but NOT on the message size?",
        options: ["Transmission delay", "Propagation delay", "Queuing delay", "Processing delay"],
        correctIndex: 1,
        explanation: "Propagation delay = distance / propagation speed - it depends only on distance and medium, not on how much data is being sent, unlike transmission delay which depends on message size and bandwidth.",
      },
    ],
    numericals: [
      {
        question: "A link has bandwidth 2,000,000 bits/sec and propagation delay 0.01 seconds. A 40,000-bit message is sent as a single packet. What is the total time (in seconds) until fully received?",
        answerMin: 0.03,
        answerMax: 0.03,
        unit: "seconds",
        solution: `Transmission delay = 40000 / 2000000 = 0.02 seconds
Propagation delay = 0.01 seconds (given)
Total = 0.02 + 0.01 = 0.03 seconds`,
      },
    ],
  },

  // ---------------- Data Link Layer ----------------

  "error-detection": {
    difficulty: "Moderate",
    estimatedMinutes: 30,
    // Verified via YouTube oEmbed (2026-08-29) - real, publicly viewable.
    resources: [{
      kind: "video",
      title: "Error Detection",
      url: "https://www.youtube.com/watch?v=EMrY-8m8D1E",
      description: "Explains transmission error types and detection techniques including parity check, checksum, and CRC.",
    }],
    whatYoullLearn: [
      "Parity bits, and the specific class of errors they can and cannot catch",
      "Checksums, and how the Internet checksum's one's complement addition actually works",
      "Cyclic Redundancy Check (CRC), and the polynomial division it's actually built on",
      "Why error detection guarantees catching errors up to a certain pattern, never every conceivable error",
    ],
    prerequisites: ["Principles of Layering"],
    concept: `## Parity: The Simplest Possible Check

::: remember
A single PARITY bit makes the total number of 1-bits (including the parity bit itself) even (even parity) or odd (odd parity). It reliably catches any SINGLE-bit error (or more precisely, any ODD number of bit flips) - but is COMPLETELY BLIND to an EVEN number of bit flips (two flipped bits cancel out and parity still checks out correctly).
:::

::: mistake
Assuming a parity check catches "most" errors reliably. It specifically catches only ODD-count bit flips - a 2-bit error (or any even count) passes a parity check completely undetected, which is exactly why parity alone is considered a weak, minimal error-detection scheme.
:::

## Checksums: Add Everything Up, Complement It

::: flow
1. Split the data into fixed-size blocks :: e.g. 16-bit chunks for the Internet checksum.
2. Add all the blocks together (one's complement addition, with end-around carry) :: If a carry falls off the left end, it wraps around and adds back to the rightmost bit.
3. Take the ONE'S COMPLEMENT (flip every bit) of the sum :: This final flipped value is the checksum, sent along with the data.
4. Receiver adds all blocks PLUS the received checksum :: If the result is all 1s (the one's-complement representation of zero), no error is detected; anything else signals corruption.
:::

## CRC: Polynomial Division Underneath

::: story
Cyclic Redundancy Check treats the data as a giant binary number and DIVIDES it (using a special XOR-based binary division, not ordinary arithmetic) by an agreed-upon GENERATOR POLYNOMIAL - the REMAINDER of that division becomes the CRC value appended to the data. The receiver performs the same division on the received data (including the CRC) and checks whether the remainder is exactly ZERO.
:::

::: remember
CRC is considerably STRONGER than a simple checksum - it can reliably detect all single-bit errors, all double-bit errors (under most generator polynomial choices), any odd number of errors, and any burst error shorter than the generator polynomial's degree, making it the standard choice for hardware-level error detection (like in Ethernet frames).
:::

::: checkpoint
A message has exactly TWO bit errors introduced during transmission. Will a single even-parity bit detect this?
- ( ) Yes, parity always detects errors
- (x) No - two bit flips is an EVEN number, and parity specifically only detects an ODD number of bit flips
- ( ) Only if the two errors are in the same byte
- ( ) Cannot be determined without knowing which bits flipped
> A parity bit tracks whether the total 1-bit count's evenness/oddness changed. Two bit flips (in either direction) leave the overall parity UNCHANGED - the check passes even though the data is corrupted, exactly the blind spot even-count errors create for simple parity.
:::`,
    keyPoints: [
      "Parity bit: catches any ODD number of bit flips, completely misses any EVEN number - a weak, minimal error-detection scheme.",
      "Checksum: sum data blocks with one's-complement (end-around-carry) addition, send the complement; receiver re-sums including the checksum and expects an all-1s result.",
      "CRC: binary (XOR-based) polynomial division by a generator polynomial; the remainder is the CRC value. Receiver checks the remainder of the full received data (including CRC) is zero.",
      "CRC is considerably stronger than checksums - reliably catches single-bit, double-bit, odd-count, and burst errors shorter than the generator polynomial's degree.",
    ],
    analogies: [
      "A parity bit is like counting whether a basket has an even or odd number of apples - if exactly one apple is secretly swapped for an orange (one error), the count changes and you notice; but if TWO apples are swapped (two errors), the count comes out exactly the same, and the swap goes unnoticed.",
    ],
    commonMistakes: [
      "Assuming parity catches all errors, missing that even-count bit flips are completely invisible to it.",
      "Confusing checksum's simple addition-based scheme with CRC's fundamentally different polynomial-division-based scheme - they're built on genuinely different mathematical foundations.",
      "Assuming error DETECTION also implies error CORRECTION - none of parity, checksum, or CRC as described here can fix a detected error, only flag that one occurred (correction requires additional redundancy, like Hamming codes).",
    ],
    memoryTricks: [
      "\"Parity: odd catches, even escapes.\" The entire limitation of a single parity bit in five words.",
      "CRC = remainder of a binary division. Checksum = complement of a sum. Different math, different strength.",
    ],
    formulas: [],
    shortcuts: [
      "For a parity-detection question, just count the number of bit flips described - odd is always caught, even is always missed, regardless of WHICH specific bits flipped.",
      "For a CRC computation, remember the division uses XOR (not subtraction) at every step - treating it like ordinary long division with regular subtraction gives a wrong remainder.",
    ],
    pyqRelevance: `Error detection is tested via CRC remainder computation (given data and a generator polynomial, compute the transmitted codeword or verify a received one) and conceptual questions about what parity/checksum specifically can and cannot catch - both frequent GATE Computer Networks question types.`,
    interviewConnection: `CRC is used pervasively in real networking hardware (Ethernet frame checking) and storage systems (disk sector integrity) - understanding it as polynomial division explains why certain generator polynomials are specifically chosen for their strong burst-error-detection guarantees.`,
    revisionSummary: `Parity: catches odd bit-flip counts, misses even counts - weak, minimal scheme.

Checksum: one's-complement sum of data blocks, complemented; receiver expects an all-1s re-sum.

CRC: binary (XOR) division by a generator polynomial, remainder is the CRC; receiver checks the remainder is zero. Much stronger than checksums - catches single/double-bit, odd-count, and burst errors.`,
    shortNotes: {
      oneMinute: "Parity: catches odd bit-flip counts, misses even. Checksum: one's-complement sum (end-around carry), complemented; receiver expects all-1s. CRC: XOR-based polynomial division, remainder = CRC value; receiver expects zero remainder. CRC >> checksum in strength (catches burst errors too).",
    },
    mcqs: [
      {
        question: "What mathematical operation is CRC fundamentally based on?",
        options: ["Simple addition with carry", "Binary (XOR-based) polynomial division", "One's complement negation only", "Multiplication by a fixed constant"],
        correctIndex: 1,
        explanation: "CRC treats the data as a large binary polynomial and divides it (using XOR-based binary division, not standard subtraction) by an agreed generator polynomial - the remainder becomes the CRC check value.",
      },
    ],
    numericals: [],
  },

  "medium-access-control": {
    difficulty: "Moderate",
    estimatedMinutes: 30,
    // Verified via YouTube oEmbed (2026-08-29) - real, publicly viewable.
    resources: [{
      kind: "video",
      title: "Lec-36: Carrier Sense Multiple Access/ Collision Detection | CSMA/CD | Computer Networks",
      url: "https://www.youtube.com/watch?v=v_z888gQWq0",
      description: "Explains CSMA/CD, the wired MAC protocol contrasted with wireless CSMA/CA.",
    }],
    whatYoullLearn: [
      "Why a shared medium needs an access control protocol at all",
      "CSMA/CD: how it detects and handles collisions, and why it's specifically an Ethernet-era technique",
      "CSMA/CA: how it AVOIDS collisions instead, and why wireless networks need this different approach",
      "Binary exponential backoff, and the specific problem it solves after a collision",
    ],
    prerequisites: ["Error Detection"],
    concept: `## Why A Shared Medium Needs Rules

::: story
When multiple devices share the SAME communication medium (a coaxial cable, or the open air for wireless), two devices transmitting simultaneously causes a COLLISION - both signals interfere and neither is received correctly. Medium Access Control (MAC) protocols exist specifically to coordinate WHO gets to transmit and WHEN, minimizing (or handling) these collisions.
:::

## CSMA/CD: Detect Collisions, Then React

::: flow CSMA/CD (Carrier Sense Multiple Access with Collision Detection)
1. Listen before transmitting (Carrier Sense) :: Check if the medium is currently idle.
2. Transmit if idle :: Begin sending if no one else is currently transmitting.
3. Continue listening WHILE transmitting (Collision Detection) :: Simultaneously monitor the medium for signs another device is also transmitting.
4. If a collision is detected :: STOP transmitting immediately, send a brief JAM signal (ensuring all involved stations definitely notice the collision), then wait a RANDOM backoff time before retrying.
:::

::: remember
CSMA/CD specifically requires the ability to DETECT a collision WHILE transmitting - this works for traditional wired Ethernet (a station can compare what it's sending against what's actually on the wire), but is NOT feasible for wireless networks, where a transmitting station's own strong outgoing signal drowns out its ability to hear a weaker incoming collision on the same frequency.
:::

## CSMA/CA: Avoid Collisions Before They Happen

::: cards Why wireless needs a different approach
The core problem :: Wireless stations can't reliably detect collisions while transmitting (their own transmission overwhelms their receiver) - so CSMA/CA instead tries to AVOID collisions proactively rather than detecting them after the fact.
RTS/CTS handshake :: Request-To-Send / Clear-To-Send - a sender first asks permission, the receiver grants it, and this exchange itself reserves the medium, reducing the chance of a later actual data collision (also helps address the "hidden terminal" problem, where two senders can't hear each other but can both reach the same receiver).
Random backoff BEFORE transmitting :: Unlike CSMA/CD's backoff (which happens AFTER a detected collision), CSMA/CA often waits a random interval even for the FIRST transmission attempt, proactively reducing the chance multiple stations start simultaneously.
:::

## Binary Exponential Backoff: Solving Repeated Collisions

::: remember
After a collision, the retry wait time is chosen randomly from a range that DOUBLES after each successive collision on the same transmission attempt (1st collision: wait 0 or 1 slot; 2nd: 0-3 slots; 3rd: 0-7 slots; and so on) - this specifically prevents the SAME two stations from colliding repeatedly by spreading their retry attempts across an increasingly wide random range as contention appears to worsen.
:::

::: checkpoint
Why is CSMA/CD (Collision DETECTION) not used in WiFi, which instead uses CSMA/CA (Collision AVOIDANCE)?
- ( ) CSMA/CD is too slow for wireless
- (x) A wireless station's own strong transmission overwhelms its ability to simultaneously listen for a weaker collision on the same frequency
- ( ) WiFi doesn't have collisions at all
- ( ) CSMA/CA is simply an older, obsolete protocol
> Wired Ethernet can detect a collision because the transmitted signal and any interfering signal share a comparably-strong physical medium a station can monitor. In wireless, a transmitting radio's own outgoing signal is vastly stronger than anything else on the same frequency it might be trying to simultaneously receive - collision DETECTION during transmission isn't practically feasible, motivating collision AVOIDANCE instead.
:::`,
    keyPoints: [
      "MAC protocols coordinate access to a shared medium to minimize/handle collisions.",
      "CSMA/CD: listen before sending, keep listening WHILE sending, stop and back off on detected collision - the classic wired Ethernet approach.",
      "CSMA/CA: proactively AVOIDS collisions (can't reliably detect them mid-transmission on wireless) via RTS/CTS handshaking and random backoff even before first transmission - the WiFi approach.",
      "Binary exponential backoff: retry wait range doubles after each successive collision, spreading out repeated contenders' retry attempts to reduce further collisions.",
    ],
    analogies: [
      "CSMA/CD is like people in a room pausing to listen before speaking, and immediately stopping if they hear themselves talking over someone else; CSMA/CA is more like raising a hand and waiting for acknowledgment before speaking at all, specifically because in a noisy room (wireless) you might not be able to tell you're being talked over while you're mid-sentence.",
    ],
    commonMistakes: [
      "Assuming CSMA/CD and CSMA/CA are just minor variations of the same idea, missing that CD detects collisions reactively while CA avoids them proactively - a fundamentally different strategy driven by wireless's physical constraints.",
      "Forgetting binary exponential backoff's range DOUBLES with each successive collision on the same attempt, not staying fixed.",
      "Not recognising RTS/CTS's role in addressing the hidden terminal problem specifically, beyond just general collision avoidance.",
    ],
    memoryTricks: [
      "\"CD detects, CA avoids.\" The D-vs-A difference is the entire distinction between the two protocols' philosophies.",
      "Exponential backoff: each new collision on the same attempt DOUBLES the random wait range - 1, 2, 4, 8 slots wide, and so on.",
    ],
    formulas: [
      "Binary exponential backoff: after the kth collision, wait a random number of slots chosen from [0, 2^k - 1].",
    ],
    shortcuts: [
      "For a CSMA/CD-vs-CA question, immediately check whether the medium is wired (CD, can detect collisions live) or wireless (CA, must avoid collisions proactively) - the medium type alone usually answers which protocol applies.",
      "For a backoff-range numerical, compute 2^k directly for the given collision count k - the range is always [0, 2^k - 1] slots.",
    ],
    pyqRelevance: `MAC protocol questions (CSMA/CD vs CSMA/CA distinction, binary exponential backoff range computation) are a recurring, moderate-difficulty GATE Computer Networks topic, often paired with a small numerical on backoff timing.`,
    interviewConnection: `Understanding CSMA/CD vs CSMA/CA is directly relevant to explaining why WiFi throughput characteristics differ from wired Ethernet, and binary exponential backoff is the same general strategy (randomized, growing retry delays) used broadly in distributed systems for retry logic under contention.`,
    revisionSummary: `MAC protocols coordinate shared-medium access. CSMA/CD (wired): listen, send, keep listening, stop+backoff on detected collision.

CSMA/CA (wireless): proactively avoids collisions (can't detect mid-transmission) via RTS/CTS handshake and pre-transmission random backoff.

Binary exponential backoff: retry range doubles [0, 2^k-1] slots after each successive collision.`,
    shortNotes: {
      oneMinute: "MAC coordinates shared-medium access. CSMA/CD (wired): listen, send, keep listening, stop+backoff on detected collision. CSMA/CA (wireless): can't detect mid-transmission, so avoids proactively via RTS/CTS + pre-send random backoff (also helps hidden terminal problem). Binary exponential backoff: range doubles [0,2^k-1] slots per successive collision.",
    },
    mcqs: [
      {
        question: "After the 3rd consecutive collision on the same transmission attempt, what is the binary exponential backoff wait range (in slots)?",
        options: ["[0, 1]", "[0, 3]", "[0, 7]", "[0, 15]"],
        correctIndex: 2,
        explanation: "After the kth collision, the range is [0, 2^k - 1]. For k=3: [0, 2^3-1] = [0, 7] slots.",
      },
    ],
    numericals: [],
  },

  "ethernet": {
    difficulty: "Moderate",
    estimatedMinutes: 25,
    // Verified via YouTube oEmbed (2026-08-29) - real, publicly viewable.
    resources: [{
      kind: "video",
      title: "Ethernet",
      url: "https://www.youtube.com/watch?v=MzhiVE6OuQA",
      description: "Covers the evolution of Ethernet, its frame format, and minimum/maximum frame sizes.",
    }],
    whatYoullLearn: [
      "The Ethernet frame format, and what each field is actually for",
      "The minimum frame size rule, and the specific collision-detection problem it solves",
      "MAC addresses, and how they differ fundamentally from IP addresses",
      "How switches use MAC addresses to forward frames more efficiently than a hub",
    ],
    prerequisites: ["Medium Access Control"],
    concept: `## The Ethernet Frame's Key Fields

::: cards
Preamble :: A fixed bit pattern letting the receiver's clock SYNCHRONIZE before the real frame begins - not part of the "data" itself.
Destination and Source MAC address :: 6 bytes each, identifying which physical network interface sends and receives this specific frame.
Type/Length field :: Indicates either the frame's payload length, or (more commonly today) which higher-layer protocol (like IP) the payload should be handed to.
Payload (data) :: The actual content being carried - between 46 and 1500 bytes.
FCS (Frame Check Sequence) :: A CRC value (see Error Detection) used to detect transmission errors in the frame.
:::

## The Minimum Frame Size: Solving A Collision-Detection Timing Problem

::: story
Ethernet frames have a MINIMUM size (64 bytes total, meaning at least 46 bytes of payload) - this isn't arbitrary, it directly solves a specific timing problem: a sender must still be TRANSMITTING when a collision signal could possibly arrive back from the farthest point on the network, or it might finish sending and move on without ever realizing a collision happened.
:::

::: remember
Minimum frame size is chosen so that transmission time is AT LEAST as long as the round-trip propagation time across the network's maximum span - guaranteeing collision detection actually works for every frame sent, connecting directly back to CSMA/CD's requirement of detecting collisions WHILE still transmitting.
:::

## MAC Addresses vs IP Addresses

::: cards
MAC address :: 48 bits, BURNED INTO the network interface hardware (in principle globally unique), used for LOCAL delivery within one network segment (Data Link layer).
IP address :: Assigned (often dynamically) based on WHICH NETWORK a device is currently connected to, used for delivery ACROSS multiple networks/the whole Internet (Network layer).
:::

::: mistake
Assuming a MAC address changes if a device moves to a different network, or that an IP address is a fixed hardware property. It's the OPPOSITE: MAC addresses are fixed to the hardware regardless of network; IP addresses change depending on which network a device is currently attached to.
:::

## Switches vs Hubs: Learning MAC Addresses

::: remember
A HUB forwards every incoming frame out on ALL other ports (a single shared collision domain, like the original CSMA/CD design assumed). A SWITCH learns which MAC address lives on which port (by observing source addresses of incoming frames) and forwards a frame ONLY out the specific port leading to its destination - dramatically reducing unnecessary traffic and collisions, since ports on a switch are typically each their own separate collision domain.
:::

::: checkpoint
Why does Ethernet enforce a MINIMUM frame size (64 bytes)?
- ( ) To reduce total network traffic
- (x) To ensure the sender is still transmitting when a collision signal could arrive back from the farthest point on the network, so collision detection actually works
- ( ) Because smaller frames are more prone to corruption
- ( ) It's an arbitrary historical choice with no technical reason
> The minimum frame size guarantees transmission time is at least as long as the network's maximum round-trip propagation time - if a frame were shorter, a sender could finish transmitting BEFORE a collision signal from a far-away collision ever reached it back, defeating CSMA/CD's collision-detection requirement entirely.
:::`,
    keyPoints: [
      "Ethernet frame: preamble (sync), destination/source MAC (6 bytes each), type/length, payload (46-1500 bytes), FCS (CRC-based error check).",
      "Minimum frame size (64 bytes) ensures transmission time >= round-trip propagation time across the network's max span, guaranteeing CSMA/CD's collision detection actually works.",
      "MAC address: 48-bit, hardware-fixed, used for local (Data Link) delivery. IP address: network-dependent, used for cross-network (Network layer) delivery - the two serve entirely different purposes at different layers.",
      "Hub: forwards to all ports (one shared collision domain). Switch: learns MAC-to-port mapping, forwards only to the relevant port (each port its own collision domain) - far more efficient.",
    ],
    analogies: [
      "A MAC address is like a device's permanent serial number stamped at the factory (never changes, no matter where the device goes); an IP address is like a mailing address assigned based on where you're currently staying (changes if you move to a different location/network).",
    ],
    commonMistakes: [
      "Assuming MAC addresses change per network or that IP addresses are fixed hardware properties - it's the reverse of the actual relationship.",
      "Treating the 64-byte minimum frame size as arbitrary rather than understanding its direct link to guaranteeing CSMA/CD's collision-detection timing requirement.",
      "Confusing hub behaviour (forward to all ports, shared collision domain) with switch behaviour (forward to the learned specific port, separate collision domains per port).",
    ],
    memoryTricks: [
      "\"MAC: hardware-fixed, local delivery. IP: network-dependent, global delivery.\" Two addresses, two entirely different jobs, at two different layers.",
      "Minimum frame size exists so the sender is STILL TALKING when a possible collision echo could get back to it.",
    ],
    formulas: [],
    shortcuts: [
      "For a minimum-frame-size-related question, connect it directly back to CSMA/CD's requirement (detect a collision WHILE still transmitting) rather than treating it as an isolated fact to memorise.",
      "To quickly distinguish a hub-vs-switch question, check whether frames are described going to ALL ports (hub) or a SPECIFIC learned port (switch).",
    ],
    pyqRelevance: `Ethernet frame structure, minimum frame size reasoning (often tied to a propagation-delay numerical), and MAC-vs-IP address distinction are all recurring, moderate-frequency GATE Computer Networks questions.`,
    interviewConnection: `Understanding MAC addresses vs IP addresses (and the switch's learning-based forwarding) is foundational for any real network troubleshooting discussion (ARP resolution, switch/VLAN behaviour) and is a common early networking-fundamentals interview question.`,
    revisionSummary: `Ethernet frame: preamble, destination/source MAC, type/length, payload, FCS (CRC).

Minimum frame size (64 bytes) ensures transmission time >= max round-trip propagation delay, so CSMA/CD's collision detection actually works.

MAC address: hardware-fixed, local (Data Link) delivery. IP address: network-dependent, cross-network (Network layer) delivery. Switch learns MAC-to-port mapping (efficient); hub floods all ports (shared collision domain).`,
    shortNotes: {
      oneMinute: "Ethernet frame: preamble, dest/source MAC, type/length, payload (46-1500B), FCS(CRC). Min frame size (64B) ensures transmission time >= max round-trip delay, so CSMA/CD collision detection works. MAC: hardware-fixed, local delivery. IP: network-dependent, cross-network delivery. Switch: learns MAC->port, forwards selectively. Hub: floods all ports.",
    },
    mcqs: [
      {
        question: "What is the key functional difference between a hub and a switch?",
        options: [
          "A switch is always slower",
          "A hub forwards every frame to all ports; a switch learns MAC addresses and forwards only to the relevant port",
          "A hub only works with wireless devices",
          "There is no functional difference",
        ],
        correctIndex: 1,
        explanation: "A hub floods incoming frames out every other port (one shared collision domain); a switch learns which MAC address is reachable via which port and forwards selectively, dramatically reducing unnecessary traffic and collisions.",
      },
    ],
    numericals: [],
  },

  // ---------------- Routing ----------------

  "distance-vector-routing": {
    difficulty: "Moderate",
    estimatedMinutes: 30,
    // Verified via YouTube oEmbed (2026-08-29) - real, publicly viewable.
    resources: [{
      kind: "video",
      title: "Routing Protocols | Chapter-5 | Computer Networks | nesoacademy.org",
      url: "https://www.youtube.com/watch?v=OyBIburQl6s",
      description: "Introduces distance vector routing and how routers exchange distance tables to build routes.",
    }],
    whatYoullLearn: [
      "The core idea: each router only knows its neighbors' advertised distances, not the full topology",
      "The Bellman-Ford-based update rule distance vector routing actually runs",
      "The count-to-infinity problem, and why it's a fundamental weakness of this approach",
      "Split horizon and poison reverse as partial (not complete) fixes",
    ],
    prerequisites: ["Graph Traversals", "Shortest Paths"],
    concept: `## Routing By Rumour: Trust Your Neighbors' Word

::: story
In distance vector routing, each router maintains a table of (destination, cost, next-hop) - and PERIODICALLY shares this ENTIRE table with its DIRECTLY CONNECTED neighbors only. No router ever sees the network's full topology; it only ever learns "my neighbor says it can reach X in cost c," directly connecting to Shortest Paths' Bellman-Ford algorithm, which this protocol is essentially a distributed, iterative version of.
:::

::: remember
The update rule: for each destination D, and each neighbor N, a router considers cost-to-N + N's-advertised-cost-to-D as a CANDIDATE route to D - and updates its own table if this candidate is CHEAPER than its current known cost to D. This is exactly Bellman-Ford's "relax every edge" idea, run repeatedly and distributed across routers instead of centrally.
:::

## The Count-To-Infinity Problem

::: story
If a link or router FAILS, and the routers on either side of the failure only know about each other's OLD (now stale) advertised routes, they can end up in a loop of gradually increasing their advertised cost to the now-unreachable destination through EACH OTHER, one small increment at a time - counting slowly up toward infinity instead of quickly recognizing the destination is actually unreachable.
:::

::: mistake
Assuming distance vector routing converges quickly after any topology change. FAILURES specifically (a link going down, making a destination unreachable) can trigger the count-to-infinity problem, causing SLOW convergence - this is a genuine, structural weakness of the basic algorithm, not a rare edge case.
:::

## Partial Fixes: Split Horizon And Poison Reverse

::: cards
Split horizon :: A router does NOT advertise a route back to the SAME neighbor it originally learned that route from - prevents the simplest two-router "you told me, so I'll tell you back" loop.
Split horizon with poison reverse :: Goes further - a router DOES advertise that route back to the originating neighbor, but with a cost of INFINITY (explicitly signaling "don't route through me for this"), rather than just staying silent.
:::

::: remember
Split horizon (with or without poison reverse) fixes the count-to-infinity problem specifically for TWO-router loops, but does NOT fully solve it for LONGER loops involving three or more routers - it's a genuine mitigation, not a complete guarantee against the problem.
:::

::: checkpoint
Why does distance vector routing suffer from the count-to-infinity problem after a link failure, specifically?
- ( ) Routers cannot detect link failures at all
- (x) Routers on either side of the failure may keep believing each other's stale, now-incorrect routes, gradually incrementing a shared cost instead of recognizing the destination is unreachable
- ( ) The protocol doesn't use a cost metric at all
- ( ) It only affects wireless networks
> Since routers only know their DIRECT neighbors' advertised costs (not the full topology), when a route actually disappears, nearby routers can keep "trusting" each other's stale advertisements, incrementally raising their believed cost to the destination through each other in a slow loop, rather than immediately recognizing unreachability.
:::`,
    keyPoints: [
      "Distance vector: each router only knows (destination, cost, next-hop) from its DIRECT neighbors, periodically sharing its full table - no router sees the full topology.",
      "Update rule: candidate cost = cost-to-neighbor + neighbor's-advertised-cost-to-destination; update if cheaper - a distributed, iterative version of Bellman-Ford.",
      "Count-to-infinity: after a failure, routers relying on each other's stale routes can gradually increment a shared cost instead of quickly recognizing unreachability - a structural weakness.",
      "Split horizon (don't advertise a route back to where you learned it) and poison reverse (advertise it back with infinite cost) mitigate two-router loops, but don't fully solve longer loops.",
    ],
    analogies: [
      "Distance vector routing is like a rumour-based gossip network: each person only tells their immediate friends what they've heard, and if the original source of a rumour disappears, two friends can keep 'confirming' an increasingly stale version of it to each other, slowly inflating a wrong story instead of realizing it's no longer true.",
    ],
    commonMistakes: [
      "Assuming distance vector routers have any knowledge of the full network topology - they genuinely only know their direct neighbors' advertised costs.",
      "Believing split horizon/poison reverse fully solves count-to-infinity - they specifically fix the two-router case, not longer routing loops.",
      "Forgetting the update rule's exact structure (cost-to-neighbor PLUS neighbor's-advertised-cost), and applying it without the direct neighbor-link cost component.",
    ],
    memoryTricks: [
      "\"Distance vector = Bellman-Ford, distributed and repeated.\" The whole algorithm's lineage in one phrase.",
      "Split horizon: stay silent to where you heard it. Poison reverse: shout back 'infinity' instead.",
    ],
    formulas: [
      "Update rule: newCost(D) = min(currentCost(D), cost(self, N) + N's-advertised-cost(D)) for each neighbor N.",
    ],
    shortcuts: [
      "For a count-to-infinity question, look specifically for a LINK FAILURE scenario (not just normal operation) - the problem is specifically triggered by routes becoming stale after a topology change, not steady-state operation.",
      "To quickly apply the distance-vector update rule in a trace question, compute cost-to-neighbor + neighbor's-table-value for EVERY neighbor and destination pair, then take the minimum against the current value - a systematic table-fill rather than ad hoc reasoning.",
    ],
    pyqRelevance: `Distance vector routing is tested via table-update tracing (given a small network and initial tables, compute the converged routing tables) and conceptual count-to-infinity/split-horizon questions - both frequent, moderate-to-high-difficulty GATE Computer Networks question types.`,
    interviewConnection: `Distance vector routing (RIP is a real-world example) and its count-to-infinity weakness directly motivate why link-state routing (OSPF) is often preferred in larger networks - a standard networking-protocol comparison discussion in infrastructure-focused interviews.`,
    revisionSummary: `Distance vector: each router only knows direct neighbors' advertised (destination, cost) pairs - a distributed Bellman-Ford. Update rule: candidate = cost-to-neighbor + neighbor's cost, update if cheaper.

Count-to-infinity: after a failure, stale mutual trust between routers slowly increments cost instead of recognizing unreachability - a structural weakness.

Split horizon / poison reverse: mitigate two-router loops, don't fully fix longer ones.`,
    shortNotes: {
      oneMinute: "Distance vector: routers know only direct neighbors' (dest,cost) - distributed Bellman-Ford. Update: candidate=cost-to-neighbor+neighbor's-cost, update if cheaper. Count-to-infinity: post-failure stale mutual trust slowly increments cost instead of detecting unreachability. Split horizon (don't advertise back to source) / poison reverse (advertise back as infinity) - fix 2-router loops only, not longer ones.",
    },
    mcqs: [
      {
        question: "What does 'split horizon with poison reverse' specifically do?",
        options: [
          "Prevents any router from ever advertising a failed route",
          "Advertises a route back to the neighbor it was learned from, but with an infinite cost",
          "Doubles the advertised cost to all neighbors",
          "Removes the affected route from all routing tables immediately",
        ],
        correctIndex: 1,
        explanation: "Poison reverse specifically advertises the route back toward the neighbor it was originally learned from, but with a cost of infinity - explicitly signaling 'don't route through me for this destination', rather than silently omitting it (plain split horizon).",
      },
    ],
    numericals: [],
  },

  "link-state-routing": {
    difficulty: "Moderate",
    estimatedMinutes: 30,
    // Verified via YouTube oEmbed (2026-08-29) - real, publicly viewable.
    resources: [{
      kind: "video",
      title: "Lec-64: Link state routing in computer networks in Hindi",
      url: "https://www.youtube.com/watch?v=kW6zV-040SY",
      description: "Explains the link state routing algorithm and how routers build a complete topology map to compute shortest paths.",
    }],
    whatYoullLearn: [
      "How link-state routing differs fundamentally from distance vector: full topology vs neighbor-only knowledge",
      "Link State Advertisements (LSAs) and how flooding distributes them to every router",
      "Why Dijkstra's algorithm is exactly what each router runs once it has the full topology",
      "Why link-state routing converges faster and avoids count-to-infinity, at a real cost",
    ],
    prerequisites: ["Distance Vector Routing", "Shortest Paths"],
    concept: `## Full Topology Knowledge, Not Just Neighbor Rumours

::: story
Link-state routing takes the OPPOSITE approach from distance vector: every router builds a complete, IDENTICAL map of the ENTIRE network's topology (who's connected to whom, and at what cost) - then independently computes shortest paths from that full map, rather than relying on neighbors' second-hand summaries.
:::

## Link State Advertisements And Flooding

::: flow
1. Each router determines its own direct links :: Which neighbors it's connected to, and each link's cost.
2. It packages this into a Link State Advertisement (LSA) :: A small message describing just its own direct connections.
3. FLOODING distributes the LSA to EVERY router in the network :: Each router that receives a new LSA forwards it out to all its OTHER links (not back the way it came) - guaranteeing the LSA reaches everyone, even though no single router has to know the full path in advance.
4. Every router accumulates ALL routers' LSAs :: Building an identical, complete topology map independently.
:::

::: remember
Flooding is specifically what lets link-state routing spread FULL topology information efficiently without any router needing to know the network's structure in advance to route the LSAs correctly - it's a deliberately simple, robust "tell everyone" broadcast mechanism.
:::

## Dijkstra's Algorithm: Exactly What Each Router Runs

::: remember
Once a router has the complete topology (from accumulated LSAs), it runs DIJKSTRA'S ALGORITHM (see Shortest Paths) locally, using ITSELF as the source - computing shortest paths to every other router. This is precisely why link-state routing REQUIRES non-negative link costs, exactly matching Dijkstra's own precondition.
:::

## Trade-offs Versus Distance Vector

::: cards
Convergence speed :: Link-state converges FASTER after a topology change - every router recomputes independently from fresh, complete information, rather than waiting for iterative neighbor-to-neighbor updates to propagate.
Count-to-infinity :: Link-state does NOT suffer from this problem - since every router has the actual current topology (via flooded LSAs), there's no reliance on potentially-stale second-hand neighbor summaries.
Resource cost :: Link-state requires MORE memory (storing the full topology, not just a distance table) and more processing (running Dijkstra's, an O((V+E)logV)-class algorithm, rather than distance vector's simpler update rule) on every router.
:::

::: checkpoint
Why doesn't link-state routing suffer from the count-to-infinity problem that affects distance vector routing?
- ( ) Link-state routing doesn't use a cost metric
- (x) Every router has the ACTUAL current full topology (via flooded LSAs), rather than relying on potentially stale second-hand information from neighbors
- ( ) Link-state routing never has link failures
- ( ) It uses a completely different metric that can't count upward
> Count-to-infinity specifically arises from routers trusting stale, indirect (neighbor-summarized) information about the network. Link-state routing sidesteps this by giving every router the network's ACTUAL, current topology directly (via LSA flooding), so there's no chain of stale second-hand trust to slowly increment through.
:::`,
    keyPoints: [
      "Link-state: every router builds an identical, complete topology map (via flooded LSAs), unlike distance vector's neighbor-only knowledge.",
      "LSAs describe a router's own direct links; flooding (forward to all other links, not back the way it came) distributes them to every router without needing pre-known routes.",
      "Each router runs Dijkstra's algorithm locally (itself as source) once it has the full topology - requiring non-negative link costs, exactly matching Dijkstra's precondition.",
      "Link-state converges faster and avoids count-to-infinity (full, current topology, no stale second-hand trust), at the cost of more memory and processing per router than distance vector.",
    ],
    analogies: [
      "Link-state routing is like every person in a city getting an identical, complete, up-to-date city map (via a citywide broadcast) and independently planning their own best route - versus distance vector's approach of each person only knowing 'my neighbor says this direction is fastest,' passed along street by street.",
    ],
    commonMistakes: [
      "Confusing link-state's flooding mechanism with distance vector's periodic neighbor-only table exchange - genuinely different distribution mechanisms.",
      "Forgetting link-state routing specifically requires Dijkstra's non-negative-weight precondition, since that's the exact algorithm each router runs.",
      "Assuming link-state routing has no real cost trade-off versus distance vector - the memory/processing overhead of storing and computing over the full topology is real and non-trivial.",
    ],
    memoryTricks: [
      "\"Link-state: everyone gets the FULL MAP (via flooding), then runs Dijkstra's alone.\" The whole protocol in one sentence.",
      "Distance vector: trust your neighbor's summary. Link-state: see the whole picture yourself.",
    ],
    formulas: [],
    shortcuts: [
      "For a link-state vs distance vector comparison question, check the specific dimension asked about (convergence speed, count-to-infinity susceptibility, or resource cost) - link-state wins the first two but loses the third.",
      "If a question mentions LSA flooding or every router computing an independent shortest-path tree, that's a clear link-state routing signature.",
    ],
    pyqRelevance: `Link-state routing is tested via LSA flooding conceptual questions and via its direct connection to Dijkstra's algorithm (sometimes combined with a Shortest Paths numerical) - a recurring, moderate-difficulty GATE Computer Networks topic, often paired directly against distance vector in comparison questions.`,
    interviewConnection: `Link-state routing (OSPF is the real-world protocol) versus distance vector (RIP) is a standard networking-infrastructure interview comparison, and understanding why link-state scales better in larger networks (faster convergence, no count-to-infinity) despite higher per-router overhead is a genuine architectural trade-off discussion.`,
    revisionSummary: `Link-state: every router builds an identical full topology map via flooded LSAs (each router's own direct links), unlike distance vector's neighbor-only knowledge.

Each router then runs Dijkstra's algorithm locally on that full topology - requiring non-negative link costs.

Converges faster, avoids count-to-infinity (full current topology, no stale trust), at the cost of more memory/processing per router.`,
    shortNotes: {
      oneMinute: "Link-state: every router builds an identical FULL topology map via flooded LSAs (own direct links). Flooding: forward to all other links, not back the way it came. Each router runs Dijkstra's locally (needs non-negative weights). Converges faster, no count-to-infinity, but more memory/processing than distance vector.",
    },
    mcqs: [
      {
        question: "What algorithm does each router run once it has accumulated the full network topology via LSAs?",
        options: ["Bellman-Ford", "Dijkstra's algorithm", "Kruskal's algorithm", "Depth-first search"],
        correctIndex: 1,
        explanation: "Once a router has the complete topology, it runs Dijkstra's algorithm locally (itself as the source) to compute shortest paths to every other router - which is exactly why link-state routing requires non-negative link costs, Dijkstra's own precondition.",
      },
    ],
    numericals: [],
  },

  // ---------------- Network Layer: IPv4 ----------------

  "ipv4-addressing-and-fragmentation": {
    difficulty: "Moderate",
    estimatedMinutes: 30,
    // Verified via YouTube oEmbed (2026-08-29) - real, publicly viewable.
    resources: [{
      kind: "video",
      title: "Lec-55: Fragmentation(MTU) of IPv4 Datagram | Identification, Flags and Fragment Offset | Networks",
      url: "https://www.youtube.com/watch?v=k8VgrqDOIUo",
      description: "Covers IPv4 datagram fragmentation using the identification, flags, and fragment offset header fields against MTU limits.",
    }],
    whatYoullLearn: [
      "IPv4 address classes (the historical scheme) and why classless addressing replaced them",
      "Network ID vs host ID, and how a subnet mask separates the two",
      "Why fragmentation happens, and the specific fields that let a receiver reassemble fragments correctly",
      "Computing the number of fragments needed for a given MTU and packet size",
    ],
    prerequisites: ["Principles of Layering"],
    concept: `## Network ID And Host ID: Splitting A 32-bit Address

::: remember
Every IPv4 address is 32 bits, conceptually split into a NETWORK ID (identifying which network a device is on) and a HOST ID (identifying the specific device within that network) - a SUBNET MASK marks exactly where this split happens (1-bits for network portion, 0-bits for host portion).
:::

::: cards Historical address classes (largely superseded by CIDR, but still tested)
Class A :: First bit 0. 8-bit network ID, 24-bit host ID - few networks, huge numbers of hosts each.
Class B :: First 2 bits 10. 16-bit network ID, 16-bit host ID - a middle ground.
Class C :: First 3 bits 110. 24-bit network ID, 8-bit host ID - many networks, few hosts each (254 usable).
:::

::: mistake
Assuming classful addressing (A/B/C) is what's actually used to determine network boundaries in modern networks. Real networks today use CLASSLESS addressing (CIDR - see CIDR Notation), where the network/host split is determined by an explicitly specified prefix length, completely independent of the address's leading bits.
:::

## Why Fragmentation Happens

::: story
Every physical network link has a MAXIMUM TRANSMISSION UNIT (MTU) - the largest packet it can carry in one piece. When an IP packet is larger than the MTU of a link it needs to cross, it must be FRAGMENTED into smaller pieces that each fit, and REASSEMBLED at the final destination (not at intermediate routers).
:::

::: cards Fields that make correct reassembly possible
Identification :: The SAME value is copied into every fragment of one original packet - tells the receiver which fragments belong together.
Fragment offset :: Where THIS fragment's data belongs within the ORIGINAL, unfragmented packet (measured in 8-byte units) - lets the receiver reassemble in the correct order even if fragments arrive out of order.
More Fragments (MF) flag :: Set to 1 on every fragment EXCEPT the last one, which has MF=0 - tells the receiver when it has received the final piece.
:::

::: mistake
Assuming fragments are reassembled at intermediate routers along the path. Reassembly happens ONLY at the FINAL DESTINATION - intermediate routers may further fragment an already-fragmented piece if needed, but never reassemble, which is exactly why the Identification/offset/MF fields must survive the entire journey intact.
:::

::: checkpoint
A 4000-byte IP packet (including a 20-byte header) needs to cross a link with MTU 1500 bytes. Roughly how many fragments are needed?
- ( ) 2
- (x) 3
- ( ) 4
- ( ) 5
> Payload to fragment: 4000-20=3980 bytes. Each fragment can carry up to 1500-20=1480 bytes of payload (its own 20-byte header, fragment offset rounded to a multiple of 8, ~1480 usable). 3980/1480 ~ 2.69, rounding up to 3 fragments needed.
:::`,
    keyPoints: [
      "IPv4 address: 32 bits, split into network ID and host ID by the subnet mask. Classful (A/B/C) addressing is historical; CIDR (classless) is what's actually used today.",
      "Fragmentation happens when a packet exceeds a link's MTU - fragments are created en route but reassembled ONLY at the final destination, never at intermediate routers.",
      "Identification field: same value across all fragments of one original packet. Fragment offset: position within the original packet (in 8-byte units). More Fragments flag: 1 on all but the last fragment.",
      "Fragment count is computed by dividing the payload (packet size minus header) by the usable payload per fragment (MTU minus header), rounding up.",
    ],
    analogies: [
      "IP fragmentation is like mailing a large item that doesn't fit in one box: it gets split into several labeled boxes (Identification ties them together, fragment offset says which part of the original item is in this box, and the last box is marked 'final piece') - and the recipient (not any intermediate delivery truck) is the one who actually reassembles the item.",
    ],
    commonMistakes: [
      "Assuming intermediate routers reassemble fragments - reassembly happens exclusively at the final destination.",
      "Forgetting fragment offset is measured in 8-byte units, not raw bytes, when computing offsets for a multi-fragment numerical.",
      "Using classful (A/B/C) address boundaries to determine a modern network's actual network/host split, instead of the explicitly specified CIDR prefix length.",
    ],
    memoryTricks: [
      "\"Identification ties fragments together, offset says WHERE, MF says 'more coming' (0 means done).\" The three fields' jobs, in one phrase.",
      "Fragmentation happens ALONG the path (at any router facing a small-MTU link); reassembly happens ONLY at the destination.",
    ],
    formulas: [
      "Number of fragments = ceil( (packet size - header size) / (MTU - header size) ).",
    ],
    shortcuts: [
      "For a fragmentation numerical, always subtract the header size from BOTH the total packet size AND the MTU before dividing - forgetting to subtract the header from the MTU is the most common error.",
      "For a network/host ID question involving modern addressing, look for an explicit CIDR prefix length (/24, /16, etc.) rather than reasoning from the address's leading bits.",
    ],
    pyqRelevance: `IPv4 fragmentation numericals (given packet size and MTU, compute fragment count and offsets) are a reliable, frequent GATE Computer Networks question type - precise field understanding (especially fragment offset units) is the main source of error.`,
    interviewConnection: `Understanding MTU and fragmentation is directly relevant to real networking troubleshooting (fragmentation-related packet loss, "Path MTU Discovery" issues) that shows up in production networking incidents, and is a common deeper networking-fundamentals interview topic.`,
    revisionSummary: `IPv4 address: 32 bits, network ID + host ID split by subnet mask. Classful (A/B/C) addressing is historical; CIDR is what's actually used.

Fragmentation happens when a packet exceeds a link's MTU; reassembly happens ONLY at the final destination. Identification (ties fragments together), fragment offset (position, 8-byte units), MF flag (0 on the last fragment).

Fragment count = ceil((packet size - header) / (MTU - header)).`,
    shortNotes: {
      oneMinute: "IPv4: 32-bit, network ID+host ID via subnet mask. Classful (A/B/C) is historical; CIDR is actual practice. Fragmentation: exceeds MTU, en route; reassembly ONLY at destination. Identification (ties fragments), fragment offset (8-byte units), MF flag (0=last). Fragment count = ceil((size-header)/(MTU-header)).",
    },
    mcqs: [
      {
        question: "At which point in an IP packet's journey does fragment reassembly occur?",
        options: ["At every intermediate router", "Only at the final destination", "Only at the first router encountered", "Reassembly never happens - fragments stay separate"],
        correctIndex: 1,
        explanation: "IP fragments are reassembled exclusively at the final destination - intermediate routers may further fragment a packet if needed, but never reassemble it, which is why the Identification/offset/MF fields must remain intact for the entire journey.",
      },
    ],
    numericals: [
      {
        question: "A 3020-byte packet (including a 20-byte header) must cross a link with MTU 1020 bytes (each fragment also has its own 20-byte header). How many fragments are needed?",
        answerMin: 3,
        answerMax: 3,
        unit: "",
        solution: `Payload to fragment: 3020 - 20 = 3000 bytes.
Usable payload per fragment: 1020 - 20 = 1000 bytes (already a multiple of 8, so no alignment rounding needed).
Fragments needed = ceil(3000 / 1000) = 3.`,
      },
    ],
  },

  "cidr-notation": {
    difficulty: "Moderate",
    estimatedMinutes: 25,
    // Verified via YouTube oEmbed (2026-08-29) - real, publicly viewable.
    resources: [{
      kind: "video",
      title: "Classless Addressing (Part 2)",
      url: "https://www.youtube.com/watch?v=PGwtar-BZzs",
      description: "Explains classless inter-domain routing (CIDR) notation and how prefix-length-based addressing replaced classful IP addressing.",
    }],
    whatYoullLearn: [
      "CIDR notation's exact meaning: what the /n suffix specifies",
      "Computing a network's address range, broadcast address, and usable host count from a CIDR prefix",
      "Why CIDR enables aggregation (supernetting), reducing the size of routing tables",
      "Longest prefix match, and why it's the actual rule routers use to pick among multiple matching entries",
    ],
    prerequisites: ["IPv4 Addressing and Fragmentation"],
    concept: `## CIDR: Specifying The Network/Host Split Explicitly

::: remember
CIDR notation writes an address as address/n, where n is the number of bits (from the LEFT) that belong to the NETWORK portion - e.g. 192.168.1.0/24 means the first 24 bits are the network ID, leaving the remaining 8 bits for host addresses. This directly replaces classful addressing's rigid, address-derived boundaries with an explicitly stated, flexible split.
:::

## Computing Range, Broadcast, And Host Count

::: flow
1. Convert the address and prefix to binary :: Identify exactly which bits are network bits (the first n) and which are host bits (the remaining 32-n).
2. Network address :: Set ALL host bits to 0 - the lowest address in the range, identifying the network itself (not assignable to any device).
3. Broadcast address :: Set ALL host bits to 1 - the highest address in the range, used to reach every device on the network at once (also not assignable to a specific device).
4. Usable host count :: 2^(32-n) - 2 - subtracting 2 specifically for the network address and broadcast address, neither of which can be assigned to an actual host.
:::

::: mistake
Forgetting to subtract 2 from 2^(32-n) when computing usable host count. The network address and broadcast address are both structurally reserved (not usable by any actual device) - a /24 network has 2^8=256 total addresses, but only 254 are actually usable by hosts.
:::

## CIDR Enables Aggregation (Supernetting)

::: story
Before CIDR, an organization needing many small networks would need many separate routing table entries, one per class-C block. CIDR lets multiple CONSECUTIVE smaller networks be represented by ONE larger, aggregated entry with a SHORTER prefix (e.g. four consecutive /24 networks aggregated into one /22) - dramatically shrinking the number of entries a core Internet router needs to store.
:::

## Longest Prefix Match: The Actual Routing Rule

::: remember
When a router's table has MULTIPLE entries that could match a destination address (a broad aggregated entry AND a more specific one), it always picks the entry with the LONGEST matching prefix (the MOST specific match) - this is exactly what lets a specific exception route coexist correctly alongside a broader aggregated route covering the same address space.
:::

::: checkpoint
For the network 172.16.32.0/20, how many usable host addresses does it provide?
- ( ) 4096
- ( ) 2048
- (x) 4094
- ( ) 4095
> /20 means 32-20=12 host bits, giving 2^12=4096 total addresses. Subtracting 2 (network address and broadcast address, both unusable by hosts) gives 4096-2=4094 usable host addresses.
:::`,
    keyPoints: [
      "CIDR address/n: n bits (from the left) are the network portion, remaining 32-n bits are the host portion - an explicit, flexible replacement for classful addressing.",
      "Network address: all host bits 0 (lowest address, not assignable). Broadcast address: all host bits 1 (highest address, not assignable). Usable hosts = 2^(32-n) - 2.",
      "CIDR enables aggregation (supernetting): multiple consecutive smaller networks represented by one shorter-prefix entry, shrinking routing table sizes.",
      "Longest prefix match: when multiple table entries match a destination, the router picks the MOST SPECIFIC (longest prefix) one - the actual rule real routers use.",
    ],
    analogies: [
      "CIDR prefix length is like specifying how many digits of a postal code are 'the neighborhood' versus 'this specific house' - a shorter prefix covers a whole region broadly (aggregation), while a longer prefix pinpoints a specific address more precisely (longest prefix match picks the most precise match available).",
    ],
    commonMistakes: [
      "Forgetting to subtract 2 (network + broadcast addresses) when computing usable host count from 2^(32-n).",
      "Computing the wrong network/broadcast address by not correctly zeroing/setting exactly the HOST bits (getting the prefix boundary wrong).",
      "Assuming a router picks the FIRST matching entry rather than the LONGEST (most specific) matching prefix when multiple entries could apply.",
    ],
    memoryTricks: [
      "\"/n means n bits are network, from the LEFT.\" The entire meaning of CIDR notation in one clause.",
      "Usable hosts = 2^(host bits) - 2. Always subtract 2, for network address and broadcast address.",
    ],
    formulas: [
      "Total addresses in a /n network: 2^(32-n).",
      "Usable host addresses: 2^(32-n) - 2.",
      "Network address: address with all host bits set to 0. Broadcast address: address with all host bits set to 1.",
    ],
    shortcuts: [
      "For any CIDR numerical, compute the number of host bits (32-n) FIRST, then derive everything else (total addresses, usable hosts, network/broadcast address) from that single number.",
      "For a longest-prefix-match question, simply compare the prefix LENGTHS of all matching candidate entries - the largest n wins, regardless of anything else about the entries.",
    ],
    pyqRelevance: `CIDR numericals (compute network address, broadcast address, usable host count, or perform aggregation/subnetting given a prefix) are among the most frequent, reliable GATE Computer Networks question types - pure formula application once the host-bit-count is correctly identified.`,
    interviewConnection: `CIDR and subnetting are practical, everyday skills for anyone configuring real network infrastructure, and longest prefix match is literally the algorithm every production router implements for its forwarding table lookups - directly relevant to network engineering interviews.`,
    revisionSummary: `CIDR address/n: n bits (left) = network, 32-n bits = host. Network address: host bits all 0. Broadcast: host bits all 1. Usable hosts = 2^(32-n) - 2.

CIDR enables aggregation (supernetting): consecutive networks merged into one shorter-prefix entry, shrinking routing tables.

Longest prefix match: routers pick the most specific (longest prefix) matching entry when multiple entries match.`,
    shortNotes: {
      oneMinute: "CIDR /n: n bits (left)=network, 32-n=host. Network addr: host bits=0. Broadcast: host bits=1. Usable hosts=2^(32-n)-2. Aggregation: consecutive networks merged into one shorter-prefix entry (smaller routing tables). Longest prefix match: router picks the MOST SPECIFIC matching entry.",
    },
    mcqs: [
      {
        question: "A router's table has both a /16 entry and a /24 entry that both match a destination address. Which entry does the router use?",
        options: ["The /16 entry, since it was likely added first", "The /24 entry, because it has the longer (more specific) matching prefix", "Both entries are used simultaneously", "The router reports an error"],
        correctIndex: 1,
        explanation: "Routers apply longest prefix match: when multiple entries match, the one with the longest (most specific) prefix is chosen - here the /24 entry, since 24 > 16.",
      },
    ],
    numericals: [
      {
        question: "How many usable host addresses does a /26 network provide?",
        answerMin: 62,
        answerMax: 62,
        unit: "",
        solution: `Host bits = 32-26 = 6. Total addresses = 2^6 = 64. Usable = 64-2 = 62 (subtracting network and broadcast addresses).`,
      },
    ],
  },

  "network-address-translation": {
    difficulty: "Moderate",
    estimatedMinutes: 25,
    // Verified via YouTube oEmbed (2026-08-29) - real, publicly viewable.
    resources: [{
      kind: "video",
      title: "NAT & IPv6 | Chapter-6 | Computer Networks | nesoacademy.org",
      url: "https://www.youtube.com/watch?v=TF-6G-cFi5E",
      description: "Explains how Network Address Translation maps private IP addresses to public ones.",
    }],
    whatYoullLearn: [
      "Why NAT exists: the private-address-space problem it solves",
      "How NAPT (port-based NAT) lets many private hosts share ONE public IP address",
      "The NAT translation table, and exactly what it maps",
      "The specific limitation NAT creates for unsolicited inbound connections",
    ],
    prerequisites: ["IPv4 Addressing and Fragmentation", "TCP Flow Control"],
    concept: `## The Problem NAT Solves: Not Enough Public Addresses

::: story
IPv4 has only about 4 billion possible addresses - nowhere near enough for every device on Earth to have its own globally unique PUBLIC address. NAT (Network Address Translation) lets an entire private network (using addresses from reserved PRIVATE ranges like 192.168.x.x or 10.x.x.x) share just ONE public IP address for all its outbound Internet traffic.
:::

## NAPT: Sharing One Public IP Via Port Numbers

::: remember
NAPT (Network Address and Port Translation, what "NAT" usually means in practice) doesn't just translate IP addresses - it also rewrites the SOURCE PORT number of outgoing connections, using the (private IP, private port) -> (public IP, DIFFERENT public port) mapping to distinguish which of MANY internal hosts a given outbound connection actually belongs to, even though they all share the same single public IP.
:::

## The NAT Translation Table

::: flow
1. An internal host sends an outbound packet :: Source is (private IP, private port).
2. The NAT device REWRITES the source :: To (public IP, a chosen public port), and records this mapping in its translation table.
3. The rewritten packet travels the public Internet :: The external server only ever sees the public (IP, port) pair, never the internal private address at all.
4. A reply arrives at the public IP and port :: The NAT device looks up the translation table, finds the ORIGINAL (private IP, private port), and rewrites the destination back to deliver it to the correct internal host.
:::

::: mistake
Assuming NAT only translates IP addresses without also involving ports. Plain address-only NAT (one private IP to one public IP) genuinely doesn't scale to "many hosts, one public IP" - NAPT's PORT-based multiplexing is specifically what enables many simultaneous internal hosts to share a single public address.
:::

## The Limitation: Unsolicited Inbound Connections

::: remember
Because the translation table entry is created (and only exists) in response to an OUTBOUND connection, an EXTERNAL host generally CANNOT initiate a NEW connection directly to an internal host behind NAT - there's no existing table entry to route that unsolicited inbound packet to, which is exactly why NAT incidentally provides a degree of firewall-like protection, and why hosting a public-facing server behind plain NAT requires explicit port forwarding configuration.
:::

::: checkpoint
Why can't an external host on the Internet directly initiate a new connection to a device sitting behind a typical NAT, without additional configuration?
- ( ) NAT blocks all incoming traffic by policy
- (x) No translation table entry exists for an unsolicited inbound connection, since entries are only created in response to an OUTBOUND connection from the internal host
- ( ) NAT only works for outgoing web browsing traffic
- ( ) External hosts cannot use IP addresses at all
> The NAT device only knows how to route a reply back to the correct internal host because IT created that specific mapping when the internal host initiated an OUTBOUND connection - an inbound connection with no matching existing entry has nowhere defined to go, unless explicit port forwarding is configured to create a standing mapping in advance.
:::`,
    keyPoints: [
      "NAT lets a private network share one public IP for outbound Internet traffic, addressing IPv4's limited address space.",
      "NAPT (the common real-world form) rewrites both IP address AND port, using (private IP, private port) -> (public IP, public port) mappings to distinguish multiple internal hosts sharing one public IP.",
      "The NAT translation table is built dynamically from outbound connections; inbound replies are matched back to the correct internal host via this table.",
      "Unsolicited inbound connections from external hosts generally fail (no existing table entry) unless explicit port forwarding is configured - an incidental firewall-like side effect of NAT.",
    ],
    analogies: [
      "NAT is like an office's single shared reception phone number with internal extensions: every employee (private IP) can call OUT and the outside world only sees the one shared number (public IP), but an outside caller can't reach a specific employee's desk directly without knowing to ask reception to explicitly connect them (port forwarding) - reception only routes calls it initiated a transfer for.",
    ],
    commonMistakes: [
      "Assuming NAT only rewrites IP addresses, missing that real-world NAPT also rewrites port numbers to allow many hosts to share one public IP.",
      "Assuming an external host can always reach an internal device by its private IP or through NAT without any special configuration - unsolicited inbound connections are specifically blocked by the translation table's outbound-only creation.",
      "Confusing NAT's incidental firewall-like protection with an actual dedicated firewall - NAT's blocking of unsolicited inbound traffic is a side effect of its translation mechanism, not a security feature designed from scratch.",
    ],
    memoryTricks: [
      "\"NAPT: one public IP, many private hosts, ports tell them apart.\" The whole mechanism in one line.",
      "NAT table entries are created OUTBOUND-first - no outbound connection ever happened, no inbound connection can find its way in.",
    ],
    formulas: [],
    shortcuts: [
      "For a NAT question involving multiple internal hosts sharing one public IP, immediately think in terms of PORT numbers as the distinguishing factor, not just IP addresses alone.",
      "If a question asks why an external server can't initiate contact with an internal host, the answer is almost always 'no existing translation table entry' - trace back to the outbound-connection-first requirement.",
    ],
    pyqRelevance: `NAT/NAPT questions typically test the translation table mechanism conceptually (why unsolicited inbound fails, how port numbers distinguish hosts) - a moderate-frequency GATE Computer Networks topic, often connected to broader IPv4 address-scarcity discussion.`,
    interviewConnection: `NAT is a near-universal real-world networking mechanism (present in essentially every home router), and understanding why it complicates hosting a server or peer-to-peer connections (requiring port forwarding or NAT traversal techniques like STUN/TURN) is directly relevant to practical networked-application design discussions.`,
    revisionSummary: `NAT shares one public IP for a private network's outbound traffic, addressing IPv4's address scarcity. NAPT rewrites both IP and port, using (private IP,port)->(public IP,port) mappings to distinguish many internal hosts.

Translation table entries are created by outbound connections; inbound replies are matched back via this table.

Unsolicited inbound connections generally fail (no matching entry) without explicit port forwarding - an incidental firewall-like effect.`,
    shortNotes: {
      oneMinute: "NAT: shares 1 public IP for a private network's outbound traffic. NAPT: rewrites IP+PORT, (private IP,port)->(public IP,port), lets many hosts share 1 public IP. Translation table: built by outbound connections; matches inbound replies back. Unsolicited inbound fails without port forwarding (no table entry) - incidental firewall effect.",
    },
    mcqs: [
      {
        question: "What does NAPT (port-based NAT) additionally rewrite, beyond just the IP address, to let multiple internal hosts share one public IP?",
        options: ["The MAC address", "The port number", "The TTL field", "The protocol type"],
        correctIndex: 1,
        explanation: "NAPT rewrites the source PORT number (along with the IP address) for each outbound connection, using the resulting (public IP, public port) combination to distinguish which of many internal hosts a given connection belongs to.",
      },
    ],
    numericals: [],
  },

  // ---------------- Transport Layer ----------------

  "tcp-flow-control": {
    difficulty: "Moderate",
    estimatedMinutes: 30,
    // Verified via YouTube oEmbed (2026-08-29) - real, publicly viewable.
    resources: [{
      kind: "video",
      title: "Flow Control",
      url: "https://www.youtube.com/watch?v=ReQiSK8W3Ag",
      description: "Explains flow control using the sliding window mechanism that prevents a sender from overwhelming the receiver.",
    }],
    whatYoullLearn: [
      "What flow control actually protects against - specifically overwhelming the RECEIVER",
      "The sliding window mechanism, and how the receiver's advertised window controls the sender",
      "Why a zero window stalls a sender, and how the persist timer prevents a permanent stall",
      "Flow control's specific distinction from congestion control (a different, related mechanism)",
    ],
    prerequisites: ["TCP Congestion Control"],
    concept: `## Flow Control Protects The Receiver Specifically

::: mistake
Confusing flow control with congestion control. FLOW CONTROL protects the RECEIVER from being overwhelmed (sent data faster than it can process/buffer) - a receiver-side, END-TO-END concern. CONGESTION CONTROL protects the NETWORK itself from being overwhelmed by too much aggregate traffic - a network-wide concern. TCP implements both, but they solve genuinely different problems.
:::

## The Sliding Window: Receiver-Controlled

::: story
TCP's flow control uses a SLIDING WINDOW: the receiver continuously advertises how much MORE data it's currently willing to buffer (its available receive buffer space) in every ACK it sends back - and the sender is never allowed to have more UNACKNOWLEDGED data in flight than this most recently advertised window size.
:::

::: remember
The advertised window size can SHRINK or GROW dynamically as the receiver's application reads data out of its buffer (freeing space) or falls behind (buffer filling up) - flow control is a continuously updated, receiver-driven throttle on the sender, not a one-time negotiated fixed limit.
:::

## Zero Window: A Deliberate Stall, And Its Fix

::: flow
Receiver's buffer fills completely :: It advertises a WINDOW SIZE OF ZERO in its next ACK.
Sender must stop sending new data :: A zero window explicitly tells the sender "I have no room, do not send more right now."
Without a fix, this could stall forever :: If the receiver's window-update ACK (announcing new available space) is ITSELF lost, the sender would wait indefinitely with no further trigger to check again.
The persist timer solves this :: The sender periodically sends a small PROBE (a zero-window probe) even during a zero-window stall, specifically to elicit a fresh ACK from the receiver confirming whether the window has actually opened back up.
:::

::: mistake
Assuming a zero-window condition resolves itself automatically once the receiver has space again. It only resolves once the RECEIVER'S window-update ACK actually reaches the sender - the persist timer exists specifically because that critical ACK could itself be lost, which would otherwise stall the connection permanently.
:::

::: checkpoint
Why does TCP need a "persist timer" specifically for the zero-window scenario?
- ( ) To speed up normal data transmission
- (x) Because the receiver's window-update ACK (announcing newly available buffer space) could itself be lost, and without periodic probing the sender would wait forever with no other trigger to recheck
- ( ) To detect network congestion
- ( ) To compute round-trip time
> A zero window tells the sender to stop; normally, a later ACK announcing new space would resume it - but if THAT specific ACK is lost, the sender has no other signal to resume. The persist timer periodically sends a small probe specifically to re-elicit a fresh window announcement, preventing a permanent stall from one lost ACK.
:::`,
    keyPoints: [
      "Flow control protects the RECEIVER (end-to-end concern) from being overwhelmed; congestion control protects the NETWORK (a different, related mechanism) - genuinely different problems.",
      "Sliding window: receiver continuously advertises its available buffer space in every ACK; sender limits unacknowledged in-flight data to this most recent advertised value.",
      "Window size dynamically shrinks/grows as the receiver's buffer fills/empties - a continuously updated throttle, not a fixed negotiated limit.",
      "Zero window stalls the sender entirely; the persist timer periodically probes to recover from a lost window-update ACK that would otherwise cause a permanent stall.",
    ],
    analogies: [
      "TCP flow control is like a water tank with a float valve continuously signaling upstream how much more water it can currently accept - the moment the tank is full, it signals 'stop' (zero window), and a periodic gentle nudge (persist timer) checks back in case the 'there's room again' signal got lost along the way.",
    ],
    commonMistakes: [
      "Treating flow control and congestion control as the same mechanism - they protect different things (receiver vs network) via different mechanisms.",
      "Assuming the advertised window is a fixed value negotiated once at connection setup, rather than a continuously updated, dynamic value.",
      "Missing the specific role of the persist timer, and why a zero window without it could stall a connection permanently.",
    ],
    memoryTricks: [
      "\"Flow control: don't drown the RECEIVER. Congestion control: don't drown the NETWORK.\" Two different victims, two different mechanisms.",
      "Zero window = stop. Persist timer = periodic 'are we still stopped?' check, specifically guarding against a lost resume signal.",
    ],
    formulas: [],
    shortcuts: [
      "For a flow-control-vs-congestion-control question, ask 'what is being protected - the receiver's buffer, or the network's capacity' - that single question resolves the distinction immediately.",
      "If a question describes a connection stalling indefinitely after a zero window, the answer almost always involves the persist timer and a lost window-update ACK.",
    ],
    pyqRelevance: `TCP flow control questions typically test the sliding window mechanism conceptually and the specific flow-control-vs-congestion-control distinction - a recurring, moderate-difficulty GATE Computer Networks topic, often paired with a related TCP Congestion Control question.`,
    interviewConnection: `Understanding TCP flow control (and its distinction from congestion control) is foundational for any discussion of real network application performance tuning (buffer sizing, window scaling for high-bandwidth-delay links) - a standard networking-fundamentals interview topic.`,
    revisionSummary: `Flow control protects the receiver (end-to-end); congestion control protects the network - different mechanisms, different concerns.

Sliding window: receiver continuously advertises available buffer space in ACKs; sender limits unacknowledged data to that value. Window is dynamic, not fixed.

Zero window stalls the sender; persist timer periodically probes to recover from a lost window-update ACK, preventing a permanent stall.`,
    shortNotes: {
      oneMinute: "Flow control: protects RECEIVER (end-to-end). Congestion control: protects NETWORK - different mechanisms. Sliding window: receiver advertises buffer space in every ACK, dynamically. Sender caps unacked data to this. Zero window = stop. Persist timer: periodic probe recovers from a lost window-update ACK, prevents permanent stall.",
    },
    mcqs: [
      {
        question: "What is the fundamental difference between TCP flow control and congestion control?",
        options: [
          "They are the same mechanism with different names",
          "Flow control protects the receiver from being overwhelmed; congestion control protects the network",
          "Flow control is used only for UDP",
          "Congestion control operates only at the Physical layer",
        ],
        correctIndex: 1,
        explanation: "Flow control is an end-to-end mechanism specifically protecting the RECEIVER's buffer from being overwhelmed; congestion control is a separate mechanism protecting the shared NETWORK from being overwhelmed by aggregate traffic.",
      },
    ],
    numericals: [],
  },

  "tcp-congestion-control": {
    difficulty: "Hard",
    estimatedMinutes: 35,
    // Verified via YouTube oEmbed (2026-08-29) - real, publicly viewable.
    resources: [{
      kind: "video",
      title: "Lec-74: TCP Congestion Control in Computer Networks in Hindi",
      url: "https://www.youtube.com/watch?v=0bc_T_pEZmo",
      description: "Explains TCP congestion control mechanisms such as slow start and congestion avoidance.",
    }],
    whatYoullLearn: [
      "Slow start, and why it grows the congestion window EXPONENTIALLY at first",
      "Congestion avoidance, and why it switches to LINEAR growth after slow start",
      "How a timeout versus three duplicate ACKs trigger genuinely different recovery behaviour",
      "The actual sending rate: always the MINIMUM of the congestion window and the flow-control window",
    ],
    prerequisites: ["TCP Flow Control"],
    concept: `## Slow Start: Exponential Growth, Deliberately Cautious At First

::: story
TCP has NO advance knowledge of how much capacity the network path can actually handle - SLOW START begins conservatively (a congestion window, cwnd, of just 1 or a few segments) and DOUBLES it every round-trip time, probing for available capacity increasingly aggressively until either a loss is detected, or a threshold (ssthresh) is reached.
:::

::: remember
"Slow start" is a somewhat misleading name - the window actually grows EXPONENTIALLY (doubling each RTT), which is FAST, not slow. The name refers to starting from a small INITIAL value, not to the growth rate itself.
:::

## Congestion Avoidance: Switching To Linear Growth

::: flow
1. Slow start grows cwnd exponentially :: Until cwnd reaches ssthresh (slow start threshold).
2. Congestion avoidance takes over :: cwnd now grows LINEARLY - roughly by one segment per round-trip time, instead of doubling.
3. Why the switch happens :: Exponential growth is a fast way to find ROUGHLY where capacity is; linear growth is a cautious way to probe right AT the edge of capacity without repeatedly overshooting it badly.
:::

## Loss Detection: Timeout Vs Triple Duplicate ACK

::: cards Genuinely different severity, genuinely different response
Timeout (no ACK at all for a while) :: Treated as a SEVERE congestion signal. ssthresh is set to half the current cwnd, and cwnd is reset ALL THE WAY DOWN to 1 (or a small initial value) - back to slow start from scratch.
Three duplicate ACKs (fast retransmit) :: A MILDER signal - the network is still delivering SOME packets successfully (the duplicate ACKs are still arriving), just one specific segment was lost. ssthresh is set to half of cwnd, but cwnd only drops to ssthresh (NOT all the way to 1) - entering congestion avoidance directly, skipping a full slow-start restart. This is "fast recovery."
:::

::: mistake
Treating every packet loss identically. A TIMEOUT (total silence) is a much stronger signal of serious congestion than three duplicate ACKs (partial success still happening) - TCP's differentiated response (full reset vs fast recovery) reflects this genuine difference in severity, not an arbitrary implementation choice.
:::

## The Actual Sending Window: Minimum Of Two Limits

::: remember
TCP's actual sending window at any moment is min(cwnd, receiver's advertised flow-control window) - the SMALLER of the two limits always wins. Congestion control (cwnd, protecting the network) and flow control (protecting the receiver, see TCP Flow Control) are independent mechanisms, but they jointly cap the sender through this minimum.
:::

::: checkpoint
After a TIMEOUT (not three duplicate ACKs), what happens to TCP's congestion window?
- ( ) It is halved
- (x) It is reset all the way down to 1 (or a small initial value), restarting slow start from scratch
- ( ) It stays the same
- ( ) It doubles as a compensating measure
> A timeout is treated as a severe congestion signal (total silence, unlike duplicate ACKs which mean SOME packets are still getting through) - cwnd resets fully to a small initial value and slow start begins again from scratch, a much harsher response than fast recovery's partial reduction to ssthresh.
:::`,
    keyPoints: [
      "Slow start: cwnd starts small, DOUBLES every RTT (exponential growth despite the name) until reaching ssthresh or a loss occurs.",
      "Congestion avoidance: after ssthresh, cwnd grows LINEARLY (roughly +1 segment per RTT) - cautious probing near the capacity edge.",
      "Timeout: severe signal, cwnd resets fully to 1, restart slow start, ssthresh halved. Three duplicate ACKs (fast retransmit/recovery): milder signal, cwnd drops only to ssthresh (halved cwnd), skips full restart.",
      "Actual sending window = min(congestion window, receiver's advertised flow-control window) - the two mechanisms are independent but jointly cap the sender.",
    ],
    analogies: [
      "Slow start is like cautiously testing how much weight a bridge can hold by doubling your load each time you cross (fast probing, from a safe starting point); congestion avoidance is switching to adding just one small brick at a time once you're getting close to the bridge's actual limit - and a timeout (total silence) says 'the bridge just collapsed, start completely over from the lightest possible load,' while a few duplicate ACKs say 'one specific load fell off, but the bridge is clearly still standing.'",
    ],
    commonMistakes: [
      "Assuming 'slow start' means slow (linear or gradual) growth - it's actually the fastest phase, growing exponentially; 'slow' refers only to its cautious starting point.",
      "Treating timeout and triple-duplicate-ACK loss detection identically, missing TCP's genuinely different, severity-matched response to each.",
      "Forgetting the actual sending window is the MINIMUM of the congestion window and the flow-control window, not just the congestion window alone.",
    ],
    memoryTricks: [
      "\"Slow START, fast GROWTH.\" The name describes the starting point, not the growth rate, which actually doubles every RTT.",
      "Timeout: total collapse, start over (cwnd->1). Triple duplicate ACK: partial hiccup, ease off but keep going (cwnd->ssthresh).",
    ],
    formulas: [
      "Slow start: cwnd doubles each RTT until reaching ssthresh.",
      "Congestion avoidance: cwnd increases by roughly 1 segment per RTT (linear).",
      "On timeout: ssthresh = cwnd/2, cwnd = 1 (restart slow start).",
      "On triple duplicate ACK (fast recovery): ssthresh = cwnd/2, cwnd = ssthresh (enter congestion avoidance directly).",
      "Actual sending window = min(cwnd, receiver's advertised flow-control window).",
    ],
    shortcuts: [
      "For a congestion-window-tracing numerical, explicitly track which phase (slow start vs congestion avoidance) applies at each step, based on cwnd vs ssthresh - the growth RULE genuinely differs between the two phases.",
      "For a loss-response question, first identify whether it's a TIMEOUT or a TRIPLE DUPLICATE ACK - this single distinction determines the entire subsequent cwnd behaviour.",
    ],
    pyqRelevance: `TCP congestion control is one of the most heavily-weighted GATE Computer Networks topics - congestion window tracing across multiple RTTs (through slow start, congestion avoidance, and a loss event) is a near-guaranteed, high-value numerical most years.`,
    interviewConnection: `TCP congestion control (slow start, congestion avoidance, fast recovery) is foundational networking knowledge for any performance-sensitive application discussion, and understanding why a lossy or high-latency network path dramatically reduces TCP throughput (frequent cwnd resets) is directly relevant to real-world network application troubleshooting.`,
    revisionSummary: `Slow start: cwnd doubles per RTT (exponential) until ssthresh or loss. Congestion avoidance: cwnd grows linearly (+1/RTT) after ssthresh.

Timeout: severe, cwnd resets to 1, ssthresh=cwnd/2, restart slow start. Triple duplicate ACK (fast recovery): milder, cwnd drops only to ssthresh (halved), skips full restart.

Actual sending window = min(cwnd, receiver's flow-control window).`,
    shortNotes: {
      oneMinute: "Slow start: cwnd doubles/RTT (exponential) until ssthresh or loss. Congestion avoidance: cwnd +1/RTT (linear) after ssthresh. Timeout: severe - cwnd->1, ssthresh=cwnd/2, restart slow start. Triple dup ACK (fast recovery): milder - cwnd->ssthresh (=cwnd/2), skip restart. Actual window = min(cwnd, flow-control window).",
    },
    mcqs: [
      {
        question: "During slow start, how does TCP's congestion window (cwnd) grow?",
        options: ["Linearly, by 1 segment per RTT", "Exponentially, doubling each RTT", "It stays constant", "Randomly"],
        correctIndex: 1,
        explanation: "Despite the name 'slow start' (referring to its small starting value), cwnd actually grows exponentially, doubling every round-trip time, until reaching ssthresh or a loss occurs - the fastest growth phase, not the slowest.",
      },
      {
        question: "What is TCP's actual sending window at any given moment?",
        options: [
          "Always equal to the congestion window (cwnd)",
          "Always equal to the receiver's advertised flow-control window",
          "The minimum of the congestion window and the receiver's advertised flow-control window",
          "The sum of the congestion window and the flow-control window",
        ],
        correctIndex: 2,
        explanation: "The actual sending window is min(cwnd, flow-control window) - congestion control and flow control are independent mechanisms, but the sender is always capped by whichever of the two limits is smaller at the moment.",
      },
    ],
    numericals: [],
  },

  "socket-api": {
    difficulty: "Easy",
    estimatedMinutes: 25,
    // Verified via YouTube oEmbed (2026-08-29) - real, publicly viewable.
    resources: [{
      kind: "video",
      title: "Lec-86: Socket Programming in Computer Networks",
      url: "https://www.youtube.com/watch?v=XTVTlEhGS6w",
      description: "Explains socket programming as the API interface applications use to communicate over a network.",
    }],
    whatYoullLearn: [
      "What a socket actually represents: the (IP, port) endpoint abstraction",
      "The specific system call sequence a TCP server follows, in order",
      "The specific (shorter) system call sequence a TCP client follows",
      "Why a server can handle multiple simultaneous client connections through one listening socket",
    ],
    prerequisites: ["TCP Flow Control"],
    concept: `## A Socket: The Endpoint Abstraction Applications Actually Use

::: remember
A SOCKET is the programming abstraction an application uses to send/receive data over a network - conceptually, it represents ONE ENDPOINT of a connection, identified by an (IP address, port number) pair. Applications never manipulate raw packets directly; they read/write through a socket, and the OS/transport layer handles everything below that.
:::

## The Server's System Call Sequence

::: flow
1. socket() :: Create a new socket (an unbound endpoint, not yet usable for anything specific).
2. bind() :: Attach the socket to a SPECIFIC local (IP, port) - this is how a server claims "I'm listening on port 80," for instance.
3. listen() :: Mark the socket as PASSIVE - willing to accept incoming connection requests, and specify a queue size for pending connections.
4. accept() :: BLOCK until a client connection request arrives, then return a NEW socket specifically for that one connection (the original listening socket remains free to accept further new connections).
5. read()/write() :: Exchange data with the client over the NEW connection-specific socket returned by accept().
:::

::: mistake
Assuming the SAME socket returned by listen() is used to actually exchange data with a client. accept() specifically returns a BRAND NEW socket, dedicated to that one connection - the original listening socket stays free and continues accepting OTHER new connections, which is exactly what lets one server handle many simultaneous clients.
:::

## The Client's Simpler Sequence

::: flow
1. socket() :: Create a new socket.
2. connect() :: Actively initiate a connection to the server's specific (IP, port) - this single call also implicitly handles binding a local ephemeral port for the client, and (for TCP) triggers the three-way handshake.
3. read()/write() :: Exchange data once connected.
:::

::: remember
The client's sequence has NO bind(), listen(), or accept() - those are specifically server-side concepts (claiming a well-known port, passively waiting, and spawning per-connection sockets). A client actively INITIATES toward a known destination instead.
:::

::: checkpoint
Why does a TCP server's accept() call return a NEW socket, distinct from the original listening socket?
- ( ) To improve performance through caching
- (x) So the original listening socket remains free to accept further NEW incoming connections, while the returned socket handles this one specific client
- ( ) Because sockets can only be used once
- ( ) It's purely a historical convention with no functional purpose
> Returning a dedicated new socket per accepted connection is exactly what allows the server to keep LISTENING for and accepting additional new clients on the original socket, while simultaneously exchanging data with already-connected clients through their own dedicated sockets - the mechanism that enables handling many simultaneous connections from one listening endpoint.
:::`,
    keyPoints: [
      "A socket represents one connection endpoint, identified by an (IP, port) pair - the abstraction applications actually use instead of raw packets.",
      "Server sequence: socket() -> bind() (claim a specific local address/port) -> listen() (passive, accept incoming requests) -> accept() (blocks, returns a NEW per-connection socket) -> read()/write().",
      "Client sequence: socket() -> connect() (actively initiate to the server's address, implicitly binds a local ephemeral port, triggers the handshake) -> read()/write() - no bind/listen/accept needed.",
      "accept() returning a distinct new socket (leaving the original listening socket free) is exactly what lets one server handle many simultaneous client connections.",
    ],
    analogies: [
      "A listening socket is like a receptionist's main phone line, always free to answer new incoming calls - accept() is the receptionist transferring each new caller to their own dedicated extension (a new socket) so the main line stays free to keep answering the NEXT call, while each transferred conversation continues independently.",
    ],
    commonMistakes: [
      "Assuming the listening socket itself is used for ongoing data exchange with a connected client, rather than the distinct socket accept() returns.",
      "Including bind()/listen()/accept() in a description of the CLIENT's sequence - these are server-only concepts.",
      "Forgetting connect() implicitly handles the client's own local port binding, rather than requiring an explicit separate bind() call on the client side.",
    ],
    memoryTricks: [
      "\"Server: socket, bind, listen, accept, then talk (on the NEW socket).\" Five steps, in that exact order.",
      "\"Client: socket, connect, then talk.\" Just three steps - no waiting, no claiming a well-known address.",
    ],
    formulas: [],
    shortcuts: [
      "For a socket-API-sequence question, count the steps: if bind/listen/accept appear, it's describing the SERVER side; if only socket/connect appear, it's the CLIENT side.",
      "If a question asks how a server serves multiple clients simultaneously through 'one' socket, the answer is always that accept() returns a NEW socket per connection, not that the original socket somehow multiplexes everything itself.",
    ],
    pyqRelevance: `Socket API questions typically test the correct ORDER of system calls for server vs client, and the specific reasoning behind why accept() returns a new socket - a reliable, moderate-frequency conceptual GATE Computer Networks question.`,
    interviewConnection: `The socket API sequence (socket/bind/listen/accept for servers, socket/connect for clients) is directly what real network programming (in C, Python, Java, etc.) is built on - genuinely practical, hands-on knowledge tested in systems-programming and networking interviews alike.`,
    revisionSummary: `Socket: an (IP, port) connection endpoint abstraction.

Server: socket() -> bind() -> listen() -> accept() (returns a NEW per-connection socket, original stays free) -> read()/write().

Client: socket() -> connect() (implicitly binds a local port, triggers handshake) -> read()/write(). No bind/listen/accept on the client side.`,
    shortNotes: {
      oneMinute: "Socket: (IP,port) endpoint abstraction. Server: socket()->bind()->listen()->accept()(returns NEW per-connection socket, original stays free)->read/write. Client: socket()->connect()(implicit local bind, triggers handshake)->read/write. accept()'s new socket per connection = how one server handles many clients.",
    },
    mcqs: [
      {
        question: "Which system call sequence correctly describes a TCP CLIENT (not server)?",
        options: [
          "socket(), bind(), listen(), accept()",
          "socket(), connect()",
          "socket(), listen(), connect()",
          "bind(), socket(), connect()",
        ],
        correctIndex: 1,
        explanation: "A client only needs socket() (create) followed by connect() (actively initiate to the server) - bind(), listen(), and accept() are server-side concepts the client never needs.",
      },
    ],
    numericals: [],
  },

  // ---------------- Application Layer ----------------

  "dns": {
    difficulty: "Moderate",
    estimatedMinutes: 25,
    // Verified via YouTube oEmbed (2026-08-29) - real, publicly viewable.
    resources: [{
      kind: "video",
      title: "Lec-81: Domain Name Server(DNS) & its types in Hindi | All about DNS",
      url: "https://www.youtube.com/watch?v=BZISxpdl4lQ",
      description: "Covers what DNS is, its hierarchical namespace, and the types of DNS servers.",
    }],
    whatYoullLearn: [
      "Why DNS is organized as a hierarchical, distributed namespace instead of one giant central table",
      "Recursive vs iterative queries, and who does the actual work in each",
      "The resolution path: root, TLD, and authoritative name servers, in order",
      "Why caching (and TTL) is essential to DNS actually working at Internet scale",
    ],
    prerequisites: ["Principles of Layering"],
    concept: `## Why Not Just One Giant Table?

::: story
DNS translates human-readable domain names (like example.com) into IP addresses - and it's organized as a HIERARCHICAL, DISTRIBUTED namespace (not one central database) specifically because no single server could handle the entire Internet's lookup volume, and no single organization should have to manage every domain on Earth.
:::

## The Hierarchy: Root, TLD, Authoritative

::: flow
Root name servers :: Know only how to direct a query toward the correct TOP-LEVEL DOMAIN (TLD) server - they don't know about example.com specifically, only "for .com domains, ask THIS server."
TLD name servers :: Know only how to direct a query toward the correct AUTHORITATIVE server for a specific domain within their TLD (e.g. .com's TLD server knows where example.com's authoritative server is).
Authoritative name servers :: Actually HOLD the real records for a specific domain (example.com's own IP address, mail server records, etc.) - this is where the actual answer finally comes from.
:::

## Recursive Vs Iterative Queries: Who Does The Work

::: cards
Recursive query :: The queried server does ALL the work itself, following the ENTIRE chain (root -> TLD -> authoritative) on the client's behalf, and returns only the FINAL answer. Typically what a client asks of its local resolver.
Iterative query :: The queried server returns its BEST CURRENT ANSWER (which might just be "ask this OTHER server next") rather than doing further work itself - the QUERIER must follow up with each subsequent referral itself. Typically what a resolver does when talking to root/TLD/authoritative servers.
:::

::: mistake
Assuming every DNS query in the resolution chain is the same TYPE. Typically, a CLIENT makes ONE recursive query to its LOCAL RESOLVER (asking for the complete final answer) - but that resolver then makes a SERIES of ITERATIVE queries to root, then TLD, then authoritative servers, following referrals itself rather than asking each of them to do everything.
:::

## Caching: What Makes This Actually Fast At Scale

::: remember
Every DNS response includes a TTL (Time To Live) - resolvers CACHE the answer for that duration, answering future identical queries directly from cache without repeating the full resolution chain. This caching is not an optional optimization; it's ESSENTIAL to DNS handling real-world Internet query volume without collapsing root/TLD servers under load.
:::

::: checkpoint
A client asks its local DNS resolver to look up www.example.com, and receives the final IP address directly, without needing to contact root/TLD/authoritative servers itself. What kind of query did the client make?
- (x) A recursive query - the resolver did all the work and returned only the final answer
- ( ) An iterative query - the client had to follow referrals itself
- ( ) Neither term applies to client-resolver interactions
- ( ) A cached query specifically, which is a separate query type
> The client received the complete final answer in one exchange, without following any referrals itself - this is the defining behaviour of a recursive query, where the queried server (the local resolver) does the entire chain of work internally on the client's behalf.
:::`,
    keyPoints: [
      "DNS: hierarchical, distributed namespace - no single server could handle the full Internet's lookup volume or every domain's management centrally.",
      "Resolution chain: root name servers (point to TLD) -> TLD name servers (point to authoritative) -> authoritative name servers (hold the actual records).",
      "Recursive query: the queried server does all the work, returns only the final answer (typical client-to-resolver interaction). Iterative query: the queried server returns a referral, querier follows up itself (typical resolver-to-root/TLD/authoritative interaction).",
      "Caching (via each response's TTL) is essential, not optional - it's what keeps root/TLD servers from being overwhelmed by repeated identical queries at Internet scale.",
    ],
    analogies: [
      "DNS's hierarchy is like asking for directions in stages: a city directory (root) points you to the right neighborhood office (TLD), which points you to the specific building's front desk (authoritative server) that actually knows the exact room number (IP address) - no single directory tries to know every room number in the entire city directly.",
    ],
    commonMistakes: [
      "Assuming every step in DNS resolution uses the same query type (recursive vs iterative) - the typical pattern mixes one recursive client-to-resolver query with a chain of iterative resolver-to-server queries.",
      "Underestimating caching's role, treating it as a minor performance nicety rather than a structural requirement for DNS to function at Internet scale.",
      "Confusing what root, TLD, and authoritative servers each actually know - root/TLD only know WHERE to look next, only authoritative servers hold the actual final records.",
    ],
    memoryTricks: [
      "\"Root points to TLD, TLD points to authoritative, authoritative HAS the answer.\" Three levels, only the last one actually knows the record.",
      "Recursive: 'you handle it all for me.' Iterative: 'just tell me who to ask next.'",
    ],
    formulas: [],
    shortcuts: [
      "For a recursive-vs-iterative question, check WHO is doing the follow-up work - if the QUERIED server chases down the full chain itself, it's recursive; if the QUERIER has to follow referrals itself, it's iterative.",
      "If a question emphasizes DNS's ability to handle massive query volume, the explanation almost always centers on caching (TTL-based), not just the hierarchy alone.",
    ],
    pyqRelevance: `DNS questions typically test the resolution hierarchy (root/TLD/authoritative roles) and the recursive-vs-iterative query distinction conceptually - a moderate-frequency, foundational GATE Computer Networks Application-layer topic.`,
    interviewConnection: `Understanding DNS resolution (and caching/TTL behaviour specifically) is directly relevant to real-world web performance and deployment discussions (DNS propagation delays after a record change are literally a TTL-caching phenomenon) - a common practical networking interview topic.`,
    revisionSummary: `DNS: hierarchical, distributed namespace. Root name servers point to TLD servers, TLD servers point to authoritative servers, authoritative servers hold the actual records.

Recursive query: queried server does all the work, returns the final answer (typical client-to-resolver). Iterative query: queried server returns a referral, querier follows up itself (typical resolver-to-root/TLD/authoritative).

Caching (via TTL) is essential to DNS working at Internet scale, not an optional optimization.`,
    shortNotes: {
      oneMinute: "DNS: hierarchical/distributed. Root->points to TLD. TLD->points to authoritative. Authoritative->HAS the record. Recursive query: queried server does everything, returns final answer (client->resolver). Iterative: queried server returns a referral, querier follows up (resolver->root/TLD/authoritative). Caching (TTL) is essential at Internet scale.",
    },
    mcqs: [
      {
        question: "What does a root DNS name server actually know about a specific domain like example.com?",
        options: [
          "example.com's exact IP address",
          "Only how to direct the query toward the correct TLD (.com) server",
          "Nothing at all about any domain",
          "Every domain's full record, cached locally",
        ],
        correctIndex: 1,
        explanation: "Root servers only know how to point a query toward the correct top-level domain (TLD) server - they don't hold specific domain records themselves; that's the authoritative server's role, several steps further down the hierarchy.",
      },
    ],
    numericals: [],
  },

  "http": {
    difficulty: "Easy",
    estimatedMinutes: 25,
    // Verified via YouTube oEmbed (2026-08-29) - real, publicly viewable.
    resources: [{
      kind: "video",
      title: "Lec-83: HTTP, FTP, SMTP, POP | All Application Layer Protocols | Computer Networks",
      url: "https://www.youtube.com/watch?v=pnoWCK82apU",
      description: "Explains HTTP alongside other application-layer protocols (FTP, SMTP, POP) and how the web request/response model works.",
    }],
    whatYoullLearn: [
      "The core HTTP methods and precisely what each one is meant to do",
      "The idempotent vs non-idempotent method distinction, and why it actually matters",
      "Status code categories (1xx-5xx), and how to classify a response at a glance",
      "Persistent vs non-persistent connections, and what HTTP/1.1 changed by default",
    ],
    prerequisites: ["TCP Flow Control", "DNS"],
    concept: `## Core HTTP Methods

::: cards
GET :: Retrieve a resource. Should have NO side effects (safe) - a GET request is not supposed to change server state.
POST :: Submit data to be processed (e.g. creating a new resource) - typically DOES have side effects.
PUT :: Replace a resource entirely with the provided data.
DELETE :: Remove a resource.
:::

## Idempotent Vs Non-Idempotent: A Real, Testable Distinction

::: remember
A method is IDEMPOTENT if making the SAME request multiple times has the SAME EFFECT as making it once. GET, PUT, and DELETE are idempotent (repeating "set resource X to value Y" or "delete resource X" any number of times leaves the same end result as doing it once). POST is generally NOT idempotent (submitting the same "create a new order" request twice typically creates TWO orders, a genuinely different end result).
:::

::: mistake
Assuming idempotent means "doesn't change anything." PUT and DELETE both DO change server state - idempotency specifically means REPEATING the request doesn't change the OUTCOME further beyond what the first request already did, not that no change happens at all.
:::

## Status Code Categories

::: cards
1xx (Informational) :: Request received, processing continues (rarely seen directly by typical applications).
2xx (Success) :: The request was successfully received, understood, and accepted (200 OK, 201 Created).
3xx (Redirection) :: Further action needed to complete the request (301 Moved Permanently, 302 Found).
4xx (Client Error) :: The request itself has a problem (404 Not Found, 400 Bad Request) - the CLIENT is at fault.
5xx (Server Error) :: The server failed to fulfill an apparently valid request (500 Internal Server Error) - the SERVER is at fault.
:::

::: mistake
Confusing 4xx (client's fault - bad request, wrong URL, unauthorized) with 5xx (server's fault - something broke on the server's side while trying to handle an otherwise-valid request). The FIRST digit alone tells you which SIDE the problem originated from.
:::

## Persistent Vs Non-Persistent Connections

::: flow
Non-persistent (HTTP/1.0 default) :: A NEW TCP connection is opened for EVERY single request/response - significant overhead from repeated TCP handshakes for a page with many resources (images, scripts, etc.).
Persistent (HTTP/1.1 default) :: The SAME TCP connection is REUSED for multiple sequential requests/responses - avoids repeated handshake overhead, a significant performance improvement HTTP/1.1 made the default behaviour.
:::

::: checkpoint
A client sends the exact same PUT request (replacing resource X with value Y) three times in a row. What happens?
- ( ) Three separate copies of the resource are created
- (x) Resource X ends up set to value Y, the same end result as if the request had been sent just once (PUT is idempotent)
- ( ) The third request fails with an error
- ( ) The server merges all three requests into one
> PUT is idempotent - repeating the exact same "set X to Y" request any number of times produces the same final state (X = Y) as doing it just once, unlike POST, where repeating a "create a new resource" request would typically create multiple separate resources.
:::`,
    codeExample: {
      language: "http",
      code: `GET /index.html HTTP/1.1
Host: www.example.com
Connection: keep-alive          <- HTTP/1.1 default: persistent connection

HTTP/1.1 200 OK                  <- 2xx: success
Content-Type: text/html
Content-Length: 1234

<html>...</html>`,
      expectedOutput: `(illustrates a persistent-connection GET request and its 200 OK response - not a fixed computed output)`,
    },
    keyPoints: [
      "GET (retrieve, safe/no side effects), POST (submit/create, side effects, not idempotent), PUT (replace entirely, idempotent), DELETE (remove, idempotent) - the core methods.",
      "Idempotent: repeating the SAME request produces the SAME end result as doing it once - GET/PUT/DELETE are idempotent, POST generally is not (repeated POSTs typically create multiple resources).",
      "Status code first digit indicates the category: 1xx informational, 2xx success, 3xx redirection, 4xx client error, 5xx server error - the first digit alone tells you which side (client or server) a 4xx/5xx problem originates from.",
      "Non-persistent (HTTP/1.0 default): new TCP connection per request. Persistent (HTTP/1.1 default): one TCP connection reused for multiple requests - avoiding repeated handshake overhead.",
    ],
    analogies: [
      "Idempotency is like a light switch's 'set to ON' instruction versus 'flip the current state' instruction: pressing 'set to ON' repeatedly always leaves the light ON (idempotent, like PUT), but repeatedly 'flip the state' toggles it back and forth with each press (non-idempotent, similar in spirit to why POST's 'create a new thing' repeats produce cumulative new effects each time).",
    ],
    commonMistakes: [
      "Assuming idempotent means 'no state change happens' rather than 'repeating it doesn't change the outcome further.'",
      "Mixing up 4xx (client's fault) and 5xx (server's fault) status code categories.",
      "Assuming HTTP/1.0's non-persistent, one-connection-per-request behaviour is still the default - HTTP/1.1 made persistent connections the default specifically to reduce this overhead.",
    ],
    memoryTricks: [
      "\"GET, PUT, DELETE: repeat it, same result (idempotent). POST: repeat it, more stuff happens (not idempotent).\"",
      "4 for your fault (client), 5 for their fault (server) - the first digit of the status code tells you which side.",
    ],
    formulas: [],
    shortcuts: [
      "For an idempotency question, ask 'if I repeat this exact request N times, is the end state the same as doing it once?' - if yes, idempotent; if the effect accumulates, not idempotent.",
      "For a status code question, use only the FIRST digit to classify the category (1-5) before worrying about the specific code's exact meaning.",
    ],
    pyqRelevance: `HTTP questions typically test method semantics (especially idempotency), status code category classification, and persistent-vs-non-persistent connection behaviour - a reliable, moderate-frequency, largely conceptual GATE Computer Networks Application-layer topic.`,
    interviewConnection: `HTTP methods, idempotency, and status codes are foundational, everyday knowledge for REST API design - understanding why PUT (idempotent) is preferred over POST for update operations, and correctly using 4xx vs 5xx status codes, is directly tested in web/backend development interviews.`,
    revisionSummary: `GET (retrieve, safe), POST (create, side effects, NOT idempotent), PUT (replace, idempotent), DELETE (remove, idempotent).

Status codes: 1xx info, 2xx success, 3xx redirect, 4xx client error, 5xx server error - first digit tells you the category/fault side.

Non-persistent (HTTP/1.0): new connection per request. Persistent (HTTP/1.1 default): connection reused across requests.`,
    shortNotes: {
      oneMinute: "GET(retrieve,safe)/POST(create,side-effects,NOT idempotent)/PUT(replace,idempotent)/DELETE(remove,idempotent). Idempotent = repeating gives same end result. Status codes: 1xx info/2xx success/3xx redirect/4xx client fault/5xx server fault. Non-persistent(HTTP/1.0): new connection/request. Persistent(HTTP/1.1 default): connection reused.",
    },
    mcqs: [
      {
        question: "Which HTTP method is generally considered NOT idempotent?",
        options: ["GET", "PUT", "DELETE", "POST"],
        correctIndex: 3,
        explanation: "POST is generally not idempotent - submitting the same 'create a new resource' request multiple times typically creates multiple separate resources, a different cumulative outcome than doing it once. GET, PUT, and DELETE are all idempotent.",
      },
      {
        question: "A client receives an HTTP status code starting with 5 (e.g. 500). What does this indicate?",
        options: ["The client made a malformed request", "The requested resource was moved", "The server failed to fulfill an otherwise valid request", "The request succeeded"],
        correctIndex: 2,
        explanation: "5xx status codes indicate a SERVER-side error - the server failed while trying to handle an apparently valid request, distinct from 4xx codes which indicate a problem with the client's request itself.",
      },
    ],
    numericals: [],
  },

};
