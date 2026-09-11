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
1. EXPERIENCIA DE APERTURA — SOBRE ANIMADO
================================================================ */
const sobreScreen  = document.getElementById('sobre-screen');
const sobre        = document.getElementById('sobre');
const sobreSombra  = document.getElementById('sobre-sombra');
const btnAbrir     = document.getElementById('btn-abrir-sobre');
const contenido    = document.getElementById('contenido-principal');
const musicControl = document.getElementById('music-control');
const mensajeEl    = document.getElementById('sobre-mensaje-invitado');
const pretextoEl   = document.getElementById('sobre-pretexto');


/* ── Canvas de partículas ─────────────────────────────────────── */
const petalosCanvas = document.getElementById('petalos-canvas');
const pCtx          = petalosCanvas.getContext('2d');
let petalosRaf;
let petalosAnimando = false;
let petalos         = [];

/* Colores dorados de la paleta */
const PETAL_COLORS = ['#b8913a', '#d4ad68', '#8f6e22', '#d9c07a'];

/* Dimensionar el canvas al tamaño real de la pantalla */
function dimensionarCanvas() {
const rect = sobreScreen.getBoundingClientRect();
petalosCanvas.width  = rect.width  || window.innerWidth;
petalosCanvas.height = rect.height || window.innerHeight;
}

dimensionarCanvas();
window.addEventListener('resize', dimensionarCanvas);

/** Crea una partícula que explota desde (cx, cy) hacia arriba y los lados */
function crearPetalo(cx, cy) {
const angBase = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.45;
const speed   = 1.8 + Math.random() * 2.8;
const tipo    = Math.floor(Math.random() * 4); // 0=pétalo 1=rombo 2=bastón 3=punto
return {
x: cx, y: cy,
vx: Math.cos(angBase) * speed,
vy: Math.sin(angBase) * speed - 0.8,
gravity: 0.055 + Math.random() * 0.04,
angle: Math.random() * Math.PI * 2,
va:    (Math.random() - 0.5) * 0.09,
r:     2.5 + Math.random() * 4.5,
tipo,
color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
alpha: 0.88 + Math.random() * 0.12,
decay: 0.007 + Math.random() * 0.006,
alive: true,
};
}

/** Dibuja una partícula según su tipo */
function dibujarPetalo(p) {
pCtx.save();
pCtx.translate(p.x, p.y);
pCtx.rotate(p.angle);
pCtx.globalAlpha = p.alpha;
pCtx.fillStyle   = p.color;
pCtx.strokeStyle = p.color;

if (p.tipo === 0) {
/* Pétalo alargado */
pCtx.beginPath();
pCtx.ellipse(0, 0, p.r * 0.35, p.r, 0, 0, Math.PI * 2);
pCtx.fill();
} else if (p.tipo === 1) {
/* Rombo */
pCtx.beginPath();
pCtx.moveTo(0, -p.r);
pCtx.lineTo(p.r * 0.45, 0);
pCtx.lineTo(0, p.r);
pCtx.lineTo(-p.r * 0.45, 0);
pCtx.closePath();
pCtx.fill();
} else if (p.tipo === 2) {
/* Bastón */
pCtx.lineWidth = p.r * 0.22;
pCtx.lineCap   = 'round';
pCtx.beginPath();
pCtx.moveTo(0, -p.r * 0.65);
pCtx.lineTo(0,  p.r * 0.65);
pCtx.stroke();
} else {
/* Punto */
pCtx.beginPath();
pCtx.arc(0, 0, p.r * 0.5, 0, Math.PI * 2);
pCtx.fill();
}
pCtx.restore();
}

/** Loop de animación de partículas */
function loopPetalos() {
pCtx.clearRect(0, 0, petalosCanvas.width, petalosCanvas.height);

let hayVivas = false;
for (const p of petalos) {
if (!p.alive) continue;
p.x     += p.vx;
p.y     += p.vy;
p.vy    += p.gravity;
p.vx    *= 0.986;
p.angle += p.va;
p.alpha -= p.decay;
if (p.alpha <= 0) { p.alive = false; continue; }
hayVivas = true;
dibujarPetalo(p);
}

if (hayVivas) {
petalosRaf = requestAnimationFrame(loopPetalos);
} else {
petalosAnimando = false;
pCtx.clearRect(0, 0, petalosCanvas.width, petalosCanvas.height);
}
}

/**
 * Lanza N pétalos desde las coordenadas (cx, cy) relativas al #sobre-screen.
 * Se llama cuando la solapa del sobre termina de abrirse.
 */
function lanzarPetalos(cx, cy, n = 28) {
// Respetar preferencia de movimiento reducido
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
cancelAnimationFrame(petalosRaf);
petalos = [];
for (let i = 0; i < n; i++) petalos.push(crearPetalo(cx, cy));
petalosAnimando = true;
petalosRaf = requestAnimationFrame(loopPetalos);
}

/* Inyectar mensaje personalizado al invitado */
if (INVITADO) {
mensajeEl.innerHTML =
`<em>${INVITADO},</em><br />queremos que seas parte de nuestra historia.`;
} else {
mensajeEl.textContent = 'Queremos que seas parte de nuestra historia.';
}

/* Ajustar máximo de acompañantes en el formulario */
const inputNumAcomp = document.getElementById('num-acompanantes');
if (inputNumAcomp) {
inputNumAcomp.max = MAX_ACOMPANANTES;
}

/** Secuencia de apertura del sobre */
function abrirSobre() {
btnAbrir.disabled = true;

// 1. Fade simultáneo: texto, mensaje y botón
[pretextoEl, mensajeEl, btnAbrir].forEach(el => {
el.style.transition = 'opacity 0.32s ease';
el.style.opacity = '0';
el.style.pointerEvents = 'none';
});

setTimeout(() => {
// 2. Abre el sobre: solapa + tarjeta emergen
sobre.classList.add('sobre--abierto');

// 2b. Expande la sombra (simula el sobre levantándose)
if (sobreSombra) sobreSombra.classList.add('expandida');

// 2c. Lanza los pétalos desde el centro del sobre
//     cuando la solapa termina de rotar (~280ms después)
setTimeout(() => {
    dimensionarCanvas();
    const sobreRect   = sobre.getBoundingClientRect();
    const screenRect  = sobreScreen.getBoundingClientRect();
    const cx = sobreRect.left - screenRect.left + sobreRect.width  / 2;
    const cy = sobreRect.top  - screenRect.top  + sobreRect.height * 0.38;
    lanzarPetalos(cx, cy, 28);
}, 280);

// 3. Transición al contenido una vez la tarjeta terminó de subir
setTimeout(() => {
    sobreScreen.classList.add('cerrado');
    contenido.setAttribute('aria-hidden', 'false');
    contenido.classList.add('visible');
    musicControl.removeAttribute('hidden');
    intentarReproducirMusica();

    // Devolver foco al primer título del contenido
    setTimeout(() => {
    const primerFoco = contenido.querySelector('h1, h2');
    if (primerFoco) primerFoco.focus({ preventScroll: true });
    }, 500);

}, 1500); // tiempo total de la animación del sobre

}, 340); // espera fin del fade
}

btnAbrir.addEventListener('click', abrirSobre);
btnAbrir.addEventListener('keydown', (e) => {
if (e.key === 'Enter' || e.key === ' ') {
e.preventDefault();
abrirSobre();
}
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