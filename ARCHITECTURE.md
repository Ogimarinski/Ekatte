# Architecture

## Project Overview

This project manages settlement data and climate information.

Main responsibilities:

- Import geographical and administrative data
- Store and query settlements
- Import historical climate information
- Expose data through the backend API
- Provide filtering and search capabilities in the frontend

---

# Technology Stack

Backend

- Node.js
- Express
- PostgreSQL

Infrastructure

- Docker
- Docker Compose

Testing

- Jest

---

# Architecture

The application follows a layered architecture.

```
HTTP
    ↓
Routes
    ↓
Controllers
    ↓
Services
    ↓
Repositories
    ↓
PostgreSQL
```

Responsibilities:

## Routes

- Define endpoints.
- Validate route parameters.
- Forward requests to controllers.

Routes should not contain business logic.

---

## Controllers

Controllers are responsible for:

- parsing requests
- validating input
- returning HTTP responses
- calling services

Controllers should stay thin.

---

## Services

Services contain business logic.

Examples:

- climate import
- filtering
- calculations
- validation
- orchestration

Services should not know SQL details.

---

## Repositories

Repositories communicate with PostgreSQL.

Responsibilities:

- SQL queries
- inserts
- updates
- deletes

Repositories should not contain business rules.

---

# Database

The database stores:

- regions
- municipalities
- mayoralties
- settlements
- yearly climate data
- mapping tables

Business logic should remain outside SQL whenever practical.

---

# Import Process

Large imports should be implemented as standalone scripts.

Each script should have a single responsibility.

Examples:

- import settlements
- import climate
- import mappings

Imports should support batching where appropriate.

---

# Performance Principles

Prefer simple and readable code.

Optimize only after identifying a real bottleneck.

When performance matters:

- minimize database round trips
- avoid unnecessary memory allocations
- stream large datasets when appropriate
- batch inserts instead of inserting row by row

---

# Error Handling

Prefer explicit errors.

Validate input early.

Return meaningful error messages.

Avoid silent failures.

---

# Code Style

Prefer:

- descriptive names
- small functions
- single responsibility
- early returns
- minimal nesting

Avoid:

- duplicated logic
- unnecessary abstractions
- premature optimization

---

# Design Principles

When introducing new functionality:

- keep responsibilities separated
- reuse existing layers
- avoid coupling unrelated modules
- preserve backwards compatibility whenever possible

---

# Decision Log

Important architectural decisions should be documented here.

Example:

## Climate Import

Decision:
Store yearly aggregated climate data.

Reason:

- smaller database
- faster queries
- simpler filtering

Alternatives considered:

- daily data
- monthly data

---

## Future Improvements

Possible future work:

- caching
- background jobs
- bulk COPY imports
- parallel processing where appropriate
- monitoring and profiling
