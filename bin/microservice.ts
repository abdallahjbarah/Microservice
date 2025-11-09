#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { MicroserviceStack } from "../lib/microservice-stack";

const app = new cdk.App();
new MicroserviceStack(app, "MicroserviceStack");
