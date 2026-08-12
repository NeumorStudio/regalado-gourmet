import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  esIdioma, pagina, CATEGORIAS_CON_PRODUCTO, T, CONTACTO,
  AMBIENTE, AMBIENTE_PORTADA, type Idioma,
} from "@/lib/contenido";

export default async function Inicio({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!esIdioma(lang)) notFound();
  const l = lang as Idioma;
  const t = T[l];

  const inicio = pagina(l, "index");
  const parrafos = inicio.bloques.filter((b) => b.tipo === "p");
  const lema = parrafos[0]?.texto ?? "";

  return (
    <>
      {/* ------------------------------------------------------------- hero */}
      {/* Una sola maquetación en todos los tamaños: las tres fotos cruzándose
          de fondo, muy apagadas y con un velo encima, y el texto centrado
          sobre ellas. Antes escritorio partía la pantalla en dos columnas y
          móvil hacía esto; con una única versión no hay dos diseños que
          mantener ni dos sitios donde se rompa nada. */}
      <section className="abre-oscuro fondo-hondo relative flex min-h-[78vh] items-center overflow-hidden text-white">
        <div aria-hidden className="entra-foto absolute inset-0 overflow-hidden">
          {/* La opacidad va aquí y no en el contenedor: `entra-foto` anima su
              propia opacidad de 0 a 1 al cargar y machacaría el valor.
              55 % y no 20 %: a 20 % la foto era una mancha y el producto no se
              veía. Quien sostiene ahora el contraste del texto es `velo-hero`,
              que oscurece el centro y suelta los flancos. */}
          <div className="fundido absolute inset-0 opacity-55">
            {[AMBIENTE_PORTADA, "/ambiente/quesos.jpg", "/ambiente/chacinas.jpg"].map(
              (src, i) => (
                <Image
                  key={src}
                  src={src}
                  alt=""
                  fill
                  priority={i === 0}
                  loading={i === 0 ? undefined : "lazy"}
                  sizes="100vw"
                  className="object-cover object-[center_38%]"
                />
              ),
            )}
          </div>
        </div>

        {/* El contraste del titular no puede depender de qué foto esté
            cruzándose en ese momento; el velo lo fija. */}
        <div aria-hidden className="velo-hero pointer-events-none absolute inset-0" />

        {/* `titular-respira` ata el bloque al scroll: al salir de pantalla se
            aleja y se desenfoca en vez de limitarse a irse hacia arriba. Es el
            único sitio de la web donde se hace; repetirlo en cada sección es
            lo que convierte un gesto en un tic. */}
        <div className="ancla-cabecera titular-respira relative z-10 mx-auto w-full max-w-3xl px-6 py-24 text-center sm:py-28">
            {/* Aquí había una etiqueta con "González-Regalado Gourmet" encima
                del titular, que dice exactamente lo mismo. El nombre se lee
                una vez, en el h1. */}
            <h1
              className="entra font-normal tracking-[-0.015em] text-balance"
              style={{ fontSize: "var(--text-display)", lineHeight: 1.05, "--i": 0 } as React.CSSProperties}
            >
              {/* "González-Regalado" es un apellido: no se parte por el guion.
                  El nbsp-hyphen lo mantiene entero y "Gourmet" baja de línea. */}
              <span className="whitespace-nowrap">{"González\u2011Regalado"}</span>{" "}
              <span className="text-oro">Gourmet</span>
            </h1>
            <div className="filete entra-filete mx-auto my-7" />
            <p
              className="entra mx-auto max-w-xl text-lg leading-relaxed text-[#d6c8ab] text-pretty"
              style={{ "--i": 2 } as React.CSSProperties}
            >
              {lema}
            </p>
            <div
              className="entra mt-9 flex flex-wrap justify-center gap-3"
              style={{ "--i": 3 } as React.CSSProperties}
            >
              <Link
                href={`/${l}/products/`}
                className="group inline-flex items-center gap-2 placa oro-lamina px-7 py-3.5 font-sans text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-negro"
              >
                {t.verCatalogo}
                <span aria-hidden className="transition-transform duration-200 ease-[var(--ease-salida)] group-hover:translate-x-1">
                  →
                </span>
              </Link>
              <Link
                href={`/${l}/contact/`}
                className="placa placa-oro inline-flex items-center border border-oro/45 px-7 py-3.5 font-sans text-[0.8rem] uppercase tracking-[0.08em] text-white hover:border-oro hover:text-oro"
              >
                {t.solicitarPrecio}
              </Link>
            </div>
        </div>
      </section>


      {/* --------------------------------------------------------- las marcas */}
      <section className="fondo-calido">
        <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-24">
        <div className="max-w-2xl">
          <p className="etiqueta">{t.escaparateTitulo}</p>
          <h2 className="mt-3 text-balance" style={{ fontSize: "var(--text-titulo)", lineHeight: 1.15 }}>
            {t.escaparateTexto}
          </h2>
        </div>

        {/* Estas tarjetas sí llevan la entrada escalonada y las del índice del
            catálogo NO, y la diferencia es deliberada: allí la foto es el
            destino del morphing al volver de una categoría, y aterrizar sobre
            una tarjeta a media opacidad estropea justo el efecto que se
            quiere. Aquí no hay nada que aterrizar. */}
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIAS_CON_PRODUCTO.map((c) => (
            <li key={c.slug} className="ficha-asoma">
              <Link
                href={`/${l}/products/${c.slug}/`}
                className="tarjeta grabado group block overflow-hidden rounded-sm bg-white p-2.5"
              >
                {/* La foto ocupa la tarjeta entera; el nombre y la flecha van
                    sobre ella. El margen de la tarjeta se queda para que el
                    filete siga imprimiéndose sobre blanco y no sobre la foto. */}
                <div className="relative aspect-[4/5] overflow-hidden bg-negro">
                  <Image
                    src={AMBIENTE[c.slug] ?? AMBIENTE_PORTADA}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover opacity-90 transition-transform duration-500 ease-[var(--ease-salida)] group-hover:scale-105"
                  />
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-negro/85 via-negro/15 to-transparent" />
                  <div className="pie-tarjeta absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5">
                    <p className="text-xl text-white text-balance">{c.nombre[l]}</p>
                    <span
                      aria-hidden
                      className="flecha shrink-0 pb-1 text-oro transition-transform duration-200 group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
          </ul>
        </div>
      </section>

      {/* --------------------------------------------------------------- cta */}
      {/* Cierra la página el bloque de contacto, solo y centrado, haciendo
          pareja con el hero. El texto de dentro va alineado a la izquierda: una
          lista de email y teléfonos centrada se lee mal. */}
      <section className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-24">
        <div className="halo-oro grabado relative mx-auto max-w-2xl rounded-sm px-8 py-12 text-white sm:px-12 sm:py-14">
          <h2 style={{ fontSize: "var(--text-seccion)" }} className="text-oro">
            {t.contactoTitulo}
          </h2>
          <p className="mt-3 max-w-md text-[#cbbb99]">{t.precioNota}</p>
          <dl className="mt-7 space-y-3 font-sans text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wider text-white/45">Email</dt>
              <dd>
                <a className="inline-flex min-h-11 items-center text-white underline-offset-4 hover:text-oro hover:underline"
                   href={`mailto:${CONTACTO.email}`}>
                  {CONTACTO.email}
                </a>
              </dd>
            </div>
            {CONTACTO.telefonos.map((tel) => (
              <div key={tel.numero}>
                <dt className="text-xs uppercase tracking-wider text-white/45">{tel.pais[l]}</dt>
                <dd>
                  <a className="inline-flex min-h-11 items-center text-white underline-offset-4 hover:text-oro hover:underline"
                     href={`tel:${tel.numero.replace(/\s/g, "")}`}>
                    {tel.numero}
                  </a>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </>
  );
}
