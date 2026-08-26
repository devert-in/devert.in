// Machine Learning - rewritten lesson bodies. See operating-systems.mjs for
// the authoring rules. The through-line worth preserving here is that
// "training" is optimisation - gradient descent appears in the regression
// lesson and returns, unchanged in principle, in the neural network lesson.
// Every lesson that can point at that connection does.

export const MACHINE_LEARNING = {
  "introduction-to-machine-learning": {
    concept: `## Rules You Can't Write

::: story
Write a program to add two numbers and you write the rule. Write one to sort a list, same thing - you know the logic, you type it out.

Now write the rules for recognising a cat in a photograph.

Not a description of a cat. Rules, over pixel values, that hold for every cat, in every lighting condition, at every angle, and hold for no dog. Nobody has ever managed this, and it isn't for lack of effort.
:::

**Machine learning** takes the other route: supply data and a learning algorithm, and let the algorithm find the pattern. The result is a **model** that makes predictions on data it has never seen.

## Three Ways To Learn

::: cards Three paradigms this subject is organised around
Supervised :: Trains on **labelled** data - photos already tagged cat or dog - and learns to predict the label for new examples. Regression and classification lessons.
Unsupervised :: Trains on **unlabelled** data, discovering structure with no correct answer provided. The clustering lesson.
Reinforcement :: An agent acts, receives rewards or penalties, and learns which actions lead to better outcomes over time.
:::

::: checkpoint
You have a million photos, none labelled, and want to find natural groupings among them. Which paradigm?
- ( ) Supervised
- (x) Unsupervised
- ( ) Reinforcement
- ( ) None applies
> No labels means nothing to supervise against. Which is exactly what clustering is for - and note the answer is decided by the *data* you have, not the outcome you want.
:::

::: remember
The trade against hand-written rules is explainability.

An expert system's rules were written by a person, so you can read them and see why it decided something. A model's rules were discovered, and live as millions of numeric weights nobody can inspect meaningfully.

You gain the ability to solve problems nobody can write rules for. You lose the ability to explain the answer - and in medicine, lending or hiring, that loss is a genuine problem rather than an inconvenience.
:::

::: behind
Which is why serious systems often combine both: rule-based logic for well-understood, safety-critical decisions, and ML for the pattern-recognition parts where rules were never available.

The ML model flags a suspicious transaction; explicit rules decide what is permitted to happen next.
:::`,
  },

  "supervised-learning-regression": {
    concept: `## Predicting A Number

::: story
How much is this house worth? Not "expensive" or "cheap" - a number, in rupees.

That's **regression**: supervised learning where the output is a continuous value. The next lesson handles the case where the output is a category instead, and the distinction determines which algorithms and which metrics apply.
:::

**Linear regression** is the foundational version. It assumes the relationship between features and output is linear, and fits a line:

  price = w1*sqft + w2*bedrooms + b

The \`w\` values are **weights**; \`b\` is the **bias**.

## What Training Actually Is

::: story
"Training a model" sounds like something happening to the model. It's simpler than that.

You have a **cost function** measuring how wrong the predictions are - typically **mean squared error**, the average squared difference between predicted and actual values.

Training is finding the weights that make that number as small as possible. That's all it is.
:::

::: cards The mechanism
Mean squared error :: Average of (predicted − actual)² across the training set. Lower is closer.
Gradient descent :: Repeatedly nudge each weight in whichever direction reduces the cost, in small steps, until it stops improving.
:::

::: remember
This is the single most useful thing to carry out of this lesson: **training is optimisation.**

Not learning in any mysterious sense - finding the inputs to a function that minimise its output. The exact same idea returns in the neural networks lesson, applied to millions of weights instead of three, and it is not a different idea when it gets there.
:::

::: checkpoint
Gradient descent has converged. What does that mean?
- ( ) The model is perfectly accurate
- (x) The weights have stopped changing meaningfully - further nudges don't reduce the cost
- ( ) All training data has been used exactly once
- ( ) The cost function has reached zero
> The weights settled at a minimum of the cost function. Which may still be a considerable amount of error - convergence means "can't do better with this model", not "correct".
:::

::: mistake
Squaring the error isn't decoration. It makes all errors positive so they don't cancel out, and it penalises large errors disproportionately - being off by 10 costs a hundred times as much as being off by 1.

Which means MSE cares intensely about outliers. That's sometimes what you want, and sometimes the reason a single bad data point drags your whole line sideways.
:::

::: behind
**Polynomial regression** adds terms like \`sqft²\` to fit curves rather than lines.

Which introduces the failure mode the Model Evaluation lesson is about: enough polynomial terms and the curve passes through every training point exactly, tracing the noise rather than the pattern - and predicting nothing useful about a house it hasn't seen.
:::`,
  },

  "supervised-learning-classification": {
    concept: `## Predicting A Category

::: story
Spam or not spam. Benign or malignant. Fraud or legitimate.

**Classification** predicts a discrete category rather than a number - and the change of output type changes both the algorithms and, more consequentially, how you're allowed to measure success.
:::

::: mistake
**Logistic regression** is a classification algorithm, despite the name. It genuinely confuses people and the name is genuinely misleading.

It computes a weighted sum exactly like linear regression, then passes it through a **sigmoid** function squashing the result into 0-1, read as a probability. A threshold - usually 0.5 - turns that probability into a category.
:::

## Why Accuracy Lies

::: story
A disease affects 1% of patients. You build a classifier and it reports 99% accuracy.

Here is that classifier: \`return "no disease"\`. Always. It has never once been right about a sick patient, and it never will be. It catches nothing, helps nobody, and its accuracy is excellent.

99% accuracy, zero medical value.
:::

::: cards The confusion matrix
True positive :: Predicted positive, actually positive. Caught it.
True negative :: Predicted negative, actually negative. Correctly cleared.
False positive :: Predicted positive, actually negative. A false alarm.
False negative :: Predicted negative, actually positive. A missed case.
:::

::: remember
**Precision** = TP / (TP + FP) - of the cases you flagged, how many were real?

**Recall** = TP / (TP + FN) - of the real cases, how many did you catch?

The always-negative classifier has zero of both, which is why they're the metrics that expose it and accuracy isn't.
:::

::: checkpoint
For a cancer screening test, which matters more?
- ( ) Precision - avoid alarming healthy people
- (x) Recall - missing a real case is far worse than a false alarm that further testing clears
- ( ) Accuracy
- ( ) They're equally important
> Recall. A false positive costs a follow-up test and some anxiety; a false negative costs a life. Which way this tips depends entirely on the domain - a spam filter is the opposite, since burying a real email is worse than letting one advert through.
:::

::: behind
**F1 score** is the harmonic mean of precision and recall - one number when you need one.

And the **precision-recall trade-off** is directly tunable: raise the decision threshold from 0.5 to 0.9 and you flag fewer cases with more confidence, gaining precision and losing recall. Lower it and the reverse.

Which means one trained model can serve as a conservative or an aggressive classifier without retraining - and choosing the threshold is a decision about which error is more expensive, not a technical one.
:::`,
  },

  "decision-trees-random-forests": {
    concept: `## A Model You Can Read

::: story
Most models answer without explaining. A **decision tree** is the exception.

  Is age > 30?
    Yes -> Is income > 50000?
             Yes -> Approve
             No  -> Deny
    No  -> Deny

You can trace exactly why any specific decision came out the way it did, and read the reasoning aloud to someone whose loan was refused.
:::

That explainability is why trees survive in lending, insurance and medicine, where "the model said so" is not an acceptable answer.

## How A Split Is Chosen

::: story
At each node, the algorithm asks which feature and which threshold best separates the classes.

"Best" means reducing **impurity** most - how mixed the classes are within a node. A split leaving all the approvals on one side and all the denials on the other is excellent; one leaving both halves evenly mixed has achieved nothing.

Gini impurity and information gain are the two standard ways of measuring it.
:::

::: mistake
Left unconstrained, a tree keeps splitting until every leaf holds a single training example.

At which point it classifies the training set perfectly and has memorised it - one branch per customer, describing that customer and nothing general. Depth limits exist for exactly this reason.
:::

## Many Trees, Voting

::: cards How a random forest differs
Random data :: Each tree trains on a different random sample of the training data.
Random features :: Each split considers only a random subset of features, so trees can't all latch onto the same dominant one.
Combine :: Majority vote for classification, average for regression.
:::

::: remember
The randomness is the mechanism, not a detail. Identical trees would make identical mistakes and averaging them would change nothing.

Because each tree sees different data and different features, their individual errors are largely independent - and independent errors average out. Wisdom of crowds, with the crowd deliberately given different information.
:::

::: checkpoint
Why does a random forest overfit less than a single deep tree?
- ( ) The trees are shallower
- (x) Each tree overfits differently, and averaging independent errors cancels much of it
- ( ) It uses less training data overall
- ( ) It has fewer features available
> Errors that don't correlate cancel when averaged. Note what's lost: you can trace one tree's reasoning, and you cannot meaningfully trace two hundred trees voting.
:::

::: behind
**Gradient boosting** - XGBoost and similar - takes the opposite approach to combining trees.

Rather than many independent trees averaged, it trains them sequentially, each one focused on correcting the errors the previous ones made together.

Often stronger predictive performance, more prone to overfitting if untuned, and inherently sequential rather than parallel. It's what wins most tabular-data competitions.
:::`,
  },

  "unsupervised-learning-clustering": {
    concept: `## Finding Groups Nobody Labelled

::: story
Ten thousand customers, no labels. You suspect there are natural types among them - the bulk buyers, the browsers, the seasonal shoppers - but nobody has ever tagged a single one.

**Clustering** finds those groups from the data alone. Nothing tells the algorithm what the right answer is, because nobody knows.
:::

## K-Means

::: timeline The whole algorithm
Choose K and place centroids :: Pick how many clusters you want; place K starting points, usually at random.
Assign :: Every data point joins whichever centroid is nearest.
Recompute :: Each centroid moves to the average position of the points that joined it.
Repeat :: Assign and recompute until assignments stop changing.
:::

::: remember
Simple enough to implement in an afternoon, and it converges reliably. What it does *not* do is guarantee the best possible clustering.

Where the initial centroids landed affects where it settles - so the same data can yield different clusterings on different runs. Real implementations run it several times and keep the best result.
:::

## Choosing K Is The Hard Part

::: story
K-Means needs to be told how many clusters exist, before it has looked at anything.

Which is awkward, because "how many natural groups are in this data" is usually the question you were hoping it would answer.
:::

::: cards The elbow method
Run several K values :: K = 2, 3, 4, 5, and so on.
Plot the tightness :: Total within-cluster distance against K. It always improves as K rises.
Find the bend :: The point where further increases stop buying much. That kink is the elbow.
:::

::: checkpoint
Total within-cluster distance keeps falling as K increases. Why not just choose a large K?
- ( ) Large K is computationally impossible
- (x) At K = number of points, every point is its own cluster with zero distance - perfect by that metric and useless
- ( ) The algorithm fails for large K
- ( ) It would be too accurate
> The metric always improves, so it can't select K by itself. Which is the whole reason the elbow heuristic exists rather than an optimisation - the objective you'd optimise is degenerate.
:::

::: behind
**DBSCAN** clusters by density instead, and doesn't need K at all.

Points in dense regions form clusters; isolated points are labelled noise rather than forced into the nearest group. Which handles irregular cluster shapes, and doesn't require you to know the answer in advance.

K-Means assumes roughly spherical, similarly-sized clusters. When that assumption is wrong, it fails confidently.
:::`,
  },

  "neural-networks-basics": {
    concept: `## One Unit, Then Many

::: story
A single **perceptron** computes a weighted sum of its inputs, adds a bias, and passes the result through an activation function.

  output = activation(w1*x1 + w2*x2 + b)

Look at what's inside the brackets. That's linear regression, unchanged. One perceptron is not a powerful model - it's logistic regression with extra vocabulary.
:::

## Where The Power Comes From

::: cards Stacking into layers
Input layer :: Receives the raw features.
Hidden layers :: Each unit computes its weighted sum and activation from the *previous* layer's outputs.
Output layer :: Produces the prediction.
:::

::: story
The activation function is what makes depth worth anything.

Without it, each layer is a linear transformation - and stacking linear transformations gives you another linear transformation. A hundred layers would be exactly as expressive as one.

The non-linearity is what lets later layers combine earlier features into genuinely new ones. Remove it and the depth is decorative.
:::

::: checkpoint
Why is a network with three hidden layers and no activation functions no more powerful than a single layer?
- ( ) The gradients vanish
- (x) Composing linear transformations yields another linear transformation - the depth collapses
- ( ) It trains too slowly to converge
- ( ) The weights cancel out
> Algebraically it collapses to one linear map. Depth without non-linearity buys nothing at all, which is why the activation function is the load-bearing part rather than a detail.
:::

## Backpropagation

::: story
The network predicted 0.7 and the answer was 1. There are two million weights. Which ones were wrong, and by how much?

**Backpropagation** answers that: it works backward from the output error, computing each weight's contribution, then adjusts every weight in the direction that reduces the error.

Which is gradient descent. The same gradient descent from the regression lesson, applied to two million weights instead of three.
:::

::: remember
That connection is worth stating plainly, because "how does a neural network learn" sounds like it needs a special answer and doesn't.

It minimises a cost function by gradient descent. Backpropagation is the efficient way to compute the gradients when the function is a deep composition - it isn't a different learning principle.
:::

::: behind
**CNNs** and **Transformers** are architectures built on this foundation, each adding structure suited to a data type.

CNNs exploit spatial locality - nearby pixels relate - so a unit looks at a small patch rather than the whole image. Transformers exploit sequence, and underpin the language models in the NLP subject.

Both are elaborations of layered units trained by backpropagation, not replacements for it.
:::`,
  },

  "model-evaluation-overfitting": {
    concept: `## Two Ways To Be Wrong

::: story
Your model scores 99% on the data it trained on and 60% on anything new.

It didn't learn the pattern. It memorised the examples - including their noise, their coincidences, and the specific quirks of the particular houses in your spreadsheet.
:::

::: cards The two failure modes
Overfitting :: Learned the training data too closely. Excellent on training data, poor on new data. Too much model for the amount of signal.
Underfitting :: Too simple to capture the pattern at all. Poor on training data *and* new data. Not enough model.
:::

::: remember
The diagnostic is the gap. High training score with low test score is overfitting. Both low is underfitting.

Which is why the two numbers together tell you something neither tells you alone.
:::

## Three Splits, Three Jobs

::: cards
Training set :: Fits the model's weights.
Validation set :: Tunes configuration choices - tree depth, layer count, learning rate. Used repeatedly during development.
Test set :: Used **once**, at the very end, for an honest estimate of real performance.
:::

::: story
The discipline about the test set is the part people erode without noticing.

Check it, adjust the model, check again. Do that twenty times and you've tuned the model to the test set through your own decisions - and its score no longer estimates performance on unseen data, because it isn't unseen any more.

You've spent the one measurement you had.
:::

::: checkpoint
Why is evaluating on training data meaningless?
- ( ) It's too small a sample
- (x) A model that memorised the training set scores perfectly on it while having learned nothing generalisable
- ( ) Training data is usually corrupted
- ( ) It's not meaningless if accuracy is high
> Memorisation is indistinguishable from learning when measured on what was memorised. The whole point of a held-out set is to make that distinction visible.
:::

::: behind
**K-fold cross-validation** helps when data is scarce and a single split would waste too much of it, or might be unrepresentative by luck.

Split into K folds, train K times each holding out a different fold, average the scores. More reliable, and K times the compute.

And **regularisation** attacks overfitting directly: add a penalty for large weights to the cost function, so the optimiser prefers simpler solutions. Which is the same cost-minimisation framing from the regression lesson, with a term that pushes back against complexity.
:::`,
  },

  "feature-engineering": {
    concept: `## The Part That Matters Most

::: story
Practitioners consistently report spending most of their project time on data and features rather than on models. That's not a failure of prioritisation.

No algorithm can extract signal that isn't in the input. A neural network given uninformative features will lose to linear regression given good ones - reliably, and by a wide margin.
:::

**Feature engineering** is selecting, transforming and creating the inputs a model learns from.

## Encoding Categories

::: mistake
You have a colour column: red, blue, green. So you encode red=1, blue=2, green=3.

You've just told the model that green > red, that blue is the midpoint between them, and that the distance from red to green is twice the distance from red to blue.

None of that is true, and a distance-based model will act on all of it.
:::

::: remember
**One-hot encoding** avoids this: a separate binary column per category.

  is_red   is_blue   is_green
    1         0         0
    0         1         0

No ordering implied, because none exists. More columns, and correct.
:::

## Scaling

::: story
Two features: age, 0 to 100. Income, 0 to 1,000,000.

Cluster on those with K-Means and income decides everything. A ten-thousand-rupee income difference outweighs the entire possible range of human age, purely because of the units it happens to be measured in.

Rescale both to 0-1 and they compete on their actual relevance.
:::

::: checkpoint
Which algorithms are most affected by unscaled features?
- ( ) Decision trees
- (x) Distance-based ones - K-Means, k-nearest neighbours - where a large-range feature dominates the distance
- ( ) All algorithms equally
- ( ) None; scaling is cosmetic
> Distance-based methods. Trees are largely immune, since they split on thresholds within one feature at a time and never compare across features - which is worth knowing so you don't apply the ritual everywhere.
:::

## Creating Features

::: cards Where domain knowledge pays
price_per_sqft :: From price and area. Often more predictive than either alone.
days_since_last_purchase :: From a raw timestamp. The model cannot derive "recency" from a date on its own.
is_weekend :: From a date. Trivial for you, invisible to the model.
:::

::: remember
Each of those is information the model could not have found by itself, handed over for free.

Which is what "garbage in, garbage out" means here specifically: the model's ceiling is set by what its features contain, and raising that ceiling is usually cheaper than improving the algorithm.
:::

::: behind
Once a dataset has hundreds of candidate features, judging each by hand stops being practical.

A random forest's **feature importance** scores - which features its splits actually relied on - are a common way to identify what's carrying signal and what's noise, feeding the model's own judgement back into the feature selection step.
:::`,
  },

  "interview-questions": {
    concept: `## Predictable Questions, Connected Answers

::: story
ML interviews cover a narrow set of topics, and the strongest answers aren't the ones with the most detail.

They're the ones that show the concepts are connected - because someone who sees the connections can debug a model they've never seen, and someone reciting definitions cannot.
:::

## The Answer Shape

::: timeline
Define it :: Precisely, in one sentence.
Give the concrete case :: The rare-disease example, the memorised training set. Specifics beat abstractions here.
Connect it :: To a shared underlying idea. This is the differentiator.
:::

::: reveal What connecting looks like for "how does a neural network learn?"
An adequate answer says backpropagation, and that weights are adjusted to reduce error.

A strong one keeps going:

"It minimises a cost function by gradient descent - the same procedure as fitting a linear regression, just over millions of weights instead of three. Backpropagation is how you compute the gradients efficiently through a deep composition of functions; it isn't a different learning principle.

Which is also why the same failure modes reappear. Overfitting in a deep network is the same phenomenon as an over-fitted polynomial, and regularisation is the same fix."

The second answer demonstrates that these aren't eight separate topics.
:::

::: cards The five to have cold
Regression vs classification :: And that logistic regression is a classifier despite the name.
Overfitting vs underfitting :: The diagnostic gap between training and test scores, and the three-way split.
Precision and recall :: With the rare-disease example, and why accuracy hides it.
K-Means :: The iterative loop, and why choosing K needs a heuristic.
Backpropagation :: Conceptually, and connected back to gradient descent.
:::

::: checkpoint
Asked why accuracy is a poor metric, which answer is stronger?
- ( ) "Because precision and recall are better metrics"
- (x) "Because on a 1% positive class, always predicting negative scores 99% and catches nothing - so accuracy hides a useless model"
- ( ) "Because accuracy is not statistically valid"
- ( ) "Because imbalanced data is difficult"
> The concrete counterexample. It demonstrates understanding in one sentence, where naming better metrics only demonstrates knowing their names.
:::

::: mistake
The recurring weakness is treating the subject as eight unrelated topics.

Gradient descent appears in regression and again in neural networks. Overfitting appears in trees, in polynomials and in deep networks. Cost functions run through everything.

Answers that surface those threads sound like understanding. Answers that don't sound like a syllabus.
:::

::: behind
At specialist level, expect the **bias-variance trade-off** as the formal framing of overfitting and underfitting.

High bias is a model too simple - underfitting. High variance is a model too sensitive to its particular training sample - overfitting. Almost every tuning decision, from regularisation to model complexity to gathering more data, is moving deliberately along that axis.

Which is a more precise version of a distinction you already have, and it's the vocabulary a research-adjacent interview will use.
:::`,
  },
};
