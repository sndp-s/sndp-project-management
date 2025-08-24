import { redirect } from "react-router";
import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import type { LoaderFunctionArgs } from "react-router";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "SNDP Project Management" },
    { name: "description", content: "Project Management System Mini Project" },
  ];
}

export async function clientLoader({ }: LoaderFunctionArgs) {
  const token = localStorage.getItem("token");

  // TODO: verify token

  if (!token) {
    throw redirect("/login");
  }
  return null;
}

export default function Home() {
  // TODO: wire dashboard here
  return <Welcome />;
}
