import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacidad",
  description: "Qué datos guarda alvaro2b y para qué.",
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-10 leading-relaxed">
      <header className="space-y-1">
        <p className="text-sm text-muted">
          <Link href="/" className="underline">alvaro2b</Link>
        </p>
        <h1 className="text-3xl sm:text-4xl">Política de privacidad</h1>
        <p className="text-sm text-muted">Última actualización: 20 de octubre de 2026</p>
      </header>

      <section className="space-y-2">
        <h2 className="text-xl">Qué es alvaro2b</h2>
        <p>
          alvaro2b es una aplicación privada y sin ánimo de lucro con la que un grupo de amigos organiza sus sesiones de
          juegos de mesa. Solo pueden entrar las personas cuyo email ha autorizado el administrador del grupo. No hay
          registro público, publicidad ni cobros.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl">Qué datos guardamos</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            <strong>De tu cuenta de Google</strong>: tu email, tu nombre y tu foto de perfil. Solo pedimos los permisos
            básicos (<code>openid</code>, <code>email</code> y <code>profile</code>). No accedemos a tu correo, tus
            contactos ni ningún otro dato de Google.
          </li>
          <li>
            <strong>Lo que el grupo registra</strong>: sesiones, asistencia, partidas, resultados, puntuaciones,
            valoraciones de juegos, votaciones, notas y fotos del grupo, con las personas etiquetadas en ellas.
          </li>
          <li>
            <strong>Datos técnicos</strong>: una cookie de sesión para mantenerte conectado. No usamos cookies de
            analítica ni de publicidad.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl">Para qué los usamos</h2>
        <p>
          Únicamente para que la aplicación funcione: identificarte, mostrar quién ha jugado y quién ha ganado, calcular
          estadísticas del grupo y compartir recuerdos entre sus miembros. No vendemos ni cedemos datos a nadie, y no
          enviamos emails.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl">Quién puede verlos</h2>
        <p>
          Solo los miembros del grupo con sesión iniciada. Las fotos se sirven mediante enlaces firmados que caducan.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl">Dónde se guardan</h2>
        <p>
          Los datos se alojan en <a className="underline" href="https://supabase.com/privacy">Supabase</a> (base de
          datos, autenticación y almacenamiento de fotos) y la aplicación se sirve desde{" "}
          <a className="underline" href="https://vercel.com/legal/privacy-policy">Vercel</a>. La información pública de juegos se consulta en{" "}
          <a className="underline" href="https://boardgamegeek.com">BoardGameGeek</a> sin enviarle ningún dato tuyo.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl">Tus derechos</h2>
        <p>
          Puedes pedir al administrador del grupo que corrija o elimine tus datos, o que te dé una copia. También puedes
          revocar el acceso de alvaro2b en la configuración de seguridad de tu cuenta de Google en cualquier momento.
        </p>
      </section>
    </main>
  );
}
