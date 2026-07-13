-- 1. Enable Row Level Security (RLS) on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
-- STATEMENT_BREAK
ALTER TABLE "InvestmentPlan" ENABLE ROW LEVEL SECURITY;
-- STATEMENT_BREAK
ALTER TABLE "UserInvestment" ENABLE ROW LEVEL SECURITY;
-- STATEMENT_BREAK
ALTER TABLE "PaymentMethod" ENABLE ROW LEVEL SECURITY;
-- STATEMENT_BREAK
ALTER TABLE "KycProfile" ENABLE ROW LEVEL SECURITY;
-- STATEMENT_BREAK
ALTER TABLE "Transaction" ENABLE ROW LEVEL SECURITY;
-- STATEMENT_BREAK
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
-- STATEMENT_BREAK

-- 2. Revoke SELECT privileges from anon and authenticated roles to prevent direct PostgREST API reads
REVOKE SELECT ON "User" FROM anon, authenticated;
-- STATEMENT_BREAK
REVOKE SELECT ON "InvestmentPlan" FROM anon, authenticated;
-- STATEMENT_BREAK
REVOKE SELECT ON "UserInvestment" FROM anon, authenticated;
-- STATEMENT_BREAK
REVOKE SELECT ON "PaymentMethod" FROM anon, authenticated;
-- STATEMENT_BREAK
REVOKE SELECT ON "KycProfile" FROM anon, authenticated;
-- STATEMENT_BREAK
REVOKE SELECT ON "Transaction" FROM anon, authenticated;
-- STATEMENT_BREAK
REVOKE SELECT ON "Notification" FROM anon, authenticated;
-- STATEMENT_BREAK

-- 3. Secure fn_update_user_balance with SECURITY DEFINER and secure search_path
CREATE OR REPLACE FUNCTION fn_update_user_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'SUCCESS' THEN
      UPDATE "User"
      SET balance = balance + NEW.amount
      WHERE id = NEW."userId";
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'SUCCESS' AND NEW.status = 'SUCCESS' THEN
      UPDATE "User"
      SET balance = balance + NEW.amount
      WHERE id = NEW."userId";
    ELSIF OLD.status = 'SUCCESS' AND NEW.status != 'SUCCESS' THEN
      UPDATE "User"
      SET balance = balance - OLD.amount
      WHERE id = NEW."userId";
    ELSIF OLD.status = 'SUCCESS' AND NEW.status = 'SUCCESS' AND OLD.amount != NEW.amount THEN
      UPDATE "User"
      SET balance = balance - OLD.amount + NEW.amount
      WHERE id = NEW."userId";
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.status = 'SUCCESS' THEN
      UPDATE "User"
      SET balance = balance - OLD.amount
      WHERE id = OLD."userId";
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog, pg_temp;
-- STATEMENT_BREAK

-- 4. Secure fn_single_default_payment_method with SECURITY DEFINER and secure search_path
CREATE OR REPLACE FUNCTION fn_single_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."isDefault" = true THEN
    UPDATE "PaymentMethod"
    SET "isDefault" = false
    WHERE "userId" = NEW."userId" AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog, pg_temp;
-- STATEMENT_BREAK

-- 5. Secure fn_auto_create_notification with SECURITY DEFINER and secure search_path
CREATE OR REPLACE FUNCTION fn_auto_create_notification()
RETURNS TRIGGER AS $$
DECLARE
  notification_title TEXT;
  notification_message TEXT;
  notification_type TEXT := 'SYSTEM';
BEGIN
  IF NEW.status = 'SUCCESS' THEN
    IF NEW.type = 'DEPOSIT' THEN
      notification_title := 'Deposit Successful';
      notification_message := 'Your wallet has been credited with $' || to_char(NEW.amount, 'FM999,999,990.00') || '.';
      notification_type := 'TRANSACTION';
    ELSIF NEW.type = 'WITHDRAWAL' THEN
      notification_title := 'Withdrawal Successful';
      notification_message := 'Your wallet withdrawal of $' || to_char(ABS(NEW.amount), 'FM999,999,990.00') || ' has been processed successfully.';
      notification_type := 'TRANSACTION';
    ELSIF NEW.type = 'INVESTMENT' THEN
      notification_title := 'Investment Started';
      notification_message := 'You successfully invested $' || to_char(ABS(NEW.amount), 'FM999,999,990.00') || ' in the index plan.';
      notification_type := 'INVESTMENT';
    ELSIF NEW.type = 'RETURN' THEN
      notification_title := 'Investment Return Payout';
      notification_message := NEW.description || ' processed successfully, paying out $' || to_char(NEW.amount, 'FM999,999,990.00') || ' to your wallet.';
      notification_type := 'INVESTMENT';
    END IF;

    IF notification_title IS NOT NULL THEN
      INSERT INTO "Notification" (id, "userId", title, message, read, type, "createdAt")
      VALUES (substring(gen_random_uuid()::text from 1 for 25), NEW."userId", notification_title, notification_message, false, notification_type, now());
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog, pg_temp;
-- STATEMENT_BREAK

-- 6. Secure fn_kyc_status_notification with SECURITY DEFINER and secure search_path
CREATE OR REPLACE FUNCTION fn_kyc_status_notification()
RETURNS TRIGGER AS $$
DECLARE
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  IF OLD.status != NEW.status THEN
    IF NEW.status = 'APPROVED' THEN
      notification_title := 'KYC Verification Approved';
      notification_message := 'Congratulations! Your KYC profile has been verified successfully. Full platform features are now unlocked.';
    ELSIF NEW.status = 'REJECTED' THEN
      notification_title := 'KYC Verification Rejected';
      notification_message := 'Your KYC profile was not approved. Reason: ' || COALESCE(NEW."rejectionReason", 'No reason specified.') || '. Please update and submit again.';
    END IF;

    IF notification_title IS NOT NULL THEN
      INSERT INTO "Notification" (id, "userId", title, message, read, type, "createdAt")
      VALUES (substring(gen_random_uuid()::text from 1 for 25), NEW."userId", notification_title, notification_message, false, 'SYSTEM', now());
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog, pg_temp;
