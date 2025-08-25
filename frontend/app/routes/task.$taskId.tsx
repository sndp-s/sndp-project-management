import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useParams, useNavigate } from "react-router";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useEffect, useState } from "react";
import { useTasks } from "~/hooks/useTasks";
import { toast } from "sonner";

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
    }
  }
`;

export default function TaskDetailsPage() {
  const params = useParams<{ projectId: string; taskId: string }>();
  const navigate = useNavigate();
  const projectId = params.projectId!;
  const taskId = params.taskId!;
  const { updateTask } = useTasks(projectId);

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
    </div>
  );
}


