function findDateDiff(date1, date2) {
    //Get 1 day in milliseconds
    const one_day = 1000 * 60 * 60 * 24;

    // Convert both dates to milliseconds
    let date1_ms = date1.getTime();
    let date2_ms = date2.getTime();

    // Calculate the difference in milliseconds
    let difference_ms = date2_ms - date1_ms;
    //take out milliseconds
    difference_ms = difference_ms / 1000;
    let seconds = Math.floor(difference_ms % 60);
    difference_ms = difference_ms / 60;
    let minutes = Math.floor(difference_ms % 60);
    difference_ms = difference_ms / 60;
    let hours = Math.floor(difference_ms % 24);
    let days = Math.floor(difference_ms / 24);

    return days + ' days, ' + hours + ' hours, ' + minutes + ' minutes, and ' + seconds + ' seconds';
}

module.exports = findDateDiff;