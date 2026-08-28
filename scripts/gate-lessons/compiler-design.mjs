// GATE Compiler Design - authored lesson content. Follows the authoring
// rules documented at the top of general-aptitude.mjs.

export const COMPILER_DESIGN = {

  // ---------------- Front End ----------------

  "lexical-analysis": {
    difficulty: "Easy",
    estimatedMinutes: 25,
    whatYoullLearn: [
      "What a lexical analyzer actually does: turning raw source text into a stream of tokens",
      "Token, lexeme, and pattern - three related terms that get confused constantly",
      "Why lexical analyzers use the LONGEST MATCH rule, and what problem it solves",
      "How regular expressions become the DFA that actually does the scanning",
    ],
    prerequisites: [],
    concept: `## The First Pass: Characters Into Tokens

::: story
A compiler never reads raw source code character by character all the way through - the LEXICAL ANALYZER (scanner) makes one pass first, grouping characters into TOKENS (the smallest meaningful units: keywords, identifiers, operators, literals) that every later compiler phase actually works with.
:::

::: cards Three terms, precisely
Token :: A CATEGORY - a pair (token-type, optional value), like <IDENTIFIER, "count"> or <NUMBER, 42>. What the parser actually consumes.
Lexeme :: The ACTUAL SUBSTRING of source text that matched a token's pattern - "count" is the lexeme, IDENTIFIER is the token.
Pattern :: The RULE (usually a regular expression) that describes what lexemes can match a given token - e.g. a letter followed by letters/digits, for IDENTIFIER.
:::

::: mistake
Using "token" and "lexeme" interchangeably. A token is the CATEGORY the scanner reports to the parser; the lexeme is the specific text that produced it - many different lexemes ("x", "count", "total99") all map to the same IDENTIFIER token.
:::

## The Longest Match Rule

::: remember
When more than one prefix of the remaining input could match a valid token, the lexical analyzer picks the LONGEST one. This is exactly why "==" scans as a single EQUALS token, not as two separate "=" ASSIGN tokens - and why a keyword like "if" isn't accidentally split mid-identifier from something like "ifx" (which correctly scans as one IDENTIFIER, "ifx", not "if" plus "x").
:::

## From Regular Expression To Scanner

::: flow
1. Define each token's pattern as a regular expression :: e.g. IDENTIFIER = letter(letter|digit)*.
2. Convert each regex to an NFA :: Thompson's construction, one NFA per token pattern.
3. Combine and convert to a single DFA :: Subset construction merges all the token NFAs into one DFA whose states can be tagged with which token(s) they'd accept.
4. The DFA IS the scanner :: Running input through this DFA, taking the longest run that ends in an accepting state, is exactly how real lexical analyzers (and generators like Lex/Flex) work under the hood.
:::

::: checkpoint
Given the input "<=", why does a well-built lexical analyzer scan it as ONE token (LESS-EQUAL) instead of two ("<" then "=")?
- ( ) Because "<=" appears earlier in the source file
- (x) Because the longest-match rule prefers the longer valid match over separate shorter ones
- ( ) Because operators are always scanned as pairs
- ( ) It depends on the parser, not the scanner
> The longest match rule specifically resolves this: "<=" as a whole matches the LESS-EQUAL token's pattern, and that's a LONGER valid match than treating "<" as its own complete token and leaving "=" separately - so the scanner commits to the longer match.
:::`,
    keyPoints: [
      "Token: a category (type + optional value). Lexeme: the actual matched substring. Pattern: the rule (regex) describing what counts.",
      "Longest match rule: when multiple valid matches are possible, the scanner always takes the longest one - this is why '==' isn't split into two '=' tokens.",
      "Pipeline: regex patterns per token -> NFA (Thompson's construction) -> combined DFA (subset construction) -> the DFA IS the running scanner.",
      "The lexical analyzer's output (a token stream) is exactly what the parser (next phase) consumes as its input.",
    ],
    analogies: [
      "A lexical analyzer is like a proofreader who groups individual letters into whole words before a translator ever sees the page - the translator (parser) works with words (tokens), never with raw letters (characters) directly.",
    ],
    commonMistakes: [
      "Confusing token and lexeme in an answer - conflating the CATEGORY with the specific matched TEXT.",
      "Forgetting the longest-match rule, and assuming a scanner would greedily stop at the first valid short match instead of preferring a longer one.",
      "Assuming lexical analysis handles nested/recursive structure (like matching balanced parentheses) - that's the PARSER's job; lexical analysis is fundamentally a regular (not context-free) pattern-matching process.",
    ],
    memoryTricks: [
      "\"Pattern is the RULE, lexeme is the MATCH, token is the LABEL.\" Rule -> match -> label, in that order.",
      "Longest match: when in doubt, the scanner is greedy for length.",
    ],
    formulas: [],
    shortcuts: [
      "If a question describes a scanner choosing between multiple valid matches, the answer is almost always resolved by the longest-match rule - check that first before considering any other tie-breaking logic.",
      "To quickly distinguish token vs lexeme in an answer choice, ask: is this the SPECIFIC TEXT (lexeme) or the GENERAL CATEGORY (token)?",
    ],
    pyqRelevance: `Lexical analysis basics (token/lexeme/pattern distinction, longest-match rule, and small NFA/DFA construction from a given regex) are a reliable early 1-mark question, often as a warm-up before the heavier parsing questions in the same section.`,
    interviewConnection: `Lexical analysis is the same fundamental technique behind syntax highlighting in code editors, and every regex-based tokenizer (log parsers, config file readers, simple DSLs) - understanding the NFA-to-DFA pipeline explains why regex engines can be implemented efficiently without backtracking.`,
    revisionSummary: `Token=category, Lexeme=matched text, Pattern=the rule (regex) describing it. Longest match rule: scanner always prefers the longest valid match.

Pipeline: regex per token -> NFA (Thompson's) -> combined DFA (subset construction) -> the running scanner.`,
    shortNotes: {
      oneMinute: "Token=category, Lexeme=actual text, Pattern=regex rule. Longest match rule: scanner prefers longer valid matches ('==' not '=','='). Pipeline: regex->NFA(Thompson's)->DFA(subset construction)->scanner.",
    },
    mcqs: [
      {
        question: "In the statement `int count = 5;`, what is the LEXEME for the IDENTIFIER token?",
        options: ["IDENTIFIER", "int", "count", "5"],
        correctIndex: 2,
        explanation: "\"count\" is the actual substring of source text matched - the lexeme. IDENTIFIER is the token (category); \"int\" and \"5\" are lexemes for different tokens (a keyword and a number literal respectively).",
      },
    ],
    numericals: [],
  },

  "parsing-top-down": {
    difficulty: "Moderate",
    estimatedMinutes: 30,
    whatYoullLearn: [
      "How top-down (LL) parsing builds a parse tree from the root downward",
      "Why left recursion breaks top-down parsing, and how to eliminate it",
      "FIRST and FOLLOW sets, and exactly what each one is used for",
      "Recursive descent parsing, and how it connects directly to FIRST/FOLLOW",
    ],
    prerequisites: ["Lexical Analysis", "Context-Free Grammars"],
    concept: `## Building The Parse Tree From The Root Down

::: story
A top-down parser starts from the grammar's START SYMBOL and tries to derive the actual input string by repeatedly expanding nonterminals, always choosing which production to apply based on the NEXT input token(s) it can see - building the parse tree root-first, working its way down to the leaves (the actual tokens).
:::

::: mistake
Trying to top-down-parse a grammar containing LEFT RECURSION (A -> A alpha | beta) directly. A top-down parser expanding A would immediately re-expand A again via the SAME left-recursive production, looping forever without ever consuming an input token - left recursion must be eliminated FIRST, before top-down parsing is even attempted.
:::

## Eliminating Left Recursion

::: remember
A -> A alpha | beta becomes: A -> beta A', A' -> alpha A' | epsilon. The rewritten grammar generates the exact same language, but now starts with beta (something OTHER than A) before ever recursing, which a top-down parser can actually make progress on.
:::

## FIRST And FOLLOW: What Each One Answers

::: cards
FIRST(alpha) :: The set of terminals that CAN begin some string derived from alpha. Used to decide WHICH production to expand when looking at the current input token.
FOLLOW(A) :: The set of terminals that can appear IMMEDIATELY AFTER A in some valid derivation. Used specifically when A can derive epsilon (empty), to decide whether to apply that epsilon-production based on what comes next.
:::

::: mistake
Computing FOLLOW(A) by only looking at what LITERALLY follows A in one production, forgetting to propagate FOLLOW through a nonterminal that itself can derive epsilon, or forgetting FOLLOW(startSymbol) always includes $ (end of input marker).
:::

## Recursive Descent: FIRST/FOLLOW Made Concrete

::: flow
One function per nonterminal :: Each nonterminal A gets its own parsing function, which looks at the current input token and decides (using FIRST sets) which of A's productions to expand.
Matching terminals :: When a production expects a specific terminal, the function checks it matches the current token and advances the input.
Recursive calls for nonterminals :: When a production contains another nonterminal B, that nonterminal's own function is called recursively - directly mirroring the grammar's own recursive structure.
:::

::: checkpoint
A grammar rule is A -> A + B | B (left recursive). After eliminating left recursion using the standard transformation, what does the rewritten grammar look like?
- ( ) A -> B A | A + epsilon
- (x) A -> B A', A' -> + B A' | epsilon
- ( ) A -> A B | + epsilon
- ( ) The grammar cannot be rewritten
> Matching the standard form A -> A alpha | beta with alpha="+ B" and beta="B": the rewritten grammar is A -> B A', A' -> + B A' | epsilon - starting with B (not A) first, avoiding the infinite top-down expansion loop.
:::`,
    keyPoints: [
      "Top-down (LL) parsing expands from the start symbol downward, choosing productions based on lookahead tokens.",
      "Left recursion (A -> A alpha | beta) causes infinite loops in top-down parsing and must be eliminated first: A -> beta A', A' -> alpha A' | epsilon.",
      "FIRST(alpha): terminals that can begin a string derived from alpha - used to choose which production to expand. FOLLOW(A): terminals that can immediately follow A - used specifically for epsilon-productions.",
      "Recursive descent parsing: one function per nonterminal, using FIRST sets to choose productions and recursive calls to mirror the grammar's structure.",
    ],
    analogies: [
      "Top-down parsing is like assembling furniture from the instruction diagram's top-level picture downward, checking at each step which specific sub-assembly instructions to follow next based on which parts you're currently holding (the lookahead token).",
    ],
    commonMistakes: [
      "Attempting top-down parsing on a left-recursive grammar without eliminating the left recursion first.",
      "Confusing FIRST and FOLLOW's purposes - FIRST decides which production to START with; FOLLOW is specifically needed for deciding when to apply an EPSILON production.",
      "Forgetting FOLLOW of the start symbol always includes the end-of-input marker ($).",
    ],
    memoryTricks: [
      "\"FIRST decides what to START expanding. FOLLOW decides when it's safe to end (epsilon) and what comes next.\"",
      "Left recursion elimination: \"the recursive part moves to the END of a new nonterminal, wrapped with an epsilon escape.\"",
    ],
    formulas: [
      "Left recursion elimination: A -> A alpha | beta  becomes  A -> beta A', A' -> alpha A' | epsilon.",
    ],
    shortcuts: [
      "Before attempting to top-down-parse (or build a predictive parsing table for) any grammar, scan it for left recursion first - it's a prerequisite check, not an optional cleanup step.",
      "When computing FOLLOW(A), always check the special epsilon-production case last, after handling every production where A appears with something concrete after it.",
    ],
    pyqRelevance: `Left-recursion elimination and FIRST/FOLLOW set computation are extremely reliable GATE questions - almost always a direct "compute FIRST/FOLLOW for this small grammar" or "eliminate left recursion from this rule" numerical, testing mechanical correctness over conceptual depth.`,
    interviewConnection: `Recursive descent parsing is the simplest real parsing technique to hand-implement, and understanding left-recursion elimination is directly relevant whenever writing a hand-rolled parser for a small DSL or config language.`,
    revisionSummary: `Top-down parsing expands from the start symbol down, choosing productions via lookahead. Left recursion (A->A alpha|beta) breaks this and must be eliminated: A->beta A', A'->alpha A'|epsilon.

FIRST(alpha): terminals that can start alpha's derivation - chooses which production to expand. FOLLOW(A): terminals immediately after A - needed for epsilon-production decisions.

Recursive descent: one function per nonterminal, using FIRST to choose, recursing to mirror grammar structure.`,
    shortNotes: {
      oneMinute: "Top-down: expand from start symbol via lookahead. Left recursion breaks it: A->Aalpha|beta becomes A->betaA', A'->alphaA'|eps. FIRST(alpha): terminals starting alpha (chooses production). FOLLOW(A): terminals after A (for epsilon-production decisions). Recursive descent: one function per nonterminal.",
    },
    mcqs: [
      {
        question: "Why does left recursion specifically break top-down parsing?",
        options: [
          "It makes the grammar ambiguous",
          "The parser would re-expand the same nonterminal infinitely without consuming any input",
          "Left recursion is not allowed in any grammar",
          "It only affects bottom-up parsers, not top-down",
        ],
        correctIndex: 1,
        explanation: "A top-down parser expanding a left-recursive nonterminal A immediately re-derives A via the same production, looping forever without ever matching an actual input token - it never makes progress.",
      },
    ],
    numericals: [],
  },

  "parsing-bottom-up": {
    difficulty: "Hard",
    estimatedMinutes: 35,
    whatYoullLearn: [
      "How bottom-up (shift-reduce) parsing builds the parse tree from the leaves upward",
      "The LR parser hierarchy: LR(0), SLR, LALR, LR(1), and roughly what distinguishes their power",
      "Shift-reduce and reduce-reduce conflicts, and what each one signals about the grammar",
      "What a 'handle' is, and why finding it correctly is the crux of shift-reduce parsing",
    ],
    prerequisites: ["Context-Free Grammars", "Pushdown Automata"],
    concept: `## Building The Parse Tree From The Leaves Up

::: story
A bottom-up parser does the OPPOSITE of top-down: it starts from the actual input tokens (the leaves) and repeatedly REDUCES a recognized right-hand-side pattern back into its corresponding nonterminal, working upward until the whole input reduces to the start symbol.
:::

::: cards Shift-reduce, the two moves
Shift :: Push the next input token onto the stack.
Reduce :: Recognize that the TOP of the stack matches some production's right-hand side exactly (this matched portion is called the HANDLE), and replace it with the corresponding nonterminal.
:::

::: remember
A HANDLE is the specific substring on the stack that a bottom-up parser reduces at any given step - correctly identifying handles (and doing so in the right order) is the entire challenge of bottom-up parsing, and is exactly what the parsing tables (built from LR item sets) are designed to get right automatically.
:::

## The LR Parser Family: Increasing Power

::: cards Same shift-reduce skeleton, different lookahead sophistication
LR(0) :: No lookahead at all when deciding shift vs reduce - weakest, accepts the fewest grammars without conflicts.
SLR (Simple LR) :: Uses FOLLOW sets to help resolve reduce decisions - a straightforward, cheap upgrade over LR(0).
LALR (Look-Ahead LR) :: Merges LR(1) states with the same core, keeping LR(1)'s lookahead precision far more cheaply (smaller tables) - what most REAL parser generators (like yacc/bison) actually use.
LR(1) :: Full one-token lookahead carried per state - most powerful (accepts the largest class of grammars), but the largest, most expensive parsing tables.
:::

::: mistake
Assuming LALR is strictly weaker than LR(1) in a way that matters practically, or assuming SLR is just "LR(0) with lookahead" without qualification - SLR specifically uses FOLLOW sets (not full LR(1) lookahead) to resolve conflicts, which is a genuinely different and less precise mechanism than LALR's actual per-state lookahead.
:::

## Conflicts: What They Signal

::: cards
Shift-reduce conflict :: The parser can't decide whether to shift the next token or reduce the current handle - often signals genuine grammar ambiguity (like the classic dangling-else problem).
Reduce-reduce conflict :: The parser can't decide WHICH of two different productions to reduce by - usually signals a more serious grammar design problem than a shift-reduce conflict.
:::

::: checkpoint
A bottom-up parser has just shifted enough tokens that the top of its stack exactly matches the right-hand side of some production. What should it do?
- ( ) Continue shifting regardless
- (x) Reduce: replace that matched substring (the handle) with the production's left-hand-side nonterminal
- ( ) Discard the stack and restart
- ( ) Report a syntax error
> This IS the definition of a handle - once the stack top exactly matches a production's right-hand side (and it's correct to reduce at this point, per the parsing table), the parser reduces it to the corresponding nonterminal, continuing the bottom-up construction.
:::`,
    keyPoints: [
      "Bottom-up parsing builds from the leaves up: shift (push a token) and reduce (replace a recognized handle with its nonterminal) are the two moves.",
      "A handle is the specific stack-top substring matching a production's right-hand side, ready to be reduced.",
      "LR family, increasing power/table size: LR(0) (no lookahead) < SLR (FOLLOW-set-based) < LALR (merged LR(1) states, what real parser generators use) < LR(1) (full per-state lookahead, most powerful, largest tables).",
      "Shift-reduce conflict: can't decide shift vs reduce (often genuine ambiguity, e.g. dangling-else). Reduce-reduce conflict: can't decide which production to reduce by (typically a more serious grammar issue).",
    ],
    analogies: [
      "Bottom-up parsing is like assembling a jigsaw puzzle by recognizing already-complete small clusters of pieces and treating each cluster as a single larger 'piece' going forward - repeatedly consolidating recognized clusters (handles) until the entire picture (start symbol) is one piece.",
    ],
    commonMistakes: [
      "Confusing shift-reduce parsing's DIRECTION (bottom-up, leaves to root) with top-down parsing's direction (root to leaves).",
      "Misordering the LR hierarchy's power, especially assuming SLR and LALR are the same thing, or that LALR is dramatically weaker than LR(1) in practice (it's usually equally sufficient, with much smaller tables).",
      "Treating every shift-reduce conflict as an unfixable grammar error - some are resolved by a stated precedence/associativity rule (like the dangling-else convention), not a rewrite.",
    ],
    memoryTricks: [
      "\"Shift pushes, reduce collapses.\" The two moves of every shift-reduce parser.",
      "LR power order: LR(0) < SLR < LALR < LR(1) - lookahead sophistication increases left to right, and so does table size/cost.",
    ],
    formulas: [],
    shortcuts: [
      "If a GATE question describes a real-world parser generator's behaviour (yacc/bison-style), default to assuming LALR, since that's what's actually used in practice, not the theoretically-strongest LR(1).",
      "For a shift-reduce vs reduce-reduce conflict question, first identify whether the parser is choosing BETWEEN two actions of different KINDS (shift vs reduce) or between two DIFFERENT reduce options - that distinction alone answers which conflict type it is.",
    ],
    pyqRelevance: `Bottom-up parsing is tested via LR item-set/parsing-table construction (a heavier, high-value numerical), conflict identification in a given grammar, and conceptual ranking of the LR parser family's relative power - a consistently well-represented, higher-difficulty GATE topic.`,
    interviewConnection: `Understanding shift-reduce parsing is directly relevant when debugging real yacc/bison grammar conflicts in actual compiler or DSL-parser projects - shift-reduce conflicts specifically are an extremely common real-world grammar-design issue engineers encounter when building parsers.`,
    revisionSummary: `Bottom-up parsing: shift (push token) and reduce (replace a recognized handle with its nonterminal), building leaves-to-root.

LR family power: LR(0) < SLR (FOLLOW-based) < LALR (merged LR(1) states, used in practice) < LR(1) (full lookahead, largest tables).

Shift-reduce conflict: shift-vs-reduce ambiguity. Reduce-reduce conflict: which production to reduce by - typically more serious.`,
    shortNotes: {
      oneMinute: "Bottom-up: shift (push) / reduce (collapse handle to nonterminal), leaves to root. LR power: LR(0)<SLR(FOLLOW-based)<LALR(merged LR(1), used in practice)<LR(1)(full lookahead). Shift-reduce conflict: shift vs reduce ambiguity. Reduce-reduce conflict: which production - usually more serious.",
    },
    mcqs: [
      {
        question: "Which LR parser variant do real-world parser generators like yacc/bison typically use, balancing power and table size?",
        options: ["LR(0)", "SLR", "LALR", "LR(1)"],
        correctIndex: 2,
        explanation: "LALR merges LR(1) states sharing the same core, retaining most of LR(1)'s lookahead precision with much smaller tables - the practical sweet spot that real parser generators use.",
      },
    ],
    numericals: [],
  },

  "syntax-directed-translation": {
    difficulty: "Moderate",
    estimatedMinutes: 25,
    whatYoullLearn: [
      "What synthesized and inherited attributes are, with the direction each one flows",
      "S-attributed vs L-attributed grammars, and why the distinction matters for evaluation order",
      "How semantic rules attach to grammar productions to compute a value while parsing",
      "Building an annotated parse tree by hand for a small SDT",
    ],
    prerequisites: ["Parsing: Bottom-Up", "Parsing: Top-Down"],
    concept: `## Attaching Meaning To Grammar Rules

::: story
Syntax-Directed Translation (SDT) attaches SEMANTIC RULES to each grammar production, computing an attribute (a value) at each node of the parse tree as it's built - this is literally how a compiler computes things like an expression's value, its type, or its generated code, using the SAME grammar that already describes its syntax.
:::

## Synthesized vs Inherited: Which Way Does The Value Flow?

::: cards
Synthesized attribute :: Computed from a node's OWN CHILDREN's attribute values - flows UPWARD, from leaves toward the root. Example: an expression's numeric VALUE is naturally synthesized from its subexpressions' values.
Inherited attribute :: Computed from a node's PARENT or SIBLINGS - flows DOWNWARD or SIDEWAYS. Example: a variable's declared TYPE, passed down from an enclosing declaration context into each use.
:::

::: mistake
Assuming every useful attribute can be synthesized. Some information (like a symbol's type, determined by an enclosing declaration) genuinely needs to flow DOWNWARD or across siblings - trying to force it into a synthesized-only scheme either fails or requires an awkward workaround.
:::

## S-Attributed vs L-Attributed Grammars

::: cards
S-attributed grammar :: Uses ONLY synthesized attributes. Can be evaluated purely bottom-up, in a single pass, fitting naturally with LR (bottom-up) parsing.
L-attributed grammar :: Allows inherited attributes too, but restricted: each inherited attribute can only depend on attributes from the PARENT or from SIBLINGS TO ITS LEFT (never a sibling to its right) - "L" for left-to-right. Still evaluable in a single left-to-right pass, fitting naturally with LL (top-down) parsing.
:::

::: remember
Every S-attributed grammar is automatically also L-attributed (synthesized-only is a special, simpler case of the L-attributed restriction) - but not every L-attributed grammar is S-attributed, since L-attributed genuinely allows inherited attributes that S-attributed doesn't.
:::

## Building An Annotated Parse Tree

::: flow
1. Parse the input normally :: Build the parse tree using the grammar's productions as usual.
2. Attach each production's semantic rule :: At each node, apply the semantic rule associated with the production used there.
3. Evaluate attributes in a valid order :: Synthesized attributes bottom-up (children before parent); inherited attributes in the order the L-attributed restriction allows (parent/left-siblings before this node).
4. The root's final attribute is often the answer :: For a simple calculator grammar, the start symbol's synthesized VALUE attribute, once fully evaluated, is the expression's computed result.
:::

::: checkpoint
A grammar computes E.val = E1.val + T.val for the production E -> E1 + T. Is E.val synthesized or inherited?
- (x) Synthesized - it's computed from E's own children (E1 and T)'s attribute values
- ( ) Inherited - it comes from E's parent
- ( ) Neither term applies here
- ( ) Cannot be determined without more context
> E.val is computed directly from its CHILDREN's (E1.val and T.val) attribute values - this is the definition of a synthesized attribute, flowing upward from children to parent.
:::`,
    keyPoints: [
      "Synthesized attribute: computed from a node's own children, flows upward (leaves to root). Inherited attribute: computed from parent/siblings, flows downward or sideways.",
      "S-attributed grammar: synthesized attributes only, single bottom-up pass, fits LR parsing naturally.",
      "L-attributed grammar: allows inherited attributes, but each can only depend on the parent or LEFT siblings - still a single left-to-right pass, fits LL parsing naturally.",
      "Every S-attributed grammar is automatically L-attributed (a special case); the reverse is not true.",
    ],
    analogies: [
      "Synthesized attributes are like a company's quarterly report rolling UP from individual employees to their manager to the CEO (bottom to top); inherited attributes are like a company-wide policy handed DOWN from the CEO to managers to employees (top to bottom) - SDT needs both directions in general.",
    ],
    commonMistakes: [
      "Mislabeling an attribute's direction - checking whether a value comes from CHILDREN (synthesized) or from PARENT/LEFT-SIBLINGS (inherited) is the entire distinction, and it's easy to get backwards under time pressure.",
      "Assuming L-attributed and S-attributed are interchangeable terms - L-attributed is the strictly broader category that also permits (left-to-right-safe) inherited attributes.",
      "Trying to evaluate an inherited attribute using a RIGHT sibling's value, which violates the L-attributed restriction and breaks single-pass left-to-right evaluation.",
    ],
    memoryTricks: [
      "\"Synthesized: UP from children. Inherited: DOWN from parent, or IN from the left.\" Direction is the whole story.",
      "S-attributed is a SPECIAL CASE of L-attributed - all synthesized, zero inherited.",
    ],
    formulas: [],
    shortcuts: [
      "To classify an attribute quickly, check which SIDE of the production rule it's computed from: children on the right-hand side (synthesized) vs the parent nonterminal or left context (inherited).",
      "If a question mentions single-pass evaluation compatible with LR parsing specifically, that's the S-attributed signature; compatible with LL parsing specifically suggests L-attributed with genuine inherited attributes.",
    ],
    pyqRelevance: `SDT questions typically ask to classify given attributes as synthesized/inherited, or to evaluate a small annotated parse tree by hand for a simple expression grammar - both are common, moderate-difficulty GATE question types.`,
    interviewConnection: `SDT is the conceptual foundation for how a real compiler's semantic analysis phase (type checking, computing intermediate representations) is structured directly on top of the parser - understanding synthesized vs inherited attributes explains why some compiler passes are naturally single-pass and others require multiple passes or explicit symbol tables.`,
    revisionSummary: `Synthesized: from children, flows up. Inherited: from parent/left siblings, flows down/sideways.

S-attributed: synthesized only, single bottom-up pass, fits LR. L-attributed: allows inherited (parent/left-sibling-only dependency), single left-to-right pass, fits LL. S-attributed is always also L-attributed.`,
    shortNotes: {
      oneMinute: "Synthesized: from children, flows up. Inherited: from parent/left siblings, flows down/sideways. S-attributed: synthesized only, fits LR (bottom-up). L-attributed: allows inherited (parent/left-sibling dependency only), fits LL (top-down). S-attributed is always also L-attributed.",
    },
    mcqs: [
      {
        question: "For the production D -> T L, with the rule L.type = T.type (passing the declared type down to L), what kind of attribute is L.type?",
        options: ["Synthesized", "Inherited", "Neither", "Both simultaneously"],
        correctIndex: 1,
        explanation: "L.type is being set from T (a SIBLING to its left in the production) rather than from L's own children - this is an inherited attribute, flowing sideways/downward from context rather than upward from L's own subtree.",
      },
    ],
    numericals: [],
  },

  // ---------------- Runtime and Intermediate Code ----------------

  "runtime-environments": {
    difficulty: "Moderate",
    estimatedMinutes: 30,
    whatYoullLearn: [
      "What an activation record holds, and why every function call needs one",
      "Static vs dynamic scoping, and how each one resolves a variable reference differently",
      "Parameter passing mechanisms - call by value, reference, and value-result",
      "Static vs dynamic memory allocation strategies, and where the heap fits in",
    ],
    prerequisites: ["Recursion"],
    concept: `## The Activation Record: One Per Function Call

::: story
Every function call gets its own ACTIVATION RECORD (stack frame) - a block of memory holding everything that call needs privately: its parameters, local variables, a return address (where to resume the caller), and often a saved pointer back to the caller's own frame. This directly connects to Recursion's call-stack model: each recursive call literally gets a fresh activation record.
:::

::: cards What an activation record typically holds
Return address :: Where execution resumes in the CALLER once this function returns.
Parameters :: The values (or references) passed into this specific call.
Local variables :: This call's own private copies, separate from every other call's.
Saved control link (dynamic link) :: A pointer back to the CALLER's activation record, letting execution find its way back.
Saved access link (static link) :: Used specifically for NESTED functions to find an enclosing scope's variables - see static scoping below.
:::

## Static vs Dynamic Scoping

::: cards
Static (lexical) scoping :: A variable reference resolves to whichever declaration is closest in the SOURCE CODE'S nesting structure - determined at COMPILE time, regardless of the actual call sequence at runtime. Most modern languages use this.
Dynamic scoping :: A variable reference resolves to the most recent declaration still ACTIVE on the call stack at RUNTIME - depends on the actual sequence of calls, not just the source code's textual structure.
:::

::: mistake
Assuming a variable's scope is always resolvable just by reading the source code structure. That's true for STATIC scoping (the common case) but explicitly false for DYNAMIC scoping, where the same variable reference can resolve differently depending on the actual call chain at runtime - a genuinely different resolution mechanism, not just a naming detail.
:::

## Parameter Passing Mechanisms

::: flow
Call by value :: The callee gets a COPY of the argument's value. Changes inside the callee never affect the caller's original variable.
Call by reference :: The callee gets the argument's ADDRESS. Changes inside the callee DIRECTLY modify the caller's original variable.
Call by value-result (copy-restore) :: A hybrid: the callee gets a COPY (like call-by-value) to work with locally, but that copy is copied BACK into the original variable when the call returns - can behave differently from true call-by-reference when aliasing is involved.
:::

::: checkpoint
Under DYNAMIC scoping, a function f() references variable x without declaring it locally. Which x does it use?
- ( ) Whichever x is declared closest to f()'s definition in the source code
- (x) Whichever x is the most recently active declaration on the current call stack at runtime
- ( ) The globally declared x, always
- ( ) It's a compile-time error
> Dynamic scoping resolves a free variable reference by looking at the RUNTIME call stack for the most recently active matching declaration - not by the source code's static nesting structure (which is what static/lexical scoping would use instead).
:::`,
    keyPoints: [
      "Activation record: one per function call, holds return address, parameters, locals, and links back to the caller (dynamic link) and enclosing scope (static link, for nested functions).",
      "Static (lexical) scoping: resolved by source-code nesting structure, at compile time - most modern languages. Dynamic scoping: resolved by the runtime call stack's most recent matching declaration.",
      "Call by value: callee gets a copy, no effect on caller. Call by reference: callee gets the address, directly modifies caller's variable. Call by value-result: copy in, copy back out on return.",
    ],
    analogies: [
      "Static scoping is like resolving 'who is my manager' by looking at the org chart (fixed, structural); dynamic scoping is like resolving it by asking 'who's actually been giving me instructions most recently' (depends on the actual sequence of events, not the fixed chart).",
    ],
    commonMistakes: [
      "Assuming every language uses static scoping - dynamic scoping is a genuinely different mechanism used by some languages (and some contexts within otherwise-static languages), not just an obscure theoretical curiosity.",
      "Confusing call-by-reference with call-by-value-result - they can behave identically in simple cases but diverge specifically when aliasing (two parameters referring to the same variable) is involved.",
      "Forgetting the static link is specifically for NESTED function scope resolution, distinct from the dynamic link's job of finding the way back to the caller.",
    ],
    memoryTricks: [
      "\"Static scoping: read the CODE. Dynamic scoping: read the CALL STACK.\" Where each one looks to resolve a variable.",
      "Value-result = value going IN, result coming back OUT at return - a copy both directions, not a live reference throughout.",
    ],
    formulas: [],
    shortcuts: [
      "For a scoping question, check whether resolution is described as depending on the CALL SEQUENCE (dynamic) or purely on the SOURCE STRUCTURE (static) - that single distinction answers the question.",
      "For a parameter-passing question involving ALIASING (the same variable passed twice, or a global also passed as a parameter), specifically check whether it's asking about true reference semantics or value-result's copy-in/copy-out behaviour - they can differ exactly in this case.",
    ],
    pyqRelevance: `Activation record structure, static vs dynamic scoping resolution (often via a short code trace), and parameter-passing-mechanism tracing are all recurring GATE conceptual questions in this topic, occasionally combined with a small worked trace.`,
    interviewConnection: `Understanding activation records and the stack-based call model is foundational for debugging stack overflows and understanding closures (which specifically rely on static scoping plus captured access links) - a common deeper-dive topic in language-internals interview discussions.`,
    revisionSummary: `Activation record: one per call - return address, parameters, locals, dynamic link (to caller), static link (to enclosing scope, for nested functions).

Static scoping: resolved by source structure, compile time. Dynamic scoping: resolved by the runtime call stack.

Call by value (copy, no caller effect), call by reference (address, direct caller effect), call by value-result (copy in, copy out at return).`,
    shortNotes: {
      oneMinute: "Activation record: return address, params, locals, dynamic link (to caller), static link (to enclosing scope). Static scoping: resolved by source structure (compile time). Dynamic scoping: resolved by runtime call stack. Call by value: copy, no caller effect. By reference: address, direct effect. By value-result: copy in, copy out at return.",
    },
    mcqs: [
      {
        question: "What information does an activation record's 'dynamic link' hold?",
        options: [
          "A pointer to the enclosing lexical scope",
          "A pointer back to the caller's own activation record",
          "The function's return value",
          "The function's compiled machine code address",
        ],
        correctIndex: 1,
        explanation: "The dynamic link points back to the CALLER's activation record, letting execution find its way back up the call chain once this call returns - distinct from the static link, which is used for nested-function scope resolution.",
      },
    ],
    numericals: [],
  },

  "intermediate-code-generation": {
    difficulty: "Moderate",
    estimatedMinutes: 25,
    whatYoullLearn: [
      "Why compilers generate an intermediate representation instead of going straight to machine code",
      "Three-address code, and the specific 'at most one operator per instruction' rule that defines it",
      "Quadruples vs triples as concrete representations of three-address code",
      "Converting a small expression into three-address code by hand",
    ],
    prerequisites: ["Syntax-Directed Translation"],
    concept: `## Why Not Go Straight To Machine Code?

::: story
A compiler generates an INTERMEDIATE representation - a form that's lower-level than source code but still independent of any specific target machine - as a deliberate middle step. This lets the SAME front end (lexer/parser/semantic analysis) target MULTIPLE different machines by swapping only the final code-generation phase, and lets optimization passes work on one clean, uniform representation instead of the source language's full syntactic variety.
:::

## Three-Address Code: The Defining Rule

::: remember
Three-address code (TAC) restricts every instruction to AT MOST one operator on the right-hand side, and at most three addresses (operands) total - e.g. t1 = b * c is valid TAC; t2 = a + b * c is NOT (two operators), and must be broken into t1 = b * c; t2 = a + t1 first.
:::

::: cards Concrete representations of TAC
Quadruples :: Each instruction stored as (operator, arg1, arg2, result) - four explicit fields. Results are named explicitly, making REORDERING instructions safe (nothing implicitly refers to "the previous instruction's result").
Triples :: Each instruction stored as (operator, arg1, arg2), with NO explicit result field - later instructions refer back to an earlier triple BY ITS POSITION/INDEX instead of a named temporary. More compact, but REORDERING triples is dangerous, since position-based references would silently break.
:::

::: mistake
Assuming triples and quadruples are just cosmetic variations of each other. The specific difference - quadruples name results explicitly (safe to reorder), triples reference by position (unsafe to reorder) - has real consequences for which representation an optimizer can safely rearrange instructions in.
:::

## Converting An Expression To TAC

::: flow
1. Parse the expression respecting precedence :: e.g. a + b * c parses as a + (b * c), NOT (a + b) * c.
2. Generate one instruction per operator, deepest/highest-precedence first :: t1 = b * c (multiplication happens first due to precedence).
3. Combine using the temporary from the previous step :: t2 = a + t1.
4. The final temporary holds the whole expression's value :: t2 is the result of a + b * c.
:::

::: checkpoint
Convert the expression \`x = a + b * c - d\` into three-address code. How many TAC instructions are needed (including the final assignment to x)?
- ( ) 2
- ( ) 3
- (x) 4
- ( ) 1
> t1 = b * c (multiplication first, precedence). t2 = a + t1. t3 = t2 - d. x = t3. Four instructions total, each with at most one operator - matching the three-address code rule.
:::`,
    keyPoints: [
      "Intermediate representation lets one front end target multiple machines and lets optimizations work on one uniform form, independent of source syntax.",
      "Three-address code: at most one operator per instruction, at most three addresses - a multi-operator expression must be broken into a temporary-chained sequence.",
      "Quadruples: (operator, arg1, arg2, result) - explicit named results, safe to reorder. Triples: (operator, arg1, arg2), position-referenced - more compact, unsafe to reorder.",
      "Converting an expression to TAC respects normal operator precedence, generating instructions from the highest-precedence subexpression outward.",
    ],
    analogies: [
      "Three-address code is like breaking a complicated recipe instruction ('mix the whisked eggs into the sifted flour and melted butter') into individual atomic steps, each producing one clearly labelled intermediate result that the next step explicitly refers to.",
    ],
    commonMistakes: [
      "Writing a TAC instruction with more than one operator (e.g. t1 = a + b * c directly) - violates the fundamental one-operator-per-instruction rule.",
      "Confusing quadruples and triples' reorder-safety - assuming triples are just as safely reorderable as quadruples, when their position-based referencing makes that unsafe.",
      "Getting operator precedence wrong when generating TAC, producing instructions that don't match the expression's actual intended evaluation order.",
    ],
    memoryTricks: [
      "\"One operator, one instruction.\" The entire three-address code rule in four words.",
      "Quadruples NAME their result (safe to move around). Triples POSITION their result (fragile to move around).",
    ],
    formulas: [],
    shortcuts: [
      "To count TAC instructions for an expression quickly, just count the number of OPERATORS in the expression (respecting precedence/parenthesization) - that's exactly the number of instructions needed, one per operator, plus one more if a final assignment target is included.",
      "When converting to TAC by hand, work from the innermost/highest-precedence subexpression outward, exactly as you would evaluate the expression manually.",
    ],
    pyqRelevance: `Converting a given expression to three-address code (and counting the resulting instructions) is a reliable, mechanical 1-2 mark GATE numerical - precedence handling is the main source of error, not the TAC rules themselves.`,
    interviewConnection: `Three-address-code-style intermediate representations are exactly what real compiler infrastructure (LLVM IR, for instance) is conceptually built on - understanding why an IR sits between source and machine code is foundational background for any compiler-internals discussion.`,
    revisionSummary: `Intermediate representation: machine-independent, lets one front end target many machines, and gives optimizers a uniform form to work on.

Three-address code: at most one operator per instruction. Quadruples (operator,arg1,arg2,result) - named results, reorder-safe. Triples (operator,arg1,arg2) - position-referenced, reorder-unsafe.

Convert by precedence, innermost operator first, chaining through temporaries.`,
    shortNotes: {
      oneMinute: "Intermediate code: machine-independent, one front end -> many backends, uniform form for optimization. TAC: at most 1 operator/instruction. Quadruples (op,arg1,arg2,result): named, reorder-safe. Triples (op,arg1,arg2): position-referenced, reorder-UNSAFE. Convert by precedence, innermost first.",
    },
    mcqs: [
      {
        question: "Which representation of three-address code is UNSAFE to reorder, because later instructions refer to earlier ones by position?",
        options: ["Quadruples", "Triples", "Both are equally safe", "Neither uses positional reference"],
        correctIndex: 1,
        explanation: "Triples have no explicit named result field - later instructions reference an earlier triple by its POSITION/index, so reordering triples silently breaks those references. Quadruples name results explicitly, making them safe to reorder.",
      },
    ],
    numericals: [
      {
        question: "How many three-address-code instructions (including the final assignment) are needed for `y = (a + b) * (c - d)`?",
        answerMin: 3,
        answerMax: 3,
        unit: "",
        solution: `t1 = a + b
t2 = c - d
y = t1 * t2
3 instructions total.`,
      },
    ],
  },

  // ---------------- Optimisation and Data Flow Analysis ----------------

  "local-optimisation": {
    difficulty: "Moderate",
    estimatedMinutes: 25,
    whatYoullLearn: [
      "What a basic block is, and why optimization is naturally scoped to one first",
      "Peephole optimization: what it looks at, and the specific patterns it catches",
      "Constant folding and algebraic simplification as concrete local transformations",
      "Why 'local' optimization is inherently limited, motivating data-flow analysis (the next three topics)",
    ],
    prerequisites: ["Intermediate Code Generation"],
    concept: `## The Basic Block: Optimization's Natural Starting Scope

::: remember
A BASIC BLOCK is a maximal sequence of instructions with exactly ONE entry point (the first instruction) and ONE exit point (the last instruction) - no jumps INTO the middle of it, and no jumps OUT except at the very end. Because control flow never branches partway through a basic block, everything inside it executes in a fixed, entirely predictable order every single time - which is exactly what makes LOCAL optimization within one block tractable and safe.
:::

## Peephole Optimization: A Small, Sliding Window

::: story
Peephole optimization examines a small, SLIDING WINDOW of a few consecutive instructions at a time, looking for specific well-known WASTEFUL patterns to replace with something more efficient - it never needs to understand the whole program, only a tiny local neighbourhood.
:::

::: cards Classic peephole patterns
Redundant load/store elimination :: \`store x; load x\` immediately after, where the loaded value is already known (just stored) - the load is redundant and can be removed.
Constant folding :: Replace an operation on two KNOWN CONSTANTS with its already-computed result at compile time - \`t1 = 2 + 3\` becomes \`t1 = 5\` directly, no runtime computation needed.
Algebraic simplification :: Replace an expression with a mathematically equivalent, cheaper one - \`x = x + 0\` is removed entirely; \`x = x * 1\` is removed entirely; \`x = x * 2\` can become the cheaper \`x = x + x\` or a shift.
Strength reduction :: Replace an expensive operation with a cheaper equivalent - multiplying by a power of 2 becomes a bit-shift instead of true multiplication.
:::

::: mistake
Applying an algebraic simplification like \`x * 0 -> 0\` without considering floating-point edge cases (NaN * 0 = NaN, not 0, in IEEE 754) - real compilers are careful about exactly which simplifications are always safe versus only safe for integer/exact arithmetic.
:::

## Why "Local" Has A Ceiling

::: flow
What local optimization CAN see :: Only the instructions inside ONE basic block, in their guaranteed fixed order.
What it CANNOT see :: Anything about how values flow BETWEEN blocks - whether a variable computed in one block is actually still needed (live) by the time control reaches a later block, for instance.
The motivation for going further :: Questions like "is this variable's value ever used again anywhere in the program" genuinely require looking ACROSS the whole control flow graph - which is exactly what data-flow analysis (Liveness Analysis, Constant Propagation, Common Subexpression Elimination) is built to answer.
:::

::: checkpoint
Why is a basic block specifically the right scope for straightforward local optimization?
- ( ) Basic blocks are always exactly one instruction long
- (x) Execution order within a basic block is fixed and predictable - no branches in or out except at its boundaries
- ( ) Basic blocks always contain a loop
- ( ) Local optimization works on the entire program at once, not blocks specifically
> A basic block has exactly one entry and one exit with no internal branching, so every instruction inside it is guaranteed to execute in the same fixed order every time - this predictability is exactly what makes local transformations (peephole optimization, constant folding) safe to apply without needing to reason about the rest of the program.
:::`,
    keyPoints: [
      "Basic block: maximal instruction sequence with one entry, one exit, no internal branches - execution order inside is fixed and predictable.",
      "Peephole optimization: examines a small sliding window of instructions, catching patterns like redundant load/store, constant folding, algebraic simplification, and strength reduction.",
      "Local optimization is confined to one basic block's guaranteed-fixed order - it cannot reason about how values flow BETWEEN blocks.",
      "Cross-block questions (is a variable still needed later, is an expression's value already computed elsewhere) require data-flow analysis, motivating Liveness Analysis, Constant Propagation, and Common Subexpression Elimination.",
    ],
    analogies: [
      "Local (peephole) optimization is like proofreading one sentence at a time for typos and redundant words - genuinely useful, but it can never catch a plot inconsistency that only shows up by comparing chapter 2 against chapter 9, which is exactly the kind of cross-scope problem data-flow analysis exists to solve.",
    ],
    commonMistakes: [
      "Applying an algebraic simplification that's only valid for exact (integer) arithmetic to floating-point code, where IEEE 754 edge cases (NaN, signed zero, overflow) can break the assumed equivalence.",
      "Assuming peephole optimization alone can catch issues that genuinely require whole-program or whole-function reasoning (like whether a computed value is ever actually used again).",
      "Misidentifying basic block boundaries - forgetting that a jump TARGET (even mid-function) starts a new basic block, since it's a possible entry point other instructions can branch to.",
    ],
    memoryTricks: [
      "\"Basic block: one way in, one way out, no surprises in between.\" The property that makes local optimization safe.",
      "Peephole = small sliding WINDOW, local patterns only - never the whole picture at once.",
    ],
    formulas: [],
    shortcuts: [
      "To quickly identify basic block boundaries in a given instruction sequence, mark every jump TARGET as starting a new block, and every jump/branch INSTRUCTION as ending the current block - this mechanical rule handles almost every boundary case.",
      "For a peephole-optimization question, look specifically for a KNOWN pattern name (constant folding, algebraic simplification, strength reduction, redundant load elimination) rather than trying to invent a novel transformation - GATE questions test recognition of these standard patterns.",
    ],
    pyqRelevance: `Basic block identification (given a code fragment, mark block boundaries) and recognising specific peephole optimization patterns (constant folding, algebraic simplification) are common, moderate-difficulty GATE questions in this topic, often as a lead-in to a data-flow-analysis question on the same code.`,
    interviewConnection: `Basic blocks and peephole optimization are exactly the concepts behind real compiler backend passes (LLVM's peephole optimizer, for instance), and understanding local optimization's ceiling is what motivates why real compilers ALSO need whole-function data-flow analysis passes.`,
    revisionSummary: `Basic block: one entry, one exit, fixed internal order - the natural scope for local optimization.

Peephole optimization: sliding window, catches redundant load/store, constant folding, algebraic simplification, strength reduction.

Local optimization can't see across blocks - motivates data-flow analysis (Liveness, Constant Propagation, CSE) for cross-block questions.`,
    shortNotes: {
      oneMinute: "Basic block: one entry, one exit, fixed order inside. Peephole optimization: sliding window, catches constant folding, algebraic simplification, strength reduction, redundant load/store elimination. Local optimization can't see across blocks - motivates data-flow analysis for cross-block questions.",
    },
    mcqs: [
      {
        question: "What defines a basic block?",
        options: [
          "Exactly one instruction",
          "A sequence with one entry point and one exit point, no internal branches",
          "Any sequence of instructions between two function calls",
          "A block containing exactly one loop",
        ],
        correctIndex: 1,
        explanation: "A basic block is a maximal instruction sequence with exactly one entry (the first instruction) and one exit (the last instruction) - no jumps into its middle, no jumps out except at the end, guaranteeing a fixed internal execution order.",
      },
    ],
    numericals: [],
  },

  "constant-propagation": {
    difficulty: "Moderate",
    estimatedMinutes: 25,
    whatYoullLearn: [
      "What constant propagation actually does, beyond simple local constant folding",
      "Why this requires data-flow analysis across the whole control flow graph, not just one block",
      "The specific data-flow equations that compute which variables are constant at each program point",
      "Why a conditional branch can make a variable's 'constant-ness' path-dependent",
    ],
    prerequisites: ["Local Optimisation"],
    concept: `## Beyond One Block: Propagating Known Values Across The Program

::: story
Constant propagation determines, for EVERY point in the program, whether a variable is guaranteed to hold a specific KNOWN CONSTANT value there - and if so, replaces uses of that variable with the constant directly, which often then enables further constant FOLDING (see Local Optimisation) that wasn't visible before.
:::

::: remember
This is genuinely different from local constant folding: folding handles \`t1 = 2 + 3\` INSIDE one instruction; constant propagation tracks a constant's value as it flows THROUGH multiple instructions and even across basic block boundaries in the control flow graph - \`x = 5; ... ; y = x + 1;\` requires propagation to recognize y is also a compile-time-known constant (6), possibly several blocks later.
:::

## Why It Needs The Whole Control Flow Graph

::: flow
1. A variable is assigned a constant :: e.g. x = 5 in some block.
2. That fact must be tracked FORWARD :: through every path in the control flow graph the program might take from that assignment onward.
3. At each USE of x :: check whether EVERY path reaching this point agrees x still holds the same constant value - if any path disagrees (or reassigns x to something non-constant), x is NOT safely constant here.
4. Only if EVERY path agrees :: is it safe to replace that specific use of x with the literal constant value.
:::

::: mistake
Propagating a constant past a program point where DIFFERENT paths disagree on its value. If one branch sets x=5 and another sets x=7, then at the point where those branches merge, x is NOT a known constant (it could be either) - propagating either value forward from the merge point would be incorrect.
:::

## Conditional Branches Make It Path-Dependent

::: story
\`if (cond) x = 5; else x = 7; print(x);\` - x is NOT provably constant at the print statement, because which branch executed depends on a runtime condition the compiler can't necessarily determine. Constant propagation must correctly recognize this as "not constant" rather than incorrectly picking one branch's value.
:::

::: checkpoint
In the code \`x = 3; if (cond) x = x + 1; print(x);\`, is x provably constant (a single known value) at the print statement?
- (x) No - it's 3 on one path and 4 on the other, so it's not a single known constant at the merge point
- ( ) Yes, it's always 4
- ( ) Yes, it's always 3
- ( ) Cannot be determined without knowing cond's actual value
> Two paths reach the print statement: one where the if-branch executed (x=4) and one where it didn't (x=3). Since these disagree, constant propagation correctly concludes x is NOT a single known constant at that point - it must NOT be replaced with a literal value there.
:::`,
    keyPoints: [
      "Constant propagation tracks whether a variable holds a known constant value at every program point, across the whole control flow graph - not just within one instruction or basic block.",
      "It's distinct from local constant folding (which handles a single instruction's known-constant operands) - propagation is what makes previously-invisible folding opportunities appear, possibly blocks later.",
      "At a point where multiple control-flow paths merge, a variable is only safely constant if EVERY incoming path agrees on the same value.",
      "Conditional branches make constant-ness genuinely path-dependent - the compiler cannot assume one branch's outcome over another's.",
    ],
    analogies: [
      "Constant propagation is like verifying a rumour by checking whether EVERY possible source confirms the exact same story - if even one path tells a different version, you can't treat it as a confirmed fact at the point where the stories converge.",
    ],
    commonMistakes: [
      "Confusing constant propagation (whole-program, data-flow-based) with constant folding (single-instruction, purely local) - they work together but are genuinely different techniques.",
      "Incorrectly propagating a constant past a merge point where different paths actually disagree on the variable's value.",
      "Assuming a variable set inside a conditional branch is always constant afterward, ignoring the case where the branch might not execute at all.",
    ],
    memoryTricks: [
      "\"Folding: one instruction, offline arithmetic. Propagation: whole program, tracking a fact across the map.\" Different scopes, same underlying goal.",
      "Merge point rule: constant only if EVERY incoming path agrees - one disagreement kills it.",
    ],
    formulas: [],
    shortcuts: [
      "For a constant-propagation trace question, explicitly draw out EVERY path reaching the point in question and compare their values - don't just trace one path and assume it generalises.",
      "If a variable's assignment is inside a conditional branch and used AFTER the branch merges back, immediately suspect it is NOT provably constant unless every branch (including any implicit 'no branch taken' path) assigns the exact same value.",
    ],
    pyqRelevance: `Constant propagation is tested via small control-flow-graph tracing questions (given a CFG with branches, determine which variables are provably constant at a specific point) - a moderate-difficulty, conceptually rich GATE question type.`,
    interviewConnection: `Constant propagation is a standard compiler optimization pass (present in virtually every real compiler), and reasoning about "does every path agree" is the same fundamental reasoning used in static analysis tools that flag potentially-uninitialized variables or null-pointer risks.`,
    revisionSummary: `Constant propagation tracks known-constant values across the WHOLE control flow graph, not just one instruction (folding) or one block.

At a merge point, a variable is constant only if EVERY incoming path agrees on the same value - conditional branches make constant-ness genuinely path-dependent.`,
    shortNotes: {
      oneMinute: "Constant propagation: tracks known-constant values across the whole CFG (not just one instruction=folding, or one block). At a merge point, constant only if EVERY incoming path agrees on the same value. Conditional branches make constant-ness path-dependent - don't assume one branch's outcome.",
    },
    mcqs: [
      {
        question: "At a point where two control-flow paths merge, one setting x=5 and the other setting x=6, what does constant propagation conclude about x?",
        options: ["x = 5", "x = 6", "x is not a known constant at this point", "x = 5.5 (averaged)"],
        correctIndex: 2,
        explanation: "Since the two incoming paths disagree on x's value, constant propagation correctly concludes x is NOT provably a single known constant at the merge point - it must not be replaced with either literal value there.",
      },
    ],
    numericals: [],
  },

  "liveness-analysis": {
    difficulty: "Hard",
    estimatedMinutes: 30,
    whatYoullLearn: [
      "What it means for a variable to be 'live' at a program point, precisely",
      "Why liveness analysis is a BACKWARD data-flow analysis, unlike constant propagation's forward direction",
      "The exact data-flow equations (use/def, IN/OUT) that compute liveness",
      "Why liveness analysis is essential for register allocation and dead code elimination",
    ],
    prerequisites: ["Constant Propagation"],
    concept: `## Live: Will This Value Actually Be Used Again?

::: remember
A variable is LIVE at a program point if its CURRENT value might still be USED along SOME path forward from that point, before being overwritten. A variable is DEAD at a point if its current value is guaranteed to never be read again before it's next written - meaning it's safe to discard, reuse its storage, or eliminate the computation that produced it.
:::

## Backward, Not Forward: The Key Direction Flip

::: mistake
Assuming liveness analysis flows FORWARD through the program like constant propagation does. It's the OPPOSITE: whether a variable is live at a point depends on what happens LATER in the program (is it used somewhere ahead?), so the data-flow equations propagate information BACKWARD, from a program's later points toward its earlier ones.
:::

::: cards The data-flow equations
use[B] :: Variables USED in block B BEFORE any redefinition within B - read before written, in this block.
def[B] :: Variables DEFINITELY ASSIGNED in block B before any use within B - written before read, in this block.
IN[B] = use[B] union (OUT[B] - def[B]) :: A variable is live entering B if B itself uses it before overwriting it, OR it's live leaving B and B doesn't kill it first.
OUT[B] = union of IN[S] for every successor block S :: A variable is live leaving B if it's live entering ANY block B can flow into next.
:::

::: remember
These equations are solved ITERATIVELY, propagating backward from a program's exit until IN and OUT stop changing (reach a fixed point) - a single backward pass isn't generally enough when the control flow graph has loops.
:::

## Why Liveness Matters: Two Direct Applications

::: cards
Register allocation :: Two variables can safely share the SAME physical register only if their live RANGES never overlap - liveness analysis is the exact information that makes this decision correct.
Dead code elimination :: An assignment to a variable that is DEAD immediately afterward (never used before being overwritten or the program ends) can be safely REMOVED entirely - it computes a value nobody will ever read.
:::

::: checkpoint
Variable x is assigned a value in block B, but no path from B ever reads x again before it's reassigned or the program ends. Is x live at the END of block B?
- ( ) Yes, because it was just assigned
- (x) No - x is DEAD at that point, since its value is never used along any forward path
- ( ) Only if x is a global variable
- ( ) Cannot be determined without knowing x's data type
> Liveness depends entirely on whether the CURRENT value might be used later on SOME path - here, no path ever reads x again, so it is dead (not live) at the end of B, regardless of the fact that it was just assigned.
:::`,
    keyPoints: [
      "A variable is live at a point if its current value might be used along some forward path before being overwritten; dead if guaranteed never to be read again first.",
      "Liveness analysis is a BACKWARD data-flow analysis - information propagates from later program points to earlier ones, the opposite direction from constant propagation.",
      "use[B]: variables read before any redefinition in B. def[B]: variables written before any use in B. IN[B] = use[B] union (OUT[B] - def[B]). OUT[B] = union of IN[S] over successors S.",
      "These equations are solved iteratively to a fixed point, needed whenever the control flow graph contains loops.",
      "Direct applications: register allocation (non-overlapping live ranges can share a register) and dead code elimination (an assignment dead immediately after can be removed).",
    ],
    analogies: [
      "Liveness analysis is like checking, at every point in a recipe, whether an ingredient you just measured out will actually be used again later in the recipe - if not, you can put it away (free the register/storage) right now instead of holding onto it uselessly.",
    ],
    commonMistakes: [
      "Assuming liveness flows forward through the program, when it's actually a backward analysis by definition (depends on future use).",
      "Forgetting that use[B] specifically means used BEFORE any redefinition within B - a variable both read and then reassigned within the same block only counts toward use[B] for the read that happens first.",
      "Solving the data-flow equations in a single pass without iterating to a fixed point, which produces wrong results whenever the control flow graph contains a loop (a variable's liveness can depend on itself through the loop).",
    ],
    memoryTricks: [
      "\"Liveness looks AHEAD, but computes BACKWARD.\" What it determines is forward-looking; how it's computed is backward-propagating.",
      "IN = use here, OR (live-out here MINUS what I kill). The whole equation is 'either I need it myself, or I pass through something I don't overwrite'.",
    ],
    formulas: [
      "IN[B] = use[B] union (OUT[B] - def[B]).   OUT[B] = union over all successors S of B of IN[S].",
    ],
    shortcuts: [
      "For a liveness-analysis question on a CFG, work BACKWARD from the exit block explicitly, and iterate the whole pass at least twice if the graph has any loop - a single forward-looking guess is a common, avoidable error.",
      "For a quick 'is this assignment dead code' check, look immediately for ANY subsequent read of that variable along ANY path before the next write or program exit - if none exists on any path, it's dead.",
    ],
    pyqRelevance: `Liveness analysis is tested via computing IN/OUT sets for a small given control flow graph (a heavier, high-value numerical), and via dead-code-elimination or register-allocation-motivated conceptual questions built on the same liveness concept.`,
    interviewConnection: `Liveness analysis is the exact algorithm real compiler register allocators (like graph-coloring allocators) are built on, and understanding "backward data-flow" is directly relevant to any static-analysis tool reasoning about resource usage or variable lifetimes.`,
    revisionSummary: `Live at a point: current value might be used forward before being overwritten. Dead: guaranteed not to be read again first.

Backward data-flow analysis (opposite direction from constant propagation): IN[B]=use[B] union (OUT[B]-def[B]), OUT[B]=union of successors' IN. Solved iteratively to a fixed point for graphs with loops.

Applications: register allocation (non-overlapping live ranges share a register) and dead code elimination (dead assignments removed).`,
    shortNotes: {
      oneMinute: "Live: value might be used forward before being overwritten. Dead: guaranteed not read again first. BACKWARD data-flow (opposite of constant propagation). IN[B]=use[B] union (OUT[B]-def[B]). OUT[B]=union of successors' IN[S]. Iterate to fixed point (loops). Used for: register allocation, dead code elimination.",
    },
    mcqs: [
      {
        question: "Liveness analysis propagates information in which direction through the control flow graph?",
        options: ["Forward, from entry to exit", "Backward, from exit to entry", "Both directions simultaneously", "It doesn't use the control flow graph"],
        correctIndex: 1,
        explanation: "Liveness depends on whether a value is used LATER (in the future relative to the current point), so the data-flow equations must propagate that information backward, from later points in the program to earlier ones.",
      },
    ],
    numericals: [],
  },

  "common-subexpression-elimination": {
    difficulty: "Moderate",
    estimatedMinutes: 25,
    whatYoullLearn: [
      "What counts as a 'common subexpression', precisely",
      "Available expressions analysis, the data-flow technique CSE is built on",
      "Why CSE must verify NEITHER operand was reassigned between the two computations",
      "Local CSE (within a block) vs global CSE (across the control flow graph)",
    ],
    prerequisites: ["Liveness Analysis"],
    concept: `## Don't Compute The Same Thing Twice

::: story
Common Subexpression Elimination (CSE) finds places where the SAME expression is computed more than once with NO change to its operands in between, and replaces the second (redundant) computation with a reuse of the first result - pure waste elimination, computing exactly what was needed and no more.
:::

::: remember
An expression is a genuine "common subexpression" only if it's computed again with operands that are PROVABLY UNCHANGED since the first computation. \`t1 = a + b; ... ; t2 = a + b;\` is only safely eliminable if NEITHER a NOR b was reassigned anywhere between those two points, on every path.
:::

## Available Expressions: The Data-Flow Foundation

::: cards
Available expression, defined :: An expression a+b is AVAILABLE at a point if it has been computed on EVERY path reaching that point, and neither a nor b has been reassigned since that computation, on any of those paths.
Why this needs data-flow analysis :: Just like constant propagation, determining availability at a given point can depend on merging information from MULTIPLE incoming control-flow paths - a FORWARD data-flow analysis (values become available moving forward, following computation, unlike liveness's backward direction).
:::

::: mistake
Eliminating a "duplicate" computation of a+b without checking whether a or b was reassigned in between - if either operand changed, the second a+b computes a genuinely DIFFERENT value, and treating it as reusable is a correctness bug, not just a missed optimization.
:::

## Local vs Global CSE

::: flow
Local CSE :: Scoped to ONE basic block - straightforward, since execution order within a block is fixed and fully known (same reasoning as Local Optimisation generally).
Global CSE :: Spans MULTIPLE basic blocks across the control flow graph - requires the full available-expressions data-flow analysis, since a computation's availability at a later block depends on what happened along EVERY path reaching it.
:::

::: checkpoint
In the sequence \`t1 = a + b; a = 5; t2 = a + b;\`, is the second \`a + b\` a valid common subexpression to eliminate (reuse t1)?
- ( ) Yes, both compute a+b
- (x) No - a was reassigned between the two computations, so the second a+b uses a DIFFERENT value of a
- ( ) Only if b was also reassigned
- ( ) Cannot be determined
> Even though both instructions textually compute "a + b", a was reassigned to 5 in between - the second computation uses this NEW value of a, producing a genuinely different result. This is not a valid common subexpression, and eliminating it would be an incorrect optimization.
:::`,
    keyPoints: [
      "CSE finds a repeated computation of the same expression with provably unchanged operands, and reuses the first result instead of recomputing.",
      "Available expressions: an expression is available at a point if computed on EVERY path reaching it, with neither operand reassigned since, on any of those paths.",
      "Available-expressions analysis is a FORWARD data-flow analysis - the opposite direction from liveness analysis's backward propagation.",
      "Local CSE: scoped to one basic block, straightforward given fixed internal order. Global CSE: spans the whole control flow graph, requires full data-flow analysis.",
      "A duplicate-looking expression is NOT safely eliminable if either operand was reassigned anywhere between the two computations on any relevant path.",
    ],
    analogies: [
      "CSE is like refusing to recompute a tip you already calculated on a receipt, as long as neither the bill total nor the tip percentage changed since - but the moment either input changes, the old calculation is stale and must be redone, not reused.",
    ],
    commonMistakes: [
      "Eliminating a repeated expression without verifying BOTH operands are unchanged since the earlier computation - a single reassignment of either operand invalidates the reuse.",
      "Confusing available-expressions analysis's FORWARD direction with liveness analysis's BACKWARD direction - the two are opposite in exactly this respect, despite both being data-flow analyses.",
      "Applying only local (single-block) CSE reasoning to a case that actually spans multiple blocks, missing redundant computations that a full global analysis would catch.",
    ],
    memoryTricks: [
      "\"Same expression, unchanged operands, no redefinition in between - THEN it's safe to reuse.\" All three conditions, every time.",
      "Available expressions: FORWARD (like constant propagation). Liveness: BACKWARD. Two data-flow analyses, opposite directions.",
    ],
    formulas: [],
    shortcuts: [
      "For a CSE question, explicitly trace every assignment to BOTH operands between the two candidate computations before concluding they're eliminable - don't just pattern-match on the expression's TEXT looking the same.",
      "If a question spans multiple basic blocks (with branches), immediately treat it as a global CSE question requiring available-expressions data-flow reasoning, not simple local pattern matching.",
    ],
    pyqRelevance: `CSE questions typically give a short code sequence (sometimes with a conditional branch specifically designed to break naive elimination) and ask which computations are safely eliminable - a moderate-difficulty, detail-sensitive GATE question type.`,
    interviewConnection: `Common subexpression elimination is a standard compiler optimization present in essentially every real optimizing compiler, and reasoning carefully about "did anything change in between" is the same discipline needed when caching/memoizing values in real application code.`,
    revisionSummary: `CSE reuses a prior computation only if the expression is IDENTICAL and both operands are PROVABLY unchanged since.

Available expressions: FORWARD data-flow analysis (opposite of liveness's backward direction) - an expression is available at a point only if computed on every path reaching it, with no operand reassignment since, on any path.

Local CSE: one block, straightforward. Global CSE: whole CFG, needs full data-flow analysis.`,
    shortNotes: {
      oneMinute: "CSE: reuse a prior computation only if expression is identical AND both operands provably unchanged since. Available expressions: FORWARD data-flow (opposite of liveness's backward). Available at a point only if computed on EVERY path reaching it, no operand reassigned since. Local CSE: one block. Global CSE: whole CFG, needs data-flow analysis.",
    },
    mcqs: [
      {
        question: "Available-expressions analysis (the foundation of global CSE) propagates information in which direction?",
        options: ["Backward, like liveness analysis", "Forward, following the direction of computation", "Randomly, depending on the CFG shape", "It doesn't require a control flow graph"],
        correctIndex: 1,
        explanation: "Available-expressions analysis is a forward data-flow analysis - an expression becomes 'available' after it's computed, and that fact propagates forward to later program points, the opposite direction from liveness analysis.",
      },
    ],
    numericals: [],
  },

};
