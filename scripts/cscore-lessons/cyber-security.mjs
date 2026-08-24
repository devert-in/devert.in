// Cyber Security - rewritten lesson bodies. See operating-systems.mjs for the
// authoring rules. This subject is organisational/operational security, and its
// source prose was the heaviest user of "genuinely"/"actually" filler in the
// whole catalogue - all stripped here. The stories lean on real incident
// shapes, because every control in this subject exists as an answer to one.

export const CYBER_SECURITY = {
  "introduction-to-cyber-security-the-cia-triad": {
    concept: `## Three Words That Cover Everything

::: story
A hospital's patient records system is encrypted so thoroughly that nobody outside the building could ever read a single record.

It has also been down for six hours, and nobody can look up a patient's allergies.

Perfectly confidential. Perfectly useless.
:::

Security is not one goal. It's three, and they can be traded against each other - which is why a framework naming all three exists.

::: cards The CIA Triad
Confidentiality :: Only authorised people can read the information. Broken by disclosure.
Integrity :: The information is accurate and hasn't been improperly altered - by an attacker or by accident. Broken by corruption.
Availability :: Authorised people can get to it when they need it. Broken by outage.
:::

::: remember
Every control in this subject serves at least one of these three. Encryption serves confidentiality. Checksums and signatures serve integrity. Backups and DDoS mitigation serve availability.

When you meet a new security tool, the useful first question is which leg it's holding up - and which one it might be weakening in exchange.
:::

::: checkpoint
Ransomware encrypts a company's files and demands payment. Which leg of the triad is primarily attacked?
- ( ) Confidentiality - the attacker now has the data
- (x) Availability - the data still exists but nobody can use it
- ( ) Integrity - the data has been altered
- ( ) None; ransomware is a separate category
> Availability. The files aren't stolen or corrupted, they're unreachable - which is why offline backups defeat ransomware while encryption doesn't.
:::

## Where This Subject Sits

::: cards Two complementary halves
Security Fundamentals :: Application-level security. OWASP vulnerabilities, SQL injection, XSS, JWT authentication. The concerns of someone writing code.
This subject :: Organisational and operational security. Malware, phishing, network operations, incident response, compliance. The concerns of someone protecting a company.
:::

::: story
The reason both exist: flawlessly secure code does not stop an employee from typing their password into a convincing fake login page.

An attacker doesn't need your SQL injection to be exploitable if they can simply ask someone for the keys and be given them.
:::

## Who Is Actually Attacking You

::: cards Threat actors, by sophistication
Opportunistic :: Automated scans hunting for any unpatched target anywhere. Not aimed at you. This is the overwhelming majority of what any small organisation faces.
Targeted :: Nation-states, organised crime, or a motivated insider. Specific intent, real resources, and patience.
:::

::: remember
This distinction is what makes security planning proportionate rather than performative. A small business defending against automated scanning needs patching, backups and staff awareness. A bank faces adversaries who will spend months on one target.

Both need security. They need visibly different amounts of it, and pretending otherwise wastes money at one end and lives dangerously at the other.
:::

::: behind
Some frameworks extend the triad with **non-repudiation** - being unable to credibly deny having performed an action, achieved through digital signatures and audit logs - and **authentication**, verifying identity before authorisation is even considered.

Both matter in practice because real incidents so often hinge on proving who did what, and when. An audit log is a security control even though it prevents nothing.
:::`,
  },

  "types-of-malware": {
    concept: `## The Distinctions Change What You Do

::: story
"We have a virus" is what gets reported. It matters enormously whether that's true, because the response is different.

If it's a virus, you trace which files were shared. If it's a worm, every unpatched machine on the network is already compromised and you have minutes. If it's a trojan, someone was persuaded to install it and others probably were too.

Same word, three very different afternoons.
:::

::: cards Distinguished by how they spread
Virus :: Attaches to a legitimate file and spreads when a human shares or runs it. Needs human action to propagate.
Worm :: Spreads autonomously across a network, exploiting vulnerabilities to jump machine to machine. No human required - which is what makes it fast and dangerous.
Trojan :: Disguised as useful software. Does not self-replicate at all; relies entirely on persuading a human to install it.
:::

::: cards Distinguished by what they do
Spyware :: Covertly monitors and exfiltrates activity - keystrokes, browsing, credentials.
Rootkit :: Hides its own presence, and often other malware's, from detection tools. Built to resist being found.
Botnet :: A network of compromised machines under one attacker's remote control, used for coordinated attacks like DDoS.
:::

::: checkpoint
Malware spreads to forty machines overnight with no user having opened anything. Which category?
- ( ) Virus
- (x) Worm
- ( ) Trojan
- ( ) Spyware
> A worm - autonomous propagation is the defining trait. Which also tells you the entry point was an unpatched vulnerability rather than a person's mistake, and that changes both the containment and the fix.
:::

## Ransomware, And The One Defence That Works

**Ransomware** encrypts a victim's files and demands payment - usually cryptocurrency - for the decryption key. A direct attack on availability.

::: story
A company is hit and stays calm, because it has backups. The backups are on a network file server, which the ransomware reached forty minutes ago and encrypted too.

The backups existed. They were reachable from the compromised network, so they were part of the attack surface rather than protection from it.
:::

::: remember
The defence is **offline or otherwise isolated** backups. A backup reachable from a compromised network is a target, not a recovery plan.

And paying is discouraged by security professionals and law enforcement alike: it funds the next attack, and buys no guarantee that a working key arrives.
:::

::: mistake
Using "virus" as the generic word for all malware is harmless in conversation and costly in an incident. The categories differ in how they spread, which is the single most important input to how you contain them - so the imprecise word delays the right response.
:::

::: behind
**Fileless malware** is the modern evasion. Rather than writing a detectable file to disk - which is what signature-based antivirus scans for - it operates in memory, often abusing already-trusted tools like PowerShell to do its work.

There's nothing on disk to scan, which is precisely why modern security products lean on **behavioural** detection: watching for suspicious patterns of activity rather than matching known files.
:::`,
  },

  "social-engineering-phishing": {
    concept: `## Attacking The Person Instead

::: story
An attacker faces a well-configured firewall, current patches, encrypted traffic and strong authentication.

So they send an email that appears to come from the IT department, explaining that a password reset is required within the hour, with a link.

None of the technical controls were defeated. They were bypassed, because the person opened the door from inside.
:::

**Social engineering** targets the human rather than the system: manipulating someone into taking an action that compromises security.

::: cards Escalating specificity
Phishing :: A generic fraudulent message impersonating a trusted source, sent to thousands. Cheap, and effective at volume.
Spear phishing :: Personalised using researched details - a real colleague's name, a real recent event. Far more convincing, far harder to spot.
Whaling :: Spear phishing aimed at senior executives, often impersonating another executive to authorise a large transfer.
:::

::: checkpoint
An email arrives naming your actual manager and referencing a real project deadline, asking you to urgently approve a payment. What kind of attack?
- ( ) Generic phishing
- (x) Spear phishing - the specific researched details are the signature
- ( ) A worm
- ( ) Not an attack; it names real people
> Spear phishing. Real details are exactly what makes it work - and "it mentioned things only an insider would know" is why victims report feeling foolish afterward when they shouldn't. That research is the attack.
:::

## Why Awareness Training Doesn't Fix It

::: cards The three levers, and why they're durable
Urgency :: "Your account will be suspended in one hour." Time pressure exists specifically to prevent the pause in which you'd notice something is wrong.
Authority :: A message from the boss, or IT. People comply with perceived authority, and questioning it feels socially expensive.
Trust :: Impersonating a known colleague or a familiar brand. You are not suspicious of people you know.
:::

::: story
These aren't weaknesses. Deferring to your manager, responding to urgency, and trusting colleagues are what make an organisation function.

An attack that exploits cooperation cannot be trained away, because the trait being exploited is one you need people to keep having.
:::

::: remember
So the realistic defence isn't eliminating the instinct - it's inserting a habit alongside it: for any unusual, high-stakes, or urgent request, **pause and verify through a separate channel**.

Not reply to the email. Phone the person. The attacker controls the channel the request arrived on, and nothing else.
:::

::: behind
**Vishing** (voice calls) and **smishing** (SMS) extend the same tactics to other channels, and both are rising as email filtering improves.

Awareness training that covers only email leaves a gap an attacker will simply walk through - which is why the "verify through a separate channel" habit is the durable version of the advice, rather than a list of what suspicious emails look like.
:::`,
  },

  "network-security-operations": {
    concept: `## Controlling What Gets In, And How Far

::: story
A single compromised laptop should be a bad afternoon. In a flat network, it's a company-wide incident - because from that laptop, everything else is directly reachable.

The difference between those two outcomes isn't whether you were breached. It's how the network was arranged before you were.
:::

## Two Layers Of Network Defence

::: cards
Firewall :: Inspects traffic and allows or blocks it by port, protocol and address. Controls what is permitted to reach the network at all - the boundary.
Network segmentation :: Divides the internal network into isolated zones, so employee workstations cannot directly reach production servers. Controls how far an intruder can move once inside.
:::

::: remember
Segmentation assumes the firewall will eventually fail. That assumption is the whole point - it converts "we were breached" into "one segment was breached", which is the difference between an incident and a catastrophe.

The term for designing this way is limiting the **blast radius**.
:::

## Detect, Or Prevent

::: cards
IDS - Intrusion Detection System :: Watches traffic and *alerts* on suspicious patterns. Takes no action itself.
IPS - Intrusion Prevention System :: Watches, and *blocks* automatically in real time, without waiting for a human.
:::

::: checkpoint
An IPS misidentifies a legitimate traffic surge as an attack. What happens?
- ( ) It alerts staff, who investigate
- (x) It blocks the legitimate traffic automatically - a false positive becomes an outage
- ( ) Nothing; IPS only monitors
- ( ) It asks for confirmation first
> That's the trade. An IPS responds faster than any human could, and a false positive becomes self-inflicted downtime with nobody in the loop. Which is exactly why some organisations run detection-only in front of critical paths.
:::

## Attacking Availability Directly

::: story
Most attacks in this subject want something - data to steal, records to alter.

A **DDoS** attack wants nothing. It floods a target with traffic, often from a botnet, until legitimate users can't get through. No theft, no alteration, purely denial.
:::

::: remember
Which makes it structurally different to defend against. You can't detect a DDoS by looking for something suspicious in the requests - individually they may be perfectly ordinary. The attack *is* the volume.

So the defence is capacity and filtering upstream: rate limiting at the edge, and mitigation services with enough bandwidth to absorb the flood before it reaches you.
:::

::: behind
A **WAF** - Web Application Firewall - operates at the application layer rather than filtering ports and protocols, inspecting web traffic for attacks like SQL injection and XSS.

It sits precisely at the intersection of this subject and Security Fundamentals: a network-level control defending against application-level vulnerabilities. Useful as a layer, and not a substitute for fixing the code it's shielding.
:::`,
  },

  "penetration-testing-basics": {
    concept: `## Finding It Before Someone Else Does

::: story
Every organisation has vulnerabilities it doesn't know about. The only question is who finds them first, and what they do next.

A penetration test is arranging for that to be someone on your side, with a report at the end instead of an extortion demand.
:::

**Penetration testing** is authorised security professionals deliberately attacking a system, using real attacker techniques, to find and fix weaknesses first.

::: timeline The four phases
Reconnaissance :: Gathering information about the target - domains, employee names, exposed services. Passive sources first, then active probing.
Scanning :: Actively probing for open ports, running services, and software versions with known vulnerabilities.
Exploitation :: Attempting to actually exploit what was found, to establish whether the vulnerability is real and how far it goes.
Reporting :: Documenting every finding with a prioritised, concrete remediation recommendation.
:::

::: remember
The last phase is the deliverable, and it's the one people undervalue.

A test that finds a critical vulnerability and describes it unclearly, or buries it among forty low-severity notes, has produced nothing actionable. The exploitation is the interesting part; the report is the *point*.
:::

## The Line That Is Not Negotiable

::: story
The techniques in an authorised penetration test and the techniques in a criminal intrusion are the same techniques.

What separates them is not skill, not intent, and not whether the vulnerability was easy to find. It is documented permission from the system's owner.

Without it, "I was only checking whether it was secure" is a description of unauthorised access, and it is treated as one.
:::

::: cards What authorisation looks like
Rules of engagement :: A written document defining what systems are in scope, which techniques are permitted, and the exact time window.
Signed by the owner :: Someone with genuine authority over the systems - not a friendly contact who said it sounded fine.
:::

::: checkpoint
You notice a serious vulnerability in a company's public website and, wanting to help, verify it by exploiting it. What have you done?
- ( ) A public service - you found a real bug
- (x) Unauthorised access, regardless of intent
- ( ) Nothing wrong, since the site was public
- ( ) Legitimate testing, since you'll report it
> Unauthorised access. Good intent is not a defence and neither is the vulnerability being real. Report the observation without exploiting it, or check for a bug bounty programme that grants permission in advance.
:::

::: behind
A **bug bounty** programme is the scalable alternative: rather than commissioning one time-boxed test, an organisation publicly invites researchers to find and report vulnerabilities for a reward scaled to severity.

It buys a far wider range of skills and perspectives than any single engagement, and gives up predictable timing and coverage in exchange. Most mature security programmes end up running both.
:::`,
  },

  "incident-response": {
    concept: `## What You Do At 3am Depends On What You Wrote Last Quarter

::: story
Two companies suffer the same breach on the same night.

The first spends ninety minutes working out who has authority to disconnect a production server, whether legal needs to be told before or after, and who is allowed to talk to customers.

The second follows a document. Someone is on call, the decision rights are written down, the communication templates exist. They are contained before the first company has finished deciding who's in charge.

Neither company prevented the breach. One had answered the questions in advance.
:::

**Incident response** is the prepared, structured process for detecting, containing and recovering from an incident that has already happened.

## The Six Phases

::: timeline The six phases
Preparation :: Before anything happens. A documented plan, a designated team, tools and access already in place.
Identification :: Detecting that an incident has occurred and establishing its scope.
Containment :: Stopping the spread. Short-term first - isolate the machine - then longer-term measures.
Eradication :: Removing the root cause. The malware, and the vulnerability that admitted it.
Recovery :: Restoring affected systems to verified-safe normal operation.
Lessons learned :: An honest post-incident review: what happened, why, and what changes.
:::

::: checkpoint
You delete the malware from an infected machine and restore it to service. Which phase have you skipped?
- ( ) Containment
- (x) Eradication - you removed the symptom, not the vulnerability that let it in
- ( ) Recovery
- ( ) None; the machine is clean
> Eradication addresses the *root cause*. Deleting the file while leaving the unpatched service open means the same incident recurs, and next time it looks like the response failed rather than the fix being incomplete.
:::

::: remember
Preparation is the highest-leverage phase, and it's the only one you can do calmly.

Every other phase happens under pressure, with incomplete information, while the damage continues. What preparation buys is that none of the questions being asked at that moment are questions that could have been answered beforehand.
:::

::: mistake
Containment and eradication get merged, and the consequence is a recurring incident.

**Containment** stops the bleeding - isolate the machine, block the traffic. **Eradication** removes the cause. Doing the first and calling it finished is one of the most common reasons an organisation is hit twice by the same thing.
:::

::: behind
A **CSIRT** - Computer Security Incident Response Team - is the pre-designated group that executes this lifecycle. Formal and internal at large organisations, often an external on-call contract at smaller ones.

The specific thing worth pre-defining is decision rights: who authorises taking production offline, who speaks to regulators and press, who does the technical work. Confusion about authority is the most reliable way to lose the first hour, and the first hour is the one that matters.
:::`,
  },

  "security-policies-compliance": {
    concept: `## Rules For People, Standards From Outside

::: story
A firewall rule is unambiguous and enforced by a machine.

"Don't email customer data to your personal address so you can work on it at home" is neither. It has to be written down, communicated, and agreed to - because no technical control can express it and no reasonable one can prevent it.
:::

A **security policy** translates security goals into concrete expectations for how people behave.

::: cards Policies you'll meet everywhere
Acceptable Use :: What employees may and may not do with company systems and data.
Password Policy :: Minimum requirements, rotation rules, whether reuse is permitted.
Data Classification :: Sensitivity tiers - public, internal, confidential, restricted - and the handling rules for each.
:::

::: remember
Data classification is the quietly important one. Without tiers, every rule has to be written for the most sensitive data you hold, which means either impractical rules for everything or lax rules for the data that matters.
:::

## Standards Imposed From Outside

**Compliance frameworks** are external standards you must meet - by law, industry regulation, or a partner's contract.

::: cards
GDPR :: EU regulation on personal data privacy. Notably severe financial penalties.
HIPAA :: US regulation covering healthcare and medical data.
PCI-DSS :: Industry standard for anyone handling credit card payment data.
ISO 27001 :: Broad international standard for information security management.
:::

## Compliant Is Not The Same As Secure

::: story
An organisation passes its PCI-DSS audit. Every checklist item satisfied, certificate on the wall.

Six weeks later it's breached through something the checklist never asked about - because a checklist is a finite list written to be auditable across thousands of different organisations, and your specific weaknesses were not on it.
:::

::: checkpoint
A company is fully compliant with its framework and suffers a serious breach. Was the compliance worthless?
- ( ) Yes - compliance is pure paperwork
- (x) No - it's a minimum baseline, which is real and also not a guarantee
- ( ) Yes, since it clearly didn't prevent anything
- ( ) The breach proves they weren't actually compliant
> A baseline. Compliance reliably eliminates a set of known common failures, which is genuinely valuable and is not the same as covering everything. Treating the certificate as the goal is the error, not obtaining it.
:::

::: remember
The mature posture: pursue security as the goal, and treat compliance as a useful forcing function that drives budget and attention toward it.

Compliance work often funds security work that wouldn't otherwise be approved. That's its real value, and it's a floor rather than a ceiling.
:::

::: behind
The **principle of least privilege** underlies most of the policies here: every person, system and process gets the minimum access needed for its function, and no more.

Its value shows up specifically at the moment of compromise. A stolen account that could reach everything is a catastrophe; one that could reach one team's files is an incident. Least privilege doesn't reduce the chance of compromise at all - it reduces what compromise means.
:::`,
  },

  "risk-management": {
    concept: `## Two Numbers, Not One

::: story
Which deserves attention first: a flaw that is certain to be exploited and would cost you a morning, or one that would destroy the company and requires an adversary with a national budget?

Neither question is answerable from severity alone, or from likelihood alone. Answering it needs both.
:::

::: remember
**Risk = Likelihood x Impact.**

Very likely and trivial is low risk. Catastrophic and near-impossible is also low risk. Prioritising by either number alone produces a list that looks rigorous and is wrong.
:::

::: timeline The management cycle
Identify :: Catalogue what you have and what could threaten each thing. You cannot protect an asset you don't know about.
Assess :: Estimate likelihood and impact for each, to get a relative priority order.
Treat :: Choose and implement a response - the four options below.
Monitor :: Check that treated risks stay controlled, and that new ones get caught. Then repeat.
:::

## The Four Responses

::: cards
Avoid :: Eliminate the risk by stopping the activity. Decommission the legacy system rather than defending it.
Mitigate :: Reduce likelihood or impact with a control. Patch the vulnerability, add the firewall rule.
Transfer :: Move the financial consequence elsewhere. Cyber insurance, so a realised incident's cost is partly borne by an insurer.
Accept :: Decide deliberately, with the numbers in front of you, to leave it as it is.
:::

::: checkpoint
A legacy server holds no sensitive data, is rarely accessed, and would cost three months of work to replace. Best response?
- ( ) Mitigate - harden it thoroughly regardless of cost
- (x) Accept, documented - low impact and low likelihood don't justify three months
- ( ) Transfer - insure against it
- ( ) It's impossible to decide without a penetration test
> Accept, and write down that you did. Spending three months on your lowest-impact asset is a real cost paid to feel thorough - and the documentation is what makes it a decision rather than an oversight.
:::

::: mistake
Reading "accept" as negligence is the most common misunderstanding in this topic, and it leads somewhere worse: an organisation that won't formally accept anything ends up ignoring risks informally instead.

The goal was never zero risk - that isn't purchasable. The goal is that every significant risk has been *decided about* rather than left unexamined.
:::

::: behind
A **risk matrix** plots likelihood against impact on a grid, sorting risks into visible priority bands - urgent in one corner, ignorable in the other.

Its real function is communication rather than analysis. It makes prioritisation legible to executives who won't read a risk register, and getting their agreement is usually what unblocks the budget to treat anything.
:::`,
  },

  "digital-forensics": {
    concept: `## Reconstructing What Happened, Provably

::: story
An investigator finds clear evidence of exactly how an attacker got in, and who they were.

In court, the defence asks who handled the drive between Tuesday and Thursday. Nobody wrote it down.

The evidence is accurate. It is also inadmissible, and the case is materially weaker than if it had never been found.
:::

**Digital forensics** is collecting, preserving and analysing digital evidence to reconstruct an incident - with the additional requirement that the findings survive legal scrutiny.

## Chain Of Custody

A documented record of exactly who handled each piece of evidence, when, and what was done to it - from collection through analysis and storage.

::: remember
Any gap in that record is an opening: it lets someone credibly argue the evidence could have been altered during the undocumented period, and credibility is all that's needed.

Which is why forensic procedure looks bureaucratic. The paperwork isn't adjacent to the evidence's value - for legal purposes it largely *is* the evidence's value.
:::

## Collect The Fragile Things First

::: timeline Volatility, most fragile first
RAM contents :: Gone completely the instant the machine powers off. Running malware, encryption keys, active connections live here.
Network connections and running processes :: Also lost quickly, and only meaningful while the machine is live.
Temporary files and logs :: Persist longer, but rotate and get overwritten.
Disk data :: The most persistent. It will still be there in an hour.
:::

::: checkpoint
An investigator images the hard drive carefully, then powers the machine down. What's been lost?
- ( ) Nothing - the disk image captures everything
- (x) Everything that only existed in memory: running processes, live connections, possibly encryption keys
- ( ) Only the system logs
- ( ) Nothing important for a legal case
> Memory. And with fileless malware - which never touches disk - it can mean losing the only evidence the attack existed. The disk was the safe thing to collect, which is exactly why collecting it first is the tempting mistake.
:::

::: mistake
Doing the disk image first feels like diligence. It's the most familiar step, it's clearly important, and it produces a reassuring artifact.

Meanwhile the volatile evidence is evaporating. Order matters more than thoroughness here, because thoroughness in the wrong order permanently destroys options.
:::

::: behind
A **write blocker** is hardware or software that physically prevents any write reaching the original evidence media while still allowing reads.

Combined with a cryptographic hash computed before and after analysis, it lets an investigator *prove* the original was never altered - turning chain of custody from a documented claim into a verifiable one.
:::`,
  },

  "interview-questions": {
    concept: `## Predictable Ground

::: story
Security interviews - analyst, SOC, GRC - cover a narrow and stable set of topics. Which is good news: the material is knowable in advance.

What separates a strong candidate is rarely knowing an additional fact. It's connecting the ones everyone knows.
:::

## The Answer Shape

::: timeline Structure that works
Define it :: Precisely, in one sentence.
Give an example :: A concrete control, attack or incident - not a restatement.
Connect it outward :: To the CIA Triad, to application security, or to networking fundamentals. This is the step most candidates skip.
:::

::: reveal What connecting outward sounds like
Asked what a WAF is, an adequate answer defines it: a firewall operating at the application layer, filtering web traffic.

A strong answer keeps going:

"It filters web traffic for application-layer attacks - SQL injection, XSS - unlike a network firewall working on ports and protocols. So it sits exactly between this subject and application security: a network-level control defending against code-level vulnerabilities.

Which is also its limitation. A WAF shields vulnerable code; it doesn't fix it. If the injection flaw is still in the query, the WAF is a filter someone will eventually find a way around."

Same fact. The second version demonstrates you understand where the tool sits and what it doesn't do.
:::

## The Five To Have Cold

::: cards
The CIA Triad :: All three, each with a concrete control. Interviewers ask which leg a given attack targets.
Malware distinctions :: Virus, worm, trojan, ransomware - by spreading mechanism and goal, not vibes.
IDS vs IPS, and DDoS :: The detect-versus-block trade-off, and why DDoS is an availability attack specifically.
The six IR phases, in order :: Especially containment versus eradication, which is the most-probed pair here.
Risk = likelihood x impact :: Plus the four responses, and why "accept" is legitimate.
:::

::: checkpoint
Asked about phishing defence, you describe email filtering and awareness training. What's the stronger addition?
- ( ) Naming more filtering products
- (x) That the durable defence is verifying unusual requests through a separate channel, because the tactics exploit traits you can't train away
- ( ) That phishing is unpreventable
- ( ) Recommending the organisation block all external email
> The reasoning about *why* training alone plateaus. It shows you've thought about the failure mode rather than reciting the standard controls - and it's a genuinely better answer, not just a longer one.
:::

::: mistake
The reliable stumble is the incident response lifecycle out of order, or containment and eradication conflated. Both are asked constantly and both are easy to fix by rehearsing the sequence out loud once.
:::

::: behind
Senior and leadership interviews shift toward **security metrics**: mean time to detect, mean time to contain, percentage of systems patched inside a target window.

The reason is straightforward. At that level the job is securing budget and attention from people who don't read technical reports - so being able to express security posture in numbers a business audience acts on is the skill being tested, and it's a different one from knowing how an attack works.
:::`,
  },
};
