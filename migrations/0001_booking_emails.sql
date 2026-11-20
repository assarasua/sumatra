CREATE TABLE booking_emails (
 booking_id TEXT PRIMARY KEY NOT NULL REFERENCES bookings(id),
 state TEXT NOT NULL,
 attempts INTEGER NOT NULL DEFAULT 0,
 first_attempt INTEGER NOT NULL DEFAULT 0,
 next_attempt INTEGER NOT NULL DEFAULT 0,
 lease_until INTEGER NOT NULL DEFAULT 0,
 resend_id TEXT,
 last_error TEXT,
 sent_at INTEGER
);
CREATE INDEX booking_emails_pending ON booking_emails(state,next_attempt);
