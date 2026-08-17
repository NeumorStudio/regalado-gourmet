import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  esIdioma, publicacion, citaEn, fechaLarga, PUBLICACIONES_CON_FICHA,
  IDIOMAS, SITIO, T, CONTACTO, type Idioma,
} from "@/lib/contenido";

export function generateStaticParams() {
  return IDIOMAS.flatMap((lang) =>
    PUBLICACIONES_CON_FICHA.map((p) => ({ lang, slug: p.id })),
  );
}

export async function generateMetadata({
  params,
}: { params: Promise<{ lang: string; slug: string }> }): Promise<Metadata> {
  const { lang, slug } = await params;
  const p = publicacion(slug);
  if (!esIdioma(lang) || !p) return {};
  const l = lang as Idioma;
  const url = `/${l}/press/${p.id}/`;
  return {
    title: p.titulo,
    description: p.resumen?.[l] ?? `${p.medio} · ${p.titulo}`,
    alternates: {
      canonical: url,
      languages: Object.fromEntries(IDIOMAS.map((x) => [x, `/${x}/press/${p.id}/`])),
    },
    openGraph: {
      title: p.titulo,
      description: p.resumen?.[l] ?? "",
      url,
      siteName: "González-Regalado Gourmet",
      locale: l,
      type: "article",
      images: p.foto ? [`${SITIO}${p.foto}`] : undefined,
    },
  };
}

/**
 * La ficha de una publicación en casa.
 *
 * NO reproduce el artículo: eso es del medio. Lo que se recoge son las
 * declaraciones del entrevistado —sus palabras, en el idioma en que las dijo—,
 * el resumen de la casa y un enlace bien visible al original. Es lo que hace
 * cualquier sala de prensa, y es lo que se puede publicar sin pedirle permiso
 * a nadie.
 */
export default async function Publicacion({
  params,
}: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  const p = publicacion(slug);
  if (!esIdioma(lang) || !p) notFound();
  const l = lang as Idioma;
  const t = T[l];

  return (
    <>
      <section className="border-b border-linea bg-crema">
        <div className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-20">
          <Link
            href={`/${l}/press/`}
            className="-mt-2 inline-flex min-h-11 items-center font-sans text-sm text-tinta-3 underline-offset-4 hover:text-oro-tinta hover:underline"
          >
            ← {t.volverPublicaciones}
          </Link>
          <p className="etiqueta mt-5">
            {p.medio}
            <span className="ml-3 font-normal normal-case tracking-normal text-tinta-3">
              {fechaLarga(p.fecha, l)}
            </span>
          </p>
          {/* El titular va como se publicó, sin traducir: es de quien lo
              escribió. Lo que se traduce es lo que ponemos nosotros. El `lang`
              sale de la publicación, no de adivinarlo por el nombre del medio. */}
          <h1
            className="mt-3 text-balance"
            style={{ fontSize: "var(--text-titulo)", lineHeight: 1.12 }}
            lang={p.idioma && p.idioma !== l ? p.idioma : undefined}
          >
            {p.titulo}
          </h1>
          <div className="filete mt-6" />
        </div>
      </section>

      <article className="mx-auto w-full max-w-3xl px-6 py-14 sm:py-16">
        {p.foto && (
          <div className="relative mb-10 aspect-[3/2] overflow-hidden rounded-sm bg-crema">
            <Image
              src={p.foto}
              alt=""
              fill
              priority
              sizes="(max-width: 768px) 100vw, 48rem"
              className="object-cover"
            />
          </div>
        )}

        {p.resumen?.[l] && (
          <p className="max-w-2xl text-lg leading-relaxed text-tinta-2 text-pretty">
            {p.resumen[l]}
          </p>
        )}

        {p.citas?.length ? (
          <div className="mt-12">
            {p.autor && (
              <p className="etiqueta">
                {t.enPalabrasDe}{" "}
                <span className="font-normal normal-case tracking-normal text-tinta-2">
                  {p.autor}
                </span>
              </p>
            )}
            <div className="mt-8 space-y-10">
              {p.citas.map((cita) => {
                const c = citaEn(cita, l, p.idioma);
                return (
                  <figure key={cita.texto} className="border-l-2 border-oro pl-6 sm:pl-8">
                    {c.tema && <figcaption className="etiqueta">{c.tema}</figcaption>}
                    {/* El `lang` es el del texto que se acaba de elegir, no el
                        de la página ni el del original: si se enseña traducida
                        va en el idioma de la web, y si se enseña literal va en
                        el suyo. Sin esto un lector de pantalla leería el inglés
                        con fonética española. */}
                    <blockquote
                      lang={c.idioma}
                      className="mt-2 text-xl leading-snug text-pretty sm:text-2xl"
                    >
                      {c.texto}
                    </blockquote>
                  </figure>
                );
              })}
            </div>

            {/* Se dice una vez debajo de las tres, no en cada una: repetirlo
                pesaría más que el propio aviso. Solo aparece si de verdad se
                está leyendo una traducción. */}
            {p.citas.some((cita) => citaEn(cita, l, p.idioma).traducida) && (
              <p className="mt-8 font-sans text-xs text-tinta-3">{t.traducidoDe}</p>
            )}
          </div>
        ) : null}

        {p.url && (
          <div className="mt-14 border-t border-linea pt-8">
            <a
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 placa oro-lamina px-7 py-3.5 font-sans text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-negro"
            >
              {t.leerOriginal.replace("{medio}", p.medio)}
              <span aria-hidden>→</span>
            </a>
          </div>
        )}
      </article>

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
