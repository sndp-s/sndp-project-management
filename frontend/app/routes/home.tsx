import { redirect } from "react-router";
import type { Route } from "./+types/home";
import type { LoaderFunctionArgs } from "react-router";
import { verify } from "~/lib/auth";
import { AuthError, AuthErrorCode } from "~/lib/errors";
import { useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Layout } from "~/components/layout";
import { useProjects } from "~/hooks/useProjects";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { ExternalLink, Plus } from "lucide-react";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "SNDP Project Management" },
    { name: "description", content: "Project Management System Mini Project" },
  ];
}

export async function clientLoader({ }: LoaderFunctionArgs) {
  const token = localStorage.getItem("token");

  if (!token) {
    throw redirect("/login");
  }

  try {
    await verify(token)
  } catch (err) {
    if (err instanceof AuthError) {
      if (
        err.code === AuthErrorCode.EXPIRED ||
        err.code === AuthErrorCode.INVALID
      ) {
        localStorage.removeItem("token");
        throw redirect("/login");
      } else if (
        err.code === AuthErrorCode.UNKNOWN ||
        err.code === AuthErrorCode.NETWORK
      ) {
        throw redirect("/network-error");
      }
    }
  }
  return null;
}

export default function HomePage() {
  const navigate = useNavigate();
  const { projects, loading, error } = useProjects();

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-red-600">{error.message}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <Button onClick={() => navigate("/projects")} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            View All Projects
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{"Name"}</TableHead>
                <TableHead>{"Status"}</TableHead>
                <TableHead>{"Due Date"}</TableHead>
                <TableHead>{"Created"}</TableHead>
                <TableHead className="text-right">{"Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.slice(0, 5).map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      project.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                      project.status === 'ON_HOLD' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {project.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell>
                    {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/projects/${project.id}`)}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {projects.length === 0 && (
          <Card className="p-8 text-center">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">No projects yet</h3>
              <p className="text-muted-foreground">Get started by creating your first project.</p>
              <Button onClick={() => navigate("/projects")}>Create Project</Button>
            </div>
          </Card>
        )}

        {projects.length > 5 && (
          <div className="text-center">
            <Button variant="outline" onClick={() => navigate("/projects")}>
              View All {projects.length} Projects
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
