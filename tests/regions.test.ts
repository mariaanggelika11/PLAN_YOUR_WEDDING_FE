import assert from "node:assert/strict";
import test from "node:test";
import { createRegionProvider } from "../src/shared/server/regionProvider.ts";

const data = [{ code: "31", name: "DKI Jakarta" }];
const success = () => Response.json({ data });

test("region requests share one fetch and cache only parsed successful data", async () => {
  let calls = 0;
  const provider = createRegionProvider(async (_input, init) => {
    calls++;
    assert.equal(init?.cache, "no-store");
    assert.ok(init?.signal);
    return success();
  });
  assert.deepEqual(await Promise.all([provider(), provider()]), [data, data]);
  assert.deepEqual(await provider(), data);
  assert.equal(calls, 1);
});

test("connection reset while reading body is retried before caching", async () => {
  let calls = 0;
  const provider = createRegionProvider(async () => {
    if (++calls === 1) {
      return new Response(
        new ReadableStream({
          start(controller) {
            controller.error(new TypeError("ECONNRESET"));
          },
        }),
      );
    }
    return success();
  });
  assert.deepEqual(await provider(), data);
  assert.equal(calls, 2);
});

test("upstream failure has bounded retries and cooldown, then can recover", async () => {
  let time = 100_000;
  let calls = 0;
  const provider = createRegionProvider(
    async () => {
      if (++calls <= 2) throw new TypeError("fetch failed");
      return success();
    },
    () => time,
  );
  await assert.rejects(provider());
  await assert.rejects(provider());
  assert.equal(calls, 2);
  time += 30_001;
  assert.deepEqual(await provider(), data);
});

test("expired successful data remains usable when upstream goes offline", async () => {
  let time = 100_000;
  let calls = 0;
  const provider = createRegionProvider(
    async () => {
      if (++calls > 1) throw new Error("offline");
      return success();
    },
    () => time,
  );
  await provider();
  time += 86_400_001;
  assert.deepEqual(await provider(), data);
  assert.deepEqual(await provider(), data);
  assert.equal(calls, 3);
});

test("malformed payloads are rejected and invalid province codes never call upstream", async () => {
  let calls = 0;
  const provider = createRegionProvider(async () => {
    calls++;
    return Response.json({ data: [{ code: 31, name: null }] });
  });
  await assert.rejects(provider("../provinces"));
  assert.equal(calls, 0);
  await assert.rejects(provider("31"));
  assert.equal(calls, 2);
});
