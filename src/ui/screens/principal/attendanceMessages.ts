import { Student } from '../../../domain/models/models';
import { normalizePkPhone } from '../accountant/AccountantShared';

export type AttendanceMessageKind = 'absent' | 'late' | 'low';

export interface AttendanceMessageInput {
  kind: AttendanceMessageKind;
  student: Student;
  classUr: string;
  classEn: string;
  /** ISO date (yyyy-mm-dd) the message is about. */
  date: string;
  schoolUr: string;
  schoolEn: string;
  /** Attendance percentage, only used by the 'low' message. */
  percent?: number;
}

const dmy = (iso: string) => iso.split('-').reverse().join('-');

/**
 * One WhatsApp text: Urdu first, a blank-line gap, then English.
 * (Always bilingual, whatever language the app is set to.)
 */
export function buildAttendanceMessage(i: AttendanceMessageInput): string {
  const childUr = i.student.nameUr || i.student.name;
  const childEn = i.student.name;
  const d = dmy(i.date);
  let ur: string;
  let en: string;
  if (i.kind === 'absent') {
    ur =
      `السلام علیکم! محترم والدین،\n\n` +
      `آپ کا بچہ/بچی ${childUr} (جماعت: ${i.classUr}) آج، ${d} کو اسکول سے غیر حاضر ہے۔ ` +
      `براہِ کرم غیر حاضری کی وجہ سے آگاہ فرمائیں۔ بچے کی باقاعدہ حاضری اس کی تعلیمی کامیابی کے لیے نہایت ضروری ہے۔\n\n` +
      `شکریہ\n${i.schoolUr}`;
    en =
      `Assalam-o-Alaikum! Dear Parent,\n\n` +
      `Your child ${childEn} (Class: ${i.classEn}) is absent from school today, ${d}. ` +
      `Kindly let us know the reason for the absence. Regular attendance is essential for your child's academic progress.\n\n` +
      `Thank you,\n${i.schoolEn}`;
  } else if (i.kind === 'late') {
    ur =
      `السلام علیکم! محترم والدین،\n\n` +
      `آپ کا بچہ/بچی ${childUr} (جماعت: ${i.classUr}) آج، ${d} کو اسکول دیر سے پہنچا/پہنچی۔ ` +
      `براہِ کرم بچے کو بروقت اسکول بھیجنے کا اہتمام فرمائیں۔\n\n` +
      `شکریہ\n${i.schoolUr}`;
    en =
      `Assalam-o-Alaikum! Dear Parent,\n\n` +
      `Your child ${childEn} (Class: ${i.classEn}) arrived late to school today, ${d}. ` +
      `Kindly ensure that your child reaches school on time.\n\n` +
      `Thank you,\n${i.schoolEn}`;
  } else {
    const p = String(i.percent ?? 0);
    ur =
      `السلام علیکم! محترم والدین،\n\n` +
      `آپ کے بچے/بچی ${childUr} (جماعت: ${i.classUr}) کی حاضری ${p}% ہے جو مطلوبہ معیار سے کم ہے۔ ` +
      `براہِ کرم بچے کی باقاعدہ حاضری کو یقینی بنائیں تاکہ اس کی تعلیم متاثر نہ ہو۔\n\n` +
      `شکریہ\n${i.schoolUr}`;
    en =
      `Assalam-o-Alaikum! Dear Parent,\n\n` +
      `The attendance of your child ${childEn} (Class: ${i.classEn}) is ${p}%, which is below the required level. ` +
      `Kindly ensure regular attendance so that your child's studies are not affected.\n\n` +
      `Thank you,\n${i.schoolEn}`;
  }
  return `${ur}\n\n\n${en}`;
}

export function whatsappLink(phone: string, text: string): string {
  return `https://wa.me/${normalizePkPhone(phone)}?text=${encodeURIComponent(text)}`;
}
