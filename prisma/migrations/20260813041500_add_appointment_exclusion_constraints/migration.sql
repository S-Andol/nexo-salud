-- Not run automatically by Prisma Migrate (Prisma cannot express exclusion constraints).
-- This is the real, DB-level guarantee against double-booking (RN-03/RN-04): two
-- concurrent transactions inserting overlapping appointment ranges for the same
-- professional (or the same patient) cannot both commit, regardless of what the
-- application layer does. A unique index on (professional_id, start_datetime) alone
-- would only catch *identical* start instants, not partially-overlapping ranges with
-- different start times, so an exclusion constraint over a range type is required.
--
-- Postgres's range constructor functions (tstzrange, etc.) are STABLE, not IMMUTABLE,
-- so they cannot back a GENERATED ALWAYS AS (...) STORED column directly (Postgres
-- rejects that with "generation expression is not immutable"). A BEFORE INSERT/UPDATE
-- trigger has no such restriction and keeps the range column in sync instead.

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE appointments ADD COLUMN range tstzrange;

CREATE FUNCTION appointments_set_range() RETURNS trigger AS $$
BEGIN
  NEW.range := tstzrange(NEW.start_datetime, NEW.end_datetime, '[)');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER appointments_set_range_trigger
  BEFORE INSERT OR UPDATE OF start_datetime, end_datetime ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION appointments_set_range();

-- Backfill any existing rows, then require the column going forward.
UPDATE appointments SET range = tstzrange(start_datetime, end_datetime, '[)');
ALTER TABLE appointments ALTER COLUMN range SET NOT NULL;

-- A professional cannot have two overlapping CONFIRMADO appointments.
ALTER TABLE appointments
  ADD CONSTRAINT no_overlap_per_professional
  EXCLUDE USING gist (professional_id WITH =, range WITH &&)
  WHERE (status = 'CONFIRMADO');

-- A patient cannot have two overlapping CONFIRMADO appointments (across any professional).
ALTER TABLE appointments
  ADD CONSTRAINT no_overlap_per_patient
  EXCLUDE USING gist (patient_id WITH =, range WITH &&)
  WHERE (status = 'CONFIRMADO');
