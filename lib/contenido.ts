import es from "@/content/es.json";
import en from "@/content/en.json";
import nb from "@/content/nb.json";
import fr from "@/content/fr.json";
import pt from "@/content/pt.json";
import it from "@/content/it.json";
import de from "@/content/de.json";
import catalogo from "@/content/catalogo.json";
import ferias from "@/content/ferias.json";
import publicaciones from "@/content/publicaciones.json";

/** Orden del selector: los tres de siempre primero, luego los añadidos. Para
 *  sumar un idioma: crear content/<código>.json, importarlo y añadirlo aquí,
 *  a NOMBRE_IDIOMA, a T y a los nombres de categoría de catalogo.json. */
export const IDIOMAS = ["es", "en", "nb", "fr", "pt", "it", "de"] as const;
export type Idioma = (typeof IDIOMAS)[number];
export const IDIOMA_POR_DEFECTO: Idioma = "es";

export const NOMBRE_IDIOMA: Record<Idioma, string> = {
  es: "Español",
  en: "English",
  nb: "Norsk bokmål",
  fr: "Français",
  pt: "Português",
  it: "Italiano",
  de: "Deutsch",
};

/** Un párrafo, titular o punto de lista extraído de la web anterior. */
export type Bloque = { tipo: string; texto: string; href?: string };
export type Pagina = { titulo: string; menu?: string; bloques: Bloque[] };
type Documento = Record<string, Pagina>;

const CONTENIDO: Record<Idioma, Documento> = {
  es: es as Documento,
  en: en as Documento,
  nb: nb as Documento,
  fr: fr as Documento,
  pt: pt as Documento,
  it: it as Documento,
  de: de as Documento,
};

export function esIdioma(v: string): v is Idioma {
  return (IDIOMAS as readonly string[]).includes(v);
}

export function pagina(lang: Idioma, nombre: string): Pagina {
  return CONTENIDO[lang][nombre] ?? { titulo: "", bloques: [] };
}

/** Los bloques de texto de una página, sin el h1 (lo pinta la plantilla). */
export function cuerpo(lang: Idioma, nombre: string): Bloque[] {
  return pagina(lang, nombre).bloques.filter((b) => b.tipo !== "h1");
}

export function titular(lang: Idioma, nombre: string): string {
  const h1 = pagina(lang, nombre).bloques.find((b) => b.tipo === "h1");
  return h1?.texto ?? pagina(lang, nombre).titulo;
}

// ------------------------------------------------------------------ catálogo

export type Gama = "premium" | "seleccion";
export type Producto = {
  id: string;
  categoria: string;
  nombre: string;
  formato: string;
  presentacion: string;
  unidad: string;
  foto: string;
  subcategoria?: string;
  gama?: Gama;
  /** La ficha en la que sale publicado. Varias filas comparten ficha cuando
   *  son el mismo producto en otro envase: el queso manchego venía como 30
   *  filas que eran tres curaciones repetidas por cada peso, y los aceites
   *  traen una fila por formato de botella. */
  grupo?: string;
};

/** Texto de ficha en los siete idiomas, o "" cuando esa ficha no lo lleva. */
export type Multi = Record<Idioma, string> | "";
export function enIdioma(m: Multi, lang: Idioma): string {
  return m ? m[lang] : "";
}

/**
 * Lo que se publica de un producto.
 *
 * El `nombre` de una fila es el código del proveedor —"6X1/2 V FLAVIA DO
 * BAENA" son 6 botellas de medio litro en vidrio— y se conserva intacto para
 * poder cotejar cada ficha con el albarán, pero no se enseña: la web es el
 * escaparate y la tarifa se manda aparte. Aquí va el nombre de escaparate.
 *
 * `antetitulo` es la línea o la curación; `caracter`, lo que define al
 * producto (D.O. Baena, ecológico, 50 % raza ibérica). Ni pesos, ni cajas, ni
 * materiales de envase: eso es logística.
 */
export type Grupo = {
  slug: string;
  categoria: string;
  foto: string;
  antetitulo: Multi;
  titulo: Multi;
  caracter: Multi;
  /** Fuera de la web, pero sin borrar. Los frutos secos esperan a que el
   *  cliente confirme que tiene permiso para comercializarlos; el día que
   *  llegue se quita esta línea y vuelven, con su ficha intacta. */
  oculto?: boolean;
  /** En qué formatos se sirve. No es la unidad de venta —"caja de 24" es
   *  tarifa y no se publica—: es el tamaño de la pieza, que para el queso y
   *  el embutido es lo primero que el comprador quiere ver.
   *  Un valor es texto tal cual cuando es una cifra ("150 g", igual en los
   *  siete idiomas) o va traducido cuando es una palabra ("Pieza entera"). */
  formatos?: Formato[];
};
export type Formato = {
  /** El término que encabeza la fila, o "" para una fila sin término visible.
   *  Cada valor es una clave de `T`, así que la etiqueta sale traducida sola.
   *  "formatos" es la genérica: se usa cuando la forma ya la dice el
   *  antetítulo de la ficha y repetirla en la lista sobraría. */
  forma: "" | "pieza" | "cuna" | "curacion" | "formatos";
  valores: (string | Multi)[];
};
export type Subcategoria = { slug: string; nombre: Record<Idioma, string> };
export type Categoria = {
  slug: string;
  nombre: Record<Idioma, string>;
  total: number;
  subcategorias?: Subcategoria[];
};

