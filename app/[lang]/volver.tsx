"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * "← Volver al catálogo".
 *
 * Es un enlace de verdad —con su href, indexable y abrible en pestaña nueva—,
 * pero cuando se llega desde el propio catálogo se comporta como el botón de
 * atrás del navegador. La diferencia importa por dos motivos, y el segundo es
 * el que se ve:
 *
 * 1. Un `<Link>` normal deja el catálogo arriba del todo. Si estabas mirando
 *    la sexta categoría y vuelves, apareces en la primera y tienes que buscar
 *    otra vez dónde estabas.
 *
 * 2. La foto que viaja entre páginas necesita que su destino esté EN PANTALLA
 *    para que se vea. Medido: al volver con `<Link>`, el scroll se queda en 0
 *    y la tarjeta de "Embutidos Ibéricos" cae en `top: 964` con un viewport de
 *    730 píxeles. La animación se ejecuta —está comprobado que la transición
 *    se dispara—, pero sucede por debajo del pliegue y no la ve nadie. Con
 *    "Quesos", que está en la primera fila y cae en `top: 505`, sí se ve. Ese
 *    era exactamente el síntoma: unas categorías animaban al salir y otras no,
 *    sin que hubiera nada distinto en ellas salvo su altura en la rejilla.
 *
 * `history.back()` restaura la posición que el navegador guardó, así que la
 * tarjeta vuelve a estar donde estaba y el morphing aterriza a la vista.
 *
 * Solo se hace cuando el paso anterior es el catálogo. Quien entra por un
 * enlace directo, desde un buscador o con la pestaña recién abierta necesita
 * el enlace normal: ahí `back()` lo sacaría de la web.
 */
export default function VolverAlCatalogo({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();

  return (
    <Link
      href={href}
      className={className}
      onClick={(e) => {
        // respetar ctrl/cmd/medio: son "abrir en otra pestaña", no "volver"
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        // `history.length > 1` no basta: una pestaña nueva ya vale 1 y
        // cualquier navegación previa la sube, venga de donde venga. Lo que
        // decide es de dónde se llega, y eso lo dice el referente.
        try {
          const anterior = new URL(document.referrer);
          if (anterior.origin === location.origin && anterior.pathname === href) {
            e.preventDefault();
            router.back();
          }
        } catch {
          // sin referente (entrada directa) se queda el enlace normal
        }
      }}
    >
      {children}
    </Link>
  );
}
