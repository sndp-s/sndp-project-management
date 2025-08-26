import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import type { ProjectError } from "~/lib/errors";
import type { Project } from "~/types/types.projects";
import { toast } from "sonner";

const GET_PROJECTS = gql`
  query GET_PROJECTS {
    projects {
      id
      name
      description
      status
      dueDate
      createdAt
    }
  }
`;

const CREATE_PROJECT = gql`
  mutation CreateProject($name: String!, $description: String) {
    createProject(name: $name, description: $description, status: "ACTIVE") {
      project {
        id
        name
        description
        status
        dueDate
        createdAt
      }
    }
  }
`;

const UPDATE_PROJECT = gql`
  mutation UpdateProject(
    $id: ID!
    $name: String
    $description: String
    $status: String
    $dueDate: String
  ) {
    updateProject(
      id: $id
      name: $name
      description: $description
      status: $status
      dueDate: $dueDate
    ) {
      project {
        id
        name
        description
        status
        dueDate
        createdAt
      }
    }
  }
`;

export function useProjects() {
  const { data, loading, error } = useQuery<{ projects: Project[] }>(
    GET_PROJECTS,
    {
      fetchPolicy: "cache-and-network",
    }
  );

  const [createMutation] = useMutation<{ createProject: { project: Project } }>(CREATE_PROJECT, {
    update(cache, { data }) {
      const created = data?.createProject?.project as Project | undefined;
      if (!created) return;
      const prev =
        cache.readQuery<{ projects: Project[] }>({ query: GET_PROJECTS })
          ?.projects ?? [];
      cache.writeQuery({
        query: GET_PROJECTS,
        data: {
          projects: [
            ...prev,
            { ...created, description: created.description ?? "" },
          ],
        },
      });
    },
  });

  const [updateMutation] = useMutation<{ updateProject: { project: Project } }>(UPDATE_PROJECT, {
    update(cache, { data }) {
      const updated = data?.updateProject?.project as Project | undefined;
      if (!updated) return;
      const prev =
        cache.readQuery<{ projects: Project[] }>({ query: GET_PROJECTS })
          ?.projects ?? [];
      cache.writeQuery({
        query: GET_PROJECTS,
        data: {
          projects: prev.map((p) =>
            p.id === updated.id
              ? { ...updated, description: updated.description ?? "" }
              : p
          ),
        },
      });
    },
  });

  const createProject = async (name: string, description?: string) => {
    const optimistic: Project = {
      id: `temp-${Math.random()}`,
      name,
      description: description ?? "",
      status: "ACTIVE",
    };

    try {
      await createMutation({
        variables: { name, description },
        optimisticResponse: {
          createProject: {
            __typename: "CreateProject",
            project: { __typename: "Project", ...optimistic },
          },
        },
      });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to create project");
      throw err;
    }
  };

  const updateProject = async (
    id: string,
    patch: Partial<Pick<Project, "name" | "description" | "status" | "dueDate">>
  ) => {
    const current = data?.projects.find((p) => p.id === id);
    const optimistic = current ? { ...current, ...patch } : { id, ...patch };
    try {
      await updateMutation({
        variables: { id, ...patch },
        optimisticResponse: {
          updateProject: {
            __typename: "UpdateProject",
            project: { __typename: "Project", ...optimistic },
          },
        },
      });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update project");
      throw err;
    }
  };

  return {
    projects: (data?.projects ?? []).map((p) => ({
      ...p,
      description: p.description ?? "",
    })),
    loading,
    error: error
      ? ({ type: "FETCH", message: "Failed to load projects" } as ProjectError)
      : null,
    createProject,
    updateProject,
  };
}
