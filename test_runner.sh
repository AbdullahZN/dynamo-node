export DYNAMO_ENV=test

DYNAMODB_CONTAINER_NAME=dynamo_node_test

CONTAINER_NAME=$( (docker restart $DYNAMODB_CONTAINER_NAME) || (docker run -d --name $DYNAMODB_CONTAINER_NAME -p 8000:8000 amazon/dynamodb-local) )
echo "Started $CONTAINER container"
node testTable create
$(npm bin)/mocha --recursive tests
node testTable delete
CONTAINER_NAME=$(docker stop $DYNAMODB_CONTAINER_NAME)
echo "Killed $CONTAINER container"
