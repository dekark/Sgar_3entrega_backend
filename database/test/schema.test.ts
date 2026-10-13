import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import {
  eq,
  extractTablesRelationalConfig,
  createTableRelationsHelpers,
} from 'drizzle-orm';
import * as schema from '../src/schema';

const client = new PGlite();
const db = drizzle(client, { schema });
let usuarioId: number;
let sucursalId: number;
let otraSucursalId: number;
let areaId: number;
let inventarioId: number;
let otroInventarioId: number;
let tiendaId: number;
let otraTiendaId: number;
let productoId: number;
let solicitudId: number;
let reporteId: number;
let envioId: number;

// Las pruebas usan PostgreSQL local en memoria; nunca leen DATABASE_URL.
before(async () => {
  await migrate(db, {
    migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)),
  });
  const [usuario] = await db
    .insert(schema.Usuarios)
    .values({
      nombre: 'Administrador',
      googleId: 'google-admin',
      email: 'admin@example.test',
    })
    .returning();
  usuarioId = usuario.id;
  const sucursales = await db
    .insert(schema.Sucursales)
    .values(
      ['S1', 'S2'].map((codigo) => ({
        nombre: codigo,
        codigo,
        direccion: 'Dirección',
        telefono: '123',
        correo: 'contacto@example.test',
        ciudad: 'Santiago',
        pais: 'Chile',
        region: 'RM',
        emailContacto: 'contacto@example.test',
        horarioAtencion: '09:00-18:00',
        creadorId: usuarioId,
      })),
    )
    .returning();
  sucursalId = sucursales[0].id;
  otraSucursalId = sucursales[1].id;
  const areas = await db
    .insert(schema.Areas)
    .values(
      sucursales.map((sucursal) => ({
        nombre: 'Área',
        codigo: 'A1',
        descripcion: '',
        ubicacion: 'Piso 1',
        creador: usuarioId,
        sucursalId: sucursal.id,
      })),
    )
    .returning();
  areaId = areas[0].id;
  const inventarios = await db
    .insert(schema.Inventarios)
    .values(
      areas.map((area) => ({
        nombre: 'Inventario',
        codigo: 'I1',
        descripcion: '',
        telefono: '123',
        creador: usuarioId,
        areaId: area.id,
      })),
    )
    .returning();
  inventarioId = inventarios[0].id;
  otroInventarioId = inventarios[1].id;
  const tiendas = await db
    .insert(schema.Tiendas)
    .values(
      inventarios.map((inventario) => ({
        nombre: 'Tienda',
        codigo: 'T1',
        descripcion: '',
        ciudad: 'Santiago',
        pais: 'Chile',
        region: 'RM',
        telefono: '123',
        correo: 'tienda@example.test',
        horarioAtencion: '09:00-18:00',
        creador: usuarioId,
        inventarioId: inventario.id,
      })),
    )
    .returning();
  tiendaId = tiendas[0].id;
  otraTiendaId = tiendas[1].id;
  const [producto] = await db
    .insert(schema.Productos)
    .values({
      nombre: 'Harina',
      descripcion: '',
      sku: 'HARINA-1',
      unidadMedidaTipo: 'kg',
      precio: '1250.50',
      moneda: 'CLP',
      unidadMedida: 'kg',
      cantidad: '1.500',
      creador: usuarioId,
      inventarioOrigenId: inventarioId,
    })
    .returning();
  productoId = producto.id;
  const [solicitud] = await db
    .insert(schema.Solicitudes)
    .values({
      nombre: 'Reposición',
      descripcion: '',
      motivo: 'Stock',
      creador: usuarioId,
      areaId,
      sucursalId,
      inventarioId,
      tiendaId,
    })
    .returning();
  solicitudId = solicitud.id;
  const [reporte] = await db
    .insert(schema.Reportes)
    .values({
      nombre: 'Reporte',
      descripcion: '',
      creador: usuarioId,
      areaId,
      sucursalId,
      periodoInicio: new Date('2026-01-01'),
      periodoFin: new Date('2026-02-01'),
    })
    .returning();
  reporteId = reporte.id;
  const [envio] = await db
    .insert(schema.Envios)
    .values({
      nombre: 'Traslado',
      descripcion: '',
      creador: usuarioId,
      observaciones: '',
      sucursalOrigenId: sucursalId,
      sucursalDestinoId: otraSucursalId,
      areaOrigenId: areaId,
      areaDestinoId: areas[1].id,
      inventarioOrigenId: inventarioId,
      inventarioDestinoId: otroInventarioId,
      tiendaOrigenId: tiendaId,
      tiendaDestinoId: otraTiendaId,
      solicitudAsignadaId: solicitudId,
      usuarioOrigenId: usuarioId,
      usuarioDestinoId: usuarioId,
    })
    .returning();
  envioId = envio.id;
});

