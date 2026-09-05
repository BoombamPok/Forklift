# ForkStock — Phase 1
# Architecture + UX Foundation

## Status

Phase: 1 of 7
Name: Architecture + UX Foundation
Priority: CRITICAL
Objective: Establish the complete technical, visual, architectural, and data foundation for ForkStock before building major business features.

---

# 1. READ THIS FIRST

You are working on ForkStock.

ForkStock is a new web application for managing a forklift/vehicle spare-parts business.

This is a BUILD-FROM-SCRATCH web application.

The previous ForkStock / Hook Locator project was an offline-first Flutter/Android application. It is NOT the implementation to migrate.

The previous project documentation is reference material for:

- Business rules
- Domain concepts
- Existing workflows
- Data relationships
- Catalogue structure
- Warehouse structure
- Inventory concepts
- Validated catalogue data
- Known constraints

Do NOT blindly reproduce the old Flutter UI.
Do NOT recreate the old architecture.
Do NOT migrate Flutter widgets.
Do NOT port Flutter state management.
Do NOT preserve technical decisions merely because they existed previously.

Instead:

Use the proven business/domain concepts and build a substantially better modern web application.

The product should feel like a premium modern inventory/business platform, not a converted mobile application.

---

# 2. PHASE 1 MISSION

Phase 1 is NOT about building the complete inventory system.

Phase 1 exists to create the foundation that allows Phases 2–7 to be built cleanly.

At the end of Phase 1, the project should have:

1. A clean Next.js application architecture.
2. TypeScript configured correctly.
3. Tailwind CSS configured.
4. shadcn/ui established as the component foundation.
5. A coherent ForkStock design system.
6. Application shell/layout.
7. Sidebar/navigation foundation.
8. Top navigation/header foundation.
9. Responsive layout foundation.
10. Typography system.
11. Spacing system.
12. Color/token system.
13. Form/input/button/table primitives where required.
14. Toast/notification pattern.
15. Modal/dialog pattern.
16. Drawer/sheet pattern where useful.
17. Loading/skeleton patterns.
18. Empty-state patterns.
19. Error-state patterns.
20. Supabase project integration.
21. PostgreSQL schema foundation.
22. Authentication foundation.
23. Role/permission architecture foundation.
24. Row Level Security strategy.
25. Environment-variable structure.
26. Server/client boundary conventions.
27. Data-access conventions.
28. Validation conventions.
29. Error-handling conventions.
30. Routing conventions.
31. Feature-folder architecture.
32. Testing foundation.
33. Linting/formatting/type-checking foundation.
34. Seed/development-data strategy.
35. Documentation of important architectural decisions.

Phase 1 must leave the codebase in a condition where a developer can confidently start Phase 2 without restructuring the project.

---

# 3. PRODUCT NORTH STAR

Every architectural and UX decision should support this:

> A warehouse/business user should be able to understand the system immediately, find what they need quickly, and safely complete inventory tasks with minimal friction.

The application should optimize for:

- Speed
- Clarity
- Reliability
- Data integrity
- Ease of use
- Professional appearance

Not feature count.

---

# 4. CORE DOMAIN MODEL

Before implementing UI, understand and preserve this distinction.

## 4.1 Catalogue

Catalogue answers:

> What exists and what does it fit?

Catalogue concepts include:

- Catalogue parts
- Brands
- Models
- Model families
- Categories
- Compatibility
- Cross-reference numbers
- Sources
- Verification status where applicable

## 4.2 Inventory

Inventory answers:

> What do we physically own, where is it, and what happened to it?

Inventory concepts include:

- Physical parts
- Quantity
- Warehouse location
- Purchase cost
- Selling price
- Stock movements
- Images
- Notes
- Status

These are intentionally separate concepts.

Do not merge catalogue and inventory into one giant `parts` table merely because they both contain part numbers.

A catalogue item may exist without being stocked.

An inventory item may exist without catalogue linkage.

This separation is one of the foundational architectural principles of ForkStock.

---

# 5. REFERENCE DATA

The existing consolidation report provides a validated representative catalogue containing:

- 284 master parts
- 49 forklift models
- 979 atomic compatibility links
- 16 clean categories

Voltas/OM:

- 175 master parts
- 543 model links

Godrej:

- 109 master parts
- 436 model links

The existing catalogue is explicitly a representative sample.

It is expected that the eventual catalogue may contain approximately 1,500–2,000 master parts.

