import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// Adds the one round Cognizant was missing relative to TCS/Deloitte: the
// combined Technical + HR interview (round 4, already described in prose
// inside the company doc's own hiringOverview field, but deliberately left
// out of the practice question bank by the earlier session on the reasoning
// that behavioral questions have no single correct answer). TCS/Deloitte
// solve that same tension by reframing behavioral questions as "which
// approach is best" MCQs instead of skipping them - applying the same
// pattern here for consistency, using the exact bullet points already
// present in Cognizant's own hiringOverview text.

function q(question, options, correctIndex, difficulty, explanation, tags) {
  return { question, options, correctIndex, difficulty, marks: 1, explanation, tags, attemptCount: 0, correctCount: 0, totalTimeSec: 0 };
}

const NEW_ROUND = {
  name: "Technical + HR Interview Prep", duration: "30-45 minutes",
  description: "A combined interview covering DSA, SQL, core CS concepts, your own project in detail, and behavioral fit - round 4 of the process. High scorers from the Technical Assessment (flagged for GenC Elevate/Next) face a deeper DSA/project bar; everyone gets the behavioral portion below.",
  categories: [
    {
      name: "About You & Cognizant",
      questions: [
        q("What is the best approach when asked 'Tell me about yourself' in this interview?", ["A focused pitch on your education, key skills, and projects - not a full resume recitation", "A single sentence with just your name and college", "Reciting your resume line by line in complete detail", "Talking only about your hobbies"], 0, "Easy", "The interviewer already has your resume - a focused pitch on education, skills and projects is far more useful than reciting it back.", ["HR Interview"]),
        q("Which fact is most useful to cite when asked 'Why do you want to join Cognizant?'", ["Its scale and reach as a Fortune 500 company delivering solutions across Healthcare IT, Banking, Retail and Insurance", "That it's simply a well-known name", "That a friend already works there", "That you heard the interview process is easy"], 0, "Medium", "Specific, researched facts about the firm's actual scale and service verticals read far better than generic praise.", ["HR Interview", "About Cognizant"]),
        q("What's the safest way to answer 'Are you open to relocation and flexible shifts?' if you genuinely are?", ["Answer positively and frame it as an opportunity to work with different teams and clients", "Refuse outright without discussion", "Say you'll decide only after the offer letter", "Avoid answering directly"], 0, "Medium", "A genuine, positive answer signals fit for a client-services role; a real constraint should still be stated honestly rather than hidden.", ["HR Interview"]),
        q("Which GenC tier is reserved for candidates showing excellent problem-solving, strong DSA, and deep project knowledge, earning roughly Rs. 6.75 LPA?", ["GenC (Foundation)", "GenC Elevate", "GenC Next", "GenC Prime"], 2, "Easy", "GenC Next is the top tier, routed to by assessment/interview performance rather than applied to directly.", ["About Cognizant", "GenC Tiers"]),
        q("Cognizant's four core service verticals mentioned in its own hiring overview are:", ["Healthcare IT, Banking, Retail, and Insurance", "Aerospace, Defense, Mining, and Agriculture", "Only software product development", "Hospitality and Tourism exclusively"], 0, "Medium", "Knowing the actual industries a Fortune 500 services firm operates in shows real research, not generic enthusiasm.", ["About Cognizant"]),
        q("If asked about an academic gap year or backlog, what's the best way to answer?", ["Be brief, honest and non-defensive: state the reason, what you did during that period, and evidence the issue is resolved", "Avoid the topic entirely and change the subject", "Blame the institution or a specific teacher", "Deny that it happened"], 0, "Medium", "A brief, honest explanation followed by a positive pivot reads as maturity; evasion reads as a red flag.", ["HR Interview"]),
      ],
    },
    {
      name: "Behavioral & Situational",
      questions: [
        q("What is the best structure for answering 'Give an example of a time you showed leadership or handled a team conflict'?", ["STAR: Situation, Task, Action, Result - focused on YOUR specific actions", "A single-word answer", "A generic list of your skills with no concrete example", "Blaming a teammate for the conflict"], 0, "Easy", "STAR keeps the answer concrete: brief context, then your actions, then a measurable result.", ["HR Interview", "STAR Method"]),
        q("When explaining your project's architecture, tech stack, biggest challenge and your specific contribution, what should you be ready for?", ["Deep-dive follow-up questions on every detail you mention, including tech choices you may not have made yourself", "A single yes/no question about whether it worked", "No follow-up questions at all", "Being asked to explain a completely different project instead"], 0, "Medium", "Interviewers commonly probe exactly the details a candidate states, so every claim about the project should be one you can genuinely defend.", ["HR Interview", "Project Discussion"]),
        q("What's a strong way to answer 'How do you handle pressure and tight deadlines?'", ["Describe a real technique - breaking work into smaller tasks, prioritising, communicating early when at risk - backed by one example", "Say you never feel pressure", "Say you simply work through the night every time", "Avoid giving any concrete example"], 0, "Medium", "A real technique plus a real example is far more convincing than a vague claim of calmness.", ["HR Interview"]),
        q("What's the best way to answer 'What are your strengths and weaknesses?'", ["2-3 strengths backed by short proof stories, plus one genuine, non-fatal weakness with concrete improvement steps", "Only strengths, avoiding the weakness question entirely", "Say you have no weaknesses at all", "A vague cliche like 'I'm a perfectionist' with no supporting example"], 0, "Medium", "A genuine weakness paired with real improvement steps reads as self-aware, not as a liability.", ["HR Interview"]),
        q("Describing a time you worked effectively in a team, what should the balance of 'I' versus 'we' be?", ["'We' for the team outcome, 'I' for your own specific contribution and actions", "Only 'I', taking full credit for the team's work", "Only 'we', giving no sense of your individual role", "Neither - describe the project with no pronouns at all"], 0, "Medium", "This balance credits the team while still making your own role clear and evaluable.", ["HR Interview", "Teamwork"]),
        q("What's the best way to answer 'What will you do if you are not selected today?'", ["Show resilience: ask for feedback, work on the gaps, and try again", "Say you would give up on this company entirely", "Say it doesn't matter to you either way", "Argue that the decision is unfair"], 0, "Easy", "Resilience and a growth mindset read far better than indifference or defensiveness.", ["HR Interview"]),
      ],
    },
    {
      name: "Technical Interview Readiness",
      questions: [
        q("Candidates flagged for which two GenC tiers should expect a noticeably deeper DSA and project bar in the round 4 interview?", ["GenC Elevate and GenC Next", "Only GenC (Foundation)", "None - every tier gets an identical bar", "Only candidates who failed the Technical Assessment"], 0, "Medium", "Higher-scoring candidates from the Technical Assessment are routed toward Elevate/Next and interviewed accordingly.", ["Interview Prep"]),
        q("Round 4 covers DSA, SQL, core CS concepts and your own project - which of these is typically the single most probable deep-dive topic?", ["Your own project's architecture and your specific contribution to it", "A random trivia question unrelated to your resume", "Only your CGPA", "Your favourite subject in school"], 0, "Medium", "Interviewers can verify project claims by asking pointed follow-ups, making it the most reliably-probed topic in the room.", ["Interview Prep", "Project Discussion"]),
        q("Why does explaining your own code out loud (not just writing it silently) matter in a technical interview?", ["It demonstrates genuine understanding rather than memorised or copied code", "It has no effect on the evaluation", "It only matters for GenC Next candidates", "It replaces the need to write correct code at all"], 0, "Medium", "Talking through your reasoning while coding shows the interviewer you actually understand the approach, not just that you can type a known solution.", ["Interview Prep"]),
        q("What should you do if you genuinely don't know the answer to a technical question in the interview?", ["Say so honestly, reason through it aloud as far as you can, and ask clarifying questions", "Guess confidently and hope it's not checked", "Change the subject to something you do know", "Stay completely silent"], 0, "Medium", "Interviewers often care more about your reasoning process than a memorised correct answer - honest, structured thinking beats a confident wrong guess.", ["Interview Prep"]),
        q("If flagged for GenC Elevate or GenC Next after the Technical Assessment, what should you extra-prepare before the interview?", ["Stronger DSA problem-solving and being ready to discuss trade-offs in your project's design", "Nothing different from a GenC (Foundation) candidate", "Only HR questions, since technical depth won't be checked", "Memorising unrelated trivia"], 0, "Medium", "Elevate/Next candidates are expected to show the stronger DSA and CS depth the tier itself is meant to reflect.", ["Interview Prep"]),
        q("What is the recommended structure for explaining your final-year or major project in this interview?", ["The problem, your specific role, the tech stack, one key challenge and how you solved it, and the result", "A word-for-word reading of your project report's abstract", "Just the final grade or marks you received", "A list of every tool mentioned anywhere in your resume"], 0, "Medium", "This structure covers exactly what a technical interviewer will want to probe further, and every claim should be defensible under follow-up questions.", ["Interview Prep", "Project Discussion"]),
      ],
    },
  ],
};

