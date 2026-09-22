// DeVert Campus - Aptitude Series, Week 8: Geometry & Mensuration
// (Mon 14 Sep - Sat 19 Sep 2026). Days 43-48.
//
// Continues week 7 (Days 37-42: Divisibility/Factors, Remainders/Cyclicity,
// Surds/Indices/Logs, Progressions, Linear Equations & Inequalities). Week 7
// closed the number-theory and algebra gap; this week closes the geometry
// one. Days 1-42 of this track never covered a single shape - no triangles,
// no circles, no areas, no volumes, no coordinate plane - despite mensuration
// being a guaranteed section in TCS NQT, Infosys, Capgemini and Wipro papers
// and the entire basis of the non-verbal reasoning many of them also set.
//
// Ordering is deliberate: plane figures and their angle rules (43, 44) must
// come before area formulas (45) can mean anything, area before volume (46)
// because every solid's formula is an area swept through a height, and the
// coordinate plane last (47) because it re-derives distance and area results
// the week already established, this time algebraically.
//
// Day 48 is the week-scoped Saturday recap, matching Days 6/12/18/24/36/42.
//
// NOTE ON THE GAP: this week, like week 7, backfills dates the track skipped
// (its last live item is 2026-09-05). Authored 2026-09-21. A day completed
// after its own date earns no XP/coins, so this is continuity/archive content.
//
// AUTHORING RULES: identical to week1.mjs/week6.mjs/week7.mjs. In particular -
// `concept` is one string parsed by lib/lessonBlocks.js; fences are
// `::: variant optional title` ... `:::` each on its own line; never write
// "->" inside a flow step body or a literal "|" inside table cell text;
// two-space-indented lines render as code blocks; MCQ shape is
// { id, text, options, correctIndex, explanation } with a 0-based
// correctIndex; timedQuiz.mcqIds are 5 ids from that same day; ASCII hyphens
// only. Pi is taken as 22/7 wherever a numeric answer needs it, and every
// question that depends on that says so.