export const CATEGORIAS = catalogo.categorias as Categoria[];
export const PRODUCTOS = catalogo.productos as Producto[];
export const GRUPOS = catalogo.grupos as Grupo[];

/** Las que ya tienen referencias. Las demás se publican igual, pero con un
 *  aviso en vez de una rejilla vacía: el cliente quiere que se vea el alcance
 *  de la oferta aunque aún no haya mandado las tarifas. */
export const CATEGORIAS_CON_PRODUCTO = CATEGORIAS.filter((c) => c.total > 0);

export function categoria(slug: string): Categoria | undefined {
  return CATEGORIAS.find((c) => c.slug === slug);
}

/** Un producto con foto por categoría: la parrilla del inicio. */
export function escaparate(n: number): Producto[] {
  const porCategoria = new Map<string, Producto>();
  for (const p of PRODUCTOS) {
    if (p.foto && !porCategoria.has(p.categoria)) porCategoria.set(p.categoria, p);
  }
  const elegidos = [...porCategoria.values()];
  if (elegidos.length < n) {
    for (const p of PRODUCTOS) {
      if (elegidos.length >= n) break;
      if (p.foto && !elegidos.includes(p)) elegidos.push(p);
    }
  }
  return elegidos.slice(0, n);
}

export function productosDe(slug: string): Producto[] {
  return PRODUCTOS.filter((p) => p.categoria === slug);
}

/**
 * Los productos de una categoría repartidos en bloques para pintarlos.
 * Manda la subcategoría (embutidos: salchichón / chorizo / lomo) y, dentro de
 * ella, la gama. Si la categoría no tiene ni una cosa ni la otra devuelve un
 * único bloque sin título, que es el caso de la mayoría.
 */
export function bloquesDe(cat: Categoria, lang: Idioma) {
  const productos = productosDe(cat.slug);
  const grupos = cat.subcategorias?.length
    ? cat.subcategorias.map((s) => ({
        titulo: s.nombre[lang],
        productos: productos.filter((p) => p.subcategoria === s.slug),
      }))
    : [{ titulo: "", productos }];
  return grupos.filter((g) => g.productos.length);
}

/** Las gamas presentes en un grupo, en orden. Vacío si no hay ninguna marcada
 *  (los dos "velita" están sin clasificar a la espera del cliente). */
export function gamasDe(productos: Producto[]): Gama[] {
  return (["premium", "seleccion"] as const).filter((g) =>
    productos.some((p) => p.gama === g),
  );
}

/** Una tarjeta de la rejilla, ya resuelta en un idioma. */
export type Ficha = {
  clave: string;
  antetitulo: string;
  titulo: string;
  caracter: string;
  foto: string;
  formatos: { forma: Formato["forma"]; valores: string[] }[];
};

/**
 * Reparte una lista de filas de tarifa en las fichas que se publican. Cada
 * ficha ocupa el sitio de su primera fila, así que se respeta el orden del
 * catálogo, y las demás filas del mismo producto desaparecen de la rejilla.
 *
 * Una fila sin ficha sale con su nombre en crudo antes que no salir: es un
 * producto nuevo al que todavía no se le ha escrito el nombre de escaparate,
 * y verlo feo en la web avisa; verlo desaparecer, no. Una ficha marcada como
 * `oculto` sí desaparece, que para eso está.
 */
export function fichasDe(productos: Producto[], lang: Idioma): Ficha[] {
  const fichas: Ficha[] = [];
  const hechos = new Set<string>();
  for (const p of productos) {
    const g = p.grupo ? GRUPOS.find((x) => x.slug === p.grupo) : undefined;
    if (!g) {
      fichas.push({
        clave: p.id, antetitulo: "", titulo: p.nombre,
        caracter: p.formato, foto: p.foto, formatos: [],
      });
      continue;
    }
    if (g.oculto || hechos.has(g.slug)) continue;
    hechos.add(g.slug);
    fichas.push({
      clave: g.slug,
      antetitulo: enIdioma(g.antetitulo, lang),
      titulo: enIdioma(g.titulo, lang),
      caracter: enIdioma(g.caracter, lang),
      // si la ficha no fija foto se queda con la de su primera fila
      foto: g.foto || p.foto,
      formatos: (g.formatos ?? []).map((f) => ({
        forma: f.forma,
        valores: f.valores.map((v) => (typeof v === "string" ? v : enIdioma(v, lang))),
      })),
    });
  }
  return fichas;
}

// ------------------------------------------------------------ ferias y eventos

export type Feria = {
  id: string;
  nombre: string;
  ciudad: string;
  pais: Record<Idioma, string>;
  inicio: string;
  fin?: string;
  stand?: string;
  url?: string;
  /** Una fotografía de la feria, que llena la tarjeta a sangre. */
  foto?: string;
  /** O el cartel de la feria, a 4:5, que se enseña entero y sin recortar.
   *  Es el mismo fichero que se publica en redes, así que la tarjeta y la
   *  publicación cuentan lo mismo. Manda sobre `foto` si están los dos. */
  cartel?: string;
  nota?: Partial<Record<Idioma, string>>;
  /** Se puede pedir cita durante la feria. Sin formulario ni backend: un
   *  `mailto:` con el asunto y el cuerpo ya escritos, que es lo que la web
   *  usa para todo lo demás y funciona desde el primer día. */
  reunion?: boolean;
};

