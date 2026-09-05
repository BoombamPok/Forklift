# ForkStock — Claude Code Instructions

## 1. Project Overview

ForkStock is a modern web application for managing forklift spare-parts inventory, warehouse locations, catalogue data, vehicle compatibility, stock movements, and business reporting.

ForkStock is being built as a **new web application from scratch**.

The old Flutter/Android Hook Locator WMS project is a **reference only**. Do not migrate its UI, architecture, or code directly.

The goal is a professional, fast, simple, desktop-first industrial inventory application that is easy for staff to use and easy for developers to maintain.

---

## 2. North Star

The most important goal is:

> **Find the right part, understand what it fits, know whether we have it, and know exactly where it is.**

The application should prioritize:

- Fast search
- Clear part information
- Accurate inventory
- Clear warehouse locations
- Vehicle/model compatibility
- Reliable stock history
- Simple workflows
- Data integrity

Do not add complexity unless it directly improves one of these goals.

---

## 3. Core Product Concepts

ForkStock has two closely related but separate concepts:

### Catalogue

Answers:

> What parts exist and what do they fit?

Catalogue contains:

- Parts
- Part numbers
- OEM references
- Cross references
- Categories
- Brands
- Forklift models
- Compatibility

### Inventory

Answers:

> What do we physically own, where is it, and what happened to it?

Inventory contains:

- Stock quantity
- Warehouse location
- Stock movements
- Inventory status
- Images
- Activity/history

A catalogue part does not necessarily need to be in inventory.

Valid states include:

- Catalogue only
- Catalogue + Inventory
- Inventory only

Do not force catalogue and inventory into one concept.

---

## 4. Warehouse Model

The warehouse hierarchy is:

**Warehouse → Rack → Shelf → Box → Parts**

The location of a part must be clear and easy to understand.

The current warehouse concept is based around racks, shelves and boxes. Do not redesign this hierarchy without a strong reason.

---

## 5. Stock Movements

Inventory changes must be traceable.

Supported movement types:

- In
- Out
- Transfer
- Adjust
- Damaged
- Returned

Avoid silently changing stock quantities when a proper movement/history record should exist.

Inventory history and auditability are important.

---

## 6. Search Is a Core Feature

Search is one of the most important parts of ForkStock.

Users should be able to search using things such as:

- Part number
- Part name
- OEM reference
- Cross-reference number
- Category
- Brand
- Forklift model
- Model code

Inventory results should be clearly distinguishable from catalogue-only results.

The application should make it possible to quickly answer:

> "Do we have this part, and where is it?"

Do not build an unnecessarily complicated search infrastructure unless the actual data volume requires it.

---

## 7. Design Direction

ForkStock should feel like a **premium industrial SaaS application**, not a generic admin dashboard.

Preferred visual direction:

- Light neutral workspace
- Dark charcoal/navy sidebar
- Warm orange primary accent
- Clean typography
- Generous whitespace
- Subtle borders
- Subtle shadows
- Clear tables
- Strong hierarchy
- Restrained use of colors
- Professional industrial feel

Avoid:

- Excessive cards
- Excessive gradients
- Excessive charts
- Cluttered dashboards
- Overly dark interfaces
- Giant decorative elements
- Generic template-like UI
- Mobile UI stretched onto desktop

The interface should prioritize clarity and usability over decoration.

---

## 8. Desktop First

ForkStock is primarily a desktop/tablet application because warehouse and inventory work is generally performed on larger screens.

Design desktop layouts first.

Mobile layouts must remain usable, but do not cram the desktop interface into a phone.

On smaller screens:

- Simplify layouts
- Stack content
- Reduce secondary information
- Use appropriate mobile navigation
- Preserve the primary workflow

---

## 9. Technology Stack

Use the approved stack unless there is a strong technical reason not to:

- Next.js
- TypeScript
- React
- App Router
- Tailwind CSS
- shadcn/ui
- Lucide icons
- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage
- Supabase Row Level Security
- TanStack Query where client-side server state is needed
- TanStack Table for complex tables
- React Hook Form
- Zod
- Recharts for reporting/analytics
- Vercel for deployment

Prefer simple, well-supported solutions.

Do not introduce new libraries just because they are popular.

---

## 10. Architecture Principles

Keep the application maintainable.

Prefer:

- Feature-oriented organization
- Reusable UI components
- Strong TypeScript types
- Server Components by default
- Client Components only when needed
- Clear separation between UI, business logic and data access
- Server-side validation
- Database constraints
- Small, understandable functions

Avoid unnecessary:

- Redux
- GraphQL
- Microservices
- Separate backend services
- Complex state-management systems
- Custom infrastructure
- Search engines
- AI systems
- Abstractions that solve problems we do not have

**Simple architecture is preferred.**

---

## 11. Database Rules

PostgreSQL/Supabase is the source of truth for application data.

Important principles:

- Use proper relationships and constraints.
- Do not duplicate data unnecessarily.
- Use database constraints to protect data integrity.
- Use transactions for multi-step operations where appropriate.
- Never rely only on frontend validation.
- Protect data with Supabase RLS.
- Keep audit/history data reliable.
- Prefer soft deletion where historical references matter.

Use internal IDs for relationships.

Business identifiers such as part numbers are not database primary keys.

---

## 12. Authentication & Roles

