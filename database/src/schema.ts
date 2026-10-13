import { relations, sql } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  unique,
  index,
  pgEnum,
  primaryKey,
  check,
  foreignKey,
  numeric,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// actualizadoEn se actualiza mediante Drizzle; las escrituras SQL directas deben actualizarlo.
const fechasRegistro = () => ({
  creadoEn: timestamp('creado_en', { withTimezone: true })
    .notNull()
    .defaultNow(),
  actualizadoEn: timestamp('actualizado_en', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// numeric conserva la precisión decimal y se devuelve como string.
const cantidadDecimal = (nombre: string) =>
  numeric(nombre, { precision: 18, scale: 3 });

export const Usuarios = pgTable(
  'usuarios',
  {
    ...fechasRegistro(),
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    nombre: varchar('nombre', {
      length: 100,
    }).notNull(),
    activacion: boolean('activacion').notNull().default(false),
    googleId: varchar('google_id', {
      length: 100,
    }).notNull(),
    email: varchar('email', {
      length: 254,
    }).notNull(),
    emailVerificado: boolean('email_verificado').notNull().default(false),
    avatarUrl: varchar('avatar_url', {
      length: 255,
    }),
    telefono: varchar('telefono', {
      length: 20,
    }),
    cargo: varchar('cargo', {
      length: 100,
    }),
    idioma: varchar('idioma', {
      length: 10,
    })
      .notNull()
      .default('es'),
    ultimoAcceso: timestamp('ultimo_acceso', { withTimezone: true }),
  },
  (table) => [
    unique('usuarios_google_id_unique').on(table.googleId),
    uniqueIndex('usuarios_email_unique').on(sql`lower(trim(${table.email}))`),
  ],
);

export const Roles = pgTable(
  'roles',
  {
    ...fechasRegistro(),
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    activacion: boolean('activacion').notNull().default(true),
    nombre: varchar('nombre', {
      length: 100,
    }).notNull(),
    descripcion: text('descripcion').notNull(),
  },
  (table) => [unique('roles_nombre_unique').on(table.nombre)],
);

export const Permisos = pgTable(
  'permisos',
  {
    ...fechasRegistro(),
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    codigo: varchar('codigo', {
      length: 100,
    }).notNull(),
    activacion: boolean('activacion').notNull().default(true),
    nombre: varchar('nombre', {
      length: 100,
    }).notNull(),
    descripcion: text('descripcion').notNull(),
  },
  (table) => [unique('permisos_codigo_unique').on(table.codigo)],
);

export const Sucursales = pgTable(
  'sucursales',
  {
    ...fechasRegistro(),
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    nombre: varchar('nombre', {
      length: 100,
    }).notNull(),
    direccion: text('direccion').notNull(),
    activacion: boolean('activacion').notNull().default(true),
    telefono: varchar('telefono', {
      length: 20,
    }).notNull(),
    correo: varchar('correo', {
      length: 100,
    }).notNull(),
    codigo: varchar('codigo', {
      length: 20,
    }).notNull(),
    ciudad: varchar('ciudad', {
      length: 100,
    }).notNull(),
    pais: varchar('pais', {
      length: 100,
    }).notNull(),
    region: varchar('region', {
      length: 100,
    }).notNull(),
    emailContacto: varchar('email_contacto', {
      length: 100,
    }).notNull(),
    horarioAtencion: varchar('horario_atencion', {
      length: 100,
    }).notNull(),
    creadorId: integer('creador_id')
      .notNull()
      .references(() => Usuarios.id, { onDelete: 'restrict' }),
  },
  (table) => [
    unique('sucursales_codigo_unique').on(table.codigo),
    index('sucursales_creador_id_idx').on(table.creadorId),
  ],
);

export const Areas = pgTable(
  'areas',
  {
    ...fechasRegistro(),
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    nombre: varchar('nombre', {
      length: 100,
    }).notNull(),
    activacion: boolean('activacion').notNull().default(true),
    descripcion: text('descripcion').notNull(),
    codigo: varchar('codigo', {
      length: 20,
    }).notNull(),
    ubicacion: varchar('ubicacion', {
      length: 100,
    }).notNull(),
    creador: integer('creador')
      .notNull()
      .references(() => Usuarios.id, { onDelete: 'restrict' }),

    sucursalId: integer('sucursal_id')
      .notNull()
      .references(() => Sucursales.id, { onDelete: 'restrict' }),
  },
  (table) => [
    index('areas_sucursal_id_idx').on(table.sucursalId),
    unique('areas_sucursal_codigo_unique').on(table.sucursalId, table.codigo),
    unique('areas_id_sucursal_unique').on(table.id, table.sucursalId),
  ],
);

export const Inventarios = pgTable(
  'inventarios',
  {
    ...fechasRegistro(),
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    nombre: varchar('nombre', {
      length: 100,
    }).notNull(),
    descripcion: text('descripcion').notNull(),
    activacion: boolean('activacion').notNull().default(true),
    codigo: varchar('codigo', {
      length: 20,
    }).notNull(),
    telefono: varchar('telefono', {
      length: 20,
    }).notNull(),
    creador: integer('creador')
      .notNull()
      .references(() => Usuarios.id, { onDelete: 'restrict' }),
    areaId: integer('area_id')
      .notNull()
      .references(() => Areas.id, { onDelete: 'restrict' }),
  },
  (table) => [
    index('inventarios_area_id_idx').on(table.areaId),
    unique('inventarios_area_codigo_unique').on(table.areaId, table.codigo),
    unique('inventarios_id_area_unique').on(table.id, table.areaId),
  ],
);

export const Categorias = pgTable(
  'categorias',
  {
    ...fechasRegistro(),
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    nombre: varchar('nombre', {
      length: 100,
    }).notNull(),
    descripcion: text('descripcion').notNull(),
    activacion: boolean('activacion').notNull().default(true),
    codigo: varchar('codigo', {
      length: 20,
    }).notNull(),
    imageUrl: varchar('image_url', {
      length: 255,
    }),
    orden: integer('orden').notNull().default(0),
    creador: integer('creador')
      .notNull()
      .references(() => Usuarios.id, { onDelete: 'restrict' }),
  },
  (table) => [
    unique('categorias_codigo_unique').on(table.codigo),
    check('categorias_orden_no_negativo', sql`${table.orden} >= 0`),
  ],
);

export const unidadMedidaEnum = pgEnum('unidad_medida_enum', [
  'unidad',
  'caja',
  'paquete',
  'kg',
  'litro',
  'metro',
]);
export const estadoProductoEnum = pgEnum('estado_producto_enum', [
  'activo',
  'inactivo',
  'agotado',
  'descontinuado',
]);
export const estadoProductoInventarioTiendaEnum = pgEnum(
  'estado_producto_inventario_tienda_enum',
  ['inventario', 'tienda'],
);

// Se conserva un saldo por producto; origen/destino no son saldos por ubicación.
export const Productos = pgTable(
  'productos',
  {
    ...fechasRegistro(),
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    nombre: varchar('nombre', {
      length: 100,
    }).notNull(),
    descripcion: text('descripcion').notNull(),
    activacion: boolean('activacion').notNull().default(true),
    sku: varchar('sku', {
      length: 20,
    }).notNull(),
    codigoBarras: varchar('codigo_barras', {
      length: 20,
    }),
    marca: varchar('marca', {
      length: 100,
    }),
    modelo: varchar('modelo', {
      length: 100,
    }),
    unidadMedidaTipo: unidadMedidaEnum('unidad_medida_tipo').notNull(),
    // Precio en unidades de la moneda indicada (por ejemplo, 1250.50).
    precio: numeric('precio', { precision: 18, scale: 2 }).notNull(),
    moneda: varchar('moneda', {
      length: 10,
    }).notNull(),
    unidadMedida: varchar('unidad_medida', {
      length: 20,
    }).notNull(),
    cantidad: cantidadDecimal('cantidad').notNull().default('0'),
    creador: integer('creador')
      .notNull()
      .references(() => Usuarios.id, { onDelete: 'restrict' }),
    inventarioOrigenId: integer('inventario_origen')
      .notNull()
      .references(() => Inventarios.id, { onDelete: 'restrict' }),
    inventarioDestinoId: integer('inventario_destino').references(
      () => Inventarios.id,
      { onDelete: 'restrict' },
    ),
    tiendaOrigenId: integer('tienda_origen').references(() => Tiendas.id, {
      onDelete: 'restrict',
    }),
    tiendaDestinoId: integer('tienda_destino').references(() => Tiendas.id, {
      onDelete: 'restrict',
    }),
    estadoProducto: estadoProductoEnum('estado_producto')
      .notNull()
      .default('activo'),
    estadoProductoInventarioTienda: estadoProductoInventarioTiendaEnum(
      'estado_producto_inventario_tienda',
    )
      .notNull()
      .default('inventario'),
  },
  (table) => [
    unique('productos_sku_unique').on(table.sku),
    check(
      'productos_precio_valido',
      sql`${table.precio} >= 0 AND ${table.precio} < 'Infinity'::numeric`,
    ),
    check(
      'productos_cantidad_valida',
      sql`${table.cantidad} >= 0 AND ${table.cantidad} < 'Infinity'::numeric`,
    ),
    check(
      'productos_tienda_destino_inventario',
      sql`${table.tiendaDestinoId} IS NULL OR ${table.inventarioDestinoId} IS NOT NULL`,
    ),
    foreignKey({
      name: 'productos_tienda_origen_inventario_fk',
      columns: [table.tiendaOrigenId, table.inventarioOrigenId],
      foreignColumns: [Tiendas.id, Tiendas.inventarioId],
    }).onDelete('restrict'),
    foreignKey({
      name: 'productos_tienda_destino_inventario_fk',
      columns: [table.tiendaDestinoId, table.inventarioDestinoId],
      foreignColumns: [Tiendas.id, Tiendas.inventarioId],
    }).onDelete('restrict'),
    index('productos_inventario_origen_idx').on(table.inventarioOrigenId),
    index('productos_inventario_destino_idx').on(table.inventarioDestinoId),
    index('productos_tienda_origen_idx').on(table.tiendaOrigenId),
    index('productos_tienda_destino_idx').on(table.tiendaDestinoId),
  ],
);

export const ProductosImagenes = pgTable(
  'productos_imagenes',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    nombre: varchar('nombre', {
      length: 100,
    }).notNull(),
    url: varchar('url', {
      length: 255,
    }).notNull(),
    productoId: integer('producto_id')
      .notNull()
      .references(() => Productos.id, { onDelete: 'cascade' }),
  },
  (table) => [index('productos_imagenes_producto_id_idx').on(table.productoId)],
);

export const Tiendas = pgTable(
  'tiendas',
  {
    ...fechasRegistro(),
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    nombre: varchar('nombre', {
      length: 100,
    }).notNull(),
    descripcion: text('descripcion').notNull(),
    activacion: boolean('activacion').notNull().default(true),
    codigo: varchar('codigo', {
      length: 20,
    }).notNull(),
    ciudad: varchar('ciudad', {
      length: 100,
    }).notNull(),
    pais: varchar('pais', {
      length: 100,
    }).notNull(),
    region: varchar('region', {
      length: 100,
    }).notNull(),
    telefono: varchar('telefono', {
      length: 20,
    }).notNull(),
    correo: varchar('correo', {
      length: 100,
    }).notNull(),
    horarioAtencion: varchar('horario_atencion', {
      length: 100,
    }).notNull(),
    creador: integer('creador')
      .notNull()
      .references(() => Usuarios.id, { onDelete: 'restrict' }),
    inventarioId: integer('inventario_id')
      .notNull()
      .references(() => Inventarios.id, { onDelete: 'restrict' }),
  },
  (table) => [
    index('tiendas_inventario_id_idx').on(table.inventarioId),
    unique('tiendas_inventario_codigo_unique').on(
      table.inventarioId,
      table.codigo,
    ),
    unique('tiendas_id_inventario_unique').on(table.id, table.inventarioId),
  ],
);

export const SolicitudEstadoEnum = pgEnum('solicitud_estado_enum', [
  'borrador',
  'pendiente',
  'aprobada',
  'rechazada',
  'parcial',
  'completada',
  'cancelada',
]);

export const prioridadEnum = pgEnum('prioridad_enum', [
  'baja',
  'media',
  'alta',
]);

export const Solicitudes = pgTable(
  'solicitudes',
  {
    ...fechasRegistro(),
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    nombre: varchar('nombre', {
      length: 100,
    }).notNull(),
    activacion: boolean('activacion').notNull().default(true),
    descripcion: text('descripcion').notNull(),
    motivo: text('motivo').notNull(),
    creador: integer('creador')
      .notNull()
      .references(() => Usuarios.id, { onDelete: 'restrict' }),
    aprobador: integer('aprobador').references(() => Usuarios.id, {
      onDelete: 'restrict',
    }),
    estado: SolicitudEstadoEnum('estado').notNull().default('borrador'),
    prioridad: prioridadEnum('prioridad').notNull().default('media'),
    tiendaId: integer('tienda_id').references(() => Tiendas.id, {
      onDelete: 'restrict',
    }),
    inventarioId: integer('inventario_id').references(() => Inventarios.id, {
      onDelete: 'restrict',
    }),
    areaId: integer('area_id')
      .notNull()
      .references(() => Areas.id, { onDelete: 'restrict' }),
    sucursalId: integer('sucursal_id')
      .notNull()
      .references(() => Sucursales.id, { onDelete: 'restrict' }),
  },
  (table) => [
    foreignKey({
      name: 'solicitudes_area_sucursal_fk',
      columns: [table.areaId, table.sucursalId],
      foreignColumns: [Areas.id, Areas.sucursalId],
    }).onDelete('restrict'),
    foreignKey({
      name: 'solicitudes_inventario_area_fk',
      columns: [table.inventarioId, table.areaId],
      foreignColumns: [Inventarios.id, Inventarios.areaId],
    }).onDelete('restrict'),
    foreignKey({
      name: 'solicitudes_tienda_inventario_fk',
      columns: [table.tiendaId, table.inventarioId],
      foreignColumns: [Tiendas.id, Tiendas.inventarioId],
    }).onDelete('restrict'),
    check(
      'solicitudes_tienda_inventario',
      sql`${table.tiendaId} IS NULL OR ${table.inventarioId} IS NOT NULL`,
    ),
    index('solicitudes_sucursal_estado_idx').on(table.sucursalId, table.estado),
    index('solicitudes_creador_idx').on(table.creador),
  ],
);

export const estadoReporteEnum = pgEnum('estado_reporte_enum', [
  'borrador',
  'pendiente',
  'aprobada',
  'rechazada',
  'parcial',
  'completada',
  'cancelada',
]);

export const estadoDocumentoEnum = pgEnum('estado_documento_enum', [
  'borrador',
  'pendiente',
  'generando',
  'completado',
  'error',
]);
export const tipoReporteEnum = pgEnum('tipo_reporte_enum', [
  'inventario',
  'tienda',
  'producto',
  'solicitud',
  'usuario',
  'rol',
  'permiso',
  'sucursal',
  'area',
]);
export const prioridadReporteEnum = pgEnum('prioridad_reporte_enum', [
  'baja',
  'media',
  'alta',
]);
export const Reportes = pgTable(
  'reportes',
  {
    ...fechasRegistro(),
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    nombre: varchar('nombre', {
      length: 100,
    }).notNull(),
    descripcion: text('descripcion').notNull(),
    activacion: boolean('activacion').notNull().default(true),
    creador: integer('creador')
      .notNull()
      .references(() => Usuarios.id, { onDelete: 'restrict' }),
    aprobador: integer('aprobador').references(() => Usuarios.id, {
      onDelete: 'restrict',
    }),
    estado: estadoReporteEnum('estado').notNull().default('borrador'),
    tipo: tipoReporteEnum('tipo').notNull().default('inventario'),
    estadoDocumento: estadoDocumentoEnum('estado_documento')
      .notNull()
      .default('borrador'),
    prioridad: prioridadReporteEnum('prioridad').notNull().default('media'),
    periodoInicio: timestamp('periodo_inicio', {
      withTimezone: true,
    }).notNull(),
    periodoFin: timestamp('periodo_fin', { withTimezone: true }).notNull(),
    generadoEn: timestamp('generado_en', { withTimezone: true }),
    archivoClave: varchar('archivo_clave', {
      length: 100,
    }),
    mensajeError: text('mensaje_error'),
    areaId: integer('area_id')
      .notNull()
      .references(() => Areas.id, { onDelete: 'restrict' }),
    sucursalId: integer('sucursal_id')
      .notNull()
      .references(() => Sucursales.id, { onDelete: 'restrict' }),
    inventarioId: integer('inventario_id').references(() => Inventarios.id, {
      onDelete: 'restrict',
    }),
    tiendaId: integer('tienda_id').references(() => Tiendas.id, {
      onDelete: 'restrict',
    }),
  },
  (table) => [
    foreignKey({
      name: 'reportes_area_sucursal_fk',
      columns: [table.areaId, table.sucursalId],
      foreignColumns: [Areas.id, Areas.sucursalId],
    }).onDelete('restrict'),
    foreignKey({
      name: 'reportes_inventario_area_fk',
      columns: [table.inventarioId, table.areaId],
      foreignColumns: [Inventarios.id, Inventarios.areaId],
    }).onDelete('restrict'),
    foreignKey({
      name: 'reportes_tienda_inventario_fk',
      columns: [table.tiendaId, table.inventarioId],
      foreignColumns: [Tiendas.id, Tiendas.inventarioId],
    }).onDelete('restrict'),
    check(
      'reportes_tienda_inventario',
      sql`${table.tiendaId} IS NULL OR ${table.inventarioId} IS NOT NULL`,
    ),
    index('reportes_sucursal_estado_idx').on(table.sucursalId, table.estado),
    index('reportes_creador_idx').on(table.creador),
    check(
      'reportes_periodo_valido',
      sql`${table.periodoFin} >= ${table.periodoInicio}`,
    ),
    check(
      'reportes_documento_completado',
      sql`${table.estadoDocumento} <> 'completado' OR (${table.generadoEn} IS NOT NULL AND ${table.archivoClave} IS NOT NULL AND length(trim(${table.archivoClave})) > 0)`,
    ),
    check(
      'reportes_documento_error',
      sql`${table.estadoDocumento} <> 'error' OR (${table.mensajeError} IS NOT NULL AND length(trim(${table.mensajeError})) > 0)`,
    ),
  ],
);

export const EstadoEnvioEnum = pgEnum('estado_envio_enum', [
  'borrador',
  'preparando',
  'despachado',
  'en_transito',
  'entregado',
  'cancelado',
]);

export const Envios = pgTable(
  'envios',
  {
    ...fechasRegistro(),
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    nombre: varchar('nombre', {
      length: 100,
    }).notNull(),
    descripcion: text('descripcion').notNull(),
    activacion: boolean('activacion').notNull().default(true),
    creador: integer('creador')
      .notNull()
      .references(() => Usuarios.id, { onDelete: 'restrict' }),
    aprobador: integer('aprobador').references(() => Usuarios.id, {
      onDelete: 'restrict',
    }),
    estado: EstadoEnvioEnum('estado').notNull().default('borrador'),
    sucursalOrigenId: integer('sucursal_origen_id')
      .notNull()
      .references(() => Sucursales.id, { onDelete: 'restrict' }),
    sucursalDestinoId: integer('sucursal_destino_id')
      .notNull()
      .references(() => Sucursales.id, { onDelete: 'restrict' }),
    areaOrigenId: integer('area_origen_id')
      .notNull()
      .references(() => Areas.id, { onDelete: 'restrict' }),
    areaDestinoId: integer('area_destino_id')
      .notNull()
      .references(() => Areas.id, { onDelete: 'restrict' }),
    inventarioOrigenId: integer('inventario_origen_id')
      .notNull()
      .references(() => Inventarios.id, { onDelete: 'restrict' }),
    inventarioDestinoId: integer('inventario_destino_id')
      .notNull()
      .references(() => Inventarios.id, { onDelete: 'restrict' }),
    tiendaOrigenId: integer('tienda_origen_id').references(() => Tiendas.id, {
      onDelete: 'restrict',
    }),
    tiendaDestinoId: integer('tienda_destino_id').references(() => Tiendas.id, {
      onDelete: 'restrict',
    }),
    solicitudAsignadaId: integer('solicitud_asignada_id').references(
      () => Solicitudes.id,
      { onDelete: 'restrict' },
    ),
    reporteAsignadoId: integer('reporte_asignado_id').references(
      () => Reportes.id,
      { onDelete: 'restrict' },
    ),
    usuarioOrigenId: integer('usuario_origen_id')
      .notNull()
      .references(() => Usuarios.id, { onDelete: 'restrict' }),
    usuarioDestinoId: integer('usuario_destino_id')
      .notNull()
      .references(() => Usuarios.id, { onDelete: 'restrict' }),
    transportistaId: integer('transportista_id').references(() => Usuarios.id, {
      onDelete: 'restrict',
    }),
    numeroSeguimiento: varchar('numero_seguimiento', {
      length: 100,
    }),
    fechaEnvio: timestamp('fecha_envio', { withTimezone: true }),
    fechaEntrega: timestamp('fecha_entrega', { withTimezone: true }),
    observaciones: text('observaciones').notNull(),
  },
  (table) => [
    check(
      'envios_fechas_validas',
      sql`${table.fechaEntrega} IS NULL OR (${table.fechaEnvio} IS NOT NULL AND ${table.fechaEntrega} >= ${table.fechaEnvio})`,
    ),
    check(
      'envios_despachados_fecha',
      sql`${table.estado} NOT IN ('despachado', 'en_transito', 'entregado') OR ${table.fechaEnvio} IS NOT NULL`,
    ),
    check(
      'envios_entregados_fecha',
      sql`${table.estado} <> 'entregado' OR ${table.fechaEntrega} IS NOT NULL`,
    ),
    index('envios_estado_idx').on(table.estado),
    index('envios_solicitud_idx').on(table.solicitudAsignadaId),
    index('envios_reporte_idx').on(table.reporteAsignadoId),
    foreignKey({
      name: 'envios_area_origen_sucursal_fk',
      columns: [table.areaOrigenId, table.sucursalOrigenId],
      foreignColumns: [Areas.id, Areas.sucursalId],
    }).onDelete('restrict'),
    foreignKey({
      name: 'envios_inventario_origen_area_fk',
      columns: [table.inventarioOrigenId, table.areaOrigenId],
      foreignColumns: [Inventarios.id, Inventarios.areaId],
    }).onDelete('restrict'),
    foreignKey({
      name: 'envios_tienda_origen_inventario_fk',
      columns: [table.tiendaOrigenId, table.inventarioOrigenId],
      foreignColumns: [Tiendas.id, Tiendas.inventarioId],
    }).onDelete('restrict'),
    index('envios_inventario_origen_idx').on(table.inventarioOrigenId),
    foreignKey({
      name: 'envios_area_destino_sucursal_fk',
      columns: [table.areaDestinoId, table.sucursalDestinoId],
      foreignColumns: [Areas.id, Areas.sucursalId],
    }).onDelete('restrict'),
    foreignKey({
      name: 'envios_inventario_destino_area_fk',
      columns: [table.inventarioDestinoId, table.areaDestinoId],
      foreignColumns: [Inventarios.id, Inventarios.areaId],
    }).onDelete('restrict'),
    foreignKey({
      name: 'envios_tienda_destino_inventario_fk',
      columns: [table.tiendaDestinoId, table.inventarioDestinoId],
      foreignColumns: [Tiendas.id, Tiendas.inventarioId],
    }).onDelete('restrict'),
    index('envios_inventario_destino_idx').on(table.inventarioDestinoId),
  ],
);

export const tipoActorEnum = pgEnum('tipo_actor_enum', [
  'usuario',
  'sistema',
  'anonimo',
]);
export const accionAuditoriaEnum = pgEnum('accion_auditoria_enum', [
  'crear',
  'actualizar',
  'eliminar',
  'activar',
  'desactivar',
  'asignar',
  'revocar',
  'iniciar session',
  'cerrar session',
]);
export const resultadoAuditoriaEnum = pgEnum('resultado_auditoria_enum', [
  'exito',
  'error',
  'advertencia',
  'informacion',
  'denegado',
]);

export const Auditorias = pgTable(
  'auditorias',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    creadoEn: timestamp('creado_en', { withTimezone: true })
      .notNull()
      .defaultNow(),
    activado: boolean('activado').notNull().default(true),
    usuarioId: integer('usuario_id').references(() => Usuarios.id, {
      onDelete: 'set null',
    }),
    tipoActor: tipoActorEnum('tipo_actor').notNull(),
    accion: accionAuditoriaEnum('accion').notNull(),
    resultado: resultadoAuditoriaEnum('resultado').notNull(),
    camposModificados: text('campos_modificados'),

    // Referencia polimorfica: el servicio valida la entidad y el registro asociado.
    entidadTipo: varchar('entidad_tipo', { length: 100 }),
    entidadId: integer('entidad_id'),
  },
  (table) => [
    index('auditorias_entidad_tipo_entidad_id_idx').on(
      table.entidadTipo,
      table.entidadId,
    ),
    check(
      'auditorias_entidad_completa',
      sql`(${table.entidadTipo} IS NULL) = (${table.entidadId} IS NULL)`,
    ),
    index('auditorias_usuario_fecha_idx').on(table.usuarioId, table.creadoEn),
    index('auditorias_fecha_idx').on(table.creadoEn),
  ],
);

export const AuthSession = pgTable(
  'auth_sessions',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    creadoEn: timestamp('creado_en', { withTimezone: true })
      .notNull()
      .defaultNow(),
    tokenHash: varchar('token_hash', { length: 255 }).notNull(),
    usuarioId: integer('usuario_id')
      .notNull()
      .references(() => Usuarios.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    unique('auth_sessions_token_hash_unique').on(table.tokenHash),
    index('auth_sessions_usuario_id_idx').on(table.usuarioId),
    index('auth_sessions_expires_at_idx').on(table.expiresAt),
    check(
      'auth_sessions_expiracion_valida',
      sql`${table.expiresAt} > ${table.creadoEn}`,
    ),
  ],
);

export const ReportesProductos = pgTable(
  'reportes_productos',
  {
    reporteId: integer('reporte_id')
      .notNull()
      .references(() => Reportes.id, { onDelete: 'cascade' }),
    productoId: integer('producto_id')
      .notNull()
      .references(() => Productos.id, { onDelete: 'restrict' }),
  },
  (table) => [
    primaryKey({ columns: [table.reporteId, table.productoId] }),
    index('reportes_productos_producto_id_idx').on(table.productoId),
  ],
);

export const SolicitudesProductos = pgTable(
  'solicitudes_productos',
  {
    solicitudId: integer('solicitud_id')
      .notNull()
      .references(() => Solicitudes.id, { onDelete: 'cascade' }),
    productoId: integer('producto_id')
      .notNull()
      .references(() => Productos.id, { onDelete: 'restrict' }),
    cantidadSolicitada: cantidadDecimal('cantidad_solicitada').notNull(),
    cantidadAprobada: cantidadDecimal('cantidad_aprobada'),
    cantidadEntregada: cantidadDecimal('cantidad_entregada')
      .notNull()
      .default('0'),
  },
  (table) => [
    primaryKey({ columns: [table.solicitudId, table.productoId] }),
    index('solicitudes_productos_producto_id_idx').on(table.productoId),
    check(
      'solicitudes_productos_cantidades_validas',
      sql`${table.cantidadSolicitada} > 0 AND ${table.cantidadSolicitada} < 'Infinity'::numeric AND (${table.cantidadAprobada} IS NULL OR (${table.cantidadAprobada} >= 0 AND ${table.cantidadAprobada} <= ${table.cantidadSolicitada})) AND ${table.cantidadEntregada} >= 0 AND ${table.cantidadEntregada} <= coalesce(${table.cantidadAprobada}, 0)`,
    ),
  ],
);

// Cada asignación vincula un usuario, un rol y un permiso concretos.
export const UsuariosRolesPermisos = pgTable(
  'usuarios_roles_permisos',
  {
    ...fechasRegistro(),
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    usuarioId: integer('usuario_id')
      .notNull()
      .references(() => Usuarios.id, { onDelete: 'cascade' }),
    rolId: integer('rol_id')
      .notNull()
      .references(() => Roles.id, { onDelete: 'cascade' }),
    permisoId: integer('permiso_id')
      .notNull()
      .references(() => Permisos.id, { onDelete: 'cascade' }),
  },
  (table) => [
    unique('usuarios_roles_permisos_asignacion_unique').on(
      table.usuarioId,
      table.rolId,
      table.permisoId,
    ),
    index('usuarios_roles_permisos_usuario_id_idx').on(table.usuarioId),
    index('usuarios_roles_permisos_rol_id_idx').on(table.rolId),
    index('usuarios_roles_permisos_permiso_id_idx').on(table.permisoId),
  ],
);

export const InventariosCategorias = pgTable(
  'inventarios_categorias',
  {
    inventarioId: integer('inventario_id')
      .notNull()
      .references(() => Inventarios.id, { onDelete: 'cascade' }),
    categoriaId: integer('categoria_id')
      .notNull()
      .references(() => Categorias.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.inventarioId, table.categoriaId] }),
    index('inventarios_categorias_categoria_id_idx').on(table.categoriaId),
  ],
);

