-- Starter data: campuses, fee heads, grading scale, school settings and the first staff accounts.
-- Run this AFTER 001_schema.sql. Before you run it, CHANGE the five passwords in the "accounts" list below.
-- Safe to re-run: existing rows are kept.

insert into campuses (id, code, name_en, name_ur) values
  ('campus_b','B','Boys Campus','بوائز کیمپس'),
  ('campus_g','G','Girls Campus','گرلز کیمپس')
on conflict (id) do nothing;

insert into academic_years (id, name, start_date, end_date, is_current) values
  ('ay_2026_27','2026-27','2026-04-01','2027-03-31', true)
on conflict (id) do nothing;

insert into fee_heads (id, code, name_en, name_ur, category, priority) values
  ('fh_arrears','ARR','Previous Arrears','سابقہ بقایاجات','ARREARS',1),
  ('fh_admission','ADM','Admission Fee','داخلہ فیس','ADMISSION',2),
  ('fh_annual','ANN','Annual Charges','سالانہ واجبات','ANNUAL',3),
  ('fh_tuition','TUI','Monthly Tuition Fee','ماہانہ ٹیوشن فیس','MONTHLY',4),
  ('fh_exam','EXM','Exam Fee','امتحانی فیس','EXAM',5),
  ('fh_late','LAT','Late Fee','لیٹ فیس','LATE',6),
  ('fh_other','OTH','Other','دیگر','OTHER',7)
on conflict (id) do nothing;

insert into grading_scale (min_percent, grade, remarks_en, remarks_ur) values
  (80,'A+','Outstanding','شاندار'), (70,'A','Excellent','بہترین'), (60,'B','Very Good','بہت اچھا'),
  (50,'C','Good','اچھا'), (40,'D','Satisfactory','تسلی بخش'), (33,'E','Pass','پاس'),
  (0,'F','Needs Improvement','مزید محنت درکار')
on conflict (min_percent) do nothing;

insert into school_settings (id, name_en, name_ur, office_phones, address, attendance_lock_time, weekly_off_days, show_class_position)
values (1,'Al Furqan School Okara','الفرقان اسکول اوکاڑہ','["044-2701122","0300-8441122"]','M.A. Jinnah Road, Okara, Punjab','23:59','["SUNDAY"]', true)
on conflict (id) do nothing;

-- First staff accounts. >>> EDIT THE PASSWORDS (second value in each line) BEFORE RUNNING <<<
-- Login ID, password, role, full name, urdu name, phone, campus
do $$
declare r record;
begin
  for r in select * from (values
    ('AD01', 'CHANGE-ME-ADMIN',     'ADMIN',          'Muhammad Usman (System Admin)', 'محمد عثمان (سسٹم ایڈمن)', '0300-4411001', null),
    ('PR01', 'CHANGE-ME-PRINCIPAL', 'PRINCIPAL',      'Prof. Abdul Qadeer Khan',       'پروفیسر عبدالقدیر خان',     '0300-4411002', null),
    ('VP01', 'CHANGE-ME-VICE',      'VICE_PRINCIPAL', 'Sir Hafiz Imran Saeed',         'جناب حافظ عمران سعید',      '0300-4411004', null),
    ('AC01', 'CHANGE-ME-ACCOUNTS',  'ACCOUNTANT',     'Syed Mohsin Raza',              'سید محسن رضا',              '0300-4411003', 'campus_b')
  ) as t(login, pw, role, name_en, name_ur, phone, campus)
  loop
    if not exists (select 1 from profiles where upper(login_id) = upper(r.login)) then
      if r.pw like 'CHANGE-ME%' then
        raise exception 'Please change the password for % before running this file.', r.login;
      end if;
      perform admin_create_account(r.login, r.pw, r.role, r.name_en, r.name_ur, r.phone, r.campus);
    end if;
  end loop;
end $$;
