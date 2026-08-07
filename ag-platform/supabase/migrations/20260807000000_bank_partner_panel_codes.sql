-- Extend the bank_partner enum to cover the firm's actual panel.
--
-- `cases.bank_name` is typed `bank_partner`, so the database — not just the
-- API schema — decides which lenders a case may name. Neither existing
-- definition of the type matches the published panel:
--
--   20260514000000_core_schema.sql  ('ICICI','Kotak','Axis','Muthoot','HDFC')
--   20260514000000_init_schema.sql  ('ICICI','KOTAK','AXIS','KARUR_VYSYA',
--                                    'MUTHOOT','CHOLAMANDALAM')
--
-- Two migrations carry the same timestamp prefix and define the same type
-- differently, so which one is live in a given project cannot be read off the
-- repository. This migration is therefore written to be correct under either:
-- it only ADDs values, and every statement is idempotent.
--
-- The codes added here are the wire format validated by
-- services/intake-api/src/schemas/intake.schema.ts. Without them an intake
-- request passes validation and then fails at INSERT with
-- "invalid input value for enum bank_partner" — a 500 where the previous
-- behaviour was a 400.
--
-- Nothing is removed. Dropping a value from a Postgres enum requires
-- rewriting the type and every column using it, and would break any existing
-- row that names it. Retiring the non-panel codes is a separate decision that
-- needs the live data looked at first.
--
-- NOTE: migrations in this repository do not auto-apply. Run this by hand in
-- the Supabase SQL Editor. `ALTER TYPE ... ADD VALUE` cannot be used by a
-- statement in the same transaction that adds it, so apply this migration on
-- its own before deploying code that writes the new values.

ALTER TYPE bank_partner ADD VALUE IF NOT EXISTS 'KOTAK_BANK';
ALTER TYPE bank_partner ADD VALUE IF NOT EXISTS 'KOTAK_PRIME';
ALTER TYPE bank_partner ADD VALUE IF NOT EXISTS 'AXIS_FINANCE';
ALTER TYPE bank_partner ADD VALUE IF NOT EXISTS 'KARUR_VYSYA';
ALTER TYPE bank_partner ADD VALUE IF NOT EXISTS 'CHOLAMANDALAM';
ALTER TYPE bank_partner ADD VALUE IF NOT EXISTS 'MUTHOOT_HOMEFIN';
ALTER TYPE bank_partner ADD VALUE IF NOT EXISTS 'EASY_HOME_FINANCE';
