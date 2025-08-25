import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import type { Task } from "~/types/types.tasks";
import { toast } from "sonner";

const GET_TASKS = gql`
  query GET_TASKS($projectId: ID!) {
    tasks(projectId: $projectId) {
      id
      title
      description
      status
      dueDate
      createdAt
      assignee { id email isActive }
    }
  }
`;

const CREATE_TASK = gql`
  mutation CREATE_TASK(
    $projectId: ID!
    $title: String!
    $description: String
    $status: String
    $assigneeEmail: String
    $dueDate: Date
  ) {
    createTask(
      projectId: $projectId
      title: $title
      description: $description
      status: $status
      assigneeEmail: $assigneeEmail
      dueDate: $dueDate
    ) {
      task {
        id
        title
        description
        status
        dueDate
        assignee { id email isActive }
      }
    }
  }
`;

const UPDATE_TASK = gql`
  mutation UPDATE_TASK(
    $id: ID!
    $title: String
    $description: String
    $status: String
    $assigneeEmail: String
    $dueDate: Date
  ) {
    updateTask(
      id: $id
      title: $title
      description: $description
      status: $status
      assigneeEmail: $assigneeEmail
      dueDate: $dueDate
    ) {
      task {
        id
        title
        description
        status
        dueDate
        assignee { id email isActive }
      }
    }
  }
`;

type GqlTask = Task & { __typename: "Task" };
type CreateTaskResponse = { createTask: { __typename: "CreateTask"; task: GqlTask } };
type CreateTaskVariables = {
  projectId: string;
  title: string;
  description?: string | null;
  status?: string | null;
  assigneeEmail?: string | null;
  dueDate?: string | null;
};

type UpdateTaskResponse = { updateTask: { __typename: "UpdateTask"; task: GqlTask } };
type UpdateTaskVariables = {
  id: string;
  title?: string | null;
  description?: string | null;
  status?: string | null;
  assigneeEmail?: string | null;
  dueDate?: string | null;
};

export function useTasks(projectId: string) {
  const { data, loading, error } = useQuery<{ tasks: Task[] }>(GET_TASKS, {
    variables: { projectId },
    skip: !projectId,
    fetchPolicy: "cache-and-network",
  });

  const [createMutation] = useMutation<CreateTaskResponse, CreateTaskVariables>(CREATE_TASK, {
    update(cache, { data }) {
      const created = data?.createTask?.task as Task | undefined;
      if (!created) return;
      const prev = cache.readQuery<{ tasks: Task[] }>({ query: GET_TASKS, variables: { projectId } })?.tasks ?? [];
      cache.writeQuery({
        query: GET_TASKS,
        variables: { projectId },
        data: { tasks: [...prev, created] },
      });
    },
  });

  const [updateMutation] = useMutation<UpdateTaskResponse, UpdateTaskVariables>(UPDATE_TASK, {
    update(cache, { data }) {
      const updated = data?.updateTask?.task as Task | undefined;
      if (!updated) return;
      const prev = cache.readQuery<{ tasks: Task[] }>({ query: GET_TASKS, variables: { projectId } })?.tasks ?? [];
      cache.writeQuery({
        query: GET_TASKS,
        variables: { projectId },
        data: { tasks: prev.map((t) => (t.id === updated.id ? updated : t)) },
      });
    },
  });

  const createTask = async (input: {
    title: string;
    description?: string;
    status?: string;
    assigneeEmail?: string;
    dueDate?: string;
  }) => {
    const optimistic: Task = {
      id: `temp-${Math.random()}`,
      title: input.title,
      description: input.description ?? "",
      status: input.status ?? "TODO",
      dueDate: input.dueDate ?? null,
      assignee: null,
    };

    try {
      await createMutation({
        variables: { projectId, ...input },
        optimisticResponse: {
          createTask: {
            __typename: "CreateTask",
            task: { __typename: "Task", ...optimistic },
          },
        },
      });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to create task");
      throw err;
    }
  };

  const updateTask = async (
    id: string,
    patch: Partial<Pick<Task, "title" | "description" | "status">> & {
      assigneeEmail?: string;
      dueDate?: string | null;
    }
  ) => {
    const current = data?.tasks.find((t) => t.id === id);
    const optimisticTask: GqlTask = {
      __typename: "Task",
      id,
      title: patch.title ?? current?.title ?? "",
      description: patch.description ?? current?.description ?? "",
      status: patch.status ?? current?.status ?? "TODO",
      dueDate: patch.dueDate ?? current?.dueDate ?? null,
      assignee: current?.assignee ?? null,
      project: current?.project,
    };
    try {
      await updateMutation({
        variables: { id, ...patch },
        optimisticResponse: {
          updateTask: {
            __typename: "UpdateTask",
            task: optimisticTask,
          },
        },
      });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update task");
      throw err;
    }
  };

  return {
    tasks: data?.tasks ?? [],
    loading,
    error,
    createTask,
    updateTask,
  };
}


