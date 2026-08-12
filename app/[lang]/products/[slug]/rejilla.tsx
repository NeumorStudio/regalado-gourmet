"use client";

import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import Image from "next/image";
import type { Ficha } from "@/lib/contenido";

/**
 * Cambia el estado dentro de una transición del navegador.
 *
 * No se usa el `<ViewTransition>` de React porque solo existe en el runtime
 * experimental, que Next carga únicamente con `blockingSSR`, `taint`,
 * `transitionIndicator` o `gestureTransition` activados. Comprobado: sin uno
 * de esos flags el componente se monta y no aplica ni un solo nombre. Meter un
 * React experimental en la web de un cliente por una animación no compensa.
 *
 * `flushSync` es imprescindible: `startViewTransition` fotografía el estado
 * ANTES, ejecuta la función y fotografía el DESPUÉS. Si React aplaza el
 * repintado —que es lo que hace por defecto—, las dos fotos salen iguales y no
 * se anima nada.
 */
function conTransicion(cambio: () => void) {
  if (!document.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    cambio();
    return;
  }
  document.startViewTransition(() => flushSync(cambio));
}

/**
 * La rejilla de fichas y el visor que se abre al pulsar una.
 *
 * Hasta aquí el catálogo terminaba en la rejilla: 63 fotos y ninguna se podía
 * abrir. Ahora la foto crece hasta llenar la pantalla, que es donde se ve el
 * producto de cerca —el motivo por el que se rehízo la fotografía— y donde el
 * morphing que ya usa la web entre catálogo y categoría luce de verdad.
 *
 * Es cliente porque necesita estado, pero solo recibe datos ya resueltos: las
 * fichas llegan traducidas desde el servidor, así que no baja ni catálogo ni
 * lógica de idioma.
 */
export default function Rejilla({
  fichas,
  conAntetitulo,
  textoCerrar,
}: {
  fichas: Ficha[];
  conAntetitulo: boolean;
  textoCerrar: string;
}) {
  const [abierta, setAbierta] = useState<string | null>(null);
  const ficha = fichas.find((f) => f.clave === abierta) ?? null;

  const abrir = (clave: string) => conTransicion(() => setAbierta(clave));
  const cerrar = () => conTransicion(() => setAbierta(null));

  useEffect(() => {
    if (!abierta) return;
    const conTecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrar();
    };
    document.addEventListener("keydown", conTecla);
    /* Con el visor abierto, el fondo no debe desplazarse: en móvil es lo que
       hace que al cerrar aparezcas en otro sitio de la lista. */
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", conTecla);
      document.body.style.overflow = antes;
    };
  }, [abierta]);

  return (
    <>
      <ul className="mt-8 grid grid-cols-2 items-start gap-x-5 gap-y-9 sm:grid-cols-3 lg:grid-cols-4">
        {fichas.map((f) => (
          <li key={f.clave} className="ficha-asoma group flex flex-col">
            <button
              type="button"
              onClick={() => abrir(f.clave)}
              className="block w-full cursor-pointer text-left"
              aria-haspopup="dialog"
            >
              <div className="grabado grabado-menudo relative aspect-square overflow-hidden rounded-sm border border-linea bg-negro">
                {f.foto ? (
                  /* El nombre se le QUITA a la ficha justo cuando se abre su
                     visor y se le pone a la foto grande. Dos elementos con el
                     mismo `view-transition-name` a la vez cancelan la
                     transición entera, así que el nombre viaja: el navegador
                     fotografía dónde estaba (aquí) y dónde acaba (el visor) y
                     mueve la foto entre las dos posiciones. */
                  <Image
                    src={f.foto}
                    alt={f.titulo}
                    width={680}
                    height={680}
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                    loading="lazy"
                    style={
                      abierta === f.clave ? undefined : { viewTransitionName: `ficha-${f.clave}` }
                    }
                    className="h-full w-full object-cover transition-transform duration-500 ease-[var(--ease-salida)] group-hover:-translate-y-[2%] group-hover:scale-[1.07]"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-crema px-3 text-center font-sans text-[0.65rem] uppercase tracking-wider text-tinta-3">
                    {f.titulo}
                  </div>
                )}
              </div>

              {conAntetitulo && <p className="etiqueta mt-3 min-h-[1lh]">{f.antetitulo}</p>}
              <p className={`leading-snug text-balance ${conAntetitulo ? "mt-1" : "mt-3"}`}>
                {f.titulo}
              </p>
              {f.caracter && (
                <p className="mt-1 font-sans text-xs text-tinta-3">{f.caracter}</p>
              )}
            </button>
          </li>
        ))}
      </ul>

      {ficha && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={ficha.titulo}
          className="visor fixed inset-0 z-50 grid place-items-center p-4 sm:p-8"
          onClick={cerrar}
        >
          <div
            /* El ancho lo fija la ALTURA disponible, no solo el ancho de la
               pantalla: la foto es cuadrada, y con `max-w` a secas en una
               ventana apaisada salía un cuadrado de 768 px dentro de un
               viewport de 674 y se comía el nombre del producto por abajo.
               Con `min()` de las tres medidas el cuadrado siempre cabe entero
               y queda sitio para el pie. */
            className="relative w-[min(88vw,58vh,40rem)]"
            /* el clic dentro no cierra; el de fuera sí */
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grabado relative aspect-square w-full overflow-hidden rounded-sm bg-negro">
              <Image
                src={ficha.foto}
                alt={ficha.titulo}
                fill
                sizes="(min-width: 768px) 768px, 100vw"
                style={{ viewTransitionName: `ficha-${ficha.clave}` }}
                className="object-cover"
                priority
              />
            </div>

            <div className="mt-5 text-center">
              {ficha.antetitulo && (
                <p className="etiqueta text-oro">{ficha.antetitulo}</p>
              )}
              <p className="mt-1 text-white" style={{ fontSize: "var(--text-seccion)" }}>
                {ficha.titulo}
              </p>
              {ficha.caracter && (
                <p className="mt-1 font-sans text-sm text-white/60">{ficha.caracter}</p>
              )}
            </div>

            <button
              type="button"
              onClick={cerrar}
              aria-label={textoCerrar}
              className="absolute -top-1 right-0 grid h-11 w-11 -translate-y-full place-items-center rounded-sm font-sans text-2xl leading-none text-white/70 hover:text-oro"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
}