export const TiendasCategorias = pgTable(
  'tiendas_categorias',
  {
    tiendaId: integer('tienda_id')
      .notNull()
      .references(() => Tiendas.id, { onDelete: 'cascade' }),
    categoriaId: integer('categoria_id')
      .notNull()
      .references(() => Categorias.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.tiendaId, table.categoriaId] }),
    index('tiendas_categorias_categoria_id_idx').on(table.categoriaId),
  ],
);

export const ProductosCategorias = pgTable(
  'productos_categorias',
  {
    productoId: integer('producto_id')
      .notNull()
      .references(() => Productos.id, { onDelete: 'cascade' }),
    categoriaId: integer('categoria_id')
      .notNull()
      .references(() => Categorias.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.productoId, table.categoriaId] }),
    index('productos_categorias_categoria_id_idx').on(table.categoriaId),
  ],
);

// Una sucursal puede tener múltiples asignaciones; revocarlas no elimina la sucursal.
export const SucursalesAsignaciones = pgTable(
  'sucursales_asignaciones',
  {
    sucursalId: integer('sucursal_id')
      .notNull()
      .references(() => Sucursales.id, { onDelete: 'cascade' }),
    asignacionId: integer('asignacion_id')
      .notNull()
      .references(() => UsuariosRolesPermisos.id, { onDelete: 'cascade' }),
    creadoEn: timestamp('creado_en', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.sucursalId, table.asignacionId] }),
    index('sucursales_asignaciones_asignacion_idx').on(table.asignacionId),
  ],
);

