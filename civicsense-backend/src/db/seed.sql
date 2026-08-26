-- Seed data — mirrors src/lib/mockData.js in the frontend prototype

INSERT INTO departments (id, name, color) VALUES
  ('potholes', 'Potholes', '#C1443A'),
  ('garbage', 'Garbage', '#4C7A5E'),
  ('drainage', 'Drainage', '#3D4C6B');

INSERT INTO points_of_interest (name, type, lat, lng) VALUES
  ('Sassoon General Hospital', 'hospital', 18.5227, 73.8636),
  ('Wagholi Public School', 'school', 18.5793, 73.9812),
  ('Fergusson College', 'college', 18.5236, 73.8393),
  ('PCMC Hospital', 'hospital', 18.6298, 73.7997);

-- Demo citizen (gov_id auth — password_hash left null)
INSERT INTO users (id, role, name, gov_id, ward, coins)
VALUES ('00000000-0000-0000-0000-000000000001', 'citizen', 'Anshul Zalke', 'GOV-XXXX-1187', 'Wagholi, Pune', 240);

-- Demo staff accounts — password for all seeded staff is: civicsense123
-- (bcrypt hash generated at seed time via src/db/setup.js, see that script)
