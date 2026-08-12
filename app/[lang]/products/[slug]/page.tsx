import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  esIdioma, categoria, bloquesDe, gamasDe, fichasDe, AMBIENTE, IDIOMAS, CATEGORIAS,
  SITIO, T, CONTACTO, ruta, type Idioma, type Producto,
} from "@/lib/contenido";

export function generateStaticParams() {
  return IDIOMAS.flatMap((lang) => CATEGORIAS.map((c) => ({ lang, slug: c.slug })));
}

export async function generateMetadata({
  params,
}: { params: Promise<{ lang: string; slug: string }> }): Promise<Metadata> {
  const { lang, slug } = await params;
  const cat = categoria(slug);
  if (!esIdioma(lang) || !cat) return {};
  const l = lang as Idioma;
  const url = `${ruta(l, "products")}${cat.slug}/`;
  return {
    title: cat.nombre[l],
    description: `${cat.nombre[l]} — ${T[l].productosIntro}`,
    alternates: {
      canonical: url,
      languages: Object.fromEntries(
        IDIOMAS.map((x) => [x, `${ruta(x, "products")}${cat.slug}/`]),
      ),
    },
    openGraph: {
      title: cat.nombre[l],
      url,
      siteName: "González-Regalado Gourmet",
      locale: l,
      type: "website",
      images: AMBIENTE[cat.slug] ? [`${SITIO}${AMBIENTE[cat.slug]}`] : undefined,
    },
  };
}

/**
 * La rejilla de productos. Ni precios ni cantidades: la web es el escaparate y
 * la tarifa detallada se manda aparte.
 *
 * Una tarjeta por producto, no por línea de tarifa. El queso manchego llegaba
 * como treinta filas que eran tres curaciones repetidas por cada peso, con la
 * misma foto doce veces, y los aceites como una fila por formato de botella;
 * las 92 filas del catálogo se publican en 63 fichas. Ver `fichasDe`.
 */
function Rejilla({ productos, lang }: { productos: Producto[]; lang: Idioma }) {
  const fichas = fichasDe(productos, lang);
  // Si alguna ficha de esta rejilla lleva antetítulo, todas le guardan el
  // sitio: sin eso el nombre de las que no lo tienen sube una línea y la fila
  // queda descuadrada. Cuando no lo lleva ninguna (los frutos secos, por
  // ejemplo) no se reserva nada y no sobra un hueco en cada tarjeta.
  const conAntetitulo = fichas.some((f) => f.antetitulo);
  return (
    <ul className="mt-8 grid grid-cols-2 items-start gap-x-5 gap-y-9 sm:grid-cols-3 lg:grid-cols-4">
      {fichas.map((f) => (
        <li key={f.clave} className="group flex flex-col">
          {/* `object-cover` sin relleno, y el fondo en negro y no en blanco.
              Con los recortes de proveedor sobre blanco hacía falta
              `object-contain` y un margen para que el envase no llegara al
              canto; ahora la ficha es un bodegón cuadrado que se compuso ya
              con su aire dentro, y dejarlo `contain` sobre blanco lo dibujaba
              flotando en un marco claro que partía la rejilla en dos
              lenguajes. El negro es además lo que hay bajo la foto mientras
              carga, así que no hay destello blanco. */}
          <div className="grabado grabado-menudo relative aspect-square overflow-hidden rounded-sm border border-linea bg-negro">
            {f.foto ? (
              <Image
                src={f.foto}
                alt={f.titulo}
                width={680}
                height={680}
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 ease-[var(--ease-salida)] group-hover:scale-[1.04]"
              />
            ) : (
              <div className="grid h-full w-full place-items-center bg-crema px-3 text-center font-sans text-[0.65rem] uppercase tracking-wider text-tinta-3">
                {f.titulo}
              </div>
            )}
          </div>

          {/* La línea o la curación van de antetítulo: es lo que separa esta
              ficha de sus hermanas y lo que el comprador busca primero.
              El alto mínimo va en `1lh` y no en `em`: es exactamente una línea
              de ESTE párrafo, así que el hueco que se reserva cuando la ficha
              no tiene antetítulo mide lo mismo que el antetítulo al que
              sustituye, pase lo que pase con la fuente. */}
          {conAntetitulo && (
            <p className="etiqueta mt-3 min-h-[1lh]">{f.antetitulo}</p>
          )}
          <p className={`leading-snug text-balance ${conAntetitulo ? "mt-1" : "mt-3"}`}>
            {f.titulo}
          </p>
          {f.caracter && (
            <p className="mt-1 font-sans text-xs text-tinta-3">{f.caracter}</p>
          )}
        </li>
      ))}
    </ul>
  );
}

