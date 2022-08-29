const AWS = require("aws-sdk");
// Create client outside of handler to reuse
const lambda = new AWS.Lambda();
const docClient = new AWS.DynamoDB.DocumentClient();
const { v4: uuidv4 } = require("uuid");

const writeEntry = ({ id, amount, collector, date }) => {
  const params = {
    TableName: "skulder-debts",
    Item: {
      id,
      date,
      amount,
      collector,
    },
  };
  return docClient.put(params).promise();
};

// Handler
exports.handler = async function (event) {
  try {
    const { amount, collector } = JSON.parse(event.body);
    if (!amount) {
      return formatResponse(400, { message: "Missing amount" });
    }
    if (!collector) {
      return formatResponse(400, { message: "Missing collector" });
    }

    const date = new Date();
    const id = uuidv4();
    const entry = { id, amount, collector, date: date.toISOString() };

    await writeEntry(entry);

    return formatResponse(201, { entry });
  } catch (err) {
    console.error("error", serialize(err));
    return formatResponse(500, { error: err });
  }
};

var formatResponse = function (statusCode, body) {
  var response = {
    statusCode,
    headers: {
      "Content-Type": "application/json",
    },
    isBase64Encoded: false,
    body: JSON.stringify(body),
  };
  return response;
};

var serialize = function (object) {
  return JSON.stringify(object, null, 2);
};
