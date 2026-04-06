import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Layers3,
  ShieldCheck,
  Sparkle,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const modules = [
  {
    title: "Marcacion y turnos",
    description:
      "Controla entradas, salidas, turnos rotativos y novedades desde una sola vista operativa.",
    icon: Clock3,
  },
  {
    title: "Motor legal colombiano",
    description:
      "Liquida recargos, horas extra y alertas de topes con reglas vigentes para julio de 2026.",
    icon: ShieldCheck,
  },
  {
    title: "Visibilidad para nomina",
    description:
      "Entrega cierres diarios, semanales y exportables para RR. HH., operaciones y auditoria.",
    icon: BarChart3,
  },
];

const valuePoints = [
  "42 horas semanales con distribucion configurable en 5 o 6 dias.",
  "Proteccion reforzada para menores de 15 a 17 anos.",
  "Deteccion automatica de trabajo nocturno y turnos que cruzan medianoche.",
  "Alertas cuando se exceden topes diarios o semanales de horas extra.",
];

const workflow = [
  {
    step: "01",
    title: "Configura la jornada",
    text: "Define reglas por empresa, sede o cargo: dias laborables, jornada pactada y divisor horario.",
  },
  {
    step: "02",
    title: "Registra el turno",
    text: "Tempo procesa entrada, salida, festivos, dominicales y acumulado semanal en tiempo real.",
  },
  {
    step: "03",
    title: "Liquida y alerta",
    text: "El sistema devuelve valor del dia, desglose detallado y alertas legales listas para auditoria.",
  },
];

