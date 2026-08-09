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

/**
 * Puerta con contraseña mientras la web está en pruebas.
 *
 * Vercel trae esto de serie, pero solo en los planes de pago; el equipo está
 * en Hobby, así que se resuelve aquí con autenticación básica, que es lo que
 * el propio navegador sabe pedir sin necesidad de pantalla de acceso.
 *
 * Se activa sola si existe la variable CLAVE_WEB. Para abrir la web al público
 * basta con borrar esa variable en Vercel y volver a desplegar: no hay que
 * tocar este fichero. Y hay que borrarla antes de apuntar el dominio real, o
 * Google se encontrará un 401 en todas las páginas.
 */
const CLAVE = process.env.CLAVE_WEB;

function pedirClave() {
  return new NextResponse("Acceso restringido", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Web en pruebas", charset="UTF-8"',
      // que ningún buscador ni intermediario guarde esto
      "Cache-Control": "no-store",
    },
  });
}

export function proxy(peticion: NextRequest) {
  if (CLAVE) {
    const cabecera = peticion.headers.get("authorization") ?? "";
    const codificado = cabecera.startsWith("Basic ") ? cabecera.slice(6) : "";
    let dada = "";
    try {
      // el usuario da igual: solo se comprueba la contraseña
      dada = codificado ? atob(codificado).split(":").slice(1).join(":") : "";
    } catch {
      dada = "";
    }
    if (dada !== CLAVE) return pedirClave();
  }

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
