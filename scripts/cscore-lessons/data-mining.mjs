// Data Mining - rewritten lesson bodies. See operating-systems.mjs for the
// authoring rules. Several lessons here deliberately overlap the ML subject's
// algorithms - the distinction being emphasis (explaining a pattern versus
// predicting accurately), so each lesson says which one it's serving rather
// than re-deriving mechanics covered elsewhere.

export const DATA_MINING = {
  "introduction-to-data-mining-kdd": {
    concept: `## Ore From Rock

::: story
Mining moves an enormous volume of rock to extract a small amount of something valuable.

Data mining is the same proportion: a large volume of raw data, and buried in it, a few patterns worth acting on.
:::

**Data mining** finds useful, previously unknown patterns in large datasets - and it's one step inside a larger process, which is worth being precise about.

::: timeline The KDD pipeline
Selection :: Choose the relevant subset from a larger database.
Preprocessing :: Clean missing values, noise and inconsistencies. Next lesson.
Transformation :: Convert into a form suitable for mining - normalising ranges, encoding categories.
Data mining :: Apply the pattern-discovery algorithms. This is the step everyone means by "data mining".
Interpretation :: Decide whether the patterns found are meaningful or coincidence.
:::

::: remember
**Knowledge Discovery in Databases** is the whole pipeline; data mining is the middle step.

Which matters practically as well as terminologically: an impressive-looking pattern from a badly-selected or badly-cleaned dataset is worthless, and the last step is where you find that out - or don't.
:::

::: checkpoint
An algorithm reports that customers who buy sunscreen also buy ice cream. Which KDD stage decides whether this is useful?
- ( ) Selection
- ( ) Data mining
- (x) Interpretation - the pattern is real and may just mean "it was summer"
- ( ) Preprocessing
> Interpretation. The mining step finds correlations; deciding whether one is actionable or an artefact of something unmodelled requires domain knowledge the algorithm doesn't have.
:::

## Against Machine Learning

::: cards Same techniques, different emphasis
Machine learning :: Build a model that predicts accurately on new data. The prediction is the product.
Data mining :: Find and explain patterns already present in existing data. The *understanding* is the product.
:::

::: remember
Which is why this subject repeatedly favours simpler, more interpretable methods over marginally more accurate ones.

A model that predicts churn at 94% accuracy and can't say why is a good ML result and a poor data mining result - because nobody can act on it.
:::

::: behind
The boundary blurs constantly in practice, and healthily.

A customer segment discovered by clustering frequently becomes a feature fed into a downstream ML model - a data mining output becoming a machine learning input.

Which is the ML subject's feature engineering lesson viewed from the other side.
:::`,
  },

  "data-preprocessing": {
    concept: `## The Stage That Eats The Project

::: story
Real data arrives with missing fields, duplicate records, dates written three different ways, and values that are physically impossible.

Run a mining algorithm on it and you'll get patterns. They'll be patterns in the mess.
:::

::: cards Three preprocessing tasks
Cleaning :: Handle missing values - drop the record or estimate the value - and fix inconsistent formats and outright errors.
Integration :: Combine multiple sources into one consistent dataset, reconciling different naming, units and identifiers.
Reduction :: Shrink an unmanageable dataset while preserving its patterns, by sampling or by reducing dimensions.
:::

## Why Integration Is Harder Than It Sounds

::: story
The sales system calls it \`customer_id\`. The support system calls it \`cust_no\`. Both are integers, both identify customers, and they're not the same numbering scheme.

One system stores dates as DD/MM/YYYY, the other as YYYY-MM-DD. Both look valid. \`01/02/2024\` is ambiguous between them and will parse silently and wrongly.

One records weight in kilograms, the other in pounds, and neither says so.
:::

::: remember
None of these announce themselves as errors. They merge cleanly and produce a dataset that is quietly, consistently wrong - which is worse than one that fails loudly.
:::

::: checkpoint
Ten percent of records have a missing "age". What's the right response?
- ( ) Always drop those records
- ( ) Always fill with the average
- (x) It depends - dropping loses data and may bias the sample; filling invents values that can hide real variation
- ( ) Set them to zero
> A judgement call. If age is missing non-randomly - say, younger users skip it - dropping those records biases everything downstream. Setting zero is the one clearly wrong option, since it's a value the model will treat as real.
:::

::: mistake
Preprocessing routinely consumes most of a real project's time, and it's routinely planned as a quick preliminary.

The reason it can't be automated away: real data is messy in project-specific ways. There's no generic recipe, because the mess reflects how a particular organisation's particular systems evolved.
:::

::: behind
**Outlier handling** during preprocessing needs the most judgement of all.

A transaction a hundred times larger than typical might be a data-entry error worth removing - or a genuine high-value customer, or fraud.

Removing it is a decision about what the project can find later. Clean out the anomalies and the anomaly detection lesson has nothing left to detect.
:::`,
  },

  "association-rule-mining": {
    concept: `## What Gets Bought Together

::: story
A supermarket has millions of transactions. Hidden in them: which products people buy in combination.

That's worth money - for shelf placement, for bundling, for "customers also bought" on a website. And it's the classic data mining problem, usually called **market basket analysis**.
:::

Rules take the form {bread, butter} → {milk}: customers buying the first set often buy the second.

## Two Metrics, Both Necessary

::: cards
Support :: How often the items appear together across *all* transactions. Measures whether the rule happens enough to matter.
Confidence :: Among transactions containing the if-part, what fraction contain the then-part. Measures how reliably the rule holds.
:::

::: story
Both are needed because either alone misleads.

A rule with 100% confidence based on three transactions is reliable and irrelevant - low support means you'd be rearranging a shop for three people.

A rule with high support and 20% confidence describes a common pair of items that mostly don't appear together.
:::

## The Apriori Property

::: story
A shop with a thousand products has an astronomical number of possible item combinations. Checking each one's frequency is not an option.

The insight that makes it tractable: **if an itemset is infrequent, no larger set containing it can be frequent.**

Adding items can only make a combination rarer. So if {bread, caviar} appears rarely, {bread, caviar, milk} appears at most that rarely - and there is no need to check.
:::

::: remember
Which lets Apriori build upward - singles, then pairs, then triples - discarding any candidate containing a known-infrequent subset without ever measuring it.

Most of the search space is eliminated without being examined, which is what makes the problem finish.
:::

::: checkpoint
{milk, bread} is infrequent. What can you conclude about {milk, bread, eggs}?
- ( ) It might be frequent if eggs are popular
- (x) It cannot be frequent - it can only occur in the transactions where {milk, bread} already occurs
- ( ) Nothing without measuring it
- ( ) It's exactly as frequent
> Adding a condition can only reduce matches. Which is why the pruning is sound rather than a heuristic - it's a logical guarantee, not an estimate.
:::

::: behind
**Lift** is the metric that catches the trap confidence leaves open.

If 80% of all transactions include milk, then any rule → {milk} has at least 80% confidence automatically - not because of a relationship, but because milk is everywhere.

Lift compares the rule's confidence against that base rate. Above 1 means a real association; at 1, statistical independence dressed up as a finding.
:::`,
  },

  "classification-in-data-mining": {
    concept: `## Predicting, Or Explaining

::: story
The Machine Learning subject covers classification's mechanics in full - decision trees, evaluation, the lot.

This lesson is about why data mining uses it differently.
:::

::: story
Two teams build a churn classifier on the same data.

The ML team optimises accuracy and ships a gradient-boosted ensemble at 94%. It works, and it cannot say why any particular customer was flagged.

The data mining team builds a decision tree at 89%. It says: customers on monthly contracts paying over £70 with no bundled services churn at three times the base rate.

The second is less accurate and more useful, because the business can act on it. They can change the contract terms.
:::

::: remember
Which is the emphasis difference stated concretely: **data mining's product is an explanation, not a prediction.**

An accurate black box tells you who will churn. An interpretable model tells you what to change - and only one of those is a business decision.
:::

## Why Trees Dominate Here

::: cards Why decision trees dominate here
Traceable :: You can follow the exact path to any decision and read it aloud.
Expressible as rules :: The tree converts directly into if-then statements a non-technical stakeholder can review and argue with.
Feature importance visible :: Which factors mattered is apparent from the structure, not inferred.
:::

::: checkpoint
When would you prefer the 94% black box over the 89% tree?
- ( ) Never - interpretability always wins
- (x) When the output feeds an automated action and nobody needs to justify individual decisions
- ( ) When the dataset is small
- ( ) When there are fewer features
> It depends what happens next. Automated ad targeting can use the accurate model; a lending decision that must be explained to a regulator - or the customer - cannot.
:::

::: mistake
Choosing a model purely on accuracy in a data mining context is optimising the wrong thing.

The project succeeds when someone changes a business practice because of it. A model nobody can act on hasn't produced value regardless of its score.
:::

::: behind
**Rule-based classifiers** push interpretability one step further: extract the tree's logic into a flat list of if-then rules rather than a structure to navigate.

Which matters more than it sounds, because a list can be reviewed line by line in a meeting, argued with, and hand-edited when a domain expert knows one branch is wrong.
:::`,
  },

  "clustering-techniques": {
    concept: `## Segments Nobody Defined

::: story
A company has 200,000 customers and a strong suspicion that they aren't all the same. Nobody has ever categorised them, and nobody knows how many types there are.

Clustering finds the groups from behaviour alone - which is **customer segmentation**, the most common commercial use of unsupervised learning there is.
:::

The ML subject covers K-Means' mechanics. Here the interest is what the output is *for*.

::: cards A typical result
Segment 1 :: High spend, infrequent purchases. Occasional large orders.
Segment 2 :: Low spend, high frequency. Small regular purchases.
Segment 3 :: Moderate on both. The undifferentiated middle.
:::

::: remember
Notice those are sentences a marketing team can act on immediately - different messaging, different timing, different offers per segment.

Which is why K-Means is favoured here despite more sophisticated alternatives. A cluster you can describe in one line is a cluster someone will use.
:::

## When You Don't Know K

::: story
K-Means needs the number of clusters up front, and "how many customer types are there" is usually the question you were asking.

**Hierarchical clustering** avoids the commitment. Start with every customer as their own cluster, repeatedly merge the two closest, and continue until everything is one group.

The result is a **dendrogram** - a tree of nested groupings - and you cut it wherever the number of clusters looks sensible. After seeing the structure rather than before.
:::

::: checkpoint
Why might a dendrogram be more useful than a K-Means result for exploratory segmentation?
- ( ) It's faster to compute
- (x) It shows groupings at every level of granularity, so you can choose after seeing how the data actually divides
- ( ) It handles more data
- ( ) It's more accurate
> Seeing all granularities at once. Note it's slower than K-Means and doesn't scale as well - which is why K-Means still wins for large datasets where you have a defensible K.
:::

::: behind
The **distance metric** decides what "similar" means, and it's a choice rather than a default.

Euclidean distance suits continuous numeric features - spend, frequency, tenure. Cosine similarity suits sparse high-dimensional data like the TF-IDF vectors from the NLP subject, because it compares direction rather than magnitude.

Same algorithm, different metric, genuinely different clusters. Which is worth checking before trusting a segmentation.
:::`,
  },

  "anomaly-outlier-detection": {
    concept: `## Looking For What Doesn't Fit

::: story
Every technique so far hunts for common patterns - frequent itemsets, typical categories, dense clusters.

Anomaly detection inverts the goal entirely. The interesting record is the rare one, and the common patterns are only useful as a definition of normal to deviate from.
:::

## Three Ways To Spot One

::: cards Three approaches
Statistical :: Flag records far from the mean - beyond three standard deviations, say. Fast, and assumes the data follows a well-behaved distribution.
Distance-based :: Flag records far from their nearest neighbours. No distributional assumption, at the cost of many pairwise comparisons.
Density-based :: Flag records in sparse regions relative to the rest. Handles data with several normal clusters of differing densities.
:::

::: story
Why density-based matters: a dataset may contain a dense cluster of small everyday transactions and a sparser cluster of large business transactions.

A statistical method flags every business transaction as anomalous, because they're all far from the overall mean. A density-based method recognises the second cluster as its own normal, and flags only what's sparse relative to *its* neighbourhood.
:::

::: checkpoint
Fraud detection flags a £50,000 transaction. Statistical or density-based - which is more likely to be right?
- ( ) Statistical - it's clearly far from the mean
- (x) Density-based - if the customer routinely makes large transactions, distance from the global mean says nothing
- ( ) Neither can detect fraud
- ( ) They give identical results
> Context matters more than magnitude. £50,000 is anomalous for most customers and routine for some, and only a method that accounts for local normality can tell the difference.
:::

::: remember
The most important point in this lesson: **an anomaly is not automatically an error.**

It might be a fraudulent transaction, a machine about to fail, or a genuinely novel customer behaviour worth understanding - which is to say, it might be exactly the thing the project was for.

Deciding which requires domain knowledge. Automatically discarding anomalies during cleaning can delete the finding.
:::

::: behind
**Isolation Forest** takes an unusually elegant route: repeatedly partition the data at random and count how many splits it takes to isolate each point.

Anomalies isolate quickly, because being unusual means few others share their region. Normal points take many splits to separate from their neighbours.

No distances, no density estimation, and it scales to large high-dimensional data where the classic methods struggle.
:::`,
  },

  "web-text-mining": {
    concept: `## Mining Things That Aren't Tables

::: story
Everything so far assumed rows and columns. Most of the world's data isn't shaped like that - it's web pages and prose.

The same techniques apply, once you can get the unstructured thing into numbers.
:::

::: cards Three kinds of web mining
Content :: What's actually on the page - text, images, product data. Closest to text mining.
Structure :: The link graph between pages. Who links to whom, and what that implies about importance.
Usage :: How people actually move through a site. Click paths, session logs, where they leave.
:::

::: didyouknow
Structure mining produced one of the most consequential algorithms in computing.

**PageRank** treats a link as a vote for the linked page's importance, weighted by the voting page's own importance - a recursive definition that resolves to a ranking.

Google's original advantage wasn't reading pages better than competitors. It was reading the links between them.
:::

::: checkpoint
An e-commerce site wants to know why users abandon checkout. Which kind of web mining?
- ( ) Content mining
- ( ) Structure mining
- (x) Usage mining - it's about behaviour through the site, not about page contents or links
- ( ) None apply
> Usage. Content tells you what the checkout page says; usage tells you that 40% leave at the shipping-cost step, which is the actionable finding.
:::

## Text Mining Is Assembled From Other Subjects

::: timeline The pipeline, borrowed wholesale
Preprocess :: Tokenise, normalise, handle unknown words. The NLP subject.
Represent :: TF-IDF or embeddings to get numeric vectors. Also the NLP subject.
Mine :: Classify or cluster those vectors. This subject, and the ML subject.
:::

::: remember
Which is worth pausing on, because it's the clearest demonstration of something this platform has been building toward.

Data mining, machine learning and NLP are not three separate disciplines. They're one body of technique, applied to different data shapes with different goals - and a text mining pipeline uses all three without any of the joins being visible.
:::

::: behind
Combining the signals is where it gets genuinely useful.

Correlate a rise in negative review sentiment (text mining) with a fall in that product's page engagement (usage mining), and you have an early warning of a quality problem - weeks before it appears in sales figures.

Neither signal alone would have said much.
:::`,
  },

  "interview-questions": {
    concept: `## Analytics Interviews, Specifically

::: story
Data mining interviews differ from ML interviews in a way worth preparing for: they care whether you can turn a result into a business decision.

The technical questions are a filter. The differentiator is whether your answers end in something someone could act on.
:::

## The Answer Shape

::: timeline
Define it :: Precisely, and compute it if it's a metric.
Give the business meaning :: What the number tells someone who has to decide something.
Connect it outward :: To the KDD process, or to the ML and NLP subjects it borrows from.
:::

::: reveal What the business framing sounds like
Asked to define confidence, an adequate answer gives the formula.

A strong one continues:

"But confidence alone is misleading when the consequent is common. If 80% of all baskets contain milk, every rule predicting milk has high confidence automatically - that's the base rate, not a relationship.

Which is what lift corrects for: it compares the rule's confidence against milk's overall frequency. Above 1 is a real association; at 1 you've discovered that milk is popular.

Practically, a rule with high confidence and lift near 1 is one you shouldn't rearrange a shop for."

Formula, trap, and what to do about it.
:::

::: cards The five to have cold
The KDD pipeline :: Five stages in order, and that mining is the middle one.
Support, confidence, lift :: Computable by hand on a small example, with lift's motivation.
The Apriori property :: Why an infrequent set's supersets can be pruned without checking.
Why interpretability wins here :: Decision trees and K-Means chosen for explicability, not accuracy.
Anomaly detection's inverted goal :: Rare rather than common, and that an anomaly may be the finding.
:::

::: checkpoint
Asked to compute support and confidence from ten transactions, what's being tested?
- ( ) Arithmetic
- (x) Whether you can apply the definitions rather than recite them - which is where people who've only read about it come apart
- ( ) Memory of the formulas
- ( ) Speed
> Application. It's a small calculation, and getting the denominators the wrong way round is common enough that the exercise is genuinely diagnostic.
:::

::: mistake
The common failure is treating data mining as ML with different vocabulary.

They share algorithms and differ in what counts as success. An answer that never mentions interpretability or actionability has missed what makes this subject its own thing.
:::

::: behind
At senior level, expect questions about where the data actually comes from.

Real mining rarely starts from one clean table. It starts from a **data warehouse** - star schemas, fact and dimension tables, OLAP cubes - and getting a usable dataset out of it is a deliberate extraction and join design.

Which is the KDD selection stage, and in practice it's often the hardest part of the pipeline rather than the trivial first step it looks like.
:::`,
  },
};
