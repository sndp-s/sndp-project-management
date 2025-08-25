import { useMemo, useState } from "react";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import type { Project } from "~/types/types.projects";

const DEFAULT_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "ON_HOLD", label: "On hold" },
  { value: "COMPLETED", label: "Completed" },
];

export function ProjectList({
  projects,
  onUpdate,
}: {
  projects: Project[];
  onUpdate?: (
    id: string,
    patch: Partial<Pick<Project, "name" | "description" | "status">>
  ) => Promise<void> | void;
}) {
  if (!projects.length) return <p>No projects yet.</p>;

  const statusOptions = useMemo(() => DEFAULT_STATUS_OPTIONS, []);

  const [nameDrafts, setNameDrafts] = useState<Record<string, string>>({});
  const [descDrafts, setDescDrafts] = useState<Record<string, string>>({});
  const [statusDrafts, setStatusDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const handleSave = async (p: Project) => {
    if (!onUpdate) return;
    const patch: Partial<Pick<Project, "name" | "description" | "status">> = {};
    const name = nameDrafts[p.id] ?? p.name;
    const description = descDrafts[p.id] ?? p.description;
    const status = statusDrafts[p.id] ?? p.status;
    if (name !== p.name) patch.name = name;
    if (description !== p.description) patch.description = description;
    if (status !== p.status) patch.status = status;
    if (Object.keys(patch).length === 0) return;
    try {
      setSaving((s) => ({ ...s, [p.id]: true }));
      await onUpdate(p.id, patch);
    } finally {
      setSaving((s) => ({ ...s, [p.id]: false }));
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((p) => {
        const nameVal = nameDrafts[p.id] ?? p.name;
        const descVal = descDrafts[p.id] ?? p.description;
        const statusVal = statusDrafts[p.id] ?? p.status;
        const changed = nameVal !== p.name || descVal !== p.description || statusVal !== p.status;
        return (
          <Card key={p.id} className="p-4 flex flex-col gap-3">
            {onUpdate ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Input
                    value={nameVal}
                    onChange={(e) => setNameDrafts((d) => ({ ...d, [p.id]: e.target.value }))}
                    placeholder="Project name"
                    className="flex-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    value={descVal}
                    onChange={(e) => setDescDrafts((d) => ({ ...d, [p.id]: e.target.value }))}
                    placeholder="Description"
                    className="flex-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={statusVal}
                    onChange={(e) => setStatusDrafts((d) => ({ ...d, [p.id]: e.target.value }))}
                    className="h-9 rounded-md border bg-background px-3 py-1 text-sm"
                  >
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <Button
                    onClick={() => handleSave(p)}
                    disabled={!changed || saving[p.id]}
                  >
                    {saving[p.id] ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h3 className="font-semibold">{p.name}</h3>
                <p className="text-sm text-muted-foreground">{p.description}</p>
              </>
            )}

            <div className="mt-1">
              <span
                className={`inline-block text-xs px-2 py-1 rounded border ${
                  p.status === "ACTIVE"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : p.status === "COMPLETED"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {p.status}
              </span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
