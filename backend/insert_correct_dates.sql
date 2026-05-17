BEGIN TRANSACTION;

-- Today: 2026-05-15

-- ========== Candidates entered on 05-09 (6 days ago) ==========
INSERT OR IGNORE INTO candidate (id, name, id_card, phone, email, last_operator_id, created_at, updated_at) VALUES 
(200, '九甲G01', '110', '138', 'g01@t.com', 1, '2026-05-09 09:00:00', '2026-05-09 09:00:00'),
(201, '九乙G02', '110', '138', 'g02@t.com', 1, '2026-05-09 09:30:00', '2026-05-09 09:30:00');

-- 05-09 entered: now at tech_interview_1 and tech_interview_2
INSERT OR IGNORE INTO candidate_stage (candidate_id, current_stage, updated_at, created_at) VALUES 
(200, 'tech_interview_1', '2026-05-13 10:00:00', '2026-05-09 09:00:00'),
(201, 'tech_interview_2', '2026-05-14 18:00:00', '2026-05-09 09:30:00');

INSERT OR IGNORE INTO candidate_stage_timeline (candidate_id, stage, entered_at, left_at, duration_hours) VALUES 
-- Candidate 200 timeline
(200, 'candidate_entry',      '2026-05-09 09:00:00', '2026-05-09 14:00:00', 5),
(200, 'exam_declare',         '2026-05-09 14:00:00', '2026-05-09 20:00:00', 6),
(200, 'exam_complete',        '2026-05-09 20:00:00', '2026-05-10 02:00:00', 6),
(200, 'test_declare',         '2026-05-10 02:00:00', '2026-05-10 08:00:00', 6),
(200, 'test_complete',        '2026-05-10 08:00:00', '2026-05-10 14:00:00', 6),
(200, 'recommend_interview',  '2026-05-10 14:00:00', '2026-05-11 20:00:00', 30),
(200, 'qualification_interview','2026-05-11 20:00:00','2026-05-13 10:00:00', 38),
(200, 'tech_interview_1',     '2026-05-13 10:00:00', NULL, NULL),
-- Candidate 201 timeline (faster)
(201, 'candidate_entry',      '2026-05-09 09:30:00', '2026-05-09 13:30:00', 4),
(201, 'exam_declare',         '2026-05-09 13:30:00', '2026-05-09 18:30:00', 5),
(201, 'exam_complete',        '2026-05-09 18:30:00', '2026-05-10 00:30:00', 6),
(201, 'test_declare',         '2026-05-10 00:30:00', '2026-05-10 06:30:00', 6),
(201, 'test_complete',        '2026-05-10 06:30:00', '2026-05-10 12:30:00', 6),
(201, 'recommend_interview',  '2026-05-10 12:30:00', '2026-05-11 16:30:00', 28),
(201, 'qualification_interview','2026-05-11 16:30:00','2026-05-12 08:30:00', 16),
(201, 'tech_interview_1',     '2026-05-12 08:30:00', '2026-05-14 18:00:00', 57.5),
(201, 'tech_interview_2',     '2026-05-14 18:00:00', NULL, NULL);

-- ========== Candidates entered on 05-10 (5 days ago) ==========
INSERT OR IGNORE INTO candidate (id, name, id_card, phone, email, last_operator_id, created_at, updated_at) VALUES 
(210, '十甲F01', '110', '138', 'f01@t.com', 1, '2026-05-10 09:00:00', '2026-05-10 09:00:00'),
(211, '十乙F02', '110', '138', 'f02@t.com', 1, '2026-05-10 10:00:00', '2026-05-10 10:00:00'),
(212, '十丙F03', '110', '138', 'f03@t.com', 1, '2026-05-10 11:00:00', '2026-05-10 11:00:00');

INSERT OR IGNORE INTO candidate_stage (candidate_id, current_stage, updated_at, created_at) VALUES 
(210, 'qualification_interview', '2026-05-14 09:00:00', '2026-05-10 09:00:00'),
(211, 'recommend_interview', '2026-05-13 14:00:00', '2026-05-10 10:00:00'),
(212, 'test_complete', '2026-05-12 08:00:00', '2026-05-10 11:00:00');

INSERT OR IGNORE INTO candidate_stage_timeline (candidate_id, stage, entered_at, left_at, duration_hours) VALUES 
(210, 'candidate_entry',      '2026-05-10 09:00:00', '2026-05-10 14:00:00', 5),
(210, 'exam_declare',         '2026-05-10 14:00:00', '2026-05-10 20:00:00', 6),
(210, 'exam_complete',        '2026-05-10 20:00:00', '2026-05-11 02:00:00', 6),
(210, 'test_declare',         '2026-05-11 02:00:00', '2026-05-11 08:00:00', 6),
(210, 'test_complete',        '2026-05-11 08:00:00', '2026-05-11 14:00:00', 6),
(210, 'recommend_interview',  '2026-05-11 14:00:00', '2026-05-14 09:00:00', 67),
(210, 'qualification_interview','2026-05-14 09:00:00', NULL, NULL),

