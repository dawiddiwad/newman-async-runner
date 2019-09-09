

# Newman Async Runner

newman async runner lets you run your postman *collections* asychnrounously (fire runs at once) as 'all-against-all' matrix for:<br/>

` -> collections (or specific collections' folders/items)`<br/>

` -> environments`<br/>

` -> iteration data files`<br/><br/>

![diagram](https://github.com/dawiddiwad/newman-async-runner/raw/master/resources/doc/diagram.png)

  

It uses `htmlfull` reporter.<br/>

  

## Instalation

```

npm i newman-async-runner

```

  

## Usage

You need to simply instantiate ```NewmanRunner``` with ```runnerOptions``` as parameter and call ```runTests()```  <br/>

```javascript
const runner = require('newman-async-runner');

const runnerOptions = {
	parallelFolderRuns: false,                                  
	folders: {
		collections:'./collections/',                  
		environments: './environments/',            
		reports: './reports/', 
		data: './data/',                                  
		templates: './templates/'},                          
	reporter_template: 'htmlreqres.hbs',
	anonymizeFilter: /(?<=\<password:\>)(.*?)(?=\<\\password\>)/g,                     
	specific_collection_items_to_run: ['folder 1', 'folder 2']
};

new runner.NewmanRunner(runnerOptions).runTests();
```

## Integration with other tools
Runner can be easily paired with popular test frameworks like ```Mocha``` or ```Jest```.<br><br>
```runTests()``` method returns array of default ```newman``` results array [[errors, summary]](https://www.npmjs.com/package/newman#newmanruncallbackerror-object--summary-object-) for each run in matrix.<br><br>
Simple ```Mocha``` example with ```chai```:<br>

```javascript
const runner =  require('newman-async-runner');

const 
	UAT =  {
		folders:  {
            collections:'./UAT/collections/'
        }
	}, 
	SIT =  {
		folders:  {
            collections:'./SIT/collections/'
        }
	};		


describe('My Application API tests', function(){

	it('passes all UAT tests', async function(){
		for (let singleRun of await new runner.NewmanRunner(UAT).runTests()){
			expect(singleRun.error).to.be.null;
		}
    })
    
	it('passes all SIT tests', async function(){
		for (let singleRun of await new runner.NewmanRunner(SIT).runTests()){
			expect(singleRun.error).to.be.null;
		}
    })   		
})
```

  
## API
### ```runnerOptions```:

```parallelFolderRuns``` : *`optional`* will atomize each collection into separate folder runs.<br/><br/>

  

###### ```folders``` :<br/>

```-> collections``` : *`mandatory`* path to collections folder.<br/>

```-> environments``` : *`optional`* path to environments folder.<br/>

```-> reports``` : *`optional`* path to reports output folder.<br/>

```-> data``` : *`optional`* path to test run iteration data folder.<br/>

```-> templates``` : *`optional`* path to `htmlfull` templates folder.<br/><br/>

  

```reporter_template``` : *`optional`* - `htmlfull` reporter specific template filename. If not used runner will use default ```htmlfull``` template.<br/><br/>

  

```anonymizeFilter``` : *`optional`* - report file anonymize regex filter. Runner will put *** in place of matching groups. If not used runner will not anonymize reports.<br/><br/>

  

```specific_collection_items_to_run``` : *`optional`* - specific collection(s) folder or request (items) names to run. If not used runner will run all items in collection(s).<br/><br/>

### ```runnerMethods```:

```runTests()```: - asynchronously fires ```newman``` test runs matrix for each combination of ```environment```, ```collection``` and ```iteration data``` files. It ```returns``` standard newman callback array [[errors, summary]](https://www.npmjs.com/package/newman#newmanruncallbackerror-object--summary-object-) for all runs in matrix.

## Roadmap

 - online collections, environments fetching trough Postman API (wip)

  

## License

[MIT](https://raw.githubusercontent.com/dawiddiwad/newman-async-runner/master/LICENSE)
