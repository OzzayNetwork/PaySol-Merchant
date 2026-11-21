# PAYSOL MASCOT — CREATIVE DIRECTION, CHARACTER DESIGN & IMPLEMENTATION BRIEF

## 1. Project Overview

PaySol is building more than a conventional POS and business management platform. We want to create a product experience that feels modern, intuitive, welcoming and memorable.

As part of establishing a stronger brand identity, we have explored introducing a dedicated brand mascot.

The mascot should become a recognisable visual companion throughout the PaySol ecosystem. It should bring personality into the interface, make otherwise ordinary interactions more engaging, and help establish an emotional connection between the product and its users.

The intention is not to make PaySol look like a children's application. PaySol serves business owners, entrepreneurs and professionals, particularly Gen Z and Millennial audiences. The mascot must therefore strike a deliberate balance between playfulness, sophistication and professionalism.

**The guiding idea: A professional business platform with a little more personality.**

## 2. The Core Creative Direction

The most important creative decision we discussed was to develop a mascot that has two complementary visual expressions:

1. A fluffy, three-dimensional (3D) character.
2. A two-dimensional (2D) illustrated version of the same character.

These are not two different mascots. They must be two visual representations of one consistent character.

### A. The 3D Character

The primary character should have a soft, fluffy, appealing physical appearance.

Think of a beautifully modelled, tactile character with:
- Soft, fluffy or plush-like surface qualities.
- Rounded, approachable proportions.
- Expressive facial features.
- A friendly and welcoming personality.
- A polished, contemporary 3D aesthetic.
- A distinctive silhouette that remains recognisable even at smaller sizes.

The character should feel like something people would genuinely enjoy seeing in an application.

It should have enough personality to become a brand asset in its own right, rather than looking like a generic decorative illustration.

The 3D version is particularly suitable for:
- Marketing and brand campaigns.
- Website hero sections.
- Product introductions.
- Promotional materials.
- Feature announcements.
- Welcome experiences.
- Special onboarding moments.
- 3D animations and motion-based interactions.

The overall aesthetic should be premium, polished and charming.

Avoid making it excessively cartoonish, childish, overly complicated or visually noisy.

### B. The 2D Illustrated Character

The second expression is a 2D illustration system based on the same mascot.

This is particularly important because the mascot will need to appear frequently throughout the actual PaySol application.

Rather than using the full 3D character everywhere, we want lightweight, expressive 2D illustrations that can communicate different interface states.

The 2D illustrations should:
- Preserve the character's recognisable identity.
- Maintain consistent facial features and proportions.
- Use a cohesive illustration style.
- Communicate emotions and situations effectively.
- Remain visually appealing at different screen sizes.
- Integrate naturally with the PaySol interface.

The 2D version should not look like a completely different character or an unrelated illustration pack.

It should feel as though the 3D character has been translated into a simplified illustration language.

## 3. The Existing 2D Mascot

An important point from our previous discussion: we had already discussed an existing 2D representation of the mascot.

The development direction should build on that existing character rather than introducing an entirely new one.

The existing 2D character should serve as the visual reference and identity anchor when developing the broader mascot system.

Before generating new character variations, inspect the existing mascot artwork and establish its:
- Facial structure.
- Eye design.
- Body proportions.
- Distinctive characteristics.
- Colour palette.
- Overall personality.
- Illustration style.

Preserve these attributes across every new representation.

Do not independently redesign the character every time a new illustration is required.

## 4. The Mascot's Role Within PaySol

The mascot should have a meaningful role in the product experience.

It should not simply be placed randomly around the interface to make pages look attractive.

Its purpose is to add personality, provide visual communication and make the product feel more human.

One of its most important applications will be contextual illustrations for different interface states.

For example:

| Interface state | Mascot behaviour or expression |
|---|---|
| Empty inventory | Looking into an empty storage box |
| No transactions | Waiting patiently with a small receipt |
| No customers | Looking around for the first customer |
| Successful payment | Celebrating a successful transaction |
| Successful setup | Looking proud or giving a thumbs-up |
| Loading | Engaged in a subtle waiting activity |
| No search results | Looking through a magnifying glass |
| Error state | Looking concerned but reassuring |
| Offline state | Trying to reconnect or holding a disconnected signal |
| Welcome screen | Welcoming the user enthusiastically |
| New feature introduction | Presenting or pointing towards the feature |

These are illustrative examples of the intended direction, not a finalized illustration inventory.

The character should communicate the state of the interface without overwhelming the actual information.

## 5. Personality and Character Behaviour

The mascot should have a recognisable personality.

Suggested personality attributes:

- Friendly: It should make the application feel welcoming.
- Intelligent: It should feel like a capable business companion.
- Playful: It should introduce moments of delight.
- Reassuring: It should make errors and difficult situations feel less intimidating.
- Confident: It should represent a capable business platform.
- Expressive: Its face and body language should communicate emotions clearly.

It should feel like a helpful companion to the business owner, not a salesperson or an intrusive assistant.

The mascot should never make serious business operations feel like a game.

For instance, celebrating a successful payment is appropriate. Making a failed financial transaction look humorous or dismissive is not.

## 6. Design Language and Visual Consistency

Consistency is critical.

We should establish a proper mascot design system before creating dozens of illustrations.

The design system should define:

**Character identity**
- Official character reference.
- Front-facing view.
- Side-facing view.
- Three-quarter view.
- Facial expression library.
- Body proportions.
- Colour specifications.

**3D design system**
- Fur or plush material characteristics.
- Lighting and shadow treatment.
- Surface softness.
- Rendering quality.
- Camera angles.
- Character proportions.

**2D illustration system**
- Line or outline treatment.
- Colour application.
- Shading approach.
- Facial expression rules.
- Character proportions.
- Illustration composition.
- Background and transparency rules.

Every new illustration should look like it belongs to the same family.

## 7. Where the Mascot Should Appear

The mascot should be integrated strategically across PaySol.

### Within the application

Prioritise:
- Empty states.
- First-time user experiences.
- Onboarding.
- Success states.
- Error and recovery states.
- Loading experiences where appropriate.
- Feature discovery.
- Contextual guidance.

### On the PaySol website

Use the 3D character more prominently in:
- Homepage hero sections.
- Product introductions.
- Feature highlights.
- Marketing campaigns.
- Promotional illustrations.

### Marketing and brand communication

The mascot can eventually become a recognisable element in:
- Social media campaigns.
- Product announcements.
- Educational content.
- Promotional graphics.
- Email communication.
- Brand merchandise.

## 8. Technical and Development Considerations

The mascot system should be designed with actual frontend implementation in mind.

We should avoid creating assets that look beautiful in isolation but are difficult to integrate into the application.

Recommended asset organisation:

```text
paysol-mascot/
│
├── character/
│   ├── mascot-3d-reference
│   ├── mascot-front
│   ├── mascot-side
│   └── mascot-expressions
│
├── illustrations/
│   ├── empty-states/
│   ├── success/
│   ├── errors/
│   ├── onboarding/
│   ├── loading/
│   └── guidance/
│
├── 3d-assets/
│   ├── renders/
│   ├── animations/
│   └── exports/
│
└── documentation/
    ├── character-guidelines
    ├── colour-guidelines
    └── usage-guidelines
```

Suggested implementation formats:

- SVG for scalable 2D illustrations where practical.
- PNG or WebP for raster illustrations with transparency.
- WebP for optimised 3D renders.
- GLB/GLTF for interactive 3D experiences where justified.
- Lottie or Rive for lightweight animations where appropriate.

The application should not load unnecessarily large 3D assets just to display a small empty-state illustration.

Use the appropriate representation for the context.

## 9. What We Want to Avoid

There are several directions that would undermine the intended identity:

1. Creating a generic cartoon character with no distinctive identity.
2. Making the mascot look childish or overly toy-like.
3. Having inconsistent character proportions across illustrations.
4. Introducing different facial features in different assets.
5. Using unrelated illustration styles across application pages.
6. Overusing the mascot until it becomes visual clutter.
7. Making the character compete with important business information.
8. Using the 3D character in situations where lightweight 2D illustrations would be more appropriate.
9. Creating illustrations that communicate emotions or situations that do not match the actual interface state.

The mascot should enhance the product, not distract from it.

## 10. Recommended Development Roadmap

I recommend approaching this in stages.

**Phase 1 — Character identity**

Establish the definitive mascot reference using the existing 2D artwork.

Document its visual characteristics and create a consistent character reference sheet.

**Phase 2 — 3D character development**

Translate the established character into a premium fluffy 3D representation.

Maintain the recognisable identity of the original 2D character.

**Phase 3 — Expression library**

Develop a collection of facial expressions and body poses that establish the character's emotional range.

**Phase 4 — Application illustration library**

Create contextual 2D illustrations for the most frequently encountered application states.

Start with empty states, onboarding, success, errors and loading.

**Phase 5 — Motion and animation**

Introduce subtle animations that give the character more life.

Avoid unnecessary movement. Animation should have a purpose and respect accessibility preferences, including reduced-motion settings.

**Phase 6 — Brand integration**

Introduce the mascot into PaySol's website, marketing materials and other brand touchpoints.

---

## 11. Instructions to AI Development Agents

When working on PaySol, understand that the mascot is part of the product's visual identity, not an independent decorative asset.

Follow these principles:

1. Always refer to the established mascot artwork before creating or requesting new character assets.
2. Never invent a new character design when an existing reference is available.
3. Preserve character identity across 2D and 3D representations.
4. Use 2D illustrations for most contextual application states.
5. Reserve 3D assets for experiences where their visual richness adds meaningful value.
6. Use the mascot contextually rather than decorating every page with it.
7. Ensure illustrations are consistent with PaySol's broader interface design system.
8. Do not sacrifice performance for decorative effects.
9. Keep the application professional, modern and business-oriented.
10. Treat every new mascot illustration as part of a unified, evolving character library.

If the required mascot asset does not exist, do not substitute an unrelated cartoon or generate an arbitrary character. Identify the missing asset and request or establish the correct reference first.

## 12. The Overall Vision

We want PaySol to have a personality that people can recognise.

Most business management and POS platforms concentrate entirely on functionality. While functionality remains our priority, we believe the experience can be more engaging without becoming less professional.

The mascot is an opportunity to give PaySol a face, a personality and a consistent visual companion.

The 3D character gives the brand presence and memorability.

The 2D illustrations give the application warmth and personality.

Together, they form one coherent visual identity.

**The ultimate goal is for someone to encounter the character outside the application and immediately associate it with PaySol.**

That is the level of brand recognition we should be working towards.

---

## 13. How this applies to PaySol's projects (Claude's notes, 11 Nov 2026: Proposed until Kelvin confirms)

Sections 1–12 are Kelvin's brief. This section turns it into rules for the repos.