// El servicio debe actualizar el detalle, el estado y el stock dentro de una transacción.
export const EnviosProductos = pgTable(
  'envios_productos',
  {
    envioId: integer('envio_id')
      .notNull()
      .references(() => Envios.id, { onDelete: 'cascade' }),
    productoId: integer('producto_id')
      .notNull()
      .references(() => Productos.id, { onDelete: 'restrict' }),
    cantidad: cantidadDecimal('cantidad').notNull(),
    cantidadEntregada: cantidadDecimal('cantidad_entregada')
      .notNull()
      .default('0'),
  },
  (table) => [
    primaryKey({ columns: [table.envioId, table.productoId] }),
    index('envios_productos_producto_idx').on(table.productoId),
    check(
      'envios_productos_cantidades_validas',
      sql`${table.cantidad} > 0 AND ${table.cantidad} < 'Infinity'::numeric AND ${table.cantidadEntregada} >= 0 AND ${table.cantidadEntregada} <= ${table.cantidad}`,
    ),
  ],
);

// relationName distingue los múltiples vínculos con una misma tabla.
export const UsuariosRelations = relations(Usuarios, ({ many }) => ({
  sucursales: many(Sucursales, { relationName: 'Sucursales_creadorId' }),
  areasCreador: many(Areas, { relationName: 'Areas_creador' }),
  inventariosCreador: many(Inventarios, {
    relationName: 'Inventarios_creador',
  }),
  categoriasCreador: many(Categorias, { relationName: 'Categorias_creador' }),
  productosCreador: many(Productos, { relationName: 'Productos_creador' }),
  tiendasCreador: many(Tiendas, { relationName: 'Tiendas_creador' }),
  solicitudesCreador: many(Solicitudes, {
    relationName: 'Solicitudes_creador',
  }),
  solicitudesAprobador: many(Solicitudes, {
    relationName: 'Solicitudes_aprobador',
  }),
  reportesCreador: many(Reportes, { relationName: 'Reportes_creador' }),
  reportesAprobador: many(Reportes, { relationName: 'Reportes_aprobador' }),
  enviosCreador: many(Envios, { relationName: 'Envios_creador' }),
  enviosAprobador: many(Envios, { relationName: 'Envios_aprobador' }),
  enviosUsuarioOrigen: many(Envios, { relationName: 'Envios_usuarioOrigenId' }),
  enviosUsuarioDestino: many(Envios, {
    relationName: 'Envios_usuarioDestinoId',
  }),
  enviosTransportista: many(Envios, { relationName: 'Envios_transportistaId' }),
  auditorias: many(Auditorias, { relationName: 'Auditorias_usuarioId' }),
  sesiones: many(AuthSession, { relationName: 'AuthSession_usuarioId' }),
  asignaciones: many(UsuariosRolesPermisos, {
    relationName: 'UsuariosRolesPermisos_usuarioId',
  }),
}));

