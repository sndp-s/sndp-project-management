import { Card } from "~/components/ui/card";
import type { Project } from "~/types/types.projects";

export function ProjectList({ projects }: { projects: Project[] }) {
  if (!projects.length) return <p>No projects yet.</p>;

  return (
    <div className="grid gap-4">
      {projects.map(p => (
        <Card key={p.id} className="p-4">
          <h3 className="font-semibold">{p.name}</h3>
          <p className="text-sm text-gray-600">{p.description}</p>
          <span
            className={`inline-block mt-2 text-xs px-2 py-1 rounded ${p.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
              }`}
          >
            {p.status}
          </span>
        </Card>
      ))}
    </div>
  );
}