export const FERIAS = ferias.ferias as Feria[];

/**
 * Reparte las ferias en próximas y pasadas. Una feria sigue siendo "próxima"
 * durante todos sus días, no solo hasta que empieza: se compara contra `fin`.
 * La página se regenera cada 24 h (ver `revalidate`), así que una feria pasa
 * sola de una lista a otra sin volver a publicar.
 */
export function feriasPorFecha(hoy = new Date()) {
  const dia = hoy.toISOString().slice(0, 10);
  const proximas = FERIAS.filter((f) => (f.fin ?? f.inicio) >= dia).sort((a, b) =>
    a.inicio.localeCompare(b.inicio),
  );
  const pasadas = FERIAS.filter((f) => (f.fin ?? f.inicio) < dia).sort((a, b) =>
    b.inicio.localeCompare(a.inicio),
  );
  return { proximas, pasadas };
}

/** "20–23 de abril de 2027", o un solo día si no hay fecha de fin. */
export function rangoFechas(f: Feria, lang: Idioma): string {
  const LOCALE: Record<Idioma, string> = {
    es: "es-ES", en: "en-GB", nb: "nb-NO", fr: "fr-FR",
    pt: "pt-PT", it: "it-IT", de: "de-DE",
  };
  const desde = new Date(`${f.inicio}T12:00:00Z`);
  const hasta = f.fin ? new Date(`${f.fin}T12:00:00Z`) : null;
  const largo = new Intl.DateTimeFormat(LOCALE[lang], {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  });
  if (!hasta || f.fin === f.inicio) return largo.format(desde);
  // mismo mes: "20–23 de abril de 2027"; distinto: las dos fechas enteras
  const mismoMes =
    desde.getUTCMonth() === hasta.getUTCMonth() &&
    desde.getUTCFullYear() === hasta.getUTCFullYear();
  if (!mismoMes) return `${largo.format(desde)} – ${largo.format(hasta)}`;
  return `${desde.getUTCDate()}–${largo.format(hasta)}`;
}

// ------------------------------------------------------------- publicaciones

/**
 * Una declaración del entrevistado.
 *
 * `texto` es siempre el literal, en el idioma en que se publicó. `traduccion`
 * lleva la versión en los demás: en su propio idioma se enseña el literal, y
 * en los otros la traducción, avisando de que lo es. Traducir una cita sin
 * decirlo es ponerle al entrevistado palabras que no dijo; no traducirla es
 * dejar a seis de los siete idiomas mirando un muro en inglés.
 */
export type Cita = {
  texto: string;
  tema?: Partial<Record<Idioma, string>>;
  traduccion?: Partial<Record<Idioma, string>>;
};

export type Publicacion = {
  id: string;
  medio: string;
  titulo: string;
  fecha: string;
  url?: string;
  foto?: string;
  autor?: string;
  /** En qué idioma se publicó. Manda para decidir si una cita se enseña
   *  literal o traducida. Si falta se da por hecho que está en el idioma que
   *  se está leyendo, y entonces no hay nada que traducir. */
  idioma?: Idioma;
  resumen?: Partial<Record<Idioma, string>>;
  /** Lo que da pie a la ficha propia. Sin citas, "Leer" seguiría llevando
   *  directamente al medio: una página nuestra que solo repitiera el titular
   *  no le añade nada a nadie. */
  citas?: Cita[];
};

/** De la más reciente a la más antigua: en prensa lo último es lo que importa. */
export const PUBLICACIONES = (publicaciones.publicaciones as Publicacion[])
  .slice()
  .sort((a, b) => b.fecha.localeCompare(a.fecha));

/**
 * Una cita lista para pintar: el literal si se está leyendo en su idioma, y si
 * no la traducción. `traducida` avisa a la página de que tiene que decirlo.
 */
export function citaEn(c: Cita, lang: Idioma, idiomaOriginal?: Idioma) {
  const traducida = Boolean(idiomaOriginal && idiomaOriginal !== lang && c.traduccion?.[lang]);
  return {
    texto: traducida ? c.traduccion![lang]! : c.texto,
    // el idioma REAL del texto que se acaba de elegir, para el atributo `lang`
    idioma: traducida ? lang : (idiomaOriginal ?? lang),
    traducida,
    tema: c.tema?.[lang] ?? "",
  };
}

/** La ficha propia solo existe si hay algo que enseñar en ella. */
export function publicacion(id: string): Publicacion | undefined {
  return PUBLICACIONES.find((p) => p.id === id && p.citas?.length);
}

/** Las que tienen ficha propia, para el sitemap y para `generateStaticParams`. */
export const PUBLICACIONES_CON_FICHA = PUBLICACIONES.filter((p) => p.citas?.length);

/** "14 de mayo de 2026" en el idioma que toque. */
export function fechaLarga(iso: string, lang: Idioma): string {
  const LOCALE: Record<Idioma, string> = {
    es: "es-ES", en: "en-GB", nb: "nb-NO", fr: "fr-FR",
    pt: "pt-PT", it: "it-IT", de: "de-DE",
  };
  return new Intl.DateTimeFormat(LOCALE[lang], {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  }).format(new Date(`${iso}T12:00:00Z`));
}