export const RolesRelations = relations(Roles, ({ many }) => ({
  asignaciones: many(UsuariosRolesPermisos, {
    relationName: 'UsuariosRolesPermisos_rolId',
  }),
}));

export const PermisosRelations = relations(Permisos, ({ many }) => ({
  asignaciones: many(UsuariosRolesPermisos, {
    relationName: 'UsuariosRolesPermisos_permisoId',
  }),
}));

export const SucursalesRelations = relations(Sucursales, ({ one, many }) => ({
  creador: one(Usuarios, {
    fields: [Sucursales.creadorId],
    references: [Usuarios.id],
    relationName: 'Sucursales_creadorId',
  }),
  areas: many(Areas, { relationName: 'Areas_sucursalId' }),
  solicitudesSucursal: many(Solicitudes, {
    relationName: 'Solicitudes_sucursalId',
  }),
  reportesSucursal: many(Reportes, { relationName: 'Reportes_sucursalId' }),
  enviosSucursalOrigen: many(Envios, {
    relationName: 'Envios_sucursalOrigenId',
  }),
  enviosSucursalDestino: many(Envios, {
    relationName: 'Envios_sucursalDestinoId',
  }),
  asignaciones: many(SucursalesAsignaciones, {
    relationName: 'SucursalesAsignaciones_sucursalId',
  }),
}));

