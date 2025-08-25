export interface UserRef {
  id: string;
  email: string;
  isActive: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  dueDate?: string | null;
  createdAt?: string | null;
  assignee?: UserRef | null;
  project?: {
    id: string;
    name: string;
    description: string;
    status: string;
  };
}
