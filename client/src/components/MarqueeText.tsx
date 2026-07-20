import { useEffect, useRef, useState } from "react";

/**
 * Texto que se desliza de ida y vuelta cuando no cabe en su renglón, para que
 * se pueda leer completo en vez de cortarse con puntos suspensivos.
 *
 * Nace de un problema real: en el teléfono, el nombre de un curso como
 * "Diagnóstico, Prevención e Intervención del Bullying" no cabe en la cabecera
 * y quedaba truncado, sin forma de leerlo. Ya se había intentado resolver
 * acortando las etiquetas de los botones, y no alcanzó.
 *
 * **Sólo se mueve si de verdad hace falta.** Se mide el ancho real del texto
 * contra el del contenedor; si cabe, se queda quieto (un título que se desliza
 * sin necesidad es ruido). La medición se rehace cuando cambia el texto o
 * cuando cambia el tamaño —girar el teléfono, por ejemplo— vía ResizeObserver.
 *
 * La animación vive en `index.css` (`animate-marquee`) y respeta
 * `prefers-reduced-motion`.
 */
export function MarqueeText({
  text,
  className = "",
  title,
  "data-testid": testId,
}: {
  text: string;
  className?: string;
  /** Tooltip en escritorio; por defecto, el mismo texto. */
  title?: string;
  "data-testid"?: string;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const contenido = useRef<HTMLSpanElement>(null);
  const [desborda, setDesborda] = useState(false);

  useEffect(() => {
    const caja = contenedor.current;
    const texto = contenido.current;
    if (!caja || !texto) return;

    const medir = () => {
      // +1px de tolerancia: los anchos fraccionarios del navegador harían
      // "desbordar" a un texto que en realidad cabe justo.
      const sobra = texto.scrollWidth - caja.clientWidth;
      if (sobra > 1) {
        texto.style.setProperty("--marquee-distance", `${sobra}px`);
        setDesborda(true);
      } else {
        texto.style.removeProperty("--marquee-distance");
        setDesborda(false);
      }
    };

    medir();

    // El ancho disponible cambia al girar el teléfono o al abrir el chat
    // lateral; sin esto, un título que cabía en horizontal se quedaría cortado
    // en vertical sin animarse.
    const observador = new ResizeObserver(medir);
    observador.observe(caja);
    observador.observe(texto);
    return () => observador.disconnect();
  }, [text]);

  return (
    <div ref={contenedor} className={`overflow-hidden ${className}`} title={title ?? text}>
      <span
        ref={contenido}
        className={`inline-block whitespace-nowrap ${desborda ? "animate-marquee" : ""}`}
        data-testid={testId}
      >
        {text}
      </span>
    </div>
  );
}
