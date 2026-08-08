import { Timetable, TimetableEntry } from "../types/timetable";
import { Group } from "../types/group";
import { User } from "../types/user";

export const isUserAttendingEntry = (
  entry: TimetableEntry | undefined,
  isGroup: boolean,
): boolean => {
  if (!entry) return false;
  return isGroup ? (entry.pivot?.is_attending ?? false) : (entry.is_attending ?? false);
};

export const updateTimetableEntryAttendance = (
  timetable: Timetable,
  entryId: string,
  isAttending: boolean,
  count?: number,
  currentUser?: User | null,
  isGroup?: boolean,
): Timetable => {
  if (!timetable.entries) return timetable;

  return {
    ...timetable,
    entries: timetable.entries.map((entry) => {
      if (String(entry.id) === String(entryId)) {
        let newAttendees = entry.attendees ? [...entry.attendees] : [];
        if (isGroup && currentUser) {
          if (isAttending) {
            // Became attending
            if (!newAttendees.find((u) => u.id === currentUser.id)) {
              newAttendees.push({
                ...currentUser,
              });
            }
          } else {
            // Stopped attending
            newAttendees = newAttendees.filter((u) => u.id !== currentUser.id);
          }
        }

        const newPivot = entry.pivot
          ? {
              ...entry.pivot,
              is_attending: isAttending,
              attending_count:
                count !== undefined
                  ? count
                  : isAttending
                  ? (entry.pivot.attending_count || 0) + 1
                  : Math.max(0, (entry.pivot.attending_count || 0) - 1),
            }
          : undefined;

        const newCount =
          count !== undefined
            ? count
            : isAttending
            ? (entry.count || 0) + 1
            : Math.max(0, (entry.count || 0) - 1);

        return {
          ...entry,
          attendees: isGroup ? newAttendees : entry.attendees,
          is_attending: !isGroup ? isAttending : entry.is_attending,
          count: newCount,
          pivot: newPivot,
        };

      }
      return entry;
    }),
  };
};

export const updateGroupsCacheAttendance = (
  groups: Group[],
  groupId: string,
  timetableId: string,
  entryId: string,
  isAttending: boolean,
  count?: number,
  currentUser?: User | null,
): Group[] => {
  return groups.map((group) => {
    if (String(group.id) === String(groupId) && group.timetables) {
      return {
        ...group,
        timetables: group.timetables.map((t: Timetable) => {
          if (String(t.id) === String(timetableId)) {
            return updateTimetableEntryAttendance(
              t,
              entryId,
              isAttending,
              count,
              currentUser,
              true,
            );
          }
          return t;
        }),
      };
    }
    return group;
  });
};
