export default function parseDate(inputDate) {
    const date = new Date(inputDate);
    const year = date.getFullYear();
    const padZero = (number) => (number < 10 ? `0${number}` : number);

    const month = padZero(date.getMonth() + 1);
    const day = padZero(date.getDate());
    const hours = padZero(date.getHours());
    const minutes = padZero(date.getMinutes());

    const returnDate = `${year}.${month}.${day} ${hours}:${minutes}`;
    return returnDate;
}