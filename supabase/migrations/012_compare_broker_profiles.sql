-- ============================================================
-- Migration 012: compare_broker_profiles (Phase 7)
-- ============================================================

CREATE TABLE compare_broker_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    platform platform_enum NOT NULL DEFAULT 'mt5',
    category VARCHAR(50) NOT NULL DEFAULT 'prop_firm',
    region VARCHAR(50),
    min_deposit NUMERIC(14, 2),
    max_leverage INTEGER,
    spread_from NUMERIC(10, 4),
    commission_per_lot NUMERIC(10, 4),
    copy_trading_supported BOOLEAN DEFAULT TRUE,
    platforms_supported TEXT[] DEFAULT ARRAY['mt5'],
    rating NUMERIC(3, 1),
    highlights TEXT[],
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_compare_profiles_category ON compare_broker_profiles(category);
CREATE INDEX idx_compare_profiles_platform ON compare_broker_profiles(platform);

CREATE TRIGGER update_compare_broker_profiles_updated_at
    BEFORE UPDATE ON compare_broker_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

INSERT INTO compare_broker_profiles (
    slug, name, platform, category, region, min_deposit, max_leverage,
    spread_from, copy_trading_supported, platforms_supported, rating, highlights, is_featured
) VALUES
(
    'ftmo-mt5',
    'FTMO',
    'mt5',
    'prop_firm',
    'EU',
    0,
    100,
    0.0,
    TRUE,
    ARRAY['mt5', 'ctrader'],
    4.6,
    ARRAY['Two-step evaluation', 'MT5 + cTrader', 'Weekend holding rules'],
    TRUE
),
(
    'fundednext-mt5',
    'FundedNext',
    'mt5',
    'prop_firm',
    'Global',
    0,
    100,
    0.1,
    TRUE,
    ARRAY['mt5', 'mt4'],
    4.4,
    ARRAY['Express model', 'MT5/MT4', 'Competitive profit split'],
    TRUE
),
(
    'ic-markets-mt5',
    'IC Markets',
    'mt5',
    'broker',
    'AU',
    200,
    500,
    0.0,
    TRUE,
    ARRAY['mt5', 'mt4', 'ctrader'],
    4.7,
    ARRAY['Raw spreads', 'Deep liquidity', 'Multi-platform'],
    FALSE
);