export const AreasRelations = relations(Areas, ({ one, many }) => ({
  creadorUsuario: one(Usuarios, {
    fields: [Areas.creador],
    references: [Usuarios.id],
    relationName: 'Areas_creador',
  }),
  sucursal: one(Sucursales, {
    fields: [Areas.sucursalId],
    references: [Sucursales.id],
    relationName: 'Areas_sucursalId',
  }),
  inventarios: many(Inventarios, { relationName: 'Inventarios_areaId' }),
  solicitudesArea: many(Solicitudes, { relationName: 'Solicitudes_areaId' }),
  reportesArea: many(Reportes, { relationName: 'Reportes_areaId' }),
  enviosAreaOrigen: many(Envios, { relationName: 'Envios_areaOrigenId' }),
  enviosAreaDestino: many(Envios, { relationName: 'Envios_areaDestinoId' }),
}));

export const InventariosRelations = relations(Inventarios, ({ one, many }) => ({
  creadorUsuario: one(Usuarios, {
    fields: [Inventarios.creador],
    references: [Usuarios.id],
    relationName: 'Inventarios_creador',
  }),
  area: one(Areas, {
    fields: [Inventarios.areaId],
    references: [Areas.id],
    relationName: 'Inventarios_areaId',
  }),
  productosInventarioOrigen: many(Productos, {
    relationName: 'Productos_inventarioOrigenId',
  }),
  productosInventarioDestino: many(Productos, {
    relationName: 'Productos_inventarioDestinoId',
  }),
  tiendas: many(Tiendas, { relationName: 'Tiendas_inventarioId' }),
  solicitudesInventario: many(Solicitudes, {
    relationName: 'Solicitudes_inventarioId',
  }),
  reportesInventario: many(Reportes, { relationName: 'Reportes_inventarioId' }),
  enviosInventarioOrigen: many(Envios, {
    relationName: 'Envios_inventarioOrigenId',
  }),
  enviosInventarioDestino: many(Envios, {
    relationName: 'Envios_inventarioDestinoId',
  }),
  categorias: many(InventariosCategorias, {
    relationName: 'InventariosCategorias_inventarioId',
  }),
}));

