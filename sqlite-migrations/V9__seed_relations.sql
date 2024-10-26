INSERT INTO users(
	id,
	name
) VALUES 
	(1, 'user1'), 
	(2, 'user2'), 
	(3, 'user3'), 
	(4, 'user4');

INSERT INTO posts(
	id,
	title,
	body,
	fk_user
) VALUES 
	(1, 'title1', 'body1', 1), 
	(2, 'title2', 'body2', 1), 
	(3, 'title3', 'body3', 1),  
	(4, 'title4', 'body4', 3), 
	(5, 'title5', 'body5', 3),
	(6, 'title6', 'body6', 4);

INSERT INTO comments(
	id,
	comment,
	fk_user,
	fk_post
) VALUES 
	(1, 'comment1', 2, 1), -- post1, user2
	(2, 'comment2', 3, 1), -- post1, user3
	(3, 'comment3', 1, 3), -- post3, user1
	(4, 'comment4', 1, 4), -- post4, user1
	(5, 'comment5', 3, 4), -- post4, user3
	(6, 'comment6', 4, 4), -- post4, user4
	(7, 'comment7', 4, 5), -- post5, user4
	(8, 'comment8', 1, 6); -- post6, user1

INSERT INTO roles(
	id,
	role,
	fk_user
) VALUES 
	(1, 'role1', 1), --u1, role1
	(2, 'role2', 1), --u1, role2
	(3, 'role3', 2), --u2, role3
	(4, 'role4', 3), --u3, role4
	(5, 'role5', 4), --u4, role5
	(6, 'role6', 4); --u4, role6

INSERT INTO addresses(
	id,
	address
) VALUES 
(1,	'address1'),
(2,	'address2'),
(3,	'address3'),
(4,	'address4'),
(5,	'address5'),
(6,	'address6');

INSERT INTO clients(
	id,
	primaryAddress,
	secondaryAddress
) 
VALUES 
	(1, 1, 2), -- c1, address1, address2
	(2, 5, 6), -- c1, address5, address6
	(3, 3, null), -- c3, address3
	(4, 3, 4); -- c4, address3, address4


INSERT INTO surveys(
	id,
	name
) VALUES 
	(1, 's1'),
	(2, 's2'),
	(3, 's3'),
	(4, 's4');

-- user1: s1, s2
-- user2: []
-- user3: s2, s3, s4
-- user4: s3
INSERT INTO participants(
	id,
	fk_user,
	fk_survey
) VALUES 
	(1, 1, 1), -- user1, s1
	(2, 1, 2), -- user1, s2
	(3, 3, 2), -- user3, s2
	(4, 3, 3), -- user3, s3
	(5, 3, 4), -- user3, s4
	(6, 4, 3); -- user4, s3
