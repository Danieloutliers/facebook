export interface Task {
  id: string;
  title: string;
  date: Date;
  completed: boolean;
  createdAt: Date;
}

export type NewTask = Omit<Task, 'id' | 'createdAt'>;