// -------------------------------------------------------------------- textos
// Lo que no venía en la web anterior. Traducción propia, revisable aquí.

type Clave =
  | "verCatalogo" | "catalogo" | "solicitarPrecio" | "todas"
  | "productosIntro" | "precioNota" | "escaparateTitulo" | "escaparateTexto"
  | "contactoTitulo" | "menu" | "cerrar"
  | "verCategoria" | "enPreparacion" | "enPreparacionNota" | "volverCatalogo"
  | "gamaPremium" | "gamaSeleccion" | "pieza" | "cuna" | "curacion" | "formatos"
  | "ferias" | "feriasIntro" | "feriasProximas" | "feriasPasadas" | "feriasVacio"
  | "publicaciones" | "publicacionesIntro" | "publicacionesVacio" | "leer"
  | "leerOriginal" | "volverPublicaciones" | "enPalabrasDe" | "traducidoDe"
  | "pedirReunion" | "asuntoReunion"
  | "colaboraciones" | "enColaboracionCon"
  | "respuesta" | "derechos" | "disenadoPor";

export const T: Record<Idioma, Record<Clave, string>> = {
  es: {
    verCatalogo: "Ver el catálogo",
    catalogo: "Catálogo",
    solicitarPrecio: "Solicitar precios",
    todas: "Todas",
    productosIntro:
      "Nuestra selección por categorías. Consulte precios y condiciones de distribución.",
    precioNota: "Precios y condiciones bajo consulta.",
    escaparateTitulo: "Una selección",
    escaparateTexto:
      "Aceites de oliva virgen extra con D.O., quesos manchegos artesanos, ibéricos y especialidades mediterráneas.",
    contactoTitulo: "Hablemos",
    menu: "Menú",
    cerrar: "Cerrar",
    verCategoria: "Ver categoría",
    enPreparacion: "En preparación",
    enPreparacionNota:
      "Estamos incorporando las referencias de esta categoría. Consúltenos disponibilidad y condiciones.",
    volverCatalogo: "Volver al catálogo",
    gamaPremium: "Gama premium",
    gamaSeleccion: "Gama selección",
    pieza: "Pieza",
    cuna: "Cuña",
    curacion: "Curación",
    formatos: "Formatos",
    ferias: "Ferias y eventos",
    feriasIntro:
      "Dónde encontrarnos. Las ferias en las que participamos y aquellas en las que ya hemos estado.",
    feriasProximas: "Próximas citas",
    feriasPasadas: "Dónde hemos estado",
    feriasVacio:
      "Estamos cerrando el calendario de las próximas ferias. Escríbanos y le avisamos de dónde vamos a estar.",
    publicaciones: "Publicaciones",
    publicacionesIntro:
      "Entrevistas y apariciones en prensa sobre la casa y su trabajo.",
    publicacionesVacio:
      "Estamos reuniendo las entrevistas y publicaciones. Escríbanos si desea material sobre la casa.",
    leer: "Leer",
    leerOriginal: "Leer el original en {medio}",
    volverPublicaciones: "Volver a publicaciones",
    enPalabrasDe: "En palabras de",
    traducidoDe: "Declaraciones traducidas de la entrevista original, en inglés.",
    colaboraciones: "Colaboraciones",
    enColaboracionCon: "En colaboración con",
    pedirReunion: "Solicitar una reunión",
    asuntoReunion: "Reunión en {feria}",
    respuesta:
      "Responderemos a su consulta a la mayor brevedad posible.",
    derechos: "Todos los derechos reservados.",
    disenadoPor: "Diseñado por",
  },
  en: {
    verCatalogo: "View the catalogue",
    catalogo: "Catalogue",
    solicitarPrecio: "Request prices",
    todas: "All",
    productosIntro:
      "Our selection by category. Ask us for prices and distribution terms.",
    precioNota: "Prices and terms on request.",
    escaparateTitulo: "A selection",
    escaparateTexto:
      "P.D.O. extra virgin olive oils, artisan Manchego cheeses, Iberian cured meats and Mediterranean specialities.",
    contactoTitulo: "Get in touch",
    menu: "Menu",
    cerrar: "Close",
    verCategoria: "View category",
    enPreparacion: "Coming soon",
    enPreparacionNota:
      "We are adding the references for this category. Ask us about availability and terms.",
    volverCatalogo: "Back to the catalogue",
    gamaPremium: "Premium range",
    gamaSeleccion: "Selection range",
    pieza: "Whole",
    cuna: "Wedge",
    curacion: "Curing",
    formatos: "Formats",
    ferias: "Trade fairs and events",
    feriasIntro:
      "Where to find us. The fairs we are taking part in and those we have already attended.",
    feriasProximas: "Upcoming",
    feriasPasadas: "Where we have been",
    feriasVacio:
      "We are closing the calendar for the coming fairs. Write to us and we will let you know where we will be.",
    publicaciones: "Press",
    publicacionesIntro:
      "Interviews and press features about the house and its work.",
    publicacionesVacio:
      "We are gathering the interviews and features. Write to us if you would like material about the house.",
    leer: "Read",
    leerOriginal: "Read the original at {medio}",
    volverPublicaciones: "Back to press",
    enPalabrasDe: "In the words of",
    traducidoDe: "Statements as published in the original interview.",
    colaboraciones: "Collaborations",
    enColaboracionCon: "In collaboration with",
    pedirReunion: "Request a meeting",
    asuntoReunion: "Meeting at {feria}",
    respuesta:
      "We will respond to your inquiry as soon as possible.",
    derechos: "All rights reserved.",
    disenadoPor: "Designed by",
  },
  nb: {
    verCatalogo: "Se katalogen",
    catalogo: "Katalog",
    solicitarPrecio: "Be om priser",
    todas: "Alle",
    productosIntro:
      "Vårt utvalg etter kategori. Ta kontakt for priser og distribusjonsvilkår.",
    precioNota: "Priser og vilkår på forespørsel.",
    escaparateTitulo: "Et utvalg",
    escaparateTexto:
      "Ekstra virgin olivenoljer med opprinnelsesbetegnelse, håndverksmessig Manchego-ost, iberiske spekevarer og middelhavsspesialiteter.",
    contactoTitulo: "Ta kontakt",
    menu: "Meny",
    cerrar: "Lukk",
    verCategoria: "Se kategori",
    enPreparacion: "Kommer snart",
    enPreparacionNota:
      "Vi legger inn referansene for denne kategorien. Ta kontakt om tilgjengelighet og betingelser.",
    volverCatalogo: "Tilbake til katalogen",
    gamaPremium: "Premium-serie",
    gamaSeleccion: "Utvalgt serie",
    pieza: "Hel ost",
    cuna: "Kile",
    curacion: "Modning",
    formatos: "Formater",
    ferias: "Messer og arrangementer",
    feriasIntro:
      "Hvor du finner oss. Messene vi deltar på og dem vi allerede har vært på.",
    feriasProximas: "Kommende",
    feriasPasadas: "Hvor vi har vært",
    feriasVacio:
      "Vi ferdigstiller kalenderen for de kommende messene. Ta kontakt, så gir vi beskjed om hvor vi blir å finne.",
    publicaciones: "Presse",
    publicacionesIntro:
      "Intervjuer og presseomtale om huset og arbeidet vårt.",
    publicacionesVacio:
      "Vi samler intervjuene og omtalene. Ta kontakt hvis du ønsker materiale om huset.",
    leer: "Les",
    leerOriginal: "Les originalen i {medio}",
    volverPublicaciones: "Tilbake til presse",
    enPalabrasDe: "Med ordene til",
    traducidoDe: "Uttalelser oversatt fra det opprinnelige intervjuet, på engelsk.",
    colaboraciones: "Samarbeid",
    enColaboracionCon: "I samarbeid med",
    pedirReunion: "Be om et møte",
    asuntoReunion: "Møte på {feria}",
    respuesta:
      "Vi vil svare på din henvendelse så snart som mulig.",
    derechos: "Alle rettigheter reservert.",
    disenadoPor: "Designet av",
  },
  fr: {
    verCatalogo: "Voir le catalogue",
    catalogo: "Catalogue",
    solicitarPrecio: "Demander les prix",
    todas: "Toutes",
    productosIntro:
      "Notre sélection par catégorie. Consultez-nous pour les prix et les conditions de distribution.",
    precioNota: "Prix et conditions sur demande.",
    escaparateTitulo: "Une sélection",
    escaparateTexto:
      "Huiles d’olive vierge extra A.O.P., fromages Manchego artisanaux, charcuterie ibérique et spécialités méditerranéennes.",
    contactoTitulo: "Parlons-en",
    menu: "Menu",
    cerrar: "Fermer",
    verCategoria: "Voir la catégorie",
    enPreparacion: "Bientôt disponible",
    enPreparacionNota:
      "Nous ajoutons les références de cette catégorie. Consultez-nous pour la disponibilité et les conditions.",
    volverCatalogo: "Retour au catalogue",
    gamaPremium: "Gamme premium",
    gamaSeleccion: "Gamme sélection",
    pieza: "Pièce",
    cuna: "Portion",
    curacion: "Affinage",
    formatos: "Formats",
    ferias: "Salons et événements",
    feriasIntro:
      "Où nous rencontrer. Les salons auxquels nous participons et ceux auxquels nous avons déjà participé.",
    feriasProximas: "Prochains rendez-vous",
    feriasPasadas: "Où nous étions",
    feriasVacio:
      "Nous finalisons le calendrier des prochains salons. Écrivez-nous et nous vous dirons où nous serons.",
    publicaciones: "Presse",
    publicacionesIntro:
      "Entretiens et articles de presse sur la maison et son travail.",
    publicacionesVacio:
      "Nous réunissons les entretiens et les articles. Écrivez-nous si vous souhaitez de la documentation sur la maison.",
    leer: "Lire",
    leerOriginal: "Lire l’original dans {medio}",
    volverPublicaciones: "Retour à la presse",
    enPalabrasDe: "Dans les mots de",
    traducidoDe: "Propos traduits de l’entretien original, en anglais.",
    colaboraciones: "Collaborations",
    enColaboracionCon: "En collaboration avec",
    pedirReunion: "Demander un rendez-vous",
    asuntoReunion: "Rendez-vous à {feria}",
    respuesta:
      "Nous répondrons à votre demande dans les meilleurs délais.",
    derechos: "Tous droits réservés.",
    disenadoPor: "Conçu par",
  },
  pt: {
    verCatalogo: "Ver o catálogo",
    catalogo: "Catálogo",
    solicitarPrecio: "Solicitar preços",
    todas: "Todas",
    productosIntro:
      "A nossa seleção por categorias. Consulte preços e condições de distribuição.",
    precioNota: "Preços e condições sob consulta.",
    escaparateTitulo: "Uma seleção",
    escaparateTexto:
      "Azeites virgem extra com D.O.P., queijos Manchego artesanais, enchidos ibéricos e especialidades mediterrânicas.",
    contactoTitulo: "Vamos falar",
    menu: "Menu",
    cerrar: "Fechar",
    verCategoria: "Ver categoria",
    enPreparacion: "Em preparação",
    enPreparacionNota:
      "Estamos a incorporar as referências desta categoria. Consulte-nos sobre disponibilidade e condições.",
    volverCatalogo: "Voltar ao catálogo",
    gamaPremium: "Gama premium",
    gamaSeleccion: "Gama seleção",
    pieza: "Peça",
    cuna: "Cunha",
    curacion: "Cura",
    formatos: "Formatos",
    ferias: "Feiras e eventos",
    feriasIntro:
      "Onde nos encontrar. As feiras em que participamos e aquelas onde já estivemos.",
    feriasProximas: "Próximos encontros",
    feriasPasadas: "Onde já estivemos",
    feriasVacio:
      "Estamos a fechar o calendário das próximas feiras. Escreva-nos e avisamos onde vamos estar.",
    publicaciones: "Publicações",
    publicacionesIntro:
      "Entrevistas e presença na imprensa sobre a casa e o seu trabalho.",
    publicacionesVacio:
      "Estamos a reunir as entrevistas e publicações. Escreva-nos se desejar material sobre a casa.",
    leer: "Ler",
    leerOriginal: "Ler o original em {medio}",
    volverPublicaciones: "Voltar às publicações",
    enPalabrasDe: "Nas palavras de",
    traducidoDe: "Declarações traduzidas da entrevista original, em inglês.",
    colaboraciones: "Colaborações",
    enColaboracionCon: "Em colaboração com",
    pedirReunion: "Solicitar uma reunião",
    asuntoReunion: "Reunião na {feria}",
    respuesta:
      "Responderemos à sua consulta com a maior brevidade possível.",
    derechos: "Todos os direitos reservados.",
    disenadoPor: "Concebido por",
  },
  it: {
    verCatalogo: "Vedi il catalogo",
    catalogo: "Catalogo",
    solicitarPrecio: "Richiedi i prezzi",
    todas: "Tutte",
    productosIntro:
      "La nostra selezione per categoria. Ci contatti per prezzi e condizioni di distribuzione.",
    precioNota: "Prezzi e condizioni su richiesta.",
    escaparateTitulo: "Una selezione",
    escaparateTexto:
      "Oli extravergine di oliva D.O.P., formaggi Manchego artigianali, salumi iberici e specialità mediterranee.",
    contactoTitulo: "Parliamone",
    menu: "Menu",
    cerrar: "Chiudi",
    verCategoria: "Vedi categoria",
    enPreparacion: "In preparazione",
    enPreparacionNota:
      "Stiamo inserendo le referenze di questa categoria. Ci contatti per disponibilità e condizioni.",
    volverCatalogo: "Torna al catalogo",
    gamaPremium: "Gamma premium",
    gamaSeleccion: "Gamma selezione",
    pieza: "Forma",
    cuna: "Spicchio",
    curacion: "Stagionatura",
    formatos: "Formati",
    ferias: "Fiere ed eventi",
    feriasIntro:
      "Dove trovarci. Le fiere a cui partecipiamo e quelle a cui siamo già stati.",
    feriasProximas: "Prossimi appuntamenti",
    feriasPasadas: "Dove siamo stati",
    feriasVacio:
      "Stiamo definendo il calendario delle prossime fiere. Ci scriva e le faremo sapere dove saremo.",
    publicaciones: "Rassegna stampa",
    publicacionesIntro:
      "Interviste e articoli sulla casa e sul suo lavoro.",
    publicacionesVacio:
      "Stiamo raccogliendo le interviste e gli articoli. Ci scriva se desidera materiale sulla casa.",
    leer: "Leggi",
    leerOriginal: "Leggi l’originale su {medio}",
    volverPublicaciones: "Torna alla rassegna stampa",
    enPalabrasDe: "Nelle parole di",
    traducidoDe: "Dichiarazioni tradotte dall’intervista originale, in inglese.",
    colaboraciones: "Collaborazioni",
    enColaboracionCon: "In collaborazione con",
    pedirReunion: "Richiedere un incontro",
    asuntoReunion: "Incontro a {feria}",
    respuesta:
      "Risponderemo alla sua richiesta nel più breve tempo possibile.",
    derechos: "Tutti i diritti riservati.",
    disenadoPor: "Progettato da",
  },
  de: {
    verCatalogo: "Zum Katalog",
    catalogo: "Katalog",
    solicitarPrecio: "Preise anfragen",
    todas: "Alle",
    productosIntro:
      "Unsere Auswahl nach Kategorien. Fragen Sie uns nach Preisen und Vertriebskonditionen.",
    precioNota: "Preise und Konditionen auf Anfrage.",
    escaparateTitulo: "Eine Auswahl",
    escaparateTexto:
      "Native Olivenöle extra mit g.U., handwerklich hergestellter Manchego-Käse, iberische Wurstwaren und mediterrane Spezialitäten.",
    contactoTitulo: "Sprechen wir",
    menu: "Menü",
    cerrar: "Schließen",
    verCategoria: "Kategorie ansehen",
    enPreparacion: "In Vorbereitung",
    enPreparacionNota:
      "Wir nehmen die Artikel dieser Kategorie gerade auf. Fragen Sie uns nach Verfügbarkeit und Konditionen.",
    volverCatalogo: "Zurück zum Katalog",
    gamaPremium: "Premium-Linie",
    gamaSeleccion: "Auswahl-Linie",
    pieza: "Laib",
    cuna: "Stück",
    curacion: "Reifung",
    formatos: "Formate",
    ferias: "Messen und Veranstaltungen",
    feriasIntro:
      "Wo Sie uns finden. Die Messen, an denen wir teilnehmen, und jene, auf denen wir bereits waren.",
    feriasProximas: "Kommende Termine",
    feriasPasadas: "Wo wir waren",
    feriasVacio:
      "Wir stellen gerade den Kalender der kommenden Messen fertig. Schreiben Sie uns, und wir sagen Ihnen, wo wir sein werden.",
    publicaciones: "Presse",
    publicacionesIntro:
      "Interviews und Presseberichte über das Haus und seine Arbeit.",
    publicacionesVacio:
      "Wir stellen die Interviews und Berichte gerade zusammen. Schreiben Sie uns, wenn Sie Material über das Haus wünschen.",
    leer: "Lesen",
    leerOriginal: "Das Original bei {medio} lesen",
    volverPublicaciones: "Zurück zur Presse",
    enPalabrasDe: "In den Worten von",
    traducidoDe: "Aussagen aus dem englischsprachigen Originalinterview übersetzt.",
    colaboraciones: "Kooperationen",
    enColaboracionCon: "In Zusammenarbeit mit",
    pedirReunion: "Termin anfragen",
    asuntoReunion: "Termin auf der {feria}",
    respuesta:
      "Wir beantworten Ihre Anfrage so schnell wie möglich.",
    derechos: "Alle Rechte vorbehalten.",
    disenadoPor: "Gestaltet von",
  },
};