(211, 'candidate_entry',      '2026-05-10 10:00:00', '2026-05-10 15:00:00', 5),
(211, 'exam_declare',         '2026-05-10 15:00:00', '2026-05-10 21:00:00', 6),
(211, 'exam_complete',        '2026-05-10 21:00:00', '2026-05-11 03:00:00', 6),
(211, 'test_declare',         '2026-05-11 03:00:00', '2026-05-11 09:00:00', 6),
(211, 'test_complete',        '2026-05-11 09:00:00', '2026-05-13 14:00:00', 53),
(211, 'recommend_interview',  '2026-05-13 14:00:00', NULL, NULL),

(212, 'candidate_entry',      '2026-05-10 11:00:00', '2026-05-10 16:00:00', 5),
(212, 'exam_declare',         '2026-05-10 16:00:00', '2026-05-10 22:00:00', 6),
(212, 'exam_complete',        '2026-05-10 22:00:00', '2026-05-11 04:00:00', 6),
(212, 'test_declare',         '2026-05-11 04:00:00', '2026-05-12 08:00:00', 28),
(212, 'test_complete',        '2026-05-12 08:00:00', NULL, NULL);

-- ========== Candidates entered on 05-12 (3 days ago) ==========
INSERT OR IGNORE INTO candidate (id, name, id_card, phone, email, last_operator_id, created_at, updated_at) VALUES 
(220, '二甲D01', '110', '138', 'd01@t.com', 1, '2026-05-12 09:00:00', '2026-05-12 09:00:00'),
(221, '二乙D02', '110', '138', 'd02@t.com', 1, '2026-05-12 10:30:00', '2026-05-12 10:30:00');

INSERT OR IGNORE INTO candidate_stage (candidate_id, current_stage, updated_at, created_at) VALUES 
(220, 'exam_complete', '2026-05-14 20:00:00', '2026-05-12 09:00:00'),
(221, 'exam_declare', '2026-05-14 14:00:00', '2026-05-12 10:30:00');

INSERT OR IGNORE INTO candidate_stage_timeline (candidate_id, stage, entered_at, left_at, duration_hours) VALUES 
(220, 'candidate_entry',      '2026-05-12 09:00:00', '2026-05-12 15:00:00', 6),
(220, 'exam_declare',         '2026-05-12 15:00:00', '2026-05-14 20:00:00', 53),
(220, 'exam_complete',        '2026-05-14 20:00:00', NULL, NULL),

(221, 'candidate_entry',      '2026-05-12 10:30:00', '2026-05-14 14:00:00', 51.5),
(221, 'exam_declare',         '2026-05-14 14:00:00', NULL, NULL);

-- ========== Candidates entered on 05-14 (yesterday) ==========
INSERT OR IGNORE INTO candidate (id, name, id_card, phone, email, last_operator_id, created_at, updated_at) VALUES 
(230, '四乙B01', '110', '138', 'b01@t.com', 1, '2026-05-14 09:00:00', '2026-05-14 09:00:00'),
(231, '四甲B02', '110', '138', 'b02@t.com', 1, '2026-05-14 11:00:00', '2026-05-14 11:00:00');

INSERT OR IGNORE INTO candidate_stage (candidate_id, current_stage, updated_at, created_at) VALUES 
(230, 'exam_declare', '2026-05-14 15:00:00', '2026-05-14 09:00:00'),
(231, 'candidate_entry', '2026-05-14 11:00:00', '2026-05-14 11:00:00');

INSERT OR IGNORE INTO candidate_stage_timeline (candidate_id, stage, entered_at, left_at, duration_hours) VALUES 
(230, 'candidate_entry',      '2026-05-14 09:00:00', '2026-05-14 15:00:00', 6),
(230, 'exam_declare',         '2026-05-14 15:00:00', NULL, NULL),

(231, 'candidate_entry',      '2026-05-14 11:00:00', NULL, NULL);

-- ========== Candidates entered TODAY 05-15 ==========
INSERT OR IGNORE INTO candidate (id, name, id_card, phone, email, last_operator_id, created_at, updated_at) VALUES 
(240, '五甲A01', '110', '138', 'a01@t.com', 1, '2026-05-15 09:00:00', '2026-05-15 09:00:00');

INSERT OR IGNORE INTO candidate_stage (candidate_id, current_stage, updated_at, created_at) VALUES 
(240, 'candidate_entry', '2026-05-15 09:00:00', '2026-05-15 09:00:00');

INSERT OR IGNORE INTO candidate_stage_timeline (candidate_id, stage, entered_at, left_at, duration_hours) VALUES 
(240, 'candidate_entry',      '2026-05-15 09:00:00', NULL, NULL);

COMMIT;
