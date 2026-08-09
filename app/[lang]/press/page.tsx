import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  esIdioma, PUBLICACIONES, fechaLarga, IDIOMAS,
  T, type Publicacion, type Idioma,
} from "@/lib/contenido";

export function generateStaticParams() {
  return IDIOMAS.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!esIdioma(lang)) return {};
  const l = lang as Idioma;
  return {
    title: T[l].publicaciones,
    description: T[l].publicacionesIntro,
    alternates: {
      canonical: `/${l}/press/`,
      languages: Object.fromEntries(IDIOMAS.map((x) => [x, `/${x}/press/`])),
    },
  };
}

function Ficha({ p, lang, t }: { p: Publicacion; lang: Idioma; t: Record<string, string> }) {
  const resumen = p.resumen?.[lang];
  return (
    <li className="grid gap-6 border-t border-linea py-8 sm:grid-cols-[13rem_1fr] sm:gap-8">
      {/* Igual que en ferias: el hueco se reserva siempre para que las fichas
          con y sin imagen mantengan la misma línea de salida. */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-crema">
        {p.foto && (
          <Image src={p.foto} alt="" fill sizes="(max-width: 640px) 100vw, 13rem" className="object-cover" />
        )}
      </div>

      <div>
        <p className="etiqueta">
          {p.medio}
          <span className="ml-3 font-normal normal-case tracking-normal text-tinta-3">
            {fechaLarga(p.fecha, lang)}
          </span>
        </p>
        <h2 className="mt-2 text-balance" style={{ fontSize: "var(--text-seccion)", lineHeight: 1.2 }}>
          {p.titulo}
        </h2>
        {resumen && <p className="mt-3 max-w-2xl text-tinta-2 text-pretty">{resumen}</p>}
        {p.url && (
          <a
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex min-h-11 items-center gap-2 font-sans text-sm text-oro-tinta underline-offset-4 hover:underline"
          >
            {t.leer}
            <span aria-hidden>→</span>
          </a>
        )}
      </div>
    </li>
  );
}

export default async function Prensa({
  params,
}: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!esIdioma(lang)) notFound();
  const l = lang as Idioma;
  const t = T[l];

  return (
    <>
      <section className="border-b border-linea bg-crema">
        <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
          <h1 className="text-balance" style={{ fontSize: "var(--text-titulo)", lineHeight: 1.12 }}>
            {t.publicaciones}
          </h1>
          <div className="filete my-6" />
          <p className="max-w-2xl text-lg text-tinta-2 text-pretty">{t.publicacionesIntro}</p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 py-14 sm:py-16">
        {PUBLICACIONES.length === 0 ? (
          <div className="mx-auto max-w-2xl py-10 text-center">
            <p className="text-lg text-tinta-2 text-pretty">{t.publicacionesVacio}</p>
            <Link
              href={`/${l}/contact/`}
              className="mt-8 inline-flex items-center gap-2 placa bg-oro px-7 py-3.5 font-sans text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-negro hover:bg-oro-fuerte"
            >
              {t.contactoTitulo}
              <span aria-hidden>→</span>
            </Link>
          </div>
        ) : (
          <ul>
            {PUBLICACIONES.map((p) => (
              <Ficha key={p.id} p={p} lang={l} t={t} />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