Therefore:

DO NOT:

- Hard-code 284 parts into UI assumptions.
- Hard-code 49 models.
- Design tables specifically around current sample size.
- Assume the catalogue is complete.
- Invent missing catalogue information.

The database and UI must comfortably support thousands of records.

---

# 6. CURRENT V1 SCOPE

Phase 1 must prepare for these future capabilities:

## Dashboard

- Business overview
- Inventory totals
- Inventory value
- Low-stock counts
- Out-of-stock counts
- Recent activity
- Stock movement
- Business insights

## Inventory

- Search
- Filter
- Sort
- Add
- Edit
- View
- Delete/soft-delete where appropriate
- Duplicate detection
- Merge
- Quantity
- Cost
- Selling price
- Location
- Images
- Notes
- Activity/history

## Warehouse

- Warehouse
- Rack
- Shelf
- Box
- Location assignment
- Box contents
- Occupancy

## Catalogue

- Parts
- Brands
- Categories
- Models
- Model families
- Compatibility
- Cross references
- Sources/verification information

## Operations

- Stock In
- Stock Out
- Transfer
- Adjust
- Damaged
- Returned

## Reports

- Inventory valuation
- Stock movement
- Low stock
- Out of stock
- Fast movers
- Slow movers
- Stock aging
- Warehouse occupancy
- Activity

## Administration

- Users
- Roles
- Permissions
- Settings
- Categories
- Brands
- Models
- Warehouse configuration
- Import/export
- Backup/recovery
- Audit

---

# 7. EXPLICITLY OUT OF SCOPE

Do NOT implement the following during Phase 1.

## QR / Barcode

Completely excluded from V1.

Do not implement:

- QR scanning
- Barcode scanning
- Camera scanner
- QR generation
- Barcode generation
- QR labels
- Barcode labels

Do not put scanner buttons into the UI.

The architecture should remain extensible enough to add these later, but there should be no V1 implementation.

## Also do not implement

- AI assistant
- OCR
- Predictive forecasting
- Supplier portal
- Customer portal
- Online ordering
- Accounting integration
- CRM
- Multi-company architecture
- Microservices
- Kubernetes
- GraphQL
- Separate search infrastructure
- Native mobile application

Do not add features simply because they sound impressive.

---

# 8. TECHNOLOGY STACK

Use the following stack unless a concrete technical blocker is discovered.

## Application

- Next.js
- React
- TypeScript
- App Router

## Styling

- Tailwind CSS
- shadcn/ui
- Lucide icons

## Backend/data

- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage
- Supabase Row Level Security

## Client server-state

- TanStack Query

## Tables

- TanStack Table

## Forms

- React Hook Form
- Zod

## Charts

- Recharts

## Deployment

- Vercel

Do not introduce additional major libraries without a clear reason.

---

# 9. ARCHITECTURAL PRINCIPLES

## 9.1 Feature-oriented organization

Prefer organizing code around product features.

For example:

app/
components/
features/
lib/
server/
types/

The exact structure can be refined after inspecting the generated Next.js project, but avoid creating a giant undifferentiated `components/` folder containing every business feature.

## 9.2 Separate responsibilities

Keep these concerns distinct:

- Presentation
- Domain logic
- Validation
- Data access
- Authentication
- Authorization
- Database operations
- Storage operations

A UI component should not contain large SQL/business workflows.

## 9.3 Server/client boundaries

Default to server-side execution where possible.

Only use client components when interactivity requires them.

Do not turn entire pages into client components unnecessarily.

## 9.4 Data access

Database access must be centralized and predictable.

Avoid sprinkling Supabase queries randomly throughout UI components.

Create clear data-access boundaries.

## 9.5 Validation

Use Zod schemas for application-level validation.

Critical validation must also exist server-side.

Never trust client-side validation alone.

---

# 10. PROJECT INITIALIZATION

First inspect the repository.

Before changing anything:

1. List files.
2. Inspect package.json.
3. Inspect existing configuration.
4. Inspect README if present.
5. Inspect existing source directories.
6. Inspect git status.
7. Determine whether the repository is empty, partially initialized, or contains unrelated code.
8. Do not delete existing files until their purpose is understood.

If the repository is empty:

Initialize the project using the agreed stack.

If a Next.js project already exists:

Do not unnecessarily recreate it.

Adapt it cleanly.

---

