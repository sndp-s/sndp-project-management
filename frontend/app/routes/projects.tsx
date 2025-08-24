import { useProjects } from "~/hooks/useProjects";
import { ProjectList } from "~/components/projects/project-list";
import { ProjectForm } from "~/components/projects/project-form";

export default function ProjectsPage() {
  const { projects, createProject, error, loading } = useProjects();

  return (
    <div className="space-y-6">
      <ProjectForm onSubmit={createProject} />
      {error && <p className="text-red-600">{error.message}</p>}
      {loading ? <p>Loading...</p> : <ProjectList projects={projects} />}
    </div>
  );
}
