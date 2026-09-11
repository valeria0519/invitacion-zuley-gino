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
0.5 FUENTES WEB — evita el salto del sobre al reemplazar la fuente
    de reserva por la definitiva (FOUT). El html arranca con la clase
    "fonts-cargando" (agregada inline en el <head>, antes de pintar),
    que mantiene invisibles pero con su espacio reservado a los
    textos afectados. Al resolver document.fonts.ready (o vencer un
    timeout de seguridad) se quita la clase y aparecen con un fundido.
================================================================ */
(function gestionarFuentes() {
const raiz = document.documentElement;
const listas = () => raiz.classList.remove('fonts-cargando');
if (document.fonts && document.fonts.ready) {
    Promise.race([
    document.fonts.ready,
    new Promise((resolve) => setTimeout(resolve, 600)),
    ]).then(listas);
} else {
    setTimeout(listas, 300);
}
})();

/* ================================================================
1. EXPERIENCIA DE APERTURA — SOBRE ANIMADO (v3 premium)
================================================================ */
const sobreScreen  = document.getElementById('sobre-screen');
const sobre        = document.getElementById('sobre');
const sobreSombra  = document.getElementById('sobre-sombra');
const sobreSello   = document.getElementById('sobre-sello');
const btnAbrir     = document.getElementById('btn-abrir-sobre');
const contenido    = document.getElementById('contenido-principal');
const musicControl = document.getElementById('music-control');
const mensajeEl    = document.getElementById('sobre-mensaje-invitado');
const sobreHeader  = document.getElementById('sobre-header');
const sobreTagline = document.getElementById('sobre-tagline');

/* Preferencia de movimiento reducido */
const prefReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

/* ── Secuencia principal de apertura ─────────────────────────────
Una sola coreografía controlada por clases CSS (nada de estilos
inline ni transiciones que se pisen entre sí):

1. .sobre__sello--presionado   → el lacre baja a scale(0.94)
2. (se quita la clase)         → el lacre vuelve a scale(1), sin rebote
3-4. .sobre--abierto           → el sello se desvanece y la solapa gira,
                                   el cuerpo y el contenedor del sobre
                                   permanecen quietos
5. .cerrado en #sobre-screen   → funde toda la pantalla del sobre
6. finalizarApertura()         → aparece la foto principal

Duración total ≈ 1.1s.
================================================================ */
let yaAbierto = false;

const DURACION_PRESION   = 110; // ms sosteniendo el scale(0.94)
const DURACION_APERTURA  = 600; // ms de giro de la solapa
const DURACION_FUNDIDO   = 300; // ms de fundido de toda la pantalla

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

/* 1. Presión del sello: scale(1) → scale(0.94) */
sobreSello.classList.add('sobre__sello--presionado');

/* 2. Recuperar la escala inmediatamente, sin rebote */
setTimeout(() => {
    sobreSello.classList.remove('sobre__sello--presionado');
}, DURACION_PRESION);

/* 3-4. El sello se desvanece y la solapa abre en 3D.
        El cuerpo y el contenedor del sobre no se mueven. */
setTimeout(() => {
    sobre.classList.add('sobre--abierto');
    sobreSombra.classList.add('sobre-sombra--abierta');

    [sobreHeader, sobreTagline, mensajeEl].forEach(el => {
        if (!el) return;
        el.style.transition = 'opacity 0.4s ease';
        el.style.opacity    = '0';
        el.style.pointerEvents = 'none';
    });
}, DURACION_PRESION + 110);

/* 6. Una vez abierta la solapa, fundir toda la pantalla del sobre */
setTimeout(() => {
    sobreScreen.classList.add('cerrado');
}, DURACION_PRESION + 110 + DURACION_APERTURA);

/* 7. Mostrar la foto principal apenas termina el fundido */
setTimeout(
    finalizarApertura,
    DURACION_PRESION + 110 + DURACION_APERTURA + DURACION_FUNDIDO
);
}

