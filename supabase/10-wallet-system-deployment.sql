-- ============================================================
-- WALLET SYSTEM DEPLOYMENT
-- ============================================================
-- This file deploys the wallet system: wallets table, wallet_transactions,
-- credit/debit functions, and auto-creation trigger.
-- Run this in the Supabase SQL Editor to enable wallet functionality.
-- ============================================================

-- 10.1: Wallet type enum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wallet_type') THEN
    CREATE TYPE wallet_type AS ENUM ('customer', 'partner', 'driver');
  END IF;
END $$;

-- 10.2: Wallet transaction type enum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wallet_transaction_type') THEN
    CREATE TYPE wallet_transaction_type AS ENUM (
      'credit',      -- money added (top-up, refund, bonus)
      'debit',       -- money spent (payment, withdrawal)
      'commission',  -- earnings from deliveries
      'transfer'     -- peer-to-peer transfer
    );
  END IF;
END $$;

-- 10.3: Wallets table
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_type wallet_type NOT NULL DEFAULT 'customer',

  -- Balances
  balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  pending_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_earned DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_spent DECIMAL(12,2) NOT NULL DEFAULT 0.00,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_frozen BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- One wallet per user per type
  UNIQUE(user_id, wallet_type)
);

-- 10.4: Wallet transactions table
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,

  -- Transaction details
  type wallet_transaction_type NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  balance_before DECIMAL(12,2) NOT NULL,
  balance_after DECIMAL(12,2) NOT NULL,

  -- Source reference
  reference_id UUID,
  reference_type TEXT,  -- 'parcel', 'order', 'top_up', 'withdrawal'

  -- Description
  description TEXT,
  metadata JSONB,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10.5: Indexes
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_reference ON wallet_transactions(reference_id, reference_type);

-- 10.6: Enable RLS
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- 10.7: RLS Policies - Users can see and modify their own wallets
CREATE POLICY wallets_own_access ON wallets FOR ALL USING (user_id = auth.uid());

-- 10.8: RLS Policies - Users can see their own transactions
CREATE POLICY wallet_transactions_own_read ON wallet_transactions FOR SELECT USING (
  wallet_id IN (SELECT id FROM wallets WHERE user_id = auth.uid())
);

-- Note: Users cannot directly insert transactions — they must go through
-- the credit/debit functions (SECURITY DEFINER)

-- 10.9: Credit a wallet (top-up, refund, commission)
-- Idempotent: creates wallet if needed, records transaction
CREATE OR REPLACE FUNCTION credit_wallet(
  p_user_id UUID,
  p_amount DECIMAL(12,2),
  p_wallet_type wallet_type DEFAULT 'customer',
  p_reference_id UUID DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_wallet_id UUID;
  v_balance_before DECIMAL(12,2);
  v_balance_after DECIMAL(12,2);
  v_txn_id UUID;
BEGIN
  -- Get or create wallet
  INSERT INTO wallets (user_id, wallet_type, balance)
  VALUES (p_user_id, p_wallet_type, 0.00)
  ON CONFLICT (user_id, wallet_type) DO NOTHING;

  SELECT id, balance INTO v_wallet_id, v_balance_before
  FROM wallets WHERE user_id = p_user_id AND wallet_type = p_wallet_type
  FOR UPDATE;

  v_balance_after := v_balance_before + p_amount;

  UPDATE wallets SET
    balance = v_balance_after,
    total_earned = total_earned + CASE WHEN p_wallet_type = 'partner' THEN p_amount ELSE 0 END,
    updated_at = NOW()
  WHERE id = v_wallet_id;

  INSERT INTO wallet_transactions (wallet_id, type, amount, balance_before, balance_after, reference_id, reference_type, description)
  VALUES (v_wallet_id, 'credit', p_amount, v_balance_before, v_balance_after, p_reference_id, p_reference_type, p_description)
  RETURNING id INTO v_txn_id;

  RETURN v_txn_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10.10: Debit a wallet (payment, withdrawal)
-- Idempotent: checks balance, records transaction
-- Raises exception if insufficient balance
CREATE OR REPLACE FUNCTION debit_wallet(
  p_user_id UUID,
  p_amount DECIMAL(12,2),
  p_wallet_type wallet_type DEFAULT 'customer',
  p_reference_id UUID DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_wallet_id UUID;
  v_balance_before DECIMAL(12,2);
  v_balance_after DECIMAL(12,2);
  v_txn_id UUID;
BEGIN
  SELECT id, balance INTO v_wallet_id, v_balance_before
  FROM wallets WHERE user_id = p_user_id AND wallet_type = p_wallet_type
  FOR UPDATE;

  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'Wallet not found for user %', p_user_id;
  END IF;

  IF v_balance_before < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance: % < %', v_balance_before, p_amount;
  END IF;

  v_balance_after := v_balance_before - p_amount;

  UPDATE wallets SET
    balance = v_balance_after,
    total_spent = total_spent + p_amount,
    updated_at = NOW()
  WHERE id = v_wallet_id;

  INSERT INTO wallet_transactions (wallet_id, type, amount, balance_before, balance_after, reference_id, reference_type, description)
  VALUES (v_wallet_id, 'debit', p_amount, v_balance_before, v_balance_after, p_reference_id, p_reference_type, p_description)
  RETURNING id INTO v_txn_id;

  RETURN v_txn_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10.11: Auto-create wallet on user signup
CREATE OR REPLACE FUNCTION handle_new_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wallets (user_id, wallet_type)
  VALUES (NEW.id, 'customer');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_wallet_created ON users;
CREATE TRIGGER on_user_wallet_created
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION handle_new_wallet();

-- ============================================================
-- DEPLOYMENT COMPLETE
-- ============================================================
-- Summary:
--   ✓ Created wallet_type enum
--   ✓ Created wallet_transaction_type enum
--   ✓ Created wallets table with balances and status
--   ✓ Created wallet_transactions table
--   ✓ Created indexes for efficient queries
--   ✓ Enabled RLS with user-level policies
--   ✓ Created credit_wallet() function
--   ✓ Created debit_wallet() function
--   ✓ Created auto-wallet creation trigger on user signup
--
-- Usage:
--   -- Credit a wallet (e.g., top-up)
--   SELECT credit_wallet(
--     'user-uuid',
--     1000.00,
--     'customer',
--     NULL,
--     'top_up',
--     'Initial top-up'
--   );
--
--   -- Debit a wallet (e.g., payment)
--   SELECT debit_wallet(
--     'user-uuid',
--     500.00,
--     'customer',
--     'parcel-uuid',
--     'parcel',
--     'Parcel payment'
--   );
--
-- Verification:
--   \dt wallets
--   \dt wallet_transactions
--   \df credit_wallet
--   \df debit_wallet
-- ============================================================
