-- Starter content for the DepEd Bayugan website. Everything here is editable in /admin.
-- Sample posts carry the tag 'sample' — remove them with supabase/rollback/remove_sample_posts.sql.

insert into deped_bayugan.settings (id, address, office_hours, facebook_url,
  hero_eyebrow, hero_title, hero_highlight, hero_subtitle,
  hero_primary_label, hero_primary_url, hero_secondary_label, hero_secondary_url,
  sds_title, sds_message, mission, vision, core_values, highlights)
values (
  true,
  'Bayugan City, Agusan del Sur, Caraga Region (XIII)',
  'Monday to Friday, 8:00 AM – 5:00 PM',
  null,
  'Schools Division of Bayugan City',
  'Quality, accessible education for every learner of',
  'Bayugan City',
  'News, issuances and online services of the Department of Education – Schools Division Office of Bayugan City, all in one place for learners, parents, teachers and stakeholders.',
  'Explore online services', '#online-services',
  'View issuances', '/division-memoranda',
  'Schools Division Superintendent',
  '<p>Welcome to the official website of the Schools Division of Bayugan City.</p><p>This site brings our news, issuances and online services together so that learners, parents, teachers and partners can find what they need quickly and transact with the Division wherever they are. Together, let us keep working for a learner-centered, inclusive and resilient basic education in Bayugan City.</p>',
  'To protect and promote the right of every Filipino to quality, equitable, culture-based, and complete basic education where students learn in a child-friendly, gender-sensitive, safe, and motivating environment; teachers facilitate learning and constantly nurture every learner; administrators and staff, as stewards of the institution, ensure an enabling and supportive environment for effective learning to happen; and family, community, and other stakeholders are actively engaged and share responsibility for developing life-long learners.',
  'We dream of Filipinos who passionately love their country and whose values and competencies enable them to realize their full potential and contribute meaningfully to building the nation. As a learner-centered public institution, the Department of Education continuously improves itself to better serve its stakeholders.',
  'Maka-Diyos, Maka-tao, Makakalikasan, Makabansa',
  '[
    {"title":"Online services","text":"PRIME-HRM, SMS and other division systems in one place."},
    {"title":"Official issuances","text":"Division memoranda and advisories as soon as they are released."},
    {"title":"Transparency","text":"Bids, awards and the Transparency Seal, open to the public."},
    {"title":"Help desk","text":"Reach the right office for queries and requests."}
  ]'::jsonb
)
on conflict (id) do nothing;

-- Sections ------------------------------------------------------------------
insert into deped_bayugan.categories (name, slug, description, layout, sort_order) values
  ('News & Stories', 'news', 'Stories, events and achievements from the schools and offices of the Division.', 'stories', 1),
  ('Division Memoranda', 'division-memoranda', 'Official memoranda issued by the Schools Division Office of Bayugan City.', 'documents', 2),
  ('Advisories', 'advisories', 'Advisories and notices for schools, personnel and the public.', 'documents', 3),
  ('Announcements', 'announcements', 'Announcements, schedules and reminders from the Division.', 'stories', 4),
  ('Bids & Awards', 'bids-and-awards', 'Invitations to bid, notices of award, notices to proceed and other procurement postings.', 'documents', 5)
on conflict (slug) do nothing;

