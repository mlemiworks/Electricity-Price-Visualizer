// Format the dates  to fit the API
// Required format is "YYYYMMDDHH00"
// For example: "202201010000" is the first of January 2022 at midnight
// This function returns an array with two formatted dates:
// 1. Date long enough before the current day to ensure that the data is available,
//    in this case 24 hours before the start of the current day seems to be enough
// 2. Twelve hours after the start of the current day

const moment = require("moment-timezone");

// Timezone for Helsinki (Finnish time)
const timeZone = "Europe/Helsinki";

// Format the dates to fit the API
// Required format is "YYYYMMDDHH00"
const formatDatesForApi = async () => {
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
    .toDate(); // Convert to native Date object

  // Related to timezones and the time prices are updated, sometimes the data is too far in the future
  // In this case, we need to fetch the data from the previous day, so we have a buffer of 12 hours or so.
  const startOfDay24HoursEarlier = moment(startOfDay)
    .subtract(1, "days")
    .toDate();
  const startDate = await formatTime(startOfDay24HoursEarlier);

  // 48 hours later from the start of the day, to ensure that the data is available.
  const aheadTime = new Date(startOfDay.getTime() + 48 * 60 * 60 * 1000); // Add 48 hours in milliseconds
  const endDate = await formatTime(aheadTime);

  return [startDate, endDate];
};

// Format the date to fit the API's required format "YYYYMMDDHH00"
const formatTime = async (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // +1 because months are 0-indexed in JS
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = "00"; // Always "00" as per the API requirement

  return `${year}${month}${day}${hours}${minutes}`;
};

module.exports = {
  formatDatesForApi,
};
