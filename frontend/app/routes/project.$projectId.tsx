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
import { useTasks } from "~/hooks/useTasks";
import { useState } from "react";
import { Layout } from "~/components/layout";

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
      tasks {
        id
        title
        description
        status
        dueDate
        createdAt
        assignee { id email isActive }
      }
    }
  }
`;

export default function ProjectDetailsPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId!;

  const { data, loading, error } = useQuery<{ project: { id: string; name: string; description: string; status: string; tasks: any[] } }>(GET_PROJECT, {
    variables: { id: projectId },
    fetchPolicy: "cache-and-network",
  });

  const project = data?.project;

  return (
    <Layout>
      <div className="space-y-6">
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-600">{String(error)}</p>}
        {project && (
          <>
            <Card className="p-4 space-y-1">
              <h2 className="text-xl font-semibold">{project.name}</h2>
              <p className="text-muted-foreground">{project.description}</p>
              <div>
                <span className="text-xs inline-block px-2 py-1 rounded border">
                  {project.status}
                </span>
              </div>
            </Card>

            <TasksSection projectId={project.id} tasks={project.tasks ?? []} />
          </>
        )}
      </div>
    </Layout>
  );
}

function TasksSection({ projectId, tasks }: { projectId: string; tasks: any[] }) {
  const { tasks: liveTasks, createTask } = useTasks(projectId);
  const list = liveTasks.length ? liveTasks : tasks;
  const navigate = useNavigate();
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Tasks</h3>
      <CreateTaskForm projectId={projectId} onCreate={createTask} />
      <TaskGrid tasks={list} projectId={projectId} onOpenTask={(id) => navigate(`/projects/${projectId}/tasks/${id}`)} />
    </div>
  );
}

function CreateTaskForm({ projectId, onCreate }: { projectId: string; onCreate: (input: { title: string; description?: string; status?: string; assigneeEmail?: string; dueDate?: string }) => Promise<void> }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("TODO");
  const [dueDate, setDueDate] = useState("");
  const [assigneeEmail, setAssigneeEmail] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await onCreate({ title, description: description || undefined, status, assigneeEmail: assigneeEmail || undefined, dueDate: dueDate || undefined });
      setTitle("");
      setDescription("");
      setStatus("TODO");
      setDueDate("");
      setAssigneeEmail("");
    } finally {
      setCreating(false);
    }
  };

  return (
    <form onSubmit={handleCreate} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 items-start">
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" required />
      <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
      <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 rounded-md border bg-background px-3 py-1 text-sm">
        <option value="TODO">TODO</option>
        <option value="IN_PROGRESS">IN_PROGRESS</option>
        <option value="DONE">DONE</option>
      </select>
      <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} placeholder="Due date" />
      <Input value={assigneeEmail} onChange={(e) => setAssigneeEmail(e.target.value)} placeholder="Assignee email (optional)" />
      <Button type="submit" disabled={creating} className="sm:col-span-2 lg:col-span-1">{creating ? "Creating..." : "Add Task"}</Button>
    </form>
  );
}

function TaskGrid({ tasks, projectId, onOpenTask }: { tasks: any[]; projectId: string; onOpenTask: (id: string) => void }) {
  const { updateTask } = useTasks(projectId);
  const [drafts, setDrafts] = useState<Record<string, { title: string; description: string; status: string }>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const getDraft = (t: any) => drafts[t.id] ?? { title: t.title, description: t.description ?? "", status: t.status };

  const handleSave = async (t: any) => {
    const d = getDraft(t);
    const patch: any = {};
    if (d.title !== t.title) patch.title = d.title;
    if ((d.description ?? "") !== (t.description ?? "")) patch.description = d.description;
    if (d.status !== t.status) patch.status = d.status;
    if (Object.keys(patch).length === 0) return;
    try {
      setSaving((s) => ({ ...s, [t.id]: true }));
      await updateTask(t.id, patch);
    } finally {
      setSaving((s) => ({ ...s, [t.id]: false }));
    }
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {tasks.map((t) => {
        const d = getDraft(t);
        const changed = d.title !== t.title || (d.description ?? "") !== (t.description ?? "") || d.status !== t.status;
        return (
          <Card key={t.id} className="p-4 space-y-2">
            <Input value={d.title} onChange={(e) => setDrafts((prev) => ({ ...prev, [t.id]: { ...d, title: e.target.value } }))} />
            <Input value={d.description} onChange={(e) => setDrafts((prev) => ({ ...prev, [t.id]: { ...d, description: e.target.value } }))} placeholder="Description" />
            <div className="flex items-center gap-2">
              <select
                value={d.status}
                onChange={(e) => setDrafts((prev) => ({ ...prev, [t.id]: { ...d, status: e.target.value } }))}
                className="h-9 rounded-md border bg-background px-3 py-1 text-sm"
              >
                <option value="TODO">TODO</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="DONE">DONE</option>
              </select>
              <Button onClick={() => handleSave(t)} disabled={!changed || saving[t.id]}>
                {saving[t.id] ? "Saving..." : "Save"}
              </Button>
              <Button variant="secondary" onClick={() => onOpenTask(t.id)}>Open</Button>
            </div>
            <div className="text-xs text-muted-foreground">
              <span>Status: {t.status}</span>
              {t.createdAt && <span className="ml-2">Created: {new Date(t.createdAt).toLocaleString()}</span>}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
