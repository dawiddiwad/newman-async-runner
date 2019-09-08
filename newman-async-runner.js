class Collection{
	constructor(address, content, name){
		this.address = address;
		this.content = content;
		this.name = name;
		this.folders = new Array();
	}
}

class Environment{
	constructor(address, name){
		this.address = address;
		this.name = name;
	}
}

class File{
	constructor(address, name){
		this.address = address;
		this.name = name;
	}
}

module.exports = {
	path: path = require('path'),
	fs: fs = require('fs'),
	async: async = require('async'),
	newman: newman = require('newman'),

	NewmanRunner: class NewmanRunner{
		constructor(options){
			this.collectionRuns = new Array();
			this.collectionRuns.results = new Array();
			this.options = options;
		}

		async setupFolders(){
			if (!this.options || !this.options.folders || !this.options.folders.collections){
				throw Error('undefined collections path in {runnerOptions.folders} -> Please define at least that :)');
			}
			if (!this.options.folders.reports){
				this.options.folders.reports = './reports/'
				console.log('no reports folder set, will put reports into ' + this.options.folders.reports);
			}
			for (let f in this.options.folders){
				await fs.mkdirSync(this.options.folders[f], {recursive: true})
				console.log('checking folder: ' + f);
			}
		}

		async getCollections(){
			if (!this.options.folders.collections){
				return [undefined];
			}
			let collectionObjects = new Array();
			let colections = await fs.readdirSync(this.options.folders.collections).filter(function(e){
				return path.extname(e).toLowerCase() === '.json';
			});
			for (let c of colections){
				let collection = await JSON.parse(fs.readFileSync(this.options.folders.collections + c));
				let collectionObject = new Collection(this.options.folders.collections + c, collection, collection.info.name);
				for (let folder of collection.item){
					collectionObject.folders.push(folder.name);
				}
				collectionObjects.push(collectionObject);
			}
			return collectionObjects;
		}

		async getEnvironments(){
			if (!this.options.folders.environments){
				return [undefined];
			}
			let environmentObjects = new Array();
			if (this.options.folders.environments){
				let environments = fs.readdirSync(this.options.folders.environments).filter(function(e){
					return path.extname(e).toLowerCase() === '.json';
				});
				for (let e of environments){
					environmentObjects.push(new Environment(this.options.folders.environments + e,
						await JSON.parse(fs.readFileSync(this.options.folders.environments + e)).name));
				}
			}
			return environmentObjects.length ? environmentObjects : [undefined];
		}
		
		async getFiles() {
			if (!this.options.folders.data){
				return [undefined];
			}
			let fileObjects = new Array()
			let files = await fs.readdirSync(this.options.folders.data).filter(function (e) {
				return path.extname(e).toLowerCase() === '.json' || path.extname(e).toLowerCase() === '.csv';
			});
			for (let file of files){
				fileObjects.push(new File(this.options.folders.data + file, file));
			}
			return fileObjects.length ? fileObjects : [undefined];
		}

		async anonymizeReportsPassword(){
			if(!this.options.anonymizeFilter){
				return;
			}
			this.removePassword = async function(file){
				let result = await fs.readFileSync(file, 'utf8');
				let anonymizeFilter = /(?<=&lt;n1:password&gt;)(.*?)(?=&lt;\/n1:password&gt;)/g;
				if(this.options.anonymizeFilter != 'rebelia'){
					anonymizeFilter = this.options.anonymizeFilter;
				}
				result = result.replace(anonymizeFilter, '***');
					await fs.writeFileSync(file, result, 'utf8')
					console.log('anonymized report: ' + file);
				}

			try{
				let readFiles = await fs.readdirSync(this.options.folders.reports);
				readFiles.filter(function(e){
						return path.extname(e).toLowerCase() === '.html';
					})
					.forEach(file => {
						this.removePassword(this.options.folders.reports + file);
					})
			} catch {console.log('could not open reports folder, reports were not anonymized')}
		}

		prepareRunOptions(_collection, _environment, _folder, _data){
			let options = {
				collection: _collection.address,
				environment: (_environment ? _environment.address : undefined),
				folder: _folder,
				iterationData: _data ? _data.address : undefined,
				reporters: ['cli', 'htmlfull'],
				reporter : { htmlfull : {
						export : (this.options.folders.reports ? this.options.folders.reports : "")
									+ _collection.name + "-"
									+ (_environment ? _environment.name + "-" : "")
									+ _folder 
									+ (_data ? "-" + _data.name.match(/(.*)(?=\.json|.csv)/gi)[0] : "")
									+ ".html",
						template : this.options.folders.templates
									+ this.options.reporter_template
					}
				}
			};
			if (this.options.specific_collection_items_to_run && !this.options.specific_collection_items_to_run.includes(_folder)){ 
				return;
			}
			if (this.options.parallelFolderRuns == false && !this.options.specific_collection_items_to_run){
				delete options.folder;
			}
			if (!this.options.reporter_template){
				delete options.reporter.htmlfull.template;
			}
			if (!_data){
				delete options.iterationData;
			}
			if (!_environment){
				delete options.environment
			}

			var newmanAsyncRunnerSelf = this;
			this.collectionRuns.push(function (done) {
				 newman.run(options, done).on('done', function(err, summary){
					newmanAsyncRunnerSelf.collectionRuns.results.push({errors: err, summary: summary});
				 })
			});
		}

		done(params) {
			
		}

		async setupCollections(){
			for (let data of await this.getFiles()){
				for (let collection of await this.getCollections()){
					for (let environment of await this.getEnvironments()){
						if (this.options.parallelFolderRuns || this.options.specific_collection_items_to_run){
							for (let folder of collection.folders){
								this.prepareRunOptions(collection, environment, folder, data);
							}
						} else {this.prepareRunOptions(collection, environment, "all_folders", data);}
					}
				}
			}
			console.log('TOTAL ASYNC RUNS: ' + this.collectionRuns.length + '\n');
		}

		async runTests(){
			await this.setupFolders();
			await this.setupCollections();
			await async.parallel(this.collectionRuns);
			await this.anonymizeReportsPassword();
			console.log('all test runs completed');
			return this.collectionRuns.results;
		}
	}
};