# HuzaFlix Backend - PostgreSQL Schema v1.0

This document provides a comprehensive design for the HuzaFlix database schema, derived from a deep analysis of the project's SRS and contract deliverables. It is designed to be scalable, secure, and maintainable, serving as the blueprint for all backend data persistence.

## 1. Schema Overview and Design Principles

This schema is designed with the following core principles, reflecting industry best practices and the specific requirements of the HuzaFlix platform:

*   **Normalization:** The schema is normalized to Third Normal Form (3NF) to reduce data redundancy and improve data integrity, as mentioned in SRS 3.5.1.
*   **Data Types:** Data types have been carefully selected for performance and integrity. `UUID` is used for public-facing primary keys to prevent enumeration attacks, while `SERIAL` is used for internal lookup tables. `TIMESTAMPTZ` is used for all timestamps to ensure timezone consistency. `JSONB` is used for flexible metadata storage.
*   **Naming Conventions:** A consistent `snake_case` naming convention is used for all tables and columns. Join tables are named by combining the two table names (e.g., `role_permissions`).
*   **Foreign Keys & Integrity:** All relationships are enforced with foreign key constraints. `ON DELETE` policies (`CASCADE`, `SET NULL`) are defined to ensure relational integrity and prevent orphaned records.
*   **Indexing:** Critical columns used in `WHERE` clauses (foreign keys, unique identifiers like email) will be indexed to ensure high-performance queries.
*   **Scalability:** The design anticipates future growth. Tables expected to grow large (e.g., `audit_logs`, `api_usage_logs`) are designed with future partitioning strategies in mind (e.g., by date range).

## 2. Core Authentication & Authorization Schema (Sprint 1 Scope)

This is the foundational schema required to complete Sprint 1.

### Table: `users`
Stores user account information, credentials, and their assigned role.

| Column Name | Data Type | Constraints | Description & Research Notes |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | **Research:** A non-sequential UUID is used as the primary key for security. It prevents malicious users from guessing user IDs by incrementing a number (enumeration attack). This is a best practice for any user-facing resource. |
| `email` | `VARCHAR(255)` | `UNIQUE`, `NOT NULL` | The user's primary identifier for login. An index will be created on `LOWER(email)` to ensure case-insensitive uniqueness and fast lookups. |
| `password_hash` | `TEXT` | `NOT NULL` | The securely hashed user password (using bcrypt, as per SRS 6.4.2). The `TEXT` type is used to accommodate any hash length. |
| `role_id` | `INTEGER` | `FOREIGN KEY (roles.id)`, `NOT NULL` | Foreign key linking to the `roles` table. Every user must have a role. |
| `metadata` | `JSONB` | | **Research:** For storing flexible profile information (e.g., first name, last name, company) without requiring schema migrations for minor additions. `JSONB` is chosen over `JSON` for its superior indexing and query performance. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Timestamp when the user account was created. `TIMESTAMPTZ` stores the timestamp in UTC, ensuring no ambiguity across timezones. |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Timestamp of the last user profile update. Will be automatically updated by a trigger. |

### Table: `roles`
A lookup table for user roles, as defined in SRS 3.6.2.

| Column Name | Data Type | Constraints | Description & Research Notes |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | `PRIMARY KEY` | A simple auto-incrementing integer is sufficient as this is an internal lookup table with low cardinality (few rows). |
| `name` | `VARCHAR(50)` | `UNIQUE`, `NOT NULL` | The name of the role (e.g., 'Administrator', 'API Consumer'). The uniqueness constraint ensures data integrity. |

### Table: `permissions`
A lookup table for granular system actions (e.g., 'create_user', 'read_billing').

| Column Name | Data Type | Constraints | Description & Research Notes |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | `PRIMARY KEY` | A simple auto-incrementing integer is sufficient for this internal lookup table. |
| `name` | `VARCHAR(100)` | `UNIQUE`, `NOT NULL` | The name of the permission, formatted as `resource:action` (e.g., 'users:create'). This provides a clear, structured way to manage access control. |

### Table: `role_permissions`
A many-to-many join table linking roles to their assigned permissions.

| Column Name | Data Type | Constraints | Description & Research Notes |
| :--- | :--- | :--- | :--- |
| `role_id` | `INTEGER` | `FOREIGN KEY (roles.id) ON DELETE CASCADE` | The ID of the role. `ON DELETE CASCADE` ensures that if a role is deleted, all its permission links are automatically removed, preventing orphaned rows. |
| `permission_id` | `INTEGER` | `FOREIGN KEY (permissions.id) ON DELETE CASCADE` | The ID of the permission. `ON DELETE CASCADE` provides the same cleanup benefit if a permission is ever removed. |
| **Constraint** | `PK` | `PRIMARY KEY (role_id, permission_id)` | **Research:** A composite primary key is used. This is a critical data integrity constraint that prevents the same permission from being assigned to the same role more than once. |

---

## 3. Future-Facing Schema (For Subsequent Sprints)

This section contains the schema design for features outlined in the SRS that are beyond the scope of Sprint 1. This demonstrates foresight and ensures our initial design is compatible with future needs.

### API Management & Catalog

*   **`api_categories`**: (`id`, `name`, `description`)
*   **`apis`**: (`id`, `name`, `description`, `category_id`, `base_url`, `is_public`, `created_at`)
*   **`api_versions`**: (`id`, `api_id`, `version_tag`, `changelog`, `is_stable`, `is_deprecated`)
*   **`endpoints`**: (`id`, `api_version_id`, `http_method`, `path`, `description`, `required_permission_id`)

### Subscription & Billing

*   **`plans`**: (`id`, `name`, `description`, `price_monthly`, `price_yearly`, `call_limit`, `rate_limit`)
*   **`subscriptions`**: (`id`, `user_id`, `plan_id`, `status` ['active', 'canceled', 'past_due'], `current_period_ends_at`, `created_at`)
*   **`api_keys`**: (`id`, `key_hash`, `prefix`, `user_id`, `subscription_id`, `expires_at`, `is_active`)
*   **`invoices`**: (`id`, `subscription_id`, `user_id`, `amount`, `status` ['paid', 'open', 'void'], `due_date`, `paid_at`)
*   **`transactions`**: (`id`, `invoice_id`, `payment_gateway` ['stripe', 'mtn_momo'], `gateway_transaction_id`, `amount`, `status` ['succeeded', 'failed'])

### Logging & Auditing

*   **`audit_logs`**: (`id`, `user_id`, `action`, `target_resource`, `target_resource_id`, `payload` [JSONB], `created_at`)
*   **`api_usage_logs`**: (`id`, `api_key_id`, `endpoint_id`, `response_time_ms`, `http_status_code`, `ip_address`, `created_at`)