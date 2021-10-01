class Collection {
	constructor(content) {
		this.folders = new Array();
		this.parseItems = function(content){
			for (const item of content.item){
				this.folders.push(item.name);
				if (item.item){
					this.parseItems(item)
				}	
			}
			return [...new Set(this.folders)];
		}
		this.content = content;
		this.name = content.info.name;
		this.folders = this.parseItems(this.content);
	}
}

class Environment {
	constructor(content) {
		this.content = content;
		this.name = content.name;
	}
}

class File {
	constructor(address, name) {
		this.address = address;
		this.name = name;
	}
}

module.exports = {
	request: request = require('request-promise'),
	path: path = require('path'),
	fs: fs = require('fs'),
	async: async = require('async'),
	newman: newman = require('newman'),

	NewmanRunner: class NewmanRunner {
		constructor(options) {
			this.collectionRuns = new Array();
			this.collectionRuns.results = new Array();
			this.options = options;
			this.pmCollectionsEndpoint = 'https://api.getpostman.com/collections/';
			this.pmEnvironmentsEndpoint = 'https://api.getpostman.com/environments/';
		}

		setupFolders() {
			if (!this.options || !this.options.folders || !this.options.folders.collections) {
				throw Error('undefined collections path in {runnerOptions.folders} -> Please define at least that :)');
			}
			if (!this.options.folders.reports) {
				this.options.folders.reports = './reports/'
				console.log('no reports folder set, will put reports into ' + this.options.folders.reports);
			}
		}

		async fetchViaApi(uri){
			let response; try{
				response = await request(uri, {json: true});
			} catch (error){
				throw new Error('path: ' + uri + ' does not exist or is invalid, unable to generate newman runs.\nCause: ' + error.toString());
			}
			if (response.collection){
				return [new Collection(response.collection)];
			} else if (response.collections){
				let collectionObjects = new Array();
				for (let collection of response.collections){
					collection = await this.fetchViaApi(this.pmCollectionsEndpoint + collection.uid + '?' + new URL(uri).searchParams.toString());
					collectionObjects.push(collection.pop());
				}
				return collectionObjects.length ? collectionObjects : [undefined];
			} else if (response.environment){
				return [new Environment(response.environment)];
			} else if (response.environments){
				let environmentObjects = new Array();
				for (let environment of response.environments){
					environment = await this.fetchViaApi(this.pmEnvironmentsEndpoint + environment.uid + '?' + new URL(uri).searchParams.toString());
					environmentObjects.push(environment.pop());
				}
				return environmentObjects.length ? environmentObjects : [undefined];
			} else {
				throw new Error('path: ' + uri + ' does not exist or is invalid, unable to generate newman runs.\nResponse was: ' + response.toString());
			}
		}

		async fetchViaFileSystem(filePath){
			if(await fs.lstatSync(filePath).isDirectory()){
				let files = fs.readdirSync(filePath).filter(function (e) {
					return path.extname(e).toLowerCase() === '.json';
				});
				let fileObjects = new Array();
				for (let file of files){
					file = await this.fetchViaFileSystem(filePath + file);
					fileObjects.push(file.pop());
				}
				return fileObjects.length ? fileObjects : [undefined];
			} else if (await fs.lstatSync(filePath).isFile()){
				const file = await JSON.parse(fs.readFileSync(filePath)); 
				if (file.info){
					return [new Collection(file)];
				} else if (file.name){
					return [new Environment(file)];
				} else {
					throw new Error('file: ' + file + 'is not a valid postman collection or environment');
				}

			} else {
				throw new Error('path: ' + filePath + ' does not exist or is invalid, unable to generate newman runs');
			}
		}

		async getCollections() {
			const collectionsPath = this.options.folders.collections;
			if (!this.options || !this.options.folders || !collectionsPath) {
				return [undefined];
			} else if (this.collectionsFetchedData){
				return this.collectionsFetchedData;
			} else if (!fs.existsSync(collectionsPath)){
				this.collectionsFetchedData = await this.fetchViaApi(collectionsPath);
				return this.collectionsFetchedData;
			} else {
				this.collectionsFetchedData = await this.fetchViaFileSystem(collectionsPath);
				return await this.collectionsFetchedData;
			}
		}

		async getEnvironments() {
			const environmentsPath = this.options.folders.environments;
			if (!this.options || !this.options.folders || !environmentsPath) {
				return [undefined];
			} else if (this.environmentsFetchedData){
				return this.environmentsFetchedData;
			} else if (!fs.existsSync(environmentsPath)){
				this.environmentsFetchedData = await this.fetchViaApi(environmentsPath);
				return this.environmentsFetchedData;
			} else {
				this.environmentsFetchedData = await this.fetchViaFileSystem(environmentsPath);
				return this.environmentsFetchedData;
			}
		}

		async getFiles() {
			const dataPath = this.options.folders.data;
			if (!this.options || !this.options.folders || !dataPath) {
				return [undefined];
			} else if (!fs.existsSync(dataPath)){
				throw new Error('iteration data files path: ' + dataPath + ' does not exist or is invalid, unable to generate newman runs');
			} else if (await fs.lstatSync(dataPath).isDirectory()){
				let fileObjects = new Array()
				const files = await fs.readdirSync(dataPath).filter(function (e) {
					return path.extname(e).toLowerCase() === '.json' || path.extname(e).toLowerCase() === '.csv';
				});
				for (const file of files) {
					fileObjects.push(new File(dataPath + file, file));
				}
				return fileObjects.length ? fileObjects : [undefined];
			} else if (await fs.lstatSync(dataPath).isFile()){
				if (path.extname(dataPath).toLowerCase() === '.json' || path.extname(dataPath).toLowerCase() === '.csv'){
					return [new File(dataPath, path.basename(dataPath))];
				}
			} else {
				throw new Error('no data files found for path: ' + dataPath);
			}
		}

		getExtraIterations() {
			if (!this.options || !this.options.extra_iterations){
				return [undefined];
			} else if (Array.isArray(this.options.extra_iterations)){
					return this.options.extra_iterations;
			} else {
				throw new Error(`options.extra_iterations: \n ${this.options.extra_iterations} \n...is not an array - please see documentation on using these options`);
			}
		}

		async anonymizeReportsPassword() {
			if (!this.options.anonymizeFilter) {
				return;
			}
			this.removePassword = async function (file) {
				let result = await fs.readFileSync(file, 'utf8');
				let anonymizeFilter = /(?<=&lt;n1:password&gt;)(.*?)(?=&lt;\/n1:password&gt;)/g;
				if (this.options.anonymizeFilter != 'rebelia') {
					anonymizeFilter = this.options.anonymizeFilter;
				}
				result = result.replace(anonymizeFilter, '***');
				await fs.writeFileSync(file, result, 'utf8')
				console.log('anonymized report: ' + file);
			}

			try {
				let readFiles = await fs.readdirSync(this.options.folders.reports);
				readFiles.filter(function (e) {
					return path.extname(e).toLowerCase() === '.html';
				})
					.forEach(file => {
						this.removePassword(this.options.folders.reports + file);
					})
			} catch (e) { throw new Error('could not open reports folder, reports were not anonymized, error occured: ' + e) }
		}

		prepareRunOptions(_collection, _environment, _folder, _data, _extraIteration) {

			let options = this.options.newmanOptions ? JSON.parse(JSON.stringify(this.options.newmanOptions )) : 
				new Object();

			if (_environment && _extraIteration) {
				if(Object.keys(_extraIteration).length > 0 && !_environment.content.values){
					_environment.content.values = [];
				}
				let newmanEnvVariables = [];
				for (const property in _extraIteration.variables) {
					newmanEnvVariables.push({
						"key" : property,
						"value" : _extraIteration.variables[property],
						"enabled" : true
					});
				}
				newmanEnvVariables.forEach(element => {
					_environment.content.values.push(element);
				});
				_environment.content.values.forEach((element, index, array) => {
					for (const variable in newmanEnvVariables){
						if (variable.key === element.key){
							array[index] = variable;
						}
					}
				});
			}

			options.collection = options.collection ? options.collection :
				(_collection ? _collection.content : undefined);

			options.environment = options.environment ? options.environment :
				(_environment ? _environment.content : undefined);

			options.folder = options.folder ? options.folder :
				(_folder ? _folder : undefined);

			options.iterationData = options.iterationData ? options.iterationData :
				(_data ? _data.address : undefined);

			options.reporters = options.reporters ? options.reporters :
				['cli', 'htmlfull'];

			options.reporter = options.reporter ? options.reporter :
				{
					htmlfull: {
						export: (this.options.folders.reports ? this.options.folders.reports : "")
							+ (_extraIteration ? (_extraIteration.name + "-") : "")
							+ (_collection ? _collection.name + "-" : "no_collection")
							+ (_environment ? _environment.name + "-" : "")
							+ _folder
							+ (_data ? "-" + _data.name.match(/(.*)(?=\.json|.csv)/gi)[0] : "")
							+ ".html",
						template: this.options.folders.templates
							+ this.options.reporter_template
					}
				};

			if (!options.collection) {
				throw Error('undefined collection for newman run options' + (options ? ": " + JSON.stringify(options) : ""));
			}
			if (this.options.specific_collection_items_to_run && !this.options.specific_collection_items_to_run.includes(options.folder)) {
				return;
			}
			if (!this.options.parallelFolderRuns && !this.options.specific_collection_items_to_run) {
				delete options.folder;
			}
			if (!this.options.reporter_template) {
				delete options.reporter.htmlfull.template;
			}
			if (!options.iterationData) {
				delete options.iterationData;
			}
			if (!options.environment) {
				delete options.environment
			}

			var newmanAsyncRunnerSelf = this;
			this.collectionRuns.push(function (done) {
				newman.run(options, done).on('done', function (error, summary) {
					newmanAsyncRunnerSelf.collectionRuns.results.push({ error: error, summary: summary });
				})
			});
		}

		async setupCollections() {
			for (let ExtraIteration of this.getExtraIterations()){
				for (let data of await this.getFiles()) {
					for (let collection of await this.getCollections()) {
						for (let environment of await this.getEnvironments()) {
							if (this.options.parallelFolderRuns || this.options.specific_collection_items_to_run) {
								for (let folder of collection.folders) {
									this.prepareRunOptions(collection, environment, folder, data, ExtraIteration);
								}
							} else { this.prepareRunOptions(collection, environment, "all_folders", data, ExtraIteration); }
						}
					}
				}
			}
			console.log('TOTAL ASYNC RUNS: ' + this.collectionRuns.length + '\n');
		}

		async runTests() {
			this.setupFolders();
			await this.setupCollections();
			await async.parallel(this.collectionRuns);
			await this.anonymizeReportsPassword();
			console.log('all test runs completed');
			return this.collectionRuns.results;
		}
	}
};