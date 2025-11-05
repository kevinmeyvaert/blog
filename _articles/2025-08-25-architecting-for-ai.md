---
layout: article
title: "Architecting for AI: How NX, module boundaries, and code generators transformed my development workflow"
date: 2025-08-25
categories: [architecture, ai]
tags: [ai, nx, architecture, angular, monorepo, developer-productivity]
excerpt: "How I used NX, module boundaries, and code generators to make my AI assistants produce production-ready, architecture-compliant code."
---

When ChatGPT appeared, every dev team rushed to integrate it into their workflows. I did too. But I quickly discovered a problem. AI assistants generate code that violates architectural rules. They introduce coupling. They break dependency boundaries. They don't understand your architecture unless you teach them.

This is the story of how I prepared my enterprise Angular app for the AI age. I didn't write better prompts. I enforced better architecture.

## The problem: AI assistants don't know your architecture

Here's a scenario you've probably lived through. You ask your AI assistant to "add a new feature to the stories module." It generates code enthusiastically. But the code imports from unrelated modules. It creates files in the wrong directories. It uses outdated Angular patterns from its training data. It violates your team's linting rules and breaks your dependency graph.

That was my daily reality until I realized something. AI assistants need guardrails, not guidelines.

## NX: The monorepo that thinks like an architect

[NX](https://nx.dev) is more than a monorepo tool. It's a framework for architectural discipline. When I migrated my social-style application to NX, I wasn't just cleaning up the repo. I was creating a structure both humans and AIs could navigate without ambiguity.

My app had features for posts, stories, notifications, and more. Think of it like an internal Instagram engineering system. Every domain needed a clear home. Every dependency needed to be intentional.

NX gave me three things I couldn't get anywhere else. First, explicit project boundaries. When I ask the AI to "add a feature to the stories domain," it knows exactly where the files belong. Second, a dependency graph that works like an executable contract. My AI and my fellow developers can query this graph to understand what depends on what. Third, a predictable project structure. Every feature library follows the same layout.

Here's what that looks like:

```bash
libs/posts/feat-scheduler/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   ├── services/
│   │   └── guards/
│   └── index.ts
├── jest.config.ts
└── project.json
```

This predictability eliminates guesswork for humans and machines.

## Module boundaries: Your architectural immune system

The key to AI-safe architecture isn't documentation. It's enforcement. I use ESLint's `@nx/enforce-module-boundaries` rule. This rule relies on a two-dimensional tagging system that defines both the domain and type of each library.

Each library belongs to a domain that represents a business area. In a large social app, you might have `domain:users` for authentication, profiles, and relationships. You'd have `domain:posts` for content creation and feed features. You'd have `domain:stories` for ephemeral stories and highlights, `domain:notifications` for alerts and engagement, `domain:ads` for monetization, and `domain:shared` for utilities that cross domain boundaries.

Domains depend on each other intentionally, not by accident. Posts can depend on `users` and `notifications` for author and engagement data. But posts cannot depend on `ads` or `stories`. Here's how I configure that:

```json
{
  "sourceTag": "domain:posts",
  "onlyDependOnLibsWithTags": [
    "domain:posts",
    "domain:shared",
    "domain:users",
    "domain:notifications"
  ]
}
```

Each library also declares its architectural role through type tags. A `type:feature` library contains smart, routed components. A `type:ui` library contains dumb, reusable components. A `type:data-access` library handles state management and data orchestration. A `type:api-service` library wraps API clients and adapters. A `type:model` library holds TypeScript types and interfaces. A `type:util` library contains framework-agnostic utilities.

Here's an example rule for UI components:

```json
{
  "sourceTag": "type:ui",
  "onlyDependOnLibsWithTags": [
    "type:ui",
    "type:model",
    "type:util",
    "type:data-access"
  ]
}
```

UI code can't call APIs directly. It must go through the data-access layer. No documentation needed. No human enforcement required.

Libraries must satisfy both domain and type constraints. A library tagged `["domain:stories", "type:feature"]` must respect both sets of boundaries. It can import `domain:shared, type:ui`. It cannot import `domain:ads, type:ui`. It cannot import `domain:shared, type:api-service` from a UI component. The boundaries are enforced automatically. AI has no room to color outside the lines.

## What happens when AI hits a boundary

When AI-generated code violates a rule, it doesn't fail silently. It hits a lint wall:

```bash
$ npx nx lint posts-feat-scheduler

ERROR: 15:1  @nx/enforce-module-boundaries
A project tagged with "domain:posts" can only depend on libs tagged with
"domain:posts", "domain:shared", "domain:users"
```

The feedback is immediate and clear. The AI adapts. Next time, it generates correct imports. Your architecture becomes the AI's training data.

## Custom generators: Teaching AI to fish

Boundaries defend your architecture. Generators let you go on offense. I built custom NX generators that wrap my architectural patterns into reusable commands.

I can create a new feature module with `npx nx g @app/generators:library feat-highlights --directory=stories`. I can create a shared UI component with `npx nx g @app/generators:shared-component carousel`. I can create a lazy-loaded module with `npx nx g @app/generators:module profile-settings`.

Every generator creates files in the right places. It applies architectural tags. It sets up linting, tests, and i18n. It uses modern Angular syntax like signals, standalone components, and the inject() function. The AI doesn't need to generate boilerplate. It just calls the right generator.

## CLAUDE.md: Context for AI, not rules for humans

Many teams maintain massive documentation files describing coding conventions. I deleted mine. I replaced it with a `CLAUDE.md` file that focuses on context, not rules:

```markdown
# CLAUDE.md - Project Context

## Overview
- Social platform for sharing content (posts, stories, messages)
- Key domains: users, posts, stories, notifications

## Domain Terms
- "Reel" = short-form video (domain:stories)
- "Boost" = paid post promotion (domain:ads)
- "Insights" = analytics dashboard for creators

## Test Accounts
- qaInfluencerUser: creator account
- qaModeratorUser: admin privileges
```

Everything that can be enforced through tooling gets enforced. Linting, code structure, import rules, and formatting are not written down. They're baked into the tools.

## Enforcement over documentation

If a rule can be enforced, don't document it. This creates immediate feedback for AI and humans. Your tooling configuration becomes your single source of truth. When you update ESLint rules, you update AI behavior. There's zero drift between documentation and implementation.

## Real results

Since I adopted this approach, module boundary violations dropped to near zero. AI assistants generate code that passes lint on the first try. New developers onboard in days, not weeks. Code reviews focus on business logic, not structure. My AI assistants now self-lint before suggesting commits.

## What I wish I'd known earlier

Start with boundaries, not features. Architectural constraints teach AI faster than documentation. Treat generators as infrastructure. They're as critical as CI/CD pipelines. Use tags, types, and tooling to make wrong code impossible. Lint early and often. If it doesn't lint, it doesn't ship. Treat your architectural context like code and version-control it.

## When architecture meets AI

Once your architecture enforces itself, AI becomes a productive collaborator instead of a liability. Onboarding happens in minutes, whether the new team member is human or AI. Every library follows the same structure. Refactors become safe. Consistency scales with your team size.

When AI and architecture align, velocity and stability increase together. That's rare in software engineering.

## The takeaway

The teams that thrive in the AI era won't be the ones with the best prompts. They'll be the ones with the best architectures. Make your architecture enforceable. Make your AI architecturally aware. Let your development team and your AI move faster, safely.
