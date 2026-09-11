/**
 * BODA ZUHEY & GINO — main.js  v2
 *
 * Módulos:
 *  0. Parámetros de URL (invitado, código, acompañantes máx.)
 *  1. Experiencia de apertura — sobre animado
 *  2. Animaciones de entrada (IntersectionObserver)
 *  3. Cuenta regresiva
 *  4. Control de música
 *  5. Galería / Lightbox
 *  6. Alias — copiar al portapapeles
 *  7. Formulario RSVP → Google Forms
 */

'use strict';

/* ================================================================
CONFIGURACIÓN GLOBAL — editar estos valores fácilmente
================================================================ */

/**
 * Alias para transferencias. Reemplaza con el alias real.
 * Se muestra en la sección "Nuestro próximo destino".
 */
const BANK_ALIAS = 'REEMPLAZAR.ALIAS';

/**
 * Configuración del Google Form.
 * Instrucciones completas al final de este archivo.
 */
const CONFIG_FORM = {
GOOGLE_FORM_ACTION:         'REEMPLAZAR_CON_URL_DE_GOOGLE_FORM',
ENTRY_NOMBRE:               'REEMPLAZAR_CON_entry.XXXXXXXXXX',
ENTRY_ASISTENCIA:           'REEMPLAZAR_CON_entry.XXXXXXXXXX',
ENTRY_ACOMPANANTES:         'REEMPLAZAR_CON_entry.XXXXXXXXXX',
ENTRY_NOMBRES_ACOMPANANTES: 'REEMPLAZAR_CON_entry.XXXXXXXXXX',
ENTRY_ALIMENTACION:         'REEMPLAZAR_CON_entry.XXXXXXXXXX',
ENTRY_MENSAJE:              'REEMPLAZAR_CON_entry.XXXXXXXXXX',
};

/* ================================================================
0. PARÁMETROS DE URL
================================================================
Uso:
    ?invitado=Valeria
    ?invitado=Valeria&max=2
    ?codigo=ABC123&invitado=Los%20Fernandez&max=4

La arquitectura está lista para que en el futuro puedas:
- Verificar códigos individuales contra una lista
- Limitar el campo "acompañantes" según el parámetro max
================================================================ */
const urlParams = new URLSearchParams(window.location.search);

/** Nombre del invitado (decodificado, capitalizado) */
const INVITADO = (() => {
const raw = urlParams.get('invitado');
if (!raw) return '';
// capitaliza la primera letra de cada palabra
return decodeURIComponent(raw)
.trim()
.replace(/\b\w/g, (c) => c.toUpperCase());
})();

/** Máximo de acompañantes permitido para este invitado */
const MAX_ACOMPANANTES = (() => {
const raw = urlParams.get('max');
const n = parseInt(raw, 10);
return (!isNaN(n) && n >= 0) ? n : 10; // sin límite por defecto
})();

/** Código individual (reservado para futura validación) */
const CODIGO_INVITADO = urlParams.get('codigo') || '';

/* ================================================================
1. EXPERIENCIA DE APERTURA — SOBRE ANIMADO (v3 premium)
================================================================ */
const sobreScreen  = document.getElementById('sobre-screen');
const sobre        = document.getElementById('sobre');
const sobreWrapper = document.getElementById('sobre-wrapper');
const sobreSombra  = document.getElementById('sobre-sombra');
const sobreSello   = document.getElementById('sobre-sello');
const btnAbrir     = document.getElementById('btn-abrir-sobre');
const sobreTarjeta = document.getElementById('sobre-tarjeta');
const contenido    = document.getElementById('contenido-principal');
const musicControl = document.getElementById('music-control');
const mensajeEl    = document.getElementById('sobre-mensaje-invitado');
const sobreHeader  = document.getElementById('sobre-header');
const sobreTagline = document.getElementById('sobre-tagline');

