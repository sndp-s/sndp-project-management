export interface UserRef {
  id: string;
  email: string;
  isActive: boolean;
}

export interface TaskComment {
  id: string;
  content: string;
  createdAt: string;
  author?: UserRef | null;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  dueDate?: string | null;
  createdAt?: string | null;
  assignee?: UserRef | null;
  comments?: TaskComment[];
  project?: {
    id: string;
    name: string;
    description: string;
    status: string;
  };
}
