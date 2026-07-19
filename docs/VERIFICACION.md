# Verificación antes de entregar

Orden obligatorio. Cada paso ve una clase de fallas que el anterior **no puede** ver.

```bash
npx tsc --noEmit      # 1. compila
npx vitest run        # 2. la lógica hace lo que debe
npm run build         # 3. empaqueta
npm run smoke:boot    # 4. EL PROCESO ARRANCA Y ESCUCHA   <-- el que faltaba
```

## Por qué existe el paso 4

El 2026-07-19 un deploy a producción falló con:

```
The argument 'filename' must be a file URL object, file URL string,
or absolute path string. Received undefined
```

En ese momento: `tsc` limpio, 360 pruebas pasando, `npm run build` sin errores.
**Los tres primeros pasos estaban en verde y el servidor no arrancaba.**

La causa: `createRequire(import.meta.url)` en `server/cuaderno/fonts.ts`. Funciona
en desarrollo (ESM vía tsx) y en las pruebas, pero al empaquetarse a CommonJS
esbuild reemplaza `import.meta` por `{}`, así que `import.meta.url` queda
`undefined` y la llamada **lanza al cargar el módulo**.

Compilar no es arrancar. Entre una cosa y otra vive toda una familia de fallas
que ningún type-check ni prueba unitaria puede ver:

- resolución de módulos que cambia entre ESM y CommonJS
- dependencias nativas que no cargan en el contenedor
- efectos secundarios en el `import` de un módulo
- orden de carga y variables de entorno faltantes al arrancar

`npm run smoke:boot` levanta el bundle real con credenciales falsas y confirma
que llega a escuchar. Toma unos segundos. Está verificado que **atrapa** el bug
de arriba: se reintrodujo a propósito y la prueba falló como debía.

## Para quien construya una tarea

Si tu cambio toca el servidor, agrega imports nuevos, o mete una dependencia
—sobre todo si es nativa o WASM— el paso 4 **no es opcional**. Reporta su
resultado como reportas el de `tsc`.

## Lección de método

Dos veces el mismo día una verificación se quedó a medio camino:

1. `sharp` **reporta** soporte de HEIC, pero es sólo AVIF. Se descubrió porque
   se probó con una foto real de iPhone en vez de creerle a la librería.
2. El build **pasaba**, pero el proceso no arrancaba. Se descubrió en producción.

El patrón es el mismo: **verificar la promesa, no el síntoma más cercano.**
