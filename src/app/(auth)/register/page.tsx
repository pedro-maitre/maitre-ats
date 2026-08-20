import { redirect } from "next/navigation";

export default function RegisterPage() {
  // Public user registration is disabled for internal roles.
  // Candidates register through the career portal.
  redirect("/carreiras/maitre/candidato/cadastro");
}
