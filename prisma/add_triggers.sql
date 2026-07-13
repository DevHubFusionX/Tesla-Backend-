-- 1. Check constraint to ensure User balance cannot drop below zero
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS chk_user_balance_non_negative;
-- STATEMENT_BREAK
ALTER TABLE "User" ADD CONSTRAINT chk_user_balance_non_negative CHECK (balance >= 0.0);
-- STATEMENT_BREAK

-- 2. Balance Synchronization Function & Trigger
CREATE OR REPLACE FUNCTION fn_update_user_balance()
RETURNS TRIGGER AS $$
DECLARE
  is_credit BOOLEAN;
  old_active BOOLEAN := false;
  new_active BOOLEAN := false;
BEGIN
  IF TG_OP = 'INSERT' THEN
    is_credit := (NEW.type = 'DEPOSIT' OR NEW.type = 'RETURN');
    IF is_credit THEN
      new_active := (NEW.status = 'SUCCESS');
    ELSE
      new_active := (NEW.status != 'FAILED');
    END IF;

    IF new_active THEN
      UPDATE "User"
      SET balance = balance + NEW.amount
      WHERE id = NEW."userId";
    END IF;

  ELSIF TG_OP = 'UPDATE' THEN
    is_credit := (NEW.type = 'DEPOSIT' OR NEW.type = 'RETURN');
    IF is_credit THEN
      old_active := (OLD.status = 'SUCCESS');
      new_active := (NEW.status = 'SUCCESS');
    ELSE
      old_active := (OLD.status != 'FAILED');
      new_active := (NEW.status != 'FAILED');
    END IF;

    -- Transition from inactive to active
    IF NOT old_active AND new_active THEN
      UPDATE "User"
      SET balance = balance + NEW.amount
      WHERE id = NEW."userId";
    -- Transition from active to inactive
    ELSIF old_active AND NOT new_active THEN
      UPDATE "User"
      SET balance = balance - OLD.amount
      WHERE id = NEW."userId";
    -- Remained active but amount changed
    ELSIF old_active AND new_active AND OLD.amount != NEW.amount THEN
      UPDATE "User"
      SET balance = balance - OLD.amount + NEW.amount
      WHERE id = NEW."userId";
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    is_credit := (OLD.type = 'DEPOSIT' OR OLD.type = 'RETURN');
    IF is_credit THEN
      old_active := (OLD.status = 'SUCCESS');
    ELSE
      old_active := (OLD.status != 'FAILED');
    END IF;

    IF old_active THEN
      UPDATE "User"
      SET balance = balance - OLD.amount
      WHERE id = OLD."userId";
    END IF;
  END IF;

  IF NEW IS NOT NULL THEN
    RETURN NEW;
  ELSE
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;
-- STATEMENT_BREAK
DROP TRIGGER IF EXISTS trg_sync_user_balance ON "Transaction";
-- STATEMENT_BREAK
CREATE TRIGGER trg_sync_user_balance
AFTER INSERT OR UPDATE OR DELETE ON "Transaction"
FOR EACH ROW
EXECUTE FUNCTION fn_update_user_balance();
-- STATEMENT_BREAK

-- 3. Single Default Payment Method Function & Trigger
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
$$ LANGUAGE plpgsql;
-- STATEMENT_BREAK
DROP TRIGGER IF EXISTS trg_single_default_payment_method ON "PaymentMethod";
-- STATEMENT_BREAK
CREATE TRIGGER trg_single_default_payment_method
BEFORE INSERT OR UPDATE ON "PaymentMethod"
FOR EACH ROW
EXECUTE FUNCTION fn_single_default_payment_method();
-- STATEMENT_BREAK

-- 4. Automatic Transaction Notifications Function & Trigger
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
$$ LANGUAGE plpgsql;
-- STATEMENT_BREAK
DROP TRIGGER IF EXISTS trg_auto_create_notification ON "Transaction";
-- STATEMENT_BREAK
CREATE TRIGGER trg_auto_create_notification
AFTER INSERT ON "Transaction"
FOR EACH ROW
EXECUTE FUNCTION fn_auto_create_notification();
-- STATEMENT_BREAK

-- 5. KYC Status Change Notification Function & Trigger
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
$$ LANGUAGE plpgsql;
-- STATEMENT_BREAK
DROP TRIGGER IF EXISTS trg_kyc_status_notification ON "KycProfile";
-- STATEMENT_BREAK
CREATE TRIGGER trg_kyc_status_notification
AFTER UPDATE ON "KycProfile"
FOR EACH ROW
EXECUTE FUNCTION fn_kyc_status_notification();