/**
 * Con quién colabora la casa.
 *
 * Se enseña en dos sitios y en ninguno hace sección propia: pequeña en el pie,
 * que la acompaña por toda la web sin pesar, y con su párrafo al final de
 * "Quiénes somos", que es donde esto se cuenta.
 *
 * La marca va tal cual, en blanco y con sus filetes de color, sobre una placa
 * negra: la web ya tiene bloques oscuros —el hero, el contacto, las cabeceras
 * de categoría—, así que la placa es de la casa y el logotipo ajeno no hay que
 * recolorearlo para que encaje.
 *
 * OJO: el texto dice solo lo que se lee en el cartel que mandó el cliente
 * —nombre, academia de fútbol, Madrid y Guinea Ecuatorial— porque no hay nada
 * más confirmado. En ese cartel González-Regalado NO figura todavía entre los
 * patrocinadores ni entre los colaboradores. CONFIRMAR con el cliente en qué
 * nivel entra y ampliar el párrafo con lo que él quiera contar.
 */
export const COLABORACION = {
  nombre: "Benjamín Zarandona Football Academy",
  lugar: "Madrid · Guinea Ecuatorial",
  marca: "/marca/bz-academy.png",
  /** La publicación en la que se anuncia. Al ser de Instagram no se puede
   *  incrustar sin cargarles su script a todos los visitantes, así que la
   *  placa es sencillamente un enlace que abre la publicación. */
  url: "https://www.instagram.com/p/DakAz4rgn63/?img_index=1",
  texto: {
    es: "La casa colabora con la Benjamín Zarandona Football Academy, la academia de fútbol con sede en Madrid y Guinea Ecuatorial.",
    en: "The house collaborates with the Benjamín Zarandona Football Academy, the football academy based in Madrid and Equatorial Guinea.",
    nb: "Huset samarbeider med Benjamín Zarandona Football Academy, fotballakademiet med tilhold i Madrid og Ekvatorial-Guinea.",
    fr: "La maison collabore avec la Benjamín Zarandona Football Academy, l’académie de football basée à Madrid et en Guinée équatoriale.",
    pt: "A casa colabora com a Benjamín Zarandona Football Academy, a academia de futebol com sede em Madrid e na Guiné Equatorial.",
    it: "La casa collabora con la Benjamín Zarandona Football Academy, l’accademia di calcio con sede a Madrid e in Guinea Equatoriale.",
    de: "Das Haus arbeitet mit der Benjamín Zarandona Football Academy zusammen, der Fußballakademie mit Sitz in Madrid und Äquatorialguinea.",
  } as Record<Idioma, string>,
} as const;

