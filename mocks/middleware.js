const { HttpResponse } = require("msw");

exports.withAuth = (resolver) => {
  return (input) => {
    const { request } = input;
    const authHeader = request.headers.get("Authorization");

    if (!authHeader) {
      return new HttpResponse(null, { status: 401 });
    }

    const [authType, token] = authHeader.split(" ");
    if (authType !== "Bearer") {
      return new HttpResponse(null, { status: 400 });
    }

    return resolver(input);
  };
};
