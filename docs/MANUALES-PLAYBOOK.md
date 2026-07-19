# Manuales pendientes — Playbook y Cuaderno (2026-07-18)

Cosas que sólo puede hacer David (Supabase, Cloudflare, deploy). Marcar al completar.

---

## 1. 🔴 Volver a correr la migración del playbook — CAMBIÓ

**Archivo:** `C:\Users\user\Documents\ceduverse-web\migrations\2026-07-18_playbook.sql`

Ya la corriste una vez (por eso el seed funcionó). Pero **después se le agregó la columna
`source`** —la que distingue un playbook generado por IA de uno de respaldo— y el
`CREATE TABLE IF NOT EXISTS` **se salta entero** cuando la tabla ya existe. Por eso al final
del archivo hay ahora un `ALTER TABLE ... ADD COLUMN IF NOT EXISTS source`.

**Sin esto, al deployar la rama TODAS las rutas del playbook responden 500**
(`column course_playbooks.source does not exist`).

Basta con volver a correr el archivo completo: es idempotente.

- [ ] Corrido

---

## 2. 🔴 SQL de referidos — hay dinero de por medio

**Archivo:** `C:\Users\user\Documents\ceduverse-web\migrations\2026-07-18_backfill_referral_codes.sql`

Repara a **todos** los socios cooperativos cuyo folio nunca se registró como código de
referido válido. El primer bloque te dice cuántos están afectados: **ese número es cuántos
referidos se han estado perdiendo**.

- [ ] Corrido el backfill (anotar el número de afectados: ____ )
- [ ] Corrido el `UPDATE` que acredita el alta de `wawawa2415@rapplo.com` (va DESPUÉS del backfill)

---

## 3. Deploy de `main`

Último commit relevante: **`5df6a51`** — hace que una cuenta nueva, después de completar el
alta, aterrice en el curso que le compartieron en vez del dashboard.

El del código de referido (`6319a4f`) ya lo verificaste funcionando. Éste es el tramo que
faltaba.

- [ ] Deployado y probado con una cuenta nueva

---

## 4. Cloudflare — cerrar el prefijo `evidence/`

Antes de que el playbook llegue a producción. El código ya nunca emite la URL pública de R2
(las fotos van por un proxy con sesión), pero **el bucket sigue siendo público**: si alguien
adivinara la llave, alcanzaría la foto. Las llaves ahora son aleatorias, así que en la
práctica está sellado, pero el cierre real es quitarle el acceso público a ese prefijo.

- [ ] Hecho

---

## 5. Revisar `team_users.role` en producción

Se apretó el acceso a las evidencias: ahora exige **membresía real** de `admin` o
`empresa_rh`, ya no basta con que el rol de la cuenta diga "empresa". Es más seguro, pero
quiero confirmar que no deje fuera a un dueño legítimo.

```sql
select tu.role, count(*)
from team_users tu
join accounts a on a.id = tu.user_id
where a.user_role in ('empresa','empresa_rh')
group by tu.role;
```

Si aparecen dueños con un rol distinto de `admin`/`empresa_rh`, avísame.

- [ ] Revisado

---

## 6. Sembrar el resto de los playbooks (cuando quieras)

Ya corriste uno (`brainshield-boveda-pi`, salió bien y con contenido real). Los demás:

```
npx tsx --env-file=.env.seed.txt server/generate-playbooks.ts
```

~62 cursos, una llamada a Claude cada uno. No es urgente y no bloquea el cuaderno.

- [ ] Corrido (anotar los que fallen)

---

## 7. Borrar `.env.seed.txt` al final

**Todavía NO.** Los agentes lo están usando para verificar el cuaderno contra datos reales.
Cuando terminemos el build:

```
Remove-Item .env.seed.txt
```

Ya está en `.gitignore`, así que no hay riesgo de que se suba al repo.

- [ ] Borrado

---

## 8. (Backlog del cuaderno) QR a videos de YouTube

Idea de David: que el cuaderno traiga QR a documentales o conferencias del tema.

**Trampa:** la IA NO puede inventar esos links. Un ID de YouTube inventado no da error —
manda a cualquier video— y en material de capacitación eso es grave. Dos salidas honestas:
biblioteca curada por instructor (links reales pegados a mano) o QR que abra una BÚSQUEDA
del tema (nunca se rompe, menos curado). Decidir al retomar el cuaderno.
