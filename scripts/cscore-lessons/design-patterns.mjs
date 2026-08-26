// Design Patterns - rewritten lesson bodies. See operating-systems.mjs for the
// authoring rules. Every lesson here names the specific problem the pattern
// solves before naming the pattern, because a pattern learned without its
// problem is exactly how patterns get applied where they don't belong - which
// is the failure mode this subject should be inoculating against.

export const DESIGN_PATTERNS = {
  "singleton": {
    concept: `## What A Pattern Is

::: story
"Open floor plan kitchen" isn't a house. It's a shape that has worked so often that it earned a name - and every actual house using it has its own dimensions, materials and constraints.

A design pattern is that: a proven structure for a recurring problem, adapted rather than copied.
:::

The value of the name is coordination. "Let's use a Factory here" communicates a whole structure in three words to someone who has never seen your codebase.

## Exactly One, Forever

::: story
A country has one President at a time. Not zero, not four. And everyone reaches the same one through the same channel - nobody gets their own private President.
:::

**Singleton** guarantees exactly one instance of a class exists, reachable through one well-known access point.

::: cards How it's built
Private constructor :: \`new MyClass()\` becomes impossible from outside the class. This is what makes the guarantee real rather than a convention.
Static getInstance() :: Creates the instance on first call, returns that same cached one every time after.
:::

Genuine candidates: a database connection pool where a second one would waste connections, or an application config object where two copies could drift out of sync.

::: checkpoint
Two different parts of the app call \`ConfigManager.getInstance()\`. What do they get?
- ( ) Two separate instances, one each
- (x) The exact same instance
- ( ) An error on the second call
- ( ) A copy of the first instance
> The same object. Which is the point, and also the problem - both callers can now modify state the other one sees.
:::

## The Most Overused Pattern Here

::: mistake
Singleton is reached for constantly as a convenient way to avoid passing something through your code. That convenience is what makes it dangerous.

It introduces **global mutable state**: any part of the codebase can reach in and change it, so tracing "who set this to null" means searching everywhere.

And it breaks test isolation. A singleton's state survives between tests unless deliberately reset, so test A silently affects test B - producing the worst kind of failure, one that depends on the order tests happened to run in.
:::

::: remember
The guideline worth holding: use Singleton when "exactly one, globally shared" is a genuine requirement of the problem. Not when it's a convenient way to reach something from far away.

If the honest reason is "I didn't want to pass it in", the pattern you actually want is Dependency Injection - the last lesson in this subject.
:::

::: behind
The naive implementation has a race condition. Two threads can both evaluate \`instance == null\` as true before either assigns, and each creates its own instance - breaking the one guarantee the pattern exists to provide.

Thread-safe versions use a synchronised method, double-checked locking, or language-guaranteed lazy static initialisation. A useful reminder that the simplest pattern in this subject hides a genuine concurrency bug.
:::`,
  },

  "factory": {
    concept: `## Ordering Without Operating The Machine

::: story
You say "one cappuccino". You don't grind beans, steam milk, or touch the espresso machine.

The barista is the creation expert. You describe what you want and receive a finished drink.
:::

**Factory** moves object creation out of client code. Instead of calling \`new Circle()\` directly - which hard-codes exactly which class gets built, right there - a factory decides, and returns the object typed as a general interface.

::: flow
Client asks for "a shape" -> ShapeFactory decides -> returns a Shape
:::

The caller receives a \`Shape\`. It never learns whether that was a \`Circle\`, a \`Square\` or something added last month.

## Why That Matters Later

::: story
Suppose \`new Circle()\` appears directly in forty places across your codebase.

Now a \`Hexagon\` is added, and the rules for choosing shapes change slightly. You have forty sites to find and update, and one of them is in a file nobody has opened in a year.

With a factory, there is one place that knows how shapes get made. The forty callers were never coupled to the list.
:::

::: checkpoint
A new \`Hexagon\` class is added. Using a factory, what needs to change?
- ( ) Every call site that requests a shape
- (x) The factory only
- ( ) The Shape interface
- ( ) Nothing - it works automatically
> The factory. Client code asked for "a shape" and still does, which is exactly the Open/Closed Principle from the OOP subject: extend what can be created without modifying the code that requests creation.
:::

::: remember
Factory only pays off *because* it returns a general type. If the caller has to cast the result back to a concrete class to use it, the coupling never actually went away - it just got harder to see.

So Factory and polymorphism aren't two separate ideas here. The factory creates; polymorphism is what makes the result usable without knowing what it is.
:::

::: behind
**Abstract Factory** extends this to families. Rather than one factory making one product, it makes a coordinated *set*: a UI theme factory producing a matching Button, Checkbox and ScrollBar, all consistently styled for Dark or Light.

The problem it solves is mismatched combinations - a dark button beside a light scrollbar. When products must be created in matching sets, one factory per set prevents the mix.
:::`,
  },

  "builder": {
    concept: `## Twelve Parameters, Nine Of Them Null

::: story
\`new Pizza("Large", "Thin", true, false, false, true, null, null, false, "extra", null, 2)\`

Somebody wrote this. Somebody else has to read it and work out what the fourth boolean means.
:::

That's the **telescoping constructor** problem: a class with many optional fields forces either one enormous positional constructor, or a combinatorial pile of overloads for every plausible combination.

## One Choice At A Time

::: story
At a deli you specify a sandwich one choice at a time. Bread. Then protein. Then toppings, however many. Then sauce.

You don't recite every possible option in a fixed order, and you don't mention the things you don't want.
:::

**Builder** constructs an object step by step, then produces it with a final \`.build()\`.

  Pizza p = new PizzaBuilder()
      .size("Large")
      .crust("Thin")
      .addTopping("Mushroom")
      .addTopping("Olive")
      .build();

::: cards Why this reads better
Named, not positional :: \`.size("Large")\` says what it sets. The fourth argument of a constructor doesn't.
Only what you care about :: Unspecified fields take sensible defaults. No placeholder nulls.
Any order :: Nothing depends on remembering the parameter sequence.
:::

::: checkpoint
Why does each builder method return \`this\`?
- ( ) The language requires it
- (x) So calls can be chained - each returns the builder for the next call to act on
- ( ) To make the object immutable
- ( ) To validate input
> Returning the builder is what makes chaining possible. Forget it on one method and the chain breaks right there, usually with a confusing type error.
:::

::: remember
Reach for Builder when a class has several genuinely optional fields. For a class with two required fields, a plain constructor is clearer, and a builder is ceremony.

The tell is when you find yourself writing overloads, or passing nulls to skip parameters.
:::

::: behind
Builder pairs naturally with making the finished object **immutable**: the builder handles flexible step-by-step construction, and the result has no setters at all.

You get configurability during construction and safety afterward - nothing can change the object once it exists, so it can be shared freely across threads without coordination.
:::`,
  },

  "observer": {
    concept: `## Subscribe, And Be Told

::: story
You subscribe to a channel. When it uploads, you're notified.

Notice what the channel doesn't know: your name, your email, whether you want a push notification or just a feed entry. It broadcasts "new video" to whoever is subscribed, and each subscriber reacts however it chooses.
:::

**Observer**: a subject keeps a list of observers and notifies all of them when something changes, knowing nothing about them beyond a shared interface.

::: cards The mechanics
subscribe(observer) :: Add to the list.
unsubscribe(observer) :: Remove from it.
notify :: Loop the list, call each observer's update().
:::

## Why This Decouples

::: story
The subject depends only on the \`Observer\` interface. Which means adding an \`SmsNotifier\` alongside an existing \`EmailNotifier\` requires no change to the subject at all - it was never written against any specific observer.

New behaviour, no modification to existing code. Open/Closed again, in a different costume.
:::

::: checkpoint
You add a third observer type to a system with an existing subject and two observers. What changes in the subject?
- ( ) It needs a new notify method
- (x) Nothing - it only ever knew about the interface
- ( ) It needs the new class imported
- ( ) Its observer list type changes
> Nothing. That's the decoupling, and it's why Observer shows up wherever a system needs to be extended by people who won't be editing its core.
:::

::: didyouknow
You have used this pattern many times without naming it. Every GUI click listener is Observer. Every pub/sub message system is Observer. Every "watch this issue" button is Observer.

It's probably the most widely deployed pattern in this subject, and the least often recognised by name.
:::

::: mistake
Forgetting to unsubscribe is the classic bug, and it's a memory leak with a delay.

An observer that should have stopped listening keeps receiving notifications, and - worse - the subject's list holds a reference to it, so it can never be garbage collected. In a long-running application this accumulates quietly until something falls over.
:::

::: behind
Reactive libraries - RxJS, Reactive Streams - generalise Observer into streams of events over time, with operators to filter, transform and combine them.

Same subject-notifies-observers core, extended so composition happens declaratively rather than in each observer's update method. Once you see that, most of reactive programming stops looking novel.
:::`,
  },

  "strategy": {
    concept: `## Same Journey, Different Route

::: story
A navigation app offers fastest route, shortest route, avoid tolls.

Each is a genuinely different algorithm. The app around them doesn't change at all - it still shows a map, computes a route, gives turn-by-turn directions. Only the computation swaps.
:::

**Strategy** encapsulates a family of interchangeable algorithms behind one interface, so the choice can be made and changed at runtime without touching the surrounding code.

::: cards The structure
A shared interface :: \`RouteStrategy\` with one method.
Several implementations :: FastestRoute, ShortestRoute, AvoidTolls.
A context that holds one :: RouteCalculator delegates to whichever strategy is currently set, and never knows which.
:::

## What It Replaces

::: mistake
The alternative that appears without anyone deciding on it:

  if (type.equals("fastest")) { ... }
  else if (type.equals("shortest")) { ... }
  else if (type.equals("avoidTolls")) { ... }

Every new route type edits this chain. The chain lives inside the calculation logic, so route selection and route computation are now tangled. And the same chain tends to appear in three other places that also need to know the type.

Strategy replaces the branching with polymorphism, and the branch never has to be edited again.
:::

::: checkpoint
Strategy and Factory both involve an interface and several implementations. What's the actual difference?
- ( ) They're the same pattern named differently
- (x) Factory decides which object to *create*; Strategy decides which behaviour to *use*
- ( ) Factory is for classes, Strategy for methods
- ( ) Strategy can only have two implementations
> Creation versus behaviour selection. They compose fine - a factory can create the strategy object you want - and they answer different questions, which is why this pair is asked about so often.
:::

::: remember
The signal that Strategy fits: you have several ways to do one thing, the choice varies, and the surrounding structure stays identical whichever you pick.

If the surrounding structure also changes, you likely want something bigger than a swapped algorithm.
:::

::: behind
In practice Strategy almost always arrives with dependency injection - the last lesson in this subject.

Rather than a class deciding internally which strategy to use, the strategy is passed in from outside. Which means the class using an algorithm doesn't choose it, and the code that wires the system together does - keeping the decision where the context to make it actually lives.
:::`,
  },

  "adapter": {
    concept: `## The Plug That Doesn't Change Either End

::: story
A travel adapter doesn't rewire your charger and doesn't rewire the wall socket. It sits between them and translates one shape into another.

Both sides remain exactly as they were, and they now work together.
:::

**Adapter** wraps a class whose interface doesn't match what your code expects, translating calls at the boundary.

## A Real Integration

::: story
Your application is written against a \`PaymentProcessor\` interface with \`pay(amount)\`.

The third-party library you must integrate exposes \`executeTransaction(amountInCents, currency)\`. Different name, different units, extra parameter.

You have three options. Rewrite your whole application to match the library - invasive, and you'll do it again for the next library. Scatter conversions at every call site - and get the cents multiplication wrong in one of them. Or write one adapter.
:::

::: cards The adapter's job
Implements your interface :: So your code keeps calling \`pay(19.99)\` and knows nothing else.
Holds the incompatible object :: And translates - multiply to cents, supply the currency, call the real method.
Isolates the mess :: All library-specific awkwardness lives in one file.
:::

::: checkpoint
Why wrap the third-party library rather than modifying it?
- ( ) Modifying it would be slower
- (x) You usually can't, and shouldn't - it's external, shared, and will be upgraded out from under your changes
- ( ) Wrapping uses less memory
- ( ) There's no real difference
> Any change you make is lost at the next upgrade, and now you own a fork. Wrapping survives upgrades because you only depend on the library's public surface.
:::

::: remember
Adapter's real value is that your own code stays written against *your* interface. Swapping payment providers later means writing a second adapter - not touching the application.

Which is worth noticing as a general habit: an interface you own, with adapters to everything external, is what keeps a third party's design decisions out of your codebase.
:::

::: behind
Adapter and Decorator both wrap an object, which makes them easy to confuse, and the distinction is clean.

**Adapter changes the interface** without adding behaviour - making an incompatible thing usable. **Decorator keeps the interface** and adds behaviour - the next lesson.

Same mechanism, opposite intent: one translates, the other augments.
:::`,
  },

  "decorator": {
    concept: `## Layers, Not A Menu Of Combinations

::: story
Coffee, then milk, then whipped cream, then caramel.

Each addition wraps the one before, contributing its own cost and description. There's no pre-built menu item for every possible combination - and there couldn't be, because the number of combinations grows faster than any menu.
:::

**Decorator** adds behaviour to an object by wrapping it in another object implementing the same interface.

  Coffee order = new WhippedCream(new Milk(new BasicCoffee()));

Call \`getCost()\` on the outermost layer and each one adds its contribution to whatever it wraps.

## The Problem It Avoids

::: story
Try this with subclasses instead.

CoffeeWithMilk. CoffeeWithCream. CoffeeWithMilkAndCream. CoffeeWithMilkAndCaramel. CoffeeWithMilkAndCreamAndCaramel.

Four add-ons produce sixteen combinations. Five produce thirty-two. Each one a class somebody writes and maintains, and adding a sixth add-on doubles the pile.
:::

::: remember
That's the **combinatorial explosion**, and Decorator's answer is that each decorator is written *once* regardless of what it may be combined with.

Four decorators cover all sixteen combinations, because the composition happens at runtime rather than in the class hierarchy.
:::

::: checkpoint
Why must each decorator implement the same interface as what it wraps?
- ( ) So it can access private fields
- (x) So every layer looks identical to its caller and wrapping can nest arbitrarily
- ( ) So the compiler can optimise it
- ( ) It doesn't have to
> Uniformity is what makes nesting work. Each layer treats what it wraps as "a Coffee" - which is equally true whether that's the base object or three decorators deep.
:::

::: didyouknow
Java's I/O library is built this way, and it's the example most people meet before they know the pattern's name.

A \`BufferedReader\` wraps an \`InputStreamReader\`, which wraps a \`FileInputStream\`. Buffering, character decoding, raw bytes - three concerns, three layers, composed at the call site.

Which is also why that API looks so strange until you recognise what it's doing.
:::

::: behind
Decorator's cost is debugging. A stack trace through five wrapping layers is considerably harder to read than one through a single class, and "where did this value get modified?" can mean checking every layer.

Worth the trade when combinations genuinely multiply. Not worth it for two options that could have been a boolean.
:::`,
  },

  "mvc": {
    concept: `## Separating Three Things That Always Get Mixed

::: story
Business logic in the template. A calculation in the button handler. A validation rule that exists in two places because nobody could find the first one.

Every one of those is the same mistake: data, presentation and control flow living in the same place.
:::

**MVC** is an architectural pattern - bigger in scope than the object-level patterns so far - separating an application into three responsibilities.

::: cards
Model :: The data and business logic. A Student with its fields and validation rules, knowing nothing about how it's displayed.
View :: Presentation only. Renders the model as HTML, a mobile screen, a JSON response. No business logic.
Controller :: Receives input - a click, an HTTP request - updates the model, and picks which view renders the result.
:::

::: flow
Request -> Controller -> Model -> View -> Response
:::

## What The Separation Buys

::: cards
Independent change :: Redesign the entire UI without touching business logic, because they were never in the same file.
Multiple views, one model :: The same Student renders as a web page, a mobile screen and an API response - with the honours-eligibility rule written once.
Testable logic :: The Model can be tested with no UI, no rendering, no simulated clicks. Just objects and assertions.
:::

::: checkpoint
Where does a rule like "a student with GPA above 3.5 is honours eligible" belong?
- ( ) The View, since that's where the badge appears
- (x) The Model - it's business logic, independent of display
- ( ) The Controller, since it handles the request
- ( ) Whichever is most convenient
> The Model. Put it in the View and it has to be repeated in the mobile view and the API response - three copies of one rule, which will disagree within a year.
:::

::: mistake
The most common violation is logic creeping into the View, because it's genuinely convenient at the time - the data is right there and it's only one condition.

The bill arrives with the second view. Now the rule exists twice, and the third view will make three, and one of them will be missed when the threshold changes.
:::

::: remember
MVC is the Single Responsibility Principle from the OOP subject, applied to a whole application instead of one class.

Same reasoning, different scale: one component, one reason to change.
:::

::: behind
**MVVM** and **MVP** are close relatives, both adding a layer between Model and View to hold view-specific data shaping - so formatting a date for display doesn't have to live in either the Model or the template.

They exist because the strict three-way split leaves a genuine gap: presentation logic that isn't business logic and isn't rendering. MVC isn't the only answer, just the most widely taught.
:::`,
  },

  "dependency-injection": {
    concept: `## Ingredients Are Delivered

::: story
A restaurant kitchen doesn't grow vegetables or raise livestock. Ingredients arrive from suppliers, and the kitchen's job is to cook with what it's given.

Now imagine a kitchen that insisted on producing every ingredient itself. It could never substitute anything, and you could never test a recipe without also running a farm.
:::

**Dependency Injection** provides a class's dependencies from outside - usually through the constructor - rather than having the class create them itself.

::: cards The difference
Creating internally :: \`new EmailSender()\` inside the constructor. The class has chosen, permanently, for every caller and every test.
Injected :: \`NotificationService(Sender sender)\`. Whoever constructs it decides which implementation arrives.
:::

## Why This Is The Testability Lesson

::: story
Without injection, testing \`NotificationService\` means using the real \`EmailSender\`.

Which means your test suite sends real emails. To real addresses. Every time it runs.

So the test doesn't get written, or it gets written and disabled, or someone's inbox fills up on every CI run.
:::

::: story
With injection, the test constructs \`NotificationService\` with a \`MockSender\` - a fake that records what it was asked to send and sends nothing.

Now you can assert exactly what the service tried to do, in milliseconds, with no side effects. The logic is testable because the dependency became a parameter.
:::

::: checkpoint
A class creates its own database connection internally. Why is it hard to unit test?
- ( ) The class is too large
- (x) Every test needs a real database, because there's no way to substitute a fake
- ( ) Database code can't be tested
- ( ) It needs more comments
> No seam to substitute at. The class decided its dependency, so a test can't decide differently - and a "unit" test that needs a live database isn't really a unit test.
:::

::: remember
This is the **Dependency Inversion Principle** from the OOP subject's SOLID lesson, given its own name and treated as a pattern.

Depend on an abstraction; let something else supply the concrete implementation. Same idea, arriving from the practical direction rather than the principled one.
:::

::: behind
Frameworks like Spring and Angular provide a **DI container**: infrastructure that constructs and wires an application's whole object graph automatically, from configuration rather than by hand.

Containers also manage **scope** - whether an injected dependency is a single shared instance for the whole application, or a fresh one per injection.

Which is where this subject closes a loop: that first option is Singleton, arrived at as a configuration choice rather than a class design. Same guarantee, decided by whoever wires the system rather than baked into the class - and considerably easier to change your mind about later.
:::`,
  },
};
