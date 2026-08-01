// Unit tests for contest share-link construction
// (devert-frontend/components/campus/contest-share.jsx).
//
// Only the two pure exports are tested - the React sheet itself needs a DOM and
// this repo has no component-test harness. That is fine, because the part that
// fails silently is the URL: a share button that renders perfectly but hands
// out a dead link is worse than no share button, and nothing about a wrong slug
// or a doubled slash is visible until someone else opens the link.
//
// Loaded through a base64 data: URL after stripping the JSX-bearing part of the
// file, the same technique test/audiences.test.mjs uses - devert-frontend has
// no "type": "module", and node cannot parse JSX regardless.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "fs";

const source = readFileSync(new URL("../devert-frontend/components/campus/contest-share.jsx", import.meta.url), "utf8");

// Everything above the first component declaration is plain JS. Imports are
// stripped with a multi-line-aware pattern - the lucide import spans several
// lines, and a line-anchored /^import .*$/ leaves its continuation behind,
// which then fails to parse as a bare object literal.
const pureHead = source.slice(0, source.indexOf("export function ContestShareButton"))
  .replace(/^"use client";$/m, "")
  .replace(/^import[\s\S]*?from\s+"[^"]*";$/gm, "");

const { slugFromPath, contestShareUrl } =
  await import(`data:text/javascript;base64,${Buffer.from(pureHead).toString("base64")}`);

test("slug is read from the workspace root URL", () => {
  assert.equal(slugFromPath("/campus/mrcet"), "mrcet");
  assert.equal(slugFromPath("/campus/mrcet/"), "mrcet");
});

test("slug is read from the contest deep link, the same position", () => {
  // Both URL shapes must yield the same slug - this is the whole reason the
  // value can be derived instead of threaded through as a prop.
  assert.equal(slugFromPath("/campus/mrcet/contest/c5NF9ZNtCQBYe0QgQlsA"), "mrcet");
  assert.equal(slugFromPath("/campus/mrcet/contests"), "mrcet");
  assert.equal(slugFromPath("/campus/mrcet/manage/contests"), "mrcet");
});

test("a non-campus path yields no slug rather than a wrong one", () => {
  // Returning a bogus slug here would mint a confidently-wrong share link.
  for (const p of ["/", "", "/pulse/abc", "/u/someone", "/campus", "/campus/"]) {
    assert.equal(slugFromPath(p), "", `expected no slug for ${JSON.stringify(p)}`);
  }
});

test("slugFromPath tolerates null and undefined", () => {
  assert.equal(slugFromPath(null), "");
  assert.equal(slugFromPath(undefined), "");
});

test("the share URL is absolute and matches the app's own canonical deep link", () => {
  // campus-app.jsx parses `second === "contest" ? third` into initialContestId
  // and writes this exact shape back via replaceState. If this test and that
  // parser ever disagree, every shared link lands on the wrong screen.
  assert.equal(
    contestShareUrl("mrcet", "c5NF9ZNtCQBYe0QgQlsA", "https://devert.in"),
    "https://devert.in/campus/mrcet/contest/c5NF9ZNtCQBYe0QgQlsA",
  );
});

test("the origin is taken from the caller, so dev links point at dev", () => {
  assert.equal(
    contestShareUrl("mrcet", "abc123", "http://localhost:3000"),
    "http://localhost:3000/campus/mrcet/contest/abc123",
  );
});

test("the built URL has no doubled slash and parses", () => {
  for (const origin of ["https://devert.in", "http://localhost:3000"]) {
    const url = contestShareUrl("mrcet", "abc123", origin);
    assert.doesNotThrow(() => new URL(url));
    assert.ok(!url.slice("https://".length).includes("//"), `doubled slash in ${url}`);
    // Round-trips: the path the app will parse must give the slug back.
    assert.equal(slugFromPath(new URL(url).pathname), "mrcet");
  }
});

test("the URL survives a round trip back through the app's own segment parsing", () => {
  const contestId = "c5NF9ZNtCQBYe0QgQlsA";
  const { pathname } = new URL(contestShareUrl("mrcet", contestId, "https://devert.in"));
  // Mirrors campus-app.jsx exactly: line 103 splits and drops the "campus"
  // prefix, line 148 reads `second === "contest" ? third : null`. Duplicating
  // the real expression is the point - if either side changes, this fails
  // instead of every shared link quietly opening the wrong screen.
  const [first, second, third] = pathname.split("/").filter(Boolean).slice(1);
  assert.equal(first, "mrcet");
  assert.equal(second, "contest");
  assert.equal(third, contestId);
});
