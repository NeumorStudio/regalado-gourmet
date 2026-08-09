import type { Metadata } from "next";
import PaginaTexto from "../pagina-texto";
import { esIdioma, metadatos } from "@/lib/contenido";

export async function generateMetadata({
  params,
}: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return esIdioma(lang) ? metadatos(lang, "about") : {};
}

export default async function Pagina({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <PaginaTexto lang={lang} nombre="about" retrato />;
}
