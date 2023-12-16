const { generateSavedTracks } = require("./seed-helpers");
const fs = require("fs/promises");

const seed = (numTracks) => {
  const mockSavedTracks = generateSavedTracks(numTracks);

  const filePath = `${__dirname}/_data.json`;

  fs.writeFile(filePath, JSON.stringify(mockSavedTracks), "utf-8").catch(
    (err) => console.log(err)
  );
};

seed(120);
