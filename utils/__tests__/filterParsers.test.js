const { InvalidArgumentError } = require("commander");
const { DateTime } = require("luxon");
const { parseFilters } = require("../filterParsers");

describe("parseFilters()", () => {
  describe("case: singular values field=value (assuming string type)", () => {
    test("should return a reference to the same object as the previous filter", () => {
      const testPrevious = {};

      expect(parseFilters("artist=value", testPrevious)).toBe(testPrevious);
    });
    test("should add the new field to the previous filter", () => {
      const testPrevious = { field1: ["test"] };
      const testStr = "artist=test2";

      expect(parseFilters(testStr, testPrevious)).toMatchObject({
        field1: ["test"],
        artist: expect.any(Array),
      });
    });
    test("should initialise the field as an array containing the value to the right of the equal sign", () => {
      const testPrevious = { field1: ["test"] };
      const testStr = "artist=test2";

      expect(parseFilters(testStr, testPrevious)).toMatchObject({
        field1: ["test"],
        artist: ["test2"],
      });
    });
    test("should append the value for an existing field", () => {
      const testPrevious = { artist: ["test"] };
      const testStr = "artist=test2";

      expect(parseFilters(testStr, testPrevious)).toMatchObject({
        artist: ["test", "test2"],
      });
    });
    test("should trim trailing whitespaces from the value passed", () => {
      const testPrevious = {};
      const testStr = " artist =  value with spaces  ";

      expect(parseFilters(testStr, testPrevious)).toMatchObject({
        artist: ["value with spaces"],
      });
    });
    test("should not append duplicate values to the same field array", () => {
      const testPrevious = { artist: ["test"] };
      const testStr = "artist = test";

      expect(parseFilters(testStr, testPrevious)).toMatchObject({
        artist: ["test"],
      });
    });
    test("should throw InvalidArgumentError when passed an empty string (after removing whitespaces", () => {
      expect(() => {
        parseFilters("", {});
      }).toThrow(InvalidArgumentError);
      expect(() => {
        parseFilters(" ", {});
      }).toThrow(InvalidArgumentError);
      expect(() => {
        parseFilters("emptyValue= ", {});
      }).toThrow(new InvalidArgumentError("Field value must be non-empty"));
      expect(() => {
        parseFilters(" =emptyKey", {});
      }).toThrow(new InvalidArgumentError("Field name must be non-empty"));
    });
    test("should throw InvalidArgumentError if the str does not match the format str1=str2", () => {
      expect(() => {
        parseFilters("field:value", {});
      }).toThrow(
        new InvalidArgumentError("Filter must be of the format field=value")
      );
      expect(() => {
        parseFilters("field, value", {});
      }).toThrow(
        new InvalidArgumentError("Filter must be of the format field=value")
      );
      expect(() => {
        parseFilters("field::value", {});
      }).toThrow(
        new InvalidArgumentError("Filter must be of the format field=value")
      );
      expect(() => {
        parseFilters("field-value", {});
      }).toThrow(
        new InvalidArgumentError("Filter must be of the format field=value")
      );
    });
  });

  describe("case: singular values field=value (DateTime values)", () => {
    test("should initialise the field as an arr with an object having `from` and `to` keys", () => {
      const testPrevious = {};
      const testStr = "released_on=2023-01-01";

      expect(parseFilters(testStr, testPrevious)).toMatchObject({
        released_on: [{ from: expect.any(String), to: expect.any(String) }],
      });
    });
    test("should set `from` as start of the day and `to` as end of the day", () => {
      const testPrevious = {};
      const testStr = "released_on=2023-01-01";
      const datetime = DateTime.fromISO("2023-01-01");

      expect(parseFilters(testStr, testPrevious)).toMatchObject({
        released_on: [
          {
            from: datetime.startOf("day").toUTC().toISO(),
            to: datetime.endOf("day").toUTC().toISO(),
          },
        ],
      });
    });
    test("should append a new `from`/`to` obj to the array for an existing field", () => {
      const testPrevious = { released_on: [{ from: "x", to: "y" }] };
      const testStr = "released_on=2023-01-01";
      const datetime = DateTime.fromISO("2023-01-01");

      expect(parseFilters(testStr, testPrevious)).toMatchObject({
        released_on: [
          { from: "x", to: "y" },
          {
            from: datetime.startOf("day").toUTC().toISO(),
            to: datetime.endOf("day").toUTC().toISO(),
          },
        ],
      });
    });
    test("should not append duplicate obj to the array for an existing field", () => {
      const date = "2023-01-01";
      const datetime = DateTime.fromISO(date);
      const from = datetime.startOf("day").toUTC().toISO();
      const to = datetime.endOf("day").toUTC().toISO();

      const testPrevious = { released_on: [{ from, to }] };
      const duplicateTestStr = `released_on=${date}`;

      expect(parseFilters(duplicateTestStr, testPrevious)).toMatchObject({
        released_on: [{ from, to }],
      });
    });
  });

  describe("case: singular values field=value (numerical values)", () => {
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
    test.each(numberFields)(
      "should cast the value of %p to a number",
      (numberField) => {
        const testPrevious = {};
        const testStr = `${numberField}=0`;

        expect(parseFilters(testStr, testPrevious)).toMatchObject({
          [numberField]: [expect.any(Number)],
        });
      }
    );
  });

  describe("case: ranges field=[a,b] | [a,] | [,b] (assuming numerical values)", () => {
    test("should set the field with `from` and `to` to keys when passed a range [a,b]", () => {
      const testPrevious = {};
      const testStr = "tempo=[60,80]";

      expect(parseFilters(testStr, testPrevious)).toMatchObject({
        tempo: [{ from: expect.any(Number), to: expect.any(Number) }],
      });
    });
    test("should set the field with only the `from` key when passed a range [a, ]", () => {
      const testPrevious = {};
      const testStr = "tempo=[60, ]";

      expect(parseFilters(testStr, testPrevious)).toEqual(
        expect.objectContaining({
          tempo: [{ from: expect.any(Number) }],
        })
      );
    });
    test("should set the field with only the `to` key when passed a range [,b]", () => {
      const testPrevious = {};
      const testStr = "tempo=[,80]";

      expect(parseFilters(testStr, testPrevious)).toEqual(
        expect.objectContaining({
          tempo: [{ to: expect.any(Number) }],
        })
      );
    });
    // test.todo(
    //   "should overwrite the `from` and `to` values if passed a new range for the same field"
    // );
    test("should throw InvalidArgumentError if from and to values are absent (after trimming whitespaces) like [,]", () => {
      expect(() => {
        parseFilters("tempo=[  , ]", {});
      }).toThrow(
        new InvalidArgumentError(
          "Range must contain either a `from` value or `to` value"
        )
      );
    });
    test("should not throw InvalidArgumentError if a range value is zero", () => {
      const testStr = "tempo=[0, 60]";

      expect(() => {
        parseFilters(testStr, {});
      }).not.toThrow(InvalidArgumentError);

      expect(parseFilters(testStr, {})).toMatchObject({
        tempo: [{ from: 0, to: expect.any(Number) }],
      });
    });
    test("should throw InvalidArgumentError if the range value doesn't match the format [str1,str2]", () => {
      expect(() => {
        parseFilters("tempo=[60]", {});
      }).toThrow(
        new InvalidArgumentError("Range must be of the format [from,to]")
      );
      expect(() => {
        parseFilters("tempo=[60:80]", {});
      }).toThrow(
        new InvalidArgumentError("Range must be of the format [from,to]")
      );
      expect(() => {
        parseFilters("tempo=[60-80]", {});
      }).toThrow(
        new InvalidArgumentError("Range must be of the format [from,to]")
      );
    });
  });

  describe("case: ranges field=[a,b] | [a,] | [,b] (DateTime values)", () => {
    test("should set `from` key as DateTime at start of the day given", () => {
      const testStr = "released_on=[2023-01-01,2023-12-31]";
      const datetime = DateTime.fromISO("2023-01-01");

      expect(parseFilters(testStr, {})).toMatchObject({
        released_on: [
          {
            from: datetime.startOf("day").toUTC().toISO(),
            to: expect.any(String),
          },
        ],
      });
    });
    test("should set `to` key as DateTime at the end of the day given", () => {
      const testStr = "released_on=[2023-01-01,2023-12-31]";
      const datetime = DateTime.fromISO("2023-12-31");

      expect(parseFilters(testStr, {})).toMatchObject({
        released_on: [
          {
            from: expect.any(String),
            to: datetime.endOf("day").toUTC().toISO(),
          },
        ],
      });
    });
  });

  describe("case: handling invalid fields", () => {
    test("should throw InvalidArgumentError when passed a field that doesn't support filtering", () => {
      expect(() => {
        parseFilters("someField=value", {});
      }).toThrow(new InvalidArgumentError("Unknown filter field: someField"));
    });
    test("should throw InvalidArgumentError when passed a non-parseable value for a numerical field", () => {
      expect(() => {
        parseFilters("tempo=notANumber", {});
      }).toThrow(
        new InvalidArgumentError("Invalid number in tempo field: notANumber")
      );

      expect(() => {
        parseFilters("tempo=[notANumber, 80]", {});
      }).toThrow(
        new InvalidArgumentError("Invalid number in tempo field: notANumber")
      );

      expect(() => {
        parseFilters("tempo=[60, notANumber]", {});
      }).toThrow(
        new InvalidArgumentError("Invalid number in tempo field: notANumber")
      );
    });
    test("should throw InvalidArgumentError when passed a non-parseable value for a DateTime field", () => {
      expect(() => {
        parseFilters("released_on=notADate", {});
      }).toThrow(InvalidArgumentError);
      expect(() => {
        parseFilters("released_on=notADate", {});
        // using luxon for validating dates, the error reason contains the word 'unparsable'
      }).toThrow(/unparsable/);

      expect(() => {
        parseFilters("released_on=[notADate,]", {});
      }).toThrow(InvalidArgumentError);
      expect(() => {
        parseFilters("released_on=[notADate,]", {});
      }).toThrow(/unparsable/);

      expect(() => {
        parseFilters("released_on=[,notADate]", {});
      }).toThrow(InvalidArgumentError);
      expect(() => {
        parseFilters("released_on=[,notADate]", {});
      }).toThrow(/unparsable/);
    });
  });
});
