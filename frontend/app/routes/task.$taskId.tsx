import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useParams, useNavigate } from "react-router";
import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { verify } from "~/lib/auth";
import { AuthError, AuthErrorCode } from "~/lib/errors";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useEffect, useState } from "react";
import { useTasks } from "~/hooks/useTasks";
import { toast } from "sonner";
import { useTaskComments } from "~/hooks/useTaskComments";
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

const GET_TASK = gql`
  query GET_TASK($id: ID!) {
    task(id: $id) {
      id
      title
      description
      status
      dueDate
      createdAt
      assignee { id email isActive }
      project { id name }
      comments { id content createdAt author { id email } }
    }
  }
`;

export default function TaskDetailsPage() {
  const params = useParams<{ projectId: string; taskId: string }>();
  const navigate = useNavigate();
  const projectId = params.projectId!;
  const taskId = params.taskId!;
  const { updateTask } = useTasks(projectId);
  const { comments, addComment, updateComment } = useTaskComments(taskId);

  const { data, loading, error, refetch } = useQuery(GET_TASK, {
    variables: { id: taskId },
    fetchPolicy: "cache-and-network",
  });

  const task = data?.task;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("TODO");
  const [dueDate, setDueDate] = useState("");
  const [assigneeEmail, setAssigneeEmail] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title ?? "");
      setDescription(task.description ?? "");
      setStatus(task.status ?? "TODO");
      setDueDate(task.dueDate ? String(task.dueDate).slice(0, 10) : "");
      setAssigneeEmail(task.assignee?.email ?? "");
    }
  }, [task]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateTask(taskId, {
        title,
        description,
        status,
        assigneeEmail: assigneeEmail || undefined,
        dueDate: dueDate || null,
      });
      toast.success("Task updated");
      await refetch();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update task");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <Button variant="secondary" onClick={() => navigate(-1)}>Back</Button>
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-600">{String(error)}</p>}
        {task && (
          <Card className="p-4 space-y-3">
            <div className="text-sm text-muted-foreground">Project: {task.project?.name}</div>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
            <div className="flex items-center gap-2">
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 rounded-md border bg-background px-3 py-1 text-sm">
                <option value="TODO">TODO</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="DONE">DONE</option>
              </select>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <Input value={assigneeEmail} onChange={(e) => setAssigneeEmail(e.target.value)} placeholder="Assignee email" />
            {task.createdAt && (
              <div className="text-xs text-muted-foreground">Created: {new Date(task.createdAt).toLocaleString()}</div>
            )}
            <div>
              <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
            </div>
          </Card>
        )}

        <CommentsSection comments={comments} onAdd={addComment} onEdit={updateComment} />
      </div>
    </Layout>
  );
}

function CommentsSection({ comments, onAdd, onEdit }: { comments: any[]; onAdd: (content: string) => Promise<void>; onEdit: (id: string, content: string) => Promise<void> }) {
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const [editDrafts, setEditDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setAdding(true);
    try {
      await onAdd(draft.trim());
      setDraft("");
    } catch {}
    setAdding(false);
  };

  const handleEdit = async (id: string) => {
    const content = (editDrafts[id] ?? "").trim();
    if (!content) return;
    setSaving((s) => ({ ...s, [id]: true }));
    try {
      await onEdit(id, content);
    } catch {}
    setSaving((s) => ({ ...s, [id]: false }));
  };

  return (
    <Card className="p-4 space-y-3">
      <h3 className="text-lg font-medium">Comments</h3>
      <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2">
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a comment" />
        <Button type="submit" disabled={adding}>{adding ? "Adding..." : "Add"}</Button>
      </form>
      <div className="space-y-2">
        {comments.map((c) => (
          <div key={c.id} className="flex flex-col gap-2 border rounded p-3">
            <div className="text-xs text-muted-foreground">
              <span>{c.author?.email ?? "Unknown"}</span>
              <span className="ml-2">{new Date(c.createdAt).toLocaleString()}</span>
            </div>
            <Input
              value={editDrafts[c.id] ?? c.content}
              onChange={(e) => setEditDrafts((prev) => ({ ...prev, [c.id]: e.target.value }))}
            />
            <div>
              <Button onClick={() => handleEdit(c.id)} disabled={saving[c.id]}>{saving[c.id] ? "Saving..." : "Save"}</Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}


