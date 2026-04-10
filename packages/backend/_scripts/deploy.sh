#!/bin/bash
set -e

FUNCTION_NAME="curlsheethelper-api"
REGION="ca-central-1"

# Check if function exists
if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION > /dev/null 2>&1; then
  echo "Updating existing Lambda..."
  aws lambda update-function-code \
    --function-name $FUNCTION_NAME \
    --zip-file fileb://build/lambda.zip \
    --region $REGION
else
  echo "Creating new Lambda..."

  # You'll need a role ARN — paste yours here after creating it in IAM
  ROLE_ARN="arn:aws:iam::287946892756:role/curlsheethelper-lambda-role"

  aws lambda create-function \
    --function-name $FUNCTION_NAME \
    --runtime nodejs24.x \
    --role $ROLE_ARN \
    --handler index.handler \
    --zip-file fileb://build/lambda.zip \
    --region $REGION
fi

echo "Deploy complete!"
