"use client";

import { useEffect, useState } from "react";

import { CLAVE_FOTOS } from "@/lib/pruebas";

/**
 * Comparador de fotografía, para decidir con el cliente.
 *
 * Enseña la misma rejilla con las fotos nuevas o con las del catálogo del
 * proveedor —las que llevan la marca a la vista—, que es lo que hay que
 * comparar para saber si compensa sustituirlas. No cambia nada del servidor:
 * las dos fotos van ya en el HTML y las esconde el CSS por `data-fotos`, así
 * que el cambio es instantáneo y no vuelve a pedir la página.
 *
 * Solo se monta mientras la web está en pruebas; ver `lib/pruebas.ts`.
 */
export default function CambioFotos({ etiqueta }: { etiqueta: string }) {
  const [proveedor, setProveedor] = useState(false);

  // El atributo lo pone el script del layout antes de pintar; aquí solo se
  // lee, para que el interruptor arranque en la posición en la que ya está.
  useEffect(() => {
    setProveedor(document.documentElement.dataset.fotos === "proveedor");
  }, []);

  function cambiar() {
    const nuevo = !proveedor;
    setProveedor(nuevo);
    if (nuevo) document.documentElement.dataset.fotos = "proveedor";
    else delete document.documentElement.dataset.fotos;
    try {
      localStorage.setItem(CLAVE_FOTOS, nuevo ? "proveedor" : "propias");
    } catch {
      // navegación privada: el cambio vale para esta página y ya
    }
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={proveedor}
      onClick={cambiar}
      className="comparador fixed bottom-5 right-5 flex items-center gap-3 rounded-sm border border-linea bg-crema/95 px-4 py-2.5 font-sans text-[0.7rem] font-medium uppercase tracking-[0.1em] text-tinta-2 backdrop-blur"
    >
      {etiqueta}
      <span
        aria-hidden
        className={`relative h-4 w-8 shrink-0 rounded-full transition-colors duration-200 ${
          proveedor ? "bg-oro-tinta" : "bg-linea"
        }`}
      >
        <span
          className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform duration-200 ease-[var(--ease-salida)] ${
            proveedor ? "translate-x-4.5" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}
