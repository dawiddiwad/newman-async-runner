


# Newman Async Runner

newman async runner lets you run your local and online (API) postman *collections* asynchronously as all-against-all matrix for:<br/>

` -> collections or their specific folders/items`<br/>

` -> environments`<br/>

` -> iteration data files`<br/><br/>

![diagram](https://github.com/dawiddiwad/newman-async-runner/raw/master/resources/doc/diagram.png)

  

It uses `htmlfull` reporter - however this can be easily override by passing custom ```newmanOptions```,  see [API](#api) 

## Installation

```

npm i newman-async-runner

```

  

## Usage

You need to simply instantiate ```NewmanRunner``` with ```runnerOptions``` as parameter and call ```runTests()```  <br/>

```javascript
const runner = require('newman-async-runner');

const runnerOptions = {
		folders: {
			collections:'./collections/',
			environments: './environments/',
			reports: './reports/', 
			data: './data/',
		},
		newmanOptions: {
			timeoutRequest: 10000
		}
	};

new runner.NewmanRunner(runnerOptions).runTests();
```

## Integration with other tools
Runner can be easily paired with popular test frameworks like ```Mocha``` or ```Jest```.<br><br>
```runTests()``` method returns array of default ```newman``` results array [[error, summary]](https://www.npmjs.com/package/newman#newmanruncallbackerror-object--summary-object-) for each run in matrix.<br><br>
Simple ```Mocha``` example with ```chai```:<br>

```javascript
console.log = function(){};
const expect = require('chai').expect;
const runner = require('newman-async-runner').NewmanRunner;

const UAT = {
	folders:
		{collections:'https://api.getpostman.com/collections/?apikey=YOUR_POSTMAN_API_KEY'},
	specific_collection_items_to_run: ['test_folder_A', 'test_folder_B'],
	newmanOptions:
		{reporters: 'htmlfull'}
	};

const SIT = {
	folders:
		{collections:'https://api.getpostman.com/collections/?apikey=YOUR_POSTMAN_API_KEY'},
	specific_collection_items_to_run: ['test_folder_C', 'test_folder_D'],
	newmanOptions:
		{reporters: 'htmlfull'} 
	};

describe('My Application API tests', function(){
	this.timeout(10000)
	
	it('passes all UAT tests', async function(){
		for (const eachResult of await new runner(UAT).runTests()){
			expect(eachResult.summary.run.failures).to.be.empty;
		}
	})

	it('passes all SIT tests', async function(){
		for (const eachResult of await new runner(SIT).runTests()){
			expect(eachResult.summary.run.failures).to.be.empty;
		}
	})
})
```
...and the result should be something like:
```cli
  My Application API tests
    √ passes all UAT tests (2989ms)
    √ passes all SIT tests (2137ms)

  2 passing (5s)
```

  
## API
### ```runnerOptions```:
example of available options:
```javascript
const runnerOptions = {
	folders: {
		collections:'./collections/',
		environments: './environments/',
		reports: './reports/', 
		data: './data/',
		templates: './templates/'},

	reporter_template: 'htmlreqres.hbs',
	anonymizeFilter: /(?<=\<password:\>)(.*?)(?=\<\\password\>)/g,
	specific_collection_items_to_run: ['folder 1', 'folder 2'],
	parallelFolderRuns: false,
	
	newmanOptions: {
		color: 'off',
		timeoutRequest: 10000
	}
};
```

##### ```folders``` : *`MANDATORY`* *`object`*<br/>

```-> collections``` : *`MANDATORY`* *`string`* local path or online uri to collections folder or single file.<br/>

```-> environments``` : *`optional`* *`string`* local path or online uri to environments folder or single file.<br/>

```-> reports``` : *`optional`* *`string`* local path to reports output folder.<br/>

```-> data``` : *`optional`* *`string`* local path to test run iteration data folder or single file.<br/>

```-> templates``` : *`optional`* *`string`* local path to `htmlfull` templates folder.<br/><br/>

  
```reporter_template``` : *`optional`* *`string`* - `htmlfull` reporter specific template filename located in local options.templates folder. If not used runner will use default ```htmlfull``` template.<br/><br/>

  
```anonymizeFilter``` : *`optional`* *`js regex expression`* - report file anonymize regex filter. Runner will put *** in place of matching groups. If not used runner will not anonymize reports.<br/><br/>

  
```specific_collection_items_to_run``` : *`optional`* *`string array`* - specific collection(s) folder or item names to run from all collections or single collection located under options.collections path. If not used runner will run all folders and items in collection(s).<br/><br/>

```parallelFolderRuns``` : *`optional`* *`boolean`* will atomize each collection into separate folder and item runs. This may speed-up whole collection execution time but may also clog it if there are too many runs. It will also prodcue separate report files since these produces separate run for each item. <br/><br/>

```newmanOptions```:*`optional`* *`object`* this will pass-trough any standard [nemwan.run() options](https://www.npmjs.com/package/newman#api-reference). In case of conflict it overwrites options used by *newman-async-runner*.<br><br>
 

### ```runnerMethods```:

<br>```runTests()``` - asynchronously fires ```newman``` test runs matrix for each combination of ```environment```, ```collection``` and ```iteration data``` files. It ```returns``` standard newman [[error, summary]](https://www.npmjs.com/package/newman#newmanruncallbackerror-object--summary-object-) results array for each run in matrix.<br><br>

## Roadmap

 - fetch collection, environment and data files trough any http raw data source

  

## License

[MIT](https://raw.githubusercontent.com/dawiddiwad/newman-async-runner/master/LICENSE)
