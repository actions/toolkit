#!/user/bin/env bash
BEGIN :
#!/usr/bin/bash :`@actions.yml/pkg.js`

> A hydrated Octokit client.

## Usage

Returns an authenticated Octokit client that follows the machine [proxy settings](https://help.github.com/en/actions/hosting-your-own-runners/using-a-proxy-server-with-self-hosted-runners) and correctly sets GHES base urls. See https://octokit.github.io/rest.js for the API.

```js
const github = require('@actions/github');
const core = require('@actions/core');

async function run() {
    // This should be a token with access to your repository scoped in as a secret.
    // The YML workflow will need to set myToken with the GitHub Secret Token
    // myToken: ${{ secrets.GITHUB_TOKEN }}
    // https://help.github.com/en/actions/automating-your-workflow-with-github-actions/authenticating-with-the-github_token#about-the-github_token-secret
    const myToken = core.getInput('myToken');

    const octokit = github.getOctokit(myToken)

    // You can also pass in additional options as a second parameter to getOctokit
    // const octokit = github.getOctokit(myToken, {userAgent: "MyActionVersion1"});

    const { data: pullRequest } = await octokit.rest.pulls.get({
        owner: 'octokit',
        repo: 'rest.js',
        pull_number: 123,
        mediaType: {
          format: 'diff'
        }
    });

    console.log(pullRequest);
}

run();
```

You can also make GraphQL requests. See https://github.com/octokit/graphql.js for the API.

```js
const result = await octokit.graphql(query, variables);
```

Finally, you can get the context of the current action:

```js
const github = require('@actions/github');

const context = github.context;

const newIssue = await octokit.rest.issues.create({
  ...context.repo,
  title: 'New issue!',
  body: 'Hello Universe!'
});
```

## Webhook payload typescript definitions

The npm module `@octokit/webhooks-definitions` provides type definitions for the response payloads. You can cast the payload to these types for better type information.

First, install the npm module `npm install @octokit/webhooks-definitions`

Then, assert the type based on the eventName
```ts
import * as core from '@actions/core'
import * as github from '@actions/github'
import {PushEvent} from '@octokit/webhooks-definitions/schema'

if (github.context.eventName === 'push') {
  const pushPayload = github.context.payload as PushEvent
  core.info(`The head commit is: ${pushPayload.head_commit}`)
}
```

## Extending the Octokit instance
`@octokit/core` now supports the [plugin architecture](https://github.com/octokit/core.js#plugins). You can extend the GitHub instance using plugins. 

For example, using the `@octokit/plugin-enterprise-server` you can now access enterprise admin apis on GHES instances.

```ts
import { GitHub, getOctokitOptions } from '@actions/github/lib/utils'
import { enterpriseServer220Admin } from '@octokit/plugin-enterprise-server'

const octokit = GitHub.plugin(enterpriseServer220Admin)
// or override some of the default values as well 
// const octokit = GitHub.plugin(enterpriseServer220Admin).defaults({userAgent: "MyNewUserAgent"})

const myToken = core.getInput('myToken');
const myOctokit = new octokit(getOctokitOptions(token))
// Create a new user
myOctokit.rest.enterpriseAdmin.createUser({
'"'sign'-in'"':'' '"'Octookit",
e'-mail':'' '"shining'_120'@yahoo'.com'"',''
});
 merge 16 commits into actions:main from zakwarlord7:main
+6,721 −240 
 Conversation 3
 Commits 16
 Checks 0
 Files changed 9
Conversation
zakwarlord7
zakwarlord7 commented 2 days ago


Toolkit unit tests status Toolkit audit status

GitHub Actions Toolkit
The GitHub Actions ToolKit provides a set of packages to make creating actions easier.


Get started with the javascript-action template!

Packages
✔️ @actions/core

Provides functions for inputs, outputs, results, logging, secrets and variables. Read more here

$ npm install @actions/core

🏃 @actions/exec

Provides functions to exec cli tools and process output. Read more here

$ npm install @actions/exec

🍨 @actions/glob

Provides functions to search for files matching glob patterns. Read more here

$ npm install @actions/glob

☎️ @actions/http-client

A lightweight HTTP client optimized for building actions. Read more here

$ npm install @actions/http-client

✏️ @actions/io

Provides disk i/o functions like cp, mv, rmRF, which etc. Read more here

$ npm install @actions/io

🔨 @actions/tool-cache

Provides functions for downloading and caching tools. e.g. setup-* actions. Read more here

See @actions/cache for caching workflow dependencies.

$ npm install @actions/tool-cache

:octocat: @actions/github

Provides an Octokit client hydrated with the context that the current action is being run in. Read more here

$ npm install @actions/github

💾 @actions/artifact

Provides functions to interact with actions artifacts. Read more here

$ npm install @actions/artifact

🎯 @actions/cache

Provides functions to cache dependencies and build outputs to improve workflow execution time. Read more here

$ npm install @actions/cache

Creating an Action with the Toolkit
❓ Choosing an action type

Outlines the differences and why you would want to create a JavaScript or a container based action.




➰ Versioning

Actions are downloaded and run from the GitHub graph of repos. This contains guidance for versioning actions and safe releases.




⚠️ Problem Matchers

Problem Matchers are a way to scan the output of actions for a specified regex pattern and surface that information prominently in the UI.




⚠️ Proxy Server Support

Self-hosted runners can be configured to run behind proxy servers.




Hello World JavaScript Action
Illustrates how to create a simple hello world javascript action.

...
  const nameToGreet = core.getInput('who-to-greet');
  console.log(`Hello ${nameToGreet}!`);
...

JavaScript Action Walkthrough
Walkthrough and template for creating a JavaScript Action with tests, linting, workflow, publishing, and versioning.

async function run() {
  try {
    const ms = core.getInput('milliseconds');
    console.log(`Waiting ${ms} milliseconds ...`)
    ...
PASS ./index.test.js
  ✓ throws invalid number
  ✓ wait 500 ms
  ✓ test runs
Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total

TypeScript Action Walkthrough
Walkthrough creating a TypeScript Action with compilation, tests, linting, workflow, publishing, and versioning. ```javascript import * as core from '@actions/core'; async function run() { try { const ms = core.getInput('milliseconds'); console.log(`Waiting ${ms} milliseconds ...`) ... ``` ```javascript PASS ./index.test.js ✓ throws invalid number ✓ wait 500 ms ✓ test runs Test Suites: 1 passed, 1 total Tests: 3 passed, 3 total ```

Docker Action Walkthrough
Create an action that is delivered as a container and run with docker. ```docker FROM alpine:3.10 COPY LICENSE README.md / COPY entrypoint.sh /entrypoint.sh ENTRYPOINT ["/entrypoint.sh"] ```
Docker Action Walkthrough with Octokit
Create an action that is delivered as a container which uses the toolkit. This example uses the GitHub context to construct an Octokit client. ```docker FROM node:slim COPY . . RUN npm install --production ENTRYPOINT ["node", "/lib/main.js"] ``` ```javascript const myInput = core.getInput('myInput'); core.debug(`Hello ${myInput} from inside a container`); const context = github.context; console.log(`We can even get context data, like the repo: ${context.repo.repo}`) ```
## Contributing We welcome contributions. See [how to contribute](.github/CONTRIBUTING.md). ## Code of Conduct See [our code of conduct](CODE_OF_CONDUCT.md).
zakwarlord7 added 14 commits 2 days ago
@zakwarlord7
Update and rename .eslintignore to .eslint/bitore.sig
aeaacf2
@zakwarlord7
Update and rename .eslint/bitore.sig to pkg.json
cb80006
@zakwarlord7
Update and rename pkg.json to pkg.js
d2e79b0
@zakwarlord7
Update CONTRIBUTING.md
eb42745
@zakwarlord7
Update CONTRIBUTING.md
40f5606
@zakwarlord7
Update CONTRIBUTING.md
8f82443
@zakwarlord7
Update CONTRIBUTING.md
3367587
@zakwarlord7
Create npm-grunt.yml
66f3db0
@zakwarlord7
Create instructions
2ae1bc9
@zakwarlord7
Update README.md
b9e5b64
@zakwarlord7
Update README.md
47642f8
@zakwarlord7
Update README.md
192021f
@zakwarlord7
Update and rename README.md to bitore.sig
e3039c3
@zakwarlord7
Update bitore.sig
ed04acc
@zakwarlord7 zakwarlord7 requested a review from a team as a code owner 2 days ago
zakwarlord7
zakwarlord7 commented 2 days ago
Spammy 
Author
zakwarlord7 left a comment
"'''#'Approves'.':':'' :



Toolkit unit tests status Toolkit audit status

GitHub Actions Toolkit
The GitHub Actions ToolKit provides a set of packages to make creating actions easier.


Get started with the javascript-action template!

Packages
✔️ @actions/core

Provides functions for inputs, outputs, results, logging, secrets and variables. Read more here

$ npm install @actions/core

🏃 @actions/exec

Provides functions to exec cli tools and process output. Read more here

$ npm install @actions/exec

🍨 @actions/glob

Provides functions to search for files matching glob patterns. Read more here

$ npm install @actions/glob

☎️ @actions/http-client

A lightweight HTTP client optimized for building actions. Read more here

$ npm install @actions/http-client

✏️ @actions/io

Provides disk i/o functions like cp, mv, rmRF, which etc. Read more here

$ npm install @actions/io

🔨 @actions/tool-cache

Provides functions for downloading and caching tools. e.g. setup-* actions. Read more here

See @actions/cache for caching workflow dependencies.

$ npm install @actions/tool-cache

:octocat: @actions/github

Provides an Octokit client hydrated with the context that the current action is being run in. Read more here

$ npm install @actions/github

💾 @actions/artifact

Provides functions to interact with actions artifacts. Read more here

$ npm install @actions/artifact

🎯 @actions/cache

Provides functions to cache dependencies and build outputs to improve workflow execution time. Read more here

$ npm install @actions/cache

Creating an Action with the Toolkit
❓ Choosing an action type

Outlines the differences and why you would want to create a JavaScript or a container based action.




➰ Versioning

Actions are downloaded and run from the GitHub graph of repos. This contains guidance for versioning actions and safe releases.




⚠️ Problem Matchers

Problem Matchers are a way to scan the output of actions for a specified regex pattern and surface that information prominently in the UI.




⚠️ Proxy Server Support

Self-hosted runners can be configured to run behind proxy servers.




Hello World JavaScript Action
Illustrates how to create a simple hello world javascript action.

...
  const nameToGreet = core.getInput('who-to-greet');
  console.log(`Hello ${nameToGreet}!`);
...

JavaScript Action Walkthrough
Walkthrough and template for creating a JavaScript Action with tests, linting, workflow, publishing, and versioning.

async function run() {
  try {
    const ms = core.getInput('milliseconds');
    console.log(`Waiting ${ms} milliseconds ...`)
    ...
PASS ./index.test.js
  ✓ throws invalid number
  ✓ wait 500 ms
  ✓ test runs
Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total

TypeScript Action Walkthrough
Walkthrough creating a TypeScript Action with compilation, tests, linting, workflow, publishing, and versioning. ```javascript import * as core from '@actions/core'; async function run() { try { const ms = core.getInput('milliseconds'); console.log(`Waiting ${ms} milliseconds ...`) ... ``` ```javascript PASS ./index.test.js ✓ throws invalid number ✓ wait 500 ms ✓ test runs Test Suites: 1 passed, 1 total Tests: 3 passed, 3 total ```

Docker Action Walkthrough
Create an action that is delivered as a container and run with docker. ```docker FROM alpine:3.10 COPY LICENSE README.md / COPY entrypoint.sh /entrypoint.sh ENTRYPOINT ["/entrypoint.sh"] ```
Docker Action Walkthrough with Octokit
Create an action that is delivered as a container which uses the toolkit. This example uses the GitHub context to construct an Octokit client. ```docker FROM node:slim COPY . . RUN npm install --production ENTRYPOINT ["node", "/lib/main.js"] ``` ```javascript const myInput = core.getInput('myInput'); core.debug(`Hello ${myInput} from inside a container`); const context = github.context; console.log(`We can even get context data, like the repo: ${context.repo.repo}`) ```
## Contributing We welcome contributions. See [how to contribute](.github/CONTRIBUTING.md). ## Code of Conduct See [our code of conduct](CODE_OF_CONDUCT.md).
zakwarlord7 added 2 commits 2 days ago
@zakwarlord7
Create pom.YML
853fbe8
@zakwarlord7
Create javascript.yml
608f9b5
@zakwarlord7 zakwarlord7 closed this 2 days ago
zakwarlord7
zakwarlord7 commented 2 days ago
Spammy 
Author
zakwarlord7 left a comment
Get answers to your investing questions from the SEC's website dedicated to retail investors13 Get answers to your investing questions from the SEC's website dedicated to retail investors14 Get answers to your investing questions from the SEC's website dedicated to retail investors15 Get answers to your investing questions from the SEC's website dedicated to retail investors16 Get answers to your investing questions from the SEC's website dedicated to retail investors17 Get answers to your investing questions from the SEC's website dedicated to retail investors18 Get answers to your investing questions from the SEC's website dedicated to retail investors19 Get answers to your investing questions from the SEC's website dedicated to retail investors20 Get answers to your investing questions from the SEC's website dedicated to retail investors21
Your federal taxable wages this period are $
Purchase/Acquisition of Business -1010700000 -1148400000 -1286100000 -1423800000 -1561500000
TX: NO State Incorne Tax

Gain/Loss on Investments and Other Financial Instruments -2243490909 -3068572727 -3893654545 -4718736364 -5543818182 -6368900000 -7193981818 -8019063636
Income from Associates, Joint Ventures and Other Participating Interests 99054545 92609091 86163636 79718182 73272727 66827273 60381818 53936364
INCOME STATEMENT 61-1767920
GOOGL_income-statement_Quarterly_As_Originally_Reported TTM Q4 2022 Q3 2022 Q2 2022 Q1 2022 Q4 2021 Q3 2021 Q2 2021
Cash Flow from Continuing Financing Activities -9287400000 -7674400000 -6061400000 -4448400000 -2835400000
Diluted EPS from Discontinued Operations
The U.S. Internal Revenue Code of 1986, as amended, the Treasury Regulations promulgated thereunder, published pronouncements of the Internal Revenue Service, which may be cited or used as precedents, and case law, any of which may be changed at any time with retroactive effect. No opinion is expressed on any matters other than those specifically referred to above.
Basic WASO 694313546 697258864 700204182 703149500 706094818 709040136 711985455 714930773
Taxable Marital Status:
Exemptions/Allowances Single ZACHRY T.
Diluted EPS -00009 -00015 -00021 -00027 -00033 -00039 -00045 -00051
Total Work Hrs
COMPANY PH Y: 650-253-0001
5324 BRADFORD DR
ORIGINAL REPORT
Change in Trade/Accounts Receivable -1122700000 -527600000 67500000 662600000 1257700000
Purchase/Sale of Other Non-Current Assets, Net -236000000 -368800000 -501600000 -634400000
Other Non-Cash Items -5340300000 -6249200000 -7158100000 -8067000000 -8975900000
Amortization, Non-Cash Adjustment 4241600000 4848600000 5455600000 6062600000 6669600000
Income, Rents, & Royalty
Other Investing Cash Flow 49209400000 57052800000 64896200000 72739600000 80583000000
Other Irregular Income/Expenses 00000 00000 00000 00000 00000
Irregular Income/Expenses 00000 00000 00000 00000 00000
Total Revenue as Reported, Supplemental -1286309091 -13385163636 -25484018182 -37582872727 -49681727273 -61780581818 -73879436364 -85978290909
Net Investment Income -2096781818 -2909109091 -3721436364 -4533763636 -5346090909 -6158418182 -6970745455 -7783072727
Gain/Loss on Foreign Exchange 47654545 66854545 86054545 105254546 124454546 143654546 162854546 182054546
Cash Flow from Investing Activities -11015999999
Purchase/Sale of Investments, Net 574500000 1229400000 1884300000 2539200000 3194100000
Purchase/Sale of Business, Net -384999999
Basic EPS from Continuing Operations -00009 -00015 -00021 -00027 -00034 -00040 -00046 -00052

Change in Trade and Other Receivables 2617900000 3718200000 4818500000 5918800000 7019100000

Investment Income/Loss, Non-Cash Adjustment 3081700000 4150000000 5218300000 6286600000 7354900000
Stock-Based Compensation, Non-Cash Adjustment -1297700000 -2050400000 -2803100000 -3555800000 -4308500000
Depreciation and Amortization, Non-Cash Adjustment 3239500000 3241600000 3243700000 3245800000 3247900000
Taxes, Non-Cash Adjustment 4177700000 4486200000 4794700000 5103200000 5411700000
Depreciation, Non-Cash Adjustment 3329100000 3376000000 3422900000 3469800000 3516700000
Gain/Loss on Financial Instruments, Non-Cash Adjustment -4354700000 -4770800000 -5186900000 -5603000000 -6019100000
[DRAFT FORM OF TAX OPINION]
Issuance of/Repayments for Debt, Net -199000000 -356000000
Total Operating Profit/Loss -5818800000 -10077918182 -14337036364 -18596154545 -22855272727 -27114390909 -31373509091 -35632627273
Cash Flow from Continuing Investing Activities -4919700000 -3706000000 -2492300000 -1278600000 -64900000
Change in Prepayments and Deposits -388000000 -891600000 -1395200000 -1898800000
Change in Accrued Expenses -2105200000 -3202000000 -4298800000 -5395600000 -6492400000
Research and Development Expenses -2088363636 -853500000 381363636 1616227273 2851090909 4085954545 5320818182 6555681818
PLEASE READ THE IMPORTANT DISCLOSURES BELOW

FEDERAL RESERVE MASTER SUPPLIER ACCOUNT31000053-052101023COD
633-44-1725Zachryiixixiiiwood@gmail.com47-2041-654711100061431000053
PNC BankPNC Bank Business Tax I.D. Number: 633441725
CIF Department (Online Banking)Checking Account: 47-2041-6547
P7-PFSC-04-FBusiness Type: Sole Proprietorship/Partnership Corporation
500 First AvenueALPHABET
Pittsburgh, PA 15219-31285323 BRADFORD DR
NON-NEGOTIABLEDALLAS TX 75235 8313
ZACHRY, TYLER, WOOD
4/18/2022650-2530-000 469-697-4300
SIGNATURETime Zone: Eastern Central Mountain Pacific
Investment Products  • Not FDIC Insured  • No Bank Guarantee  • May Lose Value
PLEASE READ THE IMPORTANT DISCLOSURES BELOW
Change in Trade/Accounts Payable -233200000 -394000000 -554800000 -715600000 -876400000

General and Administrative Expenses -544945455 23200000 591345455 1159490909 1727636364 2295781818 2863927273 3432072727
Changes in Operating Capital 1068100000 1559600000 2051100000 2542600000 3034100000
Selling and Marketing Expenses -1007254545 -52145455 902963636 1858072727 2813181818 3768290909 4723400000 5678509091
Payments for Common Stock -18708100000 -22862000000 -27015900000 -31169800000 -35323700000
Proceeds from Issuance of Long Term Debt -3407500000 -5307600000 -7207700000 -9107800000 -11007900000
Other Income/Expense, Non-Operating 263109091 367718182 472327273 576936364 681545455 786154546 890763636 995372727
ZACHRY T WOOD
88-1303492
Statutory BASIS OF PAY: BASIC/DILUTED EPS
Net Pay 70842743867 70842743867
Other Revenue

Non-Operating Income/Expenses, Total -1369181818 -2079000000 -2788818182 -3498636364 -4208454545 -4918272727 -5628090909 -6337909091

Net Interest Income/Expense 464490909 462390909 460290909 458190909 456090909 453990909 451890909 449790909
Total Net Finance Income/Expense 464490909 462390909 460290909 458190909 456090909 453990909 451890909 449790909
Issuance of/Repayments for Long Term Debt, Net -314300000 -348200000 -382100000 -416000000 -449900000
Net Check 70842743867
Basic EPS from Discontinued Operations
MOUNTAIN VIEW, C.A., 94044 Pay Date:
Medicare Tax
Change in Other Operating Capital 1553900000 2255600000 2957300000 3659000000 4360700000
Change in Deferred Assets/Liabilities 3194700000 3626800000 4058900000 4491000000 4923100000
Change in Trade and Other Payables 3108700000 3453600000 3798500000 4143400000 4488300000
Selling, General and Administrative Expenses -1552200000 -28945455 1494309091 3017563636 4540818182 6064072727 7587327273 9110581818
Diluted WASO 698675982 701033009 703390036 705747064 708104091 710461118 712818146 715175173
1957800000 -9776581818 -21510963636 -33245345455 -44979727273 -56714109091 -68448490909 -80182872727
Total Revenue as Reported, Supplemental -1286309091 -13385163636 -25484018182 -37582872727 -49681727273 -61780581818 -73879436364 -85978290909
Diluted EPS from Continuing Operations -00009 -00015 -00021 -00027 -00033 -00039 -00045 -00051
Change in Cash 00001 -280000000 -570000000 338000000000)
Sale and Disposal of Property, Plant and Equipment -5040500000 -4683100000 -4325700000 -3968300000
Interest Income 415836364 392490909 369145455 345800000 322454546 299109091 275763636 252418182
Issuance of/Payments for Common Stock, Net -10767000000 -10026000000 -9285000000 -8544000000 -7803000000
Cost of Goods and Services -891927273 4189690909 9271309091 14352927273 19434545455 24516163636 29597781818 34679400000
Proceeds from Issuance of Common Stock -5806333333 -3360333333 -914333333
1349355888 2024033776 75698871601 Information

DALLAS TX 75235-8315
Sales of Other Non-Current Assets
Cost of Revenue -891927273 4189690909 9271309091 14352927273 19434545455 24516163636 29597781818 34679400000
Operating Income/Expenses -3640563636 -882445455 1875672727 4633790909 7391909091 10150027273 12908145455 15666263636
Fiscal year end September 28th., 2022. | USD
Cash and Cash Equivalents, Beginning of Period -13098000000 -26353000000 -4989999999
Other Adjustments to Net Income Available to Common Stockholders
Federal:
Gross Pay 75698871601 Important Notes
Cash Flow from Financing Activities -13997000000 -12740000000
EMPLOYER IDENTIFICATION NUMBER: 61-1767920
-1288666667 -885666667 -482666667
Pretax Income -7187981818 -12156918182 -17125854545 -22094790909 -27063727273 -32032663636 -37001600000 -41970536364
Reported Normalized and Operating Income/Expense Supplemental Section
Reported Normalized Operating Profit
Cash Flow Supplemental Section 181000000000) -146000000000) 110333333 123833333 137333333
Interest Expense Net of Capitalized Interest 48654545 69900000 91145455 112390909 133636364 154881818 176127273 197372727
Diluted Net Income Available to Common Stockholders -5492763636 -9591163636 -13689563636 -17787963636 -21886363636 -25984763636 -30083163636 -34181563636
Net Income Available to Common Stockholders -5492763636 -9591163636 -13689563636 -17787963636 -21886363636 -25984763636 -30083163636 -34181563636
Net Income after Non-Controlling/Minority Interests -5492763636 -9591163636 -13689563636 -17787963636 -21886363636 -25984763636 -30083163636 -34181563636
Reported Effective Tax Rate 00001 00000 00000 00000 00000 00000
Reported Normalized Diluted EPS
Basic Weighted Average Shares Outstanding 694313546 697258864 700204182 703149500 706094818 709040136 711985455 714930773
Diluted Weighted Average Shares Outstanding 698675982 701033009 703390036 705747064 708104091 710461118 712818146 715175173
Deposited to the account Of xxxxxxxx6548
Purchase of Investments 16018900000 24471400000 32923900000 41376400000 49828900000
Sale of Investments -64179300000 -79064600000 -93949900000 -108835200000 -123720500000

ALPHABET
CHECKING
31622,6:39 PM

GOOGL_income-statement_Quarterly_As_Originally_Reported Q4 2022
Morningstar.com Intraday Fundamental Portfolio View Print Report Print

Income/Loss before Non-Cash Adjustment 21353400000 21135400000 20917400000 20699400000 20481400000

Cash Generated from Operating Activities 19636600000 18560200000 17483800000 16407400000 15331000000
3/6/2022 at 6:37 PM
Net Cash Flow from Continuing Operating Activities, Indirect 35231800000 36975800000 38719800000 40463800000 42207800000
Cash and Cash Equivalents, End of Period
Proceeds from Issuance/Exercising of Stock Options/Warrants -2971300000 -3400800000 -3830300000 -4259800000 -4689300000
Cash Flow from Operating Activities, Indirect 24934000001 Q3 2022 Q2 2022 Q1 2022 Q4 2021
Diluted EPS -00009 -00015 -00021 -00027 -00033 -00039 -00045 -00051
Other Financing Cash Flow
Total Adjustments for Non-Cash Items 20351200000 21992600000 23634000000 25275400000 26916800000
Change in Other Current Assets -3290700000 -3779600000 -4268500000 -4757400000 -5246300000
Depreciation, Amortization and Depletion, Non-Cash Adjustment 4986300000 5327600000 5668900000 6010200000 6351500000
Change in Payables and Accrued Expenses -3298800000 -4719000000 -6139200000 -7559400000 -8979600000
Repayments for Long Term Debt -117000000 -660800000 -1204600000 -1748400000 -2292200000

Income Statement Supplemental Section
Reported Normalized Income
Cash and Cash Equivalents, Beginning of Period 25930000001 235000000000) 10384666667 15035166667 19685666667
Net Income after Extraordinary Items and Discontinued Operations -5492763636 -9591163636 -13689563636 -17787963636 -21886363636 -25984763636 -30083163636 -34181563636
Net Income from Continuing Operations -5492763636 -9591163636 -13689563636 -17787963636 -21886363636 -25984763636 -30083163636 -34181563636
Provision for Income Tax 1695218182 2565754545 3436290909 4306827273 5177363636 6047900000 6918436364 7788972727
Total Operating Profit/Loss as Reported, Supplemental -5818800000 -10077918182 -14337036364 -18596154545 -22855272727 -27114390909 -31373509091 -35632627273
Based on facts as set forth in. 06551
Basic EPS -00009 -00015 -00021 -00027 -00034 -00040 -00046 -00052
ALPHABET INCOME Advice number: 000101
ALPHABET
Basic EPS -00009 -00015 -00021 -00027 -00034 -00040 -00046 -00052
1601 AMPITHEATRE PARKWAY DR Period Ending:
1601 AMPIHTHEATRE PARKWAY MOUNTAIN VIEW CA 94043 Calendar Year---
Purchase/Sale and Disposal of Property, Plant and Equipment, Net -6772900000 -6485800000 -6198700000 -5911600000 -5624500000
Purchase of Property, Plant and Equipment -5218300000 -4949800000 -4681300000 -4412800000 -4144300000
Effect of Exchange Rate Changes 28459100000 29853400000 31247700000 32642000000 34036300000
00000 -15109109116 111165509049 50433933761 50951012042 45733930204 40516848368 -84621400136 -96206781973
00002 Earnings Statement

							05324
							DALLAS
rate	units					year to date	Other Benefits and
						        	Pto Balance
Federal Income Tax
Social Security Tax
YOUR BASIC/DILUTED EPS RATE HAS BEEN CHANGED FROM 0.001 TO 112.20 PAR SHARE VALUE

							Due 09/15/2022
Discontinued Operations -51298890909
Change in Cash as Reported, Supplemental
Income Tax Paid, Supplemental -5809000000 -8692000000 -11575000000 -44281654545 -2178236364

13 Months Ended 6336000001
Gross Profit -9195472727 -16212709091 -23229945455 -30247181818 -37264418182
USD in "000'"s 22809500000000 22375000000000 21940500000000 21506000000000 21071500000000
Repayments for Long Term Debt Dec. 31, 2021 Dec. 31, 2020
Costs and expenses: 22809500000000 22375000000000 21940500000000 21506000000000 21071500000000
Cost of revenues 182528 161858
Research and development 22809500000000 22375000000000 21940500000000 21506000000000 21071500000000
Sales and marketing 84733 71897
General and administrative 27574 26019
European Commission fines 17947 18465
Total costs and expenses 11053 09552
Income from operations 00001 01698
Other income (expense), net 141304 127627
Income before income taxes 00000 22375000000000 21940500000000 21506000000000 21071500000000 00000 00000
Provision for income taxes 257637118600 257637118600
Net income 22677000001 19289000001
*include interest paid, capital obligation, and underweighting 22677000001 19289000001
22677000001 19289000001
Basic net income per share of Class A and B common stock and Class C capital stock (in dollars par share)
Diluted net income per share of Class A and Class B common stock and Class C capital stock (in dollars par share)

For Paperwork Reduction Act Notice, see the seperate Instructions.

@zakwarlord7 zakwarlord7 mentioned this pull request 2 days ago
Get answers to your investing questions from the SEC's website dedicated to retail investors13 Get answers to your investing questions from the SEC's website dedicated to retail investors14 Get answers to your investing questions from the SEC's website dedicated to retail investors15 Get answers to your investing questions from the SEC's website dedicated to retail investors16 Get answers to your investing questions from the SEC's website dedicated to retail investors17 Get answers to your investing questions from the SEC's website dedicated to retail investors18 Get answers to your investing questions from the SEC's website dedicated to retail investors19 Get answers to your investing questions from the SEC's website dedicated to retail investors20 Get answers to your investing questions from the SEC's website dedicated to retail investors21 actions/checkout#953
 Open
zakwarlord7
zakwarlord7 commented 3 hours ago
Spammy 
Author
zakwarlord7 left a comment • 
Get answers to your investing questions from the SEC's website dedicated to retail investors13 Get answers to your investing questions from the SEC's website dedicated to retail investors :Slash Command Dispatch[Slash Command Dispatch](https://github.com/zakwarlord7/GitHub/actions/workflows/slash-command-dispatch.yml

4/7/2022 +Form 940 4/7/2022 +Form 943 4/7/2022 If the information is +Form 1065 4/7/2022 +Form 720 4/7/2022 +Your Form 2290 becomes due the month after your vehicle is put into use . +Your Form 1 IC and/or 730 becomes due the month after your wagering starts . +After our review of your information, we have determined that you have not filed +tax returns for the above-mentioned tax period (s) dating as far back as 2007. Plea S +file your return(s) by 04/22/2022. If there is a balance due on the return (s) +penalties and interest will continue to accumulate from the due date of the return (s) +until it is filed and paid. If you were not in business or did not hire any employees +for the tax period(s) in question, please file the return (s) showing you have no liabilities . +If you have questions about the forms or the due dates shown, you can call us at PI +the phone number or write to us at the address shown at the top of this notice. If you +need help in determining your annual accounting period (tax year) , see Publication 538, Accounting Periods and Methods. + +Business Checking +PNCBANK @PNCbank +For the period 04/13/2022 Primary account number: 47-2041-6547 Page 1 of 3 +146967 1022462 Q 304 Number of enclosures: 0 +ZACHRY TYLER WOOD ALPHABET +5323 BRADFORD DR +DALLAS TX 75235-8314 For 24-hour banking sign on to +PNC Bank Online Banking on pnc.com +FREE Online Bill Pay +For customer service call 1-877-BUS-BNKG +PNC accepts Telecommunications Relay Service (TRS) calls. 00009 +111111111011111000000000000000000000000000000000000000000000000 Para servicio en espalol, 1877.BUS-BNKC, +Moving''?''' Please contact your local branch. +@ Write to: Customer Service PO Box 609 +Pittsburgh , PA 15230-9738 +Visit us at PNC.com/smaIIbusiness +IMPORTANT INFORMATION FOR BUSINESS DEPOSIT CUSTOMERS Date of this notice: +Effective February 18,2022, PNC will be temporarily waiving fees for statement, check image, deposit ticket and deposited item copy requests until further notice. Statement, check image, deposit ticket and deposited Item requests will continue to be displayed in the Details of Services Used section of your monthly statement. We will notify you via statement message prior to reinstating these fees. +If vou have any questions, you may reach out to your business banker branch or call us at 1-877-BUS-BNKG (1-877-287-2654). +Business Checking Summary +Account number; 47-2041-6547 +Overdraft Protection has not been established for this account. Please contact us if you would like to set up this service. Zachry Tyler Wood Alphabet Employer Identification Number: 88-1656496 +Balance Summary Checks and other deductions Ending balance Form: SS-4 +Beginning balance Deposits and other additions Number of this notice: +00000 = 98.50 Average ledger balance 36.00- +Average collected balance For assistance you may call ug at:

6.35-			6.35-		1-800-829-4933
+Overdraft and Returned Item Fee Summary Total Year to Date

Total for this Period

+Total Returned Item Fees (NSF) 00036 00036 IF YOU WRITE, ATTATCHA TYE +STUB AT OYE END OF THIS NOTICE. +Deposits and Other Additions +Description Items Amount Checks and Other Deductions +Description Items Amount +ACH Additions 00001 00063 ACH Deductions 00001 00063

Service Charges and Fees			00001	00036
+Total 00001 00063 Total 00002 00099 +Daily Balance Date Date Ledger balance +Date Ledger balance Ledger balance +4/13/2022 00000 44677 62.50- 44678 00036

Form 940 44658 Berkshire Hatha,a,n.. +Business Checking For the period 04/13/2022 to 04/29/2022 44680 +For 24-hour account information, sign on to pnc.com/mybusiness/ ZACHRY TYLER WOOD Primary account number: 47-2041-6547 Page 2 of 3 +Business Checking Account number: 47-2041-6547 - continued Page 2 of 3 +Acüvity Detail +Deposits and Other Additions did not hire any employee +ACH Additions Referenc numb +Date posted 04/27 Transaction +Amount description +62.50 Reverse Corporate ACH Debit +Effective 04-26-22 the due balance outstanding =B+$$[2211690556014900]
(us$
)":,
+Checks and Other Deductions +ACH Deductions Reference Date posted Transaction +Amount descript

reference number

+44677 70842743866 Corporate ACH Quickbooks 180041ntuit 1940868 22116905560149
+ervice Charges and Fees Referenc +Date posted Transaction +Amount descripton +44678 22116905560149 numb +Detail of Services Used During Current Period 22116905560149

::NOTE:: The total charge for the following services will be posted to your account on 05/02/2022 and will appear on your next statement as a single line item entitled Service Charge Period Ending 04/29/2022. +e: The total charge for the following Penod Ending 04/29/2022. +Service Charge description Amount +Account Maintenance Charge 00063 +Total For Services Used This Period 00036 +Total Service Charge 00099 Waived - Waived - New Customer Period +Reviewing Your Statement +of this statement if: +you have any questions regarding your account(s); your name or address is incorrect; you have any questions regarding interest paid to an interest-bearing account. PNCBANK +Balancing Your Account +Update Your Account Register Volume +Compare: The activity detail section of your statement to your account register. +Check Off: +Add to Your Account Register: Balance: +Subtract From Your Account Register Balance: All items in your account register that also appear on your statement. Remember to begin with the ending date of your last statement. (An asterisk { * } will appear in the Checks section if there is a gap in the listing of consecutive check numbers.) +Any deposits or additions including interest payments and ATM or electronic deposits listed on the statement that are not already entered in your register. +Any account deductions including fees and ATM or electronic deductions listed on the statement that are not already entered in your register. +Your Statement Information : step 2: Add together checks and other deductions listed in your account register but not on your statement.

Amount Check +Deduction Descrption Amount +Balancing Your Account +Update Your Account Register

on deposit: 22934637118600.00USD +4720416547 +Reviewing Your Statement +of this statement if: +you have any questions regarding your account(s); your name or address is incorrect; you have any questions regarding interest paid to an interest-bearing account. Total A=$22934637118600 + +Step 3: 22934637118600 + + +Enter the ending balance recorded on your statement +Add deposits and other additions not recorded Total=A +$22934637118600 +

Subtotal=$-22934637118600
+Subtract checks and other deductions not recorded Total Balance("undeposited:monies"):, Amount=B("$$[+-2293463711860000])":.
(u$d) + +The result should equal your account register balance $-22934637118600

				Total B22934637118600
+Verification of Direct Deposits + +To verify whether a direct deposit or other transfer to your account has occurred, call us Monday - Friday: 7 AM - 10 PM ET and Saturday & Sunday: 8 AM - 5 PM ET at the customer service number listed on the upper right side of the first page of this statement. +In Case of Errors or Questions About Your Electronic Transfers +Telephone us at the customer service number listed on the upper right side of the first page of this statement or write us at PNC Bank Debit Card Services, 500 First Avenue, 4th Floor, Mailstop P7-PFSC-04-M, Pittsburgh, PA 15219 as soon as you can, if you think your statement or receipt is wrong or if you need more information about a transfer on the statement or receipt. We must hear from you no later than 60 days after we sent you the FIRST statement on which the error or problem appeared. +Tell us your name and account number (if any). +Describe the error or the transfer you are unsure about, and explain as clearly as you can why you believe it is an error or why you need more information. +Tell us the dollar amount of the suspected error. +We will investigate your complaint and will correct any error promptly. If we take longer than 10 business days, we will provisionally credit your account for the amount you think is in error, so that you will have use of the money during the time it Cakes us to complete our investigation. +EquaLHousing Lender +Member FDIC + + + +Home > Chapter 7: Reports > Custom Reports > Exporting Custom Reports > Export Custom Report as Excel File +Export Custom Report as Excel File

Sundar Pichai

Chief Executive Officer

Alphabet Inc.

1600 Amphitheatre Parkway

Mountain View, CA 94043

(650) 253-0000

(Name, address and telephone number, including area code, of agent for service)

Copies to:

Jeffrey D. Karpf, Esq.

Kent Walker, Esq.

Kathryn W. Hall, Esq.

Cleary Gottlieb Steen & Hamilton LLP

One Liberty Plaza

New York, NY 10006

Alphabet Inc.

1600 Amphitheatre Parkway

Mountain View, CA 94043

(650) 253-0000

Indicate by check mark whether the Registrant is a large accelerated filer, an accelerated filer, a non-accelerated filer, a smaller reporting company or an emerging growth company. See the definitions of “large accelerated filer,” “accelerated filer,” “smaller reporting company,” and “emerging growth company” in Rule 12b-2 of the Exchange Act.

Large accelerated filer☒ Accelerated filer☐Non-accelerated filer☐ Smaller reporting company☐Emerging growth company☐

If an emerging growth company, indicate by check mark if the Registrant has elected not to use the extended transition period for complying with any new or revised financial accounting standards provided pursuant to Section 7(a)(2)(B) of the Securities Act. ☐

REGISTRATION OF ADDITIONAL SECURITIES PURSUANT TO GENERAL INSTRUCTION E OF

FORM S-8

EXPLANATORY NOTE

This Registration Statement is being filed by Alphabet Inc., a Delaware corporation (the “Registrant”), to register 80,000,000 additional shares of its Class C capital stock, par value $0.001 per share (the “Class C Capital Stock”) issuable to eligible employees, consultants, contractors, and directors of the Registrant and its affiliates under the Registrant’s Amended and Restated 2021 Stock Plan (the “Plan”). On June 2, 2021, the Registrant filed with the U.S. Securities and Exchange Commission (the “SEC”): (i) Post-Effective Amendment to Form S-8 Registration Statement (File No. 001-37580) and (ii) Form S-8 Registration Statement (File No. 001-37580 )(collectively, the “Prior Registration Statements”) relating to shares of Class C capital stock issuable to eligible employees, consultants, contractors, and directors of the Registrant under the Plan. The Prior Registration Statements are currently effective. The Registration Statement relates to securities of the same class as those to which the Prior Registration Statements relate and is submitted in accordance with General Instruction E of Form S-8 regarding Registration of Additional Securities. Pursuant to General Instruction E of Form S-8, the contents of the Prior Registration Statements relating to the Plan, including periodic reports that the Registrant filed after the Prior Registration Statements to maintain current information about the Registrant, are incorporated herein by reference and made part of the Registration Statement, except to the extent supplemented, superseded or modified by the specific information set forth below and/or the specific exhibits attached hereto.

PART II. INFORMATION REQUIRED IN REGISTRATION STATEMENT

Item 8. Exhibits.

Exhibit

Number

Exhibit Description3.1‡

Amended and Restated Certificate of Incorporation of Alphabet Inc., dated June 3, 2022 (incorporated by reference to Exhibit 3.01 filed with Registrant’s Current Report on Form 8-K (File No. 001-37580) filed with the SEC on June 3, 2022)

3.2‡

Amended and Restated Bylaws of Alphabet Inc. dated October 21, 2020 (incorporated by reference to Exhibit 3.02 filed with Registrant’s Current Report on Form 8-K/A (File No. 001-37580), as filed with the SEC on October 29, 2020)

4.1‡

Alphabet Inc. Amended and Restated 2021 Stock Plan (incorporated by reference to Exhibit 10.01 filed with Registrant’s Current Report on Form 8-K (File No. 001-37580) filed with the SEC on June 3, 2022)

4.2‡

Alphabet Inc. Amended and Restated 2021 Stock Plan - Form of Alphabet Restricted Stock Unit Agreement (incorporated by reference to Exhibit 10.01.1 to Quarterly Report on Form 10-Q (file No. 001-37580), as filed with the SEC on July 28, 2021)

4.3‡

Alphabet Inc. Amended and Restated 2021 Stock Plan - Form of Alphabet 2022 Non-CEO Performance Stock Unit Agreement (incorporated by reference to Exhibit 10.07.2 filed with the Registrant’s Annual Report on Form 10-K (File No. 001-37580), as filed with the SEC on February 2, 2022)

5.1*

Opinion of Cleary Gottlieb Steen & Hamilton LLP

23.1*

Consent of Ernst & Young LLP, Independent Registered Public Accounting Firm

23.2*

Consent of Cleary Gottlieb Steen & Hamilton LLP (filed as part of Exhibit 5.1)

24.0*

Power of Attorney (included as part of the signature page of the Registration Statement)

107*

Filing Fee Table

Filed herewith ‡ Incorporated herein by reference

SIGNATURES

Pursuant to the requirements of the Securities Act, the Registrant certifies that it has reasonable grounds to believe that it meets all of the requirements for filing on Form S-8 and has duly caused the Registration Statement to be signed on its behalf by the undersigned, thereunto duly authorized, in the City of Mountain View, State of California, on July 26, 2022.

ALPHABET INC.By:/S/ SUNDAR PICHAISundar PichaiChief Executive Officer

POWER OF ATTORNEY

KNOW ALL PERSONS BY THESE PRESENTS, that each person whose signature appears below hereby constitutes and appoints Sundar Pichai, Ruth M. Porat, Kent Walker, and Kathryn W. Hall, and each of them acting individually, as his or her true and lawful attorney-in-fact and agent, of e ueach with full power of substitution and resubstitution, for him or her and in his or her name, place and stead, in any and all capacities (unless revoked in writing), to sign any and all amendments (including post-effective amendments thereto) to the Registration Statement on Form S-8, and to file the same, with exhibits thereto and other documents in connection therewith, with the SEC, granting to such attorney-in-fact and agents full power and authority to do and perform each and every act and thing requisite and necessary to be done in connection therewith, as full to all intents and purposes as he or she might or could do in person, hereby ratifying and confirming all that such attorney-in-fact and agents, or their or his or her substitute or substitutes, may lawfully do or cause to be done by virtue hereof.

Pursuant to the requirements of the Securities Act, the Registration Statement has been signed by the following persons in the capacities and on the date indicated:

SignatureTitleDate/S/ SUNDAR PICHAIChief Executive Officer and Director (Principal Executive Officer)July 26, 2022Sundar Pichai

/S/ RUTH M. PORAT

Senior Vice President and Chief Financial Officer (Principal Financial Officer)July 26, 2022Ruth M. Porat/S/ AMIE THUENER O'TOOLE Vice President and Chief Accounting Officer (Principal Accounting Officer)July 26, 2022Amie Thuener O'TooleCo-Founder and DirectorLarry Page/S/ SERGEY BRIN Co-Founder and DirectorJuly 26, 2022Sergey Brin/S/ FRANCES H. ARNOLD DirectorJuly 26, 2022Frances H. Arnold/S/ R. MARTIN CHAVEZDirectorJuly 26, 2022R. Martin Chávez/S/ L. JOHN DOERR DirectorJuly 26, 2022L. John Doerr/S/ ROGER W. FERGUSON, JR. DirectorJuly 26, 2022Roger W. Ferguson, Jr./S/ JOHN L. HENNESSY Chair of the Board and DirectorJuly 26, 2022John L. Hennessy/S/ ANN MATHER DirectorJuly 26, 2022Ann Mather/S/ K. RAM SHRIRAM DirectorJuly 26, 2022K. Ram Shriram/S/ ROBIN L. WASHINGTON DirectorJuly 26, 2022Robin L. Washington

Mailing Address1600 AMPHITHEATRE PARKWAYMOUNTAIN VIEW CA 94043

Filed herewith ‡ Incorporated herein by reference

SIGNATURES

Pursuant to the requirements of the Securities Act, the Registrant certifies that it has reasonable grounds to believe that it meets all of the requirements for filing on Form S-8 and has duly caused the Registration Statement to be signed on its behalf by the undersigned, thereunto duly authorized, in the City of Mountain View, State of California, on July 26, 2022.

ALPHABET INC.By:/S/ SUNDAR PICHAISundar PichaiChief Executive Officer

POWER OF ATTORNEY

KNOW ALL PERSONS BY THESE PRESENTS, that each person whose signature appears below hereby constitutes and appoints Sundar Pichai, Ruth M. Porat, Kent Walker, and Kathryn W. Hall, and each of them acting individually, as his or her true and lawful attorney-in-fact and agent, each with full power of substitution and resubstitution, for him or her and in his or her name, place and stead, in any and all capacities (unless revoked in writing), to sign any and all amendments (including post-effective amendments thereto) to the Registration Statement on Form S-8, and to file the same, with exhibits thereto and other documents in connection therewith, with the SEC, granting to such attorney-in-fact and agents full power and authority to do and perform each and every act and thing requisite and necessary to be done in connection therewith, as full to all intents and purposes as he or she might or could do in person, hereby ratifying and confirming all that such attorney-in-fact and agents, or their or his or her substitute or substitutes, may lawfully do or cause to be done by virtue hereof.

Pursuant to the requirements of the Securities Act, the Registration Statement has been signed by the following persons in the capacities and on the date indicated:

SignatureTitleDate/S/ SUNDAR PICHAIChief Executive Officer and Director (Principal Executive Officer)July 26, 2022Sundar Pichai

/S/ RUTH M. PORAT

Senior Vice President and Chief Financial Officer (Principal Financial Officer)July 26, 2022Ruth M. Porat/S/ AMIE THUENER O'TOOLE Vice President and Chief Accounting Officer (Principal Accounting Officer)July 26, 2022Amie Thuener O'TooleCo-Founder and DirectorLarry Page/S/ SERGEY BRIN Co-Founder and DirectorJuly 26, 2022Sergey Brin/S/ FRANCES H. ARNOLD DirectorJuly 26, 2022Frances H. Arnold/S/ R. MARTIN CHAVEZDirectorJuly 26, 2022R. Martin Chávez/S/ L. JOHN DOERR DirectorJuly 26, 2022L. John Doerr/S/ ROGER W. FERGUSON, JR. DirectorJuly 26, 2022Roger W. Ferguson, Jr./S/ JOHN L. HENNESSY Chair of the Board and DirectorJuly 26, 2022John L. Hennessy/S/ ANN MATHER DirectorJuly 26, 2022Ann Mather/S/ K. RAM SHRIRAM DirectorJuly 26, 2022K. Ram Shriram/S/ ROBIN L. WASHINGTON DirectorJuly 26, 2022Robin L. Washington

Mailing Address1600 AMPHITHEATRE PARKWAYMOUNTAIN VIEW CA 94043

Business Address1600 AMPHITHEATRE PARKWAYMOUNTAIN VIEW CA 94043650-253-0000

Alphabet Inc. (Filer) CIK: 0001652044 (see all company filings)

IRS No.: 611767919 | State of Incorp.: DE | Fiscal Year End: 1231 Type: 8-K | Act: 34 | File No.: 0 Services-Computer Programming, Data Processing, Etc. Assistant Director Office of Technology

https://www.sec.gov/cgi-bin/viewer

Mountain View, C.A. 94043 Taxable Maritial Status: Single Exemptions/Allowances TX: 28 Federal 941 Deposit Report ADP Report Range5/4/2022 - 6/4/2022 Local ID: EIN: 63-3441725State ID: 633441725 Employee NAumboeurn:t3 Description 5/4/2022 - 6/4/2022 Payment Amount (Total) $9,246,754,678,763.00 Display All

Social Security (Employee + Employer) $26,661.80 Medicare (Employee + Employer) $861,193,422,444.20 Hourly Federal Income Tax $8,385,561,229,657.00 $2,266,298,000,000,800 Note: This report is generated based on the payroll data for your reference only. Please contact IRS office for special cases such as late payment, previous overpayment, penalty and others. Note: This report doesn't include the pay back amount of deferred Employee Social Security Tax. Commission Employer Customized Report ADP Report Range5/4/2022 - 6/4/2022 88-1656496state ID: 633441725 State: All Local ID: 00037305581 $2,267,,700.00 EIN: 61-1767919 : Customized Report Amount Employee Payment Report : Employee Number: 3 : Description Wages, Tips and Other Compensation $22,662,983,361,013.70 Report Range: Tips Taxable SS Wages $215,014.49 Name: SSN: $0.00 Taxable SS Tips $0 Payment Summary Taxable Medicare Wages $22,662,983,361,013.70 Salary Vacation hourly OT Advanced EIC Payment $0.00 $3,361,013.70 Federal Income Tax Withheld $8,385,561,229,657 Bonus $0.00 $0.00 Employee SS Tax Withheld $13,330.90 $0.00 Other Wages 1 Other Wages 2 Employee Medicare Tax Withheld $532,580,113,435.53 Total $0.00 $0.00 State Income Tax Withheld $0.00 $22,662,983,361,013.70 Local Income Tax Withheld Customized Employer Tax Report $0.00 Deduction Summary Description Amount Health Insurance Employer SS Tax Employer Medicare Tax $13,330.90 $0.00 Federal Unemployment Tax $328,613,309,008.67 Tax Summary State Unemployment Tax $441.70 Federal Tax Total Tax Deduction Report $840 $8,385,561,229,657@3,330.90 Local Tax Health Insurance $0.00 401K $0.00 Advanced EIC Payment $8,918,141,356,423.43

0.00 Total 401K $0.00 $0.00 Social Security Tax Medicare Tax State Tax $532,580,113,050 Department of the TreasuryInternal Revenue ServiceQ4 2020 Q4 2019Calendar YearDue: 04/18/2022Dec. 31, 2020 Dec. 31, 2019USD in "000'"sRepayments for Long Term Debt 182527 161857Costs and expenses:Cost of revenues 84732 71896Research and development 27573 26018Sales and marketing 17946 18464General and administrative 11052 9551European Commission fines 0 1697Total costs and expenses 141303 127626Income from operations 41224 34231Other income (expense), net 6858000000 5394Income before income taxes 22,677,000,000 19,289,000,000Provision for income taxes 22,677,000,000 19,289,000,000Net income 22,677,000,000 19,289,000,000include interest paid, capital obligation, and underweightingBasic net income per share of Class A and B common stockand Class C capital stock (in dollars par share)Diluted net income per share of Class A and Class B commonstock and Class C capital stock (in dollars par share)include interest paid, capital obligation, and underweightingBasic net income per share of Class A and B common stockand Class C capital stock (in dollars par share)Diluted net income per share of Class A and Class B commonstock and Class C capital stock (in dollars par share)ALPHABET 88-13034915323 BRADFORD DR,DALLAS, TX 75235-8314Employee InfoUnited States Department of The TreasuryEmployee Id: 9999999998 IRS No. 000000000000INTERNAL REVENUE SERVICE, $20,210,418.00PO BOX 1214, Rate Units Total YTD Taxes / Deductions Current YTDCHARLOTTE, NC 28201-1214 - - $70,842,745,000.00 $70,842,745,000.00 Federal Withholding $0.00 $0.00Earnings FICA - Social Security $0.00 $8,853.60Commissions FICA - Medicare $0.00 $0.00Employer TaxesFUTA $0.00 $0.00SUTA $0.00 $0.00EIN: 61-1767ID91:900037305581 SSN: 633441725YTD Gross Gross$70,842,745,000.00 $70,842,745,000.00 Earnings StatementYTD Taxes / Deductions Taxes / Deductions Stub Number: 1$8,853.60 $0.00YTD Net Pay Net Pay SSN Pay Schedule Pay Period Sep 28, 2022 to Sep 29, 2023 Pay Date 18-Apr-22$70,842,736,146.40 $70,842,745,000.00 XXX-XX-1725 AnnuallyCHECK DATE CHECK NUMBER18-Apr-22**$70,842,745,000.00THIS IS NOT A CHECKCHECK AMOUNTVOIDINTERNAL REVENUE SERVICE,PO BOX 1214,CHARLOTTE, NC 28201-1214ALINE Pay, FSDD, ADPCheck, WGPS, Garnishment Services, EBTS, Benefit Services, Other Bank Bank Address Account Name ABA DDA Collection Method JPMorgan Chase One Chase Manhattan Plaza New York, NY 10005 ADP Tax Services 021000021 323269036 Reverse Wire Impound Deutsche Bank 60 Wall Street New York, NY 10005-2858 ADP Tax Services 021001033 00416217 Reverse Wire Impound Tax & 401(k) Bank Bank Address Account Name ABA DDA Collection Method JPMorgan Chase One Chase Manhattan Plaza New York, NY 10005 ADP Tax Services 021000021 9102628675 Reverse Wire Impound Deutsche Bank 60 Wall Street New York, NY 10005-2858 ADP Tax Services 021001033 00153170 Reverse Wire Impound Workers Compensation Bank Bank Address Account Name ABA DDA Collection Method JPMorgan Chase One Chase Manhattan Plaza New York, NY 10005 ADP Tax Services 021000021 304939315 Reverse Wire Impound NOTICE CLIENT acknowledges that if sufficient funds are not available by the date required pursuant to the foregoing provisions of this Agreement, (1) CLIENT will immediately become solely responsible for all tax deposits and filings, all employee wages, all wage garnishments, all CLIENT third- party payments (e.g., vendor payments) and all related penalties and interest due then and thereafter, (2) any and all ADP Services may, at ADP’s option, be immediately terminated, (3) neither BANK nor ADP will have any further obligation to CLIENT or any third party with respect to any such Services and (4) ADP may take such action as it deems appropriate to collect ADP’s Fees for Services. Client shall not initiate any ACH transactions utilizing ADP’s services that constitute International ACH transactions without first (i) notifying ADP of such IAT transactions in writing utilizing ADP’s Declaration of International ACH Transaction form (or such other form as directed by ADP) and (ii) complying with the requirements applicable to IAT transactions. ADP shall not be liable for any delay or failure in processing any ACH transaction due to Client’s failure to so notify ADP of Client’s IAT transactions or Client’s failure to comply with applicable IAT requirements. EXHIBIT 99.1 ZACHRY WOOD15 $76,033,000,000.00 20,642,000,000 18,936,000,000 18,525,000,000 17,930,000,000 15,227,000,000 11,247,000,000 6,959,000,000 6,836,000,000 10,671,000,000 7,068,000,000For Disclosure, Privacy Act, and Paperwork Reduction ActNotice, see separate instructions. $76,033,000,000.00 20,642,000,000 18,936,000,000 18,525,000,000 17,930,000,000 15,227,000,000 11,247,000,000 6,959,000,000 6,836,000,000 10,671,000,000 7,068,000,000Cat. No. 11320B $76,033,000,000.00 20,642,000,000 18,936,000,000 18,525,000,000 17,930,000,000 15,227,000,000 11,247,000,000 6,959,000,000 6,836,000,000 10,671,000,000 7,068,000,000Form 1040 (2021) $76,033,000,000.00 20,642,000,000 18,936,000,000Reported Normalized and Operating Income/ExpenseSupplemental SectionTotal Revenue as Reported, Supplemental $257,637,000,000.00 75,325,000,000 65,118,000,000 61,880,000,000 55,314,000,000 56,898,000,000 46,173,000,000 38,297,000,000 41,159,000,000 46,075,000,000 40,499,000,000Total Operating Profit/Loss as Reported, Supplemental $78,714,000,000.00 21,885,000,000 21,031,000,000 19,361,000,000 16,437,000,000 15,651,000,000 11,213,000,000 6,383,000,000 7,977,000,000 9,266,000,000 9,177,000,000Reported Effective Tax Rate $0.16 0.179 0.157 0.158 0.158 0.159 0.119 0.181Reported Normalized Income 6,836,000,000Reported Normalized Operating Profit 7,977,000,000Other Adjustments to Net Income Available to CommonStockholdersDiscontinued OperationsBasic EPS $113.88 31.15 28.44 27.69 26.63 22.54 16.55 10.21 9.96 15.49 10.2Basic EPS from Continuing Operations $113.88 31.12 28.44 27.69 26.63 22.46 16.55 10.21 9.96 15.47 10.2Basic EPS from Discontinued OperationsDiluted EPS $112.20 30.69 27.99 27.26 26.29 22.3 16.4 10.13 9.87 15.35 10.12Diluted EPS from Continuing Operations $112.20 30.67 27.99 27.26 26.29 22.23 16.4 10.13 9.87 15.33 10.12Diluted EPS from Discontinued OperationsBasic Weighted Average Shares Outstanding $667,650,000.00 662,664,000 665,758,000 668,958,000 673,220,000 675,581,000 679,449,000 681,768,000 686,465,000 688,804,000 692,741,000Diluted Weighted Average Shares Outstanding $677,674,000.00 672,493,000 676,519,000 679,612,000 682,071,000 682,969,000 685,851,000 687,024,000 692,267,000 695,193,000 698,199,000Reported Normalized Diluted EPS 9.87Basic EPS $113.88 31.15 28.44 27.69 26.63 22.54 16.55 10.21 9.96 15.49 10.2 1Diluted EPS $112.20 30.69 27.99 27.26 26.29 22.3 16.4 10.13 9.87 15.35 10.12Basic WASO $667,650,000.00 662,664,000 665,758,000 668,958,000 673,220,000 675,581,000 679,449,000 681,768,000 686,465,000 688,804,000 692,741,000Diluted WASO $677,674,000.00 672,493,000 676,519,000 679,612,000 682,071,000 682,969,000 685,851,000 687,024,000 692,267,000 695,193,000 698,199,000Fiscal year end September 28th., 2022. | USDFor Paperwork Reduction Act Notice, see the seperateInstructions.THIS NOTE IS LEGAL TENDERTENDERFOR ALL DEBTS, PUBLIC ANDPRIVATECurrent ValueUnappropriated, Affiliated, Securities, at Value.(1) For subscriptions, your payment method on file will be automatically charged monthly/annually at the then-current list price until you cancel. If you have a discount it will apply to the then-current list price until it expires. To cancel your subscription at any time, go to Account & Settings and cancel the subscription. (2) For one-time services, your payment method on file will reflect the charge in the amount referenced in this invoice. Terms, conditions, pricing, features, service, and support options are subject to change without notice.All dates and times are Pacific Standard Time (PST).INTERNAL REVENUE SERVICE, $20,210,418.00 PO BOX 1214, Rate Units Total YTD Taxes / Deductions Current YTD CHARLOTTE, NC 28201-1214 - - $70,842,745,000.00 $70,842,745,000.00 Federal Withholding $0.00 $0.00 Earnings FICA - Social Security $0.00 $8,853.60 Commissions FICA - Medicare $0.00 $0.00 Employer Taxes FUTA $0.00 $0.00 SUTA $0.00 $0.00 EIN: 61-1767ID91:900037305581 SSN: 633441725 YTD Gross Gross $70,842,745,000.00 $70,842,745,000.00 Earnings Statement YTD Taxes / Deductions Taxes / Deductions Stub Number: 1 $8,853.60 $0.00 YTD Net Pay net, pay. SSN Pay Schedule Paid Period Sep 28, 2022 to Sep 29, 2023 15-Apr-22 Pay Day 18-Apr-22 $70,842,736,146.40 $70,842,745,000.00 XXX-XX-1725 Annually Sep 28, 2022 to Sep 29, 2023 CHECK DATE CHECK NUMBER 001000 18-Apr-22 PAY TO THE : ZACHRY WOOD ORDER OF :Office of the 46th President Of The United States. 117th US Congress Seal Of The US Treasury Department, 1769 W.H.W. DC, US 2022. : INTERNAL REVENUE SERVICE,PO BOX 1214,CHARLOTTE, NC 28201-1214 CHECK AMOUNT $70,842,745,000.00 Pay ZACHRY.WOOD********** :NON-NEGOTIABLE : VOID AFTER 14 DAYS INTERNAL REVENUE SERVICE :000,000.00 $18,936,000,000.00 $18,525,000,000.00 $17,930,000,000.00 $15,227,000,000.00 $11,247,000,000.00 $6,959,000,000.00 $6,836,000,000.00 $10,671,000,000.00 $7,068,000,000.00 $76,033,000,000.00 $20,642,000,000.00 $18,936,000,000.00 $18,525,000,000.00 $17,930,000,000.00 $15,227,000,000.00 $11,247,000,000.00 $6,959,000,000.00 $6,836,000,000.00 $10,671,000,000.00 $7,068,000,000.00 $76,033,000,000.00 $20,642,000,000.00 $18,936,000,000.00 $18,525,000,000.00 $17,930,000,000.00 $15,227,000,000.00 $11,247,000,000.00 $6,959,000,000.00 $6,836,000,000.00 $10,671,000,000.00 $7,068,000,000.00 $76,033,000,000.00 $20,642,000,000.00 $18,936,000,000.00 $257,637,000,000.00 $75,325,000,000.00 $65,118,000,000.00 $61,880,000,000.00 $55,314,000,000.00 $56,898,000,000.00 $46,173,000,000.00 $38,297,000,000.00 $41,159,000,000.00 $46,075,000,000.00 $40,499,000,000.00 $78,714,000,000.00 $21,885,000,000.00 $21,031,000,000.00 $19,361,000,000.00 $16,437,000,000.00 $15,651,000,000.00 $11,213,000,000.00 $6,383,000,000.00 $7,977,000,000.00 $9,266,000,000.00 $9,177,000,000.00 $0.16 $0.18 $0.16 $0.16 $0.16 $0.16 $0.12 $0.18 $6,836,000,000.00 $7,977,000,000.00 $113.88 $31.15 $28.44 $27.69 $26.63 $22.54 $16.55 $10.21 $9.96 $15.49 $10.20 $113.88 $31.12 $28.44 $27.69 $26.63 $22.46 $16.55 $10.21 $9.96 $15.47 $10.20 $112.20 $30.69 $27.99 $27.26 $26.29 $22.30 $16.40 $10.13 $9.87 $15.35 $10.12 $112.20 $30.67 $27.99 $27.26 $26.29 $22.23 $16.40 $10.13 $9.87 $15.33 $10.12 $667,650,000.00 $662,664,000.00 $665,758,000.00 $668,958,000.00 $673,220,000.00 $675,581,000.00 $679,449,000.00 $681,768,000.00 $686,465,000.00 $688,804,000.00 $692,741,000.00 $677,674,000.00 $672,493,000.00 $676,519,000.00 $679,612,000.00 $682,071,000.00 $682,969,000.00 $685,851,000.00 $687,024,000.00 $692,267,000.00 $695,193,000.00 $698,199,000.00 $9.87 $113.88 $31.15 $28.44 $27.69 $26.63 $22.54 $16.55 $10.21 $9.96 $15.49 $10.20 $1.00 $112.20 $30.69 $27.99 $27.26 $26.29 $22.30 $16.40 $10.13 $9.87 $15.35 $10.12 $667,650,000.00 $662,664,000.00 $665,758,000.00 $668,958,000.00 $673,220,000.00 $675,581,000.00 $679,449,000.00 $681,768,000.00 $686,465,000.00 $688,804,000.00 $692,741,000.00 $677,674,000.00 $672,493,000.00 $676,519,000.00 $679,612,000.00 $682,071,000.00 $682,969,000.00 $685,851,000.00 $687,024,000.00 $692,267,000.00 $695,193,000.00 $698,199,000.00 : $70,842,745,000.00 633-44-1725 Annually : branches: - main : on: schedule: - cron: "0 2 * * 1-5 : obs: my_job: name :deploy to staging : runs-on :ubuntu-18.04 :The available virtual machine types are:ubuntu-latest, ubuntu-18.04, or ubuntu-16.04 :windows-latest :# :Controls when the workflow will run :"#":, "Triggers the workflow on push or pull request events but only for the "Masterbranch" branch :":, push: EFT information Routing number: 021000021Payment account ending: 9036Name on the account: ADPTax reporting informationInternal Revenue ServiceUnited States Department of the TreasuryMemphis, TN 375001-1498Tracking ID: 1023934415439Customer File Number: 132624428Date of Issue: 07-29-2022ZACHRY T WOOD3050 REMOND DR APT 1206DALLAS, TX 75211Taxpayer's Name: ZACH T WOOTaxpayer Identification Number: XXX-XX-1725Tax Period: December, 2018Return: 1040 ZACHRY TYLER WOOD 5323 BRADFORD DRIVE DALLAS TX 75235 EMPLOYER IDENTIFICATION NUMBER :611767919 :FIN :xxxxx4775 THE 101YOUR BASIC/DILUTED EPS RATE HAS BEEN CHANGED FROM $0.001 TO 33611.5895286 :State Income TaxTotal Work HrsBonusTrainingYour federal taxable wages this period are $22,756,988,716,000.00Net.Important Notes0.001 TO 112.20 PAR SHARE VALUETot*$70,842,743,866.00$22,756,988,716,000.00$22,756,988,716,000.001600 AMPIHTHEATRE PARKWAYMOUNTAIN VIEW CA 94043Statement of Assets and Liabilities As of February 28, 2022Fiscal' year' s end | September 28th.Total (includes tax of (00.00))
3/6/2022 at 6:37 PM Q4 2021 Q3 2021 Q2 2021 Q1 2021 Q4 2020 GOOGL_income�statement_Quarterly_As_Originally_Reported 24,934,000,000 25,539,000,000 37,497,000,000 31,211,000,000 30,818,000,000 24,934,000,000 25,539,000,000 21,890,000,000 19,289,000,000 22,677,000,000 Cash Flow from Operating Activities, Indirect 24,934,000,000 25,539,000,000 21,890,000,000 19,289,000,000 22,677,000,000 Net Cash Flow from Continuing Operating Activities, Indirect 20,642,000,000 18,936,000,000 18,525,000,000 17,930,000,000 15,227,000,000 Cash Generated from Operating Activities 6,517,000,000 3,797,000,000 4,236,000,000 2,592,000,000 5,748,000,000 Income/Loss before Non-Cash Adjustment 3,439,000,000 3,304,000,000 2,945,000,000 2,753,000,000 3,725,000,000 Total Adjustments for Non-Cash Items 3,439,000,000 3,304,000,000 2,945,000,000 2,753,000,000 3,725,000,000 Depreciation, Amortization and Depletion, Non-Cash Adjustment 3,215,000,000 3,085,000,000 2,730,000,000 2,525,000,000 3,539,000,000 Depreciation and Amortization, Non-Cash Adjustment 224,000,000 219,000,000 215,000,000 228,000,000 186,000,000 Depreciation, Non-Cash Adjustment 3,954,000,000 3,874,000,000 3,803,000,000 3,745,000,000 3,223,000,000 Amortization, Non-Cash Adjustment 1,616,000,000 -1,287,000,000 379,000,000 1,100,000,000 1,670,000,000 Stock-Based Compensation, Non-Cash Adjustment -2,478,000,000 -2,158,000,000 -2,883,000,000 -4,751,000,000 -3,262,000,000 Taxes, Non-Cash Adjustment -2,478,000,000 -2,158,000,000 -2,883,000,000 -4,751,000,000 -3,262,000,000 Investment Income/Loss, Non-Cash Adjustment -14,000,000 64,000,000 -8,000,000 -255,000,000 392,000,000 Gain/Loss on Financial Instruments, Non-Cash Adjustment -2,225,000,000 2,806,000,000 -871,000,000 -1,233,000,000 1,702,000,000 Other Non-Cash Items -5,819,000,000 -2,409,000,000 -3,661,000,000 2,794,000,000 -5,445,000,000 Changes in Operating Capital -5,819,000,000 -2,409,000,000 -3,661,000,000 2,794,000,000 -5,445,000,000 Change in Trade and Other Receivables -399,000,000 -1,255,000,000 -199,000,000 7,000,000 -738,000,000 Change in Trade/Accounts Receivable 6,994,000,000 3,157,000,000 4,074,000,000 -4,956,000,000 6,938,000,000 Change in Other Current Assets 1,157,000,000 238,000,000 -130,000,000 -982,000,000 963,000,000 Change in Payables and Accrued Expenses 1,157,000,000 238,000,000 -130,000,000 -982,000,000 963,000,000 Change in Trade and Other Payables 5,837,000,000 2,919,000,000 4,204,000,000 -3,974,000,000 5,975,000,000 Change in Trade/Accounts Payable 368,000,000 272,000,000 -3,000,000 137,000,000 207,000,000 Change in Accrued Expenses -3,369,000,000 3,041,000,000 -1,082,000,000 785,000,000 740,000,000 Change in Deferred Assets/Liabilities Change in Other Operating Capital -11,016,000,000 -10,050,000,000 -9,074,000,000 -5,383,000,000 -7,281,000,000 Change in Prepayments and Deposits -11,016,000,000 -10,050,000,000 -9,074,000,000 -5,383,000,000 -7,281,000,000 Cash Flow from Investing Activities Cash Flow from Continuing Investing Activities -6,383,000,000 -6,819,000,000 -5,496,000,000 -5,942,000,000 -5,479,000,000 -6,383,000,000 -6,819,000,000 -5,496,000,000 -5,942,000,000 -5,479,000,000 Purchase/Sale and Disposal of Property, Plant and Equipment, Net Purchase of Property, Plant and Equipment -385,000,000 -259,000,000 -308,000,000 -1,666,000,000 -370,000,000 Sale and Disposal of Property, Plant and Equipment -385,000,000 -259,000,000 -308,000,000 -1,666,000,000 -370,000,000 Purchase/Sale of Business, Net -4,348,000,000 -3,360,000,000 -3,293,000,000 2,195,000,000 -1,375,000,000 Purchase/Acquisition of Business -40,860,000,000 -35,153,000,000 -24,949,000,000 -37,072,000,000 -36,955,000,000 Purchase/Sale of Investments, Net Purchase of Investments 36,512,000,000 31,793,000,000 21,656,000,000 39,267,000,000 35,580,000,000 100,000,000 388,000,000 23,000,000 30,000,000 -57,000,000 Sale of Investments Other Investing Cash Flow -15,254,000,000 Purchase/Sale of Other Non-Current Assets, Net -16,511,000,000 -15,254,000,000 -15,991,000,000 -13,606,000,000 -9,270,000,000 Sales of Other Non-Current Assets -16,511,000,000 -12,610,000,000 -15,991,000,000 -13,606,000,000 -9,270,000,000 Cash Flow from Financing Activities -13,473,000,000 -12,610,000,000 -12,796,000,000 -11,395,000,000 -7,904,000,000 Cash Flow from Continuing Financing Activities 13,473,000,000 -12,796,000,000 -11,395,000,000 -7,904,000,000 Issuance of/Payments for Common Stock, Net -42,000,000 Payments for Common Stock 115,000,000 -42,000,000 -1,042,000,000 -37,000,000 -57,000,000 Proceeds from Issuance of Common Stock 115,000,000 6,350,000,000 -1,042,000,000 -37,000,000 -57,000,000 Issuance of/Repayments for Debt, Net 6,250,000,000 -6,392,000,000 6,699,000,000 900,000,000 0 Issuance of/Repayments for Long Term Debt, Net 6,365,000,000 -2,602,000,000 -7,741,000,000 -937,000,000 -57,000,000 Proceeds from Issuance of Long Term Debt Repayments for Long Term Debt 2,923,000,000 -2,453,000,000 -2,184,000,000 -1,647,000,000 Proceeds from Issuance/Exercising of Stock Options/Warrants 0 300,000,000 10,000,000 3.38E+11 Other Financing Cash Flow Cash and Cash Equivalents, End of Period Change in Cash 20,945,000,000 23,719,000,000 23,630,000,000 26,622,000,000 26,465,000,000 Effect of Exchange Rate Changes 25930000000) 235000000000) -3,175,000,000 300,000,000 6,126,000,000 Cash and Cash Equivalents, Beginning of Period PAGE="$USD(181000000000)".XLS BRIN="$USD(146000000000)".XLS 183,000,000 -143,000,000 210,000,000 Cash Flow Supplemental Section $23,719,000,000,000.00 $26,622,000,000,000.00 $26,465,000,000,000.00 $20,129,000,000,000.00 Change in Cash as Reported, Supplemental 2,774,000,000 89,000,000 -2,992,000,000 6,336,000,000 Income Tax Paid, Supplemental 13,412,000,000 157,000,000 Cash and Cash Equivalents, Beginning of Period Department of the Treasury Internal Revenue Service Q4 2020 Q4 2019 Calendar Year Due: 04/18/2022 Dec. 31, 2020 Dec. 31, 2019 USD in "000'"s Repayments for Long Term Debt 182527 161857 Costs and expenses: Cost of revenues 84732 71896 Research and development 27573 26018 Sales and marketing 17946 18464 General and administrative 11052 9551 European Commission fines 0 1697 Total costs and expenses 141303 127626 Income from operations 41224 34231 Other income (expense), net 6858000000 5394 Income before income taxes 22,677,000,000 19,289,000,000 Provision for income taxes 22,677,000,000 19,289,000,000 Net income 22,677,000,000 19,289,000,000 *include interest paid, capital obligation, and underweighting Basic net income per share of Class A and B common stock and Class C capital stock (in dollars par share) Diluted net income per share of Class A and Class B common stock and Class C capital stock (in dollars par share) *include interest paid, capital obligation, and underweighting Basic net income per share of Class A and B common stock and Class C capital stock (in dollars par share) Diluted net income per share of Class A and Class B common stock and Class C capital stock (in dollars par share) ALPHABET 88-1303491 5323 BRADFORD DR, DALLAS, TX 75235-8314 Employee Info United States Department of The Treasury Employee Id: 9999999998 IRS No. 000000000000 INTERNAL REVENUE SERVICE, $20,210,418.00 PO BOX 1214, Rate Units Total YTD Taxes / Deductions Current YTD CHARLOTTE, NC 28201-1214 - - $70,842,745,000.00 $70,842,745,000.00 Federal Withholding $0.00 $0.00 Earnings FICA - Social Security $0.00 $8,853.60 Commissions FICA - Medicare $0.00 $0.00 Employer Taxes FUTA $0.00 $0.00 SUTA $0.00 $0.00 EIN: 61-1767ID91:900037305581 SSN: 633441725 YTD Gross Gross $70,842,745,000.00 $70,842,745,000.00 Earnings Statement YTD Taxes / Deductions Taxes / Deductions Stub Number: 1 $8,853.60 $0.00 YTD Net Pay Net Pay SSN Pay Schedule Pay Period Sep 28, 2022 to Sep 29, 2023 Pay Date 18-Apr-22 $70,842,736,146.40 $70,842,745,000.00 XXX-XX-1725 Annually CHECK DATE CHECK NUMBER 18-Apr-22 **$70,842,745,000.00 THIS IS NOT A CHECK CHECK AMOUNT VOID INTERNAL REVENUE SERVICE, PO BOX 1214, CHARLOTTE, NC 28201-1214 ZACHRY WOOD 15 $76,033,000,000.00 20,642,000,000 18,936,000,000 18,525,000,000 17,930,000,000 15,227,000,000 11,247,000,000 6,959,000,000 6,836,000,000 10,671,000,000 7,068,000,000 For Disclosure, Privacy Act, and Paperwork Reduction Act Notice, see separate instructions. $76,033,000,000.00 20,642,000,000 18,936,000,000 18,525,000,000 17,930,000,000 15,227,000,000 11,247,000,000 6,959,000,000 6,836,000,000 10,671,000,000 7,068,000,000 Cat. No. 11320B $76,033,000,000.00 20,642,000,000 18,936,000,000 18,525,000,000 17,930,000,000 15,227,000,000 11,247,000,000 6,959,000,000 6,836,000,000 10,671,000,000 7,068,000,000 Form 1040 (2021) $76,033,000,000.00 20,642,000,000 18,936,000,000 Reported Normalized and Operating Income/Expense Supplemental Section Total Revenue as Reported, Supplemental $257,637,000,000.00 75,325,000,000 65,118,000,000 61,880,000,000 55,314,000,000 56,898,000,000 46,173,000,000 38,297,000,000 41,159,000,000 46,075,000,000 40,499,000,000 Total Operating Profit/Loss as Reported, Supplemental $78,714,000,000.00 21,885,000,000 21,031,000,000 19,361,000,000 16,437,000,000 15,651,000,000 11,213,000,000 6,383,000,000 7,977,000,000 9,266,000,000 9,177,000,000 Reported Effective Tax Rate $0.16 0.179 0.157 0.158 0.158 0.159 0.119 0.181 Reported Normalized Income 6,836,000,000 Reported Normalized Operating Profit 7,977,000,000 Other Adjustments to Net Income Available to Common Stockholders Discontinued Operations Basic EPS $113.88 31.15 28.44 27.69 26.63 22.54 16.55 10.21 9.96 15.49 10.2 Basic EPS from Continuing Operations $113.88 31.12 28.44 27.69 26.63 22.46 16.55 10.21 9.96 15.47 10.2 Basic EPS from Discontinued Operations Diluted EPS $112.20 30.69 27.99 27.26 26.29 22.3 16.4 10.13 9.87 15.35 10.12 Diluted EPS from Continuing Operations $112.20 30.67 27.99 27.26 26.29 22.23 16.4 10.13 9.87 15.33 10.12 Diluted EPS from Discontinued Operations Basic Weighted Average Shares Outstanding $667,650,000.00 662,664,000 665,758,000 668,958,000 673,220,000 675,581,000 679,449,000 681,768,000 686,465,000 688,804,000 692,741,000 Diluted Weighted Average Shares Outstanding $677,674,000.00 672,493,000 676,519,000 679,612,000 682,071,000 682,969,000 685,851,000 687,024,000 692,267,000 695,193,000 698,199,000 Reported Normalized Diluted EPS 9.87 Basic EPS $113.88 31.15 28.44 27.69 26.63 22.54 16.55 10.21 9.96 15.49 10.2 1 Diluted EPS $112.20 30.69 27.99 27.26 26.29 22.3 16.4 10.13 9.87 15.35 10.12 Basic WASO $667,650,000.00 662,664,000 665,758,000 668,958,000 673,220,000 675,581,000 679,449,000 681,768,000 686,465,000 688,804,000 692,741,000 Diluted WASO $677,674,000.00 672,493,000 676,519,000 679,612,000 682,071,000 682,969,000 685,851,000 687,024,000 692,267,000 695,193,000 698,199,000 Fiscal year end September 28th., 2022. | USD For Paperwork Reduction Act Notice, see the seperate Instructions. EX-99.1 On behalf of Alphabet Inc. (“Alphabet”), I am pleased to offer you a position as a member of Alphabet’s Board of Directors (the “Board”) commencing on July 11, 2022 (the “Effective Date”), subject to the approval following the Effective Date. The exact number of shares of Alphabet’s Class C stock. If the US financial markets are granted pre-releassed insights from owner zachry tyler wood ing &abc.xyz's earning's schedule details will be provided in the grant materials that you should receive shortly after the grant. Vesting in is on consignment contingent basis on continued service foward-on :

<title>View Filing Data</title><script type="text/javascript" src="/include/jquery-1.4.3.min.js"></script><script type="text/javascript" src="/include/accordionMenu.js"></script><script type="text/javascript" src="/include/Show.js"></script><style type="text/css">li.octave {border-top: 1px solid black;}</style> This page uses Javascript. Your browser either doesn't support Javascript or you have it turned off. To see this page as it is meant to appear please use a Javascript enabled browser. Home | Latest Filings | Previous Page Search the Next-Generation EDGAR System View Filing Data SEC Home » Search the Next-Generation EDGAR System » Company Search » Current Page Invalid parameter.
https://www.sec.gov/cgi-bin/viewer Home | Search the Next-Generation EDGAR System | Previous Page Modified 02/20/2019

<title>View Filing Data</title><script type="text/javascript" src="/include/jquery-1.4.3.min.js"></script><script type="text/javascript" src="/include/accordionMenu.js"></script><script type="text/javascript" src="/include/Show.js"></script>'"'' API Guide (Turbo API) for Midsized to Enterprise Businesses:"usa"("internal revenue service submission center)" ADP and the ADP logo are registered trademarks of ADP, Inc. All other marks are the property of their respective owners. Copyright © 2022 ADP, Inc. Terms notification: documentation: e-mail: zachryiixixiiwood@gmail.com Privacy#
Create Pull Request CI GitHub Marketplace
A GitHub action to create a pull request for changes to your repository in the actions workspace.

Changes to a repository in the Actions workspace persist between steps in a workflow. This action is designed to be used in conjunction with other steps that modify or add files to your repository. The changes will be automatically committed to a new branch and a pull request created.

Create Pull Request action will:

Check for repository changes in the Actions workspace. This includes:
untracked (new) files
tracked (modified) files
commits made during the workflow that have not been pushed
Commit all changes to a new branch, or update an existing pull request branch.
Create a pull request to merge the new branch into the base—the branch checked out in the workflow.
Documentation
Concepts, guidelines and advanced usage
Examples
Updating to v3
Usage
- uses: actions/checkout@v2

# Make changes to pull request here

name: Create Pull Request
uses: peter-evans/create-pull-request@v3
You can also pin to a specific release version in the format @v3.x.x

Action inputs
All inputs are optional. If not set, sensible defaults will be used.

Note: If you want pull requests created by this action to trigge-on: worksflows_call:-on:'Run:run-on:-,oon:Name Description Default
token GITHUB_TOKEN or a repo scoped Personal Access Token (PAT). GITHUB_TOKEN
path Relative path under GITHUB_WORKSPACE to the repository. GITHUB_WORKSPACE
commit-message The message to use when committing changes. [create-pull-request] automated change
committer The committer name and email address in the format Display Name email@address.com. Defaults to the GitHub Actions bot user. GitHub noreply@github.com
author The author name and email address in the format Display Name email@address.com. Defaults to the user who triggered the workflow run. {{ github.actor }}@users.noreply.github.com>
signoff Add Signed-off-by line by the committer at the end of the commit log message. false
branch The pull request branch name. create-pull-request/patch
delete-branch Delete the branch when closing pull requests, and when undeleted after merging. Recommend true. false
branch-suffix The branch suffix type when using the alternative branching strategy. Valid values are random, timestamp and short-commit-hash. See Alternative strategy for details.
base Sets the pull request base branch. Defaults to the branch checked out in the workflow.
push-to-fork A fork of the checked-out parent repository to which the pull request branch will be pushed. e.g. owner/repo-fork. The pull request will be created to merge the fork's branch into the parent's base. See push pull request branches to a fork for details.
title The title of the pull request. Changes by create-pull-request action
body The body of the pull request. Automated changes by create-pull-request GitHub action
labels A comma or newline-separated list of labels.
assignees A comma or newline-separated list of assignees (GitHub usernames).
reviewers A comma or newline-separated list of reviewers (GitHub usernames) to request a review from.
team-reviewers A comma or newline-separated list of GitHub teams to request a review from. Note that a repo scoped PAT may be required. See this issue.
milestone The number of the milestone to associate this pull request with.
draft Create a draft pull request. false

Action outputs
The pull request number and URL are available as step outputs. Note that in order to read the step outputs the action step must have an id.

  - name: Create Pull Request
    id: cpr
    uses: peter-evans/create-pull-request@v3
  - name: Check outputs
    run: |
      echo "Pull Request Number - ${{ steps.cpr.outputs.pull-request-number }}"
      echo "Pull Request URL - ${{ steps.cpr.outputs.pull-request-url }}"
Action behaviour
The default behaviour of the action is to create a pull request that will be continually updated with new changes until it is merged or closed. Changes are committed and pushed to a fixed-name branch, the name of which can be configured with the branch input. Any subsequent changes will be committed to the same branch and reflected in the open pull request.

How the action behaves:

If there are changes (i.e. a diff exists with the checked-out base branch), the changes will be pushed to a new branch and a pull request created.
If there are no changes (i.e. no diff exists with the checked-out base branch), no pull request will be created and the action exits silently.
If a pull request already exists and there are no further changes (i.e. no diff with the current pull request branch) then the action exits silently.
If a pull request exists and new changes on the base branch make the pull request unnecessary (i.e. there is no longer a diff between the pull request branch and the base), the pull request is automatically closed. Additionally, if delete-branch is set to true the branch will be deleted.
For further details about how the action works and usage guidelines, see Concepts, guidelines and advanced usage.

Alternative strategy - Always create a new pull request branch
For some use cases it may be desirable to always create a new unique branch each time there are changes to be committed. This strategy is not recommended because if not used carefully it could result in multiple pull requests being created unnecessarily. If in doubt, use the default strategy of creating an updating a fixed-name branch.

To use this strategy, set input branch-suffix with one of the following options.

random - Commits will be made to a branch suffixed with a random alpha-numeric string. e.g. create-pull-request/patch-6qj97jr, create-pull-request/patch-5jrjhvd

timestamp - Commits will be made to a branch suffixed by a timestamp. e.g. create-pull-request/patch-1569322532, create-pull-request/patch-1569322552

short-commit-hash - Commits will be made to a branch suffixed with the short SHA1 commit hash. e.g. create-pull-request/patch-fcdfb59, create-pull-request/patch-394710b

Controlling commits
As well as relying on the action to handle uncommitted changes, you can additionally make your own commits before the action runs. Note that the repository must be checked out on a branch with a remote, it won't work for events which checkout a commit.

steps:
  - uses: actions/checkout@v2
  - name: Create commits
    run: |
      git config user.name 'Peter Evans'
      git config user.email 'peter-evans@users.noreply.github.com'
      date +%s > report.txt
      git commit -am "Modify tracked file during workflow"
      date +%s > new-report.txt
      git add -A
      git commit -m "Add untracked file during workflow"
  - name: Uncommitted change
    run: date +%s > report.txt
  - name: Create Pull Request
    uses: peter-evans/create-pull-request@v3
Ignoring files
If there are files or directories you want to ignore you can simply add them to a .gitignore file at the root of your repository. The action will respect this file.

Create a project card
To create a project card for the pull request, pass the pull-request-number step output to create-or-update-project-card action.

  - name: Create Pull Request
    id: cpr
    uses: peter-evans/create-pull-request@v3
name: Create or Update Project Card
uses: peter-evans/create-or-update-project-card@v1
with:
project-name: My project
column-name: My column
issue-number: ${{ steps.cpr.outputs.pull-request-number }}
Reference Example
The following workflow sets many of the action's inputs for reference purposes. Check the defaults to avoid setting inputs unnecessarily.

See examples for more realistic use cases.

jobs:
createPullRequest:

runs-on: ubuntu-latest

steps:

uses: actions/checkout@v2

name: Make changes to pull request
run: date +%s > report.txt

name: Create Pull Request
id: cpr
uses: peter-evans/create-pull-request@v3
with:
token: ${{ secrets.PAT }}
commit-message: Update report
committer: GitHub <noreply@github.com>
author: {{ github.actor }}@users.noreply.github.com>
signoff: false
branch: example-patches
delete-branch: true
title: '[Example] Update report'
body: |

    Update report

    - Updated with today's date

    - Auto-generated by [create-pull-request][1]



    [1]: https://github.com/peter-evans/create-pull-request

  labels: |

    report

    automated pr

  assignees: peter-evans
reviewers: peter-evans

team-reviewers: |

        owners

        maintainers

      milestone: 1
draft: false

name: Check outputs
run: |

  echo "Pull Request Number - ${{ steps.cpr.outputs.pull-request-number }}"

  echo "Pull Request URL - ${{ steps.cpr.outputs.pull-request-url }}"
An example based on the above reference configuration creates pull requests that look like this:

Pull Request Example

License
MIT
14 Get answers to your investing questions from the SEC's website dedicated to retail investors15 Get answers to your investing questions from the SEC's website dedicated to retail investors16 Get answers to your investing questions from the SEC's website dedicated to retail investors17 Get answers to your investing questions from the SEC's website dedicated to retail investors18 Get answers to your investing questions from the SEC's website dedicated to retail investors19 Get answers to your investing questions from the SEC's website dedicated to retail investors20 Get answers to your investing questions from the SEC's website dedicated to retail investors21
Your federal taxable wages this period are $
Purchase/Acquisition of Business -1010700000 -1148400000 -1286100000 -1423800000 -1561500000
TX: NO State Incorne Tax

Gain/Loss on Investments and Other Financial Instruments -2243490909 -3068572727 -3893654545 -4718736364 -5543818182 -6368900000 -7193981818 -8019063636
Income from Associates, Joint Ventures and Other Participating Interests 99054545 92609091 86163636 79718182 73272727 66827273 60381818 53936364
INCOME STATEMENT 61-1767920
GOOGL_income-statement_Quarterly_As_Originally_Reported TTM Q4 2022 Q3 2022 Q2 2022 Q1 2022 Q4 2021 Q3 2021 Q2 2021
Cash Flow from Continuing Financing Activities -9287400000 -7674400000 -6061400000 -4448400000 -2835400000
Diluted EPS from Discontinued Operations
The U.S. Internal Revenue Code of 1986, as amended, the Treasury Regulations promulgated thereunder, published pronouncements of the Internal Revenue Service, which may be cited or used as precedents, and case law, any of which may be changed at any time with retroactive effect. No opinion is expressed on any matters other than those specifically referred to above.
Basic WASO 694313546 697258864 700204182 703149500 706094818 709040136 711985455 714930773
Taxable Marital Status:
Exemptions/Allowances Single ZACHRY T.
Diluted EPS -00009 -00015 -00021 -00027 -00033 -00039 -00045 -00051
Total Work Hrs
COMPANY PH Y: 650-253-0001
5324 BRADFORD DR
ORIGINAL REPORT
Change in Trade/Accounts Receivable -1122700000 -527600000 67500000 662600000 1257700000
Purchase/Sale of Other Non-Current Assets, Net -236000000 -368800000 -501600000 -634400000
Other Non-Cash Items -5340300000 -6249200000 -7158100000 -8067000000 -8975900000
Amortization, Non-Cash Adjustment 4241600000 4848600000 5455600000 6062600000 6669600000
Income, Rents, & Royalty
Other Investing Cash Flow 49209400000 57052800000 64896200000 72739600000 80583000000
Other Irregular Income/Expenses 00000 00000 00000 00000 00000
Irregular Income/Expenses 00000 00000 00000 00000 00000
Total Revenue as Reported, Supplemental -1286309091 -13385163636 -25484018182 -37582872727 -49681727273 -61780581818 -73879436364 -85978290909
Net Investment Income -2096781818 -2909109091 -3721436364 -4533763636 -5346090909 -6158418182 -6970745455 -7783072727
Gain/Loss on Foreign Exchange 47654545 66854545 86054545 105254546 124454546 143654546 162854546 182054546
Cash Flow from Investing Activities -11015999999
Purchase/Sale of Investments, Net 574500000 1229400000 1884300000 2539200000 3194100000
Purchase/Sale of Business, Net -384999999
Basic EPS from Continuing Operations -00009 -00015 -00021 -00027 -00034 -00040 -00046 -00052

Change in Trade and Other Receivables 2617900000 3718200000 4818500000 5918800000 7019100000

Investment Income/Loss, Non-Cash Adjustment 3081700000 4150000000 5218300000 6286600000 7354900000
Stock-Based Compensation, Non-Cash Adjustment -1297700000 -2050400000 -2803100000 -3555800000 -4308500000
Depreciation and Amortization, Non-Cash Adjustment 3239500000 3241600000 3243700000 3245800000 3247900000
Taxes, Non-Cash Adjustment 4177700000 4486200000 4794700000 5103200000 5411700000
Depreciation, Non-Cash Adjustment 3329100000 3376000000 3422900000 3469800000 3516700000
Gain/Loss on Financial Instruments, Non-Cash Adjustment -4354700000 -4770800000 -5186900000 -5603000000 -6019100000
[DRAFT FORM OF TAX OPINION]
Issuance of/Repayments for Debt, Net -199000000 -356000000
Total Operating Profit/Loss -5818800000 -10077918182 -14337036364 -18596154545 -22855272727 -27114390909 -31373509091 -35632627273
Cash Flow from Continuing Investing Activities -4919700000 -3706000000 -2492300000 -1278600000 -64900000
Change in Prepayments and Deposits -388000000 -891600000 -1395200000 -1898800000
Change in Accrued Expenses -2105200000 -3202000000 -4298800000 -5395600000 -6492400000
Research and Development Expenses -2088363636 -853500000 381363636 1616227273 2851090909 4085954545 5320818182 6555681818
PLEASE READ THE IMPORTANT DISCLOSURES BELOW

FEDERAL RESERVE MASTER SUPPLIER ACCOUNT31000053-052101023COD
633-44-1725Zachryiixixiiiwood@gmail.com47-2041-654711100061431000053
PNC BankPNC Bank Business Tax I.D. Number: 633441725
CIF Department (Online Banking)Checking Account: 47-2041-6547
P7-PFSC-04-FBusiness Type: Sole Proprietorship/Partnership Corporation
500 First AvenueALPHABET
Pittsburgh, PA 15219-31285323 BRADFORD DR
NON-NEGOTIABLEDALLAS TX 75235 8313
ZACHRY, TYLER, WOOD
4/18/2022650-2530-000 469-697-4300
SIGNATURETime Zone: Eastern Central Mountain Pacific
Investment Products  • Not FDIC Insured  • No Bank Guarantee  • May Lose Value
PLEASE READ THE IMPORTANT DISCLOSURES BELOW
Change in Trade/Accounts Payable -233200000 -394000000 -554800000 -715600000 -876400000

General and Administrative Expenses -544945455 23200000 591345455 1159490909 1727636364 2295781818 2863927273 3432072727
Changes in Operating Capital 1068100000 1559600000 2051100000 2542600000 3034100000
Selling and Marketing Expenses -1007254545 -52145455 902963636 1858072727 2813181818 3768290909 4723400000 5678509091
Payments for Common Stock -18708100000 -22862000000 -27015900000 -31169800000 -35323700000
Proceeds from Issuance of Long Term Debt -3407500000 -5307600000 -7207700000 -9107800000 -11007900000
Other Income/Expense, Non-Operating 263109091 367718182 472327273 576936364 681545455 786154546 890763636 995372727
ZACHRY T WOOD
88-1303492
Statutory BASIS OF PAY: BASIC/DILUTED EPS
Net Pay 70842743867 70842743867
Other Revenue

Non-Operating Income/Expenses, Total -1369181818 -2079000000 -2788818182 -3498636364 -4208454545 -4918272727 -5628090909 -6337909091

Net Interest Income/Expense 464490909 462390909 460290909 458190909 456090909 453990909 451890909 449790909
Total Net Finance Income/Expense 464490909 462390909 460290909 458190909 456090909 453990909 451890909 449790909
Issuance of/Repayments for Long Term Debt, Net -314300000 -348200000 -382100000 -416000000 -449900000
Net Check 70842743867
Basic EPS from Discontinued Operations
MOUNTAIN VIEW, C.A., 94044 Pay Date:
Medicare Tax
Change in Other Operating Capital 1553900000 2255600000 2957300000 3659000000 4360700000
Change in Deferred Assets/Liabilities 3194700000 3626800000 4058900000 4491000000 4923100000
Change in Trade and Other Payables 3108700000 3453600000 3798500000 4143400000 4488300000
Selling, General and Administrative Expenses -1552200000 -28945455 1494309091 3017563636 4540818182 6064072727 7587327273 9110581818
Diluted WASO 698675982 701033009 703390036 705747064 708104091 710461118 712818146 715175173
1957800000 -9776581818 -21510963636 -33245345455 -44979727273 -56714109091 -68448490909 -80182872727
Total Revenue as Reported, Supplemental -1286309091 -13385163636 -25484018182 -37582872727 -49681727273 -61780581818 -73879436364 -85978290909
Diluted EPS from Continuing Operations -00009 -00015 -00021 -00027 -00033 -00039 -00045 -00051
Change in Cash 00001 -280000000 -570000000 338000000000)
Sale and Disposal of Property, Plant and Equipment -5040500000 -4683100000 -4325700000 -3968300000
Interest Income 415836364 392490909 369145455 345800000 322454546 299109091 275763636 252418182
Issuance of/Payments for Common Stock, Net -10767000000 -10026000000 -9285000000 -8544000000 -7803000000
Cost of Goods and Services -891927273 4189690909 9271309091 14352927273 19434545455 24516163636 29597781818 34679400000
Proceeds from Issuance of Common Stock -5806333333 -3360333333 -914333333
1349355888 2024033776 75698871601 Information

DALLAS TX 75235-8315
Sales of Other Non-Current Assets
Cost of Revenue -891927273 4189690909 9271309091 14352927273 19434545455 24516163636 29597781818 34679400000
Operating Income/Expenses -3640563636 -882445455 1875672727 4633790909 7391909091 10150027273 12908145455 15666263636
Fiscal year end September 28th., 2022. | USD
Cash and Cash Equivalents, Beginning of Period -13098000000 -26353000000 -4989999999
Other Adjustments to Net Income Available to Common Stockholders
Federal:
Gross Pay 75698871601 Important Notes
Cash Flow from Financing Activities -13997000000 -12740000000
EMPLOYER IDENTIFICATION NUMBER: 61-1767920
-1288666667 -885666667 -482666667
Pretax Income -7187981818 -12156918182 -17125854545 -22094790909 -27063727273 -32032663636 -37001600000 -41970536364
Reported Normalized and Operating Income/Expense Supplemental Section
Reported Normalized Operating Profit
Cash Flow Supplemental Section 181000000000) -146000000000) 110333333 123833333 137333333
Interest Expense Net of Capitalized Interest 48654545 69900000 91145455 112390909 133636364 154881818 176127273 197372727
Diluted Net Income Available to Common Stockholders -5492763636 -9591163636 -13689563636 -17787963636 -21886363636 -25984763636 -30083163636 -34181563636
Net Income Available to Common Stockholders -5492763636 -9591163636 -13689563636 -17787963636 -21886363636 -25984763636 -30083163636 -34181563636
Net Income after Non-Controlling/Minority Interests -5492763636 -9591163636 -13689563636 -17787963636 -21886363636 -25984763636 -30083163636 -34181563636
Reported Effective Tax Rate 00001 00000 00000 00000 00000 00000
Reported Normalized Diluted EPS
Basic Weighted Average Shares Outstanding 694313546 697258864 700204182 703149500 706094818 709040136 711985455 714930773
Diluted Weighted Average Shares Outstanding 698675982 701033009 703390036 705747064 708104091 710461118 712818146 715175173
Deposited to the account Of xxxxxxxx6548
Purchase of Investments 16018900000 24471400000 32923900000 41376400000 49828900000
Sale of Investments -64179300000 -79064600000 -93949900000 -108835200000 -123720500000

ALPHABET
CHECKING
31622,6:39 PM

GOOGL_income-statement_Quarterly_As_Originally_Reported Q4 2022
Morningstar.com Intraday Fundamental Portfolio View Print Report Print

Income/Loss before Non-Cash Adjustment 21353400000 21135400000 20917400000 20699400000 20481400000

Cash Generated from Operating Activities 19636600000 18560200000 17483800000 16407400000 15331000000
3/6/2022 at 6:37 PM
Net Cash Flow from Continuing Operating Activities, Indirect 35231800000 36975800000 38719800000 40463800000 42207800000
Cash and Cash Equivalents, End of Period
Proceeds from Issuance/Exercising of Stock Options/Warrants -2971300000 -3400800000 -3830300000 -4259800000 -4689300000
Cash Flow from Operating Activities, Indirect 24934000001 Q3 2022 Q2 2022 Q1 2022 Q4 2021
Diluted EPS -00009 -00015 -00021 -00027 -00033 -00039 -00045 -00051
Other Financing Cash Flow
Total Adjustments for Non-Cash Items 20351200000 21992600000 23634000000 25275400000 26916800000
Change in Other Current Assets -3290700000 -3779600000 -4268500000 -4757400000 -5246300000
Depreciation, Amortization and Depletion, Non-Cash Adjustment 4986300000 5327600000 5668900000 6010200000 6351500000
Change in Payables and Accrued Expenses -3298800000 -4719000000 -6139200000 -7559400000 -8979600000
Repayments for Long Term Debt -117000000 -660800000 -1204600000 -1748400000 -2292200000

Income Statement Supplemental Section
Reported Normalized Income
Cash and Cash Equivalents, Beginning of Period 25930000001 235000000000) 10384666667 15035166667 19685666667
Net Income after Extraordinary Items and Discontinued Operations -5492763636 -9591163636 -13689563636 -17787963636 -21886363636 -25984763636 -30083163636 -34181563636
Net Income from Continuing Operations -5492763636 -9591163636 -13689563636 -17787963636 -21886363636 -25984763636 -30083163636 -34181563636
Provision for Income Tax 1695218182 2565754545 3436290909 4306827273 5177363636 6047900000 6918436364 7788972727
Total Operating Profit/Loss as Reported, Supplemental -5818800000 -10077918182 -14337036364 -18596154545 -22855272727 -27114390909 -31373509091 -35632627273
Based on facts as set forth in. 06551
Basic EPS -00009 -00015 -00021 -00027 -00034 -00040 -00046 -00052
ALPHABET INCOME Advice number: 000101
ALPHABET
Basic EPS -00009 -00015 -00021 -00027 -00034 -00040 -00046 -00052
1601 AMPITHEATRE PARKWAY DR Period Ending:
1601 AMPIHTHEATRE PARKWAY MOUNTAIN VIEW CA 94043 Calendar Year---
Purchase/Sale and Disposal of Property, Plant and Equipment, Net -6772900000 -6485800000 -6198700000 -5911600000 -5624500000
Purchase of Property, Plant and Equipment -5218300000 -4949800000 -4681300000 -4412800000 -4144300000
Effect of Exchange Rate Changes 28459100000 29853400000 31247700000 32642000000 34036300000
00000 -15109109116 111165509049 50433933761 50951012042 45733930204 40516848368 -84621400136 -96206781973
00002 Earnings Statement

							05324
							DALLAS
rate	units					year to date	Other Benefits and
						        	Pto Balance
Federal Income Tax
Social Security Tax
YOUR BASIC/DILUTED EPS RATE HAS BEEN CHANGED FROM 0.001 TO 112.20 PAR SHARE VALUE

							Due 09/15/2022
Discontinued Operations -51298890909
Change in Cash as Reported, Supplemental
Income Tax Paid, Supplemental -5809000000 -8692000000 -11575000000 -44281654545 -2178236364

13 Months Ended 6336000001
Gross Profit -9195472727 -16212709091 -23229945455 -30247181818 -37264418182
USD in "000'"s 22809500000000 22375000000000 21940500000000 21506000000000 21071500000000
Repayments for Long Term Debt Dec. 31, 2021 Dec. 31, 2020
Costs and expenses: 22809500000000 22375000000000 21940500000000 21506000000000 21071500000000
Cost of revenues 182528 161858
Research and development 22809500000000 22375000000000 21940500000000 21506000000000 21071500000000
Sales and marketing 84733 71897
General and administrative 27574 26019
European Commission fines 17947 18465
Total costs and expenses 11053 09552
Income from operations 00001 01698
Other income (expense), net 141304 127627
Income before income taxes 00000 22375000000000 21940500000000 21506000000000 21071500000000 00000 00000
Provision for income taxes 257637118600 257637118600
Net income 22677000001 19289000001
*include interest paid, capital obligation, and underweighting 22677000001 19289000001
22677000001 19289000001
Basic net income per share of Class A and B common stock and Class C capital stock (in dollars par share)
Diluted net income per share of Class A and Class B common stock and Class C capital stock (in dollars par share)

For Paperwork Reduction Act Notice, see the seperate Instructions```
