// NLP - rewritten lesson bodies. See operating-systems.mjs for the authoring
// rules. This subject has an unusually strong natural spine: each text
// representation exists to fix a specific, nameable limitation of the previous
// one. Every lesson states which limitation it's answering, because that chain
// is both the best way to learn it and exactly what interviews ask for.

export const NLP = {
  "introduction-to-nlp": {
    concept: `## Why Language Is Hard

::: story
"I deposited money at the bank." "I sat by the river bank."

Same four letters, two unrelated meanings, and nothing in the word itself distinguishes them. Only the surrounding words do.

Which is the whole problem in one example: literal matching cannot resolve meaning, because meaning isn't in the token.
:::

**Natural Language Processing** is getting computers to understand and generate human language - and it's hard for reasons that compound.

::: cards What makes it resist
Ambiguity :: One word, several meanings, resolvable only from context.
Inconsistency :: Real text has typos, missing punctuation, and grammar nobody would defend.
Idiom and sarcasm :: "That went well" can mean the opposite, and nothing in the words says so.
Constant change :: Slang and usage shift faster than any hand-written dictionary.
:::

## The Historical Arc

::: timeline Three eras
Rule-based :: Hand-written grammars and dictionaries. Precise where the rules fit, and brittle everywhere else.
Statistical :: Learn patterns from large text corpora instead of writing rules. Bag-of-Words and TF-IDF, two lessons ahead.
Deep learning :: Embeddings, then RNNs, then transformers. What drove the recent visible progress.
:::

::: remember
And notice the same shift the AI subject describes: data-driven approaches overtook hand-written rules once enough data and compute existed.

Not a coincidence specific to language. It's what happens whenever a problem's real difficulty is messy ambiguity rather than missing logic.
:::

::: checkpoint
How does NLP relate to machine learning?
- ( ) They're unrelated fields
- (x) NLP is an application area on top of ML - its distinct contribution is turning text into numbers ML can work with
- ( ) ML is a subset of NLP
- ( ) NLP only uses hand-written rules
> An application area. The learning machinery is the ML subject's; NLP's own problem is representation - which is what the next four lessons are entirely about.
:::

::: behind
That framing tells you what to expect from this subject.

Gradient descent, classification and neural networks all arrive unchanged from the ML subject. What's new here is a sequence of increasingly good answers to one question: how do you turn a sentence into a vector without throwing away what it meant?
:::`,
  },

  "text-preprocessing-tokenization": {
    concept: `## Before Anything Numeric

::: story
A model cannot consume a sentence. It consumes numbers.

Which means before any learning happens, text has to be broken into units and cleaned up - and the decisions made here quietly constrain everything downstream.
:::

**Tokenization** is the first step: splitting text into tokens.

::: cards Two granularities
Word tokens :: "the cat sat" becomes ["the", "cat", "sat"]. Intuitive, and helpless against a word it has never seen.
Sub-word tokens :: "unhappiness" becomes ["un", "happi", "ness"]. Handles unknown words by decomposing them into familiar pieces.
:::

::: remember
The unknown-word problem is why modern systems use sub-words.

With whole-word tokens, any word absent from the training vocabulary becomes a single "unknown" placeholder - all information gone. Sub-words degrade gracefully instead: an unfamiliar word still decomposes into pieces the model has seen.
:::

## Cleaning Up

::: cards Standard steps
Lowercasing :: "Cat" and "cat" become one token rather than two unrelated vocabulary entries.
Stop-word removal :: Drop very common, low-information words - "the", "is", "a".
Stemming :: Chop to a root by fast pattern rules. "running", "runs" → "run". Crude, and can produce non-words.
Lemmatization :: Reduce to a real dictionary base form using linguistic knowledge. Slower, and correct.
:::

::: checkpoint
Stemming turns "studies" into "studi". Is that a bug?
- ( ) Yes - it should be "study"
- (x) No - stemming is deliberately crude and consistent, and "studi" groups the right words even though it isn't a word
- ( ) Yes, stemming is always wrong
- ( ) It depends on the language
> Working as designed. Consistency matters more than validity - "studies" and "studying" both reaching "studi" is the actual goal. Use lemmatization when you need real words out.
:::

::: mistake
Stop-word removal is applied reflexively and is sometimes wrong.

"To be or not to be" is *entirely* stop words. So is "not good" - and removing "not" from a sentiment task inverts the label you were trying to predict.

Whether a word is low-information depends on the task, not on a list.
:::

::: behind
**Byte-pair encoding** is how sub-word vocabularies are actually built, and it's learned rather than designed.

Start from characters, repeatedly merge the most frequently co-occurring pair into a new token, stop at a target vocabulary size. Common words end up as single tokens; rare ones decompose.

Which balances whole-word tokenization's brittleness against character-level tokenization's impractically long sequences.
:::`,
  },

  "bag-of-words-tf-idf": {
    concept: `## Counting Words

::: story
The simplest way to turn a document into numbers: build a vocabulary of every word you've seen, then count occurrences.

"the cat sat on the mat" becomes {the: 2, cat: 1, sat: 1, on: 1, mat: 1}.

It's called **Bag-of-Words** because that's exactly what it is - a bag. Order thrown away, contents counted.
:::

Crude, and genuinely effective for topic classification and spam filtering, where which words appear matters more than their arrangement.

## What Counts Get Wrong

::: story
Count words across a document collection and "the" wins every time, in every document, by a wide margin.

It's also the least informative word available. Raw frequency measures the wrong thing.
:::

::: cards TF-IDF, two factors multiplied
Term frequency :: How often the word appears in *this* document. Higher suggests it matters here.
Inverse document frequency :: A penalty for appearing in *many* documents. "the" is everywhere, so it's penalised heavily.
:::

::: remember
The product is high for words frequent in one document and rare across the collection - which is precisely the definition of a word that characterises that document.

"the" has enormous term frequency and near-zero IDF. "mitochondria" has modest term frequency and huge IDF. TF-IDF ranks the second one higher, which is what you wanted.
:::

## The Limitation Both Share

::: story
"dog bites man" and "man bites dog" contain identical words in identical quantities.

Bag-of-Words gives them the same vector. TF-IDF gives them the same vector. Every order-blind representation must, and the two sentences describe very different afternoons.
:::

::: checkpoint
Why can't TF-IDF distinguish those two sentences?
- ( ) The vocabulary is too small
- (x) Both are word-frequency representations, and the sentences have identical word frequencies
- ( ) TF-IDF needs more training data
- ( ) It can, with the right weighting
> Frequency is all either one measures. No weighting scheme over counts can recover order, because order was discarded before the weighting - which is what motivates the sequence models later in this subject.
:::

::: behind
**N-grams** are the cheap partial fix: count consecutive pairs or triples rather than single words.

"dog bites man" then contains the bigram "dog_bites", which "man bites dog" doesn't - so some local order survives.

Vocabulary size grows quickly, and it's a genuine improvement for a small change. Still nowhere near a model that reads the sentence in order.
:::`,
  },

  "word-embeddings": {
    concept: `## Words That Know They're Related

::: story
Bag-of-Words has a second problem, separate from order.

"happy" and "joyful" occupy different dimensions of the vector, with no relationship between them whatsoever. To the model they're as unrelated as "happy" and "carburettor".

Every synonym is a stranger.
:::

**Word embeddings** fix that: each word becomes a dense vector - a few hundred numbers - positioned so that words with similar meanings sit close together.

## How Meaning Gets Learned

::: story
The principle is a linguist's line from 1957: *you shall know a word by the company it keeps.*

Words appearing in similar contexts tend to mean similar things. So train a model to predict a word from its neighbours, and words that are interchangeable in context are pushed toward similar vectors - because that's what makes the prediction work.

Nobody defines "happy". The vector emerges from the company the word keeps.
:::

::: remember
Which is worth being clear about: embeddings are **learned**, not designed. Word2Vec and its successors are trained by gradient descent, exactly as in the ML subject.

The semantic structure is a by-product of optimising a prediction task over a large corpus.
:::

::: didyouknow
The famous demonstration: **vector("king") − vector("man") + vector("woman") ≈ vector("queen")**.

Nobody encoded gender or royalty. The relationship emerged from statistical patterns in text, and it's genuinely surprising that arithmetic on learned vectors respects analogy at all.
:::

::: checkpoint
What would similar vectors for "happy" and "joyful" gain a sentiment classifier?
- ( ) Nothing - it needs exact matches
- (x) It can generalise to "joyful" from having seen "happy" in training, rather than treating it as unknown
- ( ) It reduces the vocabulary size
- ( ) It removes the need for training data
> Generalisation across synonyms. With Bag-of-Words, a word absent from training carries no signal at all; with embeddings, being *near* a known word is itself informative.
:::

::: behind
Classic embeddings have one fixed vector per word, which is the limitation the next two lessons remove.

"bank" gets a single vector averaging the river and the financial senses - a compromise that is wrong in both contexts.

**Contextual** embeddings, produced by transformers, compute a different vector for the same word depending on the sentence it's in. Which is the last step of this progression, and the largest.
:::`,
  },

  "sequence-models-rnns": {
    concept: `## Reading In Order

::: story
"The movie was not good."

Every word here is individually mild. The meaning turns entirely on "not" preceding "good" - and no representation that treats words as an unordered set can see that.

To catch it, a model has to read the sentence in order and carry what it read forward.
:::

A **recurrent neural network** does exactly that: it processes one token at a time, maintaining a **hidden state** it updates at each step.

::: flow
"the" -> state -> "movie" -> state -> "was" -> state -> "not" -> state -> "good"
:::

At each step the RNN combines the current token's embedding with the state carried from the previous step. By the end, the state reflects the whole sequence in order.

::: remember
Which is the first architecture in this subject where word order genuinely affects the output.

Embeddings gave each word meaning. An RNN gives the *sentence* meaning, by reading it as a sequence rather than a set.
:::

## Where It Struggles

::: story
"The cat, which had spent the entire afternoon asleep in the warm patch of sun by the kitchen window, was tired."

"was" agrees with "cat", twenty words earlier. For an RNN, that information has been passed hand-to-hand through twenty state updates, degrading at each one.
:::

::: cards The vanishing gradient problem
What happens :: During backpropagation across many steps, the gradient shrinks toward zero before reaching early positions.
What it means :: Early-sequence weights barely update, so long-range dependencies are effectively unlearnable.
The mitigation :: LSTM and GRU add gating that lets the network explicitly keep or discard information across many steps.
:::

::: checkpoint
Why do LSTMs handle long sequences better than plain RNNs?
- ( ) They process sequences faster
- (x) Gating lets information persist across many steps without being repeatedly transformed, so the gradient survives further back
- ( ) They use larger embeddings
- ( ) They read the sequence backward
> A path for information to persist rather than being rewritten every step. Mitigation rather than a cure - which is why transformers took a different route entirely.
:::

::: behind
**Bidirectional** RNNs run the sequence forward and backward, combining both states - so a word's representation can use context from *after* it too.

Useful for tagging tasks where later words disambiguate earlier ones. Useless for generation, where later words don't exist yet, which is a distinction worth keeping.
:::`,
  },

  "transformers-modern-nlp": {
    concept: `## Everything At Once

::: story
An RNN has two problems, and one of them is about training rather than accuracy.

Step 5 needs step 4's output, which needs step 3's. The computation is inherently sequential, so it cannot be parallelised - which caps how much data you can train on regardless of how many GPUs you own.

And long-range dependencies still degrade, gating or not.
:::

**Transformers** replace sequential processing with **self-attention**: every word looks at every other word directly, all at once.

::: story
"The cat sat on the mat because it was tired."

What does "it" refer to? Self-attention lets "it" attend directly to "cat" and weigh it heavily - one operation, no chain of intermediate states, and the distance between them costs nothing.

An RNN would have to carry "cat" forward through six updates and hope it survived.
:::

::: cards What that buys
Parallel training :: Every position is computed simultaneously, so training scales with hardware. This is what made models this size possible at all.
Direct long-range links :: Any two positions are one attention step apart, regardless of separation.
:::

::: checkpoint
Which transformer advantage most enabled today's large language models?
- ( ) Better accuracy per parameter
- (x) Parallelisable training - sequential RNNs couldn't consume corpora this large in any feasible time
- ( ) Smaller model size
- ( ) Not needing tokenization
> Parallelism. The architecture is what made training on internet-scale text tractable - the capability followed from the scale, and the scale followed from being able to parallelise.
:::

## Pre-train, Then Fine-tune

::: cards Two stages
Pre-training :: On an enormous general corpus, learning broad language patterns and world knowledge. Expensive, done once.
Fine-tuning :: A much lighter pass on a small task-specific dataset - sentiment, classification, your domain.
:::

::: remember
Which is why you don't train a language model from scratch. You take a pre-trained one and adapt it, and the adaptation needs orders of magnitude less data and compute.

The train/validation/test discipline from the ML subject applies unchanged to that fine-tuning step.
:::

::: behind
Two architectural families, same attention mechanism.

**Encoder-only** models like BERT build a rich representation of a complete input, suited to classification - they see the whole sentence at once.

**Decoder-only** models like the GPT family generate one token at a time, each conditioned on everything generated so far - which is what makes them generative, and why they can't see the future while writing.
:::`,
  },

  "sentiment-analysis-pos-tagging": {
    concept: `## Two Concrete Tasks

::: story
Everything so far has been representation. These are two things you actually do with it - and the first is the most deployed NLP application there is.
:::

::: cards
Sentiment analysis :: Classify a text's sentiment - positive, negative, neutral. A classification problem from the ML subject, applied to a text representation from this one.
POS tagging :: Label each word's grammatical role. "The/DET cat/NOUN sat/VERB quickly/ADVERB".
:::

## Why Grammar Helps

::: story
"I set a new record." "Please record the meeting."

Same spelling, different word entirely - noun in one, verb in the other, and the meanings are unrelated.

POS tagging resolves that, which is why it's useful as a preprocessing step rather than only as a standalone tool.
:::

::: remember
And note POS tagging is a case where **bidirectional** context earns its place. A word's grammatical role often depends on what follows it as much as what precedes it - which is exactly what a bidirectional model provides.
:::

## The Whole Pipeline

::: timeline From raw text to a prediction
Preprocess :: Tokenise, lowercase, handle unknown words. Lesson two.
Represent :: TF-IDF for a cheap strong baseline, or a transformer for context-aware representations. Lessons three to six.
Classify :: Feed the representation to a classifier. The ML subject's material, unchanged.
Evaluate :: Precision and recall, not accuracy - review datasets are usually imbalanced.
:::

::: checkpoint
For sentiment on 500 labelled reviews, what's the sensible first attempt?
- ( ) Train a transformer from scratch
- (x) TF-IDF with a simple classifier - it's a strong baseline and 500 examples won't train anything large
- ( ) Hand-written rules only
- ( ) Collect a million more reviews first
> TF-IDF plus logistic regression, as a baseline. It's fast, often surprisingly competitive, and gives you a number to beat before reaching for a fine-tuned transformer.
:::

::: mistake
Reaching for the most sophisticated representation first is the common instinct and usually the wrong order.

Without a baseline you can't tell whether the transformer helped. And TF-IDF wins often enough on small, domain-specific datasets that skipping it means occasionally shipping something worse for considerably more effort.
:::

::: behind
**Named entity recognition** is the third task in this family: tagging spans as PERSON, ORGANIZATION, LOCATION.

Used both standalone - pulling structured records out of unstructured text, which connects to the Data Mining subject - and as a preprocessing step. Same shape as POS tagging: label the pieces, then use the labels.
:::`,
  },

  "interview-questions": {
    concept: `## One Narrative, Not Eight Facts

::: story
NLP interviews reward a specific thing: being able to tell the progression as a story where each step fixes the last one's named failure.

Which is also the best way to remember it, so the preparation and the answer are the same work.
:::

::: reveal The progression, as one answer
"Bag-of-Words counts words. Simple, effective for topic tasks, and it discards order entirely - 'dog bites man' and 'man bites dog' are identical vectors.

TF-IDF fixes a different problem: raw counts make 'the' the most important word in every document. Weighting by inverse document frequency surfaces the words that actually distinguish a document.

Embeddings fix the fact that both treat every word as unrelated to every other - 'happy' and 'joyful' had nothing in common. Learned from context, so similar words end up with similar vectors.

RNNs fix order. A hidden state carried forward means 'not good' can differ from 'good' - and they train sequentially, so they don't parallelise, and long-range dependencies still fade.

Transformers fix both. Self-attention lets every word attend to every other directly and in parallel - which is what made training at today's scale possible."

Five steps, five named failures. That's the answer.
:::

## What To Have Ready

::: cards The four to have cold
The representation progression :: With the specific limitation each step addresses.
RNN limitations :: The hidden state mechanism, the vanishing gradient, and what LSTM gating does about it.
Self-attention :: Every position attending to every other, and that parallelism is the consequence that mattered.
An end-to-end pipeline :: Raw text to prediction, naming the technique at each stage.
:::

::: checkpoint
Why does "bank" get one Word2Vec vector but different transformer representations?
- ( ) Transformers have bigger vocabularies
- (x) Word2Vec assigns one fixed vector per word; a transformer computes a representation from the surrounding sentence, so context changes it
- ( ) Word2Vec can't represent "bank"
- ( ) They're the same
> Fixed versus contextual. This is the cleanest single question separating classic embeddings from transformer representations, and it's asked often.
:::

::: mistake
The weak version of these answers names techniques without their motivation - "then we use embeddings, then transformers" - which sounds like a syllabus.

Every step in this subject exists because someone hit a specific wall. Naming the wall is what makes the answer sound like understanding.
:::

::: behind
At specialist level, expect questions about **in-context learning**: a large pre-trained model performing a new task from a few examples in the prompt, with no gradient updates at all.

It wasn't designed for, isn't fully explained, and doesn't fit the train-then-fine-tune framing this subject describes - which makes it a genuinely open question rather than a technique, and worth being honest about as one.
:::`,
  },
};
