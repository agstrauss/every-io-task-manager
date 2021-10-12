## Every.io Task Manager

### Setup and run

The server contains a `docker-compose` configuration. It was tested with the following versions:
```
docker: 20.10.9
docker-compose: 1.29.2
```
To run it:
```shell
docker-compose up
```
This starts the server in port `4000`.

### Running the tests

To run the integration tests inside the docker container, first get the running container name with `docker ps`
(which should be something like `every-io-task-manager_server_1`) and then run:
```shell
docker exec every-io-task-manager_server_1 npm run test:integration:coverage
```

### Running queries and mutations

To manually run queries or mutations, just head to `localhost:4000/graphql` and use [Apollo Studio](https://www.apollographql.com/docs/studio/)