export const CategoriasRelations = relations(Categorias, ({ one, many }) => ({
  creadorUsuario: one(Usuarios, {
    fields: [Categorias.creador],
    references: [Usuarios.id],
    relationName: 'Categorias_creador',
  }),
  inventarios: many(InventariosCategorias, {
    relationName: 'InventariosCategorias_categoriaId',
  }),
  tiendas: many(TiendasCategorias, {
    relationName: 'TiendasCategorias_categoriaId',
  }),
  productos: many(ProductosCategorias, {
    relationName: 'ProductosCategorias_categoriaId',
  }),
}));

export const ProductosRelations = relations(Productos, ({ one, many }) => ({
  creadorUsuario: one(Usuarios, {
    fields: [Productos.creador],
    references: [Usuarios.id],
    relationName: 'Productos_creador',
  }),
  inventarioOrigen: one(Inventarios, {
    fields: [Productos.inventarioOrigenId],
    references: [Inventarios.id],
    relationName: 'Productos_inventarioOrigenId',
  }),
  inventarioDestino: one(Inventarios, {
    fields: [Productos.inventarioDestinoId],
    references: [Inventarios.id],
    relationName: 'Productos_inventarioDestinoId',
  }),
  tiendaOrigen: one(Tiendas, {
    fields: [Productos.tiendaOrigenId],
    references: [Tiendas.id],
    relationName: 'Productos_tiendaOrigenId',
  }),
  tiendaDestino: one(Tiendas, {
    fields: [Productos.tiendaDestinoId],
    references: [Tiendas.id],
    relationName: 'Productos_tiendaDestinoId',
  }),
  imagenes: many(ProductosImagenes, {
    relationName: 'ProductosImagenes_productoId',
  }),
  reportes: many(ReportesProductos, {
    relationName: 'ReportesProductos_productoId',
  }),
  solicitudes: many(SolicitudesProductos, {
    relationName: 'SolicitudesProductos_productoId',
  }),
  categorias: many(ProductosCategorias, {
    relationName: 'ProductosCategorias_productoId',
  }),
  envios: many(EnviosProductos, { relationName: 'EnviosProductos_productoId' }),
}));

