## Every.io Task Manager

### Setup and run

The server contains a `docker-compose` configuration. It was tested in Ubuntu with the following versions:
```
docker: 20.10.9
docker-compose: 1.29.2
```
To run it:
```shell
docker-compose -f docker-compose.prod up
```
This starts the server in port `4000` and the db in `5433`, so make sure the ports are available
(to change them, modify the docker-compose files).
---
If the image building fails when running `docker-compose up`, try building the server container first with
```shell
docker build . -f Dockerfile-prod
```
---

> :warning: **Given the scope of this POC, the DB is not persisted between docker container restarts. Also, running the tests clears the DB**

### Running queries and mutations

To create a user to be able to login, run
```shell
docker exec every-io-task-manager_server_1 npm run create-admin
```
To manually run queries or mutations, just head to `localhost:4000/graphql` and use [Apollo Studio](https://www.apollographql.com/docs/studio/)

### Running the tests

To run the test in a test container:
```shell
docker-compose -f docker-compose.test up
```

### Running npm scripts manually

Before running `npm run start` to quickly start the server, you must run `npm run graphql:generate` to generate the Typescript
types for the `.graphql` files.
