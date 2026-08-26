import {
  Layout, Server, Layers, Cloud, BarChart3, BrainCircuit, Smartphone,
  Network, FileCode2, Braces, Gem,
} from "lucide-react";

// Original DeVert-authored learning paths - our own curation/ordering/wording,
// not reproduced from any third-party roadmap site. Resource links point at
// primary/official docs and well-known free learning sites only. The Ruby on
// Rails path's course ordering was cross-checked against The Odin Project's
// open (MIT-licensed) curriculum structure for accuracy, then written
// entirely in our own words with our own resource picks - see the credit
// line rendered in roadmap-path.jsx.
export const ROADMAPS = [
  {
    id: "frontend",
    title: "Frontend Developer",
    tagline: "Build interfaces people actually enjoy using.",
    icon: Layout,
    color: "#00FF41",
    steps: [
      {
        title: "HTML & CSS fundamentals",
        description: "Semantic markup, the box model, Flexbox and Grid. Everything else in frontend sits on top of this.",
        resources: [
          { label: "MDN - HTML", url: "https://developer.mozilla.org/en-US/docs/Web/HTML" },
          { label: "MDN - CSS", url: "https://developer.mozilla.org/en-US/docs/Web/CSS" },
        ],
      },
      {
        title: "JavaScript, properly",
        description: "Not just syntax - closures, the event loop, prototypes, async/await. This is the step people skip and regret.",
        resources: [
          { label: "MDN - JavaScript Guide", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide" },
          { label: "You Don't Know JS (free book)", url: "https://github.com/getify/You-Dont-Know-JS" },
        ],
      },
      {
        title: "Version control with Git",
        description: "Branching, rebasing, resolving conflicts. Non-negotiable for working with anyone else's code.",
        resources: [{ label: "Git documentation", url: "https://git-scm.com/doc" }],
      },
      {
        title: "A modern framework",
        description: "Pick one and go deep - React is the most common default, but the concepts (components, state, props) transfer everywhere.",
        resources: [
          { label: "React docs", url: "https://react.dev/learn" },
          { label: "Vue docs", url: "https://vuejs.org/guide/introduction.html" },
        ],
      },
      {
        title: "TypeScript",
        description: "Static types catch entire categories of bugs before they ship. Most serious frontend jobs expect this now.",
        resources: [{ label: "TypeScript Handbook", url: "https://www.typescriptlang.org/docs/" }],
      },
      {
        title: "Build tooling & performance",
        description: "Bundlers, code-splitting, Core Web Vitals. Understanding what happens between your code and the browser painting pixels.",
        resources: [{ label: "web.dev - Learn", url: "https://web.dev/learn" }],
      },
      {
        title: "Testing",
        description: "Unit tests for logic, component tests for UI, a few end-to-end tests for the paths that really matter.",
        resources: [{ label: "Testing Library docs", url: "https://testing-library.com/docs/" }],
      },
      {
        title: "Ship something real",
        description: "A polished personal project beats a finished tutorial every time. Deploy it, put it on your DeVert portfolio.",
        resources: [],
      },
    ],
  },
  {
    id: "backend",
    title: "Backend Developer",
    tagline: "The part users never see, running the part they depend on.",
    icon: Server,
    color: "#00FFFF",
    steps: [
      {
        title: "Pick a language and runtime",
        description: "Node.js, Python, Java, or Go - the fundamentals of servers, processes, and I/O matter more than the specific choice.",
        resources: [
          { label: "Node.js docs", url: "https://nodejs.org/en/docs" },
          { label: "Python docs", url: "https://docs.python.org/3/tutorial/" },
        ],
      },
      {
        title: "HTTP & REST APIs",
        description: "Status codes, methods, headers, statelessness. Build an API before you build anything fancier.",
        resources: [{ label: "MDN - HTTP overview", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP" }],
      },
      {
        title: "Databases - relational first",
        description: "Schema design, joins, indexes, transactions. SQL is the one skill that never goes out of style.",
        resources: [
          { label: "PostgreSQL docs", url: "https://www.postgresql.org/docs/" },
          { label: "SQLBolt - interactive SQL", url: "https://sqlbolt.com/" },
        ],
      },
      {
        title: "Caching & NoSQL",
        description: "Redis for speed, a document store like MongoDB for flexible schemas. Know when each actually earns its complexity.",
        resources: [{ label: "Redis docs", url: "https://redis.io/docs/latest/" }],
      },
      {
        title: "Authentication & security",
        description: "Password hashing, JWTs/sessions, the OWASP basics. Getting this wrong is how breaches happen.",
        resources: [{ label: "OWASP Top 10", url: "https://owasp.org/www-project-top-ten/" }],
      },
      {
        title: "Testing & CI",
        description: "Unit and integration tests, run automatically on every push - the safety net that lets you ship fast without breaking things.",
        resources: [{ label: "GitHub Actions docs", url: "https://docs.github.com/en/actions" }],
      },
      {
        title: "Deploy & observe",
        description: "Get it running on a real server, then add logging and monitoring so you know when it stops working.",
        resources: [{ label: "Docker - get started", url: "https://www.docker.com/get-started/" }],
      },
      {
        title: "System design basics",
        description: "Load balancing, horizontal scaling, queues. Enough to reason about what happens past your first thousand users.",
        resources: [{ label: "System Design Primer", url: "https://github.com/donnemartin/system-design-primer" }],
      },
    ],
  },
  {
    id: "full-stack",
    title: "Full Stack Developer",
    tagline: "Comfortable on both sides of the request.",
    icon: Layers,
    color: "#C77DFF",
    steps: [
      {
        title: "Frontend fundamentals",
        description: "HTML/CSS/JS and a component framework - enough to build a real interface end to end.",
        resources: [{ label: "React docs", url: "https://react.dev/learn" }],
      },
      {
        title: "Backend fundamentals",
        description: "A server language, REST APIs, and a database. Build the thing your frontend actually talks to.",
        resources: [{ label: "Express.js docs", url: "https://expressjs.com/" }],
      },
      {
        title: "Connect them for real",
        description: "Auth flows across both sides, error handling that doesn't leak internals, environments for dev vs. production.",
        resources: [],
      },
      {
        title: "Databases end to end",
        description: "Design a schema, migrate it, query it efficiently from your API layer.",
        resources: [{ label: "PostgreSQL docs", url: "https://www.postgresql.org/docs/" }],
      },
      {
        title: "Deployment",
        description: "Get both halves of your app live - static hosting for the frontend, a real server (or container) for the backend.",
        resources: [{ label: "Docker - get started", url: "https://www.docker.com/get-started/" }],
      },
      {
        title: "Pick a specialty",
        description: "Full stack doesn't mean equally deep everywhere - most strong full-stack devs lean frontend or backend. Pick one to go deep in.",
        resources: [],
      },
      {
        title: "Build something with real users",
        description: "The gap between a tutorial project and something people actually use is where full-stack skill actually shows.",
        resources: [],
      },
    ],
  },
  {
    id: "devops",
    title: "DevOps Engineer",
    tagline: "Make shipping boring, reliable, and fast.",
    icon: Cloud,
    color: "#FF9500",
    steps: [
      {
        title: "Linux & the shell",
        description: "Processes, permissions, networking basics, and enough Bash to automate the repetitive stuff.",
        resources: [{ label: "Linux Journey", url: "https://linuxjourney.com/" }],
      },
      {
        title: "Version control & CI/CD",
        description: "Git deeply, plus pipelines that test and deploy automatically on every push.",
        resources: [{ label: "GitHub Actions docs", url: "https://docs.github.com/en/actions" }],
      },
      {
        title: "Containers",
        description: "Docker for packaging apps consistently across every environment they'll ever run in.",
        resources: [{ label: "Docker docs", url: "https://docs.docker.com/" }],
      },
      {
        title: "Orchestration",
        description: "Kubernetes for running containers at scale - deployments, services, scaling, self-healing.",
        resources: [{ label: "Kubernetes docs", url: "https://kubernetes.io/docs/home/" }],
      },
      {
        title: "Infrastructure as Code",
        description: "Terraform or similar - your infrastructure lives in version control, not in someone's memory of what they clicked.",
        resources: [{ label: "Terraform docs", url: "https://developer.hashicorp.com/terraform/docs" }],
      },
      {
        title: "Cloud platforms",
        description: "Pick one (AWS, GCP, or Azure) and learn its compute, storage, and networking primitives deeply before spreading thin.",
        resources: [
          { label: "AWS docs", url: "https://docs.aws.amazon.com/" },
          { label: "Google Cloud docs", url: "https://cloud.google.com/docs" },
        ],
      },
      {
        title: "Monitoring & incident response",
        description: "Metrics, logs, alerts, and a calm process for when things break at 3am - because they will.",
        resources: [],
      },
    ],
  },
  {
    id: "data-analyst",
    title: "Data Analyst",
    tagline: "Turn raw numbers into decisions people trust.",
    icon: BarChart3,
    color: "#FFD700",
    steps: [
      {
        title: "SQL, fluently",
        description: "Joins, window functions, aggregations. The single most-used skill in this entire path.",
        resources: [{ label: "SQLBolt - interactive SQL", url: "https://sqlbolt.com/" }],
      },
      {
        title: "Spreadsheets, seriously",
        description: "Pivot tables, lookups, and clean data hygiene - still how a huge amount of real analysis actually happens.",
        resources: [],
      },
      {
        title: "Python for analysis",
        description: "Pandas and NumPy for wrangling data too messy or too large for a spreadsheet.",
        resources: [
          { label: "Pandas docs", url: "https://pandas.pydata.org/docs/" },
          { label: "NumPy docs", url: "https://numpy.org/doc/stable/" },
        ],
      },
      {
        title: "Statistics that matter",
        description: "Distributions, correlation vs. causation, significance - enough to not fool yourself or your stakeholders.",
        resources: [],
      },
      {
        title: "Data visualization",
        description: "Build dashboards people actually read - clarity beats decoration every time.",
        resources: [{ label: "Tableau - free training", url: "https://www.tableau.com/learn/training" }],
      },
      {
        title: "Communicating findings",
        description: "The best analysis in the world is worthless if the story doesn't land with the person making the decision.",
        resources: [],
      },
    ],
  },
  {
    id: "ai-engineer",
    title: "AI Engineer",
    tagline: "Build real products on top of ML models.",
    icon: BrainCircuit,
    color: "#FF5050",
    steps: [
      {
        title: "Python, deeply",
        description: "Almost the entire ML ecosystem is Python-first. Comfort here is the entry fee.",
        resources: [{ label: "Python docs", url: "https://docs.python.org/3/tutorial/" }],
      },
      {
        title: "Math you'll actually use",
        description: "Linear algebra, probability, and enough calculus to understand gradient descent - not a full degree, just the working intuition.",
        resources: [],
      },
      {
        title: "Classical ML foundations",
        description: "Regression, classification, decision trees - understand the basics before jumping to deep learning.",
        resources: [{ label: "scikit-learn docs", url: "https://scikit-learn.org/stable/" }],
      },
      {
        title: "Deep learning frameworks",
        description: "PyTorch is the current default in research and most new products - learn to build and train a model end to end.",
        resources: [{ label: "PyTorch tutorials", url: "https://pytorch.org/tutorials/" }],
      },
      {
        title: "Working with LLMs",
        description: "Prompting, embeddings, RAG, fine-tuning - the actual day-to-day of building on top of foundation models.",
        resources: [
          { label: "Hugging Face - Learn", url: "https://huggingface.co/learn" },
          { label: "OpenAI docs", url: "https://platform.openai.com/docs" },
        ],
      },
      {
        title: "Shipping ML in production",
        description: "Serving models, latency, cost, evaluation, guardrails. Where most of the actual engineering work lives.",
        resources: [],
      },
    ],
  },
  {
    id: "mobile",
    title: "Mobile Developer",
    tagline: "Build for the device that's always in someone's pocket.",
    icon: Smartphone,
    color: "#00FF41",
    steps: [
      {
        title: "Pick a lane",
        description: "Native (Kotlin for Android, Swift for iOS) or cross-platform (React Native, Flutter) - both are legitimate, valuable career paths.",
        resources: [
          { label: "Android developer courses", url: "https://developer.android.com/courses" },
          { label: "Kotlin docs", url: "https://kotlinlang.org/docs/home.html" },
        ],
      },
      {
        title: "UI fundamentals for mobile",
        description: "Layouts, navigation, and platform-specific design guidelines - mobile UX has its own rules, not just smaller web pages.",
        resources: [],
      },
      {
        title: "Local storage & offline-first",
        description: "Mobile apps need to work on bad connections and no connection - local databases and sync strategies matter here.",
        resources: [],
      },
      {
        title: "Talking to a backend",
        description: "REST or GraphQL APIs, auth tokens, background sync - the same backend skills, applied through a mobile client.",
        resources: [],
      },
      {
        title: "Performance & battery",
        description: "Mobile users notice jank and battery drain immediately - profiling tools here are non-optional.",
        resources: [],
      },
      {
        title: "Ship to the app stores",
        description: "Signing, store listings, review guidelines - the last mile that trips up a lot of otherwise-finished apps.",
        resources: [],
      },
    ],
  },
  {
    id: "system-design",
    title: "System Design",
    tagline: "How to design software that survives real traffic.",
    icon: Network,
    color: "#00FFFF",
    steps: [
      {
        title: "Scaling fundamentals",
        description: "Vertical vs. horizontal scaling, load balancers, stateless services - the vocabulary everything else builds on.",
        resources: [{ label: "System Design Primer", url: "https://github.com/donnemartin/system-design-primer" }],
      },
      {
        title: "Databases at scale",
        description: "Replication, sharding, read replicas, and picking SQL vs. NoSQL for the actual access pattern you have.",
        resources: [],
      },
      {
        title: "Caching strategies",
        description: "Where to cache, what invalidation strategy to use, and the failure modes each choice introduces.",
        resources: [{ label: "Redis docs", url: "https://redis.io/docs/latest/" }],
      },
      {
        title: "Async & queues",
        description: "Message queues and event-driven design for decoupling services and absorbing traffic spikes.",
        resources: [],
      },
      {
        title: "CAP theorem & trade-offs",
        description: "Consistency, availability, partition tolerance - every real distributed system is a trade-off between these.",
        resources: [],
      },
      {
        title: "Design a real system end to end",
        description: "URL shorteners and chat apps are the classics for a reason - practice designing something with real constraints.",
        resources: [],
      },
    ],
  },
  {
    id: "python",
    title: "Python Developer",
    tagline: "One of the most widely-used languages in the industry, for good reason.",
    icon: FileCode2,
    color: "#FFD700",
    steps: [
      {
        title: "Core syntax & data structures",
        description: "Lists, dicts, sets, comprehensions - the everyday vocabulary of Python code.",
        resources: [{ label: "Python official tutorial", url: "https://docs.python.org/3/tutorial/" }],
      },
      {
        title: "Functions & OOP",
        description: "Writing clean, reusable functions and classes - Python supports both functional and object-oriented styles well.",
        resources: [],
      },
      {
        title: "The standard library & packaging",
        description: "Python's batteries-included philosophy, plus pip/venv for managing dependencies without breaking your system.",
        resources: [],
      },
      {
        title: "Testing & type hints",
        description: "pytest for tests, type hints for catching mistakes before runtime - both are standard in professional Python now.",
        resources: [],
      },
      {
        title: "Pick a direction",
        description: "Web (Django/Flask/FastAPI), data (Pandas/NumPy), or automation/scripting - Python is genuinely strong at all three.",
        resources: [
          { label: "FastAPI docs", url: "https://fastapi.tiangolo.com/" },
          { label: "Django docs", url: "https://docs.djangoproject.com/en/stable/" },
        ],
      },
    ],
  },
  {
    id: "javascript",
    title: "JavaScript Developer",
    tagline: "It runs in every browser, and now on every server too.",
    icon: Braces,
    color: "#FF9500",
    steps: [
      {
        title: "The language itself",
        description: "Variables, functions, closures, the event loop - understanding how JS actually executes, not just what the syntax looks like.",
        resources: [
          { label: "MDN - JavaScript Guide", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide" },
          { label: "You Don't Know JS (free book)", url: "https://github.com/getify/You-Dont-Know-JS" },
        ],
      },
      {
        title: "Async JavaScript",
        description: "Callbacks, Promises, async/await - the pattern that trips up almost everyone at least once.",
        resources: [],
      },
      {
        title: "The DOM & browser APIs",
        description: "How JavaScript actually manipulates a page - the foundation every frontend framework is built on top of.",
        resources: [{ label: "MDN - DOM", url: "https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model" }],
      },
      {
        title: "Modern tooling",
        description: "ES modules, npm, bundlers - how JavaScript projects are actually structured and shipped in 2026.",
        resources: [],
      },
      {
        title: "Node.js on the server",
        description: "The same language, running your backend - one of the reasons JS became so dominant across the whole stack.",
        resources: [{ label: "Node.js docs", url: "https://nodejs.org/en/docs" }],
      },
      {
        title: "TypeScript",
        description: "A typed superset that catches real bugs before they ship - increasingly the default rather than the exception.",
        resources: [{ label: "TypeScript Handbook", url: "https://www.typescriptlang.org/docs/" }],
      },
    ],
  },
  {
    id: "ruby-rails",
    title: "Ruby on Rails Developer",
    tagline: "A famously productive way to ship full-stack apps fast.",
    icon: Gem,
    color: "#C77DFF",
    steps: [
      {
        title: "Ruby, the language",
        description: "Ruby's whole design philosophy is programmer happiness - blocks, symbols, and a genuinely elegant object model. Learn it properly before touching Rails.",
        resources: [{ label: "Ruby documentation", url: "https://www.ruby-lang.org/en/documentation/" }],
      },
      {
        title: "Object-oriented design & testing",
        description: "Classes, modules, and enough RSpec to write tests as you go - Rails leans hard on conventions from solid OO design.",
        resources: [],
      },
      {
        title: "HTML & CSS, intermediate to advanced",
        description: "Rails apps still need real interfaces - forms, responsive layouts, and enough CSS to not depend entirely on a framework.",
        resources: [{ label: "MDN - CSS", url: "https://developer.mozilla.org/en-US/docs/Web/CSS" }],
      },
      {
        title: "Relational databases & SQL",
        description: "Rails' ActiveRecord hides a lot of SQL from you day to day - understanding what it's actually doing underneath prevents painful surprises later.",
        resources: [{ label: "PostgreSQL docs", url: "https://www.postgresql.org/docs/" }],
      },
      {
        title: "Rails itself",
        description: "MVC, routing, ActiveRecord, migrations - the framework that made 'convention over configuration' famous for a reason.",
        resources: [{ label: "Rails Guides", url: "https://guides.rubyonrails.org/" }],
      },
      {
        title: "JavaScript for a Rails frontend",
        description: "Modern Rails apps still need real client-side interactivity - Hotwire/Turbo for the Rails-native approach, or a JS framework layered on top.",
        resources: [{ label: "MDN - JavaScript Guide", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide" }],
      },
      {
        title: "Deployment",
        description: "Get a real Rails app running in production - environment configs, background jobs, and a database that isn't just SQLite.",
        resources: [],
      },
      {
        title: "Getting hired",
        description: "Rails shops care a lot about shipped projects - a couple of deployed, real apps do more for you here than certificates.",
        resources: [],
      },
    ],
  },
];

export function getRoadmap(id) {
  return ROADMAPS.find(r => r.id === id) || null;
}
