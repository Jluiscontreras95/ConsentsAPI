const express = require("express");
const db = require("./db");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get("/api/consentimientos", async (req, res) => {
  try {
    const query = `
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
    const [rows] = await db.query(query);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al consultar la base de datos" });
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
