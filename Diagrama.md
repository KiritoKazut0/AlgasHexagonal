```mermaid
sequenceDiagram
    participant Cliente1
    participant Cliente2
    participant CasoDeSoObtenerPredicciones
    participant Mutex
    participant EmisorEventos
    participant RepositorioCache
    participant RepositorioEstadisticas
    participant MatematicasPrediccion
    
    Cliente1->>CasoDeSoObtenerPredicciones: ejecutar(solicitud)
    
    CasoDeSoObtenerPredicciones->>RepositorioCache: obtener(claveCache)
    RepositorioCache-->>CasoDeSoObtenerPredicciones: no hay datos en caché
    
    Note over CasoDeSoObtenerPredicciones: Primera solicitud activa
    CasoDeSoObtenerPredicciones->>Mutex: obtenerMutex(claveCache)
    Mutex-->>CasoDeSoObtenerPredicciones: mutex adquirido
    
    Note over Cliente2,CasoDeSoObtenerPredicciones: Mientras tanto...
    Cliente2->>CasoDeSoObtenerPredicciones: ejecutar(solicitud idéntica)
    CasoDeSoObtenerPredicciones->>RepositorioCache: obtener(claveCache)
    RepositorioCache-->>CasoDeSoObtenerPredicciones: no hay datos en caché
    
    Note over CasoDeSoObtenerPredicciones: Detecta solicitud activa
    CasoDeSoObtenerPredicciones->>EmisorEventos: esperarEvento('finalizado:claveCache')
    
    Note over CasoDeSoObtenerPredicciones: Continuando la primera solicitud
    CasoDeSoObtenerPredicciones->>RepositorioEstadisticas: obtenerDatosHistoricos()
    RepositorioEstadisticas-->>CasoDeSoObtenerPredicciones: datosHistoricos
    
    CasoDeSoObtenerPredicciones->>MatematicasPrediccion: calcularTendencia()
    MatematicasPrediccion-->>CasoDeSoObtenerPredicciones: tendencia
    
    CasoDeSoObtenerPredicciones->>MatematicasPrediccion: generarPredicciones()
    MatematicasPrediccion-->>CasoDeSoObtenerPredicciones: predicciones
    
    CasoDeSoObtenerPredicciones->>RepositorioCache: establecer(claveCache, respuesta)
    
    CasoDeSoObtenerPredicciones-->>Cliente1: RespuestaPredicciones
    
    Note over CasoDeSoObtenerPredicciones: Libera recursos y notifica
    CasoDeSoObtenerPredicciones->>Mutex: liberar()
    CasoDeSoObtenerPredicciones->>EmisorEventos: emitir('finalizado:claveCache')
    
    Note over CasoDeSoObtenerPredicciones: El segundo cliente recibe notificación
    EmisorEventos-->>CasoDeSoObtenerPredicciones: evento recibido (Cliente2)
    CasoDeSoObtenerPredicciones->>RepositorioCache: obtener(claveCache)
    RepositorioCache-->>CasoDeSoObtenerPredicciones: resultadoEnCache
    CasoDeSoObtenerPredicciones-->>Cliente2: RespuestaPredicciones (desde caché)

