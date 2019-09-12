class Collection {
	constructor(address, content, name) {
		this.address = address;
		this.content = content;
		this.name = name;
		this.folders = new Array();
	}
}

class Environment {
	constructor(address, name) {
		this.address = address;
		this.name = name;
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
		}

		async setupFolders() {
			if (!this.options || !this.options.folders || !this.options.folders.collections) {
				throw Error('undefined collections path in {runnerOptions.folders} -> Please define at least that :)');
			}
			if (!this.options.folders.reports) {
				this.options.folders.reports = './reports/'
				console.log('no reports folder set, will put reports into ' + this.options.folders.reports);
			}
			for (let f in this.options.folders) {
				if (fs.existsSync(this.options.folders[f])){
					continue;
				}
				await fs.mkdirSync(this.options.folders[f], { recursive: true })
				console.log('checking folder: ' + f);
			}
		}

		async checkApiCollections(uri){
			let response; try{
				response = await request(uri);
			} catch (error){
				throw new Error('collections path: ' + uri + ' does not exist or is invalid, unable to generate newman runs.\nCause: ' + error.toString());
			}
			if (!response || (!response.collection && !response.collections)){
				throw new Error('collections path: ' + uri + ' does not exist or is invalid, unable to generate newman runs');
			}

			handleSingle = function(singleCollection){
				let collectionObject = new Collection(uri, singleCollection, singleCollection.info.name)
				for (folder of singleCollection.item){
					collectionObject.folders.push(folder.name);
				}
				return collectionObject;
			}

			if (response.collection){
				return handleSingle(response.collection);
			}
			if (response.collections){
				for (collection of response.collections){
					this.checkApiCollections('https://api.getpostman.com/collections/' + collection.uid + '?' + new URL(uri).searchParams.toString());
				}
			}
		}

		async getCollections() {
			if (!this.options || !this.options.folders || !this.options.folders.collections) {
				return [undefined];
			}
			let collectionsPath = this.options.folders.collections;
			if (!fs.existsSync(collectionsPath)){
				return [await this.checkApiCollections(collectionsPath)];
			}
			if (await fs.lstatSync(collectionsPath).isDirectory()){
				let collectionObjects = new Array();
				let colections = await fs.readdirSync(collectionsPath).filter(function (e) {
					return path.extname(e).toLowerCase() === '.json';
				});
				for (let c of colections) {
					let collection = await JSON.parse(fs.readFileSync(collectionsPath + c));
					let collectionObject = new Collection(collectionsPath + c, collection, collection.info.name);
					for (let folder of collection.item) {
						collectionObject.folders.push(folder.name);
					}
					collectionObjects.push(collectionObject);
				}
				return collectionObjects;
			} else if (await fs.lstatSync(collectionsPath).isFile()) {
				if (path.extname(collectionsPath).toLowerCase() === '.json'){
					let collection = await JSON.parse(fs.readFileSync(collectionsPath));
					let collectionObject = new Collection(collectionsPath, collection, collection.info.name);
					for (let folder of collection.item) {
						collectionObject.folders.push(folder.name);
					}
					return [collectionObject];
				}
			}
		}

		async getEnvironments() {
			if (!this.options || !this.options.folders || !this.options.folders.environments) {
				return [undefined];
			}
			let environmentsPath = this.options.folders.environments;
			if (!fs.existsSync(environmentsPath)){
				throw new Error('environments path: ' + environmentsPath + ' does not exist or is invalid, unable to generate newman runs');
			}
			if (await fs.lstatSync(environmentsPath).isDirectory()){
				let environmentObjects = new Array();
				if (this.options.folders.environments) {
					let environments = fs.readdirSync(this.options.folders.environments).filter(function (e) {
						return path.extname(e).toLowerCase() === '.json';
					});
					for (let e of environments) {
						environmentObjects.push(new Environment(this.options.folders.environments + e,
							await JSON.parse(fs.readFileSync(this.options.folders.environments + e)).name));
					}
				}
				return environmentObjects.length ? environmentObjects : [undefined];
			} else if (await fs.lstatSync(environmentsPath).isFile()){
				if (path.extname(environmentsPath).toLowerCase() === '.json'){
					let environment = await JSON.parse(fs.readFileSync(environmentsPath));
					let environmentObject = new Environment(environmentsPath, environment.name);
					return [environmentObject];
				}
			}
		}

		async getFiles() {
			if (!this.options || !this.options.folders || !this.options.folders.data) {
				return [undefined];
			}
			let dataPath = this.options.folders.data;
			if (!fs.existsSync(dataPath)){
				throw new Error('iteration data files path: ' + dataPath + ' does not exist or is invalid, unable to generate newman runs');
			}
			if (await fs.lstatSync(dataPath).isDirectory()){
				let fileObjects = new Array()
				let files = await fs.readdirSync(this.options.folders.data).filter(function (e) {
					return path.extname(e).toLowerCase() === '.json' || path.extname(e).toLowerCase() === '.csv';
				});
				for (let file of files) {
					fileObjects.push(new File(this.options.folders.data + file, file));
				}
				return fileObjects.length ? fileObjects : [undefined];
			} else if (await fs.lstatSync(dataPath).isFile()){
				if (path.extname(dataPath).toLowerCase() === '.json' || path.extname(dataPath).toLowerCase() === '.csv'){
					let file = await JSON.parse(fs.readFileSync(dataPath));
					return [new File(dataPath, path.basename(dataPath))];
				}
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

		prepareRunOptions(_collection, _environment, _folder, _data) {

			let options = this.options.newmanOptions ? JSON.parse(JSON.stringify(this.options.newmanOptions )) : 
				new Object();

			options.collection = options.collection ? options.collection :
				(_collection ? _collection.address : undefined);

			options.environment = options.environment ? options.environment :
				(_environment ? _environment.address : undefined);

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
			if (this.options.parallelFolderRuns == false && !this.options.specific_collection_items_to_run) {
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
			for (let data of await this.getFiles()) {
				for (let collection of await this.getCollections()) {
					for (let environment of await this.getEnvironments()) {
						if (this.options.parallelFolderRuns || this.options.specific_collection_items_to_run) {
							for (let folder of collection.folders) {
								this.prepareRunOptions(collection, environment, folder, data);
							}
						} else { this.prepareRunOptions(collection, environment, "all_folders", data); }
					}
				}
			}
			console.log('TOTAL ASYNC RUNS: ' + this.collectionRuns.length + '\n');
		}

		async runTests() {
			await this.setupFolders();
			await this.setupCollections();
			await async.parallel(this.collectionRuns);
			await this.anonymizeReportsPassword();
			console.log('all test runs completed');
			return this.collectionRuns.results;
		}
	}
};