"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { Idioma } from "@/lib/contenido";

type Enlace = { href: string; texto: string };
type Lengua = { codigo: string; nombre: string; href: string };

export default function Navegacion({
  lang,
  etiquetas,
  idiomas,
  textoMenu,
}: {
  lang: Idioma;
  etiquetas: Enlace[];
  idiomas: Lengua[];
  textoMenu: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const ruta = usePathname();
  const nombreActual = idiomas.find((l) => l.codigo === lang)?.nombre ?? lang;

  // conservar la página al cambiar de idioma: /es/about/ -> /en/about/
  const mismaPagina = (destino: string) =>
    ruta?.replace(/^\/[a-z]{2}(?=\/|$)/, `/${destino}`) || `/${destino}/`;

  return (
    <header className="sticky top-0 z-40 border-b border-linea bg-white/92 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-6 px-6 py-3">
        <Link href={`/${lang}/`} className="shrink-0" aria-label="González-Regalado Gourmet">
          <Image
            src="/marca/logo.png"
            alt="González-Regalado Gourmet"
            width={200}
            height={111}
            priority
            className="h-11 w-auto sm:h-12"
          />
        </Link>

        <nav className="ml-auto hidden items-center gap-7 md:flex">
          {etiquetas.map((e) => {
            const activo = ruta === e.href;
            return (
              <Link
                key={e.href}
                href={e.href}
                aria-current={activo ? "page" : undefined}
                className={`flex h-11 items-center text-[0.95rem] transition-colors ${
                  activo ? "text-oro-tinta" : "text-tinta-2 hover:text-tinta"
                }`}
              >
                {e.texto}
              </Link>
            );
          })}
          <span className="h-4 w-px bg-linea" />
          {/* Con siete idiomas la fila de códigos era un muro de abreviaturas
              y cada uno medía 16 px de alto. `details` da el desplegable sin
              estado propio ni JS: es el elemento del navegador para esto. */}
          <details className="group relative">
            <summary className="flex h-11 cursor-pointer list-none items-center gap-1.5 font-sans text-xs text-tinta-2 hover:text-tinta [&::-webkit-details-marker]:hidden">
              <span className="font-semibold text-oro-tinta">{lang.toUpperCase()}</span>
              <span aria-hidden className="text-tinta-3 transition-transform duration-200 group-open:rotate-180">
                ▾
              </span>
              <span className="sr-only">{nombreActual}</span>
            </summary>
            <ul className="absolute right-0 top-full z-50 min-w-44 overflow-hidden rounded-sm border border-linea bg-white py-1 shadow-lg">
              {idiomas.map((l) => (
                <li key={l.codigo}>
                  <Link
                    href={mismaPagina(l.codigo)}
                    hrefLang={l.codigo}
                    aria-current={l.codigo === lang ? "true" : undefined}
                    className={`flex h-11 items-center px-4 font-sans text-sm ${
                      l.codigo === lang
                        ? "font-semibold text-oro-tinta"
                        : "text-tinta-2 hover:bg-crema hover:text-tinta"
                    }`}
                  >
                    {l.nombre}
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        </nav>

        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
          aria-label={textoMenu}
          className="-mr-2 ml-auto grid h-11 w-11 place-items-center md:hidden"
        >
          <span className="relative block h-4 w-6">
            <span className={`absolute left-0 block h-px w-6 bg-tinta transition-transform duration-200 ${abierto ? "top-2 rotate-45" : "top-0"}`} />
            <span className={`absolute left-0 top-2 block h-px w-6 bg-tinta transition-opacity duration-200 ${abierto ? "opacity-0" : ""}`} />
            <span className={`absolute left-0 block h-px w-6 bg-tinta transition-transform duration-200 ${abierto ? "top-2 -rotate-45" : "top-4"}`} />
          </span>
        </button>
      </div>

      {abierto && (
        <div className="border-t border-linea bg-white md:hidden">
          <nav className="mx-auto flex w-full max-w-6xl flex-col px-6 py-3">
            {etiquetas.map((e) => (
              <Link
                key={e.href}
                href={e.href}
                onClick={() => setAbierto(false)}
                className="flex min-h-11 items-center border-b border-linea py-3 text-tinta-2 last:border-0"
              >
                {e.texto}
              </Link>
            ))}
            {/* Dos columnas: siete idiomas en una fila no caben en un móvil. */}
            <div className="grid grid-cols-2 gap-x-4 pt-3 font-sans text-sm">
              {idiomas.map((l) => (
                <Link
                  key={l.codigo}
                  href={mismaPagina(l.codigo)}
                  hrefLang={l.codigo}
                  onClick={() => setAbierto(false)}
                  className={`flex min-h-11 items-center ${
                    l.codigo === lang ? "font-semibold text-oro-tinta" : "text-tinta-2"
                  }`}
                >
                  {l.nombre}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