/* Preferencia de movimiento reducido */
const prefReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Canvas de partículas ─────────────────────────────────────── */
const petalosCanvas = document.getElementById('petalos-canvas');
const pCtx          = petalosCanvas.getContext('2d');
let petalosRaf;
let petalos = [];

/* Paleta: dorado envejecido + marfil + verde salvia */
const PETAL_COLORS = ['#B79A62', '#d4b87a', '#9a7d3a', '#e8ddc0', '#858A72'];

function dimensionarCanvas() {
const rect = sobreScreen.getBoundingClientRect();
petalosCanvas.width  = rect.width  || window.innerWidth;
petalosCanvas.height = rect.height || window.innerHeight;
}
dimensionarCanvas();
window.addEventListener('resize', dimensionarCanvas);

function crearPetalo(cx, cy) {
const angBase = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.5;
const speed   = 1.4 + Math.random() * 2.4;
const tipo    = Math.floor(Math.random() * 4);
return {
    x: cx, y: cy,
    vx: Math.cos(angBase) * speed,
    vy: Math.sin(angBase) * speed - 0.6,
    gravity: 0.04 + Math.random() * 0.035,
    angle:  Math.random() * Math.PI * 2,
    va:     (Math.random() - 0.5) * 0.07,
    r:      2 + Math.random() * 5,
    tipo,
    color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
    alpha: 0.85 + Math.random() * 0.15,
    decay: 0.005 + Math.random() * 0.007,
    alive: true,
};
}

function dibujarPetalo(p) {
pCtx.save();
pCtx.translate(p.x, p.y);
pCtx.rotate(p.angle);
pCtx.globalAlpha = p.alpha;
pCtx.fillStyle   = p.color;
pCtx.strokeStyle = p.color;
if (p.tipo === 0) {
    pCtx.beginPath();
    pCtx.ellipse(0, 0, p.r * 0.32, p.r, 0, 0, Math.PI * 2);
    pCtx.fill();
} else if (p.tipo === 1) {
    pCtx.beginPath();
    pCtx.moveTo(0, -p.r);
    pCtx.lineTo(p.r * 0.42, 0);
    pCtx.lineTo(0, p.r);
    pCtx.lineTo(-p.r * 0.42, 0);
    pCtx.closePath();
    pCtx.fill();
} else if (p.tipo === 2) {
    pCtx.lineWidth = p.r * 0.2;
    pCtx.lineCap   = 'round';
    pCtx.beginPath();
    pCtx.moveTo(0, -p.r * 0.6);
    pCtx.lineTo(0,  p.r * 0.6);
    pCtx.stroke();
} else {
    pCtx.beginPath();
    pCtx.arc(0, 0, p.r * 0.45, 0, Math.PI * 2);
    pCtx.fill();
}
pCtx.restore();
}

function loopPetalos() {
pCtx.clearRect(0, 0, petalosCanvas.width, petalosCanvas.height);
let hayVivas = false;
for (const p of petalos) {
    if (!p.alive) continue;
    p.x += p.vx; p.y += p.vy;
    p.vy += p.gravity; p.vx *= 0.988;
    p.angle += p.va; p.alpha -= p.decay;
    if (p.alpha <= 0) { p.alive = false; continue; }
    hayVivas = true;
    dibujarPetalo(p);
}
if (hayVivas) {
    petalosRaf = requestAnimationFrame(loopPetalos);
} else {
    pCtx.clearRect(0, 0, petalosCanvas.width, petalosCanvas.height);
}
}

function lanzarPetalos(cx, cy, n = 32) {
if (prefReducido) return;
cancelAnimationFrame(petalosRaf);
petalos = [];
for (let i = 0; i < n; i++) petalos.push(crearPetalo(cx, cy));
petalosRaf = requestAnimationFrame(loopPetalos);
}

/* ── Inyectar mensaje personalizado al invitado ───────────────── */
if (INVITADO) {
mensajeEl.innerHTML =
    `<em>${INVITADO},</em><br />queremos que seas parte de nuestra historia.`;
} else {
mensajeEl.textContent = 'Queremos que seas parte de nuestra historia.';
}