-- Pages ---------------------------------------------------------------------
insert into deped_bayugan.pages (title, slug, excerpt, content, status) values
  ('About the Division', 'about-us',
   'The Schools Division Office of Bayugan City serves the public elementary and secondary schools of Bayugan City, Agusan del Sur.',
   '<p>The Schools Division Office (SDO) of Bayugan City is a field office of the Department of Education under DepEd Caraga Region. It manages, supports and supervises the public elementary and secondary schools and learning centers of Bayugan City.</p><h2>What the Division does</h2><ul><li>Provides instructional leadership and technical assistance to schools.</li><li>Manages personnel, finance and physical resources for basic education in the city.</li><li>Implements DepEd programs, projects and policies at the division and school level.</li><li>Works with local government, parents and partners to keep learners in school and learning.</li></ul><h2>Functional divisions</h2><p><strong>Office of the Schools Division Superintendent (OSDS)</strong>, <strong>Curriculum Implementation Division (CID)</strong> and <strong>School Governance and Operations Division (SGOD)</strong>.</p>',
   'published'),
  ('Mission, Vision & Core Values', 'mission-vision',
   'The DepEd Vision, Mission and Core Values that guide the Schools Division of Bayugan City.',
   '<h2>DepEd Vision</h2><p>We dream of Filipinos who passionately love their country and whose values and competencies enable them to realize their full potential and contribute meaningfully to building the nation.</p><p>As a learner-centered public institution, the Department of Education continuously improves itself to better serve its stakeholders.</p><h2>DepEd Mission</h2><p>To protect and promote the right of every Filipino to quality, equitable, culture-based, and complete basic education where:</p><ul><li>Students learn in a child-friendly, gender-sensitive, safe, and motivating environment.</li><li>Teachers facilitate learning and constantly nurture every learner.</li><li>Administrators and staff, as stewards of the institution, ensure an enabling and supportive environment for effective learning to happen.</li><li>Family, community, and other stakeholders are actively engaged and share responsibility for developing life-long learners.</li></ul><h2>DepEd Core Values</h2><p><strong>Maka-Diyos · Maka-tao · Makakalikasan · Makabansa</strong></p>',
   'published'),
  ('Organizational Structure', 'organizational-structure',
   'Offices and functional divisions of the Schools Division Office of Bayugan City.',
   '<p>Upload the Division''s current organizational chart here from the admin (Pages → Organizational Structure).</p><h2>Office of the Schools Division Superintendent</h2><ul><li>Administrative Services</li><li>Finance (Budget and Accounting)</li><li>Information and Communications Technology</li><li>Legal Services</li></ul><h2>Curriculum Implementation Division</h2><ul><li>Instructional Management</li><li>Learning Resource Management</li><li>Alternative Learning System</li></ul><h2>School Governance and Operations Division</h2><ul><li>Planning and Research</li><li>Human Resource Development</li><li>Social Mobilization and Networking</li><li>Education Facilities</li><li>School Health and Nutrition</li></ul>',
   'published'),
  ('Directory', 'directory',
   'How to reach the offices of the Schools Division of Bayugan City.',
   '<p>Add each office''s contact person, phone number and email here from the admin.</p><h2>Office of the Schools Division Superintendent</h2><p>Contact details to follow.</p><h2>Curriculum Implementation Division</h2><p>Contact details to follow.</p><h2>School Governance and Operations Division</h2><p>Contact details to follow.</p>',
   'published'),
  ('Citizen''s Charter', 'citizens-charter',
   'Services of the Division, their requirements, steps, fees and processing time.',
   '<p>The Citizen''s Charter lists the frontline services of the Schools Division Office of Bayugan City in line with Republic Act No. 11032 (Ease of Doing Business and Efficient Government Service Delivery Act of 2018).</p><p>Attach the latest Citizen''s Charter document to this page from the admin.</p>',
   'published'),
  ('Transparency Seal', 'transparency-seal',
   'Documents published in compliance with the Transparency Seal requirements.',
   '<p>Post the Division''s Transparency Seal documents here: mandates and functions, budget and financial reports, annual procurement plan, projects and programs, and the agency''s performance reports.</p>',
   'published'),
  ('Data Privacy Notice', 'data-privacy',
   'How this website handles personal information.',
   '<p>The Schools Division of Bayugan City respects your privacy and processes personal information in accordance with Republic Act No. 10173, the Data Privacy Act of 2012.</p><p>This public website does not ask visitors for personal information. Online services linked from this site have their own privacy notices.</p>',
   'published'),
  ('Contact Us', 'contact-us',
   'Visit, call or message the Schools Division Office of Bayugan City.',
   '<p>For queries and requests, visit the Schools Division Office during office hours or send us a message through the channels below. The office address, phone and email shown on this site can be updated from the admin under Settings.</p>',
   'published')
on conflict (slug) do nothing;

-- Online services --------------------------------------------------------------
insert into deped_bayugan.services (title, description, url, icon, badge, is_featured, sort_order) values
  ('PRIME-HRM', 'Vacant items, applications and ranking results for teaching and non-teaching positions.', 'https://eprime.kerisoftware.com', 'briefcase', 'Most used', true, 1),
  ('School Management System', 'Learner records, enrollment and school reports for schools of the Division.', '/services', 'school', null, true, 2),
  ('Division Memoranda', 'Read and download the latest memoranda issued by the Division.', '/division-memoranda', 'file-text', null, true, 3),
  ('Learner Information System', 'DepEd LIS for school-based learner registration and enrollment.', 'https://lis.deped.gov.ph', 'users', null, false, 4),
  ('DepEd Commons', 'Free learning resources for learners and teachers.', 'https://commons.deped.gov.ph', 'book-open', null, false, 5),
  ('Help Desk', 'Ask the Division about a request, a document or a service.', '/contact-us', 'life-buoy', null, false, 6)
;

