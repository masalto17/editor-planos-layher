import {
  ArrowRight,
  Box,
  ClipboardList,
  FileDown,
  Grid3X3,
  Layers3,
  MousePointer2,
  Ruler,
  ShieldAlert,
  Workflow,
} from 'lucide-react';

const features = [
  {
    icon: Grid3X3,
    title: 'Planificación con precisión',
    text: 'Modela estructuras por módulos estándar, con vistas 2D y referencias de medidas para validar el planteo preliminar.',
  },
  {
    icon: Layers3,
    title: 'Iteración técnica rápida',
    text: 'Alterna alzado y planta, ajusta filas, alturas y repetición de componentes sin perder el historial del diseño.',
  },
  {
    icon: ClipboardList,
    title: 'Despiece en vivo',
    text: 'Cada pieza colocada actualiza cantidades, pesos estimados y lectura comercial para cotización y preproducción.',
  },
];

const workflow = [
  ['01', 'Idea', 'Medidas, requerimientos y condición general del proyecto.'],
  ['02', 'Armado preliminar', 'Estructura por modulos, niveles, filas y accesos.'],
  ['03', 'Revisión', 'Chequeo visual de dimensiones, alturas y repeticiones.'],
  ['04', 'Despiece', 'Cantidades y pesos estimados para preparar cotizacion.'],
  ['05', 'Exportación', 'Salida preliminar para compartir y continuar el análisis.'],
];

const materials = [
  ['Vertical', '128'],
  ['Horizontal', '264'],
  ['Diagonal', '96'],
  ['Baranda', '72'],
  ['Rodapie', '72'],
  ['Plataforma 2.57 m', '84'],
  ['Husillo', '128'],
];

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span />
    </span>
  );
}

