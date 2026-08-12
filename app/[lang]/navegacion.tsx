"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { Idioma } from "@/lib/contenido";

type Enlace = { href: string; texto: string };
type Lengua = { codigo: string; nombre: string; href: string };

/* En el servidor no hay diseño que medir, así que allí se usa el efecto
 *  normal; en el navegador hace falta el de diseño, que corre ANTES de pintar.
 *  Con `useEffect` la barra se pintaba flotante durante ~110 ms al recargar la
 *  página ya desplazada: menú blanco sobre el catálogo blanco. */
const useEfectoDeDiseno = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Enlace del menú con el filete que se traza debajo: quieto en el activo, y
 *  al pasar por encima se dibuja de izquierda a derecha. Es el mismo gesto que
 *  el filete del hero y que el grabado de las tarjetas. */
function Etiqueta({ texto, activo }: { texto: string; activo: boolean }) {
  return (
    <span className="relative">
      {texto}
      <span
        aria-hidden
        className={`absolute -bottom-1.5 left-0 h-px w-full origin-left bg-[var(--tinta-nav-activo)] transition-transform duration-300 ease-[var(--ease-salida)] ${
          activo ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
        }`}
      />
    </span>
  );
}

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
  const [solida, setSolida] = useState(false);
  const ruta = usePathname();
  const nombreActual = idiomas.find((l) => l.codigo === lang)?.nombre ?? lang;

  // conservar la página al cambiar de idioma: /es/about/ -> /en/about/
  const mismaPagina = (destino: string) =>
    ruta?.replace(/^\/[a-z]{2}(?=\/|$)/, `/${destino}`) || `/${destino}/`;

  /* Cuándo se condensa la barra. Si la página abre con una sección oscura, en
     cuanto el TEXTO de esa sección alcanza el borde de abajo de la barra; si
     abre en claro, al primer píxel de desplazamiento.
     Se vigila el bloque de texto (`.ancla-cabecera`) y no la sección entera:
     el hero es más alto que su contenido, y esperando al final de la sección
     los botones del hero llegaban a pasar por debajo de la barra todavía
     transparente, blanco sobre blanco.
     Y se vigila un elemento en vez de una altura fija porque el hero mide
     `78vh` de mínimo pero en un móvil crece por encima de eso. */
  useEfectoDeDiseno(() => {
    const oscuro = document.querySelector("main > .abre-oscuro");
    if (oscuro) {
      const ancla = oscuro.querySelector(".ancla-cabecera") ?? oscuro;
      /* El margen sale del alto real de la barra en reposo, no de un 64
         escrito a mano: la barra mide entre 76 y 96 px según el ancho, así que
         con la constante se condensaba tarde y quedaban hasta 32 px de velo
         sobre la sección clara. `main` ya expone ese alto resuelto en píxeles
         en su `padding-top`, así que el JS no tiene que enterarse de nada si
         se toca `--alto-cabecera` en el CSS. */
      const main = document.querySelector("main");
      const alto = main ? parseFloat(getComputedStyle(main).paddingTop) : 0;
      const decidir = (tocando: boolean) => setSolida(!tocando);
      // resuelto ya, antes de pintar, para no enseñar el estado equivocado
      decidir(ancla.getBoundingClientRect().bottom > (alto || 64));
      const io = new IntersectionObserver(([e]) => decidir(e.isIntersecting), {
        rootMargin: `-${alto || 64}px 0px 0px 0px`,
      });
      io.observe(ancla);
      return () => io.disconnect();
    }
    const alBajar = () => setSolida(window.scrollY > 4);
    alBajar();
    addEventListener("scroll", alBajar, { passive: true });
    return () => removeEventListener("scroll", alBajar);
  }, [ruta]);

  // el menú desplegado necesita fondo sí o sí, aunque esté sobre el hero
  const condensada = solida || abierto;

  return (
    <header
      className="cabecera fixed inset-x-0 top-0 z-40"
      data-solida={condensada ? "" : undefined}
    >
      {/* Avance de lectura. No es una barra añadida encima de la web: se monta
          sobre el filete dorado que la cabecera ya tenía de borde, así que
          cuando está a cero no se ve nada nuevo. Solo aparece con la barra
          condensada —sobre el hero en negro, una línea dorada creciendo le
          quitaría el sitio al titular—. Se pinta y se anima entero en CSS
          (`animation-timeline: scroll()`), sin escuchar el scroll desde JS. */}
      <div
        aria-hidden
        className="avance pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left bg-oro"
      />
      <div className="barra mx-auto flex w-full max-w-6xl items-center gap-6 px-6">
        <Link href={`/${lang}/`} className="shrink-0" aria-label="González-Regalado Gourmet">
          <Image
            src="/marca/logo.png"
            alt="González-Regalado Gourmet"
            width={320}
            height={178}
            priority
            className="logo-marca"
          />
        </Link>

        {/* En `lg` y no en `md`: en versalitas y con la letra suelta el menú
            mide casi un tercio más que en redonda, y a 768 px ya no cabía. */}
        <nav className="ml-auto hidden items-center gap-8 lg:flex">
          {etiquetas.map((e) => {
            const activo = ruta === e.href;
            return (
              <Link
                key={e.href}
                href={e.href}
                aria-current={activo ? "page" : undefined}
                className={`group flex h-11 items-center font-sans text-[0.78rem] font-medium uppercase tracking-[0.12em] transition-colors duration-200 ${
                  activo
                    ? "text-[var(--tinta-nav-activo)]"
                    : "text-[var(--tinta-nav)] hover:text-[var(--tinta-nav-fuerte)]"
                }`}
              >
                <Etiqueta texto={e.texto} activo={activo} />
              </Link>
            );
          })}

          <span aria-hidden className="h-3.5 w-px bg-[var(--tinta-nav)] opacity-40" />

          {/* Con siete idiomas la fila de códigos era un muro de abreviaturas
              y cada uno medía 16 px de alto. `details` da el desplegable sin
              estado propio ni JS: es el elemento del navegador para esto. */}
          <details className="group relative">
            <summary className="flex h-11 cursor-pointer list-none items-center gap-1.5 font-sans text-[0.78rem] font-medium uppercase tracking-[0.12em] text-[var(--tinta-nav)] transition-colors duration-200 hover:text-[var(--tinta-nav-fuerte)] [&::-webkit-details-marker]:hidden">
              <span className="text-[var(--tinta-nav-activo)]">{lang.toUpperCase()}</span>
              <span
                aria-hidden
                className="text-[0.6rem] transition-transform duration-200 group-open:rotate-180"
              >
                ▾
              </span>
              <span className="sr-only">{nombreActual}</span>
            </summary>
            <ul className="menu-idiomas absolute right-0 top-full z-50 mt-2 min-w-48 overflow-hidden rounded-sm py-1">
              {idiomas.map((l) => (
                <li key={l.codigo}>
                  <Link
                    href={mismaPagina(l.codigo)}
                    hrefLang={l.codigo}
                    aria-current={l.codigo === lang ? "true" : undefined}
                    className={`flex h-11 items-center px-4 font-sans text-sm transition-colors ${
                      l.codigo === lang
                        ? "font-semibold text-[var(--tinta-nav-activo)]"
                        : "text-[var(--tinta-menu)] hover:bg-[var(--realce-menu)] hover:text-[var(--tinta-nav-fuerte)]"
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
          className="-mr-2 ml-auto grid h-11 w-11 place-items-center lg:hidden"
        >
          <span className="relative block h-4 w-6">
            <span className={`absolute left-0 block h-px w-6 bg-[var(--tinta-nav-fuerte)] transition-transform duration-200 ${abierto ? "top-2 rotate-45" : "top-0"}`} />
            <span className={`absolute left-0 top-2 block h-px w-6 bg-[var(--tinta-nav-fuerte)] transition-opacity duration-200 ${abierto ? "opacity-0" : ""}`} />
            <span className={`absolute left-0 block h-px w-6 bg-[var(--tinta-nav-fuerte)] transition-transform duration-200 ${abierto ? "top-2 -rotate-45" : "top-4"}`} />
          </span>
        </button>
      </div>

      {abierto && (
        <div className="relative max-h-[calc(100dvh-var(--alto-cabecera-min))] overflow-y-auto overscroll-contain border-t border-linea bg-crema lg:hidden">
          <nav className="mx-auto flex w-full max-w-6xl flex-col px-6 py-3">
            {etiquetas.map((e) => (
              <Link
                key={e.href}
                href={e.href}
                onClick={() => setAbierto(false)}
                className="flex min-h-11 items-center border-b border-linea py-3 font-sans text-[0.78rem] font-medium uppercase tracking-[0.12em] text-tinta-2 last:border-0"
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
