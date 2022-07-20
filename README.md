# DevPrep Backend Web Service

## Purpose

DevPreps is made by developers for developers. The goal is to make a website collaboratively with the end result being a website where young and up-coming web developers may post interview recounts, project ideas, general discussions and learning content while at the same time consuming posts from others for their own benefit.

## Description

This project encompasses the backend API web service for the DevPrep web application. This web service is designed as a RESTful API on Node/Express and written in TypeScript. It communicates with the frontend application via JSON messages. This project was developed using test driven development and implements both integration and unit testing. An automated CI/CD pipeline runs via GitHub Actions on push and pull requests with branch protection on the production and staging branches to prevent arbitrary changes. This service deploys automatically to a staging environment hosted on Heroku for final end-to-end testing before being deployed to the production server.

This project was built by a team of 6 graduates of the TAFE Diploma of Website Development as both a learning experience and portfolio piece. To read more about the project please refer to the About Us page on the live site: ~LINK TO DEVPREP SITE~

## Packages

```
"dependencies": {
	"@quixo3/prisma-session-store": "^3.1.8",
	"dotenv": "^16.0.1",
	"express": "^4.18.1",
	"express-session": "^1.17.3",
	"prisma": "^4.0.0",
	"uuid": "^8.3.2"
},
"devDependencies": {
	"@types/express": "^4.17.13",
	"@types/express-session": "^1.17.5",
	"@types/jest": "^28.1.4",
	"@types/node": "^18.0.3",
	"@types/supertest": "^2.0.12",
	"@types/uuid": "^8.3.4",
	"@typescript-eslint/eslint-plugin": "^5.30.6",
	"@typescript-eslint/parser": "^5.30.6",
	"concurrently": "^7.2.2",
	"eslint": "^8.19.0",
	"eslint-config-prettier": "^8.5.0",
	"jest": "^28.1.2",
	"prettier": "2.7.1",
	"supertest": "^6.2.4",
	"ts-jest": "^28.0.5",
	"typescript": "^4.7.4"
},
"peerDependencies": {
	"eslint": ">=0.8.0"
}
```

## Installation and Configuration

#### Clone the Repository

Download the project from the [GitHub repository](https://github.com/DevPreps/backend). Enter the following command in your CLI terminal:

`git clone https://github.com/DevPreps/backend.git`

#### Install Project Dependencies

After the project has been downloaded to your local machine, you will need to navigate to the project folder and install all project dependencies:

```
cd ./backend
npm install
```

#### Set Up Local Database Client

As this project utilises the Prisma library to connect to a PostgreSQL database, you will need to download and set up a PostgreSQL database client. The official client can be downloaded [here](https://www.postgresql.org/download/). After installing the database you need to tell the project where to find the database. This is achieved via environment variables. Create a .env file in the root directory of the project and enter the PostgreSQL connection string for your database. Enter the following into the .env file replacing anything with angle brackets with values relevant for your implementation:

`DB_URL=postgres:<username>:<password>@localhost:<database-port>/<database-name>`

#### Migrate the Database Schema

At this point there is a database client but the schema hasn't been created yet. Prisma uses two options for automatically creating the database schema and adding it to the database.

##### Option 1

Running the following command will create the database schema from the ./models/schema.prisma file.

`npx prisma db push`

**_Note:_** _This command will not create migration files for tracking database migrations, updates, etc. It is designed for use in the prototyping and development stages of a project. If you need migration tracking, or are making changes to a production database, use **option 2**._

After pushing the database you need to generate the Prisma Client for the application to connect to the database:

`npx prisma generate`

##### Option 2

Running the following command will create the database schema from the ./models/schema.prisma file. This command is designed for use during development.

`npx prisma migrate dev --name <migration-version-name>`

For production environments use:

`npx prisma migrate deploy`

For more information on using `prisma migrate` refer to the Prisma docs [here](https://www.prisma.io/docs/concepts/components/prisma-migrate) and [here](https://www.prisma.io/docs/guides/database/developing-with-prisma-migrate).

After pushing the database you may need to generate the Prisma Client for the application to connect to the database:

`npx prisma generate`

### Provide Required Environment Variables

This project assumes that a number of environment variables will be present in addition to the DB_URL mentioned above. Below is a list of all of the environment variables needed for the application to operate as intended.
|Variable|Description |
|--|--|
| DB_URL | The database connection string for the PostgreSQL database. Expected Format: `DB_URL=postgres:<username>:<password>@localhost:<database-port>/<database-name>` |
| SESSION_SECRET | A randomised string for hashing session information. This variable is required by express-session. |
| PORT | [optional] You can provide a port number for the development server to run on. If not provided, the server will run on post 3000 by default. |

## Scripts

All of the scripts below can be run as development scripts independent of the CI pipeline. This means that test scripts can be run at any time they are required.

#### Format

This is a CI script for automatically formatting project files into a consistent format. This script implements Prettier under the hood to define formatting rules and automatically correct code format in line with these standards. This script forms part of the project's automated CI pipeline.

Command: `npm run format`

#### Lint

This is a CI script for checking that the syntax used in the project's codebase is correct and conforms with the chosen coding standards chosen for the project. This script forms part of the project's automated CI pipeline.

Command: `npm run lint`

#### Test

This is a CI script for testing application code using user defined tests. It implements Jest under the hood to run tests automatically and asynchronously with a set of test environment variables. This script forms part of the project's automated CI pipeline.

Command: `npm test`

When testing in development you can reduce the test workload by running a single test file. Eg. to only run the tests in the ./controllers/\_\_test\_\_/authController.test.ts file you need to run the following command (note the space between '--' and the test file name):

`npm test -- authController.test.ts`

This makes the testing feedback loop much shorter and allows you to test the code you are currently working on quickly.

#### Build

This script runs the TypeScript translator to compile the TypeScript files into CommonJS.

Command: `npm run build`

#### CI Pipeline

The scripts above form a CI pipeline for ensuring that code pushed to the GitHub repository is both in the correct format and works without breaking the existing codebase. All of these scripts have been compiled to run with a single command. This simplifies the process of running CI checks during development before pushing code changes to the GitHub repository.

Command: `npm run ci`

#### Run the Development Server

This script will compile the codebase to a ./dist directory using TypeScript and run a nodemon development server. The TypeScript --watch flag is used to provide real time feedback on type errors when a file is saved. The nodemon server will also restart the server after most updates to the codebase. This approach removes the need to continually run TypeScript checks and restart the server during development.

Command: `npm run dev`

**_Note_**: _Be aware that there are some circumstances where saving code changes does not trigger the development server to restart. If your changes are not reflected by the running server, first stop and restart the development server to ensure the latest changes have been integrated. This is a common occurrence when updating Express routes or .env file values._

#### Run the Production Server

The script below will run a Node.js server for use in the production environment.

Command: `npm start`

## CI/CD Pipeline and Version Control
