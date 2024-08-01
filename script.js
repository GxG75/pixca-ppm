const btn_plot = document.getElementById("btn_plot");
btn_plot.addEventListener("click", plot);
const station = document.getElementById("plantel");
const sel_year = document.getElementById("year");
const sel_month = document.getElementById("mes");
const sel_fecha = document.getElementById("Fecha");
const btn_download = document.getElementById("btn_download");
let currentStep = 1;

hideButtons();
function hideButtons() {
  station.style.display = "none";
  sel_year.style.display = "none";
  sel_month.style.display = "none";
  sel_fecha.style.display = "none";
  btn_plot.style.display = "none";
  document.getElementById("btn_download").style.display = "none";
  switch (currentStep) {
    case 1:
      station.style.display = "block";
      station.disabled = false;
      break;
    case 2:
      station.style.display = "block";
      sel_year.style.display = "block";
      station.disabled = true;
      sel_year.disabled = false;
      break;
    case 3:
      station.style.display = "block";
      sel_year.style.display = "block";
      sel_month.style.display = "block";
      station.disabled = true;
      sel_year.disabled = true;
      sel_month.disabled = false;
      break;
    case 4:
      station.style.display = "block";
      sel_year.style.display = "block";
      sel_month.style.display = "block";
      sel_fecha.style.display = "block";
      station.disabled = true;
      sel_year.disabled = true;
      sel_month.disabled = true;
      sel_fecha.disabled = false;
      break;
    case 5:
      station.style.display = "block";
      sel_year.style.display = "block";
      sel_month.style.display = "block";
      sel_fecha.style.display = "block";
      station.disabled = true;
      sel_year.disabled = true;
      sel_month.disabled = true;
      sel_fecha.disabled = true;
      btn_plot.style.display = "block";
      document.getElementById("btn_download").style.display = "block";
      break;
  }
}

async function load_years() {
  console.log('cambio', station.value);
  var year = await get_year(station.value);
  for (y of year) {
    var opt = document.createElement('option');
    opt.value = y;
    opt.innerHTML = y;
    sel_year.appendChild(opt);
  }
  currentStep = 2;
  hideButtons();
}
async function load_months() {
  console.log('cambio', sel_year.value);
  var months = await get_months(station.value, sel_year.value);
  console.log(months);
  for (m of months) {
    var opt = document.createElement('option');
    opt.value = m;
    opt.innerHTML = m;
    sel_month.appendChild(opt);
  }
  currentStep = 3;
  hideButtons();
}
async function load_dates() {
  console.log('cambio', sel_month.value);
  var dates = await get_days(station.value, sel_month.value);
  console.log(dates);
  for (d of dates) {
    var opt = document.createElement('option');
    opt.value = d;
    opt.innerHTML = d;
    sel_fecha.appendChild(opt);
  }
  currentStep = 4;
  hideButtons();
}
station.addEventListener("change", load_years);
sel_year.addEventListener("change", load_months);
sel_month.addEventListener("change", load_dates);
sel_fecha.addEventListener("change", () => {
  currentStep = 5;
  hideButtons();
});
hideButtons();

//

function getDatesInMonth(year, month) {
  // Crea una nueva fecha con el primer día del mes dado.
  const date = new Date(year, month, 1);
  // Crea un array para almacenar las fechas del mes.
  const dates = [];
  // Itera mientras el mes de la fecha sea el mismo que el mes dado.
  while (date.getMonth() === month) {
    // Agrega una copia de la fecha al array.
    dates.push(new Date(date));
    // Incrementa la fecha un día.
    // date.setDate(date.getDate() + 1);
  }
  return dates;
}

async function get_csv() {
  const sta = document.getElementById("plantel");
  sid = sta.value;
  const monthSelect = document.getElementById("mes");
  const month = parseInt(monthSelect.value, 10);
  const yearSelect = document.getElementById("year");
  const year = parseInt(yearSelect.value, 10);

  const csvData = [];


  const dates = getDatesInMonth(year, month);

  for (const date of dates) {
    // Formatea la fecha en formato ISO (AAAA-MM-DD).
    const formattedDate = date.toISOString().slice(0, 10);
    // Construye la URL para la API.
    const url = "https://ruoa.unam.mx:8042/pm_api&sid=" + sid + "&date=" + formattedDate;
    try {
      const response = await fetch(url);
      if (response.ok) {
        // Obtiene el cuerpo de la respuesta como texto.
        const body = await response.text();
        // Divide el texto en líneas.
        const lines = body.split("\n");
        // Mapea cada línea a un array de valores separados por comas.
        const data = lines.map((line) => line.split(","));
        // Agrega un objeto al array csvData, con el nombre del archivo y los datos CSV.
        csvData.push({ fileName: formattedDate + ".csv", data });
      } else {
        console.log("Error al obtener datos para la fecha:", formattedDate);
      }
    } catch (error) {
      console.error("Error en la solicitud fetch:", error);
    }
  }
  // Llama a la función createDownloadZip con el array de datos CSV.
  createDownloadZip(csvData);
}

btn_download.addEventListener("click", get_csv);

async function createDownloadZip(csvData) {

  const zip = new JSZip();
  // Itera sobre cada archivo en el array csvData.
  for (const { fileName } of csvData) {
    // Convierte el array de datos CSV a una cadena de texto.
    //const csvString = data.map((row) => row.join(",")).join("\n");
    // Agrega un archivo al ZIP con el nombre y la cadena CSV.
    zip.file(fileName);
  }
  // Genera el contenido del ZIP como un blob.
  const content = await zip.generateAsync({ type: "blob" });


  // Crea una URL para el blob.
  const url = URL.createObjectURL(content);
  // Crea un nuevo elemento <a> para descargar el archivo.
  const link = document.createElement("a");
  // Establece la URL del enlace al blob.
  link.href = url;
  // Establece el atributo "download" del enlace al nombre del archivo.
  link.setAttribute("download", "data.zip");
  // Agrega el enlace al body del documento.
  document.body.appendChild(link);
  // Clickea el enlace para iniciar la descarga.
  link.click();
  // Elimina el enlace del body del documento.
  document.body.removeChild(link);
}

//
