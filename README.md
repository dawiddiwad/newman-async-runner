
# Newman Async Runner

newman async runner lets you run your postman *collections* asychnrounously (all at once) as all-against-all matrix for:<br/>

` -> collections (or specific collections' folders/items)`<br/>

` -> environments`<br/>

` -> iteration data files`<br/><br/>

  

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

Runner can be easily used with popular test frameworks like ```Mocha``` or ```Jest``` as ```runTests()``` method returns default ```newman``` results array ```[errors, summary]``` for each run.<br>
Just look at this ```Mocha``` example with ```chai```:<br>

```javascript
const runner =  require('newman-async-runner');

const 
	UAT =  {
		folders:  {
			collections:'./UAT/collections/'}
	}, 
	SIT =  {
		folders:  {
			collections:'./SIT/collections/'}
	}, 
	Regression =  {
		folders:  {
			collections:'./Regression/collections/'}
	},
	Staging =  {
		folders:  {
			collections:'./Staging/collections/'}
	}; 	 		

describe('My Application API tests', function(){
	it('passes all UAT tests', async function(){
		for (let singleRun of await new runner.NewmanRunner(UAT).runTests()){
			expect(singleRun.errors).to.be.null;
		}
	})
	it('passes all SIT tests', async function(){
		for (let singleRun of await new runner.NewmanRunner(SIT).runTests()){
			expect(singleRun.errors).to.be.null;
		}
	})
	it('passes all Regression tests', async function(){
		for (let singleRun of await new runner.NewmanRunner(Regression).runTests()){
			expect(singleRun.errors).to.be.null;
		}
	})
	it('passes all Staging tests', async function(){
		for (let singleRun of await new runner.NewmanRunner(Staging).runTests()){
			expect(singleRun.errors).to.be.null;
		}
	})			
})


```

  

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

  

# License

[MIT](https://raw.githubusercontent.com/dawiddiwad/newman-async-runner/master/LICENSE)