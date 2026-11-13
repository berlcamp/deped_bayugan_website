-- Removes the starter sample posts (tagged 'sample').
delete from deped_bayugan.articles where 'sample' = any (tags);