-- Menu ------------------------------------------------------------------------
with top as (
  insert into deped_bayugan.menu_items (label, url, sort_order) values
    ('Home', '/', 1),
    ('About Us', null, 2),
    ('Issuances', null, 3),
    ('Transparency', null, 4),
    ('News', '/news', 5),
    ('Online Services', null, 6),
    ('Contact Us', '/contact-us', 7)
  returning id, label
)
insert into deped_bayugan.menu_items (parent_id, label, url, description, open_new_tab, sort_order)
select t.id, c.label, c.url, c.description, c.new_tab, c.ord
from top t
join (values
  ('About Us', 'About the Division', '/about-us', 'Who we are and what we do', false, 1),
  ('About Us', 'Mission, Vision & Core Values', '/mission-vision', 'What guides our work', false, 2),
  ('About Us', 'Organizational Structure', '/organizational-structure', 'Offices and functional divisions', false, 3),
  ('About Us', 'Directory', '/directory', 'How to reach each office', false, 4),
  ('About Us', 'Citizen''s Charter', '/citizens-charter', 'Services, requirements and timelines', false, 5),
  ('Issuances', 'Division Memoranda', '/division-memoranda', 'Official division memoranda', false, 1),
  ('Issuances', 'Advisories', '/advisories', 'Notices for schools and the public', false, 2),
  ('Issuances', 'Announcements', '/announcements', 'Schedules and reminders', false, 3),
  ('Issuances', 'DepEd Orders', 'https://www.deped.gov.ph/category/issuances/deped-orders/', 'National issuances on deped.gov.ph', true, 4),
  ('Transparency', 'Bids & Awards', '/bids-and-awards', 'Procurement postings', false, 1),
  ('Transparency', 'Transparency Seal', '/transparency-seal', 'Budget, plans and reports', false, 2),
  ('Transparency', 'Data Privacy Notice', '/data-privacy', 'How we handle personal data', false, 3),
  ('Online Services', 'PRIME-HRM', 'https://eprime.kerisoftware.com', 'Vacancies and ranking results', true, 1),
  ('Online Services', 'School Management System', '/services', 'Learner records and school reports', false, 2),
  ('Online Services', 'All online services', '/services', 'Every system in one place', false, 3)
) as c(parent, label, url, description, new_tab, ord) on c.parent = t.label;

-- Sample posts (tag: sample) ---------------------------------------------------------
insert into deped_bayugan.articles (title, slug, excerpt, content, category_id, status, is_featured, tags, author_name, published_at, reference_no)
select v.title, v.slug, v.excerpt, v.content, c.id, 'published', v.featured, array['sample'], 'SDO Bayugan City', now() - v.ago, v.ref
from (values
  ('news', 'Welcome to the new DepEd Bayugan website', 'welcome-to-the-new-deped-bayugan-website',
   'The Schools Division of Bayugan City launches its new official website, bringing news, issuances and online services together in one place.',
   '<p>The Schools Division of Bayugan City now has a new official website. Learners, parents, teachers and partners can read Division news, download memoranda and advisories, and open online services such as PRIME-HRM from a single address.</p><p>Content on this site is managed by the Division through its own content management system, so updates are posted as soon as they are released.</p><p><em>This is a sample post. Replace or delete it from the admin.</em></p>',
   true, interval '1 hour', null),
  ('news', 'Schools prepare for the opening of classes', 'schools-prepare-for-the-opening-of-classes',
   'Schools across the Division ready their classrooms and learning materials ahead of the opening of classes.',
   '<p>Teachers, parents and community volunteers are preparing classrooms, cleaning school grounds and organizing learning materials ahead of the opening of classes.</p><p><em>This is a sample post. Replace or delete it from the admin.</em></p>',
   false, interval '2 days', null),
  ('news', 'Teachers join division-wide learning action cell sessions', 'teachers-join-division-wide-lac-sessions',
   'Learning action cell sessions help teachers share strategies that improve reading and numeracy.',
   '<p>Teachers from elementary and secondary schools took part in learning action cell (LAC) sessions focused on reading and numeracy strategies.</p><p><em>This is a sample post. Replace or delete it from the admin.</em></p>',
   false, interval '4 days', null),
  ('announcements', 'Office hours of the Schools Division Office', 'office-hours-of-the-schools-division-office',
   'The Schools Division Office is open Monday to Friday, 8:00 AM to 5:00 PM.',
   '<p>The Schools Division Office is open to the public Monday to Friday, 8:00 AM to 5:00 PM, except on holidays.</p><p><em>This is a sample post. Replace or delete it from the admin.</em></p>',
   false, interval '5 days', null),
  ('division-memoranda', 'Sample: Submission of school reports', 'sample-submission-of-school-reports',
   'All school heads are requested to submit the required school reports on or before the set deadline.',
   '<p>This is a sample memorandum to show how issuances appear on the website. Attach the signed PDF from the admin.</p>',
   false, interval '1 day', 'DM No. 001, s. 2026'),
  ('division-memoranda', 'Sample: Conduct of division training', 'sample-conduct-of-division-training',
   'Participants, schedule and venue of a division training activity.',
   '<p>This is a sample memorandum to show how issuances appear on the website. Attach the signed PDF from the admin.</p>',
   false, interval '3 days', 'DM No. 002, s. 2026'),
  ('advisories', 'Sample: Advisory on class suspension', 'sample-advisory-on-class-suspension',
   'How schools are informed of class suspensions during bad weather.',
   '<p>This is a sample advisory to show how advisories appear on the website.</p>',
   false, interval '2 days', 'Advisory No. 001, s. 2026'),
  ('bids-and-awards', 'Sample: Invitation to bid for school furniture', 'sample-invitation-to-bid-school-furniture',
   'The Division invites eligible suppliers to bid for the supply and delivery of school furniture.',
   '<p>This is a sample procurement posting. Attach the invitation to bid from the admin.</p>',
   false, interval '6 days', 'ITB No. 2026-001')
) as v(cat, title, slug, excerpt, content, featured, ago, ref)
join deped_bayugan.categories c on c.slug = v.cat
on conflict (slug) do nothing;