/** Quién firma la web. La anterior llevaba el crédito del desarrollador
 *  anterior; este ocupa su sitio. */
export const ESTUDIO = {
  nombre: "NeumorStudio",
  url: "https://www.neumorstudio.com",
} as const;

/** Datos de contacto, tal y como estaban en la web anterior. */
export const CONTACTO = {
  email: "contacto@regaladogourmet.com",
  telefonos: [
    { pais: { es: "España", en: "Spain", nb: "Spania", fr: "Espagne", pt: "Espanha", it: "Spagna", de: "Spanien" }, numero: "+34 671 474 116" },
    { pais: { es: "Noruega", en: "Norway", nb: "Norge", fr: "Norvège", pt: "Noruega", it: "Norvegia", de: "Norwegen" }, numero: "+47 98 63 43 85" },
  ],
} as const;

/**
 * Fotografía de ambiente, provisional, mientras el cliente manda las suyas.
 * Origen y licencia en content/creditos.json. Para cambiarlas basta con
 * sustituir el fichero en public/ambiente/ con el mismo nombre.
 */
export const AMBIENTE: Record<string, string> = {
  "quesos-manchegos-dop": "/ambiente/quesos.jpg",
  "jamones-ibericos-dop": "/ambiente/jamones-dop.jpg",
  "jamones-ibericos-serrano": "/ambiente/jamones.jpg",
  "embutidos-ibericos": "/ambiente/chacinas.jpg",
  "aceites-premium-do": "/ambiente/aceites.jpg",
  "aceites-horeca": "/ambiente/aceites-horeca.jpg",
  "otros-productos-salsas": "/ambiente/sal-y-especias.jpg",
  "infusiones-tes": "/ambiente/infusiones.jpg",
  vinos: "/ambiente/vinos.jpg",
  tomates: "/ambiente/tomates.jpg",
  // claves antiguas, aún referenciadas por el fundido del hero
  aceites: "/ambiente/aceites.jpg",
  quesos: "/ambiente/quesos.jpg",
  chacinas: "/ambiente/chacinas.jpg",
  aceitunas: "/ambiente/aceitunas.jpg",
  "frutos-secos": "/ambiente/frutos-secos.jpg",
  "sal-y-especias": "/ambiente/sal-y-especias.jpg",
  monodosis: "/ambiente/monodosis.jpg",
};
/**
 * Cuando la cabecera de una categoría no quiere la misma foto que su tarjeta.
 *
 * Por defecto comparten fichero a propósito: la cabecera continúa la imagen
 * que el visitante acaba de pulsar en el catálogo. Pero en quesos las dos
 * fotos hacen oficios distintos —la tarjeta enseña el producto, la cabecera
 * pone ambiente—, así que la cabecera va por libre. Solo se anota aquí la
 * categoría que se sale de la regla; el resto siguen con una sola foto.
 */