after(async () => {
  await client.close();
});

async function rejectsConstraint(
  operation: PromiseLike<unknown>,
  code: string,
) {
  await assert.rejects(
    async () => {
      await operation;
    },
    (error: any) => {
      assert.equal(error.cause?.code ?? error.code, code);
      return true;
    },
  );
}

test('permite borradores sin aprobador, archivo, transportista ni fechas futuras ficticias', async () => {
  const solicitud = await db.query.Solicitudes.findFirst({
    where: eq(schema.Solicitudes.id, solicitudId),
  });
  const reporte = await db.query.Reportes.findFirst({
    where: eq(schema.Reportes.id, reporteId),
  });
  const envio = await db.query.Envios.findFirst({
    where: eq(schema.Envios.id, envioId),
  });
  assert.equal(solicitud?.aprobador, null);
  assert.equal(reporte?.generadoEn, null);
  assert.equal(reporte?.archivoClave, null);
  assert.equal(reporte?.mensajeError, null);
  assert.equal(envio?.fechaEntrega, null);
  assert.equal(envio?.transportistaId, null);
});

test('conserva decimales y rechaza precios/cantidades negativos o NaN', async () => {
  const producto = await db.query.Productos.findFirst({
    where: eq(schema.Productos.id, productoId),
  });
  assert.equal(producto?.cantidad, '1.500');
  assert.equal(producto?.precio, '1250.50');
  for (const invalid of [
    { cantidad: '-1' },
    { precio: '-1' },
    { cantidad: 'NaN' },
    { precio: 'NaN' },
  ]) {
    await rejectsConstraint(
      db
        .update(schema.Productos)
        .set(invalid)
        .where(eq(schema.Productos.id, productoId)),
      '23514',
    );
  }
});

test('impide identidades y emails duplicados sin distinguir mayúsculas ni espacios', async () => {
  await rejectsConstraint(
    db
      .insert(schema.Usuarios)
      .values({
        nombre: 'Otro',
        googleId: 'google-admin',
        email: 'otro@example.test',
      }),
    '23505',
  );
  await rejectsConstraint(
    db
      .insert(schema.Usuarios)
      .values({
        nombre: 'Otro',
        googleId: 'google-otro',
        email: ' ADMIN@example.test ',
      }),
    '23505',
  );
});

test('impide mezclar sucursales, áreas, inventarios y tiendas', async () => {
  await rejectsConstraint(
    db
      .update(schema.Solicitudes)
      .set({ sucursalId: otraSucursalId })
      .where(eq(schema.Solicitudes.id, solicitudId)),
    '23503',
  );
  await rejectsConstraint(
    db
      .update(schema.Solicitudes)
      .set({ inventarioId: otroInventarioId })
      .where(eq(schema.Solicitudes.id, solicitudId)),
    '23503',
  );
  await rejectsConstraint(
    db
      .update(schema.Solicitudes)
      .set({ tiendaId: otraTiendaId })
      .where(eq(schema.Solicitudes.id, solicitudId)),
    '23503',
  );
  await rejectsConstraint(
    db
      .update(schema.Solicitudes)
      .set({ inventarioId: null })
      .where(eq(schema.Solicitudes.id, solicitudId)),
    '23514',
  );
  await rejectsConstraint(
    db
      .update(schema.Productos)
      .set({ tiendaOrigenId: otraTiendaId })
      .where(eq(schema.Productos.id, productoId)),
    '23503',
  );
  await rejectsConstraint(
    db
      .update(schema.Envios)
      .set({ areaDestinoId: areaId })
      .where(eq(schema.Envios.id, envioId)),
    '23503',
  );
  await rejectsConstraint(
    db
      .update(schema.Reportes)
      .set({ sucursalId: otraSucursalId })
      .where(eq(schema.Reportes.id, reporteId)),
    '23503',
  );
});

