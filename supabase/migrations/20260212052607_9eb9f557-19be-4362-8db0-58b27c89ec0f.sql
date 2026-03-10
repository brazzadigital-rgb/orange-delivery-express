
-- Fix: just remove the duplicate realtime publication (columns/policies already added in previous migration)
-- No-op migration to mark the schema as up-to-date
SELECT 1;
