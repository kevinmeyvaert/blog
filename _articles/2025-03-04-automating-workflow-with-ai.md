---
layout: article
title: "Automating My Workflow with AI: A Web Engineer's Journey"
date: 2025-03-04
categories: [web-development, ai]
tags: [cursor, ai, automation, mcp, azure-devops]
excerpt: "This article explores how I use AI-powered tools like Cursor and Model Context Protocol (MCP) to automate my web development workflow, enhance efficiency, and stay ahead in the rapidly evolving AI-driven coding landscape."
---

I'm lazy. Not in a bad way, but in the "how can I get more done with less effort?" way. As a web engineer, I look for ways to improve my workflows. I want to spend less time on repetitive tasks and more time on creative problem-solving. AI has become my tool of choice. It helps me build software faster and smarter. Cursor is an AI-powered coding assistant that has changed how I develop software.

## Using Cursor to Build Software

Cursor helps me accelerate my workflow. It writes boilerplate code, debugs issues, and generates complex logic. The integration with my IDE is smooth. I can generate functions and components quickly. I get instant code suggestions and improvements. I debug and troubleshoot problems faster. I automate repetitive coding tasks.

With this help, I focus more on high-level architecture and problem-solving. I don't get stuck on syntax and routine coding patterns. Getting started is easy. Install it, integrate it into your workflow, and watch it handle the tedious parts. But anyone can use Cursor. I've found ways to use it better. I'll share how I get the most out of it.

## Be Smart About Prompting

Crafting good prompts is critical when working with AI tools. The quality of the output depends on the quality of the input. Context matters. Clear, well-structured instructions help AI models generate meaningful responses.

Here are some principles to keep in mind. Be specific. Vague prompts lead to generic responses. Define what you need in detail. Provide context. The more information you give, the better the AI understands your request. Iterate and refine. If the first response isn't right, tweak your prompt and try again. Use examples. They help guide AI-generated content. Break down complex queries. Smaller steps improve accuracy.

Mastering prompt engineering unlocks AI's full potential. It makes AI a powerful assistant rather than just a tool. But prompting comes with challenges.

## Treat Your Agent Like an Intern

One challenge is making sure AI-generated code follows your team's coding standards. Your AI assistant is like an intern or junior engineer. It needs guidance to produce high-quality work. AI can generate impressive results, but it doesn't know your team's best practices. I use Cursor Rules to align the AI's output with our coding standards.

Cursor Rules act as safeguards. They enforce best practices and prevent inconsistent code. The rules cover formatting standards. They check for consistent indentation, naming conventions, and style guidelines. They enforce code quality. They avoid anti-patterns, enforce modularity, and require proper documentation. They address performance. They encourage efficient algorithms and minimize unnecessary computations. They handle security. They require safe data handling, authentication flows, and API interactions.

![Cursor screenshot](/assets/images/articles/cursor-rules-example.webp)
*image: an example of some of the cursor rules I have in place for the project I'm currently working on.*

These are the classic boy scout rules. Always leave the code better than you found it. Just like when we mentor interns and junior engineers, we need to train our AI assistant.

## Getting Structured Output in Large-Scale Projects

Another hurdle is consistency of output. Large language models are stochastic. If you ask an AI to generate the same code multiple times, you'll get different implementations. This leads to fragmented code, redundant logic, and a lack of cohesion. In small scripts, this might not matter. In larger projects with multiple developers, it's a problem. You need more than good prompts.

I use Nx Generators to address this. Nx Generators automate the creation of components, modules, and configurations from predefined templates. They establish scaffolding structures that guide my Cursor agent. Nx Generators provide a consistent framework for AI-generated code.

Combined with Cursor rules, I can instruct the agent to use specific generators for certain actions. This reduces inconsistencies. Every component, service, or feature is generated with the same patterns. Collaboration becomes easier. Large projects remain maintainable because AI follows an organized framework.

![Cursor screenshot](/assets/images/articles/nx-generator-example.webp)
*image: here i'm asking to move a component to the "shared components", which triggers a Cursor rule that defines that the agent has to use our shared-component Nx Generator. Which makes sure it is scaffolded and exported from the correct location.*

Generators are just a small part of what Nx offers. Nx is powerful for managing large-scale projects. It enforces modularity, optimizes builds, and streamlines workflows across teams. Using Nx, I make sure AI-generated code fits into the project and improves the architecture.

## Introduction to Model Context Protocol (MCP)

MCP is an open protocol developed by Anthropic. It helps AI understand and interact with the tools engineers use every day. It acts as a bridge between a large language model and external services. Think codebases, issue trackers, and deployment pipelines. Anthropic describes it like this: "Think of MCP like a USB-C port for AI applications. Just as USB-C provides a standardized way to connect your devices to various peripherals and accessories, MCP provides a standardized way to connect AI models to different data sources and tools."

MCP provides structured context to AI models. This improves response accuracy. It allows interactions with external systems. This reduces manual overhead. It enables automation through AI-driven commands in development workflows.

Engineers can create more intelligent integrations between AI tools and their software development lifecycle.

## Building a Custom MCP Server for Azure DevOps

AI-assisted coding had already improved my development speed. Recently I took automation one step further. I built a custom MCP server to interface with Azure DevOps directly from Cursor chat.

This integration lets me interact with Azure DevOps without leaving my development environment. I can retrieve work items, tasks, and issues from Azure DevOps using AI-generated queries. I can access acceptance criteria directly. This allows me to create precise prompts and generate test cases based on project requirements. If I come across new tasks while coding, I can ask my agent to create a new work item. This way I can pick it up later without losing context. AI agents get a better understanding of the current codebase by referencing work items and related repositories.

![Image description](/assets/images/articles/azure-devops-mcp.webp)
*image: here you see our agent using the Azure Devops MCP to access the context of a work item, which it then analyzes and tells us what the most important test case is for that feature.*

By integrating Azure DevOps with Cursor, I've reduced context-switching and manual interactions. My workflow is far more efficient.

## The Future of AI-Driven Development

AI-powered coding assistants like Cursor are reshaping how engineers build software. With AI-driven automation, we can reduce friction in our workflows. We minimize repetitive tasks. We focus more on creativity and problem-solving. My custom MCP for Azure DevOps is just the beginning. I'm constantly exploring new ways to integrate AI into my development process.

But what's exciting today might feel outdated in just a few months or weeks. The pace of AI development is relentless. New breakthroughs, tools, and best practices emerge constantly. I can already imagine reading this post again after summer. I'll realize how much further my workflow has evolved.

If you're a developer looking to optimize your workflow, I recommend adopting AI tools now. The possibilities are vast, and the time savings are real. Coding without these tools feels like doing manual labor on a field. Slow, tedious, and exhausting. Now, we have tractors that let us work more productively. The industry is moving forward at a rapid pace. Those who don't adopt AI-powered development will struggle to keep up.

The choice is clear. Adapt and accelerate, or risk being left behind.

Are you using AI in your development workflow? I'd love to hear about your experiences!
