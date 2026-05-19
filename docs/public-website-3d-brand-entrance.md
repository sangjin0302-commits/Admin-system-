# Public Website 3D Brand Entrance

## 1. Purpose

The 3D entrance is a restrained first-impression device for the public website. It should help visitors feel that the office is modern, careful, and trustworthy before they read detailed service content.

Primary goals:

- Create a memorable brand first impression.
- Use a logo-based symbol or entrance object as the visual anchor.
- Support a trustworthy administrative scrivener and immigration-specialist atmosphere.
- Lead visitors quickly into service information, Q&A, consultation, and case tracking.

The 3D element is not the product. It is a short brand entrance that frames the service with confidence and calm.

## 2. Site Structure

The public website should remain a general trust-oriented homepage with clear navigation:

- Home
- About
- Practice Areas
- Q&A
- Consultation Request
- Case Tracking

The first viewport should make the brand and primary action clear. Visitors must immediately understand where to request a consultation and where to check an existing case.

## 3. 3D Scope

3D should be limited to the first hero section.

Allowed scope:

- A 3D logo, emblem, office entrance, door, seal, or other restrained brand object.
- A subtle movement that suggests arrival, opening, or orientation.
- A static or lightweight fallback for mobile and low-power devices.
- Progressive loading that never blocks core content or primary actions.

Requirements:

- Keep consultation and tracking actions visible.
- Optimize model size, textures, lighting, and animation.
- Use lazy loading or reduced-motion behavior where appropriate.
- Provide accessible text and normal HTML content independent of the 3D scene.
- Verify mobile, desktop, slow network, and reduced-motion states before production.

## 4. Forbidden Patterns

Do not:

- Turn the entire site into a 3D experience.
- Hide or delay the consultation request button.
- Hide or delay the case tracking entry point.
- Use exaggerated animation that weakens legal or administrative trust.
- Use heavy models that slow the first meaningful render.
- Make customer case tracking harder to find or use.
- Make the hero depend on WebGL to communicate the office identity.
- Use visual effects that feel like a game, nightlife venue, or speculative tech demo.

The site should still feel like a professional administrative and immigration service website when 3D is disabled.

## 5. Implementation Roadmap

### Phase 1: Static Visual Mock

- Define the public website information architecture.
- Create a static hero mock with logo, headline, service trust cues, consultation CTA, and tracking CTA.
- Decide the visual metaphor for the entrance object.
- Validate tone before adding motion.

### Phase 2: 3D Hero Prototype

- Build a lightweight prototype for the hero only.
- Test static fallback, reduced motion, and mobile rendering.
- Confirm that CTA visibility and page readability are unchanged.
- Measure loading and interaction cost.

### Phase 3: Logo / Entrance Model

- Replace prototype geometry with the approved logo or entrance object.
- Keep materials restrained and brand-aligned.
- Avoid unnecessary particle effects, complex physics, or large texture assets.
- Confirm that the object reinforces trust rather than spectacle.

### Phase 4: Production Performance QA

- Run desktop and mobile visual QA.
- Run slow-network and low-power checks.
- Verify Core Web Vitals impact.
- Verify no accessibility regression for consultation request or case tracking.
- Verify reduced-motion and non-WebGL fallback.
- Ship only if the 3D entrance improves brand impression without weakening speed, clarity, or trust.
