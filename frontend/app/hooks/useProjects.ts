import { useState, useEffect } from "react";
import { authClient } from "~/lib/apollo";
import { gql } from "@apollo/client";
import type { ProjectError } from "~/lib/errors";
import type { Project } from "~/types/types.projects";

const GET_PROJECTS = gql`
  query GET_PROJECTS {
    projects {
      id
      name
      description
      status
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
      }
    }
  }
`;

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ProjectError | null>(null);

  // fetch projects
  useEffect(() => {
    authClient
      .query<{ projects: (Project | null)[] }>({
        query: GET_PROJECTS,
        fetchPolicy: "network-only",
      })
      .then((res) => {
        const safeProjects = res.data?.projects
          .filter((p): p is Project => p !== null)
          .map((p) => ({
            ...p,
            description: p.description ?? "", // ensure description is string
          }));
        setProjects(safeProjects ?? []);
      })
      .catch((err) => {
        setError({ type: "FETCH", message: "Failed to load projects" });
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, []);

  const createProject = async (name: string, description?: string) => {
    const tempId = `temp-${Math.random()}`;
    const tempProject: Project = {
      id: tempId,
      name,
      description: description ?? "", // ensure string
      status: "NEW",
    };
    setProjects((prev) => [...prev, tempProject]);

    try {
      const { data } = await authClient.mutate<{
        createProject: { project: Project };
      }>({
        mutation: CREATE_PROJECT,
        variables: { name, description },
      });

      if (!data?.createProject?.project) throw new Error("No project returned");

      const created = data.createProject.project;

      // normalize undefined description
      const finalProject: Project = {
        ...created,
        description: created.description ?? "",
      };

      // replace temp project with actual project
      setProjects((prev) =>
        prev.map((p) => (p.id === tempId ? finalProject : p))
      );
    } catch (err) {
      setProjects((prev) => prev.filter((p) => p.id !== tempId));
      setError({ type: "CREATE", message: "Failed to create project" });
      throw err;
    }
  };

  return { projects, loading, error, createProject };
}