export const AMBIENTE_CABECERA: Record<string, string> = {
  "quesos-manchegos-dop": "/ambiente/quesos-tabla.jpg",
};

/** La foto de la cabecera de una categoría: la suya si la tiene, y si no la
 *  misma de su tarjeta en el catálogo. */
export function cabecera(slug: string): string | undefined {
  return AMBIENTE_CABECERA[slug] ?? AMBIENTE[slug];
}

/**
 * La foto que abre la portada. Es la misma que encabeza la sección de quesos,
 * y no pasa nada: en el hero se ve un momento y cruzándose con otras dos, y
 * quien llega a la ficha de quesos ya viene de haberla visto. Antes abría el
 * bodegón de aceite, que sigue en el fundido en segundo lugar.
 */
export const AMBIENTE_PORTADA = "/ambiente/quesos-tabla.jpg";

/** Las páginas de contenido, para el sitemap. El orden del menú NO sale de
 *  aquí: se declara en app/[lang]/layout.tsx, donde se ve entero. */
export const RUTAS = ["about", "products", "contact"] as const;
export const RUTAS_LEGALES = ["terms", "privacy", "legal"] as const;

/** El dominio definitivo. Los canonical apuntan aquí aunque el deploy viva en
 *  vercel.app, para que Google no indexe la copia de pruebas. */
