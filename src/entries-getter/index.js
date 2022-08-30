const AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient();

const getEntries = async () => {
  const params = {
    TableName: "skulder-debts",
  };
  const response = await docClient.scan(params).promise();
  const entries = response.Items;
  return entries;
};

// Handler
exports.handler = async function () {
  try {
    const entries = await getEntries();

    return formatResponse(201, { entries });
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
