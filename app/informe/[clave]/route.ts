import {
  NOMBRE_IDIOMA_INFORME, PERIODOS, claveValida, formatoFecha, numero, obtenerInforme,
  type Fila, type Informe,
} from "@/lib/informe";

// Se calcula en cada visita; la caché de una hora vive en el fetch de lib/informe.
export const dynamic = "force-dynamic";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const CABECERAS = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

function tabla(cabecera: string, filas: Fila[], etiquetaCodigo: (f: Fila) => string): string {
  const max = Math.max(1, ...filas.map((f) => f.visitantes));
  const cuerpo = filas
    .map((f) => {
      const cod = f.codigo ? `<i class="cod">${esc(etiquetaCodigo(f))}</i>` : "";
      const nombre = cabecera === "Página" ? `${cod}${esc(f.etiqueta)}` : `${esc(f.etiqueta)}${cod}`;
      return `<tr><td>${nombre}</td><td class="bar"><span style="width:${Math.max(3, Math.round((f.visitantes / max) * 100))}%"></span></td><td class="n">${numero(f.visitantes)}</td><td class="n g">${numero(f.paginas)}</td></tr>`;
    })
    .join("");
  return `<table><thead><tr><th>${cabecera}</th><th></th><th>Visitantes</th><th>Páginas vistas</th></tr></thead><tbody>${cuerpo}</tbody></table>`;
}

