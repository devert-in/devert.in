// Git & GitHub - rewritten lesson bodies. See operating-systems.mjs for the
// authoring rules. The running image is a chain of photographs: a commit is a
// photo of the whole project, history is the chain, a branch is a second chain
// growing off the same photo, and merge/rebase are the two ways of bringing one
// chain back into the other. The Git-is-not-GitHub distinction is set up in
// lesson one and paid off in the Pull Requests lesson, where the platform
// features finally start.

export const GIT_GITHUB = {
  "repositories": {
    concept: `## Writing Without An Undo Button

::: story
Picture working on something important with no undo. No revision history. No way to see what changed between yesterday and today.

Now add a collaborator. You email the file back and forth, and one afternoon they send back a version built on your old copy, silently erasing an hour of your work. There is no way to recover it, because there is no record that it ever existed.

That was software development before version control. Not a thought experiment - the actual working conditions.
:::

::: didyouknow
Git was written by Linus Torvalds, the same person behind the Linux kernel, because the kernel's own development had outgrown every tool available at the time. It was built by someone with an urgent, specific problem, which is a large part of why it works the way it does.
:::

::: remember
A **version control system** tracks every change ever made to a project's files. It lets you see any past state, restore any past state, and lets many people work on the same codebase at once without overwriting each other.
:::

## What A Repository Actually Is

A **repository** - a repo - is a project folder that Git is tracking. Your ordinary files, plus one hidden \`.git\` folder holding the complete history of every change ever recorded.

::: cards Two ways to get one
git init :: Turns an existing folder into a new, empty repository. Fresh start, no history yet.
git clone <url> :: Downloads a complete copy of an existing repository, with its full history, from somewhere else.
:::

  git init                                     # track THIS folder as a new repo
  git clone https://github.com/user/repo.git   # download an existing one, full history included

::: mistake
Running \`git init\` when you meant to clone.

They sound similar and do opposite things. \`init\` starts a brand-new, empty history; \`clone\` fetches a history that already exists elsewhere. Initialising inside a folder where you actually wanted someone else's project leaves you with an empty repo and a confusing afternoon.
:::

## Local, Remote, And The Word Everyone Confuses

::: cards Where a repository lives
Local :: On your own machine. Where you actually work - edit, commit, experiment.
Remote :: On a server, hosted somewhere like GitHub, GitLab or Bitbucket. The shared copy the team pushes changes to and pulls changes from.
:::

::: remember
**Git is not GitHub.**

Git is the version control system - a program that runs on your machine and works completely fine with no internet connection and no account anywhere. GitHub is one popular company that hosts remote repositories, and it is not the only one.
:::

::: analogy
Git is the camera. GitHub is the photo-sharing website.

You can take every photo you'll ever need without ever uploading one. The site is convenient for sharing with other people - and it is a service built on top of the thing, not the thing itself.
:::

::: checkpoint
GitHub goes offline permanently tomorrow. What happens to a team of five who all cloned the repository last week?
- ( ) The project history is lost
- (x) Nothing is lost - each clone contains the complete history, so they push to a new host and continue
- ( ) Only the person who created the repo still has the history
- ( ) They can keep working locally but lose all past commits
> Nothing is lost. Git is decentralised: every clone is a complete, independent copy of the entire history, not a partial checkout. That resilience is a deliberate design decision, and it is very different from older centralised systems where the server held the only full copy.
:::

::: interview
"What's the difference between Git and GitHub?" is asked constantly in early screens, precisely because it separates people who have used the tool from people who have only heard the words.

Answer it in one sentence - the system versus one host for it - and move on. Over-explaining a simple question reads as uncertainty.
:::`,
  },

  "commits": {
    concept: `## A Photograph Of The Whole Project

::: story
A **commit** is a snapshot. Not a diff, not a list of edits - a saved state of your project at one moment in time, permanently recorded.

String them together and you have the history: a chain of photographs, each one showing exactly what the project looked like at that point, each one restorable.
:::

Getting a change into that chain takes two deliberate steps.

::: flow
git add <file> :: Moves a change into the **staging area** - a holding zone for "things going into the next commit."
git commit -m "message" :: Takes everything currently staged and saves it as a permanent snapshot in history.
:::

  git add index.html    # stage one specific file
  git add .             # or stage everything modified
  git commit -m "Fix null pointer crash when cart is empty"
  git log --oneline     # compact history, one line per commit

## Why That Middle Step Exists

::: story
It looks like ceremony. Two commands where one would do.

Then you have an afternoon like this: you fix a bug in one file, and while you're in there you start an unrelated new feature in another. Both changes are now sitting in your working directory, half-finished feature included.

Without staging, your only option is to commit both together - one lump, two unrelated things, permanently tangled in the history.
:::

::: remember
The staging area exists so you can choose **exactly** which changes go into a commit.

Stage the bug fix. Commit it alone. Leave the unfinished feature exactly where it is. The history stays clean, and the fix can be understood, reviewed or reverted on its own.
:::

::: analogy
Packing a parcel. The staging area is the table you lay things on before they go in the box. You decide what's going in this one and what's waiting for the next - the box only closes once, and after that it's sealed.
:::

::: mistake
Committing several unrelated changes in one giant commit.

It costs nothing today and costs a lot in six months, when a bug is traced to that commit and it turns out to contain four unrelated things. The staging area is the tool that prevents this, which is exactly why \`git add\` is separate.
:::

## Messages Are For Future Readers

::: cards Two commit messages, same change
"fixed bug" :: Tells a future reader nothing. Which bug? Why did this line change? Why this approach?
"Fix null pointer crash when cart is empty" :: Says what problem existed and what this commit does about it. Instantly useful, six months later, to someone who wasn't there.
:::

::: remember
A good message explains **why**, not what.

The diff already shows what changed - Git can always tell you that. What it can never tell you is what the author was thinking, and that is the part worth writing down.
:::

::: checkpoint
You're reviewing history to understand why a strange-looking workaround exists in the code. Which is most useful?
- ( ) The commit's diff, showing which lines changed
- (x) The commit message, if it explains the reasoning behind the workaround
- ( ) The commit's hash
- ( ) The file's current contents
> The message. The diff shows the workaround being added, which you can already see in the code. The one thing that can't be reconstructed is the reason - and that's precisely why writing it down matters.
:::

::: interview
Explain the staging area's actual purpose rather than describing \`git add\` as a step you have to do before committing.

"It lets me choose what goes into each commit, so I can keep unrelated changes in separate commits" shows you use Git deliberately. Anything vaguer suggests memorised commands.
:::`,
  },

  "branches": {
    concept: `## Not A Copy

::: story
The word "branch" suggests something substantial. A second version of the project. A duplicate of every file, sitting somewhere on disk.

It isn't. A branch is a pointer to a commit. A name, and the ID of one photograph in the chain. That's it.
:::

::: remember
A branch is a lightweight, movable **pointer** to a specific commit - not a copy of your files.

Which is why creating one is essentially free and instant, no matter how large the project is. There is nothing to copy.
:::

::: analogy
A bookmark in a book, not a photocopy of the book.

Making a second bookmark costs a bookmark. Both readers are in the same physical book, just holding different places in it.
:::

::: mistake
Believing a branch duplicates every file.

This misconception quietly makes people avoid branching - it feels expensive and risky, so they work on \`main\` instead. Understanding what a branch actually is removes the hesitation, and the hesitation is the real cost of the misconception.
:::

## What Happens When You Commit On One

::: flow
You branch :: A new pointer is created, aimed at the same commit main is on. Nothing else changes.
You commit :: The new snapshot is recorded, and **your branch's pointer** moves forward to it.
Main stays put :: Main's pointer never moved. It still points exactly where it did, completely undisturbed.
:::

  git branch feature-login     # create the pointer
  git checkout feature-login   # switch to it
  git checkout -b feature-login  # or both in one step

  # ... commit on the branch ...
  git checkout main            # back to main, untouched

::: checkpoint
You create \`feature-login\`, make three commits on it, then run \`git checkout main\`. What do your files look like?
- ( ) They contain all three commits' changes
- (x) Exactly as they were before you branched - main's pointer never moved, so checking it out restores that state
- ( ) An error - you can't switch branches with commits on the other one
- ( ) Empty, until you merge
> As they were before. Those three commits moved feature-login's pointer forward and left main's alone. Switching to main puts your working directory back to the snapshot main points at.
:::

## Branch Per Piece Of Work

::: story
Because branching is free and isolated, the standard workflow falls out naturally: one branch per feature, one per bug fix.

Create a branch. Commit on it as messily as you like. Break things, fix them, commit again. When the work is genuinely done and tested, merge it back into main - the next lesson.

Nobody else sees any of the mess, because none of it ever touched the branch they're relying on.
:::

::: cards Why teams do it this way
Isolation :: Half-finished, possibly broken work never lands on the branch other people build from.
Parallelism :: Five engineers work on five features simultaneously without colliding, because each one's commits move only their own pointer.
Disposability :: An experiment that turns out badly is deleted by deleting a pointer. Nothing to unpick.
:::

::: behind
\`HEAD\` is Git's name for "the commit your working directory currently reflects." Normally HEAD points at a branch, which points at a commit - one extra level of indirection, and the reason switching branches changes your files.

Understanding that chain - HEAD to branch to commit - is what makes the rest of Git's behaviour predictable instead of magical.
:::`,
  },

  "merge": {
    concept: `## Bringing A Branch Home

::: story
The feature branch is done. Tested, committed, finished. Now its work needs to be part of main, where everyone else will get it.

That's merging: taking the changes from one branch and integrating them into another.
:::

  git checkout main
  git merge feature-login

What happens next depends entirely on whether main moved while you were away.

## Two Kinds Of Merge

::: cards Fast-forward vs three-way
Fast-forward :: Main hasn't changed since your branch was created. There is nothing to reconcile, so Git just slides main's pointer forward to your branch's latest commit. No new commit is created.
Three-way :: Main has its own new commits too, so the histories genuinely diverged. Git creates a new **merge commit** with **two** parents - one from each branch - joining the histories together.
:::

::: analogy
Fast-forward is catching up on a queue nobody else joined - just step forward.

A three-way merge is two people who each wrote a paragraph while apart. Neither can simply overwrite the other; the result has to acknowledge both, which is exactly what a merge commit with two parents does.
:::

::: checkpoint
You branch off main, commit twice. Meanwhile a teammate pushes a commit to main. You merge your branch into main. What does Git do?
- ( ) A fast-forward - it just moves the pointer
- (x) A three-way merge, creating a merge commit with two parents, because both branches gained commits after diverging
- ( ) Refuses the merge until the teammate reverts
- ( ) Overwrites the teammate's commit with yours
> A three-way merge. Fast-forward is only possible when the target branch hasn't moved at all. Once both sides have new commits, the histories genuinely diverged and the merge commit is what records that they came back together.
:::

## When Git Stops And Asks

::: story
Sometimes Git gets partway through and stops.

Both branches changed the same lines of the same file, in different ways. There is no rule that tells Git which one is right, so it refuses to guess.
:::

That's a **merge conflict**. Git pauses and marks the disputed section directly inside the file:

  <<<<<<< HEAD
  const greeting = "Hello, World!";
  =======
  const greeting = "Hi there!";
  >>>>>>> feature-login

::: flow
1. Open the file :: Both versions are sitting there, separated by the markers.
2. Decide :: Keep one, keep the other, or write something combining both. Delete the marker lines themselves.
3. Stage it :: \`git add\` the resolved file, telling Git the dispute is settled.
4. Commit :: Completing the merge.
:::

::: remember
A merge conflict is **not an error**.

It is Git correctly recognising that only a human, who understands what both changes were for, can decide how to combine them. Getting one means the tool worked, not that something broke.
:::

::: mistake
Two versions of this, both common.

Panicking, as if the repository is damaged - it isn't, and conflicts are a routine part of any team's week. And forgetting to stage and commit after fixing the file, which leaves the merge half-finished and the repository in a confusing in-between state.
:::

::: interview
Be able to walk through a conflict out loud: what causes one, what the markers mean, and the resolve-stage-commit sequence.

It's asked often because it's genuinely practical - and because someone who has resolved a real conflict describes it very differently from someone who has only read about them.
:::`,
  },

  "rebase": {
    concept: `## The Other Way To Combine

::: story
Merging joins two diverged histories and records that they diverged. Rebasing pretends they never did.

\`git rebase main\`, run from your feature branch, takes every commit unique to that branch and replays them one by one on top of main's current latest commit - as if you had started the work from main's newest state all along, rather than from wherever main happened to be when you branched.
:::

  git checkout feature-login
  git rebase main     # replay this branch's commits on top of main's latest

::: cards What each one leaves behind
Merge :: A merge commit with two parents. The history shows the branch existed, diverged, and came back - a true record of what happened.
Rebase :: A single straight line of commits. No merge commit, no fork in the graph. Reads as though the work happened sequentially.
:::

::: remember
The final **code** is typically identical either way. The difference is the shape of the history, not the contents of the files.

Which means rebase-versus-merge is a readability preference, and teams genuinely disagree about it. Neither camp is confused.
:::

::: checkpoint
Your team argues about rebase versus merge. What is actually at stake?
- ( ) Which one produces correct code
- (x) What the history looks like afterwards - a clean linear log versus a truthful record that a branch existed
- ( ) Which one is faster to run
- ( ) Whether the code will merge without conflicts
> The shape of the history. Both approaches end with the same files; they disagree about whether the log should read as a straight line or should preserve the branching structure that actually occurred.
:::

## The Rule You Learn Before The Command

::: story
Rebasing does not move commits. It creates new ones.

Each replayed commit gets a new hash, because a commit's hash depends on its parent's hash, and rebasing gives every commit a different parent. The originals are discarded.

That is fine when the commits were only ever on your machine. It is genuinely painful when someone else already pulled them.
:::

::: mistake
**Never rebase commits that have already been pushed and that others may be building on.**

Their clone still has the old commits, yours now has different ones with different hashes containing the same changes. Git sees two unrelated histories, everyone gets duplicate commits and confusing conflicts, and someone spends an afternoon untangling it.
:::

::: remember
The safe guideline, which almost every team converges on:

Rebase freely on your own local, unshared commits. Once commits are pushed to a shared branch, they are public history - merge from that point on.
:::

::: behind
Many teams codify exactly this: rebase your feature branch onto main before opening a pull request, then never rebase it again.

You get the clean linear history for review, at the moment the commits are still entirely yours, and you stop rewriting the instant anyone else could be depending on them.
:::

::: interview
This is one of the highest-frequency practical Git questions, and the answer has two halves.

The trade-off: linear history versus a preserved record of branching. And the safety rule: never rewrite shared history. Give both. Giving only the first sounds like you learned rebase from a blog post rather than from using it.
:::`,
  },

  "pull-requests": {
    concept: `## Where Git Ends And The Platform Begins

::: story
Everything so far has been Git - commits, branches, merges, all of it working on a machine with no network connection.

A **Pull Request** is not that. It is a GitHub feature, built on top of Git's mechanics. GitLab calls its equivalent a Merge Request, which is arguably the better name for what it does.
:::

::: remember
A PR is a formal request to merge one branch into another, wrapped in three things Git itself has no concept of: a place for **discussion**, automated **checks**, and human **code review**.

The merge at the end is ordinary Git. Everything around it is the platform.
:::

::: mistake
Talking about pull requests as though they were a Git command.

There is no \`git pull-request\`. Getting this wrong in an interview immediately after correctly explaining branches and merges undoes the good impression, because it shows the line between the tool and the website was never clear.
:::

## The Workflow

::: flow
Push the branch :: \`git push origin feature-login\` sends your branch to the remote.
Open the PR :: On GitHub, compare that branch against main. The full diff of every change is now visible to anyone.
Review happens :: A reviewer comments on specific lines, requests changes, or approves. Automated checks run in parallel.
Merge :: Once approved and green, someone clicks merge - and GitHub performs the underlying Git merge or rebase, depending on how the repository is configured.
:::

  git push origin feature-login
  # then, on GitHub: open a PR comparing feature-login against main

::: checkpoint
A PR is approved and merged on GitHub. What actually happened to the repository?
- (x) An ordinary Git merge (or rebase) ran on the server - the same mechanics from the previous lessons
- ( ) Something specific to GitHub with no Git equivalent
- ( ) The branch was copied over main file by file
- ( ) The commits were deleted and recreated from the diff
> An ordinary merge or rebase. The PR is the review process wrapped around it; when the button is clicked, what runs underneath is exactly what you'd have run locally.
:::

## Why Review Is Not Bureaucracy

::: story
The obvious justification for code review is catching bugs before they ship. Real, but the smallest of the reasons.

The larger ones are easy to miss when you're the one waiting on an approval.
:::

::: cards What review actually buys
Knowledge spreads :: The reviewer learns a part of the codebase they didn't write. Over a year, that is the difference between a team and a set of individuals with private territories.
Design gets a second look :: A solo author is inside their own approach. A reviewer sees the same code from outside, which is where "why not do it this other way?" comes from.
The reasoning is recorded :: The PR thread is a searchable record of why a change was made and what alternatives were rejected - findable long after everyone involved has forgotten.
:::

::: mistake
Treating review as a queue to get through as fast as possible.

Rubber-stamp approvals cost the team all three benefits above while keeping every minute of the delay. The process without the attention is genuinely pure overhead - which is what makes the shortcut so tempting and so self-defeating.
:::

::: behind
Teams enforce this with **branch protection rules**: main can be configured to reject any merge without a required number of approving reviews and passing automated checks.

That turns review from a norm people can quietly skip under deadline pressure into a gate nobody can bypass - and it connects straight to the CI/CD material in the Software Engineering subject, and to the next lesson here.
:::`,
  },

  "github-actions": {
    concept: `## Automation That Watches The Repository

::: story
The previous lesson mentioned automated checks running alongside human review. This is where they come from.

**GitHub Actions** is GitHub's built-in automation platform. You describe what should happen and when, in a YAML file committed to \`.github/workflows/\`, and GitHub runs it in response to events in the repository - a push, a pull request being opened, a scheduled time, a manual click.
:::

::: remember
This is how most modern teams do **CI/CD** - Continuous Integration and Continuous Deployment - now: built into the repository itself, triggered by repository events, rather than wired up to a separate external service.
:::

## Three Levels, In Order

::: cards Workflow, job, step
Workflow :: One YAML file, one trigger. "On every pull request, do this."
Job :: A unit of work inside a workflow, running on its own fresh virtual machine. Multiple jobs can run in parallel.
Step :: A single command, or a reusable pre-built **action** - like \`actions/checkout\`, which fetches your repository's code onto the machine before anything else can use it.
:::

::: mistake
Forgetting that each job starts on a completely fresh machine with nothing on it - not even your code.

That's why nearly every job begins with \`actions/checkout\`. Skipping it produces the confusing failure where the very first real command can't find any of your files.
:::

  # .github/workflows/test.yml
  name: Run Tests
  on: [pull_request]          # trigger
  jobs:
    test:                     # one job
      runs-on: ubuntu-latest
      steps:                  # its steps, in order
        - uses: actions/checkout@v4    # fetch the code
        - run: npm install
        - run: npm test                # non-zero exit fails the workflow

## What This Buys A Team

::: story
Someone opens a pull request. Before any human has looked at it, the full test suite has already run and the result is sitting on the PR: green or red.

A reviewer reading green code can spend their attention on design and clarity. A red PR gets fixed before anyone's time is spent on it at all.
:::

::: checkpoint
A workflow triggered on \`pull_request\` runs the test suite and it fails. What have you gained over running tests manually?
- ( ) Nothing - the tests would have failed either way
- (x) It ran without anyone remembering to run it, and the result is visible on the PR before a reviewer spends time on broken code
- ( ) The tests run faster in a workflow
- ( ) It fixes the failing tests automatically
> The reliability and the timing. Manual test runs depend on someone remembering under deadline pressure, which is exactly when they get skipped. Automation removes the human from that step entirely, and surfaces the answer at the moment it's useful.
:::

::: remember
Combine this with the previous lesson's branch protection rules and the loop closes: a repository can **require** a workflow to pass before a PR is mergeable at all.

Review and testing stop being good intentions and become a gate. Nobody has to remember; nobody can skip it.
:::

::: behind
The **Actions Marketplace** hosts thousands of community-published actions - deploying to cloud providers, publishing packages, posting to Slack when a build fails.

Real workflows are mostly assembled from these rather than written from scratch. Reading a mature team's workflow file feels less like reading a script and more like reading a list of imports.
:::`,
  },
};
