-- SpecPoints Migration 0008
-- Normalize active terms content to Spanish
-- Created: 2026-04-27

DO $body$
BEGIN
  IF EXISTS (SELECT 1 FROM terms WHERE active = true) THEN
    UPDATE terms
    SET
      content = $terms$
TÉRMINOS DE USO, POLÍTICA DE PRIVACIDAD Y REGLAMENTO DE CANJE DE PREMIOS

1. IDENTIFICACIÓN DE LAS PARTES
La plataforma y el usuario aceptan que este documento regula el uso del sistema, el programa de puntos y la solicitud de premios.

2. DEFINICIONES
Plataforma: sistema digital del programa.
Usuario: arquitecto(a) o profesional registrado(a).
Puntos: unidad virtual sin valor monetario.
Premio: beneficio disponible en el catálogo.
Canje: solicitud formal del usuario para utilizar puntos.

3. REGISTRO Y ELEGIBILIDAD
El usuario debe proporcionar información real, actualizada y suficiente para operar dentro del programa.

4. SISTEMA DE PUNTOS
Los puntos se generan según las reglas comerciales vigentes y pueden ajustarse o revertirse en caso de error, cancelación o fraude.

5. CATALOGO Y CANJE DE PREMIOS
Todo premio está sujeto a disponibilidad, stock y aprobación cuando el flujo del programa así lo requiera.

6. REGLAS ESPECIFICAS
Los premios especiales, incluidos viajes o experiencias, pueden tener condiciones adicionales informadas en la oferta vigente.

7. PRIVACIDAD Y PROTECCION DE DATOS
La plataforma podrá tratar datos personales para operar el servicio, cumplir obligaciones legales, prevenir fraudes y mejorar la experiencia del usuario.

8. CONDUCTA DEL USUARIO
Se prohíbe el uso fraudulento del sistema, el suministro de información falsa y cualquier intento de vulnerar la plataforma.

9. LIMITACION DE RESPONSABILIDAD
La responsabilidad de la plataforma se limitará, cuando corresponda, a la restitución de puntos relacionados con la operación afectada.

10. DISPOSICIONES GENERALES
El uso continuado de la plataforma implica la aceptación de estas condiciones y de sus futuras actualizaciones.
$terms$,
      version = '1.0-es',
      created_at = created_at
    WHERE active = true;
  ELSE
    INSERT INTO terms (content, version, active)
    VALUES (
$terms$
TÉRMINOS DE USO, POLÍTICA DE PRIVACIDAD Y REGLAMENTO DE CANJE DE PREMIOS

1. IDENTIFICACIÓN DE LAS PARTES
La plataforma y el usuario aceptan que este documento regula el uso del sistema, el programa de puntos y la solicitud de premios.

2. DEFINICIONES
Plataforma: sistema digital del programa.
Usuario: arquitecto(a) o profesional registrado(a).
Puntos: unidad virtual sin valor monetario.
Premio: beneficio disponible en el catálogo.
Canje: solicitud formal del usuario para utilizar puntos.

3. REGISTRO Y ELEGIBILIDAD
El usuario debe proporcionar información real, actualizada y suficiente para operar dentro del programa.

4. SISTEMA DE PUNTOS
Los puntos se generan según las reglas comerciales vigentes y pueden ajustarse o revertirse en caso de error, cancelación o fraude.

5. CATALOGO Y CANJE DE PREMIOS
Todo premio está sujeto a disponibilidad, stock y aprobación cuando el flujo del programa así lo requiera.

6. REGLAS ESPECIFICAS
Los premios especiales, incluidos viajes o experiencias, pueden tener condiciones adicionales informadas en la oferta vigente.

7. PRIVACIDAD Y PROTECCION DE DATOS
La plataforma podrá tratar datos personales para operar el servicio, cumplir obligaciones legales, prevenir fraudes y mejorar la experiencia del usuario.

8. CONDUCTA DEL USUARIO
Se prohíbe el uso fraudulento del sistema, el suministro de información falsa y cualquier intento de vulnerar la plataforma.

9. LIMITACION DE RESPONSABILIDAD
La responsabilidad de la plataforma se limitará, cuando corresponda, a la restitución de puntos relacionados con la operación afectada.

10. DISPOSICIONES GENERALES
El uso continuado de la plataforma implica la aceptación de estas condiciones y de sus futuras actualizaciones.
$terms$,
      '1.0-es',
      true
    );
  END IF;
END $body$;
