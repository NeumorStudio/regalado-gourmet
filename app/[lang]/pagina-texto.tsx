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
  foto,
}: {
  lang: string;
  nombre: string;
  retrato?: boolean;
  /** Bodegón de cabecera. Solo lo lleva "quiénes somos": en una política de
   *  privacidad una foto de comida sobra y además retrasa el texto. */
  foto?: string;
}) {
  if (!esIdioma(lang)) notFound();
  const l = lang as Idioma;
  const bloques = cuerpo(l, nombre);
  if (!bloques.length) notFound();

  /* Con foto, la cabecera es la misma que la de una categoría —oscura, con el
     bodegón detrás y el filete debajo del titular—, para que "quiénes somos"
     no parezca otra web. Sin foto se queda la banda crema de siempre.
     `abre-oscuro` y `ancla-cabecera` no son decorativas: son las que le dicen
     a la barra de navegación que aquí entra flotante y cuándo condensarse. */
  if (foto) {
    return (
      <>
        <section className="abre-oscuro relative overflow-hidden bg-negro text-white">
          <Image src={foto} alt="" fill priority sizes="100vw" className="object-cover opacity-45" />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-negro via-negro/70 to-negro/30" />
          <div className="ancla-cabecera relative mx-auto w-full max-w-3xl px-6 py-16 sm:py-20">
            <h1 className="text-balance" style={{ fontSize: "var(--text-titulo)", lineHeight: 1.12 }}>
              {titular(l, nombre)}
            </h1>
            <div className="filete mt-6" />
          </div>
        </section>
        <Cuerpo l={l} nombre={nombre} bloques={bloques} retrato={retrato} />
      </>
    );
  }

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

      <Cuerpo l={l} nombre={nombre} bloques={bloques} retrato={retrato} />
    </>
  );
}

/** El texto de la página. Va aparte porque lo comparten las dos cabeceras
 *  —la oscura con bodegón y la banda crema— y duplicarlo era pedir que un día
 *  se arreglara un caso y no el otro. El retrato del fundador es una foto real
 *  del cliente: no se sustituye ni se recorta, solo se coloca. */
function Cuerpo({
  l,
  nombre,
  bloques,
  retrato,
}: {
  l: Idioma;
  nombre: string;
  bloques: ReturnType<typeof cuerpo>;
  retrato: boolean;
}) {
  return (
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
  );
}
