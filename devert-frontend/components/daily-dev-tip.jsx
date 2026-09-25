"use client";

import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";

// One real thing worth knowing, every day.
//
// This replaced a "DSA Fundamentals - Day 1: The Two-Pointer Technique" card
// that sat at 0% for everyone and pointed at a course nobody was enrolled in -
// prime dashboard space spent telling you that you had not started something.
//
// THE RULE FOR WHAT GOES IN HERE. It must be true, specific and checkable -
// never "write clean code". And it has to land on a first-year who has not met
// the term yet, so every entry opens with a PICTURE (a cloakroom, a phone book,
// a lift button) and only then says the technical thing. If a tip cannot be
// explained without the jargon, it is the wrong tip for this card.
//
// Everyone sees the same tip on the same day (see the index maths below), so
// two people on the team can talk about "today's one" - which is the whole
// reason to rotate daily rather than randomise per visit.
const TIPS = [
  {
    tag: "NETWORKING",
    title: "WebSockets are a phone call. HTTP is posting letters",
    body: "With letters you only get a reply after YOU write. That is HTTP - the server can never speak first. A WebSocket is a phone line left open: either side says something whenever they like. That is why chat, live cursors and score tickers use one.",
  },
  {
    tag: "DATABASES",
    title: "An index is a phone book, and the order matters",
    body: "A phone book sorted by surname, then first name, makes finding every Sharma easy. Finding everyone called Rahul means reading the whole thing. A database index on two columns behaves exactly the same - it helps for the first column, and does nothing for the second on its own.",
  },
  {
    tag: "BASICS",
    title: "Computers cannot write 0.1 exactly",
    body: "Try writing one third as a decimal. 0.333... and you run out of paper. Computers hit that same wall with 0.1 in binary, so 0.1 + 0.2 comes out as 0.30000000000000004. Never compare two decimals with ==, and never store money as one - count whole paise instead.",
  },
  {
    tag: "HTTP",
    title: "A 301 redirect is a tattoo, not a sticky note",
    body: "It tells the browser you moved PERMANENTLY, so it stops checking the old address - even after you fix things. Use 302 while you are still deciding. People have lost control of a URL over a 301 they sent by accident.",
  },
  {
    tag: "PERFORMANCE",
    title: "Do not phone the shop fifty times",
    body: "You need fifty books. One call with a list takes a minute; fifty separate calls take an hour. Loading fifty posts and then fetching each author one by one is the same mistake - fine with three rows, fatal with three hundred.",
  },
  {
    tag: "SECURITY",
    title: "A good password lock is a SLOW lock",
    body: "A lock that takes two seconds to open is mildly annoying to you, once. To someone trying a million keys it is the difference between one night and forty years. That is why bcrypt is deliberately slow. Fast password hashing is a bug, not a feature.",
  },
  {
    tag: "BROWSERS",
    title: "localStorage stops the whole kitchen",
    body: "Every read pauses everything else, like the entire kitchen halting whenever someone opens the fridge. A few small items and nobody notices. Store something big and the page visibly stutters. For anything sizeable use IndexedDB, which lets the cooking continue.",
  },
  {
    tag: "GIT",
    title: "git pull is two errands, not one",
    body: "It goes to the post office AND opens the letters - fetch, then merge. That is why it sometimes creates a merge commit you never asked for. Once you know it is two steps, almost every confusing pull result explains itself.",
  },
  {
    tag: "APIS",
    title: "A lift button, not a vending machine",
    body: "Press the lift button five times and one lift comes. Press Pay five times and you should still be charged once. Making an action safe to repeat is called idempotency, and it is the only reason retrying after a timeout is not terrifying.",
  },
  {
    tag: "BROWSERS",
    title: "The browser phones ahead before some requests",
    body: "For certain cross-site calls it sends a quick 'are you open?' first, then the real request. Two journeys instead of one, every single time. Tell it how long it may remember the answer and it stops asking on every call.",
  },
  {
    tag: "DNS",
    title: "Your DNS change worked. Nobody has noticed yet",
    body: "Everyone's computer saved your old address and will not look it up again until its reminder expires. Shorten that reminder the DAY BEFORE you move a domain and the switch takes minutes instead of a full day.",
  },
  {
    tag: "JAVA",
    title: "Do not rewrite the shopping list for every item",
    body: "Imagine copying the whole list onto a fresh page each time you add one thing - a hundred items costs a hundred rewrites. Java strings work like that: s += x inside a loop builds a brand new string every pass. StringBuilder just keeps writing on the same page.",
  },
  {
    tag: "UI",
    title: "Wait for silence, or speak every few seconds",
    body: "A search box should wait until you stop typing. A scroll handler should fire steadily while you move. They are different tools - debounce and throttle - and swapping them makes an interface feel broken in a way nobody can quite put into words.",
  },
  {
    tag: "CACHING",
    title: "Old menus still on the tables",
    body: "Keeping a copy is the easy part. The trouble is the kitchen changing its prices while nobody collects the printed menus. The bug is never your own cache - it is the OTHER thing that changed the data. Decide who is allowed to update before deciding how long to keep it.",
  },
  {
    tag: "DATABASES",
    title: "Random IDs are filing into a full cabinet",
    body: "A sequential ID goes on the back of the pile. A random one has to be forced into the middle, shoving everything along to make room. With millions of rows that shoving is real work - so if you want random-looking IDs, pick a time-ordered kind that still lands at the back.",
  },
  {
    tag: "HTTP",
    title: "401 is 'who are you'. 403 is 'I know, and no'",
    body: "One means log in and try again. The other means you ARE logged in and still are not allowed, so retrying changes nothing. Send the wrong one and apps knock forever on a door that will never open.",
  },
  {
    tag: "PERFORMANCE",
    title: "Some search patterns try every possibility",
    body: "Certain text-matching patterns make the computer test every possible way a string could match. On a long input that is billions of attempts, and a single request can freeze an entire processor. It is a real way to take a site down, so be careful with patterns built from whatever a user typed.",
  },
  {
    tag: "BASICS",
    title: "Two people counting the same jar",
    body: "Both look, both see 11, both write 12. One sweet has vanished from the record. Adding one to a number is really three steps - read, add, write - and two users doing it together lose one. Let the database do the adding. It only breaks under load, which is the worst time to discover it.",
  },
  {
    tag: "CSS",
    title: "Slide the sticker, do not repaint the wall",
    body: "Animating width or margin makes the browser work out the entire layout again on every frame, sixty times a second. Moving or fading something already drawn is just sliding a sticker across glass. Identical on screen, wildly different cost.",
  },
  {
    tag: "TIME",
    title: "Save the moment, not the clock on the wall",
    body: "'2:30' means different things in Delhi and London, and in some countries clocks jump twice a year. Store the actual instant, keep the person's timezone separately, and convert only when you show it. A bare '14:30' has already thrown away what you needed.",
  },
  {
    tag: "SECURITY",
    title: "Keep the key somewhere your own code cannot reach",
    body: "If a login token sits where your JavaScript can read it, any injected script can read it too. A cookie marked HttpOnly is sent to the server automatically but is invisible to the page's code - so even a successful attack cannot walk off with the session.",
  },
  {
    tag: "ALGORITHMS",
    title: "A cloakroom with a hundred hooks",
    body: "Hand over a coat, get hook 34, collect it later in one step. That is a hash map: instant, usually. But if every coat somehow lands on hook 7 you are back to digging through a pile. That gap between usually and always is exactly what an interviewer is poking at.",
  },
  {
    tag: "BUILD",
    title: "'Some flour' versus 'exactly 250g'",
    body: "package.json says 'anything under version 2' - a recipe written loosely. The lockfile is the exact measurement. Without it the same install two weeks apart can produce two different apps, which is where 'but it works on my machine' comes from.",
  },
  {
    tag: "NETWORKING",
    title: "A CDN is a local shop, not a bigger lorry",
    body: "The win is not carrying more. It is that the shop is twenty minutes away instead of a day's drive. For small files the journey costs far more than the goods, which is why a CDN helps a tiny file more than you would expect.",
  },
  {
    tag: "ERRORS",
    title: "Silencing the alarm is not putting out the fire",
    body: "Swallowing an error turns a loud, findable failure into a quiet wrong answer that shows up three weeks later as 'some users have no data'. If you genuinely can carry on, write down why. An empty catch block is the most expensive line in most codebases.",
  },
  {
    tag: "JAVASCRIPT",
    title: "Ten counters, or one queue?",
    body: "Waiting for ten requests one after another is ten people at a single counter. Firing them together opens ten counters and everyone is served at once. Only make them queue when each answer is genuinely needed to ask the next question.",
  },
  {
    tag: "DATABASES",
    title: "You asked for a coffee, not the whole menu",
    body: "SELECT * drags back every column, including the enormous one you never look at, and quietly changes behaviour the day someone adds a field. Naming the columns you actually want is faster, and fails loudly instead of silently.",
  },
  {
    tag: "LINUX",
    title: "Tearing off the label does not empty the box",
    body: "Delete a huge log file while a program is still writing to it and the disk stays full - you removed the name, not the contents. The space returns only when that program lets go. Empty the file instead of deleting it.",
  },
  {
    tag: "INTERVIEWS",
    title: "Show your rough work",
    body: "Say the slow, obvious solution out loud first. It proves you understood the question, it leaves you with something that actually works, and the clever version usually appears the moment you ask what the slow one keeps repeating. Jumping straight to clever and freezing leaves you with nothing.",
  },
  {
    tag: "APIS",
    title: "A parcel marked Delivered with nothing inside",
    body: "Replying 'success' with an error message tucked in the body means every retry, cache and dashboard believes it worked. The failure is invisible to everything except a human reading the screen. Use the status that matches what really happened.",
  },
];

// Deterministic, and the same for everyone on a given day.
//
// Keyed on the IST calendar date rather than a random pick per render, so the
// card does not change when you refresh, and so two people can compare notes on
// the same tip.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function tipForToday(now = new Date()) {
  const dayIndex = Math.floor((now.getTime() + IST_OFFSET_MS) / 86400000);
  return TIPS[((dayIndex % TIPS.length) + TIPS.length) % TIPS.length];
}

export function DailyDevTip() {
  const tip = tipForToday();

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="terminal-window overflow-hidden mb-5">
      <div className="terminal-header">
        <Lightbulb size={11} className="ml-2" style={{ color: "#FFD700" }} />
        <span className="font-mono text-[10px] text-white/25 ml-1">todays_tip.md</span>
        <span className="font-mono text-[10px] text-white/22 ml-auto mr-2">{tip.tag}</span>
      </div>
      <div className="p-5">
        <h3 className="font-sans text-base sm:text-lg font-bold text-white mb-2">{tip.title}</h3>
        <p className="font-mono text-[12.5px] text-white/55 leading-relaxed">{tip.body}</p>
      </div>
    </motion.div>
  );
}
