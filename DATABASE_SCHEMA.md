
## Overview / Notes

- The codebase uses TypeORM with migrations. The current migrations create two primary tables used in the app: `roles` and `users`.
- Primary keys for these tables are integer `SERIAL` values (auto-incrementing), not UUIDs.
- Timestamps use `TIMESTAMP WITH TIME ZONE` (`timestamptz`) with `DEFAULT now()`.
- `metadata` on `users` is stored as `jsonb`.

---

## Table: roles
Lookup table for user roles.

Columns:

- `id` — SERIAL, PRIMARY KEY
- `name` — character varying, NOT NULL, UNIQUE
- `description` — character varying, nullable
- `created_at` — TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
- `updated_at` — TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()

Notes:

- Created by migration `1761072997742-roles.ts` (initial `roles` table) and migration `1761076000000-add-roles-timestamps.ts` (adds `created_at` and `updated_at`).
- Unique constraint on `name` prevents duplicate role names.

---

## Table: users
Stores user accounts, credentials, and their assigned role.

Columns:

- `id` — SERIAL, PRIMARY KEY
- `email` — character varying, NOT NULL, UNIQUE
- `password_hash` — text, NOT NULL
- `metadata` — jsonb, nullable
- `created_at` — TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
- `updated_at` — TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
- `role_id` — integer, NOT NULL, foreign key references `roles(id)`

Constraints and indexes:

- Unique constraint on `email` (migration constraint name: `UQ_97672ac88f789774dd47f7c8be3`).
- Foreign key constraint from `users.role_id` to `roles.id` was added in `1761074554963-users.ts`. The migration creates a FK with default `ON DELETE NO ACTION ON UPDATE NO ACTION` behavior.

Notes:

- The TypeORM `User` entity maps `role` as a `ManyToOne` relationship to `Role` and eager-loads the relation (`{ eager: true }`).
- `password_hash` is stored as `text` to accommodate hashed password lengths (bcrypt, argon2, etc.).
- `metadata` is stored as `jsonb` to hold flexible profile or preference data.

---

## Differences from the original design notes

- The repository uses integer `SERIAL` primary keys for `users` and `roles`, not UUIDs for `users` as earlier design notes suggested.
- `users.role_id` is required (`NOT NULL`) and the FK uses default `NO ACTION` for deletes/updates (not `CASCADE` or `SET NULL`).

---

## Future/optional tables (kept for planning)

The repository currently does not implement the following tables (listed for planning and future sprints): `permissions`, `role_permissions`, `api_categories`, `apis`, `api_versions`, `endpoints`, `plans`, `subscriptions`, `api_keys`, `invoices`, `transactions`, `audit_logs`, `api_usage_logs`. If you add these later, consider types and constraints consistent with the existing naming and timestamp conventions.

```

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