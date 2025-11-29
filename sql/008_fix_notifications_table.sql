-- =============================================
-- RESILIX POC - Fix Notifications Table Schema
-- Migration 008: Add missing columns to notifications table
-- =============================================

-- Fix notifications table - add missing LINE integration columns
DO $$
BEGIN
    -- Add LINE-related columns to notifications table if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'notifications' AND column_name = 'line_card_data') THEN
        ALTER TABLE notifications ADD COLUMN line_card_data JSONB;
        RAISE NOTICE 'Added line_card_data column to notifications table';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'notifications' AND column_name = 'line_message_id') THEN
        ALTER TABLE notifications ADD COLUMN line_message_id VARCHAR(100);
        RAISE NOTICE 'Added line_message_id column to notifications table';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'notifications' AND column_name = 'recipient_line_id') THEN
        ALTER TABLE notifications ADD COLUMN recipient_line_id VARCHAR(50);
        RAISE NOTICE 'Added recipient_line_id column to notifications table';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'notifications' AND column_name = 'action_required') THEN
        ALTER TABLE notifications ADD COLUMN action_required VARCHAR(100);
        RAISE NOTICE 'Added action_required column to notifications table';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'notifications' AND column_name = 'action_deadline') THEN
        ALTER TABLE notifications ADD COLUMN action_deadline TIMESTAMPTZ;
        RAISE NOTICE 'Added action_deadline column to notifications table';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'notifications' AND column_name = 'action_taken') THEN
        ALTER TABLE notifications ADD COLUMN action_taken BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added action_taken column to notifications table';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'notifications' AND column_name = 'action_taken_at') THEN
        ALTER TABLE notifications ADD COLUMN action_taken_at TIMESTAMPTZ;
        RAISE NOTICE 'Added action_taken_at column to notifications table';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'notifications' AND column_name = 'action_taken_by') THEN
        ALTER TABLE notifications ADD COLUMN action_taken_by VARCHAR(100);
        RAISE NOTICE 'Added action_taken_by column to notifications table';
    END IF;

    RAISE NOTICE 'Notifications table schema fix completed';
END $$;
