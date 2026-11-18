export type Task = {
  id?: string;
  title: string;
  description: string | null;
  frequency: "daily" | "selected_days";
  weekdays: number[];
  timezone: string;
};

export type Challenge = {
  id: string;
  title: string;
  description: string;
  category: string | null;
  visibility: "public" | "private";
  startDate: string;
  endDate: string | null;
  tasks: Task[];
};