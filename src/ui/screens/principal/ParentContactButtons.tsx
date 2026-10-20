import React from 'react';
import { MessageCircle, Phone } from 'lucide-react';
import { today } from '../../../domain/clock';
import { Student } from '../../../domain/models/models';
import { useStringResource } from '../../theme/LocaleContext';
import { AccountantLookups, studentClassLabel } from '../accountant/AccountantShared';
import { AttendanceMessageKind, buildAttendanceMessage, whatsappLink } from './attendanceMessages';

/** One-tap Call and WhatsApp (ready bilingual message) to a student's guardian. */
export const ParentContactButtons: React.FC<{
  student: Student;
  lookups: AccountantLookups;
  kind: AttendanceMessageKind;
  percent?: number;
}> = ({ student, lookups, kind, percent }) => {
  const { stringResource: t } = useStringResource();
  const phone = student.guardianPhone;
  if (!phone || !/\d{7,}/.test(phone)) {
    return <p className="text-[11px] text-[#6B7385]">{t('att_no_phone')}</p>;
  }
  const text = buildAttendanceMessage({
    kind,
    student,
    classUr: studentClassLabel(student, lookups, 'ur'),
    classEn: studentClassLabel(student, lookups, 'en'),
    date: today(),
    schoolUr: lookups.schoolNameUr,
    schoolEn: lookups.schoolNameEn,
    percent,
  });
  const cls =
    'min-h-[44px] rounded-xl border border-[#E4E8F0] flex items-center justify-center gap-1.5 text-xs font-semibold text-[#14284B]';
  return (
    <div className="grid grid-cols-2 gap-2">
      <a href={`tel:${phone}`} className={cls}>
        <Phone className="w-3.5 h-3.5 text-[#F28C28]" />
        {t('att_call')}
      </a>
      <a href={whatsappLink(phone, text)} target="_blank" rel="noopener noreferrer" className={cls}>
        <MessageCircle className="w-3.5 h-3.5 text-[#2E9E5B]" />
        {t('att_whatsapp')}
      </a>
    </div>
  );
};
