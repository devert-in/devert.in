// Linux Fundamentals - rewritten lesson bodies. See operating-systems.mjs for
// the authoring rules. This subject is hands-on rather than theoretical (the
// Operating Systems subject covers the concepts), so the stories are the actual
// situations these commands get reached for - the 2am diagnosis, the cron job
// that worked manually, the permission fixed with 777.

export const LINUX_FUNDAMENTALS = {
  "terminal": {
    concept: `## Not A Worse Version Of The File Explorer

::: story
A file explorer can do exactly what someone built a button for.

A terminal can do anything the operating system can do - and it can do it to four thousand files, on a schedule, on a machine on another continent, and write down what happened.

Those aren't two interfaces to the same power. The second is a superset.
:::

::: story
There's also a blunter reason for learning it.

Most production Linux servers have no graphical desktop installed. Not disabled - not installed. A GUI consumes memory and adds attack surface that a machine serving requests has no use for.

So the terminal isn't the inconvenient option on those machines. It's the only one.
:::

## Reading The Prompt

::: cards samuel@server:~$
samuel :: Which user you're operating as. This determines what you're permitted to do.
server :: Which machine. Worth checking before running anything destructive - people have deleted the wrong database this way.
~ :: Current directory. \`~\` is your home directory.
$ :: Privilege level. \`$\` is a regular user; \`#\` means you're root.
:::

::: checkpoint
Your prompt ends in \`#\` rather than \`$\`. What does that tell you?
- ( ) The terminal is in an error state
- (x) You're operating as root, and nothing will stop you from breaking things
- ( ) You're on a remote machine
- ( ) The command failed
> Root. There are no permission checks left to protect you - which is why the convention exists and why it's worth actually looking at.
:::

::: remember
Three commands worth running the moment you land on an unfamiliar machine: \`whoami\`, \`hostname\`, \`pwd\`.

Who am I, where am I, and what am I looking at. All three are in the prompt on most systems, and confirming rather than assuming is a cheap habit with a large downside avoided.
:::

::: behind
**Headless** servers - no monitor, no keyboard, managed entirely over the network - are the norm for cloud infrastructure rather than an edge case.

Which reframes SSH, later in this subject: remote terminal access isn't a convenience feature. For most production Linux machines in existence, it is the only way any human ever interacts with them.
:::`,
  },

  "commands": {
    concept: `## The Handful That Covers Most Days

::: cards Navigation and inspection
pwd :: Where am I.
ls :: What's here. \`-l\` for detail, \`-a\` to include hidden files.
cd :: Move. \`cd ..\` goes up, \`cd\` alone goes home.
cat :: Print a whole file to the screen.
less :: Page through a file. What you want for anything large.
mkdir, cp, mv, rm :: Create a directory, copy, move-or-rename, remove.
:::

::: mistake
\`cat\` on a 400MB log file dumps 400MB into your terminal, and you get to watch it scroll for a while.

\`less\` pages through it - arrow keys to move, \`/\` to search, \`q\` to quit. Use \`cat\` for small files you want to see whole, \`less\` for anything you're not sure about.
:::

## Flags

Most commands take **flags** modifying their behaviour, and short ones combine: \`ls -la\` is \`ls -l -a\`.

::: story
Nobody memorises these. \`ls\` has over fifty flags and working professionals use perhaps six.

What matters is knowing that flags exist and how to look them up - because the flag you need for today's problem is usually one you've never used.
:::

::: remember
Every standard command carries its own documentation. \`man ls\` for the full manual, \`ls --help\` for a quick summary.

Both work offline, on any machine, instantly. Reaching for those before a web search is a habit worth building - and it's also the only option on a server with no outbound internet, which is more common than you'd expect.
:::

::: checkpoint
You need to know what \`tar\`'s \`-z\` flag does, on a server with no internet access. What do you do?
- ( ) Guess based on other commands
- (x) \`man tar\` or \`tar --help\` - the documentation ships with the command
- ( ) Wait until you're back on a connected machine
- ( ) Try it and see
> The manual is already on the machine. This is exactly the situation \`man\` exists for, and "try it and see" with \`tar\` flags is a way to overwrite an archive.
:::

::: behind
**Tab completion** is the single highest-return terminal habit.

Type a few characters and press Tab - the shell completes the filename or command, or shows the matches if it's ambiguous. On deep paths it eliminates most typing and essentially all typos.

Worth forcing into muscle memory early, because typing paths out in full is a habit that's harder to break later.
:::`,
  },

  "permissions": {
    concept: `## Who May Do What

::: story
Every file on a Linux system answers three questions about three groups of people.

Which is why a permission string is nine characters, and why it looks like line noise until you see the grid.
:::

::: cards Three audiences
Owner :: The user who owns the file.
Group :: Users belonging to the file's group.
Others :: Everyone else on the system.
:::

::: cards Three permissions, each meaning something different for directories
Read (r) :: View a file's contents. For a directory: list what's inside.
Write (w) :: Modify a file. For a directory: add or remove files in it.
Execute (x) :: Run a file as a program. For a directory: \`cd\` into it at all.
:::

::: remember
That directory column is the part that surprises people. Execute on a directory doesn't mean running it - it means being allowed to *enter* it.

Which is why a directory with read but not execute lets you see the filenames and not open any of them.
:::

## Reading The String

\`-rwxr-xr--\` breaks into a type character plus three groups of three:

::: cards
\`-\` :: Type. \`-\` is a regular file, \`d\` a directory, \`l\` a symlink.
rwx :: Owner - read, write, execute.
r-x :: Group - read and execute, no write.
r-- :: Others - read only.
:::

::: cards Octal, since chmod uses it
4 :: read
2 :: write
1 :: execute
:::

Sum them per audience: \`7\` is 4+2+1 (rwx), \`5\` is 4+1 (r-x). So \`chmod 755\` means owner rwx, group r-x, others r-x.

::: checkpoint
Decode \`drwxr-x---\`.
- ( ) A file, everyone can read it
- (x) A directory; owner full access, group read and enter, others nothing at all
- ( ) A directory anyone can write to
- ( ) A symlink with full permissions
> \`d\` for directory, then 750 in octal. Others get no access, so they cannot even list it - a common shape for a directory holding one team's data.
:::

::: mistake
\`chmod 777\` makes a permission error go away, and it does so by granting every user on the system read, write and execute.

It's the most common quick fix in Linux and one of the most common findings in security audits. When 777 fixes something, the actual problem is that you don't yet know which specific permission was missing - and the fix is to find out.
:::

::: behind
**SETUID** lets a program run with its *owner's* privileges rather than the privileges of whoever launched it.

That's how \`passwd\` works: a regular user runs it, and it needs to write to a root-owned file. Genuinely necessary, and a well-known escalation route if set on the wrong binary - an unexpected SETUID root binary is one of the first things an attacker looks for.
:::`,
  },

  "shell": {
    concept: `## Three Layers People Merge Into One

::: cards From the outside in
Terminal :: The window you type into. Just an interface.
Shell :: The program running inside it, reading your commands and interpreting them.
Kernel :: The operating system core that actually does the work.
:::

::: story
You type \`ls\`. The terminal passes the characters to the shell. The shell parses them, resolves \`ls\` to a program, and asks the kernel to run it. The kernel reads the directory and returns the result, which the shell hands back to the terminal to display.

Four steps, three programs, one word typed.
:::

**Bash** is the usual default. **zsh** (now standard on macOS) and **fish** are common alternatives, differing mainly in interactive conveniences - completion, prompts, history - while running the same commands.

## Environment Variables

::: cards
$PATH :: The list of directories searched when you type a bare command name. This is why \`ls\` works without typing \`/bin/ls\`.
$HOME :: Your home directory.
$USER :: Your username.
:::

\`echo $PATH\` shows one; \`export MY_VAR="value"\` creates one.

::: checkpoint
You install a program and the shell reports "command not found", though the binary definitely exists. Most likely cause?
- ( ) The binary is corrupt
- (x) Its directory isn't in $PATH, so the shell doesn't know where to look
- ( ) It needs to be run as root
- ( ) The shell needs reinstalling
> $PATH. The shell only searches the directories listed there - which is also why the fix is either adding the directory to PATH or invoking the binary by its full path.
:::

## Making It Persist

::: remember
\`~/.bashrc\` runs automatically every time a new interactive shell starts. Anything you put there applies to every future session.

Aliases (\`alias ll='ls -la'\`), environment variables, prompt customisation. Set it once rather than retyping it in every terminal you open - which is what most people do for months before discovering this file.
:::

::: behind
A **login** shell and a non-login **interactive** shell read different startup files - \`~/.bash_profile\` versus \`~/.bashrc\`.

Which produces the classic confusion: a variable that works in your terminal and is mysteriously absent over SSH, or vice versa. The usual fix is having \`.bash_profile\` source \`.bashrc\`, so there's one file to maintain rather than two with subtly different triggers.
:::`,
  },

  "processes": {
    concept: `## Finding Out What's Running

::: story
A server is slow. Something is eating the CPU. Nobody knows what.

This is the most common diagnostic situation in Linux administration, and it's answered with two commands.
:::

::: cards
ps aux :: A snapshot of every running process - PID, owner, CPU and memory use, and the command. Pipe it through \`grep\` to find one.
top / htop :: A live, continuously updating view sorted by resource use. What you open when something is wrong right now.
:::

## Foreground And Background

::: story
Run a command normally and your terminal is held until it finishes. For a twenty-minute job that means a terminal you can't use for twenty minutes.

Append \`&\` and it runs in the background, handing your prompt straight back.
:::

::: cards Managing them
command & :: Start it in the background.
jobs :: List this shell's background jobs.
fg :: Bring one back to the foreground.
bg :: Resume a paused one in the background.
:::

## Stopping Something

::: cards Two signals worth knowing
kill PID :: Sends SIGTERM. A polite request - the process can close files, flush writes, save state, and exit cleanly.
kill -9 PID :: Sends SIGKILL. Immediate, unblockable termination. The process gets no chance to do anything.
:::

::: checkpoint
A database process won't respond to \`kill\`. Why try SIGTERM first rather than going straight to \`kill -9\`?
- ( ) SIGKILL requires root
- (x) SIGTERM lets it flush pending writes and close cleanly; SIGKILL can leave data or locks in a broken state
- ( ) SIGKILL is slower
- ( ) There's no real difference
> Cleanup. A database killed with -9 mid-write may need recovery on restart. Escalate when the polite request is genuinely ignored - not as a first move.
:::

::: mistake
\`kill -9\` becomes a reflex because it always works. That reliability is exactly the problem - it always works because it takes away the process's ability to protect its own data.

Reach for it when SIGTERM has demonstrably failed. Not as the default.
:::

::: behind
Process priority is set with \`nice\` and adjusted with \`renice\`, on a scale from -20 to 19 - and the scale is inverted from what you'd guess.

**Higher niceness means lower priority.** A process at 19 is being maximally "nice" to others by yielding CPU. Worth memorising explicitly, because the intuitive reading is backwards.
:::`,
  },

  "networking": {
    concept: `## A Sequence, Not A Toolbox

::: story
"It can't connect."

Four words, and a dozen possible causes - wrong address, machine down, service not running, wrong port, firewall, application error.

Guessing wastes an afternoon. Three commands in order narrows it in about ninety seconds.
:::

::: timeline The diagnostic order
ping the host :: Is the machine reachable at all? If not, nothing above the network layer matters and you stop here.
ss -tulpn :: Is anything actually listening on the port you expect, and which process owns it?
curl the endpoint :: Does the application respond, and with what?
:::

## What Each One Answers

::: cards What each tells you
ping :: Reachability only. Says nothing about whether your service works.
ss -tulpn :: Open listening ports and their owning processes. \`netstat -tulpn\` on older systems.
curl :: A real HTTP request from the command line. \`-I\` for headers only, which is usually enough to confirm the service is alive.
:::

::: checkpoint
\`ping\` succeeds. \`ss -tulpn\` shows nothing listening on port 8080. What have you learned?
- ( ) A firewall is blocking the connection
- (x) The service isn't running, or is bound to a different port - so it isn't a network problem
- ( ) The machine is unreachable
- ( ) DNS is misconfigured
> The service isn't there to connect to. Which means every minute spent on firewall rules would have been wasted, and this is exactly what the ordering buys you.
:::

::: remember
The value of a fixed order is that each step eliminates a whole category of cause.

Reachability, then "is something listening", then "does it answer properly". Working the sequence beats intuition consistently, especially at 2am when intuition is at its worst.
:::

::: didyouknow
A common variant worth recognising: \`ss\` shows the service listening on \`127.0.0.1:8080\` rather than \`0.0.0.0:8080\`.

It's running, and it's bound to localhost only - so it accepts connections from the machine itself and refuses everything from outside. The service is fine; the bind address is the bug, and it looks identical to a firewall problem from the client side.
:::

::: behind
\`traceroute\` extends \`ping\` by showing every router hop along the path, with latency at each.

Useful when a connection works but is slow: it tells you *where* the delay is, rather than just that it exists. Particularly for problems that turn out to be somewhere in the middle rather than at either end.
:::`,
  },

  "ssh": {
    concept: `## The Only Door In

::: story
The server has no monitor and no keyboard, and it's in a data centre you'll never visit.

**SSH** gives you an encrypted, fully interactive terminal on it, indistinguishable from sitting in front of it.

  ssh username@remote-host
:::

## Two Ways To Prove Who You Are

::: cards
Password :: Simple, and brute-forceable. Any internet-facing SSH port with password auth enabled receives automated guessing attempts continuously - not occasionally, continuously.
Key-based :: A key pair. The **private** key stays on your machine and is never sent anywhere. The **public** key goes on the server. The server verifies you hold the private key without it ever crossing the network.
:::

::: remember
That last point is the security argument, and it's stronger than "keys are longer than passwords".

A password is transmitted to be checked. A private key never leaves your machine - it's used to answer a challenge, and the answer proves possession without revealing the key. There is nothing on the wire to capture.
:::

::: cards Setting it up
ssh-keygen -t ed25519 :: Generate a key pair.
ssh-copy-id user@host :: Install your public key into the server's \`~/.ssh/authorized_keys\`.
ssh user@host :: Connect. No password prompt.
:::

::: checkpoint
Which key goes on the remote server?
- ( ) Both, so it can verify either way
- (x) The public key only - the private key never leaves your machine
- ( ) The private key, so the server can decrypt
- ( ) Neither; keys are held by a central service
> Public only. Sending a private key to a server - or into a chat, or a repository - hands over your identity, and it's the single most damaging SSH mistake there is.
:::

::: mistake
Private keys end up committed to git more often than anyone would like. Once pushed, treat it as compromised and generate a new pair - rewriting history doesn't help if anyone cloned or any scanner indexed it.

Adding \`id_rsa\`, \`id_ed25519\` and \`*.pem\` to a global gitignore takes one minute and prevents the whole category.
:::

::: remember
\`scp\` copies files over the same connection: \`scp local.txt user@host:/path/\` to upload, \`scp user@host:/path/file.txt .\` to download.

Same authentication, same encryption - the SSH channel repurposed from an interactive shell to a file transfer.
:::

::: behind
SSH can also **tunnel** other traffic. \`ssh -L 8080:localhost:80 user@host\` forwards your local port 8080 to port 80 on the remote machine.

Which lets you reach an internal dashboard that isn't exposed to the internet, through a port you already have access to, without opening a firewall rule. Genuinely one of the most useful things SSH does, and one of the least known.
:::`,
  },

  "cron": {
    concept: `## Work That Happens While You Sleep

::: story
Backups at 2am. Log rotation weekly. A health check every fifteen minutes.

None of these should require a human being awake, and **cron** is the scheduler that runs them.
:::

\`crontab -e\` edits your jobs, one per line, each with a five-field schedule.

::: cards The five fields, in order
Minute :: 0-59
Hour :: 0-23
Day of month :: 1-31
Month :: 1-12
Day of week :: 0-6, Sunday is 0
:::

  0 2 * * * /home/user/backup.sh

Minute 0, hour 2, any day, any month, any weekday - so 2:00am daily.

::: cards Field syntax
* :: Every value.
*/15 :: Every 15 units - in the minute field, every quarter hour.
1-5 :: A range. In day-of-week, Monday to Friday.
:::

::: checkpoint
What does \`30 3 * * 1\` mean?
- ( ) Every 30 minutes on the 3rd
- (x) 3:30am every Monday
- ( ) Every Monday in March
- ( ) 1:30am every third day
> Minute 30, hour 3, any day of month, any month, weekday 1 - Monday. Reading these correctly is a common interview question precisely because the field order isn't guessable.
:::

## The Failure Everyone Hits Once

::: story
The script works perfectly when you run it. You add it to cron. It silently does nothing, every night, and you find out a week later.

Cron runs jobs in a minimal environment. Your \`$PATH\` isn't there, your shell config never ran, your aliases don't exist. A script relying on any of that works interactively and fails under cron - and fails *silently*, because there's no terminal for the error to appear on.
:::

::: cards Two fixes, both non-optional
Absolute paths :: For every command and every file. \`/usr/bin/python3\`, not \`python3\`. Never rely on PATH.
Redirect output :: \`>> /home/user/backup.log 2>&1\` - both stdout and stderr. Without this the error message is written to nowhere.
:::

::: remember
The \`2>&1\` matters as much as the first redirect. Without it you capture normal output and lose the error messages - which are the only part you needed.
:::

::: behind
**systemd timers** are the modern alternative, and they fix cron's two real weaknesses.

Logging goes to \`journalctl\` by default rather than wherever you remembered to redirect it. And a missed job - the machine was off at 2am - can be run on next boot, which cron simply skips.

Worth reaching for when a scheduled task is genuinely production-critical, since "it silently didn't run" is cron's characteristic failure.
:::`,
  },

  "bash": {
    concept: `## From Typing Commands To Writing Tools

::: story
You've been using Bash for eight lessons without dwelling on it - it's the shell interpreting everything typed so far.

It's also a programming language, which is the part that turns this subject from a set of commands into something that runs without you.
:::

::: story
The name is a joke. Bash is the GNU Project's free reimplementation of the original Unix Bourne shell - so, "Bourne Again Shell".

Free, open-source and POSIX-compatible, which is the actual reason it became universal: it did what \`sh\` did, ran anywhere, and cost nothing. It spread with Linux itself.
:::

## What Scripting Adds

::: cards
Variables and substitution :: Capture a command's output and reuse it.
Conditionals :: Act differently depending on whether something succeeded.
Loops :: Do the same operation to four hundred files.
Functions :: Name a sequence and reuse it.
:::

::: remember
Every diagnostic sequence in this subject is a candidate for a script.

The ping-then-ss-then-curl check from the Networking lesson, run by hand at 2am, is a script that could have run every five minutes and logged the answer before anyone woke up.
:::

::: checkpoint
Why is a Bash script preferable to remembering a sequence of commands?
- ( ) Scripts run faster
- (x) It runs identically every time, can be scheduled, and encodes what you worked out so the next person doesn't have to
- ( ) Bash requires it
- ( ) Scripts use less memory
> Repeatability and transfer. The knowledge stops living in one person's memory - which is most of the value, and it's why undocumented manual procedures are a liability.
:::

::: mistake
A production script without \`set -euo pipefail\` at the top continues cheerfully after a failed command.

Which means a backup script whose \`tar\` failed still deletes the old backup, reports success, and leaves you with nothing. Failing loudly is the behaviour you want; Bash's default is the opposite.
:::

::: behind
This subject deliberately stops at "what Bash is and why it matters for administration".

This platform's dedicated Bash path continues from here: variables, conditionals, loops, functions, text processing with grep, sed and awk, and the safety habits that separate a script you run once from one you schedule and trust.

That's the natural next step - and everything in this subject becomes considerably more useful once it can be automated.
:::`,
  },
};
