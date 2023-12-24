const { InvalidArgumentError } = require("commander");
const { DateTime } = require("luxon");

exports.parseDateFrom = (dateStr, dummyPrevious) => {
  const parsedDateLocal = DateTime.fromISO(dateStr);

  if (!parsedDateLocal.isValid) {
    throw new InvalidArgumentError(`Reason: ${parsedDateLocal.invalidReason}`);
  }

  const currentDateLocal = DateTime.now();
  if (parsedDateLocal > currentDateLocal) {
    throw new InvalidArgumentError(`Date should be in the past.`);
  }

  // convert the DateTime obj to the start of the day in
  // the user's local time. Then convert it to an ISO 8601 formatted
  // string in UTC to compare against results from the Spotify Web API
  // which are returned as ISO 8601 UTC strings
  return parsedDateLocal.startOf("day").toUTC().toISO();
};

exports.parseDateTo = (dateStr, dummyPrevious) => {
  const parsedDateLocal = DateTime.fromISO(dateStr);

  if (!parsedDateLocal.isValid) {
    throw new InvalidArgumentError(`Reason: ${parsedDateLocal.invalidReason}`);
  }

  const currentDateLocal = DateTime.now();
  if (parsedDateLocal > currentDateLocal) {
    throw new InvalidArgumentError(`Date should be in the past.`);
  }

  // convert the DateTime obj to the end of the day in
  // the user's local time. Then convert it to an ISO 8601 formatted
  // string in UTC to compare against results from the Spotify Web API
  // which are returned as ISO 8601 UTC strings
  return parsedDateLocal.endOf("day").toUTC().toISO();
};

exports.parseYear = (yearStr, dummyPrevious) => {
  let parsedDateLocal;

  // instead of return a DateTime obj with an isValid property set to false,
  // DateTime.fromObject throws its own error if yearStr is invalid.
  // Hence, using try..catch
  try {
    parsedDateLocal = DateTime.fromObject({ year: yearStr });
  } catch {
    throw new InvalidArgumentError(`Reason: year should be of the format YYYY`);
  }

  const currentDateLocal = DateTime.now();
  if (parsedDateLocal > currentDateLocal) {
    throw new InvalidArgumentError(`Date should be in the past.`);
  }

  const addedFrom = parsedDateLocal.startOf("year").toUTC().toISO();
  const addedTo = parsedDateLocal.endOf("year").toUTC().toISO();

  return { addedFrom, addedTo };
};
