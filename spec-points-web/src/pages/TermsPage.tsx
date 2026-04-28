import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </button>

        <div className="bg-card rounded-2xl shadow-xl border border-border p-8 md:p-12">
          <div className="text-center mb-12 border-b border-border pb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              TÉRMINOS DE USO, POLÍTICA DE PRIVACIDAD
              <br />
              Y REGLAMENTO DE CANJE DE PREMIOS
            </h1>
            <p className="text-xl text-muted-foreground mb-6">
              Programa de beneficios para arquitectos - 2026/2027
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left bg-secondary/30 p-6 rounded-xl text-sm">
              <div><strong>Documento:</strong> Términos de Uso y Reglamento de Premios</div>
              <div><strong>Versión:</strong> 1.0</div>
              <div><strong>Fecha de vigencia:</strong> [DD/MM/AAAA]</div>
              <div><strong>Última actualización:</strong> Abril de 2026</div>
              <div><strong>Responsable:</strong> [Nombre del responsable legal]</div>
              <div><strong>Contacto:</strong> [correo@plataforma.com]</div>
              <div className="md:col-span-2"><strong>RUC:</strong> [XX.XXX.XXX-X]</div>
            </div>
          </div>

          <div className="space-y-8 text-muted-foreground leading-relaxed">
            <div className="bg-primary/10 border-l-4 border-primary p-4 rounded-r-lg text-foreground font-medium">
              LEA ATENTAMENTE ANTES DE USAR LA PLATAFORMA
              <br />
              Al registrarse o utilizar esta plataforma, el usuario declara que ha leído, comprendido y aceptado estos Términos de Uso, la Política de Privacidad y el Reglamento de Canje de Premios. Si no está de acuerdo con alguna disposición, no utilice la plataforma.
            </div>

            <section id="secao-1">
              <h2 className="text-2xl font-bold text-foreground mb-4">1. IDENTIFICACIÓN DE LAS PARTES</h2>
              <p><strong>1.1. PLATAFORMA / RESPONSABLE DEL TRATAMIENTO:</strong></p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>Razón social: [Razón social de la empresa]</li>
                <li>Nombre comercial: [Nombre de la plataforma]</li>
                <li>RUC: [XX.XXX.XXX-X]</li>
                <li>Dirección: [Dirección completa, ciudad, departamento, código postal]</li>
                <li>Correo de contacto: [contacto@plataforma.com]</li>
                <li>Correo para privacidad: [privacidad@plataforma.com]</li>
                <li>Teléfono: [+595 XXX XXX XXX]</li>
                <li>Responsable legal: [Nombre del representante legal]</li>
              </ul>
              <p><strong>1.2. USUARIO:</strong> Persona física, arquitecto(a) o profesional del área de arquitectura e interiorismo debidamente registrado(a) en esta plataforma, que acepta estos términos y participa del programa.</p>
            </section>

            <section id="secao-2">
              <h2 className="text-2xl font-bold text-foreground mb-4">2. DEFINICIONES</h2>
              <p>2.1. Para este documento se aplican las siguientes definiciones:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Plataforma:</strong> Sistema digital mediante el cual los participantes registran actividades, acumulan puntos y solicitan premios.</li>
                <li><strong>Usuario:</strong> Arquitecto(a) o profesional participante con cuenta activa.</li>
                <li><strong>Puntos:</strong> Unidad virtual de recompensa sin valor monetario.</li>
                <li><strong>Premio:</strong> Beneficio ofrecido en el catálogo vigente.</li>
                <li><strong>Canje:</strong> Solicitud formal del usuario para utilizar sus puntos en un premio.</li>
                <li><strong>Catálogo:</strong> Listado de premios, stock y condiciones vigentes.</li>
                <li><strong>Comprobante:</strong> Documento o registro que valida una operación dentro del sistema.</li>
              </ul>
            </section>

            <section id="secao-3">
              <h2 className="text-2xl font-bold text-foreground mb-4">3. REGISTRO Y ELEGIBILIDAD</h2>
              <p><strong>3.1. Requisitos de registro</strong><br />Pueden registrarse en la plataforma las personas que cumplan con los requisitos definidos por el programa comercial.</p>
              <ul className="list-disc pl-6 space-y-1 my-2">
                <li>Tener al menos 18 años.</li>
                <li>Disponer de documento de identidad y RUC validos, cuando corresponda.</li>
                <li>Informar un correo electrónico válido y de uso propio.</li>
                <li>Aceptar estos Términos de Uso.</li>
              </ul>

              <p className="mt-4"><strong>3.2. Responsabilidad por la información</strong><br />
              3.2.1. El usuario es responsable por la veracidad y actualización de los datos informados.<br />
              3.2.2. La plataforma podrá suspender o cancelar cuentas con datos falsos, incompletos o inconsistentes.<br />
              3.2.3. Cada usuario podrá tener solo una cuenta activa, salvo autorización expresa.</p>
            </section>

            <section id="secao-4">
              <h2 className="text-2xl font-bold text-foreground mb-4">4. SISTEMA DE PUNTOS</h2>
              <p><strong>4.1. Generación de puntos</strong><br />Los puntos se generan de acuerdo con las reglas comerciales vigentes, tales como ventas aprobadas, campañas activas y acciones definidas por el programa.</p>

              <p className="mt-4"><strong>4.2. Vigencia de los puntos</strong><br />
              4.2.1. Los puntos podrán tener vigencia limitada de acuerdo con la política del programa.<br />
              4.2.2. La plataforma podrá informar cambios de vigencia o condiciones por medio de notificaciones internas.</p>

              <p className="mt-4"><strong>4.3. Naturaleza de los puntos</strong><br />
              4.3.1. Los puntos no representan moneda ni crédito financiero.<br />
              4.3.2. Los puntos son personales e intransferibles.<br />
              4.3.3. La plataforma puede actualizar las reglas del programa previo aviso.</p>

              <p className="mt-4"><strong>4.4. Ajustes y anulaciones</strong><br />
              4.4.1. Los puntos generados por error, fraude o incumplimiento podrán ser anulados.<br />
              4.4.2. En caso de devolución, rechazo o cancelación de una operación, los puntos relacionados podrán revertirse.</p>
            </section>

            <section id="resgate" className="scroll-mt-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">5. CATALOGO Y CANJE DE PREMIOS</h2>
              <p><strong>5.1. Premios disponibles</strong><br />La plataforma puede ofrecer productos, experiencias, beneficios comerciales, viajes y otros premios descriptos en el catálogo vigente.</p>

              <p className="mt-4"><strong>5.2. Proceso de canje</strong><br />
              5.2.1. El canje debe realizarse dentro de la plataforma, completando los datos requeridos.<br />
              5.2.2. Toda solicitud podrá quedar sujeta a revisión administrativa, según las reglas del programa.<br />
              5.2.3. La confirmación del canje y la información de entrega podrán enviarse por correo o notificarse dentro del sistema.</p>

              <p className="mt-4"><strong>5.3. Disponibilidad y stock</strong><br />
              5.3.1. Todos los premios están sujetos a disponibilidad, stock y vigencia del catálogo.</p>
            </section>

            <section id="secao-6">
              <h2 className="text-2xl font-bold text-foreground mb-4">6. REGLAS ESPECÍFICAS PARA PREMIOS DE VIAJE</h2>
              <div className="bg-secondary/30 p-4 rounded-lg mb-4 text-sm">
                <strong>Operación externa:</strong> Cuando existan premios de viaje, su ejecución podrá realizarse a través de socios comerciales definidos por la plataforma.
              </div>
              <p><strong>6.1. Solicitud y plazos</strong><br />La solicitud deberá realizarse con la anticipación mínima informada en la oferta del premio y estará sujeta a disponibilidad.</p>

              <p className="mt-4"><strong>6.2. Períodos permitidos</strong><br />Los viajes podrán tener restricciones por temporada, feriados, eventos especiales o capacidad del proveedor.</p>

              <p className="mt-4"><strong>6.3. Alcance del premio</strong><br />Cada premio indicara con claridad lo que incluye y lo que no incluye, como pasajes, hospedaje, traslados, tasas o seguros.</p>

              <p className="mt-4"><strong>6.4. Documentación y responsabilidades</strong><br />El usuario es responsable de contar con documentación, requisitos migratorios, vacunas y permisos necesarios. La plataforma no responde por impedimentos derivados de documentación insuficiente.</p>

              <p className="mt-4"><strong>6.5. Cambios, cancelaciones y no show</strong><br />Se aplicarán las condiciones del proveedor responsable. La cancelación fuera de plazo o la no presentación podrán implicar la pérdida del beneficio.</p>
            </section>

            <section id="secao-7">
              <h2 className="text-2xl font-bold text-foreground mb-4">7. PRIVACIDAD Y PROTECCIÓN DE DATOS</h2>
              <p>La plataforma podrá recopilar y tratar datos personales para operar el servicio, gestionar el programa, prevenir fraudes, cumplir obligaciones legales y mejorar la experiencia del usuario, siempre conforme a la normativa aplicable.</p>
            </section>

            <section id="secao-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">8. CONDUCTA DEL USUARIO Y PROHIBICIONES</h2>
              <p>Se prohíbe proporcionar información falsa, usar mecanismos automatizados no autorizados, intentar vulnerar la plataforma, vender puntos o crear múltiples cuentas para obtener ventajas indebidas. Estas prácticas podrán resultar en suspensión o cancelación de la cuenta.</p>
            </section>

            <section id="secao-9">
              <h2 className="text-2xl font-bold text-foreground mb-4">9. LIMITACIÓN DE RESPONSABILIDAD</h2>
              <p>9.1. La plataforma actúa como intermediaria del programa y no será responsable por:<br />
              - fallas operativas de terceros proveedores;<br />
              - daños ocasionados por fuerza mayor o caso fortuito;<br />
              - uso indebido de la cuenta por parte del propio usuario;<br />
              - decisiones tomadas con base en información desactualizada del catálogo.</p>
              <p>9.2. Cuando corresponda, la responsabilidad máxima de la plataforma frente al usuario se limitará a la restitución de los puntos involucrados en la operación.</p>
            </section>

            <section id="secao-10">
              <h2 className="text-2xl font-bold text-foreground mb-4">10. DISPOSICIONES GENERALES</h2>
              <p>Estos términos constituyen el acuerdo integral entre la plataforma y el usuario. Si alguna cláusula fuera considerada inválida, las restantes permanecerán vigentes. La ley aplicable y la jurisdicción competente se definirá de acuerdo con la entidad responsable del programa y la normativa vigente.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
