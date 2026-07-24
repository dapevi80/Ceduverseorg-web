import { useEffect } from "react";
import { useLocation } from "wouter";

// wouter (como React Router) NO resetea el scroll al cambiar de ruta: la página
// nueva hereda la posición de scroll de la anterior. Si venías scrolleado hacia
// abajo (p.ej. la lista de conferencias) y abres una página más corta, caes al
// fondo. Este componente global lleva el scroll al tope en cada cambio de ruta.
export default function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  return null;
}