export const ProductosImagenesRelations = relations(
  ProductosImagenes,
  ({ one }) => ({
    producto: one(Productos, {
      fields: [ProductosImagenes.productoId],
      references: [Productos.id],
      relationName: 'ProductosImagenes_productoId',
    }),
  }),
);

export const TiendasRelations = relations(Tiendas, ({ one, many }) => ({
  creadorUsuario: one(Usuarios, {
    fields: [Tiendas.creador],
    references: [Usuarios.id],
    relationName: 'Tiendas_creador',
  }),
  inventario: one(Inventarios, {
    fields: [Tiendas.inventarioId],
    references: [Inventarios.id],
    relationName: 'Tiendas_inventarioId',
  }),
  productosTiendaOrigen: many(Productos, {
    relationName: 'Productos_tiendaOrigenId',
  }),
  productosTiendaDestino: many(Productos, {
    relationName: 'Productos_tiendaDestinoId',
  }),
  solicitudesTienda: many(Solicitudes, {
    relationName: 'Solicitudes_tiendaId',
  }),
  reportesTienda: many(Reportes, { relationName: 'Reportes_tiendaId' }),
  enviosTiendaOrigen: many(Envios, { relationName: 'Envios_tiendaOrigenId' }),
  enviosTiendaDestino: many(Envios, { relationName: 'Envios_tiendaDestinoId' }),
  categorias: many(TiendasCategorias, {
    relationName: 'TiendasCategorias_tiendaId',
  }),
}));

export const SolicitudesRelations = relations(Solicitudes, ({ one, many }) => ({
  creadorUsuario: one(Usuarios, {
    fields: [Solicitudes.creador],
    references: [Usuarios.id],
    relationName: 'Solicitudes_creador',
  }),
  aprobadorUsuario: one(Usuarios, {
    fields: [Solicitudes.aprobador],
    references: [Usuarios.id],
    relationName: 'Solicitudes_aprobador',
  }),
  tienda: one(Tiendas, {
    fields: [Solicitudes.tiendaId],
    references: [Tiendas.id],
    relationName: 'Solicitudes_tiendaId',
  }),
  inventario: one(Inventarios, {
    fields: [Solicitudes.inventarioId],
    references: [Inventarios.id],
    relationName: 'Solicitudes_inventarioId',
  }),
  area: one(Areas, {
    fields: [Solicitudes.areaId],
    references: [Areas.id],
    relationName: 'Solicitudes_areaId',
  }),
  sucursal: one(Sucursales, {
    fields: [Solicitudes.sucursalId],
    references: [Sucursales.id],
    relationName: 'Solicitudes_sucursalId',
  }),
  enviosSolicitudAsignada: many(Envios, {
    relationName: 'Envios_solicitudAsignadaId',
  }),
  productos: many(SolicitudesProductos, {
    relationName: 'SolicitudesProductos_solicitudId',
  }),
}));

export const ReportesRelations = relations(Reportes, ({ one, many }) => ({
  creadorUsuario: one(Usuarios, {
    fields: [Reportes.creador],
    references: [Usuarios.id],
    relationName: 'Reportes_creador',
  }),
  aprobadorUsuario: one(Usuarios, {
    fields: [Reportes.aprobador],
    references: [Usuarios.id],
    relationName: 'Reportes_aprobador',
  }),
  area: one(Areas, {
    fields: [Reportes.areaId],
    references: [Areas.id],
    relationName: 'Reportes_areaId',
  }),
  sucursal: one(Sucursales, {
    fields: [Reportes.sucursalId],
    references: [Sucursales.id],
    relationName: 'Reportes_sucursalId',
  }),
  inventario: one(Inventarios, {
    fields: [Reportes.inventarioId],
    references: [Inventarios.id],
    relationName: 'Reportes_inventarioId',
  }),
  tienda: one(Tiendas, {
    fields: [Reportes.tiendaId],
    references: [Tiendas.id],
    relationName: 'Reportes_tiendaId',
  }),
  enviosReporteAsignado: many(Envios, {
    relationName: 'Envios_reporteAsignadoId',
  }),
  productos: many(ReportesProductos, {
    relationName: 'ReportesProductos_reporteId',
  }),
}));

