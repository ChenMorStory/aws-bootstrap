#!/bin/bash

# Generate a personal access token with repo and admin:repo_hook permissions from https://github.com/settings/tokens
ACCESS_TOKEN=$(cat ~/.github/access-token)
STACK_NAME=MyApp
REGION=us-west-2
CLI_PROFILE=bootstrap
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --profile $CLI_PROFILE --output text | cut -f1)
CFN_BUCKET="$STACK_NAME-cfn-$AWS_ACCOUNT_ID"
CODEPIPELINE_BUCKET="$STACK_NAME-codepipeline-$AWS_ACCOUNT_ID"

aws cloudformation deploy \
  --region $REGION \
  --profile $CLI_PROFILE \
  --stack-name $STACK_NAME-setup \
  --template-file ./deploy/cfn/setup.yml \
  --no-fail-on-empty-changeset \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    CodePipelineBucket=$CODEPIPELINE_BUCKET \
    CloudFormationBucket=$CFN_BUCKET

mkdir -p ./deploy/cfn/output

PACKAGE_ERR="$(aws cloudformation package \
  --region $REGION \
  --profile $CLI_PROFILE \
  --template ./deploy/cfn/main.yml \
  --s3-bucket $CFN_BUCKET \
  --output-template-file ./deploy/cfn/output/main.yml 2>&1)"

if ! [[ $PACKAGE_ERR =~ "Successfully packaged artifacts" ]]; then
  echo "ERROR while running 'aws cloudformation package' command:"
  echo $PACKAGE_ERR
  exit 1
fi

# Deploy the CloudFormation template
aws cloudformation deploy \
  --region $REGION \
  --profile $CLI_PROFILE \
  --stack-name $STACK_NAME \
  --template-file ./deploy/cfn/output/main.yml \
  --no-fail-on-empty-changeset \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    GitHubOwner=good-parts \
    GitHubRepo=aws-bootstrap \
    GitHubBranch=master \
    GitHubPersonalAccessToken=$ACCESS_TOKEN \
    EC2StagingInstanceType=t3.micro \
    EC2DemoInstanceType=t3.micro \
    EC2AMI=ami-082b5a644766e0e6f \
    Domain=goodparts.dev \
    Certificate=arn:aws:acm:us-west-2:154460179839:certificate/e6748161-8815-439f-a650-1a950c536e5b \
    CodePipelineBucket=$CODEPIPELINE_BUCKET
