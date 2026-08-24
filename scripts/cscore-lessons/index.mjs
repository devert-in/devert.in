// Registry of rewritten CS Core lesson bodies, keyed by subject id exactly as
// it appears in Firestore (csCoreSubjects/{id}). Add a subject file, import it
// here, and scripts/rewrite-cscore-lessons.mjs picks it up - a subject absent
// from this map is simply left alone, which is what lets the rewrite roll out
// subject by subject instead of all at once.

import { OPERATING_SYSTEMS } from "./operating-systems.mjs";
import { DBMS } from "./dbms.mjs";
import { COMPUTER_NETWORKS } from "./computer-networks.mjs";
import { OOP } from "./oop.mjs";
import { COMPUTER_ORGANIZATION } from "./computer-organization.mjs";
import { SOFTWARE_ENGINEERING } from "./software-engineering.mjs";
import { CYBER_SECURITY } from "./cyber-security.mjs";
import { SYSTEM_DESIGN_BEGINNER } from "./system-design-beginner.mjs";
import { DESIGN_PATTERNS } from "./design-patterns.mjs";
import { REST_APIS } from "./rest-apis.mjs";
import { SECURITY_FUNDAMENTALS } from "./security-fundamentals.mjs";
import { LINUX_FUNDAMENTALS } from "./linux-fundamentals.mjs";
import { CLOUD_FUNDAMENTALS } from "./cloud-fundamentals.mjs";
import { DISTRIBUTED_SYSTEMS } from "./distributed-systems.mjs";
import { MACHINE_LEARNING } from "./machine-learning.mjs";
import { ARTIFICIAL_INTELLIGENCE } from "./artificial-intelligence.mjs";
import { THEORY_OF_COMPUTATION } from "./theory-of-computation.mjs";
import { DIGITAL_LOGIC_DESIGN } from "./digital-logic-design.mjs";
import { NLP } from "./nlp.mjs";
import { COMPUTER_GRAPHICS } from "./computer-graphics.mjs";
import { DATA_MINING } from "./data-mining.mjs";
import { PARALLEL_COMPUTING } from "./parallel-computing.mjs";
import { MICROPROCESSORS } from "./microprocessors.mjs";
import { GIT_GITHUB } from "./git-github.mjs";
import { COMPILER_DESIGN } from "./compiler-design.mjs";
import { APTITUDE_FOUNDATIONS } from "./aptitude-foundations.mjs";

export const LESSONS = {
  "operating-systems": OPERATING_SYSTEMS,
  "dbms": DBMS,
  "computer-networks": COMPUTER_NETWORKS,
  "oop": OOP,
  "computer-organization": COMPUTER_ORGANIZATION,
  "software-engineering": SOFTWARE_ENGINEERING,
  "cyber-security": CYBER_SECURITY,
  "system-design-beginner": SYSTEM_DESIGN_BEGINNER,
  "design-patterns": DESIGN_PATTERNS,
  "rest-apis": REST_APIS,
  "security-fundamentals": SECURITY_FUNDAMENTALS,
  "linux-fundamentals": LINUX_FUNDAMENTALS,
  "cloud-fundamentals": CLOUD_FUNDAMENTALS,
  "distributed-systems": DISTRIBUTED_SYSTEMS,
  "machine-learning": MACHINE_LEARNING,
  "artificial-intelligence": ARTIFICIAL_INTELLIGENCE,
  "theory-of-computation": THEORY_OF_COMPUTATION,
  "digital-logic-design": DIGITAL_LOGIC_DESIGN,
  "nlp": NLP,
  "computer-graphics": COMPUTER_GRAPHICS,
  "data-mining": DATA_MINING,
  "parallel-computing": PARALLEL_COMPUTING,
  "microprocessors": MICROPROCESSORS,
  "git-github": GIT_GITHUB,
  "compiler-design": COMPILER_DESIGN,
  "aptitude-foundations": APTITUDE_FOUNDATIONS,
};
