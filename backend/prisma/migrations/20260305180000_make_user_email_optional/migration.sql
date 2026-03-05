-- Make email optional on User table and drop the unique constraint on email
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
DROP INDEX IF EXISTS "User_email_key";