# 11. GIT SAFETY

Before major modifications:

Check:

git status

Do not destroy uncommitted user work.

Do not:

- Reset the repository.
- Delete unrelated files.
- Rewrite history.
- Force push.
- Remove configuration without understanding it.

Keep commits logically organized where appropriate.

Recommended foundation commits may include:

1. project initialization
2. UI/design system
3. application shell
4. Supabase foundation
5. database foundation
6. testing/tooling foundation

Do not make dozens of meaningless commits.

---

# 12. DESIGN SYSTEM

This is one of the most important deliverables of Phase 1.

ForkStock should have a consistent visual language before feature development begins.

The design direction is:

## Premium industrial SaaS

Think:

- Modern SaaS
- Professional ERP
- Industrial/automotive software
- Clean warehouse tooling

NOT:

- Generic admin dashboard
- Bootstrap template
- Mobile app stretched onto desktop
- Overly dark cyberpunk dashboard
- Excessive glassmorphism
- Excessive gradients
- Excessive cards

---

# 13. COLOR SYSTEM

Primary visual direction:

- Light neutral workspace
- Dark charcoal/navy navigation
- Warm orange ForkStock accent
- Neutral surfaces
- Semantic status colors

Orange is an accent.

Do not make every button, border, icon and card orange.

Create semantic tokens for:

- Background
- Foreground
- Muted foreground
- Card
- Border
- Primary
- Primary foreground
- Secondary
- Accent
- Success
- Warning
- Destructive
- Info

Use CSS variables/design tokens rather than hard-coding colors throughout components.

Dark mode may be supported by the architecture, but do not let dark-mode implementation derail Phase 1.

If implementing dark mode now, ensure both themes use the same semantic token system.

---

# 14. TYPOGRAPHY

Choose a clean modern sans-serif typeface.

Prioritize:

- Legibility
- Numeric clarity
- Dense table readability
- Clear hierarchy

Define typography levels for:

- Page title
- Section title
- Card title
- Body
- Secondary text
- Caption
- Table text
- Numeric KPI
- Form labels

Do not use ten different font sizes randomly.

---

# 15. SPACING

Establish a consistent spacing system.

Avoid arbitrary:

- margin: 13px
- padding: 17px
- gap: 11px

unless there is a specific reason.

Use the spacing scale consistently.

The UI should breathe.

Whitespace is intentional.

---

# 16. BORDER / RADIUS / SHADOW LANGUAGE

Use restrained visual depth.

Preferred:

- Subtle borders
- Moderate radius
- Minimal shadows
- Clear hierarchy

Avoid:

- Huge rounded cards everywhere
- Heavy shadows
- Excessive outlines
- Every section looking like a floating card

Tables and data-heavy screens should feel structured and professional.

---

# 17. ICONOGRAPHY

Use Lucide consistently.

Do not mix:

- Emoji
- Random icon libraries
- SVG icons copied from unrelated products
- Multiple icon styles

Icons should support comprehension, not decorate every piece of text.

---

# 18. APPLICATION SHELL

Create the structural shell of ForkStock.

Expected structure:

--------------------------------------------------
| Sidebar | Header                               |
|         |--------------------------------------|
|         |                                      |
|         | Main content                         |
|         |                                      |
|         |                                      |
--------------------------------------------------

## Sidebar

Should establish:

- ForkStock branding
- Primary navigation
- Section grouping
- Active state
- User/profile area
- Settings access

Possible primary sections:

Dashboard
Inventory
Catalogue
Warehouse
Operations
Reports

Administration may appear separately.

Do not finalize every navigation destination before its phase.

Routes can initially point to foundation placeholders.

---

# 19. HEADER

Create a reusable application header supporting:

- Page title/context
- Global search foundation
- Optional breadcrumbs
- Notifications if needed
- User menu
- Responsive behavior

The global search component should exist architecturally, but the full search engine belongs to a later phase.

Do not build the full search system in Phase 1.

---

# 20. RESPONSIVE FOUNDATION

Desktop is primary.

Define behavior for:

## Large desktop

Full sidebar + wide content.

## Laptop

Sidebar + reduced content width.

## Tablet

Potentially collapsible sidebar.

## Mobile

Sidebar becomes a drawer/navigation sheet.

Do not attempt to solve every mobile screen now.

Create a reliable layout foundation.

---

# 21. ROUTING FOUNDATION

