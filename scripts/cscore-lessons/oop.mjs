// OOP - rewritten lesson bodies. See operating-systems.mjs for the authoring
// rules. The original analogies here were already strong (cookie cutter, USB
// port, half-finished blueprint) so they're kept and built on rather than
// replaced - what these lessons lacked was structure, not imagery.

export const OOP = {
  "classes": {
    concept: `## The Cutter Is Not The Cookie

::: story
A cookie cutter is not a cookie. You can't eat it. There's only one of it, even after you've stamped out fifty cookies.

But every cookie it produces has the same shape, because they all came from the same cutter.
:::

A **class** is that cutter: a blueprint describing what shape something will have - what data it holds, what it can do. The class itself is never the thing you use. It's the template.

## What A Class Actually Contains

::: cards What a class defines
Fields :: The data each object of this class will hold. A Cookie's flavour and size.
Methods :: The actions each object can perform. bake(), decorate().
:::

Every object made from a class gets its **own copy** of the fields, while sharing the same method definitions. Fifty cookies, fifty flavours, one definition of what baking means.

::: checkpoint
You define a Cookie class with a \`flavor\` field. How many flavours exist at this point?
- ( ) One, defaulting to empty
- (x) None - no cookie has been made yet
- ( ) As many as there are cookies
- ( ) One per method in the class
> None. The class says cookies *will have* a flavour. Nothing has been stamped out, so there's nothing holding a value yet - which is exactly the blueprint/thing distinction, and it's the next lesson.
:::

::: remember
This separation - blueprint versus actual thing - is the foundation everything else in this subject is built on. Inheritance, polymorphism, encapsulation: each is a different way of extending or restricting what a blueprint can do.

Get this one clear and the rest of the subject has somewhere to attach. Leave it fuzzy and none of it lands.
:::

::: behind
There's one exception to "every object gets its own copy of the fields": **static** members belong to the class itself rather than to any object made from it.

A \`Cookie.totalCookiesBaked\` counter would be shared across every Cookie ever made, incremented once per bake() call no matter which cookie called it. One value, owned by the cutter rather than the cookies.
:::`,
  },

  "objects": {
    concept: `## Now Press It Into The Dough

::: story
Press the cutter down. That one cookie - its own position on the tray, its own amount of dough, its own eventual browning - is a real thing with its own state.

Stamp out ten more. Ten separate cookies, each existing independently, all sharing the shape one cutter defined.
:::

An **object** is a concrete instance created from a class's blueprint. The act of creating one is **instantiation** - literally making an instance.

::: flow
Cookie class (blueprint) -> new Cookie() -> one object, with its own fields
:::

## Independent By Default

Each object gets its own copy of the fields. Setting one Cookie's \`flavor\` to "chocolate" has no effect on any other Cookie, even though both came from the same class.

::: checkpoint
Two Cookie objects from the same class. You set the first one's flavour to "chocolate". What is the second one's flavour?
- ( ) Also chocolate - they share the class's fields
- (x) Whatever it was already - the two objects' fields are independent
- ( ) Empty, because the first one claimed the value
- ( ) An error occurs
> Independent. Shared field *definitions*, separate field *values* - which is why one User class can back a hundred thousand user accounts with different names.
:::

::: mistake
The trap is assuming that sharing a class means sharing data. Objects of the same class share the *shape* of their data and nothing else - unless a field is explicitly declared static, in which case it belongs to the class and is genuinely shared.
:::

::: didyouknow
Every row you've ever seen in an app is an object. One user's profile, one product listing, one chat message - each is an instance, sitting in memory, built from a class someone wrote once.

A feed of fifty posts is fifty objects and one class.
:::

::: behind
A **constructor** is special code that runs automatically the moment an object is created, usually to set up its initial state in one step: \`new Cookie("Chocolate", 8)\` rather than creating a blank cookie and assigning each field afterward.

A class can define several constructors taking different parameter combinations - **constructor overloading** - giving callers more than one way to produce a properly initialised object. Which is also a preview of overloading generally, in the Polymorphism lesson.
:::`,
  },

  "inheritance": {
    concept: `## Write The Shared Part Once

::: story
A car, a motorbike and a truck all have a speed. All of them accelerate and brake.

You could write that logic three times. Then fix a braking bug three times, and miss one.
:::

**Inheritance** lets you write the shared part once in a general class and have specific classes take it over automatically.

A general \`Vehicle\` defines \`speed\`, \`accelerate()\` and \`brake()\`. \`Car\`, \`Motorbike\` and \`Truck\` each inherit all of it, and add only what makes them different - a Car's \`numberOfDoors\`, a Truck's \`cargoCapacity\`.

::: cards The vocabulary, which comes in synonym pairs
Parent / superclass / base class :: The class being inherited from. Vehicle. Three names, one concept - textbooks disagree.
Child / subclass / derived class :: The class doing the inheriting. Car.
:::

## The Test That Decides Whether To Use It

::: remember
Inheritance models **IS-A**.

Is a Car a kind of Vehicle? Yes - inheritance fits.

Is an Engine a kind of Vehicle? No. A Car *has* an Engine. That's **HAS-A**, and it calls for **composition** - holding an Engine as a field - not inheritance.
:::

::: checkpoint
You need a \`Playlist\` that contains many \`Song\` objects. Inheritance or composition?
- ( ) Playlist extends Song
- ( ) Song extends Playlist
- (x) Composition - a Playlist *has* Songs
- ( ) Both, depending on the language
> HAS-A, so composition. Read either inheritance option aloud as an IS-A sentence - "a playlist is a song" - and the wrongness is immediate. That read-it-aloud test is the whole technique.
:::

::: mistake
Inheritance is not copy-paste. A Car genuinely *is* a Vehicle, which means it can be used anywhere a Vehicle is expected - and that substitutability is the entire point, as the next lesson depends on.

Reaching for inheritance purely to reuse code, where no IS-A relationship exists, produces hierarchies that make no sense the moment anyone tries to read them as sentences.
:::

## Changing What You Inherited

A subclass can **override** an inherited method - supplying its own version of something the parent already defined. A Car's \`honk()\` can replace Vehicle's generic one while everything else it inherited stays untouched.

::: behind
Most OOP languages allow only **single inheritance** - one direct parent - to avoid the **diamond problem**: if a class inherited the same method from two parents that each implemented it differently, which one wins? There's no non-arbitrary answer, so the situation is forbidden rather than resolved.

**Interfaces**, a later lesson, are how languages let a class take on several behavioural contracts without that ambiguity: they declare *what* must exist, never a conflicting *how*.
:::`,
  },

  "polymorphism": {
    concept: `## One Button, Different Devices

::: story
A universal remote's power button does something different depending on what it's pointed at. TV. Sound system. Projector.

Same button. Same signal. Different outcome, decided by the receiver rather than the sender.
:::

That's **polymorphism**: the same call producing different behaviour depending on which object receives it. The word is far more intimidating than the idea.

## Runtime Polymorphism

If \`Dog\` and \`Cat\` both override \`Animal\`'s \`makeSound()\`, then a variable of type \`Animal\` can point at either one - and calling \`.makeSound()\` on it produces "Woof!" or "Meow!" depending on what it actually references.

The calling code never checks which. It doesn't need to.

::: flow
Animal reference -> actual object decides -> Dog's makeSound() or Cat's
:::

This is **runtime polymorphism**, also called dynamic dispatch, and method overriding is what enables it.

::: remember
The payoff is the part worth internalising. Write one loop over a list of Animals calling \`makeSound()\`, and it correctly handles a \`Bird\` subclass added *next year* - with no change to the loop.

Code that keeps working as the system grows around it, without being edited, is the closest thing OOP has to a superpower.
:::

::: mistake
The alternative people write instead is a chain of type checks: if it's a Dog do this, if it's a Cat do that. It works, and it has to be edited every single time a new type appears - which means every new animal touches code that has nothing to do with animals.

Polymorphism deletes that chain entirely.
:::

## The Other Kind, Which Is Unrelated

**Method overloading** is also called polymorphism and is a genuinely different mechanism: several methods with the *same name* in the same class, distinguished by their parameter lists - \`add(int, int)\` and \`add(double, double)\`.

::: cards Told apart
Overriding :: Same signature, different class (parent and child). Resolved at **runtime**, by the object's actual type.
Overloading :: Same name, same class, different parameters. Resolved at **compile time**, by the argument types you passed.
:::

::: checkpoint
An \`Animal\` variable holds a \`Dog\`. The compiler cannot know this - the object arrives from a database at runtime. How does the right \`makeSound()\` get called?
- ( ) The compiler infers it from the variable's declared type
- (x) The object itself carries the information, and the method is looked up when the call happens
- ( ) The runtime scans all subclasses for a match
- ( ) It calls Animal's version, then Dog's
> Looked up at the moment of the call, via information the object carries about its own real class. Which is exactly the mechanism described below.
:::

::: behind
That lookup uses a **virtual method table** - a vtable. Each object carries a pointer to a table of its actual class's method implementations, and a polymorphic call goes through that table rather than jumping to an address the compiler fixed in advance.

Hence the small cost relative to a direct call: one extra indirection. For nearly every real application it's an excellent trade for the flexibility, but it's not free, and it's why performance-critical code sometimes avoids virtual calls deliberately.
:::`,
  },

  "abstraction": {
    concept: `## A Wheel And Two Pedals

::: story
Driving a car means turning a wheel and pressing pedals.

Underneath: fuel injection timing, a transmission choosing gears, an engine control unit reading sensors forty times a second. None of it reaches you. None of it needs to.

A genuinely complicated machine, behind a surface simple enough to learn in an afternoon.
:::

**Abstraction** is that: exposing only what's essential and hiding the complexity behind it.

In OOP, it means designing a class so that whoever uses it needs to know only *what* it does - its public methods and what they promise - never *how*.

::: story
A \`SortedList\` promises that \`.add(item)\` leaves the list sorted.

The caller doesn't know whether that's insertion sort, a binary search for the position, or something cleverer. And because they don't know, you can replace it next month with something faster, and nothing they wrote breaks.

The hiding isn't secrecy. It's freedom to change your mind later.
:::

::: checkpoint
You replace SortedList's internal algorithm with a faster one. The public method signatures don't change. What happens to code that used it?
- ( ) It must be updated to match the new implementation
- (x) Nothing - it only ever depended on the promise, not the mechanism
- ( ) It breaks until recompiled against the new version
- ( ) It gets slower until updated
> Nothing. That's the entire return on abstraction, and it's why exposing internals "just in case someone needs them" is expensive: every exposed detail is a thing you can no longer change freely.
:::

## The Pair Everyone Confuses

::: remember
Abstraction and encapsulation are related and not the same, and this is the most-asked "what's the difference" question in the subject.

**Abstraction is design** - deciding what complexity to hide and what surface to expose.

**Encapsulation is enforcement** - using access modifiers so nobody *can* reach the hidden parts even if they want to.

Abstraction without encapsulation is a beautifully simple dashboard on a car with the engine bay left unlocked.
:::

::: behind
**Abstract classes** and **interfaces** - the next two lessons - are the language-level tools for declaring an abstraction formally: a contract of what must exist, with the how left to whoever implements it.

But abstraction is older and broader than those keywords. A single well-designed class with clean public methods and hidden private details is already practising it, with no \`abstract\` or \`interface\` anywhere in sight.
:::`,
  },

  "encapsulation": {
    concept: `## Why The Field Is Private

::: story
A medicine capsule bundles its contents inside a shell so you can't spill, mix or misuse them. You interact with the capsule as a whole, and the shell controls how the contents come out.
:::

**Encapsulation** does that for an object's data: bundle the fields with the methods that operate on them, and restrict outside access so all interaction goes through methods you control.

In practice: fields declared \`private\`, with \`public\` methods - **getters** to read, **setters** to change - as the only route in.

## The Reason That Isn't Bureaucracy

::: story
Make \`age\` a public field, and any code anywhere can write \`person.age = -5\`. Nothing stops it. The object is now invalid, and the bug will surface somewhere far from the line that caused it.

Make it private with a setter, and \`setAge()\` can refuse. The object defends its own validity, once, instead of trusting every caller everywhere to remember.
:::

::: cards Two ways to guard a rule
Public field :: Every piece of code that touches it must remember the rule. One that forgets corrupts the object silently.
Private field with a setter :: The rule lives in one place, next to the data, and is enforced whether callers remember it or not.
:::

::: checkpoint
A BankAccount has a private \`balance\` and a \`withdraw(amount)\` method. Why not just make balance public and let callers subtract?
- ( ) Public fields are slower
- (x) Because withdraw() can refuse a negative amount or an overdraft, and a public field can't refuse anything
- ( ) Because private fields use less memory
- ( ) It makes no real difference
> Enforcement. Every rule about what a valid balance change looks like has exactly one place to live. With a public field, those rules live in the hope that all callers behave.
:::

::: mistake
Generating a getter and setter for every field, with no validation in any of them, is the version of this that misses the point entirely. It's technically encapsulated and protects nothing - a private field with an unconditional setter is a public field with extra typing.

Encapsulation earns its keep where there's a rule to enforce or an internal detail worth keeping changeable.
:::

::: behind
Encapsulation also buys invisible flexibility. A getter can compute a value on first access and cache it, and callers never learn whether \`getFullName()\` returns a stored field or joins two others fresh each time.

Which is the same freedom-to-change-later that abstraction described. Abstraction decides what to hide; encapsulation is the mechanism that makes the hiding real.
:::`,
  },

  "interfaces": {
    concept: `## The USB Port Doesn't Care

::: story
A USB port has no idea what you're plugging into it. Keyboard, mouse, flash drive, webcam - it doesn't matter.

It cares about one thing: that whatever arrives follows the specification. Connector shape, electrical signalling. Follow the spec and it works. How the device does its own job internally is entirely its business.
:::

An **interface** is that specification: a contract declaring *what* methods a class must provide, with no statement about how.

A class **implements** an interface by supplying real code for every method it declares.

## What Single Inheritance Couldn't Do

A class can implement **many** interfaces at once. A \`Duck\` can be both \`Flyable\` and \`Swimmable\`.

::: remember
And this is safe precisely where multiple inheritance wasn't. The diamond problem came from inheriting conflicting *implementations*. Interfaces carry no implementation, so there's nothing to conflict - which is why the restriction that applies to classes doesn't apply here.
:::

::: cards implements vs extends
implements :: Fulfilling an interface's contract. Many at once. "I promise these methods exist."
extends :: Inheriting from a class. Usually one only. "I am a kind of that."
:::

## Contracts Across Unrelated Things

::: story
A Duck and an Airplane share nothing. Neither is a kind of the other, and no sensible parent class covers both.

But both can fly. So both can implement \`Flyable\` - and code written to accept anything Flyable handles both, calling \`.fly()\` without caring which it received.

Inheritance can only relate things that are genuinely related. Interfaces can relate things that merely share a capability.
:::

::: checkpoint
You need one sort function that works on Employee, Product and Student - three classes with no common parent. What gets you there?
- ( ) A shared abstract parent class for all three
- (x) An interface declaring they can be compared, implemented by each
- ( ) Method overloading, one version per class
- ( ) Three separate sort functions
> An interface - this is exactly what \`Comparable\` exists for in many languages. Forcing an artificial common parent onto three unrelated classes just to enable sorting would be a hierarchy built for the tool rather than the domain.
:::

::: behind
Many modern languages allow **default methods** on interfaces: a method with a real implementation, provided in the interface itself, inherited automatically unless overridden.

The motivation was practical rather than theoretical. Adding a method to an existing interface would otherwise break every class implementing it - all of them suddenly failing to compile for missing something they'd never heard of. Defaults let an interface grow without that.
:::`,
  },

  "abstract-classes": {
    concept: `## The Blueprint With The Roof Left Blank

::: story
A house blueprint specifies the foundation, plumbing and wiring completely - build them exactly as drawn.

The roof section is deliberately blank. Whoever builds on this particular lot decides that part.

The blueprint is useful and incomplete on purpose, and you cannot build from it as-is.
:::

An **abstract class** is that partial blueprint. It can provide fully implemented methods and fields - real shared code - while declaring one or more **abstract methods** that have no implementation, which any concrete subclass must supply.

You can never instantiate one directly. It exists to be extended.

::: cards Three points on one spectrum
Regular class :: Fully implemented. Instantiate and use.
Abstract class :: Partly implemented. Shared code, plus gaps subclasses must fill. Cannot be instantiated.
Interface :: No implementation. Contract only.
:::

::: checkpoint
Why is \`new Vehicle()\` forbidden when Vehicle is abstract with an abstract \`honk()\`?
- ( ) Abstract classes have no constructor
- (x) The object would have a honk() with no behaviour behind it
- ( ) It's an arbitrary language restriction
- ( ) Abstract classes cannot hold fields
> There'd be nothing to run. The prohibition isn't ceremony - it's preventing an object that structurally cannot honour its own interface.
:::

## Choosing Between The Two

::: remember
One question decides it: **is there real shared code worth writing once?**

Yes - abstract class. \`Car\`, \`Truck\` and \`Motorbike\` genuinely share a \`speed\` field and an \`accelerate()\` implementation, and an interface can't hold either.

No - interface. \`Duck\` and \`Airplane\` share no implementation at all, only the promise that \`.fly()\` exists. And a class can implement many interfaces while extending only one class, so contracts that cut across unrelated types belong here.
:::

::: mistake
Using an abstract class purely as a contract, with no shared code in it, spends your one inheritance slot for something an interface would have done for free - and blocks that class from ever extending anything else.
:::

::: behind
The **Template Method** pattern is built directly on this. A parent abstract class defines an algorithm's skeleton in one real method - calling several steps in a fixed order - while leaving individual steps abstract for subclasses.

An abstract \`makeBeverage()\` might always call \`boilWater()\`, then an abstract \`brew()\` that Coffee and Tea implement differently, then \`pourInCup()\`. The sequence is fixed once; the variable steps stay open. Which is a remarkably precise way to say "these things differ, but only here".
:::`,
  },

  "solid-principles": {
    concept: `## Five Angles On One Problem

::: story
Every one of these five principles is aimed at the same thing: a small change staying small.

The failure they're all guarding against is the codebase where a one-line request touches nine files and breaks a tenth nobody remembered existed.
:::

## S - Single Responsibility

A class should have exactly one reason to change.

::: story
A \`Report\` class that calculates data, formats it as PDF, and emails it has three reasons to change: a calculation bug, a formatting tweak, an email provider swap.

Three unrelated futures, all landing in one file. Split it into three.
:::

## O - Open/Closed

Open for extension, closed for modification.

::: story
Adding a payment method by editing \`PaymentProcessor\` means touching code that already works and is already tested.

Design it so a new \`CryptoPayment\` implementation can be added without opening the existing class at all.
:::

## L - Liskov Substitution

A subclass must be usable anywhere its parent is expected, without breaking correctness.

::: story
The classic violation: \`Square\` extends \`Rectangle\` and overrides \`setWidth()\` to also change the height, keeping itself square.

Perfectly reasonable in isolation. Now code that expects a Rectangle sets width to 5 and height to 10, and gets a 10x10 shape. Nothing errored. The answer is just wrong.

Square passes the IS-A test in geometry and fails it in code, because Rectangle's contract included "these two dimensions are independent" without ever writing it down.
:::

::: checkpoint
Square/Rectangle satisfies "a square is a rectangle" mathematically. Why is it still a violation?
- ( ) Because Square adds no new fields
- (x) Because it breaks a behavioural promise Rectangle's callers relied on
- ( ) Because Rectangle should have been an interface
- ( ) Because inheritance never models shapes well
> The inherited *contract* includes behaviour, not just method names. That's the real lesson here: IS-A must hold for what the parent promises to do, not only for what it is.
:::

## I - Interface Segregation

Don't force a class to implement what it doesn't need.

::: story
A \`Worker\` interface with \`work()\` and \`eat()\` forces \`RobotWorker\` to implement a meaningless \`eat()\`.

Split it into \`Workable\` and \`Eatable\`, and the robot implements only what applies.
:::

## D - Dependency Inversion

Depend on abstractions, not concrete implementations.

::: story
\`NotificationService\` that creates its own \`EmailSender\` can never send an SMS without being edited.

Depend on a \`Sender\` interface and any implementation can be handed in - email, SMS, push - with NotificationService untouched.
:::

::: remember
Notice that last one also fixed an Open/Closed violation. These five aren't a checklist of independent rules; they're five views of the same goal, and a real refactor usually improves several at once.
:::

::: behind
The failure mode with SOLID isn't ignorance of it - it's the opposite. Applied maximally, every class becomes an interface with one implementation, every dependency is injected, and a two-line change requires understanding six files.

The principles describe forces, not quotas. They earn their cost where change is actually likely, which is why experienced engineers apply them hardest at the boundaries that have already changed once.
:::`,
  },

  "design-principles": {
    concept: `## Three Shorter Rules

::: story
Beyond SOLID, working developers lean on three punchier mantras. Less formal, argued about constantly in code review, and genuinely useful.
:::

::: cards
DRY - Don't Repeat Yourself :: Each piece of knowledge should exist in exactly one place. A tax formula copy-pasted into five files means a bug fix in five places, and one you'll miss.
KISS - Keep It Simple :: Given two solutions that work equally well, take the simpler one. A dense one-liner a teammate needs ten minutes to decode is a cost, not a flourish.
YAGNI - You Aren't Gonna Need It :: Don't build flexibility for requirements that don't exist. A plugin system for ten payment providers when you have one is complexity paid today for a maybe.
:::

::: didyouknow
YAGNI has a second argument that's stronger than the first. Even if the future requirement does arrive, you'll understand it far better *then* than you can guess now - so the speculative version you built is usually the wrong shape anyway. You paid early and still have to rework it.
:::

## Where They Fight

::: story
Push DRY hard enough and you get one shared function serving five subtly different callers, held together by a pile of boolean flags.

It has no duplication. It's also unreadable, and it now has five reasons to change - so it violates KISS and Single Responsibility at the same time, in the name of a principle.
:::

::: checkpoint
Two functions look nearly identical but serve different business rules that happen to coincide today. Merge them?
- ( ) Yes - identical code is duplication by definition
- (x) No - they're the same by coincidence, and merging couples two rules that will diverge
- ( ) Yes, with a flag parameter to handle the differences
- ( ) Only if they're in the same file
> DRY is about single sources of *knowledge*, not identical characters. Two rules that agree by accident are two rules, and the flag-parameter option is exactly the trap - it's how the unreadable shared function gets born.
:::

::: mistake
YAGNI also gets used as cover for skipping work that current requirements already call for - error handling, input validation, basic seams. "We might not need it" is about *speculative* features, not about the ones you're already obliged to handle.
:::

::: remember
None of these are laws. They're forces pulling in useful directions, and they pull against each other. The skill is picking the trade-off that fits the situation in front of you - not maximising any single one.

Which is also, usefully, exactly the answer interviewers are hoping to hear.
:::

::: behind
The sharpest tension is YAGNI against SOLID's Open/Closed. One says don't build for hypothetical futures; the other says design for extension.

Where most experienced engineers land: build the extension points your *current* requirements already hint at, and let real new requirements - when they actually arrive - show you where the rest belongs.
:::`,
  },

  "interview-questions": {
    concept: `## Retrieval, Not Recognition

::: story
OOP interviews are unusually predictable, and unusually easy to sound weak in - because the questions are about distinctions, and distinctions blur under pressure in a way that facts don't.
:::

## The Three-Part Answer

::: timeline The shape that works
Define it precisely :: One sentence, no hedging.
Give a concrete example :: Something specific enough to prove you've used it.
Name what it's confused with :: The distinguishing move. In OOP especially, this is where the marks are.
:::

::: reveal What that sounds like for "what is polymorphism?"
"Polymorphism means the same method call produces different behaviour depending on the object it's called on.

For example, Dog and Cat both overriding Animal's makeSound() - so a loop over a list of Animals calling makeSound() plays each one's own sound, with no if/else branching anywhere.

That's runtime polymorphism specifically, through method overriding. It's different from compile-time polymorphism - method overloading - where the compiler picks between same-named methods based on argument types instead."

Definition, example, distinction. Under thirty seconds, and the third part is what makes it sound like understanding rather than recall.
:::

## The Two Pairs They Will Ask About

::: cards
Abstraction vs encapsulation :: Design versus enforcement. What to hide, versus the mechanism preventing access. The most-asked "what's the difference" in the subject.
Overriding vs overloading :: Runtime, different class, same signature - versus compile time, same class, different parameters. Asked constantly because the shared word "polymorphism" invites the confusion.
:::

::: remember
Interviewers reach for those two pairs *because* they're commonly confused. Expect them rather than hoping for them, and have a one-line distinction ready for each that doesn't require you to think first.
:::

::: cards Also worth over-preparing
The four pillars, separately :: Encapsulation, abstraction, inheritance, polymorphism - each with its own distinct example. Blurring them into one answer about "organising code" is the common failure.
IS-A vs HAS-A :: Applied live to a pair of classes you're given on the spot.
Three SOLID principles with violations :: Not the acronym expanded. A concrete violation each, and Square/Rectangle for Liskov specifically.
Abstract class vs interface :: The shared-code-versus-contract-only reasoning.
:::

::: checkpoint
Asked for the four pillars, you give a fluent paragraph about organising code into reusable classes. Why does this answer land poorly?
- ( ) It's too short
- (x) It doesn't distinguish the four - each needs its own definition and example
- ( ) The four pillars aren't a real concept
- ( ) It should have included SOLID
> The question is about four separate ideas, and a paragraph that could describe any of them demonstrates none. This is the single most common way a well-prepared candidate sounds unprepared.
:::

::: behind
Beyond definitions, expect to design a small hierarchy live - "class structure for a ride-sharing app's vehicle types and pricing rules" is a common shape.

That one question wants inheritance or interfaces for the vehicle types, polymorphism for per-type fare calculation, and Open/Closed so a new vehicle type doesn't require editing the existing fare code. Three lessons at once, which is exactly why it's asked.
:::`,
  },
};
