// -------------------------- VISTA PRINCIPAL / 1RA FASE ------------------------------------//



const dataHorario = require('./horarioUltimo.json');

// Crear la tabla representando un horario en blanco, en donde colocaremos los cursos
function horarioBlanco(){
    var tabla = [];
    var tablaLinea = [];
    for(var i = 0; i < 14; i++){
        for( var j = 0; j < 6; j++){
            tablaLinea.push("");
        }
        tabla.push(tablaLinea);
        tablaLinea = [];
    }
    return tabla;
}

// -------------- Preparar la data -------------- //
// Se crean "coordenadas" para cada horario de cada sección de cada curso,
// las cuales van a representar un lugar en la tabla del horario,
// con un x representando a la hora que corresponden y un y representando el día
function crearCoordenadas(dataTable){
    for(const curso in dataTable){
        for(const sec in dataTable[curso].Secciones){
            for(var i = 0; i < dataTable[curso].Secciones[sec].length; i++){
                var diaEnNumero = cursoDia(dataTable[curso].Secciones[sec][i].Dia)
                var horasEnNumero = cursoHoras(dataTable[curso].Secciones[sec][i].Hora)
                if(dataTable[curso].Secciones[sec][i].Tipo == "P/L") dataTable[curso].Secciones[sec][i].Tipo = "P";
                dataTable[curso].Secciones[sec][i].Coordenadas = [horasEnNumero, diaEnNumero]
            }
        }
    }
}

// Convertir un día a un número del 0 al 5. Ejem: Martes -> 1
function cursoDia(dia){
    switch(dia){
        case "LU":
            return 0;
        case "MA":
            return 1;
        case "MI":
            return 2;
        case "JU":
            return 3;
        case "VI":
            return 4;
        case "SA":
            return 5;
    }
}
// Convertir una hora a un número del 0 al 13. Ejem: 10:00-11:00 -> 2
function cursoHoras(horas){
    var limInf = parseInt(horas.split("-")[0].split(":")[0]);
    var limSup = parseInt(horas.split("-")[1].split(":")[0]);
    var horasNumero = [];
    for(var i = limInf; i < limSup; i++){
        horasNumero.push(i-8);
    }
    return horasNumero
}

// -------------- Crear un horario -------------- //
// Usando un conjunto de tablas de horarios para cada curso y sección la cual se ha 
// seleccionado se crea un horario compartido en la cual se podrá observar cuando
// los cursos tienen cruce y como luciría el horario final
function horarioCompartido(conjunHorarios, arregloCursos, datatable){
    var tablita = conjunHorarios[0];
    for(var i = 0; i < tablita.length; i++){
        for(var j = 0; j < tablita[0].length; j++){
            if(tablita[i][j] != ""){
                tablita[i][j] = "1"+tablita[i][j];
            }
        }
    }
    for(var conjun = 1; conjun < conjunHorarios.length; conjun++){
        for(var i = 0; i < tablita.length; i++){
            for(var j = 0; j < tablita[0].length; j++){
                if(tablita[i][j] != "" || conjunHorarios[conjun][i][j] != ""){
                    if(tablita[i][j] != "" && conjunHorarios[conjun][i][j] != ""){
                        tablita[i][j] = tablita[i][j]+"-"+(conjun+1)+conjunHorarios[conjun][i][j];
                    }else{
                        if(tablita[i][j] != "") tablita[i][j] = tablita[i][j]
                        else tablita[i][j] = (conjun+1)+conjunHorarios[conjun][i][j]
                    }
                }
            }
        }
    }
    var noHayCruce = existeCruces(tablita, arregloCursos, datatable);
    var cumpleCiclos = CiclosConsecutivos(datatable, arregloCursos);
    if(noHayCruce && cumpleCiclos){
        var posibilidadHorario = true;
    }
    else{
        var posibilidadHorario = false;
    }
    return [posibilidadHorario, tablita]
}