Establish clean route organization.

Likely future structure:

/dashboard

/inventory

/inventory/[id]

/catalogue

/catalogue/parts

/catalogue/models

/catalogue/models/[id]

/warehouse

/warehouse/racks/[id]

/warehouse/boxes/[id]

/operations

/reports

/admin

/auth

Exact routing can evolve, but avoid flat random routes.

Use nested routes where they communicate hierarchy.

---

# 22. CORE UI PRIMITIVES

Establish reusable primitives that later phases can rely on.

At minimum consider:

- Button
- IconButton
- Input
- SearchInput
- Select
- Combobox
- Checkbox
- Switch
- Textarea
- Badge
- Card
- Table
- Dialog
- Drawer/Sheet
- Dropdown
- Tooltip
- Tabs
- Breadcrumb
- Pagination
- Toast
- Alert
- Skeleton
- EmptyState
- ErrorState
- LoadingState
- ConfirmDialog

Do not build every possible component.

Only build components that establish reusable patterns.

---

# 23. DATA TABLE FOUNDATION

Inventory will depend heavily on tables.

Establish a table pattern supporting:

- Column definitions
- Sorting
- Row selection
- Pagination
- Empty state
- Loading state
- Error state
- Responsive behavior
- Action column
- Status badges

Do not implement full inventory functionality yet.

The purpose is to establish the reusable table architecture.

---

# 24. FORMS FOUNDATION

Create conventions for:

- Form layout
- Labels
- Required indicators
- Validation messages
- Help text
- Disabled states
- Loading states
- Submit handling
- Cancel handling
- Unsaved-change behavior if required

Use React Hook Form + Zod.

Forms should feel consistent throughout the application.

---

# 25. LOADING STATES

Every future data-heavy screen must have a predictable loading pattern.

Create reusable skeleton/loading components.

Avoid:

- blank white page
- spinner in the middle of everything
- layout jumping after load

Prefer skeletons that approximate the final layout.

---

# 26. EMPTY STATES

Create a reusable empty-state pattern.

Examples:

No inventory yet.

No parts found.

No warehouse locations.

No stock movements.

No catalogue matches.

Empty states should explain:

1. What is empty.
2. Why it might be empty.
3. What the user can do next.

Do not use meaningless:

"No data."

---

# 27. ERROR STATES

Create a reusable error presentation pattern.

Must distinguish:

- Validation error
- Permission error
- Not found
- Network/server error
- Unexpected application error

Never expose raw database errors to end users.

---

# 28. NOTIFICATIONS

Establish one consistent feedback mechanism.

Use toast notifications for short-lived confirmations such as:

"Part created successfully."

"Stock transfer completed."

For important destructive or consequential actions, use dialogs/confirmation rather than relying solely on toast messages.

---

# 29. CONFIRMATION PATTERNS

Destructive or consequential actions should use confirmation.

Examples:

- Delete
- Merge
- Stock adjustment
- Large stock movement
- Restore
- Bulk import commit

Confirmation should clearly state:

- What will happen
- What data is affected
- Whether it can be undone

Do not make confirmation dialogs unnecessarily verbose.

---

# 30. DATABASE FOUNDATION

Phase 1 must establish the initial PostgreSQL strategy.

Do not attempt to build every final table if the schema requires later domain refinement.

However, define the architectural zones.

## Catalogue zone

Potential entities:

- catalogue_meta
- catalogue_sources
- brands
- catalogue_models
- catalogue_model_families
- catalogue_parts
- categories
- compatibility
- cross_refs

## Inventory zone

Potential entities:

- inventory_parts
- warehouses
- racks
- shelves
- boxes
- stock_movements
- part_images
- users/profile
- audit_logs

Exact table names may be refined before migration creation.

Do not blindly copy old table names.

---

# 31. IMPORTANT DATABASE RELATIONSHIP

The previous architecture intentionally used:

catalogue_part
        ↓
inventory_part

The relationship is optional.

An inventory item may have a nullable catalogue association.

Do not force every inventory item to belong to the catalogue.

This allows:

1. Catalogue-only part
2. Catalogue + inventory part
3. Inventory-only part

All three states must be valid.

---

# 32. WAREHOUSE DATA MODEL

Prepare for:

Warehouse
→ Rack
→ Shelf
→ Box

The known reference warehouse contains:

50 racks
× 4 shelves
× 2 boxes
= 400 boxes