export const SITIO = "https://regaladogourmet.com";

/** Todas las páginas del sitio, "index" incluida. Para el sitemap. */
export const PAGINAS = ["index", ...RUTAS, ...RUTAS_LEGALES] as const;

/** La URL de una página: `/es/` la portada, `/es/about/` el resto. La barra
 *  final es obligatoria — con `trailingSlash: true` la versión sin barra
 *  redirige, y un canonical que redirige es un canonical desperdiciado. */
export function ruta(lang: Idioma, nombre: string): string {
  return nombre === "index" ? `/${lang}/` : `/${lang}/${nombre}/`;
}

/**
 * Título, descripción y enlaces de idioma de una página.
 * Next no hereda `alternates` del layout a las páginas hijas, así que cada
 * `page.tsx` tiene que declararlos por su cuenta o se queda sin canonical.
 */
export function metadatos(lang: Idioma, nombre: string) {
  const p = pagina(lang, nombre);
  const descripcion =
    p.bloques.find((b) => b.tipo === "p" && b.texto.length > 60)?.texto ??
    pagina(lang, "index").bloques.find((b) => b.tipo === "p" && b.texto.length > 60)
      ?.texto ??
    "";
  return {
    title: p.titulo,
    description: descripcion,
    alternates: {
      canonical: ruta(lang, nombre),
      languages: Object.fromEntries(IDIOMAS.map((l) => [l, ruta(l, nombre)])),
    },
    openGraph: {
      title: p.titulo,
      description: descripcion,
      url: ruta(lang, nombre),
      siteName: "González-Regalado Gourmet",
      locale: lang,
      type: "website" as const,
    },
  };
}