/* ── Ajustar máximo de acompañantes ──────────────────────────── */
const inputNumAcomp = document.getElementById('num-acompanantes');
if (inputNumAcomp) inputNumAcomp.max = MAX_ACOMPANANTES;

/* ── Secuencia principal de apertura ─────────────────────────── */
let yaAbierto = false;

function abrirSobre() {
if (yaAbierto) return;
yaAbierto = true;

/* Deshabilitar interacciones durante la animación */
sobreSello.disabled = true;
btnAbrir.disabled   = true;

if (prefReducido) {
    /* Movimiento reducido: saltar animación */
    finalizarApertura();
    return;
}

/* ── FASE 1 (0ms): Presión del sello ─────────────────────────── */
sobreSello.querySelector('.lacre').style.transform = 'scale(0.88)';

/* ── FASE 2 (180ms): Soltar y fade del sello ─────────────────── */
setTimeout(() => {
    sobreSello.querySelector('.lacre').style.transition =
        'transform 0.5s cubic-bezier(0.34,1.4,0.64,1)';
    sobreSello.querySelector('.lacre').style.transform = 'scale(1.06)';

    /* Fade header + tagline + mensaje */
    [sobreHeader, sobreTagline, mensajeEl].forEach(el => {
        if (!el) return;
        el.style.transition = 'opacity 0.4s ease';
        el.style.opacity    = '0';
        el.style.pointerEvents = 'none';
    });
}, 180);

/* ── FASE 3 (480ms): Sello desaparece, la solapa comienza a abrirse */
setTimeout(() => {
    sobre.classList.add('sobre--abierto');

    /* Lanzar partículas desde la posición del sello */
    dimensionarCanvas();
    const selRect    = sobreSello.getBoundingClientRect();
    const screenRect = sobreScreen.getBoundingClientRect();
    const cx = selRect.left - screenRect.left + selRect.width  / 2;
    const cy = selRect.top  - screenRect.top  + selRect.height / 2;
    lanzarPetalos(cx, cy, 32);

    /* Sombra se expande: sobre "se levanta" */
    sobreSombra.style.transition =
        'width 0.9s cubic-bezier(0.4,0,0.2,1) 0.2s, ' +
        'opacity 0.9s ease 0.2s, ' +
        'transform 0.9s ease 0.2s';
    sobreSombra.style.width   = '92%';
    sobreSombra.style.opacity = '0.45';
    sobreSombra.style.transform = 'translateX(-50%) scaleY(1.3)';
}, 480);

/* ── FASE 4 (900ms): La tarjeta comienza a emerger ───────────── */
setTimeout(() => {
    /*
     * La tarjeta sube desde dentro del sobre hasta ocupar gran parte
     * del viewport. Usamos JS para calcular cuánto debe subir.
     */
    const sobreRect   = sobreWrapper.getBoundingClientRect();
    const screenH     = window.innerHeight;
    const tarjetaH    = sobreTarjeta.offsetHeight;
    /* Queremos que la tarjeta quede centrada, ligeramente alta */
    const targetTop   = screenH * 0.12; /* 12% desde el top de la pantalla */
    const sobreBottom = sobreRect.bottom;
    /* Cuánto sube la tarjeta: desde su posición actual (bottom del sobre) */
    const subirPx     = sobreBottom - targetTop - tarjetaH;

    sobreTarjeta.style.transition =
        'transform 1.4s cubic-bezier(0.16,1,0.3,1), ' +
        'box-shadow 1.4s ease, opacity 0.3s ease';
    sobreTarjeta.classList.add('saliendo');
    sobreTarjeta.style.transform =
        `translateX(-50%) translateY(calc(-${subirPx}px - 100% + 12px))`;
    sobreTarjeta.style.boxShadow =
        '0 24px 60px rgba(48,51,41,0.22), 0 8px 24px rgba(48,51,41,0.14)';

    /* El sobre baja un poco (reacción contraria) */
    sobreWrapper.style.transition =
        'transform 1.4s cubic-bezier(0.16,1,0.3,1)';
    sobreWrapper.style.transform = 'translateY(12px)';

    /* Sombra del sobre se contrae (ya no es protagonista) */
    sobreSombra.style.transition = 'opacity 0.8s ease 0.3s, width 0.8s ease 0.3s';
    sobreSombra.style.opacity = '0.2';
    sobreSombra.style.width   = '60%';
}, 900);

/* ── FASE 5 (1600ms): Textos de la tarjeta aparecen ─────────── */
setTimeout(() => {
    sobreTarjeta.classList.add('revelada');
}, 1600);

/* ── FASE 6 (2800ms): Transición al contenido principal ──────── */
setTimeout(() => {
    finalizarApertura();
}, 2800);
}

