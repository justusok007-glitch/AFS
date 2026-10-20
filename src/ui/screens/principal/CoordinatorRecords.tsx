import React, { useEffect, useState } from 'react';
import { AppModule } from '../../../di/AppModule';
import { Profile } from '../../../domain/models/models';
import { useAccountantLookups } from '../accountant/AccountantShared';
import { PrincipalAttendanceTab } from './PrincipalAttendanceTab';

/** Attendance records for the Attendance Coordinator: same view as the principal, limited to assigned classes. */
export const CoordinatorRecords: React.FC<{ coordinator: Profile }> = ({ coordinator }) => {
  const lookups = useAccountantLookups();
  const [scope, setScope] = useState<string[] | null>(null);
  useEffect(() => {
    let off = false;
    void AppModule.settingsRepository.getTeacherAssignments(coordinator.id).then((r) => {
      if (!off) setScope(r.ok ? Array.from(new Set(r.data.map((a) => a.sectionId))) : []);
    });
    return () => { off = true; };
  }, [coordinator.id]);
  if (scope === null) return null;
  return <PrincipalAttendanceTab lookups={lookups} scopeSectionIds={scope} contactActions />;
};