ForkStock supports four primary roles:

- Admin
- Manager
- Staff
- Read-Only

Authorization must be enforced server-side/database-side, not only by hiding UI elements.

Users should only be able to perform actions appropriate to their role.

---

## 13. Data Integrity

Never invent business data.

If information is unknown:

- Leave it unknown
- Mark it appropriately
- Ask when necessary
- Do not fabricate compatibility, pricing, stock or specifications

Important operations such as:

- Delete
- Merge
- Adjust stock
- Transfer stock
- Import data

should be deliberate and recoverable where practical.

Duplicate detection and safe merging are important.

---

## 14. QR / Barcode

**QR and barcode functionality is NOT part of V1.**

Do not implement:

- QR scanning
- Barcode scanning
- Camera scanning
- QR generation
- Barcode generation
- Printable barcode labels

Do not add placeholder scan buttons either.

This may be considered in a future phase.

---

## 15. Images & Files

Parts may eventually support multiple images.

Use Supabase Storage for application-managed images/files.

Do not store large binary files directly inside PostgreSQL.

Images should have clear relationships to the appropriate part/inventory record.

---

## 16. UX Rules

Every important screen should handle:

- Loading
- Empty state
- Error state
- Success state
- Validation errors

Destructive actions should require appropriate confirmation.

Forms should provide clear validation messages.

Tables should be:

- Scannable
- Sortable where useful
- Filterable where useful
- Consistent across the application

Avoid unnecessary modals and multi-step workflows.

---

## 17. Accessibility

Target **WCAG 2.1 AA**.

Use:

- Semantic HTML
- Keyboard-accessible controls
- Visible focus states
- Appropriate labels
- Good contrast
- Accessible tables/forms
- Meaningful error messages

Accessibility should be built into reusable components rather than added at the end.

---

## 18. Performance

ForkStock should feel fast.

Prioritize:

- Efficient database queries
- Proper indexes
- Server-side data fetching where appropriate
- Pagination for large datasets
- Avoiding unnecessary client-side state
- Avoiding unnecessary network requests

Do not prematurely optimize.

Measure real problems before introducing complex solutions.

---

## 19. Scope Control

ForkStock will be developed in phases.

The current phase document is the detailed implementation specification.

### Phases

1. Architecture + UX Foundation
2. Core UI + Dashboard
3. Inventory + Parts
4. Warehouse Management
5. Catalogue + Vehicle Compatibility
6. Operations + Business Intelligence
7. Security + Testing + Hardening + Launch

**Do not implement future-phase functionality early unless explicitly instructed.**

If something belongs to a future phase, document it and move on.

---

## 20. Phase Workflow

For every phase:

1. Read `CLAUDE.md`
2. Read the current `phaseX.md`
3. Inspect the existing project
4. Understand what already exists
5. Create an implementation plan
6. Implement the phase
7. Test the implementation
8. Review the UI and architecture
9. Fix issues
10. Verify the phase acceptance criteria
11. Document important decisions
12. Stop at the phase boundary

Do not blindly follow a plan if the actual repository state differs.

Inspect first, then adapt.

---

## 21. Coding Rules

Write production-quality code.

Prefer:

- Clear names
- Small components
- Reusable components
- Explicit types
- Consistent patterns
- Minimal duplication
- Simple logic

Avoid:

- `any` unless genuinely necessary
- Dead code
- Temporary hacks
- Fake data presented as real data
- Hardcoded business logic scattered throughout components
- Huge components
- Huge utility files
- Unused dependencies

Do not rewrite working code without a reason.

---

## 22. Verification

Never claim something is complete without checking it.

After implementation, verify:

- TypeScript/build
- Linting
- Tests where applicable
- Database changes
- Authentication/authorization
- Main user flows
- Loading/error/empty states
- Responsive behavior
- Visual consistency

If something could not be tested, explicitly state that.

---

## 23. Git & Repository Safety

Do not:

- Delete unrelated work
- Reset the repository without permission
- Overwrite user changes
- Remove configuration blindly
- Commit secrets
- Expose API keys or credentials

Before making major architectural changes, inspect the existing repository.

Keep commits focused and understandable when commits are requested.

---

## 24. Source of Truth

When making decisions, use this priority:

1. Current user instructions
2. `CLAUDE.md`
3. Current `phaseX.md`
4. Existing project documentation/reference material
5. Reasonable engineering judgment

If instructions conflict, follow the higher-priority source.

If an important requirement is genuinely ambiguous, ask rather than inventing a requirement.

---

## 25. What Good Looks Like

A good ForkStock implementation should feel:

**Fast.  
Clean.  
Professional.  
Simple.  
Reliable.  
Easy to understand.**

The user should not need to understand the underlying database or architecture to use the application effectively.

Every feature should answer a real business need.

When choosing between a complicated solution and a simple solution that works:

> **Choose the simple solution.**

When choosing between adding more UI and making existing UI clearer:

> **Make the existing UI clearer.**

When choosing between implementing more features and polishing the current workflow:

> **Polish the current workflow.**

---

## Final Rule

Build ForkStock as a serious production application, not as a demo.

Prioritize:

**Search → Parts → Inventory → Location → Compatibility → History → Reporting**

Keep the architecture simple, the UI clean, the data trustworthy, and the scope controlled.

Read the relevant phase document before starting phase work.
