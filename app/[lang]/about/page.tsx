import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PaginaTexto from "../pagina-texto";
import Colaboracion from "../colaboracion";
import { esIdioma, metadatos, type Idioma } from "@/lib/contenido";

export async function generateMetadata({
  params,
}: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return esIdioma(lang) ? metadatos(lang, "about") : {};
}

export default async function Pagina({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!esIdioma(lang)) notFound();
  return (
    <>
      <PaginaTexto lang={lang} nombre="about" retrato />
      {/* Cierra la página quien acompaña a la casa. Va aquí y no en una
          sección del menú: es contexto de quiénes son, no un apartado. */}
      <Colaboracion lang={lang as Idioma} />
    </>
  );
}
