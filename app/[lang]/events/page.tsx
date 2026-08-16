import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  esIdioma, feriasPorFecha, rangoFechas, IDIOMAS, CONTACTO,
  T, type Feria, type Idioma,
} from "@/lib/contenido";

/* Una feria deja de ser "próxima" el día que termina. Con la página generada
   en el despliegue, esa frontera se congelaría en la fecha de publicación:
   regenerándola cada 24 h el calendario se ordena solo. */
export const revalidate = 86400;

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
    title: T[l].ferias,
    description: T[l].feriasIntro,
    alternates: {
      canonical: `/${l}/events/`,
      languages: Object.fromEntries(IDIOMAS.map((x) => [x, `/${x}/events/`])),
    },
  };
}

function Ficha({ f, lang, pasada }: { f: Feria; lang: Idioma; pasada: boolean }) {
  const nota = f.nota?.[lang];
  const cuerpo = (
    <>
      {/* El hueco de la foto se reserva siempre, la haya o no: si solo lo
          pintan las que tienen imagen, las demás suben su texto y las fechas
          de la fila dejan de alinearse. Sin foto queda un plano en crema. */}
      <div className="relative aspect-[3/2] overflow-hidden rounded-sm bg-crema sm:aspect-[4/3]">
        {f.foto && (
          <Image
            src={f.foto}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className={`object-cover ${pasada ? "opacity-80" : ""}`}
          />
        )}
      </div>
      <p className="etiqueta mt-4">{rangoFechas(f, lang)}</p>
      <h3 className="mt-2 text-balance" style={{ fontSize: "var(--text-seccion)" }}>
        {f.nombre}
      </h3>
      <p className="mt-1 text-tinta-2">
        {f.ciudad}
        <span className="text-tinta-3"> · {f.pais[lang]}</span>
      </p>
      {f.stand && <p className="mt-1 font-sans text-sm text-tinta-3">{f.stand}</p>}
      {nota && <p className="mt-3 text-pretty text-tinta-2">{nota}</p>}
    </>
  );

  const t = T[lang];
  /* Pedir cita durante la feria, que es lo que el cliente quería de esta
     sección: va como asunto, no como stand, porque asiste de visitante.
     Un `mailto:` con el asunto ya escrito y sin formulario: la web no tiene
     backend y así funciona desde el primer día y sin nada que mantener.
     Fuera del <a> que envuelve la tarjeta: un enlace dentro de otro no es
     HTML válido. Y solo en las próximas: pedir cita para una feria que ya
     pasó no lleva a ningún sitio. */
  const cita = f.reunion && !pasada;

  return (
    <li className="border-t border-linea pt-6">
      {f.url ? (
        <a
          href={f.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group block underline-offset-4 hover:[&_h3]:text-oro-tinta hover:[&_h3]:underline"
        >
          {cuerpo}
        </a>
      ) : (
        cuerpo
      )}
      {cita && (
        <a
          href={`mailto:${CONTACTO.email}?subject=${encodeURIComponent(
            t.asuntoReunion.replace("{feria}", f.nombre),
          )}`}
          className="mt-4 inline-flex items-center gap-2 placa oro-lamina px-5 py-2.5 font-sans text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-negro"
        >
          {t.pedirReunion}
          <span aria-hidden>→</span>
        </a>
      )}
    </li>
  );
}

export default async function Eventos({
  params,
}: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!esIdioma(lang)) notFound();
  const l = lang as Idioma;
  const t = T[l];
  const { proximas, pasadas } = feriasPorFecha();

  return (
    <>
      <section className="border-b border-linea bg-crema">
        <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
          <h1 className="text-balance" style={{ fontSize: "var(--text-titulo)", lineHeight: 1.12 }}>
            {t.ferias}
          </h1>
          <div className="filete my-6" />
          <p className="max-w-2xl text-lg text-tinta-2 text-pretty">{t.feriasIntro}</p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-14 sm:py-16">
        {proximas.length === 0 && pasadas.length === 0 ? (
          <div className="mx-auto max-w-2xl py-10 text-center">
            <p className="text-lg text-tinta-2 text-pretty">{t.feriasVacio}</p>
            <Link
              href={`/${l}/contact/`}
              className="mt-8 inline-flex items-center gap-2 placa oro-lamina px-7 py-3.5 font-sans text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-negro"
            >
              {t.contactoTitulo}
              <span aria-hidden>→</span>
            </Link>
          </div>
        ) : (
          <>
            {proximas.length > 0 && (
              <div>
                <h2 className="text-balance" style={{ fontSize: "var(--text-seccion)" }}>
                  {t.feriasProximas}
                </h2>
                <ul className="mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                  {proximas.map((f) => (
                    <Ficha key={f.id} f={f} lang={l} pasada={false} />
                  ))}
                </ul>
              </div>
            )}

            {pasadas.length > 0 && (
              <div className={proximas.length > 0 ? "mt-20" : ""}>
                <h2 className="text-balance" style={{ fontSize: "var(--text-seccion)" }}>
                  {t.feriasPasadas}
                </h2>
                <ul className="mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                  {pasadas.map((f) => (
                    <Ficha key={f.id} f={f} lang={l} pasada />
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}
