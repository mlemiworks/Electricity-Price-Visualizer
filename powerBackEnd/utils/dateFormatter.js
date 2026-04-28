// Format the dates to fit the API
// Required format is "YYYYMMDDHH00"
// For example: "202201010000" is the first of January 2022 at midnight
// This function returns an array with two formatted dates:
// 1. Date long enough before the current day to ensure that the data is available,
//    in this case 24 hours before the start of the current day seems to be enough
// 2. 48 hours after the start of the current day

const moment = require("moment-timezone");

// Timezone for Helsinki (Finnish time)
const timeZone = "Europe/Helsinki";

const formatDatesForApi = () => {
  // Current date in Finnish time
  const dateNow = moment.tz(new Date(), timeZone);

  // Start of the current day in Finnish time
  const startOfDay = moment
    .tz(
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
    )
    .toDate();

  // Related to timezones and the time prices are updated, sometimes the data is too far in the future.
  // Fetch from 24 hours earlier as a buffer.
  const startOfDay24HoursEarlier = moment(startOfDay).subtract(1, "days").toDate();
  const startDate = formatTime(startOfDay24HoursEarlier);

  // 48 hours later from the start of the day, to ensure that tomorrow's data is included.
  const aheadTime = new Date(startOfDay.getTime() + 48 * 60 * 60 * 1000);
  const endDate = formatTime(aheadTime);

  return [startDate, endDate];
};

// Format a Date to the API's required format "YYYYMMDDHH00".
// Uses UTC getters because the API expects UTC timestamps.
const formatTime = (date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0"); // +1 because months are 0-indexed in JS
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = "00"; // Always "00" as per the API requirement

  return `${year}${month}${day}${hours}${minutes}`;
};

module.exports = {
  formatDatesForApi,
};
