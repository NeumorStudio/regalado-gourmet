import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  esIdioma, metadatos, titular, CATEGORIAS, AMBIENTE,
  T, CONTACTO, type Idioma,
} from "@/lib/contenido";

export async function generateMetadata({
  params,
}: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!esIdioma(lang)) return {};
  return metadatos(lang, "products");
}

export default async function Catalogo({
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
            {titular(l, "products")}
          </h1>
          <div className="filete my-6" />
          <p className="max-w-2xl text-lg text-tinta-2 text-pretty">{t.productosIntro}</p>
        </div>
      </section>

      {/* Una tarjeta por categoría, foto grande y clicable. Las que aún no
          tienen referencias se publican igual pero apagadas: el cliente quiere
          que se vea el alcance de la oferta, no una rejilla con huecos. */}
      <section className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIAS.map((c) => {
            // Con galería hay algo que ver aunque no haya tarifa, así que la
            // tarjeta ni se apaga ni deja de llevar a su página.
            const vacia = c.total === 0 && !c.galeria?.length;
            const foto = AMBIENTE[c.slug];
            const Contenido = (
              <>
                {/* La foto ocupa la tarjeta entera. Fuera el contador de
                    referencias: es dato de tarifa, no de escaparate, y partía
                    la tarjeta en dos con una banda blanca. */}
                <div className="relative aspect-[4/5] overflow-hidden bg-negro">
                  {foto && (
                    <Image
                      src={foto}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className={`object-cover transition-transform duration-500 ease-[var(--ease-salida)] ${
                        vacia ? "opacity-35 saturate-50" : "opacity-90 group-hover:scale-105"
                      }`}
                    />
                  )}
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-negro/85 via-negro/15 to-transparent" />
                  <div className="pie-tarjeta absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5">
                    <div>
                      {/* Las que aún no tienen referencias lo dicen aquí, donde
                          antes iba la flecha: no llevan a ningún sitio. */}
                      {vacia && (
                        <p className="mb-1.5 font-sans text-[0.7rem] uppercase tracking-[0.14em] text-oro/80">
                          {t.enPreparacion}
                        </p>
                      )}
                      <p className="text-xl text-white text-balance">{c.nombre[l]}</p>
                    </div>
                    {!vacia && (
                      <span
                        aria-hidden
                        className="flecha shrink-0 pb-1 text-oro transition-transform duration-200 group-hover:translate-x-1"
                      >
                        →
                      </span>
                    )}
                  </div>
                </div>
              </>
            );

            return (
              <li key={c.slug}>
                {vacia ? (
                  <div className="grabado block overflow-hidden rounded-sm bg-white p-2.5 ring-1 ring-linea">
                    {Contenido}
                  </div>
                ) : (
                  <Link
                    href={`/${l}/products/${c.slug}/`}
                    className="tarjeta grabado group block overflow-hidden rounded-sm bg-white p-2.5"
                  >
                    {Contenido}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </section>

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
