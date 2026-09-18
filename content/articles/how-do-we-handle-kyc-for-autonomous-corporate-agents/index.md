---
title: "How Do We Handle KYC for Autonomous Corporate Agents?"
dek: "Rethinking identity verification in agentic finance"
kicker: "AI Agents"
date: 2026-05-25
image: how-do-we-handle-kyc-for-autonomous-corporate-agents-1.png
image_alt: "How Do We Handle KYC for Autonomous Corporate Agents?"
tags: ["AI Agents"]
description: "Rethinking identity verification in agentic finance"
wix_url: https://www.joshpaulpopkin.com/post/how-do-we-handle-kyc-for-autonomous-corporate-agents
faq: true
---
For decades, financial identity systems have relied on a simple assumption:

> there is a human on the other side of the transaction.

Know Your Customer (KYC) frameworks were built to answer familiar questions:

> Who are you?

> Are you authorized to transact?

> Are you a sanctioned or risky counterparty?

> Who ultimately owns or controls this account?¹

The operating model was straightforward.

A person opens an account. A company verifies beneficial ownership. A regulated institution performs identity checks. Permissions flow from verified legal actors.

Autonomous AI systems complicate this model.

Because increasingly, software may initiate actions traditionally reserved for employees:

- purchasing software licenses

- paying vendors

- managing procurement

- initiating treasury actions

- reconciling payments

- executing financial workflows

This introduces a new infrastructure problem:

> **How do we verify an autonomous system acting on behalf of a company?**

More specifically:

> **How do we handle KYC for autonomous corporate agents?**

The answer is likely not:

> KYC the AI.

The answer is:

> **verify delegated authority.**

## Traditional KYC assumptions begin to break

Modern KYC frameworks assume accountable legal actors.

A regulated institution generally verifies:

- a natural person

- a legal entity

- beneficial ownership

- authorized signatories

- sources of funds

- sanctions exposure¹²

Identity verification mechanisms reflect this assumption.

Passports.

Biometrics.

Government IDs.

Tax identifiers.

Corporate registration documents.

But autonomous agents possess none of these.

An AI procurement system has:

- no legal identity

- no passport

- no beneficial ownership

- no independent accountability

Yet in emerging financial systems, agents may still be authorized to:

> move money

> issue payments

> transact with vendors

> trigger procurement workflows

This creates a conceptual mismatch.

Traditional KYC verifies:

> **who you are**

Agentic finance increasingly requires systems to verify:

> **who authorized you to act**

That distinction matters.

Because autonomous systems are not economic principals.

They are delegated operators.

## The misconception: “KYC the AI”

One of the more common framing errors around agentic commerce is the assumption that AI agents themselves require traditional identity verification.

This framing is likely incorrect.

An autonomous corporate agent is not a legal person.

It cannot independently:

- own assets

- bear liability

- satisfy regulatory obligations

- assume fiduciary responsibility

Instead, autonomous agents function more like software employees operating under delegated authority.

A better mental model looks like:

> **Human identity → corporate verification → delegated permissions → agent execution**³

In practice:

The company is verified.

Responsible humans are verified.

Authority is delegated to software operating inside clearly defined boundaries.

This looks far closer to enterprise authorization systems than consumer identity verification.

A useful comparison is enterprise SaaS.

An employee does not receive unlimited system access simply because employment exists.

Permissions are assigned.

Access is constrained.

Authority is revocable.

Financial systems increasingly appear headed toward a similar model for autonomous software.

## Identity shifts from personhood to authorization

The deeper implication is that identity infrastructure may evolve from proving personhood toward proving authorization.

Historically:

> identity = authentication

Increasingly:

> identity = authenticated delegation

In other words:

The critical question becomes:

> **What is this agent allowed to do, who approved it, and under what constraints?**

A compliant architecture for autonomous financial agents would likely require:

### Verified corporate identity

The underlying company still undergoes standard onboarding:

- KYB (Know Your Business)

- beneficial ownership verification

- sanctions screening

- AML controls¹²

Nothing changes at this layer.

### Verified human authority

Specific individuals remain accountable.

Examples:

- CFO

- controller

- procurement lead

- treasury operator

These humans delegate permissions to software agents.

Accountability remains human.

### Scoped permissions

Agents receive narrowly bounded authority.

Examples:

- merchant restrictions

- spend thresholds

- task limitations

- expiration windows

- geography restrictions

- transaction categories⁴

The system shifts from:

> unrestricted autonomy

to:

