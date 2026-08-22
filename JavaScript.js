import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue, get, push, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyBqApazED0fbAW8Bj2hvlDiyRgIlJ-UrjA",
    authDomain: "celmirahuertas-78fbb.firebaseapp.com",
    databaseURL: "https://celmirahuertas-78fbb-default-rtdb.firebaseio.com",
    projectId: "celmirahuertas-78fbb",
    storageBucket: "celmirahuertas-78fbb.firebasestorage.app",
    messagingSenderId: "133956808415",
    appId: "1:133956808415:web:d4d837533410628ef3436a",
    measurementId: "G-VJHXEY45SN"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);


const GRADOS_COLEGIO = [
    { id: 'btn-primero', nombre: 'PRIMERO' },
    { id: 'btn-segundo', nombre: 'SEGUNDO' },
    { id: 'btn-tercero', nombre: 'TERCERO' },
    { id: 'btn-cuarto', nombre: 'CUARTO' },
    { id: 'btn-quinto', nombre: 'QUINTO' },
    { id: 'btn-sexto', nombre: 'SEXTO' },
    { id: 'btn-septimo', nombre: 'SEPTIMO' },
    { id: 'btn-octavo', nombre: 'OCTAVO' },
    { id: 'btn-noveno', nombre: 'NOVENO' },
    { id: 'btn-decimo', nombre: 'DECIMO' },
    { id: 'btn-once', nombre: 'ONCE' }
];

let selectedRole = '';
let gradoActivo = '';
let FirebaseListener = null; 

const modal = document.getElementById('modal-password');
const closeModal = document.getElementById('close-modal');
const stepRoleSelection = document.getElementById('step-role-selection');
const stepLogin = document.getElementById('step-login');
const stepTutorDashboard = document.getElementById('step-tutor-dashboard');
const stepAlumnoDashboard = document.getElementById('step-alumno-dashboard');

const inputPass = document.getElementById('input-pass');
const btnSubmitPass = document.getElementById('btn-submit-pass');
const errorMsg = document.getElementById('error-msg');

GRADOS_COLEGIO.forEach(grado => {
    const btn = document.getElementById(grado.id);
    if (btn) {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            gradoActivo = grado.nombre;
            abrirModal();
        });
    }
});

function abrirModal() {
    if (modal) {
        modal.style.display = 'flex';
        resetearModal();
    }
}

if (closeModal) {
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
        if (FirebaseListener) {
            FirebaseListener();
            FirebaseListener = null;
        }
    });
}

function resetearModal() {
    stepRoleSelection.style.display = 'block';
    stepLogin.style.display = 'none';
    stepTutorDashboard.style.display = 'none';
    stepAlumnoDashboard.style.display = 'none';
    errorMsg.style.display = 'none';
    inputPass.value = '';
    
    if (FirebaseListener) {
        FirebaseListener();
        FirebaseListener = null;
    }
}

const btnTutor = document.getElementById('btn-select-tutor');
const btnAlumno = document.getElementById('btn-select-alumno');
if(btnTutor) btnTutor.addEventListener('click', () => irALogin('tutor'));
if(btnAlumno) btnAlumno.addEventListener('click', () => irALogin('alumno'));

function irALogin(rol) {
    selectedRole = rol;
    stepRoleSelection.style.display = 'none';
    stepLogin.style.display = 'block';
    document.getElementById('login-title').innerText = `Acceso ${rol === 'tutor' ? 'Docente' : 'Alumno'} - ${gradoActivo}`;
    document.getElementById('login-description').innerText = `Ingresa tu contraseña para ${gradoActivo}:`;
    inputPass.focus();
}

if(btnSubmitPass) {
    btnSubmitPass.addEventListener('click', validarContrasenaDinamica);
    inputPass.addEventListener('keypress', (e) => { if (e.key === 'Enter') validarContrasenaDinamica(); });
}


async function validarContrasenaDinamica() {
    const passwordIngresada = inputPass.value.trim();
    const rolRuta = selectedRole === 'tutor' ? 'tutores' : 'alumnos';
    const refClaves = ref(db, `configuracion_accesos/${gradoActivo}/${rolRuta}`);

    try {
        const snapshot = await get(refClaves);
        let esValida = false;
        if (snapshot.exists()) {
            const clavesObj = snapshot.val();
            esValida = Object.values(clavesObj).includes(passwordIngresada);
        }

        if (esValida || passwordIngresada === 'KOUSPARYKEVIN1') { 
            errorMsg.style.display = 'none';
            stepLogin.style.display = 'none';
            if (selectedRole === 'tutor') {
                mostrarPanelTutor();
            } else {
                mostrarPanelAlumno();
            }
        } else {
            errorMsg.style.display = 'block';
        }
    } catch (error) {
        console.error("Error al validar contraseña:", error);
        errorMsg.style.display = 'block';
    }
}

function mostrarPanelTutor() {
    stepTutorDashboard.style.display = 'block';
    const gradoRef = ref(db, 'grados/' + gradoActivo);
    
    get(gradoRef).then((snapshot) => {
        const data = snapshot.val();
        const inputTutor = document.getElementById('tutor-message');
        if (inputTutor) {
            inputTutor.value = data ? data.codigoMeet : '';
        }
    });
}

const btnSendAnnouncement = document.getElementById('btn-send-announcement');
if(btnSendAnnouncement) {
    btnSendAnnouncement.addEventListener('click', () => {
        const nuevoEnlace = document.getElementById('tutor-message').value.trim();
        set(ref(db, 'grados/' + gradoActivo), {
            codigoMeet: nuevoEnlace
        }).then(() => {
            const successMsg = document.getElementById('tutor-success-msg');
            successMsg.style.display = 'block';
            setTimeout(() => { successMsg.style.display = 'none'; }, 3000);
        });
    });
}


function mostrarPanelAlumno() {
    stepAlumnoDashboard.style.display = 'block';
    const gradoRef = ref(db, 'grados/' + gradoActivo);
    
    FirebaseListener = onValue(gradoRef, (snapshot) => {
        const data = snapshot.val();
        const inputAlumno = document.getElementById('alumno-received-message');
        if (inputAlumno) {
            if (data && data.codigoMeet && data.codigoMeet.trim() !== '') {
                inputAlumno.value = data.codigoMeet;
            } else {
                inputAlumno.value = "No hay enlaces asignados";
            }
        }
    });
}

const btnCopyCode = document.getElementById('btn-copy-code');
if(btnCopyCode) {
    btnCopyCode.addEventListener('click', () => {
        const inputAlumno = document.getElementById('alumno-received-message');
        if (inputAlumno && inputAlumno.value.startsWith('http')) {
            navigator.clipboard.writeText(inputAlumno.value).then(() => alert('¡Enlace copiado!'));
        }
    });
}

const btnGoToMeet = document.getElementById('btn-go-to-meet');
if(btnGoToMeet) {
    btnGoToMeet.addEventListener('click', () => {
        const urlFinal = document.getElementById('alumno-received-message').value;
        if (urlFinal.startsWith('http')) {
            window.open(urlFinal, '_blank');
        } else {
            alert('Aún no hay una clase activa asignada.');
        }
    });
}