// En esta función se realizará una tabla de horario para el curso seleccionado
function pintarHorarioSeccion(seccion){
    var tablita = horarioBlanco();
    for(var i = 0; i < seccion.length; i++){
        var tipo = seccion[i].Tipo;
        for(var j = 0; j < seccion[i].Coordenadas[0].length; j++){
            var x = seccion[i].Coordenadas[0][j];
            var y = seccion[i].Coordenadas[1];
            tablita[x][y] = tipo;
        }
    }
    return tablita;
}
// Se crea el conjunto de tablas de horarios que usa horarioCompartido, en la cual
// se introducira un arreglo en donde se indiquen {indiceCurso, seccionCurso}
function crearConjuntoCursos(arregloCursos, datatable){
    var cursosConvertido = [];
    for(var i = 0; i < arregloCursos.length; i++){
        cursosConvertido.push(pintarHorarioSeccion(datatable[arregloCursos[i].split("/")[0]].Secciones[arregloCursos[i].split("/")[1]]));
    }
    return cursosConvertido
}

// -------------- Depuración de horario -------------- //
// Existen los siguientes problemas al realizar el horario:
// 1. Los cursos desaprobados no se encuentran (Dependerá del usuario)
// 2. Regla de 3 ciclos consecutivos
// 3. Cruces:
// 3.1. Existen más de 2 cruces T-T
// 3.2. Existe 1 o más curces P-L, P-P, L-L

// Detecta si todos los cursos seleccionados pertenecen a 3 ciclos consecutivos
// (false = no cumple el requisito, true = cumple el requisito)
function CiclosConsecutivos(dataTable, arregloCursos){
    var ciclos = []
    for(var curso in arregloCursos){
        ciclos.push(dataTable[parseInt(arregloCursos[curso].split("/")[0])].Ciclo)
    }
    const distinct = (value, index, self) => {
        return self.indexOf(value) === index;
    }
    var ciclosDistintos = ciclos.filter(distinct)
    if(ciclosDistintos.length <= 3){
        return true
    }
    return false
}

// Detecta si hay cruces o no: (true = no hay cruce o hay cruces permitidos, false = cruces no permitidos)
function existeCruces(horarioCompleto, arregloCursos, datatable){
    var errores = [];
    var TipErrores = [0, 0];
    for(var i = 0; i < horarioCompleto.length; i++){
        for(var j = 0; j < horarioCompleto[0].length; j++){
            if(horarioCompleto[i][j] != ""){
                if(horarioCompleto[i][j].includes("-")){
                    curso1indice = parseInt(horarioCompleto[i][j].split("-")[0][0]);
                    curso2indice = parseInt(horarioCompleto[i][j].split("-")[1][0]);
                    curso1completo = encontrarCursoXIndice(arregloCursos[curso1indice-1].split("/")[0], arregloCursos[curso1indice-1].split("/")[1], datatable)
                    curso2completo = encontrarCursoXIndice(arregloCursos[curso2indice-1].split("/")[0], arregloCursos[curso2indice-1].split("/")[1], datatable)
                    // errores.push("Hay cruce entre el curso " + curso1completo.split("/")[0] + " sección " + curso1completo.split("/")[1] + " y el curso "+ curso2completo.split("/")[0] + " sección " + curso2completo.split("/")[1])
                    errores.push(horarioCompleto[i][j].split("-")[0][1]+"/"+horarioCompleto[i][j].split("-")[1][1]);
                }
            }
        }
    }
    for(var j = 0; j < errores.length; j++){
        if(errores[j] == "P/T" || errores[j] == "T/P" || errores[j] == "L/T" || errores[j] == "T/L" || errores[j] == "T/T"){
            TipErrores[0] += 1;
        }
        else if(errores[j] == "P/P" || errores[j] == "P/L" || errores[j] == "L/P" || errores[j] == "L/L"){
            TipErrores[1] += 1;
        }
    }
    if(TipErrores[1] > 0){
        return false
    }
    if(TipErrores[0] > 2){
        return false
    }
    return true
}