> **policy-constrained execution**

### Revocable authority

Permissions must be reversible immediately.

If:

- suspicious behavior occurs

- an employee leaves

- a policy changes

- an agent malfunctions

access should disappear instantly.⁵

This increasingly resembles the principle of **least privilege**, a long-standing cybersecurity model in which systems receive only the minimum access necessary to complete a task.⁶

Agentic finance appears likely to inherit this philosophy.

## The emerging trust architecture for corporate agents

If autonomous corporate agents become common, KYC infrastructure will likely evolve into something closer to **machine trust infrastructure**.

Several patterns are already emerging.

### Delegated credentials

Instead of storing raw payment credentials, agents receive scoped access tokens or temporary permissions tied to approved workflows.⁴

An AI procurement system may receive authorization to:

> renew cloud software subscriptions

without gaining authority to:

> initiate treasury transfers

This distinction becomes operationally important.

### Cryptographic authentication

Agent actions increasingly require verifiable provenance:

> Which agent initiated this request?

> Which company authorized it?

> Which human approved the delegation?

Emerging architectures increasingly rely on cryptographic identity systems, signed credentials, and policy frameworks to prove trusted execution.³⁵

### Auditability and observability

Autonomous execution without traceability is unlikely to survive compliance review.

Every action must remain observable:

- transaction history

- approval trails

- permission logs

- revocation history

- behavioral monitoring⁵

In regulated finance:

> explainability matters

The future compliance question becomes:

> **Why did this agent take this action?**

not:

> Did AI make a decision?

### Zero-trust assumptions

Security frameworks increasingly assume:

> systems fail

This is important.

Agentic finance will likely optimize around **bounded failure**, not perfect intelligence.⁵

The assumption becomes:

> an agent may eventually make mistakes

Therefore:

> permissions, monitoring, escalation paths, and controls matter more than raw autonomy.

## What a compliant autonomous corporate agent might actually look like

Imagine a procurement agent inside a mid-market software company.

Its job:

> renew approved SaaS contracts.

The permission model may look something like:

**Authorized by:** CFO of Acme Inc.

**Purpose:** SaaS procurement only

**Spend threshold:** $500 per transaction

**Allowed merchants:** AWS, Datadog, OpenAI, Notion

**Escalation rule:** Human approval required above threshold

**Expiration:** 30 days

**Auditability:** Full logging enabled

**Revocation:** Immediate

Notice something important:

The system never “KYC’d the AI.”

Instead:

> **it verified authority surrounding the AI**

That distinction feels foundational.

## Why this matters for fintech

Much of the discussion around agentic commerce focuses on intelligence.

How capable are the models?

Can agents negotiate?

Can agents transact?

Those questions matter.

But in financial services, trust infrastructure may matter more.

The hard problem is unlikely to be:

> can software spend money?

The harder problem becomes:

> **how do institutions trust software to spend money safely?**

That is ultimately a KYC, authorization, and identity problem.

And increasingly, fintech infrastructure appears to be moving toward:

> **verified, observable, delegated software execution**

rather than:

> autonomous financial actors.

## A PMM takeaway

The strongest fintech companies in this category are unlikely to position themselves around:

> autonomous finance

or:

> AI agents that transact

The more compelling narrative is:

> **trusted execution within human-defined boundaries**

Because buyers rarely purchase autonomy.

They purchase:

- control

- compliance

- accountability

- reduced operational friction

The companies that win this category will not merely enable AI agents to transact.

They will make institutions comfortable letting them transact.

## Footnotes

1.  Financial Action Task Force (FATF) Digital Identity Guidance

2.  FinCEN Customer Due Diligence Requirements

3.  [National Institute of Standards and Technology (NIST) Digital Identity Guidelines](https://pages.nist.gov/800-63-3/?utm_source=chatgpt.com)

4.  [Stripe: Giving Agents the Ability to Pay](https://stripe.com/blog/giving-agents-the-ability-to-pay?utm_source=chatgpt.com)

5.  [NIST Zero Trust Architecture](https://csrc.nist.gov/pubs/sp/800/207/final?utm_source=chatgpt.com)

6.  [NIST Least Privilege Principle](https://csrc.nist.gov/glossary/term/least_privilege?utm_source=chatgpt.com)

Written by Josh Popkin. Published May 25, 2026.

**Disclaimer:** The views expressed here are my own and are intended for informational purposes only. Nothing on this site constitutes financial, investment, or legal advice. Please do your own research and consult appropriate professionals when making decisions.