But the application must NOT hard-code this structure.

Warehouse configuration should be data-driven.

Future users should be able to support different warehouse layouts.

---

# 33. STOCK MOVEMENT FOUNDATION

The data model must be capable of recording:

- IN
- OUT
- TRANSFER
- ADJUST
- DAMAGED
- RETURNED

The movement ledger should preserve historical information.

Do not simply mutate quantity and discard the event.

Inventory quantity should be treated as a business-critical value.

---

# 34. AUDIT FOUNDATION

Create an audit strategy.

At minimum establish how we will eventually record:

- Actor
- Action
- Entity type
- Entity ID
- Timestamp
- Previous state where appropriate
- New state where appropriate
- Reason/context where appropriate

Do not over-engineer a generic event-sourcing system.

A straightforward audit-log architecture is preferred.

---

# 35. AUTHENTICATION FOUNDATION

Use Supabase Auth.

Phase 1 should establish:

- Login route
- Auth state handling
- Protected application routes
- Authenticated layout
- Logout
- Session handling
- Unauthorized state
- Basic profile/user structure

Do not build a complex user-management administration UI yet.

That belongs later.

---

# 36. AUTHORIZATION FOUNDATION

Roles:

- Admin
- Manager
- Staff
- Read-Only

Establish a central permission model.

Do not scatter checks such as:

if (user.role === 'admin')

through every component.

Prefer a centralized capability model.

Example conceptual permissions:

inventory.view
inventory.create
inventory.edit
inventory.delete
inventory.adjust
inventory.transfer

catalogue.view
catalogue.manage

warehouse.view
warehouse.manage

reports.view

users.manage

settings.manage

The exact permission list can evolve.

---

# 37. ROW LEVEL SECURITY

Supabase RLS is a security boundary.

Plan policies deliberately.

Do not enable a table and assume the application layer is sufficient.

Do not expose service-role credentials to the browser.

The browser should only have access to data permitted by RLS.

For sensitive operations, prefer server-side execution where appropriate.

Document any intentional policy decisions.

---

# 38. ENVIRONMENT VARIABLES

Establish:

.env.local

and an example environment file if appropriate.

Separate:

- Public browser-safe variables
- Server-only secrets

Never commit:

- service role keys
- database passwords
- private tokens
- secrets

Document required variables.

---

# 39. SUPABASE CLIENT ARCHITECTURE

Establish clear patterns for:

- Browser client
- Server client
- Server-side privileged operations if needed

Do not create random Supabase clients in arbitrary components.

Follow one documented pattern.

---

# 40. STORAGE FOUNDATION

Supabase Storage will eventually hold part images.

Phase 1 should establish the storage strategy without necessarily building the full image management feature.

Define:

- Bucket strategy
- File naming strategy
- Ownership/security approach
- Public/private decision
- Metadata relationship

Do not upload test images into production storage unnecessarily.

---

# 41. DATABASE MIGRATIONS

Use a proper migration workflow.

Do not manually create production schema and forget to capture it.

Every schema change must be reproducible.

Migrations should be:

- Ordered
- Reviewable
- Idempotency considered where appropriate
- Tested

Never modify production schema manually without recording the change.

---

# 42. SEED DATA

Create a safe development seed strategy.

Seed data may include:

- Example brands
- Example categories
- Example models
- Example warehouse
- Example users/roles where safe
- Small sample inventory

Do not pretend fake data is real business data.

Clearly mark development seed data.

The actual validated catalogue should be imported through a controlled data-loading process later.

---

# 43. CATALOGUE DATA RULE

Do not invent missing catalogue information.

The consolidation report contains confidence/verification distinctions.

Where data is uncertain:

- Preserve uncertainty.
- Do not silently promote uncertain records to verified.
- Do not fabricate OEM numbers.
- Do not infer compatibility without source support.

Catalogue quality is more important than catalogue size.

---

# 44. SEARCH ARCHITECTURE

Phase 1 establishes the interface and query architecture only.

Do NOT build the complete search experience yet.

Future search must support:

- Part number
- Part name
- OEM reference
- Cross-reference
- Category
- Brand
- Model
- Model family

Inventory should rank highly.

Catalogue-only results should be clearly distinguished.

The expected catalogue size does not justify introducing Elasticsearch or another search service initially.

Start with PostgreSQL indexes and well-designed queries.

---

# 45. PERFORMANCE FOUNDATION

