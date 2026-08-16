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
| Juntar variantes de un producto | `grupos` en `content/catalogo.json` |
| Ferias y eventos | `content/ferias.json` |
| Entrevistas y prensa | `content/publicaciones.json` |
| Etiquetas de interfaz, contacto, idiomas | `lib/contenido.ts` |
| Fotos de categoría | `public/ambiente/`, mismo nombre de fichero |

**Añadir un idioma**: crear `content/<código>.json`, importarlo en
`lib/contenido.ts` y añadirlo a `IDIOMAS`, `NOMBRE_IDIOMA`, `T` y a los nombres
de categoría de `catalogo.json`.

**La web es el escaparate, no la tarifa.** El `nombre` de cada fila de
`productos` es el código del proveedor —`6X1/2 V FLAVIA DO BAENA` son 6
botellas de medio litro en vidrio—, y se conserva intacto para poder cotejar
cada ficha con el albarán, **pero no se publica**. Lo que se publica sale de la
lista `grupos`: antetítulo (la línea o la curación), título y una línea de
carácter (D.O. Baena, ecológico, 50 % raza ibérica), los tres en los siete
idiomas. Ni pesos, ni unidades por caja, ni materiales de envase: eso va en el
catálogo detallado que se manda aparte.

Cada producto apunta con `grupo` a la ficha en la que sale. Varias filas
comparten ficha cuando son el mismo producto en otro envase: **las 92 filas del
catálogo se publican en 45 fichas**. Una fila sin `grupo` sale con su nombre en
crudo antes que no salir; es el aviso de que a un producto nuevo le falta el
nombre de escaparate.

En el queso la ficha no es la curación, es **la forma**: una para la pieza
entera y otra para la cuña, y las tres curaciones van dentro como un dato más.
Se vendía el mismo queso en dos tamaños y salían tres fotos casi idénticas.

**Ferias y publicaciones** no aparecen en el menú ni en el sitemap mientras su
lista esté vacía: no se anuncia una sección sin contenido. En cuanto se añade
una entrada aparecen solas.

## Contraseña mientras está en pruebas

La web pide contraseña. Vercel trae esa función de serie pero solo en los
planes de pago, así que va en `proxy.ts` con autenticación básica: la pantalla
la pone el navegador. El usuario da igual, solo se comprueba la contraseña.

Se activa sola si existe la variable de entorno `CLAVE_WEB` en Vercel.
**Para abrir la web al público basta con borrar esa variable y volver a
desplegar**; no hay que tocar el código.

## Pendiente antes de publicar en el dominio real

- **Borrar `CLAVE_WEB`** de las variables de entorno en Vercel. Si el dominio
  real se apunta con la contraseña puesta, Google se encuentra un 401 en todas
  las páginas.

- `content/ferias.json` y `content/publicaciones.json` llevan **entradas de
  muestra**, inventadas para enseñar el diseño. Vaciar las listas o
  sustituirlas por datos reales. Cada fichero lo avisa en su campo `_DEMO`.
- Las **fotos de ambiente** están generadas con IA (nano_banana_pro, 11/08/2026;
  receta y escena de cada una en `content/creditos.json`). Son atmósfera y
  ninguna representa un artículo concreto, pero conviene sustituirlas por las
  del cliente conservando el nombre del fichero. Al hacerlo hay que **borrar
  `.next/dev/cache/images`**: Next cachea la versión optimizada por ruta, y con
  el mismo nombre sigue sirviendo la anterior.
- Las **fotos de producto** vienen de los catálogos de proveedor y en varias se
  lee la marca del proveedor, que es justo lo que el cliente no quiere en su
  web. Además faltan doce, y ahí sí se nota porque ya no hay dos fichas iguales
  que disimulen: **nueve fichas repiten foto** (estuche y bandeja de manchego;
  dúos, sal y pimienta en sobre; las cuatro aceitunas en lata) y **tres no
  tienen ninguna** (edulcorante, coco rallado y miel de lavanda), que salen con
  el nombre sobre un plano en crema.
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
