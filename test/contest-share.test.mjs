// Unit tests for contest share-link construction
// (devert-campus/components/campus/contest-share.jsx).
//
// Only the two pure exports are tested - the React sheet itself needs a DOM and
// this repo has no component-test harness. That is fine, because the part that
// fails silently is the URL: a share button that renders perfectly but hands
// out a dead link is worse than no share button, and nothing about a wrong slug
// or a doubled slash is visible until someone else opens the link.
//
// Updated for the campus.devert.in migration: contest-share.jsx moved from
// devert-frontend/components/campus/ into devert-campus/components/campus/,
// and slugFromPath/contestShareUrl dropped their leading "campus" URL segment
// entirely (campus.devert.in is now a separate app whose own root IS the
// institution slug) - see that file's own comments. Every fixture and
// assertion below is updated to the new, un-prefixed URL shape; nothing here
// tests devert-frontend's main-site paths anymore, since devert-campus never
// renders one.
//
// Loaded through a base64 data: URL after stripping the JSX-bearing part of the
// file, the same technique test/audiences.test.mjs uses - devert-campus has
// no "type": "module", and node cannot parse JSX regardless.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "fs";

const source = readFileSync(new URL("../devert-campus/components/campus/contest-share.jsx", import.meta.url), "utf8");

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
  assert.equal(slugFromPath("/mrcet"), "mrcet");
  assert.equal(slugFromPath("/mrcet/"), "mrcet");
});

test("slug is read from the contest deep link, the same position", () => {
  // Both URL shapes must yield the same slug - this is the whole reason the
  // value can be derived instead of threaded through as a prop.
  assert.equal(slugFromPath("/mrcet/contest/c5NF9ZNtCQBYe0QgQlsA"), "mrcet");
  assert.equal(slugFromPath("/mrcet/contests"), "mrcet");
  assert.equal(slugFromPath("/mrcet/manage/contests"), "mrcet");
});

test("an empty path yields no slug rather than a wrong one", () => {
  // Returning a bogus slug here would mint a confidently-wrong share link.
  // devert-campus is its own app with clean, un-prefixed URLs - every real
  // path it ever renders already starts with an institution slug (or
  // "roadmaps"), so root is the only genuinely slug-less path left to guard.
  for (const p of ["/", ""]) {
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
    contestShareUrl("mrcet", "c5NF9ZNtCQBYe0QgQlsA", "https://campus.devert.in"),
    "https://campus.devert.in/mrcet/contest/c5NF9ZNtCQBYe0QgQlsA",
  );
});

test("the origin is taken from the caller, so dev links point at dev", () => {
  assert.equal(
    contestShareUrl("mrcet", "abc123", "http://localhost:3000"),
    "http://localhost:3000/mrcet/contest/abc123",
  );
});

test("the built URL has no doubled slash and parses", () => {
  for (const origin of ["https://campus.devert.in", "http://localhost:3000"]) {
    const url = contestShareUrl("mrcet", "abc123", origin);
    assert.doesNotThrow(() => new URL(url));
    assert.ok(!url.slice("https://".length).includes("//"), `doubled slash in ${url}`);
    // Round-trips: the path the app will parse must give the slug back.
    assert.equal(slugFromPath(new URL(url).pathname), "mrcet");
  }
});

test("the URL survives a round trip back through the app's own segment parsing", () => {
  const contestId = "c5NF9ZNtCQBYe0QgQlsA";
  const { pathname } = new URL(contestShareUrl("mrcet", contestId, "https://campus.devert.in"));
  // Mirrors campus-app.jsx exactly: no leading "campus" segment to drop on
  // campus.devert.in, so the slug is the first path segment directly, with
  // "contest"/the id following right after it. Duplicating the real
  // expression is the point - if either side changes, this fails instead of
  // every shared link quietly opening the wrong screen.
  const [first, second, third] = pathname.split("/").filter(Boolean);
  assert.equal(first, "mrcet");
  assert.equal(second, "contest");
  assert.equal(third, contestId);
});
