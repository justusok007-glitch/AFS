import React from 'react';
import { StudentResultCard } from '../../../domain/models/models';
import { AccountantLookups } from '../accountant/AccountantShared';
import { examName, subjectName, useSubjectsMap } from '../exams/ExamShared';

const GREEN = '#0E5A3A';
const PALE = '#EAF1EC';
const LINE = '#C9D3CC';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function fmtDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}-${MONTHS[Number(m) - 1] ?? m}-${y}`;
}
const pct = (n: number) => `${n.toFixed(1)}%`;

const cell: React.CSSProperties = { border: `1px solid ${LINE}`, padding: '3px 8px' };
const head: React.CSSProperties = { background: GREEN, color: '#fff', fontWeight: 700, padding: '5px 8px', border: `1px solid ${GREEN}` };

/** Printed result card laid out like the school's Excel result sheet. */
export const ReportCardPrint: React.FC<{
  card: StudentResultCard;
  previous: StudentResultCard[];
  lookups: AccountantLookups;
  subjects: ReturnType<typeof useSubjectsMap>;
}> = ({ card, previous, lookups, subjects }) => {
  const s = card.student;
  const sec = lookups.sectionsMap[s.sectionId];
  const cls = sec ? lookups.classesMap[sec.classId] : undefined;
  const campus = lookups.campuses.find((c) => c.id === s.campusId);
  const resultDate = fmtDate(card.exam.endDate ?? new Date().toISOString());
  const prev = previous.slice(0, 3);
  const info = (label: string, value: string, strong = true) => (
    <tr>
      <td style={{ ...cell, background: PALE, fontWeight: 700, width: '38%' }}>{label}</td>
      <td style={{ ...cell, fontWeight: strong ? 700 : 400 }}>{value}</td>
    </tr>
  );

  return (
    <div dir="ltr" lang="en" className="rc-sheet" style={{ border: `2px solid ${GREEN}`, color: '#1B2233', fontFamily: 'Calibri, Arial, sans-serif', fontSize: 13, background: '#fff', minHeight: '135mm' }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'stretch', borderBottom: `1px solid ${GREEN}` }}>
        <div style={{ width: 120, padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="/school-logo.png" alt="" style={{ width: 100, height: 'auto' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ textAlign: 'center', color: GREEN, fontWeight: 800, fontSize: 30, letterSpacing: 1, fontFamily: 'Georgia, serif', paddingTop: 6 }}>
            AL FURQAN SCHOOL OKARA
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 40px 8px', color: GREEN, fontWeight: 700, fontSize: 16 }}>
            <span style={{ flex: 1, borderTop: `2px solid ${GREEN}` }} />
            <span>{campus?.nameEn ?? ''}</span>
            <span style={{ flex: 1, borderTop: `2px solid ${GREEN}` }} />
          </div>
          <div style={{ background: GREEN, color: '#fff', fontWeight: 700, fontSize: 12, textAlign: 'center', padding: '5px 10px', letterSpacing: 0.3 }}>
            <span style={{ float: 'left' }}>//</span>
            <span style={{ float: 'right' }}>//</span>
            RESULT CARD &nbsp;|&nbsp; {examName(card.exam, 'en').toUpperCase()} &nbsp;|&nbsp; SESSION {card.sessionName ?? ''}
          </div>
        </div>
      </div>

      {/* student info */}
      <div style={{ display: 'flex', gap: 14, padding: '0' }}>
        <table style={{ flex: 1, borderCollapse: 'collapse' }}>
          <tbody>
            {info("Student Name", s.name)}
            {info("Father's Name", s.fatherName)}
            {info('Session', card.sessionName ?? '')}
          </tbody>
        </table>
        <table style={{ flex: 1, borderCollapse: 'collapse' }}>
          <tbody>
            {info('Roll No', String(s.rollNo))}
            {info('Class', cls ? cls.nameEn : '')}
            {info('Result Date', resultDate)}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: 14, marginTop: 10, alignItems: 'flex-start' }}>
        {/* marks table */}
        <table style={{ flex: 1.3, borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...head, textAlign: 'left' }}>Subject</th>
              <th style={head}>Total</th>
              <th style={head}>Obtained</th>
              <th style={head}>%</th>
              <th style={head}>Grade</th>
              <th style={head}>Status</th>
            </tr>
          </thead>
          <tbody style={{ textAlign: 'center' }}>
            {card.subjectLines.map((l) => (
              <tr key={l.subjectId}>
                <td style={{ ...cell, textAlign: 'left', fontWeight: 600 }}>{subjectName(subjects, l.subjectId, 'en')}</td>
                <td style={cell}>{l.totalMarks}</td>
                <td style={{ ...cell, fontWeight: 700 }}>{l.isAbsent ? 'Abs' : l.entered ? l.obtained : '-'}</td>
                <td style={cell}>{pct(l.percent)}</td>
                <td style={{ ...cell, fontWeight: 700 }}>{l.grade ?? ''}</td>
                <td style={{ ...cell, color: l.passed ? GREEN : '#C0392B', fontWeight: 700 }}>{l.passed ? 'Pass' : 'Fail'}</td>
              </tr>
            ))}
            <tr style={{ background: PALE, color: GREEN, fontWeight: 800 }}>
              <td style={{ ...cell, textAlign: 'left' }}>Total – This Exam</td>
              <td style={cell}>{card.totalMaxMarks}</td>
              <td style={cell}>{card.totalObtainedMarks}</td>
              <td style={cell}>{pct(card.percentage)}</td>
              <td style={cell}>{card.grade}</td>
              <td style={cell}>-</td>
            </tr>
          </tbody>
        </table>

        {/* previous exam + verdict */}
        <div style={{ flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr><th colSpan={4} style={{ ...head, textAlign: 'left' }}>Previous Exam</th></tr>
              <tr style={{ background: PALE, fontWeight: 700, fontSize: 11 }}>
                <td style={cell}>Exam Name</td><td style={cell}>Total Marks</td><td style={cell}>Obtained</td><td style={cell}>%</td>
              </tr>
            </thead>
            <tbody style={{ textAlign: 'center', fontSize: 12 }}>
              {prev.length === 0 ? (
                <tr><td style={{ ...cell, textAlign: 'left' }}>No prev. exam</td><td style={cell}>–</td><td style={cell}>–</td><td style={cell}>–</td></tr>
              ) : null}
              {prev.map((p) => (
                <tr key={p.exam.id}>
                  <td style={{ ...cell, textAlign: 'left' }}>{examName(p.exam, 'en')}</td>
                  <td style={cell}>{p.totalMaxMarks}</td>
                  <td style={cell}>{p.totalObtainedMarks}</td>
                  <td style={cell}>{pct(p.percentage)}</td>
                </tr>
              ))}
              {Array.from({ length: Math.max(0, 3 - Math.max(prev.length, 1)) }).map((_, i) => (
                <tr key={`e${i}`}><td style={cell}>–</td><td style={cell}>–</td><td style={cell}>–</td><td style={cell}>–</td></tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 28, border: `2px solid ${GREEN}`, color: card.passed ? GREEN : '#C0392B', borderColor: card.passed ? GREEN : '#C0392B', textAlign: 'center', fontWeight: 800, fontSize: 18, padding: '14px 8px' }}>
            {card.passed ? '✓ RESULT: PASS' : '✗ RESULT: FAIL'}
          </div>
        </div>
      </div>

      {/* overall + remarks */}
      <div style={{ display: 'flex', gap: 14, marginTop: 14, alignItems: 'flex-end' }}>
        <table style={{ borderCollapse: 'collapse', width: 300 }}>
          <thead><tr><th colSpan={4} style={{ ...head, textAlign: 'left' }}>OVERALL RESULT</th></tr></thead>
          <tbody>
            <tr>
              <td style={{ ...cell, background: PALE, fontWeight: 700 }}>Total Marks</td>
              <td style={{ ...cell, fontWeight: 800, textAlign: 'center' }}>{card.totalMaxMarks}</td>
              <td style={{ ...cell, background: PALE, fontWeight: 700 }}>Obtained</td>
              <td style={{ ...cell, fontWeight: 800, textAlign: 'center' }}>{card.totalObtainedMarks}</td>
            </tr>
            <tr>
              <td style={{ ...cell, background: PALE, fontWeight: 700 }}>Percentage</td>
              <td style={{ ...cell, fontWeight: 800, textAlign: 'center' }}>{pct(card.percentage)}</td>
              <td style={{ ...cell, background: PALE, fontWeight: 700 }}>Grade</td>
              <td style={{ ...cell, fontWeight: 800, textAlign: 'center' }}>{card.grade}</td>
            </tr>
          </tbody>
        </table>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ color: GREEN, fontWeight: 800, fontStyle: 'italic', fontFamily: 'Georgia, serif', fontSize: 15, borderBottom: `1px solid ${GREEN}`, paddingBottom: 4 }}>
            Remarks:&nbsp; {card.gradeRemarksEn}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 46 }}>
        <div style={{ width: 230, borderTop: '1px solid #1B2233', textAlign: 'center', fontSize: 12, paddingTop: 2 }}>Principal</div>
      </div>
    </div>
  );
};
