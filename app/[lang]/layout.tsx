import type { Metadata } from "next";
import { Cormorant_Garamond, Lora } from "next/font/google";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import "../globals.css";
import {
  IDIOMAS, NOMBRE_IDIOMA, RUTAS_LEGALES, T, CONTACTO, SITIO, FERIAS, PUBLICACIONES, ESTUDIO,
  esIdioma, pagina, type Idioma,
} from "@/lib/contenido";
import Navegacion from "./navegacion";

const lora = Lora({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--fuente-lora",
});

// Solo titula, así que no necesita cursiva ni la seminegrita: dos pesos.
const cormorant = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--fuente-cormorant",
});

export function generateStaticParams() {
  return IDIOMAS.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!esIdioma(lang)) return {};
  const inicio = pagina(lang, "index");
  const descripcion =
    inicio.bloques.find((b) => b.tipo === "p" && b.texto.length > 60)?.texto ?? "";
  return {
    metadataBase: new URL(SITIO),
    title: {
      default: "González-Regalado Gourmet",
      template: "%s · González-Regalado Gourmet",
    },
    description: descripcion,
    alternates: {
      canonical: `/${lang}/`,
      languages: Object.fromEntries(IDIOMAS.map((l) => [l, `/${l}/`])),
    },
    openGraph: {
      title: "González-Regalado Gourmet",
      description: descripcion,
      url: `/${lang}/`,
      siteName: "González-Regalado Gourmet",
      locale: lang,
      type: "website",
      /* Sin esto, compartir el enlace en WhatsApp o LinkedIn dejaba una
         tarjeta con el titular y un hueco gris. Las páginas de categoría ya
         ponen la suya; esta es la de todas las demás. */
      images: [{ url: "/portada-og.jpg", width: 1200, height: 675 }],
    },
  };
}

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!esIdioma(lang)) notFound();
  const t = T[lang as Idioma];

  return (
    /* `data-scroll-behavior` lo pide Next expresamente cuando el CSS lleva
       `scroll-behavior: smooth` en `<html>`, que es el caso. Sin él, al
       cambiar de página el navegador intenta DESPLAZARSE suavemente hasta
       arriba en vez de saltar, y ese viaje se solapa con la animación de la
       transición. Con el atributo puesto, Next sabe que el suavizado es
       intencionado y lo desactiva mientras dura la navegación. */
    <html
      lang={lang}
      data-scroll-behavior="smooth"
      className={`${lora.variable} ${cormorant.variable}`}
    >
      {/* Extensiones como ColorZilla o Grammarly inyectan atributos en <body>
          antes de que React hidrate (cz-shortcut-listen, data-gr-*), y eso
          dispara un aviso de hidratación que no viene de este código. Se
          silencia solo en este nodo, no en el árbol. */}
      <body className="flex min-h-screen flex-col" suppressHydrationWarning>
        {/* El orden del menú se declara aquí, entero y a la vista: primero lo
            que vende, luego dónde se le encuentra y qué se ha publicado sobre
            la casa, y al final quiénes son y cómo contactar.
            Ferias y publicaciones entran solas en cuanto haya una entrada en
            su JSON; sin contenido no se anuncia una sección vacía. */}
        <Navegacion
          lang={lang as Idioma}
          etiquetas={[
            { href: `/${lang}/products/`, texto: pagina(lang, "products").titulo },
            ...(FERIAS.length ? [{ href: `/${lang}/events/`, texto: t.ferias }] : []),
            ...(PUBLICACIONES.length
              ? [{ href: `/${lang}/press/`, texto: t.publicaciones }]
              : []),
            {
              href: `/${lang}/about/`,
              // la web anterior titulaba la página "Sobre Nosotros" pero en el
              // menú ponía "Quiénes somos"; se respeta esa distinción
              texto: pagina(lang, "about").menu ?? pagina(lang, "about").titulo,
            },
            { href: `/${lang}/contact/`, texto: pagina(lang, "contact").titulo },
          ]}
          idiomas={IDIOMAS.map((l) => ({ codigo: l, nombre: NOMBRE_IDIOMA[l], href: `/${l}/` }))}
          textoMenu={t.menu}
        />

        <main className="flex-1">{children}</main>

        {/* Sin margen superior. Lo llevaba, y sobraba dos veces: la última
            sección de cada página ya trae su propio `py`, así que en las
            claras el hueco salía doble; y en las que cierran con una banda
            negra a sangre —catálogo y ficha de categoría— ese margen dibujaba
            una franja blanca de 96 px entre el negro y la crema del pie, que
            no se leía como aire sino como un fallo de maquetación. */}
        <footer className="border-t border-linea bg-crema">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <Image
                src="/marca/logo.png"
                alt="González-Regalado Gourmet"
                width={200}
                height={111}
                className="h-14 w-auto"
              />
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-tinta-2">
                {pagina(lang, "index").bloques.find((b) => b.tipo === "p")?.texto}
              </p>
            </div>

            <div>
              <p className="etiqueta">{pagina(lang, "contact").titulo}</p>
              <ul className="mt-2 text-sm">
                <li>
                  <a className="inline-flex min-h-9 items-center text-tinta-2 underline-offset-4 hover:text-oro-tinta hover:underline"
                     href={`mailto:${CONTACTO.email}`}>
                    {CONTACTO.email}
                  </a>
                </li>
                {CONTACTO.telefonos.map((tel) => (
                  <li key={tel.numero}>
                    <a className="inline-flex min-h-9 items-center text-tinta-2 underline-offset-4 hover:text-oro-tinta hover:underline"
                       href={`tel:${tel.numero.replace(/\s/g, "")}`}>
                      {tel.numero}
                    </a>
                    <span className="text-tinta-3"> · {tel.pais[lang as Idioma]}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="etiqueta">Legal</p>
              <ul className="mt-2 text-sm">
                {RUTAS_LEGALES.map((r) => (
                  <li key={r}>
                    <Link href={`/${lang}/${r}/`}
                          className="inline-flex min-h-9 items-center text-tinta-2 underline-offset-4 hover:text-oro-tinta hover:underline">
                      {pagina(lang, r).titulo}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-linea">
            <p className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-2 gap-y-1 px-6 py-5 text-xs text-tinta-3">
              <span>
                © {new Date().getFullYear()} González-Regalado Gourmet. {t.derechos}
              </span>
              <span aria-hidden className="text-linea">·</span>
              <span>
                {t.disenadoPor}{" "}
                <a
                  href={ESTUDIO.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-tinta-2 underline-offset-4 hover:text-oro-tinta hover:underline"
                >
                  {ESTUDIO.nombre}
                </a>
              </span>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
