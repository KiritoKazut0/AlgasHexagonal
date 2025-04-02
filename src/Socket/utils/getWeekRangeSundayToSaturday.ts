

const getWeekRangeSundayToSaturday = () => {
    const today = new Date();
    const dayOfWeek = today.getUTCDay(); //  getUTCDay para UTC puro

    // Calcular el domingo de la semana actual en UTC
    const sunday = new Date(today);
    sunday.setUTCDate(today.getUTCDate() - dayOfWeek); // Retrocede hasta el domingo
    sunday.setUTCHours(0, 0, 0, 0); // UTC puro

    // Calcular el sábado de la semana actual en UTC
    const saturday = new Date(sunday);
    saturday.setUTCDate(sunday.getUTCDate() + 6); // Avanza 6 días hasta sábado
    saturday.setUTCHours(23, 59, 59, 999); // UTC puro
    console.log({sunday, saturday})
    return { sunday, saturday };
};


export default getWeekRangeSundayToSaturday;