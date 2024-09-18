// Format the dates  to fit the API
// Required format is "YYYYMMDDHH00"
// For example: "202201010000" is the first of January 2022 at midnight
// This function returns an array with two formatted dates:
// 1. The start of the current day
// 2. Twelve hours after the start of the current day
const moment = require("moment-timezone");

// Timezone for Helsinki (Finnish time)
const timeZone = "Europe/Helsinki";

const formatDatesForApi = async () => {
  // Current date in Finnish time
  const dateNow = moment.tz(new Date(), timeZone);

  // Start of the current day in Finnish time
  const startOfDay = moment.tz(
    {
      year: dateNow.year(),
      month: dateNow.month(),
      day: dateNow.date(),
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0,
    },
    timeZone
  );

  // Format the start of the day
  const startDate = await formatTime(startOfDay);

  // 12 hours later from the start of the day
  const twelveHoursLater = startOfDay.clone().add(12, "hours");
  const hour12Ahead = await formatTime(twelveHoursLater);

  return [startDate, hour12Ahead];
};

// Format the date to fit the API's required format "YYYYMMDDHH00"
const formatTime = async (date) => {
  const year = date.year();
  const month = String(date.month() + 1).padStart(2, "0"); // +1 because months are 0-indexed in moment
  const day = String(date.date()).padStart(2, "0");
  const hours = String(date.hours()).padStart(2, "0");
  const minutes = "00"; // Always "00" as per the requirement
  return `${year}${month}${day}${hours}${minutes}`;
};

module.exports = {
  formatDatesForApi,
};