// -------------- Herramientas de Búsqueda -------------- //
// Se encuentra el índice en la tabla de data del
// curso al cual le corresponde el codigo y sección introducido
// Además indica si existe el curso o sección, devolviendo NA si no existen
function encontrarCursoXCodigo(codigo, seccion, dataTable){
    var codigoCursoEncontrado = "";
    var seccionCursoEncontrado = "";
    var respuesta = "";
    for(const curso in dataTable){
        if(dataTable[curso].Codigo == codigo){
            codigoCursoEncontrado = curso;
            for(const sec in dataTable[curso].Secciones){
                if(sec == seccion){
                    seccionCursoEncontrado = sec;
                }
            }
        }
    }
    if(codigoCursoEncontrado == "") respuesta = "NA";
    else respuesta = codigoCursoEncontrado;
    if(seccionCursoEncontrado == "") respuesta = respuesta + "/" + "NA";
    else respuesta = respuesta + "/" +seccionCursoEncontrado;
    return respuesta;
}
// Se encuentra el código en la tabla de data del
// curso al cual le corresponde el índice y sección introducido
// Además indica si existe el curso o sección, devolviendo NA si no existen
function encontrarCursoXIndice(codigo, seccion, dataTable){
    var codigoCursoEncontrado = "";
    var seccionCursoEncontrado = "";
    var respuesta = "";
    if(codigo < dataTable.length){
        codigoCursoEncontrado =dataTable[codigo].Codigo;
        for(const sec in dataTable[codigo].Secciones){
            if(sec == seccion){
                seccionCursoEncontrado = sec;
            }
        }
    }
    if(codigoCursoEncontrado == "") respuesta = "NA";
    else respuesta = codigoCursoEncontrado;
    if(seccionCursoEncontrado == "") respuesta = respuesta + "/" + "NA";
    else respuesta = respuesta + "/" +seccionCursoEncontrado;
    return respuesta;
}

// Crear la linea de cursos
function crearLineaCursos(arrCursos, dataTable){
    var lineaCurso = [];
    for(var i = 0; i < arrCursos.length; i++){
        lineaCurso.push(encontrarCursoXCodigo(arrCursos[i].substring(0,5),arrCursos[i].substring(5,6),dataTable));
    }
    return lineaCurso;
}


//const lineCurso = [encontrarCursoXCodigo("BMA20", "M", dataHorario),encontrarCursoXCodigo("CIB12", "N", dataHorario), encontrarCursoXCodigo("EE648", "Q", dataHorario),
//encontrarCursoXCodigo("EE458", "P", dataHorario),encontrarCursoXCodigo("EE528", "M", dataHorario),encontrarCursoXCodigo("EE530", "P", dataHorario)]

// CURSOS CON CRUCE
//lineCurso = [encontrarCursoXCodigo("BMA20", "M", dataHorario),encontrarCursoXCodigo("CIB12", "M", dataHorario), encontrarCursoXCodigo("EE648", "Q", dataHorario),
//encontrarCursoXCodigo("EE458", "O", dataHorario),encontrarCursoXCodigo("EE528", "M", dataHorario),encontrarCursoXCodigo("EE530", "M", dataHorario)]

function PRINCIPAL(lineaDeEntrada){
    linea1 = crearLineaCursos(lineaDeEntrada,dataHorario);
    crearCoordenadas(dataHorario);
    const conjunCursos = crearConjuntoCursos(linea1, dataHorario);
    var horarioCreado = horarioCompartido(conjunCursos, linea1, dataHorario);
    console.log(horarioCreado);
    return horarioCreado
}

PRINCIPAL(["BMA20M","CIB12N","EE648O","EE458O","EE528M","EE530P"]);