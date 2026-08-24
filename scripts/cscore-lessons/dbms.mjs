// DBMS - rewritten lesson bodies. See operating-systems.mjs for the authoring
// rules; the running analogy here is a college's own records (students,
// courses, teachers, fees), which the original content already reached for and
// which stays useful all the way through to concurrency and indexing.

export const DBMS = {
  "introduction": {
    concept: `## Three Cabinets, Three Versions Of The Truth

::: story
A school keeps its records on paper. Grades live in one cabinet, attendance in a second, fee payments in a third. Each cabinet has its own clerk, and each clerk writes things down their own way.

Nothing stops two clerks editing the same student's file at once and overwriting each other. Nothing stops one of them spelling "Lakshmi" one way while another spells it differently. And "every student who scored above 90% *and* paid fees on time" means physically walking between three cabinets, cross-referencing by hand, and hoping.

That is not a filing problem. It's a *truth* problem: there are now three answers to the same question and no way to tell which one is right.
:::

Plain flat-file storage in software looks exactly like those three cabinets. A **Database Management System** is the software built to end that specific mess.

## What A DBMS Gives You That Files Don't

::: cards
Reduced redundancy :: Data is stored once and referenced everywhere it's needed - so there is no second copy to drift out of sync with the first.
Enforced consistency :: Rules live with the data and are checked automatically. A fee amount cannot be negative because the database refuses, not because everyone remembered to be careful.
Safe concurrent access :: Many people can read and write at the same time without corrupting each other's work.
Security :: Fine-grained control over exactly who may see or change what, down to individual columns.
Real querying :: One question, one query - instead of three cabinets and an afternoon.
:::

::: didyouknow
That last point is the one people underestimate. The cross-referencing question that took a clerk an afternoon is one line of SQL that runs in a millisecond - and it's *correct* every time, which the afternoon never was.
:::

::: checkpoint
A DBMS's single most valuable contribution is best described as:
- ( ) It stores data using less disk space
- (x) It enforces rules and guarantees around the data - consistency, safe concurrency, controlled access
- ( ) It replaces the need for application code
- ( ) It makes data impossible to delete
> Storage is the boring part; a text file can store data. What you're really buying is the *guarantees*, and everything else in this subject is a mechanism for keeping one of them.
:::

::: remember
Two words that get used interchangeably and shouldn't be. The **database** is the organised data itself - the actual student records. The **DBMS** is the software managing it - MySQL, PostgreSQL, Oracle. Interviewers do check this one.
:::

::: behind
The four guarantees a well-behaved transaction provides have a name - **ACID**: Atomicity, Consistency, Isolation, Durability. There's a full lesson on them later in this subject.

Different products also make deliberately different bargains. Relational systems (MySQL, PostgreSQL, Oracle) enforce a rigid table structure and strong consistency. NoSQL systems (MongoDB, Cassandra) relax structure or consistency in exchange for flexibility or scale. Which to reach for is a live, genuinely contested design decision - not a settled answer you can memorise.
:::`,
  },

  "er-model": {
    concept: `## Draw It Before You Build It

::: story
Nobody builds a house by laying bricks and seeing what happens. You draw a blueprint first - not because the blueprint is the house, but because discovering the kitchen has no door is cheap on paper and ruinous in concrete.

Databases are the same, and the failure mode is just as expensive. Realising your schema can't represent something obvious - a student with two phone numbers, a course with two teachers - after you've written a year of application code against it is one of the more painful ways to learn this lesson.
:::

An **Entity-Relationship diagram** is that blueprint. You sketch the real-world things you need to track and how they connect, before writing a single line of SQL.

::: cards The three building blocks
Entity :: A real-world thing worth tracking in its own right - a Student, a Course, a Teacher. Drawn as a rectangle.
Attribute :: A property of an entity - a Student's name, roll number, email. Drawn as an oval joined to its entity.
Relationship :: How two entities connect - a Student *enrols in* a Course. Drawn as a diamond between two rectangles.
:::

## The Question That Decides Everything

Every relationship has a **cardinality**, and getting it wrong is the single most consequential mistake at this stage - because it determines what your tables can physically represent.

::: cards
One-to-one :: One Person has exactly one Passport, and that Passport belongs to exactly one Person.
One-to-many :: One Teacher teaches many Courses, but each Course has one primary teacher.
Many-to-many :: Many Students enrol in many Courses. A student takes several; a course holds many.
:::

::: remember
To get cardinality right, ask the question in **both directions**, out loud. "How many courses can one student take?" Many. "How many students can one course have?" Also many. Only asking one direction is how one-to-many and many-to-many get confused.
:::

::: checkpoint
You've modelled Student and Course as many-to-many. Can you represent that with a single \`course_id\` column on the students table?
- ( ) Yes, that's exactly what foreign keys are for
- (x) No - one column holds one value, so it could only record one course per student
- ( ) Yes, by storing a comma-separated list of course ids
- ( ) Only if every course has the same number of students
> A many-to-many relationship needs a third table sitting between the two - a junction table, with one row per student-course pair. Neither side can hold it alone, and the comma-separated list option is a trap you'll meet again in the Relational Model lesson.
:::

::: mistake
If a student can have *multiple* phone numbers, "phone number" is not an attribute. It's a related entity of its own. The tell is always plurality: the moment the real answer to "how many?" is "more than one", an oval needs to become a rectangle.
:::

::: behind
Extended ER modelling adds two ideas worth recognising.

A **weak entity** cannot be identified without its relationship to another entity - a Room only means something inside a specific Building.

**Generalisation and specialisation** let an Employee entity specialise into Manager and Developer, sharing common attributes while each adds its own. If you've studied OOP, you've just met inheritance again in different clothing - and it is not a coincidence.
:::`,
  },

  "relational-model": {
    concept: `## From Blueprint To Tables

::: story
Your ER sketch says what exists. The relational model is the specific, standardised way of actually building it - and it looks so much like a spreadsheet that most people assume it *is* one.

It isn't. A spreadsheet will let you type anything anywhere. The relational model won't, and every restriction it imposes is buying you something.
:::

Each entity becomes a **table** - formally a *relation*. Each row is one record: a **tuple**. Each column is a property: an **attribute**. And each column is restricted to a specific type of value - its **domain**, so the \`age\` column accepts positive integers and nothing else.

::: cards The vocabulary, precisely
Relation :: A table. Note this does *not* mean "a relationship between tables" - in this formal vocabulary it means the table itself.
Tuple :: A row. One specific record.
Attribute :: A column. One property.
Domain :: The set of values a column is allowed to hold.
:::

## The One Rule That Makes SQL Possible

Every cell must hold exactly one **atomic** - indivisible - value. Never a list. Never a nested table.

::: mistake
The temptation is constant and it always looks harmless: storing \`"Math, Physics, Chemistry"\` in one \`subjects\` cell instead of building a second table.

Then someone asks how many students take Physics. Now you're searching for a substring, and \`"Physics"\` also matches \`"Astrophysics"\`. Then a subject gets renamed and you're rewriting fragments of text across thousands of rows. Every operation that should have been trivial becomes a string-manipulation problem with edge cases.
:::

::: checkpoint
An \`orders\` table has a column \`items\` holding \`"Pen, Notebook, Eraser"\`. What's the actual cost of this design?
- ( ) It wastes disk space
- (x) Filtering, counting and updating individual items all become unreliable string operations
- ( ) It's fine as long as the list is short
- ( ) SQL will refuse to store it
> SQL stores it happily - that's what makes this trap so easy to fall into. The bill arrives later, at every single query that needs to reason about one item rather than the whole string.
:::

::: remember
Atomicity isn't pedantry. It is precisely *because* every table has a fixed set of typed columns and every value is indivisible that a query language can reliably ask precise questions across any combination of tables. Break the rule and you've broken the thing that makes the rest of this subject work.
:::

::: behind
The relational model rests on **relational algebra** - a formal set of operations (selection, projection, join, union) that SQL ultimately compiles down to.

This is not academic trivia. It explains why some queries are fast and others aren't: a **query optimiser** is deciding which sequence of these algebraic operations, in which order, will answer your query cheapest. Every time you run a query, something is quietly making that choice on your behalf.
:::`,
  },

  "keys": {
    concept: `## "The Tall Student" Is Not An Identifier

::: story
A teacher needs to call on exactly one student, unambiguously.

"Roll number 23" works. "The tall student" doesn't - there might be two, and on the day there are, the instruction is worse than useless because it *looks* like it worked.

A key is the database's roll number: a column, or set of columns, that identifies exactly one row with no ambiguity, ever.
:::

## Four Words That Get Confused Constantly

::: cards
Super key :: *Any* set of columns that uniquely identifies a row - including wastefully large ones. (roll_number, name, email) together is unique, and also carrying two columns it doesn't need.
Candidate key :: A *minimal* super key. Remove any single column and it stops being unique. roll_number alone is already enough, so it's a candidate key; the three-column version isn't.
Primary key :: Whichever one candidate key the designer officially picks as *the* identifier. The database then guarantees no two rows ever share a value for it.
Composite key :: A key made of more than one column together, for when no single column is unique alone but a combination is.
:::

::: remember
A table can have several candidate keys - a student might be uniquely identified by roll_number *or* by email. Only one of them gets to be the primary key. The others don't stop being candidate keys; they just weren't chosen.

Every primary key is a candidate key. Not every candidate key is the primary key.
:::

## The One That Points Somewhere Else

A **foreign key** is a different kind of thing entirely. It's a column in one table that points at another table's primary key - and it is exactly how the relational model turns an ER *relationship* into real tables.

::: flow
enrollments.student_id -> students.roll_number
:::

Declared properly, that arrow is a promise the database enforces: you cannot enrol a student who doesn't exist.

::: checkpoint
An \`enrollments\` table has \`student_id\` and \`course_id\`. One student takes many courses; one course has many students. What should the primary key be?
- ( ) student_id alone
- ( ) course_id alone
- (x) (student_id, course_id) together
- ( ) Neither - this table doesn't need a primary key
> A composite primary key. Each column repeats on its own, but each specific *pair* should appear only once - which is also exactly what stops the same student being enrolled in the same course twice.
:::

::: mistake
Naming a column \`student_id\` does not make it a foreign key. Without a declared constraint it's just an integer with a suggestive name, and nothing prevents it holding 9999 when no such student exists. The convention is a comment; the constraint is the guarantee.
:::

::: behind
Foreign keys also decide what happens to dependent rows when the row they point at is deleted or changed - \`ON DELETE CASCADE\`, \`SET NULL\`, or \`RESTRICT\`.

\`CASCADE\` on enrollments deletes a student's enrolments automatically when the student is deleted. \`RESTRICT\` blocks the deletion until those enrolments are dealt with first.

Choosing the wrong one is a genuine and recurring source of production data loss - "I deleted one row and it silently took four thousand with it" is always this setting.
:::`,
  },

  "normalization": {
    concept: `## The Teacher Who Has Two Offices

::: story
One giant spreadsheet tracks every enrolment. Each row repeats the course's teacher name and that teacher's office number - once per enrolled student. Four hundred students, four hundred copies of "Room 214".

Then the teacher moves office.

Now you must find and update every single row mentioning her. Miss one, and your spreadsheet claims the same teacher is in two offices simultaneously, with nothing to indicate which is correct. You haven't lost data. You've lost the *ability to know*.
:::

That's an **update anomaly**, and it travels with two siblings:

::: cards The three anomalies
Update anomaly :: The same fact is stored many times, so a partial update leaves contradictory copies behind.
Insertion anomaly :: You cannot record a new teacher until she's actually teaching a course, because there is nowhere teacher-shaped to put her.
Deletion anomaly :: Removing the last student enrolled on a course also erases the only record of that course's teacher and her office.
:::

Notice what these have in common: one table is being asked to store facts about several different things at once. **Normalization** is the process of splitting it up until each table is about exactly one thing.

## Three Stages, Each Subtler Than The Last

::: timeline The normal forms
1NF - atomic values :: Every value indivisible. No comma-separated lists in a cell. This is really just the relational model enforced honestly.
2NF - no partial dependency :: 1NF, plus every non-key column depends on the *whole* primary key. This bites specifically with composite keys: in a (student_id, course_id) table, a teacher_name that depends only on course_id violates it.
3NF - no transitive dependency :: 2NF, plus no non-key column depends on another non-key column. If teacher_office depends on teacher_name, which depends on the key, teacher_office belongs in a Teachers table of its own.
:::

::: remember
The progression is one of increasing subtlety, and it's worth holding as a sentence: **1NF fixes messy cells, 2NF fixes depending on part of the key, 3NF fixes depending on something that isn't the key at all.**
:::

::: checkpoint
\`enrollments(student_id, course_id, teacher_name, teacher_office)\` - which normal form does \`teacher_office\` break, and why?
- ( ) 1NF, because office numbers aren't atomic
- ( ) 2NF, because it depends on course_id only
- (x) 3NF, because it depends on teacher_name, which is itself not part of the key
- ( ) None - the table is already in 3NF
> A transitive dependency: key to teacher_name to teacher_office. The office is a fact about the *teacher*, and it should live in a table whose subject is teachers.
:::

::: mistake
Normalising harder is not automatically normalising better. A fully normalised schema often needs more joins to answer everyday questions, and some systems deliberately **denormalise** specific read-heavy tables - accepting controlled redundancy in exchange for faster reads.

The distinction that matters: denormalising on purpose, with the anomalies understood and managed, is engineering. Never having normalised in the first place is just the spreadsheet.
:::

::: behind
**BCNF** (Boyce-Codd Normal Form) tightens 3NF: for every functional dependency X to Y, X must be a super key. It closes a subtle case 3NF still permits, which shows up when a table has multiple overlapping candidate keys.

4NF and 5NF go further, handling multi-valued and join dependencies. In practice, the overwhelming majority of real production schemas stop at 3NF or BCNF - past that, the anomalies being prevented get rarer while the query complexity keeps climbing.
:::`,
  },

  "joins": {
    concept: `## Putting Back Together What You Just Split Apart

::: story
Normalization just taught you to break one messy table into clean ones. Students here, enrolments there.

Which immediately creates a new problem: "show me every student's name alongside the courses they're taking" is now a question that no single table can answer.

That's not a flaw in the design. It's the bill for it - and joins are how you pay it.
:::

A **JOIN** stitches rows from multiple tables back together on a matching column, usually a foreign key - precisely reversing the split that normalization created.

## Four Joins, One Question

::: analogy Two guest lists
Picture two overlapping lists. List A is every student. List B is every enrolment.

An **INNER JOIN** hands you only the overlap - students who are enrolled in something. A student taking nothing disappears from the result entirely.

A **LEFT JOIN** keeps everyone on list A regardless of a match. The student taking nothing still appears, with NULL where course details would be.

A **RIGHT JOIN** is the same idea mirrored, keeping everyone on list B.

A **FULL OUTER JOIN** keeps everyone from both lists, matched where possible, NULL-filled where not.
:::

::: remember
Choosing a join is really answering one question: **do I want rows with no match to disappear, or to survive with NULLs?**

"Only students actually taking a course" is an INNER JOIN. "Every student, so I can spot who's taking nothing" is a LEFT JOIN. That's the whole decision.
:::

::: checkpoint
Your enrolment report is missing eleven students who definitely exist in the students table. Your query uses INNER JOIN. What's happening?
- ( ) The students table is corrupted
- (x) Those eleven have no enrolment rows, so the inner join silently dropped them
- ( ) INNER JOIN has a row limit
- ( ) They need to be re-inserted
> This is the single most common join bug in production, and it's nasty precisely because nothing fails - the query succeeds and quietly returns an incomplete answer. LEFT JOIN keeps them, with NULLs.
:::

::: mistake
Unmatched columns in an outer join become **NULL** - not zero, and not an empty string. Any \`SUM()\`, \`COUNT()\` or comparison downstream needs to expect that, or you'll get results that are wrong in a way that looks perfectly plausible.
:::

::: reveal How do you find rows that have no match at all?
There's a standard pattern worth committing to memory, because it's asked constantly and it looks backwards the first time you meet it.

LEFT JOIN the two tables, then filter for rows where the right table's key came back NULL.

The LEFT JOIN keeps every student including the unmatched ones; the NULL check then keeps *only* the unmatched ones, since a NULL key is precisely the signature of "nothing on the right side matched".

"Every customer who has never placed an order" is that query, and some version of it exists in essentially every reporting dashboard ever built.
:::

::: behind
A **CROSS JOIN** pairs every row of one table with every row of the other, with no matching condition at all - and it's the foundation the others are built on. An INNER JOIN is conceptually a CROSS JOIN followed by filtering to matching pairs.

A **SELF JOIN** joins a table to itself using aliases to tell the two copies apart. It's the standard technique for hierarchical data - finding every employee alongside their manager's name when both are rows in the same employees table.
:::`,
  },

  "sql": {
    concept: `## The Language You Speak To The Data

::: story
The relational model is the blueprint for how data is arranged. SQL is how you actually talk to it - build the structure, fill it, ask about it, change it.

You don't need to know how the library's shelves are organised to ask a librarian for a book. That's the deal SQL offers: say what you want, not how to fetch it.
:::

## Three Families, One Question Each

SQL commands are grouped by what they *do*, and holding the split clearly makes everything else easier to reason about.

::: cards
DDL - Data Definition Language :: CREATE, ALTER, DROP. Changes the *structure*. Am I rebuilding the shelf?
DML - Data Manipulation Language :: INSERT, UPDATE, DELETE. Changes the *data*. Am I changing what's on the shelf?
DQL - Data Query Language :: SELECT. Changes nothing, asks a question. Am I just looking?
:::

::: mistake
\`DELETE FROM students\` with no WHERE clause deletes every row in the table. Not an error, not a prompt - it does exactly what you asked.

The habit worth building for life: write the WHERE clause *first*, run it as a SELECT to see what it matches, and only then change the verb to DELETE.
:::

## Reading A SELECT In The Order It Actually Runs

The clauses are written in one order and evaluated in another, which is why long queries look intimidating until you know the trick.

::: timeline How a SELECT is really evaluated
FROM :: Which table (or joined tables) are we working with.
WHERE :: Throw away individual rows that don't qualify. This happens *before* any grouping.
GROUP BY :: Bucket the surviving rows together.
Aggregate :: COUNT, AVG, SUM computed per bucket.
HAVING :: Throw away whole *buckets* that don't qualify - filtering on aggregate results.
SELECT :: Pick which columns and expressions to actually return.
ORDER BY :: Sort the final result.
:::

::: remember
That evaluation order explains SQL's most confusing error. WHERE runs before grouping exists, so it cannot filter on a group's average - the average hasn't been computed yet. Filtering on an aggregate is HAVING's entire job.

**WHERE filters rows. HAVING filters groups.**
:::

::: checkpoint
You want only departments whose average salary exceeds 50,000. Where does that condition go?
- ( ) WHERE avg(salary) > 50000
- (x) HAVING avg(salary) > 50000
- ( ) ORDER BY avg(salary) > 50000
- ( ) It can't be done in one query
> HAVING - it runs after GROUP BY, when each department's average actually exists. Put it in WHERE and the database will tell you the aggregate isn't valid there, which is a confusing error until this ordering clicks.
:::

::: behind
Three tools that turn SQL from usable into genuinely powerful.

**Subqueries** nest a SELECT inside another query. **CTEs** (\`WITH name AS (...)\`) name a temporary result set, letting you build multi-step logic that reads top to bottom instead of inside out - the single biggest readability win available in SQL.

**Window functions** (\`ROW_NUMBER()\`, \`RANK()\`, running totals via \`OVER (...)\`) compute per-row rankings and running aggregates *without* collapsing rows the way GROUP BY does. "Rank each employee's salary within their own department" needs one, and there's no clean way to fake it.
:::`,
  },

  "views": {
    concept: `## A Window, Not A Copy

::: story
The finance team needs every employee's name and salary. They must never see the national ID numbers and home addresses sitting in the same table.

You could build a second table with the sensitive columns stripped out. Now you own two tables that must be kept in step forever, and the day they drift is the day someone acts on stale salary data.

Or you could cut a window into the original table that shows only the permitted columns - and is never stale, because there's nothing separate to go stale.
:::

That window is a **view**: a saved SELECT query that behaves like a table when you query it, but stores no data of its own. Every query against a view re-runs its underlying SELECT against the real tables, live.

::: cards What views are actually for
Security :: Expose some columns and rows while hiding others, without duplicating anything. Grant access to the view, not the table.
Simplification :: Save a gnarly five-table join once, then query it by name forever instead of rewriting it.
Stability :: The view's shape can stay constant for its consumers even if the underlying tables are reorganised beneath it.
:::

::: checkpoint
A view is queried at 9am and again at 3pm. Between them, someone updated the underlying table. What does the 3pm query return?
- ( ) The 9am data, until the view is refreshed
- (x) The current data - the view re-runs its query every time
- ( ) An error, because the view is out of date
- ( ) Both versions
> A view stores no data, so there's nothing to be stale. The cost of that freshness is that the underlying query genuinely runs each time you ask.
:::

::: mistake
Reading "view" as "cached snapshot" is the most common misunderstanding here, and it leads people to expect a performance win that isn't there. A view does not make anything faster. It makes a complex query *reusable*.
:::

## Why You Can't Always Write Through The Window

You can generally UPDATE through a simple single-table view, and the change lands on the real table underneath.

Complex views - involving joins, aggregations, or GROUP BY - usually reject updates.

::: remember
The reason is genuinely unanswerable rather than a limitation someone forgot to implement. If a view shows the *average* salary per department, and you try to set one average to 60,000, which employee rows should change, and by how much? There is no single correct answer, so the database declines to guess.
:::

::: behind
A **materialized view** is the middle ground people usually want when they first misunderstand views: it *does* store its results physically on disk, so expensive aggregations become fast reads.

The bargain is explicit rather than hidden - it must be refreshed on some schedule, and between refreshes it is genuinely stale. That's the standard tool for analytics dashboards where slightly-old-but-instant beats perfectly-current-but-slow.
:::`,
  },

  "transactions": {
    concept: `## Where Did The Money Go?

::: story
You transfer 500 rupees to a friend. The bank must subtract 500 from your balance, then add 500 to theirs.

Now the server loses power in the gap between those two steps.

Your 500 rupees is gone. Deducted from you, never credited to anyone. It isn't delayed or misfiled - by the only record that exists, that money simply ceased to be. And no amount of careful application code prevents this, because the power cut doesn't care how carefully you wrote the second line.
:::

A **transaction** is the database's guarantee that a group of operations happens as one indivisible unit: either all of them take effect, or none of them do. The half-finished state cannot exist - not "is unlikely to", *cannot*.

## ACID, One Letter At A Time

::: cards
Atomicity :: All operations succeed together or none do. The transfer either happens completely or not at all - never halfway.
Consistency :: A transaction moves the database from one valid state to another. It can never leave data breaking a declared rule, like a negative balance where negatives are disallowed.
Isolation :: Concurrent transactions don't see each other's unfinished work. Each behaves as though it were running alone, even when hundreds aren't.
Durability :: Once a transaction commits, its changes survive - including a crash one microsecond later. Committed means written to durable storage, not just held in memory.
:::

::: remember
Atomicity and Isolation get blurred together constantly, and they solve unrelated problems.

**Atomicity** is about one transaction's own steps: all, or nothing. **Isolation** is about *other* transactions: they don't get to watch yours halfway through.

One is internal completeness, the other is mutual invisibility.
:::

::: checkpoint
The first UPDATE of a two-step transfer succeeded; the second failed. You issue ROLLBACK. What is the balance of the first account?
- ( ) Reduced by 500 - the first update already happened
- (x) Exactly what it was before the transaction started
- ( ) Zero
- ( ) Undefined until the next commit
> ROLLBACK undoes every change the transaction made, restoring the state to before it began. That's the emergency undo the story needed and didn't have.
:::

**COMMIT** makes a transaction's changes permanent. **ROLLBACK** discards every change it made so far. Until one of the two happens, nothing the transaction did is real to anyone else.

::: didyouknow
This is why you're never charged for a ticket you didn't get, and never get a ticket you weren't charged for. Both halves live in one transaction, so the outcome where exactly one happened has no way to occur. Every payment system you've ever used is leaning on this.
:::

::: behind
Durability is usually implemented with **write-ahead logging**: the database writes a log entry *describing* a change to durable storage before applying it to the actual data files. A crash mid-write is then recoverable by replaying the log on restart.

If that sounds familiar, it should - it's the same journaling idea as the Operating Systems subject's File Systems lesson, one layer up the stack.

**Savepoints** let you roll back to an intermediate point inside a larger transaction rather than discarding all of it, which matters for long multi-step work where only the last part needs retrying.
:::`,
  },

  "concurrency": {
    concept: `## The Withdrawal That Never Happened

::: story
Two withdrawal requests hit the same account at the same instant. The balance is 1000.

Both read 1000, because neither has written anything yet. Both independently calculate 1000 minus 300. Both write back 700.

Two withdrawals of 300 have been processed. The balance should be 400. It says 700. One withdrawal has vanished - the money left the bank and the account doesn't know.
:::

That's a **lost update**, and it's the database-level cousin of the race condition from the Operating Systems subject's Synchronization lesson. Same shape, same cause, different layer: read-then-write, interleaved badly.

## Four Named Ways Concurrency Goes Wrong

::: cards
Lost update :: Two transactions read the same value, both write back, and one write silently erases the other.
Dirty read :: A transaction reads another transaction's *uncommitted* changes. If that one then rolls back, the first acted on data that never became real.
Non-repeatable read :: The same row, read twice within one transaction, gives two different values - because someone committed a change in between.
Phantom read :: The same *query*, run twice within one transaction, returns a different set of rows - because someone inserted or deleted matching rows in between.
:::

::: remember
Non-repeatable and phantom reads sound like the same thing and aren't. Non-repeatable read is **same row, different value**. Phantom read is **same query, different rows**.

One is a value changing underneath you. The other is the population changing underneath you.
:::

## Choosing How Much Safety To Pay For

::: timeline Isolation levels, weakest to strongest
Read Uncommitted :: Allows dirty reads. You can see other transactions' unfinished work.
Read Committed :: Blocks dirty reads. Non-repeatable reads still possible.
Repeatable Read :: Blocks non-repeatable reads too. Phantom reads can still slip through.
Serializable :: Transactions behave as if run one at a time. Prevents all of the above - and blocks the most, hurting throughput under heavy load.
:::

::: checkpoint
Two people click "book" on the last remaining concert seat at the same moment. Which failure is the booking system defending against?
- (x) A lost update - both read "1 seat left" and both write "0 seat left"
- ( ) A dirty read
- ( ) A phantom read
- ( ) Nothing - the database prevents this automatically at any isolation level
> A lost update, and the seat gets sold twice. This is exactly why booking systems reach for strict locking or serializable isolation at the precise moment of booking - and typically nowhere else, because that safety is expensive.
:::

::: mistake
Serializable is not simply the "correct" setting that lazy systems avoid. It prevents every anomaly and can severely reduce throughput under concurrent load, because preventing them means making transactions wait.

Real systems choose the weakest level that's actually safe for the operation in question - strict for booking the last seat, relaxed for loading a dashboard. That's engineering judgement, not a corner being cut.
:::

::: behind
Two families of mechanism implement all of this.

**Locking-based control**: a transaction takes shared or exclusive locks on what it reads and writes, and conflicting transactions wait for release.

**MVCC** - Multi-Version Concurrency Control: each transaction sees a consistent *snapshot* of the data as of when it began, and writes create new versions rather than overwriting in place. Readers never block writers and writers never block readers, which is how PostgreSQL gets Repeatable-Read-like behaviour with far less waiting than pure locking would need.

Knowing MVCC exists, and roughly why it wins, is a strong signal of practical database depth.
:::`,
  },

  "indexing": {
    concept: `## The Textbook With No Index

::: story
You need every mention of photosynthesis in a 900-page textbook. Without an index at the back, there is exactly one method: open page 1, read, turn, repeat. Nine hundred times.

With an index, you read one line - *photosynthesis: 45, 112, 203* - and go straight there. You never touch the other 897 pages.

The information was identical in both books. The difference was entirely in whether someone had prepared a sorted way in.
:::

Reading every row to find matches is a **full table scan**. A database **index** is the page at the back: a separate, pre-sorted structure pointing straight at the rows matching a given column value.

## Why It Stays Fast As The Table Grows

Most indexes are **B-Trees** - balanced trees where every path from root to leaf is the same length. Searching means comparing against a node, following the branch that could contain your value, and repeating.

::: cards Two very different growth curves
Full table scan :: Cost grows *linearly*. Ten times the rows, ten times the work. A million rows means a million comparisons.
B-Tree index lookup :: Cost grows *logarithmically*. Going from a thousand rows to a million barely changes the number of steps - roughly twenty comparisons finds a row in a million.
:::

::: checkpoint
A query filtering on an unindexed \`email\` column takes 2 seconds on a 500,000-row table. You add an index. What else changes?
- ( ) Nothing else - indexes are pure gain
- (x) Every INSERT, UPDATE and DELETE touching email now also has to update the index
- ( ) The table uses less disk space
- ( ) Other queries get slower
> Reads get dramatically faster and writes get slightly slower, because the index is a second structure that must be kept correct on every change. That trade is usually excellent - and it is still a trade.
:::

::: mistake
"Slow query? Add an index" is right often enough to become a reflex, and the reflex is what causes the next problem.

Ten indexes on a table means ten structures to update on every single write. On a write-heavy table, over-indexing makes the system measurably *slower* overall - and it's a diagnosis people rarely reach for, because indexes are filed mentally under "makes things faster".

Index the columns you actually search, filter and join on. Not every column, just in case.
:::

::: remember
The instinct worth carrying: an index is a bet that this column will be *read* far more often than it is *written*. On a foreign key or a login email, that bet is trivially correct. On a counter updated every request, it may not be.
:::

::: behind
A **composite index** covers several columns together, and its one rule surprises everyone once: an index on (last_name, first_name) helps queries filtering by last_name, or by both - but **not** one filtering by first_name alone. Only a left-matching prefix works, exactly like a phone book sorted by surname is useless for finding everyone called Priya.

A **covering index** goes further and includes every column a particular query needs, so the database answers it from the index alone and never reads the table at all.
:::`,
  },

  "stored-procedures": {
    concept: `## Recipe #12

::: story
A waiter could walk into the kitchen and describe every step of a dish out loud - heat the pan, add the oil, now the onions - on every single order, all evening.

Or the kitchen could keep the recipe on a card, and the waiter could call out "Recipe #12".

The dish is identical. What changed is how many round trips it took to ask for it, and how many chances there were to describe it slightly differently the twentieth time.
:::

A monthly payroll run might mean twenty separate queries from your application - calculate hours, apply tax rules, update balances, write a log - each one a separate round trip across the network to the database.

A **stored procedure** is that recipe card: named, reusable SQL logic saved and compiled inside the database itself, triggered with a single call.

::: cards What that buys
Fewer round trips :: One call instead of twenty. The logic runs where the data already lives, rather than shuttling intermediate results back and forth.
Consistent logic :: Every application touching the database uses the same implementation of the rule, instead of each re-implementing it slightly differently.
Tighter security :: An app can be granted EXECUTE on one specific procedure without ever getting direct read or write access to the underlying tables.
:::

::: checkpoint
Which of these is the strongest reason to move an operation into a stored procedure?
- ( ) SQL always runs faster than application code
- (x) A multi-step operation needs many round trips, or callers should not have direct table access
- ( ) Stored procedures are easier to unit test
- ( ) They make the database schema simpler
> Round trips and access control are the real arguments. Testability is actually a point *against* - which is the honest half of this topic.
:::

## The Half People Leave Out

::: mistake
Business logic split between application code and stored procedures is genuinely harder to live with: awkward to version-control, awkward to test with normal tooling, awkward to debug, and tied to one vendor's SQL dialect.

Push far enough and the application becomes a thin shell calling procedures nobody can follow, with the real behaviour living somewhere your test suite can't see.

Which is why many teams deliberately keep *most* logic in application code and reserve procedures for specific performance-critical or security-sensitive operations. Neither "always" nor "never" is the professional answer here.
:::

::: didyouknow
Banks lean on this pattern specifically for the security property. Application developers get permission to EXECUTE an approved procedure and no permission at all to write to raw financial tables - so even a compromised application cannot invent an arbitrary balance change. The procedure boundary *is* the audit boundary.
:::

::: behind
**Stored functions** return a single value and can be used inside a SQL expression, unlike procedures. Both differ from **triggers** - the next lesson - in one decisive way: procedures and functions are called explicitly, while triggers fire on their own.

**Prepared statements** are a different thing that sounds similar: pre-compiled SQL with placeholder parameters, used for performance (no re-parsing the same query shape) and, far more importantly, for safety - parameters are never concatenated into the query string, which is what closes off SQL injection.
:::`,
  },

  "triggers": {
    concept: `## The Smoke Alarm

::: story
A recipe card waits to be asked for. A smoke alarm doesn't.

Nobody calls a smoke alarm. It watches, and the instant there's smoke it acts - whether or not anyone wanted it to, whether or not anyone remembers it's there.
:::

A stored procedure runs when something CALLs it. A **trigger** fires automatically whenever a specific event happens to a table - an INSERT, UPDATE or DELETE - with nothing calling it at all.

## Before Or After

::: cards
BEFORE :: Runs just before the row is written. The natural place for validation and correction - forcing an email to lowercase, or rejecting a write outright when a rule is broken.
AFTER :: Runs just after the row changes. The natural place for consequences - writing an audit row recording who changed what, or keeping a derived summary value in step.
:::

::: checkpoint
You want to guarantee a salary can never be stored as a negative number. BEFORE or AFTER?
- (x) BEFORE - reject the value before it's ever written
- ( ) AFTER - check it once it's stored, then fix it
- ( ) Either works equally well
- ( ) Neither; triggers cannot reject writes
> BEFORE. An AFTER trigger would have to notice the bad value and then correct it, meaning the invalid state genuinely existed for a moment - and anything reading in that window saw it.
:::

## The Problem With Things That Happen On Their Own

::: mistake
A developer reading \`UPDATE employees SET salary = 50000 WHERE id = 5\` has no way to know, from that line, that it also fires three triggers doing work elsewhere in the system.

That invisibility is the whole objection. The behaviour is real, it's load-bearing, and it appears nowhere near the code that caused it - so the person debugging a mysterious extra row six months from now has no thread to pull.

Heavy trigger use is often actively discouraged for exactly this reason: the same logic in application code, where a reader can *see* it, is usually easier to live with.
:::

::: remember
And yet there's one case where firing invisibly is precisely the point. An audit log implemented as a trigger records the change no matter *how* it was made - through the app, through a script, through an administrator typing SQL by hand at 2am.

Logic in application code can be bypassed by not going through the application. A trigger cannot. When the requirement is "this must never be skippable", that's not a side effect - it's the feature.
:::

::: behind
Triggers can read \`OLD\` and \`NEW\` - the row's state before and after the change - which is exactly what makes the audit pattern possible: log both values and you have a real history.

Databases also distinguish **row-level** triggers (once per affected row) from **statement-level** (once per statement, however many rows it touched). Row-level is far more common, because most real trigger logic needs each individual row's OLD and NEW values to do anything useful.
:::`,
  },

  "dbms-interview-questions": {
    concept: `## Retrieval Under Pressure

::: story
You know this material now. Then someone asks "so what's normalization?" and you have four seconds before the pause becomes your answer.

This is the same rehearsal as the Operating Systems subject's interview lesson, and for the same reason: knowing something and being able to produce it out loud, in order, while someone watches, are two different skills. Only one of them gets tested in the room.
:::

## The Three-Part Answer

::: timeline The shape that works for any DBMS question
Define it precisely :: One sentence. What it is, without hedging.
Give a concrete example :: Something specific enough to prove you've used the idea, not just read it.
Name the trade-off :: What it costs, or when you wouldn't. This is the part that distinguishes understanding from recall.
:::

::: reveal What that sounds like for "what is normalization?"
"Normalization is splitting a table into smaller, well-structured tables to eliminate redundancy and the update, insertion and deletion anomalies that redundancy causes.

For example, storing a teacher's office number once in a Teachers table, instead of repeating it on every enrolment row - where changing offices would otherwise mean updating four hundred rows and getting one wrong.

The trade-off is that a fully normalised schema needs more joins to answer everyday questions, which is why some systems deliberately denormalise specific read-heavy tables."

Definition, example, trade-off. Under thirty seconds, nothing memorised word for word - just three slots, filled.
:::

## The Five To Over-Prepare

::: cards
Normalization, with a live example :: Not the definitions of 1NF/2NF/3NF, but the ability to take a messy table and walk it through them out loud.
INNER vs LEFT JOIN :: Including the "find rows with no match" pattern, which is asked in some form constantly.
ACID, one example each :: Interviewers ask for a *consistency* violation specifically. A blurred answer covering all four at once doesn't survive that.
The concurrency anomalies :: Dirty read, non-repeatable read, phantom read, lost update - distinguished, not just listed.
Indexing trade-offs :: Why reads get faster and writes get slower, in your own words.
:::

::: mistake
The failure that costs most marks in a DBMS round isn't a gap in knowledge - it's being unable to actually *write* SQL from a blank page.

Reading a solved JOIN and producing one under time pressure are different skills, and DBMS interviews test the second one directly far more often than OS interviews test anything comparable. Conceptual fluency alone will not carry this round.
:::

::: checkpoint
You explain normalization well. The interviewer immediately asks how it affects join performance. What's going on?
- ( ) They didn't accept your answer
- (x) A cross-topic follow-up, checking whether you understand the consequences of what you just described
- ( ) They've changed subject
- ( ) It's a trick question with no good answer
> Chained follow-ups are the norm and usually a good sign. Here the honest answer is the trade-off you should already have mentioned: more tables means more joins, which is exactly why deliberate denormalisation exists.
:::

::: interview
Write SQL by hand while preparing - on paper, or in a blank editor with no autocomplete. Typing a correct GROUP BY from nothing exposes gaps that reading a solved example papers over completely.
:::`,
  },

  "mock-test": {
    concept: `## A Diagnostic, Not A Formality

::: story
There's a specific way to fail an exam you were ready for: you re-read everything, all of it felt familiar, and familiarity felt like knowledge.

Recognising a correct answer and producing one are different skills. This is where you find out which one you have, while it's still cheap to find out.
:::

The quiz below spans every module in this subject: the ER and relational models, keys, normalization, joins, SQL, views, transactions, concurrency, indexing, stored procedures and triggers.

::: remember
Closed book. No scrolling back, no looking anything up mid-question. The moment you check an answer while answering, the score stops measuring anything you can act on.
:::

## Using What It Tells You

::: timeline After you finish
Score it honestly :: Count the lucky guesses as gaps. A right answer you couldn't justify is a wrong answer that hasn't surfaced yet.
Group mistakes by topic :: Three misses in normalization is one problem. One miss each across three topics is a different problem.
Re-study, don't re-read :: Go back to the actual lesson. Re-reading this test's explanation is the weakest possible version of that.
Write the SQL by hand :: For any join, GROUP BY or transaction question you got wrong, write the query from a blank page. That's the skill the real round tests.
:::

::: interview
Time yourself. Pace under pressure is its own skill, and the only way to know how long you actually take is to measure it once under conditions you didn't enjoy.
:::

::: behind
A real DBMS interview rarely stops at recall. Expect a schema-design question combining several topics at once - "design a normalised schema for a food-delivery app, then tell me what isolation level you'd use at the moment payment is captured, and why" reaches into ER modelling, normalization, transactions and concurrency in one breath.

Once this test feels easy, the next step isn't another test. It's writing the actual SQL for a few of those scenarios by hand, because the muscle memory of a correct JOIN under time pressure is a genuinely different thing from recognising the right option out of four.
:::`,
  },
};