const stats = [
  { label: "tiempos de cierre", value: "40%" },
  { label: "visibilidad operativa", value: "24/7" },
  { label: "reglas auditables", value: "100%" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f3eee4] text-[#14211c]">
      <section className="border-b border-[#14211c]/10 bg-[radial-gradient(circle_at_top_left,_rgba(189,220,194,0.55),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(236,216,178,0.8),_transparent_24%),linear-gradient(180deg,_#f7f1e5_0%,_#edf1e9_52%,_#f3eee4_100%)]">
        <div className="mx-auto max-w-7xl px-6 py-6 lg:px-10">
          <div className="flex items-center justify-between rounded-full border border-[#14211c]/10 bg-white/70 px-5 py-3 backdrop-blur">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#14211c] text-[#f7f1e5]">
                <Clock3 className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-2xl leading-none">Tempo</p>
                <p className="text-xs uppercase tracking-[0.22em] text-[#14211c]/55">
                  control de tiempos
                </p>
              </div>
            </Link>

            <div className="hidden items-center gap-8 text-sm lg:flex">
              <a href="#modulos" className="text-[#14211c]/70 transition hover:text-[#14211c]">
                Modulos
              </a>
              <a href="#motor" className="text-[#14211c]/70 transition hover:text-[#14211c]">
                Motor legal
              </a>
              <a href="#api" className="text-[#14211c]/70 transition hover:text-[#14211c]">
                API
              </a>
              <a href="#contacto" className="text-[#14211c]/70 transition hover:text-[#14211c]">
                Demo
              </a>
            </div>

            <div className="flex items-center gap-3">
              <Button
                asChild
                variant="outline"
                className="hidden rounded-full border-[#14211c]/15 bg-white/80 text-[#14211c] sm:flex"
              >
                <Link href="/login">Ingresar</Link>
              </Button>
              <Button
                asChild
                className="rounded-full bg-[#14211c] px-5 text-[#f7f1e5] hover:bg-[#14211c]/90"
              >
                <a href="#contacto">Solicitar demo</a>
              </Button>
            </div>
          </div>

          <div className="grid gap-14 py-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-24">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#14211c]/10 bg-white/65 px-4 py-2 text-sm text-[#14211c]/75">
                <Sparkle className="h-4 w-4" />
                Actualizado con reglas laborales vigentes al 15 de julio de 2026
              </div>

              <h1 className="mt-7 max-w-4xl font-display text-5xl leading-[0.94] tracking-tight sm:text-6xl lg:text-7xl">
                Tempo convierte cada marcacion en una liquidacion clara, auditable y lista para nomina.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#14211c]/70">
                Software para empresas colombianas que necesitan controlar jornadas, horas extra,
                recargos nocturnos, dominicales y festivos sin depender de hojas de calculo ni
                reglas manuales.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full bg-[#14211c] px-7 text-[#f7f1e5] hover:bg-[#14211c]/90"
                >
                  <a href="#contacto">
                    Agendar presentacion
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full border-[#14211c]/15 bg-white/80 text-[#14211c]"
                >
                  <a href="#api">Ver arquitectura del producto</a>
                </Button>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-3xl border border-[#14211c]/10 bg-white/70 p-5 shadow-[0_20px_60px_rgba(20,33,28,0.05)]"
                  >
                    <p className="text-3xl font-semibold">{stat.value}</p>
                    <p className="mt-2 text-sm text-[#14211c]/65">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-x-8 top-10 h-40 rounded-full bg-[#7b9d7d]/20 blur-3xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-[#14211c]/10 bg-[#13221d] p-6 text-[#f5efe4] shadow-[0_30px_120px_rgba(20,33,28,0.16)]">
                <div className="flex items-center justify-between border-b border-white/10 pb-5">
                  <div>
                    <p className="text-sm uppercase tracking-[0.22em] text-white/50">
                      Resumen de turno
                    </p>
                    <p className="mt-1 text-2xl font-semibold">Tempo Compliance Engine</p>
                  </div>
                  <div className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/75">
                    RR. HH. / Operaciones
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-white/6 p-5">
                    <p className="text-sm text-white/55">Jornada pactada</p>
                    <p className="mt-2 text-3xl font-semibold">42 h</p>
                    <p className="mt-1 text-sm text-white/65">5 o 6 dias por semana</p>
                  </div>
                  <div className="rounded-3xl bg-white/6 p-5">
                    <p className="text-sm text-white/55">Horario nocturno</p>
                    <p className="mt-2 text-3xl font-semibold">19:00 - 06:00</p>
                    <p className="mt-1 text-sm text-white/65">vigente desde 25 dic 2025</p>
                  </div>
                </div>

                <div className="mt-5 rounded-[1.75rem] bg-[#f5efe4] p-5 text-[#14211c]">
                  <div className="flex items-center justify-between border-b border-[#14211c]/10 pb-4">
                    <div>
                      <p className="text-sm text-[#14211c]/55">Turno procesado</p>
                      <p className="text-lg font-semibold">18:00 - 23:30 | festivo</p>
                    </div>
                    <div className="rounded-full bg-[#cfe0cf] px-3 py-1 text-xs font-medium">
                      alerta legal: si
                    </div>
                  </div>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[#14211c]/65">dominical/festivo nocturno</span>
                      <span className="font-medium">3.0 h</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#14211c]/65">extra nocturna festiva</span>
                      <span className="font-medium">2.5 h</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-[#14211c]/10 pt-3">
                      <span className="font-medium">valor total del dia</span>
                      <span className="text-lg font-semibold">$ 255.480</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-start gap-3 rounded-3xl bg-[#264638] px-4 py-4 text-sm text-[#e7eadf]">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  Cada minuto se clasifica con reglas trazables, sin depender de una logica generica ni de una interfaz orientada a IA.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="modulos" className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-[#14211c]/45">
              Plataforma comercial
            </p>
            <h2 className="mt-4 max-w-3xl font-display text-4xl leading-tight">
              Tempo se presenta como software de operacion laboral, no como asistente de IA.
            </h2>
          </div>
          <p className="max-w-xl text-[#14211c]/70">
            La pagina principal ahora prioriza propuesta de valor, cumplimiento, trazabilidad y
            madurez operativa para vender el producto a empresas colombianas.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {modules.map((module) => (
            <article
              key={module.title}
              className="rounded-[2rem] border border-[#14211c]/10 bg-white p-7 shadow-[0_24px_80px_rgba(20,33,28,0.06)]"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#dce9dc] text-[#14211c]">
                <module.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-2xl font-semibold">{module.title}</h3>
              <p className="mt-3 leading-7 text-[#14211c]/68">{module.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        id="motor"
        className="border-y border-[#14211c]/10 bg-[linear-gradient(180deg,_#11211b_0%,_#18332b_100%)] text-[#f4efe4]"
      >
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[0.95fr_1.05fr] lg:px-10">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-white/45">
              Motor legal colombiano
            </p>
            <h2 className="mt-4 font-display text-4xl leading-tight">
              Reglas parametrizadas para una fecha normativa concreta.
            </h2>
            <p className="mt-5 max-w-xl leading-8 text-white/68">
              Tempo no solo guarda marcaciones. Tambien interpreta la norma vigente, detecta
              topes, separa horas ordinarias, recargos y extras, y devuelve un JSON listo para
              integrarse con nomina o auditoria.
            </p>
          </div>

          <div className="grid gap-4">
            {valuePoints.map((point) => (
              <div
                key={point}
                className="flex items-start gap-4 rounded-[1.75rem] border border-white/10 bg-white/6 px-5 py-5"
              >
                <div className="mt-1 rounded-full bg-[#c6d9c7]/20 p-2 text-[#d7ead7]">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <p className="leading-7 text-white/78">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-3">
          {workflow.map((item) => (
            <article
              key={item.step}
              className="rounded-[2rem] border border-[#14211c]/10 bg-white px-6 py-7"
            >
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#14211c]/40">
                {item.step}
              </p>
              <h3 className="mt-4 text-2xl font-semibold">{item.title}</h3>
              <p className="mt-3 leading-7 text-[#14211c]/68">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="api" className="mx-auto max-w-7xl px-6 pb-20 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-[2rem] border border-[#14211c]/10 bg-white p-8">
            <p className="text-sm uppercase tracking-[0.24em] text-[#14211c]/45">
              Arquitectura del producto
            </p>
            <h2 className="mt-4 font-display text-4xl leading-tight">
              Backend FastAPI para integraciones reales.
            </h2>
            <p className="mt-5 leading-8 text-[#14211c]/68">
              El proyecto ahora incluye una API en Python con Pydantic para validar entradas,
              procesar turnos que cruzan medianoche y devolver respuestas listas para consumo por
              otros sistemas.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] bg-[#eef2eb] p-5">
                <div className="flex items-center gap-3">
                  <Layers3 className="h-5 w-5" />
                  <p className="font-medium">FastAPI + Pydantic</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-[#14211c]/68">
                  Validacion tipada y documentacion automatica en OpenAPI.
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-[#eef2eb] p-5">
                <div className="flex items-center gap-3">
                  <CalendarClock className="h-5 w-5" />
                  <p className="font-medium">Calculo por minuto</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-[#14211c]/68">
                  Clasificacion de jornada ordinaria, recargos y extras con corte legal exacto.
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-[#14211c]/10 bg-[#14211c] p-1 shadow-[0_28px_100px_rgba(20,33,28,0.18)]">
            <div className="rounded-[1.7rem] bg-[#101c18] p-6 text-[#eef1e8]">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-white/35">
                <span className="h-2.5 w-2.5 rounded-full bg-[#dd8f6f]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#e6c46c]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#88b69a]" />
                post /api/v1/jornada/calcular
              </div>
              <pre className="mt-5 overflow-x-auto text-sm leading-7 text-[#eef1e8]/88">
{`{
  "valor_total_dia": 255480.0,
  "alerta_limite_legal": true,
  "desglose_horas": {
    "dominical_festivo_nocturno": {
      "horas": 3.0,
      "factor_total": 2.25
    },
    "extra_nocturna_dominical_festivo": {
      "horas": 2.5,
      "factor_total": 2.65
    }
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      <section id="contacto" className="border-t border-[#14211c]/10 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-16 lg:grid-cols-[1fr_auto] lg:items-center lg:px-10">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-[#14211c]/45">
              Listo para comercializar
            </p>
            <h2 className="mt-4 font-display text-4xl leading-tight">
              Tempo ya se comunica como un software de control de tiempos para empresas.
            </h2>
            <p className="mt-4 max-w-3xl leading-8 text-[#14211c]/68">
              Marca coherente, home comercial, backend en FastAPI y narrativa centrada en
              cumplimiento, operacion y nomina colombiana.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-[#14211c] px-6 text-[#f7f1e5] hover:bg-[#14211c]/90"
            >
              <Link href="/login">Entrar al demo</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-[#14211c]/15"
            >
              <a href="mailto:ventas@tempo.app">ventas@tempo.app</a>
            </Button>
          </div>
        </div>

        <div className="border-t border-[#14211c]/10">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6 text-sm text-[#14211c]/55 lg:flex-row lg:items-center lg:justify-between lg:px-10">
            <div className="flex items-center gap-2">
              <BriefcaseBusiness className="h-4 w-4" />
              Tempo
              <span className="text-[#14211c]/35">| software de control de tiempos y nomina</span>
            </div>
            <div className="flex flex-wrap gap-5">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Colombia
              </span>
              <span className="inline-flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                RR. HH. y operaciones
              </span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