test('revocar una asignación conserva la sucursal y permite múltiples asignaciones', async () => {
  const [rol] = await db
    .insert(schema.Roles)
    .values({ nombre: 'Operador', descripcion: '' })
    .returning();
  const permisos = await db
    .insert(schema.Permisos)
    .values(
      ['leer', 'editar'].map((codigo) => ({
        codigo,
        nombre: codigo,
        descripcion: '',
      })),
    )
    .returning();
  const asignaciones = await db
    .insert(schema.UsuariosRolesPermisos)
    .values(
      permisos.map((permiso) => ({
        usuarioId,
        rolId: rol.id,
        permisoId: permiso.id,
      })),
    )
    .returning();
  await db
    .insert(schema.SucursalesAsignaciones)
    .values(
      asignaciones.map((asignacion) => ({
        sucursalId,
        asignacionId: asignacion.id,
      })),
    );
  await db
    .delete(schema.UsuariosRolesPermisos)
    .where(eq(schema.UsuariosRolesPermisos.id, asignaciones[0].id));
  const sucursal = await db.query.Sucursales.findFirst({
    where: eq(schema.Sucursales.id, sucursalId),
    with: { asignaciones: true },
  });
  assert.ok(sucursal);
  assert.equal(sucursal.asignaciones.length, 1);
});

test('impide borrar el creador o las ubicaciones con datos dependientes', async () => {
  await rejectsConstraint(
    db.delete(schema.Usuarios).where(eq(schema.Usuarios.id, usuarioId)),
    '23001',
  );
  await rejectsConstraint(
    db.delete(schema.Sucursales).where(eq(schema.Sucursales.id, sucursalId)),
    '23001',
  );
  assert.ok(
    await db.query.Productos.findFirst({
      where: eq(schema.Productos.id, productoId),
    }),
  );
});

test('conserva auditorías al borrar usuarios y elimina sus sesiones', async () => {
  const [usuario] = await db
    .insert(schema.Usuarios)
    .values({
      nombre: 'Temporal',
      googleId: 'temporal',
      email: 'temporal@example.test',
    })
    .returning();
  const [auditoria] = await db
    .insert(schema.Auditorias)
    .values({
      usuarioId: usuario.id,
      tipoActor: 'usuario',
      accion: 'iniciar session',
      resultado: 'exito',
    })
    .returning();
  await db
    .insert(schema.AuthSession)
    .values({
      usuarioId: usuario.id,
      tokenHash: 'hash-temporal',
      expiresAt: new Date(Date.now() + 60_000),
    });
  await rejectsConstraint(
    db
      .insert(schema.AuthSession)
      .values({
        usuarioId: usuario.id,
        tokenHash: 'hash-temporal',
        expiresAt: new Date(Date.now() + 60_000),
      }),
    '23505',
  );
  await db.delete(schema.Usuarios).where(eq(schema.Usuarios.id, usuario.id));
  const conservada = await db.query.Auditorias.findFirst({
    where: eq(schema.Auditorias.id, auditoria.id),
  });
  assert.ok(conservada?.creadoEn);
  assert.equal(conservada.usuarioId, null);
  assert.equal(
    (
      await db
        .select()
        .from(schema.AuthSession)
        .where(eq(schema.AuthSession.usuarioId, usuario.id))
    ).length,
    0,
  );
  await db
    .insert(schema.Auditorias)
    .values({ tipoActor: 'sistema', accion: 'crear', resultado: 'exito' });
  await rejectsConstraint(
    db
      .insert(schema.Auditorias)
      .values({
        tipoActor: 'anonimo',
        accion: 'crear',
        resultado: 'denegado',
        entidadId: 123,
      }),
    '23514',
  );
});

