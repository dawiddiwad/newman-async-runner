


# Newman Async Runner

newman async runner lets you run your postman *collections* asychnrounously (fire runs at once) as all-against-all matrix for:<br/>

` -> collections or their specific folders/items`<br/>

` -> environments`<br/>

` -> iteration data files`<br/><br/>

![diagram](https://github.com/dawiddiwad/newman-async-runner/raw/master/resources/doc/diagram.png)

  

It uses `htmlfull` reporter - however this can be easily override by passing custom ```newmanOptions```,  see [API](#api) 

## Instalation

```

npm i newman-async-runner

```

  

## Usage

You need to simply instantiate ```NewmanRunner``` with ```runnerOptions``` as parameter and call ```runTests()```  <br/>

```javascript
const 
	runner = require('newman-async-runner');

	runnerOptions = {
		folders: {
			collections:'./collections/',
			environments: './environments/',
			reports: './reports/', 
			data: './data/',
		},
		newmanOptions = {
			timeoutRequest: 10000
		};
	};

new runner.NewmanRunner(runnerOptions).runTests();
```

## Integration with other tools
Runner can be easily paired with popular test frameworks like ```Mocha``` or ```Jest```.<br><br>
```runTests()``` method returns array of default ```newman``` results array [[error, summary]](https://www.npmjs.com/package/newman#newmanruncallbackerror-object--summary-object-) for each run in matrix.<br><br>
Simple ```Mocha``` example with ```chai```:<br>

```javascript
const
	expect = require('chai').expect,
	runner = require('newman-async-runner').NewmanRunner;

const 
	UAT = {
		folders:  {
			collections:'./UAT/collections/'
		}
	},
	SIT = {
		folders: {
			collections:'./SIT/collections/'
		}
	};

describe('My Application API tests', function(){

	it('passes all UAT tests', async function(){
		for (let singleRun of await new runner(UAT).runTests()){
			expect(singleRun.error).to.be.null;
		}
	})

	it('passes all SIT tests', async function(){
		for (let singleRun of await new runner(SIT).runTests()){
			expect(singleRun.error).to.be.null;
		}
	})
})
```

  
## API
### ```runnerOptions```:
example of all available options:
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
	newmanOptions = {
		color: 'off',
		timeoutRequest: 10000
	};
};
```

##### ```folders``` :<br/>

```-> collections``` : *`MANDATORY`* path to collections folder.<br/>

```-> environments``` : *`optional`* path to environments folder.<br/>

```-> reports``` : *`optional`* path to reports output folder.<br/>

```-> data``` : *`optional`* path to test run iteration data folder.<br/>

```-> templates``` : *`optional`* path to `htmlfull` templates folder.<br/><br/>

  
```reporter_template``` : *`optional`* - `htmlfull` reporter specific template filename. If not used runner will use default ```htmlfull``` template.<br/><br/>

  
```anonymizeFilter``` : *`optional`* - report file anonymize regex filter. Runner will put *** in place of matching groups. If not used runner will not anonymize reports.<br/><br/>

  
```specific_collection_items_to_run``` : *`optional`* - specific collection(s) folder or request (items) names to run. If not used runner will run all items in collection(s).<br/><br/>

```parallelFolderRuns``` : *`optional`* will atomize each collection into separate folder runs.<br/><br/>

```newmanOptions```:*`optional`* this object will pass-trough any standard [nemwan.run() options](https://www.npmjs.com/package/newman#api-reference). Note however, that this may overwrite some options used by *newman-async-runner*.<br><br>
 

### ```runnerMethods```:

<br>```runTests()``` - asynchronously fires ```newman``` test runs matrix for each combination of ```environment```, ```collection``` and ```iteration data``` files. It ```returns``` standard newman [[error, summary]](https://www.npmjs.com/package/newman#newmanruncallbackerror-object--summary-object-) results array for each run in matrix.<br><br>

## Roadmap

 - online collections, environments fetching trough Postman API (wip)

  

## License

[MIT](https://raw.githubusercontent.com/dawiddiwad/newman-async-runner/master/LICENSE)
