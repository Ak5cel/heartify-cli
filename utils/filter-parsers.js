const { InvalidArgumentError } = require("commander");
const { parseDateFrom, parseDateTo } = require("./datetime-parsers");

exports.parseFilters = (str, previous) => {
  let { field, val } = _extractFieldValuePair(str);

  const strFields = ["artist", "genre"];
  const dateTimeFields = ["release_date"];
  const numberFields = [
    "danceability",
    "energy",
    "key",
    "loudness",
    "mode",
    "speechiness",
    "acousticness",
    "instrumentalness",
    "liveness",
    "valence",
    "tempo",
    "duration_ms",
    "time_signature",
  ];

  if (
    !strFields.includes(field) &&
    !dateTimeFields.includes(field) &&
    !numberFields.includes(field)
  ) {
    throw new InvalidArgumentError(`Unknown filter field: ${field}`);
  }

  if (typeof val === "object") {
    // if val is an object, it will have a `from` and `to` key
    // it could be either a DateTime field or a Number field
    if (dateTimeFields.includes(field)) {
      if (val.from) val.from = parseDateFrom(val.from);
      if (val.to) val.to = parseDateTo(val.to);
    } else if (numberFields.includes(field)) {
      if (val.from) {
        if (isNaN(val.from)) {
          throw new InvalidArgumentError(
            `Invalid number in ${field} field: ${val.from}`
          );
        }
        val.from = Number(val.from);
      }
      if (val.to) {
        if (isNaN(val.to)) {
          throw new InvalidArgumentError(
            `Invalid number in ${field} field: ${val.to}`
          );
        }
        val.to = Number(val.to);
      }
    }
  } else {
    if (dateTimeFields.includes(field)) {
      const from = parseDateFrom(val);
      const to = parseDateTo(val);

      val = { from, to };
    } else if (numberFields.includes(field)) {
      if (isNaN(val)) {
        throw new InvalidArgumentError(
          `Invalid number in ${field} field: ${val}`
        );
      }
      val = Number(val);
    }
  }

  if (previous[field]) {
    if (
      !previous[field].includes(val) &&
      !previous[field].find(
        (x) => typeof x === "object" && x.from === val.from && x.to === val.to
      )
    ) {
      previous[field].push(val);
    }
  } else {
    previous[field] = [val];
  }

  return previous;
};

const _extractFieldValuePair = (str) => {
  const validFormat = /^.*\=.*$/; // string with at least one equal sign in the middle to split on
  if (!validFormat.test(str)) {
    throw new InvalidArgumentError("Filter must be of the format field=value");
  }

  let [field, val] = str.split("=");

  if (field) {
    field = field.trim();
  }
  if (val) {
    val = val.trim();
  }

  // after trimming, check field and value are non-empty
  if (!field) {
    throw new InvalidArgumentError("Field name must be non-empty");
  }

  if (!val) {
    throw new InvalidArgumentError("Field value must be non-empty");
  }

  const rangeFormat = /^\[(?<from>.*)\,(?<to>.*)\]$/;
  const squareBrackets = /^\[.*\]$/;

  if (squareBrackets.test(val) && !rangeFormat.test(val)) {
    throw new InvalidArgumentError("Range must be of the format [from,to]");
  }

  if (rangeFormat.test(val)) {
    const matches = val.match(rangeFormat);
    let { from, to } = matches.groups;

    if (from.length) {
      from = from.trim();
    }
    if (to.length) {
      to = to.trim();
    }

    val = {};

    if (from.length) {
      val.from = from;
    }

    if (to.length) {
      val.to = to;
    }

    if (!from.length && !to.length) {
      throw new InvalidArgumentError(
        "Range must contain either a `from` value or `to` value"
      );
    }
  }

  return { field, val };
};
