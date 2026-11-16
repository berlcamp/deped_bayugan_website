-- Pages can embed one PDF (e.g. Citizen's Charter, org chart) shown in a viewer below the content.
alter table deped_bayugan.pages
  add column pdf_url  text,
  add column pdf_name text;
