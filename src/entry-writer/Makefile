APP_NAME=entry-writer

.PHONY: all
all: clean build

.PHONY: clean
clean:
	@rm -f ../../bin/${APP_NAME}

build:
	@env GOOS=linux GOARCH=amd64 go build -o ../../bin/${APP_NAME} ./main.go
