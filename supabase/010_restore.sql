-- Restore: the Admin can load a backup (one of the saved days, or an uploaded file) back into the school data.
-- All-or-nothing: if anything fails, nothing is changed. Login accounts / passwords are never touched.
-- Run once in the Supabase SQL editor.

create or replace function restore_backup(p_data jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  t text;
  tabs jsonb;
  d jsonb;
  counts jsonb := '{}'::jsonb;
  n int;
  -- parents first (insert order); deleted in reverse order
  ordered text[] := array[
    'campuses','academic_years','classes','subjects','class_subjects','sections','teacher_assignments',
    'students','parent_students','grading_scale','school_settings','holidays','attendance_records',
    'attendance_submissions','attendance_unlocks','fee_heads','class_fee_structures','student_concessions',
    'fee_vouchers','fee_payments','payment_allocations','exams','exam_subjects','marks','mark_submissions',
    'conversations','messages','notices','notifications','audit_logs','diary_entries'];
begin
  if not is_role('ADMIN') then raise exception 'not allowed'; end if;
  if p_data is null or p_data->>'app' is distinct from 'AFS' or jsonb_typeof(p_data->'tables') is distinct from 'object' then
    raise exception 'This is not an AFS backup file';
  end if;
  tabs := p_data->'tables';
  -- the backup must contain the core tables, otherwise we would wipe the school by mistake
  if jsonb_array_length(coalesce(tabs->'students', '[]'::jsonb)) = 0 or jsonb_array_length(coalesce(tabs->'sections', '[]'::jsonb)) = 0 then
    raise exception 'The backup has no students or sections; nothing was changed';
  end if;

  for i in reverse array_length(ordered,1)..1 loop
    t := ordered[i];
    if to_regclass('public.' || t) is not null and tabs ? t then
      execute format('delete from public.%I where true', t);
    end if;
  end loop;

  for i in 1..array_length(ordered,1) loop
    t := ordered[i];
    if to_regclass('public.' || t) is null or not (tabs ? t) then continue; end if;
    d := tabs->t;
    -- accounts are not restored: drop links to accounts that no longer exist
    if t = 'teacher_assignments' then
      select coalesce(jsonb_agg(x), '[]') into d from jsonb_array_elements(d) x
        where exists (select 1 from profiles p where p.id = (x->>'teacher_id')::uuid);
    elsif t = 'parent_students' then
      select coalesce(jsonb_agg(x), '[]') into d from jsonb_array_elements(d) x
        where exists (select 1 from profiles p where p.id = (x->>'parent_id')::uuid);
    elsif t = 'sections' then
      select coalesce(jsonb_agg(case when x->>'class_teacher_id' is not null
          and not exists (select 1 from profiles p where p.id = (x->>'class_teacher_id')::uuid)
          then x || '{"class_teacher_id":null}'::jsonb else x end), '[]') into d from jsonb_array_elements(d) x;
    elsif t = 'attendance_unlocks' then
      select coalesce(jsonb_agg(case when x->>'created_by' is not null
          and not exists (select 1 from profiles p where p.id = (x->>'created_by')::uuid)
          then x || '{"created_by":null}'::jsonb else x end), '[]') into d from jsonb_array_elements(d) x;
    elsif t = 'diary_entries' then
      select coalesce(jsonb_agg(case when x->>'author_id' is not null
          and not exists (select 1 from profiles p where p.id = (x->>'author_id')::uuid)
          then x || '{"author_id":null}'::jsonb else x end), '[]') into d from jsonb_array_elements(d) x;
    end if;
    execute format('insert into public.%1$I select * from jsonb_populate_recordset(null::public.%1$I, $1)', t) using d;
    get diagnostics n = row_count;
    counts := counts || jsonb_build_object(t, n);
  end loop;
  return counts;
end $$;

revoke all on function restore_backup(jsonb) from public, anon;
grant execute on function restore_backup(jsonb) to authenticated;
