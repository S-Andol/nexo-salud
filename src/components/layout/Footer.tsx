import Link from "next/link";
import { Logo } from "@/components/layout/Logo";

const COLUMNS = [
  {
    title: "Producto",
    links: [
      { href: "/especialidades", label: "Especialidades" },
      { href: "/profesionales", label: "Profesionales" },
      { href: "/#como-funciona", label: "Cómo funciona" },
    ],
  },
  {
    title: "Cuenta",
    links: [
      { href: "/login", label: "Iniciar sesión" },
      { href: "/register", label: "Registrarse" },
      { href: "/turnos", label: "Mis turnos" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-ink-100 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-sm text-ink-500">Tu salud, organizada.</p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:gap-16">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="text-sm font-semibold text-ink-900">{col.title}</h3>
                <ul className="mt-3 flex flex-col gap-2.5">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-sm text-ink-500 hover:text-brand-600">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-ink-100 pt-6 text-xs text-ink-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} NEXO Salud. Todos los derechos reservados.</p>
          <p>Proyecto académico — datos e información ficticios.</p>
        </div>
      </div>
    </footer>
  );
}
