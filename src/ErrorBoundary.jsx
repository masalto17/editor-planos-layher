import { Component } from 'react';

const AUTOSAVE_KEY = 'layher:autosave';

const estilos = {
  pantalla: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#f3f4f6', fontFamily: 'Nunito Sans, system-ui, sans-serif', padding: 16,
  },
  tarjeta: {
    maxWidth: 480, width: '100%', background: '#fff', borderTop: '6px solid #E30613',
    borderRadius: 8, padding: 24, boxShadow: '0 4px 16px rgba(0,0,0,.15)', color: '#000',
  },
  titulo: { margin: '0 0 8px', fontSize: 22, fontWeight: 800, color: '#E30613' },
  mensaje: {
    margin: '0 0 16px', padding: 10, background: '#f3f4f6', borderRadius: 4,
    fontSize: 13, fontFamily: 'monospace', wordBreak: 'break-word', color: '#000',
  },
  fila: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  primario: {
    background: '#E30613', color: '#fff', border: 'none', padding: '8px 16px',
    borderRadius: 4, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  },
  secundario: {
    background: '#000', color: '#fff', border: 'none', padding: '8px 16px',
    borderRadius: 4, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  },
  aviso: { marginTop: 12, fontSize: 13, color: '#777' },
};

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, aviso: '' };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary:', error, info?.componentStack);
  }

  reintentar = () => this.setState({ error: null, aviso: '' });

  restaurar = () => {
    try {
      const guardado = localStorage.getItem(AUTOSAVE_KEY);
      if (!guardado) {
        this.setState({ aviso: 'No hay autoguardado disponible.' });
        return;
      }
      // El autoguardado se conserva; al reintentar el editor lo retoma.
      this.setState({ error: null, aviso: '' });
    } catch {
      this.setState({ aviso: 'No se pudo leer el autoguardado.' });
    }
  };

  render() {
    const { error, aviso } = this.state;
    if (!error) return this.props.children;
    return (
      <div style={estilos.pantalla}>
        <div style={estilos.tarjeta} role="alert">
          <h1 style={estilos.titulo}>Algo salió mal</h1>
          <p style={estilos.mensaje}>{error?.message || String(error)}</p>
          <div style={estilos.fila}>
            <button style={estilos.primario} onClick={this.reintentar}>Reintentar</button>
            <button style={estilos.secundario} onClick={this.restaurar}>Restaurar diseño</button>
          </div>
          {aviso && <p style={estilos.aviso}>{aviso}</p>}
        </div>
      </div>
    );
  }
}
