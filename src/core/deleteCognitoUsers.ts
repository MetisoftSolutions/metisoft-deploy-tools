import _ from 'lodash';

import fs from 'fs';
import path from 'path';
import { Promise as Bluebird } from 'bluebird';
import {
  CognitoIdentityProviderClient,
  AdminDeleteUserCommand,
  ListUsersCommand
} from '@aws-sdk/client-cognito-identity-provider';



export interface ICredentials {
  accessKeyId: string;
  secretAccessKey: string;
}



function __getClient(region: string, credentials: ICredentials) {
  return new CognitoIdentityProviderClient({
    region,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey
    }
  });
}



async function __wrapCanThrowAwsError<T>(
  fn: () => Promise<T>,
  fnDestroyClient?: () => void
): Promise<T> {
  try {
    return await fn();

  } catch (err: any) {
    const message = err?.message ?? "";
    throw message;

  } finally {
    fnDestroyClient?.();
  }
}



interface IUserPage {
  paginationToken: string;
  userIds: string[];
}

async function __listUserIds(client: CognitoIdentityProviderClient, userPoolId: string) {
  return await __wrapCanThrowAwsError(async () => {
    const userIds: string[] = [];

    let page: IUserPage | null = null;
    do {
      page = await __listUsersPage(client, userPoolId, page ? page.paginationToken : undefined);
      userIds.push(...page.userIds);
    } while (!!page.paginationToken && page.userIds.length > 0);

    return _.compact(_.uniq(userIds));
  }, () => client.destroy());
}



async function __listUsersPage(client: CognitoIdentityProviderClient, userPoolId: string, paginationToken?: string): Promise<IUserPage> {
  const command = new ListUsersCommand({
    Limit: 20,
    UserPoolId: userPoolId,
    PaginationToken: paginationToken
  });

  const response = await client.send(command);

  return {
    paginationToken: response.PaginationToken ?? '',
    userIds: _.map(response.Users, user =>
      user.Username ?? '')
  };
}



async function __deleteUser(client: CognitoIdentityProviderClient, userPoolId: string, userId: string) {
  return await __wrapCanThrowAwsError(async () => {
    await client.send(new AdminDeleteUserCommand({
      UserPoolId: userPoolId,
      Username: userId
    }));
    console.log(`Deleted user ${userId}.`);
  }, () => client.destroy());
}



async function __deleteUsers(client: CognitoIdentityProviderClient, userPoolId: string, userIds: string[]) {
  await Bluebird.each(userIds, async userId =>
    await __deleteUser(client, userPoolId, userId));
}



export interface IDeleteUsersArgs {
  region: string;
  credentials: ICredentials;
  userPoolId: string;
}

export async function deleteUsers(args: IDeleteUsersArgs) {
  const client = __getClient(args.region, args.credentials);
  const userIds = await __listUserIds(client, args.userPoolId);
  await __deleteUsers(client, args.userPoolId, userIds);
}
