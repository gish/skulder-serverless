package main

import (
	"encoding/json"
	"log"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/google/uuid"
)

type Entry struct {
	Id          string `json:"id"`
	Amount      int    `json:"amount"`
	Collector   string `json:"collector"`
	Date        string `json:"date"`
	Description string `json:"description"`
}

type EntryRequest struct {
	Amount      int    `json:"amount"`
	Collector   string `json:"collector"`
	Description string `json:"description"`
}

type Response struct {
	Body string
}

func Handler(req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	sess := session.Must(session.NewSessionWithOptions(session.Options{
		SharedConfigState: session.SharedConfigEnable}))
	svc := dynamodb.New(sess)
	tableName := "skulder-debts"

	var entryRequest EntryRequest
	err := json.Unmarshal([]byte(req.Body), &entryRequest)
	if err != nil {
		log.Fatalf("Error unmarshalling request %s", err)
		return response("Failed parsing request", 400), nil
	}

	id := uuid.New()
	entry := Entry{
		Id:          id.String(),
		Amount:      entryRequest.Amount,
		Collector:   entryRequest.Collector,
		Description: entryRequest.Description,
		Date:        time.Now().Format(time.RFC3339),
	}

	av, err := dynamodbattribute.MarshalMap(entry)
	if err != nil {
		log.Fatalf("Failed marshalling entryRequest: %s", err)
		return response("Failed preparing dynamodb entry", 500), nil
	}

	input := &dynamodb.PutItemInput{Item: av, TableName: aws.String(tableName)}
	_, err = svc.PutItem(input)
	if err != nil {
		log.Fatalf("Failed writing to dynamodb: %s", err)
		return response("Failed saving in dynamodb", 500), nil
	}

	responseJson, err := json.Marshal(entry)
	if err != nil {
		log.Fatalf("Got error marshalling: %s", err)
		return response("Failed marshalling entries", 500), nil
	}

	return response(string(responseJson), 200), nil
}

func response(body string, statusCode int) events.APIGatewayProxyResponse {
	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Body:       string(body),
		Headers:    map[string]string{},
	}
}

func main() {
	lambda.Start(Handler)
}
