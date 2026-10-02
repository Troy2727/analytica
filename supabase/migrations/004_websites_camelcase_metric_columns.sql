-- 001 created the PageSpeed columns unquoted, so Postgres stored them lowercase,
-- but the app reads/writes camelCase names ("firstContentfulPaint", ...), which
-- PostgREST treats as case-sensitive. Rename to match the code.
ALTER TABLE websites RENAME COLUMN firstcontentfulpaint TO "firstContentfulPaint";
ALTER TABLE websites RENAME COLUMN largestcontentfulpaint TO "largestContentfulPaint";
ALTER TABLE websites RENAME COLUMN timetointeractive TO "timeToInteractive";
ALTER TABLE websites RENAME COLUMN cumulativelayoutshift TO "cumulativeLayoutShift";
ALTER TABLE websites RENAME COLUMN totalblockingtime TO "totalBlockingTime";
ALTER TABLE websites RENAME COLUMN bestpractices TO "bestPractices";
ALTER TABLE websites RENAME COLUMN speedindex TO "speedIndex";
