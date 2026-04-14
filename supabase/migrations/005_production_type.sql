-- Add 'production' to the camps.type check constraint
alter table camps drop constraint camps_type_check;
alter table camps add constraint camps_type_check
  check (type in ('camp', 'supplier', 'production'));
