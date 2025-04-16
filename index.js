const express = require("express");
const db = require("./db");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// formaciones
app.post("/api/formaciones", async (req, res) => {
  let fecha_inicio = req.body?.fecha_inicio;
  let fecha_final = req.body?.fecha_final;

  try {
    let query = `
      SELECT *
      FROM V_EXCEL
    `;

    if (fecha_inicio && fecha_final) {
      query += ` WHERE STR_TO_DATE(FECHA, '%d/%m/%Y') BETWEEN STR_TO_DATE('${fecha_inicio}', '%Y/%m/%d') AND STR_TO_DATE('${fecha_final}', '%Y/%m/%d')`;
    }
    if (fecha_inicio && !fecha_final) {
      query += ` WHERE STR_TO_DATE(FECHA, '%d/%m/%Y') >= STR_TO_DATE('${fecha_inicio}', '%Y/%m/%d')`;
    }
    if (!fecha_inicio && fecha_final) {
      query += ` WHERE STR_TO_DATE(FECHA, '%d/%m/%Y') <= STR_TO_DATE('${fecha_final}', '%Y/%m/%d')`;
    }

    const [rows] = await db.query(query);

    let conteos = rows.reduce((acc, row) => {
      acc[row.ACTIVIDAD] = (acc[row.ACTIVIDAD] || 0) + 1;
      return acc;
    }, {});

    let numeroalumnos = rows.length;

    res.json({
      nominf: "Base de datos formaciones",
      numeroalumnos: numeroalumnos,
      numeroalumnos1: conteos["Bicidestrezas"] ?? 0,
      numeroalumnos2: conteos["Puntos ciclistas"] ?? 0,
      numeroalumnos3: conteos["Formación integral"] ?? 0,
      numeroalumnos4: conteos["Formación empresas"] ?? 0,
      numeroalumnos5: conteos["Puntos conductores"] ?? 0,
      rows: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al consultar la base de datos" });
  }
});

// retos
app.post("/api/reto", async (req, res) => {
  let fecha_inicio = req.body?.fecha_inicio;
  let fecha_final = req.body?.fecha_final;

  try {
    let query = `
      SELECT *
      FROM V_EXCEL
    `;

    if (fecha_inicio && fecha_final) {
      query += ` WHERE STR_TO_DATE(FECHA, '%d/%m/%Y') BETWEEN STR_TO_DATE('${fecha_inicio}', '%Y/%m/%d') AND STR_TO_DATE('${fecha_final}', '%Y/%m/%d')`;
    }
    if (fecha_inicio && !fecha_final) {
      query += ` WHERE STR_TO_DATE(FECHA, '%d/%m/%Y') >= STR_TO_DATE('${fecha_inicio}', '%Y/%m/%d')`;
    }
    if (!fecha_inicio && fecha_final) {
      query += ` WHERE STR_TO_DATE(FECHA, '%d/%m/%Y') <= STR_TO_DATE('${fecha_final}', '%Y/%m/%d')`;
    }

    const [rows] = await db.query(query);
    res.json({
      nominf: "Base de datos reto",
      rows: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al consultar la base de datos" });
  }
});

// Consentimientos informados
app.post("/api/consentimientos", async (req, res) => {
  let fecha_inicio = req.body.fecha_inicio;
  let fecha_final = req.body.fecha_final;

  try {
    let query = `
      SELECT
      alumno.alucod as Codigo_Alumno,
      alumno.alunom as Nombre_Alumno,
      alumno.aluced as Cedula_Alumno,
      eventoc.evcfechor as Fecha_Evento,
      actividad.actnom as Nombre_Actividad,
      ciudades.ciudad as Ciudad,
      departamentos.departamento as Departamento,
      regiones.region as Region,
      consentimientos.pdfnom as Consentimiento_PDF
      FROM consentimientos
      JOIN actividad ON consentimientos.actividad = actividad.actcod
      JOIN alumno ON consentimientos.aluced = alumno.aluced
      JOIN alumno_evento ON alumno_evento.alealucod = alumno.alucod
      JOIN eventoc ON alumno_evento.aleevccod = eventoc.evccod
      JOIN ciudades ON eventoc.evcciucod = ciudades.cod_ciudad
      JOIN departamentos ON ciudades.cod_departamento = departamentos.cod_departamento
      JOIN regiones ON departamentos.cod_region = regiones.cod_region
    `;

    if (fecha_inicio && fecha_final) {
      query += ` WHERE eventoc.evcfechor BETWEEN '${fecha_inicio}' AND '${fecha_final}'`;
    }
    if (fecha_inicio && !fecha_final) {
      query += ` WHERE eventoc.evcfechor >= '${fecha_inicio}'`;
    }
    if (!fecha_inicio && fecha_final) {
      query += ` WHERE eventoc.evcfechor <= '${fecha_final}'`;
    }

    const [rows] = await db.query(query);
    res.json({
      niminf: "Consentimientos informados",
      rows: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al consultar la base de datos" });
  }
});

// Informes generales
app.post("/api/informes", async (req, res) => {
  try {
    let query = `
      SELECT
      regiones.region,
      departamentos.departamento,
      ciudades.ciudad,
      ciudades.cod_divipola,
      actividad.actnom,
      COUNT(*) as actividad_count
      FROM regiones
      JOIN departamentos ON regiones.cod_region = departamentos.cod_region
      JOIN ciudades ON departamentos.cod_departamento = ciudades.cod_departamento
      JOIN eventoc ON ciudades.cod_ciudad = eventoc.evcciucod 
      JOIN eventoact ON eventoc.evccod = eventoact.evcactevccod
      JOIN actividad ON eventoact.evcactactcod = actividad.actcod
      WHERE actividad.actcod != 9
      GROUP BY regiones.region, departamentos.departamento, ciudades.ciudad, ciudades.cod_divipola, actividad.actnom
    `;

    const [rows] = await db.query(query);

    const eventsCount = rows.reduce((acc, row) => {
      const region = acc.find((r) => r.region === row.region) || {
        region: row.region,
        departamentos: [],
      };

      if (!acc.includes(region)) acc.push(region);

      const departamento = region.departamentos.find(
        (d) => d.departamento === row.departamento
      ) || {
        departamento: row.departamento,
        ciudades: [],
      };

      if (!region.departamentos.includes(departamento))
        region.departamentos.push(departamento);

      const ciudad = departamento.ciudades.find(
        (c) => c.ciudad === row.ciudad
      ) || {
        ciudad: row.ciudad,
        cod_divipola: row.cod_divipola,
        actividades: {},
      };

      if (!departamento.ciudades.includes(ciudad))
        departamento.ciudades.push(ciudad);

      ciudad.actividades[row.actnom] =
        (ciudad.actividades[row.actnom] || 0) + row.actividad_count;

      return acc;
    }, []);

    res.json({
      niminf: "Informes generales",
      rows: eventsCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al consultar la base de datos" });
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
