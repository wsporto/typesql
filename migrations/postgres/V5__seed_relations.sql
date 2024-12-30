INSERT INTO users(
	name
) VALUES 
	('user1'), 
	('user2'), 
	('user3'), 
	('user4');

INSERT INTO posts(
	title,
	body,
	fk_user
) VALUES 
	('title1', 'body1', 1), 
	('title2', 'body2', 1), 
	('title3', 'body3', 1),  
	('title4', 'body4', 3), 
	('title5', 'body5', 3),
	('title6', 'body6', 4);

INSERT INTO comments(
	comment,
	fk_user,
	fk_post
) VALUES 
	('comment1', 2, 1), -- post1, user2
	('comment2', 3, 1), -- post1, user3
	('comment3', 1, 3), -- post3, user1
	('comment4', 1, 4), -- post4, user1
	('comment5', 3, 4), -- post4, user3
	('comment6', 4, 4), -- post4, user4
	('comment7', 4, 5), -- post5, user4
	('comment8', 1, 6); -- post6, user1

INSERT INTO roles(
	role,
	fk_user
) VALUES 
	('role1', 1), --u1, role1
	('role2', 1), --u1, role2
	('role3', 2), --u2, role3
	('role4', 3), --u3, role4
	('role5', 4), --u4, role5
	('role6', 4); --u4, role6

INSERT INTO addresses(
	address
) VALUES 
('address1'),
('address2'),
('address3'),
('address4'),
('address5'),
('address6');

INSERT INTO clients(
	primaryAddress,
	secondaryAddress
) 
VALUES 
	(1, 2), -- c1, address1, address2
	(5, 6), -- c1, address5, address6
	(3, null), -- c3, address3
	(3, 4); -- c4, address3, address4


INSERT INTO surveys(
	name
) VALUES 
	('s1'),
	('s2'),
	('s3'),
	('s4');

-- user1: s1, s2
-- user2: []
-- user3: s2, s3, s4
-- user4: s3
INSERT INTO participants(
	fk_user,
	fk_survey
) VALUES 
	(1, 1), -- user1, s1
	(1, 2), -- user1, s2
	(3, 2), -- user3, s2
	(3, 3), -- user3, s3
	(3, 4), -- user3, s4
	(4, 3); -- user4, s3
