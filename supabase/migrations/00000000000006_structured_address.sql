-- Structured address for students: the existing `address` column becomes
-- the street/community line, with town and parish as their own fields
-- (Jamaica's 14 parishes function like a state/province).

alter table students add column city_or_town text;
alter table students add column parish text
  check (parish in (
    'Kingston', 'St. Andrew', 'St. Catherine', 'Clarendon', 'Manchester',
    'St. Elizabeth', 'Westmoreland', 'Hanover', 'St. James', 'Trelawny',
    'St. Ann', 'St. Mary', 'Portland', 'St. Thomas'
  ));
