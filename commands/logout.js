const { dropAllTables } = require("../libs/db");
const pc = require("picocolors");

exports.logout = () => {
  process.stdout.write("Deleting access tokens and saved details...");
  dropAllTables();
  process.stdout.write(pc.green("Done.\n\n"));

  process.stdout.write("Logged out. You can now revoke access to Heartify\n");
  process.stdout.write(
    "from your Spotify Account > Security and privacy > Manage apps.\n"
  );
  process.stdout.write("\n");
  process.stdout.write("Thank you for using Heartify!\n");
  process.stdout.write(
    "If you found this small project useful, or would like\n"
  );
  process.stdout.write(
    "to contribute/report a bug/suggest features, check it out\n"
  );
  process.stdout.write(
    "on GitHub at: https://github.com/Ak5cel/heartify-cli\n"
  );
};