test('valida períodos, documentos completados y mensajes de error', async () => {
  await rejectsConstraint(
    db
      .update(schema.Reportes)
      .set({ periodoFin: new Date('2025-01-01') })
      .where(eq(schema.Reportes.id, reporteId)),
    '23514',
  );
  await rejectsConstraint(
    db
      .update(schema.Reportes)
      .set({ estadoDocumento: 'completado' })
      .where(eq(schema.Reportes.id, reporteId)),
    '23514',
  );
  await rejectsConstraint(
    db
      .update(schema.Reportes)
      .set({ estadoDocumento: 'error' })
      .where(eq(schema.Reportes.id, reporteId)),
    '23514',
  );
  await db
    .update(schema.Reportes)
    .set({
      estadoDocumento: 'completado',
      generadoEn: new Date(),
      archivoClave: 'reportes/1.pdf',
    })
    .where(eq(schema.Reportes.id, reporteId));
});

test('valida fechas reales de despacho y entrega', async () => {
  await rejectsConstraint(
    db
      .update(schema.Envios)
      .set({ estado: 'despachado' })
      .where(eq(schema.Envios.id, envioId)),
    '23514',
  );
  await rejectsConstraint(
    db
      .update(schema.Envios)
      .set({
        estado: 'entregado',
        fechaEnvio: new Date('2026-01-02'),
        fechaEntrega: new Date('2026-01-01'),
      })
      .where(eq(schema.Envios.id, envioId)),
    '23514',
  );
  await db
    .update(schema.Envios)
    .set({
      estado: 'entregado',
      fechaEnvio: new Date('2026-01-01'),
      fechaEntrega: new Date('2026-01-02'),
    })
    .where(eq(schema.Envios.id, envioId));
});

test('admite entregas parciales y rechaza cantidades superiores a lo aprobado o enviado', async () => {
  await db
    .insert(schema.SolicitudesProductos)
    .values({
      solicitudId,
      productoId,
      cantidadSolicitada: '2.5',
      cantidadAprobada: '2',
      cantidadEntregada: '1.5',
    });
  await rejectsConstraint(
    db
      .update(schema.SolicitudesProductos)
      .set({ cantidadEntregada: '2.1' })
      .where(eq(schema.SolicitudesProductos.solicitudId, solicitudId)),
    '23514',
  );
  await rejectsConstraint(
    db
      .update(schema.SolicitudesProductos)
      .set({ cantidadAprobada: '3' })
      .where(eq(schema.SolicitudesProductos.solicitudId, solicitudId)),
    '23514',
  );
  await db
    .insert(schema.EnviosProductos)
    .values({ envioId, productoId, cantidad: '1.5', cantidadEntregada: '1' });
  await rejectsConstraint(
    db
      .update(schema.EnviosProductos)
      .set({ cantidadEntregada: '2' })
      .where(eq(schema.EnviosProductos.envioId, envioId)),
    '23514',
  );
  await rejectsConstraint(
    db.delete(schema.Productos).where(eq(schema.Productos.id, productoId)),
    '23001',
  );
});

test('todas las relaciones se pueden consultar sin ambigüedad', async () => {
  const config = extractTablesRelationalConfig(
    schema,
    createTableRelationsHelpers,
  );
  for (const [name, table] of Object.entries(config.tables)) {
    const withRelations = Object.fromEntries(
      Object.keys(table.relations).map((key) => [key, true]),
    );
    const query = (db.query as any)[name];
    await query.findMany({ limit: 1, with: withRelations });
  }
  const envio = await db.query.Envios.findFirst({
    where: eq(schema.Envios.id, envioId),
    with: {
      sucursalOrigen: true,
      sucursalDestino: true,
      productos: { with: { producto: true } },
    },
  });
  assert.equal(envio?.sucursalOrigen.id, sucursalId);
  assert.equal(envio?.sucursalDestino.id, otraSucursalId);
  assert.equal(envio?.productos[0].producto.id, productoId);
});
