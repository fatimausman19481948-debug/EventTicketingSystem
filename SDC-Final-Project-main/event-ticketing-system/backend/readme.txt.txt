# Backend – AWS Lambda

## Description
This backend is implemented using AWS Lambda functions and DynamoDB,
deployed under AWS Learner Lab.

## Lambda Functions
- purchaseTickets: processes ticket purchases and updates cart/orders
- queueHandler: manages user queue
- allowUser: allows user access when conditions are met

## Database
Amazon DynamoDB tables used:
- CartTable
- CartTable2
- OrdersTable
- QueueTable
- TicketInventory

## API Gateway
REST APIs are exposed using Amazon API Gateway and connected to Lambda functions.

## Security
Environment variables are used for table names.
No AWS credentials are included in this repository.