function finalizarApertura() {
sobreScreen.classList.add('cerrado');
contenido.setAttribute('aria-hidden', 'false');
contenido.classList.add('visible');
if (musicControl) musicControl.removeAttribute('hidden');
intentarReproducirMusica();

/* Devolver el foco */
setTimeout(() => {
    const primerFoco = contenido.querySelector('h1, h2');
    if (primerFoco) primerFoco.focus({ preventScroll: true });
}, 600);
}

/* Escuchar el sello (click, touch, teclado) */
sobreSello.addEventListener('click', abrirSobre);
sobreSello.addEventListener('keydown', (e) => {
if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirSobre(); }
});

/* Botón accesible de teclado (visible solo en foco) */
btnAbrir.addEventListener('click', abrirSobre);
btnAbrir.addEventListener('keydown', (e) => {
if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirSobre(); }
});

/* ================================================================
2. ANIMACIONES DE ENTRADA — IntersectionObserver
================================================================ */
const elementosAnimados = document.querySelectorAll('.animate-up');

const observador = new IntersectionObserver(
(entradas) => {
entradas.forEach((entrada) => {
    if (entrada.isIntersecting) {
    entrada.target.classList.add('visible');
    observador.unobserve(entrada.target);
    }
});
},
{ threshold: 0.12 }
);

elementosAnimados.forEach((el) => observador.observe(el));

/* ================================================================
3. CUENTA REGRESIVA
================================================================ */
const FECHA_BODA = new Date('2026-12-12T00:00:00');

const elDias     = document.getElementById('cd-dias');
const elHoras    = document.getElementById('cd-horas');
const elMinutos  = document.getElementById('cd-minutos');
const elSegundos = document.getElementById('cd-segundos');

function actualizarContador() {
const diff = FECHA_BODA - new Date();
if (diff <= 0) {
['cd-dias','cd-horas','cd-minutos','cd-segundos'].forEach(id => {
    document.getElementById(id).textContent = '00';
});
return;
}
elDias.textContent     = String(Math.floor(diff / 86400000)).padStart(2,'0');
elHoras.textContent    = String(Math.floor((diff % 86400000) / 3600000)).padStart(2,'0');
elMinutos.textContent  = String(Math.floor((diff % 3600000) / 60000)).padStart(2,'0');
elSegundos.textContent = String(Math.floor((diff % 60000) / 1000)).padStart(2,'0');
}

actualizarContador();
setInterval(actualizarContador, 1000);

/* ================================================================
4. CONTROL DE MÚSICA
================================================================ */
const audio       = document.getElementById('audio-boda');
const musicToggle = document.getElementById('music-toggle');
const iconPlay    = document.getElementById('icon-play');
const iconPause   = document.getElementById('icon-pause');

function mostrarIconoPlay()  { iconPlay.removeAttribute('hidden'); iconPause.setAttribute('hidden',''); musicToggle.setAttribute('aria-label','Reproducir música'); }
function mostrarIconoPausa() { iconPause.removeAttribute('hidden'); iconPlay.setAttribute('hidden',''); musicToggle.setAttribute('aria-label','Pausar música'); }

