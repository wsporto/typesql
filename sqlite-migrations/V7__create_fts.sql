CREATE VIRTUAL TABLE mytable2_fts
USING fts5 (
	id, name, descr
);