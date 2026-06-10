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
};

type TaskRowProps = React.ComponentProps<typeof TaskRow>;

export default function PersonalTasksSection({
  tasks,
  locale,
  ...props
}: {
  tasks: TaskRowProps[];
  locale: Locale;
  children?: React.ReactNode;
}) {
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  if (editingTask) {
    return <EditPersonalTask task={editingTask} locale={locale} onClose={() => setEditingTask(null)} />;
  }

  return (
    <>
      {tasks.map((taskProps) => (
        <TaskRow
          key={taskProps.task.id}
          {...taskProps}
          locale={locale}
          onEdit={(task) =>
            setEditingTask({
              id: task.id,
              title: task.title,
              description: task.description,
              frequency: task.frequency,
              target_per_milestone: taskProps.target,
            })
          }
        />
      ))}
    </>
  );
}