function finalizarApertura() {
/* Libera el scroll bloqueado por la portada (ver body.sobre-activo en
   styles.css) antes de mostrar el contenido, para no dejarlo nunca
   fijo de forma permanente. */
document.body.classList.remove('sobre-activo');
window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
contenido.inert = false;
sobreScreen.setAttribute('aria-hidden', 'true');
sobreScreen.inert = true;
sobreScreen.classList.add('cerrado');
contenido.setAttribute('aria-hidden', 'false');
contenido.classList.add('visible');
if (musicControl) musicControl.removeAttribute('hidden');
/* La música no se reproduce automáticamente: el invitado debe presionar reproducir. */

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
const elementosAnimados = document.querySelectorAll('.animate-up, .animate-photo, .animate-botanica');

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
(botón flotante + reproductor embebido en la sección "Nuestra canción",
ambos comparten el mismo <audio id="audio-boda">)
================================================================ */
const audio       = document.getElementById('audio-boda');
const musicToggle = document.getElementById('music-toggle');
const iconPlay    = document.getElementById('icon-play');
const iconPause   = document.getElementById('icon-pause');

const playerToggle   = document.getElementById('player-toggle');
const playerIcon     = document.getElementById('player-icon');
const playerLabel    = document.getElementById('player-label');
const musicProgress  = document.getElementById('music-progress');
const musicCurrent   = document.getElementById('music-current');
const musicDuration  = document.getElementById('music-duration');
const musicStatus    = document.getElementById('music-status');

/** True si ya se colocó el archivo MP3 (existe un <source> dentro del <audio>). */
function audioTieneFuente() { return !!audio.querySelector('source'); }

function formatearTiempo(seg) {
if (!isFinite(seg) || seg < 0) return '0:00';
const m = Math.floor(seg / 60);
const s = Math.floor(seg % 60);
return `${m}:${String(s).padStart(2, '0')}`;
}

function actualizarUIMusica(reproduciendo) {
if (reproduciendo) {
    iconPlay.setAttribute('hidden', '');
    iconPause.removeAttribute('hidden');
    musicToggle.setAttribute('aria-label', 'Pausar música');
} else {
    iconPause.setAttribute('hidden', '');
    iconPlay.removeAttribute('hidden');
    musicToggle.setAttribute('aria-label', 'Reproducir música');
}
if (playerIcon)  playerIcon.textContent = reproduciendo ? '❚❚' : '▶';
if (playerLabel) playerLabel.textContent = reproduciendo ? 'Pausar' : 'Reproducir';
if (playerToggle) {
    playerToggle.setAttribute('aria-pressed', reproduciendo ? 'true' : 'false');
    playerToggle.setAttribute('aria-label', reproduciendo ? 'Pausar nuestra canción' : 'Reproducir nuestra canción');
}
}

function alternarMusica() {
if (!audioTieneFuente()) {
    if (musicStatus) musicStatus.textContent = 'Música próximamente. Agregá el archivo en assets/audio/musica-fondo.mp3.';
    return;
}
if (audio.paused) {
    audio.play()
    .then(() => actualizarUIMusica(true))
    .catch(() => { if (musicStatus) musicStatus.textContent = 'No se pudo reproducir la música.'; });
} else {
    audio.pause();
    actualizarUIMusica(false);
}
}

musicToggle.addEventListener('click', alternarMusica);
if (playerToggle) playerToggle.addEventListener('click', alternarMusica);

audio.addEventListener('loadedmetadata', () => {
if (musicProgress) {
    musicProgress.max = audio.duration;
    musicProgress.disabled = false;
}
if (musicDuration) musicDuration.textContent = formatearTiempo(audio.duration);
if (musicStatus)   musicStatus.textContent = '';
});

audio.addEventListener('timeupdate', () => {
if (musicProgress && !musicProgress.matches(':active')) musicProgress.value = audio.currentTime;
if (musicCurrent) musicCurrent.textContent = formatearTiempo(audio.currentTime);
});

audio.addEventListener('pause', () => actualizarUIMusica(false));
audio.addEventListener('play',  () => actualizarUIMusica(true));

if (musicProgress) {
musicProgress.addEventListener('input', () => {
    if (isFinite(audio.duration)) audio.currentTime = Number(musicProgress.value);
});
}

if (!audioTieneFuente() && musicStatus) {
musicStatus.textContent = 'Presioná reproducir para escuchar. (Falta colocar el MP3 en assets/audio/musica-fondo.mp3)';
}

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
if (aliasValorEl) {
aliasValorEl.textContent = BANK_ALIAS;
if (BANK_ALIAS.startsWith('REEMPLAZAR')) aliasValorEl.classList.add('dato-pendiente');
}

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
const configNotice = document.getElementById('rsvp-config-notice');

// Prellenar el nombre si viene por URL
const inputNombre = document.getElementById('nombre');
if (inputNombre && INVITADO) {
inputNombre.value = INVITADO;
}

/** true solo si TODOS los valores de CONFIG_FORM fueron completados (ninguno quedó con el placeholder). */
const formularioConfigurado = Object.values(CONFIG_FORM).every((v) => !v.startsWith('REEMPLAZAR'));

if (!formularioConfigurado && configNotice) {
configNotice.removeAttribute('hidden');
}

form.addEventListener('submit', async (e) => {
e.preventDefault();
if (!formularioConfigurado) {
    mostrarError('El formulario aún no está conectado a Google Forms. Completá CONFIG_FORM en js/main.js antes de publicar.');
    return;
}
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
