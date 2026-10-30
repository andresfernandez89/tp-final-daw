# Base de datos, migraciones y seeds

## Esquema

PostgreSQL, gestionado con TypeORM **sin `synchronize`**: el esquema sólo cambia mediante migraciones.

```
usuarios ──1:1── medicos ──1:N── reservas ──N:1── usuarios (paciente)
```

| Tabla      | Entidad       | Columnas principales                                                                                      |
| ---------- | ------------- | --------------------------------------------------------------------------------------------------------- |
| `usuarios` | `User`        | `id`, `documento` (único), `apellidos`, `nombres`, `email`, `clave` (bcrypt), `estado`, `rol`             |
| `medicos`  | `Doctor`      | `id`, `id_usuario` → `usuarios.id`, `matricula`, `valor_consulta`                                         |
| `reservas` | `Reservation` | `id`, `id_medico` → `medicos.id`, `id_paciente` → `usuarios.id`, `fecha_hora`, `estado`, `valor_consulta` |

Tipos enumerados: `estados_usuarios` (`ACTIVO`, `BAJA`), `roles_usuarios` (`MEDICO`, `PACIENTE`, `ADMINISTRADOR`) y `estados_reservas` (`ACTIVO`, `ATENDIDO`, `AUSENTE`, `CANCELADO`).

`reservas.fecha_hora` es un `timestamp` **sin zona horaria** que guarda la hora de pared de la clínica (Buenos Aires). Al leer, las consultas aplican `AT TIME ZONE 'America/Argentina/Buenos_Aires'` para devolver un instante absoluto.

Nótese que `reservas.id_medico` apunta a `medicos.id` (la ficha), mientras que `reservas.id_paciente` y el `sub` del JWT apuntan a `usuarios.id`.

## Migraciones

El `DataSource` del CLI está en `src/database/data-source.ts` y lee `.env`. Los comandos compilan antes de ejecutar porque TypeORM corre sobre `dist/`:

| Comando               | Acción                                |
| --------------------- | ------------------------------------- |
| `npm run db:migrate`  | Ejecuta las migraciones pendientes.   |
| `npm run db:rollback` | Revierte la última migración.         |
| `npm run db:status`   | Muestra el estado de las migraciones. |

La migración inicial es `InitialSchema1790112080504`.

## Seeds

Las seeds corren dentro de una transacción con un _advisory lock_ y se niegan a ejecutarse con `NODE_ENV=production`.

### `npm run db:seed` — datos de demostración

Trunca `reservas`, `medicos` y `usuarios` (reiniciando identidades) y carga:

- Usuarios con documentos `1000000x` (administradores), `2000000x` (médicos) y `3000000x` (pacientes), todos con la clave `SEED_DEFAULT_PASSWORD` (hash bcrypt). Incluye usuarios en estado `BAJA` para probar que no pueden iniciar sesión ni participar en reservas.
- Fichas de médicos con matrícula y valor de consulta.
- Reservas en días relativos a hoy, en distintos estados.

### `npm run db:seed:today` — turnos de hoy

Pensada para probar la agenda del médico. Borra únicamente los turnos **de hoy** de los médicos involucrados y crea turnos alrededor de la hora actual (ya iniciados, en curso y futuros) en distintos estados. Se puede correr tantas veces como haga falta.
