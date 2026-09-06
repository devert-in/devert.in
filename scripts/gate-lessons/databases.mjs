// GATE Databases - authored lesson content. Follows the authoring rules
// documented at the top of general-aptitude.mjs.

export const DATABASES = {

  // ---------------- Data Models ----------------

  "er-model": {
    difficulty: "Easy",
    estimatedMinutes: 25,
    // Verified via YouTube oEmbed (2026-08-29) - real, publicly viewable.
    resources: [{
      kind: "video",
      title: "Introduction to E-R Model (Part 1)",
      url: "https://www.youtube.com/watch?v=vz5az6N86DY",
      description: "Introduces the Entity-Relationship model, covering entities, attributes, and relationship sets.",
    }],
    whatYoullLearn: [
      "Entities, attributes, and relationships - the three building blocks of an ER diagram",
      "Cardinality ratios (1:1, 1:N, M:N) and participation constraints, and how they differ",
      "Weak entities, and why they can't exist without an identifying strong entity",
      "Converting an ER diagram into relational tables - the specific rules for each construct",
    ],
    prerequisites: [],
    concept: `## Modelling The Real World Before Writing Any SQL

::: story
The Entity-Relationship (ER) model is a conceptual blueprint drawn BEFORE any table is created - it captures what things exist (entities), what describes them (attributes), and how they connect (relationships), independent of how they'll eventually be stored.
:::

::: cards The three building blocks
Entity :: A distinguishable "thing" the database tracks - a STUDENT, a COURSE. Represented as a rectangle.
Attribute :: A property describing an entity or relationship - a STUDENT's name, roll number. Represented as an oval.
Relationship :: An association BETWEEN entities - a STUDENT enrolls in a COURSE. Represented as a diamond.
:::

## Cardinality And Participation: Two Different Questions

::: mistake
Confusing cardinality with participation. CARDINALITY answers "how MANY on each side" (1:1, 1:N, M:N). PARTICIPATION answers "is it MANDATORY or optional" (total/mandatory vs partial/optional) for each entity in the relationship. A relationship can be 1:N with total participation on one side and partial on the other - these are two entirely independent dimensions.
:::

::: cards
1:1 :: Each entity instance on side A relates to AT MOST one on side B, and vice versa.
1:N :: One instance on side A can relate to MANY on side B, but each instance on side B relates to at most ONE on side A.
M:N :: Instances on EITHER side can relate to multiple instances on the other side.
Total (mandatory) participation :: EVERY instance of the entity MUST participate in the relationship.
Partial (optional) participation :: An instance of the entity MAY exist without participating.
:::

## Weak Entities: No Independent Identity

::: remember
A WEAK ENTITY has no primary key of its own sufficient to uniquely identify it - it depends on a STRONG (identifying) entity's key PLUS its own partial key (discriminator) to be uniquely identified. A "DEPENDENT" entity (a person's dependents, for insurance) is a classic example: a dependent is only meaningful in the context of a specific employee, and is identified by (employee's key, dependent's own name) together.
:::

## ER-To-Relational Conversion Rules

::: flow
Strong entity :: Becomes its own table, attributes become columns, the entity's key becomes the primary key.
Weak entity :: Becomes its own table too, but its primary key is the COMBINATION of the identifying strong entity's key (as a foreign key) plus its own partial key.
1:1 or 1:N relationship :: Usually implemented by adding a FOREIGN KEY on the "many" side (or either side, for 1:1) referencing the "one" side's primary key - no separate relationship table needed.
M:N relationship :: REQUIRES its own separate table, whose primary key is the COMBINATION of both participating entities' keys (as foreign keys) - a single foreign key on either side cannot represent a many-to-many association.
:::

::: checkpoint
An M:N relationship between STUDENT and COURSE (enrollment, with a grade attribute) is converted to relational tables. How is this best represented?
- ( ) Add a foreign key to STUDENT referencing COURSE
- ( ) Add a foreign key to COURSE referencing STUDENT
- (x) Create a separate ENROLLMENT table with (studentId, courseId) as its primary key, plus the grade attribute
- ( ) Merge STUDENT and COURSE into one table
> M:N relationships cannot be represented by a foreign key on either side alone (each side can relate to MULTIPLE on the other) - a dedicated junction/relationship table with a composite key of both entities' keys is required, and any relationship-specific attributes (like grade) live in that same table.
:::`,
    keyPoints: [
      "Entity (rectangle, a thing), attribute (oval, a property), relationship (diamond, an association) - the three ER building blocks.",
      "Cardinality (1:1, 1:N, M:N - how many on each side) and participation (total/mandatory vs partial/optional - is it required) are independent dimensions.",
      "Weak entity: no independent primary key - identified by the strong entity's key plus its own partial key (discriminator).",
      "Conversion: strong entity -> table with its own key. Weak entity -> table with composite key (strong entity's key + partial key). 1:1/1:N -> foreign key on the appropriate side. M:N -> separate junction table with a composite key of both entities.",
    ],
    analogies: [
      "An ER diagram is an architect's blueprint before construction - it captures rooms (entities), their features (attributes), and how they connect (relationships/doorways) before a single wall (table) is actually built.",
    ],
    commonMistakes: [
      "Confusing cardinality (how many) with participation (mandatory or not) - treating them as the same concept instead of two independent constraints.",
      "Trying to represent an M:N relationship with a foreign key on just one side, which cannot capture a many-to-many association at all.",
      "Forgetting a weak entity's primary key must include the identifying strong entity's key as part of its composite key, not just its own discriminator alone.",
    ],
    memoryTricks: [
      "\"Cardinality: how many. Participation: is it required.\" Two separate questions about the same relationship line.",
      "M:N always needs its OWN table - one foreign key is never enough for many-to-many.",
    ],
    formulas: [],
    shortcuts: [
      "For any ER-to-relational conversion question, first classify the relationship's cardinality (1:1/1:N/M:N) - that single classification determines which conversion rule applies.",
      "To identify a weak entity quickly, look for an entity that couldn't be meaningfully identified (or wouldn't logically exist) without reference to another specific entity instance.",
    ],
    pyqRelevance: `ER model questions typically involve converting a described (or diagrammed) scenario into the correct relational schema, or classifying cardinality/participation from a scenario description - both are common, reliable early-question GATE Databases topics.`,
    interviewConnection: `ER modelling is the standard first step in real-world database schema design, and correctly identifying M:N relationships (requiring a junction table) versus 1:N (a simple foreign key) is a frequent database-design interview discussion point.`,
    revisionSummary: `Entity (thing), attribute (property), relationship (association) - the three ER building blocks.

Cardinality (1:1/1:N/M:N) and participation (total/partial) are independent. Weak entity: identified by strong entity's key + own partial key.

Conversion: strong entity -> own table. Weak entity -> composite key table. 1:1/1:N -> foreign key. M:N -> separate junction table with composite key.`,
    shortNotes: {
      oneMinute: "Entity/attribute/relationship = the 3 ER building blocks. Cardinality (1:1/1:N/M:N) != participation (total/partial) - independent. Weak entity: strong entity's key + own partial key. Conversion: strong entity->table; weak entity->composite key table; 1:1/1:N->foreign key; M:N->separate junction table (composite key).",
    },
    mcqs: [
      {
        question: "What distinguishes a weak entity from a strong entity?",
        options: [
          "A weak entity has fewer attributes",
          "A weak entity cannot be uniquely identified by its own attributes alone - it needs an identifying strong entity's key too",
          "A weak entity cannot participate in relationships",
          "There is no real difference",
        ],
        correctIndex: 1,
        explanation: "A weak entity lacks a sufficient key of its own - it's uniquely identified only by combining the identifying (strong) entity's primary key with its own partial key/discriminator.",
      },
    ],
    numericals: [],
  },

  "relational-model": {
    difficulty: "Easy",
    estimatedMinutes: 25,
    // Verified via YouTube oEmbed (2026-08-29) - real, publicly viewable.
    resources: [{
      kind: "video",
      title: "DBMS | L-6 | Relational Model Introduction | Database Management System | GATE Exam",
      url: "https://www.youtube.com/watch?v=_P1bKokswCk",
      description: "Introduces the fundamentals of the relational data model for GATE.",
    }],
    whatYoullLearn: [
      "The precise vocabulary: relation, tuple, attribute, domain, degree, cardinality",
      "Superkey, candidate key, primary key, and foreign key - and how they relate to each other",
      "The two fundamental integrity rules every relational database must satisfy",
      "Why NULL specifically cannot appear in a primary key, by definition",
    ],
    prerequisites: ["ER Model"],
    concept: `## Precise Vocabulary For A Table

::: cards
Relation :: A TABLE - formally, a set of tuples (so no duplicate rows, and no defined row order, in the strict relational model).
Tuple :: A ROW - one single record/instance.
Attribute :: A COLUMN - one named property.
Domain :: The SET of allowed values for an attribute (e.g. integers, or a specific enumerated set).
Degree :: The NUMBER OF ATTRIBUTES (columns) in a relation.
Cardinality :: The NUMBER OF TUPLES (rows) in a relation - a DIFFERENT meaning from ER model's "cardinality ratio" (1:1/1:N/M:N), same word, genuinely different concept in this context.
:::

## The Key Hierarchy

::: flow
Superkey :: ANY set of attributes that uniquely identifies a tuple - possibly with redundant extra attributes beyond what's actually needed.
Candidate key :: A MINIMAL superkey - remove any single attribute from it, and it stops being able to uniquely identify tuples. A relation can have multiple candidate keys.
Primary key :: The ONE candidate key specifically CHOSEN (by the database designer) to be the relation's main identifier.
Foreign key :: An attribute (or set) in one relation that references a CANDIDATE KEY (usually the primary key) of another (or the same) relation, enforcing a link between them.
:::

::: mistake
Assuming every superkey is a candidate key. A superkey only becomes a CANDIDATE key if it's MINIMAL - if any attribute can be removed while still uniquely identifying every tuple, it was never minimal, and is a superkey but not a candidate key.
:::

## Two Fundamental Integrity Rules

::: cards
Entity integrity :: No attribute that is part of the PRIMARY KEY may be NULL. A primary key exists specifically to uniquely identify every tuple - a NULL component would make that identification impossible or ambiguous.
Referential integrity :: Every FOREIGN KEY value must either match an EXISTING value of the key it references in the other relation, or be NULL (if the foreign key attribute itself allows NULL) - never a value that doesn't correspond to any actual referenced tuple.
:::

::: checkpoint
A relation STUDENT(rollNo, name, email) has rollNo as a candidate key, and email is also unique for every student (also a candidate key). If rollNo is chosen as the primary key, what is email?
- ( ) A foreign key
- (x) A candidate key that was NOT chosen as the primary key (sometimes called an "alternate key")
- ( ) A superkey but not a candidate key
- ( ) Not a key of any kind
> Both rollNo and email independently, minimally identify every tuple - both qualify as candidate keys. Once rollNo is specifically chosen as the primary key, email remains a candidate key (specifically, an alternate key) - not a foreign key, and not merely a non-minimal superkey.
:::`,
    keyPoints: [
      "Relation=table, tuple=row, attribute=column, domain=allowed value set, degree=number of columns, cardinality=number of rows (a different meaning from ER model's cardinality RATIO).",
      "Superkey: any uniquely-identifying attribute set (possibly redundant). Candidate key: a MINIMAL superkey. Primary key: the chosen candidate key. Foreign key: references another relation's candidate key.",
      "Entity integrity: no NULL in any primary key component. Referential integrity: every foreign key value must match an existing referenced value, or be NULL if allowed.",
      "A relation can have multiple candidate keys; only one becomes the primary key, the rest are alternate keys.",
    ],
    analogies: [
      "A superkey is any description that picks out one specific person (even an overly-detailed one, like 'height, weight, AND fingerprint'); a candidate key is the SHORTEST such description that still works (maybe just 'fingerprint' alone) - trimming any more would stop it from being unique.",
    ],
    commonMistakes: [
      "Treating every superkey as automatically a candidate key, ignoring the minimality requirement.",
      "Confusing relational-model 'cardinality' (row count) with ER-model 'cardinality ratio' (1:1/1:N/M:N) - same word, different meaning depending on context.",
      "Allowing a NULL in a primary key attribute, violating entity integrity - a primary key component can never be NULL, by definition.",
    ],
    memoryTricks: [
      "\"Superkey: works, maybe with extra baggage. Candidate key: works, nothing extra to trim.\" Minimality is the whole distinction.",
      "Entity integrity: no NULL in the PK. Referential integrity: FK must point somewhere real (or be NULL, if allowed).",
    ],
    formulas: [],
    shortcuts: [
      "To check if a set of attributes is a candidate key (not just a superkey), try removing each attribute one at a time - if uniqueness ever survives a removal, the original set wasn't minimal, hence not a candidate key.",
      "For an integrity-rule question, immediately identify whether it's about the PRIMARY key (entity integrity, no NULLs) or a FOREIGN key (referential integrity, must reference something real or be NULL) - the two rules apply to different key types.",
    ],
    pyqRelevance: `Relational model vocabulary (especially superkey vs candidate key vs primary key distinctions) and the two integrity rules are frequent, fast conceptual GATE questions - reliable early marks once the precise definitions are memorised correctly.`,
    interviewConnection: `Correctly distinguishing candidate keys from the chosen primary key, and understanding referential integrity, is foundational vocabulary for any real database schema design discussion or SQL foreign-key constraint conversation.`,
    revisionSummary: `Relation=table, tuple=row, attribute=column, degree=#columns, cardinality=#rows.

Superkey (uniquely identifies, maybe redundant) -> candidate key (minimal superkey) -> primary key (the chosen candidate key). Foreign key references another relation's candidate key.

Entity integrity: no NULL in primary key. Referential integrity: foreign key must match an existing value or be NULL.`,
    shortNotes: {
      oneMinute: "Relation=table, tuple=row, attribute=column, degree=#cols, cardinality=#rows. Superkey(unique, maybe redundant)->candidate key(minimal)->primary key(chosen one). FK references another relation's candidate key. Entity integrity: no NULL in PK. Referential integrity: FK matches existing value or is NULL.",
    },
    mcqs: [
      {
        question: "What is the defining property that distinguishes a candidate key from a general superkey?",
        options: ["It must be a single attribute", "It must be minimal - no attribute can be removed while preserving uniqueness", "It must be chosen by the DBA", "It must reference another table"],
        correctIndex: 1,
        explanation: "A candidate key is specifically a MINIMAL superkey - removing any one of its attributes would break its ability to uniquely identify tuples. A superkey without this minimality property is not a candidate key.",
      },
    ],
    numericals: [],
  },

  // ---------------- Relational Query Languages ----------------

  "relational-algebra": {
    difficulty: "Moderate",
    estimatedMinutes: 30,
    // Verified via YouTube oEmbed (2026-08-29) - real, publicly viewable.
    resources: [{
      kind: "video",
      title: "Lec-50: Introduction to Relational Algebra | Database Management System",
      url: "https://www.youtube.com/watch?v=4YilEjkNPrQ",
      description: "Introduces relational algebra as a procedural query language for relational databases.",
    }],
    whatYoullLearn: [
      "The core relational algebra operators and exactly what each one does to a relation",
      "Why JOIN is really just a combination of Cartesian product and selection",
      "The specific rule for when set operators (union, intersection, minus) can even be applied",
      "Translating an English query into a relational algebra expression step by step",
    ],
    prerequisites: ["Relational Model"],
    concept: `## A Procedural Query Language, Operator By Operator

::: story
Relational algebra is a PROCEDURAL query language: every expression is built from operators applied to relations (and the results of other operators), where each operator takes one or two relations and produces a NEW relation - this "closure" property (relation in, relation out) is exactly what lets operators be chained/composed into larger expressions.
:::

::: cards Core unary operators (one relation in)
Selection (sigma) :: sigma_condition(R) - picks ROWS satisfying a condition, keeps all columns.
Projection (pi) :: pi_columns(R) - picks specific COLUMNS, keeps all rows (and removes duplicate resulting rows, per the strict set-based relational model).
Rename (rho) :: rho_newname(R) - renames a relation (and/or its attributes) without changing its content.
:::

::: cards Core binary operators (two relations in)
Union (R union S) :: All tuples in R OR S (or both), duplicates removed. Requires R and S to be UNION-COMPATIBLE (same number of attributes, matching domains).
Set difference (R - S) :: Tuples in R but NOT in S. Also requires union-compatibility.
Cartesian product (R x S) :: Every possible PAIRING of a tuple from R with a tuple from S - if R has m tuples and S has n, the result has m*n tuples.
Join (R join S) :: A Cartesian product FOLLOWED BY a selection on a matching condition - conceptually "join = product, then filter," even though real database engines never literally compute the full product first.
:::

::: mistake
Attempting a UNION or SET DIFFERENCE between two relations with a DIFFERENT number of attributes, or attributes whose domains don't correspond - these operators specifically require union-compatibility, unlike Cartesian product or join, which have no such restriction.
:::

## Join Really Is Just Product Plus Selection

::: remember
R JOIN S ON condition is EXACTLY EQUIVALENT to sigma_condition(R x S) - compute the full Cartesian product, then filter to rows satisfying the join condition. This equivalence is worth internalising precisely because it explains WHY a join without any condition (a "natural join" on no shared attributes, or an unrestricted theta-join) degenerates into a plain Cartesian product.
:::

## Translating English To Relational Algebra

::: flow
1. Identify which relation(s) are involved :: What table(s) does the query start from?
2. Identify any row-filtering condition :: This becomes a selection (sigma).
3. Identify which columns are actually needed in the output :: This becomes a projection (pi), usually applied LAST (project only after selecting/joining, to avoid projecting away columns still needed for a later join condition).
4. Identify any combination across multiple relations :: This becomes a join (or Cartesian product + selection).
:::

::: checkpoint
To find the NAMES of all students enrolled in the course with courseId='CS101', from STUDENT(rollNo, name) and ENROLLMENT(rollNo, courseId), which relational algebra expression is correct?
- ( ) pi_name(STUDENT) join sigma_courseId='CS101'(ENROLLMENT)
- (x) pi_name(STUDENT join sigma_courseId='CS101'(ENROLLMENT))
- ( ) sigma_courseId='CS101'(pi_name(STUDENT))
- ( ) pi_name(sigma_courseId='CS101'(STUDENT))
> Filter ENROLLMENT to CS101 rows first (selection), JOIN that filtered result with STUDENT (combining via rollNo), and only THEN project down to just name - projecting to name too early (before the join) would discard the rollNo column the join actually needs to match on.
:::`,
    keyPoints: [
      "Selection (sigma): filters rows. Projection (pi): filters columns (removes duplicate result rows). Rename (rho): renames without changing content.",
      "Union, set difference: require union-compatible relations (same attribute count, matching domains). Cartesian product: every pairing, m*n tuples, no compatibility requirement.",
      "Join = Cartesian product followed by a selection on the matching condition - sigma_condition(R x S) is exactly R join S on that condition.",
      "Standard query-translation order: select/join first, project last - projecting too early can discard columns still needed for a later join condition.",
    ],
    analogies: [
      "Relational algebra operators are like a series of kitchen tools applied one after another to ingredients (relations) - selection is a sieve (keeps some rows), projection is a knife trimming to specific parts (keeps some columns), and join is combining two prepped ingredients together based on a matching rule.",
    ],
    commonMistakes: [
      "Attempting union or set difference on relations that aren't union-compatible (different attribute counts or mismatched domains).",
      "Projecting away a column before a later join or selection step still needs it, breaking the rest of the query.",
      "Forgetting that projection removes duplicate rows in the strict relational model, unlike SQL's SELECT which keeps duplicates unless DISTINCT is explicitly used.",
    ],
    memoryTricks: [
      "\"Sigma filters ROWS (down), pi filters COLUMNS (across).\" The Greek-letter operators' shapes even hint at direction - sigma looks like a funnel narrowing rows, pi's legs stand over selected columns.",
      "Join = product + filter. Memorise this equivalence once, and both operators make sense together.",
    ],
    formulas: [
      "R JOIN S ON condition  =  sigma_condition(R x S).",
      "Cartesian product size: |R x S| = |R| * |S| (tuple counts multiply).",
    ],
    shortcuts: [
      "When translating an English query, write the operators in this default order: select/filter first, join across relations next, project to final needed columns LAST - this ordering avoids the most common translation mistake.",
      "For a union/set-difference question, check attribute count and domain compatibility FIRST before evaluating the actual operation - an incompatible pair makes the operation undefined regardless of anything else.",
    ],
    pyqRelevance: `Relational algebra expression writing (translate this English query) and evaluating a given expression's result on small sample relations are both extremely frequent, high-value GATE Databases questions - a strong grasp of operator semantics pays off across many question variations.`,
    interviewConnection: `Relational algebra is the theoretical foundation every SQL query compiles down to internally - understanding "join = product + filter" explains why an unindexed join on a large table can be so much slower than an indexed one (the engine is effectively still filtering a conceptually enormous intermediate result).`,
    revisionSummary: `Selection (sigma, filters rows), projection (pi, filters columns, removes dupes), rename (rho). Union/set-difference need union-compatibility; Cartesian product doesn't.

Join = Cartesian product + selection: sigma_condition(R x S) = R join S on condition.

Translation order: select/join first, project last.`,
    shortNotes: {
      oneMinute: "Sigma=select rows. Pi=project columns (removes dupes). Rho=rename. Union/set-difference need union-compatibility (same attrs). Cartesian product: m*n tuples, no compatibility needed. Join = product + selection: sigma_cond(RxS) = R join S. Translation order: select/join first, project last.",
    },
    mcqs: [
      {
        question: "What is the result size (tuple count) of R x S (Cartesian product) if R has 5 tuples and S has 8 tuples?",
        options: ["13", "40", "3", "5"],
        correctIndex: 1,
        explanation: "Cartesian product pairs every tuple of R with every tuple of S: |R x S| = |R| * |S| = 5 * 8 = 40.",
      },
    ],
    numericals: [
      {
        question: "Relation R has 12 tuples, relation S has 5 tuples. What is |R x S|?",
        answerMin: 60,
        answerMax: 60,
        unit: "",
        solution: `|R x S| = |R| * |S| = 12 * 5 = 60`,
      },
    ],
  },

  "tuple-relational-calculus": {
    difficulty: "Hard",
    estimatedMinutes: 30,
    // Verified via YouTube oEmbed (2026-08-29) - real, publicly viewable.
    resources: [{
      kind: "video",
      title: "Lec-58: Tuple Calculus in DBMS with examples",
      url: "https://www.youtube.com/watch?v=SnsrohgiPo0",
      description: "Explains tuple relational calculus with worked examples.",
    }],
    whatYoullLearn: [
      "Declarative vs procedural query languages - what makes tuple calculus fundamentally different from relational algebra",
      "The exact syntax: tuple variables, conditions, and quantifiers",
      "Universal (for all) vs existential (there exists) quantification, and translating each correctly",
      "Safety of expressions - why an unsafe tuple calculus expression is genuinely disallowed, not just discouraged",
    ],
    prerequisites: ["Relational Algebra"],
    concept: `## Declarative: Describe What You Want, Not How To Get It

::: story
Tuple Relational Calculus (TRC) is DECLARATIVE - a query specifies WHAT result is wanted (a description/condition every result tuple must satisfy), not the STEP-BY-STEP procedure to compute it (which is what relational algebra does). Both are proven to have equivalent expressive power (relationally complete), but they read completely differently.
:::

::: remember
A TRC query has the general form { t | condition(t) } - "the set of all tuples t such that condition(t) holds." Everything about the query lives inside describing that condition.
:::

## Quantifiers: For All, vs There Exists

::: cards
Existential quantifier (there exists), written as-exists :: as-exists t (P(t)) is TRUE if AT LEAST ONE tuple t makes P(t) true. Used for "some", "at least one" conditions.
Universal quantifier (for all), written for-all :: for-all t (P(t)) is TRUE only if EVERY possible tuple t makes P(t) true. Used for "every", "all" conditions - classically, queries like "find X that relates to EVERY Y" (division-style queries).
:::

::: mistake
Directly translating an English "for every Y" requirement into for-all without correctly handling the IMPLICATION structure it usually needs: "for all y in S, y relates to x" is typically written as for-all y (y in-S(y) implies relates(x,y)), NOT for-all y (relates(x,y)) alone - the second form incorrectly requires x to relate to EVERY tuple in the ENTIRE universe of tuples, not just every tuple actually in S.
:::

## Safety: Why Some Expressions Are Disallowed

::: story
A TRC expression is UNSAFE if it could, in principle, produce an INFINITE result, or refer to values that don't actually appear anywhere in the actual database - which would make it uncomputable in general. { t | not(t in-R) } is unsafe: it describes "every tuple NOT in R", an infinite set over an unbounded domain, with no way to bound the answer to a finite result.
:::

::: remember
Safety is required specifically because TRC's declarative "describe what you want" freedom is powerful enough to describe genuinely uncomputable queries - the safety restriction (every quantified variable's range must be bounded by an actual existing relation) exists to guarantee every ALLOWED expression corresponds to some finite, actually-computable answer.
:::

::: checkpoint
To find all students who are enrolled in EVERY course offered, using STUDENT(rollNo), COURSE(courseId), ENROLLMENT(rollNo, courseId), which quantifier structure is needed?
- ( ) as-exists courseId (enrolled in it)
- (x) for-all courseId (if it's an offered course, then the student is enrolled in it)
- ( ) Neither quantifier is needed
- ( ) as-exists is sufficient alone
> "Enrolled in EVERY course" is a for-all (universal) requirement over all offered courses, specifically structured as an implication - for every courseId that IS an offered course, the student must be enrolled in it. This is the classic universal-quantification/division-style query pattern.
:::`,
    keyPoints: [
      "TRC is declarative (describes WHAT is wanted via a condition) vs relational algebra's procedural (describes HOW, step by step) - both are proven equally expressive (relationally complete).",
      "General TRC form: { t | condition(t) } - the set of tuples satisfying the condition.",
      "Existential (as-exists): true if at least one matching tuple exists. Universal (for-all): true only if every tuple satisfies it - 'for all Y' queries typically need an implication structure, not a bare for-all.",
      "Safety: an expression must be guaranteed to produce a finite, computable result - unbounded/infinite-result expressions (like 'every tuple not in R') are disallowed as unsafe.",
    ],
    analogies: [
      "Relational algebra is a recipe with numbered steps (do this, then this); tuple calculus is a description of the finished dish ('a dish that is spicy AND vegetarian') - both can specify the same dish, but one tells you HOW to make it, the other only WHAT it must satisfy.",
    ],
    commonMistakes: [
      "Writing a universal ('for all Y') query as a bare for-all without the necessary implication structure, accidentally requiring a match against every tuple in the unrestricted universe rather than just every tuple in the relevant relation.",
      "Writing an unsafe expression (like directly negating relation membership without any bounding condition) and not recognising why it's genuinely disallowed, not just stylistically discouraged.",
      "Confusing TRC's declarative nature with relational algebra's procedural nature when translating a query - mixing the two styles produces confused, incorrect expressions.",
    ],
    memoryTricks: [
      "\"Algebra: HOW (steps). Calculus: WHAT (a condition).\" The core distinction between the two query language styles.",
      "For all Y (in S), P(Y): almost always needs 'if Y is in S, THEN P(Y)' - not a bare for-all P(Y).",
    ],
    formulas: [
      "TRC general form: { t | condition(t) }.",
      "Universal-via-implication pattern: for-all y (y in-S implies P(y)) - the standard translation of 'for every Y in S, P holds'.",
    ],
    shortcuts: [
      "Whenever an English query says 'every' or 'all', immediately reach for the for-all-with-implication pattern rather than a bare universal quantifier - this single template resolves most universal-quantification translation questions correctly.",
      "To quickly spot an unsafe expression, check whether every variable's range is bounded by an actual relation in the database, or whether it could range over an unbounded/undefined universe of values.",
    ],
    pyqRelevance: `Tuple relational calculus questions are typically translation exercises (English to TRC, or TRC to English/relational algebra) specifically targeting universal quantification (division-style "every" queries) - a higher-difficulty, less frequent but still recurring GATE Databases topic.`,
    interviewConnection: `Tuple relational calculus is the theoretical ancestor of SQL's declarative style ("SELECT what you want", not "step through these operations") - understanding it explains why SQL queries describe desired results rather than explicit computation steps, even though the database engine internally executes something closer to relational algebra.`,
    revisionSummary: `TRC: declarative, { t | condition(t) } - describes WHAT is wanted, not HOW. Equally expressive as relational algebra (relationally complete).

Existential (as-exists): at least one match. Universal (for-all): every tuple matches - 'for all Y in S' needs an implication structure (Y in S implies P(Y)), not a bare for-all.

Safety: every expression must guarantee a finite, computable result - unbounded expressions are disallowed.`,
    shortNotes: {
      oneMinute: "TRC: declarative, {t | condition(t)} - WHAT not HOW. Equally expressive as relational algebra. Existential (as-exists): at least one match. Universal (for-all): every match - 'for all Y in S' needs implication (Y in S -> P(Y)), not bare for-all. Safety: every expression must guarantee a finite result.",
    },
    mcqs: [
      {
        question: "What is the primary difference between relational algebra and tuple relational calculus?",
        options: [
          "Algebra is declarative, calculus is procedural",
          "Algebra is procedural (step-by-step), calculus is declarative (condition-based)",
          "They have different expressive power",
          "Calculus cannot express joins",
        ],
        correctIndex: 1,
        explanation: "Relational algebra specifies a step-by-step procedure of operators; tuple calculus declaratively describes a condition every result tuple must satisfy. Both are proven equally expressive (relationally complete) despite this stylistic difference.",
      },
    ],
    numericals: [],
  },

  "sql": {
    difficulty: "Moderate",
    estimatedMinutes: 35,
    // Verified via YouTube oEmbed (2026-08-29) - real, publicly viewable.
    resources: [{
      kind: "video",
      title: "Lec-59: Introduction to Structured Query Language | All Points regarding its Features and Syllabus",
      url: "https://www.youtube.com/watch?v=323H_mOOWQ4",
      description: "Introduces SQL, covering its definition, history, and key features.",
    }],
    whatYoullLearn: [
      "The exact logical execution order of a SQL query's clauses - not the order they're written in",
      "GROUP BY and HAVING, and why HAVING exists separately from WHERE",
      "The three-valued logic (TRUE/FALSE/UNKNOWN) that comes from NULL, and how it changes filtering results",
      "Correlated vs non-correlated subqueries, and how each one actually executes",
    ],
    prerequisites: ["Relational Algebra"],
    concept: `## SQL's Logical Execution Order Is NOT Its Written Order

::: mistake
Assuming SQL clauses execute in the order they're WRITTEN (SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY). They do NOT. The actual LOGICAL execution order is: FROM (and JOINs) first, then WHERE, then GROUP BY, then HAVING, then SELECT, then ORDER BY last. This is exactly why WHERE cannot reference a column alias defined in SELECT (SELECT hasn't logically run yet when WHERE is evaluated), while ORDER BY CAN reference one (SELECT has already run by then).
:::

::: flow
1. FROM (+ JOINs) :: Build the base working set of rows from the named table(s), combined via any joins.
2. WHERE :: Filter individual ROWS, before any grouping happens.
3. GROUP BY :: Collapse the remaining rows into groups sharing the same grouping-column values.
4. HAVING :: Filter GROUPS (not individual rows) - this is exactly why HAVING can use aggregate functions (COUNT, SUM, AVG) directly, while WHERE cannot.
5. SELECT :: Compute the actual output columns/expressions, now that filtering and grouping are both done.
6. ORDER BY :: Sort the final result set, last of all.
:::

## WHERE vs HAVING: The Aggregate Distinction

::: remember
WHERE filters rows BEFORE grouping - it cannot reference an aggregate function, because aggregates don't exist yet at that stage. HAVING filters GROUPS after grouping - it's specifically FOR filtering based on aggregate conditions (like "only groups with COUNT(*) > 5"), which is exactly why HAVING exists as a separate clause instead of just extending WHERE.
:::

## NULL And Three-Valued Logic

::: cards
NULL in comparisons :: Any direct comparison involving NULL (x = NULL, x > NULL) evaluates to UNKNOWN, not TRUE or FALSE - this is why checking for NULL requires the special IS NULL / IS NOT NULL syntax, not = NULL.
WHERE's effective filter :: A row is included in the WHERE result only if its condition evaluates to TRUE - both FALSE and UNKNOWN rows are excluded, meaning a NULL-involving comparison silently drops that row rather than including it.
Aggregate functions and NULL :: Most aggregate functions (SUM, AVG, COUNT(column)) SKIP NULL values entirely rather than treating them as zero - except COUNT(*), which counts every row regardless of NULLs in any column.
:::

::: mistake
Writing \`WHERE column = NULL\` expecting it to match NULL rows. This ALWAYS evaluates to UNKNOWN (never TRUE), so it never matches anything - \`WHERE column IS NULL\` is the only correct syntax for this check.
:::

## Correlated Vs Non-Correlated Subqueries

::: cards
Non-correlated subquery :: Can be evaluated ONCE, independently, producing a fixed result used by the outer query - the subquery doesn't reference anything from the outer query's current row.
Correlated subquery :: References a column from the OUTER query, so it must be conceptually RE-EVALUATED for EACH row the outer query considers - generally more expensive, since it can't be computed just once upfront.
:::

::: checkpoint
In the query \`SELECT dept, COUNT(*) FROM employees GROUP BY dept HAVING COUNT(*) > 10\`, why is HAVING used here instead of WHERE?
- ( ) HAVING and WHERE are interchangeable in this query
- (x) The condition COUNT(*) > 10 is an aggregate condition on GROUPS, which WHERE cannot reference (aggregates don't exist until after GROUP BY runs)
- ( ) HAVING is required whenever GROUP BY is present, regardless of the condition
- ( ) WHERE would cause a syntax error for any query with GROUP BY
> COUNT(*) is an aggregate, computed only after grouping. WHERE executes BEFORE grouping (filtering individual rows), so it cannot reference an aggregate at all - HAVING exists specifically to filter on aggregate conditions computed AFTER grouping.
:::`,
    codeExample: {
      language: "sql",
      code: `-- Logical order: FROM -> WHERE -> GROUP BY -> HAVING -> SELECT -> ORDER BY
SELECT dept, COUNT(*) AS emp_count
FROM employees
WHERE salary > 30000              -- filters ROWS, before grouping
GROUP BY dept
HAVING COUNT(*) > 10              -- filters GROUPS, after grouping (aggregate allowed here)
ORDER BY emp_count DESC;          -- can reference the SELECT alias, since SELECT already ran

-- NULL comparison trap
SELECT * FROM employees WHERE manager_id = NULL;      -- WRONG: always UNKNOWN, matches nothing
SELECT * FROM employees WHERE manager_id IS NULL;      -- CORRECT`,
      expectedOutput: `(depends on data - illustrates clause order and the NULL comparison trap, not a fixed output)`,
    },
    keyPoints: [
      "SQL's LOGICAL execution order: FROM -> WHERE -> GROUP BY -> HAVING -> SELECT -> ORDER BY - not the written order.",
      "WHERE filters individual rows before grouping (no aggregates allowed). HAVING filters groups after grouping (aggregates allowed) - this is the entire reason HAVING exists separately.",
      "NULL comparisons (= NULL, > NULL) evaluate to UNKNOWN, never TRUE - use IS NULL/IS NOT NULL specifically to test for NULL.",
      "Most aggregates (SUM, AVG, COUNT(column)) skip NULLs; COUNT(*) counts every row regardless.",
      "Non-correlated subqueries evaluate once, independently. Correlated subqueries reference the outer query's current row and are conceptually re-evaluated per outer row.",
    ],
    analogies: [
      "SQL's logical order is like a factory assembly line where the WRITTEN recipe order (SELECT first on the page) doesn't match the ACTUAL build order (raw materials/FROM arrive first, get filtered/WHERE, grouped/GROUP BY, quality-checked as batches/HAVING, and only then packaged into the final labeled product/SELECT).",
    ],
    commonMistakes: [
      "Assuming SQL executes in written order (SELECT first) rather than logical order (FROM first) - this misunderstanding is the root cause of the WHERE-can't-use-aliases and WHERE-can't-use-aggregates rules.",
      "Writing `= NULL` instead of `IS NULL`, silently matching zero rows instead of the intended NULL rows.",
      "Using WHERE with an aggregate function directly, which is invalid - HAVING must be used instead for aggregate-based filtering.",
      "Treating a correlated subquery as if it could be evaluated once independently, missing that its result genuinely depends on each outer row.",
    ],
    memoryTricks: [
      "\"FROM, WHERE, GROUP, HAVING, SELECT, ORDER\" - the actual logical order, distinct from written order, worth memorising as its own sequence.",
      "WHERE filters ROWS before grouping (no aggregates). HAVING filters GROUPS after grouping (aggregates OK).",
    ],
    formulas: [],
    shortcuts: [
      "When a question asks whether a clause CAN reference something (an alias, an aggregate), mentally walk through the LOGICAL execution order first - whatever hasn't logically run yet isn't available.",
      "For any NULL-related question, immediately check whether the code uses `= NULL`/`!= NULL` (always wrong) versus `IS NULL`/`IS NOT NULL` (correct) - this is one of the most testable SQL details.",
    ],
    pyqRelevance: `SQL is one of the most heavily-weighted GATE Databases topics - query-writing, output-prediction for a given query and sample data, and the WHERE-vs-HAVING/logical-order/NULL-behaviour conceptual traps are all extremely frequent, high-value question types.`,
    interviewConnection: `SQL is a near-universal practical skill tested directly in interviews - understanding logical execution order explains real, common bugs (why an alias can't be used in WHERE, why filtering after an aggregate requires HAVING), and NULL's three-valued logic is a classic "gotcha" interview discussion topic.`,
    revisionSummary: `Logical order: FROM -> WHERE -> GROUP BY -> HAVING -> SELECT -> ORDER BY (not written order).

WHERE filters rows (no aggregates, before grouping). HAVING filters groups (aggregates OK, after grouping).

NULL comparisons are UNKNOWN, never TRUE - use IS NULL. Most aggregates skip NULLs except COUNT(*).

Non-correlated subqueries: evaluate once. Correlated subqueries: depend on the outer row, conceptually re-evaluated per row.`,
    shortNotes: {
      oneMinute: "Logical order: FROM->WHERE->GROUP BY->HAVING->SELECT->ORDER BY (not written order). WHERE: rows, no aggregates, pre-group. HAVING: groups, aggregates OK, post-group. NULL comparisons = UNKNOWN, use IS NULL. COUNT(*) counts NULLs; other aggregates skip them. Correlated subquery: depends on outer row (re-evaluated per row). Non-correlated: once.",
    },
    mcqs: [
      {
        question: "Why does `SELECT * FROM t WHERE x = NULL` never return any rows, even where x is actually NULL?",
        options: [
          "It's a syntax error",
          "NULL comparisons always evaluate to UNKNOWN, never TRUE, so no row satisfies the WHERE condition",
          "WHERE cannot be used with NULL values at all",
          "NULL is treated as 0 in comparisons",
        ],
        correctIndex: 1,
        explanation: "Any direct comparison involving NULL (including = NULL) evaluates to UNKNOWN in SQL's three-valued logic, never TRUE - WHERE only includes rows where the condition is TRUE, so such a comparison excludes every row, including ones where x actually is NULL.",
      },
      {
        question: "What is SQL's LOGICAL execution order (not written order) for a query with all major clauses?",
        options: [
          "SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY",
          "FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY",
          "FROM, SELECT, WHERE, GROUP BY, HAVING, ORDER BY",
          "WHERE, FROM, GROUP BY, SELECT, HAVING, ORDER BY",
        ],
        correctIndex: 1,
        explanation: "The logical execution order is FROM (build the working row set) -> WHERE (filter rows) -> GROUP BY (form groups) -> HAVING (filter groups) -> SELECT (compute output) -> ORDER BY (sort) - genuinely different from the order clauses are written in a query.",
      },
    ],
    numericals: [],
  },

  // ---------------- Constraints and Design ----------------

  "integrity-constraints": {
    difficulty: "Easy",
    estimatedMinutes: 20,
    // Verified via YouTube oEmbed (2026-08-29) - real, publicly viewable.
    resources: [{
      kind: "video",
      title: "Integrity Constraints in DBMS || Data Base Management Systems || DBMS || Relational Model",
      url: "https://www.youtube.com/watch?v=eK7gL-lGpjU",
      description: "Explains integrity constraints (domain, key, entity, referential) in the relational model.",
    }],
    whatYoullLearn: [
      "The specific constraint types: NOT NULL, UNIQUE, PRIMARY KEY, FOREIGN KEY, CHECK",
      "The referential integrity actions - what happens when a referenced row is deleted or updated",
      "Domain constraints vs key constraints vs referential constraints - three different concerns",
      "Why a foreign key constraint can itself block certain operations, not just validate data on insert",
    ],
    prerequisites: ["Relational Model"],
    concept: `## Constraints Enforce Rules The Data Must Never Violate

::: cards Constraint types
NOT NULL :: The column can never hold a NULL value.
UNIQUE :: No two rows may share the same value in this column (NULLs are typically still allowed, and don't count as duplicating each other).
PRIMARY KEY :: Combines NOT NULL and UNIQUE, plus designates this as the row's main identifier - exactly one primary key per table.
FOREIGN KEY :: The column's value must match an existing value in the referenced table's key (or be NULL, if the foreign key column itself allows it) - see Integrity Rules under Relational Model.
CHECK :: An arbitrary boolean condition every row must satisfy (e.g. CHECK (age >= 0)).
:::

## Referential Integrity Actions: What Happens On Delete/Update

::: story
When a row that's REFERENCED by a foreign key elsewhere is deleted or its key is updated, the database must decide what happens to the REFERENCING rows - this decision is specified explicitly per foreign key, not left to guesswork.
:::

::: cards
CASCADE :: The referencing rows are automatically deleted (or updated) too, following the change.
SET NULL :: The referencing rows' foreign key column is set to NULL instead of being deleted.
RESTRICT (or NO ACTION) :: The delete/update on the referenced row is REJECTED outright if any referencing rows still exist - the operation fails rather than silently breaking referential integrity.
:::

::: mistake
Assuming a foreign key constraint ONLY validates data on INSERT. It also actively RESTRICTS or triggers side effects on DELETE/UPDATE of the REFERENCED table, depending on the specified action (CASCADE/SET NULL/RESTRICT) - foreign keys are a two-directional guarantee, not a one-time insert-time check.
:::

## Three Different Kinds Of Constraint, Three Different Concerns

::: flow
Domain constraint :: Restricts what VALUES a single attribute can hold (its type, and any CHECK condition) - a purely local, single-column concern.
Key constraint :: Restricts UNIQUENESS within a single relation (PRIMARY KEY, UNIQUE, entity integrity's no-NULL-in-PK rule) - a within-table concern.
Referential integrity constraint :: Restricts how values in ONE relation must correspond to values in ANOTHER relation (FOREIGN KEY) - a cross-table, relationship-level concern.
:::

::: checkpoint
A foreign key in ORDERS references CUSTOMERS, with ON DELETE CASCADE specified. What happens if a customer with existing orders is deleted?
- ( ) The delete fails with an error
- (x) The customer's orders are automatically deleted too
- ( ) The orders' customer reference is set to NULL
- ( ) Nothing happens to the orders
> ON DELETE CASCADE means deleting the referenced CUSTOMERS row automatically deletes every ORDERS row that referenced it, propagating the deletion instead of rejecting it (RESTRICT) or nulling the reference (SET NULL).
:::`,
    keyPoints: [
      "NOT NULL, UNIQUE, PRIMARY KEY (NOT NULL + UNIQUE + designated identifier), FOREIGN KEY (references another table's key), CHECK (arbitrary boolean condition) - the standard constraint types.",
      "Referential actions on delete/update of a referenced row: CASCADE (propagate the change), SET NULL (null out the reference), RESTRICT/NO ACTION (reject the operation if references exist).",
      "Domain constraints (single-attribute values), key constraints (within-table uniqueness), and referential integrity constraints (cross-table correspondence) are three genuinely different concerns.",
      "A foreign key constraint is enforced on DELETE/UPDATE of the referenced table too, not just on INSERT of the referencing table.",
    ],
    analogies: [
      "Integrity constraints are like a building's safety codes: NOT NULL is 'every room must have a door' (nothing missing), UNIQUE is 'no two rooms share the exact same room number', and a foreign key with CASCADE delete is like 'if this load-bearing wall is removed, every room depending on it goes too' rather than leaving them structurally orphaned.",
    ],
    commonMistakes: [
      "Assuming a foreign key only matters when INSERTING a new referencing row, forgetting it also governs what happens when the REFERENCED row is deleted or updated.",
      "Confusing UNIQUE with PRIMARY KEY - PRIMARY KEY additionally forbids NULL and is limited to one per table; a table can have multiple UNIQUE constraints, and UNIQUE columns can typically still allow NULL.",
      "Not distinguishing RESTRICT (blocks the operation) from SET NULL (allows it, but nulls the reference) - these produce very different outcomes for the same delete attempt.",
    ],
    memoryTricks: [
      "\"Primary key = NOT NULL + UNIQUE + THE chosen identifier.\" It's not a separate rule, it's a combination of two others plus a designation.",
      "CASCADE follows along, SET NULL disconnects gently, RESTRICT refuses outright - three different reactions to the same referenced-row deletion.",
    ],
    formulas: [],
    shortcuts: [
      "For a referential-action question, identify the specified action (CASCADE/SET NULL/RESTRICT) FIRST - it fully determines the outcome, with no need for further reasoning about the specific data involved.",
      "To classify a constraint quickly, ask: does it restrict ONE column's values (domain), UNIQUENESS within one table (key), or a relationship ACROSS two tables (referential)?",
    ],
    pyqRelevance: `Integrity constraint questions typically describe a scenario (a delete/update on a referenced table) and ask for the outcome under a specified referential action - a reliable, moderate-frequency conceptual GATE question type, often paired with SQL DDL syntax recognition.`,
    interviewConnection: `Choosing the correct ON DELETE/ON UPDATE behaviour (CASCADE vs RESTRICT vs SET NULL) is a real, consequential schema-design decision in production databases - a common database-design interview discussion, since the wrong choice can silently cascade-delete data that should have been protected.`,
    revisionSummary: `NOT NULL, UNIQUE, PRIMARY KEY (=NOT NULL+UNIQUE+identifier), FOREIGN KEY, CHECK - the standard constraint types.

Referential actions on a referenced row's delete/update: CASCADE (propagate), SET NULL (null the reference), RESTRICT (reject the operation).

Domain (single attribute), key (within-table uniqueness), referential (cross-table) - three distinct constraint concerns.`,
    shortNotes: {
      oneMinute: "NOT NULL/UNIQUE/PRIMARY KEY(=NOT NULL+UNIQUE+ID)/FOREIGN KEY/CHECK. Referential actions on referenced-row delete/update: CASCADE (propagate), SET NULL (null it), RESTRICT (reject). Domain (1 attribute) / key (within-table) / referential (cross-table) - 3 distinct concerns. FK matters on delete/update of REFERENCED table too, not just insert.",
    },
    mcqs: [
      {
        question: "A foreign key specifies ON DELETE RESTRICT. What happens when someone tries to delete a referenced row that still has referencing rows?",
        options: ["The referencing rows are deleted too", "The referencing rows' foreign key is set to NULL", "The delete operation is rejected", "Nothing - the delete silently succeeds"],
        correctIndex: 2,
        explanation: "RESTRICT (or NO ACTION) rejects the delete/update operation outright if any referencing rows still exist, rather than propagating the change or nulling references.",
      },
    ],
    numericals: [],
  },

  "functional-dependencies-and-normal-forms": {
    difficulty: "Hard",
    estimatedMinutes: 35,
    // Verified via YouTube oEmbed (2026-08-29) - real, publicly viewable.
    resources: [{
      kind: "video",
      title: "Lec-33: All Normal Forms with Real life examples | 1NF 2NF 3NF BCNF 4NF 5NF | All in One",
      url: "https://www.youtube.com/watch?v=EGEwkad_llA",
      description: "Covers all normal forms from 1NF through BCNF/5NF with real-life examples.",
    }],
    whatYoullLearn: [
      "What a functional dependency actually asserts, precisely",
      "Armstrong's axioms, and computing an attribute set's closure",
      "The normal forms (1NF through BCNF) and the SPECIFIC anomaly each one eliminates",
      "Why BCNF is stricter than 3NF, and the exact case where they diverge",
    ],
    prerequisites: ["Relational Model"],
    concept: `## What A Functional Dependency Actually Claims

::: remember
X -> Y (X functionally determines Y) means: for ANY two tuples that agree on X's values, they MUST also agree on Y's values. It's a constraint about the DATA's structure, not about any specific current instance - a well-designed FD should hold for every possible valid instance of the relation, not just happen to be true of the current rows.
:::

## Armstrong's Axioms And Closure

::: cards The three inference rules
Reflexivity :: If Y is a subset of X, then X -> Y (trivially true).
Augmentation :: If X -> Y, then XZ -> YZ for any Z (adding the same attributes to both sides preserves the dependency).
Transitivity :: If X -> Y and Y -> Z, then X -> Z.
:::

::: remember
The CLOSURE of an attribute set X (written X+) is the set of ALL attributes functionally determined by X, computed by repeatedly applying the axioms (or more practically, repeatedly checking which FDs' left sides are already covered by what's accumulated) until no more attributes can be added. X is a superkey exactly when X+ includes EVERY attribute of the relation.
:::

## Normal Forms: Each One Eliminates A Specific Anomaly

::: cards
1NF (First Normal Form) :: Every attribute holds only ATOMIC (indivisible) values - no repeating groups or multi-valued attributes in a single cell.
2NF :: 1NF, PLUS no PARTIAL dependency of a non-key attribute on only PART of a composite candidate key (only relevant when the key has more than one attribute).
3NF :: 2NF, PLUS no TRANSITIVE dependency of a non-key attribute on another non-key attribute (a non-key attribute depending on another non-key attribute, rather than directly on a key).
BCNF (Boyce-Codd Normal Form) :: For EVERY nontrivial functional dependency X -> Y in the relation, X must be a SUPERKEY - stricter than 3NF, with no exception carved out.
:::

::: mistake
Assuming 3NF and BCNF are basically the same thing. They diverge in one SPECIFIC case: a relation can be in 3NF but NOT BCNF when it has multiple overlapping CANDIDATE keys, and a non-superkey determines part of another candidate key (a case 3NF's exact definition specifically carves out an exception for, but BCNF does not).
:::

## Why Higher Normal Forms Matter: Eliminating Anomalies

::: flow
Update anomaly :: The same fact is stored redundantly in multiple rows - updating it in one place but not others leaves the data inconsistent.
Insertion anomaly :: Some genuinely valid fact CANNOT be recorded without also having unrelated (and possibly unavailable) other data present, due to a poorly normalized structure.
Deletion anomaly :: Deleting one fact ACCIDENTALLY destroys another, unrelated fact that happened to be stored in the same row.
Normalization's role :: Progressively higher normal forms (2NF, 3NF, BCNF) systematically eliminate these anomalies by removing partial and transitive dependencies, at the cost of splitting one relation into several smaller ones (requiring joins to reconstruct the full picture).
:::

::: checkpoint
A relation R(A, B, C) has functional dependencies A -> B and B -> C. Is R in 3NF?
- ( ) Yes, always
- (x) No - C is transitively dependent on A (through B), and B (a non-key attribute, since A alone is the key here) determines C
- ( ) Cannot be determined without more information
- ( ) R is not even in 1NF
> With A -> B and B -> C, A is the key (A determines everything transitively). But C depends on A only THROUGH B - a transitive dependency of non-key attribute C on non-key attribute B. This is exactly the anomaly 3NF forbids, so R is NOT in 3NF as given (it would need to be decomposed into R1(A,B) and R2(B,C)).
:::`,
    keyPoints: [
      "X -> Y (functional dependency): any two tuples agreeing on X must agree on Y - a structural constraint on the relation, not a fact about the current rows only.",
      "Armstrong's axioms: reflexivity, augmentation, transitivity - used to compute closure X+ (every attribute X determines). X is a superkey iff X+ includes all attributes.",
      "1NF: atomic values only. 2NF: 1NF + no partial dependency on part of a composite key. 3NF: 2NF + no transitive dependency between non-key attributes. BCNF: every determinant of a nontrivial FD must be a superkey (stricter than 3NF, no exception).",
      "3NF and BCNF diverge specifically when overlapping candidate keys exist and a non-superkey determines part of another candidate key - 3NF carves out an exception here that BCNF does not.",
      "Normalization eliminates update, insertion, and deletion anomalies by removing partial/transitive dependencies, at the cost of needing joins to reconstruct the full picture.",
    ],
    analogies: [
      "A transitive dependency (A determines B, B determines C, so C indirectly depends on A) is like a rumour chain: if the ORIGINAL fact (A) changes, everything downstream (B, then C) should logically update too, but a poorly normalized table can let C get out of sync since it's not stored as directly tied to A.",
    ],
    commonMistakes: [
      "Treating 3NF and BCNF as equivalent - they diverge in the specific overlapping-candidate-keys case, which is exactly what GATE tests to distinguish students who've memorised definitions from those who understand them.",
      "Computing an attribute set's closure incorrectly by not iterating to a fixed point - stopping the closure computation too early misses transitively-determined attributes.",
      "Confusing partial dependency (2NF's concern, requires a composite key) with transitive dependency (3NF's concern, applies regardless of key composition).",
    ],
    memoryTricks: [
      "\"1NF: atomic. 2NF: no partial (on PART of a composite key). 3NF: no transitive (non-key -> non-key). BCNF: every determinant is a superkey, no exceptions.\" Each level adds one more restriction.",
      "3NF has an 'exception clause' BCNF doesn't - that exception is exactly where the two normal forms can disagree.",
    ],
    formulas: [
      "Armstrong's axioms: reflexivity (Y subset X => X->Y), augmentation (X->Y => XZ->YZ), transitivity (X->Y, Y->Z => X->Z).",
      "X is a superkey iff X+ (closure of X) includes every attribute of the relation.",
    ],
    shortcuts: [
      "To check if a relation is in BCNF quickly, list every nontrivial FD and verify EACH one's left-hand side is a superkey - a single counterexample FD is enough to disqualify BCNF.",
      "For a closure computation, repeatedly scan the FD list for any dependency whose left side is now fully contained in your accumulated set, adding its right side - repeat until a full pass adds nothing new.",
    ],
    pyqRelevance: `Functional dependencies and normal forms are one of the heaviest-weighted GATE Databases topics - closure computation, identifying the highest normal form a given relation satisfies, and specifically distinguishing 3NF from BCNF are all extremely frequent, high-value question types.`,
    interviewConnection: `Normalization principles directly inform real database schema design decisions, and understanding WHY a design might be denormalized on purpose (for read performance, accepting some redundancy) versus when it's an actual bug is a standard database-design interview discussion.`,
    revisionSummary: `X -> Y: any two tuples agreeing on X agree on Y. Armstrong's axioms (reflexivity, augmentation, transitivity) compute closure X+; X is a superkey iff X+ = all attributes.

1NF: atomic values. 2NF: +no partial dependency (composite key). 3NF: +no transitive dependency. BCNF: every determinant is a superkey, stricter than 3NF (they diverge with overlapping candidate keys).

Normalization eliminates update/insertion/deletion anomalies, at the cost of needing joins to reconstruct data.`,
    shortNotes: {
      oneMinute: "X->Y: tuples agreeing on X agree on Y. Armstrong's axioms compute closure X+; superkey iff X+=all attributes. 1NF: atomic. 2NF: no partial dependency (composite key). 3NF: no transitive dependency. BCNF: every determinant is a superkey (stricter, no exception - diverges from 3NF with overlapping candidate keys). Normalization removes update/insert/delete anomalies.",
    },
    mcqs: [
      {
        question: "A relation R(A,B,C,D) has FD A->B and BC->D, with candidate key AC. Is A->B a violation of BCNF?",
        options: ["No, because A is part of the candidate key AC", "Yes, because A alone is not a superkey (AC is the key, not A alone)", "No, BCNF doesn't apply to this FD", "Cannot be determined"],
        correctIndex: 1,
        explanation: "BCNF requires every nontrivial FD's left side to be a SUPERKEY. Here A alone determines B, but A alone is not a superkey (the actual key is AC) - this violates BCNF, even though A is PART of the key.",
      },
    ],
    numericals: [],
  },

  // ---------------- File Organization and Indexing ----------------

  "file-organization": {
    difficulty: "Moderate",
    estimatedMinutes: 25,
    // Verified via YouTube oEmbed (2026-08-29) - real, publicly viewable.
    resources: [{
      kind: "video",
      title: "What is file organization in DBMS? | What is a sequential file organization? | What is a heap file?",
      url: "https://www.youtube.com/watch?v=sDowwwdSuJo",
      description: "Explains core file organization techniques in DBMS, including sequential and heap file organization.",
    }],
    whatYoullLearn: [
      "Heap, sequential, and hash file organizations, and the operation each is optimized for",
      "Why sequential file organization needs periodic reorganization, and what that costs",
      "Clustering vs non-clustering as it relates to physical file organization",
      "Choosing the right file organization for a given access pattern",
    ],
    prerequisites: ["Relational Model", "Hashing"],
    concept: `## Three Ways To Physically Lay Out A File's Records

::: cards
Heap (unordered) file :: Records stored in NO particular order, typically wherever there's free space. Insertion is O(1) (just append) - the fastest possible insert. Search is O(n) (must scan every record, no shortcut) - the slowest possible search.
Sequential file :: Records stored in SORTED order by some key. Search can use binary search - O(log n). But insertion is expensive: maintaining sort order requires shifting records (or using overflow areas that need periodic reorganization).
Hash file :: Records placed by applying a hash function to a key (directly connecting to Hashing) - average O(1) for both search and insertion on the hash key, but no ordering support at all (can't efficiently answer range queries or "give me sorted output").
:::

::: mistake
Choosing a sequential file organization for a workload with FREQUENT insertions, without accounting for the real cost of maintaining sort order - either records must be shifted (expensive) or an overflow area is used (which itself needs periodic REORGANIZATION to merge back into sorted order, an expensive batch operation).
:::

## Reorganization: The Cost Sequential Files Eventually Pay

::: remember
A sequential file using an overflow area for new inserts gradually DEGRADES - more and more records live in the overflow chain rather than their properly sorted position, and binary search's O(log n) guarantee erodes as more lookups have to fall through to a linear overflow scan. REORGANIZATION periodically rebuilds the file back into a clean, fully sorted state, restoring the O(log n) guarantee - a maintenance cost sequential files must budget for.
:::

## Choosing By Access Pattern

::: flow
Mostly writes, rarely searched, order doesn't matter :: Heap file - O(1) insert dominates the decision.
Frequent range queries or need for sorted output :: Sequential file - the O(log n) search and natural ordering justify the higher insertion cost.
Frequent exact-match lookups by a specific key, no range queries needed :: Hash file - O(1) average lookup, at the cost of zero ordering support.
:::

::: checkpoint
A file organization needs to efficiently answer "find all records with salary between 50000 and 70000" (a range query). Which organization is best suited?
- ( ) Heap file
- (x) Sequential file (sorted by salary)
- ( ) Hash file
- ( ) All three are equally suited
> A sequential file sorted by salary lets a range query jump to the starting value (via binary search) and then scan CONSECUTIVE records until the range's end - hash files scatter records by hash value with no relationship to actual value order, making range queries require a full scan instead.
:::`,
    keyPoints: [
      "Heap file: O(1) insert (append), O(n) search (full scan) - best when writes dominate and order doesn't matter.",
      "Sequential file: O(log n) search (binary search, sorted), expensive insert (shifting or overflow area) - best for range queries and sorted output needs.",
      "Hash file: average O(1) search/insert on the hash key, no ordering support at all - best for frequent exact-match lookups with no range-query needs.",
      "Sequential files using an overflow area degrade over time and require periodic reorganization to restore the O(log n) search guarantee.",
    ],
    analogies: [
      "A heap file is a junk drawer (instant to toss something in, slow to find anything specific); a sequential file is a labelled, alphabetized filing cabinet (fast to find things AND to browse a range, but re-alphabetizing after every insertion is costly); a hash file is a coat-check system (instant to retrieve a specific item by its exact ticket number, but useless for 'give me every coat checked in alphabetical order').",
    ],
    commonMistakes: [
      "Choosing sequential file organization for an insert-heavy workload without budgeting for the reorganization cost that overflow-area degradation eventually requires.",
      "Choosing a hash file organization when range queries are actually needed - hashing scatters values with no relationship to their order, making it fundamentally unsuited to range queries.",
      "Assuming heap file search is anything better than O(n) - with no ordering or hashing structure at all, a full scan is genuinely required for any non-trivial search.",
    ],
    memoryTricks: [
      "\"Heap: fast in, slow to find. Sequential: fast to find (and range), slower to insert. Hash: fast exact match, no ranges at all.\" Three organizations, three different trade-offs.",
      "Range query needs order - only sequential (sorted) organization naturally supports it; hashing scatters, destroying any usable order.",
    ],
    formulas: [
      "Heap: O(1) insert, O(n) search. Sequential: O(log n) search (sorted, via binary search), expensive insert. Hash: average O(1) search/insert, no range-query support.",
    ],
    shortcuts: [
      "For a file-organization choice question, identify the DOMINANT operation first (frequent inserts? range queries? exact lookups?) - that single answer usually determines the correct choice directly.",
      "If a question mentions 'range query' or 'sorted output' anywhere, that's a strong signal toward sequential file organization (or an index built on top of one) over hashing.",
    ],
    pyqRelevance: `File organization questions typically ask to choose or evaluate the right organization for a described access pattern, or to compute search/insert complexity for a given organization - a moderate-frequency, foundational GATE Databases topic that sets up the Indexing topic directly following it.`,
    interviewConnection: `Choosing between hash indexes and sorted (B-tree-style) indexes in a real database is directly informed by exactly this trade-off - range queries need sorted structures, exact-match-only lookups can exploit hashing's O(1) average case, a common database-design interview discussion.`,
    revisionSummary: `Heap: O(1) insert, O(n) search - write-heavy, order-agnostic workloads.

Sequential: O(log n) search (sorted), expensive insert, needs periodic reorganization - range queries, sorted output.

Hash: average O(1) search/insert, no ordering - frequent exact-match lookups only, no range query support.`,
    shortNotes: {
      oneMinute: "Heap: O(1) insert, O(n) search - write-heavy. Sequential: O(log n) search (sorted), expensive insert, needs periodic reorganization - range queries. Hash: avg O(1) search/insert, no ordering - exact-match only, no ranges.",
    },
    mcqs: [
      {
        question: "Which file organization has the fastest average insertion time?",
        options: ["Sequential", "Heap (unordered)", "Hash", "All are equally fast"],
        correctIndex: 1,
        explanation: "A heap (unordered) file simply appends a new record wherever there's free space, with no ordering to maintain - O(1) insertion, the fastest of the three organizations.",
      },
    ],
    numericals: [],
  },

  "indexing-b-trees": {
    difficulty: "Hard",
    estimatedMinutes: 35,
    // Verified via YouTube oEmbed (2026-08-29) - real, publicly viewable.
    resources: [{
      kind: "video",
      title: "Lec-114: Introduction to B-Tree and its Structure | Block Pointer, Record Pointer, Key",
      url: "https://www.youtube.com/watch?v=KcApkM5WYGw",
      description: "Introduces B-Tree indexing structure, including block and record pointers.",
    }],
    whatYoullLearn: [
      "Primary vs secondary indexes, and dense vs sparse indexes - four independent classification axes",
      "Why B+ trees specifically (not plain B-trees) are the standard database index structure",
      "B+ tree search/insert/delete complexity, and how tree order relates to node fan-out",
      "Multilevel indexing, and why it's what makes very large indexes still fast to search",
    ],
    prerequisites: ["File Organization", "Binary Search Trees"],
    concept: `## Indexes: A Shortcut Structure Built On Top Of The Data

::: story
An index is a SEPARATE, smaller structure that maps key values to the LOCATION of the actual data record - searching the (much smaller) index first, then jumping directly to the record, is dramatically faster than scanning the full data file.
:::

::: cards Two independent classification axes
Primary index :: Built on the field the data file is actually SORTED BY (the search key matches the file's physical ordering).
Secondary index :: Built on a field the data file is NOT sorted by - an additional lookup structure independent of physical order.
Dense index :: Has ONE index entry for EVERY record in the data file.
Sparse index :: Has an index entry for only SOME records (e.g. one per data block/page) - relies on the data being sorted, so the searched-for record can be found by scanning forward a short distance from the nearest sparse entry.
:::

::: mistake
Assuming a sparse index can be built on data that ISN'T sorted by the index key. Sparse indexing specifically relies on being able to scan forward from the nearest indexed entry to find the target - this only works if the underlying data is physically sorted by that key, exactly the primary-index case.
:::

## Why B+ Trees, Specifically

::: remember
A B+ tree keeps ALL actual data pointers in its LEAF nodes only - internal nodes hold ONLY keys, used purely for navigation. This is the key difference from a plain B-tree (which stores data pointers at internal nodes too), and it buys two things: internal nodes can pack in MORE keys (since they carry no data pointers, increasing fan-out and reducing tree height), and every leaf is typically LINKED to the next, making sequential/range scans fast without re-traversing from the root each time.
:::

::: cards B+ tree properties
High fan-out :: Each internal node can have MANY children (order n means up to n children) - this keeps the tree extremely SHALLOW even for millions of records, unlike a binary tree.
Balanced, always :: Every leaf is at the SAME depth - search, insert, and delete are all O(log_n N) where n is the (large) fan-out, genuinely different from a binary tree's O(log_2 N).
Leaf-linked :: Leaves are chained together, so a RANGE query finds the starting point via the tree, then just walks the leaf chain forward - no repeated root-to-leaf traversals needed.
:::

## Multilevel Indexing: The Same Idea, Recursively

::: flow
Problem :: Even a sparse first-level index can become too large to fit comfortably in memory, once the data file itself is huge.
Solution :: Build a SECOND-level (sparse) index ON TOP of the first-level index itself - and repeat as many levels as needed. This is exactly what a B+ tree's internal-node structure already IS: a recursively-applied multilevel index, which is why B+ trees stay efficient even for enormous files.
:::

::: checkpoint
Why do B+ trees typically outperform plain binary search trees as a database index structure for very large datasets?
- ( ) B+ trees use less total storage
- (x) B+ trees have much higher fan-out per node, keeping the tree far SHALLOWER (fewer disk-block reads needed to reach a leaf) for the same number of records
- ( ) B+ trees don't require balancing
- ( ) B+ trees only work for in-memory data
> A B+ tree's high fan-out (many children per internal node) keeps its height dramatically smaller than a binary tree's for the same record count - and since each tree level typically means one disk-block read, a shallower tree directly means far fewer expensive disk accesses per search, which is the actual bottleneck for a database index.
:::`,
    keyPoints: [
      "Primary index: on the file's actual sort key. Secondary index: on a different field. Dense index: one entry per record. Sparse index: one entry per block (requires sorted data).",
      "B+ tree: data pointers ONLY in leaf nodes, internal nodes hold keys for navigation only - higher fan-out (shallower tree) and leaf-linking (fast range scans) versus a plain B-tree.",
      "B+ tree operations: O(log_n N) for search/insert/delete, where n is the (large) fan-out - genuinely shallower than a binary tree's O(log_2 N) for the same N.",
      "Multilevel indexing recursively builds a sparse index on top of a sparse index, exactly what a B+ tree's internal structure already implements - this is what keeps very large indexes searchable efficiently.",
    ],
    analogies: [
      "A B+ tree index is like a library's card catalog system with wide, shallow shelving (many entries per shelf/node, so few shelves to check overall) instead of a tall, narrow one-book-per-shelf tower - fewer trips (disk reads) needed to reach the actual book (leaf/data record).",
    ],
    commonMistakes: [
      "Building (or assuming) a sparse index on data that isn't sorted by the indexed key - sparse indexing structurally depends on being able to scan forward from the nearest entry.",
      "Confusing a plain B-tree with a B+ tree - forgetting that B+ trees keep ALL data pointers in leaves only, which is exactly what gives them their high fan-out and fast range-scan advantages.",
      "Assuming binary search trees are just as good as B+ trees for on-disk database indexes, ignoring that disk-block reads (not raw comparisons) are the actual cost being minimized, which B+ trees' shallow height directly addresses.",
    ],
    memoryTricks: [
      "\"B+ tree: data lives ONLY at the leaves, leaves are LINKED.\" The two facts that explain everything else about why it's the standard index structure.",
      "High fan-out = shallow tree = fewer disk reads. This chain of reasoning is the entire justification for B+ trees over binary search trees as database indexes.",
    ],
    formulas: [
      "B+ tree search/insert/delete: O(log_n N), n = tree order (fan-out), N = number of records.",
    ],
    shortcuts: [
      "For a dense-vs-sparse index question, check whether the underlying data file is sorted by the index key - sparse indexing is only valid in that case; otherwise dense is the only option.",
      "For a B+ tree height/fan-out numerical, work directly from the given order (max children per node) rather than trying to reason about it as a generic binary tree - the whole point is that it ISN'T binary.",
    ],
    pyqRelevance: `Indexing questions cover B+ tree height/order numericals (given N records and a specified fan-out, compute the tree's height or the number of index entries), and conceptual dense/sparse and primary/secondary classification - both are frequent, moderate-to-high-difficulty GATE Databases questions.`,
    interviewConnection: `B+ trees are literally what most production relational databases use for their default index structure (and often their primary storage structure too) - understanding why (disk-block-read minimization via high fan-out) is foundational background for any database performance or indexing-strategy interview discussion.`,
    revisionSummary: `Primary index: on the file's sort key. Secondary: on another field. Dense: one entry per record. Sparse: one entry per block (needs sorted data).

B+ tree: data pointers only in leaves, high fan-out (shallow tree), leaves linked (fast range scans). O(log_n N) operations, n = large fan-out.

Multilevel indexing = a sparse index built on a sparse index, recursively - exactly what a B+ tree's internal structure is.`,
    shortNotes: {
      oneMinute: "Primary index: on sort key. Secondary: on other field. Dense: 1 entry/record. Sparse: 1 entry/block (needs sorted data). B+ tree: data ONLY at leaves, high fan-out (shallow), leaves LINKED (fast range scans). O(log_n N), n=large fan-out. Multilevel index = sparse index on a sparse index, recursively.",
    },
    mcqs: [
      {
        question: "What is the key structural difference between a B+ tree and a plain B-tree used as a database index?",
        options: [
          "B+ trees are not balanced",
          "B+ trees store data pointers only in leaf nodes; internal nodes hold only navigation keys",
          "B+ trees use binary (2-way) branching only",
          "There is no real difference",
        ],
        correctIndex: 1,
        explanation: "A B+ tree keeps all actual data pointers in its leaf nodes, with internal nodes holding only keys for navigation - this increases fan-out (shallower tree) and enables fast leaf-to-leaf range scans, distinguishing it from a plain B-tree.",
      },
    ],
    numericals: [],
  },

  // ---------------- Transactions and Concurrency Control ----------------

  "transactions": {
    difficulty: "Moderate",
    estimatedMinutes: 30,
    // Verified via YouTube oEmbed (2026-08-29) - real, publicly viewable.
    resources: [{
      kind: "video",
      title: "Lec-88: ACID Properties of a Transaction | Database Management System",
      url: "https://www.youtube.com/watch?v=-GS0OxFJsYQ",
      description: "Explains the ACID (Atomicity, Consistency, Isolation, Durability) properties of transactions.",
    }],
    whatYoullLearn: [
      "The ACID properties, and precisely what each one guarantees",
      "Transaction states and the exact transitions between them",
      "Schedules, and what makes one 'serializable' - the gold-standard correctness criterion",
      "Conflict serializability specifically, and how to check it using a precedence graph",
    ],
    prerequisites: ["SQL"],
    concept: `## ACID: Four Independent Guarantees

::: cards
Atomicity :: A transaction happens ENTIRELY or NOT AT ALL - no partial execution is ever left visible. If any part fails, everything already done is rolled back.
Consistency :: A transaction takes the database from one VALID state to another VALID state, preserving all declared integrity constraints.
Isolation :: Concurrently executing transactions appear to execute as if they ran ONE AT A TIME (serially), even though they may actually be interleaved for performance.
Durability :: Once a transaction COMMITS, its changes survive permanently, even a subsequent system crash.
:::

::: mistake
Confusing atomicity with isolation. Atomicity is about a SINGLE transaction's own internal all-or-nothing completeness; isolation is about how MULTIPLE CONCURRENT transactions appear not to interfere with each other - genuinely different guarantees, both needed together.
:::

## Transaction States

::: flow
Active :: The transaction is currently executing its operations.
Partially committed :: The final operation has executed, but changes aren't yet permanently saved to disk.
Committed :: Changes are permanently saved - durability now guaranteed.
Failed :: Something went wrong; normal execution cannot continue.
Aborted :: The transaction has been rolled back, undoing any partial changes, restoring the pre-transaction state.
:::

## Schedules And Serializability

::: story
A SCHEDULE is the actual interleaved order in which multiple transactions' individual operations execute. A schedule is SERIALIZABLE if its effect is EQUIVALENT to some serial (one-at-a-time, no interleaving) execution of the same transactions - this is the gold-standard correctness criterion, since a serial schedule is trivially correct (no interference possible), and serializability says an interleaved schedule is JUST AS SAFE.
:::

## Conflict Serializability: A Checkable Criterion

::: remember
Two operations CONFLICT if they're from DIFFERENT transactions, access the SAME data item, and at least one of them is a WRITE. A schedule is CONFLICT SERIALIZABLE if its conflicting operations can be reordered (via swaps of adjacent, non-conflicting operations) into some serial schedule - checked concretely via the PRECEDENCE GRAPH: draw an edge Ti -> Tj whenever Ti has an operation that conflicts with, and comes before, one of Tj's operations. The schedule is conflict serializable EXACTLY WHEN this graph has NO CYCLE.
:::

::: checkpoint
A precedence graph for schedule S has edges T1 -> T2, T2 -> T3, and T3 -> T1. Is S conflict serializable?
- (x) No - the graph contains a cycle (T1 -> T2 -> T3 -> T1), so S is NOT conflict serializable
- ( ) Yes, as long as all edges are shown
- ( ) Cannot be determined from the graph alone
- ( ) Yes, cycles don't affect serializability
> Conflict serializability corresponds EXACTLY to the precedence graph being acyclic. Here T1->T2->T3->T1 forms a cycle, meaning there's no way to linearly order these transactions consistent with every conflict - the schedule is NOT conflict serializable.
:::`,
    keyPoints: [
      "ACID: Atomicity (all-or-nothing), Consistency (valid state to valid state), Isolation (concurrent transactions appear serial), Durability (committed changes survive crashes) - four independent guarantees.",
      "Transaction states: active -> partially committed -> committed (success path), or active -> failed -> aborted (failure path).",
      "A schedule is serializable if equivalent to some serial execution - the gold-standard correctness criterion for concurrent execution.",
      "Two operations conflict if from different transactions, on the same data item, with at least one write. Conflict serializability is checked via the precedence graph: acyclic means conflict serializable, a cycle means it's not.",
    ],
    analogies: [
      "ACID is like a bank wire transfer's four separate promises: it either fully completes or fully doesn't happen (atomicity), it never leaves an account in an impossible negative-then-fixed state visible to anyone (consistency), two simultaneous transfers don't scramble into each other's steps (isolation), and once confirmed, it's not undone by a power outage (durability) - four separate promises, not one combined guarantee.",
    ],
    commonMistakes: [
      "Confusing atomicity (one transaction, all-or-nothing) with isolation (multiple transactions, no interference) - these are separate ACID letters for a reason.",
      "Checking serializability by trying to reason informally about 'does this look okay' instead of building the actual precedence graph and checking for cycles.",
      "Forgetting that a conflict specifically requires at least one WRITE - two reads of the same data item from different transactions never conflict with each other.",
    ],
    memoryTricks: [
      "\"A-C-I-D: all-or-nothing, valid-to-valid, isolated-like-serial, durable-after-commit.\" One short phrase per letter.",
      "Precedence graph acyclic = conflict serializable. Cycle = not. The entire checking procedure in one fact.",
    ],
    formulas: [
      "Conflict: two operations from different transactions, same data item, at least one is a write.",
      "Conflict serializable iff the precedence graph (edge Ti->Tj for each conflict where Ti's operation precedes Tj's) is ACYCLIC.",
    ],
    shortcuts: [
      "For a serializability question, build the precedence graph systematically (list every conflicting operation pair first, THEN draw edges) rather than trying to spot cycles by inspection alone - systematic construction avoids missing a conflict.",
      "To quickly check if two operations conflict, ask three questions: different transactions? same data item? at least one write? All three must be yes.",
    ],
    pyqRelevance: `ACID property identification and conflict-serializability checking (build the precedence graph, determine if a given schedule is serializable) are extremely frequent, high-value GATE Databases questions - the precedence graph technique specifically is tested almost every year.`,
    interviewConnection: `ACID properties are fundamental vocabulary for any database or distributed-systems interview discussion, and understanding conflict serializability is foundational background for why databases use locking or optimistic concurrency control protocols at all - directly leading into the Concurrency Control topic next.`,
    revisionSummary: `ACID: Atomicity (all-or-nothing), Consistency (valid states), Isolation (concurrent = serial-appearing), Durability (committed survives crashes).

States: active -> partially committed -> committed, or active -> failed -> aborted.

Serializable schedule: equivalent to some serial execution. Conflict serializability: checked via the precedence graph (edge per conflicting, ordered operation pair) - acyclic means serializable.`,
    shortNotes: {
      oneMinute: "ACID: Atomicity(all-or-nothing)/Consistency(valid states)/Isolation(concurrent=serial-appearing)/Durability(survives crashes). States: active->partially committed->committed, or active->failed->aborted. Serializable = equivalent to a serial execution. Conflict: diff transactions, same item, >=1 write. Precedence graph acyclic = conflict serializable; cycle = not.",
    },
    mcqs: [
      {
        question: "Which ACID property specifically guarantees that concurrently executing transactions don't interfere with each other's intermediate states?",
        options: ["Atomicity", "Consistency", "Isolation", "Durability"],
        correctIndex: 2,
        explanation: "Isolation specifically guarantees that concurrent transactions appear to execute as if run one at a time (serially), regardless of actual interleaving - atomicity is about one transaction's own all-or-nothing completeness, a different concern.",
      },
    ],
    numericals: [],
  },

  "concurrency-control": {
    difficulty: "Hard",
    estimatedMinutes: 35,
    // Verified via YouTube oEmbed (2026-08-29) - real, publicly viewable.
    resources: [{
      kind: "video",
      title: "Lec-102: 2 Phase Locking(2PL) Protocol in Transaction Concurrency Control | DBMS",
      url: "https://www.youtube.com/watch?v=1pUaEDNLWi4",
      description: "Explains the Two-Phase Locking protocol for concurrency control and how it can lead to deadlock.",
    }],
    whatYoullLearn: [
      "Two-Phase Locking (2PL), and precisely what its two phases are",
      "Why Strict 2PL specifically prevents cascading rollbacks, beyond what basic 2PL guarantees",
      "Deadlock: detection via wait-for graphs, versus prevention schemes",
      "Timestamp ordering as an alternative to locking, and its core comparison rule",
    ],
    prerequisites: ["Transactions"],
    concept: `## Two-Phase Locking: Grow, Then Only Shrink

::: story
Two-Phase Locking (2PL) is a protocol GUARANTEEING conflict serializability: every transaction is divided into a GROWING phase (only ACQUIRING locks, never releasing) followed by a SHRINKING phase (only RELEASING locks, never acquiring) - once a transaction releases its FIRST lock, it can never acquire another.
:::

::: remember
Basic 2PL guarantees conflict serializability, but NOT freedom from CASCADING ROLLBACKS - if T1 releases a lock early (during its shrinking phase) and T2 then reads that data, but T1 later ABORTS, T2 must also be rolled back (since it read a value that turned out to never really happen), potentially cascading further to whatever read FROM T2.
:::

::: cards
Strict 2PL :: ALL locks (not just growing-phase ones) are held until the transaction COMMITS or ABORTS - specifically prevents cascading rollbacks, since no other transaction can ever read an uncommitted (and possibly-to-be-undone) value.
Rigorous 2PL :: Even stricter - both read AND write locks held until commit/abort (Strict 2PL sometimes only mandates this for write locks specifically, depending on the exact definition used).
:::

::: mistake
Assuming basic 2PL alone is sufficient to avoid cascading rollbacks. 2PL guarantees SERIALIZABILITY, a distinct property from CASCADELESSNESS - Strict 2PL is specifically the stronger variant needed for the cascading-rollback guarantee, not basic 2PL.
:::

## Deadlock: Detection Vs Prevention

::: cards
Deadlock detection (via wait-for graph) :: Draw an edge Ti -> Tj whenever Ti is waiting for a lock held by Tj. A CYCLE in this graph means deadlock - detected periodically, and resolved by ABORTING one of the transactions in the cycle (a "victim").
Deadlock prevention :: Avoid deadlock from ever occurring in the first place, typically using TRANSACTION TIMESTAMPS to decide whether a transaction should wait or be aborted when it requests a lock held by another (e.g. the Wait-Die or Wound-Wait schemes).
:::

::: remember
Wait-for graph cycles are EXACTLY equivalent to deadlock - just like conflict serializability's precedence graph, this is a precise, checkable graph-based criterion, not a heuristic.
:::

## Timestamp Ordering: An Alternative To Locking

::: flow
Core idea :: Every transaction gets a unique TIMESTAMP when it starts. Every data item tracks the timestamp of the most recent transaction that read it (Read-TS) and wrote it (Write-TS).
The comparison rule :: A transaction attempting to READ or WRITE a data item is only allowed to proceed if its OWN timestamp is CONSISTENT with the data item's recorded timestamps (broadly: it must not be trying to read/write a value that a LATER transaction has already touched) - otherwise it's rolled back and restarted with a NEW, later timestamp.
No locks needed :: This achieves serializability (specifically, in TIMESTAMP order) WITHOUT any locking at all - a genuinely different mechanism from 2PL.
:::

::: checkpoint
A wait-for graph has edges T1 -> T2 and T2 -> T1. What does this indicate?
- (x) Deadlock - T1 is waiting for T2, and T2 is waiting for T1, a cycle with no way for either to proceed
- ( ) T1 and T2 are running normally in parallel
- ( ) This is only a warning, not an actual deadlock
- ( ) T1 will simply wait until T2 finishes
> T1 -> T2 and T2 -> T1 forms a 2-cycle: T1 is stuck waiting for a lock T2 holds, while T2 is simultaneously stuck waiting for a lock T1 holds - neither can ever proceed, the definition of deadlock, exactly detected by this cycle in the wait-for graph.
:::`,
    keyPoints: [
      "2PL: growing phase (acquire only) then shrinking phase (release only), once releasing starts, no more acquiring - guarantees conflict serializability.",
      "Basic 2PL does NOT prevent cascading rollbacks; Strict 2PL (hold all locks until commit/abort) specifically does, since nothing uncommitted is ever visible to another transaction.",
      "Deadlock detection: wait-for graph, cycle = deadlock, resolved by aborting a victim transaction. Deadlock prevention: timestamp-based schemes (Wait-Die, Wound-Wait) that avoid the situation entirely.",
      "Timestamp ordering achieves serializability without locks at all, by comparing each transaction's timestamp against a data item's most recent read/write timestamps, rolling back and restarting on a violation.",
    ],
    analogies: [
      "2PL is like a strict borrowing policy at a library: you may only CHECK OUT more books during the first half of your visit, and once you return even one book, you're not allowed to check out any more that visit - Strict 2PL additionally says you keep every book until you leave entirely, so nobody else can borrow (and depend on) something you might still need to un-borrow.",
    ],
    commonMistakes: [
      "Assuming basic 2PL alone prevents cascading rollbacks - that specific guarantee requires the stronger Strict 2PL variant.",
      "Treating deadlock detection as a heuristic or approximate check, when a wait-for graph cycle is an EXACT, provably correct criterion for deadlock.",
      "Confusing deadlock detection (find and resolve deadlocks after they occur) with deadlock prevention (avoid deadlocks from ever forming) - two fundamentally different strategies.",
    ],
    memoryTricks: [
      "\"2PL: grow then shrink, never grow again after the first shrink.\" The whole protocol in one sentence.",
      "Wait-for graph cycle = deadlock, exactly, always. Same 'cycle means bad' pattern as the serializability precedence graph.",
    ],
    formulas: [],
    shortcuts: [
      "For a 2PL question, first check WHICH variant is described (basic, strict, or rigorous) - the cascading-rollback guarantee specifically hinges on this distinction, not on 2PL generally.",
      "For a deadlock question, build the wait-for graph explicitly (who's waiting for what, held by whom) before concluding anything - a cycle is easy to miss by only reasoning informally.",
    ],
    pyqRelevance: `Concurrency control is one of the highest-value GATE Databases topics - 2PL variant identification, wait-for-graph deadlock detection, and occasionally timestamp-ordering rule application are all frequent, often higher-difficulty question types.`,
    interviewConnection: `2PL (and its strict variant) is literally what real database transaction managers implement for locking-based concurrency control, and understanding cascading rollbacks and deadlock detection is directly relevant to debugging real production database contention and deadlock incidents.`,
    revisionSummary: `2PL: growing phase (acquire only), then shrinking phase (release only) - guarantees conflict serializability, but not cascade-freedom. Strict 2PL (hold all locks until commit/abort) additionally prevents cascading rollbacks.

Deadlock detection: wait-for graph, cycle = deadlock, resolve by aborting a victim. Deadlock prevention: timestamp-based schemes avoiding the situation entirely.

Timestamp ordering: lock-free alternative, compares transaction timestamps against each data item's read/write timestamps.`,
    shortNotes: {
      oneMinute: "2PL: grow (acquire only) then shrink (release only) - guarantees serializability, NOT cascade-freedom. Strict 2PL: hold ALL locks until commit/abort - prevents cascading rollbacks. Wait-for graph cycle = deadlock (detection); timestamp-based schemes = prevention. Timestamp ordering: lock-free, compares timestamps against each item's read/write history.",
    },
    mcqs: [
      {
        question: "What specifically distinguishes Strict 2PL from basic 2PL?",
        options: [
          "Strict 2PL doesn't use locks at all",
          "Strict 2PL holds ALL locks until commit/abort, preventing cascading rollbacks",
          "Strict 2PL allows acquiring locks after releasing some",
          "There is no real difference",
        ],
        correctIndex: 1,
        explanation: "Strict 2PL holds every lock until the transaction commits or aborts (not just following the growing/shrinking phase split) - this specifically prevents cascading rollbacks, since no other transaction can ever read a value that might still be undone.",
      },
    ],
    numericals: [],
  },

};
