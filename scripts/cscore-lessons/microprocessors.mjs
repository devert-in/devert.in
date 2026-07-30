// Microprocessors - rewritten lesson bodies. See operating-systems.mjs for the
// authoring rules. The running image across this subject is a brain in a jar:
// the chip alone thinks but cannot see, remember or act, and every later lesson
// wires one more thing onto it - memory, senses (I/O), reflexes (interrupts) -
// until the microcontroller lesson puts the whole nervous system on one die.
// This subject deliberately overlaps Computer Organization; each lesson names
// the overlap and says which level it is working at, rather than re-teaching it.

export const MICROPROCESSORS = {
  "introduction-to-microprocessors": {
    concept: `## A Room That Became A Fingernail

::: story
Before 1971, the processing part of a computer was furniture. Racks of circuit boards, each board covered in individual components, wired together into something that filled a room and needed its own air conditioning.

Then Intel shipped a chip built for a Japanese calculator company, and the entire arrangement fit onto a sliver of silicon roughly the size of a fingernail.

The 4004. Around 2,300 transistors, four bits at a time, and it worked.
:::

That is the whole idea behind the word: a **microprocessor** is a single integrated circuit - one chip - holding a complete CPU's core processing logic. Not a faster version of what came before. The same job, on one piece of silicon.

::: funfact
The 4004 ran at roughly 740 kHz. A modern desktop chip runs thousands of times faster and packs tens of billions of transistors instead of a couple of thousand - yet it is recognisably the same kind of device, doing the same kind of thing.
:::

## A Brain Is Not A Person

::: analogy
A microprocessor on its own is a brain in a jar.

It can think. It cannot see, hear, remember anything long-term, or move a finger - because none of those parts are attached yet.
:::

::: remember
A microprocessor alone is **not a computer**. It is the processing brain, and it needs external memory to hold things, input/output interfaces to reach the outside world, and supporting circuitry to tie it all together.

Every one of those attachments gets its own lesson later in this subject. That is what the rest of the subject is: wiring up the brain.
:::

::: checkpoint
You buy a bare 8086 chip and connect it to a power supply. Nothing else. What can it do?
- ( ) Run any program you write for it
- (x) Essentially nothing useful - it has no memory to fetch instructions from and no way to reach the outside world
- ( ) Act as a complete computer, just a slow one
- ( ) Store data internally until memory is attached
> Nothing useful. Powering a processor gives it the ability to execute instructions, but instructions live in memory that isn't there, and results have nowhere to go. The chip is necessary and nowhere near sufficient.
:::

## Why This Isn't Computer Organization Again

You have already met CPUs on this platform. Computer Organization covered the fetch-decode-execute cycle, cache hierarchies, pipelining - ideas that hold true across almost any chip ever designed, deliberately kept above the level of any particular one.

This subject goes one floor down.

::: cards Same territory, different altitude
Computer Organization :: General CPU concepts, abstracted away from any specific chip. Applies to an 8085, an ARM core and a modern x86 alike.
Microprocessors (here) :: One actual chip in concrete detail - its real instruction set, its physical pins, assembly you can genuinely write for it.
:::

::: mistake
Treating the two subjects as duplicates and skipping one.

They are complementary. Computer Organization tells you a processor decodes instructions; this subject shows you the instruction, the bit pattern, and the pin that carries the result out. Concepts without concrete detail stay vague, and concrete detail without concepts doesn't transfer to the next chip.
:::

## The Arc Worth Knowing

::: timeline
1971 :: The 4004. A CPU on one chip, for the first time.
Late 1970s-80s :: The 8085 (8-bit) and 8086 (16-bit). Small instruction sets, modest speeds - and the chips this subject teaches on, precisely because they are small enough to see all of at once.
Today :: Multiple cores, deep cache hierarchies, out-of-order execution, speculative branch prediction. Enormously more complex machines.
:::

::: behind
Here is the part that makes the old chips worth your time.

Modern CPUs are built from exactly the same foundations - registers, an instruction set, memory addressing. The complexity was added around those foundations, not instead of them. Learn the ideas on a chip simple enough to hold in your head, and they carry directly into a processor you could never read a full datasheet for.
:::`,
  },

  "microprocessor-architecture": {
    concept: `## Three Parts, One Job

::: story
Open the chip up - conceptually - and there are fewer moving parts than the mystique suggests.

Something that does the actual arithmetic. Somewhere fast to keep the numbers it is working on. And something reading the instructions and telling the other two what to do.

Three parts. Everything else is elaboration.
:::

::: cards The core components
ALU :: The Arithmetic Logic Unit. Performs the real work an instruction asks for - addition, subtraction, AND, OR, comparison.
Registers :: Small, extremely fast storage built into the chip itself, holding the data currently being worked on.
Control Unit :: Reads each instruction and generates the electrical control signals that direct the ALU, the registers and memory to carry it out.
:::

::: analogy
A kitchen. The ALU is the chef's hands. The registers are the small counter space right in front of them - not much room, but everything on it is instantly reachable. The control unit is the recipe being read aloud, line by line, telling the hands what to do next.

External main memory is the walk-in pantry down the hall. Vastly bigger. Vastly slower to reach.
:::

::: remember
That counter-versus-pantry gap is the same speed-versus-capacity trade-off the Computer Organization subject calls the memory hierarchy. Registers sit at the very top of it: the fastest storage in the entire system, and by far the least of it.
:::

## Where The Cycle Becomes Physical

The fetch-decode-execute cycle probably arrived as a diagram in Computer Organization. These three components are the hardware that actually performs it.

::: flow
Fetch :: The control unit uses the program counter register - which tracks exactly where execution currently is - to retrieve the next instruction from memory into the chip.
Decode :: The control unit interprets what that instruction's bit pattern means.
Execute :: The control unit raises the signals that make the ALU and registers carry out the decoded operation.
:::

::: mistake
Carrying the cycle around as an abstract idea with no physical referent.

There is no separate "cycle" mechanism inside a processor. The cycle is what you call the control unit stepping the program counter, interpreting bits, and switching signal lines. Naming the hardware for each stage is what turns the diagram into a machine.
:::

::: checkpoint
Which component is responsible for the decode stage?
- ( ) The ALU
- (x) The control unit - it interprets the instruction's bit pattern and works out which operation it encodes
- ( ) The program counter
- ( ) External memory
> The control unit. The ALU only ever performs the operation it is signalled to perform; deciding which operation that is, from a pattern of bits, is the control unit's entire purpose.
:::

## Why A 1976 Chip Is Still On The Syllabus

::: story
Two processors dominate academic microprocessor courses: the 8085 (8-bit) and the 8086 (16-bit). Both are older than most people reading this.

They stay on the syllabus for a reason that has nothing to do with inertia. A small register set - an accumulator and a handful of general-purpose registers - and a short, straightforward instruction set means you can hold the entire chip in your head at once.
:::

::: cards What the simplicity buys you
On an 8085 :: Register set, instruction set and control flow are small enough to see whole. Nothing between you and the concept.
On a modern CPU :: Multiple cores, deep pipelining, branch prediction, speculative execution and cache hierarchies sit between the instruction and the result - all real, all important, all obscuring the foundation while you're still learning it.
:::

::: behind
The transfer is genuine, not a consolation prize. The registers, ALU and control unit of an 8085 are the registers, ALU and control unit of the chip in your laptop. Modern designs replicate them, pipeline them and reorder around them - but a person who understands one instruction moving through the simple version has the foundation to read about the complicated version.
:::`,
  },

  "instruction-set-addressing-modes": {
    concept: `## A Vocabulary With No Synonyms

::: story
A processor understands a fixed list of words. Not a flexible language - a list, decided when the chip was designed, unchangeable afterwards.

MOV to move data. ADD and SUB for arithmetic. JMP to go somewhere else in the program.

Every program that chip will ever run - a game engine, a database, an operating system, written in whatever language - comes down to a sequence drawn from that list, and nothing outside it.
:::

That list is the **instruction set**.

::: didyouknow
The compiler you use is, in large part, a translator into that fixed vocabulary. Your \`for\` loop with a function call inside it does not exist on the chip. It becomes moves, compares and jumps - because moves, compares and jumps are all there are.
:::

## Four Ways To Say "That One"

An instruction has to say where its data is. There is more than one way to say it, and the differences matter.

::: cards Addressing modes
Immediate :: The data value is written into the instruction itself. "Load the literal number 5."
Register :: The instruction names a register that holds the data. "Add what's in register A to what's in register B."
Direct :: The instruction gives an exact memory address holding the data. "Load whatever is at address 2000H."
Indirect :: The instruction names a register or location that holds the *address* of the data. "Load whatever is at the address stored in register B."
:::

::: analogy
Four ways to tell someone where a book is.

Immediate: here is the book. Register: it's in your hand. Direct: it's on shelf 12. Indirect: the note in your pocket says which shelf.

That last one is a level of indirection, and it is the one that unlocks everything interesting.
:::

::: remember
Indirect addressing is what a **pointer** actually is.

When C stores an address in a variable and then reads through it, the machine code underneath is indirect addressing. The pointer is not a language feature bolted on by a compiler - it is a hardware addressing mode that the language exposes.
:::

::: checkpoint
Register B contains the value 2000H. Memory address 2000H contains the value 42. The instruction \`MOV A, [B]\` runs. What ends up in register A?
- ( ) 2000H
- (x) 42 - B holds an address, and indirect addressing follows it to the data
- ( ) The address of register B
- ( ) Nothing - the instruction is invalid
> 42. B is being used as a pointer: the mode says "the operand's address is in B," so the processor reads B, gets 2000H, then goes to 2000H and fetches what's there.
:::

::: mistake
Collapsing direct and indirect into one idea.

Direct means the address is baked into the instruction - fixed at assembly time, always the same location. Indirect means the address is fetched at run time from somewhere else, so the same instruction can reach a different location on every execution. That difference is exactly why loops over arrays and dynamically allocated memory are possible at all.
:::

## What More Modes Cost

More addressing modes give the programmer - and far more often the compiler generating machine code automatically - more ways to reach data efficiently for the situation at hand.

That flexibility is not free.

::: cards The trade-off, made concrete
The benefit :: More ways to express "where the data is," so common patterns compile to fewer, tighter instructions.
The cost :: Every additional mode needs more control-unit circuitry to decode and handle correctly. Silicon, power, design complexity, and more ways to get the chip wrong.
:::

::: interview
This trade-off is the whole motivation behind **CISC versus RISC**, covered in more depth in Computer Organization.

CISC keeps many instructions and many addressing modes, accepting complex decoding hardware. RISC keeps few, simple, uniform instructions and modes - simpler hardware per instruction, at the cost of often needing more total instructions to do the same job.

Neither is "correct." They are two answers to the question this lesson just asked.
:::`,
  },

  "assembly-language-programming-basics": {
    concept: `## The Last Language Before Numbers

::: story
The processor executes binary. Opcodes - patterns of bits with no punctuation and no mercy.

Nobody writes that by hand for long. So instead of the bits, you write \`MOV\`, and a small translator program turns your \`MOV\` into the exact bits the chip expects.

The translator is the **assembler**. What you wrote is **assembly language**.
:::

::: remember
Assembly is not a layer of abstraction over machine code. It is machine code, written in letters instead of bits - one mnemonic per instruction, one instruction per mnemonic.

Which makes it the lowest-level language a human can write directly. One floor below C, because C itself is compiled *down* into this.
:::

::: analogy
Sheet music and sound. The notation isn't a summary of the performance or a higher-level description of it - it maps one-to-one onto what gets played. Assembly is that notation for a processor.
:::

## The Anatomy Is Two Parts

::: cards Every instruction, same shape
Operation :: The mnemonic. What to do - MOV, ADD, JMP.
Operand(s) :: What to do it to - a register, a memory location, an immediate value, specified using the exact addressing modes from the previous lesson.
:::

A program is a sequence of those, executed one after another, top to bottom.

::: flow
Sequential by default :: Each instruction runs, then the next one.
Jumps break the sequence :: A JMP or conditional branch sends execution somewhere else instead of to the next line.
That is all control flow is :: Every if/else and every loop you have ever written is compiled into compares and conditional jumps at this level. There is no \`while\` instruction.
:::

::: checkpoint
A C program contains a \`while\` loop. What does that become in assembly?
- ( ) A single dedicated loop instruction
- (x) A compare followed by a conditional jump backwards to the top of the loop body
- ( ) Nothing - loops are handled by the operating system
- ( ) The loop is unrolled into one copy per iteration, always
> A compare and a conditional jump. The processor has no concept of a loop; it only knows how to change where execution continues. Repetition is a jump backwards.
:::

## Rarely Written, Still Worth Reading

Almost nobody writes application software in assembly now. Higher-level languages compile down automatically, and they do it well.

So why is this lesson here?

::: cards Three genuine reasons
Grounding :: It builds a real, physical understanding of what the machine is doing under every abstraction you use. Pointers, stack frames and undefined behaviour stop being folklore.
Embedded firmware :: This subject's final lesson. Where every CPU cycle and every byte of memory genuinely matters, assembly is still occasionally the answer.
Reading compiler output :: A live, practical technique. When high-level code is mysteriously slow or behaves oddly, looking at the assembly the compiler actually produced answers questions nothing else will.
:::

::: mistake
Writing assembly off as a museum piece because you'll never ship it.

The value has shifted from writing it to reading it. Every serious systems programmer eventually stares at compiler output to understand why their code did something surprising - and that skill needs this lesson.
:::

::: interview
Be ready to say precisely what an assembler does: it translates mnemonic assembly directly into binary machine code, one instruction at a time.

Then have one concrete modern reason to understand assembly ready - reading compiler output during optimisation work is the strongest, because it is something people actually do this year.
:::`,
  },

  "memory-i-o-interfacing": {
    concept: `## Three Wires Out Of The Brain

::: story
Back to the brain in a jar. Time to attach it to something.

Every conversation the processor has with the outside world - every instruction fetched, every value stored, every key pressed - travels over three groups of wires. Just three.
:::

::: cards The bus system
Address bus :: Carries which location the processor wants. "Memory 2000H."
Data bus :: Carries the actual value being read or written.
Control bus :: Carries what kind of operation this is - read or write - and the timing signals that coordinate the exchange.
:::

::: analogy
Posting a parcel. The address bus is the address on the label, the data bus is the contents of the box, and the control bus is whether you're sending or collecting, plus everyone agreeing on when the handover happens.
:::

::: mistake
Mixing up the address bus and the data bus.

They are physically separate sets of wires carrying different information at the same moment. The address says *where*; the data says *what*. A processor with a 16-bit address bus and an 8-bit data bus is perfectly ordinary - and the two numbers mean completely different things about the chip's capabilities.
:::

## Two Philosophies For Talking To Devices

Memory is one thing. But a keyboard, a display or a sensor also needs an address the processor can name. There are two ways to arrange that, and chips genuinely differ.

::: cards Memory-mapped vs I/O-mapped
Memory-mapped I/O :: Devices are given ordinary memory addresses. The same instructions that touch memory - MOV and friends - reach devices too, just at reserved addresses. Simple: no special instructions at all.
I/O-mapped (isolated) I/O :: Devices live in a separate address space with dedicated instructions - IN and OUT. Memory addresses and device addresses stay cleanly apart, at the cost of the processor having to support extra instructions.
:::

::: checkpoint
A processor uses memory-mapped I/O. What instruction writes a byte to a display controller?
- (x) The same store instruction used for memory - the display just lives at a reserved address
- ( ) A dedicated OUT instruction
- ( ) A special display-only instruction built into the chip
- ( ) Devices cannot be written to under memory-mapped I/O
> The ordinary store. That is exactly what memory-mapped means: the device is addressable as if it were memory, so no separate instruction set is needed for I/O at all.
:::

## Reflexes Beat Checking

::: story
A processor is waiting for a keypress. It could ask the keyboard, over and over, thousands of times a second: anything yet? Anything yet? Anything yet?

That is **polling**, and almost every one of those questions is answered no. All that work, discarded.

The alternative is to stop asking, get on with something useful, and let the keyboard interrupt when it has news.
:::

::: flow
1. The device signals :: A key is pressed, or a timer expires. The device raises an interrupt line.
2. The processor pauses :: It stops the program currently running - mid-flow, wherever it happens to be.
3. State is saved :: Enough of the current execution state is stored that it can be resumed exactly.
4. The ISR runs :: Execution jumps to the Interrupt Service Routine - a small dedicated program that handles this specific event.
5. The original resumes :: When the ISR finishes, the saved state is restored and the interrupted program carries on exactly where it left off, none the wiser.
:::

::: remember
Interrupts are why a processor can be responsive without being wasteful. The device gets attention the instant something actually happens, and zero cycles are spent on the far more common case where nothing has.
:::

::: mistake
Treating polling and interrupts as interchangeable styles.

They handle the same requirement with very different costs. Polling burns processor time proportional to how often you check, whether or not anything changed. Interrupts cost nothing until there is something to do. Polling has narrow legitimate uses - very short waits, very simple systems - but as a default it is waste.
:::

::: behind
You have met interrupts before, from the other side. The Operating Systems subject covers I/O interrupt handling from the OS's point of view: what the kernel does when one arrives.

Same mechanism, viewed one level lower. Here it is a physical signal line going high, a hardware state save, and a jump to an address. That is what the OS's interrupt handling is standing on.
:::`,
  },

  "microcontrollers-vs-microprocessors": {
    concept: `## Two Words People Use Interchangeably, Wrongly

::: story
A microprocessor is the brain this subject started with. Powerful, and helpless alone - it needs external memory, external I/O circuitry and supporting chips wired around it over the bus system from the last lesson before it can do anything at all.

Now put the brain, the memory and the senses on a single piece of silicon.

That is a **microcontroller**. A computer on a chip.
:::

::: cards What's actually on the die
Microprocessor :: The CPU alone. RAM, program storage and I/O interfaces all live on separate chips, connected via buses.
Microcontroller :: CPU plus RAM plus non-volatile program memory (ROM or Flash) plus I/O interfaces - all integrated onto one self-contained chip.
:::

::: remember
The distinction is not power. It is **integration**.

A microcontroller isn't a weak microprocessor; it is a different design answering a different question. Deciding which one a project needs is a real engineering choice that gets made constantly in industry.
:::

## Choosing Between Them

::: cards When each one wins
Microprocessor :: The system needs substantial computing power and flexibility - a laptop or desktop running many large, varied programs, with expandable external memory. The extra external circuitry is a price worth paying.
Microcontroller :: The job is fixed, comparatively simple, and cost or power or physical size is tight - a washing machine's control board, a sensor node, a toy. All-in-one integration makes it dramatically cheaper, smaller and lower-power, and the reduced flexibility genuinely doesn't matter.
:::

::: checkpoint
You're designing a battery-powered soil moisture sensor that reads a value every ten minutes and transmits it. Which do you reach for?
- ( ) A microprocessor, for maximum flexibility
- (x) A microcontroller - the task is fixed and simple, and cost, size and battery life dominate the decision
- ( ) Either, since the two are basically the same
- ( ) Neither is suitable for sensor applications
> A microcontroller. There's no need for a general-purpose machine that runs arbitrary programs, and the integration wins on every dimension that actually matters here: unit cost, board size, and how long a battery lasts.
:::

::: mistake
Using the two words as synonyms in an interview.

It reads immediately as never having built anything. The distinction determines board layout, unit cost, power budget and which parts you can even buy - it is one of the first decisions on any embedded project.
:::

## The Families You Should Recognise

::: cards Two names worth knowing
8051 :: An 8-bit family from 1980, historically foundational and still taught widely. Small enough that its entire architecture can be learned in an afternoon, which is exactly why it survives in coursework.
ARM Cortex-M :: The modern dominant force in real embedded products - fitness trackers, appliances, automotive control units, an enormous share of everything with a chip in it.
:::

::: behind
Everything this subject has covered applies unchanged to microcontrollers. Registers, an instruction set, addressing modes, interrupts - a Cortex-M has all of them, working exactly as described in the previous lessons.

The lessons weren't about microprocessors specifically. They were about processors. The microcontroller just brought its memory and I/O along in the same package.
:::`,
  },

  "embedded-systems-applications": {
    concept: `## The Computers You Never Look At

::: story
Count the computers around you. Most people count the obvious ones: laptop, phone, maybe a TV.

Now count again. The car's braking controller. The microwave's timer. The thermostat. The washing machine. The fitness band. A pacemaker, in some people. Every one of those has a processor in it, running software, and none of them look like a computer.
:::

An **embedded system** is a computing system built into a larger device to do one specific, dedicated job.

::: didyouknow
The vast majority of all microprocessors and microcontrollers manufactured worldwide end up in embedded systems - not in laptops, not in phones.

Which reframes this entire subject. The visible computers are the exception. This is where the chips actually go.
:::

## When "Fast Enough" Isn't A Guarantee

::: story
Your laptop occasionally takes a second to respond. Annoying. You wait, it recovers, life continues.

Now the same behaviour in a car's anti-lock braking controller. The wheel is locking, the control loop needs to respond, and this time it takes a second.

There is no version of that where you shrug.
:::

::: remember
This is what **real-time** means, and it is not "fast."

It means a task must complete within a strict, guaranteed deadline - every single time, not on average. A system with excellent average response and an occasional long pause fails a real-time requirement, no matter how good the average looks.
:::

::: cards Two severities
Hard real-time :: Missing a deadline is a genuine system failure, often safety-critical. Anti-lock brakes, pacemakers, airbag deployment, flight control.
Soft real-time :: Missing a deadline degrades quality but isn't catastrophic. A video stream stutters; a UI feels sluggish. Undesirable, recoverable.
:::

::: checkpoint
A video streaming buffer occasionally misses its deadline and the picture stutters for a moment. What kind of system is this?
- ( ) Hard real-time - any missed deadline is a failure
- (x) Soft real-time - the miss degrades quality but nothing is broken or unsafe
- ( ) Not real-time at all, since deadlines are sometimes missed
- ( ) It depends on the resolution of the video
> Soft real-time. There genuinely is a deadline, and missing it genuinely costs something - a visible stutter - but the system recovers and no harm is done. Hard real-time is reserved for cases where the miss itself is the failure.
:::

::: mistake
Confusing hard and soft real-time, or treating the label as a matter of degree.

They demand different engineering rigour. Hard real-time work involves proving worst-case timing, not measuring average timing - and that difference decides how the software is designed, which scheduler it uses, and sometimes which language it's written in.
:::

::: behind
General-purpose scheduling, as covered in the Operating Systems subject, optimises for good average responsiveness across many competing programs. That is the right goal for a laptop.

It is the wrong goal for brakes. Good on average, with no guarantee about the worst case, is exactly what a hard real-time system cannot accept - which is why embedded design departs from general-purpose OS thinking at precisely this point.
:::

## Where The Whole Subject Meets

::: flow
The microcontroller :: Provides the integrated CPU, memory and I/O - the previous lesson.
Its instruction set and assembly :: Shape how the firmware is written, and how tightly it can be optimised when space and cycles are scarce.
Memory/I/O interfacing and interrupts :: Let it react the instant a sensor input arrives, rather than wasting cycles polling.
Real-time constraints :: Constrain every one of the decisions above, throughout.
:::

::: remember
An embedded product is not an application of one lesson from this subject. It is all of them at once, which is exactly why they were taught in that order.
:::`,
  },

  "interview-questions": {
    concept: `## What Actually Gets Asked

::: story
Microprocessors questions turn up in embedded, firmware and hardware-adjacent interviews - and the topic list is unusually predictable. This is a subject where preparation pays, because the same five areas come round again and again.
:::

::: cards The recurring five
Microprocessor vs microcontroller :: With a concrete example of when each is the right choice.
Core architecture :: ALU, registers, control unit - and how they implement fetch-decode-execute.
Addressing modes :: All four, with indirect addressing's connection to pointers.
Interrupts vs polling :: Why interrupts win, and the exact handling sequence.
Real-time constraints :: Hard versus soft, with an example of each.
:::

## The Thing That Separates Answers

::: story
Two candidates define a control unit correctly. Both are right. One of them gets remembered.

The difference is that the second one said: "and that's the hardware that actually performs the fetch-decode-execute cycle - the one from computer architecture that's usually drawn as a diagram."

Same fact. One extra sentence. Completely different impression.
:::

::: remember
Connect down and connect up.

This subject's control unit is what physically implements Computer Organization's abstract cycle. This subject's interrupt line is the hardware underneath Operating Systems' interrupt handling. Indirect addressing is what a C pointer is compiled into.

Saying so out loud demonstrates that you learned a connected picture rather than three unrelated modules.
:::

::: interview
The pointer question is the one worth rehearsing until it's fluent.

"How does a pointer work at the machine level?" is a favourite precisely because it separates people who memorised C syntax from people who understand what the syntax denotes. The answer is indirect addressing: the pointer variable holds an address, and dereferencing is an instruction that follows it.
:::

::: checkpoint
An interviewer asks why interrupts are preferred over polling. Which answer is strongest?
- ( ) "Interrupts are faster."
- (x) "Polling spends cycles checking even when nothing has changed; interrupts cost nothing until a device actually has news, then the processor saves state, runs the ISR, and resumes exactly where it was."
- ( ) "Polling is outdated and no longer used anywhere."
- ( ) "Interrupts use less memory."
> The second. It names the actual cost being avoided rather than asserting a vague "faster," and it walks the sequence - which is usually the interviewer's next question anyway.
:::

## Rapid-Fire Review

::: reveal Try each out loud before opening it
Microprocessor vs microcontroller :: CPU alone, needing external memory and I/O, versus CPU plus RAM plus program memory plus I/O on one chip. Laptop versus washing machine controller.
The three components and three buses :: ALU, registers, control unit. Address, data, control. The control unit drives fetch-decode-execute using the program counter.
The four addressing modes :: Immediate (value in the instruction), register (value in a register), direct (fixed address in the instruction), indirect (the named location holds the address) - the last being a pointer.
Interrupts vs polling :: Device signals, processor pauses and saves state, ISR runs, original program resumes. No cycles wasted when nothing happens.
Hard vs soft real-time :: Missed deadline is a failure (anti-lock brakes) versus missed deadline degrades quality (video buffering).
:::

::: mistake
Answering each of these as an isolated fact from an isolated subject.

Every one of them traces back to a specific earlier lesson here, and forward to Computer Organization or Operating Systems. Interviewers at this level are largely testing whether you see the whole stack or five disconnected pieces of it.
:::`,
  },
};
