import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sin acceso" };

export default function NotAllowedPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4 text-center">
      <h1 className="text-2xl font-bold">Sin acceso</h1>
      <p className="text-muted">
        Tu cuenta ya no está en la lista de autorizados del grupo. Si crees que es un error, habla con el Admin.
      </p>
      <form action="/auth/signout" method="post">
        <button type="submit" className="btn-secondary w-full">
          Cerrar sesión
        </button>
      </form>
    </main>
  );
}
