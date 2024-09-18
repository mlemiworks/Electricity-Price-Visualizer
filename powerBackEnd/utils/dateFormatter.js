// Format the dates  to fit the API
// Required format is "YYYYMMDDHH00"
// For example: "202201010000" is the first of January 2022 at midnight
// This function returns an array with two formatted dates:
// 1. The start of the current day
// 2. Twelve hours after the start of the current day
const formatDatesForApi = async () => {
  const dateNow = new Date();
  const startOfDay = new Date(
    dateNow.getFullYear(),
    dateNow.getMonth(),
    dateNow.getDate() - 1,
    0,
    0,
    0,
    0
  );
  const startDate = await formatTime(startOfDay);
  const twelveHoursLater = new Date(dateNow.getTime() + 1 * 60 * 60 * 1000);
  const hour12Ahead = await formatTime(twelveHoursLater);

  return [startDate, hour12Ahead];
};

// Format the date to fit the API
const formatTime = async (date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // +1 because it's indexed from 0
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = "00";
  return `${year}${month}${day}${hours}${minutes}`;
};

module.exports = {
  formatDatesForApi,
};
