import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";

export class MicroserviceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB table
    const ordersTable = new dynamodb.Table(this, "orderstable", {
      partitionKey: { name: "orderId", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // EventBridge custom bus
    const eventBus = new events.EventBus(this, "MyEventBus", {
      eventBusName: "MyEventBus",
    });

    // Orders Lambda
    const ordersLambda = new lambda.Function(this, "orderLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "orders.handler",
      code: lambda.Code.fromAsset("lambda"),
      environment: {
        ORDERS_TABLE: ordersTable.tableName,
        EVENT_BUS_NAME: eventBus.eventBusName,
      },
    });
    ordersTable.grantReadWriteData(ordersLambda);
    eventBus.grantPutEventsTo(ordersLambda); // Orders Lambda can emit events

    // Payments Lambda
    const paymentsLambda = new lambda.Function(this, "paymentsLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "payments.handler",
      code: lambda.Code.fromAsset("lambda"),
    });

    // EventBridge rule: trigger Payments Lambda on OrderCreated events
    new events.Rule(this, "PaymentEventRule", {
      eventBus: eventBus,
      eventPattern: {
        source: ["orders"],
        detailType: ["OrderCreated"],
      },
      targets: [new targets.LambdaFunction(paymentsLambda)],
    });

    // API Gateway
    const api = new apigateway.RestApi(this, "ordersapi", {
      restApiName: "Orders Service",
    });

    const ordersResource = api.root.addResource("orders");
    ordersResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(ordersLambda)
    );
    ordersResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(ordersLambda)
    );

    // Output API URL
    new cdk.CfnOutput(this, "OrdersApiEndpoint", {
      value: api.url,
      description: "Orders API endpoint",
    });
  }
}
