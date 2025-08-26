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
import { Pencil } from "lucide-react";

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
        <div className="flex items-center justify-between">
          <Button variant="secondary" onClick={() => navigate(-1)}>Back</Button>
          {task?.project?.name && <div className="text-sm text-muted-foreground">Project: {task.project.name}</div>}
        </div>
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-600">{String(error)}</p>}
        {task && (
          <Card className="p-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="title">Title</label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="status">Status</label>
                <select id="status" value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 rounded-md border bg-background px-3 py-1 text-sm w-full">
                  <option value="TODO">TODO</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="DONE">DONE</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="due">Due Date</label>
                <Input id="due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="assignee">Assignee Email</label>
                <Input id="assignee" value={assigneeEmail} onChange={(e) => setAssigneeEmail(e.target.value)} placeholder="email@example.com" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium" htmlFor="desc">Description</label>
                <textarea
                  id="desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-y"
                  placeholder="Write a detailed description..."
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              {task.createdAt && <span>Created: {new Date(task.createdAt).toLocaleString()}</span>}
            </div>
            <div className="flex justify-end">
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
  const [editing, setEditing] = useState<Record<string, boolean>>({});
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

  const startEdit = (id: string, current: string) => {
    setEditing((s) => ({ ...s, [id]: true }));
    setEditDrafts((d) => ({ ...d, [id]: current }));
  };

  const handleEdit = async (id: string, original: string) => {
    const content = (editDrafts[id] ?? "").trim();
    if (!content || content === original) return;
    setSaving((s) => ({ ...s, [id]: true }));
    try {
      await onEdit(id, content);
      setEditing((s) => ({ ...s, [id]: false }));
    } catch {}
    setSaving((s) => ({ ...s, [id]: false }));
  };

  return (
    <Card className="p-6 space-y-3">
      <h3 className="text-lg font-medium">Comments</h3>
      <form onSubmit={handleAdd} className="flex flex-col gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-y"
          placeholder="Write a comment"
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={adding || !draft.trim()}>{adding ? "Adding..." : "Add"}</Button>
        </div>
      </form>
      <div className="space-y-2">
        {comments.map((c) => {
          const isEditing = !!editing[c.id];
          const currentDraft = editDrafts[c.id] ?? c.content;
          const changed = currentDraft.trim() !== (c.content ?? "").trim();
          return (
            <div key={c.id} className="flex flex-col gap-2 border rounded p-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  <span>{c.author?.email ?? "Unknown"}</span>
                  <span className="ml-2">{new Date(c.createdAt).toLocaleString()}</span>
                </div>
                {!isEditing && (
                  <button className="p-1 rounded hover:bg-muted" onClick={() => startEdit(c.id, c.content)} aria-label="Edit">
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
              </div>
              {isEditing ? (
                <>
                  <textarea
                    value={currentDraft}
                    onChange={(e) => setEditDrafts((prev) => ({ ...prev, [c.id]: e.target.value }))}
                    rows={3}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-y"
                  />
                  <div className="flex justify-end">
                    <Button size="sm" onClick={() => handleEdit(c.id, c.content)} disabled={!changed || !!saving[c.id]}>
                      {saving[c.id] ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-sm whitespace-pre-wrap">{c.content}</div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}