Define performance expectations now.

Target:

- Fast navigation
- Fast initial rendering
- Fast search once implemented
- No unnecessary client-side rendering
- Efficient database queries
- Pagination for large datasets
- Optimized images
- Minimal dependencies

Do not prematurely optimize.

Do not add complex caching architecture before there is a measured problem.

---

# 46. ACCESSIBILITY

Use WCAG 2.1 AA as the target.

Phase 1 must establish:

- Keyboard focus states
- Semantic buttons
- Proper labels
- Form associations
- Reasonable color contrast
- Accessible dialogs
- Accessible navigation
- Reduced reliance on color alone
- Screen-reader-friendly labels where needed

Accessibility must be built into primitives rather than patched later.

---

# 47. UX RULES

Follow these rules throughout the project.

## Rule 1

Every screen needs a clear primary action.

## Rule 2

Do not make users hunt for important information.

## Rule 3

Do not hide critical information behind unnecessary tabs.

## Rule 4

Do not use modal dialogs for everything.

## Rule 5

Destructive actions require clear confirmation.

## Rule 6

Tables should be scannable.

## Rule 7

Forms should be grouped logically.

## Rule 8

Use progressive disclosure for advanced options.

## Rule 9

Don't overwhelm users with analytics.

## Rule 10

Every loading/empty/error state should feel intentional.

---

# 48. DASHBOARD FOUNDATION

Do NOT fully build the dashboard in Phase 1.

Instead establish:

- Dashboard route
- Layout
- KPI card primitive
- Chart container primitive
- Activity-list primitive
- Attention/alert primitive

The actual dashboard data and business intelligence belongs to Phase 2 and Phase 6.

---

# 49. INVENTORY FOUNDATION

Do NOT build the full inventory module in Phase 1.

Prepare:

- Inventory route
- Table pattern
- Part status badge pattern
- Search field pattern
- Filter pattern
- Part detail route pattern

Actual CRUD and business workflows belong to Phase 3.

---

# 50. CATALOGUE FOUNDATION

Do NOT build the full catalogue in Phase 1.

Prepare:

- Route structure
- Data contracts
- Navigation relationship
- Basic model/part type definitions

Actual catalogue functionality belongs to Phase 5.

---

# 51. WAREHOUSE FOUNDATION

Do NOT build the full warehouse browser in Phase 1.

Establish:

- Data hierarchy
- Route conventions
- Types/interfaces
- UI primitives needed later

Actual warehouse UX belongs to Phase 4.

---

# 52. REPORTING FOUNDATION

Do NOT build full analytics.

Establish:

- Chart container
- Date-range selector pattern if needed
- Metric card pattern
- Table/report pattern

Actual reports belong to Phase 6.

---

# 53. ERROR HANDLING ARCHITECTURE

Create a consistent approach for:

- Expected application errors
- Validation errors
- Authorization errors
- Not found
- Database errors
- Network failures
- Unexpected exceptions

Do not expose:

- SQL
- stack traces
- Supabase internals
- secret information

to users.

Developer logs can contain useful debugging information where appropriate.

---

# 54. LOGGING

Establish sensible logging conventions.

Logs should help answer:

- What happened?
- Where?
- When?
- Why did the operation fail?

Avoid logging:

- Passwords
- Tokens
- Service credentials
- Sensitive personal information

Do not spam the console.

---

# 55. TESTING FOUNDATION

Phase 1 must establish a test strategy.

At minimum:

## Type checking

TypeScript must pass.

## Lint

Lint must pass.

## Build

Production build must work.

## Unit tests

Establish where domain/utility tests live.

## Component tests

Establish conventions for important UI primitives.

## Integration tests

Establish where server/database behavior will eventually be tested.

## End-to-end

Establish a path for future critical workflows.

Do not spend Phase 1 writing hundreds of tests for features that don't exist.

Create the foundation and test the foundation.

---

# 56. CODE QUALITY

Use strict TypeScript.

Avoid:

- `any` unless genuinely unavoidable
- duplicated types
- duplicated components
- magic strings
- magic numbers
- giant components
- deeply nested conditional JSX
- random utility functions
- unnecessary abstractions

Prefer:

- Small cohesive components
- Explicit types
- Reusable primitives
- Clear names
- Predictable data flow

---

# 57. COMPONENT QUALITY

Every reusable component should have:

- Clear responsibility
- Clear props
- Sensible defaults
- Accessible behavior
- Loading/disabled behavior where applicable
- Consistent styling

Do not prematurely create a component for every `<div>`.

---

# 58. DOCUMENTATION

Create/update:

README.md

and document:

- Project purpose
- Stack
- Local setup
- Environment variables
- Development commands
- Database workflow
- Migration workflow
- Testing
- Deployment
- Architecture overview

Also document important architectural decisions.

An ADR directory may be used if useful.

Example:

docs/
  architecture/
  decisions/

Do not create documentation nobody can maintain.

---

# 59. DEFINITION OF PHASE 1 COMPLETE

Phase 1 is complete only when all of the following are true.

## Project

- Next.js runs.
- TypeScript runs.
- Lint runs.
- Production build succeeds.
- Git state is clean/understood.

## UI

- ForkStock visual language exists.
- Typography is defined.
- Color tokens exist.
- Spacing is consistent.
- Buttons are consistent.
- Inputs are consistent.
- Tables have a reusable foundation.
- Dialogs work.
- Toasts work.
- Loading states exist.
- Empty states exist.
- Error states exist.

## Application shell

- Sidebar exists.
- Header exists.
- Navigation exists.
- Active navigation state works.
- Responsive behavior works.
- Main content layout works.

## Auth

- Login route exists.
- Authentication works.
- Protected routes work.
- Logout works.
- Unauthorized behavior works.

## Database

- Supabase integration works.
- PostgreSQL migration workflow exists.
- Initial schema foundation exists.
- RLS strategy exists.
- Development seed strategy exists.

## Architecture

- Feature structure is established.
- Server/client boundaries are understood.
- Data access patterns are documented.
- Validation pattern is established.
- Error handling pattern is established.
- Permission strategy is established.

## Quality

- Typecheck passes.
- Lint passes.
- Build passes.
- Foundation tests pass.
- No obvious console errors.
- No security secrets are committed.
- No unnecessary dependencies have been introduced.

---

# 60. REQUIRED PHASE 1 DELIVERABLES

At the end of the phase, provide:

## 1. Architecture summary

Explain:

- Folder structure
- Data flow
- Server/client boundaries
- Auth
- Database
- Storage
- Validation
- Permissions

## 2. Design system summary

Explain:

- Colors
- Typography
- Spacing
- Components
- Responsive strategy

## 3. Database summary

List:

- Tables created
- Relationships
- Indexes
- RLS policies
- Important constraints

## 4. Routes

List:

- Existing routes
- Protected routes
- Public routes
- Placeholder routes

## 5. Dependencies

Explain every significant dependency added.

## 6. Testing

Report:

- Typecheck
- Lint
- Build
- Tests

Do not claim success without actually running the commands.

## 7. Known decisions

Document important decisions made during Phase 1.

## 8. Deferred work

Explicitly list what was intentionally left for later phases.

---

# 61. PHASE 1 EXECUTION ORDER

Follow this approximate order.

## STEP 1 — Repository inspection

Inspect everything relevant before changing anything.

## STEP 2 — Project initialization

Set up Next.js/TypeScript if necessary.

## STEP 3 — Tooling

Set up:

- TypeScript
- ESLint
- Formatting conventions
- Testing foundation

## STEP 4 — UI foundation

Set up:

- Tailwind
- shadcn/ui
- Lucide
- Theme tokens

## STEP 5 — Design system

Implement:

- Colors
- Typography
- Spacing
- Radius
- Shadows
- Status colors

## STEP 6 — Application shell

Implement:

- Sidebar
- Header
- Main layout
- Navigation
- Responsive behavior

## STEP 7 — Reusable primitives

Implement the necessary foundation components.

## STEP 8 — Supabase

Establish:

- Clients
- Environment variables
- Auth integration
- Database connection

## STEP 9 — Database foundation

Create migrations and initial schema.

## STEP 10 — Security

Establish:

- RLS
- Auth boundaries
- Permission architecture

## STEP 11 — Seed/development data

Create controlled development data.

## STEP 12 — Error/loading/empty patterns

Make them reusable.

## STEP 13 — Testing

Verify foundation.

## STEP 14 — Review

Review the entire implementation against this document.

## STEP 15 — Final validation

Run:

- lint
- typecheck
- tests
- build

Fix all legitimate issues.

---

# 62. IMPORTANT: DO NOT OVERBUILD PHASE 1

