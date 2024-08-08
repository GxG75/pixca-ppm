const calendarContainer = document.getElementById("calendar-container"); 
const monthYearDisplay = document.getElementById("month-year"); 
const daysContainer = document.getElementById("days"); 
const prevMonthButton = document.getElementById("prev-month"); 
const nextMonthButton = document.getElementById("next-month"); 
const yearSelect = document.getElementById("year"); 
const monthSelect = document.getElementById("mes"); 
const stationSelect = document.getElementById("plantel");
const startDateInput = document.getElementById("start-date"); 
const endDateInput = document.getElementById("end-date"); 
const downloadZipButton = document.getElementById("downloadZip");
const btnPlot = document.getElementById("btn_plot"); 

let currentMonth = new Date().getMonth(); // Obtiene el mes actual.
let currentYear = new Date().getFullYear(); // Obtiene el año actual.
let selectedDates = []; // Inicializa un arreglo vacío para almacenar las fechas seleccionadas.
let selectedStartDate = null; // Inicializa la fecha de inicio como null.
let selectedEndDate = null; // Inicializa la fecha de fin como null.
let currentStep = 1; // Inicializa el paso actual en 1.

//Calendario

function renderCalendar(month, year, availableDates) {
    daysContainer.innerHTML = ""; 
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    monthYearDisplay.textContent = `${monthNames[month]} ${year}`; 
    const firstDay = (new Date(year, month)).getDay(); 
    const daysInMonth = new Date(year, month + 1, 0).getDate(); 
    
    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement("div");
        emptyCell.classList.add("disabled");
        daysContainer.appendChild(emptyCell);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayCell = document.createElement("div");
        dayCell.textContent = day;

// Verifica si la fecha está disponible (tiene datos). //ERROR
        
        if (availableDates.includes(date.getDate())) {
            dayCell.classList.add("available");
            dayCell.addEventListener("click", function() {
                handleDateSelection(date); // Selección de la fecha.
            });
        } else {
            dayCell.classList.add("disabled"); // Deshabilita la celda si no tiene datos.
        }

        daysContainer.appendChild(dayCell); // Agrega la celda al contenedor de días.
    }
}

function handleDateSelection(date) {
    // Función para manejar la selección de una fecha de iNicio y final.
    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
        selectedStartDate = date;
        selectedEndDate = null;
    } else if (selectedStartDate && !selectedEndDate) {
        selectedEndDate = date;
    }
    updateSelectedDates(); // Actualiza la visualización de las fechas seleccionadas.
}

function updateSelectedDates() {
    const dayCells = daysContainer.querySelectorAll("div"); // Obtiene todas las celdas del contenedor de días.
    dayCells.forEach(cell => {
        // Elimina las clases "selected", "start-date" y "end-date" de todas las celdas.
        cell.classList.remove("selected");
        cell.classList.remove("start-date");
        cell.classList.remove("end-date");
    });

    if (selectedStartDate) {
        // Si hay fecha de inicio, la selecciona en el calendario.
        const startCell = [...dayCells].find(cell => cell.textContent == selectedStartDate.getDate());
        if (startCell) {
            startCell.classList.add("selected");
            startCell.classList.add("start-date");
        }
    }

    if (selectedEndDate) {
        // Si hay fecha de fin, la selecciona en el calendario.
        const endCell = [...dayCells].find(cell => cell.textContent == selectedEndDate.getDate());
        if (endCell) {
            endCell.classList.add("selected");
            endCell.classList.add("end-date");
        }
    }
}

//Carga las fechas en el calendario segun la estación
function updateCalendar() {
    const selectedStation = stationSelect.value; 
    if (selectedStation) {
        loadDatesForStation(selectedStation, currentYear, currentMonth); // Carga las fechas para la estación seleccionada.
    } else {
        daysContainer.innerHTML = "<div class='disabled'>No hay datos disponibles</div>"; 
    }
}

async function loadYears() {
    const years = await fetchYears(stationSelect.value); // Obtiene los años disponibles para la estación.
    yearSelect.innerHTML = "";
    years.forEach(y => {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        yearSelect.appendChild(opt);
    });
    currentStep = 2;
    hideButtons(); 
}

async function loadMonths() {
    const months = await fetchMonths(stationSelect.value, yearSelect.value); // Obtiene los meses disponibles para la estación y el año.
    monthSelect.innerHTML = ""; 
    months.forEach(m => {
        // Crea una opción para cada mes.
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m;
        monthSelect.appendChild(opt);
    });
    currentStep = 3; 
    hideButtons(); 
}

// Para las fechas disponibles
async function loadDatesForStation(stationId, year, month) {
    const dates = await fetchDays(stationId, year, month); // Obtiene las fechas disponibles.
    selectedDates = dates; // Asigna las fechas disponibles a selectedDates.
    renderCalendar(month, year, selectedDates); // El calendario muestra las fechas disponibles.
    
    // Habilita flatpickr para las fechas de inicio y fin, pero solo para las fechas disponibles.
    flatpickr(startDateInput, {
        enable: selectedDates,
        dateFormat: "Y-m-d"
    });

    flatpickr(endDateInput, {
        enable: selectedDates,
        dateFormat: "Y-m-d"
    });

    currentStep = 4;
    hideButtons(); 
}


async function fetchYears(stationId) {
    const response = await fetch(`https://ruoa.unam.mx:8042/pm_api&sid=${stationId}/get_years`); 
    if (!response.ok) {
        throw new Error("Error al obtener los años"); 
    }
    return response.json(); 
}

async function fetchMonths(stationId, year) {
    const response = await fetch(`https://ruoa.unam.mx:8042/pm_api&sid=${stationId}/get_months?year=${year}`); 
    if (!response.ok) {
        throw new Error("Error al obtener los meses"); 
    }
    return response.json(); 
}

async function fetchDays(stationId, year, month) {
    const response = await fetch(`https://ruoa.unam.mx:8042/pm_api&sid=${stationId}/get_days?year=${year}&month=${month}`); 
    if (!response.ok) {
        throw new Error("Error al obtener los días"); 
    }
    return response.json(); 
}


async function fetchZipData(startDate, endDate) {
    // Función asíncrona para obtener datos en formato ZIP.
    const stationId = stationSelect.value; // Obtiene el ID de la estación seleccionada.
    const response = await fetch('https://ruoa.unam.mx:8042/pm_api&sid=${stationId}/download_zip', {
        method: 'POST', 
        body: `startDate=${startDate}&endDate=${endDate}&sid=${stationId}` 
    });
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`); 
    }
    return await response.blob(); // Devuelve los datos como un Blob.
}

//Para moverse en el calendario

prevMonthButton.addEventListener("click", function() {
    currentMonth--; // Decrementa el mes actual.
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    updateCalendar(); 
});

nextMonthButton.addEventListener("click", function() {
    currentMonth++; 
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    updateCalendar(); 
});

renderCalendar(currentMonth, currentYear, selectedDates); 

// Rango calendario
const startYear = 2000; 
const endYear = 2030; 

hideButtons(); 

//IMPORTANTE
// Para seleccionar estación
stationSelect.addEventListener("change", async () => {
    // Carga los años disponibles para la estación seleccionada.
    await loadYears();

    // Carga los meses disponibles para la estación y el año seleccionados.
    await loadMonths();

    // Actualiza el calendario con las fechas disponibles.
    updateCalendar();
});
