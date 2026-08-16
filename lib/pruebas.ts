/**
 * ¿Está la web en pruebas?
 *
 * Manda lo que hay montado alrededor del catálogo para decidir con el cliente
 * —hoy, el comparador de fotografía— y no se publica nada de eso a un
 * comprador. En el sitio desplegado se apaga con la misma palanca que la
 * contraseña: al borrar CLAVE_WEB en Vercel para abrir la web al público,
 * desaparece con ella. En desarrollo está siempre, porque CLAVE_WEB solo vive
 * en Vercel y sin esto la herramienta no se podría usar donde se trabaja.
 *
 * Vive en su propio módulo, y no junto al interruptor ni en el layout, por dos
 * razones: Next valida qué puede exportar un fichero de ruta, y `contenido.ts`
 * lo importan también componentes de cliente, donde CLAVE_WEB no existe y esto
 * valdría otra cosa. Solo lo usan componentes de servidor.
 */
export const EN_PRUEBAS =
  Boolean(process.env.CLAVE_WEB) || process.env.NODE_ENV === "development";

/**
 * Dónde recuerda el navegador si se están mirando las fotos del proveedor.
 *
 * Aquí y no en `cambio-fotos.tsx`, que es de cliente: el layout escribe esta
 * clave dentro del script que corre antes de pintar, y lo que un componente de
 * servidor importa de un módulo "use client" no es el valor sino una
 * referencia. Lo era, y el script quedaba en `getItem(undefined)`: la elección
 * se guardaba y no se recuperaba jamás.
 */
export const CLAVE_FOTOS = "regalado:fotos";
