/**
 * catalogo.csv -> content/catalogo.json + public/productos/*
 *
 * El CSV lo genera y verifica `catalogo.py` en el proyecto del cliente.
 *
 * REGLA: la web es el catálogo de González-Regalado, no el de sus proveedores.
 * Él es intermediario; si la web dice de quién compra, el cliente final puede
 * saltárselo. Aquí NO se exporta proveedor, marca, código, coste ni margen, y
 * las fotos se renombran para que la URL tampoco lo delate. El catálogo se
 * organiza por CATEGORÍA de producto.
 *
 *   node scripts/importar-catalogo.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, rmSync } from "node:fs";
import { join, extname } from "node:path";

const CLIENTE = "/home/mate0s/Proyectos/Personal/Gonzalez-Regalado";
const RAIZ = new URL("../", import.meta.url).pathname;
const FOTOS = join(RAIZ, "public", "productos");

/** familia del proveedor -> categoría comercial propia. El orden manda en la web. */
const CATEGORIAS = [
  {
    slug: "aceites",
    nombre: { es: "Aceite de oliva virgen extra", en: "Extra virgin olive oil", nb: "Ekstra virgin olivenolje" },
    coincide: /aceite de oliva/i,
  },
  {
    slug: "quesos",
    nombre: { es: "Quesos", en: "Cheeses", nb: "Oster" },
    coincide: /queso|manchego/i,
  },
  {
    slug: "chacinas",
    nombre: { es: "Chacinas e ibéricos", en: "Iberian cured meats", nb: "Iberiske spekevarer" },
    coincide: /ib[ée]rico/i,
  },
  {
    slug: "aceitunas",
    nombre: { es: "Aceitunas", en: "Olives", nb: "Oliven" },
    coincide: /aceituna/i,
  },
  {
    slug: "frutos-secos",
    nombre: { es: "Frutos secos", en: "Nuts and dried fruit", nb: "Nøtter og tørket frukt" },
    coincide: /frutos secos/i,
  },
  {
    slug: "sal-y-especias",
    nombre: { es: "Sal, pimienta y especias", en: "Salt, pepper and spices", nb: "Salt, pepper og krydder" },
    coincide: /sal|pimienta|edulcorante/i,
  },
  {
    slug: "monodosis",
    nombre: { es: "Monodosis y sets", en: "Single portions and sets", nb: "Enkeltporsjoner og sett" },
    coincide: /monodosis|tarrina|set/i,
  },
];

/** Prefijos y siglas de proveedor que aparecen en los nombres de la tarifa. */
const DELATORES = [
  [/^BG\s+/i, ""],            // Borges
  [/^AC\s+CA\s+/i, ""],       // Aceitunas Capricho Andaluz
  [/\bCA\s+VE\b\s*/gi, ""],    // Capricho Andaluz Virgen Extra, en cualquier posición
  [/^CAPRICHO\s+/i, ""],
  [/\bCAPRICHO\s+ANDALUZ\b/gi, ""],
  [/\bD\.?O\.?\s+Manchego\s+Artisan\s+Cheese\b/gi, "Queso Manchego D.O."],
  [/\bDDLL\b/gi, ""],
];

function leerCsv(ruta) {
  const texto = readFileSync(ruta, "utf8").replace(/^﻿/, "");
  const filas = [];
  let campo = "", fila = [], enComillas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (enComillas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') enComillas = false;
      else campo += c;
    } else if (c === '"') enComillas = true;
    else if (c === ";") { fila.push(campo); campo = ""; }
    else if (c === "\n") { fila.push(campo); filas.push(fila); fila = []; campo = ""; }
    else if (c !== "\r") campo += c;
  }
  if (campo || fila.length) { fila.push(campo); filas.push(fila); }
  const cab = filas.shift().map((c) => c.trim());
  return filas.filter((f) => f.length === cab.length)
              .map((f) => Object.fromEntries(cab.map((c, i) => [c, f[i].trim()])));
}

function categoriaDe(familia) {
  return CATEGORIAS.find((c) => c.coincide.test(familia))?.slug ?? "otros";
}

function limpiarNombre(nombre) {
  let n = nombre;
  for (const [re, con] of DELATORES) n = n.replace(re, con);
  return n.replace(/\s{2,}/g, " ").trim();
}

const rutaCsv = join(CLIENTE, "catalogo.csv");
if (!existsSync(rutaCsv)) {
  console.error(`No encuentro ${rutaCsv}`);
  process.exit(1);
}

rmSync(FOTOS, { recursive: true, force: true });
rmSync(join(RAIZ, "public", "marcas"), { recursive: true, force: true });
mkdirSync(FOTOS, { recursive: true });

const filas = leerCsv(rutaCsv);
const usados = new Map();
let sinFoto = 0;

const productos = filas.map((r, i) => {
  let foto = "";
  if (r.foto) {
    const origen = join(CLIENTE, r.foto);
    if (existsSync(origen)) {
      if (!usados.has(origen)) {
        // nombre secuencial: el código del proveedor no debe ir en la URL
        const nombre = `p${String(usados.size + 1).padStart(3, "0")}${extname(r.foto).toLowerCase()}`;
        copyFileSync(origen, join(FOTOS, nombre));
        usados.set(origen, nombre);
      }
      foto = `/productos/${usados.get(origen)}`;
    }
  }
  if (!foto) sinFoto++;
  return {
    id: `a${String(i + 1).padStart(3, "0")}`,
    categoria: categoriaDe(r.familia),
    nombre: limpiarNombre(r.producto_cliente || r.producto),
    formato: [r.formato, r.tamano].filter(Boolean).join(" · "),
    presentacion: r.ud_caja,
    unidad: r.unidad_precio,
    foto,
  };
});

const categorias = CATEGORIAS
  .map((c) => ({ slug: c.slug, nombre: c.nombre, total: productos.filter((p) => p.categoria === c.slug).length }))
  .filter((c) => c.total > 0);

const sinCategoria = productos.filter((p) => p.categoria === "otros");
if (sinCategoria.length) {
  console.warn(`  ⚠ ${sinCategoria.length} productos sin categoría:`);
  for (const p of sinCategoria.slice(0, 5)) console.warn(`      ${p.nombre}`);
}

writeFileSync(join(RAIZ, "content", "catalogo.json"),
              JSON.stringify({ categorias, productos }, null, 2) + "\n", "utf8");

// --------------------------------------------------------- red de seguridad
const texto = JSON.stringify(productos);
const proveedores = [...new Set(filas.map((f) => f.proveedor).concat(filas.map((f) => f.marca)))]
  .filter(Boolean);
const fugas = proveedores.filter((p) => texto.includes(p));
const siglas = ["BG ", "CA VE", "DDLL", "Capricho", "Borges", "Sánchez", "Alcaraz", "Dehesa"]
  .filter((s) => texto.includes(s));
const codigos = filas.map((f) => f.codigo).filter(Boolean).filter((c) => texto.includes(c));

console.log(`  ${productos.length} productos · ${categorias.length} categorías · ${usados.size} fotos · ${sinFoto} sin foto`);
for (const c of categorias) console.log(`      ${c.nombre.es}: ${c.total}`);
const problemas = [...fugas, ...siglas, ...codigos.slice(0, 3)];
console.log(problemas.length
  ? `  ⚠ SE HA COLADO EN EL JSON PÚBLICO: ${[...new Set(problemas)].join(", ")}`
  : "  sin proveedores, marcas ni códigos en el JSON público");
