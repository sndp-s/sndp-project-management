import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useNavigate, useParams } from "react-router";
import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { verify } from "~/lib/auth";
import { AuthError, AuthErrorCode } from "~/lib/errors";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Dialog, DialogFooter, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { Layout } from "~/components/layout";
import { useTasks } from "~/hooks/useTasks";
import { useProjects } from "~/hooks/useProjects";
import { useMemo, useState } from "react";
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

const GET_PROJECT = gql`
  query GET_PROJECT($id: ID!) {
    project(id: $id) {
      id
      name
      description
      status
      dueDate
      createdAt
      tasks {
        id
        title
        status
        dueDate
        createdAt
        assignee { id email isActive }
      }
    }
  }
`;

const GET_PROJECT_STATS = gql`
  query GET_PROJECT_STATS($projectId: ID!) {
    projectStats(projectId: $projectId) {
      totalTasks
      completedTasks
      completionRate
    }
  }
`;

export default function ProjectDetailsPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId!;
  const navigate = useNavigate();

  const { data, loading, error } = useQuery<{ project: any }>(GET_PROJECT, {
    variables: { id: projectId },
    fetchPolicy: "cache-and-network",
  });

  const { data: statsData } = useQuery<{ projectStats: { totalTasks: number; completedTasks: number; completionRate: number } }>(GET_PROJECT_STATS, {
    variables: { projectId },
    fetchPolicy: "cache-and-network",
    skip: !projectId,
  });

  const project = data?.project;
  const stats = statsData?.projectStats;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="secondary" onClick={() => navigate(-1)}>Back</Button>
        </div>
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-600">{String(error)}</p>}
        {project && (
          <>
            <ProjectHeader project={project} stats={stats} />
            <TasksSection projectId={project.id} tasks={project.tasks ?? []} onOpenTask={(id) => navigate(`/projects/${projectId}/tasks/${id}`)} />
          </>
        )}
      </div>
    </Layout>
  );
}

function ProjectHeader({ project, stats }: { project: any; stats?: { totalTasks: number; completedTasks: number; completionRate: number } }) {
  const { updateProject } = useProjects();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(project.name ?? "");
  const [description, setDescription] = useState(project.description ?? "");
  const [status, setStatus] = useState(project.status ?? "ACTIVE");
  const [due, setDue] = useState(() => {
    if (!project.dueDate) return "";
    const d = new Date(project.dueDate);
    return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
  });
  const createdAt = useMemo(() => project.createdAt ? new Date(project.createdAt).toLocaleString() : "-", [project.createdAt]);

  const save = async () => {
    const changes: any = {};
    if (name !== project.name) changes.name = name;
    if ((description ?? "") !== (project.description ?? "")) changes.description = description;
    if (status !== project.status) changes.status = status;
    const currentDue = project.dueDate ? (() => { const d = new Date(project.dueDate); return isNaN(d.getTime()) ? "" : d.toISOString().slice(0,10); })() : "";
    if (due !== currentDue) changes.dueDate = due || null;

    if (Object.keys(changes).length === 0) {
      setOpen(false);
      return;
    }
    try {
      await updateProject(project.id, changes);
      toast.success("Project updated");
      setOpen(false);
    } catch {}
  };

  return (
    <Card className="p-6 space-y-5">
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold leading-tight">{project.name}</h2>
          {project.description && <p className="text-sm text-muted-foreground leading-relaxed">{project.description}</p>}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {project.dueDate && <span>Due: {new Date(project.dueDate).toLocaleDateString()}</span>}
            {project.createdAt && <span>Created: {createdAt}</span>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-3">
          <span className="inline-block px-2 py-0.5 rounded border text-xs">{project.status}</span>
          <Button onClick={() => setOpen(true)} size="sm">Edit Project</Button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Total Tasks</div>
            <div className="text-lg font-semibold">{stats.totalTasks}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Completed</div>
            <div className="text-lg font-semibold">{stats.completedTasks}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Completion</div>
            <div className="text-lg font-semibold">{Math.min(100, Math.max(0, Math.round(stats.completionRate ?? 0)))}%</div>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <div className="space-y-4">
          <DialogHeader>
            <DialogTitle>{"Edit Project"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pname">Name</Label>
              <Input id="pname" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pstatus">Status</Label>
              <select id="pstatus" value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 rounded-md border bg-background px-3 py-1 text-sm w-full">
                <option value="ACTIVE">ACTIVE</option>
                <option value="ON_HOLD">ON_HOLD</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="pdesc">Description</Label>
              <textarea id="pdesc" value={description} onChange={(e) => setDescription(e.target.value)} rows={5} className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-y" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="pdue">Due Date</Label>
              <Input id="pdue" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </div>
      </Dialog>
    </Card>
  );
}

function TasksSection({ projectId, tasks, onOpenTask }: { projectId: string; tasks: any[]; onOpenTask: (id: string) => void }) {
  const { tasks: liveTasks, createTask } = useTasks(projectId);
  const list = liveTasks.length ? liveTasks : tasks;

  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("TODO");
  const [dueDate, setDueDate] = useState("");
  const [assigneeEmail, setAssigneeEmail] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await createTask({ title, status, dueDate: dueDate || undefined, assigneeEmail: assigneeEmail || undefined });
      setCreateOpen(false);
      setTitle("");
      setStatus("TODO");
      setDueDate("");
      setAssigneeEmail("");
      toast.success("Task created");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Tasks</h3>
        <Button onClick={() => setCreateOpen(true)}>New Task</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{"Title"}</TableHead>
              <TableHead>{"Status"}</TableHead>
              <TableHead>{"Assignee"}</TableHead>
              <TableHead>{"Due"}</TableHead>
              <TableHead>{"Created"}</TableHead>
              <TableHead className="text-right">{"Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.title}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    t.status === 'TODO' ? 'bg-gray-100 text-gray-800' :
                    t.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {t.status}
                  </span>
                </TableCell>
                <TableCell>{t.assignee?.email ?? '-'}</TableCell>
                <TableCell>{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '-'}</TableCell>
                <TableCell>{t.createdAt ? new Date(t.createdAt).toLocaleString() : '-'}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => onOpenTask(t.id)}>Open</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <div className="space-y-4">
          <DialogHeader>
            <DialogTitle>{"Create Task"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="t-title">Title</Label>
              <Input id="t-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-status">Status</Label>
              <select id="t-status" value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 rounded-md border bg-background px-3 py-1 text-sm w-full">
                <option value="TODO">TODO</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="DONE">DONE</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-assignee">Assignee Email</Label>
              <Input id="t-assignee" value={assigneeEmail} onChange={(e) => setAssigneeEmail(e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="t-due">Due Date</Label>
              <Input id="t-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating || !title.trim()}>{creating ? "Creating..." : "Create"}</Button>
          </DialogFooter>
        </div>
      </Dialog>
    </div>
  );
}