function intentarReproducirMusica() {
const p = audio.play();
if (p) p.then(mostrarIconoPausa).catch(mostrarIconoPlay);
}

musicToggle.addEventListener('click', () => {
if (audio.paused) { audio.play().then(mostrarIconoPausa); }
else              { audio.pause(); mostrarIconoPlay(); }
});

/* ================================================================
5. GALERÍA / LIGHTBOX
================================================================ */
const galeriaImgs    = document.querySelectorAll('.galeria__img');
const lightbox       = document.getElementById('lightbox');
const lightboxImg    = document.getElementById('lightbox-img');
const lightboxCerrar = document.getElementById('lightbox-cerrar');
const lightboxPrev   = document.getElementById('lightbox-prev');
const lightboxNext   = document.getElementById('lightbox-next');
const lightboxFondo  = document.getElementById('lightbox-fondo');

let indiceActual = 0;
const imagenes   = Array.from(galeriaImgs);

function abrirLightbox(i) {
indiceActual = i;
lightboxImg.src = imagenes[i].src;
lightboxImg.alt = imagenes[i].alt;
lightbox.removeAttribute('hidden');
document.body.style.overflow = 'hidden';
lightboxCerrar.focus();
}

function cerrarLightbox() {
lightbox.setAttribute('hidden','');
lightboxImg.src = '';
document.body.style.overflow = '';
imagenes[indiceActual].closest('.galeria__item').focus();
}

function irAnterior() {
indiceActual = (indiceActual - 1 + imagenes.length) % imagenes.length;
lightboxImg.src = imagenes[indiceActual].src;
lightboxImg.alt = imagenes[indiceActual].alt;
}

function irSiguiente() {
indiceActual = (indiceActual + 1) % imagenes.length;
lightboxImg.src = imagenes[indiceActual].src;
lightboxImg.alt = imagenes[indiceActual].alt;
}

imagenes.forEach((img, i) => {
const item = img.closest('.galeria__item');
item.setAttribute('tabindex','0');
item.setAttribute('role','button');
item.setAttribute('aria-label', img.alt);
item.addEventListener('click', () => abrirLightbox(i));
item.addEventListener('keydown', (e) => {
if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirLightbox(i); }
});
});

lightboxCerrar.addEventListener('click', cerrarLightbox);
lightboxFondo.addEventListener('click', cerrarLightbox);
lightboxPrev.addEventListener('click', irAnterior);
lightboxNext.addEventListener('click', irSiguiente);

document.addEventListener('keydown', (e) => {
if (lightbox.hasAttribute('hidden')) return;
if (e.key === 'Escape')     cerrarLightbox();
if (e.key === 'ArrowLeft')  irAnterior();
if (e.key === 'ArrowRight') irSiguiente();
});

/* ================================================================
6. ALIAS — COPIAR AL PORTAPAPELES
================================================================ */
const aliasValorEl  = document.getElementById('alias-valor');
const btnCopiarAlias = document.getElementById('btn-copiar-alias');
const aliasBtnTexto = document.getElementById('alias-btn-texto');

// Inyectar el alias desde la constante
if (aliasValorEl) aliasValorEl.textContent = BANK_ALIAS;

if (btnCopiarAlias) {
btnCopiarAlias.addEventListener('click', async () => {
try {
    await navigator.clipboard.writeText(BANK_ALIAS);
    aliasBtnTexto.textContent = 'Alias copiado ✓';
    btnCopiarAlias.classList.add('copiado');
    setTimeout(() => {
    aliasBtnTexto.textContent = 'Copiar alias';
    btnCopiarAlias.classList.remove('copiado');
    }, 2500);
} catch {
    // Fallback para navegadores sin Clipboard API
    const ta = document.createElement('textarea');
    ta.value = BANK_ALIAS;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    aliasBtnTexto.textContent = 'Alias copiado ✓';
    btnCopiarAlias.classList.add('copiado');
    setTimeout(() => {
    aliasBtnTexto.textContent = 'Copiar alias';
    btnCopiarAlias.classList.remove('copiado');
    }, 2500);
}
});
}

