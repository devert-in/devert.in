// Digital Logic Design - rewritten lesson bodies. See operating-systems.mjs for
// the authoring rules. This subject sits directly on top of Computer
// Organization's gate coverage and directly under Microprocessors, so the
// cross-references in both directions are deliberate - a student should finish
// able to see the path from a NAND gate to a CPU.

export const DIGITAL_LOGIC_DESIGN = {
  "introduction-to-digital-logic-design": {
    concept: `## Knowing A Gate Isn't Designing A Circuit

::: story
The Computer Organization subject covered AND, OR, NOT, NAND and NOR - what each one does, and their truth tables.

Which is a bit like knowing what a brick is. Useful, and some distance from building a house.
:::

This subject is about composition: how gates combine into adders, memory cells, counters and custom state machines - and how to make the result as small as possible, because every gate you remove is real cost, heat and delay removed from a physical chip.

## The Distinction Everything Hangs On

::: cards
Combinational :: Output depends only on the current inputs. No memory. An adder gives the same sum for the same two numbers, always, regardless of what came before.
Sequential :: Output depends on the current inputs *and* the circuit's own past state. A counter's next value depends on its current value.
:::

::: remember
That split is this subject's own structure - the combinational lessons, then the sequential ones - and it's the first thing to have straight.

The dividing question is simple: **does this circuit need to remember anything?** If yes, it needs storage, and storage needs feedback.
:::

::: checkpoint
A vending machine tracks how much money has been inserted so far. Combinational or sequential?
- ( ) Combinational - it just adds coins
- (x) Sequential - the running total is remembered state
- ( ) Neither
- ( ) Both equally
> The total from previous coins has to persist between inputs, which is memory - and memory is what makes a circuit sequential.
:::

::: didyouknow
Almost nobody draws gates by hand professionally any more.

Real designs are written in a **hardware description language** - Verilog or VHDL - describing behaviour in something close to code. Synthesis tools convert that into an optimised gate-level circuit automatically.

Which doesn't make this subject obsolete: it's what those tools are generating, and reading their output requires knowing it.
:::`,
  },

  "combinational-circuits-adders-multiplexers": {
    concept: `## Three Circuits That Appear Everywhere

::: story
The Computer Organization subject built a half adder - two bits in, sum and carry out, from an XOR and an AND.

A **full adder** adds one more input: a carry *in*, from the position below. Which is what lets you chain them.
:::

::: flow
bit 0 adder -> carry -> bit 1 adder -> carry -> bit 2 adder -> carry -> bit 3 adder
:::

Four full adders chained like that add two 4-bit numbers. That's a **ripple-carry adder**, and it's how arithmetic gets done in hardware.

## Routing Data

::: cards
Multiplexer (MUX) :: Several inputs, select lines, one output. Passes through whichever input the select lines choose. A 4-to-1 MUX needs 2 select bits.
Demultiplexer (DEMUX) :: The reverse. One input, several outputs, select lines choosing which output receives it.
:::

::: story
A CPU's ALU needs its operands to come sometimes from a register, sometimes from memory, sometimes from the instruction itself.

That choice is a multiplexer. Every "which of these sources feeds this unit?" decision in a processor is one, and there are thousands.
:::

## Decoders And Memory

::: remember
A **decoder** takes N input bits and activates exactly one of 2^N outputs.

Which is how memory addressing physically works. A 20-bit address into a decoder activates exactly one of a million rows - so a million locations are individually selectable with twenty wires rather than a million.

Without decoders, addressable memory at any real scale would be impossible.
:::

::: checkpoint
A 3-to-8 decoder receives input 101. What happens?
- ( ) All eight outputs activate
- (x) Exactly one output activates - the one corresponding to 5
- ( ) Five outputs activate
- ( ) The output depends on a clock signal
> One output, selected by the binary value. Exactly-one-of-many is what makes it a decoder, and it's why the same circuit selects a memory row, an instruction handler, or a display segment.
:::

::: behind
Ripple-carry has a real cost: the top bit's sum isn't valid until the carry has propagated through every lower bit in sequence. Delay grows linearly with width.

**Carry-lookahead** adders compute the carries in parallel using extra logic, so a 64-bit addition doesn't take 64 sequential steps. More gates, considerably faster - which is the trade this subject keeps making.
:::`,
  },

  "karnaugh-maps-minimization": {
    concept: `## Simplifying Without Algebra

::: story
Boolean algebra simplifies expressions, and by four variables it's a slog - sixteen rows of truth table and a page of manipulation, with every step an opportunity to lose a term.

A **Karnaugh map** turns the same job into looking at a grid.
:::

::: remember
The trick is the ordering. Cells are arranged so that **adjacent cells differ in exactly one variable** - Gray code order, not counting order.

Which means adjacent 1s can be grouped, and the variable that differs across the group drops out of the term entirely, because it demonstrably doesn't affect the output there.
:::

## The Grouping Rules

::: cards The rules
Group only 1s :: Adjacent cells containing 1.
Groups must be powers of 2 :: 1, 2, 4, 8 cells. Never 3, never 6.
Bigger is better :: A larger group means more variables eliminated, so a simpler term.
Fewer is better :: Cover every 1 with as few groups as possible. Overlapping groups are allowed.
:::

::: story
A two-variable example:

           B=0   B=1
    A=0  |  0  |  1  |
    A=1  |  0  |  1  |

The whole B=1 column is 1s - a group of two. A varies across it and the output doesn't, so A drops out.

F = B. From what started as A'B + AB.
:::

::: checkpoint
Why must groups be powers of two?
- ( ) Convention
- (x) Only power-of-two groups correspond to eliminating whole variables - other sizes don't simplify to a single term
- ( ) Larger groups are faster to compute
- ( ) They don't have to be
> The algebra underneath requires it. A group of three cells has no single product term describing exactly those cells, so it can't be read off as one term - which is why the rule isn't arbitrary.
:::

::: remember
And this is not a paper exercise. Each eliminated term is gates that don't get fabricated - less silicon, less power, less propagation delay, lower cost per chip.

Simplifying on paper is designing cheaper hardware.
:::

::: behind
K-maps stop being usable past four or five variables - the grid becomes impossible to read.

**Quine-McCluskey** is the tabular equivalent, systematic and automatable. Modern synthesis tools use descendants like Espresso, minimising circuits with thousands of variables that no human could approach.

Which is fine: knowing what the tool is doing is what lets you read its output.
:::`,
  },

  "latches-flip-flops": {
    concept: `## Remembering One Bit

::: story
Every circuit so far forgets everything the moment its inputs change. To build a counter, a register, or memory, something has to hold a value.

The trick is feedback: wire two NOR gates so each one's output feeds the other's input, and the pair becomes stable in either of two states - holding a bit with no clock, no special component, just ordinary gates in a loop.
:::

That's an **SR latch**: Set stores a 1, Reset stores a 0, and with neither asserted it holds whatever it had.

## Level Versus Edge

::: cards
Latch - level-triggered :: Responds continuously the whole time its enable is high. Input changes during that window pass straight through.
Flip-flop - edge-triggered :: Captures its input at the precise instant a clock transitions, then holds it, ignoring everything until the next edge.
:::

::: story
Why that matters: imagine a thousand storage elements in a CPU, all feeding each other.

With latches, a value could race through several of them within one enable window - the result depending on gate delays rather than on the design. With flip-flops, every element captures simultaneously on the clock edge and holds still until the next one.

One arrangement is analysable. The other is a hardware engineer's nightmare.
:::

::: remember
Which is why real synchronous designs are built from flip-flops. The shared clock makes the entire chip's state advance in lockstep, one well-defined step at a time.

And that clock is the same one the Computer Organization subject measured in GHz - the signal driving every flip-flop on the die.
:::

::: checkpoint
Why does edge-triggering make a large circuit predictable?
- ( ) Edges are faster than levels
- (x) Every element captures at the same instant and holds, so signals can't race through multiple stages in one cycle
- ( ) It uses fewer gates
- ( ) It removes the need for a clock
> Simultaneous capture with a stable hold period. Which is what makes timing analysable - you check that signals settle within one clock period, and that's the whole discipline.
:::

::: behind
A D flip-flop is typically built from two latch stages in a **master-slave** arrangement - the first captures while the clock is low, the second passes it on when the clock rises.

Edge-triggered behaviour constructed from level-triggered parts, which is this subject's recurring pattern: a more reliable component composed from simpler, less reliable ones.
:::`,
  },

  "counters-shift-registers": {
    concept: `## Chains Of Flip-Flops

::: story
One flip-flop stores a bit. Chain several and connect them with a little logic, and you get circuits that count and circuits that move data - both from the same building block, differing only in the wiring.
:::

## Counters

A chain that advances its stored value by one per clock pulse: 0000, 0001, 0010, up to 1111, then wrapping to 0000.

::: cards Two designs
Asynchronous - ripple :: Each flip-flop's output clocks the next. Simple wiring, and a change must ripple through the chain before the whole value is correct.
Synchronous :: Every flip-flop shares the same clock, with logic computing each one's next value. More gates, all bits updating simultaneously.
:::

::: remember
The ripple counter's delay is the same problem as the ripple-carry adder's, arriving in sequential logic - so the same fix applies: more logic to compute in parallel instead of propagating in sequence.

That pattern recurs across hardware design. Sequential propagation is simple and slow; parallel computation is complex and fast.
:::

## Shift Registers

::: story
Same chain, different wiring: each clock pulse moves every stored bit one position along, a new bit entering one end and the far bit leaving the other.

Which solves a real problem. A serial connection delivers one bit at a time; your circuit wants a whole byte at once. Clock eight bits into a shift register and the byte is there, all eight bits available simultaneously.
:::

::: checkpoint
A sensor sends 8 bits one at a time over a single wire. What converts that into a byte?
- ( ) A counter
- (x) A shift register - eight clock pulses assemble the byte
- ( ) A decoder
- ( ) A multiplexer
> Serial-to-parallel conversion, which is a shift register's main job - and it's how SPI and I2C physically work in every embedded system.
:::

::: mistake
Counters and shift registers are easy to conflate, since both are flip-flop chains driven by a clock.

**A counter changes its value. A shift register moves its value.** Different logic between the stages, different purpose entirely.
:::

::: behind
A **linear feedback shift register** feeds back an XOR of several of its own bits, producing a long, pseudo-random-looking sequence before repeating.

Which is how hardware generates pseudo-random numbers and computes CRC error-detection codes - a genuinely useful trick sitting one XOR away from an ordinary shift register.
:::`,
  },

  "finite-state-machine-design": {
    concept: `## The Same Idea, Built In Hardware

::: story
The Theory of Computation subject treats finite automata as mathematics - a model for reasoning about what languages can be recognised.

This lesson builds one. Flip-flops hold the current state; combinational logic computes the next state and the outputs. Same concept, and now it's a circuit you could fabricate.
:::

Traffic light controllers, vending machines, protocol handshakes - all designed as explicit **finite state machines** and implemented exactly this way.

## Two Output Conventions

::: cards
Moore :: Output depends only on the current state. Stable for the whole clock cycle, changing only when the state does.
Mealy :: Output depends on the current state *and* the current input. Can react within the same cycle, and is less stable moment to moment.
:::

::: remember
The practical difference: a Moore machine's output is safe to feed into other synchronous logic, because it only changes at state transitions.

A Mealy machine can respond a cycle sooner, and its output can glitch as inputs settle - which matters if something downstream is watching it.
:::

## The Design Process

::: timeline From behaviour to circuit
State diagram :: Circles for states, labelled arrows for transitions. Capture the intended behaviour visually first.
State table :: Every (current state, input) pair and its resulting (next state, output). The diagram, made exhaustive.
Minimise :: Karnaugh-map the next-state and output logic to get minimal combinational expressions.
Build :: That logic plus flip-flops holding the current state. Done.
:::

::: remember
Notice this uses nearly everything earlier in the subject - flip-flops for storage, combinational logic for transitions, K-maps for minimisation.

Which is why it comes late. It's not a new technique so much as the assembly point for all of them.
:::

::: checkpoint
A traffic light cycles Red, Green, Yellow on a timer with no external input. Moore or Mealy?
- (x) Moore - the light shown depends only on which state it's in
- ( ) Mealy - it changes over time
- ( ) Neither
- ( ) Both are equally natural
> Moore. With no input affecting the output, the state alone determines the light - and a Mealy design here would add a dependency that doesn't exist.
:::

::: behind
**State minimisation** goes further than minimising the logic: sometimes two states are behaviourally identical for every possible input sequence, and merging them removes a state.

Fewer states can mean fewer flip-flops - four states need two, five need three. Which connects straight back to Theory of Computation's automata minimisation, arriving here as a transistor count.
:::`,
  },

  "memory-circuits-rom-ram": {
    concept: `## How Memory Is Actually Built

::: story
The Computer Organization subject treated RAM as a tier in a hierarchy - fast, volatile, larger than cache.

This lesson opens it. A memory chip is an array of storage cells plus a decoder: the decoder selects one row from an address, and the cells hold the bits.

Both of which are components from earlier in this subject.
:::

::: cards
ROM :: Contents built into the physical circuit, or written once. Fast simple reads, no normal-operation writes. Boot firmware lives here, where accidental modification must be impossible.
RAM :: Writable storage cells. Volatile - contents vanish without power.
:::

## SRAM Versus DRAM

::: cards
SRAM :: Each bit is a flip-flop, around six transistors. Fast, no maintenance, physically large per bit.
DRAM :: Each bit is a charge on a capacitor, one transistor. Dense and cheap, and the charge leaks - so it must be periodically read and rewritten.
:::

::: story
Six transistors per bit versus one is roughly a sixfold density difference. Which decides where each goes.

Cache is small and needs to be fast, so it's SRAM. Main memory is large and needs to be affordable, so it's DRAM - and that leakage is why your RAM is quietly refreshing itself thousands of times per second while you read this.
:::

::: checkpoint
Why is DRAM refreshed rather than just built better?
- ( ) It's a manufacturing defect
- (x) Storing a bit as a capacitor charge is what makes it dense, and charge leakage is inherent to that
- ( ) Refreshing makes it faster
- ( ) Only faulty DRAM needs refresh
> Leakage is a property of the design that buys the density. Eliminating it means not using a capacitor - which means SRAM, and six times the area.
:::

::: remember
So the memory hierarchy from Computer Organization isn't an arbitrary set of tiers. It's the direct consequence of these circuit-level trade-offs: SRAM where speed dominates, DRAM where capacity does.

The hierarchy exists because the physics offers no single technology that is both.
:::

::: behind
**Flash** is a third option: writable like RAM, non-volatile like ROM.

It works by trapping charge on a **floating gate** - isolated well enough to hold for years without power, and reachable enough to be rewritten. Which is what makes SSDs possible, and why the sharp RAM/storage line in the memory hierarchy has been blurring.
:::`,
  },

  "programmable-logic-devices-plds-fpgas": {
    concept: `## Hardware You Can Change Your Mind About

::: story
Every circuit in this subject could be fabricated as a dedicated chip - an **ASIC**. The mask set alone costs millions, and turnaround is months.

Find a bug after fabrication and you have several million dollars of incorrect silicon.
:::

**Programmable logic devices** avoid that: pre-manufactured chips with generic reconfigurable logic, programmed electronically after they're made.

::: cards What's inside an FPGA
Configurable logic blocks :: Each implements a small piece of combinational logic - lookup tables rather than fixed gates.
Flip-flops :: For sequential logic, exactly as in the earlier lessons.
Reconfigurable interconnect :: A programmable wiring network joining blocks together.
:::

Programme all three and the chip becomes whatever digital circuit you described - up to its capacity.

## The Trade

::: cards
FPGA :: Working in days, reprogrammable when the design changes. Slower and less power-efficient, since generic blocks and programmable routing carry overhead.
ASIC :: Months and millions to first silicon, unchangeable afterward. Fastest and most efficient, because every transistor serves one purpose.
:::

::: checkpoint
A startup is building custom networking hardware and expects the protocol to change. FPGA or ASIC?
- (x) FPGA - reprogrammability is worth more than peak efficiency while the design is still moving
- ( ) ASIC - performance matters for networking
- ( ) Neither is suitable
- ( ) Both, simultaneously
> FPGA while the design changes. Committing to silicon before the protocol settles means paying for a chip that's wrong - and an ASIC is a bet that you're finished.
:::

::: remember
Which is why the two coexist rather than one winning: mass-produced, finalised, performance-critical designs become ASICs, and everything prototyped, low-volume, or field-updatable stays on FPGAs.

Aerospace leans FPGA specifically for the field-updatable part - reprogramming a satellite is easier than launching another.
:::

::: behind
Both targets are programmed the same way: Verilog or VHDL.

The same source can be synthesised for an FPGA today and for ASIC fabrication later, once volume justifies it. Which makes the FPGA-then-ASIC path a normal product lifecycle rather than a rewrite - and closes the loop with this subject's first lesson, where HDLs were introduced as the thing the tools generate all of this from.
:::`,
  },
};
