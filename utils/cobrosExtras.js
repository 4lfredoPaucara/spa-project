// // utils/cobrosExtras.js

// function calcularCostoExtra(fechaActual, horaActual, nuevaFecha, nuevaHora) {
//     let costo_extra = 0;
//     let motivo_extra = [];
  
//     // Verificar horario nocturno
//     const horaInt = parseInt(nuevaHora.split(':')[0]);
//     if (horaInt >= 20) {
//       costo_extra += 200;
//       motivo_extra.push("Horario nocturno");
//     }
  
//     // Verificar si reprograma con menos de 12h
//     const fechaHoraActual = new Date(`${fechaActual}T${horaActual}`);
//     const fechaHoraNueva = new Date(`${nuevaFecha}T${nuevaHora}`);
//     const diferenciaHoras = (fechaHoraNueva - fechaHoraActual) / (1000 * 60 * 60);
  
//     if (diferenciaHoras > 0 && diferenciaHoras < 12) {
//       costo_extra += 150;
//       motivo_extra.push("Reprogramación con poca anticipación");
//     }
  
//     return {
//       costo_extra,
//       motivo_extra: motivo_extra.join(" + ")
//     };
//   }
  
//   
  

function calcularCostoExtra(fechaOriginal, nuevaFecha, nuevaHora, nuevoEstado) {
    if (!nuevaHora || !nuevaFecha || !fechaOriginal || !nuevoEstado) {
      console.warn('Faltan datos para calcular costo extra');
      return 0;
    }
  
    const horaInt = parseInt(nuevaHora.split(':')[0], 10);
    const esHorarioNocturno = horaInt >= 20;
  
    const mismaFecha = fechaOriginal === nuevaFecha;
    const esReprogramacion = !mismaFecha;
    let estado = nuevoEstado === 'pendiente';
    nuevoEstado = 'reprogramado';
  
    let extra = 0;
    if (esHorarioNocturno) extra += 500;
    if (esReprogramacion) extra += 1000;
  
    return extra;
  }
  module.exports = { calcularCostoExtra };
  