/* ================================================================
7. FORMULARIO RSVP → GOOGLE FORMS

INSTRUCCIONES PARA CONECTAR:
─────────────────────────────
1. Crea tu Google Form con los 6 campos correspondientes.
2. Clic en los tres puntos → "Obtener link de prellenado".
3. Completa cada campo, envía el preenlace y copia la URL generada.
    La URL tiene el formato:
    https://docs.google.com/forms/d/e/XXXX/viewform?entry.111=X&entry.222=Y...
4. La URL de acción (GOOGLE_FORM_ACTION) es la misma URL
    pero reemplazando /viewform por /formResponse.
5. Cada "entry.XXXXXXXXXX" se copia tal cual aparece en la URL.
================================================================ */
const form         = document.getElementById('rsvp-form');
const btnConfirmar = document.getElementById('btn-confirmar');
const btnTexto     = document.getElementById('btn-texto');
const btnEnviando  = document.getElementById('btn-enviando');
const errorDiv     = document.getElementById('rsvp-error');
const wrapperForm  = document.getElementById('rsvp-form-wrapper');
const gracias      = document.getElementById('rsvp-gracias');

// Prellenar el nombre si viene por URL
const inputNombre = document.getElementById('nombre');
if (inputNombre && INVITADO) {
inputNombre.value = INVITADO;
}

form.addEventListener('submit', async (e) => {
e.preventDefault();
if (!validarFormulario()) return;

btnConfirmar.disabled = true;
btnTexto.setAttribute('hidden','');
btnEnviando.removeAttribute('hidden');
errorDiv.setAttribute('hidden','');

const datos = new FormData();
datos.append(CONFIG_FORM.ENTRY_NOMBRE,               form.nombre.value.trim());
datos.append(CONFIG_FORM.ENTRY_ASISTENCIA,           form.asistencia.value);
datos.append(CONFIG_FORM.ENTRY_ACOMPANANTES,         form.num_acompanantes.value || '0');
datos.append(CONFIG_FORM.ENTRY_NOMBRES_ACOMPANANTES, form.nombres_acompanantes.value.trim());
datos.append(CONFIG_FORM.ENTRY_ALIMENTACION,         form.alimentacion.value.trim());
datos.append(CONFIG_FORM.ENTRY_MENSAJE,              form.mensaje.value.trim());

try {
await fetch(CONFIG_FORM.GOOGLE_FORM_ACTION, {
    method: 'POST',
    mode:   'no-cors',
    body:   datos,
});
mostrarGracias();
} catch (err) {
mostrarError('Hubo un problema al enviar. Por favor, inténtalo de nuevo.');
console.error('RSVP error:', err);
restaurarBoton();
}
});

function validarFormulario() {
if (!form.nombre.value.trim()) {
mostrarError('Por favor ingresa tu nombre y apellido.');
form.nombre.focus();
return false;
}
if (!form.asistencia.value) {
mostrarError('Por favor indica si asistirás.');
return false;
}
const numAcomp = parseInt(form.num_acompanantes.value, 10);
if (!isNaN(numAcomp) && numAcomp > MAX_ACOMPANANTES) {
mostrarError(`El máximo de acompañantes para tu invitación es ${MAX_ACOMPANANTES}.`);
form.num_acompanantes.focus();
return false;
}
return true;
}

function mostrarGracias() {
wrapperForm.setAttribute('hidden','');
gracias.removeAttribute('hidden');
gracias.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function mostrarError(msg) {
errorDiv.textContent = msg;
errorDiv.removeAttribute('hidden');
}

function restaurarBoton() {
btnConfirmar.disabled = false;
btnTexto.removeAttribute('hidden');
btnEnviando.setAttribute('hidden','');
}
