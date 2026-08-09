import Image from "next/image";
import { notFound } from "next/navigation";
import { esIdioma, cuerpo, titular, pagina, type Idioma } from "@/lib/contenido";

/**
 * Plantilla para las páginas que son texto: quiénes somos y las tres legales.
 * El contenido sale de content/<lang>.json, migrado de la web anterior.
 */
export default function PaginaTexto({
  lang,
  nombre,
  retrato = false,
}: {
  lang: string;
  nombre: string;
  retrato?: boolean;
}) {
  if (!esIdioma(lang)) notFound();
  const l = lang as Idioma;
  const bloques = cuerpo(l, nombre);
  if (!bloques.length) notFound();

  return (
    <>
      <section className="border-b border-linea bg-crema">
        <div className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-20">
          <h1 className="text-balance" style={{ fontSize: "var(--text-titulo)", lineHeight: 1.12 }}>
            {titular(l, nombre)}
          </h1>
          <div className="filete mt-6" />
        </div>
      </section>

      <article className="prosa mx-auto w-full max-w-3xl px-6 py-14 sm:py-16">
        {retrato && (
          <figure className="float-none mb-8 sm:float-right sm:ml-8 sm:w-56">
            <Image
              src="/marca/fundador.jpeg"
              alt={pagina(l, nombre).titulo}
              width={560}
              height={396}
              className="w-full rounded-sm object-cover"
            />
          </figure>
        )}
        {bloques.map((b, i) => {
          if (b.tipo === "h2")
            return (
              <h2 key={i} className="clear-both">
                {b.texto}
              </h2>
            );
          if (b.tipo === "h3") return <h3 key={i}>{b.texto}</h3>;
          if (b.tipo === "li")
            return (
              <li key={i} className="ml-5 list-disc">
                {b.texto}
              </li>
            );
          if (b.tipo === "a" && b.href)
            return (
              <p key={i}>
                <a className="text-oro-tinta underline underline-offset-4" href={b.href}>
                  {b.texto}
                </a>
              </p>
            );
          return <p key={i}>{b.texto}</p>;
        })}
      </article>
    </>
  );
}
