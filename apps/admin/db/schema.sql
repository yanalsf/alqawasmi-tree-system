-- REFERENCE ONLY — you already have this table live with real data (per the
-- phpMyAdmin screenshot you shared). Don't run this against your existing
-- database. It's here so a fresh environment (or a teammate) can recreate
-- the same structure your app actually uses.
 
CREATE DATABASE IF NOT EXISTS family_tree CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE family_tree;
 
CREATE TABLE IF NOT EXISTS person (
  person_id   INT PRIMARY KEY AUTO_INCREMENT,
  name_text   VARCHAR(255) NOT NULL,
  parent_id   INT NULL,          -- 941 (VIRTUAL_ROOT_ID) for branch roots — not a real person_id
  birth_date  SMALLINT NULL,  -- stores just the birth YEAR (e.g. 1990), not a full date
  death_date  SMALLINT NULL,  -- stores just the death YEAR (e.g. 2020), not a full date
  branch_id   VARCHAR(50) NULL,  -- one of: dawoud, abu_nawara, al_sous, abdullah, al_jadaa,
                                  -- mohammed_sulaiman, younes, al_badawi, mohammed_ali,
                                  -- abu_baid, al_khudair, abdulhaq
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES person(person_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
 
CREATE INDEX idx_person_parent ON person(parent_id);
CREATE INDEX idx_person_branch ON person(branch_id);
 
-- Note: parent_id has a self-referencing FK, but branch roots store parent_id
-- = 941, which is never itself a row in this table (it's a sentinel meaning
-- "top of a branch", inherited from the old data.js System_Root id). If you
-- recreate this table from scratch, either drop the FK constraint or insert
-- a real (unused) row with person_id = 941 to satisfy it — check which your
-- live table actually does before assuming.
 