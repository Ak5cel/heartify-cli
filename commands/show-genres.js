const { checkTablesExist, getFetchedGenres } = require("../libs/db");
const pc = require("picocolors");

exports.showGenres = () => {
  if (!checkTablesExist()) {
    console.log(
      pc.yellow("Database setup incomplete. Please run `heartify init`.")
    );
    process.exit(1);
  }

  const genres = getFetchedGenres();

  console.log(genres.length, "genres found.\n");

  const table = genres.reduce((rows, genre, index) => {
    return (
      (index % 3 === 0
        ? rows.push([genre])
        : rows[rows.length - 1].push(genre)) && rows
    );
  }, []);

  console.table(table);
};