export const EnviosRelations = relations(Envios, ({ one, many }) => ({
  creadorUsuario: one(Usuarios, {
    fields: [Envios.creador],
    references: [Usuarios.id],
    relationName: 'Envios_creador',
  }),
  aprobadorUsuario: one(Usuarios, {
    fields: [Envios.aprobador],
    references: [Usuarios.id],
    relationName: 'Envios_aprobador',
  }),
  sucursalOrigen: one(Sucursales, {
    fields: [Envios.sucursalOrigenId],
    references: [Sucursales.id],
    relationName: 'Envios_sucursalOrigenId',
  }),
  sucursalDestino: one(Sucursales, {
    fields: [Envios.sucursalDestinoId],
    references: [Sucursales.id],
    relationName: 'Envios_sucursalDestinoId',
  }),
  areaOrigen: one(Areas, {
    fields: [Envios.areaOrigenId],
    references: [Areas.id],
    relationName: 'Envios_areaOrigenId',
  }),
  areaDestino: one(Areas, {
    fields: [Envios.areaDestinoId],
    references: [Areas.id],
    relationName: 'Envios_areaDestinoId',
  }),
  inventarioOrigen: one(Inventarios, {
    fields: [Envios.inventarioOrigenId],
    references: [Inventarios.id],
    relationName: 'Envios_inventarioOrigenId',
  }),
  inventarioDestino: one(Inventarios, {
    fields: [Envios.inventarioDestinoId],
    references: [Inventarios.id],
    relationName: 'Envios_inventarioDestinoId',
  }),
  tiendaOrigen: one(Tiendas, {
    fields: [Envios.tiendaOrigenId],
    references: [Tiendas.id],
    relationName: 'Envios_tiendaOrigenId',
  }),
  tiendaDestino: one(Tiendas, {
    fields: [Envios.tiendaDestinoId],
    references: [Tiendas.id],
    relationName: 'Envios_tiendaDestinoId',
  }),
  solicitudAsignada: one(Solicitudes, {
    fields: [Envios.solicitudAsignadaId],
    references: [Solicitudes.id],
    relationName: 'Envios_solicitudAsignadaId',
  }),
  reporteAsignado: one(Reportes, {
    fields: [Envios.reporteAsignadoId],
    references: [Reportes.id],
    relationName: 'Envios_reporteAsignadoId',
  }),
  usuarioOrigen: one(Usuarios, {
    fields: [Envios.usuarioOrigenId],
    references: [Usuarios.id],
    relationName: 'Envios_usuarioOrigenId',
  }),
  usuarioDestino: one(Usuarios, {
    fields: [Envios.usuarioDestinoId],
    references: [Usuarios.id],
    relationName: 'Envios_usuarioDestinoId',
  }),
  transportista: one(Usuarios, {
    fields: [Envios.transportistaId],
    references: [Usuarios.id],
    relationName: 'Envios_transportistaId',
  }),
  productos: many(EnviosProductos, { relationName: 'EnviosProductos_envioId' }),
}));

export const AuditoriasRelations = relations(Auditorias, ({ one }) => ({
  usuario: one(Usuarios, {
    fields: [Auditorias.usuarioId],
    references: [Usuarios.id],
    relationName: 'Auditorias_usuarioId',
  }),
}));

export const AuthSessionRelations = relations(AuthSession, ({ one }) => ({
  usuario: one(Usuarios, {
    fields: [AuthSession.usuarioId],
    references: [Usuarios.id],
    relationName: 'AuthSession_usuarioId',
  }),
}));

export const ReportesProductosRelations = relations(
  ReportesProductos,
  ({ one }) => ({
    reporte: one(Reportes, {
      fields: [ReportesProductos.reporteId],
      references: [Reportes.id],
      relationName: 'ReportesProductos_reporteId',
    }),
    producto: one(Productos, {
      fields: [ReportesProductos.productoId],
      references: [Productos.id],
      relationName: 'ReportesProductos_productoId',
    }),
  }),
);

export const SolicitudesProductosRelations = relations(
  SolicitudesProductos,
  ({ one }) => ({
    solicitud: one(Solicitudes, {
      fields: [SolicitudesProductos.solicitudId],
      references: [Solicitudes.id],
      relationName: 'SolicitudesProductos_solicitudId',
    }),
    producto: one(Productos, {
      fields: [SolicitudesProductos.productoId],
      references: [Productos.id],
      relationName: 'SolicitudesProductos_productoId',
    }),
  }),
);

export const UsuariosRolesPermisosRelations = relations(
  UsuariosRolesPermisos,
  ({ one, many }) => ({
    usuario: one(Usuarios, {
      fields: [UsuariosRolesPermisos.usuarioId],
      references: [Usuarios.id],
      relationName: 'UsuariosRolesPermisos_usuarioId',
    }),
    rol: one(Roles, {
      fields: [UsuariosRolesPermisos.rolId],
      references: [Roles.id],
      relationName: 'UsuariosRolesPermisos_rolId',
    }),
    permiso: one(Permisos, {
      fields: [UsuariosRolesPermisos.permisoId],
      references: [Permisos.id],
      relationName: 'UsuariosRolesPermisos_permisoId',
    }),
    sucursales: many(SucursalesAsignaciones, {
      relationName: 'SucursalesAsignaciones_asignacionId',
    }),
  }),
);

export const InventariosCategoriasRelations = relations(
  InventariosCategorias,
  ({ one }) => ({
    inventario: one(Inventarios, {
      fields: [InventariosCategorias.inventarioId],
      references: [Inventarios.id],
      relationName: 'InventariosCategorias_inventarioId',
    }),
    categoria: one(Categorias, {
      fields: [InventariosCategorias.categoriaId],
      references: [Categorias.id],
      relationName: 'InventariosCategorias_categoriaId',
    }),
  }),
);

export const TiendasCategoriasRelations = relations(
  TiendasCategorias,
  ({ one }) => ({
    tienda: one(Tiendas, {
      fields: [TiendasCategorias.tiendaId],
      references: [Tiendas.id],
      relationName: 'TiendasCategorias_tiendaId',
    }),
    categoria: one(Categorias, {
      fields: [TiendasCategorias.categoriaId],
      references: [Categorias.id],
      relationName: 'TiendasCategorias_categoriaId',
    }),
  }),
);

export const ProductosCategoriasRelations = relations(
  ProductosCategorias,
  ({ one }) => ({
    producto: one(Productos, {
      fields: [ProductosCategorias.productoId],
      references: [Productos.id],
      relationName: 'ProductosCategorias_productoId',
    }),
    categoria: one(Categorias, {
      fields: [ProductosCategorias.categoriaId],
      references: [Categorias.id],
      relationName: 'ProductosCategorias_categoriaId',
    }),
  }),
);

export const SucursalesAsignacionesRelations = relations(
  SucursalesAsignaciones,
  ({ one }) => ({
    sucursal: one(Sucursales, {
      fields: [SucursalesAsignaciones.sucursalId],
      references: [Sucursales.id],
      relationName: 'SucursalesAsignaciones_sucursalId',
    }),
    asignacion: one(UsuariosRolesPermisos, {
      fields: [SucursalesAsignaciones.asignacionId],
      references: [UsuariosRolesPermisos.id],
      relationName: 'SucursalesAsignaciones_asignacionId',
    }),
  }),
);

export const EnviosProductosRelations = relations(
  EnviosProductos,
  ({ one }) => ({
    envio: one(Envios, {
      fields: [EnviosProductos.envioId],
      references: [Envios.id],
      relationName: 'EnviosProductos_envioId',
    }),
    producto: one(Productos, {
      fields: [EnviosProductos.productoId],
      references: [Productos.id],
      relationName: 'EnviosProductos_productoId',
    }),
  }),
);