function ProductPreview() {
  return (
      <div className="product-preview" aria-label="Vista preliminar del editor MásAlto Layout">
      <div className="preview-topbar">
        <div className="window-controls" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="preview-url">layout.masalto.com/editor</div>
        <div className="preview-actions">
          <span>Guardar</span>
          <span>Exportar</span>
          <strong>Compartir</strong>
        </div>
      </div>

      <div className="preview-grid">
        <aside className="module-rail">
          <p>Módulos</p>
          {['Vertical', 'Horizontal', 'Diagonal', 'Baranda', 'Rodapie', 'Husillo'].map((item) => (
            <div className="module-item" key={item}>
              <i />
              <span>{item}</span>
            </div>
          ))}
        </aside>

        <main className="drawing-area">
          <div className="drawing-heading">
            <span>Alzado frontal</span>
            <small>32.00 m x 14.00 m</small>
          </div>
            <svg viewBox="0 0 640 260" role="img" aria-label="Plano esquemático de una estructura modular">
            <defs>
              <pattern id="landing-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="640" height="260" fill="url(#landing-grid)" />
            <g stroke="rgba(255,255,255,.82)" strokeWidth="2" fill="none">
              {Array.from({ length: 14 }).map((_, index) => (
                <path key={`v-${index}`} d={`M${72 + index * 36} 42V208`} />
              ))}
              {Array.from({ length: 5 }).map((_, index) => (
                <path key={`h-${index}`} d={`M72 ${56 + index * 36}H540`} />
              ))}
              {Array.from({ length: 11 }).map((_, index) => (
                <path key={`d-${index}`} d={`M${72 + index * 36} 208L${108 + index * 36} 56`} opacity=".72" />
              ))}
            </g>
            <g stroke="#e30613" strokeWidth="2.5" fill="none" opacity=".92">
              <path d="M108 72H504" />
              <path d="M108 108H504" />
              <path d="M108 144H504" />
              <path d="M108 180H504" />
            </g>
            <rect x="214" y="86" width="182" height="76" fill="rgba(0,0,0,.82)" stroke="rgba(255,255,255,.8)" />
            <g stroke="rgba(255,255,255,.65)" strokeWidth="1.6">
              <path d="M56 42V208M48 42H64M48 208H64" />
              <path d="M72 224H540M72 216V232M540 216V232" />
            </g>
            <g fill="rgba(255,255,255,.74)" fontFamily="IBM Plex Mono, ui-monospace, monospace" fontSize="14">
              <text x="12" y="132">14.00 m</text>
              <text x="286" y="248">32.00 m</text>
            </g>
          </svg>
          <div className="preview-toolbar" aria-hidden="true">
            {[MousePointer2, Ruler, Workflow, Box].map((Icon, index) => <Icon key={index} size={16} />)}
          </div>
        </main>

        <aside className="breakdown-panel">
          <p>Despiece de materiales</p>
          {materials.map(([name, value]) => (
            <div className="material-row" key={name}>
              <span>{name}</span>
              <strong>{value}</strong>
            </div>
          ))}
          <div className="weight-row">
            <span>Peso estimado</span>
            <strong>8.240 kg</strong>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function MasAltoLayoutLanding() {
  const openEditor = () => {
    window.location.href = '/editor';
  };

  return (
    <main className="layout-landing">
      <header className="landing-nav">
        <a className="nav-brand" href="/" aria-label="MásAlto Layout inicio">
          <BrandMark />
          <span><strong>MásAlto</strong> Layout</span>
        </a>
        <nav aria-label="Navegacion principal">
          <a href="#producto">Producto</a>
          <a href="#flujo">Flujo</a>
          <a href="#alcance">Alcance</a>
        </nav>
        <button className="nav-cta" type="button" onClick={openEditor}>
          Abrir editor <ArrowRight size={17} />
        </button>
      </header>

      <section className="hero-section">
        <div className="hero-copy">
          <h1><span>MásAlto</span> Layout</h1>
          <p className="hero-subtitle">Previsualizador de estructuras</p>
          <p className="hero-lead">
            Del armado preliminar al despiece en vivo para equipos que necesitan planificar,
            iterar y comunicar estructuras temporales con criterio técnico.
          </p>
          <div className="hero-actions">
            <button type="button" className="primary-action" onClick={openEditor}>
              Abrir editor <ArrowRight size={20} />
            </button>
            <a className="secondary-action" href="#alcance">
              Ver alcance técnico <ArrowRight size={18} />
            </a>
          </div>
        </div>
        <ProductPreview />
      </section>

      <section className="feature-band" id="producto">
        {features.map(({ icon: Icon, title, text }) => (
          <article className="feature-item" key={title}>
            <Icon size={34} strokeWidth={1.7} />
            <div>
              <h2>{title}</h2>
              <p>{text}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="workflow-section" id="flujo">
        <div className="section-heading">
          <h2>Flujo de trabajo</h2>
          <p>Una lectura ordenada desde el primer planteo hasta la preparación comercial.</p>
        </div>
        <div className="workflow-strip">
          {workflow.map(([number, title, text]) => (
            <article className="workflow-step" key={number}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="scope-section" id="alcance">
        <div className="scope-drawing" aria-hidden="true">
          <svg viewBox="0 0 260 120">
            <g fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".74">
              {Array.from({ length: 7 }).map((_, index) => <path key={index} d={`M${20 + index * 34} 18V98`} />)}
              {Array.from({ length: 4 }).map((_, index) => <path key={index} d={`M20 ${24 + index * 22}H224`} />)}
              <path d="M20 98L54 24L88 98L122 24L156 98L190 24L224 98" />
            </g>
          </svg>
        </div>
        <div className="scope-copy">
          <h2>Alcance tecnico</h2>
          <p>
          MásAlto Layout está pensado para previsualización, presupuestos y planificación
            preliminar de estructuras eventuales. Ayuda a modelar, revisar y obtener despiece
            estimado antes de avanzar con documentación definitiva.
          </p>
        </div>
        <div className="scope-warning">
          <ShieldAlert size={52} strokeWidth={1.7} />
          <strong>No reemplaza cálculo estructural ni plano aprobado por ingeniero.</strong>
        </div>
      </section>

      <section className="final-cta">
        <h2>Planifica la estructura antes de mover una pieza.</h2>
        <button type="button" className="primary-action" onClick={openEditor}>
          Abrir editor <ArrowRight size={20} />
        </button>
        <p>Plano esquemático preliminar realizado únicamente con fines presupuestarios y comerciales.</p>
      </section>
    </main>
  );
}
