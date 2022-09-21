package main

import (
	"encoding/json"
	"log"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
)

type Entry struct {
	Id          string `json:"id"`
	Amount      int    `json:"amount"`
	Collector   string `json:"collector"`
	Date        string `json:"date"`
	Description string `json:"description"`
}

type Response struct {
	Entries []Entry `json:"entries"`
}

func Handler(req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	sess := session.Must(session.NewSessionWithOptions(session.Options{
		SharedConfigState: session.SharedConfigEnable}))
	svc := dynamodb.New(sess)
	tableName := os.Getenv("TABLE_NAME")
	if tableName == "" {
		log.Fatalf("Failed getting table name from env")
		return response("Failed retrieving entries", 500), nil
	}

	result, err := svc.Scan(&dynamodb.ScanInput{
		TableName: &tableName,
	})
	if err != nil {
		log.Fatalf("Failed getting items: %s", err)
		return response("Failed retrieving entries", 500), nil
	}

	entries := []Entry{}

	err = dynamodbattribute.UnmarshalListOfMaps(result.Items, &entries)
	log.Printf("Got items %s", result.Items)

	if err != nil {
		log.Fatalf("Got error unmarshalling: %s", err)
		return response("Failed retrieving entries", 500), nil
	}

	entriesResponse := Response{Entries: entries}
	responseJson, err := json.Marshal(entriesResponse)
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
