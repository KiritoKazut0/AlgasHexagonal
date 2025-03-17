
// Función auxiliar para obtener el rango de la semana de domingo a sábado
const getWeekRangeSundayToSaturday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 es domingo, 1 es lunes, ..., 6 es sábado
    
    // Calcular el domingo de la semana actual
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - dayOfWeek); // Retrocede hasta el domingo
    sunday.setHours(0, 0, 0, 0);
    
    // Calcular el sábado de la semana actual
    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6); // Avanza 6 días hasta sábado
    saturday.setHours(23, 59, 59, 999);
    
    return { sunday, saturday };
};

export default getWeekRangeSundayToSaturday;