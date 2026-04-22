const { requestSanitizer } = require("../src/middleware/sanitize.middleware");

describe("request sanitizer middleware", () => {
  test("sanitizes dangerous keys in body/query/params", () => {
    const req = {
      body: {
        $where: "1==1",
        nested: {
          "profile.name": "test",
        },
      },
      query: {
        "$gt": "1",
      },
      params: {
        "user.id": "abc",
      },
    };

    const next = jest.fn();

    requestSanitizer(req, {}, next);

    expect(req.body.where).toBe("1==1");
    expect(req.body.nested.profile_name).toBe("test");
    expect(req.query.gt).toBe("1");
    expect(req.params.user_id).toBe("abc");
    expect(next).toHaveBeenCalledTimes(1);
  });
});
