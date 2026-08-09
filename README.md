# González-Regalado Gourmet

Web de González-Regalado Gourmet, casa española de selección de producto
gastronómico para Travel Retail y distribución internacional.

Sustituye a la web anterior conservando sus URLs, sus textos y su identidad
visual. Next.js 16 (App Router) desplegado en Vercel.

## Puesta en marcha

```bash
npm install
npm run dev     # http://localhost:3000
```

## Cómo está montado

| | |
|---|---|
| **Idiomas** | 7: `es` `en` `nb` `fr` `pt` `it` `de` |
| **Rutas** | `/{idioma}/` + `about` · `products` · `contact` · `events` · `press` + tres legales |
| **Catálogo** | `/{idioma}/products/` y una ficha por categoría en `/{idioma}/products/{slug}/` |
| **Contenido** | ficheros JSON en `content/`, sin base de datos ni panel |

Las URLs con barra final (`trailingSlash: true`) porque son las que la web
anterior tenía indexadas. `proxy.ts` solo manda a un idioma a quien entre por
la raíz.

## Dónde se toca cada cosa

| Quiero cambiar… | Fichero |
|---|---|
| Textos de una página | `content/{idioma}.json` |
| Productos y categorías | `content/catalogo.json` |
| Ferias y eventos | `content/ferias.json` |
| Entrevistas y prensa | `content/publicaciones.json` |
| Etiquetas de interfaz, contacto, idiomas | `lib/contenido.ts` |
| Fotos de categoría | `public/ambiente/`, mismo nombre de fichero |

**Añadir un idioma**: crear `content/<código>.json`, importarlo en
`lib/contenido.ts` y añadirlo a `IDIOMAS`, `NOMBRE_IDIOMA`, `T` y a los nombres
de categoría de `catalogo.json`.

**Ferias y publicaciones** no aparecen en el menú ni en el sitemap mientras su
lista esté vacía: no se anuncia una sección sin contenido. En cuanto se añade
una entrada aparecen solas.

## Pendiente antes de publicar en el dominio real

- `content/ferias.json` y `content/publicaciones.json` llevan **entradas de
  muestra**, inventadas para enseñar el diseño. Vaciar las listas o
  sustituirlas por datos reales. Cada fichero lo avisa en su campo `_DEMO`.
- Las **fotos de ambiente** son provisionales, de Unsplash (origen y licencia
  en `content/creditos.json`). Sustituir por las del cliente conservando el
  nombre del fichero.
- Las **fotos de producto** vienen de los catálogos de proveedor y en varias se
  lee la marca del proveedor, que es justo lo que el cliente no quiere en su
  web.
- Las dos **gamas de embutidos** (premium y selección) están deducidas del
  nombre del producto; faltan los dos "velita", sin clasificar.

## Despliegue

Vercel, equipo NeumorStudio, proyecto `regalado-gourmet`.

```bash
vercel deploy --prod
```

El dominio `regaladogourmet.com` está en DonDominio y **todavía apunta a la web
anterior**. Los `canonical` y el sitemap ya señalan al dominio definitivo, así
que la copia de `vercel.app` no se indexa como contenido duplicado.

---

Diseño y desarrollo: [NeumorStudio](https://www.neumorstudio.com)