export const WEEK8_DAYS = [

  // ------------------------------------------------------------------
  // Day 43 - Monday 14 Sep 2026 - Lines, Angles & Triangles
  // ------------------------------------------------------------------
  {
    date: "2026-09-14", dow: "mon", weekId: "2026-09-14", type: "lesson",
    title: "Day 43: Lines, Angles & Triangles",
    difficulty: "Medium",
    estimatedMinutes: 18,
    concept: `## Three Numbers That Must Add to 180

::: story
A question gives you a triangle with angles in the ratio 2:3:4 and asks for the largest one. There is nothing to construct and nothing to measure. The three angles must total 180 degrees, the ratio says they are 2 parts, 3 parts and 4 parts, and 9 parts must therefore be 180 - so one part is 20 and the largest angle is 80.

Nearly every triangle question in a placement paper is like this: a couple of fixed facts, applied to a ratio or a leftover. The facts are few enough to hold in your head, and this lesson is all of them.
:::

## Angle Facts

::: table The rules that settle most questions
Fact | Statement
Angle sum | The three angles of any triangle total 180 degrees
Exterior angle | An exterior angle equals the SUM of the two remote interior angles
Straight line | Angles on a straight line total 180 degrees
Around a point | Angles around a point total 360 degrees
Vertically opposite | When two lines cross, opposite angles are equal
Parallel lines | Corresponding angles are equal; alternate angles are equal; co-interior angles total 180
Isosceles | Equal sides face equal angles, and the converse holds too
:::

The exterior-angle rule is the time-saver. If an exterior angle is 110 and one remote interior angle is 45, the other is 110 - 45 = 65 immediately - no need to find the third interior angle first.

## Which Three Lengths Make a Triangle

::: remember
THE TRIANGLE INEQUALITY: the sum of any two sides must be STRICTLY GREATER than the third. Checking the two smallest against the largest is enough, because that is the only comparison that can fail.

  3, 4, 8    ->  3 + 4 = 7, which is not greater than 8.  Impossible.
  6, 8, 13   ->  6 + 8 = 14, which is greater than 13.    Valid.
:::

## Right Triangles

Pythagoras: in a right triangle, the square on the hypotenuse equals the sum of the squares on the other two sides. Recognising the common triples on sight saves the arithmetic entirely:

  3, 4, 5        and its multiples 6-8-10, 9-12-15, 12-16-20
  5, 12, 13      and 10-24-26
  8, 15, 17
  7, 24, 25

  A triangle with sides 9, 12, 15 is just 3-4-5 scaled by three, so it is
  right-angled, and its area is half of 9 x 12 = 54.

  Hypotenuse 25 with one leg 7 gives the other leg as 24 straight from the
  7-24-25 triple, with no square roots taken.

## Area of a Triangle

::: flow Pick the formula that matches what you were given
Base and perpendicular height :: Area = half of base times height. This is the default, and it works for any triangle.
All three sides, no height :: Use Heron's formula. Let s be half the perimeter; the area is the square root of s(s-a)(s-b)(s-c). For sides 13, 14, 15 the value of s is 21, and the area is the square root of 21 x 8 x 7 x 6 = 7056, which is 84.
An equilateral triangle of side a :: Area = (root3 divided by 4) times a squared. For side 6 this gives 9 root3.
A right triangle :: The two legs ARE the base and height, so the area is just half their product.
:::

## Similarity and Congruence

Two triangles are SIMILAR when their angles match; corresponding sides are then in a fixed ratio. They are CONGRUENT when they are identical in size as well.

::: mistake
If two similar triangles have sides in the ratio 3:5, their AREAS are in the ratio 9:25, not 3:5. Area is a two-dimensional quantity, so it scales by the SQUARE of the length ratio - and volume, next week's topic, scales by the cube. Answering 3:5 here is one of the most reliably punished errors in mensuration.
:::

The centroid - where the three medians meet - divides each median in the ratio 2:1, measured from the vertex. That single fact answers most questions that mention medians at all.

::: checkpoint
The angles of a triangle are in the ratio 2:3:4. What is the largest angle?
- ( ) 60
- ( ) 70
- (x) 80
- ( ) 90
> The parts total 2 + 3 + 4 = 9, and the angles total 180, so one part is 20 degrees. The largest angle is 4 parts, which is 80 degrees. Check: 40 + 60 + 80 = 180. Confirmed.
:::

::: revision
- Triangle angles total 180; an exterior angle equals the sum of the two remote interior angles.
- Triangle inequality: the two shorter sides must sum to MORE than the longest.
- Memorise the triples 3-4-5, 5-12-13, 8-15-17, 7-24-25 and their multiples.
- Area = half base times height; Heron's formula when only the three sides are known.
- Equilateral area = (root3 / 4) times side squared.
- Similar triangles: sides in ratio k, areas in ratio k squared.
- The centroid splits each median 2:1 from the vertex.
- Equal sides face equal angles.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "The angles of a triangle are in the ratio 2:3:4. What is the largest angle?",
        options: ["60 degrees", "70 degrees", "80 degrees", "90 degrees"],
        correctIndex: 2,
        explanation: "The parts total 9 and the angle sum is 180, so one part is 20 degrees. The largest is 4 x 20 = 80 degrees. Check: 40 + 60 + 80 = 180.",
      },
      {
        id: "q2",
        text: "An exterior angle of a triangle is 110 degrees and one of the remote interior angles is 45 degrees. What is the other remote interior angle?",
        options: ["55 degrees", "65 degrees", "70 degrees", "75 degrees"],
        correctIndex: 1,
        explanation: "An exterior angle equals the sum of the two remote interior angles, so the other is 110 - 45 = 65 degrees.",
      },
      {
        id: "q3",
        text: "What is the area of a triangle with sides 9, 12 and 15?",
        options: ["48", "54", "60", "108"],
        correctIndex: 1,
        explanation: "9-12-15 is the 3-4-5 triple scaled by 3, so the triangle is right-angled with legs 9 and 12. Area = half of 9 x 12 = 54.",
      },
      {
        id: "q4",
        text: "What is the area of an equilateral triangle of side 6?",
        options: ["9 root3", "12 root3", "18 root3", "36 root3"],
        correctIndex: 0,
        explanation: "Area = (root3 / 4) x side squared = (root3 / 4) x 36 = 9 root3.",
      },
      {
        id: "q5",
        text: "Which of these sets of lengths can form a triangle?",
        options: ["3, 4, 8", "5, 6, 12", "6, 8, 13", "2, 3, 6"],
        correctIndex: 2,
        explanation: "The two shorter sides must sum to more than the longest. Only 6 + 8 = 14 exceeds 13. The others give 7 against 8, 11 against 12 and 5 against 6.",
      },
      {
        id: "q6",
        text: "A right triangle has hypotenuse 25 and one leg 7. What is the other leg?",
        options: ["18", "20", "24", "26"],
        correctIndex: 2,
        explanation: "This is the 7-24-25 triple. Directly: 625 - 49 = 576, and the square root of 576 is 24.",
      },
      {
        id: "q7",
        text: "The centroid of a triangle divides each median in the ratio (measured from the vertex):",
        options: ["1:1", "2:1", "3:1", "1:2"],
        correctIndex: 1,
        explanation: "The centroid sits two-thirds of the way along each median from the vertex, giving a 2:1 split.",
      },
      {
        id: "q8",
        text: "Two similar triangles have corresponding sides in the ratio 3:5. What is the ratio of their areas?",
        options: ["3:5", "9:25", "6:10", "27:125"],
        correctIndex: 1,
        explanation: "Area scales as the square of the length ratio, so 3:5 becomes 9:25. The ratio 27:125 would be the cube, which governs volumes.",
      },
      {
        id: "q9",
        text: "What is the area of a triangle with sides 13, 14 and 15?",
        options: ["80", "84", "90", "96"],
        correctIndex: 1,
        explanation: "By Heron's formula, s = (13+14+15)/2 = 21, and the area is the square root of 21 x 8 x 7 x 6 = 7056, which is 84.",
      },
      {
        id: "q10",
        text: "In a right triangle the two non-right angles are in the ratio 1:2. What is the smallest angle?",
        options: ["30 degrees", "45 degrees", "60 degrees", "90 degrees"],
        correctIndex: 0,
        explanation: "The two non-right angles total 90 degrees. Splitting 90 in the ratio 1:2 gives 30 and 60, so the smallest angle is 30 degrees.",
      },
      {
        id: "q11",
        text: "An isosceles triangle has a vertex angle of 40 degrees. What is each base angle?",
        options: ["60 degrees", "70 degrees", "80 degrees", "140 degrees"],
        correctIndex: 1,
        explanation: "The two base angles are equal and together make 180 - 40 = 140 degrees, so each is 70 degrees.",
      },
      {
        id: "q12",
        text: "What is the area of a triangle with base 10 and height 7?",
        options: ["17", "35", "70", "140"],
        correctIndex: 1,
        explanation: "Area = half of base times height = half of 10 x 7 = 35. Forgetting the half gives the common wrong answer 70.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q1", "q3", "q5", "q8", "q9"] },
    problemIds: [],
    xpReward: 50, coinReward: 20,
    status: "published",
  },

  // ------------------------------------------------------------------
  // Day 44 - Tuesday 15 Sep 2026 - Circles, Quadrilaterals & Polygons
  // ------------------------------------------------------------------
  {
    date: "2026-09-15", dow: "tue", weekId: "2026-09-14", type: "lesson",
    title: "Day 44: Circles, Quadrilaterals & Polygons",
    difficulty: "Medium",
    estimatedMinutes: 17,
    concept: `## The Shape With No Corners, and the Ones With Many

::: story
Ask how many degrees are inside a hexagon and most people guess. But a hexagon can be cut into exactly four triangles by drawing diagonals from one corner, and each triangle carries 180 degrees, so the answer is 720 - no memorisation required, just the cut.

That is the theme of today. Every polygon rule comes from chopping the shape into triangles, and every circle rule comes from one fact about angles standing on the same arc.
:::

## Polygons

::: table Angle rules for an n-sided polygon
Quantity | Formula | Hexagon (n = 6)
Sum of interior angles | (n - 2) x 180 | 4 x 180 = 720
Each interior angle, if REGULAR | (n - 2) x 180 / n | 720 / 6 = 120
Sum of exterior angles | Always 360, whatever n is | 360
Each exterior angle, if REGULAR | 360 / n | 60
Number of diagonals | n(n - 3) / 2 | 6 x 3 / 2 = 9
:::

The exterior-angle sum being 360 no matter how many sides is the single most useful line in the table. Walking once around any polygon turns you through exactly one full revolution, so to find the number of sides from a given exterior angle, just divide 360 by it: an exterior angle of 24 degrees means 360/24 = 15 sides.

## Quadrilaterals

::: table Areas worth knowing cold
Shape | Area
Rectangle | length x breadth
Square | side squared, or half the diagonal squared
Parallelogram | base x perpendicular height
Rhombus | half the product of the diagonals
Trapezium | half the sum of the parallel sides, times the height
:::

A rhombus has four equal sides and diagonals that bisect each other at right angles - which means each half-diagonal, paired with a side, forms a right triangle. From side 13 and one diagonal 24: the half-diagonal is 12, so the other half is the square root of 169 - 144 = 5, making the full second diagonal 10 and the area half of 24 x 10 = 120.

## Circles

With r as the radius and pi taken as 22/7:

  circumference  = 2 x pi x r          radius 7 gives 44
  area           = pi x r squared      radius 7 gives 154

Using radius 7 whenever pi is 22/7 makes the sevens cancel, which is exactly why examiners choose it. Expect radius 7, 14 or 21.

::: flow The four circle angle facts
Angle in a semicircle :: Any angle drawn on the diameter, with its vertex on the circle, is exactly 90 degrees. Spotting a diameter in a figure often hands you a right triangle for free.
Angle at the centre :: The angle at the centre is DOUBLE the angle at the circumference standing on the same arc. A central angle of 80 gives 40 at the circumference.
Angles in the same segment :: All angles standing on the same arc, from the same side, are equal to one another.
Cyclic quadrilateral :: If all four vertices lie on a circle, opposite angles total 180 degrees. One angle of 75 forces its opposite to be 105.
Tangent and radius :: A tangent meets the radius at the point of contact at exactly 90 degrees.
:::

::: mistake
The centre-to-circumference rule runs one way only: the CENTRE angle is the larger one, double the angle at the circumference. Given 80 at the centre, the circumference angle is 40. Doubling instead of halving, giving 160, is the standard error - and the figure will rarely stop you, because both numbers look plausible.
:::

::: checkpoint
Each exterior angle of a regular polygon is 24 degrees. How many sides does it have?
- ( ) 12
- (x) 15
- ( ) 18
- ( ) 20
> The exterior angles of any polygon total 360 degrees, so the number of sides is 360 / 24 = 15. Check: each interior angle is then 180 - 24 = 156, and (15-2) x 180 / 15 = 2340 / 15 = 156. Confirmed.
:::

::: revision
- Interior angle sum = (n-2) x 180; exterior angles always total 360.
- Regular polygon: each exterior angle = 360/n, so n = 360 divided by the exterior angle.
- Diagonals = n(n-3)/2.
- Rhombus area = half the product of the diagonals; trapezium = half the sum of parallel sides times height.
- Circumference = 2 pi r, area = pi r squared. Radius 7 with pi = 22/7 gives 44 and 154.
- Angle in a semicircle is 90; the centre angle is double the circumference angle.
- Cyclic quadrilateral: opposite angles total 180.
- Tangent is perpendicular to the radius at the point of contact.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "What is the sum of the interior angles of a hexagon?",
        options: ["540 degrees", "720 degrees", "900 degrees", "1080 degrees"],
        correctIndex: 1,
        explanation: "Sum = (n-2) x 180 = (6-2) x 180 = 720 degrees.",
      },
      {
        id: "q2",
        text: "What is each interior angle of a regular pentagon?",
        options: ["100 degrees", "108 degrees", "120 degrees", "144 degrees"],
        correctIndex: 1,
        explanation: "Sum = (5-2) x 180 = 540, and dividing by 5 gives 108 degrees each. Alternatively each exterior angle is 360/5 = 72, and 180 - 72 = 108.",
      },
      {
        id: "q3",
        text: "Each exterior angle of a regular polygon measures 24 degrees. How many sides does it have?",
        options: ["12", "15", "18", "20"],
        correctIndex: 1,
        explanation: "Exterior angles always total 360, so n = 360 / 24 = 15.",
      },
      {
        id: "q4",
        text: "One angle of a cyclic quadrilateral is 75 degrees. What is the angle opposite it?",
        options: ["75 degrees", "95 degrees", "105 degrees", "115 degrees"],
        correctIndex: 2,
        explanation: "Opposite angles of a cyclic quadrilateral total 180 degrees, so the opposite angle is 180 - 75 = 105.",
      },
      {
        id: "q5",
        text: "Taking pi as 22/7, what is the circumference of a circle of radius 7?",
        options: ["22", "44", "49", "154"],
        correctIndex: 1,
        explanation: "Circumference = 2 x (22/7) x 7 = 44. The sevens cancel, which is why radius 7 is chosen so often.",
      },
      {
        id: "q6",
        text: "Taking pi as 22/7, what is the area of a circle of radius 7?",
        options: ["44", "77", "154", "308"],
        correctIndex: 2,
        explanation: "Area = pi r squared = (22/7) x 49 = 22 x 7 = 154. Answering 44 confuses area with circumference.",
      },
      {
        id: "q7",
        text: "An angle drawn in a semicircle, with its vertex on the circle, always measures:",
        options: ["45 degrees", "60 degrees", "90 degrees", "180 degrees"],
        correctIndex: 2,
        explanation: "Any angle standing on a diameter is a right angle. Spotting a diameter therefore hands you a right triangle.",
      },
      {
        id: "q8",
        text: "An arc subtends 80 degrees at the centre of a circle. What angle does it subtend at the circumference?",
        options: ["20 degrees", "40 degrees", "80 degrees", "160 degrees"],
        correctIndex: 1,
        explanation: "The angle at the centre is double the angle at the circumference, so the circumference angle is 80 / 2 = 40 degrees. Doubling to 160 is the standard error.",
      },
      {
        id: "q9",
        text: "The diagonals of a rhombus are 16 and 12. What is its area?",
        options: ["48", "96", "192", "24"],
        correctIndex: 1,
        explanation: "Area of a rhombus = half the product of the diagonals = half of 16 x 12 = 96. Answering 192 forgets the half.",
      },
      {
        id: "q10",
        text: "How many diagonals does an octagon have?",
        options: ["16", "20", "24", "28"],
        correctIndex: 1,
        explanation: "Diagonals = n(n-3)/2 = 8 x 5 / 2 = 20.",
      },
      {
        id: "q11",
        text: "A trapezium has parallel sides 12 and 8 and a height of 5. What is its area?",
        options: ["40", "50", "60", "100"],
        correctIndex: 1,
        explanation: "Area = half the sum of the parallel sides times the height = half of (12 + 8) x 5 = 10 x 5 = 50.",
      },
      {
        id: "q12",
        text: "The sum of the exterior angles of any convex polygon is:",
        options: ["180 degrees", "360 degrees", "(n-2) x 180 degrees", "720 degrees"],
        correctIndex: 1,
        explanation: "It is always 360 degrees, independent of the number of sides, because walking once around the polygon turns you through one full revolution.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q1", "q3", "q6", "q8", "q9"] },
    problemIds: [],
    xpReward: 50, coinReward: 20,
    status: "published",
  },

  // ------------------------------------------------------------------
  // Day 45 - Wednesday 16 Sep 2026 - Mensuration 2D
  // ------------------------------------------------------------------
  {
    date: "2026-09-16", dow: "wed", weekId: "2026-09-14", type: "lesson",
    title: "Day 45: Mensuration 2D - Areas, Perimeters & Sectors",
    difficulty: "Medium",
    estimatedMinutes: 18,
    concept: `## Where the Marks Actually Are

::: story
Placement mensuration questions rarely ask for the area of a rectangle. They ask for the cost of carpeting a room, the area of a two-metre path running inside a field, or what happens to the area when the side grows by twenty per cent.

Every one of those is a plain area formula plus one extra step. This lesson is the formulas, and then the four extra steps that examiners actually build questions from.
:::

## The Core Formulas

::: table Area and perimeter
Shape | Area | Perimeter
Rectangle | length x breadth | 2 x (length + breadth)
Square | side squared, or half the diagonal squared | 4 x side
Triangle | half base times height | sum of the three sides
Circle | pi r squared | 2 pi r
Sector of angle A | (A/360) x pi r squared | arc = (A/360) x 2 pi r
:::

The square-from-diagonal formula is worth having: a square with diagonal d has area d squared over 2. A diagonal of 10 gives an area of 50, with no need to find the side.

## Sectors

A sector is a slice of a circle, and everything about it is the whole circle scaled by the fraction of 360 degrees the slice occupies.

  radius 7, angle 90 degrees, pi = 22/7:

    area = (90/360) x (22/7) x 49 = (1/4) x 154 = 38.5
    arc  = (90/360) x 2 x (22/7) x 7 = (1/4) x 44 = 11

  radius 21, angle 60 degrees:

    arc  = (60/360) x 2 x (22/7) x 21 = (1/6) x 132 = 22

## The Four Question Types Built On Top

::: flow What examiners actually ask
Cost problems :: Find the area, then multiply by the rate. A room 10 m by 8 m carpeted at 50 rupees per square metre costs 80 x 50 = 4000 rupees. The only trap is a rate quoted per square FOOT against dimensions in metres.
Path problems :: A path is the difference of two rectangles. For a 50 by 30 field with a 2 m path INSIDE the border, the inner rectangle is 46 by 26, because the path eats 2 m from BOTH ends of each dimension. Path area = 1500 - 1196 = 304.
Percentage-change problems :: A 20 per cent increase in the side multiplies it by 1.2, so the area multiplies by 1.2 squared = 1.44 - a 44 per cent increase, not 20 and not 40.
Ratio problems :: If two squares have sides in the ratio 3:4, their areas are in the ratio 9:16. Lengths scale by k, areas by k squared.
:::

::: mistake
In a path problem, a path of width w running INSIDE a rectangle reduces each dimension by 2w, not w, because it runs along both opposite edges. For a 50 by 30 field with a 2 m inner path the inner rectangle is 46 by 26, never 48 by 28. Subtracting only once is the single commonest error in mensuration.
:::

::: remember
Work the scaling rules rather than recomputing. Length scales by k, area by k squared, volume by k cubed. That one line answers every "the side is increased by x per cent" question in seconds, and it is the same rule that made similar-triangle areas 9:25 on Monday.
:::

::: checkpoint
A rectangular field is 50 m by 30 m. A path 2 m wide runs inside it, all the way around the border. What is the area of the path?
- ( ) 288 sq m
- (x) 304 sq m
- ( ) 320 sq m
- ( ) 336 sq m
> The outer area is 50 x 30 = 1500. The path takes 2 m off each of the four edges, so the inner rectangle is (50 - 4) by (30 - 4) = 46 by 26 = 1196. The path is 1500 - 1196 = 304 square metres. Subtracting only 2 from each dimension instead of 4 gives the wrong 288.
:::

::: revision
- Square from its diagonal: area = d squared over 2.
- Sector: multiply the whole circle's area or circumference by (angle / 360).
- Cost = area x rate; check the units match before multiplying.
- Inner path of width w reduces EACH dimension by 2w.
- Side up by p per cent means area up by a factor of (1 + p/100) squared.
- Lengths scale by k, areas by k squared, volumes by k cubed.
- With pi = 22/7, a radius of 7 gives circumference 44 and area 154.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "What is the area of a square whose diagonal is 10?",
        options: ["25", "50", "100", "200"],
        correctIndex: 1,
        explanation: "Area = diagonal squared over 2 = 100/2 = 50. Equivalently the side is 10 divided by root2, and squaring gives 50.",
      },
      {
        id: "q2",
        text: "What is the perimeter of a rectangle of length 12 and breadth 8?",
        options: ["20", "40", "48", "96"],
        correctIndex: 1,
        explanation: "Perimeter = 2 x (12 + 8) = 40. The value 96 is the area, and 20 forgets to double.",
      },
      {
        id: "q3",
        text: "Taking pi as 22/7, what is the area of a sector of radius 7 with a central angle of 90 degrees?",
        options: ["19.25", "38.5", "77", "154"],
        correctIndex: 1,
        explanation: "The full circle has area (22/7) x 49 = 154. A 90 degree sector is one quarter of it: 154/4 = 38.5.",
      },
      {
        id: "q4",
        text: "A room measures 10 m by 8 m. What does it cost to carpet at 50 rupees per square metre?",
        options: ["3200", "4000", "4800", "8000"],
        correctIndex: 1,
        explanation: "Area = 80 square metres, and 80 x 50 = 4000 rupees.",
      },
      {
        id: "q5",
        text: "Taking pi as 22/7, a circle has circumference 44. What is its radius?",
        options: ["5", "7", "11", "14"],
        correctIndex: 1,
        explanation: "From 2 x (22/7) x r = 44 we get (44/7) x r = 44, so r = 7.",
      },
      {
        id: "q6",
        text: "A square has area 144. What is its perimeter?",
        options: ["36", "48", "56", "576"],
        correctIndex: 1,
        explanation: "The side is the square root of 144, which is 12, so the perimeter is 4 x 12 = 48.",
      },
      {
        id: "q7",
        text: "A rectangular field 50 m by 30 m has a 2 m wide path running inside along its border. What is the area of the path?",
        options: ["288 sq m", "304 sq m", "320 sq m", "336 sq m"],
        correctIndex: 1,
        explanation: "Outer area 1500; inner rectangle is (50-4) by (30-4) = 46 x 26 = 1196. The path is 1500 - 1196 = 304 square metres.",
      },
      {
        id: "q8",
        text: "Two squares have sides in the ratio 3:4. What is the ratio of their areas?",
        options: ["3:4", "9:16", "6:8", "27:64"],
        correctIndex: 1,
        explanation: "Area scales as the square of the length ratio, so 3:4 becomes 9:16.",
      },
      {
        id: "q9",
        text: "Taking pi as 22/7, what is the length of an arc of radius 21 subtending 60 degrees at the centre?",
        options: ["11", "22", "33", "44"],
        correctIndex: 1,
        explanation: "The full circumference is 2 x (22/7) x 21 = 132. A 60 degree arc is one sixth of it: 132/6 = 22.",
      },
      {
        id: "q10",
        text: "What is the area of an equilateral triangle of side 10?",
        options: ["25 root3", "50 root3", "100 root3", "25"],
        correctIndex: 0,
        explanation: "Area = (root3 / 4) x side squared = (root3 / 4) x 100 = 25 root3.",
      },
      {
        id: "q11",
        text: "If the side of a square is increased by 20 per cent, by what percentage does its area increase?",
        options: ["20 per cent", "40 per cent", "44 per cent", "144 per cent"],
        correctIndex: 2,
        explanation: "The side multiplies by 1.2, so the area multiplies by 1.2 squared = 1.44 - an increase of 44 per cent. The figure 144 per cent is the new area as a percentage of the old, not the increase.",
      },
      {
        id: "q12",
        text: "A rhombus has side 13 and one diagonal 24. What is its area?",
        options: ["60", "120", "156", "240"],
        correctIndex: 1,
        explanation: "Half of the given diagonal is 12; the other half-diagonal is the square root of 169 - 144 = 5, so the second diagonal is 10. Area = half of 24 x 10 = 120.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q1", "q3", "q7", "q11", "q12"] },
    problemIds: [],
    xpReward: 50, coinReward: 20,
    status: "published",
  },

  // ------------------------------------------------------------------
  // Day 46 - Thursday 17 Sep 2026 - Mensuration 3D
  // ------------------------------------------------------------------
  {
    date: "2026-09-17", dow: "thu", weekId: "2026-09-14", type: "lesson",
    title: "Day 46: Mensuration 3D - Volumes & Surface Areas",
    difficulty: "Medium",
    estimatedMinutes: 18,
    concept: `## Every Solid Is an Area That Moved

::: story
There is no need to memorise the volume of a cylinder as an unrelated fact. A cylinder is a circle that has been dragged upward through a height, so its volume is the circle's area times that height. A cuboid is a rectangle dragged upward. A prism of any shape at all is its base area times its height.

Cones and spheres are the two that do not follow directly - a cone is exactly one third of the cylinder that would contain it, and the sphere formulas simply have to be learned. Everything else on this page is yesterday's areas, multiplied by a height.
:::

## The Formulas

::: table Volumes and surface areas
Solid | Volume | Curved / lateral surface | Total surface
Cube of edge a | a cubed | 4 a squared | 6 a squared
Cuboid l, b, h | l x b x h | 2h(l + b) | 2(lb + bh + hl)
Cylinder r, h | pi r squared h | 2 pi r h | 2 pi r (r + h)
Cone r, h, slant l | one third pi r squared h | pi r l | pi r (r + l)
Sphere r | four thirds pi r cubed | - | 4 pi r squared
Hemisphere r | two thirds pi r cubed | 2 pi r squared | 3 pi r squared
:::

Two supporting facts do a lot of work:

  DIAGONAL OF A CUBOID = square root of (l squared + b squared + h squared)

    For 3, 4, 12:  9 + 16 + 144 = 169, so the diagonal is 13.

  SLANT HEIGHT OF A CONE = square root of (r squared + h squared)

    For r = 6, h = 8:  36 + 64 = 100, so the slant height is 10.

Both are Pythagoras. The cone's radius, vertical height and slant height form a right triangle, which is why the 3-4-5 family keeps appearing in cone questions.

::: flow Reading which surface a question wants
Curved or lateral surface :: The side only. For a cylinder this is 2 pi r h - the label wrapped around a tin, with no lid and no base.
Total surface :: The sides plus every flat face. For a cylinder that adds two circles, giving 2 pi r (r + h).
A tank open at the top :: One circle, not two. Take the curved surface plus a single base.
A hemisphere's total surface :: The curved half-sphere 2 pi r squared PLUS the flat circular face pi r squared, giving 3 pi r squared. Forgetting the flat face is the standard slip.
:::

## Worked Values With pi = 22/7

  Cylinder, r = 7, h = 10:

    volume = (22/7) x 49 x 10 = 22 x 7 x 10 = 1540
    curved surface = 2 x (22/7) x 7 x 10 = 440

  Cone, r = 3, h = 7:

    volume = (1/3) x (22/7) x 9 x 7 = (1/3) x 198 = 66

  Sphere, r = 7:

    surface area = 4 x (22/7) x 49 = 4 x 154 = 616

  Hemisphere, r = 7:

    total surface = 3 x (22/7) x 49 = 3 x 154 = 462

::: mistake
A cone is one THIRD of the cylinder with the same radius and height, and this factor is dropped constantly under time pressure. Equally, its curved surface uses the SLANT height l, never the vertical height h. Compute l first from Pythagoras, then use it.
:::

::: remember
Scaling in three dimensions: doubling every edge of a cube multiplies its volume by 2 cubed = 8, while its surface area only multiplies by 4. Lengths by k, areas by k squared, volumes by k cubed - the same rule as Monday's similar triangles and yesterday's percentage-change questions, now one dimension further up.
:::

::: checkpoint
How many cubes of edge 2 cm fit inside a cube of edge 6 cm?
- ( ) 9
- ( ) 18
- (x) 27
- ( ) 36
> Three small cubes fit along each edge, so the count is 3 x 3 x 3 = 27. Checking by volume: 216 divided by 8 is also 27. Answering 9 uses only two dimensions.
:::

::: revision
- Prism or cylinder volume = base area x height. A cone is one third of its cylinder.
- Cube: volume a cubed, total surface 6 a squared.
- Cuboid diagonal = root(l squared + b squared + h squared).
- Cone slant height = root(r squared + h squared); curved surface = pi r l, using l not h.
- Sphere: volume four thirds pi r cubed, surface 4 pi r squared.
- Hemisphere total surface = 3 pi r squared, because the flat face counts.
- Open-topped containers have one base, not two.
- Volumes scale by k cubed when every length scales by k.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "What is the volume of a cube of edge 5?",
        options: ["25", "75", "125", "150"],
        correctIndex: 2,
        explanation: "Volume = edge cubed = 5 x 5 x 5 = 125.",
      },
      {
        id: "q2",
        text: "What is the total surface area of a cube of edge 4?",
        options: ["64", "96", "128", "384"],
        correctIndex: 1,
        explanation: "Total surface = 6 x edge squared = 6 x 16 = 96. The value 64 is the volume.",
      },
      {
        id: "q3",
        text: "Taking pi as 22/7, what is the volume of a cylinder of radius 7 and height 10?",
        options: ["440", "1540", "2200", "3080"],
        correctIndex: 1,
        explanation: "Volume = pi r squared h = (22/7) x 49 x 10 = 1540. The value 440 is the curved surface area.",
      },
      {
        id: "q4",
        text: "Taking pi as 22/7, what is the curved surface area of a cylinder of radius 7 and height 10?",
        options: ["220", "440", "616", "1540"],
        correctIndex: 1,
        explanation: "Curved surface = 2 pi r h = 2 x (22/7) x 7 x 10 = 440.",
      },
      {
        id: "q5",
        text: "Taking pi as 22/7, what is the surface area of a sphere of radius 7?",
        options: ["154", "308", "616", "1232"],
        correctIndex: 2,
        explanation: "Surface area = 4 pi r squared = 4 x (22/7) x 49 = 4 x 154 = 616.",
      },
      {
        id: "q6",
        text: "A cone has radius 6 and vertical height 8. What is its slant height?",
        options: ["9", "10", "12", "14"],
        correctIndex: 1,
        explanation: "Slant height = root(36 + 64) = root100 = 10. This is the 3-4-5 triple doubled.",
      },
      {
        id: "q7",
        text: "Taking pi as 22/7, what is the volume of a cone of radius 3 and height 7?",
        options: ["44", "66", "88", "198"],
        correctIndex: 1,
        explanation: "Volume = one third x (22/7) x 9 x 7 = one third of 198 = 66. Omitting the one third gives the wrong 198.",
      },
      {
        id: "q8",
        text: "What is the length of the diagonal of a cuboid measuring 3 by 4 by 12?",
        options: ["12", "13", "15", "19"],
        correctIndex: 1,
        explanation: "Diagonal = root(9 + 16 + 144) = root169 = 13.",
      },
      {
        id: "q9",
        text: "If the edge of a cube is doubled, its volume becomes how many times the original?",
        options: ["2 times", "4 times", "6 times", "8 times"],
        correctIndex: 3,
        explanation: "Volume scales as the cube of the length factor, so doubling the edge multiplies the volume by 2 cubed = 8. The surface area, by contrast, multiplies by 4.",
      },
      {
        id: "q10",
        text: "Taking pi as 22/7, what is the total surface area of a hemisphere of radius 7?",
        options: ["154", "308", "462", "616"],
        correctIndex: 2,
        explanation: "Total surface = 3 pi r squared = 3 x (22/7) x 49 = 3 x 154 = 462. Using only the curved part 2 pi r squared gives 308 and forgets the flat circular face.",
      },
      {
        id: "q11",
        text: "What is the volume of a cuboid measuring 8 by 6 by 3?",
        options: ["17", "96", "144", "288"],
        correctIndex: 2,
        explanation: "Volume = 8 x 6 x 3 = 144.",
      },
      {
        id: "q12",
        text: "How many cubes of edge 2 cm can be packed into a cube of edge 6 cm?",
        options: ["9", "18", "27", "36"],
        correctIndex: 2,
        explanation: "Three fit along each edge, so 3 x 3 x 3 = 27. By volume, 216 / 8 = 27.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q3", "q6", "q7", "q9", "q10"] },
    problemIds: [],
    xpReward: 50, coinReward: 20,
    status: "published",
  },

  // ------------------------------------------------------------------
  // Day 47 - Friday 18 Sep 2026 - Coordinate Geometry
  // ------------------------------------------------------------------
  {
    date: "2026-09-18", dow: "fri", weekId: "2026-09-14", type: "lesson",
    title: "Day 47: Coordinate Geometry - Distance, Slope & Section",
    difficulty: "Medium",
    estimatedMinutes: 17,
    concept: `## Geometry You Can Compute Instead of Draw

::: story
Monday needed a figure to find a length. Today you need only two pairs of numbers. Put the plane on a grid, give every point an address, and distance becomes Pythagoras, "parallel" becomes "equal slopes", and the midpoint becomes an average.

Nothing new is being claimed about geometry. The same facts are simply being restated so a formula can do the work a diagram used to.
:::

## Distance and Midpoint

Between the points (x1, y1) and (x2, y2):

  distance = square root of ( (x2 - x1) squared + (y2 - y1) squared )
  midpoint = ( (x1 + x2)/2 ,  (y1 + y2)/2 )

  From (1, 2) to (4, 6):  differences 3 and 4, so the distance is root(9 + 16) = 5.
  From (3, 4) to the origin: root(9 + 16) = 5 again.

The distance formula is Pythagoras with the horizontal and vertical gaps as the two legs - which is why 3-4-5 and 5-12-13 keep turning up in coordinate questions too. The midpoint is just the average of the two addresses.

## The Section Formula

To find the point dividing the join of (x1, y1) and (x2, y2) internally in the ratio m:n, take a weighted average - and note the cross-pairing, which is where mistakes happen:

  x = (m x2 + n x1) / (m + n)
  y = (m y2 + n y1) / (m + n)

  The FAR point's coordinate is multiplied by m, the near point's by n.

  Dividing (1, 2) to (7, 11) in the ratio 2:1:

    x = (2 x 7 + 1 x 1) / 3 = 15/3 = 5
    y = (2 x 11 + 1 x 2) / 3 = 24/3 = 8

    the point is (5, 8)

Setting m = n = 1 recovers the midpoint formula exactly, which is a good way to check you have the pairing the right way round.

## Slope

::: table What a slope tells you
Situation | Slope
Through (x1,y1) and (x2,y2) | (y2 - y1) / (x2 - x1)
Horizontal line | 0
Vertical line | undefined, because the denominator is zero
Two parallel lines | equal slopes
Two perpendicular lines | the product of the slopes is -1
:::

  Through (1, 2) and (3, 6): slope = (6 - 2)/(3 - 1) = 4/2 = 2.
  A line perpendicular to that has slope -1/2, because 2 x (-1/2) = -1.

For a line written as ax + by = c, the intercepts come from setting the other variable to zero: the x-intercept of 2x + 3y = 12 is found by putting y = 0, giving x = 6.

## Area From Coordinates

For a triangle with vertices (x1,y1), (x2,y2), (x3,y3):

  area = half the absolute value of
         x1(y2 - y3) + x2(y3 - y1) + x3(y1 - y2)

When a triangle has two sides along the axes the formula is unnecessary - (0,0), (4,0), (0,3) is just a right triangle with legs 4 and 3, so the area is 6. Use the formula only when no side is axis-aligned.

::: remember
An area of zero from that formula does not mean an error. It means the three points are COLLINEAR - they lie on one straight line and enclose nothing. Examiners use precisely this as the test for collinearity, so read a zero as information rather than as a mistake.
:::

::: mistake
Perpendicular slopes multiply to -1; they are negative RECIPROCALS. The perpendicular to a line of slope 2 has slope -1/2, not -2 and not 1/2. Dropping either the minus sign or the flip is the standard error, and both wrong values will usually be offered as options.
:::

::: checkpoint
What point divides the join of (1, 2) and (7, 11) internally in the ratio 2:1?
- ( ) (3, 5)
- (x) (5, 8)
- ( ) (4, 6.5)
- ( ) (5, 7)
> Using the section formula with m = 2 and n = 1: x = (2 x 7 + 1 x 1)/3 = 15/3 = 5, and y = (2 x 11 + 1 x 2)/3 = 24/3 = 8. The option (4, 6.5) is the midpoint, which would be the ratio 1:1.
:::

::: revision
- Distance = root of the sum of the squared coordinate differences.
- Midpoint = the average of the two coordinate pairs.
- Section formula in ratio m:n weights the FAR point by m and the near point by n.
- Slope = rise over run; horizontal is 0 and vertical is undefined.
- Parallel means equal slopes; perpendicular means the slopes multiply to -1.
- Intercepts: set the other variable to zero.
- A zero triangle area from coordinates means the points are collinear.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "What is the distance between the points (3, 4) and the origin?",
        options: ["3", "4", "5", "7"],
        correctIndex: 2,
        explanation: "Distance = root(3 squared + 4 squared) = root25 = 5. This is the 3-4-5 triple.",
      },
      {
        id: "q2",
        text: "What is the midpoint of the segment joining (2, 3) and (8, 11)?",
        options: ["(5, 7)", "(6, 8)", "(10, 14)", "(3, 4)"],
        correctIndex: 0,
        explanation: "Midpoint = ((2+8)/2, (3+11)/2) = (5, 7). The option (10, 14) is the sum without halving.",
      },
      {
        id: "q3",
        text: "What is the slope of the line through (1, 2) and (3, 6)?",
        options: ["1", "2", "3", "4"],
        correctIndex: 1,
        explanation: "Slope = (6 - 2)/(3 - 1) = 4/2 = 2.",
      },
      {
        id: "q4",
        text: "What is the slope of a line perpendicular to a line of slope 2?",
        options: ["2", "-2", "1/2", "-1/2"],
        correctIndex: 3,
        explanation: "Perpendicular slopes multiply to -1, so the required slope is -1/2. It must be both flipped and negated.",
      },
      {
        id: "q5",
        text: "What is the distance between (1, 2) and (4, 6)?",
        options: ["4", "5", "6", "7"],
        correctIndex: 1,
        explanation: "The differences are 3 and 4, so the distance is root(9 + 16) = 5.",
      },
      {
        id: "q6",
        text: "Which point divides the join of (1, 2) and (7, 11) internally in the ratio 2:1?",
        options: ["(3, 5)", "(5, 8)", "(4, 6.5)", "(5, 7)"],
        correctIndex: 1,
        explanation: "x = (2x7 + 1x1)/3 = 5 and y = (2x11 + 1x2)/3 = 8, giving (5, 8). The point (4, 6.5) would be the midpoint.",
      },
      {
        id: "q7",
        text: "What is the area of the triangle with vertices (0,0), (4,0) and (0,3)?",
        options: ["6", "7", "12", "24"],
        correctIndex: 0,
        explanation: "Two sides lie along the axes, so it is a right triangle with legs 4 and 3. Area = half of 12 = 6.",
      },
      {
        id: "q8",
        text: "Two distinct lines are parallel when their slopes are:",
        options: ["Equal", "Negative reciprocals", "Both zero", "Adding to 1"],
        correctIndex: 0,
        explanation: "Parallel lines rise at the same rate, so their slopes are equal. Negative reciprocals describe perpendicular lines.",
      },
      {
        id: "q9",
        text: "What is the x-intercept of the line 2x + 3y = 12?",
        options: ["4", "6", "12", "2"],
        correctIndex: 1,
        explanation: "Set y = 0, giving 2x = 12 and x = 6. Setting x = 0 instead would give the y-intercept of 4.",
      },
      {
        id: "q10",
        text: "The point (0, -5) lies on:",
        options: ["The x-axis", "The y-axis", "The origin", "Neither axis"],
        correctIndex: 1,
        explanation: "A point with x-coordinate 0 lies on the y-axis. Points on the x-axis have y-coordinate 0.",
      },
      {
        id: "q11",
        text: "What is the distance of the point (6, 8) from the origin?",
        options: ["8", "10", "14", "48"],
        correctIndex: 1,
        explanation: "Distance = root(36 + 64) = root100 = 10. This is the 3-4-5 triple doubled.",
      },
      {
        id: "q12",
        text: "What is the slope of a horizontal line?",
        options: ["0", "1", "Undefined", "-1"],
        correctIndex: 0,
        explanation: "A horizontal line has no rise, so its slope is 0. A VERTICAL line is the one with an undefined slope, because its run is zero.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q1", "q4", "q6", "q9", "q12"] },
    problemIds: [],
    xpReward: 50, coinReward: 20,
    status: "published",
  },

  // ------------------------------------------------------------------
  // Day 48 - Saturday 19 Sep 2026 - Week 8 Recap
  // ------------------------------------------------------------------
  {
    date: "2026-09-19", dow: "sat", weekId: "2026-09-14", type: "lesson",
    title: "Day 48: Week 8 Recap - Geometry & Mensuration",
    difficulty: "Medium",
    estimatedMinutes: 20,
    concept: `## One Rule Ran Through the Whole Week

::: story
On Monday, two similar triangles with sides in the ratio 3:5 had areas in the ratio 9:25. On Wednesday, increasing a square's side by 20 per cent increased its area by 44 per cent, because 1.2 squared is 1.44. On Thursday, doubling a cube's edge multiplied its volume by 8.

Those are three appearances of a single rule: scale every length by k, and areas scale by k squared while volumes scale by k cubed. If one idea survives from this week, make it that one - it converts a whole family of questions into a single multiplication.
:::

## The Week on One Page

::: table What to reach for
If the question involves... | Use
Triangle angles | Sum 180; exterior angle equals the sum of the two remote interior angles
Three given lengths | Triangle inequality; check the two shorter against the longest
A right triangle | Pythagoras, and the triples 3-4-5, 5-12-13, 8-15-17, 7-24-25
Three sides but no height | Heron's formula with s as half the perimeter
A polygon's angles | Interior sum (n-2) x 180; exterior always 360, so n = 360 / exterior
A circle's angles | Semicircle gives 90; the centre angle is double the circumference angle; cyclic opposites total 180
A slice of a circle | Multiply the whole circle by (angle / 360)
A path around a field | Difference of two rectangles; an inner path takes 2w off each dimension
A solid | Base area times height; a cone is one third of its cylinder
Points given as coordinates | Distance is Pythagoras; parallel means equal slopes; perpendicular slopes multiply to -1
:::

## The Traps That Cost the Most Marks

::: mistake
1. Areas scale by the SQUARE of the length ratio, never by the ratio itself. Sides 3:5 means areas 9:25.
2. An inner path of width w reduces each dimension by 2w, because it runs along both edges.
3. A cone's volume carries a factor of one third, and its curved surface uses the SLANT height, not the vertical height.
4. A hemisphere's total surface is 3 pi r squared, because the flat circular face counts too.
5. Perpendicular slopes are negative reciprocals: the perpendicular to slope 2 is -1/2, not -2.
:::

::: remember
Where a numeric answer is wanted and pi is given as 22/7, expect a radius of 7, 14 or 21 - the sevens are chosen to cancel. If your working leaves an ugly fraction, re-read the radius before re-doing the arithmetic.
:::

::: checkpoint
If the radius of a sphere is doubled, its volume becomes how many times the original?
- ( ) 2 times
- ( ) 4 times
- ( ) 6 times
- (x) 8 times
> Volume scales as the cube of the length factor, so doubling the radius multiplies the volume by 2 cubed = 8. The surface area, scaling as the square, only multiplies by 4.
:::

::: revision
- Triangle angle sum 180; exterior angle equals the two remote interior angles added.
- Triangle inequality: the two shorter sides must exceed the longest.
- Heron: s is half the perimeter, area = root of s(s-a)(s-b)(s-c).
- Polygons: interior sum (n-2) x 180, exterior sum always 360, diagonals n(n-3)/2.
- Circle: semicircle angle 90, centre angle is double, cyclic opposites total 180.
- Rhombus area = half the product of the diagonals; trapezium = half the sum of parallel sides times height.
- Cone: volume one third pi r squared h, curved surface pi r l with l = root(r squared + h squared).
- Hemisphere total surface = 3 pi r squared.
- Lengths by k, areas by k squared, volumes by k cubed.
- Coordinates: distance by Pythagoras, parallel means equal slopes, perpendicular slopes multiply to -1.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "The angles of a triangle are in the ratio 1:2:3. What is the largest angle?",
        options: ["60 degrees", "75 degrees", "90 degrees", "120 degrees"],
        correctIndex: 2,
        explanation: "The parts total 6 and the angles total 180, so one part is 30 degrees. The largest is 3 x 30 = 90 degrees, making it a right triangle.",
      },
      {
        id: "q2",
        text: "What is the sum of the interior angles of a decagon (10 sides)?",
        options: ["1260 degrees", "1440 degrees", "1620 degrees", "1800 degrees"],
        correctIndex: 1,
        explanation: "Sum = (n-2) x 180 = 8 x 180 = 1440 degrees.",
      },
      {
        id: "q3",
        text: "Taking pi as 22/7, what is the area of a circle of diameter 28?",
        options: ["308", "616", "1232", "2464"],
        correctIndex: 1,
        explanation: "The radius is 14, so the area is (22/7) x 196 = 22 x 28 = 616. Using the diameter as the radius gives the wrong 2464.",
      },
      {
        id: "q4",
        text: "A cone has radius 5 and slant height 13. What is its vertical height?",
        options: ["8", "10", "12", "14"],
        correctIndex: 2,
        explanation: "From the 5-12-13 triple, the height is 12. Directly: root(169 - 25) = root144 = 12.",
      },
      {
        id: "q5",
        text: "Two similar triangles have areas in the ratio 16:49. What is the ratio of their corresponding sides?",
        options: ["4:7", "16:49", "8:14", "2:7"],
        correctIndex: 0,
        explanation: "Sides are in the square root of the area ratio: root16 : root49 = 4:7.",
      },
      {
        id: "q6",
        text: "What is the area of a trapezium with parallel sides 15 and 9 and height 8?",
        options: ["96", "108", "120", "135"],
        correctIndex: 0,
        explanation: "Area = half of (15 + 9) x 8 = 12 x 8 = 96.",
      },
      {
        id: "q7",
        text: "If the radius of a sphere is doubled, its volume becomes how many times the original?",
        options: ["2 times", "4 times", "6 times", "8 times"],
        correctIndex: 3,
        explanation: "Volume scales as the cube of the length factor, so it becomes 2 cubed = 8 times. The surface area becomes only 4 times.",
      },
      {
        id: "q8",
        text: "What is the slope of the line joining (2, 5) and (6, 13)?",
        options: ["1", "2", "3", "4"],
        correctIndex: 1,
        explanation: "Slope = (13 - 5)/(6 - 2) = 8/4 = 2.",
      },
      {
        id: "q9",
        text: "One angle of a cyclic quadrilateral is 110 degrees. What is its opposite angle?",
        options: ["55 degrees", "70 degrees", "90 degrees", "110 degrees"],
        correctIndex: 1,
        explanation: "Opposite angles of a cyclic quadrilateral total 180, so the opposite is 180 - 110 = 70 degrees.",
      },
      {
        id: "q10",
        text: "Taking pi as 22/7, what is the volume of a cylinder of radius 14 and height 5?",
        options: ["1540", "2200", "3080", "6160"],
        correctIndex: 2,
        explanation: "Volume = (22/7) x 196 x 5 = 616 x 5 = 3080.",
      },
      {
        id: "q11",
        text: "A square lawn has a 1 m wide path running inside along its border. If the lawn is 20 m on each side, what is the area of the path?",
        options: ["76 sq m", "79 sq m", "80 sq m", "84 sq m"],
        correctIndex: 0,
        explanation: "Outer area = 400. The inner square is 20 - 2 = 18 on each side, giving 324. The path is 400 - 324 = 76 square metres.",
      },
      {
        id: "q12",
        text: "What is the length of the diagonal of a cube of edge 6?",
        options: ["6 root2", "6 root3", "12", "18"],
        correctIndex: 1,
        explanation: "A cube's space diagonal is root(36 + 36 + 36) = root108 = 6 root3. The value 6 root2 is the diagonal of one FACE.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q3", "q5", "q7", "q11", "q12"] },
    problemIds: [],
    xpReward: 80, coinReward: 30,
    status: "published",
  },

];