Phase 1 is foundational.

Do not turn it into Phase 2–7.

If you find yourself building:

- Complete inventory CRUD
- Complete warehouse management
- Full catalogue browser
- Full reports
- Full stock movement workflows
- Advanced analytics

STOP.

Those belong to later phases.

Build the foundation that makes those features easy.

---

# 63. IMPORTANT: DO NOT UNDERBUILD PHASE 1

At the same time, do not treat Phase 1 as:

"Install Next.js and Tailwind."

That is not sufficient.

The purpose of Phase 1 is to eliminate architectural uncertainty before feature development.

The following must be thoughtfully resolved:

- Application structure
- Data boundaries
- Catalogue vs inventory
- Auth
- Permissions
- Database strategy
- RLS
- UI system
- Component conventions
- Error handling
- Validation
- Testing
- Responsive behavior

---

# 64. DESIGN QUALITY BAR

Before declaring Phase 1 complete, visually inspect the application.

Ask:

### Does it look like a real product?

Not a template?

### Does the sidebar feel intentional?

### Is the typography professional?

### Is there enough whitespace?

### Are controls aligned?

### Do tables look good?

### Are buttons consistent?

### Are hover/focus states polished?

### Does the interface feel fast?

### Does the application look good at 1440px?

### Does it still behave properly around 1024px?

### Does mobile collapse intelligently?

### Are empty/loading/error states polished?

Do not accept "technically works" as the visual quality bar.

---

# 65. UX QUALITY BAR

Ask:

> If a warehouse employee opened ForkStock for the first time, would they immediately understand where to go?

If no:

Improve the navigation.

Ask:

> Can the user understand what each screen is for?

If no:

Improve hierarchy and page headings.

Ask:

> Are important actions obvious?

If no:

Improve action placement.

---

# 66. SECURITY QUALITY BAR

Before completion verify:

- No secrets committed.
- Service-role credentials never reach client.
- Protected routes require authentication.
- RLS policies exist.
- Authorization isn't solely UI-based.
- Input validation exists.
- Error messages don't leak internals.
- Storage access strategy is defined.

---

# 67. PERFORMANCE QUALITY BAR

Verify:

- No unnecessary client components.
- No obvious N+1 queries.
- No huge dependencies without reason.
- No unoptimized large images.
- No unnecessary API requests.
- No repeated expensive calculations on every render.

Do not invent benchmarks.

Measure actual performance where possible.

---

# 68. FUTURE-PROOFING

Design for future capabilities without implementing them now.

Examples:

QR/barcode may eventually be added.

AI may eventually be added.

Supplier management may eventually be added.

Customer management may eventually be added.

However:

DO NOT create empty abstractions for hypothetical features.

The architecture should be extensible because it is clean—not because it contains hundreds of unused interfaces.

---

# 69. WHEN YOU ENCOUNTER AMBIGUITY

Use this decision rule.

If ambiguity affects:

- Database architecture
- Security
- Permissions
- Data integrity
- Major routing
- Major UX pattern
- Future compatibility

STOP and ask for clarification.

If ambiguity only affects:

- Naming
- Small UI spacing
- Internal implementation detail
- Non-critical component organization

Use the simplest consistent solution.

Document significant decisions.

---

# 70. WHEN YOU FIND A BETTER APPROACH

Do not blindly follow this document if a concrete technical problem appears.

Instead:

1. Explain the issue.
2. Explain the proposed alternative.
3. Explain why it is better.
4. Check whether it affects later phases.
5. Implement only after the architectural impact is understood.

Do not introduce complexity just because it is technically interesting.

---

# 71. FINAL PRINCIPLE

ForkStock should become a product the business actually wants to use.

The objective is not:

"Build every feature."

The objective is:

> Build the fastest, clearest and most trustworthy way for this business to manage its spare-parts inventory.

Every line of code should move toward that goal.

---

# PHASE 1 START COMMAND

Begin by inspecting the repository and current project state.

Do not immediately start writing application code.

First determine:

1. What already exists.
2. What can be reused.
3. What must be created.
4. What must be removed or ignored.
5. What architectural decisions need to be made.

Then create a concise implementation plan for Phase 1 based on the actual repository state.

Do not begin Phase 2 work.

Do not implement QR/barcode.

Do not invent business data.

Do not claim a task is complete until it has been implemented and verified.

Start with repository inspection.
