// Computer Graphics - rewritten lesson bodies. See operating-systems.mjs for
// the authoring rules. The subject is one pipeline taught in stages, so each
// lesson names where it sits in that sequence and why it sits there - the
// ordering is itself the content, particularly why clipping precedes
// rasterization.

export const COMPUTER_GRAPHICS = {
  "introduction-to-computer-graphics": {
    concept: `## The Algorithms, Not The Software

::: story
Computer graphics is often confused with graphic design. They share a subject and almost nothing else.

Design is the creative use of tools. Graphics is the mathematics inside the tools - the algorithms that turn a description of shapes into the pixels on your screen.
:::

## Two Ways To Store An Image

::: cards
Raster :: A grid of coloured pixels. A photograph, a screenshot. Direct to display, and enlarging it stretches the same fixed pixels into visible blocks.
Vector :: Mathematical descriptions - a circle at this centre with this radius. Scales to any size losslessly, because the maths is re-evaluated at whatever resolution you need.
:::

::: story
Which is why a logo is an SVG and a photograph is a JPEG.

The logo must look sharp on a business card and on a billboard, and it's made of shapes that can be described. A photograph is continuous tone with no describable shapes - trying to store it as vectors would be absurd.
:::

::: checkpoint
Why does enlarging a photo produce blocky edges while enlarging an SVG logo doesn't?
- ( ) SVG files are larger
- (x) The photo has a fixed pixel grid to stretch; the SVG re-computes its geometry at the new size
- ( ) Photos use fewer colours
- ( ) Both actually degrade equally
> Fixed samples versus a recomputed description. There's no information in the photo between its pixels, so enlargement can only invent it.
:::

## The Pipeline This Subject Follows

::: timeline From scene to screen
Define geometry :: Objects as coordinates in a coordinate system.
Transform :: Move, rotate, scale - and project 3D down to 2D.
Clip :: Discard anything outside the visible window.
Rasterize :: Convert the surviving geometry into actual pixels.
Shade :: Determine each pixel's final colour.
:::

::: remember
Those stages are this subject's remaining lessons, in order.

Worth holding the shape now, because each lesson makes more sense as "the stage that solves the problem the previous one left".
:::

::: behind
Real systems use both representations at once, which is worth expecting rather than finding contradictory.

A game's 3D models are vector geometry - meshes of triangles - which get rasterized to pixels each frame. The textures painted onto those surfaces are raster images.

Geometry where shapes are describable, raster where they aren't.
:::`,
  },

  "coordinate-systems-transformations": {
    concept: `## Moving Things Around

::: story
Every object needs a position, and "position" means numbers - coordinates in a system that gives every point in space an (x, y) or (x, y, z).

Once everything is coordinates, moving an object becomes arithmetic on those numbers.
:::

::: cards The three transformations
Translation :: Add an offset to every point. Shift by (+5, +3).
Rotation :: Turn around a fixed point, computed with sine and cosine on each coordinate.
Scaling :: Multiply every coordinate by a factor. 2 doubles the size, 0.5 halves it.
:::

## Why They're Matrices

::: story
Each of those could be implemented as its own function. Graphics systems represent all three as **matrices** instead, multiplied against a point's coordinates.

Which sounds like unnecessary abstraction until you need to do all three.

Matrix multiplication composes. Multiply the translate, rotate and scale matrices together once, and you have a single matrix doing all three - then apply it to each of a model's fifty thousand vertices.

One operation per vertex instead of three.
:::

::: remember
That composition property is the entire reason for the matrix representation.

A model with a hundred thousand vertices, transformed by five operations, is five hundred thousand operations done naively - or one matrix multiplication computed once and a hundred thousand applications. At sixty frames per second, that difference decides whether the frame renders.
:::

::: checkpoint
You need to rotate an object then move it. Why combine the matrices first rather than applying each in turn?
- ( ) It gives a different result
- (x) Combining costs one multiplication once; applying separately costs an extra operation per vertex
- ( ) Rotation must always precede translation
- ( ) It reduces memory use
> Same result, computed once instead of per vertex. Note order does matter - rotate-then-translate differs from translate-then-rotate - but the combining is free either way.
:::

::: mistake
Rotation happens around a specific point, usually the origin. Rotating an object that isn't at the origin turns it *and* swings it around, like a planet orbiting.

To rotate in place: translate to the origin, rotate, translate back. A composed sequence, which is exactly what matrix combination makes cheap.
:::

::: behind
**Homogeneous coordinates** are the trick that makes this uniform. Translation is addition, while rotation and scaling are multiplication - so translation shouldn't fit the matrix scheme.

Representing a 2D point as (x, y, 1) with 3x3 matrices makes translation expressible as multiplication too. One extra dimension, and all three transformations compose in the same pipeline.

Which is why graphics maths uses 4x4 matrices for 3D rather than 3x3.
:::`,
  },

  "line-circle-drawing-algorithms": {
    concept: `## Drawing A Line Is Not Obvious

::: story
A mathematical line is continuous and infinitely thin. A screen is a grid of squares.

So "draw a line" really means: choose which squares to colour so the result looks most like the line. And a graphics system may do this millions of times a second.
:::

::: story
The obvious approach: for each x, compute y = mx + b and round to the nearest pixel.

Correct, and it uses floating-point multiplication and rounding at every step - which is markedly more expensive than integer arithmetic, and you're doing it millions of times.
:::

**Bresenham's algorithm** does the same job with integers only.

::: cards How
Track an error term :: An integer measuring how far the true line has drifted from the pixels drawn so far.
Decide by comparison :: At each step, an integer comparison decides whether y stays or steps by one, and the error is updated by addition.
No floating point at all :: No multiplication, no rounding, no division.
:::

::: remember
And the output is **identical** to the naive version - the same pixels, chosen faster.

Which makes it a pure optimisation with no quality trade-off, and that's unusual enough to be worth noting. Most performance work costs something.
:::

::: checkpoint
Bresenham's algorithm is faster than the naive approach. What does it give up?
- ( ) Some accuracy at line ends
- (x) Nothing - same pixels, less computation
- ( ) It only handles horizontal lines
- ( ) It needs more memory
> Nothing. The reformulation avoids floating point without approximating anything - which is why it's still in hardware fifty years later.
:::

## Circles, And A Free Eightfold Saving

::: story
The **midpoint circle algorithm** uses the same integer-error idea, plus one observation.

A circle is symmetric across eight octants. Compute one 45-degree arc and the other seven are reflections - mirror the coordinates, no computation.

One-eighth of the work.
:::

::: behind
Both algorithms produce hard-edged pixels, so diagonals look like staircases.

**Anti-aliasing** softens that by partially colouring boundary pixels according to how much of them the true shape covers - a pixel half-covered gets half the colour.

Which costs computation Bresenham's binary on/off approach deliberately avoided, and is why it's a separate, optional stage rather than built in.
:::`,
  },

  "2d-clipping": {
    concept: `## Don't Draw What Nobody Sees

::: story
A game world contains far more geometry than the camera can see. Most of it is behind you, or beyond the horizon, or through a wall.

Rasterizing it and then discarding the pixels is work done for nothing - and rasterization is the expensive stage.
:::

**Clipping** discards or trims geometry outside the visible window, before rasterization ever touches it.

## Cohen-Sutherland

::: story
Give each line endpoint a 4-bit code, one bit per boundary it falls outside - above, below, left, right. A point inside the window is 0000.

Two bit operations then resolve most cases instantly.

Both codes 0000: the line is entirely inside. Draw it, no maths.

Bitwise AND of the codes non-zero: both endpoints are outside the *same* boundary, so the whole line is outside. Discard it, no maths.

Only what's left over needs an actual intersection computed.
:::

::: remember
The elegance is that the common cases are answered by bit operations rather than geometry.

In a real scene most lines are wholly visible or wholly invisible. Handling those in two instructions, and reserving the expensive arithmetic for the genuinely partial cases, is the whole design.
:::

::: checkpoint
Why does a non-zero bitwise AND of the two codes prove the line is invisible?
- ( ) It proves both points are outside, in any direction
- (x) A shared set bit means both endpoints are outside the *same* edge - so the entire segment between them is too
- ( ) It doesn't; it's a heuristic
- ( ) It only works for horizontal lines
> Both beyond the same boundary means every point between them is as well. Note both being outside in *different* directions doesn't prove invisibility - the line can still cross the window, which is why that case needs real work.
:::

::: remember
And notice why clipping sits where it does in the pipeline.

Before rasterization it saves the cost of pixels nobody sees. After it, the saving is already spent. Stage ordering here is a performance decision, not an arbitrary sequence.
:::

::: behind
**Sutherland-Hodgman** extends clipping from line segments to polygons, trimming against each window edge in turn and rewriting the vertex list as it goes.

Necessary for real 3D, where the geometry is filled triangles rather than wireframes - and the same principle, applied to shapes with an inside.
:::`,
  },

  "3d-graphics-projections": {
    concept: `## Flattening Three Dimensions Into Two

::: story
The scene has depth. The screen doesn't.

**Projection** is the conversion, and how you do it decides whether the image looks like a photograph or like a blueprint.
:::

## Two Methods

::: cards Two methods
Orthographic :: Drop the z coordinate. Use x and y directly. Objects stay the same size regardless of distance.
Perspective :: Divide x and y by depth. Distant objects shrink, exactly as in vision and photography.
:::

::: story
That division is the entire difference, and it's worth seeing why it produces the effect.

Divide x by a small z and x barely changes - a near object stays large. Divide by a large z and x shrinks toward the centre - a far object contracts toward the middle of the screen.

Apply that to two parallel rails receding into the distance and they converge on a point. Which is what perspective looks like, arriving from one division.
:::

::: checkpoint
Why would a CAD tool deliberately choose orthographic projection?
- ( ) It renders faster
- (x) Measurements stay accurate - perspective shrinks distant parts, so a drawing couldn't be measured
- ( ) It supports more colours
- ( ) CAD tools can't do perspective
> Undistorted proportions. An engineering drawing has to be measurable, and a projection that shrinks things by distance makes that impossible - so the "less realistic" option is the correct one.
:::

::: remember
Realism isn't always the goal, which this pair makes concrete.

Perspective for anything meant to look real. Orthographic for anything meant to be measured, and for strategy games where a consistent-size grid matters more than the illusion of depth.
:::

::: behind
**Field of view** controls how wide an angle the perspective projection captures.

Wide FOV shows more of the scene and exaggerates the near/far size difference - the fisheye look. Narrow FOV shows less with gentler distortion, which reads as flatter and more telephoto.

Games expose it as a setting because it affects perceived speed and space, not just how much is visible.
:::`,
  },

  "rendering-rasterization": {
    concept: `## Geometry Becomes Pixels

::: story
Everything so far has been geometry - coordinates, transformed, projected, clipped.

**Rasterization** is where it stops being geometry: for each triangle, work out which pixels fall inside it and colour them.
:::

Almost all 3D surfaces are broken into triangles first, because a triangle is the simplest shape that is always flat and always convex - which makes "is this pixel inside it" cheap to answer.

## Which Surface Wins

::: story
Two triangles from two objects project to the same pixel. Only the nearer one should be visible.

Sorting objects back-to-front sounds sufficient and isn't - triangles can intersect each other, and then no ordering of whole objects is correct.
:::

::: cards The z-buffer
A second grid :: Alongside the colour buffer, storing the depth of the nearest surface found so far at each pixel.
The test :: For each candidate pixel, compare its depth against the stored value. Closer, so overwrite both colour and depth. Further, so discard it.
:::

::: remember
Which makes the result independent of draw order.

Draw the far triangle first and the near one overwrites it. Draw the near one first and the far one fails the depth test. Same image either way - and that order-independence is exactly what sorting couldn't give you.
:::

::: checkpoint
A red triangle is nearer than a blue one, and the blue one is rasterized second. What do you see?
- ( ) Blue, since it was drawn last
- (x) Red - blue's pixels fail the depth test and are discarded
- ( ) A blend
- ( ) Undefined
> Red. The depth comparison, not the drawing order, decides - which is the property the z-buffer exists to provide.
:::

::: remember
**Rasterization** determines which pixels a triangle covers and how deep they are. **Shading** determines what colour they should be, given lights, materials and viewing angle.

**Rendering** is both together. Worth keeping distinct, since interviews probe the difference.
:::

::: behind
**Deferred shading** reorders these for efficiency.

Rasterize geometry, depth and material into intermediate buffers first, resolve all visibility, and only then shade the pixels that survived.

Shading is expensive, and in a scene with heavy overdraw most shaded pixels would be overwritten anyway. Doing visibility first means paying for lighting exactly once per visible pixel.
:::`,
  },

  "color-models-the-graphics-pipeline": {
    concept: `## Why Print Never Quite Matches The Screen

::: story
A colour looks vivid on your monitor and duller in print. Not a printer fault - the two media work in opposite directions.

A screen **emits** light. Add red, green and blue at full intensity and you get white. Additive.

Ink **absorbs** light. Add cyan, magenta and yellow and you approach black. Subtractive.
:::

::: cards
RGB :: Additive. For anything that emits light - screens, projectors. All three at full is white.
CMYK :: Subtractive. For anything printed. All three at full approaches black, with K (black ink) added because mixed inks give a muddy brown rather than true black.
:::

::: remember
Some vivid RGB colours simply have no CMYK equivalent - the inks can't reach them. The gamuts overlap and neither contains the other.

So the shift between screen and print isn't a calibration error to fix. It's two physical processes with different reachable colours.
:::

## A Model For Humans

::: cards HSV
Hue :: The base colour, as a position around a colour wheel.
Saturation :: How vivid, versus washed out toward grey.
Value :: How bright, versus dark.
:::

::: story
"A slightly darker, less vivid version of that blue" is one small adjustment in HSV and an unclear three-number puzzle in RGB.

Which is why colour pickers offer HSV controls while storing RGB underneath. Same colour space, parameterised the way people actually think about colour.
:::

::: checkpoint
Why do design tools show HSV sliders but save RGB values?
- ( ) HSV can represent more colours
- (x) HSV matches how people reason about colour; RGB is what displays consume
- ( ) RGB files are smaller
- ( ) They're unrelated colour spaces
> Interface versus storage. Same colours, converted at the boundary - which is a reasonable general pattern for any representation humans and machines both need.
:::

## The Whole Pipeline

::: timeline Everything this subject covered, in order
Geometry :: Objects defined as coordinates.
Transform :: Translate, rotate, scale - composed into one matrix.
Project :: 3D to 2D, orthographic or perspective.
Clip :: Discard what's outside the view, before paying to rasterize it.
Rasterize :: Triangles to pixels, with the z-buffer resolving overlaps.
Shade :: Final colour per pixel, in a chosen colour model.
:::

::: behind
**Gamma correction** is the practical detail that catches people out.

Human brightness perception is non-linear - we distinguish dark tones far more finely than bright ones - so RGB values are stored gamma-encoded to match, rather than as linear light intensity.

Which means lighting maths must happen in *linear* space and be converted back afterward. Blending gamma-encoded values directly is why some renders come out washed out or oddly dark, and it's a common bug precisely because the images still look plausible.
:::`,
  },

  "interview-questions": {
    concept: `## Graphics, Asked About The Maths

::: story
Graphics interviews reward explaining *why* a technique works, because the field is unusually mathematical and the reasoning is checkable.

"Transformations are matrices" is a fact. "Matrices because they compose, so five operations become one per vertex" is understanding.
:::

## The Answer Shape

::: timeline
State the technique :: Precisely, including the mechanism.
Give the underlying reason :: The maths or the performance argument that makes it the right approach.
Place it in the pipeline :: Which stage, and why there.
:::

::: reveal What the pipeline placement adds
Asked about clipping, an adequate answer says it discards off-screen geometry.

A strong one adds the placement:

"And it happens before rasterization deliberately. Rasterization is the expensive stage - working out which pixels a triangle covers and testing depth for each. Clipping first means you never pay that for geometry nobody sees.

Cohen-Sutherland's region codes make the common cases nearly free too: two bit operations resolve wholly-inside and wholly-outside, and only genuinely partial lines need an intersection computed."

Same technique. The second answer explains the ordering, which is what shows you understand the pipeline as a design rather than a list.
:::

::: cards The five to have cold
Raster vs vector :: Fixed samples versus recomputed geometry, and when each is right.
Transformations as matrices :: And that composition is the reason.
Orthographic vs perspective :: Division by depth, and why CAD wants the version without it.
The z-buffer :: Per-pixel depth comparison, and that it makes draw order irrelevant.
RGB vs CMYK :: Additive light versus subtractive ink, and why gamuts don't match.
:::

::: checkpoint
Asked why the z-buffer is better than sorting objects back to front, what's the strongest answer?
- ( ) It's faster
- (x) Sorting fails on intersecting geometry - no whole-object order is correct, while per-pixel depth always is
- ( ) Sorting doesn't work in 3D
- ( ) They're equivalent
> The correctness case, not the speed one. Two triangles passing through each other have no valid ordering, and naming that failure shows you've thought past the obvious answer.
:::

::: mistake
The weak pattern here is describing stages without their ordering rationale.

Every stage in this pipeline is positioned where it is for a reason - usually to avoid paying for work that a later stage would discard. Reciting the sequence without that reasoning reads as memorised, and the reasoning is one sentence per stage.
:::

::: behind
At specialist level, expect **ray tracing** and **shader programming**.

Ray tracing simulates light paths rather than projecting geometry - physically accurate reflections and shadows, at far greater cost, and now partly hardware-accelerated.

Shaders are small programs running per-vertex or per-pixel on the GPU, which is what made the fixed pipeline in this subject programmable.

Both build on these foundations rather than replacing them - and knowing where the fixed pipeline ends is what makes the programmable part comprehensible.
:::`,
  },
};
