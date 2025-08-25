import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/login", "routes/login.tsx"),
  route("/network-error", "routes/network-error.tsx"),
  route("/projects", "routes/projects.tsx"),
  route("/projects/:projectId", "routes/project.$projectId.tsx"),
  route("/projects/:projectId/tasks/:taskId", "routes/task.$taskId.tsx"),
] satisfies RouteConfig;