export async function GET(
  peticion: Request,
  { params }: { params: Promise<{ clave: string }> },
) {
  const { clave } = await params;
  if (!claveValida(clave)) return new Response("No encontrado", { status: 404 });

  const pedido = Number(new URL(peticion.url).searchParams.get("dias"));
  const dias = (PERIODOS as readonly number[]).includes(pedido) ? pedido : 7;

  let i: Informe;
  try {
    i = await obtenerInforme(dias);
  } catch (e) {
    console.error("informe:", e);
    return new Response("No se han podido leer las estadísticas ahora mismo. Inténtalo en unos minutos.", {
      status: 502,
      headers: CABECERAS,
    });
  }

  const base = `/informe/${encodeURIComponent(clave)}`;
  const periodo = `${formatoFecha(i.desde)} - ${formatoFecha(i.hasta)}`;
  const pestana = (n: number) => `<a href="${base}?dias=${n}"${n === dias ? ' class="on"' : ""}>${n} días</a>`;
  const idioma = (f: Fila) => NOMBRE_IDIOMA_INFORME[f.codigo ?? ""] ?? f.codigo ?? "";

  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Informe de analítica web · González-Regalado</title>
<style>
:root{--g:#7a2a2e;--tinta:#1c1c1c;--gris:#8a8580;--fondo:#f8f6f2;--linea:#e6e1da;--barra:#e5d8d0}
*{box-sizing:border-box}
body{margin:0;background:#fff;color:var(--tinta);font:15px/1.5 "Liberation Serif","Times New Roman",Times,serif}
main{max-width:1000px;margin:0 auto;padding:32px 20px 48px}
header{display:flex;gap:24px;align-items:center;padding-bottom:20px;border-bottom:4px solid var(--g);margin-bottom:20px}
.logo{width:64px;height:64px;background:#1f1304;flex:none;display:flex;align-items:center}
.logo img{width:100%;display:block}
h1{margin:0;font-size:clamp(1.5rem,4vw,2rem);color:var(--g)}
.sub{margin:4px 0 0;color:var(--gris)}
.acc{display:flex;flex-wrap:wrap;gap:8px;margin-left:auto}
.acc a{padding:6px 14px;border:1px solid var(--linea);text-decoration:none;color:var(--tinta);font:13px system-ui,sans-serif}
.acc a.on{background:var(--g);color:#fff;border-color:var(--g)}
.acc a.pdf{border-color:var(--g);color:var(--g);font-weight:600}
.cifras{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin-bottom:20px}
.cifra{background:var(--fondo);border-top:3px solid var(--g);padding:14px 16px}
.cifra b{display:block;font-size:2rem;font-weight:700;color:var(--g);line-height:1.1}
.cifra span{font:11px system-ui,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:var(--gris)}
.guia{background:var(--fondo);border:1px solid var(--linea);padding:18px 22px;margin-bottom:28px;font-size:13px}
.guia h3{margin:0 0 10px;color:var(--g);font-size:12px;letter-spacing:.25em;text-transform:uppercase}
.guia p{margin:0 0 6px}.guia b{color:var(--g)}
.guia blockquote{margin:12px 0 0;padding:6px 14px;border-left:3px solid var(--g);color:#555}
.dos{display:grid;grid-template-columns:1fr 1fr;gap:28px;align-items:start;margin-bottom:28px}
@media(max-width:760px){.dos{grid-template-columns:1fr}}
h2{margin:0 0 8px;font-size:1.25rem;color:var(--g)}
.caja{overflow-x:auto}
table{width:100%;border-collapse:collapse;font-size:13px}
th{font:10px system-ui,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:var(--gris);text-align:right;font-weight:400;padding:10px 6px;border-bottom:1px solid var(--linea)}
th:first-child{text-align:left}
td{padding:5px 6px;border-bottom:1px solid #f0ede8}
tbody tr:nth-child(even){background:#faf8f5}
td.n{text-align:right;font-variant-numeric:tabular-nums}.g{color:var(--gris)}
td.bar{width:30%;direction:rtl}
td.bar span{display:block;height:9px;background:var(--barra);margin-left:auto;direction:ltr;max-width:100%}
.dos td.bar{width:22%}
i.cod{font:10px system-ui,sans-serif;font-style:normal;background:#efe3dc;color:#8a5a4a;padding:1px 6px;margin:0 6px;border-radius:2px}
.nota{margin-top:12px;padding:8px 14px;border-left:3px solid var(--g);background:var(--fondo);color:#666;font-size:12px}
.pie{margin-top:28px;color:var(--gris);font-size:12px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px}
</style></head><body><main>
<header>
  <div class="logo"><img src="/marca/logo.png" alt=""></div>
  <div><h1>Informe de analítica web</h1><p class="sub">Periodo analizado: ${periodo}</p></div>
  <nav class="acc">${PERIODOS.map(pestana).join("")}<a class="pdf" href="${base}/pdf?dias=${dias}">Descargar PDF</a></nav>
</header>
<div class="cifras">
  <div class="cifra"><b>${numero(i.visitantes)}</b><span>Visitantes únicos</span></div>
  <div class="cifra"><b>${numero(i.paginas)}</b><span>Páginas vistas</span></div>
  <div class="cifra"><b>${numero(i.paises.length)}</b><span>Países</span></div>
  <div class="cifra"><b>${esc(i.idiomaPrincipal)}</b><span>Idioma principal</span></div>
</div>
<div class="guia"><h3>Cómo leer este informe</h3>
<p><b>Visitantes:</b> personas distintas. Si alguien entra varias veces en el mismo periodo, cuenta como una sola.</p>
<p><b>Páginas vistas:</b> veces que se ha abierto una página. Una misma persona que recorre diez apartados suma diez páginas vistas, pero sigue siendo un visitante. Por eso este número siempre es mayor.</p>
<p><b>Países de origen:</b> desde dónde se conectan esos visitantes, según su ubicación en internet.</p>
<p><b>Fuentes de tráfico:</b> qué web les trajo hasta la nuestra al hacer clic en un enlace.</p>
<p><b>Idioma:</b> versión del sitio que consultaron (española, inglesa, francesa, alemana, italiana, portuguesa o noruega), no el idioma de su dispositivo.</p>
<blockquote>Los visitantes solo se pueden sumar dentro de una misma tabla. En la tabla de páginas, una persona que visita cinco páginas aparece contada en las cinco.</blockquote></div>
<div class="dos">
  <section class="caja"><h2>Países de origen</h2>${tabla("País", i.paises, (f) => f.codigo ?? "")}</section>
  <section class="caja"><h2>Fuentes de tráfico</h2>${tabla("Origen", i.origenes, () => "")}<div class="nota">Las visitas directas (sin origen registrado) no aparecen en esta tabla.</div></section>
</div>
<section class="caja"><h2>Páginas más visitadas</h2>${tabla("Página", i.rutas, idioma)}</section>
<div class="pie"><span>González-Regalado · Informe de analítica web</span><span>${periodo} · Datos de Vercel Web Analytics, actualizados cada hora · Consulta: ${esc(i.generado)}</span></div>
</main></body></html>`;

  return new Response(html, { headers: CABECERAS });
}
