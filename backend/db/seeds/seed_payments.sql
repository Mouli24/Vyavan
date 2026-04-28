-- Seed data for testing Credit & Payment Terms
-- Created: 2024-04-22

-- 1. Insert Test Users
INSERT INTO "users" (id, name, email, role) VALUES
('u0000000-0000-0000-0000-000000000001', 'Global Textiles Mfg', 'contact@globaltextiles.com', 'manufacturer'),
('u0000000-0000-0000-0000-000000000002', 'Modern Retailers Ltd', 'procurement@modernretailers.com', 'buyer');

-- 2. Insert Test Manufacturers
INSERT INTO "manufacturers" (id, user_id) VALUES
('m0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000001');

-- 3. Insert Test Buyers
INSERT INTO "buyers" (id, user_id) VALUES
('b0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000002');

-- 4. Insert Manufacturer Payment Settings
-- Allowed terms: Advance 100%, Split 50/50, Net 30
INSERT INTO "manufacturer_payment_settings" (manufacturer_id, allowed_terms, default_terms) VALUES
('m0000000-0000-0000-0000-000000000001', '["advance_100", "split_50_50", "net_30"]'::jsonb, 'advance_100');

-- 5. Insert Buyer Payment Terms
-- For "Modern Retailers Ltd" buying from "Global Textiles Mfg"
INSERT INTO "buyer_payment_terms" (manufacturer_id, buyer_id, allowed_terms, credit_limit, notes) VALUES
('m0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '["net_30", "net_15"]'::jsonb, 500000.00, 'Preferred distributor with high credit limit.');

-- 6. Insert another Buyer Term for testing (different buyer)
INSERT INTO "users" (id, name, email, role) VALUES ('u0000000-0000-0000-0000-000000000003', 'Small Shop Inc', 'ss@example.com', 'buyer');
INSERT INTO "buyers" (id, user_id) VALUES ('b0000000-0000-0000-0000-000000000002', 'u0000000-0000-0000-0000-000000000003');
INSERT INTO "buyer_payment_terms" (manufacturer_id, buyer_id, allowed_terms, credit_limit, is_flagged, flagged_at, notes) VALUES
('m0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', '["advance_100"]'::jsonb, 0.00, true, NOW(), 'Restricted to Advance payment only due to past payment delays.');
