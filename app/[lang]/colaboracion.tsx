import Image from "next/image";
import { COLABORACION, T, type Idioma } from "@/lib/contenido";

/**
 * Con quién colabora la casa. Sin sección propia: sale pequeña en el pie, que
 * la lleva por toda la web sin darle peso, y con su párrafo al final de
 * "Quiénes somos", que es donde esto se cuenta.
 *
 * El logotipo de la academia va intacto —blanco, con sus filetes de color—
 * sobre una placa negra con el filete dorado grabado. La web ya tiene bloques
 * oscuros, así que la placa es de la casa y no hay que recolorear una marca
 * ajena para que encaje, que es donde estas cosas se estropean.
 */
export default function Colaboracion({
  lang,
  compacto = false,
}: {
  lang: Idioma;
  compacto?: boolean;
}) {
  const t = T[lang];

  const marca = (
    <div
      className={`grabado inline-flex items-center justify-center rounded-sm bg-negro ${
        compacto ? "px-5 py-4" : "px-8 py-7"
      }`}
    >
      {/* No baja de 80 px ni en el pie: la marca es un bloque de cuatro líneas
          de texto —nombre, "football academy", el país y la ciudad—, y por
          debajo de eso deja de leerse y se queda en una mancha. */}
      <Image
        src={COLABORACION.marca}
        alt={COLABORACION.nombre}
        width={400}
        height={455}
        className={compacto ? "h-20 w-auto" : "h-24 w-auto sm:h-28"}
      />
    </div>
  );

  /* La placa lleva a la publicación donde se anuncia la colaboración. Va con
     la clase `grupo` para que el filete grabado se abra al pasar por encima:
     es el mismo gesto que hacen las tarjetas del catálogo, así que se entiende
     que se pulsa sin necesidad de añadirle nada. */
  const placa = COLABORACION.url ? (
    <a
      href={COLABORACION.url}
      target="_blank"
      rel="noopener noreferrer"
      className="grupo inline-block"
    >
      {marca}
    </a>
  ) : (
    marca
  );

  if (compacto) {
    return (
      <div className="colaboracion-pie mt-6">
        <p className="etiqueta text-[0.68rem]">{t.enColaboracionCon}</p>
        <div className="mt-2.5">{placa}</div>
      </div>
    );
  }

  return (
    <section className="colaboracion-pagina border-t border-linea bg-crema">
      <div className="mx-auto w-full max-w-3xl px-6 py-14 sm:py-16">
        <p className="etiqueta">{t.colaboraciones}</p>
        <div className="filete mt-4" />
        {/* La placa a la izquierda y el texto al lado en cuanto hay sitio; en
            móvil, una debajo de otra. El logotipo manda el ancho de su
            columna, así que no se estira ni se recorta. */}
        <div className="mt-7 flex flex-col gap-7 sm:flex-row sm:items-center sm:gap-9">
          {placa}
          <div>
            <p className="text-lg leading-snug">{COLABORACION.nombre}</p>
            <p className="mt-1 font-sans text-sm text-tinta-3">{COLABORACION.lugar}</p>
            <p className="mt-3 max-w-md text-tinta-2 text-pretty">
              {COLABORACION.texto[lang]}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
