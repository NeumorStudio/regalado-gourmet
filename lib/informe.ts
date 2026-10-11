import { timingSafeEqual } from "node:crypto";

/**
 * Informe de visitas para el cliente.
 *
 * Lee la API pública de Web Analytics de Vercel (solo desde el servidor: el
 * token no sale nunca al navegador) y la deja lista para pintarla como página
 * o como PDF. Variables de entorno en Vercel:
 *
 *   VERCEL_API_TOKEN   token de acceso con permiso de lectura al equipo
 *   VERCEL_PROJECT_ID  prj_… del proyecto
 *   VERCEL_TEAM_ID     team_… (omitir si el proyecto es de una cuenta personal)
 *   INFORME_CLAVE      la parte secreta de la URL: /informe/<clave>
 */

export type Fila = {
  etiqueta: string;
  /** código de país o de idioma, para la etiqueta pequeña junto al nombre */
  codigo?: string;
  paginas: number;
  visitantes: number;
};
export type Dia = { fecha: string; paginas: number; visitantes: number };

export type Informe = {
  desde: string;
  hasta: string;
  dias: number;
  paginas: number;
  visitantes: number;
  porDia: Dia[];
  idiomaPrincipal: string;
  /** todas las páginas, con el idioma en `codigo` y la ruta sin idioma en `etiqueta` */
  rutas: Fila[];
  origenes: Fila[];
  paises: Fila[];
  generado: string;
};

const API = "https://api.vercel.com/v1/query/web-analytics/visits";
const ZONA = "Europe/Madrid";

export const PERIODOS = [7, 30] as const;

/** Compara la clave de la URL sin dar pistas por el tiempo de respuesta. */
export function claveValida(dada: string): boolean {
  const buena = process.env.INFORME_CLAVE;
  if (!buena || buena.length < 8) return false;
  const a = Buffer.from(dada);
  const b = Buffer.from(buena);
  return a.length === b.length && timingSafeEqual(a, b);
}

function fechaISO(d: Date): string {
  // "en-CA" da AAAA-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA }).format(d);
}

type Crudo = Record<string, string | number>;

async function consultar(
  desde: string,
  hasta: string,
  por?: string,
  limite = 10,
): Promise<Crudo[]> {
  // sin `by` la API solo contesta en /count; con `by`, en /aggregate
  const url = new URL(`${API}/${por ? "aggregate" : "count"}`);
  url.searchParams.set("projectId", process.env.VERCEL_PROJECT_ID ?? "");
  if (process.env.VERCEL_TEAM_ID) url.searchParams.set("teamId", process.env.VERCEL_TEAM_ID);
  url.searchParams.set("since", desde);
  url.searchParams.set("until", hasta);
  if (por) {
    url.searchParams.set("by", por);
    url.searchParams.set("limit", String(limite));
  }

  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}` },
    // los datos se refrescan solos cada hora; no hace falta más para un informe
    next: { revalidate: 3600 },
  });
  if (!r.ok) {
    throw new Error(`Vercel respondió ${r.status} al pedir ${por ?? "totales"}`);
  }
  const json = (await r.json()) as { data: Crudo[] | Crudo };
  return Array.isArray(json.data) ? json.data : [json.data];
}

function filas(crudo: Crudo[], clave: string): Fila[] {
  return crudo
    .map((f) => ({
      etiqueta: String(f[clave] ?? "").trim() || "(directo)",
      paginas: Number(f.pageviews ?? 0),
      visitantes: Number(f.visitors ?? 0),
    }))
    .filter((f) => f.etiqueta !== "Others")
    .sort((a, b) => b.paginas - a.paginas);
}

export async function obtenerInforme(dias: number): Promise<Informe> {
  const ahora = new Date();
  const hasta = fechaISO(ahora);
  const desde = fechaISO(new Date(ahora.getTime() - (dias - 1) * 86_400_000));

  // 100 es el máximo que admite la API por consulta
  const [total, diario, rutas, origenes, paises] = await Promise.all([
    consultar(desde, hasta),
    consultar(desde, hasta, "day", dias),
    consultar(desde, hasta, "requestPath", 100),
    consultar(desde, hasta, "referrerHostname", 100),
    consultar(desde, hasta, "country", 100),
  ]);

  const paginas = filas(rutas, "requestPath").map(separarIdioma);
  const porIdioma = new Map<string, number>();
  for (const f of paginas) {
    if (f.codigo) porIdioma.set(f.codigo, (porIdioma.get(f.codigo) ?? 0) + f.paginas);
  }
  const principal = [...porIdioma.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

  const porDia = diario
    .map((f) => ({
      fecha: fechaISO(new Date(String(f.timestamp))),
      paginas: Number(f.pageviews ?? 0),
      visitantes: Number(f.visitors ?? 0),
    }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  return {
    desde,
    hasta,
    dias,
    paginas: Number(total[0]?.pageviews ?? 0),
    visitantes: Number(total[0]?.visitors ?? 0),
    porDia,
    idiomaPrincipal: principal ? (NOMBRE_IDIOMA_INFORME[principal] ?? principal) : "—",
    rutas: ordenar(paginas),
    // las visitas directas no traen origen y el informe de siempre las deja fuera
    origenes: ordenar(filas(origenes, "referrerHostname").filter((f) => f.etiqueta !== "(directo)")),
    paises: ordenar(
      filas(paises, "country").map((f) => ({
        ...f,
        codigo: f.etiqueta.toUpperCase(),
        etiqueta: nombrePais(f.etiqueta),
      })),
    ),
    generado: new Intl.DateTimeFormat("es-ES", {
      timeZone: ZONA,
      dateStyle: "long",
      timeStyle: "short",
    }).format(ahora),
  };
}

export const NOMBRE_IDIOMA_INFORME: Record<string, string> = {
  es: "Español",
  en: "Inglés",
  nb: "Noruego",
  fr: "Francés",
  pt: "Portugués",
  it: "Italiano",
  de: "Alemán",
};

/** Más visitantes primero; a igualdad, más páginas vistas. */
function ordenar(f: Fila[]): Fila[] {
  return [...f].sort((a, b) => b.visitantes - a.visitantes || b.paginas - a.paginas);
}

/** "/fr/products/x/" → idioma "fr", ruta "products/x"; la raíz del idioma es "Portada". */
function separarIdioma(f: Fila): Fila {
  const [, lang = "", ...resto] = f.etiqueta.split("/");
  if (!(lang in NOMBRE_IDIOMA_INFORME)) return f;
  const ruta = resto.filter(Boolean).join("/");
  return { ...f, codigo: lang, etiqueta: ruta || "Portada" };
}

function nombrePais(codigo: string): string {
  try {
    return new Intl.DisplayNames(["es"], { type: "region" }).of(codigo) ?? codigo;
  } catch {
    return codigo;
  }
}

export function formatoFecha(iso: string, corto = false): string {
  const [a, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "UTC",
    day: "numeric",
    month: corto ? "short" : "long",
    ...(corto ? {} : { year: "numeric" }),
  }).format(new Date(Date.UTC(a, m - 1, d)));
}

export const numero = (n: number) => new Intl.NumberFormat("es-ES").format(n);