1. **The reference: a peacock shopkeeper (v0, 9 Oct 2026, AI-generated drafts).** Saved in
   `paysol-mascot/reference/` (in the Paysol Project folder): `mascot-hero-v0.png` (greeting,
   tail fanned, PaySol apron) and `mascot-states-sheet-v0.png` (8 states: lost with a map,
   error with a gear, offline with a plug, empty box, setup done with a badge, carrying a
   parcel, magnifier on a document, shield with a lock). **Its story:** a peacock's tail is
   covered in eyes: "eyes on your business while you're away", PaySol's whole promise.

   **Identity to keep (draft):** white body; dark brand-green cap on the head; crest of
   three round green bobbles; grey-green beak; large friendly eye (open, or a closed smiling
   arc); long neck; wing-hands that hold things; **dark-green apron with a pocket** (the brand
   mark on the apron in hero shots); a fan tail of feathers with green eye spots; thin
   single-weight dark-green outline, flat fills, no gradients; white / transparent background.

   **To fix before the v1 reference sheet (Kelvin to confirm):**
   - one apron colour (dark green), changed only on purpose;
   - tail eye spots in greens only (the drafts drift to blue, grey and orange);
   - one tail shape and feather count, plus a simplified tail for small sizes;
   - a **compact version** (head, crest, hint of tail) for avatars, toasts and anything
     under about 64 px;
   - the apron's brand mark: the drafts show a geometric "P", while the current PaySol
     logo is two linked rings with a script wordmark; settle which is the brand;
   - a name (suggestion: **Tausi**, Swahili for peacock).

   The drafts are a **brief for an illustrator**, not production assets: an illustrator
   redraws them as clean vectors (front, side and three-quarter views, an expression sheet,
   colour specs) before Phase 4. Until a state has a v1 asset, screens keep their icon
   empty state. **No agent draws its own version of the peacock.**
2. **Where the mascot never appears.** PaySol sells trust, so money screens stay sober:
   - the **Sell counter while a sale is in progress** (speed, dim bars, no distractions);
   - **money that doesn't match**: variances, shorts, failed or unconfirmed payments, voids,
     walkouts, reconciliation gaps;
   - **security and legal**: lockouts, sign-in refusals, terms, deletions;
   - **data tables and reports**, and the admin console's operational pages.

   A failed payment shows a plain, clear error, never a character.
3. **Where it goes first.**
   - **Business app:** empty states (no products, no sales yet, no customers, no search results),
     the first-run checklist, "setup complete", the **first sale** celebration, offline, page not found.
   - **Admin console:** empty states, the onboarding wizard's Done step, and the image slot that
     `ImageToast` already has (success; a concerned-but-reassuring error only for non-money errors).
   - **Website:** the 3D character in the hero, feature highlights and launches.
4. **One component per front end:** `components/Mascot/MascotIllustration.vue` (props: `state`,
   `size` sm / md / lg, `alt`, `decorative`) that maps a state key to its file, lazy-loads it,
   sets `aria-hidden` when decorative, honours `prefers-reduced-motion`, and falls back to the
   existing icon when a state has no asset yet. It gets a `/test-page` card showing every state.
   Same props in the console, the business app and the website.
5. **Formats and weight:**
   - 2D states as **SVG, at most about 30 KB each** (WebP if raster);
   - 3D only as **WebP renders**, on the website and welcome screens;
   - **no GLB / GLTF inside the apps**;
   - Lottie or Rive only from Phase 5, never on the counter.
6. **One source of truth for assets:** a `paysol-mascot/` folder laid out as in §8 (its own repo,
   or inside `PaySol.website`). Each front end copies what it uses into `src/assets/mascot/`.
   Files are named `mascot-<state>.svg`, with one list of state keys: `empty-inventory`,
   `no-transactions`, `no-customers`, `no-results`, `payment-success`, `setup-done`,
   `first-sale`, `loading`, `error`, `offline`, `welcome`, `new-feature`.
7. **Who sees it.** The field research users are bar owners, managers, cashiers and waiters of
   all ages, working fast and often in dim light. The mascot must never slow a task down or
   push information below the fold.
8. **Colour.** It is built from the brand green `#2FB895`. Crimson `#B82F53` is used sparingly,
   because crimson already means "money doesn't match" in the apps. It is checked on light and
   dark backgrounds.
9. **Who makes it.** Phases 1–3 (reference sheet, 3D model, expression library) need an
   illustrator / 3D artist. AI image tools may be used for exploration only. Nothing ships
   unless it matches the reference sheet.
10. **Not on the critical path.** The business app's V1 is built with icon empty states, and
    Phase 1 runs in parallel. The component in 4 makes the swap a file drop, not a rebuild.
