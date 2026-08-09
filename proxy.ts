import { NextResponse, type NextRequest } from "next/server";
import { IDIOMAS, IDIOMA_POR_DEFECTO } from "@/lib/contenido";

/**
 * En Next 16 el middleware se llama `proxy` y vive en este fichero.
 *
 * La web anterior servía /es/, /en/ y /nb/, y esas URLs están indexadas: se
 * mantienen tal cual. Lo único que hace esto es mandar a un idioma a quien
 * entre por la raíz.
 */
function idiomaPreferido(peticion: NextRequest): string {
  const cabecera = peticion.headers.get("accept-language") ?? "";
  const preferidos = cabecera
    .split(",")
    .map((trozo) => {
      const [etiqueta, q] = trozo.trim().split(";q=");
      return { etiqueta: etiqueta.toLowerCase(), peso: q ? parseFloat(q) : 1 };
    })
    .sort((a, b) => b.peso - a.peso);

  for (const { etiqueta } of preferidos) {
    const base = etiqueta.split("-")[0];
    // "no" y "nn" son noruego: la web usa bokmål
    if (base === "no" || base === "nn" || base === "nb") return "nb";
    if ((IDIOMAS as readonly string[]).includes(base)) return base;
  }
  return IDIOMA_POR_DEFECTO;
}

export function proxy(peticion: NextRequest) {
  const { pathname } = peticion.nextUrl;
  const yaTieneIdioma = IDIOMAS.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );
  if (yaTieneIdioma) return;

  const url = peticion.nextUrl.clone();
  url.pathname = `/${idiomaPreferido(peticion)}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|productos|marcas|favicon|robots.txt|sitemap.xml|.*\\.).*)"],
};
