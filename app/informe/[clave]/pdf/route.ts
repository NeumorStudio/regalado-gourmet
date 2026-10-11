import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import {
  NOMBRE_IDIOMA_INFORME, PERIODOS, claveValida, formatoFecha, numero, obtenerInforme, type Fila,
} from "@/lib/informe";

export const dynamic = "force-dynamic";

const W = 595.28;
const H = 841.89;
const M = 42;
const ANCHO = W - 2 * M;
const GRANATE = rgb(0.478, 0.165, 0.18);
const TINTA = rgb(0.11, 0.11, 0.11);
const GRIS = rgb(0.54, 0.52, 0.5);
const FONDO = rgb(0.973, 0.965, 0.949);
const LINEA = rgb(0.9, 0.88, 0.855);
const BARRA = rgb(0.9, 0.847, 0.816);
const ETIQ = rgb(0.937, 0.89, 0.863);
const ETIQ_TXT = rgb(0.54, 0.35, 0.29);

export async function GET(
  peticion: Request,
  { params }: { params: Promise<{ clave: string }> },
) {
  const { clave } = await params;
  if (!claveValida(clave)) return new Response("No encontrado", { status: 404 });

  const pedido = Number(new URL(peticion.url).searchParams.get("dias"));
  const dias = (PERIODOS as readonly number[]).includes(pedido) ? pedido : 7;

  let i;
  try {
    i = await obtenerInforme(dias);
  } catch (e) {
    console.error("informe pdf:", e);
    return new Response("No se han podido leer las estadísticas ahora mismo.", { status: 502 });
  }

  const pdf = await PDFDocument.create();
  const normal = await pdf.embedFont(StandardFonts.TimesRoman);
  const negrita = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);

  // El logo está en /public: se pide a la propia web en vez de leer del disco,
  // que en Vercel no garantiza tener esos ficheros junto a la función.
  let logo;
  try {
    const r = await fetch(new URL("/marca/logo.png", peticion.url));
    if (r.ok) logo = await pdf.embedPng(await r.arrayBuffer());
  } catch (e) {
    console.error("logo:", e);
    logo = undefined;
  }

  const periodo = `${formatoFecha(i.desde)} - ${formatoFecha(i.hasta)}`;
  const paginas: PDFPage[] = [];
  let pag!: PDFPage;
  let y = 0;

  const nueva = () => {
    pag = pdf.addPage([W, H]);
    paginas.push(pag);
    y = H - M;
  };

  // Times estándar solo codifica Latin-1: lo que no entre se cambia por "?"
  // en vez de hacer fallar el PDF.
  const seguro = (t: string, f: PDFFont) => {
    let s = "";
    for (const c of t) {
      try { f.encodeText(c); s += c; } catch { s += "?"; }
    }
    return s;
  };
  const ancho = (t: string, f: PDFFont, tam: number) => f.widthOfTextAtSize(seguro(t, f), tam);
  const texto = (
    t: string, x: number, yy: number, tam: number, f = normal, color = TINTA, derecha = false, esp = 0,
  ) => {
    const s = seguro(t, f);
    const w = f.widthOfTextAtSize(s, tam) + esp * s.length;
    let cx = derecha ? x - w : x;
    if (!esp) {
      pag.drawText(s, { x: cx, y: yy, size: tam, font: f, color });
      return;
    }
    // pdf-lib no tiene espaciado entre letras: se dibuja letra a letra
    for (const c of s) {
      pag.drawText(c, { x: cx, y: yy, size: tam, font: f, color });
      cx += f.widthOfTextAtSize(c, tam) + esp;
    }
  };
  const recortar = (t: string, f: PDFFont, tam: number, max: number) => {
    if (ancho(t, f, tam) <= max) return t;
    let s = t;
    while (s.length > 1 && ancho(s + "...", f, tam) > max) s = s.slice(0, -1);
    return s + "...";
  };
  const lineas = (t: string, f: PDFFont, tam: number, max: number) => {
    const out: string[] = [];
    let actual = "";
    for (const p of t.split(" ")) {
      const prueba = actual ? `${actual} ${p}` : p;
      if (ancho(prueba, f, tam) > max && actual) { out.push(actual); actual = p; } else actual = prueba;
    }
    if (actual) out.push(actual);
    return out;
  };

  /* ---------- cabecera ---------- */
  nueva();
  pag.drawRectangle({ x: M, y: y - 46, width: 46, height: 46, color: rgb(0.122, 0.075, 0.016) });
  if (logo) {
    const w = 42;
    const h = (logo.height / logo.width) * w;
    pag.drawImage(logo, { x: M + 2, y: y - 23 - h / 2, width: w, height: h });
  }
  texto("Informe de analítica web", M + 70, y - 22, 22, negrita, GRANATE);
  texto(`Periodo analizado: ${periodo}`, M + 70, y - 38, 10.5, normal, GRIS);
  y -= 66;
  pag.drawRectangle({ x: M, y, width: ANCHO, height: 3, color: GRANATE });
  y -= 20;

  /* ---------- cifras ---------- */
  const cifras: [string, string][] = [
    [numero(i.visitantes), "VISITANTES ÚNICOS"],
    [numero(i.paginas), "PÁGINAS VISTAS"],
    [numero(i.paises.length), "PAÍSES"],
    [i.idiomaPrincipal, "IDIOMA PRINCIPAL"],
  ];
  const cw = (ANCHO - 3 * 10) / 4;
  cifras.forEach(([v, e], k) => {
    const x = M + k * (cw + 10);
    pag.drawRectangle({ x, y: y - 52, width: cw, height: 52, color: FONDO });
    pag.drawRectangle({ x, y: y - 2, width: cw, height: 2, color: GRANATE });
    texto(v, x + 10, y - 28, 20, negrita, GRANATE);
    texto(e, x + 10, y - 43, 6.5, sans, GRIS, false, 1.2);
  });
  y -= 70;

  /* ---------- cómo leer ---------- */
  const guia: [string, string][] = [
    ["Visitantes: ", "personas distintas. Si alguien entra varias veces en el mismo periodo, cuenta como una sola."],
    ["Páginas vistas: ", "veces que se ha abierto una página. Una misma persona que recorre diez apartados suma diez páginas vistas, pero sigue siendo un visitante. Por eso este número siempre es mayor."],
    ["Países de origen: ", "desde dónde se conectan esos visitantes, según su ubicación en internet."],
    ["Fuentes de tráfico: ", "qué web les trajo hasta la nuestra al hacer clic en un enlace."],
    ["Idioma: ", "versión del sitio que consultaron (española, inglesa, francesa, alemana, italiana, portuguesa o noruega), no el idioma de su dispositivo."],
  ];
  const nota = "Los visitantes solo se pueden sumar dentro de una misma tabla. En la tabla de páginas, una persona que visita cinco páginas aparece contada en las cinco.";
  const tg = 8.5;
  const interior = ANCHO - 28;
  const bloques = guia.map(([n, t]) => lineas(n + t, normal, tg, interior));
  const lnota = lineas(nota, normal, tg, interior - 16);
  const altoGuia = 40 + bloques.reduce((a, b) => a + b.length * 11 + 4, 0) + lnota.length * 11 + 16;
  pag.drawRectangle({ x: M, y: y - altoGuia, width: ANCHO, height: altoGuia, color: FONDO, borderColor: LINEA, borderWidth: 0.5 });
  texto("CÓMO LEER ESTE INFORME", M + 14, y - 22, 8, negrita, GRANATE, false, 1.8);
  let yy = y - 40;
  guia.forEach(([n], k) => {
    bloques[k].forEach((l, j) => {
      if (j === 0) {
        texto(n, M + 14, yy, tg, negrita, GRANATE);
        texto(l.slice(n.length), M + 14 + ancho(n, negrita, tg), yy, tg);
      } else texto(l, M + 14, yy, tg);
      yy -= 11;
    });
    yy -= 4;
  });
  yy -= 4;
  pag.drawRectangle({ x: M + 14, y: yy - (lnota.length * 11 - 8), width: 2, height: lnota.length * 11 + 2, color: GRANATE });
  lnota.forEach((l) => { texto(l, M + 28, yy, tg, normal, rgb(0.33, 0.33, 0.33)); yy -= 11; });
  y -= altoGuia + 30;

  /* ---------- tablas ---------- */
  type Col = { x0: number; x1: number };
  const tabla = (
    x0: number, ancho_: number, cab: string, filas: Fila[],
    et: (f: Fila) => string, etiquetaDelante: boolean,
    y0: number, filaAlto: number, repetir: boolean,
  ) => {
    const cV: Col = { x0: x0 + ancho_ - 56, x1: x0 + ancho_ - 56 };
    const cP = x0 + ancho_ - 4;
    const barraX = x0 + ancho_ * (repetir ? 0.45 : 0.5);
    const barraMax = cV.x0 - 40 - barraX;
    const max = Math.max(1, ...filas.map((f) => f.visitantes));
    let yt = y0;

    const cabecera = () => {
      texto(cab.toUpperCase(), x0 + 4, yt - 14, 6.5, sans, GRIS, false, 1.4);
      texto("VISITANTES", cV.x0 - 6, yt - 14, 6.5, sans, GRIS, true, 1.2);
      texto("PÁGINAS", cP, yt - 10, 6.5, sans, GRIS, true, 1.2);
      texto("VISTAS", cP, yt - 19, 6.5, sans, GRIS, true, 1.2);
      yt -= 28;
      pag.drawLine({ start: { x: x0, y: yt }, end: { x: x0 + ancho_, y: yt }, thickness: 0.5, color: LINEA });
    };
    cabecera();
    filas.forEach((f, k) => {
      if (repetir && yt - filaAlto < M + 24) {
        nueva();
        yt = y;
        cabecera();
      }
      yt -= filaAlto;
      if (k % 2 === 1) pag.drawRectangle({ x: x0, y: yt, width: ancho_, height: filaAlto, color: rgb(0.984, 0.976, 0.965) });
      const base = yt + filaAlto / 2 - 3;
      let tx = x0 + 6;
      const codigo = f.codigo ? et(f) : "";
      const dibujaEtiqueta = (x: number) => {
        const w = ancho(codigo, sans, 6) + 8;
        pag.drawRectangle({ x, y: base - 3, width: w, height: 11, color: ETIQ });
        texto(codigo, x + 4, base, 6, sans, ETIQ_TXT);
        return w;
      };
      if (codigo && etiquetaDelante) tx += dibujaEtiqueta(tx) + 5;
      const nombre = recortar(f.etiqueta, normal, 8.5, (barraX - x0) - (tx - x0) - (f.codigo && !etiquetaDelante ? 36 : 8));
      texto(nombre, tx, base, 8.5);
      if (codigo && !etiquetaDelante) dibujaEtiqueta(tx + ancho(nombre, normal, 8.5) + 5);
      pag.drawRectangle({ x: barraX + barraMax - Math.max(2, (f.visitantes / max) * barraMax), y: base - 1, width: Math.max(2, (f.visitantes / max) * barraMax), height: 6, color: BARRA });
      texto(numero(f.visitantes), cV.x0 - 6, base, 8.5, normal, TINTA, true);
      texto(numero(f.paginas), cP, base, 8.5, normal, GRIS, true);
    });
    return yt;
  };

  const mitad = (ANCHO - 24) / 2;
  const sub = (t: string, x: number) => texto(t, x, y, 13, negrita, GRANATE);
  sub("Países de origen", M);
  sub("Fuentes de tráfico", M + mitad + 24);
  const y2 = y - 10;
  const finPaises = tabla(M, mitad, "País", i.paises, (f) => f.codigo ?? "", false, y2, 18, false);
  const yLado = pag;
  const finFuentes = tabla(M + mitad + 24, mitad, "Origen", i.origenes, () => "", false, y2, 18, false);
  void yLado;
  const notaY = finFuentes - 10;
  pag.drawRectangle({ x: M + mitad + 24, y: notaY - 24, width: mitad, height: 24, color: FONDO });
  pag.drawRectangle({ x: M + mitad + 24, y: notaY - 24, width: 2, height: 24, color: GRANATE });
  lineas("Las visitas directas (sin origen registrado) no aparecen en esta tabla.", normal, 7.5, mitad - 20)
    .forEach((l, k) => texto(l, M + mitad + 36, notaY - 10 - k * 9, 7.5, normal, rgb(0.4, 0.4, 0.4)));

  // Las páginas empiezan siempre en hoja nueva, como en el informe de siempre
  nueva();
  texto("Páginas más visitadas", M, y, 13, negrita, GRANATE);
  tabla(M, ANCHO, "Página", i.rutas, (f) => NOMBRE_IDIOMA_INFORME[f.codigo ?? ""] ?? f.codigo ?? "", true, y - 10, 15.5, true);
  void finPaises;

  /* ---------- pie en todas las hojas ---------- */
  for (const p of paginas) {
    pag = p;
    texto("González-Regalado · Informe de analítica web", M, 28, 7.5, normal, GRIS);
    texto(periodo, W - M, 28, 7.5, normal, GRIS, true);
  }

  const bytes = await pdf.save();
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="informe-analitica-${i.hasta}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
