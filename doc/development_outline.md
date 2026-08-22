# WAW POS - Development Outline

1. **Database Schema Refactor (Drizzle ORM):**
   * Update `src/lib/db/schema.ts` to introduce `store_id` foreign keys across all entities to support multi-tenancy.
   * Add subscription and module permission tracking fields.
2. **API & Webhook Infrastructure:**
   * Build out secure API routes under `src/app/api/v1/` for external e-commerce synchronization.
   * Implement token-based authentication middleware.
3. **UI & POS Terminal Enhancement:**
   * Refine the existing inventory and product tables (`src/components/products/`)[cite: 1].
   * Build out the high-speed sales register screen optimized for fast checkout workflows.
4. **Testing & Deployment:**
   * Validate server actions and API contracts.
   * Configure environment variables for production edge deployment.