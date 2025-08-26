import { useState } from "react";
import { redirect, useNavigate } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { verify } from "~/lib/auth";
import { AuthError, AuthErrorCode } from "~/lib/errors";
import { useProjects } from "~/hooks/useProjects";
import { Button } from "~/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { Dialog, DialogFooter, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Layout } from "~/components/layout";
import { Pencil, ExternalLink, Plus } from "lucide-react";
import { toast } from "sonner";

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

export default function ProjectsPage() {
  const { projects, createProject, updateProject, error, loading } = useProjects();
  const navigate = useNavigate();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("ACTIVE");
  const [editDue, setEditDue] = useState("");
  const [saving, setSaving] = useState(false);
  
  // Create project state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const openEdit = (project: any) => {
    setEditingId(project.id);
    setEditName(project.name);
    setEditDescription(project.description ?? "");
    setEditStatus(project.status);
    
    // Handle date formatting for the date input
    if (project.dueDate) {
      const date = new Date(project.dueDate);
      if (!isNaN(date.getTime())) {
        setEditDue(date.toISOString().slice(0, 10));
      } else {
        setEditDue("");
      }
    } else {
      setEditDue("");
    }
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const currentProject = projects.find(p => p.id === editingId);
      if (!currentProject) return;

      const changes: any = {};
      
      // Only include fields that have changed
      if (editName !== currentProject.name) changes.name = editName;
      if (editDescription !== (currentProject.description ?? "")) changes.description = editDescription;
      if (editStatus !== currentProject.status) changes.status = editStatus;
      
      // Handle due date comparison
      let currentDueDate = "";
      if (currentProject.dueDate) {
        const date = new Date(currentProject.dueDate);
        if (!isNaN(date.getTime())) {
          currentDueDate = date.toISOString().slice(0, 10);
        }
      }
      
      if (editDue !== currentDueDate) {
        changes.dueDate = editDue || null;
      }

      // Only update if there are actual changes
      if (Object.keys(changes).length > 0) {
        await updateProject(editingId, changes);
      }
      
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateProject = async () => {
    if (!createName.trim()) return;
    setCreating(true);
    try {
      await createProject(createName.trim(), createDescription.trim() || undefined);
      setShowCreateDialog(false);
      setCreateName("");
      setCreateDescription("");
    } finally {
      setCreating(false);
    }
  };

  const openProject = (projectId: string) => {
    navigate(`/projects/${projectId}`);
  };

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
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Project
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
              {projects.map((project) => (
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
                        onClick={() => openEdit(project)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => openProject(project.id)}
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

        {/* Create Project Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle>{"Create New Project"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="createName">{"Name"}</Label>
                <Input
                  id="createName"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Project name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="createDescription">{"Description"}</Label>
                <Input
                  id="createDescription"
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="Project description (optional)"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateProject} disabled={creating || !createName.trim()}>
                {creating ? "Creating..." : "Create Project"}
              </Button>
            </DialogFooter>
          </div>
        </Dialog>

        {/* Edit Project Dialog */}
        <Dialog open={!!editingId} onOpenChange={(open) => !open && setEditingId(null)}>
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle>{"Edit Project"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{"Name"}</Label>
                <Input
                  id="name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Project name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">{"Description"}</Label>
                <Input
                  id="description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Project description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">{"Status"}</Label>
                <select 
                  value={editStatus} 
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="h-9 rounded-md border bg-background px-3 py-1 text-sm w-full"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="ON_HOLD">On Hold</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">{"Due Date"}</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={editDue}
                  onChange={(e) => setEditDue(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingId(null)}>
                Cancel
              </Button>
              <Button onClick={saveEdit} disabled={saving}>
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </div>
        </Dialog>
      </div>
    </Layout>
  );
}