const snap = await db.collection("companies").where("name", "==", "Cognizant").get();
if (snap.empty) { console.log('No "Cognizant" company found.'); process.exit(1); }
const companyRef = snap.docs[0].ref;

const roundsSnap = await companyRef.collection("rounds").get();
if (roundsSnap.docs.some(d => d.data().name === NEW_ROUND.name)) {
  console.log(`Round "${NEW_ROUND.name}" already exists - skipping.`);
  process.exit(0);
}

const nextRoundOrder = roundsSnap.size;
const roundRef = await companyRef.collection("rounds").add({
  name: NEW_ROUND.name, description: NEW_ROUND.description, duration: NEW_ROUND.duration, order: nextRoundOrder,
});

let categoriesAdded = 0, questionsAdded = 0;
for (let ci = 0; ci < NEW_ROUND.categories.length; ci++) {
  const category = NEW_ROUND.categories[ci];
  const categoryRef = await roundRef.collection("categories").add({ name: category.name, order: ci });
  categoriesAdded++;
  for (let qi = 0; qi < category.questions.length; qi++) {
    await categoryRef.collection("questions").add({ ...category.questions[qi], order: qi });
    questionsAdded++;
  }
}

console.log(`Cognizant expansion: added round "${NEW_ROUND.name}" with ${categoriesAdded} categories, ${questionsAdded} questions.`);
