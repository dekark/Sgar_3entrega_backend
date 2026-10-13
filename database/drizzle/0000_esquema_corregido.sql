CREATE TYPE "public"."estado_envio_enum" AS ENUM('borrador', 'preparando', 'despachado', 'en_transito', 'entregado', 'cancelado');--> statement-breakpoint
CREATE TYPE "public"."solicitud_estado_enum" AS ENUM('borrador', 'pendiente', 'aprobada', 'rechazada', 'parcial', 'completada', 'cancelada');--> statement-breakpoint
CREATE TYPE "public"."accion_auditoria_enum" AS ENUM('crear', 'actualizar', 'eliminar', 'activar', 'desactivar', 'asignar', 'revocar', 'iniciar session', 'cerrar session');--> statement-breakpoint
CREATE TYPE "public"."estado_documento_enum" AS ENUM('borrador', 'pendiente', 'generando', 'completado', 'error');--> statement-breakpoint
CREATE TYPE "public"."estado_producto_enum" AS ENUM('activo', 'inactivo', 'agotado', 'descontinuado');--> statement-breakpoint
CREATE TYPE "public"."estado_producto_inventario_tienda_enum" AS ENUM('inventario', 'tienda');--> statement-breakpoint
CREATE TYPE "public"."estado_reporte_enum" AS ENUM('borrador', 'pendiente', 'aprobada', 'rechazada', 'parcial', 'completada', 'cancelada');--> statement-breakpoint
CREATE TYPE "public"."prioridad_enum" AS ENUM('baja', 'media', 'alta');--> statement-breakpoint
CREATE TYPE "public"."prioridad_reporte_enum" AS ENUM('baja', 'media', 'alta');--> statement-breakpoint
CREATE TYPE "public"."resultado_auditoria_enum" AS ENUM('exito', 'error', 'advertencia', 'informacion', 'denegado');--> statement-breakpoint
CREATE TYPE "public"."tipo_actor_enum" AS ENUM('usuario', 'sistema', 'anonimo');--> statement-breakpoint
CREATE TYPE "public"."tipo_reporte_enum" AS ENUM('inventario', 'tienda', 'producto', 'solicitud', 'usuario', 'rol', 'permiso', 'sucursal', 'area');--> statement-breakpoint
CREATE TYPE "public"."unidad_medida_enum" AS ENUM('unidad', 'caja', 'paquete', 'kg', 'litro', 'metro');--> statement-breakpoint
CREATE TABLE "areas" (
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "areas_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"nombre" varchar(100) NOT NULL,
	"activacion" boolean DEFAULT true NOT NULL,
	"descripcion" text NOT NULL,
	"codigo" varchar(20) NOT NULL,
	"ubicacion" varchar(100) NOT NULL,
	"creador" integer NOT NULL,
	"sucursal_id" integer NOT NULL,
	CONSTRAINT "areas_sucursal_codigo_unique" UNIQUE("sucursal_id","codigo"),
	CONSTRAINT "areas_id_sucursal_unique" UNIQUE("id","sucursal_id")
);
--> statement-breakpoint
CREATE TABLE "auditorias" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "auditorias_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"activado" boolean DEFAULT true NOT NULL,
	"usuario_id" integer,
	"tipo_actor" "tipo_actor_enum" NOT NULL,
	"accion" "accion_auditoria_enum" NOT NULL,
	"resultado" "resultado_auditoria_enum" NOT NULL,
	"campos_modificados" text,
	"entidad_tipo" varchar(100),
	"entidad_id" integer,
	CONSTRAINT "auditorias_entidad_completa" CHECK (("auditorias"."entidad_tipo" IS NULL) = ("auditorias"."entidad_id" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "auth_sessions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"token_hash" varchar(255) NOT NULL,
	"usuario_id" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "auth_sessions_token_hash_unique" UNIQUE("token_hash"),
	CONSTRAINT "auth_sessions_expiracion_valida" CHECK ("auth_sessions"."expires_at" > "auth_sessions"."creado_en")
);
--> statement-breakpoint
CREATE TABLE "categorias" (
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "categorias_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"nombre" varchar(100) NOT NULL,
	"descripcion" text NOT NULL,
	"activacion" boolean DEFAULT true NOT NULL,
	"codigo" varchar(20) NOT NULL,
	"image_url" varchar(255),
	"orden" integer DEFAULT 0 NOT NULL,
	"creador" integer NOT NULL,
	CONSTRAINT "categorias_codigo_unique" UNIQUE("codigo"),
	CONSTRAINT "categorias_orden_no_negativo" CHECK ("categorias"."orden" >= 0)
);
--> statement-breakpoint
CREATE TABLE "envios" (
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "envios_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"nombre" varchar(100) NOT NULL,
	"descripcion" text NOT NULL,
	"activacion" boolean DEFAULT true NOT NULL,
	"creador" integer NOT NULL,
	"aprobador" integer,
	"estado" "estado_envio_enum" DEFAULT 'borrador' NOT NULL,
	"sucursal_origen_id" integer NOT NULL,
	"sucursal_destino_id" integer NOT NULL,
	"area_origen_id" integer NOT NULL,
	"area_destino_id" integer NOT NULL,
	"inventario_origen_id" integer NOT NULL,
	"inventario_destino_id" integer NOT NULL,
	"tienda_origen_id" integer,
	"tienda_destino_id" integer,
	"solicitud_asignada_id" integer,
	"reporte_asignado_id" integer,
	"usuario_origen_id" integer NOT NULL,
	"usuario_destino_id" integer NOT NULL,
	"transportista_id" integer,
	"numero_seguimiento" varchar(100),
	"fecha_envio" timestamp with time zone,
	"fecha_entrega" timestamp with time zone,
	"observaciones" text NOT NULL,
	CONSTRAINT "envios_fechas_validas" CHECK ("envios"."fecha_entrega" IS NULL OR ("envios"."fecha_envio" IS NOT NULL AND "envios"."fecha_entrega" >= "envios"."fecha_envio")),
	CONSTRAINT "envios_despachados_fecha" CHECK ("envios"."estado" NOT IN ('despachado', 'en_transito', 'entregado') OR "envios"."fecha_envio" IS NOT NULL),
	CONSTRAINT "envios_entregados_fecha" CHECK ("envios"."estado" <> 'entregado' OR "envios"."fecha_entrega" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "envios_productos" (
	"envio_id" integer NOT NULL,
	"producto_id" integer NOT NULL,
	"cantidad" numeric(18, 3) NOT NULL,
	"cantidad_entregada" numeric(18, 3) DEFAULT '0' NOT NULL,
	CONSTRAINT "envios_productos_envio_id_producto_id_pk" PRIMARY KEY("envio_id","producto_id"),
	CONSTRAINT "envios_productos_cantidades_validas" CHECK ("envios_productos"."cantidad" > 0 AND "envios_productos"."cantidad" < 'Infinity'::numeric AND "envios_productos"."cantidad_entregada" >= 0 AND "envios_productos"."cantidad_entregada" <= "envios_productos"."cantidad")
);
--> statement-breakpoint
CREATE TABLE "inventarios" (
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "inventarios_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"nombre" varchar(100) NOT NULL,
	"descripcion" text NOT NULL,
	"activacion" boolean DEFAULT true NOT NULL,
	"codigo" varchar(20) NOT NULL,
	"telefono" varchar(20) NOT NULL,
	"creador" integer NOT NULL,
	"area_id" integer NOT NULL,
	CONSTRAINT "inventarios_area_codigo_unique" UNIQUE("area_id","codigo"),
	CONSTRAINT "inventarios_id_area_unique" UNIQUE("id","area_id")
);
--> statement-breakpoint
CREATE TABLE "inventarios_categorias" (
	"inventario_id" integer NOT NULL,
	"categoria_id" integer NOT NULL,
	CONSTRAINT "inventarios_categorias_inventario_id_categoria_id_pk" PRIMARY KEY("inventario_id","categoria_id")
);
--> statement-breakpoint
CREATE TABLE "permisos" (
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "permisos_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"codigo" varchar(100) NOT NULL,
	"activacion" boolean DEFAULT true NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"descripcion" text NOT NULL,
	CONSTRAINT "permisos_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE "productos" (
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "productos_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"nombre" varchar(100) NOT NULL,
	"descripcion" text NOT NULL,
	"activacion" boolean DEFAULT true NOT NULL,
	"sku" varchar(20) NOT NULL,
	"codigo_barras" varchar(20),
	"marca" varchar(100),
	"modelo" varchar(100),
	"unidad_medida_tipo" "unidad_medida_enum" NOT NULL,
	"precio" numeric(18, 2) NOT NULL,
	"moneda" varchar(10) NOT NULL,
	"unidad_medida" varchar(20) NOT NULL,
	"cantidad" numeric(18, 3) DEFAULT '0' NOT NULL,
	"creador" integer NOT NULL,
	"inventario_origen" integer NOT NULL,
	"inventario_destino" integer,
	"tienda_origen" integer,
	"tienda_destino" integer,
	"estado_producto" "estado_producto_enum" DEFAULT 'activo' NOT NULL,
	"estado_producto_inventario_tienda" "estado_producto_inventario_tienda_enum" DEFAULT 'inventario' NOT NULL,
	CONSTRAINT "productos_sku_unique" UNIQUE("sku"),
	CONSTRAINT "productos_precio_valido" CHECK ("productos"."precio" >= 0 AND "productos"."precio" < 'Infinity'::numeric),
	CONSTRAINT "productos_cantidad_valida" CHECK ("productos"."cantidad" >= 0 AND "productos"."cantidad" < 'Infinity'::numeric),
	CONSTRAINT "productos_tienda_destino_inventario" CHECK ("productos"."tienda_destino" IS NULL OR "productos"."inventario_destino" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "productos_categorias" (
	"producto_id" integer NOT NULL,
	"categoria_id" integer NOT NULL,
	CONSTRAINT "productos_categorias_producto_id_categoria_id_pk" PRIMARY KEY("producto_id","categoria_id")
);
--> statement-breakpoint
CREATE TABLE "productos_imagenes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "productos_imagenes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"nombre" varchar(100) NOT NULL,
	"url" varchar(255) NOT NULL,
	"producto_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reportes" (
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "reportes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"nombre" varchar(100) NOT NULL,
	"descripcion" text NOT NULL,
	"activacion" boolean DEFAULT true NOT NULL,
	"creador" integer NOT NULL,
	"aprobador" integer,
	"estado" "estado_reporte_enum" DEFAULT 'borrador' NOT NULL,
	"tipo" "tipo_reporte_enum" DEFAULT 'inventario' NOT NULL,
	"estado_documento" "estado_documento_enum" DEFAULT 'borrador' NOT NULL,
	"prioridad" "prioridad_reporte_enum" DEFAULT 'media' NOT NULL,
	"periodo_inicio" timestamp with time zone NOT NULL,
	"periodo_fin" timestamp with time zone NOT NULL,
	"generado_en" timestamp with time zone,
	"archivo_clave" varchar(100),
	"mensaje_error" text,
	"area_id" integer NOT NULL,
	"sucursal_id" integer NOT NULL,
	"inventario_id" integer,
	"tienda_id" integer,
	CONSTRAINT "reportes_tienda_inventario" CHECK ("reportes"."tienda_id" IS NULL OR "reportes"."inventario_id" IS NOT NULL),
	CONSTRAINT "reportes_periodo_valido" CHECK ("reportes"."periodo_fin" >= "reportes"."periodo_inicio"),
	CONSTRAINT "reportes_documento_completado" CHECK ("reportes"."estado_documento" <> 'completado' OR ("reportes"."generado_en" IS NOT NULL AND "reportes"."archivo_clave" IS NOT NULL AND length(trim("reportes"."archivo_clave")) > 0)),
	CONSTRAINT "reportes_documento_error" CHECK ("reportes"."estado_documento" <> 'error' OR ("reportes"."mensaje_error" IS NOT NULL AND length(trim("reportes"."mensaje_error")) > 0))
);
--> statement-breakpoint
CREATE TABLE "reportes_productos" (
	"reporte_id" integer NOT NULL,
	"producto_id" integer NOT NULL,
	CONSTRAINT "reportes_productos_reporte_id_producto_id_pk" PRIMARY KEY("reporte_id","producto_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "roles_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"activacion" boolean DEFAULT true NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"descripcion" text NOT NULL,
	CONSTRAINT "roles_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
CREATE TABLE "solicitudes" (
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "solicitudes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"nombre" varchar(100) NOT NULL,
	"activacion" boolean DEFAULT true NOT NULL,
	"descripcion" text NOT NULL,
	"motivo" text NOT NULL,
	"creador" integer NOT NULL,
	"aprobador" integer,
	"estado" "solicitud_estado_enum" DEFAULT 'borrador' NOT NULL,
	"prioridad" "prioridad_enum" DEFAULT 'media' NOT NULL,
	"tienda_id" integer,
	"inventario_id" integer,
	"area_id" integer NOT NULL,
	"sucursal_id" integer NOT NULL,
	CONSTRAINT "solicitudes_tienda_inventario" CHECK ("solicitudes"."tienda_id" IS NULL OR "solicitudes"."inventario_id" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "solicitudes_productos" (
	"solicitud_id" integer NOT NULL,
	"producto_id" integer NOT NULL,
	"cantidad_solicitada" numeric(18, 3) NOT NULL,
	"cantidad_aprobada" numeric(18, 3),
	"cantidad_entregada" numeric(18, 3) DEFAULT '0' NOT NULL,
	CONSTRAINT "solicitudes_productos_solicitud_id_producto_id_pk" PRIMARY KEY("solicitud_id","producto_id"),
	CONSTRAINT "solicitudes_productos_cantidades_validas" CHECK ("solicitudes_productos"."cantidad_solicitada" > 0 AND "solicitudes_productos"."cantidad_solicitada" < 'Infinity'::numeric AND ("solicitudes_productos"."cantidad_aprobada" IS NULL OR ("solicitudes_productos"."cantidad_aprobada" >= 0 AND "solicitudes_productos"."cantidad_aprobada" <= "solicitudes_productos"."cantidad_solicitada")) AND "solicitudes_productos"."cantidad_entregada" >= 0 AND "solicitudes_productos"."cantidad_entregada" <= coalesce("solicitudes_productos"."cantidad_aprobada", 0))
);
--> statement-breakpoint
CREATE TABLE "sucursales" (
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "sucursales_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"nombre" varchar(100) NOT NULL,
	"direccion" text NOT NULL,
	"activacion" boolean DEFAULT true NOT NULL,
	"telefono" varchar(20) NOT NULL,
	"correo" varchar(100) NOT NULL,
	"codigo" varchar(20) NOT NULL,
	"ciudad" varchar(100) NOT NULL,
	"pais" varchar(100) NOT NULL,
	"region" varchar(100) NOT NULL,
	"email_contacto" varchar(100) NOT NULL,
	"horario_atencion" varchar(100) NOT NULL,
	"creador_id" integer NOT NULL,
	CONSTRAINT "sucursales_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE "sucursales_asignaciones" (
	"sucursal_id" integer NOT NULL,
	"asignacion_id" integer NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sucursales_asignaciones_sucursal_id_asignacion_id_pk" PRIMARY KEY("sucursal_id","asignacion_id")
);
--> statement-breakpoint
CREATE TABLE "tiendas" (
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tiendas_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"nombre" varchar(100) NOT NULL,
	"descripcion" text NOT NULL,
	"activacion" boolean DEFAULT true NOT NULL,
	"codigo" varchar(20) NOT NULL,
	"ciudad" varchar(100) NOT NULL,
	"pais" varchar(100) NOT NULL,
	"region" varchar(100) NOT NULL,
	"telefono" varchar(20) NOT NULL,
	"correo" varchar(100) NOT NULL,
	"horario_atencion" varchar(100) NOT NULL,
	"creador" integer NOT NULL,
	"inventario_id" integer NOT NULL,
	CONSTRAINT "tiendas_inventario_codigo_unique" UNIQUE("inventario_id","codigo"),
	CONSTRAINT "tiendas_id_inventario_unique" UNIQUE("id","inventario_id")
);
--> statement-breakpoint
CREATE TABLE "tiendas_categorias" (
	"tienda_id" integer NOT NULL,
	"categoria_id" integer NOT NULL,
	CONSTRAINT "tiendas_categorias_tienda_id_categoria_id_pk" PRIMARY KEY("tienda_id","categoria_id")
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "usuarios_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"nombre" varchar(100) NOT NULL,
	"activacion" boolean DEFAULT false NOT NULL,
	"google_id" varchar(100) NOT NULL,
	"email" varchar(254) NOT NULL,
	"email_verificado" boolean DEFAULT false NOT NULL,
	"avatar_url" varchar(255),
	"telefono" varchar(20),
	"cargo" varchar(100),
	"idioma" varchar(10) DEFAULT 'es' NOT NULL,
	"ultimo_acceso" timestamp with time zone,
	CONSTRAINT "usuarios_google_id_unique" UNIQUE("google_id")
);
--> statement-breakpoint
CREATE TABLE "usuarios_roles_permisos" (
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "usuarios_roles_permisos_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"usuario_id" integer NOT NULL,
	"rol_id" integer NOT NULL,
	"permiso_id" integer NOT NULL,
	CONSTRAINT "usuarios_roles_permisos_asignacion_unique" UNIQUE("usuario_id","rol_id","permiso_id")
);
--> statement-breakpoint
ALTER TABLE "areas" ADD CONSTRAINT "areas_creador_usuarios_id_fk" FOREIGN KEY ("creador") REFERENCES "public"."usuarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "areas" ADD CONSTRAINT "areas_sucursal_id_sucursales_id_fk" FOREIGN KEY ("sucursal_id") REFERENCES "public"."sucursales"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auditorias" ADD CONSTRAINT "auditorias_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_creador_usuarios_id_fk" FOREIGN KEY ("creador") REFERENCES "public"."usuarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "envios" ADD CONSTRAINT "envios_creador_usuarios_id_fk" FOREIGN KEY ("creador") REFERENCES "public"."usuarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "envios" ADD CONSTRAINT "envios_aprobador_usuarios_id_fk" FOREIGN KEY ("aprobador") REFERENCES "public"."usuarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "envios" ADD CONSTRAINT "envios_sucursal_origen_id_sucursales_id_fk" FOREIGN KEY ("sucursal_origen_id") REFERENCES "public"."sucursales"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "envios" ADD CONSTRAINT "envios_sucursal_destino_id_sucursales_id_fk" FOREIGN KEY ("sucursal_destino_id") REFERENCES "public"."sucursales"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "envios" ADD CONSTRAINT "envios_area_origen_id_areas_id_fk" FOREIGN KEY ("area_origen_id") REFERENCES "public"."areas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "envios" ADD CONSTRAINT "envios_area_destino_id_areas_id_fk" FOREIGN KEY ("area_destino_id") REFERENCES "public"."areas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "envios" ADD CONSTRAINT "envios_inventario_origen_id_inventarios_id_fk" FOREIGN KEY ("inventario_origen_id") REFERENCES "public"."inventarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "envios" ADD CONSTRAINT "envios_inventario_destino_id_inventarios_id_fk" FOREIGN KEY ("inventario_destino_id") REFERENCES "public"."inventarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "envios" ADD CONSTRAINT "envios_tienda_origen_id_tiendas_id_fk" FOREIGN KEY ("tienda_origen_id") REFERENCES "public"."tiendas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "envios" ADD CONSTRAINT "envios_tienda_destino_id_tiendas_id_fk" FOREIGN KEY ("tienda_destino_id") REFERENCES "public"."tiendas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "envios" ADD CONSTRAINT "envios_solicitud_asignada_id_solicitudes_id_fk" FOREIGN KEY ("solicitud_asignada_id") REFERENCES "public"."solicitudes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "envios" ADD CONSTRAINT "envios_reporte_asignado_id_reportes_id_fk" FOREIGN KEY ("reporte_asignado_id") REFERENCES "public"."reportes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "envios" ADD CONSTRAINT "envios_usuario_origen_id_usuarios_id_fk" FOREIGN KEY ("usuario_origen_id") REFERENCES "public"."usuarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "envios" ADD CONSTRAINT "envios_usuario_destino_id_usuarios_id_fk" FOREIGN KEY ("usuario_destino_id") REFERENCES "public"."usuarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "envios" ADD CONSTRAINT "envios_transportista_id_usuarios_id_fk" FOREIGN KEY ("transportista_id") REFERENCES "public"."usuarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "envios" ADD CONSTRAINT "envios_area_origen_sucursal_fk" FOREIGN KEY ("area_origen_id","sucursal_origen_id") REFERENCES "public"."areas"("id","sucursal_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "envios" ADD CONSTRAINT "envios_inventario_origen_area_fk" FOREIGN KEY ("inventario_origen_id","area_origen_id") REFERENCES "public"."inventarios"("id","area_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "envios" ADD CONSTRAINT "envios_tienda_origen_inventario_fk" FOREIGN KEY ("tienda_origen_id","inventario_origen_id") REFERENCES "public"."tiendas"("id","inventario_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "envios" ADD CONSTRAINT "envios_area_destino_sucursal_fk" FOREIGN KEY ("area_destino_id","sucursal_destino_id") REFERENCES "public"."areas"("id","sucursal_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "envios" ADD CONSTRAINT "envios_inventario_destino_area_fk" FOREIGN KEY ("inventario_destino_id","area_destino_id") REFERENCES "public"."inventarios"("id","area_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "envios" ADD CONSTRAINT "envios_tienda_destino_inventario_fk" FOREIGN KEY ("tienda_destino_id","inventario_destino_id") REFERENCES "public"."tiendas"("id","inventario_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "envios_productos" ADD CONSTRAINT "envios_productos_envio_id_envios_id_fk" FOREIGN KEY ("envio_id") REFERENCES "public"."envios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "envios_productos" ADD CONSTRAINT "envios_productos_producto_id_productos_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventarios" ADD CONSTRAINT "inventarios_creador_usuarios_id_fk" FOREIGN KEY ("creador") REFERENCES "public"."usuarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventarios" ADD CONSTRAINT "inventarios_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventarios_categorias" ADD CONSTRAINT "inventarios_categorias_inventario_id_inventarios_id_fk" FOREIGN KEY ("inventario_id") REFERENCES "public"."inventarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventarios_categorias" ADD CONSTRAINT "inventarios_categorias_categoria_id_categorias_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productos" ADD CONSTRAINT "productos_creador_usuarios_id_fk" FOREIGN KEY ("creador") REFERENCES "public"."usuarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productos" ADD CONSTRAINT "productos_inventario_origen_inventarios_id_fk" FOREIGN KEY ("inventario_origen") REFERENCES "public"."inventarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productos" ADD CONSTRAINT "productos_inventario_destino_inventarios_id_fk" FOREIGN KEY ("inventario_destino") REFERENCES "public"."inventarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productos" ADD CONSTRAINT "productos_tienda_origen_tiendas_id_fk" FOREIGN KEY ("tienda_origen") REFERENCES "public"."tiendas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productos" ADD CONSTRAINT "productos_tienda_destino_tiendas_id_fk" FOREIGN KEY ("tienda_destino") REFERENCES "public"."tiendas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productos" ADD CONSTRAINT "productos_tienda_origen_inventario_fk" FOREIGN KEY ("tienda_origen","inventario_origen") REFERENCES "public"."tiendas"("id","inventario_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productos" ADD CONSTRAINT "productos_tienda_destino_inventario_fk" FOREIGN KEY ("tienda_destino","inventario_destino") REFERENCES "public"."tiendas"("id","inventario_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productos_categorias" ADD CONSTRAINT "productos_categorias_producto_id_productos_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productos_categorias" ADD CONSTRAINT "productos_categorias_categoria_id_categorias_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productos_imagenes" ADD CONSTRAINT "productos_imagenes_producto_id_productos_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reportes" ADD CONSTRAINT "reportes_creador_usuarios_id_fk" FOREIGN KEY ("creador") REFERENCES "public"."usuarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reportes" ADD CONSTRAINT "reportes_aprobador_usuarios_id_fk" FOREIGN KEY ("aprobador") REFERENCES "public"."usuarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reportes" ADD CONSTRAINT "reportes_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reportes" ADD CONSTRAINT "reportes_sucursal_id_sucursales_id_fk" FOREIGN KEY ("sucursal_id") REFERENCES "public"."sucursales"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reportes" ADD CONSTRAINT "reportes_inventario_id_inventarios_id_fk" FOREIGN KEY ("inventario_id") REFERENCES "public"."inventarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reportes" ADD CONSTRAINT "reportes_tienda_id_tiendas_id_fk" FOREIGN KEY ("tienda_id") REFERENCES "public"."tiendas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reportes" ADD CONSTRAINT "reportes_area_sucursal_fk" FOREIGN KEY ("area_id","sucursal_id") REFERENCES "public"."areas"("id","sucursal_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reportes" ADD CONSTRAINT "reportes_inventario_area_fk" FOREIGN KEY ("inventario_id","area_id") REFERENCES "public"."inventarios"("id","area_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reportes" ADD CONSTRAINT "reportes_tienda_inventario_fk" FOREIGN KEY ("tienda_id","inventario_id") REFERENCES "public"."tiendas"("id","inventario_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reportes_productos" ADD CONSTRAINT "reportes_productos_reporte_id_reportes_id_fk" FOREIGN KEY ("reporte_id") REFERENCES "public"."reportes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reportes_productos" ADD CONSTRAINT "reportes_productos_producto_id_productos_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitudes" ADD CONSTRAINT "solicitudes_creador_usuarios_id_fk" FOREIGN KEY ("creador") REFERENCES "public"."usuarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitudes" ADD CONSTRAINT "solicitudes_aprobador_usuarios_id_fk" FOREIGN KEY ("aprobador") REFERENCES "public"."usuarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitudes" ADD CONSTRAINT "solicitudes_tienda_id_tiendas_id_fk" FOREIGN KEY ("tienda_id") REFERENCES "public"."tiendas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitudes" ADD CONSTRAINT "solicitudes_inventario_id_inventarios_id_fk" FOREIGN KEY ("inventario_id") REFERENCES "public"."inventarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitudes" ADD CONSTRAINT "solicitudes_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitudes" ADD CONSTRAINT "solicitudes_sucursal_id_sucursales_id_fk" FOREIGN KEY ("sucursal_id") REFERENCES "public"."sucursales"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitudes" ADD CONSTRAINT "solicitudes_area_sucursal_fk" FOREIGN KEY ("area_id","sucursal_id") REFERENCES "public"."areas"("id","sucursal_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitudes" ADD CONSTRAINT "solicitudes_inventario_area_fk" FOREIGN KEY ("inventario_id","area_id") REFERENCES "public"."inventarios"("id","area_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitudes" ADD CONSTRAINT "solicitudes_tienda_inventario_fk" FOREIGN KEY ("tienda_id","inventario_id") REFERENCES "public"."tiendas"("id","inventario_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitudes_productos" ADD CONSTRAINT "solicitudes_productos_solicitud_id_solicitudes_id_fk" FOREIGN KEY ("solicitud_id") REFERENCES "public"."solicitudes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitudes_productos" ADD CONSTRAINT "solicitudes_productos_producto_id_productos_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sucursales" ADD CONSTRAINT "sucursales_creador_id_usuarios_id_fk" FOREIGN KEY ("creador_id") REFERENCES "public"."usuarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sucursales_asignaciones" ADD CONSTRAINT "sucursales_asignaciones_sucursal_id_sucursales_id_fk" FOREIGN KEY ("sucursal_id") REFERENCES "public"."sucursales"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sucursales_asignaciones" ADD CONSTRAINT "sucursales_asignaciones_asignacion_id_usuarios_roles_permisos_id_fk" FOREIGN KEY ("asignacion_id") REFERENCES "public"."usuarios_roles_permisos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tiendas" ADD CONSTRAINT "tiendas_creador_usuarios_id_fk" FOREIGN KEY ("creador") REFERENCES "public"."usuarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tiendas" ADD CONSTRAINT "tiendas_inventario_id_inventarios_id_fk" FOREIGN KEY ("inventario_id") REFERENCES "public"."inventarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tiendas_categorias" ADD CONSTRAINT "tiendas_categorias_tienda_id_tiendas_id_fk" FOREIGN KEY ("tienda_id") REFERENCES "public"."tiendas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tiendas_categorias" ADD CONSTRAINT "tiendas_categorias_categoria_id_categorias_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuarios_roles_permisos" ADD CONSTRAINT "usuarios_roles_permisos_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuarios_roles_permisos" ADD CONSTRAINT "usuarios_roles_permisos_rol_id_roles_id_fk" FOREIGN KEY ("rol_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuarios_roles_permisos" ADD CONSTRAINT "usuarios_roles_permisos_permiso_id_permisos_id_fk" FOREIGN KEY ("permiso_id") REFERENCES "public"."permisos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "areas_sucursal_id_idx" ON "areas" USING btree ("sucursal_id");--> statement-breakpoint
CREATE INDEX "auditorias_entidad_tipo_entidad_id_idx" ON "auditorias" USING btree ("entidad_tipo","entidad_id");--> statement-breakpoint
CREATE INDEX "auditorias_usuario_fecha_idx" ON "auditorias" USING btree ("usuario_id","creado_en");--> statement-breakpoint
CREATE INDEX "auditorias_fecha_idx" ON "auditorias" USING btree ("creado_en");--> statement-breakpoint
CREATE INDEX "auth_sessions_usuario_id_idx" ON "auth_sessions" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX "auth_sessions_expires_at_idx" ON "auth_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "envios_estado_idx" ON "envios" USING btree ("estado");--> statement-breakpoint
CREATE INDEX "envios_solicitud_idx" ON "envios" USING btree ("solicitud_asignada_id");--> statement-breakpoint
CREATE INDEX "envios_reporte_idx" ON "envios" USING btree ("reporte_asignado_id");--> statement-breakpoint
CREATE INDEX "envios_inventario_origen_idx" ON "envios" USING btree ("inventario_origen_id");--> statement-breakpoint
CREATE INDEX "envios_inventario_destino_idx" ON "envios" USING btree ("inventario_destino_id");--> statement-breakpoint
CREATE INDEX "envios_productos_producto_idx" ON "envios_productos" USING btree ("producto_id");--> statement-breakpoint
CREATE INDEX "inventarios_area_id_idx" ON "inventarios" USING btree ("area_id");--> statement-breakpoint
CREATE INDEX "inventarios_categorias_categoria_id_idx" ON "inventarios_categorias" USING btree ("categoria_id");--> statement-breakpoint
CREATE INDEX "productos_inventario_origen_idx" ON "productos" USING btree ("inventario_origen");--> statement-breakpoint
CREATE INDEX "productos_inventario_destino_idx" ON "productos" USING btree ("inventario_destino");--> statement-breakpoint
CREATE INDEX "productos_tienda_origen_idx" ON "productos" USING btree ("tienda_origen");--> statement-breakpoint
CREATE INDEX "productos_tienda_destino_idx" ON "productos" USING btree ("tienda_destino");--> statement-breakpoint
CREATE INDEX "productos_categorias_categoria_id_idx" ON "productos_categorias" USING btree ("categoria_id");--> statement-breakpoint
CREATE INDEX "productos_imagenes_producto_id_idx" ON "productos_imagenes" USING btree ("producto_id");--> statement-breakpoint
CREATE INDEX "reportes_sucursal_estado_idx" ON "reportes" USING btree ("sucursal_id","estado");--> statement-breakpoint
CREATE INDEX "reportes_creador_idx" ON "reportes" USING btree ("creador");--> statement-breakpoint
CREATE INDEX "reportes_productos_producto_id_idx" ON "reportes_productos" USING btree ("producto_id");--> statement-breakpoint
CREATE INDEX "solicitudes_sucursal_estado_idx" ON "solicitudes" USING btree ("sucursal_id","estado");--> statement-breakpoint
CREATE INDEX "solicitudes_creador_idx" ON "solicitudes" USING btree ("creador");--> statement-breakpoint
CREATE INDEX "solicitudes_productos_producto_id_idx" ON "solicitudes_productos" USING btree ("producto_id");--> statement-breakpoint
CREATE INDEX "sucursales_creador_id_idx" ON "sucursales" USING btree ("creador_id");--> statement-breakpoint
CREATE INDEX "sucursales_asignaciones_asignacion_idx" ON "sucursales_asignaciones" USING btree ("asignacion_id");--> statement-breakpoint
CREATE INDEX "tiendas_inventario_id_idx" ON "tiendas" USING btree ("inventario_id");--> statement-breakpoint
CREATE INDEX "tiendas_categorias_categoria_id_idx" ON "tiendas_categorias" USING btree ("categoria_id");--> statement-breakpoint
CREATE UNIQUE INDEX "usuarios_email_unique" ON "usuarios" USING btree (lower(trim("email")));--> statement-breakpoint
CREATE INDEX "usuarios_roles_permisos_usuario_id_idx" ON "usuarios_roles_permisos" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX "usuarios_roles_permisos_rol_id_idx" ON "usuarios_roles_permisos" USING btree ("rol_id");--> statement-breakpoint
CREATE INDEX "usuarios_roles_permisos_permiso_id_idx" ON "usuarios_roles_permisos" USING btree ("permiso_id");