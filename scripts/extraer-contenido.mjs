/**
 * Vuelca el texto de la web antigua a content/<lang>.json.
 *
 * La web vieja vive en Fly.io, en una cuenta que no controlamos: la copia de
 * `web-actual/` es la única fuente. Esto se ejecuta una vez para migrar; luego
 * los JSON son los que se editan.
 *
 *   node scripts/extraer-contenido.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const ORIGEN = "/home/mate0s/Proyectos/Personal/Gonzalez-Regalado/web-actual";
const DESTINO = new URL("../content/", import.meta.url).pathname;
const IDIOMAS = ["es", "en", "nb"];
const PAGINAS = ["index", "about", "products", "contact", "terms", "privacy", "legal"];

const limpiar = (s) =>
  s
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&copy;/g, "©")
    .replace(/\s+/g, " ")
    .trim();

/** Bloques del <main>, en orden, conservando de qué etiqueta salen. */
function bloques(html) {
  const main = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (!main) return [];
  // en esta web el <header> y el <footer> viven DENTRO de <main>: fuera los dos,
  // o el menu de navegacion acaba mezclado con el contenido.
  const cuerpo = main[1]
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "");
  const salida = [];
  const re = /<(h1|h2|h3|p|li|a)([^>]*)>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = re.exec(cuerpo))) {
    const texto = limpiar(m[3]);
    if (!texto) continue;
    // el pie se cuela en algunas paginas: fuera
    if (/^©|Todos los derechos|All rights|Diseñado por|Designed by|Utformet av/i.test(texto)) continue;
    const href = (m[2].match(/href="([^"]+)"/i) || [])[1];
    // de los enlaces solo interesan los de contacto; el resto es navegacion
    if (m[1].toLowerCase() === "a" && !/^(mailto:|tel:)/i.test(href || "")) continue;
    const bloque = { tipo: m[1].toLowerCase(), texto };
    if (href) bloque.href = href;
    salida.push(bloque);
  }
  return salida;
}

if (!existsSync(ORIGEN)) {
  console.error(`No encuentro la copia de la web en ${ORIGEN}`);
  process.exit(1);
}

mkdirSync(DESTINO, { recursive: true });

for (const lang of IDIOMAS) {
  const doc = {};
  for (const pagina of PAGINAS) {
    const carpeta = pagina === "index" ? "index" : pagina;
    const ruta = join(ORIGEN, lang, carpeta, "index.html");
    if (!existsSync(ruta)) {
      console.warn(`  falta ${lang}/${carpeta}`);
      continue;
    }
    const html = readFileSync(ruta, "utf8");
    const titulo = limpiar((html.match(/<title>([\s\S]*?)<\/title>/i) || [, ""])[1]);
    doc[pagina] = { titulo, bloques: bloques(html) };
  }
  const destino = join(DESTINO, `${lang}.json`);
  writeFileSync(destino, JSON.stringify(doc, null, 2) + "\n", "utf8");
  const total = Object.values(doc).reduce((n, p) => n + p.bloques.length, 0);
  console.log(`  ${lang}.json · ${Object.keys(doc).length} páginas · ${total} bloques`);
}
