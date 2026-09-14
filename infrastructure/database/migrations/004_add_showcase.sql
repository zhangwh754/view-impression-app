CREATE TABLE showcase (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  title text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE showcase_slots (
  id serial PRIMARY KEY,
  showcase_id smallint NOT NULL DEFAULT 1,
  label text NOT NULL,
  work_id integer,
  position integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT showcase_slots_showcase_id_fkey
    FOREIGN KEY (showcase_id) REFERENCES showcase (id)
    ON DELETE CASCADE,
  CONSTRAINT showcase_slots_work_id_fkey
    FOREIGN KEY (work_id) REFERENCES works (id)
    ON DELETE SET NULL,
  CONSTRAINT showcase_slots_position_unique
    UNIQUE (showcase_id, position)
);

INSERT INTO showcase (id, title)
VALUES (1, '我的喜欢作品一览');

INSERT INTO showcase_slots (showcase_id, label, position)
VALUES
  (1, '入坑作', 0),
  (1, '最喜欢', 1),
  (1, '最多次看', 2),
  (1, '最想安利', 3),
  (1, '最佳剧情', 4),
  (1, '最佳画面', 5),
  (1, '最佳科幻', 6),
  (1, '最佳恋爱', 7),
  (1, '最治愈', 8),
  (1, '最感动', 9),
  (1, '最虐心', 10),
  (1, '最被低估', 11),
  (1, '最离谱', 12),
  (1, '最讨厌', 13),
  (1, '最佳奇幻', 14),
  (1, '最佳日常', 15),
  (1, '最佳校园', 16),
  (1, '最佳战斗', 17),
  (1, '最佳悬疑', 18),
  (1, '最佳音乐', 19);
