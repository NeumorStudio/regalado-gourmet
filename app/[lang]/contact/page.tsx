import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { esIdioma, metadatos, titular, cuerpo, CONTACTO, T, type Idioma } from "@/lib/contenido";

export async function generateMetadata({
  params,
}: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return esIdioma(lang) ? metadatos(lang, "contact") : {};
}

export default async function Contacto({
  params,
}: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!esIdioma(lang)) notFound();
  const l = lang as Idioma;
  const t = T[l];
  // el primer párrafo es la introducción; el resto era la lista de datos, que
  // aquí se pinta desde CONTACTO en vez de como texto corrido
  const intro = cuerpo(l, "contact").find((b) => b.tipo === "p")?.texto ?? "";

  return (
    <>
      <section className="border-b border-linea bg-crema">
        <div className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-20">
          <h1 className="text-balance" style={{ fontSize: "var(--text-titulo)", lineHeight: 1.12 }}>
            {titular(l, "contact")}
          </h1>
          <div className="filete my-6" />
          <p className="max-w-2xl text-lg text-tinta-2 text-pretty">{intro}</p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl px-6 py-14 sm:py-16">
        <dl className="grid gap-px overflow-hidden rounded-sm border border-linea bg-linea sm:grid-cols-[1.6fr_1fr_1fr]">
          <div className="bg-white px-6 py-8">
            <dt className="etiqueta">Email</dt>
            <dd className="mt-2">
              <a
                className="inline-flex min-h-11 items-center [overflow-wrap:anywhere] text-tinta underline-offset-4 hover:text-oro-tinta hover:underline"
                href={`mailto:${CONTACTO.email}`}
              >
                {CONTACTO.email}
              </a>
            </dd>
          </div>
          {CONTACTO.telefonos.map((tel) => (
            <div key={tel.numero} className="bg-white px-6 py-8">
              <dt className="etiqueta">{t.telefono} {tel.pais[l]}</dt>
              <dd className="mt-2">
                <a
                  className="inline-flex min-h-11 items-center whitespace-nowrap text-tinta underline-offset-4 hover:text-oro-tinta hover:underline"
                  href={`tel:${tel.numero.replace(/\s/g, "")}`}
                >
                  {tel.numero}
                </a>
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-8 font-sans text-sm text-tinta-3">{t.respuesta}</p>
      </section>
    </>
  );
}
