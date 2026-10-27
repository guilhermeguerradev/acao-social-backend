-- Diagnostic only: no application rows or credentials are selected.
-- Run against the intended production database in a trusted SQL client.
BEGIN TRANSACTION READ ONLY;

SELECT current_schema() AS current_schema,
       to_regclass('public."User"') IS NOT NULL AS user_exists,
       to_regclass('public."Medico"') IS NOT NULL AS medico_exists,
       to_regclass('public."Instrutor"') IS NOT NULL AS instrutor_exists,
       to_regclass('public."Demand"') IS NOT NULL AS demand_exists,
       to_regclass('public."_prisma_migrations"') IS NOT NULL AS migration_history_exists;

SELECT column_name, data_type, udt_name, is_nullable, character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'Demand'
ORDER BY ordinal_position;

SELECT t.typname AS enum_name, e.enumlabel AS enum_value
FROM pg_type t
JOIN pg_namespace n ON n.oid = t.typnamespace
JOIN pg_enum e ON e.enumtypid = t.oid
WHERE n.nspname = 'public'
  AND t.typname IN ('DemandStatus', 'DemandCategory', 'DemandReturnPreference')
ORDER BY t.typname, e.enumsortorder;

SELECT indexname FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'Demand'
ORDER BY indexname;

SELECT conname, contype FROM pg_constraint
WHERE conrelid = to_regclass('public."Demand"')
ORDER BY conname;

-- If the migration table is absent, this query fails read-only: stop and inspect
-- the existing schema/history rather than marking migrations applied blindly.
SELECT migration_name, finished_at, rolled_back_at, applied_steps_count
FROM public."_prisma_migrations"
ORDER BY migration_name;

ROLLBACK;
