import {setGlobalOptions} from "firebase-functions";
import {onRequest} from "firebase-functions/https";

setGlobalOptions({maxInstances: 10});

export const getAppData = onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  // Trả về test data để kiểm tra
  res.json({
    ok: true,
    message: "API hoạt động rồi!",
    timestamp: new Date().toISOString(),
    request: {
      method: req.method,
      body: req.body,
    },
  });
});

export const submitReview = onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  res.json({
    ok: true,
    message: "Submit review API hoạt động!",
  });
});