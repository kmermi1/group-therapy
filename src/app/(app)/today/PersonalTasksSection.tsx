"use client";

import { useState } from "react";
import TaskRow from "./TaskRow";
import EditPersonalTask from "./EditPersonalTask";
import { type Locale } from "@/lib/i18n";

type Task = {
  id: string;
  title: string;
  description: string | null;
  frequency: "once" | "daily" | "weekly";
  target_per_milestone: number;
  deadline?: string | null;
};

type TaskWithUI = Task & {
  count: number;
  target: number;
  isLongTerm?: boolean;
  isWeekly?: boolean;
  doneThisWeek?: boolean;
  doneToday: boolean;
  forDate: string;
  imageUrl?: string;
  badgeText: string;
  badgeClass: string;
};

export default function PersonalTasksSection({
  tasks,
  locale,
}: {
  tasks: TaskWithUI[];
  locale: Locale;
}) {
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  if (editingTask) {
    return <EditPersonalTask task={editingTask} locale={locale} onClose={() => setEditingTask(null)} />;
  }

  return (
    <ul className="space-y-3">
      {tasks.map((t) => (
        <TaskRow
          key={t.id}
          task={t}
          doneToday={t.doneToday}
          count={t.count}
          target={t.target}
          isLongTerm={t.isLongTerm}
          isWeekly={t.isWeekly}
          doneThisWeek={t.doneThisWeek}
          forDate={t.forDate}
          imageUrl={t.imageUrl}
          badgeText={t.badgeText}
          badgeClass={t.badgeClass}
          canDelete={true}
          locale={locale}
          onEdit={(task) =>
            setEditingTask({
              id: task.id,
              title: task.title,
              description: task.description,
              frequency: task.frequency,
              target_per_milestone: t.target,
              deadline: task.deadline,
            })
          }
        />
      ))}
    </ul>
  );
}