export default async function Categoria({
  params,
}: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  const cat = categoria(slug);
  if (!esIdioma(lang) || !cat) notFound();
  const l = lang as Idioma;
  const t = T[l];
  const foto = AMBIENTE[cat.slug];
  const grupos = bloquesDe(cat, l);

  return (
    <>
      {/* Cabecera con la foto de la categoría de fondo: es la que el visitante
          acaba de pulsar en el índice, así que la continuidad se agradece. */}
      <section className="abre-oscuro relative overflow-hidden bg-negro text-white">
        {foto && (
          <Image src={foto} alt="" fill priority sizes="100vw" className="object-cover opacity-45" />
        )}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-negro via-negro/70 to-negro/30" />
        <div className="ancla-cabecera relative mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
          <Link
            href={`/${l}/products/`}
            className="-mt-2 inline-flex min-h-11 items-center font-sans text-sm text-white/70 underline-offset-4 hover:text-oro hover:underline"
          >
            ← {t.volverCatalogo}
          </Link>
          <h1 className="mt-5 text-balance" style={{ fontSize: "var(--text-titulo)", lineHeight: 1.12 }}>
            {cat.nombre[l]}
          </h1>
          <div className="filete mt-6" />
        </div>
      </section>

      {cat.total === 0 ? (
        <section className="mx-auto w-full max-w-3xl px-6 py-20 text-center sm:py-24">
          <p className="etiqueta">{t.enPreparacion}</p>
          <p className="mt-4 text-lg text-tinta-2 text-pretty">{t.enPreparacionNota}</p>
          <Link
            href={`/${l}/contact/`}
            className="mt-8 inline-flex items-center gap-2 placa oro-lamina px-7 py-3.5 font-sans text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-negro"
          >
            {t.solicitarPrecio}
            <span aria-hidden>→</span>
          </Link>
        </section>
      ) : (
        <section className="mx-auto w-full max-w-6xl px-6 py-14 sm:py-16">
          {grupos.map((grupo) => {
            const gamas = gamasDe(grupo.productos);
            return (
              <div key={grupo.titulo} className="mb-14 last:mb-0">
                {grupo.titulo && (
                  <h2
                    className="border-b-2 border-negro pb-4 text-balance"
                    style={{ fontSize: "var(--text-seccion)" }}
                  >
                    {grupo.titulo}
                  </h2>
                )}
                {/* Las dos gamas solo se separan cuando ambas están marcadas.
                    Con una sola (o ninguna) sería un titular sin contraste. */}
                {gamas.length > 1 ? (
                  gamas.map((g) => (
                    <div key={g} className="mt-8">
                      <p className="etiqueta">
                        {g === "premium" ? t.gamaPremium : t.gamaSeleccion}
                      </p>
                      <Rejilla productos={grupo.productos.filter((p) => p.gama === g)} lang={l} />
                    </div>
                  ))
                ) : (
                  <Rejilla productos={grupo.productos} lang={l} />
                )}
                {/* Los que aún no tienen gama asignada no se pierden. */}
                {gamas.length > 1 && grupo.productos.some((p) => !p.gama) && (
                  <div className="mt-8">
                    <Rejilla productos={grupo.productos.filter((p) => !p.gama)} lang={l} />
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}

      <section className="bg-negro py-16 text-white">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-6 px-6">
          <div>
            <h2 className="text-oro" style={{ fontSize: "var(--text-seccion)" }}>
              {t.contactoTitulo}
            </h2>
            <p className="mt-2 text-[#cbbb99]">{t.precioNota}</p>
          </div>
          <Link
            href={`/${l}/contact/`}
            className="inline-flex items-center gap-2 placa oro-lamina px-7 py-3.5 font-sans text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-negro"
          >
            {t.solicitarPrecio}
            <span aria-hidden>→</span>
          </Link>
        </div>
        <p className="mx-auto mt-8 w-full max-w-6xl px-6 font-sans text-sm text-white/55">
          <a className="inline-flex min-h-11 items-center underline-offset-4 hover:text-oro hover:underline" href={`mailto:${CONTACTO.email}`}>
            {CONTACTO.email}
          </a>
        </p>
      </section>
    </>
  );
}
