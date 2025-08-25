import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { toast } from "sonner";

const GET_TASK_COMMENTS = gql`
  query GET_TASK_COMMENTS($taskId: ID!) {
    taskComments(taskId: $taskId) {
      id
      content
      createdAt
      author { id email }
    }
  }
`;

const ADD_TASK_COMMENT = gql`
  mutation ADD_TASK_COMMENT($taskId: ID!, $content: String!) {
    addTaskComment(taskId: $taskId, content: $content) {
      comment { id content createdAt author { id email } }
    }
  }
`;

const UPDATE_TASK_COMMENT = gql`
  mutation UPDATE_TASK_COMMENT($id: ID!, $content: String!) {
    updateTaskComment(id: $id, content: $content) {
      comment { id content createdAt author { id email } }
    }
  }
`;

export function useTaskComments(taskId: string) {
  const { data, loading, error } = useQuery<{ taskComments: any[] }>(GET_TASK_COMMENTS, {
    variables: { taskId },
    skip: !taskId,
    fetchPolicy: "cache-and-network",
  });

  const [addMutation] = useMutation(ADD_TASK_COMMENT, {
    update(cache, { data }) {
      const created = data?.addTaskComment?.comment;
      if (!created) return;
      const prev = cache.readQuery<{ taskComments: any[] }>({ query: GET_TASK_COMMENTS, variables: { taskId } })?.taskComments ?? [];
      cache.writeQuery({ query: GET_TASK_COMMENTS, variables: { taskId }, data: { taskComments: [...prev, created] } });
    },
  });

  const [updateMutation] = useMutation(UPDATE_TASK_COMMENT);

  const addComment = async (content: string) => {
    const optimistic = { id: `temp-${Math.random()}`, content, createdAt: new Date().toISOString(), author: null, __typename: "TaskComment" };
    try {
      await addMutation({
        variables: { taskId, content },
        optimisticResponse: {
          addTaskComment: { __typename: "AddTaskComment", comment: optimistic },
        },
      });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to add comment");
      throw err;
    }
  };

  const updateComment = async (id: string, content: string) => {
    try {
      await updateMutation({
        variables: { id, content },
        optimisticResponse: {
          updateTaskComment: { __typename: "UpdateTaskComment", comment: { id, content, createdAt: new Date().toISOString(), author: null, __typename: "TaskComment" } },
        },
      });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update comment");
      throw err;
    }
  };

  return { comments: data?.taskComments ?? [], loading, error, addComment, updateComment };
}
