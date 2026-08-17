import type { MetadataRoute } from "next";
import {
  CATEGORIAS, FERIAS, IDIOMAS, PAGINAS, PUBLICACIONES, PUBLICACIONES_CON_FICHA,
  SITIO, ruta,
} from "@/lib/contenido";

export default function sitemap(): MetadataRoute.Sitemap {
  const paginas = IDIOMAS.flatMap((lang) =>
    PAGINAS.map((nombre) => ({
      url: SITIO + ruta(lang, nombre),
      alternates: {
        languages: Object.fromEntries(
          IDIOMAS.map((l) => [l, SITIO + ruta(l, nombre)]),
        ),
      },
      priority: nombre === "index" ? 1 : 0.7,
    })),
  );

  const categorias = IDIOMAS.flatMap((lang) =>
    CATEGORIAS.map((c) => ({
      url: `${SITIO}${ruta(lang, "products")}${c.slug}/`,
      alternates: {
        languages: Object.fromEntries(
          IDIOMAS.map((l) => [l, `${SITIO}${ruta(l, "products")}${c.slug}/`]),
        ),
      },
      priority: 0.8,
    })),
  );

  // Sin ferias cargadas la sección no se anuncia: ni menú ni sitemap.
  const eventos = FERIAS.length
    ? IDIOMAS.map((lang) => ({
        url: `${SITIO}/${lang}/events/`,
        alternates: {
          languages: Object.fromEntries(IDIOMAS.map((l) => [l, `${SITIO}/${l}/events/`])),
        },
        priority: 0.6,
      }))
    : [];

  const prensa = PUBLICACIONES.length
    ? IDIOMAS.map((lang) => ({
        url: `${SITIO}/${lang}/press/`,
        alternates: {
          languages: Object.fromEntries(IDIOMAS.map((l) => [l, `${SITIO}/${l}/press/`])),
        },
        priority: 0.6,
      }))
    : [];

  // Las publicaciones que tienen ficha propia son páginas de la web como
  // cualquier otra; las que solo enlazan al medio no existen aquí.
  const fichas = IDIOMAS.flatMap((lang) =>
    PUBLICACIONES_CON_FICHA.map((p) => ({
      url: `${SITIO}/${lang}/press/${p.id}/`,
      alternates: {
        languages: Object.fromEntries(
          IDIOMAS.map((l) => [l, `${SITIO}/${l}/press/${p.id}/`]),
        ),
      },
      priority: 0.5,
    })),
  );

  return [...paginas, ...categorias, ...eventos, ...prensa, ...fichas];
}
